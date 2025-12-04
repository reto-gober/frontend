import { useState, useEffect } from 'react';
import { usuariosService, type UsuarioResponse, type UsuarioRequest, type Page } from '../lib/services';
import { Users, Edit, Trash2, Plus, Shield } from 'lucide-react';
import { useToast, ToastContainer } from './Toast';

export default function UsuariosList() {
  const [usuarios, setUsuarios] = useState<UsuarioResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDocNumber, setEditingDocNumber] = useState<string | null>(null);
  const { toasts, removeToast, success, error } = useToast();
  const [formData, setFormData] = useState<UsuarioRequest>({
    documentNumber: '',
    documentType: 'CC',
    email: '',
    firstName: '',
    secondName: '',
    firstLastname: '',
    secondLastname: '',
    password: '',
    birthDate: '',
    roles: ['RESPONSABLE'],
  });

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    setLoading(true);
    try {
      const data: Page<UsuarioResponse> = await usuariosService.listar();
      setUsuarios(data.content);
    } catch (error) {
      console.error('Error loading usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDocNumber) {
        // Al editar, solo enviar password si se cambió
        const updateData = formData.password 
          ? formData 
          : { ...formData, password: undefined };
        await usuariosService.actualizar(editingDocNumber, updateData);
        success('Usuario actualizado exitosamente');
      } else {
        await usuariosService.crear(formData);
        success('Usuario creado exitosamente');
      }
      setShowForm(false);
      setEditingDocNumber(null);
      resetForm();
      loadUsuarios();
    } catch (err: any) {
      error(err.response?.data?.mensaje || 'Error al guardar el usuario');
    }
  };

  const handleEdit = (usuario: UsuarioResponse) => {
    setFormData({
      documentNumber: usuario.documentNumber,
      documentType: usuario.documentType,
      email: usuario.email,
      firstName: usuario.firstName,
      secondName: usuario.secondName || '',
      firstLastname: usuario.firstLastname,
      secondLastname: usuario.secondLastname || '',
      password: '', // No mostrar password al editar
      birthDate: usuario.birthDate,
      roles: usuario.roles,
    });
    setEditingDocNumber(usuario.documentNumber);
    setShowForm(true);
  };

  const handleDelete = async (documentNumber: string) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    
    try {
      await usuariosService.eliminar(documentNumber);
      success('Usuario eliminado exitosamente');
      loadUsuarios();
    } catch (err: any) {
      error(err.response?.data?.mensaje || 'Error al eliminar el usuario');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingDocNumber(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      documentNumber: '',
      documentType: 'CC',
      email: '',
      firstName: '',
      secondName: '',
      firstLastname: '',
      secondLastname: '',
      password: '',
      birthDate: '',
      roles: ['RESPONSABLE'],
    });
  };

  const toggleRole = (role: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando usuarios...</div>;
  }

  return (
    <div className="usuarios-container">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className="entidades-header">
        <div>
          <h2 className="entidades-title">Gestión de Usuarios</h2>
          <p className="entidades-subtitle">Administra los usuarios del sistema</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
          disabled={showForm}
        >
          <Plus size={16} />
          Nuevo Usuario
        </button>
      </div>

      {showForm && (
        <div className="card mb-2">
          <h3 className="form-subtitle">{editingDocNumber ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Número de Documento *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.documentNumber}
                  onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                  required
                  disabled={!!editingDocNumber}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tipo de Documento *</label>
                <select
                  className="form-input"
                  value={formData.documentType}
                  onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                  required
                >
                  <option value="CC">Cédula de Ciudadanía</option>
                  <option value="CE">Cédula de Extranjería</option>
                  <option value="PA">Pasaporte</option>
                  <option value="NIT">NIT</option>
                </select>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Primer Nombre *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Segundo Nombre</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.secondName}
                  onChange={(e) => setFormData({ ...formData, secondName: e.target.value })}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Primer Apellido *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.firstLastname}
                  onChange={(e) => setFormData({ ...formData, firstLastname: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Segundo Apellido</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.secondLastname}
                  onChange={(e) => setFormData({ ...formData, secondLastname: e.target.value })}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Fecha de Nacimiento *</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Contraseña {editingDocNumber ? '(dejar en blanco para no cambiar)' : '*'}
              </label>
              <input
                type="password"
                className="form-input"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!editingDocNumber}
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Roles</label>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.roles.includes('RESPONSABLE')}
                    onChange={() => toggleRole('RESPONSABLE')}
                  />
                  <span>Responsable</span>
                </label>
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.roles.includes('SUPERVISOR')}
                    onChange={() => toggleRole('SUPERVISOR')}
                  />
                  <span>Supervisor</span>
                </label>
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.roles.includes('ADMINISTRADOR')}
                    onChange={() => toggleRole('ADMINISTRADOR')}
                  />
                  <span>Administrador</span>
                </label>
              </div>
            </div>

            <div className="form-actions-inline">
              <button type="submit" className="btn btn-primary">
                {editingDocNumber ? 'Actualizar' : 'Crear'}
              </button>
              <button type="button" onClick={handleCancel} className="btn btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {usuarios.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--color-text-light)' }}>
            No hay usuarios registrados.
          </p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Documento</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Roles</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => (
                  <tr key={usuario.documentNumber}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 500 }}>{usuario.documentNumber}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                          {usuario.documentType}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Users size={16} style={{ color: 'var(--color-primary-600)' }} />
                        <span>
                          {usuario.firstName} {usuario.secondName || ''} {usuario.firstLastname} {usuario.secondLastname || ''}
                        </span>
                      </div>
                    </td>
                    <td>{usuario.email}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {usuario.roles.map((role) => (
                          <span
                            key={role}
                            className={
                              role.includes('ADMINISTRADOR') 
                                ? 'badge badge-aprobado' 
                                : role.includes('SUPERVISOR')
                                ? 'badge badge-enviado'
                                : 'badge badge-info'
                            }
                            style={{ fontSize: '0.75rem' }}
                          >
                            {role.includes('ADMINISTRADOR') ? (
                              <><Shield size={10} /> Admin</>
                            ) : role.includes('SUPERVISOR') ? (
                              'Supervisor'
                            ) : (
                              'Responsable'
                            )}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleEdit(usuario)}
                          className="btn btn-sm btn-secondary"
                          title="Editar"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(usuario.documentNumber)}
                          className="btn btn-sm btn-danger"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
