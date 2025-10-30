import { useState, useEffect } from 'react';
import { reportesService, type ReporteResponse } from '../lib/services';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isAfter, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export default function Calendario() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reportes, setReportes] = useState<ReporteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    loadReportes();
  }, []);

  const loadReportes = async () => {
    try {
      const data = await reportesService.listar(0, 1000);
      setReportes(data.content);
    } catch (error) {
      console.error('Error loading reportes:', error);
    } finally {
      setLoading(false);
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getReportesForDay = (day: Date) => {
    return reportes.filter(r => isSameDay(new Date(r.fechaVencimiento), day));
  };

  const getSelectedDayReportes = () => {
    if (!selectedDate) return [];
    return getReportesForDay(selectedDate);
  };

  const isVencido = (fecha: string) => {
    return isBefore(new Date(fecha), startOfDay(new Date()));
  };

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
    setSelectedDate(null);
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(isSameDay(day, selectedDate || new Date('1900-01-01')) ? null : day);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando calendario...</div>;
  }

  return (
    <div className="calendario-container">
      <div className="calendario-header">
        <div>
          <h2 className="calendario-title">Calendario de Reportes</h2>
          <p className="calendario-subtitle">Visualiza las fechas de vencimiento</p>
        </div>
      </div>

      <div className="calendario-grid">
        <div className="calendario-panel">
          <div className="calendario-nav">
            <button onClick={handlePrevMonth} className="btn btn-sm btn-secondary">
              <ChevronLeft size={16} />
            </button>
            <h3 className="calendario-month">
              {format(currentDate, 'MMMM yyyy', { locale: es })}
            </h3>
            <button onClick={handleNextMonth} className="btn btn-sm btn-secondary">
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="calendario-weekdays">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
              <div key={day} className="calendario-weekday">{day}</div>
            ))}
          </div>

          <div className="calendario-days">
            {/* Empty cells for alignment */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="calendario-day empty"></div>
            ))}
            
            {calendarDays.map(day => {
              const dayReportes = getReportesForDay(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const hasReportes = dayReportes.length > 0;
              const hasVencidos = dayReportes.some(r => r.estado !== 'ENVIADO' && isVencido(r.fechaVencimiento));

              return (
                <div
                  key={day.toISOString()}
                  className={`calendario-day ${isSelected ? 'selected' : ''} ${hasReportes ? 'has-reportes' : ''} ${hasVencidos ? 'has-vencidos' : ''}`}
                  onClick={() => hasReportes && handleDayClick(day)}
                  style={{ cursor: hasReportes ? 'pointer' : 'default' }}
                >
                  <span className="day-number">{format(day, 'd')}</span>
                  {hasReportes && (
                    <span className="day-indicator">{dayReportes.length}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="reportes-sidebar">
          <h3 className="sidebar-title">
            <CalendarIcon size={20} />
            {selectedDate ? format(selectedDate, 'dd MMMM yyyy', { locale: es }) : 'Reportes del mes'}
          </h3>

          {selectedDate ? (
            <div className="sidebar-content">
              {getSelectedDayReportes().length === 0 ? (
                <p style={{ color: 'var(--color-text-light)', textAlign: 'center' }}>
                  No hay reportes para esta fecha.
                </p>
              ) : (
                <div className="sidebar-reportes">
                  {getSelectedDayReportes().map(reporte => (
                    <div key={reporte.id} className="sidebar-reporte">
                      <div className="sidebar-reporte-header">
                        <span className={`badge ${reporte.estado === 'ENVIADO' ? 'badge-enviado' : 'badge-pendiente'}`}>
                          {reporte.estado.replace('_', ' ')}
                        </span>
                        {reporte.estado !== 'ENVIADO' && isVencido(reporte.fechaVencimiento) && (
                          <span className="badge badge-pendiente" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
                            Vencido
                          </span>
                        )}
                      </div>
                      <h4 className="sidebar-reporte-title">{reporte.titulo}</h4>
                      <p className="sidebar-reporte-info">{reporte.entidadNombre}</p>
                      <a href={`/reportes/${reporte.id}`} className="btn btn-sm btn-secondary" style={{ marginTop: '0.5rem' }}>
                        Ver detalles
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="sidebar-content">
              <p style={{ color: 'var(--color-text-light)', marginBottom: '1rem' }}>
                Haz clic en un día con reportes para ver los detalles.
              </p>
              <div className="calendario-legend">
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: 'var(--color-primary-200)' }}></div>
                  <span>Día con reportes</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#fee2e2' }}></div>
                  <span>Reportes vencidos</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
