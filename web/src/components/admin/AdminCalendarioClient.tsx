import { useState, useEffect } from 'react';
import { calendarioService, reportesService, type EventoCalendario, type CalendarioResponse, type ReportePeriodo, type ReporteResponse } from '../../lib/services';
import notifications from '../../lib/notifications';

export default function AdminCalendarioClient() {
  const [calendario, setCalendario] = useState<CalendarioResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mesActual, setMesActual] = useState(new Date());
  
  // Modal de resumen
  const [showModal, setShowModal] = useState(false);
  const [reporteSeleccionado, setReporteSeleccionado] = useState<ReporteResponse | null>(null);
  const [loadingReporte, setLoadingReporte] = useState(false);

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

  const getEventosDelDia = (dia: number): EventoCalendario[] => {
    if (!calendario) return [];
    
    const fecha = new Date(mesActual.getFullYear(), mesActual.getMonth(), dia);
    const fechaStr = fecha.toISOString().split('T')[0];
    
    return calendario.eventos.filter(evento => {
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

  const handleEventoClick = async (evento: EventoCalendario) => {
    // Si el evento no tiene reporteId, no podemos hacer nada
    if (!evento.reporteId) {
      console.warn('Evento sin reporteId:', evento);
      return;
    }

    try {
      setLoadingReporte(true);
      setShowModal(true);
      
      // Obtener los datos completos del reporte
      const reporte = await reportesService.obtener(evento.reporteId);
      setReporteSeleccionado(reporte);
    } catch (error) {
      console.error('Error al cargar el reporte:', error);
      notifications.error('No se pudo cargar la información del reporte');
      setShowModal(false);
    } finally {
      setLoadingReporte(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setReporteSeleccionado(null);
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
          const eventosDelDia = getEventosDelDia(dia);
          const esHoy = new Date().toDateString() === new Date(mesActual.getFullYear(), mesActual.getMonth(), dia).toDateString();
          
          return (
            <div key={dia} className={`calendar-day ${esHoy ? 'today' : ''}`}>
              <div className="day-number">{dia}</div>
              {eventosDelDia.length > 0 && (
                <div className="day-events">
                  {eventosDelDia.slice(0, 3).map((evento, idx) => {
                    const fechaDia = new Date(mesActual.getFullYear(), mesActual.getMonth(), dia).toISOString().split('T')[0];
                    
                    // Determinar si es vencimiento
                    const esVencimiento = evento.tipo === 'vencimiento' || evento.tipo === 'VENCIMIENTO' ||
                                         (evento.fechaVencimiento && evento.fechaVencimiento.split('T')[0] === fechaDia) ||
                                         (evento.date && evento.date.split('T')[0] === fechaDia);
                    
                    // Determinar si es periodo (barra continua)
                    const esPeriodo = evento.tipo === 'periodo' && evento.startDate && evento.endDate;
                    
                    return (
                      <div
                        key={idx}
                        className={`event-item ${esPeriodo ? 'event-periodo' : 'event-vencimiento'}`}
                        style={{ 
                          borderLeftColor: evento.color,
                          backgroundColor: esPeriodo ? `${evento.color}20` : 'transparent',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleEventoClick(evento)}
                        title={`${evento.titulo}\n${evento.descripcion || ''}\n${esVencimiento ? '⏰ VENCIMIENTO' : esPeriodo ? '📊 PERIODO' : 'Evento'}`}
                      >
                        <div className="event-title">
                          {esVencimiento && '⏰ '}
                          {esPeriodo && '📊 '}
                          {evento.titulo}
                        </div>
                        {evento.estado && (
                          <div className="event-tipo">{evento.tipo} - {evento.estado}</div>
                        )}
                      </div>
                    );
                  })}
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

      {/* Modal de Resumen del Reporte */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2 className="modal-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                Resumen del Reporte
              </h2>
              <button className="modal-close" onClick={handleCloseModal}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {loadingReporte ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                  <p style={{ marginTop: '1rem', color: 'var(--neutral-600)' }}>Cargando información...</p>
                </div>
              ) : reporteSeleccionado ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Información básica */}
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-primary-900)', marginBottom: '1rem' }}>
                      {reporteSeleccionado.nombre}
                    </h3>
                    {reporteSeleccionado.descripcion && (
                      <p style={{ color: 'var(--neutral-600)', lineHeight: 1.6, fontSize: '0.9375rem' }}>
                        {reporteSeleccionado.descripcion}
                      </p>
                    )}
                  </div>

                  {/* Detalles en grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1.5rem', background: 'var(--neutral-50)', borderRadius: '8px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>
                        Frecuencia
                      </label>
                      <p style={{ fontSize: '0.9375rem', color: 'var(--neutral-900)', fontWeight: 500 }}>
                        {reporteSeleccionado.frecuencia}
                      </p>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>
                        Formato
                      </label>
                      <p style={{ fontSize: '0.9375rem', color: 'var(--neutral-900)', fontWeight: 500 }}>
                        {reporteSeleccionado.formatoRequerido}
                      </p>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>
                        Vencimiento
                      </label>
                      <p style={{ fontSize: '0.9375rem', color: 'var(--neutral-900)', fontWeight: 500 }}>
                        {new Date(reporteSeleccionado.fechaVencimiento + 'T00:00:00').toLocaleDateString('es-CO', { 
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>
                        Estado
                      </label>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        backgroundColor: reporteSeleccionado.estado === 'activo' ? 'var(--success-green-50)' : 'var(--neutral-100)',
                        color: reporteSeleccionado.estado === 'activo' ? 'var(--success-green-700)' : 'var(--neutral-600)'
                      }}>
                        {reporteSeleccionado.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>

                  {/* Base Legal */}
                  {reporteSeleccionado.baseLegal && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--neutral-700)', marginBottom: '0.5rem' }}>
                        Base Legal
                      </label>
                      <p style={{ color: 'var(--neutral-600)', lineHeight: 1.6, fontSize: '0.875rem' }}>
                        {reporteSeleccionado.baseLegal}
                      </p>
                    </div>
                  )}

                  {/* Instrucciones */}
                  {reporteSeleccionado.linkInstrucciones && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--neutral-700)', marginBottom: '0.5rem' }}>
                        Instrucciones
                      </label>
                      <a 
                        href={reporteSeleccionado.linkInstrucciones} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: 'var(--color-primary-600)', textDecoration: 'none', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        Ver documento
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                          <polyline points="15 3 21 3 21 9"/>
                          <line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <p style={{ color: 'var(--neutral-500)' }}>No se pudo cargar la información</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCloseModal}>
                Cerrar
              </button>
              {reporteSeleccionado && (
                <a 
                  href={`/roles/admin/reportes/${reporteSeleccionado.reporteId}`} 
                  className="btn btn-primary"
                >
                  Ver Detalles Completos
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
