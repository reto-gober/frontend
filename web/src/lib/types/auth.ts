// Tipos para autenticación y configuración de roles

export interface UsuarioConfig {
  usuarioId: string;
  nombreCompleto: string;
  email: string;
  cargo: string;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  ruta: string;
  visible: boolean;
  subItems?: SubMenuItem[];
}

export interface SubMenuItem {
  id: string;
  label: string;
  ruta: string;
  visible?: boolean;
}

export interface MenuConfig {
  items: MenuItem[];
}

export interface PermisosConfig {
  puedeCrearReporte: boolean;
  puedeEditarReporte: boolean;
  puedeEliminarReporte: boolean;
  puedeEnviarReporte: boolean;
  puedeAprobarReporte: boolean;
  puedeRechazarReporte: boolean;
  puedeVerUsuarios: boolean;
  puedeCrearUsuarios: boolean;
  puedeEditarUsuarios: boolean;
  puedeEliminarUsuarios: boolean;
  puedeCambiarRoles: boolean;
  puedeVerEntidades: boolean;
  puedeCrearEntidades: boolean;
  puedeEditarEntidades: boolean;
  puedeEliminarEntidades: boolean;
  puedeVerAuditoria: boolean;
  puedeExportarReportes: boolean;
  puedeConfigurarAlertas: boolean;
  puedeConfigurarSistema: boolean;
}

export interface DashboardConfig {
  tipo: 'admin' | 'supervisor' | 'responsable' | 'auditor';
  rutaDashboard: string;
  widgetsVisibles: string[];
  endpoints: {
    dashboard: string;
    misPeriodos?: string;
    pendientes?: string;
    correcciones?: string;
  };
}

export interface ConfiguracionRolResponse {
  rolPrincipal: string;
  roles: string[];
  usuario: UsuarioConfig;
  menu: MenuConfig;
  permisos: PermisosConfig;
  dashboard: DashboardConfig;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  expiresIn?: number;
}
