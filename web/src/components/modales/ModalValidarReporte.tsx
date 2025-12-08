import { useState } from 'react';
import { flujoReportesService, type ValidarReporteRequest } from '../../lib/services';

interface ModalValidarReporteProps {
  periodoId: string;
  reporteNombre: string;
  responsable: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export function ModalValidarReporte({
  periodoId,
  reporteNombre,
  responsable,
  isOpen,
  onClose,
  onSuccess,
  onError
}: ModalValidarReporteProps) {
  const [accion, setAccion] = useState<'aprobar' | 'rechazar' | 'revisar'>('aprobar');
  const [comentarios, setComentarios] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [validando, setValidando] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (accion === 'rechazar' && !motivoRechazo.trim()) {
      onError('El motivo del rechazo es obligatorio');
      return;
    }

    setValidando(true);

    try {
      const request: ValidarReporteRequest = {
        periodoId,
        accion,
        comentarios: comentarios.trim() || undefined,
        motivoRechazo: accion === 'rechazar' ? motivoRechazo.trim() : undefined
      };

      await flujoReportesService.validar(request);
      onSuccess();
      onClose();
      setComentarios('');
      setMotivoRechazo('');
      setAccion('aprobar');
    } catch (err: any) {
      onError(err.response?.data?.message || 'Error al validar el reporte');
    } finally {
      setValidando(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '2rem'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
                Validar Reporte
              </h2>
              <p style={{ margin: '0.5rem 0 0', color: 'var(--color-text-light)', fontSize: '0.9375rem' }}>
                {reporteNombre}
              </p>
              <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-light)', fontSize: '0.875rem' }}>
                Responsable: {responsable}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                color: 'var(--color-text-light)'
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Acción */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--color-text)',
              marginBottom: '0.75rem'
            }}>
              Decisión <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => setAccion('aprobar')}
                style={{
                  padding: '1rem',
                  border: `2px solid ${accion === 'aprobar' ? 'var(--color-success)' : 'var(--color-border)'}`,
                  borderRadius: '8px',
                  background: accion === 'aprobar' ? 'var(--color-green-50)' : 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-success)' }}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span style={{ fontWeight: 600, color: accion === 'aprobar' ? 'var(--color-success)' : 'var(--color-text)' }}>
                  Aprobar
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAccion('revisar')}
                style={{
                  padding: '1rem',
                  border: `2px solid ${accion === 'revisar' ? 'var(--color-primary-500)' : 'var(--color-border)'}`,
                  borderRadius: '8px',
                  background: accion === 'revisar' ? 'var(--color-primary-50)' : 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-primary-500)' }}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l3 3" />
                </svg>
                <span style={{ fontWeight: 600, color: accion === 'revisar' ? 'var(--color-primary-600)' : 'var(--color-text)' }}>
                  Marcar revisión
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAccion('rechazar')}
                style={{
                  padding: '1rem',
                  border: `2px solid ${accion === 'rechazar' ? 'var(--color-danger)' : 'var(--color-border)'}`,
                  borderRadius: '8px',
                  background: accion === 'rechazar' ? 'var(--color-red-50)' : 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-danger)' }}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                <span style={{ fontWeight: 600, color: accion === 'rechazar' ? 'var(--color-danger)' : 'var(--color-text)' }}>
                  Rechazar
                </span>
              </button>
            </div>
          </div>

          {/* Motivo de Rechazo (solo si rechaza) */}
          {accion === 'rechazar' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="motivoRechazo" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--color-text)',
                marginBottom: '0.5rem'
              }}>
                Motivo del Rechazo <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <textarea
                id="motivoRechazo"
                className="form-textarea"
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                rows={4}
                placeholder="Describe claramente el motivo del rechazo y las correcciones necesarias..."
                required
                style={{ 
                  resize: 'vertical',
                  borderColor: 'var(--color-danger)'
                }}
              />
              <p style={{
                margin: '0.5rem 0 0',
                fontSize: '0.75rem',
                color: 'var(--color-text-light)'
              }}>
                Este mensaje será enviado al responsable para que realice las correcciones.
              </p>
            </div>
          )}

          {/* Comentarios adicionales */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="comentarios" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--color-text)',
              marginBottom: '0.5rem'
            }}>
              Comentarios Adicionales
            </label>
            <textarea
              id="comentarios"
              className="form-textarea"
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              rows={3}
              placeholder={accion === 'aprobar' 
                ? "Agrega comentarios positivos o sugerencias (opcional)..." 
                : "Comentarios adicionales sobre el rechazo (opcional)..."
              }
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Botones */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end',
            paddingTop: '1rem',
            borderTop: '1px solid var(--color-border)'
          }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={validando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`btn ${accion === 'aprobar' ? 'btn-success' : 'btn-danger'} btn-with-icon`}
              disabled={validando || (accion === 'rechazar' && !motivoRechazo.trim())}
            >
              {validando ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                    <line x1="12" y1="2" x2="12" y2="6"></line>
                    <line x1="12" y1="18" x2="12" y2="22"></line>
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                    <line x1="2" y1="12" x2="6" y2="12"></line>
                    <line x1="18" y1="12" x2="22" y2="12"></line>
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                  </svg>
                  Procesando...
                </>
              ) : accion === 'aprobar' ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Aprobar Reporte
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  Rechazar Reporte
                </>
              )}
            </button>
          </div>
        </form>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
