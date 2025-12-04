# Plan de Implementación - Sistema de Gestión de Reportes con Roles Jerárquicos

## Estado Actual ✅

### Completado

#### 1. Sistema de Autenticación y Contexto
- ✅ **AuthContext** (`src/lib/contexts/AuthContext.tsx`)
  - Login/logout con tokens JWT
  - Carga de configuración desde `/api/config/ui`
  - Gestión de permisos mediante `hasPermission()`
  - **Sistema de roles jerárquicos**:
    - `activeRole`: Rol actual en el que está actuando el usuario
    - `availableRoles`: Lista de roles accesibles según jerarquía
    - `switchRole()`: Cambiar entre roles disponibles
    - `canSwitchTo()`: Verificar acceso a un rol específico
  - Persistencia del rol activo en `localStorage`
  - Jerarquía implementada:
    ```
    admin → [admin, supervisor, responsable]
    supervisor → [supervisor, responsable]
    responsable → [responsable]
    auditor → [auditor]
    ```

#### 2. Tipos TypeScript
- ✅ **auth.ts** - Interfaces para autenticación y configuración de roles
- ✅ **flujo-reportes.ts** - Tipos para el flujo completo de reportes (9 estados)

#### 3. Servicios API
- ✅ **flujoReportesService** (`src/lib/services.ts`)
  - 15+ métodos implementados:
    - Consulta: `misPeriodos()`, `misPeriodosPendientes()`, `misPeríodosCorrecciones()`
    - Acciones: `enviar()`, `corregirReenviar()`, `validar()`, `aprobar()`, `rechazar()`
    - Supervisión: `pendientesValidacion()`, `supervision()`
    - Historial: `obtenerPeriodo()`, `obtenerHistorial()`, `porEstado()`

#### 4. Componentes Comunes
- ✅ **ProtectedRoute** - Protección de rutas con validación de rol activo
- ✅ **ActionButton** - Botones con validación de permisos
- ✅ **Sidebar** - Menú dinámico desde backend con RoleSwitcher integrado
- ✅ **RoleSwitcher** - Selector visual de rol con dropdown
- ✅ **RoleInfo** - Card informativo sobre capacidades del rol actual

#### 5. Componentes de Flujo de Reportes
- ✅ **EstadoBadge** - Badge visual para 9 estados del reporte
- ✅ **DiasHastaVencimiento** - Contador inteligente hasta vencimiento
- ✅ **TarjetaPeriodo** - Card completo para mostrar información del periodo

#### 6. Modales
- ✅ **ModalEnviarReporte** - Envío/corrección con upload de archivos
- ✅ **ModalValidarReporte** - Aprobación/rechazo con comentarios

#### 7. Vistas por Rol
- ✅ **Vista RESPONSABLE** (`/mis-reportes`)
  - Tabs: Todos / Pendientes / Requieren Corrección
  - Paginación
  - Integración con ModalEnviarReporte
  - Estados vacíos contextuales
  
- ✅ **Vista SUPERVISOR** (`/validacion/pendientes`)
  - Tabs: Pendientes / Aprobados / Rechazados
  - Mostrar responsables
  - Integración con ModalValidarReporte
  
- ✅ **Dashboard Dinámico** (`/panel`)
  - Acciones rápidas según rol activo
  - RoleInfo integrado
  - Estadísticas básicas

#### 8. Estilos
- ✅ **global.css** - Estilos completos para modales, toasts, file upload, action buttons

---

## Pendiente por Implementar 🚧

### Fase 1: Integración y Mejoras Core

#### 1.1 Integrar AuthProvider en Páginas Existentes
**Prioridad:** 🔴 Alta  
**Archivos a modificar:**
- `src/pages/reportes/index.astro`
- `src/pages/entidades/index.astro`
- `src/pages/usuarios/index.astro`

**Tareas:**
```markdown
- [ ] Cambiar de `MainLayout.astro` a `MainLayoutReact.astro` en páginas que requieran auth
- [ ] Envolver componentes React con `<ProtectedRoute>`
- [ ] Agregar validación de permisos:
  - `allowedRoles` para restricción por rol activo
  - `requiredPermission` para acciones específicas
```

**Ejemplo de implementación:**
```tsx
// reportes/index.astro
<MainLayoutReact title="Reportes">
  <div id="reportes-root"></div>
</MainLayoutReact>

<script>
  import { createRoot } from 'react-dom/client';
  import { ProtectedRoute } from '../components/common/ProtectedRoute';
  import ReportesPage from '../components/pages/ReportesPage';
  
  const root = createRoot(document.getElementById('reportes-root'));
  root.render(
    <ProtectedRoute requiredPermission="puedeVerReportes">
      <ReportesPage />
    </ProtectedRoute>
  );
</script>
```

#### 1.2 Actualizar ReportesList con Permisos
**Archivos:**
- `src/components/ReportesList.tsx`
- `src/components/ReporteForm.tsx`

**Tareas:**
```markdown
- [ ] Agregar validación de permisos en botones de acción
- [ ] Usar `ActionButton` para crear/editar/eliminar
- [ ] Filtrar opciones según rol activo
- [ ] Mostrar mensaje contextual si no tiene permisos
```

**Ejemplo:**
```tsx
import { ActionButton } from './common/ActionButton';
import { useAuth } from '../lib/contexts/AuthContext';

// En ReportesList:
<ActionButton 
  permiso="puedeCrearReporte"
  className="btn btn-primary"
  onClick={handleCreate}
>
  Nuevo Reporte
</ActionButton>

<ActionButton
  permiso="puedeEditarReporte"
  className="btn btn-secondary"
  onClick={() => handleEdit(reporte.id)}
>
  Editar
</ActionButton>
```

#### 1.3 Crear Página de Login
**Archivo nuevo:** `src/pages/login.astro`

**Tareas:**
```markdown
- [ ] Crear formulario de login con email/password
- [ ] Integrar con AuthContext.login()
- [ ] Redirección automática a /panel después del login
- [ ] Manejo de errores de autenticación
- [ ] Diseño profesional consistente con el sistema
```

---

### Fase 2: Dashboards Específicos por Rol

#### 2.1 Dashboard Responsable
**Archivo nuevo:** `src/components/dashboards/DashboardResponsable.tsx`

**Widgets a implementar:**
```markdown
- [ ] **Reportes Pendientes de Envío**
  - Contador con días hasta vencimiento
  - Lista de próximos 5 reportes a vencer
  - Botón rápido para enviar

- [ ] **Reportes que Requieren Corrección**
  - Contador total
  - Lista con motivos de rechazo
  - Acceso directo a corrección

- [ ] **Estadísticas Personales**
  - Total reportes asignados
  - % de reportes enviados a tiempo
  - % de reportes aprobados en primer intento
  - Gráfico de tendencia mensual

- [ ] **Historial Reciente**
  - Últimas 10 acciones realizadas
  - Timeline visual con estados
```

**Endpoints requeridos:**
```typescript
- GET /api/flujo-reportes/mis-estadisticas
- GET /api/flujo-reportes/mis-acciones-recientes
```

#### 2.2 Dashboard Supervisor
**Archivo nuevo:** `src/components/dashboards/DashboardSupervisor.tsx`

**Widgets a implementar:**
```markdown
- [ ] **Reportes Pendientes de Validación**
  - Contador por estado (enviado_a_tiempo, enviado_tarde)
  - Gráfico de distribución
  - Acceso rápido a validación

- [ ] **Mi Equipo**
  - Lista de responsables asignados
  - Estadísticas por responsable:
    - Reportes pendientes
    - % cumplimiento de plazos
    - Reportes rechazados
  - Filtros por responsable

- [ ] **Métricas de Supervisión**
  - Tiempo promedio de validación
  - % de reportes aprobados vs rechazados
  - Tendencias semanales

- [ ] **Alertas y Notificaciones**
  - Reportes próximos a vencer sin enviar
  - Responsables con bajo desempeño
  - Reportes enviados hoy pendientes de revisión
```

**Endpoints requeridos:**
```typescript
- GET /api/supervision/estadisticas
- GET /api/supervision/mi-equipo
- GET /api/supervision/alertas
```

#### 2.3 Dashboard Admin
**Archivo nuevo:** `src/components/dashboards/DashboardAdmin.tsx`

**Widgets a implementar:**
```markdown
- [ ] **Métricas Globales del Sistema**
  - Total usuarios activos
  - Total entidades
  - Total tipos de reportes
  - Reportes generados este mes

- [ ] **Estado del Sistema**
  - Reportes por estado (gráfico circular)
  - Cumplimiento global de plazos
  - Entidades con más reportes pendientes

- [ ] **Gestión de Usuarios**
  - Últimos usuarios creados
  - Distribución por rol
  - Acceso rápido a gestión

- [ ] **Actividad del Sistema**
  - Acciones recientes de todos los usuarios
  - Bitácora resumida
  - Exportar logs
```

**Endpoints requeridos:**
```typescript
- GET /api/admin/metricas-globales
- GET /api/admin/estado-sistema
- GET /api/admin/actividad-reciente
```

#### 2.4 Dashboard Auditor
**Archivo nuevo:** `src/components/dashboards/DashboardAuditor.tsx`

**Widgets a implementar:**
```markdown
- [ ] **Cumplimiento Normativo**
  - % de reportes entregados a tiempo
  - % de reportes aprobados sin correcciones
  - Entidades con mejor/peor cumplimiento

- [ ] **Bitácora de Auditoría**
  - Filtros por entidad, reporte, usuario, fecha
  - Exportar a Excel/PDF
  - Timeline de cambios

- [ ] **Análisis de Tendencias**
  - Gráficos de cumplimiento histórico
  - Comparativas entre entidades
  - Identificación de patrones

- [ ] **Reportes de Auditoría**
  - Generar reportes predefinidos
  - Reportes personalizados
  - Programar envíos automáticos
```

**Endpoints requeridos:**
```typescript
- GET /api/auditoria/cumplimiento
- GET /api/auditoria/bitacora
- GET /api/auditoria/tendencias
- POST /api/auditoria/generar-reporte
```

---

### Fase 3: Funcionalidades Avanzadas

#### 3.1 Sistema de Notificaciones
**Archivo nuevo:** `src/components/common/NotificationCenter.tsx`

**Tareas:**
```markdown
- [ ] Centro de notificaciones en header
- [ ] Badge con contador de no leídas
- [ ] Tipos de notificación:
  - Reporte próximo a vencer (3 días, 1 día, hoy)
  - Reporte rechazado
  - Reporte aprobado
  - Nueva asignación de reporte
  - Cambio en supervisión
- [ ] Marcar como leída
- [ ] Ver todas las notificaciones
- [ ] Configuración de preferencias de notificaciones
```

**Endpoints:**
```typescript
- GET /api/notificaciones/pendientes
- PUT /api/notificaciones/{id}/marcar-leida
- PUT /api/notificaciones/marcar-todas-leidas
- GET /api/notificaciones/preferencias
- PUT /api/notificaciones/preferencias
```

#### 3.2 Timeline de Historial de Estados
**Archivo nuevo:** `src/components/flujo/TimelineEstados.tsx`

**Tareas:**
```markdown
- [ ] Componente visual de línea de tiempo
- [ ] Mostrar todos los cambios de estado
- [ ] Incluir:
  - Fecha y hora del cambio
  - Estado anterior y nuevo
  - Usuario que realizó el cambio
  - Comentarios asociados
  - Evidencias adjuntadas
- [ ] Diseño vertical con iconos por estado
- [ ] Colores según tipo de cambio
```

#### 3.3 Página de Detalle de Periodo
**Archivo nuevo:** `src/pages/periodos/[id].astro`

**Tareas:**
```markdown
- [ ] Vista completa del periodo seleccionado
- [ ] Información del reporte y entidad
- [ ] Timeline de historial (usar TimelineEstados)
- [ ] Lista de evidencias con preview
- [ ] Comentarios completos
- [ ] Acciones contextuales según rol:
  - Responsable: Enviar/Corregir (si aplica)
  - Supervisor: Validar/Aprobar/Rechazar (si aplica)
  - Admin: Todas las acciones
  - Auditor: Solo lectura
- [ ] Exportar información a PDF
```

#### 3.4 Gestión de Entidades
**Archivo:** `src/components/EntidadesList.tsx` (actualizar)

**Tareas:**
```markdown
- [ ] Envolver con ProtectedRoute (requiredPermission: 'puedeVerEntidades')
- [ ] CRUD completo con validación de permisos
- [ ] Asignación de responsables por entidad
- [ ] Vista de reportes asociados a cada entidad
- [ ] Filtros y búsqueda
- [ ] Importación masiva desde Excel
```

#### 3.5 Gestión de Usuarios
**Archivo:** `src/pages/usuarios/index.astro` (actualizar)

**Tareas:**
```markdown
- [ ] Envolver con ProtectedRoute (allowedRoles: ['admin'])
- [ ] CRUD de usuarios
- [ ] Asignación de roles múltiples
- [ ] Configuración de permisos personalizados
- [ ] Activar/desactivar usuarios
- [ ] Cambio de contraseña
- [ ] Auditoría de acciones del usuario
```

---

### Fase 4: Vistas Específicas del Auditor

#### 4.1 Página de Auditoría
**Archivo nuevo:** `src/pages/auditoria/index.astro`

**Tareas:**
```markdown
- [ ] Vista solo lectura de todos los reportes
- [ ] Filtros avanzados:
  - Por entidad
  - Por tipo de reporte
  - Por estado
  - Por rango de fechas
  - Por responsable
  - Por supervisor
- [ ] Exportar resultados filtrados
- [ ] Drill-down a detalle de periodo
```

#### 4.2 Página de Bitácora
**Archivo nuevo:** `src/pages/bitacora/index.astro`

**Tareas:**
```markdown
- [ ] Registro completo de cambios del sistema
- [ ] Filtros:
  - Por tipo de acción
  - Por usuario
  - Por módulo
  - Por rango de fechas
- [ ] Información detallada:
  - Usuario que realizó la acción
  - Timestamp exacto
  - IP de origen
  - Valores anteriores y nuevos
- [ ] Exportar logs
- [ ] Vista de diferencias (antes/después)
```

#### 4.3 Reportes de Cumplimiento
**Archivo nuevo:** `src/pages/auditoria/reportes.astro`

**Tareas:**
```markdown
- [ ] Generador de reportes personalizados
- [ ] Templates predefinidos:
  - Cumplimiento mensual por entidad
  - Reportes vencidos
  - Responsables con bajo desempeño
  - Tiempos de validación
  - Comparativa entre periodos
- [ ] Exportar a Excel/PDF
- [ ] Programar generación automática
- [ ] Envío por email
```

---

### Fase 5: Optimizaciones y Mejoras

#### 5.1 Performance
```markdown
- [ ] Implementar paginación virtual en listas largas
- [ ] Lazy loading de imágenes/archivos
- [ ] Cache de datos frecuentes (dashboards)
- [ ] Optimizar queries de búsqueda
- [ ] Comprimir evidencias antes de subir
```

#### 5.2 UX/UI
```markdown
- [ ] Agregar skeletons durante carga
- [ ] Transiciones suaves entre estados
- [ ] Drag & drop para subir archivos
- [ ] Preview de archivos adjuntos (PDF, imágenes)
- [ ] Modo oscuro (opcional)
- [ ] Responsive completo (móvil/tablet)
```

#### 5.3 Validaciones
```markdown
- [ ] Validación de formatos de archivo
- [ ] Tamaño máximo de evidencias
- [ ] Validación de fechas (no permitir envíos futuros)
- [ ] Confirmación antes de acciones críticas
- [ ] Mensajes de error claros y accionables
```

#### 5.4 Testing
```markdown
- [ ] Unit tests para AuthContext
- [ ] Unit tests para servicios API
- [ ] Integration tests para flujo completo
- [ ] E2E tests para casos de uso principales
- [ ] Tests de permisos y roles
```

---

## Orden de Implementación Recomendado

### Sprint 1 (1-2 semanas)
1. ✅ Sistema de roles jerárquico (COMPLETADO)
2. Crear página de login
3. Integrar AuthProvider en páginas existentes
4. Actualizar ReportesList/Form con permisos

### Sprint 2 (1-2 semanas)
1. Dashboard Responsable
2. Dashboard Supervisor
3. Sistema de notificaciones básico
4. Timeline de historial

### Sprint 3 (1-2 semanas)
1. Dashboard Admin
2. Dashboard Auditor
3. Página de detalle de periodo
4. Gestión de entidades mejorada

### Sprint 4 (1-2 semanas)
1. Vistas de auditor (auditoría, bitácora, reportes)
2. Gestión de usuarios completa
3. Optimizaciones de performance

### Sprint 5 (1 semana)
1. Mejoras de UX/UI
2. Testing completo
3. Documentación
4. Deploy y capacitación

---

## Archivos Clave del Sistema

### Core
- `src/lib/contexts/AuthContext.tsx` - ✅ Gestión de autenticación y roles
- `src/lib/services.ts` - ✅ Servicios API
- `src/lib/types/auth.ts` - ✅ Tipos de autenticación
- `src/lib/types/flujo-reportes.ts` - ✅ Tipos de flujo de reportes

### Componentes Comunes
- `src/components/common/ProtectedRoute.tsx` - ✅ Protección de rutas
- `src/components/common/Sidebar.tsx` - ✅ Menú con RoleSwitcher
- `src/components/common/RoleSwitcher.tsx` - ✅ Selector de rol
- `src/components/common/RoleInfo.tsx` - ✅ Info del rol activo
- `src/components/common/ActionButton.tsx` - ✅ Botones con permisos

### Vistas por Rol
- `src/pages/mis-reportes/index.astro` - ✅ Vista Responsable
- `src/pages/validacion/pendientes.astro` - ✅ Vista Supervisor
- `src/pages/panel.astro` - ✅ Dashboard dinámico

### Pendientes
- `src/pages/login.astro` - 🚧 Login
- `src/components/dashboards/` - 🚧 Dashboards específicos
- `src/pages/auditoria/` - 🚧 Vistas de auditor
- `src/components/common/NotificationCenter.tsx` - 🚧 Notificaciones

---

## Notas Técnicas

### Sistema de Roles Jerárquico
El sistema permite que usuarios con roles superiores puedan "actuar como" roles inferiores:
- **Admin** puede actuar como: Admin, Supervisor, Responsable
- **Supervisor** puede actuar como: Supervisor, Responsable
- **Responsable** solo: Responsable
- **Auditor** solo: Auditor (sin jerarquía)

Esto se logra mediante:
1. `activeRole` en AuthContext - rol actual
2. `availableRoles` - roles disponibles según jerarquía
3. `switchRole()` - cambiar de rol (recarga la página)
4. ProtectedRoute valida contra `activeRole` en lugar de todos los roles del usuario

### Estados del Flujo de Reportes
1. `pendiente` - Asignado, no iniciado
2. `en_elaboracion` - En proceso de elaboración
3. `enviado_a_tiempo` - Enviado antes del vencimiento
4. `enviado_tarde` - Enviado después del vencimiento
5. `en_revision` - Bajo revisión del supervisor
6. `requiere_correccion` - Rechazado, requiere correcciones
7. `aprobado` - Aprobado por supervisor
8. `rechazado` - Rechazado definitivamente
9. `vencido` - No enviado y pasó la fecha límite

### Endpoints Principales
```
Auth:
- POST /auth/login
- GET /config/ui

Flujo Reportes:
- GET /api/flujo-reportes/mis-periodos
- GET /api/flujo-reportes/mis-periodos/pendientes
- GET /api/flujo-reportes/mis-periodos/correcciones
- POST /api/flujo-reportes/enviar
- POST /api/flujo-reportes/corregir-reenviar
- GET /api/flujo-reportes/pendientes-validacion
- POST /api/flujo-reportes/validar
- POST /api/flujo-reportes/aprobar
- POST /api/flujo-reportes/rechazar
- POST /api/flujo-reportes/solicitar-correccion
- GET /api/flujo-reportes/historial/:periodoId

Evidencias:
- POST /api/evidencias/subir/:periodoId
- GET /api/evidencias/:evidenciaId
- DELETE /api/evidencias/:evidenciaId
```

---

## Métricas de Éxito

### Funcionalidad
- [ ] Todos los roles pueden acceder a sus vistas correctamente
- [ ] El cambio de rol funciona sin errores
- [ ] Los permisos se validan correctamente
- [ ] El flujo completo de reportes funciona end-to-end

### Performance
- [ ] Tiempo de carga inicial < 2s
- [ ] Cambio de rol < 1s
- [ ] Carga de dashboards < 1.5s
- [ ] Upload de archivos con progress bar

### UX
- [ ] Interfaz intuitiva sin necesidad de capacitación extensa
- [ ] Mensajes de error claros
- [ ] Feedback inmediato en acciones
- [ ] Diseño consistente en todas las vistas

---

## Contacto y Soporte

Para dudas sobre la implementación:
1. Revisar este documento
2. Consultar código existente en archivos marcados con ✅
3. Verificar especificaciones originales de la API
4. Documentar decisiones técnicas importantes

---

**Última actualización:** 4 de diciembre de 2025  
**Estado:** Sistema de roles jerárquico implementado y funcional ✅
