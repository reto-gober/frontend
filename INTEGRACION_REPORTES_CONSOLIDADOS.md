# Guía de Integración: Reportes Consolidados Frontend

## 📋 Índice

1. [Resumen](#resumen)
2. [Estructura de Archivos](#estructura-de-archivos)
3. [Configuración Inicial](#configuración-inicial)
4. [Integración con el Router](#integración-con-el-router)
5. [Integración con el Dashboard](#integración-con-el-dashboard)
6. [Uso de Servicios y Hooks](#uso-de-servicios-y-hooks)
7. [Ejemplos de Implementación](#ejemplos-de-implementación)
8. [Manejo de Errores](#manejo-de-errores)
9. [Personalización](#personalización)

---

## 📝 Resumen

Esta guía documenta la implementación completa del frontend para consumir y visualizar **reportes consolidados** desde el endpoint `/api/reportes/consolidados`. La solución incluye:

- ✅ Servicios API completos con tipado TypeScript
- ✅ Hooks personalizados para gestión de estado
- ✅ Componentes React reutilizables
- ✅ Páginas Astro integradas
- ✅ Utilidades de formateo y validación
- ✅ Manejo robusto de errores y estados de carga

---

## 📁 Estructura de Archivos

```
web/src/
├── lib/
│   ├── types/
│   │   └── reportes-consolidados.ts          # Interfaces y tipos TypeScript
│   ├── services/
│   │   └── reportes-consolidados.service.ts  # Servicios API
│   ├── hooks/
│   │   └── useReportesConsolidados.ts        # Hooks personalizados
│   └── utils/
│       └── reportes-utils.ts                 # Utilidades de formateo
├── components/
│   ├── ReporteConsolidadoCard.tsx            # Tarjeta individual
│   ├── ReportesConsolidadosList.tsx          # Lista con filtros
│   ├── ReporteConsolidadoDetalle.tsx         # Vista de detalle
│   └── ReportesConsolidadosStats.tsx         # Widget de estadísticas
└── pages/
    └── reportes/
        └── consolidados/
            ├── index.astro                    # Página principal
            └── [id].astro                     # Página de detalle
```

---

## ⚙️ Configuración Inicial

### 1. Verificar Dependencias

Asegúrate de tener instaladas las siguientes dependencias en `package.json`:

```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "date-fns": "^3.0.0",
    "lucide-react": "^0.300.0"
  }
}
```

### 2. Configurar Variable de Entorno

En tu archivo `.env` o configuración de Astro:

```env
PUBLIC_API_URL=http://localhost:8080
```

### 3. Verificar Configuración de API

El archivo `web/src/lib/api.ts` ya está configurado con:

- Interceptor de autenticación (JWT)
- Manejo automático de errores 401
- Redirección a login en caso de sesión expirada

---

## 🔗 Integración con el Router

### Rutas Disponibles

Las páginas ya están creadas en la estructura de Astro:

| Ruta                          | Archivo                                   | Descripción                      |
| ----------------------------- | ----------------------------------------- | -------------------------------- |
| `/reportes/consolidados`      | `pages/reportes/consolidados/index.astro` | Lista de reportes consolidados   |
| `/reportes/consolidados/[id]` | `pages/reportes/consolidados/[id].astro`  | Detalle de un reporte específico |

### Agregar Enlaces en el Menú de Navegación

**Opción 1: En el Layout Principal**

Edita `web/src/layouts/MainLayout.astro` para agregar un enlace:

```astro
<nav>
  <!-- Enlaces existentes -->
  <a href="/dashboard">Dashboard</a>
  <a href="/reportes">Reportes</a>

  <!-- NUEVO enlace -->
  <a href="/reportes/consolidados">Reportes Consolidados</a>

  <a href="/entidades">Entidades</a>
  <a href="/usuarios">Usuarios</a>
</nav>
```

**Opción 2: Como submenú de Reportes**

Si quieres un menú desplegable:

```astro
<div class="dropdown">
  <button>Reportes ▼</button>
  <div class="dropdown-content">
    <a href="/reportes">Reportes Individuales</a>
    <a href="/reportes/consolidados">Reportes Consolidados</a>
    <a href="/reportes/nuevo">Nuevo Reporte</a>
  </div>
</div>
```

---

## 📊 Integración con el Dashboard

### Agregar Widget de Estadísticas

Edita `web/src/pages/dashboard.astro`:

```astro
---
import MainLayout from '../layouts/MainLayout.astro';
import DashboardStats from '../components/DashboardStats';
// NUEVO import
import ReportesConsolidadosStats from '../components/ReportesConsolidadosStats';
---

<MainLayout title="Dashboard">
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-6">Dashboard</h1>

    <!-- Estadísticas generales existentes -->
    <div id="dashboard-stats-root"></div>

    <!-- NUEVO: Estadísticas de reportes consolidados -->
    <div class="mt-6">
      <div id="reportes-consolidados-stats-root"></div>
    </div>
  </div>
</MainLayout>

<script>
  import { createRoot } from 'react-dom/client';
  import { createElement } from 'react';
  import DashboardStats from '../components/DashboardStats';
  import ReportesConsolidadosStats from '../components/ReportesConsolidadosStats';

  // Stats generales
  const dashboardContainer = document.getElementById('dashboard-stats-root');
  if (dashboardContainer) {
    const root = createRoot(dashboardContainer);
    root.render(createElement(DashboardStats));
  }

  // NUEVO: Stats de reportes consolidados
  const consolidadosContainer = document.getElementById('reportes-consolidados-stats-root');
  if (consolidadosContainer) {
    const root = createRoot(consolidadosContainer);
    root.render(createElement(ReportesConsolidadosStats));
  }
</script>
```

---

## 🛠️ Uso de Servicios y Hooks

### Servicio API

**Importación:**

```typescript
import reportesConsolidadosService from "../lib/services/reportes-consolidados.service";
```

**Métodos disponibles:**

```typescript
// Listar todos (paginado)
const page = await reportesConsolidadosService.listar(
  0,
  10,
  "proximoVencimiento,asc"
);

// Obtener por ID
const reporte = await reportesConsolidadosService.obtenerPorId(123);

// Filtrar por estado
const pendientes = await reportesConsolidadosService.filtrarPorEstado(
  "PENDIENTE",
  0,
  10
);

// Filtrar por entidad
const entidadReportes = await reportesConsolidadosService.filtrarPorEntidad(
  5,
  0,
  10
);

// Filtrar por responsable
const misReportes = await reportesConsolidadosService.filtrarPorResponsable(
  "12345678",
  0,
  10
);

// Obtener urgentes
const urgentes = await reportesConsolidadosService.obtenerUrgentes(0, 20);

// Obtener estadísticas
const stats = await reportesConsolidadosService.obtenerEstadisticas();
```

### Hook useReportesConsolidados

**Uso básico:**

```typescript
import { useReportesConsolidados } from "../lib/hooks/useReportesConsolidados";

function MiComponente() {
  const {
    reportes, // Lista de reportes
    loading, // Estado de carga
    error, // Mensaje de error
    page, // Página actual
    totalPages, // Total de páginas
    cambiarPagina, // Función para cambiar página
    filtrarPorEstado, // Función para filtrar
    refrescar, // Función para recargar
  } = useReportesConsolidados({
    autoLoad: true,
    initialSize: 10,
  });

  // Usar el estado...
}
```

**Uso avanzado con filtros:**

```typescript
const {
  reportes,
  loading,
  filtrarPorEstado,
  filtrarPorEntidad,
  limpiarFiltros,
} = useReportesConsolidados();

// Filtrar por estado
const handleFiltrarPendientes = () => {
  filtrarPorEstado("PENDIENTE");
};

// Filtrar por entidad
const handleFiltrarEntidad = (id: number) => {
  filtrarPorEntidad(id);
};

// Limpiar filtros
const handleLimpiar = () => {
  limpiarFiltros();
};
```

### Hook useReporteConsolidado (para detalles)

```typescript
import { useReporteConsolidado } from "../lib/hooks/useReportesConsolidados";

function DetalleComponente({ id }: { id: number }) {
  const { reporte, loading, error, refrescar } = useReporteConsolidado(id);

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!reporte) return <div>No encontrado</div>;

  return (
    <div>
      <h1>{reporte.titulo}</h1>
      <button onClick={refrescar}>Refrescar</button>
    </div>
  );
}
```

### Hook useEstadisticasConsolidadas

```typescript
import { useEstadisticasConsolidadas } from "../lib/hooks/useReportesConsolidados";

function EstadisticasWidget() {
  const { estadisticas, loading, error } = useEstadisticasConsolidadas();

  return (
    <div>
      <p>Total: {estadisticas.total}</p>
      <p>Urgentes: {estadisticas.urgentes}</p>
      <p>Cumplimiento: {estadisticas.tasaCumplimiento}%</p>
    </div>
  );
}
```

---

## 💡 Ejemplos de Implementación

### Ejemplo 1: Crear una página personalizada

```astro
---
// src/pages/mis-reportes.astro
import MainLayout from '../layouts/MainLayout.astro';
---

<MainLayout title="Mis Reportes">
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-4">Mis Reportes Asignados</h1>
    <div id="mis-reportes-root"></div>
  </div>
</MainLayout>

<script>
  import { createRoot } from 'react-dom/client';
  import { createElement } from 'react';
  import MisReportesComponente from '../components/MisReportesComponente';

  const container = document.getElementById('mis-reportes-root');
  if (container) {
    const root = createRoot(container);
    root.render(createElement(MisReportesComponente));
  }
</script>
```

```tsx
// src/components/MisReportesComponente.tsx
import { useReportesConsolidados } from "../lib/hooks/useReportesConsolidados";
import ReporteConsolidadoCard from "./ReporteConsolidadoCard";

export default function MisReportesComponente() {
  // Obtener el usuario actual del localStorage
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

  const { reportes, loading, error } = useReportesConsolidados({
    autoLoad: true,
    initialFiltros: {
      responsableId: usuario.documentNumber,
    },
  });

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {reportes.map((reporte) => (
        <ReporteConsolidadoCard
          key={reporte.id}
          reporte={reporte}
          onClick={(id) =>
            (window.location.href = `/reportes/consolidados/${id}`)
          }
        />
      ))}
    </div>
  );
}
```

### Ejemplo 2: Integrar tarjetas en otra vista

```tsx
import ReporteConsolidadoCard from "./ReporteConsolidadoCard";
import type { ReporteConsolidado } from "../lib/types/reportes-consolidados";

function MiVista() {
  const reportes: ReporteConsolidado[] = [
    /* ... */
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {reportes.map((reporte) => (
        <ReporteConsolidadoCard
          key={reporte.id}
          reporte={reporte}
          onClick={(id) => console.log("Ver detalle:", id)}
        />
      ))}
    </div>
  );
}
```

### Ejemplo 3: Usar utilidades de formateo

```tsx
import {
  formatearFecha,
  formatearFechaLarga,
  calcularDiasRestantes,
  obtenerColorEstado,
  obtenerMensajeUrgencia,
  esUrgente,
} from "../lib/utils/reportes-utils";

function ComponentePersonalizado({ reporte }) {
  const diasRestantes = calcularDiasRestantes(reporte.proximoVencimiento);
  const color = obtenerColorEstado(diasRestantes, reporte.estadoGeneral);
  const mensaje = obtenerMensajeUrgencia(diasRestantes);
  const urgencia = esUrgente(diasRestantes, reporte.estadoGeneral);

  return (
    <div className={urgencia ? "border-red-500" : ""}>
      <h3>{reporte.titulo}</h3>
      <p>{formatearFechaLarga(reporte.proximoVencimiento)}</p>
      <span className={obtenerClaseColor(color)}>{mensaje}</span>
    </div>
  );
}
```

---

## ⚠️ Manejo de Errores

### Errores de Autenticación

El sistema maneja automáticamente errores 401:

```typescript
// En api.ts - ya configurado
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
```

### Errores en Componentes

Los hooks ya manejan errores:

```tsx
const { reportes, loading, error } = useReportesConsolidados();

if (error) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <AlertCircle className="w-5 h-5 text-red-600" />
      <p className="text-red-700">{error}</p>
    </div>
  );
}
```

### Manejo de Datos Nulos

Las utilidades manejan valores null de forma segura:

```typescript
// Estas funciones retornan valores seguros cuando reciben null
formatearFecha(null); // 'Sin fecha'
calcularDiasRestantes(null); // null
obtenerMensajeUrgencia(null); // null
```

---

## 🎨 Personalización

### Cambiar Colores de Estado

Edita `web/src/lib/utils/reportes-utils.ts`:

```typescript
export function obtenerClaseColor(color: ColorEstado): string {
  const colores: Record<ColorEstado, string> = {
    verde: "bg-green-100 text-green-800 border-green-300",
    amarillo: "bg-yellow-100 text-yellow-800 border-yellow-300",
    naranja: "bg-orange-100 text-orange-800 border-orange-300",
    rojo: "bg-red-100 text-red-800 border-red-300",
    gris: "bg-gray-100 text-gray-800 border-gray-300",
  };
  return colores[color] || colores.gris;
}
```

### Cambiar Tamaño de Página por Defecto

En los componentes:

```tsx
const { reportes } = useReportesConsolidados({
  initialSize: 20, // Cambiar de 10 a 20
});
```

### Personalizar Ordenamiento por Defecto

```tsx
const { reportes } = useReportesConsolidados({
  initialSort: "titulo,asc", // Ordenar por título
});
```

### Agregar Campos Personalizados

Si el backend agrega nuevos campos:

1. Actualiza las interfaces en `types/reportes-consolidados.ts`
2. Ajusta los componentes para mostrar los nuevos datos
3. Actualiza las utilidades si es necesario

---

## 🔒 Seguridad

### Token JWT

El token se almacena en `localStorage` y se envía automáticamente en cada petición:

```typescript
// Ya configurado en api.ts
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Validación de Permisos

Para restringir acceso según roles:

```tsx
function ComponenteProtegido() {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

  if (!usuario.roles?.includes("ADMIN")) {
    return <div>No tienes permisos para ver esta sección</div>;
  }

  // Contenido protegido...
}
```

---

## 📚 Referencia Rápida de APIs

### Endpoints del Backend

| Método | Endpoint                                                 | Descripción                         |
| ------ | -------------------------------------------------------- | ----------------------------------- |
| GET    | `/api/reportes/consolidados`                             | Lista todos los reportes (paginado) |
| GET    | `/api/reportes/consolidados/{id}`                        | Obtiene un reporte por ID           |
| GET    | `/api/reportes/consolidados/estado/{estado}`             | Filtra por estado                   |
| GET    | `/api/reportes/consolidados/entidad/{entidadId}`         | Filtra por entidad                  |
| GET    | `/api/reportes/consolidados/responsable/{responsableId}` | Filtra por responsable              |

### Parámetros de Query

| Parámetro | Tipo   | Default                  | Descripción                  |
| --------- | ------ | ------------------------ | ---------------------------- |
| `page`    | number | 0                        | Número de página (0-indexed) |
| `size`    | number | 10                       | Tamaño de página             |
| `sort`    | string | `proximoVencimiento,asc` | Campo de ordenamiento        |

### Estados Disponibles

- `PENDIENTE`
- `EN_PROGRESO`
- `ENVIADO`
- `VENCIDO`

---

## ✅ Checklist de Integración

- [ ] Verificar dependencias instaladas
- [ ] Configurar variable de entorno `PUBLIC_API_URL`
- [ ] Agregar enlaces en el menú de navegación
- [ ] Integrar widget de estadísticas en el dashboard (opcional)
- [ ] Probar navegación entre lista y detalle
- [ ] Verificar filtros y paginación
- [ ] Confirmar manejo de errores 401
- [ ] Validar formato de fechas y colores de estado
- [ ] Probar en diferentes roles de usuario
- [ ] Verificar responsividad en móviles

---

## 🆘 Solución de Problemas

### Problema: "Cannot find module"

**Solución:** Verificar que todas las rutas de importación sean correctas y los archivos existan.

### Problema: Error 404 en las rutas

**Solución:** Verificar que las páginas Astro estén en la ubicación correcta en `pages/`.

### Problema: No se muestran los datos

**Solución:**

1. Verificar que `PUBLIC_API_URL` esté configurado
2. Verificar que el token JWT sea válido
3. Revisar la consola del navegador para errores

### Problema: Fechas mal formateadas

**Solución:** Verificar que el backend envíe fechas en formato ISO 8601.

### Problema: "401 Unauthorized"

**Solución:**

1. Verificar que haya un token válido en localStorage
2. Iniciar sesión nuevamente
3. Verificar que el backend acepte el token

---

## 📞 Soporte

Para más información sobre la implementación del backend, consulta la documentación del API en:

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- API Docs: `http://localhost:8080/v3/api-docs`

---

**✨ ¡Implementación completa y lista para usar!**
