import { useEffect, useState } from 'react';
import adminActionsService from '../../lib/services/adminActionsService';
import notifications from '../../lib/notifications';
import type { AdminActionSummary } from '../../lib/types/admin';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { ModalPortal } from '../common/ModalPortal';

interface Props {
  periodoId: string;
  reporteNombre: string;
  onClose: () => void;
}

export function ModalHistorialAcciones({ periodoId, reporteNombre, onClose }: Props) {
  const [acciones, setAcciones] = useState<AdminActionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAcciones();
  }, [periodoId]);

  const loadAcciones = async () => {
    try {
      setIsLoading(true);
      const data = await adminActionsService.getActionsByPeriodo(periodoId);
      setAcciones(data);
    } catch (error: any) {
      notifications.error('Error al cargar el historial de acciones');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionTypeLabel = (type: string): string => {
    const types: Record<string, string> = {
      'OVERRIDE_SUBMIT': 'Marcado como enviado',
      'UPLOAD_EVIDENCE': 'Evidencia subida',
      'MARK_COMPLETED': 'Marcado como completado',
      'STATUS_CHANGE': 'Cambio de estado',
    };
    return types[type] || type;
  };

  const getActionTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      'OVERRIDE_SUBMIT': 'primary',
      'UPLOAD_EVIDENCE': 'success',
      'MARK_COMPLETED': 'purple',
      'STATUS_CHANGE': 'orange',
    };
    return colors[type] || 'neutral';
  };

  const formatDate = (dateString: string): string => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: es
      });
    } catch {
      return dateString;
    }
  };

  return (
    <ModalPortal>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}>
                <path d="M3 3v18h18" />
                <path d="M18 17V9" />
                <path d="M13 17V5" />
                <path d="M8 17v-3" />
              </svg>
              Historial de Acciones Administrativas
            </h2>
            <button className="modal-close" onClick={onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="modal-body">
            <div className="info-box">
              <div className="info-label">Reporte:</div>
              <div className="info-value">{reporteNombre}</div>
            </div>

            {isLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Cargando historial...</p>
              </div>
            ) : acciones.length === 0 ? (
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p>No hay acciones administrativas registradas para este reporte</p>
              </div>
            ) : (
              <div className="acciones-timeline">
                {acciones.map((accion) => (
                  <div key={accion.actionId} className="timeline-item">
                    <div className={`timeline-icon ${getActionTypeColor(accion.actionType)}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>

                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className={`badge badge-${getActionTypeColor(accion.actionType)}`}>
                          {getActionTypeLabel(accion.actionType)}
                        </span>
                        <span className="timeline-date">{formatDate(accion.createdAt)}</span>
                      </div>

                      <div className="timeline-body">
                        <div className="timeline-admin">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          <strong>{accion.adminNombre}</strong>
                          {accion.responsableAfectado && accion.responsableAfectado !== 'N/A' && (
                            <span className="text-muted"> → {accion.responsableAfectado}</span>
                          )}
                        </div>

                        <div className="timeline-motivo">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10 9 9 9 8 9" />
                          </svg>
                          <span>{accion.motivo}</span>
                        </div>

                        {accion.filesCount > 0 && (
                          <div className="timeline-files">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                              <polyline points="13 2 13 9 20 9" />
                            </svg>
                            <span>{accion.filesCount} archivo{accion.filesCount > 1 ? 's' : ''} adjunto{accion.filesCount > 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

export default ModalHistorialAcciones;
