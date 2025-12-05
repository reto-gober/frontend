import { useState, useEffect } from 'react';
import { reportesService, usuariosService, entidadesService } from '../../lib/services';

export default function SupervisorDashboardClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState('mensual');
  
  // Estados para datos
  const [kpis, setKpis] = useState({
    enRevision: 0,
    enCorreccion: 0,
    pendientesRevision: 0,
    atrasados: 0
  });
  const [estadoReportes, setEstadoReportes] = useState({
    pendiente: 0,
    enRevision: 0,
    enCorreccion: 0,
    aprobado: 0,
    atrasado: 0,
    total: 0
  });
  const [cargaResponsables, setCargaResponsables] = useState<any[]>([]);

  useEffect(() => {
    cargarDatos();
  }, [periodo]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar datos en paralelo
      const [reportesData, usuariosData] = await Promise.all([
        reportesService.listar(0, 1000),
        usuariosService.listar(0, 100)
      ]);

      const reportes = reportesData.content;
      const usuarios = usuariosData.content;
      const ahora = new Date();

      // Calcular KPIs
      const enRevision = reportes.filter(r => r.estado === 'EN_REVISION').length;
      const enCorreccion = reportes.filter(r => r.estado === 'REQUIERE_CORRECCION').length;
      const pendientesRevision = reportes.filter(r => r.estado === 'ENVIADO').length;
      const atrasados = reportes.filter(r => {
        if (r.fechaVencimiento && r.estado !== 'COMPLETADO' && r.estado !== 'APROBADO') {
          return new Date(r.fechaVencimiento) < ahora;
        }
        return false;
      }).length;

      setKpis({ enRevision, enCorreccion, pendientesRevision, atrasados });

      // Estado general de reportes
      const pendiente = reportes.filter(r => 
        r.estado === 'PENDIENTE' || r.estado === 'NO_INICIADO'
      ).length;
      const aprobado = reportes.filter(r => 
        r.estado === 'COMPLETADO' || r.estado === 'APROBADO'
      ).length;

      setEstadoReportes({
        pendiente,
        enRevision,
        enCorreccion,
        aprobado,
        atrasado: atrasados,
        total: reportes.length
      });

      // Carga de trabajo por responsable (usuarios con rol responsable)
      const responsables = usuarios.filter(u => u.roles?.includes('responsable'));
      const cargaPorResponsable = responsables.map(responsable => {
        // Filtrar reportes por responsable (en producción se usaría responsableElaboracionIds)
        const reportesResponsable = reportes.filter(r => 
          r.responsableElaboracionIds?.includes(responsable.usuarioId)
        );
        
        const totalResponsable = reportesResponsable.length;
        const pendienteResponsable = reportesResponsable.filter(r => 
          r.estado === 'PENDIENTE' || r.estado === 'NO_INICIADO'
        ).length;
        const enRevisionResponsable = reportesResponsable.filter(r => 
          r.estado === 'EN_REVISION'
        ).length;
        const atrasadoResponsable = reportesResponsable.filter(r => {
          if (r.fechaVencimiento && r.estado !== 'COMPLETADO' && r.estado !== 'APROBADO') {
            return new Date(r.fechaVencimiento) < ahora;
          }
          return false;
        }).length;

        return {
          nombre: `${responsable.firstName} ${responsable.firstLastname}`,
          total: totalResponsable,
          pendiente: pendienteResponsable,
          enRevision: enRevisionResponsable,
          atrasado: atrasadoResponsable
        };
      }).filter(r => r.total > 0).slice(0, 5);

      setCargaResponsables(cargaPorResponsable);

    } catch (err) {
      console.error('Error al cargar datos del supervisor:', err);
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
          <button className="btn-review">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            Revisar Reportes
          </button>
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
            <h3 className="kpi-value">{kpis.enRevision}</h3>
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
            <h3 className="kpi-value">{kpis.enCorreccion}</h3>
            <p className="kpi-label">En Corrección</p>
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
            <h3 className="kpi-value">{kpis.pendientesRevision}</h3>
            <p className="kpi-label">Pendientes de Revisión</p>
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
            <h3 className="kpi-value">{kpis.atrasados}</h3>
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
                  strokeDasharray={`${(estadoReportes.aprobado / estadoReportes.total) * 502.4} 502.4`}
                  transform="rotate(-90 100 100)"
                />
                <text x="100" y="95" textAnchor="middle" fontSize="32" fontWeight="700" fill="#111827">
                  {estadoReportes.total}
                </text>
                <text x="100" y="115" textAnchor="middle" fontSize="14" fill="#6b7280">
                  Total
                </text>
              </svg>
            </div>
            <div className="legend-grid">
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#6b7280' }}></span>
                <span>Pendiente: {estadoReportes.pendiente}</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#3b82f6' }}></span>
                <span>En Revisión: {estadoReportes.enRevision}</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#f59e0b' }}></span>
                <span>En Corrección: {estadoReportes.enCorreccion}</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#10b981' }}></span>
                <span>Aprobado: {estadoReportes.aprobado}</span>
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
                      <th>Atrasado</th>
                      <th>Carga</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cargaResponsables.map((resp, idx) => {
                      const porcentajeCarga = resp.total > 0 
                        ? Math.round(((resp.pendiente + resp.enRevision) / resp.total) * 100)
                        : 0;
                      
                      return (
                        <tr key={idx}>
                          <td><strong>{resp.nombre}</strong></td>
                          <td>{resp.total}</td>
                          <td>
                            <span className="badge neutral">{resp.pendiente}</span>
                          </td>
                          <td>
                            <span className="badge info">{resp.enRevision}</span>
                          </td>
                          <td>
                            <span className="badge danger">{resp.atrasado}</span>
                          </td>
                          <td>
                            <div className="progress-bar-small">
                              <div 
                                className="progress-fill-small" 
                                style={{ 
                                  width: `${porcentajeCarga}%`,
                                  background: porcentajeCarga > 80 ? '#ef4444' : porcentajeCarga > 50 ? '#f59e0b' : '#10b981'
                                }}
                              ></div>
                            </div>
                            <span className="progress-label-small">{porcentajeCarga}%</span>
                          </td>
                        </tr>
                      );
                    })}
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
