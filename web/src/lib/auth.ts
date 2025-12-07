import api from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface JwtResponse {
  token: string;
  tipo: string;
  usuarioId: string;
  documentNumber: string;
  email: string;
  firstName: string;
  secondName?: string;
  firstLastname: string;
  secondLastname?: string;
  roles: string[];
}

export interface RegistroRequest {
  documentNumber: string;
  documentType: string;
  email: string;
  firstName: string;
  secondName?: string;
  firstLastname: string;
  secondLastname?: string;
  password: string;
  birthDate: string;
  roles: string[];
}

export interface MessageResponse {
  mensaje: string;
}

export const authService = {
  async login(data: LoginRequest): Promise<JwtResponse> {
    const response = await api.post('/api/auth/login', data);
    return response.data;
  },

  async register(data: RegistroRequest): Promise<MessageResponse> {
    const response = await api.post('/api/auth/registro', data);
    return response.data;
  },

  saveToken(data: JwtResponse) {
    if (typeof window !== 'undefined') {
      const usuario = {
        usuarioId: data.usuarioId,
        documentNumber: data.documentNumber,
        email: data.email,
        firstName: data.firstName,
        secondName: data.secondName,
        firstLastname: data.firstLastname,
        secondLastname: data.secondLastname,
        roles: data.roles,
      };
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(usuario));
      
      // Guardar token en cookie para middleware de Astro (7 días)
      const maxAge = 60 * 60 * 24 * 7;
      document.cookie = `token=${data.token}; path=/; max-age=${maxAge}; SameSite=Strict`;
      
      // Guardar usuario en cookie también para middleware
      document.cookie = `usuario=${encodeURIComponent(JSON.stringify(usuario))}; path=/; max-age=${maxAge}; SameSite=Strict`;
    }
  },

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      localStorage.removeItem('selectedView'); // Limpiar vista seleccionada
      // Eliminar cookies
      document.cookie = 'token=; path=/; max-age=0';
      document.cookie = 'usuario=; path=/; max-age=0';
      window.location.href = '/login';
    }
  },

  getUser() {
    if (typeof window !== 'undefined') {
      const usuario = localStorage.getItem('usuario');
      return usuario ? JSON.parse(usuario) : null;
    }
    return null;
  },

  isAuthenticated(): boolean {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('token');
    }
    return false;
  },

  /**
   * Obtiene el dashboard correcto según el rol del usuario
   * @returns URL del dashboard o /login si no hay usuario
   */
  getDashboardByRole(): string {
    if (typeof window !== 'undefined') {
      const usuario = this.getUser();
      if (!usuario || !usuario.roles || usuario.roles.length === 0) {
        return '/login';
      }
      
      // Importar y usar getPrimaryRole y getDashboardForRole
      const roles = usuario.roles;
      const hierarchy = ['admin', 'supervisor', 'responsable', 'auditor'];
      
      // Normalizar roles
      const normalizedRoles = roles.map((r: string) => r.toLowerCase().replace('role_', ''));
      
      // Encontrar el rol principal según jerarquía
      for (const role of hierarchy) {
        if (normalizedRoles.includes(role)) {
          const dashboards: Record<string, string> = {
            admin: '/roles/admin/dashboard',
            supervisor: '/roles/supervisor/dashboard',
            responsable: '/roles/responsable/dashboard',
            auditor: '/roles/auditor/dashboard',
          };
          return dashboards[role] || '/login';
        }
      }
      
      return '/login';
    }
    return '/login';
  },

  async validateToken(): boolean {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        return false;
      }
      
      try {
        // Intentar hacer una petición simple para validar el token
        await api.get('/api/usuarios', { params: { page: 0, size: 1 } });
        return true;
      } catch (error: any) {
        // Si falla (401/403), el interceptor ya limpiará el token y redirigirá
        return false;
      }
    }
    return false;
  },
};
