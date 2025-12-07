import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../api';
import { fetchCached, invalidateCache } from '../fetcher';
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

// Jerarquía de roles: cada rol puede actuar como los roles inferiores
const roleHierarchy: Record<string, string[]> = {
  admin: ['admin', 'supervisor', 'responsable'],
  supervisor: ['supervisor', 'responsable'],
  responsable: ['responsable'],
  auditor: ['auditor'] // Solo puede actuar como auditor (sin jerarquía)
};

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
      const userData = await fetchCached<ConfiguracionRolResponse>('user', '/config/ui');
      setUser(userData);
      
      // Establecer rol activo por defecto (el rol principal del usuario)
      const primaryRole = userData.roles[0];
      const savedRole = localStorage.getItem('activeRole');
      
      // Si hay un rol guardado y es válido para este usuario, usarlo
      if (savedRole && userData.roles.includes(savedRole)) {
        setActiveRole(savedRole);
      } else {
        setActiveRole(primaryRole);
        localStorage.setItem('activeRole', primaryRole);
      }
    } catch (error) {
      console.error('Error loading config:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('activeRole');
      invalidateCache('user');
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
        invalidateCache(['user']);
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
    invalidateCache(['user', 'systemSettings', 'alertRules']);
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

  // Obtener roles disponibles según jerarquía
  const getAvailableRoles = (): string[] => {
    if (!user) return [];
    
    const rolesSet = new Set<string>();
    
    // Para cada rol del usuario, agregar roles accesibles según jerarquía
    user.roles.forEach(userRole => {
      const accessible = roleHierarchy[userRole] || [userRole];
      accessible.forEach(role => rolesSet.add(role));
    });
    
    return Array.from(rolesSet);
  };

  const availableRoles = getAvailableRoles();

  // Verificar si puede cambiar a un rol específico
  const canSwitchTo = (role: string): boolean => {
    return availableRoles.includes(role);
  };

  // Cambiar de rol activo
  const switchRole = (role: string) => {
    if (!canSwitchTo(role)) {
      console.error(`No tienes permisos para actuar como ${role}`);
      return;
    }
    
    setActiveRole(role);
    localStorage.setItem('activeRole', role);
    
    // Recargar la página para aplicar el nuevo contexto de rol
    window.location.reload();
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
