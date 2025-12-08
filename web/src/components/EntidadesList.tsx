import { useState, useEffect } from "react";
import {
  entidadesService,
  type EntidadResponse,
  type EntidadRequest,
  type Page,
} from "../lib/services";
import { Building2, Edit, Trash2, Plus } from "lucide-react";
import { useToast, ToastContainer } from "./Toast";
import notifications from '../lib/notifications';

export default function EntidadesList() {
  const [entidades, setEntidades] = useState<EntidadResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toasts, removeToast, success, error: showError } = useToast();
  const [formData, setFormData] = useState<EntidadRequest>({
    nit: "",
    nombre: "",
    paginaWeb: "",
    baseLegal: "",
    observaciones: "",
    estado: "ACTIVO",
  });

  useEffect(() => {
    loadEntidades();
  }, []);

  const loadEntidades = async () => {
    setLoading(true);
    try {
      const data: Page<EntidadResponse> = await entidadesService.listar();
      setEntidades(data.content || []);
    } catch (err) {
      console.error('Error loading entidades:', err);
      setEntidades([]);
      showError('Error al cargar las entidades');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await entidadesService.actualizar(editingId, formData);
        success("Entidad actualizada exitosamente");
      } else {
        await entidadesService.crear(formData);
        success("Entidad creada exitosamente");
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        nit: "",
        nombre: "",
        paginaWeb: "",
        baseLegal: "",
        observaciones: "",
        estado: "ACTIVO",
      });
      loadEntidades();
    } catch (err: any) {
      showError(err.response?.data?.mensaje || 'Error al guardar la entidad');
    }
  };

  const handleEdit = (entidad: EntidadResponse) => {
    setFormData({
      nit: entidad.nit,
      nombre: entidad.nombre,
      paginaWeb: entidad.paginaWeb,
      baseLegal: entidad.baseLegal,
      observaciones: entidad.observaciones,
      estado: entidad.estado,
    });
    setEditingId(entidad.entidadId);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await notifications.confirm(
      'Esta acción no se puede deshacer',
      '¿Eliminar entidad?',
      'Sí, eliminar',
      'Cancelar'
    );
    if (!confirmed) return;

    try {
      await entidadesService.eliminar(id);
      success("Entidad eliminada exitosamente");
      loadEntidades();
    } catch (err: any) {
      showError(err.response?.data?.mensaje || 'Error al eliminar la entidad');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      nit: "",
      nombre: "",
      paginaWeb: "",
      baseLegal: "",
      observaciones: "",
      estado: "ACTIVO",
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        Cargando entidades...
      </div>
    );
  }

  return (
    <div className="entidades-container">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className="entidades-header">
        <div>
          <h2 className="entidades-title">Entidades de Control</h2>
          <p className="entidades-subtitle">
            Gestiona las entidades regulatorias
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-orange"
          disabled={showForm}
        >
          <Plus size={16} />
          Nueva Entidad
        </button>
      </div>

      {showForm && (
        <div className="card mb-2">
          <h3 className="form-subtitle">
            {editingId ? "Editar Entidad" : "Nueva Entidad"}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">NIT *</label>
              <input
                type="text"
                className="form-input"
                value={formData.nit}
                onChange={(e) =>
                  setFormData({ ...formData, nit: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input
                type="text"
                className="form-input"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Página Web *</label>
              <input
                type="url"
                className="form-input"
                value={formData.paginaWeb}
                onChange={(e) =>
                  setFormData({ ...formData, paginaWeb: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Base Legal *</label>
              <textarea
                className="form-textarea"
                value={formData.baseLegal}
                onChange={(e) =>
                  setFormData({ ...formData, baseLegal: e.target.value })
                }
                rows={3}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Observaciones *</label>
              <textarea
                className="form-textarea"
                value={formData.observaciones}
                onChange={(e) =>
                  setFormData({ ...formData, observaciones: e.target.value })
                }
                rows={3}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Estado *</label>
              <select
                className="form-input"
                value={formData.estado}
                onChange={(e) =>
                  setFormData({ ...formData, estado: e.target.value })
                }
                required
              >
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
              </select>
            </div>

            <div className="form-actions-inline">
              <button type="submit" className="btn btn-orange">
                {editingId ? 'Actualizar' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {entidades.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <p style={{ color: "var(--color-text-light)" }}>
            No hay entidades registradas.
          </p>
        </div>
      ) : (
        <div className="entidades-grid">
          {entidades.map((entidad) => (
            <div key={entidad.entidadId} className="entidad-card">
              <div className="entidad-card-header">
                <div className="entidad-icon">
                  <Building2 size={24} />
                </div>
                <div className="entidad-info">
                  <h3 className="entidad-name">{entidad.nombre}</h3>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--color-text-light)",
                      marginTop: "0.25rem",
                    }}
                  >
                    NIT: {entidad.nit}
                  </p>
                </div>
                <div>
                  {entidad.estado === "ACTIVO" ? (
                    <span className="badge badge-enviado">Activo</span>
                  ) : (
                    <span className="badge badge-pendiente">Inactivo</span>
                  )}
                </div>
              </div>

              <div
                style={{
                  marginTop: "1rem",
                  fontSize: "0.875rem",
                  color: "var(--color-text)",
                }}
              >
                {entidad.paginaWeb && (
                  <p style={{ marginBottom: "0.5rem" }}>
                    <strong>Web:</strong>{" "}
                    <a
                      href={entidad.paginaWeb}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--color-primary)" }}
                    >
                      {entidad.paginaWeb}
                    </a>
                  </p>
                )}
                {entidad.baseLegal && (
                  <p style={{ marginBottom: "0.5rem" }}>
                    <strong>Base Legal:</strong> {entidad.baseLegal}
                  </p>
                )}
                {entidad.observaciones && (
                  <p style={{ marginBottom: "0.5rem" }}>
                    <strong>Observaciones:</strong> {entidad.observaciones}
                  </p>
                )}
              </div>

              <div className="entidad-actions">
                <button
                  onClick={() => handleEdit(entidad)}
                  className="btn btn-sm btn-secondary"
                >
                  <Edit size={14} />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(entidad.entidadId)}
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
