import { useState, useEffect } from 'react';
import { reportesService, evidenciasService, type ReporteResponse } from '../../lib/services';
import FileViewer from '../reportes/FileViewer';
import notifications from '../../lib/notifications';

interface EvidenciaAgregada {
  id: string;
  nombreArchivo: string;
  tipoArchivo: string;
  tamano: number;
  reporteNombre: string;
  entidadNombre: string;
  creadoEn: string;
  urlDescarga: string;
}

interface ArchivoViewer {
  archivoId: string;
  tipoArchivo: string;
  nombreOriginal: string;
  tamanoBytes: number;
  mimeType: string;
  subidoPor: string;
  subidoPorEmail: string;
  subidoEn: string;
  urlPublica: string | null;
}

export default function AdminEvidenciasClient() {
  const [evidencias, setEvidencias] = useState<EvidenciaAgregada[]>([]);
  const [filteredEvidencias, setFilteredEvidencias] = useState<EvidenciaAgregada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  
  // FileViewer
  const [archivoViewer, setArchivoViewer] = useState<ArchivoViewer | null>(null);
  
  // Modal de confirmación de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [evidenciaAEliminar, setEvidenciaAEliminar] = useState<EvidenciaAgregada | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    tamanoTotal: 0,
    porTipo: {} as Record<string, number>
  });

  useEffect(() => {
    cargarEvidencias();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [searchTerm, filterTipo, evidencias]);

  const cargarEvidencias = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 1. Cargar todos los reportes
      const reportesData = await reportesService.listar(0, 1000);
      
      // 2. Por cada reporte, cargar sus evidencias
      const todasEvidencias: EvidenciaAgregada[] = [];
      
      for (const reporte of reportesData.content.slice(0, 50)) { // Limitar a 50 reportes para rendimiento
        try {
          const evidenciasReporte = await evidenciasService.listarPorReporte(reporte.reporteId);
          
          evidenciasReporte.forEach((ev: any) => {
            todasEvidencias.push({
              id: ev.id,
              nombreArchivo: ev.nombreArchivo,
              tipoArchivo: ev.tipoArchivo,
              tamano: ev.tamano,
              reporteNombre: reporte.nombre,
              entidadNombre: reporte.entidadNombre || 'N/A',
              creadoEn: ev.creadoEn,
              urlDescarga: `/api/evidencias/${ev.id}/descargar`
            });
          });
        } catch (err) {
          // Continuar si un reporte no tiene evidencias
          console.log(`No hay evidencias para ${reporte.nombre}`);
        }
      }
      
      setEvidencias(todasEvidencias);
      setFilteredEvidencias(todasEvidencias);
      calcularEstadisticas(todasEvidencias);
    } catch (err) {
      console.error('Error al cargar evidencias:', err);
      setError('Error al cargar las evidencias');
    } finally {
      setLoading(false);
    }
  };

  const calcularEstadisticas = (evs: EvidenciaAgregada[]) => {
    const tamanoTotal = evs.reduce((sum, ev) => sum + ev.tamano, 0);
    const porTipo: Record<string, number> = {};
    
    evs.forEach(ev => {
      const extension = ev.nombreArchivo.split('.').pop() || 'otro';
      porTipo[extension] = (porTipo[extension] || 0) + 1;
    });
    
    setEstadisticas({
      total: evs.length,
      tamanoTotal,
      porTipo
    });
  };

  const aplicarFiltros = () => {
    let filtered = [...evidencias];

    if (searchTerm) {
      filtered = filtered.filter(ev =>
        ev.nombreArchivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ev.reporteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ev.entidadNombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterTipo) {
      filtered = filtered.filter(ev => 
        ev.nombreArchivo.toLowerCase().endsWith(`.${filterTipo.toLowerCase()}`)
      );
    }

    setFilteredEvidencias(filtered);
  };

  const formatTamano = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getTipoIcon = (nombreArchivo: string) => {
    const ext = nombreArchivo.split('.').pop()?.toLowerCase();
    switch(ext) {
      case 'pdf': return '📄';
      case 'xlsx':
      case 'xls': return '📊';
      case 'docx':
      case 'doc': return '📝';
      case 'png':
      case 'jpg':
      case 'jpeg': return '🖼️';
      default: return '📎';
    }
  };

  const esVisualizable = (nombreArchivo: string): boolean => {
    const ext = nombreArchivo.split('.').pop()?.toLowerCase();
    return ['pdf', 'png', 'jpg', 'jpeg'].includes(ext || '');
  };

  const handleVisualizar = async (ev: EvidenciaAgregada) => {
    if (!esVisualizable(ev.nombreArchivo)) {
      notifications.info('Este tipo de archivo no se puede visualizar. Usa el botón de descarga.');
      return;
    }

    try {
      // Obtener el blob del archivo usando el servicio
      const blob = await evidenciasService.obtenerBlob(ev.id);
      const blobUrl = URL.createObjectURL(blob);

      setArchivoViewer({
        archivoId: ev.id,
        tipoArchivo: ev.tipoArchivo,
        nombreOriginal: ev.nombreArchivo,
        tamanoBytes: ev.tamano,
        mimeType: ev.tipoArchivo,
        subidoPor: 'Usuario',
        subidoPorEmail: '',
        subidoEn: ev.creadoEn,
        urlPublica: blobUrl
      });
    } catch (error) {
      console.error('Error al visualizar:', error);
      notifications.error('Error al cargar el archivo para visualización');
    }
  };

  const handleDescargar = async (ev: EvidenciaAgregada) => {
    try {
      await evidenciasService.descargar(ev.id);
      notifications.success('Archivo descargado exitosamente');
    } catch (error) {
      console.error('Error al descargar:', error);
      notifications.error('Error al descargar el archivo');
    }
  };

  const handleEliminarClick = (ev: EvidenciaAgregada) => {
    setEvidenciaAEliminar(ev);
    setConfirmText('');
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (confirmText !== 'ELIMINAR') {
      notifications.error('Debes escribir "ELIMINAR" para confirmar');
      return;
    }

    if (!evidenciaAEliminar) return;

    try {
      setDeleting(true);
      await evidenciasService.eliminar(evidenciaAEliminar.id);
      
      // Actualizar lista local
      const nuevasEvidencias = evidencias.filter(e => e.id !== evidenciaAEliminar.id);
      setEvidencias(nuevasEvidencias);
      setFilteredEvidencias(nuevasEvidencias);
      calcularEstadisticas(nuevasEvidencias);
      
      notifications.success('Evidencia eliminada. Esta acción ha sido registrada en la auditoría.');
      setShowDeleteModal(false);
      setEvidenciaAEliminar(null);
      setConfirmText('');
    } catch (error) {
      console.error('Error al eliminar:', error);
      notifications.error('Error al eliminar la evidencia');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="evidencias-page">
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
          <p style={{ marginTop: '1rem', color: 'var(--neutral-600)' }}>Cargando evidencias...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="evidencias-page">
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <p style={{ color: 'var(--error-red-600)' }}>{error}</p>
          <button onClick={cargarEvidencias} className="btn-primary" style={{ marginTop: '1rem' }}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="evidencias-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-info">
          <h1 className="page-title">Gestión de Evidencias</h1>
          <p className="page-description">Archivos y documentos del sistema</p>
        </div>
      </div>

      {/* Stats */}
      <div className="evidencias-stats">
        <div className="stat-card">
          <span className="stat-value">{estadisticas.total}</span>
          <span className="stat-label">Total Archivos</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{formatTamano(estadisticas.tamanoTotal)}</span>
          <span className="stat-label">Almacenamiento</span>
        </div>
        {Object.entries(estadisticas.porTipo).slice(0, 3).map(([tipo, cantidad]) => (
          <div key={tipo} className="stat-card">
            <span className="stat-value">{cantidad}</span>
            <span className="stat-label">{tipo.toUpperCase()}</span>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="filters-bar">
        <div className="search-box">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar evidencias..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select className="filter-select" value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)}>
          <option value="">Todos los tipos</option>
          <option value="pdf">PDF</option>
          <option value="xlsx">Excel</option>
          <option value="docx">Word</option>
          <option value="png">Imagen</option>
        </select>
      </div>

      {/* Grid de archivos */}
      <div className="evidencias-grid">
        {filteredEvidencias.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--neutral-500)' }}>
            No se encontraron evidencias
          </div>
        ) : (
          filteredEvidencias.map(ev => (
            <div key={ev.id} className="evidencia-card">
              <div className="evidencia-icon">
                {getTipoIcon(ev.nombreArchivo)}
              </div>
              <div className="evidencia-info">
                <h4 className="evidencia-nombre">{ev.nombreArchivo}</h4>
                <p className="evidencia-reporte">{ev.reporteNombre}</p>
                <p className="evidencia-entidad">{ev.entidadNombre}</p>
              </div>
              <div className="evidencia-meta">
                <span className="evidencia-tamano">{formatTamano(ev.tamano)}</span>
                <span className="evidencia-fecha">{formatFecha(ev.creadoEn)}</span>
              </div>
              <div className="evidencia-actions">
                {esVisualizable(ev.nombreArchivo) && (
                  <button 
                    className="btn-icon" 
                    title="Visualizar"
                    onClick={() => handleVisualizar(ev)}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                )}
                <button 
                  className="btn-icon" 
                  title="Descargar"
                  onClick={() => handleDescargar(ev)}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </button>
                <button 
                  className="btn-icon danger" 
                  title="Eliminar"
                  onClick={() => handleEliminarClick(ev)}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FileViewer Modal */}
      {archivoViewer && (
        <FileViewer
          archivo={archivoViewer}
          periodoId=""
          onClose={() => {
            // Liberar la URL del blob cuando se cierre el modal
            if (archivoViewer.urlPublica) {
              URL.revokeObjectURL(archivoViewer.urlPublica);
            }
            setArchivoViewer(null);
          }}
        />
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && evidenciaAEliminar && (
        <div className="modal-overlay" onClick={() => !deleting && setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: 'var(--error-red-600)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }}>
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Confirmar Eliminación
              </h2>
              <button 
                className="modal-close" 
                onClick={() => !deleting && setShowDeleteModal(false)}
                disabled={deleting}
              >
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                  Estás a punto de eliminar permanentemente el siguiente archivo:
                </p>
                <div style={{ 
                  padding: '1rem', 
                  background: 'var(--neutral-50)', 
                  borderRadius: '8px',
                  borderLeft: '3px solid var(--error-red-500)'
                }}>
                  <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{evidenciaAEliminar.nombreArchivo}</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                    Reporte: {evidenciaAEliminar.reporteNombre}
                  </p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                    Entidad: {evidenciaAEliminar.entidadNombre}
                  </p>
                </div>
              </div>

              <div style={{ 
                padding: '1rem', 
                background: 'var(--error-red-50)', 
                borderRadius: '8px',
                marginBottom: '1.5rem'
              }}>
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: 'var(--error-red-700)', 
                  fontWeight: 600,
                  marginBottom: '0.5rem'
                }}>
                  ⚠️ ADVERTENCIA
                </p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--error-red-600)', lineHeight: 1.5 }}>
                  Esta acción no se puede deshacer. El archivo será eliminado permanentemente del sistema 
                  y <strong>esta operación será registrada en la auditoría</strong>.
                </p>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: 600, 
                  marginBottom: '0.5rem',
                  color: 'var(--neutral-700)'
                }}>
                  Para confirmar, escribe <strong style={{ color: 'var(--error-red-600)' }}>ELIMINAR</strong> en el campo:
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Escribe ELIMINAR"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                  disabled={deleting}
                  style={{
                    width: '100%',
                    borderColor: confirmText === 'ELIMINAR' ? 'var(--success-green-500)' : 'var(--neutral-300)'
                  }}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleConfirmDelete}
                disabled={confirmText !== 'ELIMINAR' || deleting}
                style={{
                  opacity: confirmText !== 'ELIMINAR' ? 0.5 : 1,
                  cursor: confirmText !== 'ELIMINAR' ? 'not-allowed' : 'pointer'
                }}
              >
                {deleting ? (
                  <>
                    <span className="loading-spinner" style={{ width: '16px', height: '16px', marginRight: '0.5rem' }}></span>
                    Eliminando...
                  </>
                ) : (
                  'Eliminar Permanentemente'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
