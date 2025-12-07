import { useEffect, useMemo, useState } from 'react';
import {
  dashboardService,
  type AnalisisTendenciasAuditor,
  type CumplimientoEntidadAuditor,
  type ResumenEjecutivoAuditor,
} from '../../lib/services';

type DistribucionEstado = {
  aTiempo: number;
  pendiente: number;
  vencido: number;
  total: number;
};

export default function AuditorDashboardClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resumen, setResumen] = useState<ResumenEjecutivoAuditor | null>(null);
  const [tendencias, setTendencias] = useState<AnalisisTendenciasAuditor | null>(null);
  const [cumplimientoEntidades, setCumplimientoEntidades] = useState<CumplimientoEntidadAuditor[]>([]);
  const [reportesEnviados, setReportesEnviados] = useState<number>(0);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dashboard, reportes] = await Promise.all([
        dashboardService.dashboardAuditor(),
        dashboardService.reportesAuditor().catch(() => []),
      ]);

      setResumen(dashboard?.resumenEjecutivo || null);
      setTendencias(dashboard?.analisisTendencias || null);
      setCumplimientoEntidades(dashboard?.cumplimientoPorEntidad || []);

      const enviadosDesdeDashboard = dashboard?.reportesEnviados?.length ?? 0;
      const enviadosDesdeEndpoint = Array.isArray(reportes) ? reportes.length : 0;
      setReportesEnviados(enviadosDesdeDashboard || enviadosDesdeEndpoint);
    } catch (err: any) {
      console.error('Error al cargar datos del auditor:', err);
      const message = err?.response?.data?.message || 'No se pudieron cargar los datos del dashboard';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const distribucionEstado: DistribucionEstado = useMemo(() => {
    const total = resumen?.totalObligaciones ?? 0;
    const cumplidas = resumen?.cumplidas ?? 0;
    const pendientes = resumen?.pendientes ?? 0;
    const vencidas = resumen?.vencidas ?? 0;

    return {
      aTiempo: cumplidas,
      pendiente: pendientes,
      vencido: vencidas,
      total,
    };
  }, [resumen]);

  const mesLabel = resumen ? `${resumen.nombreMes} ${resumen.anio}` : 'Mes actual';
  const variacionTexto =
    resumen?.variacionMensual !== undefined
      ? `${resumen.variacionMensual >= 0 ? '+' : '-'}${Math.abs(resumen.variacionMensual).toFixed(1)}% vs mes anterior`
      : null;

  const exportarInforme = () => {
    const encabezados = ['Entidad', 'Total', 'Cumplidas', 'Pendientes', 'Vencidas', '% Cumplimiento'];
    const rows = cumplimientoEntidades.map((e) => [
      e.entidad,
      e.totalObligaciones,
      e.cumplidas,
      e.pendientes,
      e.vencidas,
      e.porcentaje,
    ]);
    const csv = [encabezados.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard_auditor_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--neutral-600)' }}>Cargando dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: 'var(--error-red-600)' }}>{error}</p>
        <button onClick={cargarDatos} className="btn-primary" style={{ marginTop: '1rem' }}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-auditor">
      {/* Barra Superior */}
      <header className="dashboard-header-bar">
        <div className="header-left">
          <div className="period-filter">
            <label className="filter-label">Periodo:</label>
            <span className="filter-select" style={{ display: 'inline-flex', alignItems: 'center' }}>
              {mesLabel}
            </span>
          </div>
          {tendencias?.direccionTendencia && (
            <span style={{ color: 'var(--neutral-600)', fontSize: '0.9rem' }}>
              Tendencia: {tendencias.direccionTendencia.toLowerCase()}
            </span>
          )}
        </div>
        <div className="header-actions">
          <button className="btn-export" onClick={exportarInforme}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Exportar Informe
          </button>
        </div>
      </header>

      {/* KPIs Principales */}
      <section className="kpis-grid">
        <div className="kpi-card primary">
          <div className="kpi-icon">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div className="kpi-content">
            <h3 className="kpi-value">{(resumen?.porcentajeCumplimiento ?? 0).toFixed(1)}%</h3>
            <p className="kpi-label">Cumplimiento global</p>
            {variacionTexto && <small style={{ color: 'var(--neutral-600)' }}>{variacionTexto}</small>}
          </div>
        </div>

        <div className="kpi-card success">
          <div className="kpi-icon">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="kpi-content">
            <h3 className="kpi-value">{resumen?.cumplidas ?? 0}</h3>
            <p className="kpi-label">Obligaciones cumplidas</p>
            <small style={{ color: 'var(--neutral-600)' }}>Total mes: {resumen?.totalObligaciones ?? 0}</small>
            <small style={{ color: 'var(--neutral-600)' }}>Reportes enviados: {reportesEnviados}</small>
          </div>
        </div>

        <div className="kpi-card warning">
          <div className="kpi-icon">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="kpi-content">
            <h3 className="kpi-value">{resumen?.pendientes ?? 0}</h3>
            <p className="kpi-label">Pendientes del mes</p>
            <small style={{ color: 'var(--neutral-600)' }}>En proceso o sin enviar</small>
          </div>
        </div>

        <div className="kpi-card danger">
          <div className="kpi-icon">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="kpi-content">
            <h3 className="kpi-value">{resumen?.vencidas ?? 0}</h3>
            <p className="kpi-label">Vencidas</p>
            <small style={{ color: 'var(--neutral-600)' }}>Reportes fuera de plazo</small>
          </div>
        </div>
      </section>

      {/* Grid de Secciones */}
      <div className="dashboard-grid">
        {/* Distribucion por Estado */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">Distribucion por estado</h2>
          </div>
          <div className="card-body">
            <div className="donut-chart-container">
              <svg viewBox="0 0 200 200" className="donut-chart">
                <circle cx="100" cy="100" r="80" fill="none" stroke="#e5e7eb" strokeWidth="40" />
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="40"
                  strokeDasharray={`${
                    distribucionEstado.total > 0 ? (distribucionEstado.aTiempo / distribucionEstado.total) * 502.4 : 0
                  } 502.4`}
                  transform="rotate(-90 100 100)"
                />
                <text x="100" y="95" textAnchor="middle" fontSize="32" fontWeight="700" fill="#111827">
                  {distribucionEstado.total}
                </text>
                <text x="100" y="115" textAnchor="middle" fontSize="14" fill="#6b7280">
                  Total
                </text>
              </svg>
            </div>
            <div className="legend-grid">
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#10b981' }}></span>
                <span>Cumplidas: {distribucionEstado.aTiempo}</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#f59e0b' }}></span>
                <span>Pendientes: {distribucionEstado.pendiente}</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#ef4444' }}></span>
                <span>Vencidas: {distribucionEstado.vencido}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cumplimiento por Entidad */}
        <div className="dashboard-card wide">
          <div className="card-header">
            <h2 className="card-title">Cumplimiento por entidad</h2>
            <p style={{ margin: 0, color: 'var(--neutral-500)', fontSize: '0.9rem' }}>
              Datos reales del backend ({cumplimientoEntidades.length} entidades con obligaciones activas)
            </p>
          </div>
          <div className="card-body">
            {cumplimientoEntidades.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--neutral-600)', padding: '1rem' }}>
                No hay obligaciones registradas para el periodo seleccionado.
              </p>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Entidad</th>
                      <th>Cumplidas</th>
                      <th>Pendientes</th>
                      <th>Vencidas</th>
                      <th>Total</th>
                      <th>% Cumplimiento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cumplimientoEntidades.map((e) => (
                      <tr key={e.entidadId}>
                        <td>
                          <strong>{e.entidad}</strong>
                        </td>
                        <td>
                          <span className="badge success">{e.cumplidas}</span>
                        </td>
                        <td>
                          <span className="badge warning">{e.pendientes}</span>
                        </td>
                        <td>
                          <span className="badge danger">{e.vencidas}</span>
                        </td>
                        <td>{e.totalObligaciones}</td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              background:
                                e.porcentaje >= 80
                                  ? 'var(--success-green-100)'
                                  : e.porcentaje >= 60
                                  ? 'var(--accent-orange-100)'
                                  : 'var(--error-red-100)',
                              color:
                                e.porcentaje >= 80
                                  ? 'var(--success-green-700)'
                                  : e.porcentaje >= 60
                                  ? 'var(--accent-orange-700)'
                                  : 'var(--error-red-700)',
                            }}
                          >
                            {e.porcentaje.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
