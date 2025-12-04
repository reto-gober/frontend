# Plan de Integración - Páginas Admin con Datos Reales

**Fecha:** 2025-12-04  
**Estado:** En progreso  
**Objetivo:** Convertir todas las páginas `/roles/admin/*` para usar datos reales del backend

---

## ✅ Completado

### 1. Dashboard Admin (`/roles/admin/dashboard.astro`)
- ✅ Componente creado: `AdminDashboardClient.tsx`
- ✅ Endpoints integrados:
  - `dashboardService.dashboardAdmin()`
  - `usuariosService.listar()`
  - `entidadesService.listar()`
- ✅ Datos calculados en tiempo real:
  - KPIs: Usuarios activos, creados, roles modificados
  - Distribución por roles (gráfico de dona)
  - Estado de entidades (activas/inactivas)
  - Actividad administrativa reciente
- ✅ Mantiene diseño original
- ✅ Filtro por periodo funcional (mensual/trimestral/anual)

---

## 📋 Pendiente - Próximas Páginas

### 2. Entidades Admin (`/roles/admin/entidades.astro`)

**Componente a crear:** `AdminEntidadesClient.tsx`

**Endpoints a usar:**
- `GET /api/entidades` - Listar todas
- `POST /api/entidades` - Crear
- `PUT /api/entidades/{id}` - Actualizar
- `DELETE /api/entidades/{id}` - Eliminar
- `GET /api/reportes` - Para calcular reportes por entidad

**Datos a mostrar:**
- Grid de tarjetas de entidades con logo/código
- Estadísticas por entidad:
  - Número de reportes asignados
  - Número de responsables asignados
  - Porcentaje de cumplimiento
- Estado (Activa/Inactiva)
- Acciones: Editar, Ver reportes

**Resumen general:**
- Total de entidades activas
- Total de reportes asignados
- Total de responsables
- Cumplimiento promedio

**Código base:**
```typescript
import { useState, useEffect } from 'react';
import { entidadesService, reportesService } from '../../../lib/services';

export default function AdminEntidadesClient() {
  const [entidades, setEntidades] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    const [entidadesData, reportesData] = await Promise.all([
      entidadesService.listar(0, 100),
      reportesService.listar(0, 1000)
    ]);

    // Agregar reportes por entidad
    const entidadesConStats = entidadesData.content.map(e => {
      const reportesEntidad = reportesData.content.filter(r => r.entidadId === e.entidadId);
      const enviados = reportesEntidad.filter(r => ['ENVIADO', 'COMPLETADO', 'aprobado'].includes(r.estado)).length;
      
      return {
        ...e,
        reportesTotales: reportesEntidad.length,
        cumplimiento: reportesEntidad.length > 0 ? Math.round((enviados / reportesEntidad.length) * 100) : 0
      };
    });

    setEntidades(entidadesConStats);
  };

  // ... resto del componente
}
```

---

### 3. Usuarios Admin (`/roles/admin/usuarios.astro`)

**Componente a crear:** `AdminUsuariosClient.tsx`

**Endpoints a usar:**
- `GET /api/usuarios` - Listar todos
- `GET /api/usuarios/{documentNumber}` - Obtener uno
- `POST /api/auth/registro` - Crear usuario
- `PUT /api/usuarios/{documentNumber}` - Actualizar
- `DELETE /api/usuarios/{documentNumber}` - Eliminar

**Datos a mostrar:**
- Tabla de usuarios con:
  - Avatar (iniciales)
  - Nombre completo
  - Email
  - Rol(es) - badges
  - Entidad asignada
  - Estado (Activo/Inactivo)
  - Último acceso
  - Acciones (Editar, Eliminar)

**Filtros:**
- Por rol (admin, responsable, supervisor, auditor)
- Por estado (activo, inactivo)
- Por entidad
- Búsqueda por nombre/email

**Modal de creación/edición:**
- Formulario completo con todos los campos
- Selector de roles (múltiple)
- Validación de email único

---

### 4. Reportes Admin (`/roles/admin/reportes.astro`)

**Componente a crear:** `AdminReportesClient.tsx`

**Endpoints a usar:**
- `GET /api/reportes` - Listar todos
- `GET /api/reportes/estado/{estado}` - Filtrar por estado
- `GET /api/reportes/entidad/{entidadId}` - Por entidad
- `POST /api/reportes` - Crear
- `PUT /api/reportes/{id}` - Actualizar
- `DELETE /api/reportes/{id}` - Eliminar

**Datos a mostrar:**
- Stats superiores:
  - Total de reportes
  - Pendientes
  - En progreso
  - Enviados
  - Vencidos

- Tabla de reportes:
  - Código
  - Nombre
  - Entidad (badge)
  - Responsable (avatar + nombre)
  - Frecuencia
  - Fecha vencimiento (con indicador de días restantes)
  - Estado (badge con color)
  - Acciones (Ver, Editar, Eliminar)

**Filtros:**
- Por entidad
- Por responsable
- Por frecuencia (mensual, trimestral, semestral, anual)
- Por mes
- Por estado

**Exportación:**
- Botón para exportar a Excel/PDF (futuro)

---

### 5. Evidencias Admin (`/roles/admin/evidencias.astro`)

**Componente a crear:** `AdminEvidenciasClient.tsx`

**Endpoints a usar:**
- `GET /api/evidencias/reporte/{reporteId}` - Por reporte (iterar todos los reportes)
- `GET /api/evidencias/{id}/descargar` - Descargar
- `DELETE /api/evidencias/{id}` - Eliminar

**Datos a mostrar:**
- Stats superiores:
  - Total de archivos
  - Archivos validados
  - Pendientes de revisión
  - Almacenamiento usado (GB)

- Grid de tarjetas de evidencias:
  - Preview del tipo de archivo (icono)
  - Nombre del archivo
  - Código de reporte asociado
  - Tamaño del archivo
  - Estado (badge: validada, pendiente, rechazada)
  - Fecha de subida
  - Acciones (Ver, Descargar, Eliminar)

**Filtros:**
- Por entidad
- Por tipo de archivo (PDF, Excel, Word, Imagen)
- Por estado (validada, pendiente, rechazada)
- Búsqueda por nombre

**Nota:** Como no hay endpoint que liste TODAS las evidencias, hay que:
1. Obtener todos los reportes
2. Para cada reporte, obtener sus evidencias
3. Agregar y mostrar

---

### 6. Calendario Admin (`/roles/admin/calendario.astro`)

**Componente a crear:** `AdminCalendarioClient.tsx`

**Endpoints a usar:**
- `GET /api/flujo-reportes/supervision` - Todos los periodos (supervisor ve todos)
- `GET /api/flujo-reportes/periodos/{id}` - Detalle de periodo

**Datos a mostrar:**
- Calendario mensual visual
- Días con eventos:
  - Indicador de color según estado (pendiente, en progreso, enviado, vencido)
  - Código del reporte
  - Al hacer clic: modal con detalle del periodo

- Vistas:
  - Vista mensual (calendario)
  - Vista semanal (lista de 7 días)
  - Vista de lista (tabla de próximos vencimientos)

- Leyenda de colores:
  - Amarillo: Pendiente
  - Azul: En progreso
  - Verde: Enviado
  - Rojo: Vencido

**Cálculo de eventos:**
```typescript
const eventos = periodos.map(p => ({
  fecha: p.fechaVencimientoCalculada,
  codigo: p.reporteNombre.split(' ')[0], // ej: "SUI-001"
  estado: p.estado,
  periodoId: p.periodoId
}));

// Agrupar por fecha
const eventosPorFecha = eventos.reduce((acc, e) => {
  const fecha = e.fecha.split('T')[0];
  if (!acc[fecha]) acc[fecha] = [];
  acc[fecha].push(e);
  return acc;
}, {});
```

---

## 🔧 Patrón de Implementación

Para cada página, seguir este patrón:

### 1. Crear Componente React Client
```typescript
// web/src/components/admin/AdminXxxClient.tsx
import { useState, useEffect } from 'react';
import { xxxService } from '../../../lib/services';

export default function AdminXxxClient() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const response = await xxxService.listar();
      setData(response.content);
    } catch (err) {
      console.error('Error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error al cargar datos</div>;

  return (
    <div className="xxx-page">
      {/* Mantener HTML del diseño original */}
      {/* Reemplazar datos hardcodeados con {data} */}
    </div>
  );
}
```

### 2. Actualizar Página Astro
```astro
---
// web/src/pages/roles/admin/xxx.astro
import AdminLayout from '../../../layouts/roles/AdminLayout.astro';
import AdminXxxClient from '../../../components/admin/AdminXxxClient';
---

<AdminLayout title="Título">
  <AdminXxxClient client:load />
</AdminLayout>

<style is:global>
  /* Copiar estilos del diseño original */
</style>
```

### 3. Mantener Estilos Originales
- Copiar todo el `<style>` de la página original a `<style is:global>` en Astro
- Asegurar que las clases CSS coincidan
- Mantener la estructura HTML lo más similar posible

---

## 📊 Endpoints del Backend por Página

| Página | Endpoints Principales | Estado |
|--------|----------------------|--------|
| Dashboard | `/api/dashboard/admin`, `/api/usuarios`, `/api/entidades` | ✅ Integrado |
| Entidades | `/api/entidades`, `/api/reportes` | ⏳ Pendiente |
| Usuarios | `/api/usuarios`, `/api/auth/registro` | ⏳ Pendiente |
| Reportes | `/api/reportes`, `/api/reportes/estado/{estado}` | ⏳ Pendiente |
| Evidencias | `/api/evidencias/reporte/{id}` (agregado) | ⏳ Pendiente |
| Calendario | `/api/flujo-reportes/supervision` | ⏳ Pendiente |

---

## ✨ Mejoras Adicionales Recomendadas

1. **Paginación real:**
   - Usar `page` y `size` params
   - Mostrar controles de paginación
   - Total de páginas y elementos

2. **Búsqueda en tiempo real:**
   - Debounce de 300ms
   - Filtrar en frontend o backend según volumen

3. **Estados de carga:**
   - Skeleton loaders para mejor UX
   - Spinners mientras carga
   - Manejo de errores con mensajes claros

4. **Modales funcionales:**
   - Crear/Editar con formularios completos
   - Confirmación de eliminación
   - Validación de campos

5. **Toasts/Notificaciones:**
   - Success al crear/actualizar/eliminar
   - Error con mensaje descriptivo
   - Auto-dismiss después de 3-5 segundos

---

## 🎯 Prioridad de Implementación

1. **Alta prioridad:**
   - ✅ Dashboard (completado)
   - Usuarios (uso frecuente)
   - Reportes (core del sistema)

2. **Media prioridad:**
   - Entidades (configuración inicial)
   - Calendario (visualización)

3. **Baja prioridad:**
   - Evidencias (menos frecuente)

---

## 📝 Checklist por Página

Para cada página, verificar:

- [ ] Componente React Client creado
- [ ] Datos cargados desde API real
- [ ] Loading state implementado
- [ ] Error handling implementado
- [ ] Diseño original mantenido
- [ ] Estilos CSS migrados
- [ ] Filtros funcionales
- [ ] Búsqueda funcional
- [ ] Acciones CRUD funcionales
- [ ] Modales integrados
- [ ] Sin errores de compilación
- [ ] Sin datos dummy hardcodeados

---

## 🚀 Siguiente Paso Inmediato

**Crear `AdminEntidadesClient.tsx`:**

1. Copiar estructura HTML de `entidades.astro`
2. Cargar datos de `entidadesService.listar()`
3. Calcular stats por entidad agregando reportes
4. Implementar modal de crear/editar
5. Implementar acciones (editar, eliminar)
6. Agregar filtros y búsqueda
7. Actualizar `entidades.astro` para usar el componente

**Estimación:** 1-2 horas por página

**Total estimado para completar:** 6-10 horas
