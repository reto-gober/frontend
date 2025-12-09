import { useState, useEffect } from 'react';
import {
  entidadesService,
  reportesService,
  type EntidadResponse,
  type ReporteResponse,
  type EntidadImportPreview,
  type EntidadImportError,
  type EntidadImportResponseDto,
  type EntidadImportLogResponse,
  type Page,
} from '../../lib/services';
import notifications from '../../lib/notifications';

interface EntidadWithStats extends EntidadResponse {
  cantidadReportes: number;
  cantidadResponsables: number;
  cumplimiento: number;
}

export default function AdminEntidadesClient() {
  const [entidades, setEntidades] = useState<EntidadWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Import modal state
  const [showImport, setShowImport] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<EntidadImportPreview[]>([]);
  const [importErrors, setImportErrors] = useState<EntidadImportError[]>([]);
  const [importStats, setImportStats] = useState<EntidadImportResponseDto | null>(null);
  const [importHistory, setImportHistory] = useState<EntidadImportLogResponse[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedEntidad, setSelectedEntidad] = useState<EntidadResponse | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nit: '',
    nombre: '',
    paginaWeb: '',
    baseLegal: '',
    observaciones: '',
    estado: 'ACTIVA' as 'ACTIVA' | 'INACTIVA'
  });

  useEffect(() => {
    cargarEntidades();
    cargarHistorialImport();
  }, []);

  const cargarEntidades = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [entidadesData, reportesData] = await Promise.all([
        entidadesService.listar(0, 100),
        reportesService.listar(0, 1000)
      ]);

      // Calcular estadísticas por entidad
      const entidadesConStats: EntidadWithStats[] = entidadesData.content.map(entidad => {
        const reportesEntidad = reportesData.content.filter(r => r.entidadId === entidad.entidadId);
        const responsablesUnicos = new Set(reportesEntidad.flatMap(r => r.responsableElaboracionIds || []));
        
        // Calcular cumplimiento (reportes completados vs total)
        const completados = reportesEntidad.filter(r => r.estado === 'COMPLETADO').length;
        const cumplimiento = reportesEntidad.length > 0 
          ? Math.round((completados / reportesEntidad.length) * 100)
          : 0;

        return {
          ...entidad,
          cantidadReportes: reportesEntidad.length,
          cantidadResponsables: responsablesUnicos.size,
          cumplimiento
        };
      });

      setEntidades(entidadesConStats);
    } catch (err) {
      console.error('Error al cargar entidades:', err);
      setError('Error al cargar las entidades');
    } finally {
      setLoading(false);
    }
  };

  const handleNuevaEntidad = () => {
    setModalMode('create');
    setFormData({
      nit: '',
      nombre: '',
      paginaWeb: '',
      baseLegal: '',
      observaciones: '',
      estado: 'ACTIVA'
    });
    setShowModal(true);
  };

  const handleEditEntidad = (entidad: EntidadResponse) => {
    setModalMode('edit');
    setSelectedEntidad(entidad);
    setFormData({
      nit: entidad.nit || '',
      nombre: entidad.nombre,
      paginaWeb: entidad.paginaWeb || '',
      baseLegal: entidad.baseLegal || '',
      observaciones: entidad.observaciones || '',
      estado: (entidad.estado as 'ACTIVA' | 'INACTIVA') || 'ACTIVA'
    });
    setShowModal(true);
  };

  const handleViewEntidad = (entidad: EntidadResponse) => {
    setModalMode('view');
    setSelectedEntidad(entidad);
    setShowModal(true);
  };

  const handleSaveEntidad = async () => {
    try {
      setSaving(true);

      if (modalMode === 'create') {
        await entidadesService.crear(formData);
      } else if (modalMode === 'edit' && selectedEntidad) {
        await entidadesService.actualizar(selectedEntidad.entidadId, formData);
      }

      await cargarEntidades();
      setShowModal(false);
      setSelectedEntidad(null);
      notifications.success(
        modalMode === 'create' ? 'Entidad creada correctamente' : 'Entidad actualizada correctamente'
      );
    } catch (err) {
      console.error('Error al guardar entidad:', err);
      notifications.error('Error al guardar la entidad');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntidad = async (entidadId: string) => {
    const confirmed = await notifications.confirm(
      'Esta acción no se puede deshacer',
      '¿Eliminar entidad?',
      'Sí, eliminar',
      'Cancelar'
    );
    if (!confirmed) return;

    try {
      await entidadesService.eliminar(entidadId);
      await cargarEntidades();
      notifications.success('Entidad eliminada correctamente');
    } catch (err) {
      console.error('Error al eliminar entidad:', err);
      notifications.error('Error al eliminar la entidad');
    }
  };

  const getLogoColor = (index: number) => {
    const colors = ['blue', 'orange', 'green', 'purple', 'red'];
    return colors[index % colors.length];
  };

  const getSigla = (nombre: string) => {
    return nombre.split(' ').map(word => word.charAt(0)).join('').toUpperCase().substring(0, 4);
  };

  const cargarHistorialImport = async () => {
    try {
      setHistoryLoading(true);
      const data: Page<EntidadImportLogResponse> = await entidadesService.historialImportaciones(0, 5);
      setImportHistory(data.content || []);
    } catch (err) {
      console.error('Error cargando historial de importaciones', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const resetImportState = () => {
    setSelectedFile(null);
    setImportPreview([]);
    setImportErrors([]);
    setImportStats(null);
  };

  const onFileSelected = async (file: File) => {
    setSelectedFile(file);
    setImportLoading(true);
    setImportPreview([]);
    setImportErrors([]);
    setImportStats(null);

    try {
      const result = await entidadesService.importarArchivo(file, false);
      setImportPreview(result.preview || []);
      setImportErrors(result.errores || []);
      setImportStats(result);

      if (!result.valid) {
        notifications.error('El archivo tiene observaciones. Corrige los errores para continuar.');
      }
    } catch (err: any) {
      notifications.error(
        err.response?.data?.message ||
        err.response?.data?.mensaje ||
        'No se pudo analizar el archivo'
      );
    } finally {
      setImportLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!selectedFile || !importStats?.valid) {
      notifications.error('Carga un archivo válido antes de confirmar');
      return;
    }

    setImportLoading(true);
    try {
      const result = await entidadesService.importarArchivo(selectedFile, true);
      if (result.valid) {
        notifications.success(`Importación completada: ${result.registrosValidos} entidades creadas.`);
        setShowImport(false);
        resetImportState();
        await cargarEntidades();
        await cargarHistorialImport();
      } else {
        setImportErrors(result.errores || []);
        setImportStats(result);
        notifications.error('La importación se detuvo por errores en el archivo.');
      }
    } catch (err: any) {
      notifications.error(
        err.response?.data?.message ||
        err.response?.data?.mensaje ||
        'No se pudo completar la importación'
      );
    } finally {
      setImportLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await entidadesService.descargarPlantilla();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'plantilla-entidades.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      notifications.error('No se pudo descargar la plantilla');
    }
  };

  if (loading) {
    return (
      <div className="entidades-page">
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
          <p style={{ marginTop: '1rem', color: 'var(--neutral-600)' }}>Cargando entidades...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="entidades-page">
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <p style={{ color: 'var(--error-red-600)' }}>{error}</p>
          <button onClick={cargarEntidades} className="btn-primary" style={{ marginTop: '1rem' }}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="entidades-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-info">
          <h1 className="page-title">Gestión de Entidades</h1>
          <p className="page-description">Administra las entidades regulatorias del sistema</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => setShowImport(true)}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>
              <polyline points="7 9 12 4 17 9"/>
              <line x1="12" y1="4" x2="12" y2="16"/>
            </svg>
            Importar entidades
          </button>
          <button className="btn-primary" onClick={handleNuevaEntidad}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 22V8l9-5 9 5v14"/>
              <line x1="12" y1="8" x2="12" y2="14"/>
              <line x1="9" y1="11" x2="15" y2="11"/>
            </svg>
            Nueva Entidad
          </button>
        </div>
      </div>

      {/* Grid de entidades */}
      <div className="entidades-grid">
        {entidades.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--neutral-500)' }}>
            No hay entidades registradas
          </div>
        ) : (
          entidades.map((entidad, index) => (
            <div key={entidad.entidadId} className="entidad-card">
              <div className="entidad-header">
                <div className={`entidad-logo ${getLogoColor(index)}`}>
                  <span>{getSigla(entidad.nombre)}</span>
                </div>
                <div className="entidad-actions">
                  <button className="btn-icon" title="Ver detalles" onClick={() => handleViewEntidad(entidad)}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                  <button className="btn-icon" title="Editar" onClick={() => handleEditEntidad(entidad)}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button className="btn-icon danger" title="Eliminar" onClick={() => handleDeleteEntidad(entidad.entidadId)}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="entidad-info">
                <h3 className="entidad-nombre">{entidad.nombre}</h3>
                <span className="entidad-sigla">{getSigla(entidad.nombre)}</span>
              </div>
              <div className="entidad-stats">
                <div className="stat-item">
                  <span className="stat-value">{entidad.cantidadReportes}</span>
                  <span className="stat-label">Reportes</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{entidad.cantidadResponsables}</span>
                  <span className="stat-label">Responsables</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{entidad.cumplimiento}%</span>
                  <span className="stat-label">Cumplimiento</span>
                </div>
              </div>
              <div className="entidad-footer">
                <span className={`status-${entidad.estado === 'ACTIVA' ? 'active' : 'inactive'}`}>
                  {entidad.estado}
                </span>
                <a href={`/roles/admin/reportes?entidad=${entidad.entidadId}`} className="link-reportes">
                  Ver reportes →
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Historial importaciones oculto por solicitud */}
      {false && (
        <div className="card import-card">
          <div className="card-header-flex">
            <div>
              <h3 className="card-title">Historial de cargas masivas</h3>
              <p className="card-subtitle">Últimas 5 importaciones</p>
            </div>
            <button className="btn-secondary" onClick={cargarHistorialImport} disabled={historyLoading}>
              Refrescar
            </button>
          </div>
          {importHistory.length === 0 ? (
            <p className="muted">Aún no hay importaciones registradas.</p>
          ) : (
            <div className="import-history-table-wrapper">
              <table className="import-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Usuario</th>
                    <th>Archivo</th>
                    <th>Válidos</th>
                    <th>Inválidos</th>
                  </tr>
                </thead>
                <tbody>
                  {importHistory.map((log) => (
                    <tr key={log.id}>
                      <td>{new Date(log.fecha).toLocaleString()}</td>
                      <td>{log.usuarioNombre || '-'}</td>
                      <td>{log.archivoNombre || '-'}</td>
                      <td className="text-success">{log.registrosValidos}</td>
                      <td className="text-danger">{log.registrosInvalidos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {modalMode === 'create' && 'Nueva Entidad'}
                {modalMode === 'edit' && 'Editar Entidad'}
                {modalMode === 'view' && 'Detalles de Entidad'}
              </h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              {modalMode === 'view' && selectedEntidad ? (
                <div className="entidad-details">
                  <div className="detail-row">
                    <label>NIT:</label>
                    <span>{selectedEntidad.nit || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <label>Nombre:</label>
                    <span>{selectedEntidad.nombre}</span>
                  </div>
                  <div className="detail-row">
                    <label>Página Web:</label>
                    <span>{selectedEntidad.paginaWeb ? (
                      <a href={selectedEntidad.paginaWeb} target="_blank" rel="noopener noreferrer">{selectedEntidad.paginaWeb}</a>
                    ) : 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <label>Base Legal:</label>
                    <span>{selectedEntidad.baseLegal || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <label>Observaciones:</label>
                    <span>{selectedEntidad.observaciones || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <label>Estado:</label>
                    <span className={`status-badge ${selectedEntidad.estado === 'ACTIVA' ? 'active' : 'inactive'}`}>
                      {selectedEntidad.estado}
                    </span>
                  </div>
                </div>
              ) : (
                <form className="entidad-form" onSubmit={(e) => { e.preventDefault(); handleSaveEntidad(); }}>
                  <div className="form-group">
                    <label>NIT *</label>
                    <input
                      type="text"
                      value={formData.nit}
                      onChange={(e) => setFormData({...formData, nit: e.target.value})}
                      required
                      disabled={modalMode === 'view'}
                      placeholder="900123456-7"
                    />
                  </div>

                  <div className="form-group">
                    <label>Nombre *</label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      required
                      disabled={modalMode === 'view'}
                      placeholder="Superintendencia de Servicios Públicos"
                    />
                  </div>

                  <div className="form-group">
                    <label>Página Web</label>
                    <input
                      type="url"
                      value={formData.paginaWeb}
                      onChange={(e) => setFormData({...formData, paginaWeb: e.target.value})}
                      disabled={modalMode === 'view'}
                      placeholder="https://www.ejemplo.gov.co"
                    />
                  </div>

                  <div className="form-group">
                    <label>Base Legal</label>
                    <input
                      type="text"
                      value={formData.baseLegal}
                      onChange={(e) => setFormData({...formData, baseLegal: e.target.value})}
                      disabled={modalMode === 'view'}
                      placeholder="Ley 142 de 1994"
                    />
                  </div>

                  <div className="form-group">
                    <label>Observaciones</label>
                    <textarea
                      value={formData.observaciones}
                      onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                      rows={3}
                      disabled={modalMode === 'view'}
                      placeholder="Observaciones adicionales sobre la entidad"
                    />
                  </div>

                  <div className="form-group">
                    <label>Estado *</label>
                    <select
                      value={formData.estado}
                      onChange={(e) => setFormData({...formData, estado: e.target.value as 'ACTIVA' | 'INACTIVA'})}
                      required
                      disabled={modalMode === 'view'}
                    >
                      <option value="ACTIVA">Activa</option>
                      <option value="INACTIVA">Inactiva</option>
                    </select>
                  </div>

                  {modalMode !== 'view' && (
                    <div className="modal-footer">
                      <button 
                        type="button" 
                        className="btn-secondary" 
                        onClick={() => setShowModal(false)} 
                        disabled={saving}
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit" 
                        className="btn-primary" 
                        disabled={saving}
                      >
                        {saving ? 'Guardando...' : (modalMode === 'create' ? 'Crear Entidad' : 'Guardar Cambios')}
                      </button>
                    </div>
                  )}
                </form>
              )}

              {modalMode === 'view' && (
                <div className="modal-footer">
                  <button className="btn-secondary" onClick={() => setShowModal(false)}>
                    Cerrar
                  </button>
                  <button className="btn-primary" onClick={() => selectedEntidad && handleEditEntidad(selectedEntidad)}>
                    Editar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de importación */}
      {showImport && (
        <div className="modal-overlay" onClick={() => { setShowImport(false); resetImportState(); }}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Importar entidades</h2>
              <button className="modal-close" onClick={() => { setShowImport(false); resetImportState(); }} aria-label="Cerrar">
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="import-dropzone" onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) onFileSelected(file);
              }}>
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>
                  <polyline points="7 9 12 4 17 9"/>
                  <line x1="12" y1="4" x2="12" y2="16"/>
                </svg>
                <p className="import-title">Arrastra o selecciona un archivo</p>
                <p className="import-subtitle">Formatos permitidos: .xlsx, .csv</p>
                <label className="btn-secondary" style={{ marginTop: '0.5rem', cursor: 'pointer' }}>
                  Seleccionar archivo
                  <input type="file" accept=".xlsx,.csv" hidden onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onFileSelected(file);
                  }} />
                </label>
                {selectedFile && (
                  <p className="import-file">Archivo: <strong>{selectedFile.name}</strong></p>
                )}
              </div>

              {importStats && (
                <div className="import-stats" aria-label="Resumen de validación">
                  <div>
                    <span className="label">Filas detectadas</span>
                    <strong>{importStats.totalRegistros}</strong>
                  </div>
                  <div>
                    <span className="label">Registros válidos</span>
                    <strong className="text-success">{importStats.registrosValidos}</strong>
                  </div>
                  <div>
                    <span className="label">Registros inválidos</span>
                    <strong className="text-danger">{importStats.registrosInvalidos}</strong>
                  </div>
                  <div>
                    <span className="label">Filas ignoradas</span>
                    <strong>{importStats.filasIgnoradas}</strong>
                  </div>
                </div>
              )}

              {importPreview.length > 0 && (
                <div className="import-preview">
                  <div className="preview-header">
                    <h4>Vista previa (primeros 10 registros)</h4>
                    <span className="badge-neutral">{importPreview.length} filas</span>
                  </div>
                  <div className="import-table-wrapper">
                    <table className="import-table">
                      <thead>
                        <tr>
                          <th>NIT</th>
                          <th>Nombre</th>
                          <th>Página</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.map((row, idx) => (
                          <tr key={`${row.nit}-${idx}`}>
                            <td>{row.nit}</td>
                            <td>{row.nombre}</td>
                            <td>{row.paginaWeb || '-'}</td>
                            <td>{row.estado}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {importErrors.length > 0 && (
                <div className="import-errors">
                  <h4>Errores encontrados</h4>
                  <ul>
                    {importErrors.map((err) => (
                      <li key={`${err.fila}-${err.mensaje}`}>
                        <span className="badge badge-pendiente">Fila {err.fila}</span>
                        <span>{err.mensaje}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button className="btn-secondary" onClick={handleDownloadTemplate}>Descargar plantilla</button>
                <button className="btn-secondary" onClick={() => {
                  setSelectedFile(null);
                  setImportPreview([]);
                  setImportErrors([]);
                  setImportStats(null);
                }}>Reiniciar</button>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-secondary" onClick={() => { setShowImport(false); resetImportState(); }} disabled={importLoading}>Cerrar</button>
                <button
                  className="btn-primary"
                  disabled={importLoading || !selectedFile || !!importErrors.length || !importStats?.valid}
                  onClick={handleConfirmImport}
                >
                  {importLoading ? 'Procesando...' : 'Importar ahora'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
