import { useEffect, useMemo, useState } from 'react';
import {
  calendarioService,
  reportesService,
  type CalendarioResponse,
  type EventoCalendario,
  type ReporteResponse,
} from '../../lib/services';
import notifications from '../../lib/notifications';
import { useAuth } from '../../lib/contexts/AuthContext';

export default function SupervisorCalendarioClient() {
  const { user } = useAuth();
  const supervisorId = user?.usuario?.usuarioId;

  const [calendario, setCalendario] = useState<CalendarioResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mesActual, setMesActual] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [reporteSeleccionado, setReporteSeleccionado] = useState<ReporteResponse | null>(null);
  const [loadingReporte, setLoadingReporte] = useState(false);

  useEffect(() => {
    cargarCalendario();
  }, [mesActual, supervisorId]);

  const cargarCalendario = async () => {
    try {
      setLoading(true);
      setError(null);

      const primerDia = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1);
      const ultimoDia = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0);

      const fechaInicio = primerDia.toISOString().split('T')[0];
      const fechaFin = ultimoDia.toISOString().split('T')[0];

      const response = await calendarioService.supervisor({ fechaInicio, fechaFin });

      const eventosBase = Array.isArray(response?.eventos)
        ? response.eventos
        : Array.isArray((response as any)?.incidencias)
          ? (response as any).incidencias
          : [];

      const eventosFiltrados = supervisorId
        ? eventosBase.filter(e => !e.supervisorId || e.supervisorId === supervisorId)
        : eventosBase;

      setCalendario({
        ...response,
        eventos: eventosFiltrados,
        totalEventosMes: response?.totalEventosMes ?? eventosFiltrados.length,
        eventosVencidosMes: response?.eventosVencidosMes ?? eventosFiltrados.filter(e => e.estado === 'vencido').length,
        eventosProximosMes: response?.eventosProximosMes ?? eventosFiltrados.filter(e => e.estado === 'pendiente').length,
        validacionesPendientes: response?.validacionesPendientes ?? eventosFiltrados.filter(e => e.estado === 'en_revision' || e.estado === 'pendiente_validacion').length,
        incidenciasCriticas: response?.incidenciasCriticas,
      });
    } catch (err: any) {
      console.error('Error al cargar calendario supervisor:', err);
      setError('Error al cargar el calendario. Revisa la pestana Network o el backend.');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const getEventosDelDia = (dia: number): EventoCalendario[] => {
    if (!calendario?.eventos) return [];

    const fecha = new Date(mesActual.getFullYear(), mesActual.getMonth(), dia);
    const fechaStr = fecha.toISOString().split('T')[0];

    return calendario.eventos.filter(evento => {
      if (evento.tipo === 'periodo' && evento.startDate && evento.endDate) {
        const start = new Date(evento.startDate);
        const end = new Date(evento.endDate);
        return fecha >= start && fecha <= end;
      }

      const eventoDate = evento.date || evento.fechaVencimiento;
      if (evento.tipo === 'vencimiento' || evento.tipo === 'VENCIMIENTO' || evento.tipo === 'ENVIO' || evento.tipo === 'APROBACION') {
        if (eventoDate) {
          return eventoDate.split('T')[0] === fechaStr;
        }
      }

      if (evento.startDate && evento.endDate && evento.fechaVencimiento) {
        const start = new Date(evento.startDate);
        const end = new Date(evento.endDate);
        const vencimiento = new Date(evento.fechaVencimiento);

        return (fecha >= start && fecha <= end) || vencimiento.toISOString().split('T')[0] === fechaStr;
      }

      return false;
    });
  };

  const incidenciasCriticas = useMemo(() => {
    if (!calendario?.eventos) return [];
    return calendario.eventos
      .filter(e => e.estado === 'vencido' || e.estado === 'requiere_correccion' || e.requiereAccion)
      .sort((a, b) => {
        const fechaA = a.date || a.fechaVencimiento || a.endDate || '';
        const fechaB = b.date || b.fechaVencimiento || b.endDate || '';
        return new Date(fechaA).getTime() - new Date(fechaB).getTime();
      })
      .slice(0, 6);
  }, [calendario]);

  const cambiarMes = (direccion: number) => {
    setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + direccion, 1));
  };

  const handleEventoClick = async (evento: EventoCalendario) => {
    if (!evento.reporteId) {
      return;
    }

    try {
      setLoadingReporte(true);
      setShowModal(true);
      const reporte = await reportesService.obtener(evento.reporteId);
      setReporteSeleccionado(reporte);
    } catch (err) {
      console.error('No se pudo cargar el reporte', err);
      notifications.error('No se pudo cargar el detalle del reporte');
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
          boxShadow: 'var(--shadow-card)',
        }}>
          <p style={{ color: 'var(--error-red-600)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>{error}</p>
          <button onClick={cargarCalendario} className="btn-primary" style={{ marginTop: '1rem' }}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const daysInMonth = getDaysInMonth(mesActual);
  const firstDay = getFirstDayOfMonth(mesActual);
  const monthName = mesActual.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

  const totalEventos = calendario?.totalEventosMes ?? calendario?.eventos?.length ?? 0;
  const eventosVencidos = calendario?.eventosVencidosMes ?? calendario?.eventos?.filter(e => e.estado === 'vencido').length ?? 0;
  const eventosProximos = calendario?.eventosProximosMes ?? calendario?.eventos?.filter(e => e.estado === 'pendiente').length ?? 0;
  const pendientesRevision = calendario?.validacionesPendientes ?? calendario?.eventos?.filter(e =>
    e.estado === 'en_revision' || e.estado === 'pendiente_validacion').length ?? 0;

  return (
    <div className="calendario-page">
      <div className="calendario-header">
        <div>
          <h1 className="page-title">Calendario de supervision</h1>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', color: 'var(--neutral-600)', fontSize: '0.95rem' }}>
            <span>Total: <strong>{totalEventos}</strong></span>
            <span>Vencidos: <strong style={{ color: 'var(--error-red-600)' }}>{eventosVencidos}</strong></span>
            <span>Proximos: <strong style={{ color: 'var(--accent-orange-500)' }}>{eventosProximos}</strong></span>
            <span>Validacion pendiente: <strong style={{ color: 'var(--color-primary-600)' }}>{pendientesRevision}</strong></span>
          </div>
        </div>
        <div className="calendar-controls">
          <button className="btn-icon" onClick={() => cambiarMes(-1)}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="month-name">{monthName}</span>
          <button className="btn-icon" onClick={() => cambiarMes(1)}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="calendar-layout">
        <div className="calendar-grid">
          {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map(day => (
            <div key={day} className="calendar-day-header">{day}</div>
          ))}

          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="calendar-day empty"></div>
          ))}

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
                      const color = evento.color || 'var(--color-primary-500)';
                      const esPeriodo = evento.tipo === 'periodo' && evento.startDate && evento.endDate;
                      const esVencimiento = (evento.tipo === 'vencimiento' || evento.tipo === 'VENCIMIENTO') &&
                        (evento.date || evento.fechaVencimiento);

                      return (
                        <div
                          key={idx}
                          className={`event-item ${esPeriodo ? 'event-periodo' : 'event-vencimiento'}`}
                          style={{
                            borderLeftColor: color,
                            backgroundColor: esPeriodo ? `${color}20` : 'transparent',
                            cursor: evento.reporteId ? 'pointer' : 'default',
                          }}
                          onClick={() => handleEventoClick(evento)}
                          title={`${evento.titulo}${esVencimiento ? ' - Vencimiento' : ''}`}
                        >
                          <div className="event-title">
                            {evento.titulo}
                          </div>
                          {evento.estado && (
                            <div className="event-tipo">{evento.tipo} - {evento.estado}</div>
                          )}
                        </div>
                      );
                    })}
                    {eventosDelDia.length > 3 && (
                      <div className="more-events">+{eventosDelDia.length - 3} mas</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="calendar-aside">
          <div className="calendar-card">
            <div className="card-header">
              <h3>Incidencias criticas</h3>
              <span className="pill pill-danger">{incidenciasCriticas.length}</span>
            </div>
            {incidenciasCriticas.length === 0 ? (
              <p className="empty-text">Sin incidencias para este mes</p>
            ) : (
              <div className="incidencias-list">
                {incidenciasCriticas.map((evento, idx) => {
                  const fechaRef = evento.date || evento.fechaVencimiento || evento.endDate;
                  const fecha = fechaRef ? new Date(fechaRef) : null;
                  const color = evento.color || '#ef4444';

                  return (
                    <div key={`${evento.eventoId}-${idx}`} className="incidencia-item" onClick={() => handleEventoClick(evento)}>
                      <div className="incidencia-dot" style={{ backgroundColor: color }}></div>
                      <div className="incidencia-content">
                        <div className="incidencia-title">{evento.titulo}</div>
                        <div className="incidencia-meta">
                          {evento.responsable || evento.responsableNombre || 'Sin responsable'}
                          {fecha && ` · ${fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="calendar-card">
            <div className="card-header">
              <h3>Resumen rapido</h3>
            </div>
            <div className="mini-stats">
              <div className="mini-stat">
                <span className="mini-label">Validacion pendiente</span>
                <strong>{pendientesRevision}</strong>
              </div>
              <div className="mini-stat">
                <span className="mini-label">Vencidos</span>
                <strong style={{ color: 'var(--error-red-600)' }}>{eventosVencidos}</strong>
              </div>
              <div className="mini-stat">
                <span className="mini-label">Proximos</span>
                <strong style={{ color: 'var(--accent-orange-500)' }}>{eventosProximos}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: 'var(--neutral-400)' }}></div>
          <span>Pendiente</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: 'var(--color-primary-500)' }}></div>
          <span>En elaboracion</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: 'var(--success-green-500)' }}></div>
          <span>Aprobado</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: 'var(--accent-orange-500)' }}></div>
          <span>Correccion</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: 'var(--error-red-600)' }}></div>
          <span>Vencido</span>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Detalle del reporte</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {loadingReporte ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                  <p style={{ marginTop: '1rem', color: 'var(--neutral-600)' }}>Cargando informacion...</p>
                </div>
              ) : reporteSeleccionado ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary-900)', margin: 0 }}>
                      {reporteSeleccionado.nombre}
                    </h3>
                    {reporteSeleccionado.descripcion && (
                      <p style={{ color: 'var(--neutral-600)', lineHeight: 1.6, marginTop: '0.25rem' }}>
                        {reporteSeleccionado.descripcion}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem', background: 'var(--neutral-50)', borderRadius: '8px' }}>
                    <div>
                      <span className="mini-label">Frecuencia</span>
                      <p style={{ margin: 0, fontWeight: 600 }}>{reporteSeleccionado.frecuencia}</p>
                    </div>
                    <div>
                      <span className="mini-label">Formato</span>
                      <p style={{ margin: 0, fontWeight: 600 }}>{reporteSeleccionado.formatoRequerido}</p>
                    </div>
                    <div>
                      <span className="mini-label">Vencimiento</span>
                      <p style={{ margin: 0, fontWeight: 600 }}>
                        {new Date(reporteSeleccionado.fechaVencimiento + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <span className="mini-label">Estado</span>
                      <p style={{ margin: 0, fontWeight: 600, color: reporteSeleccionado.estado === 'activo' ? 'var(--success-green-600)' : 'var(--neutral-600)' }}>
                        {reporteSeleccionado.estado}
                      </p>
                    </div>
                  </div>

                  {reporteSeleccionado.baseLegal && (
                    <div>
                      <span className="mini-label">Base legal</span>
                      <p style={{ color: 'var(--neutral-600)', marginTop: '0.25rem' }}>{reporteSeleccionado.baseLegal}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ color: 'var(--neutral-500)' }}>No se pudo cargar la informacion</p>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCloseModal}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
