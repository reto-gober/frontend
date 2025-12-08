import { useState, useEffect } from 'react';
import { entidadesService, reportesService, type EntidadResponse, type ReporteResponse } from '../../lib/services';
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
        <button className="btn-primary" onClick={handleNuevaEntidad}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 22V8l9-5 9 5v14"/>
            <line x1="12" y1="8" x2="12" y2="14"/>
            <line x1="9" y1="11" x2="15" y2="11"/>
          </svg>
          Nueva Entidad
        </button>
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
    </div>
  );
}
