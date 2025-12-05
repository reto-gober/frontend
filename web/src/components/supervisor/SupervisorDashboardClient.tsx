import { useState, useEffect } from 'react';
import { dashboardService, type DashboardSupervisorResponse, type CargaResponsable, type DistribucionEntidad } from '../../lib/services';

export default function SupervisorDashboardClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState('mensual');
  
  // Estado para datos del dashboard
  const [dashboardData, setDashboardData] = useState<DashboardSupervisorResponse | null>(null);

  useEffect(() => {
    cargarDatos();
  }, [periodo]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);

      // Llamar al endpoint real del dashboard supervisor
      const data = await dashboardService.dashboardSupervisor();
      setDashboardData(data);

    } catch (err: any) {
      console.error('Error al cargar datos del supervisor:', err);
      setError(err.response?.data?.message || 'Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Calcular totales desde estadoGeneral
  const calcularTotalReportes = (): number => {
    if (!dashboardData?.estadoGeneral) return 0;
    return Object.values(dashboardData.estadoGeneral).reduce((acc, val) => acc + val, 0);
  };

  const calcularAprobados = (): number => {
    if (!dashboardData?.estadoGeneral) return 0;
    return (dashboardData.estadoGeneral['aprobado'] || 0) + (dashboardData.estadoGeneral['enviado'] || 0);
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

  const kpis = dashboardData?.kpis || {
    reportesEnRevision: 0,
    reportesRequierenCorreccion: 0,
    reportesPendientes: 0,
    reportesAtrasados: 0
  };

  const estadoGeneral = dashboardData?.estadoGeneral || {};
  const cargaResponsables = dashboardData?.cargaPorResponsable || [];
  const totalReportes = calcularTotalReportes();
  const aprobados = calcularAprobados();

  return (
    <div className="dashboard-supervisor">
      {/* Barra Superior con Filtros */}
      <header className="dashboard-header-bar">
        <div className="header-left">
          <div className="period-filter">
            <label htmlFor="periodo-select" className="filter-label">Periodo:</label>
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
        <div className="header-actions">
          <a href="/roles/supervisor/reportes" className="btn-review">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            Revisar Reportes
          </a>
        </div>
      </header>

      {/* KPIs Principales */}
      <section className="kpis-grid">
        <div className="kpi-card primary">
          <div className="kpi-icon">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <div className="kpi-content">
            <h3 className="kpi-value">{kpis.reportesEnRevision}</h3>
            <p className="kpi-label">En Revisión</p>
          </div>
        </div>

        <div className="kpi-card warning">
          <div className="kpi-icon">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M12 8v4"/>
              <path d="M12 16h.01"/>
            </svg>
          </div>
          <div className="kpi-content">
            <h3 className="kpi-value">{kpis.reportesRequierenCorreccion}</h3>
            <p className="kpi-label">Requieren Corrección</p>
          </div>
        </div>

        <div className="kpi-card info">
          <div className="kpi-icon">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 11 12 14 22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </div>
          <div className="kpi-content">
            <h3 className="kpi-value">{kpis.reportesPendientes}</h3>
            <p className="kpi-label">Pendientes Validación</p>
          </div>
        </div>

        <div className="kpi-card danger">
          <div className="kpi-icon">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div className="kpi-content">
            <h3 className="kpi-value">{kpis.reportesAtrasados}</h3>
            <p className="kpi-label">Atrasados</p>
          </div>
        </div>
      </section>

      {/* Grid de Secciones */}
      <div className="dashboard-grid">
        {/* Estado General de Reportes */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">Estado General</h2>
          </div>
          <div className="card-body">
            <div className="donut-chart-container">
              <svg viewBox="0 0 200 200" className="donut-chart">
                <circle cx="100" cy="100" r="80" fill="none" stroke="#e5e7eb" strokeWidth="40"/>
                <circle 
                  cx="100" 
                  cy="100" 
                  r="80" 
                  fill="none" 
                  stroke="#10b981" 
                  strokeWidth="40"
                  strokeDasharray={`${totalReportes > 0 ? (aprobados / totalReportes) * 502.4 : 0} 502.4`}
                  transform="rotate(-90 100 100)"
                />
                <text x="100" y="95" textAnchor="middle" fontSize="32" fontWeight="700" fill="#111827">
                  {totalReportes}
                </text>
                <text x="100" y="115" textAnchor="middle" fontSize="14" fill="#6b7280">
                  Total
                </text>
              </svg>
            </div>
            <div className="legend-grid">
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#6b7280' }}></span>
                <span>Pendiente: {estadoGeneral['pendiente_validacion'] || estadoGeneral['pendiente'] || 0}</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#3b82f6' }}></span>
                <span>En Revisión: {estadoGeneral['en_revision'] || 0}</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#f59e0b' }}></span>
                <span>En Corrección: {estadoGeneral['requiere_correccion'] || 0}</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#10b981' }}></span>
                <span>Aprobado: {estadoGeneral['aprobado'] || 0}</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#8b5cf6' }}></span>
                <span>Enviado: {estadoGeneral['enviado'] || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Carga de Trabajo por Responsable */}
        <div className="dashboard-card wide">
          <div className="card-header">
            <h2 className="card-title">Carga de Trabajo por Responsable</h2>
          </div>
          <div className="card-body">
            {cargaResponsables.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--neutral-500)', padding: '2rem' }}>
                No hay responsables con reportes asignados
              </p>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Responsable</th>
                      <th>Total</th>
                      <th>Pendiente</th>
                      <th>En Revisión</th>
                      <th>Aprobado</th>
                      <th>Atrasado</th>
                      <th>Cumplimiento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cargaResponsables.map((resp: CargaResponsable) => (
                      <tr key={resp.responsableId}>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <strong>{resp.nombreCompleto}</strong>
                            <small style={{ color: 'var(--neutral-500)' }}>{resp.email}</small>
                          </div>
                        </td>
                        <td>{resp.totalReportes}</td>
                        <td>
                          <span className="badge neutral">{resp.pendientes}</span>
                        </td>
                        <td>
                          <span className="badge info">{resp.enRevision}</span>
                        </td>
                        <td>
                          <span className="badge success">{resp.aprobados}</span>
                        </td>
                        <td>
                          <span className="badge danger">{resp.atrasados}</span>
                        </td>
                        <td>
                          <div className="progress-bar-small">
                            <div 
                              className="progress-fill-small" 
                              style={{ 
                                width: `${resp.porcentajeCumplimiento}%`,
                                background: resp.porcentajeCumplimiento >= 80 ? '#10b981' : 
                                           resp.porcentajeCumplimiento >= 50 ? '#f59e0b' : '#ef4444'
                              }}
                            ></div>
                          </div>
                          <span className="progress-label-small">{resp.porcentajeCumplimiento.toFixed(0)}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Distribución por Entidad */}
        {dashboardData?.distribucionPorEntidad && dashboardData.distribucionPorEntidad.length > 0 && (
          <div className="dashboard-card wide">
            <div className="card-header">
              <h2 className="card-title">Distribución por Entidad</h2>
            </div>
            <div className="card-body">
              <div className="entidades-grid" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                gap: '1rem' 
              }}>
                {dashboardData.distribucionPorEntidad.map((entidad: DistribucionEntidad) => (
                  <div key={entidad.entidadId} className="entidad-card" style={{
                    background: 'var(--neutral-50)',
                    borderRadius: '8px',
                    padding: '1rem',
                    border: '1px solid var(--neutral-200)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span className="badge entity" style={{ 
                        background: 'var(--primary-100)', 
                        color: 'var(--primary-700)',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontWeight: 600
                      }}>
                        {entidad.sigla}
                      </span>
                      <span style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: 700,
                        color: entidad.porcentajeCumplimiento >= 80 ? '#10b981' : 
                               entidad.porcentajeCumplimiento >= 50 ? '#f59e0b' : '#ef4444'
                      }}>
                        {entidad.porcentajeCumplimiento.toFixed(0)}%
                      </span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--neutral-600)', marginBottom: '0.75rem' }}>
                      {entidad.nombreEntidad}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>
                        Total: {entidad.totalReportes}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#10b981' }}>
                        ✓ {entidad.aprobados}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>
                        ⏳ {entidad.pendientes}
                      </span>
                      {entidad.atrasados > 0 && (
                        <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>
                          ⚠ {entidad.atrasados}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}