import { useState } from 'react';

const menuItems = [
  { 
    label: 'Dashboard General', 
    href: '/roles/supervisor/dashboard',
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
    label: 'Cumplimiento', 
    href: '/roles/supervisor/cumplimiento',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    )
  },
  { 
    label: 'Reportes Enviados', 
    href: '/roles/supervisor/reportes',
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
    href: '/roles/supervisor/evidencias',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    )
  },
  { 
    label: 'Alertas del Sistema', 
    href: '/roles/supervisor/alertas',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    badge: 5
  },
  { 
    label: 'Calendario', 
    href: '/roles/supervisor/calendario',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    )
  },
];

export default function SidebarSupervisor() {
  const [collapsed, setCollapsed] = useState(false);
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

  return (
    <aside className={`role-sidebar supervisor-sidebar ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="brand-icon supervisor">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          {!collapsed && <span className="brand-text">Supervisor</span>}
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
            {!collapsed && item.badge && (
              <span className="nav-badge warning">{item.badge}</span>
            )}
          </a>
        ))}
      </nav>

      <div className="sidebar-footer">
        {!collapsed && (
          <div className="user-info">
            <div className="user-avatar supervisor">S</div>
            <div className="user-details">
              <span className="user-name">Usuario Supervisor</span>
              <span className="user-role">Supervisor</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
