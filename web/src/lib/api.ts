import axios from 'axios';
import notifications from './notifications';

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8080';

export const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor to add JWT token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor to handle authentication errors (401/403)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined') {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message || 'Error desconocido';
      const currentPath = window.location.pathname;
      const isLoginRequest = error.config?.url?.includes('/api/auth/login');
      const isRegisterRequest = error.config?.url?.includes('/api/auth/registro');
      const isErrorPage = currentPath === '/error';
      
      // Mensajes que indican problemas de autenticación (token inválido, expirado, faltante)
      const authenticationErrors = [
        'Autenticación requerida',
        'Token JWT con firma inválida',
        'Token expirado',
        'Token JWT expirado',
        'proporcione un token válido',
        'Autenticación rechazada',
        'JWT expired',
        'invalid signature',
        'malformed',
      ];
      
      // Verificar si el mensaje indica un problema real de autenticación
      const isAuthenticationError = authenticationErrors.some(errMsg => 
        message.toLowerCase().includes(errMsg.toLowerCase())
      );
      
      // Handle 401 (Unauthorized) ONLY if it's an authentication issue (not permission issue)
      // BUT: Don't redirect if we're attempting to login/register (let the form handle it)
      if (status === 401 && isAuthenticationError && !isLoginRequest && !isRegisterRequest) {
        // Clear stored auth data
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        
        // Remove cookie if exists
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        // Show session expired message
        if (currentPath !== '/login' && currentPath !== '/registro') {
          notifications.warning(
            'Por favor, inicia sesión nuevamente',
            'Sesión expirada'
          );
        }
        
        // Redirect to login
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // Handle 403 (Forbidden) - Permission denied
      if (status === 403 && !isErrorPage && !isLoginRequest && !isRegisterRequest) {
        console.warn('[API Interceptor] Acceso denegado (403) - Redirigiendo al dashboard por rol');
        
        // Obtener rol del usuario y redirigir a su dashboard
        const usuarioData = localStorage.getItem('usuario');
        if (usuarioData) {
          const usuario = JSON.parse(usuarioData);
          
          // Importar dinámicamente roleGuard
          import('./roleGuard').then(({ getPrimaryRole, getDashboardForRole }) => {
            const primaryRole = getPrimaryRole(usuario.roles || []);
            const dashboard = getDashboardForRole(primaryRole);
            
            notifications.warning(
              'Acceso Denegado',
              'No tienes permiso para acceder a este recurso'
            );
            
            setTimeout(() => {
              window.location.href = dashboard;
            }, 1000);
          }).catch((e) => {
            console.error('[API Interceptor] Error al cargar roleGuard:', e);
            window.location.href = '/login';
          });
        } else {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      // Handle other critical errors (500, 503, network errors)
      if (!isErrorPage && !isLoginRequest && !isRegisterRequest) {
        // Errores del servidor (500, 503)
        if (status === 500 || status === 503) {
          const errorMessage = encodeURIComponent(message);
          window.location.href = `/error?code=${status}&message=${errorMessage}`;
          return Promise.reject(error);
        }

        // Errores de red (sin respuesta del servidor)
        if (!error.response && error.message === 'Network Error') {
          const errorMessage = encodeURIComponent('No se pudo conectar con el servidor');
          window.location.href = `/error?code=503&message=${errorMessage}`;
          return Promise.reject(error);
        }
      }
      
      // For other errors, let the application handle them
    }
    return Promise.reject(error);
  }
);

export default api;
