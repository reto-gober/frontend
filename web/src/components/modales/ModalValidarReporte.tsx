import { useState, useEffect } from 'react';
import { flujoReportesService, archivosService, type ValidarReporteRequest, type ArchivoDTO } from '../../lib/services';
import FileViewer from '../reportes/FileViewer';

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
  const [accion, setAccion] = useState<'aprobar' | 'rechazar' | 'corregir' | 'revisar'>('aprobar');
  const [comentarios, setComentarios] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [validando, setValidando] = useState(false);
  
  // Estados para archivos
  const [archivos, setArchivos] = useState<ArchivoDTO[]>([]);
  const [cargandoArchivos, setCargandoArchivos] = useState(false);
  const [errorArchivos, setErrorArchivos] = useState<string | null>(null);
  
  // Estado para el visor de archivos
  const [archivoViewer, setArchivoViewer] = useState<{open: boolean; archivo: ArchivoDTO | null}>({
    open: false,
    archivo: null
  });

  // Cargar archivos cuando se abre el modal
  useEffect(() => {
    if (isOpen && periodoId) {
      cargarArchivos();
    } else {
      // Resetear cuando se cierra
      setArchivos([]);
      setErrorArchivos(null);
    }
  }, [isOpen, periodoId]);

  const cargarArchivos = async () => {
    setCargandoArchivos(true);
    setErrorArchivos(null);
    try {
      const response = await archivosService.obtenerArchivosPorPeriodo(periodoId);
      setArchivos(response.archivos || []);
    } catch (err: any) {
      console.error('Error cargando archivos:', err);
      setErrorArchivos('No se pudieron cargar los archivos');
    } finally {
      setCargandoArchivos(false);
    }
  };

  const handleVisualizarArchivo = async (archivo: ArchivoDTO) => {
    setArchivoViewer({ open: true, archivo });
  };

  const handleDescargarArchivo = async (archivo: ArchivoDTO) => {
    try {
      await archivosService.descargarArchivo(periodoId, archivo.archivoId, archivo.nombreOriginal);
    } catch (err) {
      onError('Error al descargar el archivo');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación: rechazar y corregir requieren motivo obligatorio
    if ((accion === 'rechazar' || accion === 'corregir') && !motivoRechazo.trim()) {
      const mensaje = accion === 'rechazar' 
        ? 'El motivo del rechazo es obligatorio'
        : 'Las instrucciones de corrección son obligatorias';
      onError(mensaje);
      return;
    }

    setValidando(true);

    try {
      const request: ValidarReporteRequest = {
        periodoId,
        accion: accion === 'corregir' ? 'rechazar' : accion as 'aprobar' | 'rechazar' | 'revisar',
        comentarios: comentarios.trim() || undefined,
        motivoRechazo: (accion === 'rechazar' || accion === 'corregir') ? motivoRechazo.trim() : undefined
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

        {/* Sección de Archivos */}
        <div style={{ marginBottom: '1.5rem' }}>
          {cargandoArchivos ? (
            <div style={{ 
              padding: '1rem', 
              textAlign: 'center', 
              color: 'var(--color-text-light)',
              backgroundColor: 'var(--color-background)',
              borderRadius: '8px'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>
                <line x1="12" y1="2" x2="12" y2="6"></line>
                <line x1="12" y1="18" x2="12" y2="22"></line>
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                <line x1="2" y1="12" x2="6" y2="12"></line>
                <line x1="18" y1="12" x2="22" y2="12"></line>
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
              </svg>
              <p style={{ marginTop: '0.5rem', marginBottom: 0 }}>Cargando archivos...</p>
            </div>
          ) : errorArchivos ? (
            <div style={{
              padding: '1rem',
              backgroundColor: 'var(--color-red-50)',
              border: '1px solid var(--color-danger)',
              borderRadius: '8px',
              color: 'var(--color-danger)'
            }}>
              {errorArchivos}
            </div>
          ) : archivos.length > 0 ? (
            <>
              <h3 style={{ 
                fontSize: '0.875rem', 
                fontWeight: 600, 
                color: 'var(--color-text)',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
                Archivos Adjuntos ({archivos.length})
              </h3>
              <div style={{ 
                maxHeight: '250px', 
                overflowY: 'auto',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                backgroundColor: 'var(--color-background)'
              }}>
                {archivos.map((archivo, index) => (
                  <div
                    key={archivo.archivoId}
                    style={{
                      padding: '0.75rem',
                      borderBottom: index < archivos.length - 1 ? '1px solid var(--color-border)' : 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: 'white'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                        <polyline points="13 2 13 9 20 9"/>
                      </svg>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ 
                          margin: 0, 
                          fontWeight: 500,
                          color: 'var(--color-text)',
                          fontSize: '0.875rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {archivo.nombreOriginal}
                        </p>
                        <p style={{ 
                          margin: '0.25rem 0 0', 
                          fontSize: '0.75rem', 
                          color: 'var(--color-text-light)' 
                        }}>
                          {(archivo.tamanoBytes / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handleVisualizarArchivo(archivo)}
                        style={{
                          padding: '0.5rem',
                          border: '1px solid var(--color-border)',
                          borderRadius: '6px',
                          background: 'white',
                          cursor: 'pointer'
                        }}
                        title="Ver archivo"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDescargarArchivo(archivo)}
                        style={{
                          padding: '0.5rem',
                          border: '1px solid var(--color-border)',
                          borderRadius: '6px',
                          background: 'white',
                          cursor: 'pointer'
                        }}
                        title="Descargar archivo"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="7 10 12 15 17 10"></polyline>
                          <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: 'var(--color-text-light)',
              backgroundColor: 'var(--color-background)',
              borderRadius: '8px',
              border: '1px dashed var(--color-border)'
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ margin: '0 auto', opacity: 0.3 }}>
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                <polyline points="13 2 13 9 20 9"></polyline>
              </svg>
              <p style={{ marginTop: '1rem', marginBottom: 0 }}>No hay archivos adjuntos</p>
            </div>
          )}
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
                  Aprobado
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
                  Rechazado
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAccion('corregir')}
                style={{
                  padding: '1rem',
                  border: `2px solid ${accion === 'corregir' ? 'var(--color-warning)' : 'var(--color-border)'}`,
                  borderRadius: '8px',
                  background: accion === 'corregir' ? 'var(--color-yellow-50)' : 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-warning)' }}>
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                <span style={{ fontWeight: 600, color: accion === 'corregir' ? 'var(--color-warning)' : 'var(--color-text)' }}>
                  Corregir
                </span>
              </button>
            </div>
          </div>

          {/* Motivo de Rechazo (para rechazar o corregir) */}
          {(accion === 'rechazar' || accion === 'corregir') && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="motivoRechazo" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--color-text)',
                marginBottom: '0.5rem'
              }}>
                {accion === 'rechazar' ? 'Motivo del Rechazo' : 'Instrucciones de Corrección'} <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <textarea
                id="motivoRechazo"
                className="form-textarea"
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                rows={4}
                placeholder={
                  accion === 'rechazar' 
                    ? "Describe claramente el motivo del rechazo definitivo..."
                    : "Indica las correcciones que debe realizar el responsable..."
                }
                required
                style={{ 
                  resize: 'vertical',
                  borderColor: accion === 'rechazar' ? 'var(--color-danger)' : 'var(--color-warning)'
                }}
              />
              <p style={{
                margin: '0.5rem 0 0',
                fontSize: '0.75rem',
                color: 'var(--color-text-light)'
              }}>
                {accion === 'rechazar' 
                  ? 'El reporte será rechazado definitivamente.' 
                  : 'El responsable recibirá estas instrucciones y podrá volver a enviar el reporte corregido.'}
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
              className={`btn ${accion === 'aprobar' ? 'btn-success' : accion === 'corregir' ? 'btn-warning' : 'btn-danger'} btn-with-icon`}
              disabled={validando || ((accion === 'rechazar' || accion === 'corregir') && !motivoRechazo.trim())}
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
              ) : accion === 'corregir' ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  Solicitar Corrección
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

      {/* Visor de archivos */}
      {archivoViewer.open && archivoViewer.archivo && (
        <FileViewer
          archivo={archivoViewer.archivo}
          periodoId={periodoId}
          onClose={() => setArchivoViewer({ open: false, archivo: null })}
        />
      )}
    </div>
  );
}
