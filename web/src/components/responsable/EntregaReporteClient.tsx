import { useEffect, useState } from "react";
import {
  evidenciasService,
  flujoReportesService,
  type EnviarReporteRequest,
  type ReportePeriodo,
} from "../../lib/services";
import { normalizarEstado } from "../../lib/utils/estados";

export default function EntregaReporteClient() {
  const [periodoId, setPeriodoId] = useState<string>("");
  const [reporteIdParam, setReporteIdParam] = useState<string>("");
  const [reporteNombreParam, setReporteNombreParam] = useState<string>("");

  const [periodo, setPeriodo] = useState<ReportePeriodo | null>(null);
  const [reporteId, setReporteId] = useState<string>("");
  const [comentarios, setComentarios] = useState("");
  const [archivoEvidencia, setArchivoEvidencia] = useState<File | null>(null);
  const [archivoReporte, setArchivoReporte] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  // Cargar parámetros de URL en cliente y evitar acceso a window en SSR
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const pId = params.get("periodoId") || "";
    const rId = params.get("reporteId") || "";
    const rName = params.get("reporteNombre") || "";
    setPeriodoId(pId);
    setReporteIdParam(rId);
    setReporteId(rId);
    setReporteNombreParam(rName);
  }, []);

  useEffect(() => {
    if (!periodoId) return;
    flujoReportesService
      .obtenerPeriodo(periodoId)
      .then((data) => {
        setPeriodo(data);
        if (!reporteId) {
          setReporteId(data.reporteId);
        }
      })
      .catch((err) => {
        console.error("[Entrega] Error obteniendo periodo", err);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "No se pudo cargar la información del periodo"
        );
      });
  }, [periodoId, reporteId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setExito(null);

    if (!periodoId || !reporteId) {
      setError("Falta el identificador del periodo o reporte.");
      return;
    }

    if (!archivoEvidencia || !archivoReporte) {
      setError("Debes adjuntar los dos archivos requeridos.");
      return;
    }

    try {
      setSubiendo(true);
      const evidenciasIds = await Promise.all([
        evidenciasService.subir(reporteId, archivoEvidencia).then((r) => r.id),
        evidenciasService.subir(reporteId, archivoReporte).then((r) => r.id),
      ]);
      setSubiendo(false);

      setEnviando(true);
      const payload: EnviarReporteRequest = {
        periodoId,
        comentarios: comentarios.trim() || undefined,
        evidenciasIds,
      };

      const estado = normalizarEstado(periodo?.estado || "");
      const resultado =
        estado === "requiere_correccion"
          ? await flujoReportesService.corregirReenviar(payload)
          : await flujoReportesService.enviar(payload);

      setPeriodo(resultado);
      localStorage.setItem("tarea_enviada_periodo", periodoId);
      setExito("Entrega enviada correctamente");

      setTimeout(() => {
        window.location.href = "/roles/responsable/mis-tareas";
      }, 800);
    } catch (err: any) {
      console.error("[Entrega] Error al enviar", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "No se pudo enviar el reporte"
      );
    } finally {
      setSubiendo(false);
      setEnviando(false);
    }
  };

  const nombreReporte =
    reporteNombreParam || periodo?.reporteNombre || "Reporte asignado";
  const fechaVencimiento = periodo?.fechaVencimientoCalculada
    ? new Date(periodo.fechaVencimientoCalculada).toLocaleDateString("es-CO")
    : "-";
  const entidad = periodo?.entidadNombre || "Sin entidad asignada";
  const observaciones =
    (periodo as any)?.comentarios || "Sin observaciones asignadas";

  return (
    <div className="entrega-page">
      <div className="hero-card">
        <h1 className="hero-title">{nombreReporte}</h1>
        <div className="hero-row">
          <div className="hero-item">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <rect x="3" y="4" width="18" height="17" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Vence: {fechaVencimiento}</span>
          </div>
          <div className="hero-item">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <rect x="4" y="9" width="16" height="11" rx="1" />
              <path d="M8 9V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4" />
            </svg>
            <span>{entidad}</span>
          </div>
        </div>
        <div className="hero-row hero-observaciones">
          <div className="hero-item">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M6 4h9l3 3v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
              <line x1="9" y1="12" x2="15" y2="12" />
              <line x1="9" y1="9" x2="15" y2="9" />
              <line x1="9" y1="15" x2="13" y2="15" />
            </svg>
            <span>{observaciones}</span>
          </div>
        </div>
      </div>

      <form className="entrega-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="card">
            <div className="card-header">
              <h3>Archivo 1: Evidencia</h3>
              <p>PDF o ZIP con respaldos obligatorios.</p>
            </div>
            <label className="dropzone">
              <input
                type="file"
                accept=".pdf,.zip,.rar,.7z"
                onChange={(e) =>
                  setArchivoEvidencia(e.target.files?.[0] || null)
                }
                required
              />
              <span className="dropzone-text">
                {archivoEvidencia
                  ? archivoEvidencia.name
                  : "Selecciona un archivo"}
              </span>
              <span className="dropzone-action" aria-hidden="true">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 19V5" />
                  <polyline points="5 12 12 5 19 12" />
                  <rect x="4" y="19" width="16" height="2" rx="1" />
                </svg>
              </span>
            </label>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Archivo 2: Reporte</h3>
              <p>Documento final que se enviará.</p>
            </div>
            <label className="dropzone">
              <input
                type="file"
                accept=".pdf,.doc,.docx,.xlsx,.zip"
                onChange={(e) => setArchivoReporte(e.target.files?.[0] || null)}
                required
              />
              <span className="dropzone-text">
                {archivoReporte ? archivoReporte.name : "Selecciona un archivo"}
              </span>
              <span className="dropzone-action" aria-hidden="true">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 19V5" />
                  <polyline points="5 12 12 5 19 12" />
                  <rect x="4" y="19" width="16" height="2" rx="1" />
                </svg>
              </span>
            </label>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Comentarios (opcional)</h3>
            <p>Información adicional para el supervisor.</p>
          </div>
          <textarea
            value={comentarios}
            onChange={(e) => setComentarios(e.target.value)}
            rows={4}
            placeholder="Añade contexto o detalles relevantes..."
          />
        </div>

        {error && <div className="alert error">{error}</div>}
        {exito && <div className="alert success">{exito}</div>}

        <div className="actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() =>
              (window.location.href = "/roles/responsable/mis-tareas")
            }
            disabled={subiendo || enviando}
          >
            Volver a mis tareas
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={
              subiendo || enviando || !archivoEvidencia || !archivoReporte
            }
          >
            {subiendo
              ? "Subiendo..."
              : enviando
                ? "Enviando..."
                : "Enviar entrega"}
          </button>
        </div>
      </form>

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
