import { useEffect, useMemo, useState } from 'react';
import { dashboardService, type CalendarioAuditor, type EventoCalendarioAuditor } from '../../lib/services';

export default function AuditorCalendarioClient() {
  const [calendario, setCalendario] = useState<CalendarioAuditor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mesActual] = useState(new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState<number | null>(null);
  const [filtroEntidad, setFiltroEntidad] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<string>('');

  useEffect(() => {
    cargarCalendario();
  }, []);

  const cargarCalendario = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await dashboardService.calendarioAuditor();
      setCalendario(data);
      setDiaSeleccionado(new Date().getDate());
    } catch (err: any) {
      console.error('Error al cargar calendario:', err);
      const message = err?.response?.data?.message || 'No se pudo cargar el calendario de auditoria';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const eventosFiltrados = useMemo(() => {
    if (!calendario) return [];
    return calendario.eventos.filter((evento) => {
      const coincideEntidad = filtroEntidad ? evento.entidad === filtroEntidad : true;
      const coincideEstado = filtroEstado ? (evento.estado || '').toLowerCase() === filtroEstado.toLowerCase() : true;
      return coincideEntidad && coincideEstado;
    });
  }, [calendario, filtroEntidad, filtroEstado]);

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const getEventosDelDia = (dia: number): EventoCalendarioAuditor[] => {
    const fecha = new Date(mesActual.getFullYear(), mesActual.getMonth(), dia).toISOString().split('T')[0];
    return eventosFiltrados.filter((evento) => {
      const start = evento.startDate ? new Date(evento.startDate).toISOString().split('T')[0] : null;
      const end = evento.endDate ? new Date(evento.endDate).toISOString().split('T')[0] : null;
      const venc = evento.fechaVencimiento ? new Date(evento.fechaVencimiento).toISOString().split('T')[0] : null;

      if (start && end) {
        return fecha >= start && fecha <= end;
      }
      if (venc) {
        return fecha === venc;
      }
      return false;
    });
  };

  const getEntidadesUnicas = (): string[] => {
    if (!calendario) return [];
    const entidades = new Set<string>();
    calendario.eventos.forEach((e) => entidades.add(e.entidad));
    return Array.from(entidades).sort();
  };

  const getProximosVencimientos = (): EventoCalendarioAuditor[] => {
    const hoy = new Date();
    return eventosFiltrados
      .filter((evento) => {
        const ref = evento.fechaVencimiento || evento.endDate;
        return ref && new Date(ref) >= hoy;
      })
      .sort((a, b) => {
        const fechaA = a.fechaVencimiento || a.endDate || '';
        const fechaB = b.fechaVencimiento || b.endDate || '';
        return new Date(fechaA).getTime() - new Date(fechaB).getTime();
      })
      .slice(0, 8);
  };

  const exportarCalendario = () => {
    if (!calendario) return;
    const headers = [
      'Titulo',
      'Inicio',
      'Fin',
      'Fecha Vencimiento',
      'Estado',
      'Entidad',
      'Tipo',
      'Descripcion',
    ];
    const rows = calendario.eventos.map((evento) => [
      evento.titulo,
      evento.startDate,
      evento.endDate,
      evento.fechaVencimiento,
      evento.estado,
      evento.entidad,
      evento.tipo,
      evento.descripcion || '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calendario_auditoria_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="calendario-page">
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
          <p style={{ marginTop: '1rem', color: 'var(--neutral-600)' }}>Cargando calendario de auditoria...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="calendario-page">
        <div
          style={{
            textAlign: 'center',
            padding: '4rem',
            background: 'white',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: '0 auto', color: 'var(--error-red-600)' }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p style={{ color: 'var(--error-red-600)', marginTop: '1rem', fontSize: '1.125rem' }}>{error}</p>
          <button onClick={cargarCalendario} className="btn-primary" style={{ marginTop: '1.5rem' }}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const daysInMonth = getDaysInMonth(mesActual);
  const firstDay = getFirstDayOfMonth(mesActual);
  const monthName = mesActual.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  const entidades = getEntidadesUnicas();
  const proximosVencimientos = getProximosVencimientos();

  return (
    <div className="calendario-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-info">
          <h1 className="page-title">Calendario de Auditoria</h1>
          <p className="page-description">Eventos y vencimientos reales registrados en el backend</p>
          {calendario?.resumenMes && (
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--neutral-600)' }}>
              <span>Total: <strong>{calendario.resumenMes.totalEventos}</strong></span>
              <span>Vencidos: <strong style={{ color: 'var(--error-red-600)' }}>{calendario.resumenMes.vencidos}</strong></span>
              <span>Pendientes: <strong>{calendario.resumenMes.pendientes}</strong></span>
              <span>Cumplidos: <strong style={{ color: 'var(--success-green-600)' }}>{calendario.resumenMes.cumplidos}</strong></span>
            </div>
          )}
        </div>
        <div className="header-actions">
          <button className="btn-export" onClick={exportarCalendario} style={{ marginRight: '0.5rem' }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7,10 12,15 17,10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Exportar
          </button>
          <button className="btn-secondary" onClick={cargarCalendario}>Actualizar</button>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-bar" style={{ background: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
        <select
          className="filter-select"
          value={filtroEntidad}
          onChange={(e) => setFiltroEntidad(e.target.value)}
        >
          <option value="">Todas las entidades</option>
          {entidades.map((ent) => (
            <option key={ent} value={ent}>{ent}</option>
          ))}
        </select>
        <select
          className="filter-select"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="dentro_plazo">Dentro del plazo</option>
          <option value="enviado_a_tiempo">Enviado</option>
          <option value="enviado_tarde">Enviado tarde</option>
          <option value="aprobado">Aprobado</option>
          <option value="vencido">Vencido</option>
        </select>
        {(filtroEntidad || filtroEstado) && (
          <button
            className="btn-secondary"
            onClick={() => { setFiltroEntidad(''); setFiltroEstado(''); }}
            style={{ padding: '0.5rem 1rem' }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="calendar-layout">
        {/* Sidebar con proximos vencimientos */}
        <div className="calendar-widget">
          <div className="sidebar-section">
            <h3 className="section-title">Proximos vencimientos</h3>
            <div className="eventos-list">
              {proximosVencimientos.length === 0 ? (
                <p style={{ color: 'var(--neutral-600)', fontSize: '0.9rem', padding: '1rem' }}>
                  No hay vencimientos proximos
                </p>
              ) : (
                proximosVencimientos.map((evento, idx) => {
                  const fechaRef = evento.fechaVencimiento || evento.endDate;
                  const fecha = fechaRef ? new Date(fechaRef) : new Date();
                  return (
                    <div key={idx} className="evento-item" style={{ borderLeft: `3px solid ${evento.color}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.25rem' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                          {fecha.toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                        </div>
                        <span className="badge-small" style={{ backgroundColor: evento.color, color: 'white', fontSize: '0.7rem' }}>
                          {evento.tipo}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>{evento.titulo}</div>
                      {evento.entidad && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--neutral-600)' }}>
                          Entidad: {evento.entidad}
                        </div>
                      )}
                      {evento.descripcion && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', marginTop: '0.25rem' }}>
                          {evento.descripcion}
                        </div>
                      )}
                      {evento.estado && (
                        <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                          <span style={{ color: evento.color, fontWeight: 500 }}>{evento.estado}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Estadisticas de cumplimiento */}
          {calendario?.resumenMes && (
            <div className="sidebar-section">
              <h3 className="section-title">Resumen del mes</h3>
              <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="stat-card" style={{ background: 'var(--success-green-50)', padding: '0.75rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success-green-700)' }}>
                    {calendario.resumenMes.cumplidos}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--success-green-600)' }}>Cumplidos</div>
                </div>
                <div className="stat-card" style={{ background: 'var(--accent-orange-50)', padding: '0.75rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-orange-700)' }}>
                    {calendario.resumenMes.pendientes}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-orange-600)' }}>Pendientes</div>
                </div>
                <div className="stat-card" style={{ background: 'var(--error-red-50)', padding: '0.75rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--error-red-700)' }}>
                    {calendario.resumenMes.vencidos}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--error-red-600)' }}>Vencidos</div>
                </div>
                <div className="stat-card" style={{ background: 'var(--neutral-100)', padding: '0.75rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--neutral-700)' }}>
                    {calendario.resumenMes.totalEventos}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--neutral-600)' }}>Eventos</div>
                </div>
              </div>
            </div>
          )}

          {/* Leyenda */}
          <div className="sidebar-section">
            <h3 className="section-title">Leyenda</h3>
            <div className="legend-list">
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#FFE66D' }}></span>
                <span className="legend-label">Pendiente</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#4ECDC4' }}></span>
                <span className="legend-label">Enviado/En curso</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#95E1D3' }}></span>
                <span className="legend-label">Aprobado</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#FFA07A' }}></span>
                <span className="legend-label">Correccion</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#FF6B6B' }}></span>
                <span className="legend-label">Rechazado/Vencido</span>
              </div>
            </div>
          </div>
        </div>

        {/* Calendario principal */}
        <div className="events-panel">
          {/* Navegacion */}
          <div className="calendar-nav">
            <button className="nav-btn" disabled title="Navegacion mensual disponible al exponer rangos en backend">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <h2 className="month-title" style={{ textTransform: 'capitalize' }}>{monthName}</h2>
            <button className="nav-btn" disabled title="Navegacion mensual disponible al exponer rangos en backend">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Grilla del calendario */}
          <div className="calendar-grid">
            {/* Dias de la semana */}
            {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map((day) => (
              <div key={day} className="calendar-day-header">{day}</div>
            ))}

            {/* Dias vacios al inicio */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="calendar-day empty"></div>
            ))}

            {/* Dias del mes */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dia = i + 1;
              const eventosDelDia = getEventosDelDia(dia);
              const esHoy =
                new Date().toDateString() ===
                new Date(mesActual.getFullYear(), mesActual.getMonth(), dia).toDateString();
              const seleccionado = diaSeleccionado === dia;

              return (
                <div
                  key={dia}
                  className={`calendar-day ${esHoy ? 'today' : ''} ${seleccionado ? 'selected' : ''} ${eventosDelDia.length > 0 ? 'has-events' : ''}`}
                  onClick={() => setDiaSeleccionado(dia)}
                >
                  <div className="day-number">{dia}</div>
                  {eventosDelDia.length > 0 && (
                    <div className="day-events">
                      {eventosDelDia.slice(0, 3).map((evento, idx) => {
                        const fechaDia = new Date(
                          mesActual.getFullYear(),
                          mesActual.getMonth(),
                          dia
                        )
                          .toISOString()
                          .split('T')[0];
                        const esVencimiento = evento.fechaVencimiento
                          ? evento.fechaVencimiento.split('T')[0] === fechaDia
                          : false;
                        return (
                          <div
                            key={idx}
                            className="event-dot"
                            style={{
                              backgroundColor: evento.color,
                              opacity: esVencimiento ? 1 : 0.75,
                              borderRadius: esVencimiento ? '50%' : '2px',
                            }}
                            title={`${evento.titulo} - ${evento.entidad || ''}${esVencimiento ? ' | Vencimiento' : ''}`}
                          />
                        );
                      })}
                      {eventosDelDia.length > 3 && (
                        <div className="more-count">+{eventosDelDia.length - 3}</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Detalle del dia seleccionado */}
          {diaSeleccionado && getEventosDelDia(diaSeleccionado).length > 0 && (
            <div className="selected-day-details">
              <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--color-primary-900)' }}>
                Eventos del {diaSeleccionado} de {monthName.split(' ')[0]}
              </h3>
              <div className="eventos-detail-list">
                {getEventosDelDia(diaSeleccionado).map((evento, idx) => (
                  <div key={idx} className="evento-detail" style={{ borderLeftColor: evento.color }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.25rem' }}>{evento.titulo}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--neutral-600)' }}>
                      {evento.entidad && `Entidad: ${evento.entidad} `}
                      {evento.tipo} - <span style={{ color: evento.color, fontWeight: 500 }}>{evento.estado}</span>
                    </div>
                    {evento.descripcion && (
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--neutral-500)',
                          marginTop: '0.25rem',
                          padding: '0.5rem',
                          background: 'var(--neutral-50)',
                          borderRadius: '4px',
                        }}
                      >
                        {evento.descripcion}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
