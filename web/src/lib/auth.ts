import api from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface JwtResponse {
  token: string;
  tipo: string;
  documentNumber: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

export interface RegistroRequest {
  documentNumber: string;
  documentType: string;
  email: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
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
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify({
        documentNumber: data.documentNumber,
        email: data.email,
        nombre: data.firstName,
        apellido: data.lastName,
        roles: data.roles,
      }));
      // Guardar token en cookie para validación del lado del servidor
      document.cookie = `token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`;
    }
  },

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      // Eliminar cookie
      document.cookie = 'token=; path=/; max-age=0';
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
};
