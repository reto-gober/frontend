# Tracely Web - Sistema de Gestión de Reportes Regulatorios

Aplicación web desarrollada con Astro.js y React para la gestión centralizada de reportes a entidades de control.

## Características

- 📊 Dashboard con estadísticas en tiempo real
- 📝 Gestión completa de reportes (crear, editar, eliminar)
- 📅 Calendario interactivo con alertas de vencimientos
- 🏢 Administración de entidades regulatorias
- 📎 Carga y descarga de evidencias (archivos)
- 🔐 Autenticación con JWT
- 📱 Diseño responsive
- 🎨 Colores de marca Tracely

## Tecnologías

- **Astro.js** - Framework web
- **React** - Componentes interactivos
- **TypeScript** - Tipado estático
- **Axios** - Cliente HTTP
- **date-fns** - Manejo de fechas
- **Lucide React** - Iconos
- **Recharts** - Gráficos (preparado para uso futuro)

## Configuración

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
```

Editar `.env` y configurar:
```
PUBLIC_API_URL=http://localhost:8080
```

3. Iniciar servidor de desarrollo:
```bash
npm run dev
```

4. Construir para producción:
```bash
npm run build
```

5. Vista previa de producción:
```bash
npm run preview
```

## Estructura del Proyecto

```
web/
├── src/
│   ├── components/     # Componentes React
│   ├── layouts/        # Layouts de Astro
│   ├── lib/           # Utilidades y servicios
│   │   ├── api.ts     # Cliente Axios
│   │   ├── auth.ts    # Servicio de autenticación
│   │   └── services.ts # Servicios de API
│   ├── pages/         # Páginas de Astro (rutas)
│   └── styles/        # Estilos globales
├── public/            # Archivos estáticos
├── astro.config.mjs   # Configuración de Astro
├── tsconfig.json      # Configuración de TypeScript
└── package.json       # Dependencias
```

## Rutas Principales

- `/` - Redirección a login
- `/login` - Inicio de sesión
- `/registro` - Registro de usuarios
- `/dashboard` - Panel principal con estadísticas
- `/reportes` - Listado de reportes
- `/reportes/nuevo` - Crear nuevo reporte
- `/reportes/[id]` - Ver/editar reporte y gestionar evidencias
- `/entidades` - Gestión de entidades regulatorias
- `/calendario` - Calendario de vencimientos

## Colores de Marca

```css
--color-primary-50: #f1f8fd;
--color-primary-100: #e0eff9;
--color-primary-200: #c7e4f6;
--color-primary-300: #a1d4ef;
--color-primary-400: #74bbe6;
--color-primary-500: #53a0de;
--color-primary-600: #3d85d1;
--color-primary-700: #3572c0;
--color-primary-800: #315d9c;
--color-primary-900: #2c4f7c;
--color-primary-950: #1f314c;
```

## Integración con Backend

La aplicación consume una API REST desarrollada en Spring Boot. Ver la especificación completa en el problema original.

### Endpoints principales:

- **Auth**: `/api/auth/login`, `/api/auth/registro`
- **Reportes**: `/api/reportes`
- **Entidades**: `/api/entidades`
- **Evidencias**: `/api/evidencias`
- **Dashboard**: `/api/dashboard/estadisticas`
- **Usuarios**: `/api/usuarios`

### Autenticación

- Bearer JWT con expiración de 24 horas
- Token almacenado en localStorage
- Interceptor automático para agregar token a requests
- Redirección automática a login en caso de 401

## Funcionalidades Implementadas

### Dashboard
- Estadísticas de reportes (total, pendientes, en progreso, enviados, vencidos)
- Tasa de cumplimiento
- Acciones rápidas
- Enlaces a secciones principales

### Gestión de Reportes
- Listado paginado con filtros por estado
- Creación y edición de reportes
- Cambio de estado
- Eliminación
- Visualización de detalles
- Indicadores visuales de estado

### Calendario
- Vista mensual
- Indicadores de reportes por día
- Detección de vencimientos
- Vista lateral con reportes del día seleccionado
- Navegación entre meses

### Evidencias
- Subida de archivos (PDF, Excel, Word, etc.)
- Descarga de evidencias
- Eliminación de archivos
- Visualización de metadatos

### Entidades
- CRUD completo
- Listado con información detallada
- Estados activo/inactivo
- Formulario inline para creación/edición

## Desarrollo

### Comandos disponibles

```bash
# Desarrollo
npm run dev

# Construcción
npm run build

# Vista previa
npm run preview

# Verificación de tipos
npm run astro check
```

## Notas

- Todos los componentes React usan `client:load` para interactividad
- Los servicios de API están centralizados en `src/lib/services.ts`
- El manejo de errores es global con interceptores de Axios
- El diseño es completamente responsive
- No se utilizan emojis, solo iconos nativos (Lucide React)
