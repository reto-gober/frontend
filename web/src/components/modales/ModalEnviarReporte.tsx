import { useState, useEffect, useRef } from "react";
import {
  flujoReportesService,
  evidenciasService,
  type EnviarReporteRequest,
} from "../../lib/services";
import { ModalPortal } from "../common/ModalPortal";

interface ModalEnviarReporteProps {
  periodoId: string;
  reporteNombre: string;
  periodoInicio?: string;
  periodoFin?: string;
  frecuencia?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
  esCorreccion?: boolean;
}

export function ModalEnviarReporte({
  periodoId,
  reporteNombre,
  periodoInicio,
  periodoFin,
  frecuencia,
  isOpen,
  onClose,
  onSuccess,
  onError,
  esCorreccion = false,
}: ModalEnviarReporteProps) {
  const [comentarios, setComentarios] = useState("");
  const [archivoReporte, setArchivoReporte] = useState<File | null>(null);
  const [archivoEvidencia, setArchivoEvidencia] = useState<File | null>(null);
  const [errorReporte, setErrorReporte] = useState<string | null>(null);
  const [errorEvidencia, setErrorEvidencia] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mostrarExito, setMostrarExito] = useState(false);
  const headerRef = useRef<HTMLHeadingElement | null>(null);

  const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

  // Tipos permitidos para archivo del reporte (documentos PDF)
  const REPORTE_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  // Tipos permitidos para evidencias (imágenes y PDF)
  const EVIDENCIA_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
  ];

  useEffect(() => {
    // Limpiar el estado al abrir/cerrar
    if (isOpen) {
      setComentarios("");
      setArchivoReporte(null);
      setArchivoEvidencia(null);
      setErrorReporte(null);
      setErrorEvidencia(null);
      setMostrarExito(false);
      // Mover foco al encabezado del modal para accesibilidad
      setTimeout(() => headerRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Manejar tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !enviando) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, enviando, onClose]);

  if (!isOpen) return null;

  const validarArchivoReporte = (file: File): string | null => {
    if (!REPORTE_TYPES.includes(file.type)) {
      return "Formato no permitido. Usa PDF, Word o DOCX";
    }
    if (file.size > MAX_SIZE_BYTES) {
      return "El archivo supera el límite de 10MB";
    }
    return null;
  };

  const validarArchivoEvidencia = (file: File): string | null => {
    if (!EVIDENCIA_TYPES.includes(file.type)) {
      return "Formato no permitido. Usa imágenes (JPG, PNG) o PDF";
    }
    if (file.size > MAX_SIZE_BYTES) {
      return "El archivo supera el límite de 10MB";
    }
    return null;
  };

  const handleReporteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const error = validarArchivoReporte(file);
      setErrorReporte(error);
      if (!error) {
        setArchivoReporte(file);
      } else {
        setArchivoReporte(null);
      }
    }
  };

  const handleEvidenciaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const error = validarArchivoEvidencia(file);
      setErrorEvidencia(error);
      if (!error) {
        setArchivoEvidencia(file);
      } else {
        setArchivoEvidencia(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);

    // Validar que ambos archivos estén presentes
    if (!archivoReporte) {
      setErrorReporte("Debes adjuntar el archivo del reporte");
      setEnviando(false);
      return;
    }

    if (!archivoEvidencia) {
      setErrorEvidencia("Debes adjuntar un archivo de evidencia");
      setEnviando(false);
      return;
    }

    try {
      // Subir ambos archivos obligatorios
      setUploading(true);

      // Subir archivo del reporte
      const reporteResult = await evidenciasService.subirPorPeriodo(
        periodoId,
        archivoReporte
      );

      // Subir archivo de evidencia
      const evidenciaResult = await evidenciasService.subirPorPeriodo(
        periodoId,
        archivoEvidencia
      );

      const evidenciasIds = [reporteResult.id, evidenciaResult.id];
      setUploading(false);

      const request: EnviarReporteRequest = {
        periodoId,
        comentarios: comentarios.trim() || undefined,
        evidenciasIds: evidenciasIds.length > 0 ? evidenciasIds : undefined,
      };

      if (esCorreccion) {
        await flujoReportesService.corregirReenviar(request);
      } else {
        await flujoReportesService.enviar(request);
      }

      // Mostrar mensaje de éxito
      setMostrarExito(true);
      // Esperar 2 segundos antes de cerrar
      setTimeout(() => {
        setMostrarExito(false);
        onSuccess();
        onClose();
        setComentarios("");
        setArchivoReporte(null);
        setArchivoEvidencia(null);
        setErrorReporte(null);
        setErrorEvidencia(null);
      }, 2000);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Error al enviar el reporte";
      onError(msg);
    } finally {
      setEnviando(false);
      setUploading(false);
    }
  };

  return (
    <ModalPortal>
      <div className="modal-overlay">
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal de éxito */}
        {mostrarExito && (
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "white",
              borderRadius: "16px",
              padding: "2rem",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              zIndex: 3000,
              textAlign: "center",
              minWidth: "320px",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                margin: "0 auto 1rem",
                borderRadius: "50%",
                background: "#dcfce7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#16a34a"
                strokeWidth="3"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h3
              style={{
                margin: 0,
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              Éxito
            </h3>
            <p style={{ margin: "0.5rem 0 0", color: "#475569" }}>
              Reporte enviado exitosamente
            </p>
          </div>
        )}

        <div className="modal-header">
          <div>
            <p className="modal-overline">Intervención manual</p>
            <h2 className="modal-title" tabIndex={-1} ref={headerRef}>
              {esCorreccion ? "Corregir y Reenviar Reporte" : "Enviar Reporte"}
            </h2>
            <p className="modal-subtitle">{reporteNombre}</p>
            {(periodoInicio || periodoFin || frecuencia) && (
              <div className="modal-chip-row">
                {frecuencia && <span className="chip info">{frecuencia}</span>}
                {(periodoInicio || periodoFin) && (
                  <span className="chip muted">
                    {periodoInicio
                      ? new Date(periodoInicio).toLocaleDateString("es-CO")
                      : ""}{" "}
                    →{" "}
                    {periodoFin
                      ? new Date(periodoFin).toLocaleDateString("es-CO")
                      : ""}
                  </span>
                )}
              </div>
            )}
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Cerrar">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Comentarios */}
          <section className="modal-section">
            <div className="section-header">
              <div>
                <p className="section-overline">Comentarios</p>
                <h3 className="section-title">Observaciones del envío</h3>
              </div>
              <span className="char-counter">{comentarios.length}/500</span>
            </div>
            <textarea
              id="comentarios"
              className="form-textarea-modern"
              maxLength={500}
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              rows={4}
              placeholder={
                esCorreccion
                  ? "Describe las correcciones realizadas..."
                  : "Agrega comentarios sobre el reporte (opcional)..."
              }
              required={esCorreccion}
            />
          </section>

          {/* Archivos obligatorios */}
          <section className="modal-section">
            <div className="section-header">
              <div>
                <p className="section-overline">Archivos obligatorios</p>
                <h3 className="section-title">
                  Documentos requeridos para el envío
                </h3>
              </div>
              <span className="helper-text">
                Ambos archivos son obligatorios • Máx 10MB cada uno
              </span>
            </div>

            <div className="upload-grid">
              {/* 1. Archivo del Reporte (Obligatorio) */}
              <div className={`upload-card ${errorReporte ? "has-error" : ""}`}>
                <div className="upload-header">
                  <div>
                    <p className="upload-label">
                      1. Archivo del Reporte <span className="required">*</span>
                    </p>
                    <p className="upload-sub">PDF, Word o DOCX</p>
                  </div>
                  {archivoReporte && (
                    <span className="chip success">✓ Cargado</span>
                  )}
                </div>
                <label className="upload-drop" htmlFor="reporte-file">
                  <div className="upload-icon-circle">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <div>
                    <p className="upload-title">Seleccionar documento</p>
                    <p className="upload-hint">
                      Documento principal del reporte
                    </p>
                  </div>
                </label>
                <input
                  id="reporte-file"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  style={{ display: "none" }}
                  onChange={handleReporteChange}
                  required
                />
                {archivoReporte && (
                  <div className="file-row">
                    <div className="file-main">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <div className="file-text">
                        <span className="file-name">{archivoReporte.name}</span>
                        <span className="file-meta">
                          {(archivoReporte.size / 1024).toFixed(0)} KB
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="icon-button danger"
                      onClick={() => {
                        setArchivoReporte(null);
                        setErrorReporte(null);
                      }}
                      aria-label="Eliminar"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                )}
                {errorReporte && <p className="error-text">{errorReporte}</p>}
              </div>

              {/* 2. Archivo de Evidencia (Obligatorio) */}
              <div
                className={`upload-card ${errorEvidencia ? "has-error" : ""}`}
              >
                <div className="upload-header">
                  <div>
                    <p className="upload-label">
                      2. Archivo de Evidencia{" "}
                      <span className="required">*</span>
                    </p>
                    <p className="upload-sub">Imagen (JPG, PNG) o PDF</p>
                  </div>
                  {archivoEvidencia && (
                    <span className="chip success">✓ Cargado</span>
                  )}
                </div>
                <label className="upload-drop" htmlFor="evidencia-file">
                  <div className="upload-icon-circle">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                  <div>
                    <p className="upload-title">Seleccionar evidencia</p>
                    <p className="upload-hint">
                      Soporte fotográfico o documental
                    </p>
                  </div>
                </label>
                <input
                  id="evidencia-file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  style={{ display: "none" }}
                  onChange={handleEvidenciaChange}
                  required
                />
                {archivoEvidencia && (
                  <div className="file-row">
                    <div className="file-main">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect
                          x="3"
                          y="3"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                        />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <div className="file-text">
                        <span className="file-name">
                          {archivoEvidencia.name}
                        </span>
                        <span className="file-meta">
                          {(archivoEvidencia.size / 1024).toFixed(0)} KB
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="icon-button danger"
                      onClick={() => {
                        setArchivoEvidencia(null);
                        setErrorEvidencia(null);
                      }}
                      aria-label="Eliminar"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                )}
                {errorEvidencia && (
                  <p className="error-text">{errorEvidencia}</p>
                )}
              </div>
            </div>
          </section>

          {/* Acciones */}
          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={enviando || uploading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={
                enviando ||
                uploading ||
                !!errorReporte ||
                !!errorEvidencia ||
                !archivoReporte ||
                !archivoEvidencia ||
                (esCorreccion && !comentarios.trim())
              }
            >
              {uploading
                ? "Subiendo archivos..."
                : enviando
                  ? "Enviando reporte..."
                  : esCorreccion
                    ? "Reenviar Reporte"
                    : "Enviar Reporte"}
            </button>
          </div>
        </form>

        <style>{`
          .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.55); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 1rem; }
          .modal-card { background: #fff; border-radius: 16px; width: min(720px, 100%); max-height: 90vh; overflow-y: auto; padding: 1.5rem; box-shadow: 0 20px 60px rgba(15,23,42,0.25); display: flex; flex-direction: column; gap: 1rem; }
          .modal-header { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
          .modal-overline { text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; font-size: 0.75rem; margin: 0 0 0.1rem 0; }
          .modal-title { margin: 0; font-size: 1.5rem; font-weight: 800; color: #0f172a; }
          .modal-subtitle { margin: 0.15rem 0 0; color: #475569; font-weight: 600; }
          .modal-chip-row { display: flex; gap: 0.5rem; margin-top: 0.5rem; flex-wrap: wrap; }
          .chip { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.65rem; border-radius: 999px; font-weight: 700; font-size: 0.82rem; border: 1px solid #e2e8f0; color: #334155; background: #f8fafc; }
          .chip.info { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
          .chip.muted { background: #f1f5f9; color: #475569; border-color: #e2e8f0; }
          .chip.success { background: #ecfdf3; color: #15803d; border-color: #bbf7d0; }
          .modal-body { display: flex; flex-direction: column; gap: 1rem; }
          .modal-section { border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; background: #f8fafc; }
          .section-header { display: flex; justify-content: space-between; gap: 0.5rem; align-items: center; }
          .section-overline { margin: 0; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; font-size: 0.75rem; }
          .section-title { margin: 0.1rem 0 0; font-size: 1rem; color: #0f172a; font-weight: 800; }
          .helper-text { color: #64748b; font-size: 0.85rem; }
          .char-counter { color: #94a3b8; font-weight: 700; font-size: 0.85rem; }
          .form-textarea-modern { width: 100%; border: 1px solid #dbeafe; border-radius: 12px; padding: 0.85rem; font-size: 0.95rem; background: #fff; min-height: 110px; outline: none; transition: border 0.2s, box-shadow 0.2s; }
          .form-textarea-modern:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
          .upload-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 0.75rem; }
          .upload-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0.9rem; display: flex; flex-direction: column; gap: 0.6rem; }
          .upload-card.has-error { border-color: #fecdd3; background: #fff1f2; }
          .upload-header { display: flex; justify-content: space-between; gap: 0.5rem; align-items: center; }
          .upload-label { margin: 0; font-weight: 800; color: #0f172a; }
          .upload-sub { margin: 0; color: #64748b; font-size: 0.9rem; }
          .required { color: #dc2626; }
          .upload-drop { border: 1px dashed #cbd5e1; border-radius: 12px; padding: 0.85rem; display: flex; gap: 0.75rem; align-items: center; background: #f8fafc; cursor: pointer; transition: border 0.2s, background 0.2s; }
          .upload-drop:hover { border-color: #6366f1; background: #eef2ff; }
          .upload-icon-circle { width: 44px; height: 44px; border-radius: 12px; background: #eef2ff; display: grid; place-items: center; color: #4338ca; }
          .upload-title { margin: 0; font-weight: 700; color: #0f172a; }
          .upload-hint { margin: 0; color: #64748b; font-size: 0.9rem; }
          .file-list { display: flex; flex-direction: column; gap: 0.5rem; }
          .file-row { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; padding: 0.55rem; border: 1px solid #e2e8f0; border-radius: 10px; background: #f8fafc; }
          .file-main { display: flex; align-items: center; gap: 0.5rem; min-width: 0; }
          .file-text { display: flex; flex-direction: column; }
          .file-name { font-weight: 700; color: #0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 220px; }
          .file-meta { color: #94a3b8; font-size: 0.85rem; }
          .icon-button { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.35rem; cursor: pointer; color: #475569; }
          .icon-button:hover { background: #e2e8f0; }
          .icon-button.danger { color: #b91c1c; border-color: #fecdd3; background: #fff5f5; }
          .modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #e2e8f0; }
          .btn-primary { background: #4338ca; color: #fff; border: none; padding: 0.75rem 1.2rem; border-radius: 10px; font-weight: 700; cursor: pointer; }
          .btn-primary:disabled { background: #cbd5e1; cursor: not-allowed; }
          .btn-secondary { background: #f8fafc; color: #0f172a; border: 1px solid #e2e8f0; padding: 0.75rem 1.1rem; border-radius: 10px; font-weight: 700; cursor: pointer; }
          .btn-secondary:hover { background: #eef2ff; }
          .error-text { color: #b91c1c; margin: 0; font-weight: 700; font-size: 0.9rem; }
        `}</style>
      </div>
    </div>
    </ModalPortal>
  );
}
