/**
 * Servicio para manejar el cambio de vista según rol
 * Gestiona la persistencia y validación de vistas permitidas
 */

export type Role = 'admin' | 'supervisor' | 'responsable' | 'auditor';

interface ViewInfo {
  role: Role;
  label: string;
  route: string;
  description: string;
}

// Mapeo de vistas disponibles
const VIEWS: Record<Role, ViewInfo> = {
  admin: {
    role: 'admin',
    label: 'Administrador',
    route: '/roles/admin/dashboard',
    description: 'Vista de administración del sistema'
  },
  supervisor: {
    role: 'supervisor',
    label: 'Supervisor',
    route: '/roles/supervisor/dashboard',
    description: 'Vista de supervisión de reportes'
  },
  responsable: {
    role: 'responsable',
    label: 'Responsable',
    route: '/roles/responsable/dashboard',
    description: 'Vista de elaboración de reportes'
  },
  auditor: {
    role: 'auditor',
    label: 'Auditor',
    route: '/roles/auditor/dashboard',
    description: 'Vista de auditoría del sistema'
  }
};

// Jerarquía de acceso: define qué vistas puede acceder cada rol
const VIEW_ACCESS: Record<Role, Role[]> = {
  admin: ['admin', 'supervisor', 'responsable', 'auditor'], // Admin ve TODO
  supervisor: ['supervisor', 'responsable'],
  responsable: ['responsable'], // No puede cambiar de vista
  auditor: ['auditor'], // No puede cambiar de vista
};

/**
 * Obtiene el rol principal del usuario (normalizado)
 */
export function getPrimaryRole(roles: string[]): Role {
  const hierarchy: Role[] = ['admin', 'supervisor', 'responsable', 'auditor'];
  const normalizedRoles = roles.map(r => r.toLowerCase().replace('role_', '') as Role);
  
  for (const role of hierarchy) {
    if (normalizedRoles.includes(role)) {
      return role;
    }
  }
  
  return 'responsable'; // Fallback
}

/**
 * Verifica si un usuario puede cambiar de vista
 */
export function canSwitchView(userRole: Role): boolean {
  const allowedViews = VIEW_ACCESS[userRole];
  return allowedViews.length > 1;
}

/**
 * Obtiene las vistas disponibles para un rol
 */
export function getAvailableViews(userRole: Role): ViewInfo[] {
  const allowedRoles = VIEW_ACCESS[userRole] || [];
  return allowedRoles.map(role => VIEWS[role]);
}

/**
 * Obtiene la vista actualmente seleccionada (guardada en localStorage)
 * Si no hay ninguna guardada, retorna el rol principal del usuario
 */
export function getCurrentView(userRole: Role): Role {
  if (typeof window === 'undefined') return userRole;
  
  try {
    const savedView = localStorage.getItem('selectedView');
    if (savedView) {
      const view = savedView as Role;
      // Verificar que el usuario tenga permiso para esta vista
      if (VIEW_ACCESS[userRole].includes(view)) {
        return view;
      }
    }
  } catch (error) {
    console.error('[ViewSwitcher] Error al leer vista guardada:', error);
  }
  
  return userRole;
}

/**
 * Guarda la vista seleccionada en localStorage
 */
export function setCurrentView(view: Role): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('selectedView', view);
    console.log('[ViewSwitcher] Vista guardada:', view);
  } catch (error) {
    console.error('[ViewSwitcher] Error al guardar vista:', error);
  }
}

/**
 * Limpia la vista seleccionada (útil al hacer logout)
 */
export function clearCurrentView(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem('selectedView');
    console.log('[ViewSwitcher] Vista limpiada');
  } catch (error) {
    console.error('[ViewSwitcher] Error al limpiar vista:', error);
  }
}

/**
 * Cambia a una vista específica (con validación)
 */
export function switchToView(userRole: Role, targetView: Role): boolean {
  const allowedViews = VIEW_ACCESS[userRole];
  
  if (!allowedViews.includes(targetView)) {
    console.warn(`[ViewSwitcher] Usuario ${userRole} no tiene permiso para ver ${targetView}`);
    return false;
  }
  
  setCurrentView(targetView);
  
  // Navegar a la vista
  const viewInfo = VIEWS[targetView];
  if (typeof window !== 'undefined') {
    window.location.href = viewInfo.route;
  }
  
  return true;
}

/**
 * Obtiene la información de una vista
 */
export function getViewInfo(role: Role): ViewInfo {
  return VIEWS[role];
}

/**
 * Valida si un usuario puede acceder a una vista específica
 */
export function canAccessView(userRole: Role, targetView: Role): boolean {
  const allowedViews = VIEW_ACCESS[userRole];
  return allowedViews.includes(targetView);
}

/**
 * Obtiene el dashboard correcto considerando la vista seleccionada
 */
export function getDashboardForUser(userRole: Role): string {
  const currentView = getCurrentView(userRole);
  return VIEWS[currentView].route;
}
