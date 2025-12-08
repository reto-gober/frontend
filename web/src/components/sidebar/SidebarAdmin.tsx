import { useState, useEffect } from 'react';

const menuItems = [
  { 
    label: 'Dashboard', 
    href: '/roles/admin/dashboard',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="9"/>
        <rect x="14" y="3" width="7" height="5"/>
        <rect x="14" y="12" width="7" height="9"/>
        <rect x="3" y="14" width="7" height="7"/>
      </svg>
    )
  },
  { 
    label: 'Subir Reportes', 
    href: '/roles/admin/mis-reportes',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <path d="M14 2v6h6"/>
        <line x1="12" y1="12" x2="12" y2="18"/>
        <line x1="9" y1="15" x2="15" y2="15"/>
      </svg>
    )
  },
  { 
    label: 'Cumplimiento', 
    href: '/roles/admin/cumplimiento',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="9 11 12 14 22 4"/>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    )
  },
  { 
    label: 'Auditoría', 
    href: '/roles/admin/auditoria',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <path d="M14 2v6h6"/>
        <path d="M9 15l2 2 4-4"/>
      </svg>
    )
  },
  { 
    label: 'Gestión de Usuarios', 
    href: '/roles/admin/usuarios',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    )
  },
  { 
    label: 'Gestión de Entidades', 
    href: '/roles/admin/entidades',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 22V8l9-5 9 5v14"/>
        <path d="M9 22V12h6v10"/>
      </svg>
    )
  },
  { 
    label: 'Gestión de Reportes', 
    href: '/roles/admin/reportes',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <path d="M14 2v6h6"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    )
  },
  { 
    label: 'Evidencias', 
    href: '/roles/admin/evidencias',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    )
  },
  { 
    label: 'Calendario', 
    href: '/roles/admin/calendario',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    )
  },
  { 
    label: 'Configuración', 
    href: '/roles/admin/configuracion',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v6m0 6v6m5.5-13.5l-3 3m-3 3l-3 3m13.5-1.5h-6m-6 0H1m13.5-5.5l-3 3m-3 3l-3 3"/>
      </svg>
    )
  },
];

export default function SidebarAdmin() {
  const [collapsed, setCollapsed] = useState(false);
  const [currentPath, setCurrentPath] = useState('');

  useEffect(() => {
    // Establecer el path actual solo en el cliente
    if (typeof window !== 'undefined') {
      setCurrentPath(window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const container = document.querySelector('.role-container');
      if (container) {
        if (collapsed) {
          container.classList.add('sidebar-collapsed');
          container.classList.remove('sidebar-expanded');
        } else {
          container.classList.add('sidebar-expanded');
          container.classList.remove('sidebar-collapsed');
        }
      }
    }
  }, [collapsed]);

  return (
    <aside className={`role-sidebar admin-sidebar ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="brand-icon admin">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          {!collapsed && <span className="brand-text">Administrador</span>}
        </div>
        <button 
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expandir' : 'Contraer'}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <path d={collapsed ? "M9 18l6-6-6-6" : "M15 18l-6-6 6-6"}/>
          </svg>
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={`nav-link ${currentPath === item.href ? 'active' : ''}`}
            title={collapsed ? item.label : undefined}
          >
            <span className="nav-icon">{item.icon}</span>
            {!collapsed && <span className="nav-label">{item.label}</span>}
          </a>
        ))}
      </nav>

      <div className="sidebar-footer">
        {!collapsed && (
          <div className="user-info">
            <div className="user-avatar admin">A</div>
            <div className="user-details">
              <span className="user-name">Admin User</span>
              <span className="user-role">Administrador</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
