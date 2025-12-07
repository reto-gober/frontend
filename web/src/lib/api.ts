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

// Response interceptor to handle authentication errors (401/403/500)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined') {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message || 'Error desconocido';
      const currentPath = window.location.pathname;
      const isLoginRequest = error.config?.url?.includes('/api/auth/login');
      const isRegisterRequest = error.config?.url?.includes('/api/auth/registro');
      const isPublicEndpoint = error.config?.url?.includes('/api/auth/') || 
                               error.config?.url?.includes('/api/users/validate-invitation') ||
                               error.config?.url?.includes('/api/users/complete-invitation');
      
      // ========================================
      // 401: SESIÓN INVÁLIDA O EXPIRADA
      // ========================================
      // Cerrar sesión SOLO si es un problema de autenticación real
      if (status === 401 && !isPublicEndpoint) {
        console.warn('[API] 401 - Sesión inválida o expirada. Cerrando sesión...');
        
        // Limpiar datos de autenticación
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        // Mostrar notificación SOLO si no estamos en login
        if (currentPath !== '/login' && currentPath !== '/registro') {
          notifications.warning(
            'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
            'Sesión Expirada'
          );
        }
        
        // Redirigir a login
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
        
        return Promise.reject(error);
      }

      // ========================================
      // 403: ACCESO DENEGADO (sin cerrar sesión)
      // ========================================
      // El usuario está autenticado pero no tiene permiso para este recurso
      if (status === 403 && !isPublicEndpoint) {
        console.warn('[API] 403 - Acceso denegado. Redirigiendo al dashboard del usuario...');
        
        // NO borrar token ni cerrar sesión
        // Obtener rol y redirigir a su dashboard
        const usuarioData = localStorage.getItem('usuario');
        if (usuarioData) {
          try {
            const usuario = JSON.parse(usuarioData);
            
            // Calcular dashboard según rol
            import('./auth').then(({ authService }) => {
              const dashboard = authService.getDashboardByRole();
              
              notifications.error(
                'No tienes permisos suficientes para acceder a este recurso',
                'Acceso Denegado'
              );
              
              setTimeout(() => {
                window.location.href = dashboard;
              }, 1500);
            });
          } catch (e) {
            console.error('[API] Error al parsear usuario:', e);
            window.location.href = '/login';
          }
        } else {
          // No hay usuario → ir a login
          window.location.href = '/login';
        }
        
        return Promise.reject(error);
      }

      // ========================================
      // 500/503: ERROR DEL SERVIDOR
      // ========================================
      // NO cerrar sesión, solo mostrar página de error
      const isSupervisorCalendar = error.config?.url?.includes('/api/dashboard/supervisor/calendario');

      if ((status === 500 || status === 503) && !isPublicEndpoint && currentPath !== '/error') {
        // Para el calendario del supervisor dejamos que el caller maneje el fallback
        if (isSupervisorCalendar) {
          console.error('[API] Error calendario supervisor:', status, message);
          return Promise.reject(error);
        }

        console.error('[API] Error del servidor:', status, message);
        
        // NO borrar token
        const errorMessage = encodeURIComponent(message);
        window.location.href = `/error?code=${status}&message=${errorMessage}`;
        
        return Promise.reject(error);
      }

      // ========================================
      // NETWORK ERROR (sin respuesta)
      // ========================================
      if (!error.response && error.message === 'Network Error' && currentPath !== '/error') {
        console.error('[API] Error de red - servidor no disponible');
        
        const errorMessage = encodeURIComponent('No se pudo conectar con el servidor. Verifica tu conexión.');
        window.location.href = `/error?code=503&message=${errorMessage}`;
        
        return Promise.reject(error);
      }
      
      // Para otros errores (400, 404, etc.), dejar que la aplicación los maneje
    }
    return Promise.reject(error);
  }
);

export default api;
