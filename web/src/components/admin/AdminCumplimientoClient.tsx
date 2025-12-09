import { useState, useEffect } from 'react';
import adminCumplimientoService from '../../lib/services/adminCumplimientoService';
import notifications from '../../lib/notifications';
import type {
  AdminCumplimientoDTO,
  FiltrosCumplimientoDTO,
  CumplimientoGlobalDTO,
  TendenciaMensualDTO,
  CumplimientoEntidadDTO,
  CumplimientoResponsableDTO
} from '../../lib/types/admin';
import '../../styles/cumplimiento.css';

export default function AdminCumplimientoClient() {
  const [data, setData] = useState<AdminCumplimientoDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'miembros' | 'entidades' | 'timeline'>('miembros');
  const [filtros, setFiltros] = useState<FiltrosCumplimientoDTO>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('asignados');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showAllEntidades, setShowAllEntidades] = useState(false);
  const [showAllResponsables, setShowAllResponsables] = useState(false);

  // Construye un cumplimientoGlobal derivado cuando el backend aún no envía el nuevo DTO
  const buildFallbackCumplimientoGlobal = (payload: AdminCumplimientoDTO): CumplimientoGlobalDTO | null => {
    const { adminMetrics, kpisGenerales, distribucionPorEntidad = [], cargaPorResponsable = [] } = payload;

    const totalReportesFromEntidades = distribucionPorEntidad.reduce((acc, e) => acc + (e.totalReportes || 0), 0);
    const totalReportesFromResponsables = cargaPorResponsable.reduce((acc, r) => acc + (r.totalReportes || 0), 0);
    const totalReportes = totalReportesFromEntidades || totalReportesFromResponsables || adminMetrics?.totalReportesConfigurados || 0;

    const reportesPendientes = (kpisGenerales?.reportesPendientes ?? 0) || distribucionPorEntidad.reduce((acc, e) => acc + (e.pendientes || 0), 0);
    const reportesVencidos = (kpisGenerales?.reportesAtrasados ?? 0) || cargaPorResponsable.reduce((acc, r) => acc + (r.atrasados || 0), 0);
    const reportesEnviadosTarde = (kpisGenerales?.reportesEnRevision ?? 0) + (kpisGenerales?.reportesRequierenCorreccion ?? 0);

    let reportesEnviadosATiempo = distribucionPorEntidad.reduce((acc, e) => acc + (e.aprobados || 0), 0);
    if (reportesEnviadosATiempo === 0 && totalReportes > 0 && adminMetrics?.cumplimientoGlobalPorcentaje) {
      reportesEnviadosATiempo = Math.round((adminMetrics.cumplimientoGlobalPorcentaje / 100) * totalReportes);
    }

    const porcentajeCumplimientoGlobal = totalReportes > 0
      ? (reportesEnviadosATiempo / totalReportes) * 100
      : adminMetrics?.cumplimientoGlobalPorcentaje || 0;

    const cumplimientoPorEntidad = distribucionPorEntidad.map((entidad) => ({
      entidadId: entidad.entidadId,
      nombreEntidad: entidad.nombreEntidad,
      totalReportes: entidad.totalReportes,
      enviados: entidad.aprobados,
      enviadosATiempo: entidad.aprobados || 0,
      enviadosTarde: entidad.enRevision || 0,
      pendientes: entidad.pendientes || 0,
      vencidos: 0,
      enRevision: entidad.enRevision || 0,
      porcentajeCumplimiento: entidad.totalReportes > 0 ? ((entidad.aprobados || 0) / entidad.totalReportes) * 100 : 0
    }));

    const cumplimientoPorResponsable = cargaPorResponsable.map((resp) => ({
      responsableId: resp.responsableId,
      nombreCompleto: resp.nombreCompleto,
      email: resp.email,
      cargo: resp.cargo,
      asignados: resp.totalReportes,
      pendientes: resp.pendientes,
      enRevision: resp.enRevision,
      aprobados: resp.aprobados,
      atrasados: resp.atrasados,
      vencidos: resp.atrasados,
      porcentajeCumplimiento: resp.porcentajeCumplimiento
    }));

    const fallback: CumplimientoGlobalDTO = {
      porcentajeCumplimientoGlobal,
      totalReportesAPresentar: totalReportes,
      reportesEnviadosATiempo,
      reportesEnviadosTarde,
      reportesVencidos,
      reportesPendientes,
      totalReportesConfigurados: adminMetrics?.totalReportesConfigurados ?? totalReportes,
      totalEntidades: distribucionPorEntidad.length || adminMetrics?.totalEntidades || 0,
      totalResponsables: cargaPorResponsable.length || adminMetrics?.totalUsuariosActivos || 0,
      distribucionPorEstado: {
        a_tiempo: reportesEnviadosATiempo,
        enviados_tarde: reportesEnviadosTarde,
        no_reportado: reportesVencidos,
        pendientes: reportesPendientes
      },
      tendenciaHistorica: [],
      cumplimientoPorEntidad,
      cumplimientoPorResponsable
    };

    return fallback;
  };

  useEffect(() => {
    loadData();
  }, [filtros]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const responseData = await adminCumplimientoService.getCumplimiento(filtros);
      console.log('=== DEBUG: Datos de Cumplimiento Admin ===');
      console.log('Response completa:', responseData);
      console.log('kpisGenerales:', responseData?.kpisGenerales);
      console.log('adminMetrics:', responseData?.adminMetrics);
      console.log('cumplimientoGlobal:', responseData?.cumplimientoGlobal);
      console.log('cargaPorResponsable:', responseData?.cargaPorResponsable?.length, 'items');
      console.log('distribucionPorEntidad:', responseData?.distribucionPorEntidad?.length, 'items');
      let payload = responseData;

      if (!responseData?.cumplimientoGlobal) {
        const fallback = buildFallbackCumplimientoGlobal(responseData);
        console.log('Fallback cumplimientoGlobal aplicado:', fallback);
        payload = { ...responseData, cumplimientoGlobal: fallback };
      }

      console.log('=========================================');
      setData(payload);
    } catch (error: any) {
      notifications.error('Error al cargar datos de cumplimiento');
      console.error('Error cargando cumplimiento:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadData();
    notifications.success('Datos actualizados');
  };

  const handleTabChange = (tab: 'miembros' | 'entidades' | 'timeline') => {
    setActiveTab(tab);
  };

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return '';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  const getColorByPercentage = (percent: number): string => {
    if (percent >= 80) return '#22c55e';
    if (percent >= 60) return '#84cc16';
    if (percent >= 40) return '#f59e0b';
    if (percent >= 20) return '#f97316';
    return '#ef4444';
  };

  const cumplimientoGlobal = data?.cumplimientoGlobal;

  // =====================================================
  // RENDER: KPIs PRINCIPALES (usa cumplimientoGlobal o fallback a kpisGenerales/adminMetrics)
  // =====================================================
  const renderKPIsPrincipales = () => {
    // Si hay cumplimientoGlobal, usar esos datos
    if (cumplimientoGlobal) {
      const kpis = [
        {
          label: 'Cumplimiento Global',
          value: `${(cumplimientoGlobal.porcentajeCumplimientoGlobal || 0).toFixed(1)}%`,
          color: 'green',
          icon: 'check-circle',
          highlight: true
        },
        {
          label: 'Enviados a Tiempo',
          value: cumplimientoGlobal.reportesEnviadosATiempo || 0,
          color: 'green',
          icon: 'clock-check'
        },
        {
          label: 'Enviados Tarde',
          value: cumplimientoGlobal.reportesEnviadosTarde || 0,
          color: 'yellow',
          icon: 'clock-alert'
        },
        {
          label: 'Vencidos',
          value: cumplimientoGlobal.reportesVencidos || 0,
          color: 'red',
          icon: 'x-circle'
        },
        {
          label: 'Pendientes',
          value: cumplimientoGlobal.reportesPendientes || 0,
          color: 'purple',
          icon: 'clock'
        }
      ];

      return (
        <div className="kpis-principales">
          {kpis.map((kpi, index) => (
            <div 
              key={index} 
              className={`kpi-card-principal ${kpi.color} ${kpi.highlight ? 'highlight' : ''}`}
            >
              <div className={`kpi-icon-wrapper ${kpi.color}`}>
                {renderKPIIcon(kpi.icon)}
              </div>
              <div className="kpi-info">
                <span className="kpi-value-large">{kpi.value}</span>
                <span className="kpi-label-small">{kpi.label}</span>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Fallback: usar kpisGenerales y adminMetrics si existen
    const kpisGenerales = data?.kpisGenerales;
    const adminMetrics = data?.adminMetrics;
    
    if (!kpisGenerales && !adminMetrics) {
      return (
        <div className="kpis-principales empty-state-card">
          <p>No hay datos de KPIs disponibles. Verifica que el backend esté enviando cumplimientoGlobal.</p>
        </div>
      );
    }

    const kpis = [
      {
        label: 'Cumplimiento Global',
        value: `${(adminMetrics?.cumplimientoGlobalPorcentaje || 0).toFixed(1)}%`,
        color: 'green',
        icon: 'check-circle',
        highlight: true
      },
      {
        label: 'En Revisión',
        value: kpisGenerales?.reportesEnRevision || 0,
        color: 'blue',
        icon: 'clock-check'
      },
      {
        label: 'Requieren Corrección',
        value: kpisGenerales?.reportesRequierenCorreccion || 0,
        color: 'yellow',
        icon: 'clock-alert'
      },
      {
        label: 'Atrasados',
        value: kpisGenerales?.reportesAtrasados || 0,
        color: 'red',
        icon: 'x-circle'
      },
      {
        label: 'Pendientes',
        value: kpisGenerales?.reportesPendientes || 0,
        color: 'purple',
        icon: 'clock'
      }
    ];

    return (
      <div className="kpis-principales">
        {kpis.map((kpi, index) => (
          <div 
            key={index} 
            className={`kpi-card-principal ${kpi.color} ${kpi.highlight ? 'highlight' : ''}`}
          >
            <div className={`kpi-icon-wrapper ${kpi.color}`}>
              {renderKPIIcon(kpi.icon)}
            </div>
            <div className="kpi-info">
              <span className="kpi-value-large">{kpi.value}</span>
              <span className="kpi-label-small">{kpi.label}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // =====================================================
  // RENDER: MÉTRICAS DEL SISTEMA (con fallback a adminMetrics)
  // =====================================================
  const renderMetricasSistema = () => {
    const adminMetrics = data?.adminMetrics;
    
    // Usar cumplimientoGlobal si existe, sino usar adminMetrics
    const totalReportesConfigurados = cumplimientoGlobal?.totalReportesConfigurados ?? adminMetrics?.totalReportesConfigurados ?? 0;
    const totalEntidades = cumplimientoGlobal?.totalEntidades ?? adminMetrics?.totalEntidades ?? 0;
    const totalResponsables = cumplimientoGlobal?.totalResponsables ?? adminMetrics?.totalUsuariosActivos ?? 0;
    const totalAPresentar = cumplimientoGlobal?.totalReportesAPresentar ?? 0;

    return (
      <div className="metricas-sistema">
        <div className="metrica-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <div>
            <span className="metrica-valor">{totalReportesConfigurados}</span>
            <span className="metrica-label">Reportes Configurados</span>
          </div>
        </div>
        <div className="metrica-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          </svg>
          <div>
            <span className="metrica-valor">{totalEntidades}</span>
            <span className="metrica-label">Entidades</span>
          </div>
        </div>
        <div className="metrica-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <div>
            <span className="metrica-valor">{totalResponsables}</span>
            <span className="metrica-label">Responsables</span>
          </div>
        </div>
        <div className="metrica-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <div>
            <span className="metrica-valor">{totalAPresentar}</span>
            <span className="metrica-label">Total a Presentar</span>
          </div>
        </div>
      </div>
    );
  };

  const renderKPIIcon = (icon: string) => {
    const icons: Record<string, JSX.Element> = {
      'check-circle': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
      'clock-check': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      'clock-alert': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
      'x-circle': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      ),
      'clock': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )
    };
    return icons[icon] || null;
  };

  // =====================================================
  // RENDER: GRÁFICO DONUT - DISTRIBUCIÓN POR ESTADO
  // =====================================================
  const renderGraficoDonut = () => {
    // Usar cumplimientoGlobal o fallback a data
    let dist = cumplimientoGlobal?.distribucionPorEstado;
    
    // Fallback: calcular distribución desde adminMetrics o kpisGenerales
    if (!dist && data) {
      const metrics = data.adminMetrics || data.kpisGenerales;
      if (metrics) {
        dist = {
          a_tiempo: metrics.aprobados || metrics.reportesAprobados || 0,
          enviados_tarde: metrics.enRevision || metrics.reportesEnRevision || 0,
          no_reportado: metrics.atrasados || metrics.reportesAtrasados || 0,
          pendientes: metrics.pendientes || metrics.reportesPendientes || 0
        };
      }
    }
    
    if (!dist) return null;

    const total = Object.values(dist).reduce((a, b) => a + (b || 0), 0);
    
    if (total === 0) return (
      <div className="chart-card">
        <h3 className="chart-title">Distribución por Estado</h3>
        <div className="empty-chart">No hay datos disponibles</div>
      </div>
    );

    /**
     * DEFINICIONES OFICIALES DE ESTADOS PARA EL DONUT:
     * - A tiempo (verde #22c55e): Enviados dentro del plazo
     * - Enviados tarde (amarillo/naranja #f59e0b): Enviados fuera de tiempo
     * - No reportado (rojo #ef4444): Sin enviar y ya vencidos
     * - Pendientes (gris #9ca3af): Sin enviar pero aún dentro del plazo
     */
    const items = [
      { key: 'a_tiempo', label: 'A tiempo', color: '#22c55e', value: dist.a_tiempo || 0 },
      { key: 'enviados_tarde', label: 'Enviados tarde', color: '#f59e0b', value: dist.enviados_tarde || 0 },
      { key: 'no_reportado', label: 'No reportado', color: '#ef4444', value: dist.no_reportado || dist.vencidos || 0 },
      { key: 'pendientes', label: 'Pendientes', color: '#9ca3af', value: dist.pendientes || 0 }
    ];

    let cumulativePercent = 0;
    const segments = items.map(item => {
      const percent = (item.value / total) * 100;
      const startAngle = cumulativePercent * 3.6;
      cumulativePercent += percent;
      return { ...item, percent, startAngle, endAngle: cumulativePercent * 3.6 };
    });

    const gradientStops = segments
      .filter(s => s.value > 0)
      .map(s => `${s.color} ${s.startAngle}deg ${s.endAngle}deg`)
      .join(', ');

    return (
      <div className="chart-card">
        <h3 className="chart-title">Distribución por Estado</h3>
        <div className="donut-container">
          <div 
            className="donut-chart"
            style={{ 
              background: gradientStops 
                ? `conic-gradient(${gradientStops})` 
                : '#e5e7eb'
            }}
          >
            <div className="donut-hole">
              <span className="donut-total">{total}</span>
              <span className="donut-label">Total</span>
            </div>
          </div>
          <div className="donut-legend">
            {items.map(item => (
              <div key={item.key} className="legend-item">
                <span className="legend-color" style={{ backgroundColor: item.color }} />
                <span className="legend-label">{item.label}</span>
                <span className="legend-value">{item.value} ({((item.value / total) * 100).toFixed(1)}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // =====================================================
  // RENDER: GRÁFICO DE TENDENCIA HISTÓRICA
  // =====================================================
  const renderGraficoTendencia = () => {
    const tendencia = cumplimientoGlobal?.tendenciaHistorica;
    // Si no hay tendencia histórica, mostrar mensaje amigable en lugar de null
    if (!tendencia || tendencia.length === 0) {
      return (
        <div className="chart-card chart-wide">
          <h3 className="chart-title">Tendencia Histórica de Cumplimiento</h3>
          <div className="empty-chart" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
            <p>No hay datos históricos disponibles aún.</p>
            <p style={{ fontSize: '0.875rem' }}>Los datos de tendencia se generarán conforme se acumulen reportes.</p>
          </div>
        </div>
      );
    }

    const maxPorcentaje = 100;

    return (
      <div className="chart-card chart-wide">
        <h3 className="chart-title">Tendencia Histórica de Cumplimiento</h3>
        <div className="tendencia-container">
          <div className="tendencia-chart">
            {tendencia.map((mes, index) => {
              const heightPercent = (mes.porcentajeCumplimiento / maxPorcentaje) * 100;
              
              return (
                <div key={index} className="tendencia-column">
                  <div className="tendencia-bars">
                    <div 
                      className="tendencia-bar cumplimiento"
                      style={{ 
                        height: `${heightPercent}%`,
                        backgroundColor: getColorByPercentage(mes.porcentajeCumplimiento)
                      }}
                      title={`Cumplimiento: ${mes.porcentajeCumplimiento.toFixed(1)}%`}
                    >
                      <span className="bar-value">{mes.totalReportes}</span>
                    </div>
                  </div>
                  <div className="tendencia-label">
                    <span className="tendencia-mes">{mes.mes.split(' ')[0].substring(0, 3)}</span>
                    <span className="tendencia-porcentaje">{mes.porcentajeCumplimiento.toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="tendencia-legend">
            <span><span className="legend-dot green" /> % Cumplimiento (altura)</span>
            <span><span className="legend-dot gray" /> Número total de reportes</span>
          </div>
        </div>
      </div>
    );
  };

  // =====================================================
  // RENDER: GRÁFICO DE BARRAS - CUMPLIMIENTO POR ENTIDAD
  // Fórmula: %CumplimientoEntidad = (Enviados a tiempo de esa entidad / Total reportes de esa entidad) × 100
  // =====================================================
  const renderGraficoCumplimientoEntidad = () => {
    // Usar cumplimientoGlobal o fallback a distribucionPorEntidad
    let entidades = cumplimientoGlobal?.cumplimientoPorEntidad;
    
    if ((!entidades || entidades.length === 0) && data?.distribucionPorEntidad) {
      entidades = data.distribucionPorEntidad.map(e => ({
        entidadId: e.entidadId,
        nombreEntidad: e.nombreEntidad,
        totalReportes: e.totalReportes,
        enviadosATiempo: e.aprobados,
        porcentajeCumplimiento: e.totalReportes > 0 ? (e.aprobados / e.totalReportes) * 100 : 0
      }));
    }
    
    if (!entidades || entidades.length === 0) {
      return (
        <div className="chart-card">
          <h3 className="chart-title">Cumplimiento por Entidad</h3>
          <div className="empty-chart" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
            <p>No hay datos de entidades disponibles.</p>
          </div>
        </div>
      );
    }

    const displayedEntidades = showAllEntidades ? entidades : [...entidades].slice(0, 10);
    const hasMore = entidades.length > 10;

    return (
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">
            Cumplimiento por Entidad {!showAllEntidades && hasMore ? '(Top 10)' : `(${entidades.length} total)`}
          </h3>
          {hasMore && (
            <button 
              className="btn-toggle-view"
              onClick={() => setShowAllEntidades(!showAllEntidades)}
            >
              {showAllEntidades ? 'Ver menos' : `Ver todas (${entidades.length})`}
            </button>
          )}
        </div>
        <div className={`barras-horizontales ${showAllEntidades ? 'scrollable' : ''}`}>
          {displayedEntidades.map((entidad, index) => (
            <div key={index} className="barra-item">
              <div className="barra-info">
                <span className="barra-nombre" title={entidad.nombreEntidad}>
                  {entidad.nombreEntidad.length > 25 
                    ? entidad.nombreEntidad.substring(0, 25) + '...' 
                    : entidad.nombreEntidad}
                </span>
                <span className="barra-stats">
                  {entidad.enviadosATiempo}/{entidad.totalReportes}
                </span>
              </div>
              <div className="barra-track">
                <div 
                  className="barra-fill"
                  style={{ 
                    width: `${entidad.porcentajeCumplimiento}%`,
                    backgroundColor: getColorByPercentage(entidad.porcentajeCumplimiento)
                  }}
                />
              </div>
              <span className="barra-porcentaje">{entidad.porcentajeCumplimiento.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // =====================================================
  // RENDER: GRÁFICO DE BARRAS - CUMPLIMIENTO POR RESPONSABLE
  // Fórmula: %CumplimientoResponsable = (Enviados a tiempo / Asignados) × 100
  // =====================================================
  const renderGraficoCumplimientoResponsable = () => {
    // Usar cumplimientoGlobal o fallback a cargaPorResponsable
    let responsables = cumplimientoGlobal?.cumplimientoPorResponsable;
    
    if ((!responsables || responsables.length === 0) && data?.cargaPorResponsable) {
      responsables = data.cargaPorResponsable.map(r => ({
        responsableId: r.responsableId,
        nombreCompleto: r.nombreCompleto,
        email: r.email,
        asignados: r.totalReportes,
        vencidos: r.atrasados,
        porcentajeCumplimiento: r.porcentajeCumplimiento
      }));
    }
    
    if (!responsables || responsables.length === 0) {
      return (
        <div className="chart-card">
          <h3 className="chart-title">Cumplimiento por Responsable</h3>
          <div className="empty-chart" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
            <p>No hay datos de responsables disponibles.</p>
          </div>
        </div>
      );
    }

    const displayedResponsables = showAllResponsables ? responsables : [...responsables].slice(0, 10);
    const hasMore = responsables.length > 10;

    return (
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">
            Cumplimiento por Responsable {!showAllResponsables && hasMore ? '(Top 10)' : `(${responsables.length} total)`}
          </h3>
          {hasMore && (
            <button 
              className="btn-toggle-view"
              onClick={() => setShowAllResponsables(!showAllResponsables)}
            >
              {showAllResponsables ? 'Ver menos' : `Ver todos (${responsables.length})`}
            </button>
          )}
        </div>
        <div className={`barras-horizontales ${showAllResponsables ? 'scrollable' : ''}`}>
          {displayedResponsables.map((resp, index) => (
            <div key={index} className="barra-item">
              <div className="barra-info">
                <span className="barra-nombre" title={resp.nombreCompleto}>
                  {resp.nombreCompleto.length > 20 
                    ? resp.nombreCompleto.substring(0, 20) + '...' 
                    : resp.nombreCompleto}
                </span>
                <span className="barra-stats">
                  {resp.vencidos > 0 && <span className="badge-mini red">{resp.vencidos} vencidos</span>}
                </span>
              </div>
              <div className="barra-track">
                <div 
                  className="barra-fill"
                  style={{ 
                    width: `${resp.porcentajeCumplimiento}%`,
                    backgroundColor: getColorByPercentage(resp.porcentajeCumplimiento)
                  }}
                />
              </div>
              <span className="barra-porcentaje">{resp.porcentajeCumplimiento.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // =====================================================
  // RENDER: TABLA POR MIEMBRO (con fallback a cargaPorResponsable)
  // =====================================================
  const renderTablaMiembros = () => {
    // Usar cumplimientoGlobal.cumplimientoPorResponsable o fallback a data.cargaPorResponsable
    const responsablesGlobal = cumplimientoGlobal?.cumplimientoPorResponsable || [];
    const cargaResponsable = data?.cargaPorResponsable || [];
    
    // Si hay datos en cumplimientoGlobal, usarlos; sino usar cargaPorResponsable transformado
    let responsables: any[] = responsablesGlobal.length > 0 
      ? responsablesGlobal 
      : cargaResponsable.map(c => ({
          responsableId: c.responsableId,
          nombreCompleto: c.nombreCompleto,
          email: c.email,
          cargo: c.cargo,
          asignados: c.totalReportes,
          pendientes: c.pendientes,
          enRevision: c.enRevision,
          aprobados: c.aprobados,
          atrasados: c.atrasados,
          vencidos: c.atrasados, // Aproximación
          porcentajeCumplimiento: c.porcentajeCumplimiento
        }));
    
    let filtered = [...responsables];
    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.nombreCompleto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    filtered.sort((a: any, b: any) => {
      const aVal = a[sortField] ?? 0;
      const bVal = b[sortField] ?? 0;
      return sortDirection === 'asc' 
        ? (aVal > bVal ? 1 : -1) 
        : (aVal < bVal ? 1 : -1);
    });
    
    return (
      <div className="table-responsive">
        <table className="table-cumplimiento">
          <thead>
            <tr>
              <th onClick={() => toggleSort('nombreCompleto')}>
                Miembro {getSortIcon('nombreCompleto')}
              </th>
              <th onClick={() => toggleSort('asignados')}>
                Asignados {getSortIcon('asignados')}
              </th>
              <th onClick={() => toggleSort('pendientes')}>
                Pendientes {getSortIcon('pendientes')}
              </th>
              <th onClick={() => toggleSort('enRevision')}>
                En Revisión {getSortIcon('enRevision')}
              </th>
              <th onClick={() => toggleSort('aprobados')}>
                Aprobados {getSortIcon('aprobados')}
              </th>
              <th onClick={() => toggleSort('atrasados')}>
                Atrasados {getSortIcon('atrasados')}
              </th>
              <th onClick={() => toggleSort('porcentajeCumplimiento')}>
                Cumplimiento {getSortIcon('porcentajeCumplimiento')}
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item: any) => (
              <tr key={item.responsableId}>
                <td>
                  <div className="user-cell">
                    <div className="user-avatar">{item.nombreCompleto.charAt(0)}</div>
                    <div className="user-info">
                      <div className="user-name">{item.nombreCompleto}</div>
                      <div className="user-email">{item.email}</div>
                    </div>
                  </div>
                </td>
                <td><span className="badge badge-neutral">{item.asignados}</span></td>
                <td><span className="badge badge-purple">{item.pendientes}</span></td>
                <td><span className="badge badge-blue">{item.enRevision}</span></td>
                <td><span className="badge badge-green">{item.aprobados}</span></td>
                <td><span className="badge badge-red">{item.atrasados}</span></td>
                <td>
                  <div className="progress-cell">
                    <div className="progress-bar-mini">
                      <div 
                        className="progress-fill-mini" 
                        style={{ 
                          width: `${item.porcentajeCumplimiento}%`,
                          backgroundColor: getColorByPercentage(item.porcentajeCumplimiento)
                        }}
                      />
                    </div>
                    <span className="progress-text-mini">{item.porcentajeCumplimiento.toFixed(0)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="empty-table">No se encontraron responsables</div>
        )}
      </div>
    );
  };

  // =====================================================
  // RENDER: TABLA POR ENTIDAD (con fallback a distribucionPorEntidad)
  // =====================================================
  const renderTablaEntidades = () => {
    // Usar cumplimientoGlobal.cumplimientoPorEntidad o fallback a data.distribucionPorEntidad
    const entidadesGlobal = cumplimientoGlobal?.cumplimientoPorEntidad || [];
    const distribucionEntidad = data?.distribucionPorEntidad || [];
    
    let entidades: any[] = entidadesGlobal.length > 0
      ? entidadesGlobal
      : distribucionEntidad.map(e => ({
          entidadId: e.entidadId,
          nombreEntidad: e.nombreEntidad,
          totalReportes: e.totalReportes,
          enviados: e.aprobados, // Aproximación
          enviadosATiempo: e.aprobados,
          enviadosTarde: 0,
          pendientes: e.pendientes,
          vencidos: 0,
          enRevision: 0,
          porcentajeCumplimiento: e.totalReportes > 0 ? (e.aprobados / e.totalReportes) * 100 : 0
        }));
    
    let filtered = [...entidades];
    if (searchTerm) {
      filtered = filtered.filter(e => 
        e.nombreEntidad?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    filtered.sort((a: any, b: any) => {
      const aVal = a[sortField] ?? 0;
      const bVal = b[sortField] ?? 0;
      return sortDirection === 'asc' 
        ? (aVal > bVal ? 1 : -1) 
        : (aVal < bVal ? 1 : -1);
    });
    
    return (
      <div className="table-responsive">
        <table className="table-cumplimiento">
          <thead>
            <tr>
              <th onClick={() => toggleSort('nombreEntidad')}>
                Entidad {getSortIcon('nombreEntidad')}
              </th>
              <th onClick={() => toggleSort('totalReportes')}>
                Total {getSortIcon('totalReportes')}
              </th>
              <th onClick={() => toggleSort('enviados')}>
                Enviados {getSortIcon('enviados')}
              </th>
              <th onClick={() => toggleSort('pendientes')}>
                Pendientes {getSortIcon('pendientes')}
              </th>
              <th onClick={() => toggleSort('vencidos')}>
                Vencidos {getSortIcon('vencidos')}
              </th>
              <th onClick={() => toggleSort('enRevision')}>
                En Revisión {getSortIcon('enRevision')}
              </th>
              <th onClick={() => toggleSort('porcentajeCumplimiento')}>
                Cumplimiento {getSortIcon('porcentajeCumplimiento')}
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item: any) => (
              <tr key={item.entidadId}>
                <td>
                  <div className="entity-cell">
                    <div className="entity-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      </svg>
                    </div>
                    <strong>{item.nombreEntidad}</strong>
                  </div>
                </td>
                <td><span className="badge badge-neutral">{item.totalReportes}</span></td>
                <td><span className="badge badge-green">{item.enviados}</span></td>
                <td><span className="badge badge-purple">{item.pendientes}</span></td>
                <td><span className="badge badge-red">{item.vencidos}</span></td>
                <td><span className="badge badge-blue">{item.enRevision}</span></td>
                <td>
                  <div className="progress-cell">
                    <div className="progress-bar-mini">
                      <div 
                        className="progress-fill-mini" 
                        style={{ 
                          width: `${item.porcentajeCumplimiento}%`,
                          backgroundColor: getColorByPercentage(item.porcentajeCumplimiento)
                        }}
                      />
                    </div>
                    <span className="progress-text-mini">{item.porcentajeCumplimiento.toFixed(0)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="empty-table">No se encontraron entidades</div>
        )}
      </div>
    );
  };

  // =====================================================
  // RENDER: LÍNEA DE TIEMPO MENSUAL
  // =====================================================
  const renderTimeline = () => {
    const tendencia = cumplimientoGlobal?.tendenciaHistorica;
    if (!tendencia || tendencia.length === 0) {
      return (
        <div className="empty-state">
          <p>No hay datos de tendencia histórica</p>
        </div>
      );
    }

    return (
      <div className="table-responsive">
        <table className="table-cumplimiento">
          <thead>
            <tr>
              <th>Mes</th>
              <th>Total Reportes</th>
              <th>Enviados a Tiempo</th>
              <th>Enviados Tarde</th>
              <th>Vencidos</th>
              <th>% Cumplimiento</th>
            </tr>
          </thead>
          <tbody>
            {tendencia.map((mes, index) => (
              <tr key={index}>
                <td><strong>{mes.mes}</strong></td>
                <td><span className="badge badge-neutral">{mes.totalReportes}</span></td>
                <td><span className="badge badge-green">{mes.enviadosATiempo}</span></td>
                <td><span className="badge badge-yellow">{mes.enviadosTarde}</span></td>
                <td><span className="badge badge-red">{mes.vencidos}</span></td>
                <td>
                  <div className="progress-cell">
                    <div className="progress-bar-mini">
                      <div 
                        className="progress-fill-mini" 
                        style={{ 
                          width: `${mes.porcentajeCumplimiento}%`,
                          backgroundColor: getColorByPercentage(mes.porcentajeCumplimiento)
                        }}
                      />
                    </div>
                    <span className="progress-text-mini">{mes.porcentajeCumplimiento.toFixed(1)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner-large"></div>
        <p>Cargando datos de cumplimiento...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="error-container">
        <p>Error al cargar los datos</p>
        <button className="btn btn-primary" onClick={loadData}>Reintentar</button>
      </div>
    );
  }

  return (
    <div className="cumplimiento-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Cumplimiento Regulatorio</h1>
          <p className="page-subtitle">Vista consolidada del cumplimiento global del sistema</p>
        </div>
        <button className="btn btn-primary" onClick={handleRefresh}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          Actualizar
        </button>
      </div>

      {/* Debug: Indicador de datos cargados */}
      {data && !cumplimientoGlobal && (
        <div className="debug-banner" style={{ 
          padding: '0.75rem 1rem', 
          background: '#fef3c7', 
          border: '1px solid #fbbf24', 
          borderRadius: '8px', 
          marginBottom: '1rem',
          fontSize: '0.875rem',
          color: '#92400e'
        }}>
          ⚠️ Los datos de cumplimiento global no están disponibles. Mostrando datos alternativos de kpisGenerales y adminMetrics.
        </div>
      )}

      {/* KPIs Principales */}
      {renderKPIsPrincipales()}

      {/* Métricas del Sistema */}
      {renderMetricasSistema()}

      {/* Gráficos Row 1 */}
      <div className="charts-grid">
        {renderGraficoDonut()}
        {renderGraficoCumplimientoEntidad()}
      </div>

      {/* Gráfico de Tendencia (ancho completo) */}
      {renderGraficoTendencia()}

      {/* Gráfico Cumplimiento por Responsable */}
      <div className="charts-grid single">
        {renderGraficoCumplimientoResponsable()}
      </div>

      {/* Filtros y Búsqueda */}
      <div className="filters-bar">
        <div className="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, email o entidad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'miembros' ? 'active' : ''}`}
            onClick={() => handleTabChange('miembros')}
          >
            Por Miembro
          </button>
          <button
            className={`tab ${activeTab === 'entidades' ? 'active' : ''}`}
            onClick={() => handleTabChange('entidades')}
          >
            Por Entidad
          </button>
          <button
            className={`tab ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => handleTabChange('timeline')}
          >
            Línea de Tiempo
          </button>
        </div>
      </div>

      {/* Contenido de Tabs */}
      <div className="tab-content">
        {activeTab === 'miembros' && renderTablaMiembros()}
        {activeTab === 'entidades' && renderTablaEntidades()}
        {activeTab === 'timeline' && renderTimeline()}
      </div>
    </div>
  );
}
