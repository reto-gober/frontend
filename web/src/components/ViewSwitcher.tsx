import { useState, useEffect } from 'react';
import { 
  getPrimaryRole, 
  canSwitchView, 
  getAvailableViews, 
  getCurrentView,
  switchToView,
  type Role 
} from '../lib/viewSwitcher';
import { authService } from '../lib/auth';

export default function ViewSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [currentView, setCurrentView] = useState<Role | null>(null);
  const [availableViews, setAvailableViews] = useState<any[]>([]);
  const [canSwitch, setCanSwitch] = useState(false);

  useEffect(() => {
    // Obtener usuario y sus permisos
    const usuario = authService.getUser();
    if (!usuario || !usuario.roles) {
      return;
    }

    const primaryRole = getPrimaryRole(usuario.roles);
    setUserRole(primaryRole);
    
    const current = getCurrentView(primaryRole);
    setCurrentView(current);
    
    const canChange = canSwitchView(primaryRole);
    setCanSwitch(canChange);
    
    if (canChange) {
      const views = getAvailableViews(primaryRole);
      setAvailableViews(views);
    }
  }, []);

  const handleSwitchView = (targetRole: Role) => {
    if (!userRole) return;
    
    const success = switchToView(userRole, targetRole);
    if (success) {
      setIsOpen(false);
    }
  };

  // No mostrar si el usuario no puede cambiar de vista
  if (!canSwitch || !userRole) {
    return null;
  }

  const currentViewInfo = availableViews.find(v => v.role === currentView);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          backgroundColor: 'var(--color-primary-50)',
          border: '1px solid var(--color-primary-200)',
          borderRadius: '8px',
          color: 'var(--color-primary-700)',
          fontSize: '0.875rem',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-primary-100)';
          e.currentTarget.style.borderColor = 'var(--color-primary-300)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-primary-50)';
          e.currentTarget.style.borderColor = 'var(--color-primary-200)';
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
        <span>Vista: {currentViewInfo?.label || 'Actual'}</span>
        <svg 
          width="14" 
          height="14" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Overlay para cerrar al hacer clic fuera */}
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
          />
          
          {/* Dropdown */}
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 0.5rem)',
              right: 0,
              minWidth: '280px',
              backgroundColor: 'white',
              border: '1px solid var(--neutral-200)',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
              zIndex: 1000,
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--neutral-100)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Cambiar Vista
              </div>
            </div>
            
            <div style={{ padding: '0.5rem' }}>
              {availableViews.map((view) => (
                <button
                  key={view.role}
                  onClick={() => handleSwitchView(view.role)}
                  disabled={view.role === currentView}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    border: 'none',
                    backgroundColor: view.role === currentView ? 'var(--color-primary-50)' : 'transparent',
                    borderRadius: '6px',
                    cursor: view.role === currentView ? 'default' : 'pointer',
                    transition: 'background-color 0.2s',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    if (view.role !== currentView) {
                      e.currentTarget.style.backgroundColor = 'var(--neutral-50)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (view.role !== currentView) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: view.role === currentView ? 'var(--color-primary-100)' : 'var(--neutral-100)',
                    borderRadius: '6px',
                    flexShrink: 0,
                  }}>
                    {getRoleIcon(view.role)}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      marginBottom: '0.25rem'
                    }}>
                      <span style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: 600, 
                        color: view.role === currentView ? 'var(--color-primary-700)' : 'var(--neutral-900)'
                      }}>
                        {view.label}
                      </span>
                      {view.role === currentView && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-600)" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--neutral-500)',
                      lineHeight: 1.3
                    }}>
                      {view.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function getRoleIcon(role: Role) {
  const iconColor = 'var(--neutral-600)';
  
  switch (role) {
    case 'admin':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
          <path d="M2 17l10 5 10-5"></path>
          <path d="M2 12l10 5 10-5"></path>
        </svg>
      );
    case 'supervisor':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      );
    case 'responsable':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      );
    case 'auditor':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <line x1="12" y1="9" x2="12" y2="9"></line>
        </svg>
      );
  }
}
