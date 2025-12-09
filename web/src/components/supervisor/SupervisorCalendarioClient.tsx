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
        ? eventosBase.filter((e: any) => !e.supervisorId || e.supervisorId === supervisorId)
        : eventosBase;

      setCalendario({
        ...response,
        eventos: eventosFiltrados,
        totalEventosMes: response?.totalEventosMes ?? eventosFiltrados.length,
        eventosVencidosMes: response?.eventosVencidosMes ?? eventosFiltrados.filter((e: any) => e.estado === 'vencido').length,
        eventosProximosMes: response?.eventosProximosMes ?? eventosFiltrados.filter((e: any) => e.estado === 'pendiente').length,
        validacionesPendientes: response?.validacionesPendientes ?? eventosFiltrados.filter((e: any) => e.estado === 'en_revision' || e.estado === 'pendiente_validacion').length,
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
          <div className="modal-content reporte-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-modern">
              <div className="modal-header-content">
                <div className="modal-icon">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <div>
                  <h2 className="modal-title">Detalle del Reporte</h2>
                  <p className="modal-subtitle">Información completa del reporte</p>
                </div>
              </div>
              <button className="modal-close-modern" onClick={handleCloseModal} aria-label="Cerrar">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="modal-body-modern">
              {loadingReporte ? (
                <div className="loading-state">
                  <div className="loading-spinner-modern"></div>
                  <p className="loading-text">Cargando información del reporte...</p>
                </div>
              ) : reporteSeleccionado ? (
                <div className="reporte-detail-content">
                  {/* Encabezado del Reporte */}
                  <div className="reporte-header-section">
                    <h3 className="reporte-nombre">{reporteSeleccionado.nombre}</h3>
                    {reporteSeleccionado.descripcion && (
                      <p className="reporte-descripcion">{reporteSeleccionado.descripcion}</p>
                    )}
                  </div>

                  {/* Estado y Información Principal */}
                  <div className="info-cards-grid">
                    <div className="info-card info-card-primary">
                      <div className="info-card-icon">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      </div>
                      <div className="info-card-content">
                        <span className="info-card-label">Frecuencia</span>
                        <span className="info-card-value">{reporteSeleccionado.frecuencia}</span>
                      </div>
                    </div>

                    <div className="info-card info-card-warning">
                      <div className="info-card-icon">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      </div>
                      <div className="info-card-content">
                        <span className="info-card-label">Fecha de Vencimiento</span>
                        <span className="info-card-value">
                          {new Date(reporteSeleccionado.fechaVencimiento + 'T00:00:00').toLocaleDateString('es-CO', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="info-card info-card-success">
                      <div className="info-card-icon">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                      <div className="info-card-content">
                        <span className="info-card-label">Formato Requerido</span>
                        <span className="info-card-value">{reporteSeleccionado.formatoRequerido}</span>
                      </div>
                    </div>

                    <div className={`info-card ${reporteSeleccionado.estado === 'activo' ? 'info-card-active' : 'info-card-inactive'}`}>
                      <div className="info-card-icon">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                      </div>
                      <div className="info-card-content">
                        <span className="info-card-label">Estado</span>
                        <span className="info-card-value">
                          {reporteSeleccionado.estado.charAt(0).toUpperCase() + reporteSeleccionado.estado.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Responsables */}
                  {reporteSeleccionado.responsables && reporteSeleccionado.responsables.length > 0 && (
                    <div className="detail-section">
                      <h4 className="section-title">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        Responsables
                      </h4>
                      <div className="responsables-grid">
                        {reporteSeleccionado.responsables
                          .filter(r => r.tipoResponsabilidad === 'elaboracion')
                          .map((responsable, idx) => (
                            <div key={`elab-${idx}`} className="responsable-item">
                              <div className="responsable-badge elabora">E</div>
                              <div>
                                <div className="responsable-label">Elabora</div>
                                <div className="responsable-nombre">{responsable.nombreCompleto}</div>
                              </div>
                            </div>
                          ))
                        }
                        {reporteSeleccionado.responsables
                          .filter(r => r.tipoResponsabilidad === 'supervision')
                          .map((responsable, idx) => (
                            <div key={`super-${idx}`} className="responsable-item">
                              <div className="responsable-badge supervisa">S</div>
                              <div>
                                <div className="responsable-label">Supervisa</div>
                                <div className="responsable-nombre">{responsable.nombreCompleto}</div>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}

                  {/* Base Legal */}
                  {reporteSeleccionado.baseLegal && (
                    <div className="detail-section">
                      <h4 className="section-title">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        Base Legal
                      </h4>
                      <div className="base-legal-content">
                        <p>{reporteSeleccionado.baseLegal}</p>
                      </div>
                    </div>
                  )}

                  {/* Entidad */}
                  {reporteSeleccionado.entidadNombre && (
                    <div className="detail-section">
                      <h4 className="section-title">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                          <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        Entidad
                      </h4>
                      <div className="entidad-badge">
                        {reporteSeleccionado.entidadNombre}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="empty-state">
                  <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p>No se pudo cargar la información del reporte</p>
                </div>
              )}
            </div>

            <div className="modal-footer-modern">
              <button className="btn-modern btn-secondary-modern" onClick={handleCloseModal}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
