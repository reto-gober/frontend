import { useEffect, useMemo, useState } from "react";
import { flujoReportesService, type ReportePeriodo } from "../../lib/services";
import { ModalValidarReporte } from "../modales/ModalValidarReporte";

interface Props {
  reporteId: string;
}

export default function SupervisorReporteDetalleClient({ reporteId }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodos, setPeriodos] = useState<ReportePeriodo[]>([]);
  const [modalValidar, setModalValidar] = useState<{
    open: boolean;
    periodo: ReportePeriodo | null;
  }>({ open: false, periodo: null });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await flujoReportesService.supervisionSupervisor(0, 1000);
        const filtrados = data.content.filter((p) => p.reporteId === reporteId);
        setPeriodos(filtrados);
        if (filtrados.length === 0) {
          setError("No se encontraron entregas para este reporte.");
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || "Error al cargar el reporte.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [reporteId]);

  const headerInfo = useMemo(() => {
    if (periodos.length === 0) return null;
    const primero = periodos[0];
    return {
      nombre: primero.reporteNombre,
      entidad: primero.entidadNombre,
      responsable: primero.responsableElaboracion?.nombreCompleto,
      total: periodos.length,
    };
  }, [periodos]);

  const getEstadoBadge = (estado: string) => {
    const estados: Record<string, { clase: string; texto: string }> = {
      pendiente_revision: { clase: "pending", texto: "Pendiente Revisión" },
      PENDIENTE_REVISION: { clase: "pending", texto: "Pendiente Revisión" },
      pendiente_validacion: { clase: "pending", texto: "Pendiente Revisión" },
      PENDIENTE_VALIDACION: { clase: "pending", texto: "Pendiente Revisión" },
      en_revision: { clase: "warning", texto: "En Revisión" },
      EN_REVISION: { clase: "warning", texto: "En Revisión" },
      aprobado: { clase: "success", texto: "Aprobado" },
      APROBADO: { clase: "success", texto: "Aprobado" },
      corregir: { clase: "danger", texto: "Requiere Corrección" },
      CORREGIR: { clase: "danger", texto: "Requiere Corrección" },
      requiere_correccion: { clase: "danger", texto: "Requiere Corrección" },
      REQUIERE_CORRECCION: { clase: "danger", texto: "Requiere Corrección" },
      rechazado: { clase: "rejected", texto: "Rechazado" },
      RECHAZADO: { clase: "rejected", texto: "Rechazado" },
      enviado: { clase: "sent", texto: "Enviado a Entidad" },
      ENVIADO: { clase: "sent", texto: "Enviado a Entidad" },
    };
    return estados[estado] || { clase: "neutral", texto: estado };
  };

  const calcularDiasRestantes = (fechaVencimiento: string) => {
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diffTime = vencimiento.getTime() - hoy.getTime();
    const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let urgencia = "normal";
    if (dias < 0) urgencia = "vencido";
    else if (dias === 0) urgencia = "hoy";
    else if (dias <= 3) urgencia = "urgente";
    else if (dias <= 7) urgencia = "proximo";

    return { dias, urgencia };
  };

  const formatearFechaCorta = (fecha: string): string => {
    return new Date(fecha).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
    });
  };

  const ordenados = [...periodos].sort(
    (a, b) =>
      new Date(a.fechaVencimientoCalculada).getTime() -
      new Date(b.fechaVencimientoCalculada).getTime()
  );

  if (loading) {
    return (
      <div className="detalle-page">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p className="loading-text">Cargando entregas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="detalle-page">
        <div className="empty-state">
          <p className="empty-text">{error}</p>
          <a className="btn-detalle" href="/roles/supervisor/reportes">
            Volver al listado
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="detalle-page">
      <div className="detalle-container">
        <div className="header">
          <div>
            <p className="breadcrumb">
              <a href="/roles/supervisor/reportes">Reportes</a> / Entregas del reporte
            </p>
            <h1>{headerInfo?.nombre || "Reporte"}</h1>
            <p className="sub">
              Entidad: {headerInfo?.entidad || "-"} · Responsable: {headerInfo?.responsable || "Sin asignar"} · {headerInfo?.total || 0} entrega{headerInfo?.total === 1 ? "" : "s"}
            </p>
          </div>
          <a className="btn-detalle" href="/roles/supervisor/reportes">
            ← Volver
          </a>
        </div>

        <div className="list">
          {ordenados.map((periodo) => {
            const { dias, urgencia } = calcularDiasRestantes(
              periodo.fechaVencimientoCalculada
            );
            const estadoBadge = getEstadoBadge(periodo.estado);
            const puedeValidar = [
              "pendiente_validacion",
              "PENDIENTE_VALIDACION",
              "pendiente_revision",
              "PENDIENTE_REVISION",
            ].includes(periodo.estado);

            return (
              <div key={periodo.periodoId} className="list-item">
                <div className="list-header">
                  <div className="list-title-section">
                    <div className="periodo-badge">
                      <span className="periodo-label">Período</span>
                      <h3 className="periodo-date">{periodo.periodoInicio}</h3>
                    </div>
                    <span className={`status-badge ${estadoBadge.clase}`}>
                      {estadoBadge.texto}
                    </span>
                  </div>
                </div>

                <div className="list-info-grid">
                  <div className="info-item">
                    <div className="info-icon calendar">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                    </div>
                    <div className="info-content">
                      <span className="info-label">Vencimiento</span>
                      <span className={`info-value ${urgencia}`}>
                        {urgencia === "vencido"
                          ? `Vencido hace ${Math.abs(dias)}d`
                          : urgencia === "hoy"
                            ? "Vence hoy"
                            : urgencia === "urgente"
                              ? `Vence en ${dias}d`
                              : `Vence ${formatearFechaCorta(periodo.fechaVencimientoCalculada)}`}
                      </span>
                    </div>
                  </div>

                  {typeof periodo.diasDesviacion === "number" && periodo.diasDesviacion !== 0 && (
                    <div className="info-item">
                      <div className="info-icon deviation">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="23 6 13.5 15.5 8 9.5 1 16"/>
                          <polyline points="17 6 23 6 23 12"/>
                        </svg>
                      </div>
                      <div className="info-content">
                        <span className="info-label">Desviación</span>
                        <span className={`info-value ${periodo.diasDesviacion > 0 ? "negativo" : "positivo"}`}>
                          {periodo.diasDesviacion > 0 ? "+" : ""}
                          {periodo.diasDesviacion} días
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="list-footer">
                  <div className="entidad-info">
                    <span className="entidad-icon">🏢</span>
                    <div>
                      <span className="entidad-label">{periodo.entidadNombre}</span>
                    </div>
                  </div>
                  <div className="actions">
                    {puedeValidar ? (
                      <button
                        className="btn-primary"
                        onClick={() => setModalValidar({ open: true, periodo })}
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 5v14M5 12h14"/>
                        </svg>
                        Revisar
                      </button>
                    ) : (
                      <a
                        className="btn-secondary"
                        href={`/roles/supervisor/reportes/${periodo.periodoId}`}
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                          <polyline points="10 17 15 12 10 7"/>
                          <line x1="15" y1="12" x2="3" y2="12"/>
                        </svg>
                        Ver detalle
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {modalValidar.open && modalValidar.periodo && (
        <ModalValidarReporte
          isOpen={modalValidar.open}
          onClose={() => setModalValidar({ open: false, periodo: null })}
          periodoId={modalValidar.periodo.periodoId}
          reporteNombre={modalValidar.periodo.reporteNombre}
          responsable={modalValidar.periodo.responsableElaboracion?.nombreCompleto || "Sin asignar"}
          onSuccess={() => setModalValidar({ open: false, periodo: null })}
          onError={() => setModalValidar({ open: false, periodo: null })}
        />
      )}

      <style>{`
        .detalle-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          padding: 2rem 1.5rem;
        }

        .detalle-container {
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          background: white;
          padding: 1.5rem;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
        }

        .breadcrumb {
          margin: 0 0 0.25rem 0;
          color: #94a3b8;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .breadcrumb a { color: #6366f1; text-decoration: none; }
        .breadcrumb a:hover { text-decoration: underline; }

        h1 { margin: 0; font-size: 1.5rem; color: #0f172a; }
        .sub { margin: 0.25rem 0 0; color: #64748b; font-weight: 500; }

        .list { display: flex; flex-direction: column; gap: 0.75rem; }

        .list-item {
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          transition: all 0.2s ease;
        }
        .list-item:hover {
          border-color: #cbd5e1;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
        }

        .list-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .list-title-section {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
        }

        .periodo-badge {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border: 1px solid #bae6fd;
          border-radius: 10px;
          padding: 0.75rem 1rem;
          display: flex;
          flex-direction: column;
          min-width: 120px;
        }

        .periodo-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #0284c7;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.25rem;
        }

        .periodo-date {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 700;
          color: #0f172a;
        }

        .status-badge {
          padding: 0.4rem 0.9rem;
          border-radius: 8px;
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: capitalize;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          color: #475569;
          white-space: nowrap;
        }
        .status-badge.pending { background: #fff7ed; color: #ea580c; border-color: #fed7aa; }
        .status-badge.warning { background: #fff7ed; color: #ea580c; border-color: #fed7aa; }
        .status-badge.success { background: #f0fdf4; color: #16a34a; border-color: #bbf7d0; }
        .status-badge.danger { background: #fef2f2; color: #dc2626; border-color: #fecdd3; }
        .status-badge.sent { background: #eff6ff; color: #2563eb; border-color: #bfdbfe; }
        .status-badge.rejected { background: #fef2f2; color: #dc2626; border-color: #fecdd3; }

        .list-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1rem;
          padding: 0.75rem 0;
          border-top: 1px solid #f1f5f9;
          border-bottom: 1px solid #f1f5f9;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .info-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .info-icon.calendar {
          background: #eff6ff;
          color: #0284c7;
        }

        .info-icon.deviation {
          background: #fef2f2;
          color: #dc2626;
        }

        .info-content {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          min-width: 0;
        }

        .info-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .info-value {
          font-size: 0.95rem;
          font-weight: 700;
          color: #0f172a;
          word-break: break-word;
        }
        .info-value.urgente { color: #ea580c; }
        .info-value.hoy { color: #dc2626; }
        .info-value.vencido { color: #dc2626; }
        .info-value.proximo { color: #0ea5e9; }
        .info-value.negativo { color: #dc2626; }
        .info-value.positivo { color: #16a34a; }

        .list-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .entidad-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #475569;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .entidad-icon {
          font-size: 1rem;
        }

        .entidad-label {
          color: #64748b;
        }

        .actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          padding: 0.65rem 1.1rem;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.25);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          white-space: nowrap;
        }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 10px 24px rgba(16,185,129,0.32); }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #f8fafc;
          color: #0f172a;
          border: 1px solid #e2e8f0;
          padding: 0.65rem 1.1rem;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.9rem;
          text-decoration: none;
          white-space: nowrap;
          transition: all 0.2s ease;
        }
        .btn-secondary:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }

        .btn-detalle {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: #f8fafc;
          color: #0f172a;
          border: 1px solid #e2e8f0;
          padding: 0.65rem 1rem;
          border-radius: 10px;
          font-weight: 700;
          text-decoration: none;
        }

        .loading-container { text-align: center; padding: 4rem 2rem; }
        .loading-spinner {
          width: 48px; height: 48px; border: 4px solid #e2e8f0; border-top-color: #10b981;
          border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1.5rem;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-text { color: #64748b; font-weight: 600; }

        .empty-state { text-align: center; padding: 3rem 2rem; color: #94a3b8; }
        .empty-text { font-weight: 700; margin-bottom: 1rem; }
      `}</style>
    </div>
  );
}
