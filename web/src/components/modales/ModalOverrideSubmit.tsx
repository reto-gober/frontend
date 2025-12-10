import { useState, useEffect } from 'react';
import { ModalPortal } from '../common/ModalPortal';
import adminActionsService from '../../lib/services/adminActionsService';
import notifications from '../../lib/notifications';
import type { OverrideSubmitRequest } from '../../lib/types/admin';

interface Props {
  periodoId: string;
  responsableId: string;
  reporteNombre: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalOverrideSubmit({ periodoId, responsableId, reporteNombre, onClose, onSuccess }: Props) {
  const [motivo, setMotivo] = useState('');
  const [comentarios, setComentarios] = useState('');
  const [notificarSupervisor, setNotificarSupervisor] = useState(true);
  const [notificarResponsable, setNotificarResponsable] = useState(true);
  const [confirmoResponsabilidad, setConfirmoResponsabilidad] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      
      // Validar tamaño (máximo 10MB por archivo)
      const maxSize = 10 * 1024 * 1024;
      const invalidFiles = filesArray.filter(f => f.size > maxSize);
      
      if (invalidFiles.length > 0) {
        notifications.error(
          `Los siguientes archivos exceden el tamaño máximo de 10MB: ${invalidFiles.map(f => f.name).join(', ')}`
        );
        return;
      }
      
      setFiles(filesArray);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!motivo.trim()) {
      notifications.warning('El motivo es obligatorio');
      return;
    }
    
    if (!confirmoResponsabilidad) {
      notifications.warning('Debe confirmar la responsabilidad de esta acción');
      return;
    }
    
    // Confirmación final
    const confirmed = await notifications.confirm(
      '¿Está seguro de marcar este reporte como enviado?',
      'Esta acción será registrada en auditoría y se notificará al equipo.',
      'Sí, marcar como enviado',
      'Cancelar'
    );
    
    if (!confirmed) return;
    
    setIsSubmitting(true);
    setUploadProgress(0);
    
    try {
      const request: OverrideSubmitRequest = {
        periodoId,
        originalResponsibleId: responsableId,
        motivo,
        comentarios: comentarios || undefined,
        notificarSupervisor,
        notificarResponsable,
        confirmoResponsabilidad,
      };
      
      // Simular progreso
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      await adminActionsService.overrideSubmit(
        periodoId,
        request,
        files.length > 0 ? files : undefined
      );
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      notifications.success(
        'Reporte marcado como enviado exitosamente',
        'Acción administrativa registrada'
      );
      
      onSuccess();
      onClose();
      
    } catch (error: any) {
      notifications.error(
        error.response?.data?.message || 'Error al procesar la acción administrativa'
      );
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  // Manejar tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSubmitting, onClose]);
    
    return (
      <ModalPortal>
        <div className="modal-overlay">
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}>
                <path d="M12 9v4l2 2" />
                <circle cx="12" cy="12" r="10" />
              </svg>
              Marcar como Enviado (Admin)
            </h2>
            <button className="modal-close" onClick={onClose} disabled={isSubmitting}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Advertencia */}
              <div className="alert alert-warning">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div>
                  <strong>Acción excepcional:</strong> Esta acción será registrada en auditoría y notificará al supervisor y al responsable original.
                </div>
              </div>
              
              {/* Info del reporte */}
              <div className="info-box">
                <div className="info-label">Reporte:</div>
                <div className="info-value">{reporteNombre}</div>
              </div>
              
              {/* Motivo obligatorio */}
              <div className="form-group">
                <label className="form-label required">
                  Motivo de la acción administrativa
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={motivo}
                  onInput={(e) => setMotivo((e.target as HTMLTextAreaElement).value)}
                  placeholder="Explique por qué es necesario marcar este reporte como enviado..."
                  required
                  disabled={isSubmitting}
                />
                <small className="form-text">Este motivo será visible en el historial de auditoría</small>
              </div>
              
              {/* Comentarios adicionales */}
              <div className="form-group">
                <label className="form-label">
                  Comentarios adicionales (opcional)
                </label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={comentarios}
                  onInput={(e) => setComentarios((e.target as HTMLTextAreaElement).value)}
                  placeholder="Información adicional relevante..."
                  disabled={isSubmitting}
                />
              </div>
              
              {/* Subir archivos */}
              <div className="form-group">
                <label className="form-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Archivos de evidencia (opcional)
                </label>
                <input
                  type="file"
                  className="form-control"
                  multiple
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                />
                <small className="form-text">Máximo 10MB por archivo. Formatos: PDF, Word, Excel, Imágenes</small>
                
                {files.length > 0 && (
                  <div className="files-list">
                    {files.map((file, index) => (
                      <div key={index} className="file-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                          <polyline points="13 2 13 9 20 9" />
                        </svg>
                        <span>{file.name}</span>
                        <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Notificaciones */}
              <div className="form-group">
                <label className="form-label">Notificaciones</label>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={notificarSupervisor}
                      onChange={(e) => setNotificarSupervisor(e.target.checked)}
                      disabled={isSubmitting}
                    />
                    <span>Notificar al supervisor</span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={notificarResponsable}
                      onChange={(e) => setNotificarResponsable(e.target.checked)}
                      disabled={isSubmitting}
                    />
                    <span>Notificar al responsable original</span>
                  </label>
                </div>
              </div>
              
              {/* Confirmación de responsabilidad */}
              <div className="form-group">
                <label className="checkbox-label checkbox-important">
                  <input
                    type="checkbox"
                    checked={confirmoResponsabilidad}
                    onChange={(e) => setConfirmoResponsabilidad(e.target.checked)}
                    required
                    disabled={isSubmitting}
                  />
                  <span>
                    <strong>Confirmo que asumo la responsabilidad</strong> de esta acción administrativa y que los datos proporcionados son correctos.
                  </span>
                </label>
              </div>
              
              {/* Barra de progreso */}
              {isSubmitting && uploadProgress > 0 && (
                <div className="progress-container">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                  <small className="progress-text">Procesando... {uploadProgress}%</small>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting || !motivo.trim() || !confirmoResponsabilidad}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner"></span>
                    Procesando...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Marcar como Enviado
                  </>
                )}
              </button>
            </div>
          </form>
          </div>
        </div>
      </ModalPortal>
    );
}
