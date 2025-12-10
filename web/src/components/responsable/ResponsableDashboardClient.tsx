import { useState, useEffect } from "react";
import { flujoReportesService, type ReportePeriodo } from "../../lib/services";
import {
  calcularDiasRestantes,
  esFechaVencida,
  formatearFecha,
} from "../../lib/utils/fechas";
import {
  esEstadoPendiente,
  esEstadoEnviado,
  normalizarEstado,
} from "../../lib/utils/estados";
import { usePendingTour } from "../../hooks/usePendingTour";

export default function ResponsableDashboardClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState("mensual");

  // Verificar tours pendientes después de navegación
  usePendingTour();

  const [kpis, setKpis] = useState({
    pendientes: 0,
    enviados: 0,
    vencidos: 0,
    porVencer: 0,
  });

  const [proximosVencimientos, setProximosVencimientos] = useState<any[]>([]);
  const [estadoReportes, setEstadoReportes] = useState({
    pendientes: 0,
    enProceso: 0,
    enviados: 0,
    total: 0,
  });

  const [sinPeriodos, setSinPeriodos] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [periodo]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      setSinPeriodos(false);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error(
          "No hay sesión activa. Por favor, inicia sesión nuevamente."
        );
      }

      const periodosResponse = await flujoReportesService.misPeriodos(0, 1000);

      if (!periodosResponse || !periodosResponse.content) {
        throw new Error(
          "La respuesta del servidor no tiene el formato esperado"
        );
      }

      const periodos = periodosResponse.content;

      if (periodos.length === 0) {
        setKpis({ pendientes: 0, enviados: 0, vencidos: 0, porVencer: 0 });
        setEstadoReportes({
          pendientes: 0,
          enProceso: 0,
          enviados: 0,
          total: 0,
        });
        setProximosVencimientos([]);
        setSinPeriodos(true);
        setLoading(false);
        return;
      }

      const pendientes = periodos.filter((p: any) =>
        esEstadoPendiente(p.estado)
      ).length;

      const enviados = periodos.filter((p: any) =>
        esEstadoEnviado(p.estado)
      ).length;

      const vencidos = periodos.filter((p: any) => {
        if (p.fechaVencimientoCalculada && !esEstadoEnviado(p.estado)) {
          return esFechaVencida(p.fechaVencimientoCalculada);
        }
        return false;
      }).length;

      const porVencer = periodos.filter((p: any) => {
        if (p.fechaVencimientoCalculada && !esEstadoEnviado(p.estado)) {
          const dias = calcularDiasRestantes(p.fechaVencimientoCalculada);
          return dias >= 0 && dias <= 3;
        }
        return false;
      }).length;

      setKpis({ pendientes, enviados, vencidos, porVencer });

      const enProceso = periodos.filter((p: any) => {
        const estado = normalizarEstado(p.estado);
        return estado === "en_elaboracion" || estado === "en_revision";
      }).length;

      setEstadoReportes({
        pendientes,
        enProceso,
        enviados,
        total: periodos.length,
      });

      const periodosConVencimiento = periodos
        .filter(
          (p: any) => p.fechaVencimientoCalculada && !esEstadoEnviado(p.estado)
        )
        .map((p: any) => {
          const diasRestantes = calcularDiasRestantes(
            p.fechaVencimientoCalculada
          );

          return {
            codigo: `PER-${p.periodoId.slice(0, 8)}`,
            nombre: p.reporteNombre,
            entidad: p.entidadNombre,
            fechaVencimiento: p.fechaVencimientoCalculada,
            diasRestantes: diasRestantes > 0 ? diasRestantes : 0,
            progreso: 0,
          };
        })
        .sort((a: any, b: any) => a.diasRestantes - b.diasRestantes)
        .slice(0, 5);

      setProximosVencimientos(periodosConVencimiento);
    } catch (err: any) {
      const mensajeError =
        err.response?.data?.message ||
        err.message ||
        "Error al cargar los datos";
      setError(mensajeError);
    } finally {
      setLoading(false);
    }
  };

  const formatFecha = (fecha: string) => {
    return formatearFecha(fecha);
  };

  const handleKpiClick = (filtro: string) => {
    window.location.href = `/roles/responsable/mis-reportes?filtro=${filtro}`;
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        <div className="loading-spinner" style={{ margin: "0 auto" }}></div>
        <p style={{ marginTop: "1rem", color: "var(--neutral-600)" }}>
          Cargando dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        <svg
          viewBox="0 0 24 24"
          width="48"
          height="48"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ margin: "0 auto", color: "var(--error-red-600)" }}
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p
          style={{
            color: "var(--error-red-600)",
            marginTop: "1rem",
            fontSize: "1.125rem",
          }}
        >
          {error}
        </p>
        <button
          onClick={cargarDatos}
          className="btn-primary"
          style={{ marginTop: "1rem" }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  const progresoEnviados = estadoReportes.total
    ? (estadoReportes.enviados / estadoReportes.total) * 502.4
    : 0;

  return (
    <div className="dashboard-responsable">
      {/* Barra Superior con Filtros */}
      <header className="dashboard-header-bar">
        <div className="header-left">
          <div className="period-filter">
            <label htmlFor="periodo-select" className="filter-label">
              Periodo:
            </label>
            <select
              id="periodo-select"
              className="filter-select"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
            >
              <option value="mensual">Mensual</option>
              <option value="trimestral">Trimestral</option>
              <option value="anual">Anual</option>
            </select>
          </div>
        </div>
      </header>

      {sinPeriodos ? (
        <div
          style={{
            textAlign: "center",
            padding: "4rem 2rem",
            background: "white",
            borderRadius: "12px",
            margin: "2rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="64"
            height="64"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            style={{ margin: "0 auto", color: "var(--neutral-400)" }}
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <h3
            style={{
              marginTop: "1.5rem",
              color: "var(--neutral-700)",
              fontSize: "1.25rem",
            }}
          >
            No tienes tareas asignadas
          </h3>
          <p
            style={{
              marginTop: "0.75rem",
              color: "var(--neutral-600)",
              maxWidth: "500px",
              margin: "0.75rem auto 0",
            }}
          >
            Actualmente no tienes periodos de reportes asignados. Contacta a tu
            supervisor o administrador para que te asignen tareas.
          </p>
        </div>
      ) : (
        <>
          {/* KPIs Principales */}
          <section className="kpis-grid">
            <div
              className="kpi-card neutral"
              onClick={() => handleKpiClick("pendientes")}
              style={{ cursor: "pointer" }}
            >
              <div className="kpi-icon">
                <svg
                  viewBox="0 0 24 24"
                  width="32"
                  height="32"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div className="kpi-content">
                <h3 className="kpi-value">{kpis.pendientes}</h3>
                <p className="kpi-label">Pendientes</p>
              </div>
            </div>

            <div
              className="kpi-card success"
              onClick={() => handleKpiClick("enviados")}
              style={{ cursor: "pointer" }}
            >
              <div className="kpi-icon">
                <svg
                  viewBox="0 0 24 24"
                  width="32"
                  height="32"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="kpi-content">
                <h3 className="kpi-value">{kpis.enviados}</h3>
                <p className="kpi-label">Enviados</p>
              </div>
            </div>

            <div
              className="kpi-card danger"
              onClick={() => handleKpiClick("vencidos")}
              style={{ cursor: "pointer" }}
            >
              <div className="kpi-icon">
                <svg
                  viewBox="0 0 24 24"
                  width="32"
                  height="32"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <div className="kpi-content">
                <h3 className="kpi-value">{kpis.vencidos}</h3>
                <p className="kpi-label">Vencidos</p>
              </div>
            </div>

            <div
              className="kpi-card warning"
              onClick={() => handleKpiClick("porVencer")}
              style={{ cursor: "pointer" }}
            >
              <div className="kpi-icon">
                <svg
                  viewBox="0 0 24 24"
                  width="32"
                  height="32"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="kpi-content">
                <h3 className="kpi-value">{kpis.porVencer}</h3>
                <p className="kpi-label">Por Vencer (3 días)</p>
              </div>
            </div>
          </section>

          {/* Grid de Secciones */}
          <div className="dashboard-grid">
            {/* Estado de Reportes */}
            <div className="dashboard-card">
              <div className="card-header">
                <h2 className="card-title">Estado de Reportes</h2>
              </div>
              <div className="card-body">
                <div className="donut-chart-container">
                  <svg viewBox="0 0 200 200" className="donut-chart">
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="40"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="40"
                      strokeDasharray={`${progresoEnviados} 502.4`}
                      transform="rotate(-90 100 100)"
                    />
                    <text
                      x="100"
                      y="95"
                      textAnchor="middle"
                      fontSize="32"
                      fontWeight="700"
                      fill="#111827"
                    >
                      {estadoReportes.total}
                    </text>
                    <text
                      x="100"
                      y="115"
                      textAnchor="middle"
                      fontSize="14"
                      fill="#6b7280"
                    >
                      Total
                    </text>
                  </svg>
                </div>
                <div className="legend-grid">
                  <div className="legend-item">
                    <span
                      className="legend-dot"
                      style={{ background: "#6b7280" }}
                    ></span>
                    <span>Pendientes: {estadoReportes.pendientes}</span>
                  </div>
                  <div className="legend-item">
                    <span
                      className="legend-dot"
                      style={{ background: "#3b82f6" }}
                    ></span>
                    <span>En Proceso: {estadoReportes.enProceso}</span>
                  </div>
                  <div className="legend-item">
                    <span
                      className="legend-dot"
                      style={{ background: "#10b981" }}
                    ></span>
                    <span>Enviados: {estadoReportes.enviados}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Próximos Vencimientos */}
            <div className="dashboard-card wide">
              <div className="card-header">
                <h2 className="card-title">Próximos Vencimientos</h2>
                <a href="/roles/responsable/mis-reportes" className="card-link">
                  Ver todos →
                </a>
              </div>
              <div className="card-body">
                {proximosVencimientos.length === 0 ? (
                  <p
                    style={{
                      textAlign: "center",
                      color: "var(--neutral-500)",
                      padding: "2rem",
                    }}
                  >
                    No hay reportes próximos a vencer
                  </p>
                ) : (
                  <div className="vencimientos-list">
                    {proximosVencimientos.map((reporte, idx) => (
                      <div key={idx} className="vencimiento-item">
                        <div className="vencimiento-info">
                          <div className="vencimiento-header">
                            <span className="vencimiento-codigo">
                              {reporte.codigo}
                            </span>
                            <span
                              className={`dias-badge ${
                                reporte.diasRestantes <= 3 ? "urgent" : "normal"
                              }`}
                            >
                              {reporte.diasRestantes} días
                            </span>
                          </div>
                          <h4 className="vencimiento-nombre">
                            {reporte.nombre}
                          </h4>
                          <p className="vencimiento-meta">
                            <span className="entidad-badge">
                              {reporte.entidad}
                            </span>
                            <span>
                              Vence: {formatFecha(reporte.fechaVencimiento)}
                            </span>
                          </p>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${reporte.progreso}%` }}
                          ></div>
                        </div>
                        <span className="progress-label">
                          {reporte.progreso}% completado
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
