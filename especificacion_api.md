# 📋 Especificación Completa de Endpoints - Sistema de Gestión de Reportes

**Fecha:** 6 de diciembre de 2025  
**Versión:** 2.0  
**Base URL:** `http://localhost:8080/api`

---

## 📑 Índice de Endpoints

1. [Autenticación](#1-autenticación)
2. [Usuarios](#2-usuarios)
3. [Invitaciones](#3-invitaciones)
4. [Entidades](#4-entidades)
5. [Reportes](#5-reportes)
6. [Períodos de Reporte](#6-períodos-de-reporte)
7. [Archivos y Evidencias](#7-archivos-y-evidencias)
8. [Calendarios y Eventos](#8-calendarios-y-eventos)
9. [Dashboard](#9-dashboard)
10. [Auditoría](#10-auditoría)

---

## 1. Autenticación

### 1.1 Login
```http
POST /api/auth/login
```

**Body:**
```json
{
  "email": "usuario@example.com",
  "password": "password123"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tipo": "Bearer",
    "usuarioId": "uuid",
    "documentNumber": "1234567890",
    "email": "usuario@example.com",
    "firstName": "Juan",
    "secondName": "Carlos",
    "firstLastname": "Pérez",
    "secondLastname": "López",
    "roles": ["responsable"]
  },
  "message": "Login exitoso"
}
```

**Response 400 (Usuario Inactivo):**
```json
{
  "success": false,
  "message": "Tu cuenta está inactiva. Contacta al administrador.",
  "statusCode": 400
}
```

**Validaciones:**
- ✅ Email debe ser válido
- ✅ Contraseña requerida
- ✅ Usuario debe estar activo (`estado: "activo"`)
- ✅ Credenciales deben ser correctas
- ✅ Registra acceso en auditoría

**Notificaciones por Email:**
- ✅ Login exitoso se registra en `user_session_log`
- ✅ Login fallido se registra con razón

---

### 1.2 Registro
```http
POST /api/auth/registro
```

**Body:**
```json
{
  "documentNumber": "1234567890",
  "documentType": "CC",
  "firstName": "Juan",
  "secondName": "Carlos",
  "firstLastname": "Pérez",
  "secondLastname": "López",
  "email": "juan@example.com",
  "birthDate": "1990-01-15",
  "password": "Password123!",
  "roles": ["responsable"]
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente"
}
```

**Validaciones:**
- ✅ Email único
- ✅ Documento único
- ✅ Contraseña mínimo 6 caracteres
- ✅ Rol válido

---

## 2. Usuarios

### 2.1 Listar Usuarios
```http
GET /api/usuarios?page=0&size=10&sort=createdAt,desc
Authorization: Bearer {token}
```

**Roles:** `admin`, `auditor`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "usuarioId": "uuid",
        "documentNumber": "1234567890",
        "nombreCompleto": "Juan Carlos Pérez López",
        "email": "juan@example.com",
        "telefono": "+57 300 1234567",
        "cargo": "Analista",
        "rolCodigo": "responsable",
        "rolNombre": "Responsable",
        "estado": "activo",
        "createdAt": "2025-01-15T10:30:00Z"
      }
    ],
    "totalElements": 50,
    "totalPages": 5,
    "size": 10,
    "number": 0
  }
}
```

---

### 2.2 Obtener Usuario por ID
```http
GET /api/usuarios/{documentNumber}
Authorization: Bearer {token}
```

**Roles:** `admin`, `auditor`, `supervisor`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "usuarioId": "uuid",
    "documentNumber": "1234567890",
    "documentType": "CC",
    "firstName": "Juan",
    "secondName": "Carlos",
    "firstLastname": "Pérez",
    "secondLastname": "López",
    "nombreCompleto": "Juan Carlos Pérez López",
    "email": "juan@example.com",
    "telefono": "+57 300 1234567",
    "cargo": "Analista Senior",
    "rolCodigo": "responsable",
    "rolNombre": "Responsable",
    "estado": "activo",
    "ultimoAcceso": "2025-12-05T14:30:00Z",
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

---

### 2.3 Actualizar Usuario
```http
PUT /api/usuarios/{documentNumber}
Authorization: Bearer {token}
```

**Roles:** `admin`

**Body:**
```json
{
  "firstName": "Juan Carlos",
  "secondName": "Alberto",
  "firstLastname": "Pérez",
  "secondLastname": "López",
  "email": "juan.nuevo@example.com",
  "telefono": "+57 300 9999999",
  "documentType": "CC",
  "documentNumber": "1234567890",
  "rolCodigo": "supervisor",
  "activo": true,
  "cargo": "Coordinador"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": { /* usuario actualizado */ },
  "message": "Usuario actualizado exitosamente"
}
```

---

### 2.4 Desactivar Usuario
```http
PATCH /api/usuarios/{documentNumber}/desactivar
Authorization: Bearer {token}
```

**Roles:** `admin`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "usuarioId": "uuid",
    "estado": "inactivo",
    "email": "usuario@example.com"
  },
  "message": "Usuario desactivado exitosamente"
}
```

**Efecto:**
- ✅ Usuario no podrá iniciar sesión
- ✅ Estado cambia a "inactivo"
- ✅ Se registra en auditoría

---

### 2.5 Activar Usuario
```http
PATCH /api/usuarios/{documentNumber}/activar
Authorization: Bearer {token}
```

**Roles:** `admin`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "usuarioId": "uuid",
    "estado": "activo",
    "email": "usuario@example.com"
  },
  "message": "Usuario activado exitosamente"
}
```

---

## 3. Invitaciones

### 3.1 Invitar Usuario
```http
POST /api/users/invite
Authorization: Bearer {token}
```

**Roles:** `admin`

**Body:**
```json
{
  "email": "nuevo@example.com",
  "role": "responsable"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Invitation sent"
}
```

**Comportamiento:**
- ✅ Si email existe y está activo → Error
- ✅ Si email existe y está invitado → Regenera token y reenvía correo
- ✅ Si no existe → Crea usuario con estado "invited"
- ✅ Genera token único (válido 72 horas)
- ✅ Envía correo con plantilla HTML profesional

**Email Enviado:**
- **Asunto:** "Invitación a Sistema de Gestión de Reportes"
- **Template:** `invitation.html`
- **Variables:** email, token, expiración
- **Link:** `http://frontend.com/registro-invitado?token={token}`

---

### 3.2 Cancelar Invitación
```http
DELETE /api/users/invite/{usuarioId}
Authorization: Bearer {token}
```

**Roles:** `admin`

**Response 200:**
```json
{
  "success": true,
  "message": "Invitation cancelled"
}
```

**Validaciones:**
- ✅ Usuario debe existir
- ✅ Usuario debe tener estado "invited" o "inactive"
- ✅ Usuario no debe haber completado registro (sin contraseña)

---

### 3.3 Validar Token de Invitación
```http
GET /api/users/validate-invitation?token={token}
```

**Público (sin autenticación)**

**Response 200 (Válido):**
```json
{
  "success": true,
  "data": true,
  "message": "Token válido"
}
```

**Response 200 (Inválido):**
```json
{
  "success": true,
  "data": false,
  "message": "Token inválido o expirado"
}
```

---

### 3.4 Completar Registro con Invitación
```http
POST /api/users/complete-invitation
```

**Público (sin autenticación)**

**Body:**
```json
{
  "token": "abc123-token-xyz",
  "firstName": "Juan",
  "secondName": "Carlos",
  "firstLastname": "Pérez",
  "secondLastname": "López",
  "documentType": "CC",
  "documentNumber": "1234567890",
  "password": "Password123!",
  "telefono": "+57 300 1234567"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "User activated"
}
```

**Validaciones:**
- ✅ Token debe existir y estar en estado "pending"
- ✅ Token no debe estar expirado
- ✅ Token no debe estar cancelado
- ✅ Token no debe estar usado
- ✅ Documento no debe estar en uso
- ✅ Contraseña se encripta con Bcrypt
- ✅ Usuario cambia a estado "activo"
- ✅ Token se marca como "used"

---

## 4. Entidades

### 4.1 Crear Entidad
```http
POST /api/entidades
Authorization: Bearer {token}
```

**Roles:** `admin`

**Body:**
```json
{
  "nit": "900123456-1",
  "nombre": "Empresa de Servicios Públicos",
  "paginaWeb": "https://www.empresa.com",
  "baseLegal": "Decreto 1234 de 2020",
  "estado": "ACTIVA",
  "observaciones": "Entidad del sector público"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "entidadId": "uuid",
    "nit": "900123456-1",
    "nombre": "Empresa de Servicios Públicos",
    "paginaWeb": "https://www.empresa.com",
    "estado": "ACTIVA",
    "createdAt": "2025-12-06T10:00:00Z"
  },
  "message": "Entidad creada exitosamente"
}
```

---

### 4.2 Listar Entidades
```http
GET /api/entidades?page=0&size=10
Authorization: Bearer {token}
```

**Roles:** Todos los autenticados

**Response 200:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "entidadId": "uuid",
        "nit": "900123456-1",
        "nombre": "Empresa de Servicios Públicos",
        "estado": "ACTIVA",
        "createdAt": "2025-12-06T10:00:00Z"
      }
    ],
    "totalElements": 20,
    "totalPages": 2
  }
}
```

---

## 5. Reportes

### 5.1 Crear Reporte
```http
POST /api/reportes
Authorization: Bearer {token}
```

**Roles:** `admin`, `supervisor`

**Body:**
```json
{
  "nombre": "Reporte Mensual de Operaciones",
  "descripcion": "Reporte detallado de operaciones mensuales",
  "entidadId": "uuid-entidad",
  "frecuencia": "mensual",
  "formatoRequerido": "PDF",
  "baseLegal": "Resolución 123 de 2020",
  "fechaInicioVigencia": "2025-01-01",
  "fechaFinVigencia": "2025-12-31",
  "fechaVencimiento": "2025-01-31",
  "plazoAdicionalDias": 5,
  "linkInstrucciones": "https://docs.ejemplo.com/instrucciones",
  "durationMonths": 12,
  "responsables": [
    {
      "usuarioId": "uuid-responsable",
      "tipoResponsabilidad": "ELABORACION",
      "esPrincipal": true,
      "orden": 1
    },
    {
      "usuarioId": "uuid-supervisor",
      "tipoResponsabilidad": "SUPERVISION",
      "esPrincipal": true,
      "orden": 2
    }
  ],
  "correosNotificacion": [
    "notificaciones@empresa.com",
    "alertas@empresa.com"
  ]
}
```

**Frecuencias Válidas:**
- `"diaria"` o `"diario"` - Cada 1 día
- `"semanal"` - Cada 7 días
- `"quincenal"` - Cada 15 días
- `"mensual"` - Cada mes
- `"bimestral"` - Cada 2 meses
- `"trimestral"` - Cada 3 meses
- `"semestral"` - Cada 6 meses
- `"anual"` - Cada año
- `"45"` - Frecuencia personalizada (cada 45 días)

**Response 201:**
```json
{
  "success": true,
  "data": {
    "reporteId": "uuid",
    "nombre": "Reporte Mensual de Operaciones",
    "entidadNombre": "Empresa de Servicios Públicos",
    "frecuencia": "mensual",
    "estado": "activo",
    "durationMonths": 12,
    "responsables": [
      {
        "usuarioNombre": "Juan Pérez",
        "tipoResponsabilidadNombre": "Elaboración",
        "esPrincipal": true
      }
    ]
  },
  "message": "Reporte creado exitosamente"
}
```

**Efectos Automáticos:**
- ✅ Se generan períodos automáticamente según `durationMonths`
- ✅ Primer período inicia en `fechaInicioVigencia`
- ✅ Se crean eventos de calendario para cada período
- ✅ **Se envía correo de confirmación** a responsables

**Email Enviado:**
- **Asunto:** "✅ Reporte Creado Exitosamente: {nombre}"
- **Template:** `reporte-creado.html`
- **Destinatarios:** Responsables de elaboración y supervisión
- **Variables:** Todos los datos del reporte

---

### 5.2 Listar Reportes
```http
GET /api/reportes?page=0&size=10&sort=nombre,asc
Authorization: Bearer {token}
```

**Roles:** Todos los autenticados

**Filtros opcionales:**
- `?estado=activo`
- `?entidadId=uuid`
- `?responsableId=uuid`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "reporteId": "uuid",
        "nombre": "Reporte Mensual",
        "entidadNombre": "Empresa XYZ",
        "frecuencia": "mensual",
        "estado": "activo",
        "responsableElaboracionNombre": "Juan Pérez",
        "responsableSupervisionNombre": "María González"
      }
    ],
    "totalElements": 25,
    "totalPages": 3
  }
}
```

---

### 5.3 Obtener Reporte por ID
```http
GET /api/reportes/{reporteId}
Authorization: Bearer {token}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "reporteId": "uuid",
    "nombre": "Reporte Mensual de Operaciones",
    "descripcion": "Descripción detallada",
    "entidadId": "uuid",
    "entidadNombre": "Empresa XYZ",
    "frecuencia": "mensual",
    "formatoRequerido": "PDF",
    "fechaInicioVigencia": "2025-01-01",
    "fechaVencimiento": "2025-01-31",
    "durationMonths": 12,
    "responsables": [
      {
        "usuarioId": "uuid",
        "usuarioNombre": "Juan Pérez",
        "tipoResponsabilidadNombre": "Elaboración",
        "esPrincipal": true,
        "activo": true
      }
    ],
    "correosNotificacion": ["alertas@empresa.com"],
    "estado": "activo",
    "createdAt": "2025-01-01T10:00:00Z"
  }
}
```

---

### 5.4 Actualizar Reporte
```http
PUT /api/reportes/{reporteId}
Authorization: Bearer {token}
```

**Roles:** `admin`, `supervisor`

**Body:** Mismo formato que crear reporte

**Response 200:**
```json
{
  "success": true,
  "data": { /* reporte actualizado */ },
  "message": "Reporte actualizado exitosamente"
}
```

---

### 5.5 Eliminar Reporte
```http
DELETE /api/reportes/{reporteId}
Authorization: Bearer {token}
```

**Roles:** `admin`

**Response 200:**
```json
{
  "success": true,
  "message": "Reporte eliminado exitosamente"
}
```

**Efecto en cascada:**
- ✅ Se eliminan todos los períodos asociados
- ✅ Se eliminan todos los eventos de calendario
- ✅ Se eliminan todos los archivos asociados

---

## 6. Períodos de Reporte

### 6.1 Listar Períodos de un Reporte
```http
GET /api/periodos/reporte/{reporteId}?page=0&size=10
Authorization: Bearer {token}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "periodoId": "uuid",
        "numeroPeriodo": 1,
        "periodoInicio": "2025-01-01",
        "periodoFin": "2025-01-31",
        "fechaVencimientoCalculada": "2025-01-31",
        "estado": "pendiente",
        "diasRestantes": 25,
        "estaAtrasado": false,
        "fechaEnvio": null,
        "archivosCount": 0
      }
    ],
    "totalElements": 12
  }
}
```

**Estados posibles:**
- `"pendiente"` - No enviado aún
- `"enviado"` - Enviado por responsable
- `"aprobado"` - Aprobado por supervisor
- `"rechazado"` - Rechazado, requiere correcciones
- `"vencido"` - No enviado antes del vencimiento

---

### 6.2 Obtener Período por ID
```http
GET /api/periodos/{periodoId}
Authorization: Bearer {token}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "periodoId": "uuid",
    "reporte": {
      "reporteId": "uuid",
      "nombre": "Reporte Mensual",
      "entidadNombre": "Empresa XYZ"
    },
    "numeroPeriodo": 1,
    "periodoInicio": "2025-01-01",
    "periodoFin": "2025-01-31",
    "fechaVencimientoCalculada": "2025-01-31",
    "estado": "enviado",
    "fechaEnvio": "2025-01-28T15:30:00Z",
    "observaciones": "Todo correcto",
    "archivos": [
      {
        "archivoId": "uuid",
        "nombreArchivo": "reporte_enero.pdf",
        "urlPublica": "https://r2.cloudflare.com/bucket/file.pdf",
        "tipoArchivo": "application/pdf",
        "tamanoBytes": 1024000,
        "uploadedAt": "2025-01-28T15:30:00Z"
      }
    ]
  }
}
```

---

### 6.3 Enviar Período (Responsable)
```http
POST /api/periodos/{periodoId}/enviar
Authorization: Bearer {token}
```

**Roles:** `responsable`

**Body:**
```json
{
  "observaciones": "Reporte completado según especificaciones",
  "archivosIds": [
    "uuid-archivo-1",
    "uuid-archivo-2"
  ]
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "periodoId": "uuid",
    "estado": "enviado",
    "fechaEnvio": "2025-01-28T15:30:00Z"
  },
  "message": "Período enviado exitosamente"
}
```

**Efectos Automáticos:**
- ✅ Estado cambia a "enviado"
- ✅ Se registra fecha de envío
- ✅ **Se envía correo al supervisor**
- ✅ Se actualiza evento de calendario

**Email Enviado al Supervisor:**
- **Asunto:** "📬 Reporte Enviado para Revisión: {nombre}"
- **Template:** `notificacion-supervisor.html`
- **Variables:** Responsable, reporte, período, archivos adjuntos
- **Destinatarios:** Todos los supervisores del reporte

---

### 6.4 Aprobar Período (Supervisor)
```http
POST /api/periodos/{periodoId}/aprobar
Authorization: Bearer {token}
```

**Roles:** `supervisor`

**Body:**
```json
{
  "observaciones": "Aprobado sin observaciones"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "periodoId": "uuid",
    "estado": "aprobado",
    "fechaAprobacion": "2025-01-29T10:00:00Z"
  },
  "message": "Período aprobado exitosamente"
}
```

**Efectos:**
- ✅ Estado cambia a "aprobado"
- ✅ Se registra fecha de aprobación
- ✅ Se actualiza evento de calendario (verde)

---

### 6.5 Rechazar Período (Supervisor)
```http
POST /api/periodos/{periodoId}/rechazar
Authorization: Bearer {token}
```

**Roles:** `supervisor`

**Body:**
```json
{
  "observaciones": "Faltan datos en la sección 3. Por favor completar."
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "periodoId": "uuid",
    "estado": "rechazado"
  },
  "message": "Período rechazado"
}
```

**Efectos:**
- ✅ Estado cambia a "rechazado"
- ✅ Responsable puede volver a enviar
- ✅ **Se envía correo al responsable** con las observaciones

---

## 7. Archivos y Evidencias

### 7.1 Subir Archivo
```http
POST /api/archivos/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body (FormData):**
```
file: [archivo binario]
periodoId: uuid-periodo
descripcion: "Reporte mensual en PDF"
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "archivoId": "uuid",
    "nombreArchivo": "reporte_enero.pdf",
    "urlPublica": "https://r2.cloudflare.com/bucket/abc123.pdf",
    "tipoArchivo": "application/pdf",
    "tamanoBytes": 1024000,
    "uploadedAt": "2025-01-28T15:30:00Z"
  },
  "message": "Archivo subido exitosamente"
}
```

**Validaciones:**
- ✅ Tamaño máximo: 50 MB
- ✅ Tipos permitidos: PDF, Excel, Word, Imágenes
- ✅ Usuario debe tener permisos sobre el período

**Almacenamiento:**
- ✅ Cloudflare R2 (S3-compatible)
- ✅ URL pública generada automáticamente
- ✅ Metadata almacenada en PostgreSQL

---

### 7.2 Listar Archivos de un Período
```http
GET /api/archivos/periodo/{periodoId}
Authorization: Bearer {token}
```

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "archivoId": "uuid",
      "nombreArchivo": "reporte.pdf",
      "urlPublica": "https://r2.cloudflare.com/bucket/file.pdf",
      "tipoArchivo": "application/pdf",
      "tamanoBytes": 1024000,
      "descripcion": "Reporte principal",
      "uploadedAt": "2025-01-28T15:30:00Z",
      "uploadedBy": "Juan Pérez"
    }
  ]
}
```

---

### 7.3 Eliminar Archivo
```http
DELETE /api/archivos/{archivoId}
Authorization: Bearer {token}
```

**Roles:** `responsable` (solo sus archivos), `admin`

**Response 200:**
```json
{
  "success": true,
  "message": "Archivo eliminado exitosamente"
}
```

**Efecto:**
- ✅ Se elimina de Cloudflare R2
- ✅ Se elimina el registro de la BD

---

## 8. Calendarios y Eventos

### 8.1 Obtener Eventos del Calendario (Responsable)
```http
GET /api/dashboard/mis-eventos?fechaInicio=2025-01-01&fechaFin=2025-01-31
Authorization: Bearer {token}
```

**Roles:** `responsable`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "eventoId": "uuid",
      "titulo": "Reporte Mensual - Período 1",
      "descripcionCorta": "Pendiente - Vence en 3 días",
      "startDate": "2025-01-01",
      "endDate": "2025-01-31",
      "colorEstado": "#FFA500",
      "periodo": {
        "periodoId": "uuid",
        "estado": "pendiente",
        "diasRestantes": 3
      },
      "reporte": {
        "reporteId": "uuid",
        "nombre": "Reporte Mensual"
      }
    }
  ]
}
```

**Colores por Estado:**
- `#FFA500` (Naranja) - Pendiente
- `#4CAF50` (Verde) - Aprobado
- `#FF6B6B` (Rojo) - Vencido
- `#2196F3` (Azul) - Enviado

---

### 8.2 Obtener Eventos del Calendario (Supervisor)
```http
GET /api/dashboard/calendario-supervisor?fechaInicio=2025-01-01&fechaFin=2025-01-31
Authorization: Bearer {token}
```

**Roles:** `supervisor`

**Response 200:** Mismo formato que responsable, pero con todos los reportes que supervisa

---

### 8.3 Obtener Eventos del Calendario (Admin)
```http
GET /api/dashboard/admin/calendario?fechaInicio=2025-01-01&fechaFin=2025-01-31
Authorization: Bearer {token}
```

**Roles:** `admin`, `auditor`

**Response 200:** Todos los eventos del sistema

---

## 9. Dashboard

### 9.1 Estadísticas del Responsable
```http
GET /api/dashboard/mis-estadisticas
Authorization: Bearer {token}
```

**Roles:** `responsable`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "reportesAsignados": 5,
    "periodosPendientes": 3,
    "periodosEnviados": 10,
    "periodosVencidos": 1,
    "proximosAVencer": [
      {
        "reporteNombre": "Reporte Mensual",
        "periodoNumero": 12,
        "fechaVencimiento": "2025-12-31",
        "diasRestantes": 5
      }
    ]
  }
}
```

---

### 9.2 Estadísticas del Supervisor
```http
GET /api/dashboard/supervisor/estadisticas
Authorization: Bearer {token}
```

**Roles:** `supervisor`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "reportesSupervisados": 15,
    "periodosPendientesRevision": 5,
    "periodosAprobados": 25,
    "periodosRechazados": 2
  }
}
```

---

### 9.3 Estadísticas del Admin
```http
GET /api/dashboard/admin/estadisticas
Authorization: Bearer {token}
```

**Roles:** `admin`, `auditor`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "totalReportes": 50,
    "totalUsuarios": 100,
    "totalEntidades": 20,
    "periodosPendientes": 30,
    "periodosVencidos": 5,
    "cumplimientoPromedio": 85.5
  }
}
```

---

## 10. Auditoría

### 10.1 Listar Accesos al Sistema
```http
GET /api/auditoria/accesos?page=0&size=20
Authorization: Bearer {token}
```

**Roles:** `admin`

**Filtros opcionales:**
- `?usuarioId=uuid`
- `?evento=LOGIN_SUCCESS`
- `?fechaInicio=2025-01-01`
- `?fechaFin=2025-12-31`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "sessionLogId": "uuid",
        "email": "usuario@example.com",
        "evento": "LOGIN_SUCCESS",
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0...",
        "datosAdicionales": {
          "roles": ["responsable"],
          "documentNumber": "1234567890"
        },
        "timestamp": "2025-12-06T10:30:00Z"
      }
    ],
    "totalElements": 150
  }
}
```

**Eventos registrados:**
- `LOGIN_SUCCESS` - Login exitoso
- `LOGIN_FAILED` - Login fallido (credenciales incorrectas, cuenta inactiva, etc.)

---

### 10.2 Estadísticas de Accesos
```http
GET /api/auditoria/accesos/estadisticas
Authorization: Bearer {token}
```

**Roles:** `admin`, `auditor`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "totalAccesos": 1500,
    "accesosExitosos": 1450,
    "accesosFallidos": 50,
    "usuariosActivos": 85,
    "intentosFuerzaBruta": 2
  }
}
```

---

### 10.3 Último Acceso de un Usuario
```http
GET /api/auditoria/accesos/usuario/{usuarioId}/ultimo
Authorization: Bearer {token}
```

**Roles:** `admin`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "email": "usuario@example.com",
    "evento": "LOGIN_SUCCESS",
    "timestamp": "2025-12-06T10:30:00Z",
    "ipAddress": "192.168.1.100"
  }
}
```

---

### 10.4 Mis Accesos (Usuario)
```http
GET /api/auditoria/mis-accesos?page=0&size=10
Authorization: Bearer {token}
```

**Roles:** Todos los autenticados

**Response 200:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "evento": "LOGIN_SUCCESS",
        "timestamp": "2025-12-06T10:30:00Z",
        "ipAddress": "192.168.1.100"
      }
    ]
  }
}
```

---

## 📧 Resumen de Notificaciones por Email

### Correos Automáticos del Sistema

| Evento | Template | Destinatarios | Variables Principales |
|--------|----------|---------------|----------------------|
| **Invitación de Usuario** | `invitation.html` | Usuario invitado | email, token, expiración |
| **Reporte Creado** | `reporte-creado.html` | Responsables asignados | Datos del reporte, responsables |
| **Alerta de Vencimiento** | `alert-vencimiento.html` | Responsable de elaboración | Días restantes, fecha vencimiento |
| **Período Enviado** | `notificacion-supervisor.html` | Supervisores | Responsable, archivos, período |
| **Período Rechazado** | (Simple HTML) | Responsable | Observaciones del supervisor |

### Características de los Correos

- ✅ Templates HTML responsive con Thymeleaf
- ✅ Diseño profesional con gradientes
- ✅ Variables dinámicas sustituidas
- ✅ Links funcionales incluidos
- ✅ Compatible con todos los clientes de correo
- ✅ Asuntos descriptivos con emojis
- ✅ Footer con información del sistema

---

## 🔐 Autenticación y Autorización

### Header de Autenticación

Todos los endpoints protegidos requieren:
```http
Authorization: Bearer {jwt-token}
```

### Roles del Sistema

| Rol | Código | Permisos |
|-----|--------|----------|
| **Administrador** | `admin` | Acceso total al sistema |
| **Supervisor** | `supervisor` | Crear reportes, aprobar/rechazar períodos |
| **Responsable** | `responsable` | Enviar períodos, subir archivos |
| **Auditor** | `auditor` | Solo lectura, acceso a auditoría |

### Validación de Estado

- ✅ Solo usuarios con `estado: "activo"` pueden iniciar sesión
- ✅ Usuarios con `estado: "inactivo"` son rechazados en login
- ✅ Usuarios con `estado: "invited"` deben completar registro primero

---

## 📝 Códigos de Estado HTTP

| Código | Significado | Uso |
|--------|-------------|-----|
| 200 | OK | Operación exitosa |
| 201 | Created | Recurso creado |
| 400 | Bad Request | Validación fallida |
| 401 | Unauthorized | Token inválido o expirado |
| 403 | Forbidden | Sin permisos suficientes |
| 404 | Not Found | Recurso no encontrado |
| 409 | Conflict | Conflicto (email duplicado, etc.) |
| 500 | Internal Server Error | Error del servidor |

---

## 🎯 Flujos Completos

### Flujo 1: Onboarding de Usuario

1. Admin invita usuario: `POST /api/users/invite`
2. Sistema envía correo con token
3. Usuario valida token: `GET /api/users/validate-invitation?token=...`
4. Usuario completa registro: `POST /api/users/complete-invitation`
5. Usuario inicia sesión: `POST /api/auth/login`

### Flujo 2: Creación y Gestión de Reporte

1. Admin/Supervisor crea reporte: `POST /api/reportes`
2. Sistema genera períodos automáticamente
3. Sistema envía correo de confirmación
4. Sistema crea eventos de calendario
5. Responsable ve eventos: `GET /api/dashboard/mis-eventos`

### Flujo 3: Envío y Aprobación de Período

1. Responsable sube archivos: `POST /api/archivos/upload`
2. Responsable envía período: `POST /api/periodos/{id}/enviar`
3. Sistema envía correo al supervisor
4. Supervisor revisa: `GET /api/periodos/{id}`
5. Supervisor aprueba o rechaza: `POST /api/periodos/{id}/aprobar`

### Flujo 4: Alertas de Vencimiento

1. Sistema detecta períodos próximos a vencer (tarea programada)
2. Sistema envía correo de alerta: `sendAlertaVencimiento()`
3. Responsable recibe notificación
4. Responsable completa y envía el período

---

## 🔧 Configuración Requerida

### Variables de Entorno

```bash
# Database
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/llanogas
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=your-password

# Email (Gmail)
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-gmail-app-password

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=86400000

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY=your-access-key
R2_SECRET_KEY=your-secret-key
R2_BUCKET_NAME=your-bucket

# Frontend
APP_FRONTEND_URL=http://localhost:3000
```

---

## 📚 Documentación Adicional

- **Swagger UI:** `http://localhost:8080/swagger-ui.html`
- **API Docs:** `http://localhost:8080/v3/api-docs`

---

## ✅ Estado del Sistema

```
✅ TODOS LOS ENDPOINTS IMPLEMENTADOS
✅ AUTENTICACIÓN Y AUTORIZACIÓN COMPLETA
✅ INVITACIONES CON EMAIL FUNCIONALES
✅ GESTIÓN DE REPORTES Y PERÍODOS
✅ CALENDARIOS DINÁMICOS
✅ AUDITORÍA DE ACCESOS
✅ NOTIFICACIONES AUTOMÁTICAS POR EMAIL
✅ ALMACENAMIENTO EN CLOUDFLARE R2
✅ TESTS DE INTEGRACIÓN PASADOS
✅ DOCUMENTACIÓN COMPLETA
```

**Fecha de última actualización:** 6 de diciembre de 2025  
**Versión:** 2.0  
**Estado:** Producción Ready 🚀

