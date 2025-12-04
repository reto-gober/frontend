import { useState, useEffect } from 'react';
import { flujoReportesService, type ReportePeriodo } from '../../lib/services';

export default function AdminCalendarioClient() {
  const [periodos, setPeriodos] = useState<ReportePeriodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mesActual, setMesActual] = useState(new Date());

  useEffect(() => {
    cargarPeriodos();
  }, []);

  const cargarPeriodos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Cargar periodos de supervisión (admin ve todos)
      const response = await flujoReportesService.supervision(0, 500);
      setPeriodos(response.content);
    } catch (err) {
      console.error('Error al cargar periodos:', err);
      setError('Error al cargar el calendario');
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

  const getPeriodosDelDia = (dia: number) => {
    const fecha = new Date(mesActual.getFullYear(), mesActual.getMonth(), dia);
    const fechaStr = fecha.toISOString().split('T')[0];
    
    return periodos.filter(p => {
      const vencimiento = p.fechaVencimientoCalculada?.split('T')[0];
      return vencimiento === fechaStr;
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
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <p style={{ color: 'var(--error-red-600)' }}>{error}</p>
          <button onClick={cargarPeriodos} className="btn-primary" style={{ marginTop: '1rem' }}>
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
      {/* Header */}
      <div className="calendario-header">
        <h1 className="page-title">Calendario de Vencimientos</h1>
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
          const periodosDelDia = getPeriodosDelDia(dia);
          const esHoy = new Date().toDateString() === new Date(mesActual.getFullYear(), mesActual.getMonth(), dia).toDateString();
          
          return (
            <div key={dia} className={`calendar-day ${esHoy ? 'today' : ''}`}>
              <div className="day-number">{dia}</div>
              {periodosDelDia.length > 0 && (
                <div className="day-events">
                  {periodosDelDia.slice(0, 3).map((periodo, idx) => (
                    <div
                      key={idx}
                      className="event-dot"
                      style={{ backgroundColor: getEstadoColor(periodo.estado) }}
                      title={`${periodo.reporteNombre} - ${periodo.estado}`}
                    />
                  ))}
                  {periodosDelDia.length > 3 && (
                    <span className="more-events">+{periodosDelDia.length - 3}</span>
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
