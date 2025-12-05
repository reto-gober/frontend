import { useState, useEffect } from 'react';
import { dashboardService, entidadesService, reportesService } from '../../lib/services';

export default function AuditorDashboardClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState('mensual');
  
  // Estados para datos
  const [kpis, setKpis] = useState({
    cumplimientoGlobal: 0,
    reportesEnviados: 0,
    reportesTarde: 0,
    reportesVencidos: 0
  });
  const [cumplimientoEntidades, setCumplimientoEntidades] = useState<any[]>([]);
  const [distribucionEstado, setDistribucionEstado] = useState({
    aTiempo: 0,
    tarde: 0,
    vencido: 0,
    total: 0
  });

  useEffect(() => {
    cargarDatos();
  }, [periodo]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar datos en paralelo
      const [entidadesData, reportesData] = await Promise.all([
        entidadesService.listar(0, 100),
        reportesService.listar(0, 1000)
      ]);

      const reportes = reportesData.content;
      const ahora = new Date();

      // Calcular KPIs
      const reportesEnviados = reportes.filter(r => r.estado === 'COMPLETADO' || r.estado === 'ENVIADO').length;
      const reportesTarde = 0; // No hay campo fechaEnvio en la API
      const reportesVencidos = reportes.filter(r => {
        if (r.fechaVencimiento && r.estado !== 'COMPLETADO' && r.estado !== 'ENVIADO') {
          return new Date(r.fechaVencimiento) < ahora;
        }
        return false;
      }).length;
      const cumplimientoGlobal = reportes.length > 0 
        ? Math.round((reportesEnviados / reportes.length) * 100)
        : 0;

      setKpis({
        cumplimientoGlobal,
        reportesEnviados,
        reportesTarde,
        reportesVencidos
      });

      // Distribución por estado
      const aTiempo = reportes.filter(r => r.estado === 'COMPLETADO' || r.estado === 'ENVIADO').length;

      setDistribucionEstado({
        aTiempo,
        tarde: reportesTarde,
        vencido: reportesVencidos,
        total: reportes.length
      });

      // Cumplimiento por entidad
      const cumplimientoPorEntidad = entidadesData.content.map(entidad => {
        const reportesEntidad = reportes.filter(r => r.entidadId === entidad.entidadId);
        const aTiempoEntidad = reportesEntidad.filter(r => 
          r.estado === 'COMPLETADO' || r.estado === 'ENVIADO'
        ).length;
        const tardeEntidad = 0; // No hay campo fechaEnvio
        const vencidoEntidad = reportesEntidad.filter(r => {
          if (r.fechaVencimiento && r.estado !== 'COMPLETADO' && r.estado !== 'ENVIADO') {
            return new Date(r.fechaVencimiento) < ahora;
          }
          return false;
        }).length;

        return {
          entidad: entidad.nombre,
          aTiempo: reportesEntidad.length > 0 ? Math.round((aTiempoEntidad / reportesEntidad.length) * 100) : 0,
          tarde: reportesEntidad.length > 0 ? Math.round((tardeEntidad / reportesEntidad.length) * 100) : 0,
          vencido: reportesEntidad.length > 0 ? Math.round((vencidoEntidad / reportesEntidad.length) * 100) : 0,
          total: reportesEntidad.length
        };
      }).filter(e => e.total > 0);

      setCumplimientoEntidades(cumplimientoPorEntidad);

    } catch (err) {
      console.error('Error al cargar datos del auditor:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
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
          <button className="btn-export">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
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
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div className="kpi-content">
            <h3 className="kpi-value">{kpis.cumplimientoGlobal}%</h3>
            <p className="kpi-label">Cumplimiento Global</p>
          </div>
        </div>

        <div className="kpi-card success">
          <div className="kpi-icon">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div className="kpi-content">
            <h3 className="kpi-value">{kpis.reportesEnviados}</h3>
            <p className="kpi-label">Reportes Enviados</p>
          </div>
        </div>

        <div className="kpi-card warning">
          <div className="kpi-icon">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div className="kpi-content">
            <h3 className="kpi-value">{kpis.reportesTarde}</h3>
            <p className="kpi-label">Reportes Tarde</p>
          </div>
        </div>

        <div className="kpi-card danger">
          <div className="kpi-icon">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div className="kpi-content">
            <h3 className="kpi-value">{kpis.reportesVencidos}</h3>
            <p className="kpi-label">Reportes Vencidos</p>
          </div>
        </div>
      </section>

      {/* Grid de Secciones */}
      <div className="dashboard-grid">
        {/* Distribución por Estado */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">Distribución por Estado</h2>
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
                  strokeDasharray={`${(distribucionEstado.aTiempo / distribucionEstado.total) * 502.4} 502.4`}
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
                <span>A tiempo: {distribucionEstado.aTiempo}</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#f59e0b' }}></span>
                <span>Tarde: {distribucionEstado.tarde}</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#ef4444' }}></span>
                <span>Vencido: {distribucionEstado.vencido}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cumplimiento por Entidad */}
        <div className="dashboard-card wide">
          <div className="card-header">
            <h2 className="card-title">Cumplimiento por Entidad</h2>
          </div>
          <div className="card-body">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Entidad</th>
                    <th>A Tiempo</th>
                    <th>Tarde</th>
                    <th>Vencido</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cumplimientoEntidades.map((e, idx) => (
                    <tr key={idx}>
                      <td><strong>{e.entidad}</strong></td>
                      <td>
                        <span className="badge success">{e.aTiempo}%</span>
                      </td>
                      <td>
                        <span className="badge warning">{e.tarde}%</span>
                      </td>
                      <td>
                        <span className="badge danger">{e.vencido}%</span>
                      </td>
                      <td>{e.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
