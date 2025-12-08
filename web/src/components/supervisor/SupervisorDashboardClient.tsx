import { useEffect, useMemo, useState } from 'react';
import {
  dashboardService,
  type AccionPendienteSupervisor,
  type CargaResponsable,
  type DashboardSupervisorResponse,
  type DistribucionEntidad,
} from '../../lib/services';

type SortKey = 'nombre' | 'cumplimiento' | 'vencidos' | 'retraso';

const estadoColores: Record<string, string> = {
  a_tiempo: '#10b981',
  tarde: '#f59e0b',
  vencido: '#ef4444',
  pendiente: '#6b7280',
  proximos: '#3b82f6',
};

export default function SupervisorDashboardClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardSupervisorResponse | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState({
    entidadId: '',
    responsableId: '',
    frecuencia: '',
    estado: '',
    tipoAlerta: '',
    fechaInicio: '',
    fechaFin: '',
    vistaTemporal: 'mensual',
    limitePeriodos: 6,
  });
  const [sortKey, setSortKey] = useState<SortKey>('nombre');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const activeFiltersCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'vistaTemporal') return false;
      if (key === 'limitePeriodos') return value !== 6;
      return Boolean(value);
    }).length;
  }, [filters]);

  useEffect(() => {
    cargarDatos();
  }, [
    filters.entidadId,
    filters.responsableId,
    filters.frecuencia,
    filters.estado,
    filters.tipoAlerta,
    filters.fechaInicio,
    filters.fechaFin,
    filters.vistaTemporal,
    filters.limitePeriodos,
  ]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await dashboardService.dashboardSupervisor({
        ...filters,
        limitePeriodos: filters.limitePeriodos,
      });
      setDashboardData(data);
    } catch (err: any) {
      console.error('Error al cargar datos del supervisor:', err);
      setError(err.response?.data?.message || 'Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const kpis = dashboardData?.kpis || {
    reportesEnRevision: 0,
    reportesRequierenCorreccion: 0,
    reportesPendientes: 0,
    reportesAtrasados: 0,
    porcentajeCumplimientoATiempo: 0,
    totalEnviadosATiempo: 0,
    totalEnviadosTarde: 0,
    totalVencidos: 0,
    totalPendientes: 0,
    diasRetrasoPromedio: 0,
    porcentajeCumplimientoAnterior: 0,
    deltaPorcentajeCumplimiento: 0,
    diasRetrasoPromedioAnterior: 0,
    deltaDiasRetrasoPromedio: 0,
    totalProximosVencer: 0,
  };

  const estadoGeneral = dashboardData?.estadoGeneral || {};
  const distribucionEstados = dashboardData?.distribucionEstados || {};
  const baseDistribucion = Object.keys(distribucionEstados).length > 0 ? distribucionEstados : {
    a_tiempo: (estadoGeneral['enviado_a_tiempo'] || 0) + (estadoGeneral['aprobado'] || 0),
    tarde: estadoGeneral['enviado_tarde'] || 0,
    vencido: estadoGeneral['vencido'] || 0,
    pendiente: (estadoGeneral['pendiente_validacion'] || estadoGeneral['pendiente'] || 0),
    proximos: 0,
  };
  const totalDistribucion = Object.values(baseDistribucion).reduce((acc, val) => acc + val, 0);
  const cargaResponsables = dashboardData?.cargaPorResponsable || [];
  const distribucionEntidades = dashboardData?.distribucionPorEntidad || [];
  const acciones: AccionPendienteSupervisor[] = dashboardData?.accionesPendientes || [];

  const sortedResponsables = useMemo(() => {
    return [...cargaResponsables].sort((a, b) => {
      const direction = sortDir === 'asc' ? 1 : -1;
      switch (sortKey) {
        case 'cumplimiento':
          return ((a.porcentajeCumplimiento || 0) - (b.porcentajeCumplimiento || 0)) * direction;
        case 'vencidos':
          return ((a.vencidos || 0) - (b.vencidos || 0)) * direction;
        case 'retraso':
          return ((a.retrasoPromedio || 0) - (b.retrasoPromedio || 0)) * direction;
        default:
          return (a.nombreCompleto || '').localeCompare(b.nombreCompleto || '') * direction;
      }
    });
  }, [cargaResponsables, sortKey, sortDir]);

  const handleSegmentClick = (estado: string) => {
    setFilters((prev) => ({ ...prev, estado }));
  };

  const handleFilterChange = (key: keyof typeof filters, value: string | number) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
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
      <header className="dashboard-header-bar filters-shell">
        <div className="filters-top-row">
          <div className="filters-group basic">
            <div className="period-filter">
              <label className="filter-label">Vista</label>
              <select
                className="filter-select"
                value={filters.vistaTemporal}
                onChange={(e) => handleFilterChange('vistaTemporal', e.target.value)}
              >
                <option value="mensual">Mensual</option>
                <option value="trimestral">Trimestral</option>
                <option value="anual">Anual</option>
              </select>
            </div>
            <div className="period-filter">
              <label className="filter-label">Periodos</label>
              <select
                className="filter-select"
                value={filters.limitePeriodos}
                onChange={(e) => handleFilterChange('limitePeriodos', Number(e.target.value))}
              >
                <option value={6}>6</option>
                <option value={12}>12</option>
              </select>
            </div>
            <div className="period-filter">
              <label className="filter-label">Entidad</label>
              <input
                className="filter-select"
                placeholder="Entidad"
                value={filters.entidadId}
                onChange={(e) => handleFilterChange('entidadId', e.target.value)}
              />
            </div>
          </div>
          <div className="filters-actions">
            <button className="link-toggle" onClick={() => setShowAdvanced(!showAdvanced)}>
              {showAdvanced ? 'Ocultar filtros avanzados' : 'Mostrar filtros avanzados'}
            </button>
            <span className="badge subtle">Filtros activos: {activeFiltersCount}</span>
          </div>
        </div>

        {showAdvanced && (
          <div className="filters-advanced">
            <div className="filters-group">
              <div className="period-filter">
                <label className="filter-label">Estado</label>
                <select
                  className="filter-select small"
                  value={filters.estado}
                  onChange={(e) => handleFilterChange('estado', e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="pendiente_validacion">Pendiente validacion</option>
                  <option value="en_revision">En revision</option>
                  <option value="enviado_a_tiempo">Enviado a tiempo</option>
                  <option value="enviado_tarde">Enviado tarde</option>
                  <option value="requiere_correccion">Requiere correccion</option>
                  <option value="vencido">Vencido</option>
                </select>
              </div>
              <div className="period-filter">
                <label className="filter-label">Frecuencia</label>
                <input
                  className="filter-select small"
                  placeholder="Mensual, trimestral..."
                  value={filters.frecuencia}
                  onChange={(e) => handleFilterChange('frecuencia', e.target.value)}
                />
              </div>
              <div className="period-filter">
                <label className="filter-label">Tipo de alerta</label>
                <select
                  className="filter-select small"
                  value={filters.tipoAlerta}
                  onChange={(e) => handleFilterChange('tipoAlerta', e.target.value)}
                >
                  <option value="">Todas</option>
                  <option value="vencido">Vencidos</option>
                  <option value="proximo">Proximos</option>
                  <option value="devoluciones">Devoluciones</option>
                </select>
              </div>
            </div>
            <div className="filters-group">
              <div className="period-filter">
                <label className="filter-label">Responsable</label>
                <input
                  className="filter-select small"
                  placeholder="Responsable"
                  value={filters.responsableId}
                  onChange={(e) => handleFilterChange('responsableId', e.target.value)}
                />
              </div>
              <div className="period-filter">
                <label className="filter-label">Fecha inicio</label>
                <input
                  type="date"
                  className="filter-select small"
                  value={filters.fechaInicio}
                  onChange={(e) => handleFilterChange('fechaInicio', e.target.value)}
                />
              </div>
              <div className="period-filter">
                <label className="filter-label">Fecha fin</label>
                <input
                  type="date"
                  className="filter-select small"
                  value={filters.fechaFin}
                  onChange={(e) => handleFilterChange('fechaFin', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        <div className="filters-footer">
          <a href="/roles/supervisor/reportes" className="btn-review primary">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Revisar reportes
          </a>
        </div>
      </header>

      {/* Acceso rápido para actuar como responsable asignado */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '1rem 1.25rem',
          background: 'linear-gradient(90deg, #f0fdf4, #ecfdf3)',
          border: '1px solid var(--success-green-200)',
          borderRadius: '12px',
          boxShadow: '0 6px 18px rgba(16, 185, 129, 0.12)',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 700, color: 'var(--neutral-900)', marginBottom: '0.25rem' }}>
            Carga como responsable asignado
          </div>
          <div style={{ color: 'var(--neutral-600)', fontSize: '0.9rem' }}>
            Si tienes un reporte asignado, puedes subir el reporte o la evidencia directamente desde aquí.
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button className="btn-primary" onClick={() => { /* implementar flujo */ }}>
            Subir reporte asignado
          </button>
          <button className="btn-secondary" onClick={() => { /* implementar flujo */ }}>
            Subir evidencia
          </button>
        </div>
      </div>

      {/* KPIs Principales */}
      <section className="kpis-grid">
        <KpiCard
          title="% cumplimiento"
          value={`${(kpis.porcentajeCumplimientoATiempo || 0).toFixed(1)}%`}
          subtitle="Vs periodo anterior"
          delta={kpis.deltaPorcentajeCumplimiento}
          tipo="success"
          onClick={() => redirectGestion('enviado_a_tiempo')}
        />
        <KpiCard
          title="A tiempo"
          value={kpis.totalEnviadosATiempo}
          subtitle="Enviados a tiempo"
          delta={kpis.deltaPorcentajeCumplimiento}
          tipo="success"
          onClick={() => redirectGestion('enviado_a_tiempo')}
        />
        <KpiCard
          title="Fuera de tiempo"
          value={kpis.totalEnviadosTarde}
          subtitle="Reportes tarde"
          invert={true}
          tipo="warning"
          onClick={() => redirectGestion('enviado_tarde')}
        />
        <KpiCard
          title="Vencidos"
          value={kpis.totalVencidos}
          subtitle="No enviados"
          invert={true}
          tipo="danger"
          onClick={() => redirectGestion('vencido')}
        />
        <KpiCard
          title="Proximos"
          value={kpis.totalProximosVencer}
          subtitle="Plazo <= 7 dias"
          tipo="info"
          onClick={() => redirectGestion('pendiente')}
        />
        <KpiCard
          title="Retraso prom."
          value={`${(kpis.diasRetrasoPromedio || 0).toFixed(1)} d`}
          subtitle="Vs periodo anterior"
          delta={kpis.deltaDiasRetrasoPromedio}
          invert={true}
          tipo="warning"
          onClick={() => redirectGestion('en_revision')}
        />
      </section>

      {/* Grid de Secciones */}
      <div className="dashboard-grid">
        {/* Estado General de Reportes */}
        <div className="dashboard-card half">
          <div className="card-header">
            <h2 className="card-title">Estado General</h2>
          </div>
          <div className="card-body">
            <div className="donut-chart-container">
              <svg viewBox="0 0 220 220" className="donut-chart">
                <circle cx="110" cy="110" r="90" fill="none" stroke="#e5e7eb" strokeWidth="24" />
                {['a_tiempo','tarde','vencido','pendiente','proximos'].reduce(
                  (acc, estado) => {
                    const valor = baseDistribucion[estado] || 0;
                    const { offset } = acc;
                    const porcentaje = totalDistribucion > 0 ? valor / totalDistribucion : 0;
                    const length = porcentaje * 565;
                    const segment = (
                      <circle
                        key={estado}
                        cx="110"
                        cy="110"
                        r="90"
                        fill="none"
                        stroke={estadoColores[estado] || '#9ca3af'}
                        strokeWidth="24"
                        strokeDasharray={`${length} 565`}
                        strokeDashoffset={-offset}
                        transform="rotate(-90 110 110)"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSegmentClick(estado === 'a_tiempo' ? 'enviado_a_tiempo' : estado === 'tarde' ? 'enviado_tarde' : estado)}
                      />
                    );
                    return { offset: offset + length, elements: [...acc.elements, segment] };
                  },
                  { offset: 0, elements: [] as JSX.Element[] }
                ).elements}
                <text x="110" y="105" textAnchor="middle" fontSize="26" fontWeight="700" fill="#111827">
                  {totalDistribucion}
                </text>
                <text x="110" y="125" textAnchor="middle" fontSize="13" fill="#6b7280">
                  Total reportes
                </text>
                <text x="110" y="145" textAnchor="middle" fontSize="10" fill="#6b7280">
                  {(baseDistribucion['pendiente'] || 0)} Pend / {(baseDistribucion['tarde'] || 0)} Tarde / {(baseDistribucion['proximos'] || 0)} Próx
                </text>
              </svg>
            </div>
            <div className="legend-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              {['a_tiempo','tarde','vencido','pendiente','proximos'].map((estado) => {
                const valor = baseDistribucion[estado] || 0;
                const porcentaje = totalDistribucion > 0 ? ((valor / totalDistribucion) * 100).toFixed(1) : '0';
                return (
                  <button
                    key={estado}
                    className="legend-item"
                    style={{ cursor: 'pointer', background: 'transparent', border: 'none', textAlign: 'left' }}
                    onClick={() => handleSegmentClick(estado === 'a_tiempo' ? 'enviado_a_tiempo' : estado)}
                  >
                    <span className="legend-dot" style={{ background: estadoColores[estado] || '#9ca3af' }}></span>
                    <span>
                      {estado.replace('_', ' ')}: {valor} ({porcentaje}%)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Acciones pendientes */}
        <div className="dashboard-card half">
          <div className="card-header">
            <h2 className="card-title">Acciones Pendientes</h2>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {acciones.length === 0 && <p style={{ color: 'var(--neutral-500)' }}>Sin acciones pendientes</p>}
            {acciones.map((accion) => (
              <div key={accion.periodoId} className="card" style={{ padding: '0.75rem', border: '1px solid var(--neutral-200)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{accion.nombreReporte || 'Reporte'}</strong>
                    <div style={{ color: 'var(--neutral-500)', fontSize: '0.85rem' }}>
                      {accion.entidad} • {accion.tipo.replace('_', ' ')}
                    </div>
                  </div>
                  <a className="btn-secondary" href={`/roles/supervisor/reportes?periodoId=${accion.periodoId}`}>
                    Ir al detalle
                  </a>
                </div>
                <div style={{ color: 'var(--neutral-500)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  Límite: {accion.fechaLimite || 'N/A'} • Estado: {accion.estado}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Secciones de Alertas Prioritarias y Tendencia removidas */}

        {/* Carga de Trabajo por Responsable */}
        <div className="dashboard-card wide">
          <div className="card-header">
            <h2 className="card-title">Carga de Trabajo por Responsable</h2>
          </div>
          <div className="card-body">
            {sortedResponsables.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--neutral-500)', padding: '2rem' }}>
                No hay responsables con reportes asignados
              </p>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th onClick={() => toggleSort('nombre')}>Responsable</th>
                      <th>Total</th>
                      <th>Pendiente</th>
                      <th>En Revisión</th>
                      <th>Aprobado</th>
                      <th>Vencidos</th>
                      <th>Retraso prom.</th>
                      <th onClick={() => toggleSort('cumplimiento')}>Cumplimiento</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedResponsables.map((resp: CargaResponsable) => (
                      <tr key={resp.responsableId}>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <strong>{resp.nombreCompleto}</strong>
                            <small style={{ color: 'var(--neutral-500)' }}>{resp.email}</small>
                          </div>
                        </td>
                        <td>{resp.totalReportes}</td>
                        <td><span className="badge neutral">{resp.pendientes}</span></td>
                        <td><span className="badge info">{resp.enRevision}</span></td>
                        <td><span className="badge success">{resp.aprobados}</span></td>
                        <td><span className="badge danger">{resp.vencidos || resp.atrasados}</span></td>
                        <td>{resp.retrasoPromedio?.toFixed(1) ?? '-'}</td>
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
                        <td>
                          <button
                            className="btn-secondary"
                            onClick={() => window.location.href = `/roles/supervisor/reportes?responsableId=${resp.responsableId}`}
                          >
                            Ver reportes
                          </button>
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
        <div className="dashboard-card wide">
          <div className="card-header">
            <h2 className="card-title">Distribución por Entidad</h2>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {distribucionEntidades.length === 0 && <p style={{ color: 'var(--neutral-500)' }}>Sin datos de entidad</p>}
            {distribucionEntidades.map((entidad: DistribucionEntidad) => {
              const barWidth = Math.min(100, entidad.porcentajeCumplimiento);
              const color = entidad.porcentajeCumplimiento >= 80 ? '#10b981' :
                entidad.porcentajeCumplimiento >= 50 ? '#f59e0b' : '#ef4444';
              return (
                <div key={entidad.entidadId} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--neutral-600)' }}>
                    <strong>{entidad.nombreEntidad}</strong>
                    <span>{entidad.totalReportes} obligaciones</span>
                  </div>
                  <div style={{ background: 'var(--neutral-100)', borderRadius: '6px', height: '12px', overflow: 'hidden' }}>
                    <div style={{ width: `${barWidth}%`, height: '100%', background: color, transition: 'width 0.3s' }}></div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--neutral-500)' }}>
                    <span>A tiempo: {entidad.enviadosATiempo ?? 0}</span>
                    <span>Vencidos: {entidad.atrasados}</span>
                    <span>Pendientes: {entidad.pendientes}</span>
                    <strong style={{ color }}>{entidad.porcentajeCumplimiento.toFixed(0)}%</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  function redirectGestion(estado?: string) {
    const params = new URLSearchParams();
    if (estado) params.append('estado', estado);
    const query = params.toString();
    window.location.href = `/roles/supervisor/gestion-reportes${query ? `?${query}` : ''}`;
  }
}

function KpiCard({ title, value, subtitle, delta, invert, tipo, onClick }: { title: string; value: string | number; subtitle?: string; delta?: number; invert?: boolean; tipo?: 'primary' | 'warning' | 'info' | 'danger' | 'success'; onClick?: () => void }) {
  const isEqual = delta === 0 || delta === undefined;
  const isBetter = delta !== undefined ? (invert ? delta < 0 : delta > 0) : false;
  const color = isEqual ? 'var(--neutral-500)' : isBetter ? 'var(--success-green-600)' : 'var(--error-red-600)';
  const arrow = isEqual ? '→' : delta && delta > 0 ? '↑' : '↓';
  return (
    <div className={`kpi-card ${tipo || 'primary'}`} onClick={onClick}>
      <div className="kpi-icon">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3v18h18" />
          <polyline points="7 14 11 10 15 14 21 8" />
          <polyline points="17 8 21 8 21 12" />
        </svg>
      </div>
      <div className="kpi-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="kpi-value">{value}</h3>
          {delta !== undefined && (
            <div style={{ color, fontWeight: 700, fontSize: '0.85rem' }}>
              {arrow} {Math.abs(delta || 0).toFixed(1)}
            </div>
          )}
        </div>
        <p className="kpi-label">{title}</p>
        {subtitle && <p style={{ color: 'var(--neutral-500)', margin: 0, fontSize: '0.85rem' }}>{subtitle}</p>}
      </div>
    </div>
  );
}
