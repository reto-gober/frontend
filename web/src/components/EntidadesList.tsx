import { useState, useEffect } from 'react';
import { entidadesService, type EntidadResponse, type EntidadRequest, type Page } from '../lib/services';
import { Building2, Edit, Trash2, Plus } from 'lucide-react';

export default function EntidadesList() {
  const [entidades, setEntidades] = useState<EntidadResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<EntidadRequest>({
    nombre: '',
    codigo: '',
    descripcion: '',
    activo: true,
  });

  useEffect(() => {
    loadEntidades();
  }, []);

  const loadEntidades = async () => {
    setLoading(true);
    try {
      const data: Page<EntidadResponse> = await entidadesService.listar();
      setEntidades(data.content);
    } catch (error) {
      console.error('Error loading entidades:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await entidadesService.actualizar(editingId, formData);
      } else {
        await entidadesService.crear(formData);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ nombre: '', codigo: '', descripcion: '', activo: true });
      loadEntidades();
    } catch (error: any) {
      alert(error.response?.data?.mensaje || 'Error al guardar la entidad');
    }
  };

  const handleEdit = (entidad: EntidadResponse) => {
    setFormData({
      nombre: entidad.nombre,
      codigo: entidad.codigo,
      descripcion: entidad.descripcion || '',
      activo: entidad.activo,
    });
    setEditingId(entidad.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta entidad?')) return;
    
    try {
      await entidadesService.eliminar(id);
      loadEntidades();
    } catch (error: any) {
      alert(error.response?.data?.mensaje || 'Error al eliminar la entidad');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ nombre: '', codigo: '', descripcion: '', activo: true });
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando entidades...</div>;
  }

  return (
    <div className="entidades-container">
      <div className="entidades-header">
        <div>
          <h2 className="entidades-title">Entidades de Control</h2>
          <p className="entidades-subtitle">Gestiona las entidades regulatorias</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
          disabled={showForm}
        >
          <Plus size={16} />
          Nueva Entidad
        </button>
      </div>

      {showForm && (
        <div className="card mb-2">
          <h3 className="form-subtitle">{editingId ? 'Editar Entidad' : 'Nueva Entidad'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Nombre *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Código *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Descripción</label>
              <textarea
                className="form-textarea"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                rows={3}
              />
            </div>

            <div className="form-group">
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                />
                <span>Activo</span>
              </label>
            </div>

            <div className="form-actions-inline">
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Actualizar' : 'Crear'}
              </button>
              <button type="button" onClick={handleCancel} className="btn btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {entidades.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--color-text-light)' }}>
            No hay entidades registradas.
          </p>
        </div>
      ) : (
        <div className="entidades-grid">
          {entidades.map((entidad) => (
            <div key={entidad.id} className="entidad-card">
              <div className="entidad-card-header">
                <div className="entidad-icon">
                  <Building2 size={24} />
                </div>
                <div className="entidad-info">
                  <h3 className="entidad-name">{entidad.nombre}</h3>
                  <p className="entidad-code">{entidad.codigo}</p>
                </div>
                <div>
                  {entidad.activo ? (
                    <span className="badge badge-enviado">Activo</span>
                  ) : (
                    <span className="badge badge-pendiente">Inactivo</span>
                  )}
                </div>
              </div>

              {entidad.descripcion && (
                <p className="entidad-description">{entidad.descripcion}</p>
              )}

              <div className="entidad-actions">
                <button
                  onClick={() => handleEdit(entidad)}
                  className="btn btn-sm btn-secondary"
                >
                  <Edit size={14} />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(entidad.id)}
                  className="btn btn-sm btn-danger"
                >
                  <Trash2 size={14} />
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
