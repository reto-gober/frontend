import { defineMiddleware } from 'astro:middleware';

/**
 * Middleware de Astro para proteger rutas y validar roles
 * Se ejecuta en cada petición antes de renderizar la página
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect } = context;
  const pathname = url.pathname;

  // ============================================
  // RUTAS PÚBLICAS (sin autenticación requerida)
  // ============================================
  const publicRoutes = [
    '/login',
    '/registro',
    '/registro-invitado',
    '/error',
    '/404',
    '/_astro/', // Assets estáticos
    '/favicon.ico',
  ];

  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  if (isPublicRoute) {
    return next();
  }

  // ============================================
  // VERIFICAR AUTENTICACIÓN
  // ============================================
  const token = cookies.get('token')?.value;

  // Si no hay token y no es ruta pública → login
  if (!token && !isPublicRoute) {
    console.log(`[Middleware] Sin token - Redirigiendo a /login desde ${pathname}`);
    return redirect('/login');
  }

  // ============================================
  // VERIFICAR ROLES EN RUTAS PROTEGIDAS
  // ============================================
  // Extraer rol requerido de la ruta (ej: /roles/admin/... → admin)
  const roleMatch = pathname.match(/^\/roles\/([^\/]+)/);

  if (roleMatch) {
    const requiredRole = roleMatch[1]; // admin, supervisor, responsable, auditor

    // Intentar obtener roles del usuario desde cookie (si está disponible)
    const usuarioCookie = cookies.get('usuario')?.value;
    
    // Si no hay cookie de usuario, dejar pasar (el cliente-side manejará la validación)
    if (!usuarioCookie) {
      console.log(`[Middleware] No hay cookie de usuario, delegando validación al cliente`);
      return next();
    }

    try {
      const usuario = JSON.parse(usuarioCookie);
      const userRoles = (usuario.roles || []).map((r: string) => 
        r.toLowerCase().replace('role_', '')
      );

      // Jerarquía de acceso
      const roleHierarchy: Record<string, string[]> = {
        admin: ['admin', 'supervisor', 'responsable', 'auditor'], // Admin accede a TODO
        supervisor: ['supervisor', 'responsable'],
        responsable: ['responsable'],
        auditor: ['auditor'],
      };

      // Obtener el rol principal del usuario
      const hierarchy = ['admin', 'supervisor', 'responsable', 'auditor'];
      let primaryUserRole = 'responsable';
      
      for (const role of hierarchy) {
        if (userRoles.includes(role)) {
          primaryUserRole = role;
          break;
        }
      }

      // Verificar si el usuario puede acceder a la ruta
      // Considerar vista seleccionada si existe
      const allowedRoles = roleHierarchy[primaryUserRole] || [];
      let canAccess = allowedRoles.includes(requiredRole);

      if (!canAccess) {
        console.warn(
          `[Middleware] ${primaryUserRole} intenta acceder a ${requiredRole} - DENEGADO`
        );
        
        // Redirigir al dashboard del usuario (o vista seleccionada)
        let redirectDashboard = `/roles/${primaryUserRole}/dashboard`;
        
        // Si hay una vista seleccionada válida, usar esa
        try {
          const selectedViewCookie = cookies.get('selectedView')?.value;
          if (selectedViewCookie && allowedRoles.includes(selectedViewCookie)) {
            redirectDashboard = `/roles/${selectedViewCookie}/dashboard`;
          }
        } catch (e) {
          // Ignorar errores de cookie
        }
        
        return redirect(redirectDashboard);
      }

      console.log(
        `[Middleware] ${primaryUserRole} accede a ${requiredRole} - PERMITIDO`
      );
    } catch (error) {
      console.error('[Middleware] Error al parsear usuario:', error);
    }
  }

  // ============================================
  // CONTINUAR CON LA PETICIÓN
  // ============================================
  return next();
});
