import { useState, useEffect } from "react";
import {
  flujoReportesService,
  evidenciasService,
  type EnviarReporteRequest,
} from "../../lib/services";

interface ModalEnviarReporteProps {
  periodoId: string;
  reporteNombre: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
  esCorreccion?: boolean;
}

export function ModalEnviarReporte({
  periodoId,
  reporteNombre,
  isOpen,
  onClose,
  onSuccess,
  onError,
  esCorreccion = false,
}: ModalEnviarReporteProps) {
  const [comentarios, setComentarios] = useState("");
  const [archivos, setArchivos] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    // Limpiar el estado al abrir/cerrar
    if (isOpen) {
      setComentarios("");
      setArchivos([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setArchivos(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);

    try {
      // Subir archivos primero usando periodoId directamente
      let evidenciasIds: string[] = [];

      if (archivos.length > 0) {
        setUploading(true);
        const uploadPromises = archivos.map(async (archivo) => {
          const response = await evidenciasService.subirPorPeriodo(periodoId, archivo);
          return response.id;
        });

        evidenciasIds = await Promise.all(uploadPromises);
        setUploading(false);
      }

      // Enviar reporte
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

      onSuccess();
      onClose();
      setComentarios("");
      setArchivos([]);
    } catch (err: any) {
      onError(err.response?.data?.message || "Error al enviar el reporte");
    } finally {
      setEnviando(false);
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setArchivos((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          maxWidth: "600px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "2rem",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--color-text)",
                }}
              >
                {esCorreccion
                  ? "Corregir y Reenviar Reporte"
                  : "Enviar Reporte"}
              </h2>
              <p
                style={{
                  margin: "0.5rem 0 0",
                  color: "var(--color-text-light)",
                  fontSize: "0.9375rem",
                }}
              >
                {reporteNombre}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0.5rem",
                color: "var(--color-text-light)",
              }}
            >
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
        </div>

        <form onSubmit={handleSubmit}>
          {/* Comentarios */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label
              htmlFor="comentarios"
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--color-text)",
                marginBottom: "0.5rem",
              }}
            >
              Comentarios{" "}
              {esCorreccion && (
                <span style={{ color: "var(--color-danger)" }}>*</span>
              )}
            </label>
            <textarea
              id="comentarios"
              className="form-textarea"
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              rows={4}
              placeholder={
                esCorreccion
                  ? "Describe las correcciones realizadas..."
                  : "Agrega comentarios sobre el reporte (opcional)..."
              }
              required={esCorreccion}
              style={{ resize: "vertical" }}
            />
          </div>

          {/* Adjuntar Archivos */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--color-text)",
                marginBottom: "0.5rem",
              }}
            >
              Evidencias / Archivos
            </label>

            <label
              htmlFor="file-upload"
              className="btn btn-secondary btn-with-icon"
              style={{
                width: "100%",
                justifyContent: "center",
                cursor: "pointer",
                marginBottom: "1rem",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              Seleccionar Archivos
            </label>
            <input
              id="file-upload"
              type="file"
              multiple
              onChange={handleFileChange}
              style={{ display: "none" }}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
            />

            {archivos.length > 0 && (
              <div
                style={{
                  border: "1px solid var(--color-border)",
                  borderRadius: "6px",
                  padding: "0.75rem",
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--color-text-light)",
                    marginBottom: "0.5rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Archivos seleccionados ({archivos.length})
                </div>
                {archivos.map((archivo, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.5rem",
                      backgroundColor: "var(--color-gray-50)",
                      borderRadius: "4px",
                      marginBottom: "0.375rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                        <polyline points="13 2 13 9 20 9"></polyline>
                      </svg>
                      <span
                        style={{
                          fontSize: "0.875rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {archivo.name}
                      </span>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--color-text-light)",
                          flexShrink: 0,
                        }}
                      >
                        ({(archivo.size / 1024).toFixed(0)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "0.25rem",
                        color: "var(--color-danger)",
                        flexShrink: 0,
                      }}
                      title="Eliminar archivo"
                    >
                      <svg
                        width="16"
                        height="16"
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
                ))}
              </div>
            )}
          </div>

          {/* Botones */}
          <div
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "flex-end",
              paddingTop: "1rem",
              borderTop: "1px solid var(--color-border)",
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={enviando || uploading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-with-icon"
              disabled={
                enviando || uploading || (esCorreccion && !comentarios.trim())
              }
            >
              {uploading ? (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ animation: "spin 1s linear infinite" }}
                  >
                    <line x1="12" y1="2" x2="12" y2="6"></line>
                    <line x1="12" y1="18" x2="12" y2="22"></line>
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                    <line x1="2" y1="12" x2="6" y2="12"></line>
                    <line x1="18" y1="12" x2="22" y2="12"></line>
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                  </svg>
                  Subiendo archivos...
                </>
              ) : enviando ? (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ animation: "spin 1s linear infinite" }}
                  >
                    <line x1="12" y1="2" x2="12" y2="6"></line>
                    <line x1="12" y1="18" x2="12" y2="22"></line>
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                    <line x1="2" y1="12" x2="6" y2="12"></line>
                    <line x1="18" y1="12" x2="22" y2="12"></line>
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                  </svg>
                  Enviando...
                </>
              ) : (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                  {esCorreccion ? "Reenviar Reporte" : "Enviar Reporte"}
                </>
              )}
            </button>
          </div>
        </form>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
