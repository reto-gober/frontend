import { useEffect, useMemo, useRef, useState } from 'react';
import notificacionesService, {
  type NotificacionDTO,
  type NotificacionTipo,
} from '../../lib/notificacionesService';
import { relativeTimeFromNow } from '../../lib/supervisorAlerts';

type Role = 'supervisor' | 'responsable' | 'admin';

interface NotificationsBellProps {
  role: Role;
}

type UiNotificacion = {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: 'critica' | 'advertencia' | 'exito' | 'info';
  fecha: string;
  leida: boolean;
  entidad?: string;
  responsable?: string;
  link?: string | null;
};

export default function NotificationsBell({ role }: NotificationsBellProps) {
  const [alertas, setAlertas] = useState<UiNotificacion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    cargarAlertas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const cargarAlertas = async () => {
    try {
      setLoading(true);
      setError(null);

      const page = await notificacionesService.listar(0, 50);
      const mapped = (page?.content || []).map(mapNotificacionToUi(role));
      setAlertas(mapped);
    } catch (err: any) {
      console.error('Error al cargar alertas:', err);
      setError(err?.response?.data?.message || 'No se pudieron cargar las alertas.');
      setAlertas([]);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = useMemo(
    () => alertas.filter((a) => !a.leida && (a.tipo === 'critica' || a.tipo === 'advertencia')).length,
    [alertas]
  );

  const badgeCount = useMemo(
    () => alertas.filter((a) => a.tipo === 'critica' || a.tipo === 'advertencia').length,
    [alertas]
  );

  const topAlertas = useMemo(() => alertas.slice(0, 6), [alertas]);

  const marcarComoLeida = async (id: string) => {
    try {
      setAlertas((prev) => prev.map((a) => (a.id === id ? { ...a, leida: true } : a)));
      await notificacionesService.marcarLeida(id);
    } catch (err) {
      console.error('Error al marcar como leída', err);
    }
  };

  const marcarTodas = async () => {
    try {
      setAlertas((prev) => prev.map((a) => ({ ...a, leida: true })));
      await notificacionesService.marcarTodas();
    } catch (err) {
      console.error('Error al marcar todas como leídas', err);
    }
  };

  const destinoAlertas =
    role === 'supervisor'
      ? '/roles/supervisor/alertas'
      : role === 'admin'
        ? '/roles/admin/dashboard'
        : '/roles/responsable/alertas';

  return (
    <div className="notifications-bell" ref={dropdownRef}>
      <button className="icon-btn alerts" onClick={() => setOpen((o) => !o)} aria-label="Ver alertas">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {badgeCount > 0 && <span className="notification-badge">{badgeCount}</span>}
      </button>

      {open && (
        <div className="notifications-dropdown">
          <div className="dropdown-header">
            <div>
              <p className="dropdown-title">Alertas</p>
              <span className="dropdown-subtitle">
                {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día'}
              </span>
            </div>
            <div className="dropdown-actions">
              <button className="text-btn" onClick={marcarTodas} disabled={alertas.length === 0}>
                Marcar leídas
              </button>
              <button className="text-btn" onClick={cargarAlertas}>
                Refrescar
              </button>
            </div>
          </div>

          <div className="dropdown-body">
            {loading && <p className="muted">Cargando alertas...</p>}
            {error && <p className="muted error">{error}</p>}
            {!loading && !error && topAlertas.length === 0 && <p className="muted">Sin alertas pendientes</p>}

            {!loading &&
              !error &&
              topAlertas.map((alerta) => (
                <div
                  key={alerta.id}
                  className={`dropdown-item ${alerta.tipo} ${alerta.leida ? 'read' : ''}`}
                  onClick={() => {
                    marcarComoLeida(alerta.id);
                    if (alerta.link) {
                      window.location.href = alerta.link;
                    } else {
                      window.location.href = destinoAlertas;
                    }
                  }}
                >
                  <div className="item-icon">
                    {alerta.tipo === 'critica' ? (
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    ) : alerta.tipo === 'advertencia' ? (
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    ) : alerta.tipo === 'exito' ? (
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                    )}
                  </div>
                  <div className="item-content">
                    <div className="item-header">
                      <p className="item-title">{alerta.titulo}</p>
                      <span className="item-time">{relativeTimeFromNow(alerta.fecha)}</span>
                    </div>
                    <p className="item-desc">{alerta.descripcion}</p>
                    <div className="item-meta">
                      {alerta.entidad && <span className="pill">{alerta.entidad}</span>}
                      {alerta.responsable && <span className="muted">{alerta.responsable}</span>}
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {role !== 'admin' && (
            <div className="dropdown-footer">
              <a className="link" href={destinoAlertas}>
                Ver todas las alertas
              </a>
            </div>
          )}
        </div>
      )}

      <style>{`
        .notifications-bell {
          position: relative;
        }

        .icon-btn {
          position: relative;
          padding: 0.5rem;
          background: transparent;
          border: 1px solid var(--neutral-200);
          border-radius: 10px;
          cursor: pointer;
          color: var(--neutral-600);
          transition: all 0.2s;
        }

        .icon-btn:hover {
          background: var(--neutral-100);
          color: var(--neutral-800);
        }

        .icon-btn.alerts {
          border-color: var(--neutral-200);
        }

        .notification-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          background: var(--error-red-500);
          color: white;
          font-size: 0.7rem;
          font-weight: 700;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .notifications-dropdown {
          position: absolute;
          top: 46px;
          right: 0;
          width: 380px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 12px 30px rgba(0,0,0,0.15);
          border: 1px solid var(--neutral-200);
          z-index: 20;
          overflow: hidden;
        }

        .dropdown-header,
        .dropdown-footer {
          padding: 0.9rem 1rem;
          border-bottom: 1px solid var(--neutral-200);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
        }

        .dropdown-footer {
          border-top: 1px solid var(--neutral-200);
          border-bottom: none;
          justify-content: flex-end;
        }

        .dropdown-title {
          margin: 0;
          font-weight: 700;
          color: var(--neutral-900);
        }

        .dropdown-subtitle {
          font-size: 0.85rem;
          color: var(--neutral-500);
        }

        .dropdown-actions {
          display: flex;
          gap: 0.5rem;
        }

        .text-btn {
          background: transparent;
          border: none;
          color: var(--color-primary-600);
          font-weight: 600;
          cursor: pointer;
          padding: 0.25rem 0.5rem;
        }

        .text-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .dropdown-body {
          max-height: 360px;
          overflow-y: auto;
          padding: 0.25rem 0;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .dropdown-item {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--neutral-100);
          cursor: pointer;
          transition: background 0.15s;
        }

        .dropdown-item:hover {
          background: var(--neutral-50);
        }

        .dropdown-item.read {
          opacity: 0.8;
        }

        .dropdown-item.critica .item-icon {
          background: var(--error-red-100);
          color: var(--error-red-600);
        }
        .dropdown-item.advertencia .item-icon {
          background: var(--warning-yellow-100);
          color: var(--warning-yellow-700);
        }
        .dropdown-item.exito .item-icon {
          background: var(--success-green-100);
          color: var(--success-green-700);
        }
        .dropdown-item.info .item-icon {
          background: var(--color-primary-100);
          color: var(--color-primary-700);
        }

        .item-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: var(--neutral-100);
          color: var(--neutral-600);
        }

        .item-content { min-width: 0; }

        .item-header {
          display: flex;
          justify-content: space-between;
          gap: 0.5rem;
          align-items: center;
        }

        .item-title {
          margin: 0;
          font-weight: 700;
          color: var(--neutral-900);
          font-size: 0.92rem;
        }

        .item-time {
          font-size: 0.75rem;
          color: var(--neutral-400);
          white-space: nowrap;
        }

        .item-desc {
          margin: 0.2rem 0;
          color: var(--neutral-600);
          font-size: 0.85rem;
          line-height: 1.4;
        }

        .item-meta {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .pill {
          padding: 0.2rem 0.55rem;
          border-radius: 999px;
          background: var(--neutral-100);
          color: var(--neutral-700);
          font-size: 0.75rem;
          font-weight: 700;
        }

        .muted {
          color: var(--neutral-500);
          font-size: 0.85rem;
          margin: 0;
        }

        .muted.error {
          color: var(--error-red-600);
        }

        .link {
          color: var(--color-primary-600);
          font-weight: 700;
          text-decoration: none;
        }

        @media (max-width: 520px) {
          .notifications-dropdown {
            width: 320px;
            right: -40px;
          }
        }
      `}</style>
    </div>
  );
}

function mapTipo(tipo?: NotificacionTipo): UiNotificacion['tipo'] {
  if (tipo === 'critica') return 'critica';
  if (tipo === 'advertencia') return 'advertencia';
  if (tipo === 'informativa') return 'info';
  if (tipo === 'exito') return 'exito';
  return 'info';
}

function mapNotificacionToUi(role: Role) {
  return (n: NotificacionDTO): UiNotificacion => {
    const metadata = n.metadata || {};
    const linkMeta = (metadata as any)?.link || (metadata as any)?.url;
    const periodoId = n.periodoId || (metadata as any)?.periodoId;

    const fallbackLink = periodoId
      ? `/roles/${role}/reportes/${periodoId}`
      : `/roles/${role}/dashboard`;

    return {
      id: n.notificacionId || crypto.randomUUID(),
      titulo: n.titulo || 'Notificación',
      descripcion: n.mensaje || 'Tienes una actualización pendiente.',
      tipo: mapTipo(n.tipo),
      fecha: n.fechaProgramada || n.fechaEnviado || new Date().toISOString(),
      leida: Boolean(n.leido),
      entidad: n.entidadNombre || (metadata as any)?.entidad,
      responsable: (metadata as any)?.responsable,
      link: (typeof linkMeta === 'string' && linkMeta) || fallbackLink,
    };
  };
}
