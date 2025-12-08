import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../api';
import type { ConfiguracionRolResponse, PermisosConfig, LoginRequest } from '../types/auth';

interface AuthContextType {
  user: ConfiguracionRolResponse | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  hasPermission: (permiso: keyof PermisosConfig) => boolean;
  hasRole: (rol: string) => boolean;
  isAuthenticated: boolean;
  // Sistema de cambio de rol jerárquico
  activeRole: string | null;
  availableRoles: string[];
  switchRole: (role: string) => void;
  canSwitchTo: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ConfiguracionRolResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState<string | null>(null);

  // Cargar configuración al iniciar
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadConfig();
    } else {
      setLoading(false);
    }
  }, []);

  const loadConfig = async () => {
    try {
      const response = await api.get('/api/config/ui');
      if (response.data.success) {
        const userData = response.data.data;
        setUser(userData);

        // El rol activo siempre es el rol principal reportado por backend
        const primaryRole = userData.roles[0];
        setActiveRole(primaryRole);
        localStorage.setItem('activeRole', primaryRole);
      }
    } catch (error) {
      console.error('Error loading config:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('activeRole');
      setUser(null);
      setActiveRole(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.data.success) {
        const { token } = response.data.data;
        localStorage.setItem('token', token);
        await loadConfig();
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('activeRole');
    setUser(null);
    setActiveRole(null);
    window.location.href = '/login';
  };

  const hasPermission = (permiso: keyof PermisosConfig): boolean => {
    return user?.permisos?.[permiso] ?? false;
  };

  const hasRole = (rol: string): boolean => {
    return user?.roles?.includes(rol) ?? false;
  };

  // Roles disponibles reportados por backend (sin sistema de cambio de vista)
  const availableRoles = user?.roles ?? [];

  // El cambio manual de rol queda deshabilitado para mantener una sola vista unificada
  const canSwitchTo = (_role: string) => false;
  const switchRole = (role: string) => {
    console.info(`El cambio de vista a "${role}" está deshabilitado. Usa la vista unificada con todas las capacidades permitidas.`);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        login, 
        logout, 
        hasPermission, 
        hasRole,
        isAuthenticated,
        activeRole,
        availableRoles,
        switchRole,
        canSwitchTo
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
