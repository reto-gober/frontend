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
  periodoDescripcion: string;
  periodoInicio: string;
  periodoFin: string;
  creadoEn: string;
  urlDescarga: string;
}

interface EvidenciasPorPeriodo {
  periodo: string;
  periodoInicio: string;
  periodoFin: string;
  evidencias: EvidenciaAgregada[];
  totalArchivos: number;
  totalTamano: number;
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
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(10);
  const [expandedPeriodo, setExpandedPeriodo] = useState<string | null>(null);
  
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
    setCurrentPage(0); // Reset page cuando cambian los filtros
  }, [searchTerm, filterTipo, evidencias]);

  // Manejar tecla Escape para cerrar modales
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !deleting) {
        if (showDeleteModal) {
          setShowDeleteModal(false);
          setEvidenciaAEliminar(null);
          setConfirmText('');
        }
        if (archivoViewer) {
          setArchivoViewer(null);
        }
      }
    };

    if (showDeleteModal || archivoViewer) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [showDeleteModal, archivoViewer, deleting]);

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
            const periodoInicio = ev.periodoInicio || reporte.createdAt || new Date().toISOString();
            const periodoFin = ev.periodoFin || reporte.fechaVencimiento || new Date().toISOString();
            const periodoDescripcion = formatPeriodo(periodoInicio, periodoFin);
            
            todasEvidencias.push({
              id: ev.id,
              nombreArchivo: ev.nombreArchivo,
              tipoArchivo: ev.tipoArchivo,
              tamano: ev.tamano,
              reporteNombre: reporte.nombre,
              entidadNombre: reporte.entidadNombre || 'N/A',
              periodoDescripcion,
              periodoInicio,
              periodoFin,
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

  const formatPeriodo = (inicio: string, fin: string) => {
    const fechaInicio = new Date(inicio);
    const fechaFin = new Date(fin);
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    if (fechaInicio.getFullYear() === fechaFin.getFullYear() && fechaInicio.getMonth() === fechaFin.getMonth()) {
      return `${meses[fechaInicio.getMonth()]} ${fechaInicio.getFullYear()}`;
    }
    return `${meses[fechaInicio.getMonth()]} ${fechaInicio.getFullYear()} - ${meses[fechaFin.getMonth()]} ${fechaFin.getFullYear()}`;
  };

  const agruparPorPeriodo = (evs: EvidenciaAgregada[]): EvidenciasPorPeriodo[] => {
    const grupos: Record<string, EvidenciasPorPeriodo> = {};
    
    evs.forEach(ev => {
      const key = `${ev.periodoInicio}_${ev.periodoFin}`;
      
      if (!grupos[key]) {
        grupos[key] = {
          periodo: ev.periodoDescripcion,
          periodoInicio: ev.periodoInicio,
          periodoFin: ev.periodoFin,
          evidencias: [],
          totalArchivos: 0,
          totalTamano: 0
        };
      }
      
      grupos[key].evidencias.push(ev);
      grupos[key].totalArchivos++;
      grupos[key].totalTamano += ev.tamano;
    });
    
    return Object.values(grupos).sort((a, b) => 
      new Date(b.periodoInicio).getTime() - new Date(a.periodoInicio).getTime()
    );
  };

  const getPaginatedData = () => {
    const grupos = agruparPorPeriodo(filteredEvidencias);
    return grupos;
  };

  const getPaginatedEvidencias = (evidencias: EvidenciaAgregada[]) => {
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    return evidencias.slice(start, end);
  };

  const getTotalPages = (total: number) => {
    return Math.ceil(total / itemsPerPage);
  };

  const togglePeriodo = (periodoKey: string) => {
    setExpandedPeriodo(expandedPeriodo === periodoKey ? null : periodoKey);
    setCurrentPage(0);
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
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
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

      {/* Evidencias agrupadas por periodo - Formato Lista */}
      <div className="evidencias-por-periodo">
        {filteredEvidencias.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--neutral-500)' }}>
            No se encontraron evidencias
          </div>
        ) : (
          getPaginatedData().map(grupo => {
            const periodoKey = `${grupo.periodoInicio}_${grupo.periodoFin}`;
            const isExpanded = expandedPeriodo === periodoKey;
            const evidenciasPaginadas = isExpanded ? getPaginatedEvidencias(grupo.evidencias) : [];
            const totalPages = getTotalPages(grupo.evidencias.length);

            return (
              <div key={periodoKey} className="periodo-group">
                <div 
                  className="periodo-header clickable" 
                  onClick={() => togglePeriodo(periodoKey)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="periodo-info">
                    <h3 className="periodo-title">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      {grupo.periodo}
                      <svg 
                        viewBox="0 0 24 24" 
                        width="18" 
                        height="18" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                        style={{ 
                          marginLeft: 'auto',
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s'
                        }}
                      >
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </h3>
                    <div className="periodo-stats">
                      <span className="periodo-stat">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                          <polyline points="13 2 13 9 20 9"/>
                        </svg>
                        {grupo.totalArchivos} archivo{grupo.totalArchivos !== 1 ? 's' : ''}
                      </span>
                      <span className="periodo-stat">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                        </svg>
                        {formatTamano(grupo.totalTamano)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {isExpanded && (
                  <>
                    <div className="evidencias-lista">
                      {evidenciasPaginadas.map(ev => (
                        <div key={ev.id} className="evidencia-item">
                          <div className="evidencia-item-icon">
                            {getTipoIcon(ev.nombreArchivo)}
                          </div>
                          <div className="evidencia-item-info">
                            <h4 className="evidencia-item-nombre">{ev.nombreArchivo}</h4>
                            <div className="evidencia-item-meta">
                              <span className="evidencia-meta-text">{ev.reporteNombre}</span>
                              <span className="evidencia-meta-separator">•</span>
                              <span className="evidencia-meta-text">{ev.entidadNombre}</span>
                            </div>
                          </div>
                          <div className="evidencia-item-details">
                            <span className="evidencia-tamano-badge">{formatTamano(ev.tamano)}</span>
                            <span className="evidencia-fecha-text">{formatFecha(ev.creadoEn)}</span>
                          </div>
                          <div className="evidencia-item-actions">
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
                      ))}
                    </div>

                    {/* Paginación */}
                    {totalPages > 1 && (
                      <div className="pagination">
                        <button 
                          className="pagination-btn"
                          onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                          disabled={currentPage === 0}
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15 18 9 12 15 6"/>
                          </svg>
                          Anterior
                        </button>
                        <div className="pagination-info">
                          Página {currentPage + 1} de {totalPages}
                        </div>
                        <button 
                          className="pagination-btn"
                          onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                          disabled={currentPage >= totalPages - 1}
                        >
                          Siguiente
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6"/>
                          </svg>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })
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
        <div className="modal-overlay">
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
