import { useState, useEffect } from 'react';
import { calendarioService, type EventoCalendario, type CalendarioResponse } from '../../lib/services';

export default function AdminCalendarioClient() {
  const [calendario, setCalendario] = useState<CalendarioResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mesActual, setMesActual] = useState(new Date());

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
      
      // Llamar al endpoint de calendario admin
      const response = await calendarioService.admin({
        fechaInicio,
        fechaFin
      });
      
      setCalendario(response);
      console.log('Calendario cargado:', response);
    } catch (err) {
      console.error('Error al cargar calendario:', err);
      setError('Error al cargar el calendario. Verifica la consola y Network tab.');
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

  const getPeriodosDelDia = (dia: number): EventoCalendario[] => {
    if (!calendario) return [];
    
    const fecha = new Date(mesActual.getFullYear(), mesActual.getMonth(), dia);
    const fechaStr = fecha.toISOString().split('T')[0];
    
    return calendario.eventos.filter(evento => {
      const fechaEvento = evento.fecha.split('T')[0];
      return fechaEvento === fechaStr;
    });
  };

  const getEstadoColor = (estado: string) => {
    switch(estado) {
      case 'pendiente': return 'var(--neutral-400)';
      case 'en_elaboracion': return 'var(--color-primary-500)';
      case 'enviado': return 'var(--color-primary-600)';
      case 'aprobado': return 'var(--success-green-500)';
      case 'requiere_correccion': return 'var(--accent-orange-500)';
      case 'rechazado': return 'var(--error-red-500)';
      case 'vencido': return 'var(--error-red-600)';
      default: return 'var(--neutral-400)';
    }
  };

  const cambiarMes = (direccion: number) => {
    setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + direccion, 1));
  };

  if (loading) {
    return (
      <div className="calendario-page">
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
          <p style={{ marginTop: '1rem', color: 'var(--neutral-600)' }}>Cargando calendario...</p>
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
          <p style={{ color: 'var(--neutral-600)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
            Abre la consola del navegador (F12) y revisa la pestaña Network para más detalles
          </p>
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

  return (
    <div className="calendario-page">
      {/* Header con estadísticas */}
      <div className="calendario-header">
        <div>
          <h1 className="page-title">Calendario de Vencimientos</h1>
          {calendario && (
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--neutral-600)' }}>
              <span>Total: <strong>{calendario.totalEventosMes}</strong></span>
              <span>Vencidos: <strong style={{ color: 'var(--error-red-600)' }}>{calendario.eventosVencidosMes}</strong></span>
              <span>Próximos: <strong style={{ color: 'var(--accent-orange-500)' }}>{calendario.eventosProximosMes}</strong></span>
            </div>
          )}
        </div>
        <div className="calendar-controls">
          <button className="btn-icon" onClick={() => cambiarMes(-1)}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <span className="month-name">{monthName}</span>
          <button className="btn-icon" onClick={() => cambiarMes(1)}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Calendario */}
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
          const eventosDelDia = getPeriodosDelDia(dia);
          const esHoy = new Date().toDateString() === new Date(mesActual.getFullYear(), mesActual.getMonth(), dia).toDateString();
          
          return (
            <div key={dia} className={`calendar-day ${esHoy ? 'today' : ''}`}>
              <div className="day-number">{dia}</div>
              {eventosDelDia.length > 0 && (
                <div className="day-events">
                  {eventosDelDia.slice(0, 3).map((evento, idx) => (
                    <div
                      key={idx}
                      className="event-item"
                      style={{ borderLeftColor: evento.color }}
                      title={`${evento.titulo}\n${evento.tipo} - ${evento.estado}`}
                    >
                      <div className="event-title">{evento.titulo}</div>
                      <div className="event-tipo">{evento.tipo}</div>
                    </div>
                  ))}
                  {eventosDelDia.length > 3 && (
                    <div className="more-events">+{eventosDelDia.length - 3} más</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: 'var(--neutral-400)' }}></div>
          <span>Pendiente</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: 'var(--color-primary-500)' }}></div>
          <span>En Elaboración</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: 'var(--success-green-500)' }}></div>
          <span>Aprobado</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: 'var(--accent-orange-500)' }}></div>
          <span>Requiere Corrección</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: 'var(--error-red-600)' }}></div>
          <span>Vencido</span>
        </div>
      </div>
    </div>
  );
}
