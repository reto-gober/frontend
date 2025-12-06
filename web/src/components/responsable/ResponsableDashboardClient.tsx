import { useState, useEffect } from "react";
import {
  reportesService,
  flujoReportesService,
  type ReporteResponse,
} from "../../lib/services";

export default function ResponsableDashboardClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState("mensual");

  // Estados para datos
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

  useEffect(() => {
    cargarDatos();
  }, [periodo]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener el ID del usuario actual (en producción vendría del contexto de autenticación)
      // Por ahora cargamos todos los reportes y filtramos después
      const reportesData = await reportesService.listar(0, 1000);
      const reportes = reportesData.content;
      const ahora = new Date();
      const tresDias = new Date(ahora.getTime() + 3 * 24 * 60 * 60 * 1000);

      // Calcular KPIs basados en periodos del flujo de reportes
      const periodosResponse = await flujoReportesService.misPeriodos(0, 1000);
      const periodos = periodosResponse.content;

      const pendientes = periodos.filter(
        (p) =>
          p.estado === "pendiente" ||
          p.estado === "en_elaboracion" ||
          p.estado === "requiere_correccion"
      ).length;

      const enviados = periodos.filter(
        (p) =>
          p.estado === "enviado_a_tiempo" ||
          p.estado === "enviado_tarde" ||
          p.estado === "aprobado"
      ).length;

      const vencidos = periodos.filter((p) => {
        if (
          p.fechaVencimientoCalculada &&
          p.estado !== "aprobado" &&
          p.estado !== "enviado_a_tiempo" &&
          p.estado !== "enviado_tarde"
        ) {
          return new Date(p.fechaVencimientoCalculada) < ahora;
        }
        return false;
      }).length;

      const porVencer = periodos.filter((p) => {
        if (
          p.fechaVencimientoCalculada &&
          p.estado !== "aprobado" &&
          p.estado !== "enviado_a_tiempo" &&
          p.estado !== "enviado_tarde"
        ) {
          const fechaVenc = new Date(p.fechaVencimientoCalculada);
          return fechaVenc >= ahora && fechaVenc <= tresDias;
        }
        return false;
      }).length;

      setKpis({ pendientes, enviados, vencidos, porVencer });

      // Estado de reportes para gráfica basado en periodos
      const enProceso = periodos.filter(
        (p) => p.estado === "en_elaboracion" || p.estado === "en_revision"
      ).length;

      setEstadoReportes({
        pendientes,
        enProceso,
        enviados,
        total: periodos.length,
      });

      // Próximos vencimientos (ordenar por fecha más cercana)
      const periodosConVencimiento = periodos
        .filter(
          (p) =>
            p.fechaVencimientoCalculada &&
            p.estado !== "aprobado" &&
            p.estado !== "enviado_a_tiempo" &&
            p.estado !== "enviado_tarde"
        )
        .map((p) => {
          const fechaVenc = new Date(p.fechaVencimientoCalculada);
          const diasRestantes = Math.ceil(
            (fechaVenc.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24)
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
        .sort((a, b) => a.diasRestantes - b.diasRestantes)
        .slice(0, 5);

      setProximosVencimientos(periodosConVencimiento);
    } catch (err) {
      console.error("Error al cargar datos del responsable:", err);
      setError("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
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
        <p style={{ color: "var(--error-red-600)" }}>{error}</p>
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
                  strokeDasharray={`${(estadoReportes.enviados / estadoReportes.total) * 502.4} 502.4`}
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
                          className={`dias-badge ${reporte.diasRestantes <= 3 ? "urgent" : "normal"}`}
                        >
                          {reporte.diasRestantes} días
                        </span>
                      </div>
                      <h4 className="vencimiento-nombre">{reporte.nombre}</h4>
                      <p className="vencimiento-meta">
                        <span className="entidad-badge">{reporte.entidad}</span>
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
    </div>
  );
}
