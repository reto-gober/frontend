import { useState, useEffect } from 'react';
import { usuariosService, type UsuarioResponse } from '../../lib/services';

export default function AdminUsuariosClient() {
  const [usuarios, setUsuarios] = useState<UsuarioResponse[]>([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState<UsuarioResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  useEffect(() => {
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
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      setError('Error al cargar los usuarios');
    } finally {
      setLoading(false);
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

  const formatLastAccess = (lastAccess: string | null) => {
    if (!lastAccess) return 'Nunca';
    
    const now = new Date();
    const accessDate = new Date(lastAccess);
    const diffMs = now.getTime() - accessDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    
    return accessDate.toLocaleDateString('es-CO');
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
                  <td>{formatLastAccess(usuario.ultimoAcceso || null)}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon" title="Editar">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button className="btn-icon danger" title="Eliminar">
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
    </div>
  );
}
