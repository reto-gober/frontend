import axios from 'axios';

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
      const currentPath = window.location.pathname;
      const isLoginRequest = error.config?.url?.includes('/api/auth/login');
      const isRegisterRequest = error.config?.url?.includes('/api/auth/registro');
      
      // Handle 401 (Unauthorized) and 403 (Forbidden) - session expired or invalid token
      // BUT: Don't redirect if we're attempting to login/register (let the form handle it)
      if ((status === 401 || status === 403) && !isLoginRequest && !isRegisterRequest) {
        // Clear stored auth data
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        
        // Remove cookie if exists
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        // Show session expired message
        if (currentPath !== '/login' && currentPath !== '/registro') {
          // Only show alert if not already on login page
          alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        }
        
        // Redirect to login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
