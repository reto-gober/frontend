import { useState, useEffect } from 'react';
import { calendarioService, type EventoCalendario, type CalendarioResponse } from '../../lib/services';

export default function ResponsableCalendarioClient() {
  const [calendario, setCalendario] = useState<CalendarioResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mesActual, setMesActual] = useState(new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState<number | null>(null);

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
      
      // Llamar al endpoint de calendario responsable
      const response = await calendarioService.responsable({
        fechaInicio,
        fechaFin
      });
      
      setCalendario(response);
      console.log('Calendario responsable cargado:', response);
    } catch (err) {
      console.error('Error al cargar calendario:', err);
      setError('Error al cargar tu calendario. Verifica la consola.');
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
    
    return calendario.eventos.filter(evento => {
      // Filtrar eventos que incluyan este día en su rango o sea el vencimiento
      const start = new Date(evento.startDate);
      const end = new Date(evento.endDate);
      const vencimiento = new Date(evento.fechaVencimiento);
      const current = new Date(fechaStr);
      
      return (current >= start && current <= end) || 
             vencimiento.toISOString().split('T')[0] === fechaStr;
    });
  };

  const cambiarMes = (direccion: number) => {
    setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + direccion, 1));
    setDiaSeleccionado(null);
  };

  const irAHoy = () => {
    setMesActual(new Date());
    setDiaSeleccionado(new Date().getDate());
  };

  const getProximosEventos = (): EventoCalendario[] => {
    if (!calendario) return [];
    
    const hoy = new Date();
    return calendario.eventos
      .filter(evento => new Date(evento.fechaVencimiento) >= hoy)
      .sort((a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime())
      .slice(0, 5);
  };

  const getDiasHastaVencimiento = (fechaVencimiento: string): number => {
    const fechaVenc = new Date(fechaVencimiento);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fechaVenc.setHours(0, 0, 0, 0);
    const diff = fechaVenc.getTime() - hoy.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="calendario-page">
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
          <p style={{ marginTop: '1rem', color: 'var(--neutral-600)' }}>Cargando tu calendario...</p>
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
  const proximosEventos = getProximosEventos();

  return (
    <div className="calendario-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-info">
          <h1 className="page-title">Mi Calendario</h1>
          <p className="page-description">Vista de tus reportes y actividades programadas</p>
          {calendario && (
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--neutral-600)' }}>
              <span>Mis Pendientes: <strong>{calendario.misReportesPendientes || 0}</strong></span>
              <span>Enviados: <strong>{calendario.misReportesEnviados || 0}</strong></span>
            </div>
          )}
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={irAHoy}>Hoy</button>
        </div>
      </div>

      <div className="calendario-container">
        {/* Sidebar con eventos próximos */}
        <div className="calendario-sidebar">
          <div className="sidebar-section">
            <h3 className="section-title">Próximos Vencimientos</h3>
            <div className="eventos-list">
              {proximosEventos.length === 0 ? (
                <p style={{ color: 'var(--neutral-600)', fontSize: '0.9rem', padding: '1rem' }}>
                  No tienes vencimientos próximos
                </p>
              ) : (
                proximosEventos.map((evento, idx) => {
                  const dias = getDiasHastaVencimiento(evento.fechaVencimiento);
                  const fecha = new Date(evento.fechaVencimiento);
                  const urgente = dias <= 2;
                  const warning = dias > 2 && dias <= 7;
                  
                  return (
                    <div key={idx} className={`evento-item ${urgente ? 'urgent' : warning ? 'warning' : ''}`}>
                      <div className="evento-date">
                        <span className="date-day">{fecha.getDate()}</span>
                        <span className="date-month">{fecha.toLocaleDateString('es', { month: 'short' })}</span>
                      </div>
                      <div className="evento-info">
                        <h4 className="evento-title">{evento.titulo}</h4>
                        <span className={`evento-badge ${urgente ? 'urgent' : warning ? 'warning' : ''}`}>
                          {dias === 0 ? 'Hoy' : dias === 1 ? 'Mañana' : `En ${dias} días`}
                        </span>
                        <div style={{ fontSize: '0.8rem', color: 'var(--neutral-600)', marginTop: '0.25rem' }}>
                          {evento.tipo} - {evento.estado}
                        </div>
                        {evento.descripcion && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', marginTop: '0.25rem' }}>
                            {evento.descripcion}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

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
                <span className="legend-color" style={{ backgroundColor: '#FF6B6B' }}></span>
                <span className="legend-label">Rechazado</span>
              </div>
            </div>
          </div>
        </div>

        {/* Calendario principal */}
        <div className="calendario-main">
          <div className="calendario-card">
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
                
                return (
                  <div 
                    key={dia} 
                    className={`calendar-day ${esHoy ? 'today' : ''} ${seleccionado ? 'selected' : ''} ${eventosDelDia.length > 0 ? 'has-events' : ''}`}
                    onClick={() => setDiaSeleccionado(dia)}
                  >
                    <div className="day-number">{dia}</div>
                    {eventosDelDia.length > 0 && (
                      <div className="day-events">
                        {eventosDelDia.slice(0, 2).map((evento, idx) => {
                          const fechaDia = new Date(mesActual.getFullYear(), mesActual.getMonth(), dia).toISOString().split('T')[0];
                          const esVencimiento = evento.fechaVencimiento.split('T')[0] === fechaDia;
                          
                          return (
                            <div
                              key={idx}
                              className="event-dot"
                              style={{ backgroundColor: evento.color }}
                              title={`${evento.titulo}${esVencimiento ? ' ⏰ VENCIMIENTO' : ''}`}
                            >
                              {esVencimiento && <span style={{ fontSize: '0.6rem' }}>⏰</span>}
                            </div>
                          );
                        })}
                        {eventosDelDia.length > 2 && (
                          <div className="more-count">+{eventosDelDia.length - 2}</div>
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
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.25rem' }}>{evento.titulo}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--neutral-600)' }}>
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
    </div>
  );
}
