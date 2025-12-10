import { useState, useEffect } from 'react';

const menuItems = [
  { 
    label: 'Dashboard Analítico', 
    href: '/roles/auditor/dashboard',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    )
  },
  { 
    label: 'Cumplimiento', 
    href: '/roles/auditor/cumplimiento',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    )
  },
  { 
    label: 'Reportes Enviados', 
    href: '/roles/auditor/reportes',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <path d="M14 2v6h6"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    readonly: true
  },
  { 
    label: 'Entidades', 
    href: '/roles/auditor/entidades',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 22V8l9-5 9 5v14"/>
        <path d="M9 22V12h6v10"/>
      </svg>
    ),
    readonly: true
  },
  { 
    label: 'Histórico', 
    href: '/roles/auditor/historico',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    readonly: true
  },
  { 
    label: 'Calendario', 
    href: '/roles/auditor/calendario',
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

export default function SidebarAuditor() {
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
    <aside className={`role-sidebar auditor-sidebar ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="brand-icon auditor" title="Auditor">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <path d="M14 2v6h6"/>
              <path d="M16 13H8"/>
              <path d="M16 17H8"/>
              <path d="M10 9H8"/>
            </svg>
          </div>
          {!collapsed && <span className="brand-text">Auditor</span>}
        </div>
        <button 
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expandir' : 'Contraer'}
          title={collapsed ? 'Expandir' : 'Contraer'}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <path d={collapsed ? "M9 18l6-6-6-6" : "M15 18l-6-6 6-6"}/>
          </svg>
        </button>
      </div>

      <div className="sidebar-notice">
        {!collapsed && (
          <div className="readonly-badge">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <span>Solo Lectura</span>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={`nav-link ${currentPath === item.href ? 'active' : ''} ${item.readonly ? 'readonly' : ''}`}
            title={collapsed ? item.label : undefined}
          >
            <span className="nav-icon">{item.icon}</span>
            {!collapsed && <span className="nav-label">{item.label}</span>}
            {!collapsed && item.readonly && (
              <span className="readonly-indicator" title="Solo lectura">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
            )}
          </a>
        ))}
      </nav>

      <div className="sidebar-footer">
        {!collapsed && (
          <div className="user-info">
            <div className="user-avatar auditor" title="AU">AU</div>
            <div className="user-details">
              <span className="user-name">Auditor</span>
              <span className="user-role">Sistema</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
