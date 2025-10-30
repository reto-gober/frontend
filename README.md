# Frontend - Tracely

Sistema de Gestión de Reportes Regulatorios

## Módulos

### `web/` - Aplicación Web (Astro.js + React)

Aplicación web completa con gestión de reportes, calendario interactivo, y administración de entidades.

**Características:**
- Dashboard con estadísticas en tiempo real
- Gestión completa de reportes (CRUD)
- Calendario interactivo con alertas de vencimientos
- Administración de entidades regulatorias
- Carga y descarga de evidencias
- Autenticación JWT
- Diseño responsive con colores de marca Tracely

**Comandos:**
```bash
cd web
npm install
npm run dev      # Servidor de desarrollo
npm run build    # Compilar para producción
npm run preview  # Vista previa de producción
```

**Configuración:**
- Copiar `.env.example` a `.env`
- Configurar `PUBLIC_API_URL` con la URL del backend

### `mobile/` - Aplicación Móvil (React Native + Expo)

Aplicación móvil con navegación (stack/tabs), autenticación básica con SecureStore, calendario y carga de evidencias.

**Comandos:**
```bash
cd mobile
npm run android  # Abrir en Android
npm run web      # Versión web rápida
```

**Configuración:**
- Variables: `EXPO_PUBLIC_API_URL` o `app.json > expo.extra.apiUrl`

## Tecnologías

### Web
- Astro.js - Framework web
- React - Componentes interactivos
- TypeScript - Tipado estático
- Axios - Cliente HTTP
- date-fns - Manejo de fechas
- Lucide React - Iconos

### Mobile
- React Native
- Expo
- React Navigation

## Estructura del Proyecto

```
frontend/
├── web/           # Aplicación web Astro.js
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── layouts/     # Layouts Astro
│   │   ├── lib/         # Servicios y utilidades
│   │   ├── pages/       # Páginas (rutas)
│   │   └── styles/      # Estilos globales
│   └── README.md
└── mobile/        # Aplicación móvil Expo
    └── ...
```

## Colores de Marca Tracely

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

