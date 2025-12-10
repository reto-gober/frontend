import { useEffect, useState, useCallback, useMemo } from "react";
import {
  evidenciasService,
  flujoReportesService,
  type ReportePeriodo,
  type ArchivoDTO,
} from "../../lib/services";
import { normalizarEstado } from "../../lib/utils/estados";
import { useToast } from "../Toast";
import FileUploadZone from "./FileUploadZone";
import FilesList from "./FilesList";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const REPORT_ALLOWED_EXT = [".pdf", ".doc", ".docx", ".xls", ".xlsx"];
const EVIDENCE_ALLOWED_EXT = [".pdf", ".png", ".jpg", ".jpeg", ".webp"];

export interface CurrentUser {
  id: string;
  email: string;
  role: "responsable" | "supervisor" | "admin";
  nombreCompleto?: string;
}

export interface EntregaReporteClientProps {
  periodoId?: string;
  currentUser?: CurrentUser;
  initialData?: ReportePeriodo;
  onUpdate?: (updatedPeriodo: ReportePeriodo) => void;
  mode?: "embedded" | "modal";
}

export default function EntregaReporteClient({
  periodoId: periodoIdProp,
  currentUser: currentUserProp,
  initialData,
  onUpdate,
  mode = "embedded",
}: EntregaReporteClientProps = {}) {
  const { success, error: showError } = useToast();

  // Estado de URL params para backward compatibility
  const [periodoId, setPeriodoId] = useState<string>(periodoIdProp || "");
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(
    currentUserProp || null
  );

  // Estado principal
  const [periodo, setPeriodo] = useState<ReportePeriodo | null>(
    initialData || null
  );
  const [archivos, setArchivos] = useState<ArchivoDTO[]>([]);
  const [loading, setLoading] = useState(!initialData);
  const [submitting, setSubmitting] = useState(false);

  // Estado de formularios
  const [comentarios, setComentarios] = useState("");
  const [archivoReporte, setArchivoReporte] = useState<File | null>(null);
  const [archivosEvidencia, setArchivosEvidencia] = useState<File[]>([]);
  const [reporteError, setReporteError] = useState<string | null>(null);
  const [evidenciaError, setEvidenciaError] = useState<string | null>(null);

  // Estado de modales
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCommentsSection, setShowCommentsSection] = useState(
    mode === "modal"
  );

  // Función auxiliar para cargar archivos
  const loadArchivos = useCallback(async () => {
    if (!periodoId) return;
    try {
      const response = await fetch(`/api/periodos/${periodoId}/archivos`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Error al cargar archivos");
      const data = await response.json();
      setArchivos(data);
    } catch (err) {
      console.error("[EntregaReporte] Error al cargar archivos:", err);
    }
  }, [periodoId]);

  // Cargar parámetros de URL y usuario actual si no vienen por props
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Si no viene periodoId por props, leerlo de URL
    if (!periodoIdProp) {
      const params = new URLSearchParams(window.location.search);
      const pId = params.get("periodoId") || "";
      setPeriodoId(pId);
    }

    // Si no viene currentUser por props, obtenerlo de localStorage
    if (!currentUserProp) {
      const usuarioStr = localStorage.getItem("usuario");
      if (usuarioStr) {
        try {
          const usuario = JSON.parse(usuarioStr);
          const role = usuario.roles?.[0]?.toLowerCase() || "responsable";
          setCurrentUser({
            id: usuario.usuarioId,
            email: usuario.email,
            role: role as "responsable" | "supervisor" | "admin",
            nombreCompleto: `${usuario.firstName} ${usuario.firstLastname}`,
          });
        } catch (err) {
          console.error("[EntregaReporte] Error parseando usuario:", err);
        }
      }
    }
  }, [periodoIdProp, currentUserProp]);

  useEffect(() => {
    if (!periodoId || !currentUser) return;

    const loadData = async () => {
      if (initialData) {
        setPeriodo(initialData);
        return;
      }

      try {
        setLoading(true);

        // Cargar periodo si no viene en props
        const periodoData =
          await flujoReportesService.obtenerPeriodo(periodoId);
        setPeriodo(periodoData);

        // Cargar archivos
        await loadArchivos();
      } catch (err: any) {
        console.error("[EntregaReporte] Error cargando datos:", err);
        // No usar showError aquí para evitar bucle infinito
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodoId, currentUser]); // Solo dependencias esenciales

  // Calcular permisos din\u00e1micamente
  const permissions = useMemo(() => {
    if (!periodo || !currentUser) {
      return {
        canUploadFiles: false,
        canSubmit: false,
        canValidate: false,
        canReject: false,
        canRequestCorrection: false,
        canViewFiles: true,
        canComment: true,
      };
    }

    const estado = normalizarEstado(periodo.estado);
    const isResponsable = currentUser.role === "responsable";
    const isSupervisor = currentUser.role === "supervisor";
    const isAdmin = currentUser.role === "admin";

    return {
      canUploadFiles:
        isResponsable &&
        (estado === "pendiente" || estado === "requiere_correccion"),
      canSubmit:
        isResponsable &&
        (estado === "pendiente" || estado === "requiere_correccion"),
      canValidate: (isSupervisor || isAdmin) && estado === "en_revision",
      canReject:
        (isSupervisor || isAdmin) &&
        (estado === "en_revision" || estado === "enviado"),
      canRequestCorrection:
        (isSupervisor || isAdmin) &&
        (estado === "en_revision" || estado === "enviado"),
      canViewFiles: true,
      canComment: true,
    };
  }, [periodo, currentUser]);

  // Manejadores de acciones
  const validateFile = useCallback(
    (file: File, allowedExts: string[], label: string): string | null => {
      const extension = file.name.includes(".")
        ? file.name.substring(file.name.lastIndexOf(".")).toLowerCase()
        : "";

      if (!allowedExts.includes(extension)) {
        return `${label} debe tener formato ${allowedExts.join(", ")}`;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return `${label} supera el tamaño máximo de 10MB`;
      }

      return null;
    },
    []
  );

  const handleReporteSelected = useCallback(
    (files: File[]) => {
      const file = files[0];
      if (!file) return;

      const errorMsg = validateFile(
        file,
        REPORT_ALLOWED_EXT,
        "El archivo del reporte"
      );

      if (errorMsg) {
        setArchivoReporte(null);
        setReporteError(errorMsg);
        showError(errorMsg);
        return;
      }

      setArchivoReporte(file);
      setReporteError(null);
    },
    [validateFile, showError]
  );

  const handleEvidenciaSelected = useCallback(
    (files: File[]) => {
      if (!files.length) return;

      const nextFiles: File[] = [];
      for (const file of files) {
        const errorMsg = validateFile(
          file,
          EVIDENCE_ALLOWED_EXT,
          "El archivo de evidencia"
        );
        if (errorMsg) {
          setEvidenciaError(errorMsg);
          showError(errorMsg);
          return;
        }
        nextFiles.push(file);
      }

      const combined = [...archivosEvidencia, ...nextFiles];
      if (combined.length > 2) {
        setEvidenciaError("Máximo 2 archivos de evidencia");
        showError("Máximo 2 archivos de evidencia");
        return;
      }

      setArchivosEvidencia(combined);
      setEvidenciaError(null);
    },
    [archivosEvidencia, validateFile, showError]
  );

  const handleRemoveReporte = useCallback(() => {
    setArchivoReporte(null);
    setReporteError(null);
  }, []);

  const handleRemoveEvidencia = useCallback((index: number) => {
    setArchivosEvidencia((prev) => prev.filter((_, i) => i !== index));
    setEvidenciaError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!permissions.canSubmit || !currentUser) {
      showError("No tienes permisos para enviar la entrega");
      return;
    }

    if (reporteError || evidenciaError) {
      showError("Corrige los archivos seleccionados antes de enviar");
      return;
    }

    const missingReporte = !archivoReporte;
    const missingEvidencia = archivosEvidencia.length === 0;

    if (missingReporte || missingEvidencia) {
      const message =
        missingReporte && missingEvidencia
          ? "Debes adjuntar el archivo del reporte y una evidencia"
          : missingReporte
            ? "Debes adjuntar el archivo del reporte"
            : "Debes adjuntar un archivo de evidencia";

      showError(message);
      if (missingReporte) setReporteError("Este archivo es obligatorio");
      if (missingEvidencia) setEvidenciaError("Este archivo es obligatorio");
      return;
    }

    try {
      setSubmitting(true);

      const evidenciasIds: string[] = [];
      const filesToUpload: File[] = [archivoReporte, ...archivosEvidencia];

      for (const file of filesToUpload) {
        const response = await evidenciasService.subirPorPeriodo(
          periodoId,
          file
        );
        evidenciasIds.push(response.id);
      }

      // Enviar o reenviar según estado
      const estado = normalizarEstado(periodo?.estado || "");
      const payload = {
        periodoId,
        comentarios: comentarios.trim() || undefined,
        evidenciasIds,
      };

      const resultado =
        estado === "requiere_correccion"
          ? await flujoReportesService.corregirReenviar(payload)
          : await flujoReportesService.enviar(payload);

      setPeriodo(resultado);
      setArchivoReporte(null);
      setArchivosEvidencia([]);
      setReporteError(null);
      setEvidenciaError(null);
      setComentarios("");
      success("Entrega enviada correctamente");

      if (onUpdate) {
        onUpdate(resultado);
      }

      // Redirigir a Mis Tareas después de 1 segundo
      setTimeout(() => {
        window.location.href = "/roles/responsable/mis-tareas";
      }, 1000);
    } catch (err: any) {
      console.error("[EntregaReporte] Error al enviar:", err);
      showError(
        err?.response?.data?.message ||
          err?.message ||
          "Error al enviar la entrega"
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    permissions.canSubmit,
    currentUser,
    reporteError,
    evidenciaError,
    archivoReporte,
    archivosEvidencia,
    periodoId,
    periodo?.estado,
    comentarios,
    onUpdate,
    showError,
    success,
  ]);

  if (loading) {
    return (
      <div className="entrega-loading">
        <div className="spinner" />
        <p>Cargando información del reporte...</p>
      </div>
    );
  }

  if (!periodo || !currentUser) {
    return (
      <div className="entrega-error">
        <p>No se pudo cargar la información del periodo</p>
      </div>
    );
  }

  const estado = normalizarEstado(periodo.estado);
  const estadoLabel = periodo.estadoDescripcion || estado;
  const submitDisabled =
    submitting ||
    !archivoReporte ||
    archivosEvidencia.length === 0 ||
    archivosEvidencia.length > 2 ||
    Boolean(reporteError) ||
    Boolean(evidenciaError);

  const submitHint =
    !archivoReporte && archivosEvidencia.length === 0
      ? "Adjunta el archivo del reporte y al menos una evidencia"
      : !archivoReporte
        ? "Adjunta el archivo del reporte"
        : archivosEvidencia.length === 0
          ? "Adjunta al menos una evidencia"
          : archivosEvidencia.length > 2
            ? "Máximo 2 archivos de evidencia"
            : "";

  return (
    <div className={`entrega-page mode-${mode}`}>
      {/* Header con información del reporte */}
      <div className="hero-card">
        <div className="hero-header">
          <h1 className="hero-title">{periodo.reporteNombre}</h1>
          <span className={`estado-badge estado-${estado}`}>{estadoLabel}</span>
        </div>

        <div className="hero-meta">
          <div className="meta-item">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="4" width="18" height="17" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>
              Vence:{" "}
              {new Date(periodo.fechaVencimientoCalculada).toLocaleDateString(
                "es-CO"
              )}
            </span>
          </div>
          <div className="meta-item">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="4" y="9" width="16" height="11" rx="1" />
              <path d="M8 9V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4" />
            </svg>
            <span>{periodo.entidadNombre}</span>
          </div>
        </div>

        {periodo.comentarios && periodo.comentarios.length > 0 && (
          <div className="hero-observaciones">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>
              Último comentario:{" "}
              {periodo.comentarios[periodo.comentarios.length - 1].texto}
            </span>
          </div>
        )}
      </div>

      {/* Sección de archivos - mostrar existentes */}
      {archivos.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3>Archivos adjuntos</h3>
            <p>Evidencias previamente cargadas</p>
          </div>
          <FilesList
            archivos={archivos.map((a) => ({
              ...a,
              urlPublica: a.urlPublica ?? null,
            }))}
            periodoId={periodoId}
            canDelete={permissions.canUploadFiles && !submitting}
            onRefresh={loadArchivos}
          />
        </div>
      )}

      {/* Zona de carga de archivos */}
      {permissions.canUploadFiles && (
        <div className="card">
          <div className="card-header">
            <h3>Adjuntar archivos requeridos</h3>
            <p>
              Sube el archivo del reporte y una evidencia de soporte (máx. 10MB
              cada uno)
            </p>
          </div>

          {(!archivoReporte || archivosEvidencia.length === 0) && (
            <div className="upload-notice">
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <span>
                Debes adjuntar el archivo del reporte y al menos una evidencia
                (máx. 2) para poder enviar la entrega
              </span>
            </div>
          )}

          <div className="upload-grid">
            <div className="upload-block">
              <div className="upload-block-header">
                <div>
                  <h4>
                    Archivo del reporte <span className="required">*</span>
                  </h4>
                  <p className="upload-helper">
                    Formatos: PDF, DOC, DOCX, XLS, XLSX. Máx. 10MB.
                  </p>
                </div>
                {reporteError && (
                  <span className="field-error">{reporteError}</span>
                )}
              </div>
              <FileUploadZone
                onFilesSelected={handleReporteSelected}
                selectedFiles={archivoReporte ? [archivoReporte] : []}
                onRemoveFile={() => handleRemoveReporte()}
                disabled={submitting}
                maxFiles={1}
                accept={REPORT_ALLOWED_EXT.join(",")}
                label="Archivo del reporte"
                helperText="Sube el documento oficial del reporte (máx. 10MB)"
                multiple={false}
              />
            </div>

            <div className="upload-block">
              <div className="upload-block-header">
                <div>
                  <h4>
                    Evidencia (imagen o PDF) <span className="required">*</span>
                  </h4>
                  <p className="upload-helper">
                    Formatos: PDF, PNG, JPG, JPEG, WEBP. Máx. 10MB.
                  </p>
                </div>
                {evidenciaError && (
                  <span className="field-error">{evidenciaError}</span>
                )}
              </div>
              <FileUploadZone
                onFilesSelected={handleEvidenciaSelected}
                selectedFiles={archivosEvidencia}
                onRemoveFile={(index) => handleRemoveEvidencia(index)}
                disabled={submitting}
                maxFiles={2}
                accept={EVIDENCE_ALLOWED_EXT.join(",")}
                label="Evidencia"
                helperText="Sube una o dos evidencias (PDF o imagen, máx. 10MB c/u). Formatos: PDF, PNG, JPG, JPEG, WEBP."
                multiple
              />
            </div>
          </div>
        </div>
      )}

      {/* Comentarios */}
      {permissions.canComment && (
        <div className="card">
          <div className="card-header">
            <h3>Comentarios</h3>
            <p>Añade observaciones sobre esta entrega</p>
          </div>
          <textarea
            value={comentarios}
            onChange={(e) => setComentarios(e.target.value)}
            rows={4}
            placeholder="Escribe tus comentarios aquí..."
            disabled={submitting}
            maxLength={2000}
            aria-label="Comentarios sobre la entrega"
          />
          <div className="char-counter">
            {comentarios.length} / 2000 caracteres
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="action-buttons">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => window.history.back()}
          disabled={submitting}
        >
          Volver
        </button>

        {permissions.canSubmit && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitDisabled}
            title={submitHint}
          >
            {submitting
              ? "Enviando..."
              : estado === "requiere_correccion"
                ? "Reenviar Entrega"
                : "Enviar Entrega"}
          </button>
        )}
      </div>

      <style>{`
        .entrega-page {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .hero-card {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 1.1rem 1.25rem;
          border-radius: 14px;
          background: #ffffff;
          border: 1px solid #e6e8ef;
          box-shadow: var(--shadow-card, 0 6px 16px rgba(0,0,0,0.06));
        }

        .hero-title {
          margin: 0;
          font-size: 1.7rem;
          font-weight: 800;
          color: #1a2233;
          letter-spacing: -0.01em;
        }

        .hero-row {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          align-items: center;
        }

        .hero-observaciones { width: 100%; }

        .hero-item {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.55rem 0.8rem;
          border-radius: 10px;
          background: #ffffff;
          border: 1px solid #e6e8ef;
          color: #1a2233;
          font-weight: 700;
          font-size: 0.95rem;
          line-height: 1.2;
        }

        .hero-item svg {
          stroke: #f3d08a;
          stroke-width: 1.8;
          fill: none;
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        .hero-item span {
          color: #1a2233;
        }

        .entrega-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1rem;
        }

        .card {
          background: white;
          border-radius: 12px;
          border: 1px solid var(--neutral-200);
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .upload-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 1rem;
        }

        .upload-block {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .upload-block-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 0.5rem;
        }

        .upload-helper {
          margin: 0.25rem 0 0;
          color: var(--neutral-600);
          font-size: 0.85rem;
        }

        .required {
          color: var(--color-danger, #dc2626);
          font-weight: 700;
        }

        .field-error {
          color: var(--color-danger, #dc2626);
          font-size: 0.85rem;
          font-weight: 600;
        }

        .card-header h3 {
          margin: 0;
          font-size: 1rem;
          color: var(--neutral-900);
        }

        .card-header p {
          margin: 0.25rem 0 0;
          color: var(--neutral-600);
          font-size: 0.875rem;
        }

        .dropzone {
          border: 1.5px solid var(--color-primary-600, #0f6bff);
          border-radius: 10px;
          padding: 0.85rem 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          cursor: pointer;
          background: var(--color-primary-50, #eef4ff);
          color: var(--neutral-800);
        }

        .dropzone:hover {
          box-shadow: 0 8px 18px rgba(15, 107, 255, 0.12);
        }

        .dropzone input {
          display: none;
        }

        .dropzone-text {
          flex: 1;
          min-width: 0;
          font-weight: 600;
          color: var(--neutral-800);
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
        }

        .dropzone-action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: var(--color-primary-600, #0f6bff);
          color: white;
          flex-shrink: 0;
          box-shadow: 0 6px 14px rgba(15, 107, 255, 0.18);
        }

        textarea {
          width: 100%;
          border-radius: 10px;
          border: 1px solid var(--neutral-200);
          padding: 0.75rem;
          font-family: inherit;
          font-size: 0.95rem;
          color: var(--neutral-800);
        }

        .upload-notice {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: #fef3c7;
          border: 1px solid #fbbf24;
          border-radius: 8px;
          margin-bottom: 1rem;
          color: #92400e;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .upload-notice svg {
          flex-shrink: 0;
          color: #f59e0b;
        }

        .alert {
          border-radius: 10px;
          padding: 0.75rem 1rem;
          font-weight: 600;
        }

        .alert.error {
          background: #fef2f2;
          border: 1px solid #fecdd3;
          color: #b91c1c;
        }

        .alert.success {
          background: #ecfdf3;
          border: 1px solid #bbf7d0;
          color: #166534;
        }

        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .btn-primary,
        .btn-secondary {
          border-radius: 10px;
          padding: 0.65rem 1.1rem;
          font-weight: 700;
          border: 1px solid transparent;
          cursor: pointer;
        }

        .btn-primary {
          background: var(--role-accent);
          border-color: var(--role-accent);
          color: var(--neutral-900);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: white;
          border-color: var(--neutral-200);
          color: var(--neutral-800);
        }
      `}</style>
    </div>
  );
}
