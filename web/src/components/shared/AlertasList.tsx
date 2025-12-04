import { useState, useEffect } from 'react';
import { flujoReportesService, ReportePeriodo } from '../../lib/services';

interface Alerta {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: 'vencimiento' | 'sistema' | 'regulatorio' | 'urgente';
  prioridad: 'alta' | 'media' | 'baja';
  fecha: string;
  leida: boolean;
  entidad?: string;
}

// Mapear ReportePeriodo a Alerta
const mapPeriodoToAlerta = (periodo: ReportePeriodo): Alerta => {
  const diasRestantes = Math.ceil((new Date(periodo.fechaVencimientoCalculada).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  
  let tipo: Alerta['tipo'] = 'vencimiento';
  let prioridad: Alerta['prioridad'] = 'media';
  let titulo = '';
  let descripcion = '';

  if (periodo.estado === 'requiere_correccion') {
    tipo = 'urgente';
    prioridad = 'alta';
    titulo = `Corrección requerida: ${periodo.reporteNombre}`;
    descripcion = periodo.comentarios || 'El reporte requiere correcciones';
  } else if (periodo.estado === 'rechazado') {
    tipo = 'urgente';
    prioridad = 'alta';
    titulo = `Reporte rechazado: ${periodo.reporteNombre}`;
    descripcion = periodo.comentarios || 'El reporte fue rechazado';
  } else if (diasRestantes < 0) {
    tipo = 'vencimiento';
    prioridad = 'alta';
    titulo = `Reporte vencido: ${periodo.reporteNombre}`;
    descripcion = `Vencido hace ${Math.abs(diasRestantes)} días`;
  } else if (diasRestantes <= 1) {
    tipo = 'vencimiento';
    prioridad = 'alta';
    titulo = `Vencimiento inminente: ${periodo.reporteNombre}`;
    descripcion = diasRestantes === 0 ? 'Vence hoy' : 'Vence mañana';
  } else if (diasRestantes <= 3) {
    tipo = 'vencimiento';
    prioridad = 'alta';
    titulo = `Vencimiento próximo: ${periodo.reporteNombre}`;
    descripcion = `Vence en ${diasRestantes} días`;
  } else {
    tipo = 'vencimiento';
    prioridad = 'media';
    titulo = `Recordatorio: ${periodo.reporteNombre}`;
    descripcion = `Vence en ${diasRestantes} días`;
  }

  return {
    id: periodo.periodoId,
    titulo,
    descripcion,
    tipo,
    prioridad,
    fecha: periodo.fechaVencimientoCalculada,
    leida: false,
    entidad: periodo.entidadNombre
  };
};

interface AlertasListProps {
  maxItems?: number;
  showFilters?: boolean;
  compact?: boolean;
  onAlertClick?: (alerta: Alerta) => void;
}

export default function AlertasList({ 
  maxItems, 
  showFilters = true, 
  compact = false,
  onAlertClick 
}: AlertasListProps) {
  const [filtro, setFiltro] = useState<string>('todas');
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarAlertas();
  }, []);

  const cargarAlertas = async () => {
    try {
      setLoading(true);
      // Cargar periodos pendientes y que requieren corrección
      const [pendientes, correcciones] = await Promise.all([
        flujoReportesService.misPeriodosPendientes(0, 10),
        flujoReportesService.misPeríodosCorrecciones(0, 10)
      ]);
      
      const alertasPendientes = pendientes.content.map(mapPeriodoToAlerta);
      const alertasCorrecciones = correcciones.content.map(mapPeriodoToAlerta);
      
      setAlertas([...alertasCorrecciones, ...alertasPendientes]);
    } catch (error) {
      console.error('Error al cargar alertas:', error);
      setAlertas([]);
    } finally {
      setLoading(false);
    }
  };

  const alertasFiltradas = alertas.filter(alerta => {
    if (filtro === 'todas') return true;
    if (filtro === 'no-leidas') return !alerta.leida;
    return alerta.tipo === filtro;
  }).slice(0, maxItems || alertas.length);

  const marcarComoLeida = (id: string) => {
    setAlertas(alertas.map(a => 
      a.id === id ? { ...a, leida: true } : a
    ));
  };

  const getIconoTipo = (tipo: Alerta['tipo']) => {
    switch (tipo) {
      case 'vencimiento':
        return (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        );
      case 'sistema':
        return (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        );
      case 'regulatorio':
        return (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <path d="M14 2v6h6"/>
            <path d="M16 13H8"/>
            <path d="M16 17H8"/>
          </svg>
        );
      case 'urgente':
        return (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        );
    }
  };

  const getColorClase = (prioridad: Alerta['prioridad']) => {
    switch (prioridad) {
      case 'alta': return 'priority-high';
      case 'media': return 'priority-medium';
      case 'baja': return 'priority-low';
    }
  };

  return (
    <div className={`alertas-list-component ${compact ? 'compact' : ''}`}>
      {showFilters && (
        <div className="alertas-filters">
          <button 
            className={`filter-btn ${filtro === 'todas' ? 'active' : ''}`}
            onClick={() => setFiltro('todas')}
          >
            Todas
          </button>
          <button 
            className={`filter-btn ${filtro === 'no-leidas' ? 'active' : ''}`}
            onClick={() => setFiltro('no-leidas')}
          >
            No leídas
          </button>
          <button 
            className={`filter-btn ${filtro === 'vencimiento' ? 'active' : ''}`}
            onClick={() => setFiltro('vencimiento')}
          >
            Vencimientos
          </button>
          <button 
            className={`filter-btn ${filtro === 'urgente' ? 'active' : ''}`}
            onClick={() => setFiltro('urgente')}
          >
            Urgentes
          </button>
        </div>
      )}

      <div className="alertas-items">
        {alertasFiltradas.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <p>No hay alertas pendientes</p>
          </div>
        ) : (
          alertasFiltradas.map(alerta => (
            <div 
              key={alerta.id} 
              className={`alerta-item ${alerta.leida ? 'leida' : ''} ${getColorClase(alerta.prioridad)}`}
              onClick={() => {
                marcarComoLeida(alerta.id);
                onAlertClick?.(alerta);
              }}
            >
              <div className="alerta-icon">
                {getIconoTipo(alerta.tipo)}
              </div>
              <div className="alerta-content">
                <div className="alerta-header">
                  <h4 className="alerta-titulo">{alerta.titulo}</h4>
                  {!alerta.leida && <span className="unread-dot" />}
                </div>
                {!compact && (
                  <p className="alerta-descripcion">{alerta.descripcion}</p>
                )}
                <div className="alerta-meta">
                  <span className="alerta-fecha">{alerta.fecha}</span>
                  {alerta.entidad && (
                    <span className="alerta-entidad">{alerta.entidad}</span>
                  )}
                  <span className={`alerta-prioridad ${alerta.prioridad}`}>
                    {alerta.prioridad}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        .alertas-list-component {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .alertas-filters {
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

        .alertas-items {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .alerta-item {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: white;
          border-radius: 10px;
          border-left: 4px solid;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          cursor: pointer;
          transition: all 0.2s;
        }

        .alerta-item:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .alerta-item.leida {
          opacity: 0.7;
        }

        .alerta-item.priority-high {
          border-color: #ef4444;
        }

        .alerta-item.priority-medium {
          border-color: #F4C453;
        }

        .alerta-item.priority-low {
          border-color: #22c55e;
        }

        .alerta-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          flex-shrink: 0;
        }

        .priority-high .alerta-icon {
          background: #fef2f2;
          color: #ef4444;
        }

        .priority-medium .alerta-icon {
          background: #fef9e6;
          color: #d4a72c;
        }

        .priority-low .alerta-icon {
          background: #f0fdf4;
          color: #22c55e;
        }

        .alerta-content {
          flex: 1;
          min-width: 0;
        }

        .alerta-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }

        .alerta-titulo {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--neutral-800, #1f2937);
          margin: 0;
        }

        .unread-dot {
          width: 8px;
          height: 8px;
          background: var(--role-accent, #3d85d1);
          border-radius: 50%;
        }

        .alerta-descripcion {
          font-size: 0.8125rem;
          color: var(--neutral-500, #6b7280);
          margin: 0 0 0.5rem;
          line-height: 1.4;
        }

        .alerta-meta {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .alerta-fecha {
          font-size: 0.6875rem;
          color: var(--neutral-400, #9ca3af);
        }

        .alerta-entidad {
          font-size: 0.625rem;
          font-weight: 600;
          padding: 0.125rem 0.5rem;
          background: var(--neutral-100, #f3f4f6);
          border-radius: 12px;
          color: var(--neutral-600, #4b5563);
        }

        .alerta-prioridad {
          font-size: 0.625rem;
          font-weight: 600;
          padding: 0.125rem 0.5rem;
          border-radius: 12px;
          text-transform: capitalize;
        }

        .alerta-prioridad.alta {
          background: #fef2f2;
          color: #dc2626;
        }

        .alerta-prioridad.media {
          background: #fef9e6;
          color: #d4a72c;
        }

        .alerta-prioridad.baja {
          background: #f0fdf4;
          color: #16a34a;
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

        /* Compact mode */
        .alertas-list-component.compact .alerta-item {
          padding: 0.75rem;
        }

        .alertas-list-component.compact .alerta-icon {
          width: 32px;
          height: 32px;
        }

        .alertas-list-component.compact .alerta-titulo {
          font-size: 0.8125rem;
        }
      `}</style>
    </div>
  );
}
