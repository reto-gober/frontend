# 🚀 Checklist de Puesta en Marcha
## Reportes Consolidados Frontend

---

## ⚙️ Pre-requisitos

### Backend
- [ ] El backend está en ejecución en `http://localhost:8080`
- [ ] El endpoint `/api/reportes/consolidados` está disponible
- [ ] Hay datos de prueba en la base de datos
- [ ] La autenticación JWT está configurada
- [ ] CORS está configurado para permitir el frontend

### Frontend
- [ ] Node.js instalado (v18+)
- [ ] Dependencias instaladas (`npm install`)
- [ ] Variables de entorno configuradas

---

## 📝 Pasos de Configuración

### 1. Configurar Variables de Entorno
```bash
# Crear o editar .env en la raíz del proyecto web/
echo "PUBLIC_API_URL=http://localhost:8080" > .env
```

**Verificar:**
```bash
cat .env
# Debe mostrar: PUBLIC_API_URL=http://localhost:8080
```

- [ ] Archivo `.env` creado
- [ ] Variable `PUBLIC_API_URL` configurada

---

### 2. Verificar Dependencias

Ejecutar en el directorio `web/`:
```bash
npm install
```

**Dependencias requeridas (verificar en package.json):**
- [ ] `axios` (^1.6.0)
- [ ] `react` (^18.2.0)
- [ ] `react-dom` (^18.2.0)
- [ ] `date-fns` (^3.0.0)
- [ ] `lucide-react` (^0.300.0)

Si falta alguna:
```bash
npm install axios date-fns lucide-react
```

---

### 3. Verificar Archivos Creados

**Tipos y servicios:**
- [ ] `web/src/lib/types/reportes-consolidados.ts`
- [ ] `web/src/lib/services/reportes-consolidados.service.ts`
- [ ] `web/src/lib/hooks/useReportesConsolidados.ts`
- [ ] `web/src/lib/utils/reportes-utils.ts`

**Componentes:**
- [ ] `web/src/components/ReporteConsolidadoCard.tsx`
- [ ] `web/src/components/ReportesConsolidadosList.tsx`
- [ ] `web/src/components/ReporteConsolidadoDetalle.tsx`
- [ ] `web/src/components/ReportesConsolidadosStats.tsx`

**Páginas:**
- [ ] `web/src/pages/reportes/consolidados/index.astro`
- [ ] `web/src/pages/reportes/consolidados/[id].astro`

**Utilidades:**
- [ ] `web/src/lib/reportes-consolidados.index.ts`
- [ ] `web/src/lib/mocks/reportes-consolidados.mock.ts`

**Documentación:**
- [ ] `INTEGRACION_REPORTES_CONSOLIDADOS.md`
- [ ] `REPORTES_CONSOLIDADOS_QUICK_START.md`
- [ ] `IMPLEMENTACION_COMPLETA.md`

---

### 4. Iniciar el Servidor de Desarrollo

```bash
cd web
npm run dev
```

**Verificar:**
- [ ] El servidor inicia sin errores
- [ ] Muestra la URL (típicamente `http://localhost:4321`)
- [ ] No hay errores de compilación TypeScript

---

### 5. Probar Autenticación

### 5.1. Iniciar Sesión
1. Abrir navegador en `http://localhost:4321/login`
2. Iniciar sesión con credenciales válidas
3. Verificar redirección a dashboard

**Verificar en DevTools (F12) → Application → Local Storage:**
- [ ] Existe clave `token` con valor JWT
- [ ] Existe clave `usuario` con datos del usuario

### 5.2. Token Manual (si es necesario)
Si no tienes credenciales, puedes configurar un token manualmente:

```javascript
// Abrir consola del navegador (F12) y ejecutar:
localStorage.setItem('token', 'TU_TOKEN_JWT_AQUI');
localStorage.setItem('usuario', JSON.stringify({
  documentNumber: '12345678',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  roles: ['USER']
}));
```

- [ ] Token configurado en localStorage

---

### 6. Probar la Funcionalidad

### 6.1. Lista de Reportes Consolidados
1. Navegar a: `http://localhost:4321/reportes/consolidados`

**Verificar:**
- [ ] La página carga sin errores
- [ ] Se muestra el título "Reportes Consolidados"
- [ ] Aparece el indicador de carga (spinner)
- [ ] Se cargan los reportes (si hay datos)
- [ ] Los filtros son visibles
- [ ] La paginación funciona

**Si hay datos, verificar:**
- [ ] Las tarjetas muestran la información correcta
- [ ] Los colores de estado son correctos
- [ ] Las fechas están en español
- [ ] Los responsables se muestran con avatares
- [ ] Las estadísticas son visibles

**Si NO hay datos:**
- [ ] Se muestra mensaje "No se encontraron reportes"
- [ ] No hay errores en la consola

### 6.2. Filtros
**Probar cada filtro:**

**Por Estado:**
1. Seleccionar "Pendiente" en filtro de estado
2. Click en "Aplicar Filtros"
- [ ] Solo muestra reportes pendientes
- [ ] La URL no cambia (estado local)

**Por Entidad:**
1. Seleccionar una entidad
2. Click en "Aplicar Filtros"
- [ ] Solo muestra reportes de esa entidad

**Por Responsable:**
1. Seleccionar un responsable
2. Click en "Aplicar Filtros"
- [ ] Solo muestra reportes de ese responsable

**Limpiar Filtros:**
1. Click en "Limpiar"
- [ ] Se restablece la lista completa
- [ ] Los selectores vuelven a "Todos"

### 6.3. Ordenamiento
1. Cambiar el selector "Ordenar por"
2. Probar diferentes opciones:
- [ ] Vencimiento (próximo primero)
- [ ] Vencimiento (lejano primero)
- [ ] Título (A-Z)
- [ ] Título (Z-A)
- [ ] Mayor cumplimiento
- [ ] Menor cumplimiento

### 6.4. Paginación
1. Si hay más de 10 reportes, probar paginación:
- [ ] Botón "Siguiente" funciona
- [ ] Botón "Anterior" funciona
- [ ] Números de página funcionan
- [ ] Se deshabilitan botones en primera/última página

### 6.5. Detalle del Reporte
1. Click en cualquier tarjeta de reporte
- [ ] Redirige a `/reportes/consolidados/[id]`
- [ ] Se muestra la vista de detalle
- [ ] Toda la información está presente:
  - [ ] Título y descripción
  - [ ] Estado con color
  - [ ] Alerta de urgencia (si aplica)
  - [ ] Información básica (frecuencia, formato, etc.)
  - [ ] Entidad
  - [ ] Responsables con contactos
  - [ ] Contactos adicionales (si existen)
  - [ ] Estadísticas con métricas
  - [ ] Tabla de períodos (si existen)
- [ ] Botón "Volver a la lista" funciona

### 6.6. Widget de Estadísticas (Opcional)
Si integraste el widget en dashboard:
1. Navegar a dashboard
- [ ] El widget se muestra
- [ ] Las estadísticas son correctas
- [ ] Las alertas de urgencia funcionan
- [ ] El enlace "Ver todos" redirige correctamente

---

### 7. Verificar Manejo de Errores

### 7.1. Sin Token (Sesión Expirada)
1. Abrir DevTools (F12) → Application → Local Storage
2. Eliminar la clave `token`
3. Intentar acceder a `/reportes/consolidados`

**Verificar:**
- [ ] Redirige automáticamente a `/login`
- [ ] No se ven errores confusos al usuario

### 7.2. Backend Caído
1. Detener el backend
2. Refrescar la página de reportes consolidados

**Verificar:**
- [ ] Muestra mensaje de error claro
- [ ] No se rompe la aplicación
- [ ] El indicador de carga desaparece

### 7.3. ID Inválido
1. Navegar a `/reportes/consolidados/99999`

**Verificar:**
- [ ] Muestra mensaje de error
- [ ] Ofrece botón para volver a la lista
- [ ] No se rompe la aplicación

---

### 8. Verificar Responsive Design

### 8.1. Móvil (< 768px)
1. Abrir DevTools (F12) → Toggle device toolbar
2. Seleccionar iPhone o dispositivo móvil

**Verificar:**
- [ ] Las tarjetas se apilan en una columna
- [ ] Los filtros son accesibles
- [ ] El texto es legible
- [ ] Los botones son clickeables
- [ ] La paginación es usable

### 8.2. Tablet (768px - 1024px)
**Verificar:**
- [ ] Las tarjetas se muestran en 2 columnas
- [ ] El layout se ve equilibrado

### 8.3. Desktop (> 1024px)
**Verificar:**
- [ ] Las tarjetas se muestran en 3 columnas
- [ ] Hay buen uso del espacio

---

### 9. Verificar Performance

### 9.1. Red
1. Abrir DevTools (F12) → Network
2. Refrescar la página de reportes

**Verificar:**
- [ ] Solo se hace una petición inicial a `/api/reportes/consolidados`
- [ ] No hay peticiones redundantes
- [ ] El tiempo de respuesta es razonable

### 9.2. Consola
1. Abrir DevTools (F12) → Console

**Verificar:**
- [ ] No hay errores en rojo
- [ ] No hay warnings críticos
- [ ] Los logs de desarrollo son informativos

---

### 10. Integración con Navegación

### 10.1. Agregar al Menú
Editar `web/src/layouts/MainLayout.astro`:

```astro
<nav>
  <!-- Enlaces existentes -->
  <a href="/dashboard">Dashboard</a>
  <a href="/reportes">Reportes</a>
  
  <!-- AGREGAR ESTE ENLACE -->
  <a href="/reportes/consolidados">Reportes Consolidados</a>
  
  <a href="/entidades">Entidades</a>
  <a href="/usuarios">Usuarios</a>
</nav>
```

**Verificar:**
- [ ] El enlace aparece en el menú
- [ ] El enlace funciona correctamente
- [ ] El estilo es consistente con otros enlaces

### 10.2. Agregar al Dashboard (Opcional)
Editar `web/src/pages/dashboard.astro`:

```astro
<div class="mt-6">
  <div id="reportes-consolidados-stats-root"></div>
</div>
```

```javascript
<script>
  // ... código existente ...
  
  // Agregar esto:
  import ReportesConsolidadosStats from '../components/ReportesConsolidadosStats';
  
  const consolidadosContainer = document.getElementById('reportes-consolidados-stats-root');
  if (consolidadosContainer) {
    const root = createRoot(consolidadosContainer);
    root.render(createElement(ReportesConsolidadosStats));
  }
</script>
```

**Verificar:**
- [ ] El widget aparece en el dashboard
- [ ] Las estadísticas son correctas
- [ ] No rompe otros componentes del dashboard

---

## 🧪 Testing Adicional

### Casos Edge
- [ ] Reporte sin responsables
- [ ] Reporte sin contactos
- [ ] Reporte sin períodos
- [ ] Reporte con fecha null
- [ ] Reporte con descripción muy larga
- [ ] Lista vacía con filtros aplicados
- [ ] Página sin datos (página 999)

### Cross-browser
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (si disponible)

---

## 📊 Validación Final

### Funcionalidad
- [ ] Todas las páginas cargan
- [ ] Todos los filtros funcionan
- [ ] La paginación funciona
- [ ] El detalle muestra toda la información
- [ ] Los errores se manejan correctamente
- [ ] La navegación es fluida

### UI/UX
- [ ] Los colores son consistentes
- [ ] Los iconos son apropiados
- [ ] El texto es legible
- [ ] Los espaciados son adecuados
- [ ] Las animaciones son suaves
- [ ] El diseño es profesional

### Código
- [ ] No hay errores TypeScript
- [ ] No hay warnings críticos
- [ ] El código está formateado
- [ ] Los comentarios son claros
- [ ] Las funciones están documentadas

### Documentación
- [ ] La guía de integración es clara
- [ ] Los ejemplos funcionan
- [ ] El quick start es útil
- [ ] El README está actualizado

---

## ✅ Checklist de Producción

Antes de llevar a producción:

### Configuración
- [ ] `PUBLIC_API_URL` apunta al servidor de producción
- [ ] Las variables de entorno están aseguradas
- [ ] El build de producción funciona: `npm run build`
- [ ] No hay console.logs innecesarios

### Seguridad
- [ ] Los tokens se manejan de forma segura
- [ ] No hay datos sensibles en el código
- [ ] Las peticiones usan HTTPS en producción
- [ ] Los permisos de usuario están validados

### Performance
- [ ] Las imágenes están optimizadas (si las hay)
- [ ] El bundle size es razonable
- [ ] No hay memory leaks evidentes
- [ ] La paginación limita resultados

### Monitoring
- [ ] Hay logging de errores
- [ ] Se monitorean las peticiones API
- [ ] Se rastrean los errores del usuario

---

## 🆘 Troubleshooting Rápido

### Problema: "Cannot find module"
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

### Problema: Error 404 en rutas
```bash
# Verificar que las páginas existen
ls -la web/src/pages/reportes/consolidados/
```

### Problema: No se muestran datos
1. Verificar en Network tab que la petición se hace
2. Verificar que el token es válido
3. Verificar que hay datos en el backend
4. Verificar la consola por errores

### Problema: Fechas mal formateadas
1. Verificar que `date-fns` está instalado
2. Verificar que el backend envía ISO 8601
3. Verificar la zona horaria

### Problema: Estilos no se aplican
1. Verificar que Tailwind está configurado
2. Hacer rebuild: `npm run build`
3. Limpiar caché del navegador

---

## 🎉 ¡Todo Listo!

Si todos los checks están marcados, la implementación está completa y funcionando correctamente.

**Próximos pasos sugeridos:**
1. Entrenar al equipo en el uso de la funcionalidad
2. Crear tests automatizados
3. Configurar CI/CD para el frontend
4. Monitorear uso y performance en producción
5. Recoger feedback de usuarios

---

**Fecha de implementación:** _______________

**Implementado por:** _______________

**Revisado por:** _______________

**Estado:** _______________

---

¿Preguntas o problemas? Consulta la documentación completa en:
- `INTEGRACION_REPORTES_CONSOLIDADOS.md`
- `REPORTES_CONSOLIDADOS_QUICK_START.md`
