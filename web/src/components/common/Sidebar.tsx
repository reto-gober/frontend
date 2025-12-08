import { useAuth } from '../../lib/contexts/AuthContext';
import { RoleSwitcher } from './RoleSwitcher';
import { useState } from 'react';
import * as React from 'react';

export function Sidebar() {
  const { user, logout } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  if (!user) return null;

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const isActive = (ruta: string) => {
    if (typeof window !== 'undefined') {
      return window.location.pathname === ruta;
    }
    return false;
  };

  const getRoleBadgeColor = () => {
    switch (user.rolPrincipal) {
      case 'admin': return '#dc2626';
      case 'supervisor': return '#2563eb';
      case 'responsable': return '#059669';
      case 'auditor': return '#7c3aed';
      default: return '#6b7280';
    }
  };

  return (
    <aside className="sidebar" style={{
      width: '280px',
      height: '100vh',
      backgroundColor: 'white',
      borderRight: '1px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      overflowY: 'auto'
    }}>
      {/* User Info */}
      <div style={{
        padding: '1.5rem',
        borderBottom: '1px solid var(--color-border)'
      }}>
        {/* Role Switcher */}
        <RoleSwitcher />
        
        <div style={{
          backgroundColor: getRoleBadgeColor(),
          color: 'white',
          padding: '0.375rem 0.75rem',
          borderRadius: '6px',
          fontSize: '0.75rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '0.75rem',
          textAlign: 'center'
        }}>
          {user.rolPrincipal}
        </div>
        <div style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--color-text)',
          marginBottom: '0.25rem',
          wordBreak: 'break-word'
        }}>
          {user.usuario.nombreCompleto}
        </div>
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--color-text-light)',
          wordBreak: 'break-word'
        }}>
          {user.usuario.email}
        </div>
        {user.usuario.cargo && (
          <div style={{
            fontSize: '0.75rem',
            color: 'var(--color-text-light)',
            marginTop: '0.25rem'
          }}>
            {user.usuario.cargo}
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav style={{ flex: 1, padding: '1rem 0' }}>
        {user.menu.items.map((item: any) => (
          item.visible && (
            <div key={item.id} style={{ marginBottom: '0.25rem' }}>
              <a
                href={item.ruta}
                onClick={(e) => {
                  if (item.subItems && item.subItems.length > 0) {
                    e.preventDefault();
                    toggleMenu(item.id);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 1.5rem',
                  color: isActive(item.ruta) ? 'var(--color-primary)' : 'var(--color-text)',
                  backgroundColor: isActive(item.ruta) ? 'var(--color-primary-50)' : 'transparent',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: isActive(item.ruta) ? 600 : 500,
                  transition: 'all 0.15s',
                  cursor: 'pointer',
                  borderLeft: isActive(item.ruta) ? '3px solid var(--color-primary)' : '3px solid transparent'
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.ruta)) {
                    e.currentTarget.style.backgroundColor = 'var(--color-gray-50)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.ruta)) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                  <span style={{ 
                    fontSize: '1.25rem', 
                    marginRight: '0.75rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {getIcon(item.icon)}
                  </span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.subItems && item.subItems.length > 0 && (
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                      style={{
                        transform: expandedMenus.includes(item.id) ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s'
                      }}
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  )}
                </a>

              {/* Submenu */}
              {item.subItems && expandedMenus.includes(item.id) && (
                <div style={{ 
                  backgroundColor: 'var(--color-gray-50)',
                  borderLeft: '3px solid var(--color-primary-100)'
                }}>
                  {item.subItems.map((sub: any) => (
                    sub.visible !== false && (
                      <a
                        key={sub.id}
                        href={sub.ruta}
                        style={{
                          display: 'block',
                          padding: '0.625rem 1.5rem 0.625rem 3.5rem',
                          color: isActive(sub.ruta) ? 'var(--color-primary)' : 'var(--color-text)',
                          backgroundColor: isActive(sub.ruta) ? 'var(--color-primary-50)' : 'transparent',
                          textDecoration: 'none',
                          fontSize: '0.8125rem',
                          fontWeight: isActive(sub.ruta) ? 600 : 400,
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive(sub.ruta)) {
                              e.currentTarget.style.backgroundColor = 'var(--color-primary-50)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive(sub.ruta)) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          {sub.label}
                        </a>
                    )
                  ))}
                </div>
              )}
            </div>
          )
        ))}
      </nav>

      {/* Logout Button */}
      <div style={{ 
        padding: '1rem 1.5rem', 
        borderTop: '1px solid var(--color-border)' 
      }}>
        <button
          onClick={logout}
          className="btn btn-secondary"
          style={{
            width: '100%',
            justifyContent: 'center',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}

// Helper function para iconos
function getIcon(iconName: string): React.ReactElement {
  const icons: Record<string, React.ReactElement> = {
    dashboard: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
      </svg>
    ),
    folder: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
      </svg>
    ),
    calendar_today: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
    ),
    check_circle: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
    ),
    people: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    ),
    business: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    ),
    assessment: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10"></line>
        <line x1="12" y1="20" x2="12" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="14"></line>
      </svg>
    ),
    settings: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M12 1v6m0 6v6m0-6h6m-6 0H6m6 0L19.071 19.071M12 12L4.929 4.929m0 14.142L12 12m0 0l7.071-7.071"></path>
      </svg>
    ),
  };

  return icons[iconName] || icons.folder;
}
