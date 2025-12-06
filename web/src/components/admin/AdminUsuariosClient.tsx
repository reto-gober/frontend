import { useState, useEffect } from 'react';
import { usuariosService, auditoriaService, type UsuarioResponse, type UserSessionLogResponse } from '../../lib/services';
import { authService } from '../../lib/auth';
import notifications from '../../lib/notifications';

export default function AdminUsuariosClient() {
  const [usuarios, setUsuarios] = useState<UsuarioResponse[]>([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState<UsuarioResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  // Modal de edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<UsuarioResponse | null>(null);
  const [selectedRol, setSelectedRol] = useState('');
  const [saving, setSaving] = useState(false);

  // Últimos accesos
  const [ultimosAccesos, setUltimosAccesos] = useState<Map<string, UserSessionLogResponse>>(new Map());
  const [loadingAccesos, setLoadingAccesos] = useState(false);

  // Usuario actual
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const user = authService.getUser();
    if (user) {
      setCurrentUserId(user.usuarioId);
    }
    cargarUsuarios();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [searchTerm, filterRol, filterEstado, usuarios]);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await usuariosService.listar(0, 100);
      setUsuarios(response.content);
      setFilteredUsuarios(response.content);
      
      // Cargar últimos accesos de cada usuario
      await cargarUltimosAccesos(response.content);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      setError('Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const cargarUltimosAccesos = async (usuarios: UsuarioResponse[]) => {
    try {
      setLoadingAccesos(true);
      const accesosMap = new Map<string, UserSessionLogResponse>();
      
      // Cargar último acceso de cada usuario en paralelo
      const promises = usuarios.map(async (usuario) => {
        try {
          const ultimoAcceso = await auditoriaService.obtenerUltimoAccesoUsuario(usuario.usuarioId);
          if (ultimoAcceso) {
            accesosMap.set(usuario.usuarioId, ultimoAcceso);
          }
        } catch (err) {
          // Si no hay accesos o hay error, simplemente no agregamos nada al mapa
          console.debug(`No se pudo obtener último acceso para ${usuario.email}`);
        }
      });

      await Promise.all(promises);
      setUltimosAccesos(accesosMap);
    } catch (err) {
      console.error('Error al cargar últimos accesos:', err);
    } finally {
      setLoadingAccesos(false);
    }
  };

  const aplicarFiltros = () => {
    let filtered = [...usuarios];

    // Filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(u => 
        `${u.firstName} ${u.secondName || ''} ${u.firstLastname} ${u.secondLastname || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.documentNumber.includes(searchTerm)
      );
    }

    // Filtro por rol
    if (filterRol) {
      filtered = filtered.filter(u => u.roles?.includes(filterRol));
    }

    // Filtro por estado
    if (filterEstado) {
      filtered = filtered.filter(u => u.estado === filterEstado);
    }

    setFilteredUsuarios(filtered);
  };

  // Abrir modal de edición
  const handleEditUsuario = (usuario: UsuarioResponse) => {
    // Verificar si el usuario está intentando editarse a sí mismo
    if (usuario.usuarioId === currentUserId) {
      notifications.warning(
        'No puedes editar tu propio usuario',
        'Por seguridad, no está permitido modificar tu propia cuenta. Contacta a otro administrador si necesitas cambios.'
      );
      return;
    }
    
    setEditingUsuario(usuario);
    setSelectedRol(usuario.roles?.[0] || 'responsable');
    setShowEditModal(true);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditingUsuario(null);
    setSelectedRol('');
  };

  // Cambiar rol del usuario
  const handleCambiarRol = async () => {
    if (!editingUsuario || !selectedRol) return;

    // Validar que el rol haya cambiado
    if (editingUsuario.roles?.[0] === selectedRol) {
      notifications.info('El usuario ya tiene ese rol asignado');
      return;
    }

    const confirmed = await notifications.confirm(
      `Se cambiará el rol de ${editingUsuario.firstName} ${editingUsuario.firstLastname} a ${formatRolName(selectedRol)}`,
      '¿Cambiar rol de usuario?',
      'Sí, cambiar rol',
      'Cancelar'
    );

    if (!confirmed) return;

    try {
      setSaving(true);
      await usuariosService.cambiarRol(editingUsuario.documentNumber, selectedRol);
      await cargarUsuarios();
      handleCloseModal();
      notifications.success('Rol actualizado correctamente');
    } catch (err: any) {
      console.error('Error al cambiar rol:', err);
      notifications.error(err.response?.data?.message || 'Error al cambiar el rol del usuario');
    } finally {
      setSaving(false);
    }
  };

  // Cambiar estado del usuario (activar/desactivar)
  const handleToggleEstado = async () => {
    if (!editingUsuario) return;

    const esActivo = editingUsuario.estado === 'ACTIVO';
    const accion = esActivo ? 'desactivar' : 'activar';
    const accionTitle = esActivo ? 'Desactivar' : 'Activar';

    const confirmed = await notifications.confirm(
      `Se ${accion}á el usuario ${editingUsuario.firstName} ${editingUsuario.firstLastname}. ${esActivo ? 'No podrá acceder al sistema.' : 'Podrá acceder nuevamente al sistema.'}`,
      `¿${accionTitle} usuario?`,
      `Sí, ${accion}`,
      'Cancelar'
    );

    if (!confirmed) return;

    try {
      setSaving(true);
      if (esActivo) {
        await usuariosService.desactivar(editingUsuario.documentNumber);
      } else {
        await usuariosService.activar(editingUsuario.documentNumber);
      }
      await cargarUsuarios();
      handleCloseModal();
      notifications.success(`Usuario ${esActivo ? 'desactivado' : 'activado'} correctamente`);
    } catch (err: any) {
      console.error('Error al cambiar estado:', err);
      notifications.error(err.response?.data?.message || 'Error al cambiar el estado del usuario');
    } finally {
      setSaving(false);
    }
  };

  // Eliminar usuario
  const handleEliminarUsuario = async (usuario: UsuarioResponse) => {
    const confirmed = await notifications.confirm(
      `Esta acción eliminará permanentemente al usuario ${usuario.firstName} ${usuario.firstLastname} y no se puede deshacer.`,
      '¿Eliminar usuario?',
      'Sí, eliminar',
      'Cancelar'
    );

    if (!confirmed) return;

    try {
      await usuariosService.eliminar(usuario.documentNumber);
      await cargarUsuarios();
      notifications.success('Usuario eliminado correctamente');
    } catch (err: any) {
      console.error('Error al eliminar usuario:', err);
      notifications.error(err.response?.data?.message || 'Error al eliminar el usuario');
    }
  };

  const getInitials = (usuario: UsuarioResponse) => {
    const first = usuario.firstName?.charAt(0) || '';
    const last = usuario.firstLastname?.charAt(0) || '';
    return (first + last).toUpperCase();
  };

  const getAvatarColor = (index: number) => {
    const colors = ['blue', 'green', 'purple', 'orange', 'red'];
    return colors[index % colors.length];
  };

  const getRolBadgeClass = (rol: string) => {
    switch(rol) {
      case 'admin': return 'role-admin';
      case 'supervisor': return 'role-supervisor';
      case 'responsable': return 'role-responsable';
      case 'auditor': return 'role-auditor';
      default: return 'role-default';
    }
  };

  const formatRolName = (rol: string) => {
    switch(rol) {
      case 'admin': return 'Administrador';
      case 'supervisor': return 'Supervisor';
      case 'responsable': return 'Responsable';
      case 'auditor': return 'Auditor';
      default: return rol;
    }
  };

  const formatLastAccess = (usuarioId: string) => {
    const ultimoAcceso = ultimosAccesos.get(usuarioId);
    
    if (!ultimoAcceso) {
      return { texto: 'Nunca', detalles: null, clase: 'never' };
    }
    
    const now = new Date();
    const accessDate = new Date(ultimoAcceso.timestamp);
    const diffMs = now.getTime() - accessDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    let texto = '';
    let clase = '';

    if (diffMins < 1) {
      texto = 'Ahora';
      clase = 'recent';
    } else if (diffMins < 60) {
      texto = `Hace ${diffMins} min`;
      clase = 'recent';
    } else if (diffHours < 24) {
      texto = `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
      clase = 'today';
    } else if (diffDays < 7) {
      texto = `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
      clase = 'week';
    } else {
      texto = accessDate.toLocaleDateString('es-CO');
      clase = 'old';
    }
    
    // Detalles adicionales
    const detalles = {
      fecha: accessDate.toLocaleString('es-CO'),
      ip: ultimoAcceso.ipAddress || 'Desconocida',
      evento: ultimoAcceso.evento,
      navegador: extraerNavegador(ultimoAcceso.userAgent)
    };

    return { texto, detalles, clase };
  };

  const extraerNavegador = (userAgent?: string) => {
    if (!userAgent) return 'Desconocido';
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    
    return 'Otro';
  };

  if (loading) {
    return (
      <div className="usuarios-page">
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
          <p style={{ marginTop: '1rem', color: 'var(--neutral-600)' }}>Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="usuarios-page">
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <p style={{ color: 'var(--error-red-600)' }}>{error}</p>
          <button onClick={cargarUsuarios} className="btn-primary" style={{ marginTop: '1rem' }}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="usuarios-page">
      {/* Header con acciones */}
      <div className="page-header">
        <div className="header-info">
          <h1 className="page-title">Gestión de Usuarios</h1>
          <p className="page-description">Administra los usuarios del sistema y sus roles</p>
        </div>
        <button className="btn-primary" id="btnNuevoUsuario">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="8.5" cy="7" r="4"/>
            <line x1="20" y1="8" x2="20" y2="14"/>
            <line x1="23" y1="11" x2="17" y2="11"/>
          </svg>
          Nuevo Usuario
        </button>
      </div>

      {/* Filtros y búsqueda */}
      <div className="filters-bar">
        <div className="search-box">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input 
            type="text" 
            placeholder="Buscar usuarios..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select 
            className="filter-select"
            value={filterRol}
            onChange={(e) => setFilterRol(e.target.value)}
          >
            <option value="">Todos los roles</option>
            <option value="admin">Administrador</option>
            <option value="responsable">Responsable</option>
            <option value="supervisor">Supervisor</option>
            <option value="auditor">Auditor</option>
          </select>
          <select 
            className="filter-select"
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="ACTIVO">Activo</option>
            <option value="INACTIVO">Inactivo</option>
          </select>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Proceso</th>
              <th>Estado</th>
              <th>Último acceso</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsuarios.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--neutral-500)' }}>
                  No se encontraron usuarios
                </td>
              </tr>
            ) : (
              filteredUsuarios.map((usuario, index) => (
                <tr key={usuario.usuarioId || index}>
                  <td>
                    <div className="user-cell">
                      <div className={`user-avatar ${getAvatarColor(index)}`}>
                        {getInitials(usuario)}
                      </div>
                      <span className="user-name">
                        {`${usuario.firstName} ${usuario.secondName || ''} ${usuario.firstLastname} ${usuario.secondLastname || ''}`.trim()}
                      </span>
                    </div>
                  </td>
                  <td>{usuario.email}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      {usuario.roles?.map((rol, idx) => (
                        <span key={idx} className={`badge ${getRolBadgeClass(rol)}`}>
                          {formatRolName(rol)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>{usuario.proceso || '-'}</td>
                  <td>
                    <span className={`status-badge ${usuario.estado === 'ACTIVO' ? 'active' : 'inactive'}`}>
                      {usuario.estado || 'ACTIVO'}
                    </span>
                  </td>
                  <td>
                    {loadingAccesos ? (
                      <span className="loading-text">Cargando...</span>
                    ) : (() => {
                      const acceso = formatLastAccess(usuario.usuarioId);
                      return (
                        <div className="last-access-cell">
                          <span className={`access-time ${acceso.clase}`}>{acceso.texto}</span>
                          {acceso.detalles && (
                            <div className="access-tooltip">
                              <div className="tooltip-content">
                                <div className="tooltip-row">
                                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <path d="M12 6v6l4 2"/>
                                  </svg>
                                  <span>{acceso.detalles.fecha}</span>
                                </div>
                                <div className="tooltip-row">
                                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="2" y1="12" x2="22" y2="12"/>
                                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                                  </svg>
                                  <span>{acceso.detalles.ip}</span>
                                </div>
                                <div className="tooltip-row">
                                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="2" y="3" width="20" height="14" rx="2"/>
                                    <line x1="8" y1="21" x2="16" y2="21"/>
                                    <line x1="12" y1="17" x2="12" y2="21"/>
                                  </svg>
                                  <span>{acceso.detalles.navegador}</span>
                                </div>
                                {acceso.detalles.evento === 'LOGIN_FAILED' && (
                                  <div className="tooltip-row error">
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                                      <circle cx="12" cy="12" r="10"/>
                                      <line x1="15" y1="9" x2="9" y2="15"/>
                                      <line x1="9" y1="9" x2="15" y2="15"/>
                                    </svg>
                                    <span>Intento fallido</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-icon" 
                        title={usuario.usuarioId === currentUserId ? "No puedes editar tu propio usuario" : "Editar"}
                        onClick={() => handleEditUsuario(usuario)}
                        disabled={usuario.usuarioId === currentUserId}
                        style={usuario.usuarioId === currentUserId ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button 
                        className="btn-icon danger" 
                        title="Eliminar"
                        onClick={() => handleEliminarUsuario(usuario)}
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="pagination">
        <span className="pagination-info">
          Mostrando 1-{filteredUsuarios.length} de {usuarios.length} usuarios
        </span>
      </div>

      {/* Modal de Edición */}
      {showEditModal && editingUsuario && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Editar Usuario</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              {/* Información del usuario */}
              <div className="user-info-section">
                <div className="user-info-header">
                  <div className={`user-avatar-large ${getAvatarColor(0)}`}>
                    {getInitials(editingUsuario)}
                  </div>
                  <div>
                    <h3 className="user-full-name">
                      {`${editingUsuario.firstName} ${editingUsuario.secondName || ''} ${editingUsuario.firstLastname} ${editingUsuario.secondLastname || ''}`.trim()}
                    </h3>
                    <p className="user-email">{editingUsuario.email}</p>
                    <p className="user-document">Doc: {editingUsuario.documentNumber}</p>
                  </div>
                </div>
              </div>

              {/* Cambiar Rol */}
              <div className="form-section">
                <label className="form-label">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  Rol del Usuario
                </label>
                <select 
                  className="form-select"
                  value={selectedRol}
                  onChange={(e) => setSelectedRol(e.target.value)}
                  disabled={saving}
                >
                  <option value="responsable">Responsable</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="auditor">Auditor</option>
                  <option value="admin">Administrador</option>
                </select>
                <button 
                  className="btn-secondary full-width"
                  onClick={handleCambiarRol}
                  disabled={saving || selectedRol === editingUsuario.roles?.[0]}
                  style={{ marginTop: '0.5rem' }}
                >
                  {saving ? 'Guardando...' : 'Cambiar Rol'}
                </button>
              </div>

              {/* Estado del Usuario */}
              <div className="form-section">
                <label className="form-label">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                  Estado del Usuario
                </label>
                <div className="status-info">
                  <span className={`status-badge-large ${editingUsuario.estado === 'ACTIVO' ? 'active' : 'inactive'}`}>
                    {editingUsuario.estado === 'ACTIVO' ? (
                      <>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                          <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        Activo
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="15" y1="9" x2="9" y2="15"/>
                          <line x1="9" y1="9" x2="15" y2="15"/>
                        </svg>
                        Inactivo
                      </>
                    )}
                  </span>
                </div>
                <button 
                  className={`btn-${editingUsuario.estado === 'ACTIVO' ? 'danger' : 'success'} full-width`}
                  onClick={handleToggleEstado}
                  disabled={saving}
                  style={{ marginTop: '0.5rem' }}
                >
                  {saving ? 'Procesando...' : editingUsuario.estado === 'ACTIVO' ? 'Desactivar Usuario' : 'Activar Usuario'}
                </button>
              </div>

              {/* Información adicional (solo lectura) */}
              <div className="info-section">
                <h4 className="info-title">Información del Sistema</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Proceso:</span>
                    <span className="info-value">{editingUsuario.proceso || 'No asignado'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Último acceso:</span>
                    <span className="info-value">{formatLastAccess(editingUsuario.usuarioId).texto}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={handleCloseModal}
                disabled={saving}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
