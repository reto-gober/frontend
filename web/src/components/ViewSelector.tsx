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

interface ViewSelectorProps {
  currentRole: string;
}

export default function ViewSelector({ currentRole }: ViewSelectorProps) {
  const [availableViews, setAvailableViews] = useState<any[]>([]);
  const [currentView, setCurrentView] = useState<Role | null>(null);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [canSwitch, setCanSwitch] = useState(false);

  useEffect(() => {
    // Obtener usuario y configurar permisos
    const usuario = authService.getUser();
    if (!usuario || !usuario.roles) {
      return;
    }

    const primaryRole = getPrimaryRole(usuario.roles);
    setUserRole(primaryRole);
    
    // Obtener vista actual (considerando la guardada en localStorage)
    const current = getCurrentView(primaryRole);
    setCurrentView(current);
    
    // Verificar si puede cambiar de vista
    const canChange = canSwitchView(primaryRole);
    setCanSwitch(canChange);
    
    if (canChange) {
      const views = getAvailableViews(primaryRole);
      setAvailableViews(views);
      console.log('[ViewSelector] Vistas disponibles:', views.map(v => v.label).join(', '));
    }
  }, []);

  const handleViewChange = (targetRole: Role) => {
    if (!userRole) return;
    
    console.log(`[ViewSelector] Cambiando a vista: ${targetRole}`);
    const success = switchToView(userRole, targetRole);
    
    if (success) {
      setIsOpen(false);
    }
  };

  // No mostrar si el usuario no puede cambiar de vista
  if (!canSwitch || !userRole || !currentView) {
    return null;
  }

  const currentViewData = availableViews.find(v => v.role === currentView);

  return (
    <div className="view-selector">
      <button 
        className="view-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Selector de vista"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>
        <span className="view-selector-label">
          {currentViewData?.label || 'Vista'}
        </span>
        <svg 
          viewBox="0 0 24 24" 
          width="16" 
          height="16" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {isOpen && (
        <>
          <div 
            className="view-selector-overlay" 
            onClick={() => setIsOpen(false)}
          />
          <div className="view-selector-dropdown">
            <div className="view-selector-header">
              Cambiar Vista
            </div>
            {availableViews.map(view => (
              <button
                key={view.role}
                className={`view-selector-item ${view.role === currentView ? 'active' : ''}`}
                onClick={() => handleViewChange(view.role)}
                disabled={view.role === currentView}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  {view.role === 'admin' && (
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  )}
                  {view.role === 'supervisor' && (
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                  )}
                  {view.role === 'responsable' && (
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>
                  )}
                  {view.role === 'auditor' && (
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8"/>
                  )}
                </svg>
                <div className="view-selector-item-content">
                  <span className="view-selector-item-label">{view.label}</span>
                  {view.role === currentView && (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
              </button>
            ))}
            <div className="view-selector-footer">
              <small>Los permisos se mantienen según tu rol principal</small>
            </div>
          </div>
        </>
      )}

      <style>{`
        .view-selector {
          position: relative;
          display: inline-block;
        }

        .view-selector-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          transition: all 0.2s;
        }

        .view-selector-button:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }

        .view-selector-label {
          color: #111827;
        }

        .view-selector-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 999;
        }

        .view-selector-dropdown {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          min-width: 250px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          z-index: 1000;
          overflow: hidden;
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .view-selector-header {
          padding: 0.75rem 1rem;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          font-size: 0.75rem;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .view-selector-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border: none;
          background: white;
          cursor: pointer;
          transition: background 0.2s;
          text-align: left;
        }

        .view-selector-item:hover {
          background: #f3f4f6;
        }

        .view-selector-item.active {
          background: #eff6ff;
          color: #2563eb;
        }

        .view-selector-item svg {
          flex-shrink: 0;
        }

        .view-selector-item-content {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .view-selector-item-label {
          font-weight: 500;
          font-size: 0.875rem;
        }

        .view-selector-footer {
          padding: 0.75rem 1rem;
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
        }

        .view-selector-footer small {
          font-size: 0.75rem;
          color: #6b7280;
          line-height: 1.4;
        }

        @media (max-width: 640px) {
          .view-selector-dropdown {
            right: auto;
            left: 0;
            min-width: 200px;
          }

          .view-selector-label {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
