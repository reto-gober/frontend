import React, { useState, useEffect } from 'react';
import { evidenciasSupervisorService, type EvidenciaSupervisor, type Page } from '../../lib/services';
import notifications from '../../lib/notifications';
import FileViewer from '../reportes/FileViewer';

type ViewMode = 'grid' | 'list';

interface ResponsableOption {
  id: string;
  nombre: string;
}

// Interface para archivo compatible con FileViewer
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

export default function SupervisorEvidenciasClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [evidencias, setEvidencias] = useState<EvidenciaSupervisor[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [size] = useState(12);
  
  // Visualización de archivo
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<ArchivoViewer | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroResponsable, setFiltroResponsable] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  
  // Datos para filtros - extraídos de las evidencias
  const [responsables, setResponsables] = useState<ResponsableOption[]>([]);
  
  // Vista
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pendientes: 0
  });

  useEffect(() => {
    cargarEvidencias();
  }, [page, filtroTipo, filtroResponsable, filtroEstado]);

  const cargarEvidencias = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await evidenciasSupervisorService.listar(
        page,
        size,
        filtroTipo || undefined,
        filtroResponsable || undefined,
        undefined,
        filtroEstado || undefined
      );
      
      setEvidencias(data.content);
      setTotalElements(data.totalElements);

      // Extraer responsables únicos de las evidencias
      const responsablesUnicos = new Map<string, string>();
      data.content.forEach(e => {
        if (e.responsableCarga?.usuarioId && e.responsableCarga?.nombreCompleto) {
          responsablesUnicos.set(e.responsableCarga.usuarioId, e.responsableCarga.nombreCompleto);
        }
      });
      
      // Si es la primera carga, cargar todos para tener filtros completos
      if (page === 0 && !filtroTipo && !filtroResponsable && !filtroEstado) {
        setResponsables(Array.from(responsablesUnicos.entries()).map(([id, nombre]) => ({ id, nombre })));
      }

      // Calcular stats
      const pendientes = data.content.filter(e => 
        ['pendiente_validacion', 'PENDIENTE_VALIDACION'].includes(e.reporte?.estado || '')
      ).length;
      
      setStats({
        total: data.totalElements,
        pendientes
      });

    } catch (err: any) {
      console.error('Error al cargar evidencias:', err);
      setError(err.response?.data?.message || 'Error al cargar las evidencias');
    } finally {
      setLoading(false);
    }
  };

  const handleDescargar = async (id: string) => {
    try {
      await evidenciasSupervisorService.descargar(id);
      notifications.toast('Descargando archivo...', 'info');
    } catch (err: any) {
      notifications.error(err.response?.data?.message || 'Error al descargar el archivo');
    }
  };

  const handleVisualizarArchivo = (evidencia: EvidenciaSupervisor) => {
    // Convertir EvidenciaSupervisor a formato compatible con FileViewer
    const archivoViewer: ArchivoViewer = {
      archivoId: evidencia.id,
      tipoArchivo: evidencia.tipoArchivo,
      nombreOriginal: evidencia.nombreArchivo,
      tamanoBytes: evidencia.tamanioBytes,
      mimeType: evidencia.tipoArchivo,
      subidoPor: evidencia.responsableCarga?.nombreCompleto || 'Desconocido',
      subidoPorEmail: evidencia.responsableCarga?.email || '',
      subidoEn: evidencia.fechaCarga,
      urlPublica: null
    };
    setArchivoSeleccionado(archivoViewer);
  };

  const esVisualizable = (mimeType: string): boolean => {
    return mimeType.startsWith('image/') || 
           mimeType === 'application/pdf' ||
           mimeType.includes('pdf');
  };

  const formatearTamano = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatearFecha = (fecha: string): string => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getFileIcon = (tipoArchivo: string): { icon: React.ReactNode; clase: string } => {
    const tipo = tipoArchivo?.toLowerCase() || '';
    
    if (tipo.includes('pdf')) {
      return {
        clase: 'pdf',
        icon: (
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#dc2626" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <text x="12" y="17" textAnchor="middle" fontSize="6" fill="#dc2626" stroke="none" fontWeight="bold">PDF</text>
          </svg>
        )
      };
    }
    
    if (tipo.includes('excel') || tipo.includes('spreadsheet') || tipo.includes('xlsx') || tipo.includes('xls')) {
      return {
        clase: 'excel',
        icon: (
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#16a34a" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="8" y1="13" x2="16" y2="13"/>
            <line x1="8" y1="17" x2="16" y2="17"/>
          </svg>
        )
      };
    }
    
    if (tipo.includes('word') || tipo.includes('document') || tipo.includes('docx') || tipo.includes('doc')) {
      return {
        clase: 'word',
        icon: (
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#2563eb" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        )
      };
    }
    
    if (tipo.includes('image') || tipo.includes('png') || tipo.includes('jpg') || tipo.includes('jpeg')) {
      return {
        clase: 'image',
        icon: (
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#8b5cf6" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        )
      };
    }
    
    return {
      clase: 'default',
      icon: (
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#6b7280" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      )
    };
  };

  const filtrarPorBusqueda = (evidencias: EvidenciaSupervisor[]): EvidenciaSupervisor[] => {
    if (!searchTerm) return evidencias;
    const termino = searchTerm.toLowerCase();
    return evidencias.filter(e => 
      e.nombreArchivo?.toLowerCase().includes(termino) ||
      e.reporte?.nombre?.toLowerCase().includes(termino) ||
      e.responsableCarga?.nombreCompleto?.toLowerCase().includes(termino)
    );
  };

  const evidenciasFiltradas = filtrarPorBusqueda(evidencias);

  if (error && evidencias.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: 'var(--error-red-600)' }}>Ha ocurrido un error interno en el servidor. Por favor contacte al administrador.</p>
        <button onClick={cargarEvidencias} className="btn-primary" style={{ 
          marginTop: '1rem',
          padding: '0.75rem 1.5rem',
          background: 'var(--role-accent, #10b981)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="evidencias-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-info">
          <h1 className="page-title">Evidencias del Equipo</h1>
          <p className="page-description">Archivos y documentos adjuntos a los reportes</p>
        </div>
        <div className="header-stats">
          <div className="stat-pill">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Archivos</span>
          </div>
          <div className="stat-pill">
            <span className="stat-value">{stats.pendientes}</span>
            <span className="stat-label">Pendientes Revisión</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input 
            type="text" 
            placeholder="Buscar evidencia por nombre o reporte..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filters">
          <select 
            className="filter-select"
            value={filtroTipo}
            onChange={(e) => { setFiltroTipo(e.target.value); setPage(0); }}
          >
            <option value="">Tipo de archivo</option>
            <option value="pdf">PDF</option>
            <option value="excel">Excel</option>
            <option value="word">Word</option>
            <option value="image">Imagen</option>
          </select>
          <select 
            className="filter-select"
            value={filtroResponsable}
            onChange={(e) => { setFiltroResponsable(e.target.value); setPage(0); }}
          >
            <option value="">Todos los Responsables</option>
            {responsables.map(r => (
              <option key={r.id} value={r.id}>{r.nombre}</option>
            ))}
          </select>
          <select 
            className="filter-select"
            value={filtroEstado}
            onChange={(e) => { setFiltroEstado(e.target.value); setPage(0); }}
          >
            <option value="">Todos los Estados</option>
            <option value="pendiente_validacion">Pendiente Revisión</option>
            <option value="aprobado">Aprobado</option>
            <option value="enviado">Enviado</option>
          </select>
          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Vista de cuadrícula"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
              </svg>
            </button>
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Vista de lista"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6"/>
                <line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/>
                <line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
          <p style={{ marginTop: '1rem', color: 'var(--neutral-600)' }}>Cargando evidencias...</p>
        </div>
      )}

      {/* Grid/List View */}
      {!loading && (
        <>
          {evidenciasFiltradas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--neutral-500)' }}>
              <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 1rem', display: 'block' }}>
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
              <p>No se encontraron evidencias</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="files-grid">
              {evidenciasFiltradas.map((evidencia) => {
                const { icon, clase } = getFileIcon(evidencia.tipoArchivo);
                return (
                  <div key={evidencia.id} className={`file-card ${clase}`}>
                    <div className="file-icon">{icon}</div>
                    <div className="file-info">
                      <h3 className="file-name" title={evidencia.nombreArchivo}>
                        {evidencia.nombreArchivo}
                      </h3>
                      <p className="file-meta">{formatearTamano(evidencia.tamanioBytes)}</p>
                      <p className="file-reporte">{evidencia.reporte?.nombre}</p>
                      <p className="file-responsable">
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                        {evidencia.responsableCarga?.nombreCompleto || 'Sin asignar'}
                      </p>
                    </div>
                    <div className="file-actions">
                      {esVisualizable(evidencia.tipoArchivo) && (
                        <button 
                          className="btn-icon btn-icon-view"
                          onClick={() => handleVisualizarArchivo(evidencia)}
                          title="Ver archivo"
                        >
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>
                      )}
                      <button 
                        className="btn-icon btn-icon-download"
                        onClick={() => handleDescargar(evidencia.id)}
                        title="Descargar"
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7,10 12,15 17,10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="files-list">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Archivo</th>
                    <th>Reporte</th>
                    <th>Responsable</th>
                    <th>Tamaño</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {evidenciasFiltradas.map((evidencia) => {
                    const { icon, clase } = getFileIcon(evidencia.tipoArchivo);
                    return (
                      <tr key={evidencia.id}>
                        <td>
                          <div className="file-cell">
                            <div className={`file-icon-mini ${clase}`}>{icon}</div>
                            <span title={evidencia.nombreArchivo}>{evidencia.nombreArchivo}</span>
                          </div>
                        </td>
                        <td>{evidencia.reporte?.nombre}</td>
                        <td>{evidencia.responsableCarga?.nombreCompleto || 'Sin asignar'}</td>
                        <td>{formatearTamano(evidencia.tamanioBytes)}</td>
                        <td>{formatearFecha(evidencia.fechaCarga)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            {esVisualizable(evidencia.tipoArchivo) && (
                              <button 
                                className="btn-icon btn-icon-view"
                                onClick={() => handleVisualizarArchivo(evidencia)}
                                title="Ver archivo"
                              >
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                  <circle cx="12" cy="12" r="3"/>
                                </svg>
                              </button>
                            )}
                            <button 
                              className="btn-icon btn-icon-download"
                              onClick={() => handleDescargar(evidencia.id)}
                              title="Descargar"
                            >
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7,10 12,15 17,10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginación */}
          {totalElements > size && (
            <div className="pagination">
              <button 
                className="btn-secondary"
                disabled={page === 0}
                onClick={() => setPage(p => Math.max(0, p - 1))}
              >
                Anterior
              </button>
              <span style={{ padding: '0.5rem 1rem', color: 'var(--neutral-600)' }}>
                Página {page + 1} de {Math.ceil(totalElements / size)}
              </span>
              <button 
                className="btn-secondary"
                disabled={(page + 1) * size >= totalElements}
                onClick={() => setPage(p => p + 1)}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal de visualización */}
      {archivoSeleccionado && (
        <FileViewer
          archivo={archivoSeleccionado}
          periodoId="" 
          onClose={() => setArchivoSeleccionado(null)}
        />
      )}

      <style>{`
        .evidencias-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .page-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--neutral-900);
          margin: 0;
        }

        .page-description {
          font-size: 0.875rem;
          color: var(--neutral-500);
          margin: 0.25rem 0 0;
        }

        .header-stats {
          display: flex;
          gap: 1rem;
        }

        .stat-pill {
          display: flex;
          flex-direction: column;
          padding: 0.75rem 1.25rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--neutral-900);
        }

        .stat-label {
          font-size: 0.75rem;
          color: var(--neutral-500);
        }

        .filters-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.25rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          flex-wrap: wrap;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          background: var(--neutral-100);
          border-radius: 8px;
          flex: 1;
          max-width: 400px;
        }

        .search-box svg {
          color: var(--neutral-400);
          flex-shrink: 0;
        }

        .search-input {
          border: none;
          background: transparent;
          outline: none;
          font-size: 0.875rem;
          width: 100%;
        }

        .filters {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .filter-select {
          padding: 0.625rem 1rem;
          border: 1px solid var(--neutral-200);
          border-radius: 8px;
          font-size: 0.875rem;
          background: white;
          cursor: pointer;
        }

        .view-toggle {
          display: flex;
          border: 1px solid var(--neutral-200);
          border-radius: 8px;
          overflow: hidden;
        }

        .view-btn {
          padding: 0.5rem 0.75rem;
          background: white;
          border: none;
          cursor: pointer;
          color: var(--neutral-400);
          transition: all 0.2s;
        }

        .view-btn:hover {
          background: var(--neutral-100);
        }

        .view-btn.active {
          background: var(--role-accent, #10b981);
          color: white;
        }

        .files-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1rem;
        }

        .file-card {
          background: white;
          border-radius: 12px;
          padding: 1.25rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .file-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .file-icon {
          margin-bottom: 1rem;
        }

        .file-info {
          flex: 1;
          width: 100%;
        }

        .file-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--neutral-800);
          margin: 0 0 0.25rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .file-meta {
          font-size: 0.75rem;
          color: var(--neutral-500);
          margin: 0 0 0.5rem;
        }

        .file-reporte {
          font-size: 0.75rem;
          color: var(--neutral-600);
          margin: 0 0 0.25rem;
        }

        .file-responsable {
          font-size: 0.75rem;
          color: var(--neutral-500);
          margin: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
        }

        .file-actions {
          margin-top: 1rem;
          display: flex;
          gap: 0.5rem;
          justify-content: center;
        }

        .btn-icon {
          padding: 0.5rem;
          background: transparent;
          border: 1px solid var(--neutral-200);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .btn-icon-view {
          color: #3b82f6;
          border-color: #3b82f6;
        }

        .btn-icon-view:hover {
          background: #eff6ff;
          border-color: #2563eb;
          color: #2563eb;
        }

        .btn-icon-download {
          color: #16a34a;
          border-color: #16a34a;
        }

        .btn-icon-download:hover {
          background: #f0fdf4;
          border-color: #15803d;
          color: #15803d;
        }

        .files-list {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th,
        .data-table td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid var(--neutral-100);
        }

        .data-table th {
          background: var(--neutral-50);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--neutral-500);
          text-transform: uppercase;
        }

        .data-table td {
          font-size: 0.875rem;
          color: var(--neutral-700);
        }

        .file-cell {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .file-icon-mini {
          flex-shrink: 0;
        }

        .file-icon-mini svg {
          width: 24px;
          height: 24px;
        }

        .pagination {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 2rem;
          padding-bottom: 2rem;
        }

        .btn-secondary {
          padding: 0.5rem 1rem;
          background: var(--neutral-100);
          border: none;
          border-radius: 8px;
          font-size: 0.875rem;
          color: var(--neutral-600);
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary:hover:not(:disabled) {
          background: var(--neutral-200);
        }

        .btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--neutral-200);
          border-top-color: var(--role-accent, #10b981);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .filters-bar {
            flex-direction: column;
            align-items: stretch;
          }

          .search-box {
            max-width: 100%;
          }

          .filters {
            justify-content: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
