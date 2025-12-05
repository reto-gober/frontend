import { useState, useEffect } from 'react';
import { calendarioService, type EventoCalendario, type CalendarioResponse } from '../../lib/services';

export default function AuditorCalendarioClient() {
  const [calendario, setCalendario] = useState<CalendarioResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mesActual, setMesActual] = useState(new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState<number | null>(null);
  const [filtroEntidad, setFiltroEntidad] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<string>('');

  useEffect(() => {
    cargarCalendario();
  }, [mesActual, filtroEntidad, filtroEstado]);

  const cargarCalendario = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Calcular rango de fechas del mes actual
      const primerDia = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1);
      const ultimoDia = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0);
      
      const fechaInicio = primerDia.toISOString().split('T')[0];
      const fechaFin = ultimoDia.toISOString().split('T')[0];
      
      // Llamar al endpoint de calendario auditor
      const response = await calendarioService.auditor({
        fechaInicio,
        fechaFin,
        entidadId: filtroEntidad || undefined,
        estado: filtroEstado || undefined
      });
      
      setCalendario(response);
      console.log('Calendario auditor cargado:', response);
    } catch (err) {
      console.error('Error al cargar calendario:', err);
      setError('Error al cargar el calendario de auditoría. Verifica la consola.');
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
      const fechaEvento = evento.fecha.split('T')[0];
      return fechaEvento === fechaStr;
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

  const getEntidadesUnicas = (): string[] => {
    if (!calendario) return [];
    
    const entidades = new Set<string>();
    calendario.eventos.forEach(evento => {
      if (evento.entidadNombre) {
        entidades.add(evento.entidadNombre);
      }
    });
    return Array.from(entidades).sort();
  };

  const getProximosVencimientos = (): EventoCalendario[] => {
    if (!calendario) return [];
    
    const hoy = new Date();
    return calendario.eventos
      .filter(evento => new Date(evento.fecha) >= hoy)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
      .slice(0, 8);
  };

  const exportarCalendario = () => {
    if (!calendario) return;
    
    // Preparar datos para exportación
    const data = calendario.eventos.map(evento => ({
      Fecha: evento.fecha,
      Titulo: evento.titulo,
      Tipo: evento.tipo,
      Estado: evento.estado,
      Entidad: evento.entidadNombre || 'N/A',
      Responsable: evento.responsableNombre || 'N/A'
    }));

    // Convertir a CSV
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${row[h as keyof typeof row]}"`).join(','))
    ].join('\n');

    // Descargar
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calendario_auditoria_${mesActual.getFullYear()}_${mesActual.getMonth() + 1}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="calendario-page">
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
          <p style={{ marginTop: '1rem', color: 'var(--neutral-600)' }}>Cargando calendario de auditoría...</p>
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
  const entidades = getEntidadesUnicas();
  const proximosVencimientos = getProximosVencimientos();

  return (
    <div className="calendario-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-info">
          <h1 className="page-title">Calendario de Auditoría</h1>
          <p className="page-description">Calendario de vencimientos y fechas críticas de cumplimiento regulatorio</p>
          {calendario && (
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--neutral-600)' }}>
              <span>Total: <strong>{calendario.totalEventosMes}</strong></span>
              <span>Vencidos: <strong style={{ color: 'var(--error-red-600)' }}>{calendario.eventosVencidosMes}</strong></span>
              <span>Próximos: <strong>{calendario.eventosProximosMes}</strong></span>
              {calendario.tasaCumplimientoMes !== undefined && (
                <span>
                  Cumplimiento: <strong style={{ color: calendario.tasaCumplimientoMes >= 80 ? 'var(--success-green-500)' : 'var(--error-red-600)' }}>
                    {calendario.tasaCumplimientoMes.toFixed(1)}%
                  </strong>
                </span>
              )}
            </div>
          )}
        </div>
        <div className="header-actions">
          <button className="btn-export" onClick={exportarCalendario} style={{ marginRight: '0.5rem' }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7,10 12,15 17,10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Exportar
          </button>
          <button className="btn-secondary" onClick={irAHoy}>Hoy</button>
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
          {entidades.map(ent => (
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
          <option value="en_elaboracion">En Elaboración</option>
          <option value="enviado">Enviado</option>
          <option value="aprobado">Aprobado</option>
          <option value="rechazado">Rechazado</option>
          <option value="requiere_correccion">Requiere Corrección</option>
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
        {/* Sidebar con próximos vencimientos */}
        <div className="calendar-widget">
          <div className="sidebar-section">
            <h3 className="section-title">Próximos Vencimientos</h3>
            <div className="eventos-list">
              {proximosVencimientos.length === 0 ? (
                <p style={{ color: 'var(--neutral-600)', fontSize: '0.9rem', padding: '1rem' }}>
                  No hay vencimientos próximos
                </p>
              ) : (
                proximosVencimientos.map((evento, idx) => {
                  const fecha = new Date(evento.fecha);
                  
                  return (
                    <div key={idx} className="evento-item" style={{ borderLeft: `3px solid ${evento.color}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.25rem' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{fecha.toLocaleDateString('es', { day: 'numeric', month: 'short' })}</div>
                        <span className="badge-small" style={{ backgroundColor: evento.color, color: 'white', fontSize: '0.7rem' }}>
                          {evento.tipo}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>{evento.titulo}</div>
                      {evento.entidadNombre && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--neutral-600)' }}>
                          🏢 {evento.entidadNombre}
                        </div>
                      )}
                      {evento.responsableNombre && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--neutral-600)' }}>
                          👤 {evento.responsableNombre}
                        </div>
                      )}
                      <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                        <span style={{ color: evento.color, fontWeight: 500 }}>{evento.estado}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Estadísticas de cumplimiento */}
          {calendario && (
            <div className="sidebar-section">
              <h3 className="section-title">Estadísticas del Mes</h3>
              <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {calendario.reportesApropadosOportunos !== undefined && (
                  <div className="stat-card" style={{ background: 'var(--success-green-50)', padding: '0.75rem', borderRadius: '6px' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success-green-700)' }}>
                      {calendario.reportesApropadosOportunos}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--success-green-600)' }}>Oportunos</div>
                  </div>
                )}
                {calendario.reportesExtemporaneos !== undefined && (
                  <div className="stat-card" style={{ background: 'var(--accent-orange-50)', padding: '0.75rem', borderRadius: '6px' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-orange-700)' }}>
                      {calendario.reportesExtemporaneos}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-orange-600)' }}>Extemporáneos</div>
                  </div>
                )}
                {calendario.reportesRechazados !== undefined && (
                  <div className="stat-card" style={{ background: 'var(--error-red-50)', padding: '0.75rem', borderRadius: '6px' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--error-red-700)' }}>
                      {calendario.reportesRechazados}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--error-red-600)' }}>Rechazados</div>
                  </div>
                )}
                {calendario.eventosVencidosMes !== undefined && (
                  <div className="stat-card" style={{ background: 'var(--error-red-50)', padding: '0.75rem', borderRadius: '6px' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--error-red-700)' }}>
                      {calendario.eventosVencidosMes}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--error-red-600)' }}>Vencidos</div>
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
                <span className="legend-label">En Proceso/Enviado</span>
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
        <div className="events-panel">
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
                      {eventosDelDia.slice(0, 3).map((evento, idx) => (
                        <div
                          key={idx}
                          className="event-dot"
                          style={{ backgroundColor: evento.color }}
                          title={`${evento.titulo} - ${evento.entidadNombre || ''}`}
                        />
                      ))}
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
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.25rem' }}>{evento.titulo}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--neutral-600)' }}>
                      {evento.entidadNombre && `🏢 ${evento.entidadNombre} • `}
                      {evento.responsableNombre && `👤 ${evento.responsableNombre} • `}
                      {evento.tipo} - <span style={{ color: evento.color, fontWeight: 500 }}>{evento.estado}</span>
                    </div>
                    {evento.cumplimiento && (
                      <div style={{ fontSize: '0.8rem', marginTop: '0.25rem', fontWeight: 500 }}>
                        Cumplimiento: <span style={{ 
                          color: evento.cumplimiento === 'OPORTUNO' ? 'var(--success-green-600)' : 
                                evento.cumplimiento === 'EXTEMPORANEO' ? 'var(--accent-orange-600)' : 
                                'var(--error-red-600)' 
                        }}>
                          {evento.cumplimiento}
                        </span>
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
