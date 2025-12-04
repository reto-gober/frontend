import { useAuth } from '../../lib/contexts/AuthContext';
import { type ReactNode, useEffect } from 'react';
import type { PermisosConfig } from '../../lib/types/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: keyof PermisosConfig;
  allowedRoles?: string[];
  fallback?: ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requiredPermission, 
  allowedRoles,
  fallback 
}: ProtectedRouteProps) {
  const { user, loading, hasPermission, activeRole, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [loading, isAuthenticated]);

  if (loading) {
    return (
      <div className="loading-container" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div className="spinner" style={{
          width: '48px',
          height: '48px',
          border: '4px solid var(--color-gray-200)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: 'var(--color-text-light)' }}>Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Verificar rol activo (en lugar de todos los roles del usuario)
  if (allowedRoles && !allowedRoles.includes(activeRole || '')) {
    return fallback || (
      <div className="access-denied" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: '1rem',
        padding: '2rem'
      }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-danger)' }}>
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--color-text)' }}>Acceso Denegado</h2>
        <p style={{ color: 'var(--color-text-light)', textAlign: 'center', maxWidth: '400px' }}>
          No tienes permisos para acceder a esta sección.
        </p>
        <button 
          onClick={() => window.location.href = '/panel'}
          className="btn btn-primary"
          style={{ marginTop: '1rem' }}
        >
          Volver al Panel
        </button>
      </div>
    );
  }

  // Verificar permiso específico
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback || (
      <div className="access-denied" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: '1rem',
        padding: '2rem'
      }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-warning)' }}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          <line x1="9" y1="9" x2="15" y2="15"></line>
          <line x1="15" y1="9" x2="9" y2="15"></line>
        </svg>
        <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--color-text)' }}>Permiso Requerido</h2>
        <p style={{ color: 'var(--color-text-light)', textAlign: 'center', maxWidth: '400px' }}>
          No tienes permiso para realizar esta acción.
        </p>
        <button 
          onClick={() => window.history.back()}
          className="btn btn-secondary"
          style={{ marginTop: '1rem' }}
        >
          Volver
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
