import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Calendar,
  Clock,
  User,
  FileText,
  Send,
  ChevronDown,
  ChevronUp,
  MessageCircle,
} from "lucide-react";
import FilesList from "../reportes/FilesList";
import FileViewer from "../reportes/FileViewer";
import FileUploadZone from "../common/FileUploadZone";
import { useToast, ToastContainer } from "../Toast";
import { flujoReportesService, evidenciasService } from "../../lib/services";
import { normalizarEstado } from "../../lib/utils/estados";
import type {
  ReportePeriodo,
  ArchivoDTO,
  ComentarioInfo,
} from "../../lib/services";
import "../../styles/reporte-detalle.css";

interface ReporteDetalleClientProps {
  periodoId: string;
  backHref?: string;
  backLabel?: string;
  readOnly?: boolean;
  modoModal?: boolean;
  onClose?: () => void;
}

export default function ReporteDetalleClient({
  periodoId,
  backHref,
  backLabel,
  readOnly = false,
  modoModal = false,
  onClose,
}: ReporteDetalleClientProps) {
  const [detalle, setDetalle] = useState<ReportePeriodo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archivoSeleccionado, setArchivoSeleccionado] =
    useState<ArchivoDTO | null>(null);
  const [mostrarComentarios, setMostrarComentarios] = useState(true);

  // Estados para la entrega
  const [archivosNuevos, setArchivosNuevos] = useState<File[]>([]);
  const [comentarios, setComentarios] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  );
  const {
    toasts,
    removeToast,
    success: showSuccess,
    error: showError,
  } = useToast();

  // Calcular permisos
  const canSubmitBase =
    detalle &&
    (normalizarEstado(detalle.estado) === "pendiente" ||
      normalizarEstado(detalle.estado) === "requiere_correccion");

  const canSubmit = !readOnly && canSubmitBase;

  const comentarioSupervisor = useMemo(() => {
    if (!detalle?.comentarios || detalle.comentarios.length === 0) return null;

    for (let i = detalle.comentarios.length - 1; i >= 0; i -= 1) {
      const comentario = detalle.comentarios[i];
      const accion = (comentario.accion || "").toLowerCase();
      if (
        accion.includes("apro") ||
        accion.includes("rechaz") ||
        accion.includes("valid")
      ) {
        return comentario;
      }
    }
    return null;
  }, [detalle?.comentarios]);

  useEffect(() => {
    loadDetalle();
  }, [periodoId]);

  const loadDetalle = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await flujoReportesService.obtenerPeriodo(periodoId);
      console.log("📊 Detalle recibido:", data);
      console.log("📎 Archivos encontrados:", data.archivos?.length || 0);
      setDetalle(data);
    } catch (err: any) {
      console.error("❌ Error cargando detalle:", err);
      setError(err.message || "Error al cargar el detalle");
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha + "T00:00:00").toLocaleDateString("es-CO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatearFechaHora = (fechaHora: string) => {
    const date = fechaHora.includes("T")
      ? new Date(fechaHora)
      : new Date(fechaHora + "T00:00:00");
    return date.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatearFechaHoraCorta = (fechaHora?: string | null) => {
    if (!fechaHora) return "Fecha no disponible";
    const date = fechaHora.includes("T")
      ? new Date(fechaHora)
      : new Date(fechaHora + "T00:00:00");
    return date.toLocaleString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleUploadFiles = useCallback(
    (files: File[]) => {
      setArchivosNuevos((prev) => [...prev, ...files]);
      showSuccess(`${files.length} archivo(s) agregado(s)`);
    },
    [showSuccess]
  );

  const handleRemoveFile = useCallback((index: number) => {
    setArchivosNuevos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || !detalle) {
      showError("No tienes permisos para enviar la entrega");
      return;
    }

    if (
      archivosNuevos.length === 0 &&
      (!detalle.archivos || detalle.archivos.length === 0)
    ) {
      showError("Debes adjuntar al menos un archivo antes de enviar");
      return;
    }

    try {
      setSubmitting(true);

      // Subir archivos nuevos si los hay
      const evidenciasIds: string[] = [];
      for (const file of archivosNuevos) {
        const response = await evidenciasService.subirPorPeriodo(
          periodoId,
          file
        );
        evidenciasIds.push(response.id);
      }

      // Enviar o reenviar según estado
      const estado = normalizarEstado(detalle.estado);
      const payload = {
        periodoId,
        comentarios: comentarios.trim() || undefined,
        evidenciasIds: evidenciasIds.length > 0 ? evidenciasIds : undefined,
      };

      const resultado =
        estado === "requiere_correccion"
          ? await flujoReportesService.corregirReenviar(payload)
          : await flujoReportesService.enviar(payload);

      showSuccess("Entrega enviada correctamente");
      setArchivosNuevos([]);
      setComentarios("");

      // Recargar detalle
      setTimeout(() => {
        loadDetalle();
      }, 500);
    } catch (err: any) {
      console.error("[ReporteDetalle] Error al enviar:", err);
      showError(
        err?.response?.data?.message ||
          err?.message ||
          "Error al enviar la entrega"
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    canSubmit,
    detalle,
    archivosNuevos,
    periodoId,
    comentarios,
    showSuccess,
    showError,
  ]);

  const getEstadoClass = (estado: string): string => {
    const estadoLower = estado.toLowerCase();
    if (estadoLower.includes("pendiente") || estadoLower.includes("borrador"))
      return "estado-pendiente";
    if (estadoLower.includes("enviado") || estadoLower.includes("revision"))
      return "estado-enviado";
    if (estadoLower.includes("aprobado") || estadoLower.includes("completado"))
      return "estado-aprobado";
    if (estadoLower.includes("rechazado")) return "estado-rechazado";
    return "estado-default";
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <Loader2 className="spinner" />
          <p className="loading-text">Cargando detalle del reporte...</p>
        </div>
      </div>
    );
  }

  if (error || !detalle) {
    return (
      <div className="error-container">
        <div className="error-card">
          <div className="error-content">
            <AlertCircle className="error-icon" />
            <h2 className="error-title">Error</h2>
            <p className="error-message">
              {error || "No se pudo cargar el detalle"}
            </p>
            <button
              onClick={() => window.history.back()}
              className="error-button"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`reporte-detalle-container${modoModal ? " modal-embed" : ""}`}
    >
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className="reporte-detalle-wrapper">
        {/* Header con botón de regreso */}
        <div className="reporte-header">
          <button
            onClick={() => {
              if (modoModal && onClose) {
                onClose();
                return;
              }
              if (backHref) {
                window.location.href = backHref;
              } else {
                window.history.back();
              }
            }}
            className="back-icon-button"
            aria-label={backLabel || (modoModal ? "Cerrar" : "Volver")}
          >
            <ArrowLeft />
          </button>

          <div className="header-card">
            <div className="header-content">
              <div className="header-info">
                <h1 className="header-title">{detalle.reporteNombre}</h1>
                <p className="header-subtitle">{detalle.entidadNombre}</p>
              </div>
              <span
                className={`estado-badge ${getEstadoClass(detalle.estado)}`}
              >
                {detalle.estadoDescripcion}
              </span>
            </div>
          </div>
        </div>

        {/* Grid de información */}
        <div className="info-grid">
          {/* Fechas */}
          <div className="info-card">
            <h2 className="card-title">
              <Calendar style={{ color: "#2563eb" }} />
              Fechas
            </h2>
            <div className="card-content">
              <div className="field-group">
                <p className="field-label">Periodo</p>
                <p className="field-value">
                  {formatearFecha(detalle.periodoInicio)} -{" "}
                  {formatearFecha(detalle.periodoFin)}
                </p>
              </div>
              <div className="field-group">
                <p className="field-label">Fecha de Vencimiento</p>
                <p className="field-value">
                  {formatearFecha(detalle.fechaVencimientoCalculada)}
                </p>
              </div>
              {detalle.fechaEnvioReal && (
                <div className="field-group">
                  <p className="field-label">Fecha de Envío</p>
                  <p className="field-value">
                    {formatearFechaHora(detalle.fechaEnvioReal)}
                  </p>
                  {detalle.diasDesviacion !== null &&
                    detalle.diasDesviacion !== 0 && (
                      <span
                        className={`desviacion-badge ${detalle.diasDesviacion > 0 ? "retraso" : "anticipacion"}`}
                      >
                        {detalle.diasDesviacion > 0
                          ? `${detalle.diasDesviacion} día${detalle.diasDesviacion !== 1 ? "s" : ""} de retraso`
                          : `${Math.abs(detalle.diasDesviacion)} día${Math.abs(detalle.diasDesviacion) !== 1 ? "s" : ""} de anticipación`}
                      </span>
                    )}
                  {detalle.diasDesviacion === 0 && (
                    <span className="desviacion-badge a-tiempo">
                      Enviado a tiempo
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Responsables */}
          <div className="info-card">
            <h2 className="card-title">
              <User style={{ color: "#7c3aed" }} />
              Responsables
            </h2>
            <div className="card-content">
              {detalle.responsableElaboracion && (
                <div className="responsable-card elaboracion">
                  <p className="responsable-role">Elaboración</p>
                  <p className="responsable-name">
                    {detalle.responsableElaboracion.nombreCompleto}
                  </p>
                  <p className="responsable-cargo">
                    {detalle.responsableElaboracion.cargo}
                  </p>
                  <p className="responsable-email">
                    {detalle.responsableElaboracion.email}
                  </p>
                </div>
              )}
              {detalle.responsableSupervision && (
                <div className="responsable-card supervision">
                  <p className="responsable-role">Supervisión</p>
                  <p className="responsable-name">
                    {detalle.responsableSupervision.nombreCompleto}
                  </p>
                  <p className="responsable-cargo">
                    {detalle.responsableSupervision.cargo}
                  </p>
                  <p className="responsable-email">
                    {detalle.responsableSupervision.email}
                  </p>
                </div>
              )}
              {!detalle.responsableElaboracion &&
                !detalle.responsableSupervision && (
                  <p className="no-responsables">
                    No hay responsables asignados
                  </p>
                )}
            </div>
          </div>
        </div>

        {/* Comentario del Supervisor */}
        <div className="info-card">
          <div className="archivos-header">
            <h2 className="card-title">
              <MessageCircle style={{ color: "#0f172a" }} />
              Comentario del Supervisor
            </h2>
            {comentarioSupervisor && (
              <span
                className={`comment-badge ${(() => {
                  const accion = (comentarioSupervisor.accion || "").toLowerCase();
                  if (accion.includes("rechaz")) return "rechazo";
                  if (accion.includes("apro")) return "aprobacion";
                  if (accion.includes("valid")) return "validacion";
                  return "comentario";
                })()}`}
              >
                {comentarioSupervisor.accion || "Comentario"}
              </span>
            )}
          </div>

          {comentarioSupervisor ? (
            <div className="supervisor-comment">
              <div className="supervisor-comment-meta">
                <div>
                  <p className="supervisor-author">
                    {comentarioSupervisor.autor || "Supervisor"}
                  </p>
                  {comentarioSupervisor.cargo && (
                    <p className="supervisor-cargo">{comentarioSupervisor.cargo}</p>
                  )}
                </div>
                <div className="supervisor-meta-right">
                  <span className="supervisor-date">
                    {formatearFechaHoraCorta(comentarioSupervisor.fecha)}
                  </span>
                </div>
              </div>
              <p className="supervisor-text">
                {comentarioSupervisor.texto || "Sin comentario registrado"}
              </p>
            </div>
          ) : (
            <div className="empty-state">
              <MessageCircle />
              <p className="empty-state-title">Sin comentarios del supervisor</p>
              <p className="empty-state-subtitle">
                Aún no hay aprobación o rechazo registrado.
              </p>
            </div>
          )}
        </div>

        {/* Archivos Adjuntos - Solo mostrar si ya existe una entrega */}
        {detalle.fechaEnvioReal && (
          <div className="info-card">
            <div className="archivos-header">
              <h2 className="card-title">
                <FileText style={{ color: "#16a34a" }} />
                Archivos Adjuntos
              </h2>
              <span className="count-badge">
                {detalle.archivos?.length || 0}
              </span>
            </div>
            {detalle.archivos && detalle.archivos.length > 0 ? (
              <FilesList
                periodoId={detalle.periodoId}
                archivos={detalle.archivos}
                onViewFile={setArchivoSeleccionado}
                compact={false}
              />
            ) : (
              <div className="empty-state">
                <FileText />
                <p className="empty-state-title">No hay archivos adjuntos</p>
                <p className="empty-state-subtitle">
                  Los archivos aparecerán aquí cuando se suban
                </p>
              </div>
            )}
          </div>
        )}

        {/* Sección de Entrega de Reporte - Solo cuando puede enviar/corregir Y no tiene entrega previa */}
        {canSubmit && !detalle.fechaEnvioReal && (
          <div className="info-card">
            <div className="archivos-header">
              <h2 className="card-title">
                <Send style={{ color: "#059669" }} />
                Enviar Entrega de Reporte
              </h2>
            </div>

            {/* Subir Archivos */}
            <div style={{ marginBottom: "20px" }}>
              <FileUploadZone
                onFilesSelected={handleUploadFiles}
                selectedFiles={archivosNuevos}
                onRemoveFile={handleRemoveFile}
                uploadProgress={uploadProgress}
                disabled={submitting}
              />
            </div>

            {/* Validación de archivos */}
            {archivosNuevos.length === 0 && (
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "#fef3c7",
                  border: "1px solid #f59e0b",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AlertCircle
                  size={20}
                  style={{ color: "#f59e0b", flexShrink: 0 }}
                />
                <p style={{ margin: 0, color: "#92400e", fontSize: "14px" }}>
                  Debes adjuntar al menos un archivo para poder enviar la
                  entrega
                </p>
              </div>
            )}

            {/* Comentarios */}
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: 500,
                  fontSize: "14px",
                  color: "#374151",
                }}
              >
                Comentarios{" "}
                {detalle &&
                normalizarEstado(detalle.estado) === "requiere_correccion"
                  ? "(opcional)"
                  : "(opcional)"}
              </label>
              <textarea
                value={comentarios}
                onChange={(e) => setComentarios(e.target.value)}
                placeholder="Agrega comentarios sobre tu entrega..."
                maxLength={2000}
                disabled={submitting}
                style={{
                  width: "100%",
                  minHeight: "100px",
                  padding: "12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  resize: "vertical",
                  opacity: submitting ? 0.6 : 1,
                  cursor: submitting ? "not-allowed" : "text",
                }}
              />
              <p
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  marginTop: "4px",
                  textAlign: "right",
                }}
              >
                {comentarios.length}/2000 caracteres
              </p>
            </div>

            {/* Botón de envío */}
            <button
              onClick={handleSubmit}
              disabled={submitting || archivosNuevos.length === 0}
              style={{
                width: "100%",
                padding: "12px 24px",
                backgroundColor:
                  submitting || archivosNuevos.length === 0
                    ? "#d1d5db"
                    : "#059669",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: 600,
                cursor:
                  submitting || archivosNuevos.length === 0
                    ? "not-allowed"
                    : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!submitting && archivosNuevos.length > 0) {
                  e.currentTarget.style.backgroundColor = "#047857";
                }
              }}
              onMouseLeave={(e) => {
                if (!submitting && archivosNuevos.length > 0) {
                  e.currentTarget.style.backgroundColor = "#059669";
                }
              }}
            >
              <Send size={20} />
              {submitting ? "Enviando..." : "Enviar Entrega"}
            </button>
          </div>
        )}

        {/* Sección de Corrección - Solo cuando requiere corrección Y ya tiene entrega previa */}
        {!readOnly &&
          detalle.fechaEnvioReal &&
          normalizarEstado(detalle.estado) === "requiere_correccion" && (
            <div className="info-card">
              <div className="archivos-header">
                <h2 className="card-title">
                  <Send style={{ color: "#dc2626" }} />
                  Reenviar Entrega con Correcciones
                </h2>
              </div>

              {/* Subir Archivos para Corrección */}
              <div style={{ marginBottom: "20px" }}>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#6b7280",
                    marginBottom: "12px",
                  }}
                >
                  📎 Los archivos actuales se mantendrán. Puedes agregar
                  archivos adicionales o corregir solo el reporte sin cambiar
                  archivos.
                </p>
                <FileUploadZone
                  onFilesSelected={handleUploadFiles}
                  selectedFiles={archivosNuevos}
                  onRemoveFile={handleRemoveFile}
                  uploadProgress={uploadProgress}
                  disabled={submitting}
                />
              </div>

              {/* Comentarios para Corrección */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: 500,
                    fontSize: "14px",
                    color: "#374151",
                  }}
                >
                  Comentarios sobre la corrección (opcional)
                </label>
                <textarea
                  value={comentarios}
                  onChange={(e) => setComentarios(e.target.value)}
                  placeholder="Explica qué correcciones realizaste..."
                  maxLength={2000}
                  disabled={submitting}
                  style={{
                    width: "100%",
                    minHeight: "100px",
                    padding: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontFamily: "inherit",
                    resize: "vertical",
                    opacity: submitting ? 0.6 : 1,
                    cursor: submitting ? "not-allowed" : "text",
                  }}
                />
                <p
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    marginTop: "4px",
                    textAlign: "right",
                  }}
                >
                  {comentarios.length}/2000 caracteres
                </p>
              </div>

              {/* Botón de reenvío */}
              <button
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  (archivosNuevos.length === 0 &&
                    (!detalle.archivos || detalle.archivos.length === 0))
                }
                style={{
                  width: "100%",
                  padding: "12px 24px",
                  backgroundColor:
                    submitting ||
                    (archivosNuevos.length === 0 &&
                      (!detalle.archivos || detalle.archivos.length === 0))
                      ? "#d1d5db"
                      : "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor:
                    submitting ||
                    (archivosNuevos.length === 0 &&
                      (!detalle.archivos || detalle.archivos.length === 0))
                      ? "not-allowed"
                      : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (
                    !submitting &&
                    (archivosNuevos.length > 0 ||
                      (detalle.archivos && detalle.archivos.length > 0))
                  ) {
                    e.currentTarget.style.backgroundColor = "#b91c1c";
                  }
                }}
                onMouseLeave={(e) => {
                  if (
                    !submitting &&
                    (archivosNuevos.length > 0 ||
                      (detalle.archivos && detalle.archivos.length > 0))
                  ) {
                    e.currentTarget.style.backgroundColor = "#dc2626";
                  }
                }}
              >
                <Send size={20} />
                {submitting ? "Enviando..." : "Reenviar Entrega"}
              </button>
            </div>
          )}

        {/* Historial de Comentarios y Agregar Comentario */}
        {(detalle.comentarios && detalle.comentarios.length > 0) ||
        (normalizarEstado(detalle.estado) !== "pendiente" &&
          normalizarEstado(detalle.estado) !== "requiere_correccion") ? (
          <div className="info-card">
            <div
              className="archivos-header"
              style={{ cursor: "pointer" }}
              onClick={() => setMostrarComentarios(!mostrarComentarios)}
            >
              <h2 className="card-title">
                <MessageCircle style={{ color: "#4f46e5" }} />
                Historial de Comentarios
              </h2>
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                {detalle.comentarios && detalle.comentarios.length > 0 && (
                  <span
                    className="count-badge"
                    style={{ backgroundColor: "#e0e7ff", color: "#3730a3" }}
                  >
                    {detalle.comentarios.length}
                  </span>
                )}
                {mostrarComentarios ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </div>
            </div>

            {mostrarComentarios && (
              <>
                {/* Historial de mensajes estilo chat */}
                {detalle.comentarios && detalle.comentarios.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                      padding: "20px",
                      backgroundColor: "#f9fafb",
                      borderRadius: "12px",
                      maxHeight: "500px",
                      overflowY: "auto",
                      marginBottom: "20px",
                    }}
                  >
                    {detalle.comentarios.map(
                      (comentario: ComentarioInfo, index: number) => (
                        <div
                          key={`comentario-${comentario.fecha}-${index}`}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            padding: "16px",
                            backgroundColor: "white",
                            borderRadius: "12px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                            border: "1px solid #e5e7eb",
                            transition: "all 0.2s",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              gap: "12px",
                              marginBottom: "8px",
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  marginBottom: "4px",
                                }}
                              >
                                <div
                                  style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "50%",
                                    backgroundColor: "#4f46e5",
                                    color: "white",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: 600,
                                    fontSize: "14px",
                                  }}
                                >
                                  {comentario.autor.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p
                                    style={{
                                      margin: 0,
                                      fontWeight: 600,
                                      fontSize: "14px",
                                      color: "#111827",
                                    }}
                                  >
                                    {comentario.autor}
                                  </p>
                                  {comentario.cargo && (
                                    <p
                                      style={{
                                        margin: 0,
                                        fontSize: "12px",
                                        color: "#6b7280",
                                      }}
                                    >
                                      {comentario.cargo}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-end",
                                gap: "4px",
                              }}
                            >
                              <span
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: "12px",
                                  backgroundColor: "#dbeafe",
                                  color: "#1e40af",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px",
                                }}
                              >
                                {comentario.accion}
                              </span>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: "12px",
                                  color: "#9ca3af",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {comentario.fecha}
                              </p>
                            </div>
                          </div>
                          <p
                            style={{
                              margin: 0,
                              fontSize: "14px",
                              color: "#374151",
                              lineHeight: "1.6",
                              whiteSpace: "pre-wrap",
                              paddingLeft: "40px",
                            }}
                          >
                            {comentario.texto}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* Formulario para agregar comentario - siempre al final */}
                {!readOnly &&
                  normalizarEstado(detalle.estado) !== "pendiente" &&
                  normalizarEstado(detalle.estado) !==
                    "requiere_correccion" && (
                    <div
                      style={{
                        padding: "20px",
                        backgroundColor: "#f9fafb",
                        borderRadius: "12px",
                        border: "2px dashed #e5e7eb",
                      }}
                    >
                      <label
                        style={{
                          marginBottom: "12px",
                          fontWeight: 600,
                          fontSize: "14px",
                          color: "#374151",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <MessageCircle size={18} style={{ color: "#4f46e5" }} />
                        Agregar nuevo comentario
                      </label>
                      <textarea
                        value={comentarios}
                        onChange={(e) => setComentarios(e.target.value)}
                        placeholder="Escribe tu comentario aquí..."
                        maxLength={2000}
                        disabled={submitting}
                        style={{
                          width: "100%",
                          minHeight: "100px",
                          padding: "12px",
                          border: "1px solid #d1d5db",
                          borderRadius: "8px",
                          fontSize: "14px",
                          fontFamily: "inherit",
                          resize: "vertical",
                          opacity: submitting ? 0.6 : 1,
                          cursor: submitting ? "not-allowed" : "text",
                          marginBottom: "8px",
                        }}
                      />
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            margin: 0,
                          }}
                        >
                          {comentarios.length}/2000 caracteres
                        </p>
                        <button
                          onClick={async () => {
                            if (!comentarios.trim()) {
                              showError("Debes escribir un comentario");
                              return;
                            }

                            setSubmitting(true);
                            try {
                              await flujoReportesService.agregarComentario({
                                periodoId: detalle.periodoId,
                                texto: comentarios,
                              });
                              showSuccess("Comentario agregado exitosamente");
                              setComentarios("");
                              setTimeout(() => {
                                loadDetalle();
                              }, 500);
                            } catch (error: any) {
                              showError(
                                error.response?.data?.message ||
                                  "Error al agregar comentario"
                              );
                            } finally {
                              setSubmitting(false);
                            }
                          }}
                          disabled={submitting || !comentarios.trim()}
                          style={{
                            padding: "10px 20px",
                            backgroundColor:
                              submitting || !comentarios.trim()
                                ? "#d1d5db"
                                : "#4f46e5",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: 600,
                            cursor:
                              submitting || !comentarios.trim()
                                ? "not-allowed"
                                : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            transition: "background-color 0.2s",
                          }}
                        >
                          <Send size={16} />
                          {submitting ? "Enviando..." : "Enviar"}
                        </button>
                      </div>
                    </div>
                  )}
              </>
            )}
          </div>
        ) : null}
      </div>

      {/* Modal de visualización */}
      {archivoSeleccionado && (
        <FileViewer
          archivo={archivoSeleccionado}
          periodoId={detalle.periodoId}
          onClose={() => setArchivoSeleccionado(null)}
        />
      )}
    </div>
  );
}
