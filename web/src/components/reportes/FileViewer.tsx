import React, { useState, useEffect } from 'react';
import { X, Download, AlertCircle, Loader2 } from 'lucide-react';
import '../../styles/file-viewer.css';

interface ArchivoDTO {
  archivoId: string;
  tipoArchivo: string;
  nombreOriginal: string;
  tamanoBytes: number;
  mimeType: string;
  subidoPorNombre?: string;
  subidoPor?: string;
  subidoPorEmail?: string;
  subidoEn: string;
  urlPublica?: string | null;
}

interface FileViewerProps {
  archivo: ArchivoDTO;
  periodoId: string;
  onClose: () => void;
}

const FileViewer: React.FC<FileViewerProps> = ({ archivo, periodoId, onClose }) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarArchivo();
  }, [archivo.archivoId]);

  const cargarArchivo = async () => {
    try {
      setLoading(true);
      setError(null);

      // Si tiene URL pública, usarla directamente
      if (archivo.urlPublica) {
        setFileUrl(archivo.urlPublica);
        setLoading(false);
        return;
      }

      // Sino, obtener URL temporal
      const token = localStorage.getItem('token');
      
      // Si no hay periodoId, usar endpoint de evidencias directamente
      const endpoint = periodoId 
        ? `http://localhost:8080/api/periodos/${periodoId}/archivos/${archivo.archivoId}/url`
        : `http://localhost:8080/api/evidencias/${archivo.archivoId}/url`;
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener URL del archivo');
      }

      const data = await response.json();
      setFileUrl(data.data.url);
      setLoading(false);

    } catch (err) {
      console.error('Error al cargar archivo:', err);
      setError('No se pudo cargar el archivo');
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (fileUrl) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = archivo.nombreOriginal;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div 
      className="file-viewer-overlay"
      onClick={onClose}
    >
      <div 
        className="file-viewer-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="file-viewer-header">
          <div className="file-viewer-title-section">
            <h3 className="file-viewer-title">
              {archivo.nombreOriginal}
            </h3>
            <div className="file-viewer-metadata">
              <span>{formatSize(archivo.tamanoBytes)}</span>
              <span>•</span>
              <span>{archivo.tipoArchivo}</span>
              <span>•</span>
              <span>Subido: {formatDate(archivo.subidoEn)}</span>
            </div>
          </div>

          <div className="file-viewer-actions">
            <button
              onClick={handleDownload}
              disabled={!fileUrl}
              className="file-viewer-btn file-viewer-btn-download"
              title="Descargar"
            >
              <Download />
            </button>
            <button
              onClick={onClose}
              className="file-viewer-btn file-viewer-btn-close"
              title="Cerrar"
            >
              <X />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="file-viewer-content">
          {loading && (
            <div className="file-viewer-loading">
              <Loader2 className="file-viewer-spinner" />
              <p>Cargando archivo...</p>
            </div>
          )}

          {error && (
            <div className="file-viewer-error">
              <AlertCircle className="file-viewer-error-icon" />
              <p>{error}</p>
              <button
                onClick={cargarArchivo}
                className="file-viewer-retry-btn"
              >
                Reintentar
              </button>
            </div>
          )}

          {!loading && !error && fileUrl && (
            <>
              {/* Visor de imágenes */}
              {archivo.mimeType.startsWith('image/') && (
                <img 
                  src={fileUrl} 
                  alt={archivo.nombreOriginal}
                  className="file-viewer-image"
                />
              )}

              {/* Visor de PDFs */}
              {archivo.mimeType === 'application/pdf' && (
                <iframe
                  src={fileUrl}
                  title={archivo.nombreOriginal}
                  className="file-viewer-iframe"
                />
              )}
            </>
          )}
        </div>

        {/* Footer con metadata */}
        <div className="file-viewer-footer">
          <p className="file-viewer-footer-text">
            <span className="label">Subido por:</span> {archivo.subidoPorNombre || archivo.subidoPor || 'Desconocido'} 
            {archivo.subidoPorEmail && ` (${archivo.subidoPorEmail})`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FileViewer;
