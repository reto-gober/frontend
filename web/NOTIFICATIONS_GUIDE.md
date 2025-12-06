# Sistema de Notificaciones - Guía de Uso

## Descripción

Sistema centralizado de notificaciones usando **SweetAlert2** que reemplaza completamente los popups nativos del navegador (`alert()`, `confirm()`, `prompt()`).

## Características

✅ **Diseño minimalista y profesional**  
✅ **Estilos personalizables**  
✅ **No bloquea el hilo de ejecución**  
✅ **Soporte para éxito/error/advertencia/info**  
✅ **Modales con botones personalizados**  
✅ **Compatible con desktop y móvil**  
✅ **Animaciones suaves**  
✅ **Toast notifications ligeras**

---

## Instalación

El sistema ya está completamente integrado en el proyecto. Solo necesitas importar el servicio de notificaciones:

```typescript
import notifications from '../lib/notifications';
// O con ruta relativa según tu ubicación:
// import notifications from '../../lib/notifications';
```

---

## API de Uso

### 1. **Notificación de Éxito** ✅

```typescript
notifications.success('Operación completada correctamente');
// Con título personalizado:
notifications.success('Datos guardados', '¡Perfecto!');
```

**Características:**
- Icono verde de check
- Se cierra automáticamente después de 3 segundos
- Barra de progreso temporal

---

### 2. **Notificación de Error** ❌

```typescript
notifications.error('Hubo un problema al procesar la solicitud');
// Con título personalizado:
notifications.error('No se pudo conectar al servidor', 'Error de conexión');
```

**Características:**
- Icono rojo de error
- Requiere confirmación manual del usuario
- Sin cierre automático

---

### 3. **Notificación de Advertencia** ⚠️

```typescript
notifications.warning('Esta acción puede tener consecuencias');
// Con título personalizado:
notifications.warning('Revisa los campos obligatorios', 'Atención');
```

**Características:**
- Icono amarillo de advertencia
- Requiere confirmación manual

---

### 4. **Notificación de Información** ℹ️

```typescript
notifications.info('Se envió un correo de confirmación');
// Con título personalizado:
notifications.info('Actualización disponible', 'Información');
```

**Características:**
- Icono azul de información
- Se cierra automáticamente después de 3 segundos
- Barra de progreso temporal

---

### 5. **Modal de Confirmación** 🤔

**Reemplaza `window.confirm()` completamente**

```typescript
const handleDelete = async () => {
  const confirmed = await notifications.confirm(
    'Esta acción no se puede deshacer',  // Mensaje
    '¿Eliminar elemento?',                // Título
    'Sí, eliminar',                       // Texto botón confirmar
    'Cancelar'                            // Texto botón cancelar
  );

  if (confirmed) {
    // Usuario confirmó - ejecutar acción
    await deleteItem();
  } else {
    // Usuario canceló - no hacer nada
  }
};
```

**Características:**
- Retorna una **Promise<boolean>**
- `true` si el usuario confirma
- `false` si el usuario cancela
- Icono de pregunta
- Botones personalizables

---

### 6. **Toast Notification** 🍞

Notificaciones ligeras que no interrumpen el flujo del usuario:

```typescript
notifications.toast('Archivo descargando...', 'info');
notifications.toast('Guardado en borradores', 'success');
notifications.toast('Advertencia detectada', 'warning', 5000); // 5 segundos
```

**Parámetros:**
- `message`: Texto a mostrar
- `type`: 'success' | 'error' | 'warning' | 'info'
- `duration`: Tiempo en ms (default: 3000)

**Características:**
- Aparece en la esquina superior derecha
- Muy discreto
- Se cierra automáticamente

---

### 7. **Loading Modal** ⏳

Para operaciones largas:

```typescript
// Mostrar loading
notifications.loading('Procesando datos...');

// Hacer operación
await longRunningOperation();

// Cerrar loading
notifications.close();
```

**Características:**
- Bloquea interacción mientras carga
- Spinner animado
- No se puede cerrar con ESC o clic fuera

---

## Ejemplos de Migración

### ❌ ANTES (popup nativo)

```typescript
// Alert nativo
alert('Usuario creado exitosamente');

// Confirm nativo
if (confirm('¿Eliminar este elemento?')) {
  deleteItem();
}
```

### ✅ DESPUÉS (sistema moderno)

```typescript
// Notificación moderna
notifications.success('Usuario creado exitosamente');

// Confirm moderno con async/await
const handleDelete = async () => {
  const confirmed = await notifications.confirm(
    'Esta acción no se puede deshacer',
    '¿Eliminar elemento?'
  );
  
  if (confirmed) {
    await deleteItem();
  }
};
```

---

## Ejemplos Reales del Código

### Ejemplo 1: Eliminar Entidad

```typescript
const handleDeleteEntidad = async (entidadId: string) => {
  const confirmed = await notifications.confirm(
    'Esta acción no se puede deshacer',
    '¿Eliminar entidad?',
    'Sí, eliminar',
    'Cancelar'
  );
  if (!confirmed) return;

  try {
    await entidadesService.eliminar(entidadId);
    await cargarEntidades();
    notifications.success('Entidad eliminada correctamente');
  } catch (err) {
    notifications.error('Error al eliminar la entidad');
  }
};
```

### Ejemplo 2: Subir Archivo

```typescript
const handleUpload = async (file: File) => {
  try {
    notifications.loading('Subiendo archivo...');
    await evidenciasService.subir(reporteId, file);
    notifications.close();
    notifications.success('Archivo subido correctamente');
    loadEvidencias();
  } catch (error) {
    notifications.close();
    notifications.error('Error al subir el archivo');
  }
};
```

### Ejemplo 3: Cerrar Sesión (Astro Layout)

```typescript
// En un script de layout Astro
btnLogout.addEventListener('click', async () => {
  const confirmed = await notifications.confirm(
    'Tu sesión actual se cerrará',
    '¿Cerrar sesión?',
    'Sí, cerrar sesión',
    'Cancelar'
  );
  if (confirmed) {
    authService.logout();
  }
});
```

---

## Personalización de Estilos

Los estilos están en `src/styles/notifications.css` y ya están importados globalmente.

### Colores principales:

- **Success**: Verde `#10b981`
- **Error**: Rojo `#ef4444`
- **Warning**: Amarillo `#f59e0b`
- **Info**: Azul `#3b82f6`
- **Question**: Morado `#8b5cf6`

### Modificar botones:

```css
/* En notifications.css */
.swal-confirm-btn {
  background-color: #2563eb !important;
  /* Tu color personalizado */
}
```

---

## Métodos Disponibles

```typescript
notifications.success(message, title?)
notifications.error(message, title?)
notifications.warning(message, title?)
notifications.info(message, title?)
notifications.confirm(message, title?, confirmText?, cancelText?)
notifications.toast(message, type?, duration?)
notifications.loading(message?)
notifications.close()
```

---

## Ventajas sobre Popups Nativos

| Característica | Popup Nativo | Sistema Moderno |
|----------------|--------------|-----------------|
| **Diseño** | Feo y anticuado | Profesional y moderno |
| **Personalizable** | ❌ No | ✅ Sí |
| **Animaciones** | ❌ No | ✅ Sí |
| **No bloquea hilo** | ❌ Bloquea | ✅ No bloquea |
| **Mobile friendly** | ⚠️ Regular | ✅ Excelente |
| **Iconos** | ❌ No | ✅ Sí |
| **Botones personalizados** | ❌ No | ✅ Sí |
| **Toast ligeros** | ❌ No | ✅ Sí |

---

## Soporte de Navegadores

✅ Chrome/Edge (último)  
✅ Firefox (último)  
✅ Safari (último)  
✅ Mobile Safari  
✅ Chrome Mobile  

---

## Archivos del Sistema

```
web/src/
├── lib/
│   ├── notifications.ts          # Servicio principal
│   └── api.ts                     # Usa notifications para sesión expirada
├── styles/
│   ├── notifications.css          # Estilos personalizados
│   └── global.css                 # Importa notifications.css
└── components/
    ├── EvidenciasList.tsx         # Ejemplo de uso
    ├── EntidadesList.tsx          # Ejemplo de uso
    ├── UsuariosList.tsx           # Ejemplo de uso
    ├── admin/
    │   ├── AdminEntidadesClient.tsx
    │   └── AdminReportesClient.tsx
    └── ...
```

---

## Troubleshooting

### ❓ No se ve el modal

**Solución:** Verifica que `sweetalert2` esté instalado:
```bash
npm install sweetalert2
```

### ❓ Estilos no se aplican

**Solución:** Asegúrate de que `notifications.css` esté importado en `global.css`:
```css
@import './notifications.css';
```

### ❓ Error en TypeScript

**Solución:** Importa el tipo correcto:
```typescript
import notifications from '../lib/notifications';
```

---

## Recursos

- [SweetAlert2 Documentation](https://sweetalert2.github.io/)
- [Código fuente del servicio](./lib/notifications.ts)
- [Estilos personalizados](./styles/notifications.css)

---

**Desarrollado con ❤️ para el proyecto Llanogas**
