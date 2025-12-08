# Documentación Módulo de Administración

## Descripción General

El módulo de administración ha sido actualizado para incluir las capacidades completas de **Supervisor** y **Auditor**, además de permitir que el **ADMIN** realice **acciones excepcionales** sobre reportes con completa trazabilidad y auditoría.

## Características Principales

### 1. **Acciones Administrativas Excepcionales**

El administrador puede realizar acciones especiales sobre reportes que requieren intervención:

#### Marcar Reporte como Enviado
- Ubicación: Modal `ModalOverrideSubmit`
- Funcionalidad: Permite marcar un reporte como enviado administrativamente cuando el usuario no puede completarlo
- Campos requeridos:
  - Motivo (justificación de la acción)
  - Archivos de evidencia (opcional, máximo 10MB por archivo)
  - Confirmación de responsabilidad
- Proceso:
  1. Validación del motivo (mínimo 10 caracteres)
  2. Subida de archivos con indicador de progreso
  3. Registro automático en tabla `admin_action_log`
  4. Notificación a supervisor y responsable del reporte
  5. Actualización del estado del reporte a `ENVIADO`

#### Subir Evidencia Administrativa
- Permite al admin adjuntar documentos adicionales a un reporte existente
- Registra la acción en el log de auditoría
- Notifica a las partes involucradas

### 2. **Dashboard de Cumplimiento Regulatorio**

Ubicación: `/roles/admin/cumplimiento`

#### KPIs Principales
- **Tasa de cumplimiento general**: Porcentaje de reportes entregados a tiempo
- **Entidades en riesgo**: Entidades con cumplimiento < 80%
- **Reportes vencidos**: Número de reportes fuera de plazo
- **Promedio días de retraso**: Promedio de días de retraso en entregas

#### Pestañas de Visualización

**Pestaña Miembros**
- Lista de usuarios con métricas individuales:
  - Nombre y rol
  - Reportes asignados
  - Reportes completados
  - % Cumplimiento
  - Días promedio de retraso
- Ordenamiento por cualquier columna
- Indicador visual de cumplimiento con código de colores

**Pestaña Entidades**
- Vista agregada por entidad:
  - Nombre de la entidad
  - Total de reportes
  - Reportes completados
  - % Cumplimiento
  - Indicador visual de estado

**Pestaña Timeline**
- Próximamente: Vista de calendario con eventos de cumplimiento

### 3. **Sistema de Auditoría**

Ubicación: `/roles/admin/auditoria`

#### Registro de Acciones
Todas las acciones administrativas excepcionales se registran en la tabla `admin_action_log` con:
- ID de acción (UUID)
- Fecha/hora exacta
- Tipo de acción (`OVERRIDE_SUBMIT`, `ADMIN_UPLOAD`)
- Usuario admin que ejecutó la acción
- Reporte afectado
- Periodo y entidad relacionados
- Motivo/justificación
- Metadata de archivos adjuntos
- Datos adicionales en formato JSON

#### Interfaz de Auditoría

**Filtros Disponibles**
- Por tipo de acción
- Por rango de fechas (desde/hasta)
- Por usuario administrador
- Por entidad

**Estadísticas**
- Total de acciones registradas
- Acciones hoy
- Usuarios activos que han usado acciones admin
- Reportes intervenidos

**Tabla de Acciones**
- Columnas: Fecha, Admin, Acción, Entidad, Reporte, Motivo, Archivos
- Badge con código de colores por tipo de acción
- Botón "Ver detalle" para cada acción
- Paginación completa (prev/next)

**Exportación de Datos**
- Botón "Exportar CSV" para descargar el registro completo
- Incluye todos los registros con filtros aplicados
- Formato compatible con Excel

#### Modal de Detalle de Acción
Componente: `ModalHistorialAcciones`
- Timeline visual con todas las acciones sobre un reporte
- Fecha relativa (ej: "hace 2 horas")
- Iconos diferenciados por tipo de acción
- Información completa de cada intervención

### 4. **Indicadores Visuales de Trazabilidad**

#### Badge de Acción Administrativa
Componente: `BadgeAdminAction`
- Se muestra cuando un reporte fue completado por un admin
- Ícono de escudo con tooltip informativo
- Información mostrada: nombre del admin, motivo, fecha
- Tamaños disponibles: `sm`, `md`, `lg`

#### Integración en Vistas Existentes
Los badges se pueden integrar en:
- Tablas de reportes
- Cards de resumen
- Vista de calendario
- Detalles de reporte

## Arquitectura Técnica

### Servicios Frontend

#### `adminActionsService.ts`
```typescript
// Marcar reporte como enviado
overrideSubmit(request: OverrideSubmitRequest): Promise<AdminActionResponse>

// Listar acciones con paginación
getActions(params?: {
  page?: number;
  size?: number;
  actionType?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<PaginatedResponse<AdminActionSummary>>

// Detalle de una acción
getActionDetail(actionId: string): Promise<AdminActionDetail>

// Acciones de un periodo específico
getActionsByPeriodo(periodoId: string): Promise<AdminActionSummary[]>
```

#### `adminCumplimientoService.ts`
```typescript
// Obtener datos del dashboard
getCumplimiento(filtros?: FiltrosCumplimientoDTO): Promise<AdminCumplimientoDTO>
```

### Tipos TypeScript

Todos los tipos están definidos en `frontend/web/src/types/admin.ts`:

- `OverrideSubmitRequest`: Request para marcar como enviado
- `AdminActionResponse`: Respuesta de acción ejecutada
- `AdminActionSummary`: Resumen de acción para listado
- `AdminActionDetail`: Detalle completo de una acción
- `AdminCumplimientoDTO`: Datos del dashboard de cumplimiento
- `FiltrosCumplimientoDTO`: Filtros para el dashboard
- `PaginatedResponse<T>`: Respuesta paginada genérica

### Componentes Principales

#### Modales
- **ModalOverrideSubmit.tsx**: Marcar reporte como enviado
- **ModalHistorialAcciones.tsx**: Ver timeline de acciones

#### Páginas
- **cumplimiento.astro**: Dashboard regulatorio
- **auditoria.astro**: Registro de auditoría

#### Componentes Cliente
- **AdminCumplimientoClient.tsx**: Dashboard con tabs
- **AdminAuditoriaClient.tsx**: Tabla de auditoría con filtros

#### Componentes Auxiliares
- **BadgeAdminAction.tsx**: Badge visual de trazabilidad

### Estilos

Archivo: `admin-module.css`
- Sistema de diseño consistente con variables CSS
- Animaciones suaves en modales y transiciones
- Responsive design con breakpoints móviles
- Código de colores para estados y tipos de acción

## Endpoints Backend

### Acciones Administrativas
```
POST /api/admin/actions/override-submit
- Body: FormData (motivo, reportePeriodoId, archivos[])
- Autenticación: Role ADMIN
- Response: AdminActionResponse

GET /api/admin/actions
- Query params: page, size, actionType, dateFrom, dateTo
- Response: Page<AdminActionSummary>

GET /api/admin/actions/{id}
- Response: AdminActionDetail

GET /api/admin/actions/periodo/{periodoId}
- Response: List<AdminActionSummary>
```

### Cumplimiento
```
GET /api/admin/cumplimiento
- Query params: entidadId, usuarioId, fechaInicio, fechaFin
- Response: AdminCumplimientoDTO
```

## Base de Datos

### Tabla: `admin_action_log`

```sql
CREATE TABLE admin_action_log (
    id UUID PRIMARY KEY,
    fecha TIMESTAMP NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    admin_id UUID REFERENCES usuario(id),
    reporte_periodo_id UUID REFERENCES reporte_periodo(id),
    reporte_id UUID REFERENCES reporte(id),
    motivo TEXT NOT NULL,
    files_meta JSONB,
    additional_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_admin_action_log_fecha ON admin_action_log(fecha);
CREATE INDEX idx_admin_action_log_admin ON admin_action_log(admin_id);
CREATE INDEX idx_admin_action_log_tipo ON admin_action_log(tipo);
CREATE INDEX idx_admin_action_log_periodo ON admin_action_log(reporte_periodo_id);
```

### Tabla: `notificacion` (actualizada)

Campo añadido:
```sql
ALTER TABLE notificacion ADD COLUMN titulo VARCHAR(255);
UPDATE notificacion SET titulo = 'Notificación' WHERE titulo IS NULL;
ALTER TABLE notificacion ALTER COLUMN titulo SET NOT NULL;
```

## Flujo de Trabajo

### Escenario 1: Marcar Reporte como Enviado

1. **Admin identifica reporte problemático**
   - Puede ser desde dashboard de cumplimiento
   - Desde vista de calendario
   - Desde tabla de reportes pendientes

2. **Admin abre modal de acción**
   - Clic en "Marcar como Enviado"
   - Modal `ModalOverrideSubmit` se presenta

3. **Admin completa el formulario**
   - Escribe motivo detallado (mínimo 10 caracteres)
   - Opcionalmente adjunta archivos de evidencia
   - Marca checkbox de confirmación de responsabilidad

4. **Sistema procesa la acción**
   - Valida datos del formulario
   - Sube archivos a Cloudflare R2
   - Crea registro en `admin_action_log`
   - Actualiza estado del reporte a `ENVIADO`
   - Envía notificaciones a supervisor y responsable
   - Muestra confirmación visual

5. **Auditoría automática**
   - La acción queda registrada permanentemente
   - Visible en `/roles/admin/auditoria`
   - Puede ser exportada a CSV para análisis

### Escenario 2: Revisión de Cumplimiento

1. **Admin accede al dashboard**
   - Navega a `/roles/admin/cumplimiento`
   - Vista inicial muestra KPIs globales

2. **Análisis de métricas**
   - Identifica tasa de cumplimiento general
   - Revisa entidades en riesgo (< 80%)
   - Observa reportes vencidos

3. **Navegación por tabs**
   - Tab "Miembros": Identifica usuarios con bajo cumplimiento
   - Tab "Entidades": Analiza por organización
   - Ordenamiento por cualquier columna

4. **Toma de decisiones**
   - Identifica casos que requieren intervención
   - Puede acceder directamente a reportes específicos
   - Planifica acciones correctivas

### Escenario 3: Auditoría y Reporte

1. **Admin accede a auditoría**
   - Navega a `/roles/admin/auditoria`
   - Ve estadísticas del día

2. **Aplica filtros**
   - Filtra por tipo de acción
   - Selecciona rango de fechas
   - Filtra por entidad o admin específico

3. **Revisa acciones**
   - Tabla muestra todas las intervenciones
   - Clic en "Ver detalle" para información completa
   - Verifica motivos y archivos adjuntos

4. **Exporta datos**
   - Clic en "Exportar CSV"
   - Descarga archivo con todos los registros filtrados
   - Utiliza para reportes de gestión o auditoría externa

## Mejores Prácticas

### Para Administradores

1. **Uso de Acciones Excepcionales**
   - Solo utilizar cuando sea estrictamente necesario
   - Siempre proporcionar motivo detallado y justificado
   - Adjuntar evidencia documental cuando sea posible
   - Recordar que todas las acciones quedan registradas

2. **Monitoreo de Cumplimiento**
   - Revisar dashboard semanalmente
   - Identificar tendencias de incumplimiento
   - Comunicar proactivamente con entidades en riesgo
   - Usar datos para mejorar procesos

3. **Auditoría**
   - Revisar log periódicamente
   - Exportar datos mensualmente para análisis
   - Mantener transparencia en las intervenciones

### Para Desarrolladores

1. **Extensión del Módulo**
   - Nuevas acciones deben registrarse en `admin_action_log`
   - Mantener consistencia en tipos de acción
   - Actualizar badges y códigos de color en CSS
   - Documentar nuevos endpoints

2. **Integración en Vistas Existentes**
   - Importar `BadgeAdminAction` donde se muestren reportes
   - Agregar botones de acción en menús contextuales
   - Integrar `ModalOverrideSubmit` en vistas de detalle
   - Mantener consistencia visual con `admin-module.css`

3. **Testing**
   - Probar flujos completos de acciones excepcionales
   - Verificar notificaciones a usuarios afectados
   - Validar que los registros de auditoría sean correctos
   - Probar exportación CSV con diferentes filtros

## Seguridad

### Control de Acceso
- Todos los endpoints requieren autenticación
- Role `ADMIN` es obligatorio para acciones excepcionales
- Tokens JWT validados en cada request

### Auditoría
- **Inmutabilidad**: Los registros en `admin_action_log` no pueden modificarse
- **Trazabilidad completa**: Quién, qué, cuándo, por qué
- **Persistencia**: Los archivos subidos se almacenan permanentemente en R2

### Validaciones
- Motivo mínimo 10 caracteres
- Archivos máximo 10MB por archivo
- Confirmación explícita de responsabilidad
- Validación de roles en backend

## Próximas Mejoras

- [ ] Tab "Timeline" en dashboard de cumplimiento
- [ ] Gráficos de tendencias en auditoría
- [ ] Notificaciones push para admins sobre vencimientos
- [ ] Filtros avanzados en dashboard de cumplimiento
- [ ] Exportación de dashboard a PDF
- [ ] Integración con calendario para ver acciones admin directamente
- [ ] Dashboard de anomalías y alertas tempranas

## Soporte

Para dudas o problemas con el módulo:
1. Revisar esta documentación
2. Consultar logs de backend en caso de errores
3. Verificar que el usuario tenga el rol `ADMIN`
4. Revisar la consola del navegador para errores frontend

---

**Última actualización**: Enero 2025  
**Versión del módulo**: 1.0.0
