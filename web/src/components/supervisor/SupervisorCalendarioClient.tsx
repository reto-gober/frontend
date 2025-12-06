import { useState, useEffect } from 'react';
import { calendarioService, type EventoCalendario, type CalendarioResponse } from '../../lib/services';

export default function SupervisorCalendarioClient() {
  const [calendario, setCalendario] = useState<CalendarioResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mesActual, setMesActual] = useState(new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState<number | null>(null);
  const [filtroResponsable, setFiltroResponsable] = useState<string>('');

  useEffect(() => {
    cargarCalendario();
  }, [mesActual]);

  const cargarCalendario = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Calcular rango de fechas del mes actual
      const primerDia = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1);
      const ultimoDia = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0);
      
      const fechaInicio = primerDia.toISOString().split('T')[0];
      const fechaFin = ultimoDia.toISOString().split('T')[0];
      
      // Llamar al endpoint de calendario supervisor
      const response = await calendarioService.supervisor({
        fechaInicio,
        fechaFin
      });
      
      setCalendario(response);
      console.log('Calendario supervisor cargado:', response);
    } catch (err) {
      console.error('Error al cargar calendario:', err);
      setError('Error al cargar el calendario del equipo. Verifica la consola.');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getEventosDelDia = (dia: number): EventoCalendario[] => {
    if (!calendario) return [];
    
    const fecha = new Date(mesActual.getFullYear(), mesActual.getMonth(), dia);
    const fechaStr = fecha.toISOString().split('T')[0];
    
    let eventos = calendario.eventos.filter(evento => {
      // Evento tipo "periodo" - verificar si el día está en el rango
      if (evento.tipo === 'periodo' && evento.startDate && evento.endDate) {
        const start = new Date(evento.startDate);
        const end = new Date(evento.endDate);
        const current = new Date(fechaStr);
        return current >= start && current <= end;
      }
      
      // Evento tipo "vencimiento" - verificar si coincide con el día exacto
      if (evento.tipo === 'vencimiento' || evento.tipo === 'VENCIMIENTO') {
        const eventoDate = evento.date || evento.fechaVencimiento;
        if (eventoDate) {
          return eventoDate.split('T')[0] === fechaStr;
        }
      }
      
      // Compatibilidad con estructura anterior (legacy)
      if (evento.startDate && evento.endDate && evento.fechaVencimiento) {
        const start = new Date(evento.startDate);
        const end = new Date(evento.endDate);
        const vencimiento = new Date(evento.fechaVencimiento);
        const current = new Date(fechaStr);
        
        return (current >= start && current <= end) || 
               vencimiento.toISOString().split('T')[0] === fechaStr;
      }
      
      return false;
    });

    // Filtrar por responsable si hay filtro activo
    if (filtroResponsable) {
      eventos = eventos.filter(e => e.responsableNombre === filtroResponsable || e.responsable === filtroResponsable);
    }

    return eventos;
  };

  const cambiarMes = (direccion: number) => {
    setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + direccion, 1));
    setDiaSeleccionado(null);
  };

  const irAHoy = () => {
    setMesActual(new Date());
    setDiaSeleccionado(new Date().getDate());
  };

  const getResponsablesUnicos = (): string[] => {
    if (!calendario) return [];
    
    const responsables = new Set<string>();
    calendario.eventos.forEach(evento => {
      if (evento.responsableNombre) {
        responsables.add(evento.responsableNombre);
      }
      if (evento.responsable) {
        responsables.add(evento.responsable);
      }
    });
    return Array.from(responsables).sort();
  };

  const getIncidenciasCriticas = (): EventoCalendario[] => {
    if (!calendario) return [];
    
    return calendario.eventos
      .filter(evento => evento.requiereAccion || evento.estado === 'requiere_correccion' || evento.estado === 'vencido')
      .sort((a, b) => {
        const fechaA = a.date || a.fechaVencimiento || a.endDate || '';
        const fechaB = b.date || b.fechaVencimiento || b.endDate || '';
        return new Date(fechaA).getTime() - new Date(fechaB).getTime();
      })
      .slice(0, 5);
  };

  if (loading) {
    return (
      <div className="calendario-page">
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
          <p style={{ marginTop: '1rem', color: 'var(--neutral-600)' }}>Cargando calendario del equipo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="calendario-page">
        <div style={{ 
          textAlign: 'center', 
          padding: '4rem',
          background: 'white',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-card)'
        }}>
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: '0 auto', color: 'var(--error-red-600)' }}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
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
  const responsables = getResponsablesUnicos();
  const incidenciasCriticas = getIncidenciasCriticas();

  return (
    <div className="calendario-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-info">
          <h1 className="page-title">Calendario del Equipo</h1>
          <p className="page-description">Vista general de entregas y vencimientos del equipo</p>
          {calendario && (
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--neutral-600)' }}>
              <span>Incidencias: <strong style={{ color: 'var(--error-red-600)' }}>{calendario.incidenciasCriticas || 0}</strong></span>
              <span>Pendientes Validación: <strong>{calendario.validacionesPendientes || 0}</strong></span>
              {calendario.reportesVencidosEquipo !== undefined && (
                <span>Vencidos: <strong style={{ color: 'var(--error-red-600)' }}>{calendario.reportesVencidosEquipo}</strong></span>
              )}
            </div>
          )}
        </div>
        <div className="header-actions">
          <select 
            className="filter-select" 
            value={filtroResponsable}
            onChange={(e) => setFiltroResponsable(e.target.value)}
            style={{ marginRight: '0.5rem' }}
          >
            <option value="">Todo el equipo</option>
            {responsables.map(resp => (
              <option key={resp} value={resp}>{resp}</option>
            ))}
          </select>
          <button className="btn-secondary" onClick={irAHoy}>Hoy</button>
        </div>
      </div>

      <div className="calendar-container">
        {/* Sidebar con incidencias críticas */}
        <div className="calendar-sidebar">
          <div className="sidebar-section">
            <h3 className="section-title">🚨 Incidencias Críticas</h3>
            <div className="incidencias-list">
              {incidenciasCriticas.length === 0 ? (
                <p style={{ color: 'var(--neutral-600)', fontSize: '0.9rem', padding: '1rem' }}>
                  No hay incidencias críticas
                </p>
              ) : (
                incidenciasCriticas.map((evento, idx) => {
                  const fechaRef = evento.date || evento.fechaVencimiento || evento.endDate;
                  const fecha = fechaRef ? new Date(fechaRef) : new Date();
                  const esPeriodo = evento.tipo === 'periodo';
                  const esVencimiento = evento.tipo === 'vencimiento' || evento.tipo === 'VENCIMIENTO';
                  
                  return (
                    <div key={idx} className="incidencia-item">
                      <div className="incidencia-header">
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                          {esVencimiento && '⏰ '}
                          {esPeriodo && '📊 '}
                          {evento.titulo}
                        </div>
                        {evento.estado && <span className="badge-critical">{evento.estado}</span>}
                      </div>
                      {(evento.responsableNombre || evento.responsable) && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--neutral-600)', marginTop: '0.25rem' }}>
                          👤 {evento.responsableNombre || evento.responsable}
                        </div>
                      )}
                      <div style={{ fontSize: '0.8rem', color: 'var(--neutral-600)', marginTop: '0.25rem' }}>
                        📅 {fecha.toLocaleDateString('es', { day: 'numeric', month: 'short' })} - {evento.tipo || evento.tipoIncidencia || 'N/A'}
                      </div>
                      {evento.descripcion && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', marginTop: '0.25rem' }}>
                          {evento.descripcion}
                        </div>
                      )}
                      {evento.diasVencido && evento.diasVencido > 0 && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--error-red-600)', marginTop: '0.25rem', fontWeight: 500 }}>
                          ⚠️ Vencido hace {evento.diasVencido} días
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Estadísticas del equipo */}
          {calendario && calendario.equipoTotal !== undefined && (
            <div className="sidebar-section">
              <h3 className="section-title">Estadísticas del Equipo</h3>
              <div className="stats-list">
                <div className="stat-item">
                  <div className="stat-label">Total Miembros</div>
                  <div className="stat-value">{calendario.equipoTotal}</div>
                </div>
                {calendario.tasaCumplimientoMes !== undefined && (
                  <div className="stat-item">
                    <div className="stat-label">Cumplimiento Mes</div>
                    <div className="stat-value" style={{ color: calendario.tasaCumplimientoMes >= 80 ? 'var(--success-green-500)' : 'var(--error-red-600)' }}>
                      {calendario.tasaCumplimientoMes.toFixed(1)}%
                    </div>
                  </div>
                )}
                {calendario.promedioTiempoRespuesta && (
                  <div className="stat-item">
                    <div className="stat-label">Tiempo Promedio</div>
                    <div className="stat-value">{calendario.promedioTiempoRespuesta}</div>
                  </div>
                )}
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
                <span className="legend-label">Enviado</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#95E1D3' }}></span>
                <span className="legend-label">Aprobado</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#FFA07A' }}></span>
                <span className="legend-label">Requiere Corrección</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#FF6B6B' }}></span>
                <span className="legend-label">Rechazado/Vencido</span>
              </div>
            </div>
          </div>
        </div>

        {/* Calendario principal */}
        <div className="calendar-main">
          {/* Navegación */}
          <div className="calendar-nav">
            <button className="nav-btn" onClick={() => cambiarMes(-1)}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <h2 className="month-title" style={{ textTransform: 'capitalize' }}>{monthName}</h2>
            <button className="nav-btn" onClick={() => cambiarMes(1)}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>

          {/* Grilla del calendario */}
          <div className="calendar-grid">
            {/* Días de la semana */}
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
              <div key={day} className="calendar-day-header">{day}</div>
            ))}
            
            {/* Días vacíos al inicio */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="calendar-day empty"></div>
            ))}
            
            {/* Días del mes */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dia = i + 1;
              const eventosDelDia = getEventosDelDia(dia);
              const esHoy = new Date().toDateString() === new Date(mesActual.getFullYear(), mesActual.getMonth(), dia).toDateString();
              const seleccionado = diaSeleccionado === dia;
              const tieneCriticos = eventosDelDia.some(e => e.requiereAccion || e.estado === 'vencido');
              
              return (
                <div 
                  key={dia} 
                  className={`calendar-day ${esHoy ? 'today' : ''} ${seleccionado ? 'selected' : ''} ${eventosDelDia.length > 0 ? 'has-events' : ''} ${tieneCriticos ? 'critical' : ''}`}
                  onClick={() => setDiaSeleccionado(dia)}
                >
                  <div className="day-number">{dia}</div>
                  {eventosDelDia.length > 0 && (
                    <div className="day-events">
                      {eventosDelDia.slice(0, 3).map((evento, idx) => {
                        const fechaDia = new Date(mesActual.getFullYear(), mesActual.getMonth(), dia).toISOString().split('T')[0];
                        const esVencimiento = evento.tipo === 'vencimiento' || evento.tipo === 'VENCIMIENTO' ||
                                             (evento.fechaVencimiento && evento.fechaVencimiento.split('T')[0] === fechaDia) ||
                                             (evento.date && evento.date.split('T')[0] === fechaDia);
                        const esPeriodo = evento.tipo === 'periodo';
                        
                        return (
                          <div
                            key={idx}
                            className="event-dot"
                            style={{ 
                              backgroundColor: evento.color,
                              opacity: esPeriodo ? 0.7 : 1,
                              borderRadius: esPeriodo ? '2px' : '50%'
                            }}
                            title={`${evento.titulo} - ${evento.responsableNombre || evento.responsable || 'Sin asignar'}${esVencimiento ? ' ⏰ VENCIMIENTO' : esPeriodo ? ' 📊 PERIODO' : ''}`}
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

          {/* Detalle del día seleccionado */}
          {diaSeleccionado && getEventosDelDia(diaSeleccionado).length > 0 && (
            <div className="selected-day-details">
              <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--color-primary-900)' }}>
                Eventos del {diaSeleccionado} de {monthName.split(' ')[0]}
              </h3>
              <div className="eventos-detail-list">
                {getEventosDelDia(diaSeleccionado).map((evento, idx) => (
                  <div key={idx} className="evento-detail" style={{ borderLeftColor: evento.color }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.25rem' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{evento.titulo}</div>
                      {evento.requiereAccion && (
                        <span className="badge-warning" style={{ fontSize: '0.75rem' }}>Requiere acción</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--neutral-600)' }}>
                      {evento.responsableNombre && `👤 ${evento.responsableNombre} • `}
                      {evento.tipo} - <span style={{ color: evento.color, fontWeight: 500 }}>{evento.estado}</span>
                    </div>
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
