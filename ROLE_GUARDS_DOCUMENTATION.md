# Sistema de Guardias Jerárquicas de Roles - Documentación

## 📋 Resumen

Sistema completo de control de acceso basado en roles con guardias jerárquicas, redirección inteligente desde errores 404, y selector de vistas para usuarios con permisos elevados.

---

## 🎯 Jerarquía de Roles

### Reglas de Acceso

```
admin → puede acceder a: admin, supervisor, responsable (NO auditor)
supervisor → puede acceder a: supervisor, responsable
responsable → puede acceder solo a: responsable
auditor → puede acceder solo a: auditor
```

### Dashboards por Rol

- **Admin**: `/roles/admin/dashboard`
- **Supervisor**: `/roles/supervisor/dashboard`
- **Responsable**: `/roles/responsable/dashboard`
- **Auditor**: `/roles/auditor/dashboard`

---

## 🛡️ Componentes del Sistema

### 1. roleGuard.ts (`src/lib/roleGuard.ts`)

Librería central con todas las funciones de control de acceso:

- `canAccessRole(userRole, targetRole)` - Verifica si un rol puede acceder a otro
- `getDashboardForRole(userRole)` - Obtiene el dashboard para un rol
- `getAvailableViews(userRole)` - Lista las vistas disponibles para el selector
- `extractRoleFromPath(pathname)` - Extrae el rol de una URL
- `routeGuard(pathname, userRole)` - Valida acceso completo a una ruta
- `getPrimaryRole(roles[])` - Determina el rol principal de un usuario
- `handle404Redirect(userRole)` - Maneja redirección desde 404

### 2. Página 404 Inteligente (`src/pages/404.astro`)

- Lee el usuario del `localStorage`
- Determina su rol principal
- Redirige al dashboard correspondiente
- Evita bucles (si ya está en su dashboard, va a `/login`)
- Logs en consola para debugging

### 3. ViewSelector Component (`src/components/ViewSelector.tsx`)

Selector de vistas para admin y supervisor:

- Solo visible para roles con jerarquía (`admin`, `supervisor`)
- Dropdown con iconos SVG por rol
- Muestra vista actual marcada
- Navega a dashboard seleccionado
- Responsive (oculta texto en móvil)

### 4. Guardias en Layouts

Todos los layouts de roles incluyen script de verificación:

- Valida acceso al cargar la página
- Usa `routeGuard()` para verificar permisos
- Muestra notificación si acceso denegado
- Redirige al dashboard correcto después de 1 segundo

**Layouts actualizados:**
- `AdminLayout.astro` → incluye ViewSelector
- `SupervisorLayout.astro` → incluye ViewSelector
- `ResponsableLayout.astro` → solo guardia (sin selector)
- `AuditorLayout.astro` → solo guardia (sin selector)

### 5. Interceptor API (`src/lib/api.ts`)

Maneja errores 403 del backend:

- Detecta `403 Forbidden`
- Lee rol del usuario
- Redirige a dashboard por rol
- Muestra notificación de acceso denegado
- Fallback a `/login` si no hay usuario

---

## ✅ Criterios de Aceptación

### Test 1: Redirección desde 404

**Escenario**: Usuario supervisor intenta acceder a URL inexistente

**Pasos**:
1. Login como supervisor
2. Navegar a `/ruta-inexistente`

**Resultado esperado**:
- ✅ Consola muestra: `[404] Rol principal: supervisor → Dashboard: /roles/supervisor/dashboard`
- ✅ Redirige a `/roles/supervisor/dashboard`
- ✅ No se produce bucle 404

### Test 2: Guardia Frontend - Acceso Permitido

**Escenario**: Supervisor accede a vista de responsable

**Pasos**:
1. Login como supervisor
2. Usar selector de vistas y elegir "Responsable"
3. O navegar directamente a `/roles/responsable/dashboard`

**Resultado esperado**:
- ✅ Consola muestra: `[RoleGuard] supervisor intenta acceder a responsable: ✅ PERMITIDO`
- ✅ Vista carga normalmente
- ✅ No hay redirección

### Test 3: Guardia Frontend - Acceso Denegado

**Escenario**: Responsable intenta acceder a vista de supervisor

**Pasos**:
1. Login como responsable
2. Navegar manualmente a `/roles/supervisor/dashboard`

**Resultado esperado**:
- ✅ Consola muestra: `[RoleGuard] responsable intenta acceder a supervisor: ❌ DENEGADO`
- ✅ Aparece notificación: "Acceso Denegado - No tienes permiso para acceder a la vista supervisor"
- ✅ Después de 1 segundo redirige a `/roles/responsable/dashboard`

### Test 4: Selector de Vistas Admin

**Escenario**: Admin ve y usa el selector de vistas

**Pasos**:
1. Login como admin
2. Observar header superior

**Resultado esperado**:
- ✅ Selector de vistas visible con icono de grid
- ✅ Al hacer clic muestra dropdown con:
  - Administrador ✓ (marcado si está activo)
  - Supervisor
  - Responsable
- ✅ **NO** muestra opción "Auditor"
- ✅ Al seleccionar "Supervisor" navega a `/roles/supervisor/dashboard`

### Test 5: Selector de Vistas Supervisor

**Escenario**: Supervisor ve opciones limitadas

**Pasos**:
1. Login como supervisor
2. Abrir selector de vistas

**Resultado esperado**:
- ✅ Muestra solo:
  - Supervisor ✓
  - Responsable
- ✅ **NO** muestra Admin ni Auditor

### Test 6: Selector No Visible para Responsable

**Escenario**: Responsable no debe ver selector

**Pasos**:
1. Login como responsable
2. Observar header

**Resultado esperado**:
- ✅ Selector de vistas NO aparece
- ✅ Solo ve su propio dashboard

### Test 7: Backend 403 Handling

**Escenario**: Backend rechaza petición con 403

**Pasos**:
1. Login como responsable
2. Mediante DevTools o manipulación, intentar acceder a endpoint de supervisor
3. Backend responde 403

**Resultado esperado**:
- ✅ Interceptor detecta 403
- ✅ Consola muestra: `[API Interceptor] Acceso denegado (403)`
- ✅ Notificación: "Acceso Denegado - No tienes permiso para acceder a este recurso"
- ✅ Redirige a `/roles/responsable/dashboard`

### Test 8: Admin NO puede ver Auditor

**Escenario**: Admin intenta acceder a vista de auditor

**Pasos**:
1. Login como admin
2. Navegar manualmente a `/roles/auditor/dashboard`

**Resultado esperado**:
- ✅ Consola muestra: `[RoleGuard] admin intenta acceder a auditor: ❌ DENEGADO`
- ✅ Notificación de acceso denegado
- ✅ Redirige a `/roles/admin/dashboard`

### Test 9: Evitar Bucles 404

**Escenario**: Usuario en su dashboard intenta acceder a ruta inexistente en su contexto

**Pasos**:
1. Login como supervisor
2. Navegar a `/roles/supervisor/ruta-inexistente`

**Resultado esperado**:
- ✅ 404 detecta que ya está en contexto de supervisor
- ✅ Consola muestra: `[404] Redirigiendo a: /roles/supervisor/dashboard`
- ✅ Si el dashboard no existe (caso extremo), redirige a `/login`

### Test 10: Usuario Sin Autenticación

**Escenario**: Usuario no logueado accede a ruta protegida

**Pasos**:
1. Sin hacer login, navegar a `/roles/admin/dashboard`

**Resultado esperado**:
- ✅ Guardia detecta ausencia de usuario en localStorage
- ✅ Redirige inmediatamente a `/login`

---

## 🔧 Uso en Código

### Ejemplo 1: Verificar acceso en componente

```typescript
import { canAccessRole, getPrimaryRole } from '../lib/roleGuard';

const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
const primaryRole = getPrimaryRole(usuario.roles);

if (canAccessRole(primaryRole, 'supervisor')) {
  // Usuario puede ver datos de supervisor
  cargarDatosSupervisor();
}
```

### Ejemplo 2: Obtener vistas para selector

```typescript
import { getAvailableViews } from '../lib/roleGuard';

const views = getAvailableViews('admin');
// views = [
//   { role: 'admin', label: 'Administrador', route: '/roles/admin/dashboard' },
//   { role: 'supervisor', label: 'Supervisor', route: '/roles/supervisor/dashboard' },
//   { role: 'responsable', label: 'Responsable', route: '/roles/responsable/dashboard' }
// ]
```

### Ejemplo 3: Verificar ruta actual

```typescript
import { routeGuard, getPrimaryRole } from '../lib/roleGuard';

const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
const primaryRole = getPrimaryRole(usuario.roles);
const currentPath = window.location.pathname;

const result = routeGuard(currentPath, primaryRole);

if (!result.allowed) {
  console.warn(result.reason);
  window.location.href = result.redirectTo;
}
```

---

## 📊 Logs de Debugging

Todos los componentes incluyen logs en consola:

```
[404] Usuario encontrado: admin@example.com Roles: ['admin']
[404] Rol principal: admin → Dashboard: /roles/admin/dashboard
[404] Redirigiendo a: /roles/admin/dashboard

[RoleGuard] Verificando acceso: {primaryRole: 'admin', currentPath: '/roles/supervisor/dashboard'}
[RoleGuard] admin intenta acceder a supervisor: ✅ PERMITIDO
[RoleGuard] ✅ Acceso permitido

[ViewSelector] Vistas disponibles para admin: Administrador, Supervisor, Responsable
[ViewSelector] Cambiando a vista: Supervisor

[API Interceptor] Acceso denegado (403) - Redirigiendo al dashboard por rol
```

---

## 🚀 Despliegue y Testing

### Checklist antes de producción

- [ ] Compilar y verificar que no hay errores de TypeScript
- [ ] Probar los 10 criterios de aceptación
- [ ] Verificar logs en consola para cada escenario
- [ ] Probar en diferentes navegadores (Chrome, Firefox, Safari)
- [ ] Probar en móvil (selector responsive)
- [ ] Verificar que backend tiene endpoints con validación de roles
- [ ] Confirmar que backend responde 403 para accesos no autorizados

### Comando para compilar

```bash
npm run build
```

### Testing manual rápido

1. Login como cada rol
2. Intentar acceder a rutas no permitidas
3. Usar selector de vistas (admin/supervisor)
4. Navegar a `/ruta-inexistente`
5. Verificar consola en cada paso

---

## 🔒 Seguridad

### Importante

⚠️ **Este sistema es solo para UX**. La seguridad real debe estar en el backend:

- Backend debe validar roles en CADA endpoint
- Backend debe responder 403 para accesos no autorizados
- No confiar solo en validación del cliente
- Token JWT debe incluir roles y ser validado en servidor

### Backend debe implementar

```java
@PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
@GetMapping("/api/supervisor/data")
public ResponseEntity<?> getSupervisorData() {
    // ...
}
```

---

## 📝 Mantenimiento

### Agregar nuevo rol

1. Actualizar `ROLE_HIERARCHY` en `roleGuard.ts`
2. Agregar dashboard en `ROLE_DASHBOARDS`
3. Crear nuevo Layout (ej: `NuevoRolLayout.astro`)
4. Agregar icono SVG en `ViewSelector.tsx`
5. Actualizar este documento

### Cambiar jerarquía

Editar `ROLE_HIERARCHY` en `src/lib/roleGuard.ts`:

```typescript
const ROLE_HIERARCHY: Record<Role, Role[]> = {
  admin: ['admin', 'supervisor', 'responsable', 'auditor'], // Si admin puede ver auditor
  // ...
};
```

---

## 🐛 Troubleshooting

### Problema: Bucle 404 infinito

**Causa**: Dashboard no existe o Layout tiene error
**Solución**: Verificar que `/roles/{role}/dashboard.astro` existe y compila

### Problema: Selector no aparece

**Causa**: Rol no es admin o supervisor
**Solución**: Verificar que `usuario.roles` incluye 'admin' o 'supervisor'

### Problema: Guardia no redirige

**Causa**: Script no se ejecuta
**Solución**: Verificar que Layout incluye el script de guardia y que roleGuard.ts está compilado

### Problema: 403 no maneja redirección

**Causa**: roleGuard no se importa correctamente
**Solución**: Verificar que `await import('./roleGuard')` funciona en api.ts

---

## 📚 Referencias

- Arquitectura basada en jerarquía de roles
- Inspirado en RBAC (Role-Based Access Control)
- Compatible con JWT y OAuth2
- Sigue principios de "fail-secure" (por defecto denegar acceso)

---

**Versión**: 1.0  
**Fecha**: Diciembre 2025  
**Autor**: Sistema Llanogas
