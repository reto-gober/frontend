// Sistema de guardias jerárquicas de roles y redirección por rol

export type Role = 'admin' | 'supervisor' | 'responsable' | 'auditor';

// Jerarquía de acceso: cada rol puede acceder a sus vistas y a las inferiores
const ROLE_HIERARCHY: Record<Role, Role[]> = {
  admin: ['admin', 'supervisor', 'responsable', 'auditor'],
  supervisor: ['supervisor', 'responsable'],
  responsable: ['responsable'],
  auditor: ['auditor'], // Auditor solo ve su vista
};

// Mapeo de roles a sus dashboards
const ROLE_DASHBOARDS: Record<Role, string> = {
  admin: '/roles/admin/dashboard',
  supervisor: '/roles/supervisor/dashboard',
  responsable: '/roles/responsable/dashboard',
  auditor: '/roles/auditor/dashboard',
};

// Fallback si no hay dashboard definido
const FALLBACK_ROUTE = '/login';
const HOME_ROUTE = '/login';

/**
 * Verifica si un usuario con cierto rol puede acceder a una vista de otro rol
 * @param userRole - Rol del usuario actual
 * @param targetRole - Rol de la vista a la que intenta acceder
 * @returns true si tiene permiso, false si no
 */
export function canAccessRole(userRole: string, targetRole: string): boolean {
  const role = userRole.toLowerCase() as Role;
  const target = targetRole.toLowerCase() as Role;
  
  if (!ROLE_HIERARCHY[role]) {
    console.warn(`[RoleGuard] Rol desconocido: ${userRole}`);
    return false;
  }
  
  const hasAccess = ROLE_HIERARCHY[role].includes(target);
  
  console.log(`[RoleGuard] ${userRole} intenta acceder a ${targetRole}: ${hasAccess ? '✅ PERMITIDO' : '❌ DENEGADO'}`);
  
  return hasAccess;
}

/**
 * Obtiene el dashboard correspondiente al rol del usuario
 * @param userRole - Rol del usuario
 * @returns URL del dashboard
 */
export function getDashboardForRole(userRole: string): string {
  const role = userRole.toLowerCase() as Role;
  const dashboard = ROLE_DASHBOARDS[role];
  
  if (!dashboard) {
    console.warn(`[RoleGuard] Dashboard no definido para rol: ${userRole}, redirigiendo a fallback`);
    return FALLBACK_ROUTE;
  }
  
  console.log(`[RoleGuard] Dashboard para ${userRole}: ${dashboard}`);
  return dashboard;
}

/**
 * Obtiene las vistas a las que un usuario puede cambiar (para el selector)
 * @param userRole - Rol del usuario
 * @returns Array de roles disponibles con sus labels y rutas
 */
export function getAvailableViews(userRole: string): Array<{role: Role, label: string, route: string}> {
  const role = userRole.toLowerCase() as Role;
  const allowedRoles = ROLE_HIERARCHY[role] || [];
  
  const roleLabels: Record<Role, string> = {
    admin: 'Administrador',
    supervisor: 'Supervisor',
    responsable: 'Responsable',
    auditor: 'Auditor',
  };
  
  const views = allowedRoles.map(r => ({
    role: r,
    label: roleLabels[r],
    route: ROLE_DASHBOARDS[r],
  }));
  
  console.log(`[RoleGuard] Vistas disponibles para ${userRole}:`, views.map(v => v.label).join(', '));
  
  return views;
}

/**
 * Extrae el rol requerido de una ruta (ej: /roles/supervisor/dashboard → supervisor)
 * @param pathname - Ruta actual
 * @returns Rol extraído o null
 */
export function extractRoleFromPath(pathname: string): Role | null {
  const match = pathname.match(/\/roles\/([^\/]+)/);
  if (match && match[1]) {
    const role = match[1].toLowerCase() as Role;
    if (['admin', 'supervisor', 'responsable', 'auditor'].includes(role)) {
      return role;
    }
  }
  return null;
}

/**
 * Verifica si la ruta actual requiere autenticación de rol
 * @param pathname - Ruta actual
 * @returns true si es una ruta protegida por rol
 */
export function isRoleProtectedRoute(pathname: string): boolean {
  return pathname.startsWith('/roles/');
}

/**
 * Maneja el guardián de ruta: verifica si el usuario puede acceder
 * Si no puede, redirige al dashboard correspondiente
 * Considera la vista seleccionada por el usuario
 * @param pathname - Ruta a la que intenta acceder
 * @param userRole - Rol del usuario actual
 * @returns Objeto con allowed (bool) y redirectTo (string si no permitido)
 */
export function routeGuard(
  pathname: string,
  userRole: string
): { allowed: boolean; redirectTo?: string; reason?: string } {
  
  // Si no es una ruta protegida, permitir acceso
  if (!isRoleProtectedRoute(pathname)) {
    return { allowed: true };
  }
  
  // Extraer el rol requerido de la ruta
  const requiredRole = extractRoleFromPath(pathname);
  
  if (!requiredRole) {
    console.warn(`[RoleGuard] No se pudo extraer rol de la ruta: ${pathname}`);
    return {
      allowed: false,
      redirectTo: getDashboardForRole(userRole),
      reason: 'Ruta inválida',
    };
  }
  
  // Verificar si el rol actual puede acceder a la ruta
  const hasAccess = canAccessRole(userRole, requiredRole);
  
  if (!hasAccess) {
    return {
      allowed: false,
      redirectTo: getDashboardForRole(userRole),
      reason: `No tienes permiso para acceder a la vista ${requiredRole}`,
    };
  }
  
  return { allowed: true };
}

/**
 * Obtiene el rol principal del usuario (el primero o el de mayor jerarquía)
 * @param roles - Array de roles del usuario
 * @returns Rol principal
 */
export function getPrimaryRole(roles: string[]): Role {
  console.log('[getPrimaryRole] Roles recibidos:', roles);
  
  const hierarchy = ['admin', 'supervisor', 'responsable', 'auditor'];
  
  // Normalizar roles: remover prefijo ROLE_ y convertir a minúsculas
  const normalizedRoles = roles.map(r => r.toLowerCase().replace('role_', ''));
  console.log('[getPrimaryRole] Roles normalizados:', normalizedRoles);
  
  for (const role of hierarchy) {
    const found = normalizedRoles.includes(role);
    console.log(`[getPrimaryRole] Buscando '${role}':`, found);
    if (found) {
      console.log(`[getPrimaryRole] ✅ Rol principal encontrado: ${role}`);
      return role as Role;
    }
  }
  
  // Fallback al primer rol normalizado
  const fallbackRole = (normalizedRoles[0] || 'responsable') as Role;
  console.log(`[getPrimaryRole] ⚠️ Usando fallback: ${fallbackRole}`);
  return fallbackRole;
}

/**
 * Maneja la redirección desde 404 según el rol del usuario
 * Evita bucles verificando que la ruta destino existe
 * @param userRole - Rol del usuario
 * @returns URL de redirección segura
 */
export function handle404Redirect(userRole: string): string {
  const dashboard = getDashboardForRole(userRole);
  
  console.log(`[404Handler] Usuario ${userRole} será redirigido a: ${dashboard}`);
  
  return dashboard;
}

/**
 * Valida si un dashboard existe (para evitar bucles 404)
 * @param dashboardPath - Ruta del dashboard
 * @returns Promise<boolean>
 */
export async function validateDashboardExists(dashboardPath: string): Promise<boolean> {
  try {
    const response = await fetch(dashboardPath, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}
