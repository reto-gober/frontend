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
      
      console.log('📅 Cargando calendario supervisor...', { fechaInicio, fechaFin });
      
      // Llamar al endpoint de calendario supervisor
      const response = await calendarioService.supervisor({
        fechaInicio,
        fechaFin
      });
      
      console.log('📊 Calendario supervisor cargado:', response);
      console.log('📊 Eventos:', response?.eventos);
      console.log('📊 Tipo de eventos:', Array.isArray(response?.eventos) ? 'Array' : typeof response?.eventos);
      
      // Normalizar la respuesta para asegurar que eventos sea un array
      const calendarioNormalizado = {
        ...response,
        eventos: Array.isArray(response?.eventos) ? response.eventos : []
      };
      
      setCalendario(calendarioNormalizado);
      console.log('✅ Calendario normalizado:', calendarioNormalizado);
    } catch (err) {
      console.error('❌ Error al cargar calendario:', err);
      setError('Error al cargar el calendario del equipo. Verifica que el backend esté funcionando.');
      // Setear un calendario vacío en caso de error para evitar crashes
      setCalendario({
        eventos: [],
        totalEventosMes: 0,
        eventosVencidosMes: 0,
        eventosProximosMes: 0
      });
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
    if (!calendario || !calendario.eventos || !Array.isArray(calendario.eventos)) return [];
    
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
    if (!calendario || !calendario.eventos || !Array.isArray(calendario.eventos)) return [];
    
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
    if (!calendario || !calendario.eventos || !Array.isArray(calendario.eventos)) return [];
    
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
    <div className="calendario-page" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '1.5rem',
      padding: '1.5rem',
      minHeight: '100vh',
      backgroundColor: '#f8f9fa'
    }}>
      {/* Header */}
      <div className="page-header" style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, marginBottom: '0.25rem' }}>Calendario del Equipo</h1>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>Vista general de entregas y vencimientos del equipo</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <select 
              value={filtroResponsable}
              onChange={(e) => setFiltroResponsable(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '0.875rem'
              }}
            >
              <option value="">Todo el equipo</option>
              {responsables.map(resp => (
                <option key={resp} value={resp}>{resp}</option>
              ))}
            </select>
            <button 
              onClick={irAHoy}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid #3b82f6',
                backgroundColor: 'white',
                color: '#3b82f6',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Hoy
            </button>
          </div>
        </div>
        {calendario && (
          <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem', color: '#6b7280', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
            <span>Incidencias: <strong style={{ color: '#ef4444' }}>{calendario.incidenciasCriticas || 0}</strong></span>
            <span>Pendientes Validación: <strong style={{ color: '#f59e0b' }}>{calendario.validacionesPendientes || 0}</strong></span>
            {calendario.reportesVencidosEquipo !== undefined && (
              <span>Vencidos: <strong style={{ color: '#ef4444' }}>{calendario.reportesVencidosEquipo}</strong></span>
            )}
          </div>
        )}
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '300px 1fr', 
        gap: '1.5rem',
        alignItems: 'start'
      }}>
        {/* Sidebar con incidencias críticas */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🚨</span> Incidencias Críticas
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {incidenciasCriticas.length === 0 ? (
                <p style={{ color: '#6b7280', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>
                  No hay incidencias críticas
                </p>
              ) : (
                incidenciasCriticas.map((evento, idx) => {
                  const fechaRef = evento.date || evento.fechaVencimiento || evento.endDate;
                  const fecha = fechaRef ? new Date(fechaRef) : new Date();
                  
                  return (
                    <div key={idx} style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #fee2e2',
                      backgroundColor: '#fef2f2'
                    }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                        {evento.titulo}
                      </div>
                      {(evento.responsableNombre || evento.responsable) && (
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                          👤 {evento.responsableNombre || evento.responsable}
                        </div>
                      )}
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        📅 {fecha.toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                      </div>
                      {evento.diasVencido && evento.diasVencido > 0 && (
                        <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem', fontWeight: 500 }}>
                          ⚠️ Vencido hace {evento.diasVencido} días
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Leyenda */}
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Leyenda</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { color: '#fbbf24', label: 'Pendiente' },
                { color: '#3b82f6', label: 'En Revisión' },
                { color: '#10b981', label: 'Aprobado' },
                { color: '#f59e0b', label: 'Requiere Corrección' },
                { color: '#ef4444', label: 'Vencido' }
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ 
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '50%', 
                    backgroundColor: item.color 
                  }}></div>
                  <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Calendario principal */}
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          {/* Navegación */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '1rem',
            borderBottom: '2px solid #f3f4f6'
          }}>
            <button 
              onClick={() => cambiarMes(-1)}
              style={{
                padding: '0.5rem',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                background: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.backgroundColor = '#eff6ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <h2 style={{ 
              fontSize: '1.25rem', 
              fontWeight: 700, 
              color: '#111827', 
              margin: 0,
              textTransform: 'capitalize'
            }}>
              {monthName}
            </h2>
            <button 
              onClick={() => cambiarMes(1)}
              style={{
                padding: '0.5rem',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                background: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.backgroundColor = '#eff6ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>

          {/* Grilla del calendario */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '0.5rem'
          }}>
            {/* Días de la semana */}
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
              <div key={day} style={{
                textAlign: 'center',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#6b7280',
                padding: '0.5rem'
              }}>
                {day}
              </div>
            ))}
            
            {/* Días vacíos al inicio */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} style={{ aspectRatio: '1', minHeight: '80px' }}></div>
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
                  onClick={() => setDiaSeleccionado(dia)}
                  style={{
                    aspectRatio: '1',
                    minHeight: '80px',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    border: seleccionado ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    backgroundColor: esHoy ? '#eff6ff' : 'white',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem'
                  }}
                  onMouseEnter={(e) => {
                    if (!seleccionado) {
                      e.currentTarget.style.borderColor = '#9ca3af';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!seleccionado) {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: esHoy ? 700 : 500,
                    color: esHoy ? '#3b82f6' : '#111827',
                    marginBottom: '0.25rem'
                  }}>
                    {dia}
                  </div>
                  {eventosDelDia.length > 0 && (
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '3px',
                      marginTop: 'auto'
                    }}>
                      {eventosDelDia.slice(0, 3).map((evento, idx) => {
                        const fechaDia = new Date(mesActual.getFullYear(), mesActual.getMonth(), dia).toISOString().split('T')[0];
                        const esVencimiento = evento.tipo === 'vencimiento' || evento.tipo === 'VENCIMIENTO' ||
                                             (evento.fechaVencimiento && evento.fechaVencimiento.split('T')[0] === fechaDia) ||
                                             (evento.date && evento.date.split('T')[0] === fechaDia);
                        const esPeriodo = evento.tipo === 'periodo';
                        
                        return (
                          <div
                            key={idx}
                            style={{ 
                              width: '8px',
                              height: '8px',
                              backgroundColor: evento.color,
                              opacity: esPeriodo ? 0.7 : 1,
                              borderRadius: esPeriodo ? '2px' : '50%'
                            }}
                            title={`${evento.titulo} - ${evento.responsableNombre || evento.responsable || 'Sin asignar'}${esVencimiento ? ' ⏰ VENCIMIENTO' : esPeriodo ? ' 📊 PERIODO' : ''}`}
                          />
                        );
                      })}
                      {eventosDelDia.length > 3 && (
                        <div style={{
                          fontSize: '0.625rem',
                          color: '#6b7280',
                          fontWeight: 500,
                          marginLeft: '2px'
                        }}>
                          +{eventosDelDia.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                  {tieneCriticos && (
                    <div style={{
                      position: 'absolute',
                      top: '0.25rem',
                      right: '0.25rem',
                      fontSize: '0.75rem'
                    }}>
                      🚨
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Detalle del día seleccionado */}
          {diaSeleccionado && getEventosDelDia(diaSeleccionado).length > 0 && (
            <div style={{
              padding: '1rem',
              borderRadius: '8px',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ 
                fontSize: '1rem', 
                marginBottom: '0.75rem', 
                color: '#111827',
                fontWeight: 600
              }}>
                Eventos del {diaSeleccionado} de {monthName.split(' ')[0]}
              </h3>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                {getEventosDelDia(diaSeleccionado).map((evento, idx) => (
                  <div 
                    key={idx} 
                    style={{
                      padding: '0.75rem',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      borderLeft: `3px solid ${evento.color}`,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'start', 
                      marginBottom: '0.25rem' 
                    }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111827' }}>
                        {evento.titulo}
                      </div>
                      {evento.requiereAccion && (
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '4px',
                          backgroundColor: '#fef3c7',
                          color: '#92400e',
                          fontWeight: 500
                        }}>
                          Requiere acción
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
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
