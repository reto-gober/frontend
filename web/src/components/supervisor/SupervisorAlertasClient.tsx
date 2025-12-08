import { useEffect, useMemo, useState } from 'react';
import { flujoReportesService } from '../../lib/services';
import {
  buildSupervisorAlerts,
  countByCategory,
  countBySeverity,
  relativeTimeFromNow,
  type SupervisorAlert,
} from '../../lib/supervisorAlerts';

type Filtro =
  | 'todas'
  | 'criticas'
  | 'vencimiento'
  | 'revision'
  | 'sistema'
  | 'resueltas';

export default function SupervisorAlertasClient() {
  const [alertas, setAlertas] = useState<SupervisorAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('todas');

  useEffect(() => {
    cargarAlertas();
  }, []);

  const cargarAlertas = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await flujoReportesService.supervisionSupervisor(0, 250);
      const nuevasAlertas = buildSupervisorAlerts(data.content || []);
      setAlertas(nuevasAlertas);
    } catch (err: any) {
      console.error('Error al cargar alertas de supervisor:', err);
      setError(err?.response?.data?.message || 'No se pudieron cargar las alertas.');
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLeida = (id: string) => {
    setAlertas((prev) => prev.map((a) => (a.id === id ? { ...a, leida: true } : a)));
  };

  const marcarTodas = () => {
    setAlertas((prev) => prev.map((a) => ({ ...a, leida: true })));
  };

  const stats = useMemo(() => countBySeverity(alertas), [alertas]);
  const categorias = useMemo(() => countByCategory(alertas), [alertas]);

  const alertasFiltradas = useMemo(() => {
    const filtradas = alertas.filter((alerta) => {
      switch (filtro) {
        case 'criticas':
          return alerta.tipo === 'critica';
        case 'vencimiento':
          return alerta.categoria === 'vencimiento';
        case 'revision':
          return alerta.categoria === 'revision' || alerta.categoria === 'correccion';
        case 'sistema':
          return alerta.categoria === 'sistema';
        case 'resueltas':
          return alerta.tipo === 'exito';
        default:
          return true;
      }
    });
    return filtradas.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [alertas, filtro]);

  const hayNoLeidas = alertas.some((a) => !a.leida);

  const getSeveridadLabel = (tipo: SupervisorAlert['tipo']) => {
    if (tipo === 'critica') return 'Crítica';
    if (tipo === 'advertencia') return 'Advertencia';
    if (tipo === 'info') return 'Informativa';
    return 'Resuelta';
  };

  if (loading) {
    return (
      <div className="alertas-loader">
        <div className="spinner" />
        <p>Cargando alertas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alertas-error">
        <p>{error}</p>
        <button className="btn-ghost" onClick={cargarAlertas}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="alertas-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-info">
          <h1 className="page-title">Alertas del Sistema</h1>
          <p className="page-description">
            Monitoreo en tiempo real de vencimientos y revisiones pendientes del equipo.
          </p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={marcarTodas} disabled={!hayNoLeidas}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9,11 12,14 22,4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            Marcar todas como leídas
          </button>
        </div>
      </div>

      {/* Alert Stats */}
      <div className="alert-stats">
        <div className="stat-card critical">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.criticas}</span>
            <span className="stat-label">Críticas</span>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.advertencias}</span>
            <span className="stat-label">Advertencias</span>
          </div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.informativas}</span>
            <span className="stat-label">Informativas</span>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.resueltas}</span>
            <span className="stat-label">Resueltas</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button className={`filter-tab ${filtro === 'todas' ? 'active' : ''}`} onClick={() => setFiltro('todas')}>
          Todas ({stats.total})
        </button>
        <button
          className={`filter-tab ${filtro === 'criticas' ? 'active' : ''}`}
          onClick={() => setFiltro('criticas')}
        >
          Críticas ({stats.criticas})
        </button>
        <button
          className={`filter-tab ${filtro === 'vencimiento' ? 'active' : ''}`}
          onClick={() => setFiltro('vencimiento')}
        >
          Vencimientos ({categorias.vencimiento})
        </button>
        <button
          className={`filter-tab ${filtro === 'revision' ? 'active' : ''}`}
          onClick={() => setFiltro('revision')}
        >
          Revisiones ({categorias.revision + categorias.correccion})
        </button>
        <button
          className={`filter-tab ${filtro === 'sistema' ? 'active' : ''}`}
          onClick={() => setFiltro('sistema')}
        >
          Sistema ({categorias.sistema})
        </button>
        <button
          className={`filter-tab ${filtro === 'resueltas' ? 'active' : ''}`}
          onClick={() => setFiltro('resueltas')}
        >
          Resueltas ({stats.resueltas})
        </button>
      </div>

      {/* Alerts List */}
      <div className="alerts-list">
        {alertasFiltradas.length === 0 ? (
          <div className="empty-alerts">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <p>No hay alertas para mostrar.</p>
          </div>
        ) : (
          alertasFiltradas.map((alerta) => (
            <div
              key={alerta.id}
              className={`alert-item ${alerta.tipo === 'critica' ? 'critical' : alerta.tipo === 'advertencia' ? 'warning' : alerta.tipo === 'exito' ? 'success' : 'info'} ${alerta.leida ? 'read' : ''}`}
              onClick={() => marcarComoLeida(alerta.id)}
            >
              <div className="alert-icon">
                {alerta.tipo === 'critica' ? (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                ) : alerta.tipo === 'advertencia' ? (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                ) : alerta.tipo === 'exito' ? (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                )}
              </div>

              <div className="alert-content">
                <div className="alert-header">
                  <span className={`alert-badge ${alerta.tipo === 'critica' ? 'critical' : alerta.tipo === 'advertencia' ? 'warning' : alerta.tipo === 'exito' ? 'success' : 'info'}`}>
                    {getSeveridadLabel(alerta.tipo)}
                  </span>
                  <span className="alert-time">{relativeTimeFromNow(alerta.fecha)}</span>
                </div>
                <h3 className="alert-title">{alerta.titulo}</h3>
                <p className="alert-description">{alerta.descripcion}</p>
                <div className="alert-meta">
                  {alerta.entidad && <span className="meta-badge entity">{alerta.entidad}</span>}
                  {alerta.responsable && <span className="meta-text">Responsable: {alerta.responsable}</span>}
                  {alerta.estado && <span className="meta-text">{alerta.estado}</span>}
                </div>
              </div>

              <div className="alert-actions">
                <button
                  className="btn-action"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = '/roles/supervisor/reportes';
                  }}
                >
                  Ver reporte
                </button>
                {(alerta.tipo === 'critica' || alerta.categoria === 'revision' || alerta.categoria === 'correccion') && (
                  <button
                    className="btn-action primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = '/roles/supervisor/reportes';
                    }}
                  >
                    Revisar ahora
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        .alertas-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .alertas-loader,
        .alertas-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          padding: 3rem 1rem;
          background: white;
          border-radius: 12px;
          box-shadow: var(--shadow-card);
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid var(--neutral-200);
          border-top-color: var(--role-accent, #22c55e);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .btn-ghost {
          background: var(--role-accent, #22c55e);
          color: white;
          border: none;
          padding: 0.6rem 1.2rem;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .page-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--neutral-900);
          margin: 0;
        }

        .page-description {
          font-size: 0.9rem;
          color: var(--neutral-500);
          margin: 0.25rem 0 0;
        }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.65rem 1rem;
          background: white;
          border: 1px solid var(--neutral-200);
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--neutral-700);
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary:hover:not(:disabled) {
          background: var(--neutral-100);
        }

        .btn-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .alert-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem;
          background: white;
          border-radius: 12px;
          box-shadow: var(--shadow-card);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
        }

        .stat-card.critical .stat-icon { background: var(--error-red-100); color: var(--error-red-600); }
        .stat-card.warning .stat-icon { background: var(--warning-yellow-100); color: var(--warning-yellow-700); }
        .stat-card.info .stat-icon { background: var(--color-primary-100); color: var(--color-primary-600); }
        .stat-card.success .stat-icon { background: var(--success-green-100); color: var(--success-green-600); }

        .stat-info { display: flex; flex-direction: column; }
        .stat-value { font-size: 1.5rem; font-weight: 700; color: var(--neutral-900); }
        .stat-label { font-size: 0.8rem; color: var(--neutral-500); }

        .filter-tabs {
          display: flex;
          gap: 0.5rem;
          padding: 0.5rem;
          background: white;
          border-radius: 12px;
          box-shadow: var(--shadow-card);
        }

        .filter-tab {
          padding: 0.6rem 1rem;
          background: transparent;
          border: none;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--neutral-600);
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-tab:hover { background: var(--neutral-100); color: var(--neutral-800); }
        .filter-tab.active { background: var(--role-accent, #22c55e); color: var(--neutral-900); }

        .alerts-list { display: flex; flex-direction: column; gap: 0.75rem; }

        .alert-item {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 1rem;
          padding: 1.1rem;
          background: white;
          border-radius: 12px;
          box-shadow: var(--shadow-card);
          border-left: 4px solid transparent;
          transition: transform 0.2s, box-shadow 0.2s;
          cursor: pointer;
        }

        .alert-item:hover { transform: translateX(4px); box-shadow: var(--shadow-card-hover); }
        .alert-item.read { opacity: 0.8; }
        .alert-item.critical { border-left-color: var(--error-red-500); }
        .alert-item.warning { border-left-color: var(--warning-yellow-500); }
        .alert-item.info { border-left-color: var(--color-primary-500); }
        .alert-item.success { border-left-color: var(--success-green-500); }

        .alert-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          flex-shrink: 0;
        }

        .alert-item.critical .alert-icon { background: var(--error-red-100); color: var(--error-red-600); }
        .alert-item.warning .alert-icon { background: var(--warning-yellow-100); color: var(--warning-yellow-700); }
        .alert-item.info .alert-icon { background: var(--color-primary-100); color: var(--color-primary-600); }
        .alert-item.success .alert-icon { background: var(--success-green-100); color: var(--success-green-600); }

        .alert-content { flex: 1; min-width: 0; }
        .alert-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.35rem; }

        .alert-badge {
          padding: 0.18rem 0.55rem;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.4px;
        }
        .alert-badge.critical { background: var(--error-red-100); color: var(--error-red-700); }
        .alert-badge.warning { background: var(--warning-yellow-100); color: var(--warning-yellow-800); }
        .alert-badge.info { background: var(--color-primary-100); color: var(--color-primary-700); }
        .alert-badge.success { background: var(--success-green-100); color: var(--success-green-700); }

        .alert-time { font-size: 0.78rem; color: var(--neutral-400); }
        .alert-title { font-size: 0.96rem; font-weight: 700; color: var(--neutral-900); margin: 0 0 0.25rem; }
        .alert-description { font-size: 0.86rem; color: var(--neutral-600); margin: 0 0 0.5rem; line-height: 1.4; }

        .alert-meta { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
        .meta-badge.entity {
          padding: 0.2rem 0.55rem;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 700;
          background: #3b82f6;
          color: white;
        }
        .meta-text { font-size: 0.78rem; color: var(--neutral-500); }

        .alert-actions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          justify-content: center;
        }

        .btn-action {
          padding: 0.55rem 1rem;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          background: var(--neutral-100);
          border: none;
          color: var(--neutral-700);
          white-space: nowrap;
        }

        .btn-action:hover { background: var(--neutral-200); }
        .btn-action.primary { background: var(--role-accent, #22c55e); color: var(--neutral-900); }
        .btn-action.primary:hover { background: var(--success-green-500); color: white; }

        .empty-alerts {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2.5rem 1rem;
          background: white;
          border-radius: 12px;
          box-shadow: var(--shadow-card);
          color: var(--neutral-500);
          gap: 0.75rem;
        }

        @media (max-width: 1024px) {
          .alert-stats { grid-template-columns: repeat(2, 1fr); }
          .alert-item { grid-template-columns: 1fr; }
          .alert-actions { flex-direction: row; justify-content: flex-end; }
        }

        @media (max-width: 768px) {
          .page-header { flex-direction: column; gap: 1rem; }
          .alert-stats { grid-template-columns: 1fr; }
          .filter-tabs { flex-wrap: wrap; }
        }
      `}</style>
    </div>
  );
}
