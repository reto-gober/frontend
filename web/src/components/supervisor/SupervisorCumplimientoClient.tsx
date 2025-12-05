import { useState, useEffect } from 'react';
import { flujoReportesService, type ReportePeriodo } from '../../lib/services';

type ViewType = 'equipo' | 'entidad' | 'timeline';

interface MiembroStats {
  usuarioId: string;
  nombre: string;
  cargo: string;
  iniciales: string;
  asignados: number;
  enviados: number;
  enProgreso: number;
  pendientes: number;
  vencidos: number;
  cumplimiento: number;
}

interface EntidadStats {
  entidadId: string;
  nombre: string;
  sigla: string;
  total: number;
  enviados: number;
  pendientes: number;
  vencidos: number;
  cumplimiento: number;
}

interface TimelineEvent {
  id: string;
  fecha: string;
  tipo: 'enviado' | 'aprobado' | 'rechazado' | 'vencido' | 'pendiente';
  reporteNombre: string;
  responsable: string;
  entidad: string;
}

export default function SupervisorCumplimientoClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ViewType>('equipo');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Datos
  const [periodos, setPeriodos] = useState<ReportePeriodo[]>([]);
  const [miembrosStats, setMiembrosStats] = useState<MiembroStats[]>([]);
  const [entidadesStats, setEntidadesStats] = useState<EntidadStats[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  
  // Resumen general
  const [resumen, setResumen] = useState({
    cumplimientoGeneral: 0,
    totalReportes: 0,
    enviados: 0,
    enProgreso: 0,
    vencidos: 0
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar todos los periodos supervisados
      const periodosData = await flujoReportesService.supervision(0, 1000);
      const todosPeriodos = periodosData.content;
      setPeriodos(todosPeriodos);

      // Calcular estadísticas
      calcularEstadisticas(todosPeriodos);

    } catch (err: any) {
      console.error('Error al cargar datos:', err);
      setError(err.response?.data?.message || 'Error al cargar los datos de cumplimiento');
    } finally {
      setLoading(false);
    }
  };

  const calcularEstadisticas = (periodos: ReportePeriodo[]) => {
    const ahora = new Date();

    // Calcular resumen general
    const enviados = periodos.filter(p => 
      ['enviado', 'ENVIADO', 'aprobado', 'APROBADO'].includes(p.estado)
    ).length;
    const enProgreso = periodos.filter(p => 
      ['en_revision', 'EN_REVISION', 'pendiente_validacion', 'PENDIENTE_VALIDACION'].includes(p.estado)
    ).length;
    const vencidos = periodos.filter(p => {
      const vencimiento = new Date(p.fechaVencimientoCalculada);
      return vencimiento < ahora && !['enviado', 'ENVIADO', 'aprobado', 'APROBADO'].includes(p.estado);
    }).length;
    
    const cumplimientoGeneral = periodos.length > 0 
      ? Math.round((enviados / periodos.length) * 100) 
      : 0;

    setResumen({
      cumplimientoGeneral,
      totalReportes: periodos.length,
      enviados,
      enProgreso,
      vencidos
    });

    // Calcular stats por miembro
    const miembrosMap = new Map<string, MiembroStats>();
    periodos.forEach(p => {
      const resp = p.responsableElaboracion;
      if (!resp?.usuarioId) return;
      
      if (!miembrosMap.has(resp.usuarioId)) {
        const nombres = resp.nombreCompleto.split(' ');
        const iniciales = nombres.length >= 2 
          ? `${nombres[0][0]}${nombres[nombres.length - 1][0]}`.toUpperCase()
          : resp.nombreCompleto.substring(0, 2).toUpperCase();
        
        miembrosMap.set(resp.usuarioId, {
          usuarioId: resp.usuarioId,
          nombre: resp.nombreCompleto,
          cargo: resp.cargo || 'Analista',
          iniciales,
          asignados: 0,
          enviados: 0,
          enProgreso: 0,
          pendientes: 0,
          vencidos: 0,
          cumplimiento: 0
        });
      }
      
      const stats = miembrosMap.get(resp.usuarioId)!;
      stats.asignados++;
      
      if (['enviado', 'ENVIADO', 'aprobado', 'APROBADO'].includes(p.estado)) {
        stats.enviados++;
      } else if (['en_revision', 'EN_REVISION'].includes(p.estado)) {
        stats.enProgreso++;
      } else {
        stats.pendientes++;
      }
      
      const vencimiento = new Date(p.fechaVencimientoCalculada);
      if (vencimiento < ahora && !['enviado', 'ENVIADO', 'aprobado', 'APROBADO'].includes(p.estado)) {
        stats.vencidos++;
      }
    });

    // Calcular cumplimiento por miembro
    miembrosMap.forEach(stats => {
      stats.cumplimiento = stats.asignados > 0 
        ? Math.round((stats.enviados / stats.asignados) * 100) 
        : 0;
    });

    setMiembrosStats(Array.from(miembrosMap.values()).sort((a, b) => b.cumplimiento - a.cumplimiento));

    // Calcular stats por entidad
    const entidadesMap = new Map<string, EntidadStats>();
    periodos.forEach(p => {
      const entidadNombre = p.entidadNombre || 'Sin Entidad';
      
      if (!entidadesMap.has(entidadNombre)) {
        entidadesMap.set(entidadNombre, {
          entidadId: entidadNombre,
          nombre: entidadNombre,
          sigla: entidadNombre.split(' ').map(w => w[0]).join('').substring(0, 4).toUpperCase(),
          total: 0,
          enviados: 0,
          pendientes: 0,
          vencidos: 0,
          cumplimiento: 0
        });
      }
      
      const stats = entidadesMap.get(entidadNombre)!;
      stats.total++;
      
      if (['enviado', 'ENVIADO', 'aprobado', 'APROBADO'].includes(p.estado)) {
        stats.enviados++;
      } else {
        stats.pendientes++;
      }
      
      const vencimiento = new Date(p.fechaVencimientoCalculada);
      if (vencimiento < ahora && !['enviado', 'ENVIADO', 'aprobado', 'APROBADO'].includes(p.estado)) {
        stats.vencidos++;
      }
    });

    entidadesMap.forEach(stats => {
      stats.cumplimiento = stats.total > 0 
        ? Math.round((stats.enviados / stats.total) * 100) 
        : 0;
    });

    setEntidadesStats(Array.from(entidadesMap.values()).sort((a, b) => b.total - a.total));

    // Crear timeline
    const events: TimelineEvent[] = periodos
      .filter(p => p.fechaEnvioReal || p.fechaVencimientoCalculada)
      .map(p => {
        let tipo: TimelineEvent['tipo'] = 'pendiente';
        let fecha = p.fechaVencimientoCalculada;
        
        if (p.fechaEnvioReal) {
          fecha = p.fechaEnvioReal;
          if (['aprobado', 'APROBADO'].includes(p.estado)) {
            tipo = 'aprobado';
          } else if (['rechazado', 'RECHAZADO', 'requiere_correccion', 'REQUIERE_CORRECCION'].includes(p.estado)) {
            tipo = 'rechazado';
          } else {
            tipo = 'enviado';
          }
        } else {
          const vencimiento = new Date(p.fechaVencimientoCalculada);
          if (vencimiento < ahora) {
            tipo = 'vencido';
          }
        }
        
        return {
          id: p.periodoId,
          fecha,
          tipo,
          reporteNombre: p.reporteNombre,
          responsable: p.responsableElaboracion?.nombreCompleto || 'Sin asignar',
          entidad: p.entidadNombre || 'Sin entidad'
        };
      })
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 20);

    setTimelineEvents(events);
  };

  const getProgressColor = (porcentaje: number): string => {
    if (porcentaje >= 80) return '#10b981';
    if (porcentaje >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const formatearFecha = (fecha: string): string => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const filtrarMiembros = (): MiembroStats[] => {
    if (!searchTerm) return miembrosStats;
    const termino = searchTerm.toLowerCase();
    return miembrosStats.filter(m => m.nombre.toLowerCase().includes(termino));
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--neutral-600)' }}>Cargando datos de cumplimiento...</p>
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
    <div className="cumplimiento-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-info">
          <h1 className="page-title">Cumplimiento Regulatorio</h1>
          <p className="page-description">Monitoreo detallado del cumplimiento de reportes del equipo</p>
        </div>
      </div>

      {/* Resumen General */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className={`summary-ring ${resumen.cumplimientoGeneral >= 80 ? 'green' : resumen.cumplimientoGeneral >= 50 ? 'yellow' : 'red'}`}>
            <svg viewBox="0 0 36 36" className="circular-chart">
              <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
              <path 
                className="circle" 
                strokeDasharray={`${resumen.cumplimientoGeneral}, 100`} 
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                style={{ stroke: getProgressColor(resumen.cumplimientoGeneral) }}
              />
              <text x="18" y="20.35" className="percentage-text">{resumen.cumplimientoGeneral}%</text>
            </svg>
          </div>
          <div className="summary-info">
            <span className="summary-label">Cumplimiento General</span>
            <span className="summary-value">{resumen.enviados} de {resumen.totalReportes} reportes</span>
          </div>
        </div>
        <div className="summary-card mini">
          <div className="mini-stat green">
            <span className="mini-value">{resumen.enviados}</span>
            <span className="mini-label">Enviados</span>
          </div>
        </div>
        <div className="summary-card mini">
          <div className="mini-stat yellow">
            <span className="mini-value">{resumen.enProgreso}</span>
            <span className="mini-label">En Progreso</span>
          </div>
        </div>
        <div className="summary-card mini">
          <div className="mini-stat red">
            <span className="mini-value">{resumen.vencidos}</span>
            <span className="mini-label">Vencidos</span>
          </div>
        </div>
      </div>

      {/* Tabs de vista */}
      <div className="view-tabs">
        <button 
          className={`view-tab ${activeView === 'equipo' ? 'active' : ''}`}
          onClick={() => setActiveView('equipo')}
        >
          Por Miembro
        </button>
        <button 
          className={`view-tab ${activeView === 'entidad' ? 'active' : ''}`}
          onClick={() => setActiveView('entidad')}
        >
          Por Entidad
        </button>
        <button 
          className={`view-tab ${activeView === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveView('timeline')}
        >
          Línea de Tiempo
        </button>
      </div>

      {/* Vista: Por Miembro del Equipo */}
      {activeView === 'equipo' && (
        <div className="view-content">
          <div className="table-card">
            <div className="table-header">
              <div className="search-box">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
                <input 
                  type="text" 
                  placeholder="Buscar miembro..." 
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            {filtrarMiembros().length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--neutral-500)' }}>
                No hay miembros del equipo con reportes asignados
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Miembro</th>
                    <th>Asignados</th>
                    <th>Enviados</th>
                    <th>En Progreso</th>
                    <th>Pendientes</th>
                    <th>Vencidos</th>
                    <th>Cumplimiento</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrarMiembros().map((miembro) => (
                    <tr key={miembro.usuarioId} className={miembro.vencidos > 0 ? 'warning-row' : ''}>
                      <td>
                        <div className="member-cell">
                          <div className="member-avatar">{miembro.iniciales}</div>
                          <div className="member-info">
                            <span className="member-name">{miembro.nombre}</span>
                            <span className="member-role">{miembro.cargo}</span>
                          </div>
                        </div>
                      </td>
                      <td className="number">{miembro.asignados}</td>
                      <td className="number success">{miembro.enviados}</td>
                      <td className="number warning">{miembro.enProgreso}</td>
                      <td className="number">{miembro.pendientes}</td>
                      <td className="number danger">{miembro.vencidos}</td>
                      <td>
                        <div className="progress-cell">
                          <div className="progress-bar-mini">
                            <div 
                              className="progress-fill-green" 
                              style={{ 
                                width: `${miembro.cumplimiento}%`,
                                background: getProgressColor(miembro.cumplimiento)
                              }}
                            ></div>
                          </div>
                          <span 
                            className="progress-text"
                            style={{ color: getProgressColor(miembro.cumplimiento) }}
                          >
                            {miembro.cumplimiento}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Vista: Por Entidad */}
      {activeView === 'entidad' && (
        <div className="view-content">
          {entidadesStats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--neutral-500)' }}>
              No hay entidades con reportes asignados
            </div>
          ) : (
            <div className="entities-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.5rem'
            }}>
              {entidadesStats.map((entidad) => (
                <div key={entidad.entidadId} className="entity-card" style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: '1px solid var(--neutral-200)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <span style={{
                        display: 'inline-block',
                        background: 'var(--primary-100)',
                        color: 'var(--primary-700)',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '6px',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        marginBottom: '0.5rem'
                      }}>
                        {entidad.sigla}
                      </span>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--neutral-800)' }}>
                        {entidad.nombre}
                      </h3>
                    </div>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: `conic-gradient(${getProgressColor(entidad.cumplimiento)} ${entidad.cumplimiento * 3.6}deg, #e5e7eb 0deg)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        color: getProgressColor(entidad.cumplimiento)
                      }}>
                        {entidad.cumplimiento}%
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                    <div style={{ textAlign: 'center', padding: '0.5rem', background: 'var(--neutral-50)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--neutral-800)' }}>{entidad.total}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>Total</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '0.5rem', background: '#dcfce7', borderRadius: '8px' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#16a34a' }}>{entidad.enviados}</div>
                      <div style={{ fontSize: '0.75rem', color: '#16a34a' }}>Enviados</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '0.5rem', background: '#fef3c7', borderRadius: '8px' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#d97706' }}>{entidad.pendientes}</div>
                      <div style={{ fontSize: '0.75rem', color: '#d97706' }}>Pendientes</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '0.5rem', background: entidad.vencidos > 0 ? '#fee2e2' : 'var(--neutral-50)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: entidad.vencidos > 0 ? '#dc2626' : 'var(--neutral-400)' }}>{entidad.vencidos}</div>
                      <div style={{ fontSize: '0.75rem', color: entidad.vencidos > 0 ? '#dc2626' : 'var(--neutral-400)' }}>Vencidos</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Vista: Timeline */}
      {activeView === 'timeline' && (
        <div className="view-content">
          {timelineEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--neutral-500)' }}>
              No hay eventos recientes
            </div>
          ) : (
            <div className="timeline" style={{ maxWidth: '800px', margin: '0 auto' }}>
              {timelineEvents.map((event, index) => {
                const colores: Record<string, { bg: string; border: string; icon: string }> = {
                  enviado: { bg: '#dbeafe', border: '#3b82f6', icon: '📤' },
                  aprobado: { bg: '#dcfce7', border: '#10b981', icon: '✅' },
                  rechazado: { bg: '#fee2e2', border: '#ef4444', icon: '❌' },
                  vencido: { bg: '#fef3c7', border: '#f59e0b', icon: '⚠️' },
                  pendiente: { bg: '#f3f4f6', border: '#6b7280', icon: '⏳' }
                };
                const estilo = colores[event.tipo];
                
                return (
                  <div key={event.id} style={{
                    display: 'flex',
                    gap: '1rem',
                    marginBottom: '1rem',
                    position: 'relative'
                  }}>
                    {/* Línea vertical */}
                    {index < timelineEvents.length - 1 && (
                      <div style={{
                        position: 'absolute',
                        left: '20px',
                        top: '40px',
                        width: '2px',
                        height: 'calc(100% + 1rem)',
                        background: 'var(--neutral-200)'
                      }}></div>
                    )}
                    {/* Icono */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: estilo.bg,
                      border: `2px solid ${estilo.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      flexShrink: 0,
                      zIndex: 1
                    }}>
                      {estilo.icon}
                    </div>
                    {/* Contenido */}
                    <div style={{
                      flex: 1,
                      background: 'white',
                      borderRadius: '8px',
                      padding: '1rem',
                      border: '1px solid var(--neutral-200)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--neutral-800)', margin: 0 }}>
                          {event.reporteNombre}
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>
                          {formatearFecha(event.fecha)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8125rem', color: 'var(--neutral-600)' }}>
                        <span>👤 {event.responsable}</span>
                        <span>🏢 {event.entidad}</span>
                      </div>
                      <span style={{
                        display: 'inline-block',
                        marginTop: '0.5rem',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        background: estilo.bg,
                        color: estilo.border
                      }}>
                        {event.tipo.charAt(0).toUpperCase() + event.tipo.slice(1)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <style>{`
        .cumplimiento-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .page-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--neutral-900);
          margin: 0;
        }

        .page-description {
          font-size: 0.875rem;
          color: var(--neutral-500);
          margin: 0.25rem 0 0;
        }

        .summary-cards {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .summary-card {
          background: white;
          border-radius: 12px;
          padding: 1.25rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .summary-card.mini {
          padding: 1rem;
        }

        .summary-ring {
          width: 80px;
          height: 80px;
          flex-shrink: 0;
        }

        .circular-chart {
          width: 80px;
          height: 80px;
          display: block;
        }

        .circle-bg {
          fill: none;
          stroke: #e5e7eb;
          stroke-width: 3;
        }

        .circle {
          fill: none;
          stroke-width: 3;
          stroke-linecap: round;
          transition: stroke-dasharray 0.5s ease;
        }

        .percentage-text {
          fill: var(--neutral-800);
          font-size: 0.5rem;
          font-weight: 700;
          text-anchor: middle;
          dominant-baseline: middle;
        }

        .summary-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .summary-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--neutral-700);
        }

        .summary-value {
          font-size: 0.75rem;
          color: var(--neutral-500);
        }

        .mini-stat {
          text-align: center;
          padding: 0.5rem 1rem;
        }

        .mini-stat.green {
          color: #10b981;
        }

        .mini-stat.yellow {
          color: #f59e0b;
        }

        .mini-stat.red {
          color: #ef4444;
        }

        .mini-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .mini-label {
          font-size: 0.75rem;
          color: var(--neutral-500);
        }

        .view-tabs {
          display: flex;
          gap: 0.5rem;
          border-bottom: 1px solid var(--neutral-200);
          padding-bottom: 0;
        }

        .view-tab {
          padding: 0.75rem 1.25rem;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--neutral-600);
          cursor: pointer;
          transition: all 0.2s;
        }

        .view-tab:hover {
          color: var(--neutral-800);
        }

        .view-tab.active {
          color: var(--role-accent, #10b981);
          border-bottom-color: var(--role-accent, #10b981);
        }

        .view-content {
          margin-top: 1rem;
        }

        .table-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .table-header {
          padding: 1rem;
          border-bottom: 1px solid var(--neutral-100);
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          background: var(--neutral-100);
          border-radius: 8px;
          max-width: 300px;
        }

        .search-box svg {
          color: var(--neutral-400);
          flex-shrink: 0;
        }

        .search-input {
          border: none;
          background: transparent;
          outline: none;
          font-size: 0.875rem;
          width: 100%;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th,
        .data-table td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid var(--neutral-100);
        }

        .data-table th {
          background: var(--neutral-50);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--neutral-500);
          text-transform: uppercase;
        }

        .data-table td {
          font-size: 0.875rem;
          color: var(--neutral-700);
        }

        .data-table td.number {
          text-align: center;
          font-weight: 600;
        }

        .data-table td.success {
          color: #10b981;
        }

        .data-table td.warning {
          color: #f59e0b;
        }

        .data-table td.danger {
          color: #ef4444;
        }

        .warning-row {
          background: #fef3c7;
        }

        .member-cell {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .member-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--role-accent, #10b981);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .member-info {
          display: flex;
          flex-direction: column;
        }

        .member-name {
          font-weight: 600;
          color: var(--neutral-800);
        }

        .member-role {
          font-size: 0.75rem;
          color: var(--neutral-500);
        }

        .progress-cell {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .progress-bar-mini {
          flex: 1;
          height: 8px;
          background: var(--neutral-200);
          border-radius: 4px;
          overflow: hidden;
          min-width: 80px;
        }

        .progress-fill-green {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .progress-text {
          font-weight: 600;
          font-size: 0.875rem;
          min-width: 45px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--neutral-200);
          border-top-color: var(--role-accent, #10b981);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .summary-cards {
            flex-direction: column;
          }

          .data-table {
            display: block;
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  );
}
