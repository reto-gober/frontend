# 🔍 GUÍA DE DIAGNÓSTICO - NO HAY DATOS EN ROL RESPONSABLE

## ⚡ PASOS INMEDIATOS

### 1️⃣ Abre la Consola del Navegador

- Presiona **F12** en tu navegador
- Ve a la pestaña **Console**
- Mantén la consola abierta mientras navegas al rol responsable

### 2️⃣ Verifica los Logs Automáticos

Cuando entres a cualquier vista del rol responsable (Mis Tareas, Dashboard, etc.), deberías ver logs como:

```
🔍 [MisTareasClient] Iniciando carga de tareas...
🔐 [API Interceptor] Token encontrado: ✅ Sí
📤 [API Interceptor] Request URL: /api/flujo-reportes/mis-periodos?page=0&size=100
🌐 [API] Llamando a: /api/flujo-reportes/mis-periodos?page=0&size=100
🌐 [API] Respuesta status: 200
✅ [MisTareasClient] Tareas cargadas exitosamente: 5
```

---

## 🚨 PROBLEMAS COMUNES Y SOLUCIONES

### ❌ Problema: "Token encontrado: ❌ No"

**CAUSA:** No has iniciado sesión o el token expiró

**SOLUCIÓN:**

1. Ve a `/login`
2. Inicia sesión con tus credenciales
3. Verifica que el token se guarde en localStorage:
   ```javascript
   localStorage.getItem("token");
   ```

---

### ❌ Problema: Error 401 Unauthorized

**CAUSA:** Token inválido o expirado

**SOLUCIÓN:**

1. Limpia el localStorage:
   ```javascript
   localStorage.clear();
   ```
2. Vuelve a iniciar sesión
3. Verifica que tu usuario tenga el rol `responsable`

---

### ❌ Problema: Error 404 Not Found

**CAUSA:** El backend no está corriendo o la URL es incorrecta

**SOLUCIÓN:**

1. Verifica que el backend esté corriendo en `http://localhost:8080`
2. Prueba acceder directamente a: `http://localhost:8080/api/flujo-reportes/mis-periodos`
3. Verifica el archivo `.env`:
   ```
   PUBLIC_API_URL=http://localhost:8080
   ```

---

### ❌ Problema: "Tareas cargadas exitosamente: 0"

**CAUSA:** El backend no tiene periodos asignados a tu usuario

**SOLUCIÓN:**

1. Verifica en la base de datos que existan periodos asignados
2. Verifica que los periodos tengan como responsable tu `usuarioId`
3. Crea periodos de prueba desde el módulo Admin

---

### ❌ Problema: Error de CORS

**CAUSA:** El backend no permite peticiones desde el frontend

**SOLUCIÓN:**

1. Verifica la configuración CORS en el backend
2. Debe permitir el origen: `http://localhost:4321`
3. Debe permitir headers: `Authorization`, `Content-Type`

---

## 🧪 TEST MANUAL DE CONECTIVIDAD

### Opción 1: Desde la Consola del Navegador

Copia y pega este código en la consola:

\`\`\`javascript
// Test de conectividad
const token = localStorage.getItem('token');
fetch('http://localhost:8080/api/flujo-reportes/mis-periodos?page=0&size=10', {
headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => {
console.log('✅ Respuesta del backend:', data);
if (data.data?.content) {
console.log(`✅ Periodos encontrados: ${data.data.content.length}`);
}
})
.catch(e => console.error('❌ Error:', e));
\`\`\`

### Opción 2: Usando cURL (Terminal)

\`\`\`bash

# Reemplaza YOUR_TOKEN con tu token JWT

curl -H "Authorization: Bearer YOUR_TOKEN" \
 http://localhost:8080/api/flujo-reportes/mis-periodos?page=0&size=10
\`\`\`

---

## 📊 VERIFICAR ESTRUCTURA DE LA RESPUESTA

La respuesta del backend DEBE tener esta estructura:

\`\`\`json
{
"success": true,
"data": {
"content": [
{
"periodoId": "uuid",
"reporteId": "uuid",
"reporteNombre": "Nombre del reporte",
"entidadNombre": "Nombre de la entidad",
"estado": "pendiente", // <-- IMPORTANTE: minúsculas
"fechaVencimientoCalculada": "2024-12-10",
...
}
],
"totalPages": 1,
"totalElements": 5
}
}
\`\`\`

**IMPORTANTE:** El campo `estado` debe estar en **minúsculas** y ser uno de:

- `pendiente`
- `en_elaboracion`
- `enviado`
- `extemporaneo`
- `en_revision`
- `requiere_correccion`
- `aprobado`
- `rechazado`
- `vencido`

---

## 🔧 VERIFICACIONES EN EL BACKEND

### 1. Verificar que el endpoint existe

\`\`\`
GET /api/flujo-reportes/mis-periodos
\`\`\`

### 2. Verificar autenticación

El endpoint debe validar el token JWT y extraer el `usuarioId`

### 3. Verificar datos en la base de datos

\`\`\`sql
-- Verificar periodos asignados al usuario
SELECT \* FROM reportes_periodos
WHERE responsable_elaboracion_id = 'TU_USUARIO_ID';
\`\`\`

---

## 📞 CONTACTO Y SOPORTE

Si después de seguir todos los pasos aún no ves datos:

1. **Captura los logs de la consola** (toda la información que aparece)
2. **Captura los logs del backend** (si tienes acceso)
3. **Comparte:**
   - El error exacto
   - Los logs de la consola
   - La estructura de la respuesta del backend
   - Tu rol de usuario

---

## ✅ CHECKLIST RÁPIDO

- [ ] Backend está corriendo en `http://localhost:8080`
- [ ] Has iniciado sesión correctamente
- [ ] Tu usuario tiene el rol `responsable`
- [ ] Hay periodos asignados a tu usuario en la BD
- [ ] El token JWT es válido
- [ ] La consola del navegador muestra los logs de debugging
- [ ] No hay errores 404, 401, 403 en la consola
- [ ] La variable `PUBLIC_API_URL` está configurada correctamente

---

## 🎯 LOGS QUE DEBES VER SI TODO FUNCIONA

\`\`\`
🔍 [MisTareasClient] Iniciando carga de tareas...
🔍 [MisTareasClient] Token en localStorage: ✅ Presente
🔐 [API Interceptor] Token encontrado: ✅ Sí
📤 [API Interceptor] Request URL: /api/flujo-reportes/mis-periodos?page=0&size=100
🌐 [API] Llamando a: /api/flujo-reportes/mis-periodos?page=0&size=100
🌐 [API] Respuesta status: 200
🌐 [API] Respuesta data completa: { success: true, data: { content: [...] } }
🔍 [MisTareasClient] Cantidad de periodos: 5
✅ [MisTareasClient] Tareas cargadas exitosamente: 5
📊 [MisTareasClient] Tareas totales: 5
📊 [MisTareasClient] Contadores: { todas: 5, pendientes: 3, completadas: 2, ... }
\`\`\`

---

**Última actualización:** 6 de diciembre de 2025
