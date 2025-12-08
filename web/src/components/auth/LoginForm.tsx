import { useState, useEffect } from 'react';
import { authService } from '../../lib/auth';
import './LoginForm.css';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cargar usuario guardado al iniciar
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const getDashboardRoute = (roles: string[]): string | null => {
    if (!roles || roles.length === 0) return null;
    
    const rolesUpper = roles.map(r => r.toUpperCase());
    
    if (rolesUpper.includes('ROLE_ADMIN') || rolesUpper.includes('ADMIN')) {
      return '/roles/admin/dashboard';
    } else if (rolesUpper.includes('ROLE_AUDITOR') || rolesUpper.includes('AUDITOR')) {
      return '/roles/auditor/dashboard';
    } else if (rolesUpper.includes('ROLE_SUPERVISOR') || rolesUpper.includes('SUPERVISOR')) {
      return '/roles/supervisor/dashboard';
    } else if (rolesUpper.includes('ROLE_RESPONSABLE') || rolesUpper.includes('RESPONSABLE')) {
      return '/roles/responsable/dashboard';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Guardar o eliminar el email según "Recordarme"
    if (rememberMe) {
      localStorage.setItem('rememberedEmail', email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }

    try {
      const response = await authService.login({ email, password });
      authService.saveToken(response);
      
      const dashboardRoute = getDashboardRoute(response.roles || []);
      if (dashboardRoute) {
        window.location.href = dashboardRoute;
      } else {
        setError('No tienes permisos asignados. Contacta al administrador.');
        setLoading(false);
      }
    } catch (err: any) {
      const message = err.response?.data?.mensaje || 'Error al iniciar sesión. Verifica tus credenciales.';
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        {/* Avatar */}
        <div className="login-avatar">
          <div className="avatar-circle">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
        </div>

        {/* Título */}
        <h1 className="login-title">Iniciar sesión</h1>

        {/* Error Alert */}
        {error && (
          <div className="login-alert">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Input Usuario */}
          <div className="form-group">
            <div className="input-wrapper">
              <div className="input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <input
                type="email"
                className="form-input"
                placeholder="Usuario"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>
          </div>

          {/* Input Contraseña */}
          <div className="form-group">
            <div className="input-wrapper">
              <div className="input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <input
                type="password"
                className="form-input"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={loading}
              />
            </div>
          </div>

          {/* Recordarme y Olvidó contraseña */}
          <div className="form-footer">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              <span>Recordarme</span>
            </label>
            <a href="#" className="forgot-password">
              ¿Olvidó su contraseña?
            </a>
          </div>

          {/* Botón Iniciar Sesión */}
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
