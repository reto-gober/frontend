import { useState, useEffect } from 'react';
import { flujoReportesService, type ReportePeriodo } from '../../lib/services';

interface Tarea {
  id: string;
  titulo: string;
  descripcion: string;
  entidad: string;
  fechaLimite: string;
  prioridad: 'alta' | 'media' | 'baja';
  estado: 'pendiente' | 'en-progreso' | 'completada';
  asignadoA?: string;
  progreso?: number;
}

// Mapear ReportePeriodo a Tarea
const mapPeriodoToTarea = (periodo: ReportePeriodo): Tarea => {
  const diasRestantes = Math.ceil((new Date(periodo.fechaVencimientoCalculada).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    id: periodo.periodoId,
    titulo: periodo.reporteNombre,
    descripcion: periodo.estadoDescripcion || '',
    entidad: periodo.entidadNombre,
    fechaLimite: periodo.fechaVencimientoCalculada,
    prioridad: diasRestantes <= 3 ? 'alta' : diasRestantes <= 7 ? 'media' : 'baja',
    estado: periodo.estado === 'pendiente' ? 'pendiente' : periodo.estado === 'en_elaboracion' ? 'en-progreso' : 'completada',
    asignadoA: periodo.responsableElaboracion?.nombreCompleto,
    progreso: periodo.estado === 'pendiente' ? 0 : periodo.estado === 'en_elaboracion' ? 50 : 100
  };
};

interface TareasPendientesProps {
  maxItems?: number;
  showFilters?: boolean;
  showProgress?: boolean;
  variant?: 'card' | 'list' | 'compact';
  onTareaClick?: (tarea: Tarea) => void;
  onCompletarClick?: (tarea: Tarea) => void;
}

export default function TareasPendientes({
  maxItems,
  showFilters = true,
  showProgress = true,
  variant = 'card',
  onTareaClick,
  onCompletarClick
}: TareasPendientesProps) {
  const [filtroEstado, setFiltroEstado] = useState<string>('todas');
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarTareas();
  }, []);

  const cargarTareas = async () => {
    try {
      setLoading(true);
      const response = await flujoReportesService.misPeriodosPendientes(0, 20);
      const tareasMap = response.content.map(mapPeriodoToTarea);
      setTareas(tareasMap);
    } catch (error) {
      console.error('Error al cargar tareas:', error);
      setTareas([]);
    } finally {
      setLoading(false);
    }
  };

  const tareasFiltradas = tareas
    .filter(tarea => {
      if (filtroEstado === 'todas') return true;
      return tarea.estado === filtroEstado;
    })
    .slice(0, maxItems || tareas.length);

  const marcarCompletada = (id: string) => {
    setTareas(tareas.map(t =>
      t.id === id ? { ...t, estado: 'completada' as const, progreso: 100 } : t
    ));
  };

  const getDiasRestantes = (fechaLimite: string) => {
    const hoy = new Date();
    const limite = new Date(fechaLimite);
    const diff = Math.ceil((limite.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getPrioridadClase = (prioridad: Tarea['prioridad']) => {
    switch (prioridad) {
      case 'alta': return 'priority-high';
      case 'media': return 'priority-medium';
      case 'baja': return 'priority-low';
    }
  };

  const getEstadoIcono = (estado: Tarea['estado']) => {
    switch (estado) {
      case 'pendiente':
        return (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
          </svg>
        );
      case 'en-progreso':
        return (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        );
      case 'completada':
        return (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        );
    }
  };

  return (
    <div className={`tareas-pendientes-component variant-${variant}`}>
      {showFilters && (
        <div className="tareas-filters">
          <button
            className={`filter-btn ${filtroEstado === 'todas' ? 'active' : ''}`}
            onClick={() => setFiltroEstado('todas')}
          >
            Todas
          </button>
          <button
            className={`filter-btn ${filtroEstado === 'pendiente' ? 'active' : ''}`}
            onClick={() => setFiltroEstado('pendiente')}
          >
            Pendientes
          </button>
          <button
            className={`filter-btn ${filtroEstado === 'en-progreso' ? 'active' : ''}`}
            onClick={() => setFiltroEstado('en-progreso')}
          >
            En Progreso
          </button>
          <button
            className={`filter-btn ${filtroEstado === 'completada' ? 'active' : ''}`}
            onClick={() => setFiltroEstado('completada')}
          >
            Completadas
          </button>
        </div>
      )}

      <div className="tareas-list">
        {tareasFiltradas.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <p>No hay tareas en esta categoría</p>
          </div>
        ) : (
          tareasFiltradas.map(tarea => {
            const diasRestantes = getDiasRestantes(tarea.fechaLimite);
            const esUrgente = diasRestantes <= 3 && tarea.estado !== 'completada';

            return (
              <div
                key={tarea.id}
                className={`tarea-item ${tarea.estado} ${getPrioridadClase(tarea.prioridad)} ${esUrgente ? 'urgente' : ''}`}
                onClick={() => onTareaClick?.(tarea)}
              >
                <div className="tarea-checkbox">
                  <button
                    className={`checkbox-btn ${tarea.estado === 'completada' ? 'checked' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (tarea.estado !== 'completada') {
                        marcarCompletada(tarea.id);
                        onCompletarClick?.(tarea);
                      }
                    }}
                  >
                    {getEstadoIcono(tarea.estado)}
                  </button>
                </div>

                <div className="tarea-content">
                  <div className="tarea-header">
                    <h4 className={`tarea-titulo ${tarea.estado === 'completada' ? 'completed' : ''}`}>
                      {tarea.titulo}
                    </h4>
                    <span className={`prioridad-badge ${tarea.prioridad}`}>
                      {tarea.prioridad}
                    </span>
                  </div>

                  {variant !== 'compact' && (
                    <p className="tarea-descripcion">{tarea.descripcion}</p>
                  )}

                  {showProgress && tarea.progreso !== undefined && tarea.estado !== 'completada' && (
                    <div className="tarea-progress">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${tarea.progreso}%` }}
                        />
                      </div>
                      <span className="progress-text">{tarea.progreso}%</span>
                    </div>
                  )}

                  <div className="tarea-meta">
                    <span className="meta-item entidad">
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 22V8l9-5 9 5v14"/>
                        <path d="M9 22V12h6v10"/>
                      </svg>
                      {tarea.entidad}
                    </span>

                    <span className={`meta-item fecha ${esUrgente ? 'urgente' : ''}`}>
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      {diasRestantes < 0 ? 'Vencida' :
                       diasRestantes === 0 ? 'Hoy' :
                       diasRestantes === 1 ? 'Mañana' :
                       `${diasRestantes} días`}
                    </span>

                    {tarea.asignadoA && (
                      <span className="meta-item asignado">
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                        {tarea.asignadoA}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <style>{`
        .tareas-pendientes-component {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .tareas-filters {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .filter-btn {
          padding: 0.5rem 1rem;
          border: 1px solid var(--neutral-200, #e5e7eb);
          background: white;
          border-radius: 8px;
          font-size: 0.8125rem;
          color: var(--neutral-600, #4b5563);
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-btn:hover {
          background: var(--neutral-100, #f3f4f6);
        }

        .filter-btn.active {
          background: var(--role-accent, #3d85d1);
          border-color: var(--role-accent, #3d85d1);
          color: white;
        }

        .tareas-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .tarea-item {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          border: 1px solid var(--neutral-100, #f3f4f6);
          cursor: pointer;
          transition: all 0.2s;
        }

        .tarea-item:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border-color: var(--neutral-200, #e5e7eb);
        }

        .tarea-item.completada {
          opacity: 0.7;
          background: var(--neutral-50, #f9fafb);
        }

        .tarea-item.urgente {
          border-color: #fecaca;
          background: #fef2f2;
        }

        .tarea-checkbox {
          flex-shrink: 0;
        }

        .checkbox-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--neutral-300, #d1d5db);
          background: white;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--neutral-400, #9ca3af);
        }

        .checkbox-btn:hover {
          border-color: var(--role-accent, #3d85d1);
          color: var(--role-accent, #3d85d1);
        }

        .checkbox-btn.checked {
          background: var(--success-green, #22c55e);
          border-color: var(--success-green, #22c55e);
          color: white;
        }

        .priority-high .checkbox-btn {
          border-color: #fca5a5;
        }

        .priority-medium .checkbox-btn {
          border-color: #fcd34d;
        }

        .tarea-content {
          flex: 1;
          min-width: 0;
        }

        .tarea-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 0.25rem;
        }

        .tarea-titulo {
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--neutral-800, #1f2937);
          margin: 0;
        }

        .tarea-titulo.completed {
          text-decoration: line-through;
          color: var(--neutral-500, #6b7280);
        }

        .prioridad-badge {
          flex-shrink: 0;
          padding: 0.125rem 0.5rem;
          border-radius: 12px;
          font-size: 0.625rem;
          font-weight: 600;
          text-transform: capitalize;
        }

        .prioridad-badge.alta {
          background: #fef2f2;
          color: #dc2626;
        }

        .prioridad-badge.media {
          background: #fef9e6;
          color: #d4a72c;
        }

        .prioridad-badge.baja {
          background: #f0fdf4;
          color: #16a34a;
        }

        .tarea-descripcion {
          font-size: 0.8125rem;
          color: var(--neutral-500, #6b7280);
          margin: 0 0 0.75rem;
          line-height: 1.4;
        }

        .tarea-progress {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .progress-bar {
          flex: 1;
          height: 6px;
          background: var(--neutral-200, #e5e7eb);
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: var(--role-accent, #3d85d1);
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--neutral-500, #6b7280);
          min-width: 32px;
        }

        .tarea-meta {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.6875rem;
          color: var(--neutral-500, #6b7280);
        }

        .meta-item.entidad {
          padding: 0.125rem 0.5rem;
          background: var(--neutral-100, #f3f4f6);
          border-radius: 10px;
          font-weight: 500;
        }

        .meta-item.fecha.urgente {
          color: #dc2626;
          font-weight: 600;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          color: var(--neutral-400, #9ca3af);
          text-align: center;
        }

        .empty-state p {
          margin: 1rem 0 0;
          font-size: 0.875rem;
        }

        /* Variant: List */
        .variant-list .tarea-item {
          border-radius: 8px;
          padding: 0.75rem 1rem;
        }

        /* Variant: Compact */
        .variant-compact .tarea-item {
          padding: 0.625rem;
        }

        .variant-compact .tarea-titulo {
          font-size: 0.8125rem;
        }

        .variant-compact .tarea-meta {
          gap: 0.5rem;
        }
      `}</style>
    </div>
  );
}
