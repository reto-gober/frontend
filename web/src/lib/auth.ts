import api from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface JwtResponse {
  token: string;
  tipo: string;
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  roles: string[];
}

export interface RegistroRequest {
  email: string;
  nombre: string;
  apellido: string;
  password: string;
  roles?: string[];
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
        id: data.id,
        email: data.email,
        nombre: data.nombre,
        apellido: data.apellido,
        roles: data.roles,
      }));
    }
  },

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
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
