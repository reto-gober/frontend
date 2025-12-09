import { useState } from "react";
import type { ArchivoDTO } from "../../lib/services";

interface FilesListProps {
  archivos: ArchivoDTO[];
  periodoId: string;
  canDelete?: boolean;
  onRefresh?: () => void;
}

export default function FilesList({
  archivos,
  periodoId,
  canDelete = false,
  onRefresh,
}: FilesListProps) {
  const [viewingFile, setViewingFile] = useState<ArchivoDTO | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isVisualizable = (mimeType: string): boolean => {
    return (
      mimeType.startsWith("image/") ||
      mimeType === "application/pdf" ||
      mimeType.startsWith("video/")
    );
  };

  const handleViewFile = async (archivo: ArchivoDTO) => {
    if (!isVisualizable(archivo.mimeType)) {
      handleDownload(archivo);
      return;
    }

    try {
      setLoading(archivo.archivoId);

      // Si ya tiene URL p\u00fablica, usarla directamente
      if (archivo.urlPublica) {
        setViewingFile(archivo);
        return;
      }

      // Solicitar URL firmada
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8080/api/periodos/${periodoId}/archivos/${archivo.archivoId}/url`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setViewingFile({
          ...archivo,
          urlPublica: data.data?.url || data.url,
        });
      } else {
        throw new Error("No se pudo obtener la URL del archivo");
      }
    } catch (err) {
      console.error("[FilesList] Error obteniendo URL:", err);
      alert("No se pudo visualizar el archivo");
    } finally {
      setLoading(null);
    }
  };

  const handleDownload = async (archivo: ArchivoDTO) => {
    try {
      setLoading(archivo.archivoId);

      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8080/api/evidencias/${archivo.archivoId}/descargar`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Error al descargar");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = archivo.nombreOriginal;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[FilesList] Error descargando:", err);
      alert("No se pudo descargar el archivo");
    } finally {
      setLoading(null);
    }
  };

  if (archivos.length === 0) {
    return (
      <div className="files-list-empty">
        <svg viewBox="0 0 24 24" width="48" height="48">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
        </svg>
        <p>No hay archivos adjuntos</p>
        <span>Los archivos aparecer\u00e1n aqu\u00ed cuando se suban</span>

        <style>{`
          .files-list-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            padding: 3rem 1rem;
            background: white;
            border: 1px dashed var(--neutral-300);
            border-radius: 12px;
            text-align: center;
          }

          .files-list-empty svg {
            stroke: var(--neutral-400);
            fill: none;
            stroke-width: 2;
          }

          .files-list-empty p {
            margin: 0;
            font-weight: 600;
            color: var(--neutral-700);
            font-size: 1rem;
          }

          .files-list-empty span {
            margin: 0;
            color: var(--neutral-500);
            font-size: 0.875rem;
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <div className="files-list-container">
        <div className="files-list-header">
          <h3>Archivos Adjuntos</h3>
          <span className="files-count">{archivos.length}</span>
        </div>

        <div className="files-grid">
          {archivos.map((archivo) => (
            <div key={archivo.archivoId} className="file-card">
              <div className="file-card-icon">
                {archivo.mimeType.startsWith("image/") ? (
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                ) : archivo.mimeType === "application/pdf" ? (
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                    <path d="M10 12h4" />
                    <path d="M10 16h4" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                  </svg>
                )}
              </div>

              <div className="file-card-info">
                <h4 className="file-card-name" title={archivo.nombreOriginal}>
                  {archivo.nombreOriginal}
                </h4>
                <div className="file-card-meta">
                  <span>{formatFileSize(archivo.tamanoBytes)}</span>
                  <span>\u2022</span>
                  <span className="file-card-type">{archivo.tipoArchivo}</span>
                </div>
                <div className="file-card-uploader">
                  <span>Subido por {archivo.subidoPor}</span>
                  <span>{formatDate(archivo.subidoEn)}</span>
                </div>
              </div>

              <div className="file-card-actions">
                <button
                  type="button"
                  onClick={() => handleViewFile(archivo)}
                  disabled={loading === archivo.archivoId}
                  className="btn-action btn-view"
                  aria-label={`Ver ${archivo.nombreOriginal}`}
                >
                  {loading === archivo.archivoId ? (
                    <div className="spinner-small" />
                  ) : isVisualizable(archivo.mimeType) ? (
                    <svg viewBox="0 0 24 24" width="18" height="18">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="18" height="18">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleDownload(archivo)}
                  disabled={loading === archivo.archivoId}
                  className="btn-action btn-download"
                  aria-label={`Descargar ${archivo.nombreOriginal}`}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {viewingFile && (
        <div className="file-viewer-modal" onClick={() => setViewingFile(null)}>
          <div className="file-viewer-content" onClick={(e) => e.stopPropagation()}>
            <div className="file-viewer-header">
              <h3>{viewingFile.nombreOriginal}</h3>
              <button
                onClick={() => setViewingFile(null)}
                className="btn-close"
                aria-label="Cerrar vista previa"
              >
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="file-viewer-body">
              {viewingFile.mimeType === "application/pdf" ? (
                <iframe src={viewingFile.urlPublica || undefined} title={viewingFile.nombreOriginal} />
              ) : viewingFile.mimeType.startsWith("image/") ? (
                <img src={viewingFile.urlPublica || undefined} alt={viewingFile.nombreOriginal} />
              ) : (
                <p>Vista previa no disponible para este tipo de archivo</p>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .files-list-container {
          background: white;
          border: 1px solid var(--neutral-200);
          border-radius: 12px;
          padding: 1.25rem;
        }

        .files-list-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .files-list-header h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: var(--neutral-900);
        }

        .files-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 24px;
          height: 24px;
          padding: 0 0.5rem;
          border-radius: 999px;
          background: var(--role-accent-light, var(--neutral-100));
          color: var(--role-accent, var(--neutral-700));
          font-size: 0.75rem;
          font-weight: 700;
        }

        .files-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
        }

        .file-card {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 1rem;
          border: 1px solid var(--neutral-200);
          border-radius: 10px;
          background: var(--neutral-50);
          transition: all 0.2s ease;
        }

        .file-card:hover {
          border-color: var(--role-accent);
          background: white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }

        .file-card-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 10px;
          background: white;
          border: 1px solid var(--neutral-200);
        }

        .file-card-icon svg {
          stroke: var(--role-accent, var(--neutral-600));
          fill: none;
          stroke-width: 2;
        }

        .file-card-info {
          flex: 1;
          min-width: 0;
        }

        .file-card-name {
          margin: 0 0 0.5rem 0;
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--neutral-900);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .file-card-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: var(--neutral-600);
          margin-bottom: 0.5rem;
        }

        .file-card-type {
          text-transform: uppercase;
          font-weight: 600;
          color: var(--role-accent);
        }

        .file-card-uploader {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: var(--neutral-500);
        }

        .file-card-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-action {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 36px;
          border: 1px solid var(--neutral-300);
          border-radius: 6px;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-action svg {
          stroke: var(--neutral-600);
          fill: none;
          stroke-width: 2;
        }

        .btn-action:hover:not(:disabled) {
          border-color: var(--role-accent);
          background: var(--role-accent-light, var(--neutral-50));
        }

        .btn-action:hover:not(:disabled) svg {
          stroke: var(--role-accent);
        }

        .btn-action:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .spinner-small {
          width: 18px;
          height: 18px;
          border: 2px solid var(--neutral-200);
          border-top-color: var(--role-accent);
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .file-viewer-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .file-viewer-content {
          background: white;
          border-radius: 12px;
          width: 100%;
          max-width: 1000px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .file-viewer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--neutral-200);
        }

        .file-viewer-header h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: var(--neutral-900);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .btn-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 6px;
          background: transparent;
          cursor: pointer;
          flex-shrink: 0;
        }

        .btn-close svg {
          stroke: var(--neutral-600);
          stroke-width: 2;
        }

        .btn-close:hover {
          background: var(--neutral-100);
        }

        .file-viewer-body {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          overflow: auto;
        }

        .file-viewer-body iframe {
          width: 100%;
          height: 100%;
          border: none;
          min-height: 600px;
        }

        .file-viewer-body img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        @media (max-width: 768px) {
          .files-grid {
            grid-template-columns: 1fr;
          }

          .file-viewer-body iframe {
            min-height: 400px;
          }
        }
      `}</style>
    </>
  );
}
