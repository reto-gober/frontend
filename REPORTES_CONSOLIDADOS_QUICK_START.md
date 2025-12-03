# Reportes Consolidados - Guía Rápida

## 🚀 Inicio Rápido

### 1. Acceder a la funcionalidad

Navega a: `http://localhost:4321/reportes/consolidados`

### 2. Importar en tu componente

```tsx
import { useReportesConsolidados } from "../lib/hooks/useReportesConsolidados";
import ReporteConsolidadoCard from "../components/ReporteConsolidadoCard";
```

### 3. Usar el hook

```tsx
function MiComponente() {
  const { reportes, loading, error } = useReportesConsolidados();

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {reportes.map((reporte) => (
        <ReporteConsolidadoCard key={reporte.id} reporte={reporte} />
      ))}
    </div>
  );
}
```

---

## 📦 Archivos Creados

### Tipos y Modelos

- `web/src/lib/types/reportes-consolidados.ts` - Interfaces TypeScript

### Servicios

- `web/src/lib/services/reportes-consolidados.service.ts` - Cliente API

### Hooks

- `web/src/lib/hooks/useReportesConsolidados.ts` - Hooks React personalizados

### Utilidades

- `web/src/lib/utils/reportes-utils.ts` - Funciones de formateo y validación

### Componentes

- `web/src/components/ReporteConsolidadoCard.tsx` - Tarjeta individual
- `web/src/components/ReportesConsolidadosList.tsx` - Lista completa con filtros
- `web/src/components/ReporteConsolidadoDetalle.tsx` - Vista de detalle
- `web/src/components/ReportesConsolidadosStats.tsx` - Widget de estadísticas

### Páginas

- `web/src/pages/reportes/consolidados/index.astro` - Página principal
- `web/src/pages/reportes/consolidados/[id].astro` - Página de detalle

### Documentación

- `INTEGRACION_REPORTES_CONSOLIDADOS.md` - Guía completa de integración

---

## 🔧 Funciones Principales

### Servicios API

```typescript
import reportesConsolidadosService from "../lib/services/reportes-consolidados.service";

// Listar todos
const datos = await reportesConsolidadosService.listar(0, 10);

// Obtener por ID
const reporte = await reportesConsolidadosService.obtenerPorId(1);

// Filtrar por estado
const pendientes = await reportesConsolidadosService.filtrarPorEstado(
  "PENDIENTE"
);

// Filtrar por entidad
const reportesEntidad = await reportesConsolidadosService.filtrarPorEntidad(5);

// Filtrar por responsable
const misReportes = await reportesConsolidadosService.filtrarPorResponsable(
  "12345678"
);

// Obtener estadísticas
const stats = await reportesConsolidadosService.obtenerEstadisticas();
```

### Hooks

```typescript
// Hook principal
const {
  reportes, // Array de reportes
  loading, // Estado de carga
  error, // Mensaje de error
  page, // Página actual
  totalPages, // Total de páginas
  cambiarPagina, // Cambiar página
  filtrarPorEstado, // Filtrar por estado
  refrescar, // Recargar datos
} = useReportesConsolidados();

// Hook para detalle
const { reporte, loading, error } = useReporteConsolidado(id);

// Hook para estadísticas
const { estadisticas, loading, error } = useEstadisticasConsolidadas();
```

### Utilidades de Formateo

```typescript
import {
  formatearFecha, // 'dd/MM/yyyy'
  formatearFechaLarga, // '15 de enero de 2024'
  formatearFechaHora, // 'dd/MM/yyyy HH:mm'
  calcularDiasRestantes, // Número de días
  obtenerColorEstado, // ColorEstado
  obtenerMensajeUrgencia, // Mensaje de urgencia
  esUrgente, // boolean
  formatearEstado, // Texto del estado
  obtenerClaseColor, // Clases CSS
  obtenerIniciales, // Iniciales de nombre
} from "../lib/utils/reportes-utils";

// Ejemplos
const fechaFormateada = formatearFecha("2024-01-15T10:30:00");
// → '15/01/2024'

const dias = calcularDiasRestantes("2024-12-31T23:59:59");
// → 30 (ejemplo)

const urgente = esUrgente(2, "PENDIENTE");
// → true (menos de 3 días)

const mensaje = obtenerMensajeUrgencia(1);
// → 'Vence MAÑANA'
```

---

## 🎯 Casos de Uso Comunes

### Caso 1: Mostrar solo reportes urgentes

```tsx
function ReportesUrgentes() {
  const [urgentes, setUrgentes] = useState([]);

  useEffect(() => {
    const cargar = async () => {
      const datos = await reportesConsolidadosService.obtenerUrgentes();
      setUrgentes(datos.content);
    };
    cargar();
  }, []);

  return (
    <div>
      <h2>Reportes Urgentes ({urgentes.length})</h2>
      {urgentes.map((r) => (
        <ReporteConsolidadoCard key={r.id} reporte={r} />
      ))}
    </div>
  );
}
```

### Caso 2: Filtrar por responsable actual

```tsx
function MisReportesAsignados() {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

  const { reportes, loading } = useReportesConsolidados({
    initialFiltros: {
      responsableId: usuario.documentNumber,
    },
  });

  return <div>{/* Mostrar reportes asignados */}</div>;
}
```

### Caso 3: Dashboard personalizado

```tsx
function MiDashboard() {
  const { estadisticas } = useEstadisticasConsolidadas();

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="bg-blue-100 p-4">
        <h3>Total</h3>
        <p className="text-3xl">{estadisticas.total}</p>
      </div>
      <div className="bg-red-100 p-4">
        <h3>Urgentes</h3>
        <p className="text-3xl">{estadisticas.urgentes}</p>
      </div>
      <div className="bg-green-100 p-4">
        <h3>Enviados</h3>
        <p className="text-3xl">{estadisticas.enviados}</p>
      </div>
      <div className="bg-purple-100 p-4">
        <h3>Cumplimiento</h3>
        <p className="text-3xl">{estadisticas.tasaCumplimiento}%</p>
      </div>
    </div>
  );
}
```

### Caso 4: Tabla personalizada

```tsx
function TablaReportes() {
  const { reportes, loading } = useReportesConsolidados();

  if (loading) return <div>Cargando...</div>;

  return (
    <table>
      <thead>
        <tr>
          <th>Título</th>
          <th>Entidad</th>
          <th>Vencimiento</th>
          <th>Estado</th>
          <th>Cumplimiento</th>
        </tr>
      </thead>
      <tbody>
        {reportes.map((r) => (
          <tr key={r.id}>
            <td>{r.titulo}</td>
            <td>{r.entidad.nombre}</td>
            <td>{formatearFecha(r.proximoVencimiento)}</td>
            <td>{formatearEstado(r.estadoGeneral)}</td>
            <td>{r.estadisticas.tasaCumplimiento}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## 📋 Tipos TypeScript

### ReporteConsolidado

```typescript
interface ReporteConsolidado {
  id: number;
  titulo: string;
  descripcion?: string;
  entidad: {
    id: number;
    nombre: string;
    codigo?: string;
  };
  responsables: ResponsableInfo[];
  contactos: ContactoInfo[];
  frecuencia: "MENSUAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL";
  formato: "PDF" | "EXCEL" | "WORD" | "OTRO";
  resolucion?: string;
  proximoVencimiento: string | null;
  diasRestantes: number | null;
  colorEstado: "verde" | "amarillo" | "naranja" | "rojo" | "gris";
  estadoGeneral: "PENDIENTE" | "EN_PROGRESO" | "ENVIADO" | "VENCIDO";
  estadisticas: {
    totalPeriodos: number;
    pendientes: number;
    enProgreso: number;
    enviados: number;
    vencidos: number;
    tasaCumplimiento: number;
  };
  periodos: PeriodoReporte[];
  creadoEn: string;
  actualizadoEn: string;
}
```

---

## 🎨 Estilos y Colores

### Colores de Estado

| Color       | Estado       | Días Restantes | Clase CSS                       |
| ----------- | ------------ | -------------- | ------------------------------- |
| 🟢 Verde    | OK / Enviado | > 7 días       | `bg-green-100 text-green-800`   |
| 🟡 Amarillo | Advertencia  | 4-7 días       | `bg-yellow-100 text-yellow-800` |
| 🟠 Naranja  | Urgente      | 1-3 días       | `bg-orange-100 text-orange-800` |
| 🔴 Rojo     | Vencido      | < 0 días       | `bg-red-100 text-red-800`       |
| ⚪ Gris     | Sin fecha    | null           | `bg-gray-100 text-gray-800`     |

---

## 🔗 Enlaces Útiles

- **Lista de reportes:** `/reportes/consolidados`
- **Detalle:** `/reportes/consolidados/{id}`
- **Documentación completa:** Ver `INTEGRACION_REPORTES_CONSOLIDADOS.md`

---

## ✅ Checklist de Verificación

- [ ] Token JWT válido en localStorage
- [ ] Variable `PUBLIC_API_URL` configurada
- [ ] Backend en ejecución
- [ ] Permisos de usuario correctos
- [ ] Navegación funcionando entre lista y detalle
- [ ] Filtros aplicando correctamente
- [ ] Paginación operativa
- [ ] Colores de estado mostrándose
- [ ] Fechas formateadas en español
- [ ] Manejo de errores visible

---

## 🐛 Depuración

### Ver datos en consola

```typescript
const { reportes } = useReportesConsolidados();

useEffect(() => {
  console.log("Reportes cargados:", reportes);
}, [reportes]);
```

### Verificar token

```javascript
console.log("Token:", localStorage.getItem("token"));
console.log("Usuario:", localStorage.getItem("usuario"));
```

### Probar servicio directamente

```typescript
import reportesConsolidadosService from "../lib/services/reportes-consolidados.service";

// En consola del navegador
const test = async () => {
  try {
    const datos = await reportesConsolidadosService.listar();
    console.log("Datos recibidos:", datos);
  } catch (error) {
    console.error("Error:", error);
  }
};

test();
```

---

**💪 ¡Todo listo para usar reportes consolidados en tu frontend!**
