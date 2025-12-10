# Sistema de Guías Interactivas - Manual del Responsable

## 📚 Descripción General

El sistema de guías interactivas utiliza driver.js para crear tours paso a paso que ayudan a los usuarios a familiarizarse con las funcionalidades del sistema.

## 🎯 Arquitectura

### Componentes principales:

1. **`responsableManual.ts`**: Configuración y registro de tours
2. **`ManualIndexPanel.tsx`**: Panel flotante con índice de guías
3. **`SidebarResponsable.tsx`**: Integración del botón "?" y gestión de guías

## ✨ Características

- ✅ Botones en español ("Anterior", "Siguiente")
- ✅ **Indicador de progreso en español** ("1 de 5", "2 de 5", etc.)
- ✅ Estilo amarillo (#F4C453) para botón "Siguiente"
- ✅ Panel de índice modular y extensible
- ✅ Diseño coherente con el rol responsable
- ✅ Cierre automático con ESC o clic fuera
- ✅ Animaciones suaves
- ✅ **Navegación automática** entre páginas
- ✅ **Scroll automático** a elementos no visibles
- ✅ **Sistema de tours pendientes** con sessionStorage
- ✅ **Detección inteligente** de visibilidad de elementos

## 🚀 Cómo agregar una nueva guía

### Paso 1: Registrar el tour en `responsableManual.ts`

```typescript
const registerMiNuevoTour = () => {
  responsableManualSingleton.registerTour({
    tourId: "tour-mi-funcionalidad",
    sections: [
      {
        id: "seccion-principal",
        label: "Mi Funcionalidad",
        steps: [
          {
            element: ".selector-css-del-elemento",
            popover: {
              title: "Título del paso",
              description: "Descripción breve y clara.",
              side: "bottom", // "top", "right", "left", "bottom"
            },
          },
          // Más pasos...
        ],
      },
    ],
  });
};

// Registrar al final del archivo
registerMiNuevoTour();
```

### Paso 2: Agregar la guía al índice en `SidebarResponsable.tsx`

```typescript
const availableGuides: GuideItem[] = [
  {
    id: "tour-sidebar",
    name: "Guía del menú lateral",
    description: "Conoce las opciones de navegación y el badge de alertas.",
    onStart: () => manual.startTour({ tourId: "tour-sidebar" }),
  },
  // ⬇️ AGREGAR AQUÍ TU NUEVA GUÍA ⬇️
  {
    id: "tour-mi-funcionalidad",
    name: "Guía de Mi Funcionalidad",
    description: "Aprende a usar esta nueva característica.",
    onStart: () => manual.startTour({ tourId: "tour-mi-funcionalidad" }),
  },
  // Para tours que requieren navegación a otra página:
  {
    id: "tour-otra-seccion",
    name: "Guía de Otra Sección",
    description: "Tour con navegación automática.",
    onStart: () =>
      manual.startTour({
        tourId: "tour-otra-seccion",
        navigateTo: "/roles/responsable/otra-seccion", // Ruta destino
      }),
  },
];
```

### Paso 3: (Opcional) Si el tour requiere navegación

Si tu tour navega a otra página, agrega el hook `usePendingTour` en el componente destino:

```typescript
import { usePendingTour } from "../../hooks/usePendingTour";

export default function MiComponente() {
  // Verificar tours pendientes después de navegación
  usePendingTour();

  // ... resto del componente
}
```

### Paso 4: ¡Listo! 🎉

El nuevo tour aparecerá automáticamente en el índice de guías cuando el usuario haga clic en el botón "?".

## 📝 Estructura de GuideItem

```typescript
type GuideItem = {
  id: string; // Identificador único (debe coincidir con tourId)
  name: string; // Nombre visible en el índice
  description?: string; // Descripción breve (opcional)
  icon?: string; // SVG personalizado (opcional, usa icono por defecto)
  onStart: () => void; // Función que inicia el tour
};
```

## 🎨 Personalización de iconos (opcional)

Para agregar un icono personalizado a una guía:

```typescript
{
  id: "tour-reportes",
  name: "Guía de Reportes",
  description: "Cómo crear y gestionar reportes.",
  icon: (
    <svg width="24" height="24" viewBox="0 0 24 24">
      {/* Tu SVG aquí */}
    </svg>
  ),
  onStart: () => manual.startTour({ tourId: "tour-reportes" }),
}
```

## 🔧 Configuración avanzada de tours

### Opciones de posicionamiento del popover:

- `side: "top"` - Arriba del elemento
- `side: "right"` - Derecha del elemento
- `side: "bottom"` - Abajo del elemento (recomendado para topbar)
- `side: "left"` - Izquierda del elemento

### Opciones adicionales del tour:

```typescript
responsableManualSingleton.registerTour({
  tourId: "tour-avanzado",
  sections: [
    /* ... */
  ],
  options: {
    // Configuraciones adicionales de driver.js
    animate: true,
    overlayClickNext: false,
    // etc.
  },
});
```

## 🎯 Tours actuales implementados

1. **tour-sidebar**: Guía del menú lateral
   - Botón de contraer/expandir
   - Opciones de navegación
   - Badge de alertas

2. **tour-topbar**: Guía de la barra superior
   - Título de página
   - Panel de accesibilidad
   - Campana de notificaciones
   - Nombre de usuario
   - Botón cerrar sesión

3. **tour-dashboard**: Guía del panel de control ⭐ (con navegación automática)
   - Filtro de período
   - KPIs (pendientes, enviados, vencidos, por vencer)
   - Gráfico de donut de estado
   - Lista de próximos vencimientos

4. **tour-mis-reportes**: Guía de mis reportes ⭐ (con navegación automática)
   - Filtros de estado (Todos/Activos/Inactivos)
   - Tarjeta de reporte agrupado
   - Estado del grupo (ACTIVO/INACTIVO)
   - Información de vigencia y periodicidad
   - Resumen de conteos
   - Botón "Ver entregas"
   - Botón "Ver detalle"
   - Controles de paginación

## 💡 Buenas prácticas

1. **Selectores CSS claros**: Usa clases específicas, evita IDs dinámicos
2. **Textos concisos**: Máximo 1-2 líneas por descripción
3. **Orden lógico**: Ordena los pasos según el flujo natural de uso
4. **Posicionamiento adecuado**: Elige `side` según la ubicación del elemento
5. **Prueba el tour**: Verifica que todos los elementos sean visibles y destacables
6. **Navegación automática**: Si el tour requiere estar en una página específica, usa `navigateTo`
7. **Scroll automático**: El sistema hace scroll automático a elementos no visibles
8. **Hook usePendingTour**: Úsalo en componentes destino de navegación automática

## 🐛 Solución de problemas

### El elemento no se destaca correctamente

- Verifica que el selector CSS sea correcto
- Asegúrate de que el elemento exista en el DOM al iniciar el tour

### Los textos aparecen en inglés

- Verifica que `BASE_OPTIONS` tenga configurados los textos en español
- No modifiques los hooks de `onHighlightStarted` y `onPopoverRendered`

### El tour no aparece en el índice

- Verifica que hayas registrado el tour con `registerMiNuevoTour()`
- Confirma que agregaste la guía al array `availableGuides`

## 📚 Recursos

- [Documentación de driver.js](https://driverjs.com/)
- [Guía de selectores CSS](https://developer.mozilla.org/es/docs/Web/CSS/CSS_Selectors)
