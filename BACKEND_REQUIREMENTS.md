# Requisitos del Backend - Sistema de Gestión de Reportes

## Resumen Ejecutivo

Este documento especifica **todos los endpoints** que el backend debe implementar para que el frontend actual funcione completamente. El sistema incluye autenticación JWT, gestión de roles jerárquicos (Admin → Supervisor → Responsable, Auditor), flujo de reportes con estados, y módulos CRUD para reportes, entidades, usuarios y evidencias.

**Base URL del Backend:** Variable de entorno `PUBLIC_API_URL`  
**Configuración:** Archivo `.env` en la raíz del proyecto web  
**Desarrollo:** `http://localhost:8080`  
**Producción:** Configurar según entorno

```dotenv
# .env
PUBLIC_API_URL=http://localhost:8080
```

---

## 🔐 1. AUTENTICACIÓN Y AUTORIZACIÓN

### Base URL: `/api/auth`

#### 1.1 Login
```http
POST /api/auth/login
Content-Type: application/json

Request Body:
{
  "email": "string",
  "password": "string"
}

Response 200:
{
  "token": "string",              // JWT token
  "tipo": "Bearer",
  "usuarioId": "string",          // UUID
  "documentNumber": "string",
  "email": "string",
  "firstName": "string",
  "secondName": "string",          // opcional
  "firstLastname": "string",
  "secondLastname": "string",      // opcional
  "roles": ["string"]              // ["admin", "supervisor", etc.]
}

Response 401:
{
  "success": false,
  "message": "Credenciales inválidas",
  "statusCode": 401,
  "timestamp": "2024-12-04T10:00:00Z"
}
```

#### 1.2 Registro
```http
POST /api/auth/registro
Content-Type: application/json

Request Body:
{
  "documentNumber": "string",
  "documentType": "string",        // "CC", "CE", "NIT", etc.
  "email": "string",
  "firstName": "string",
  "secondName": "string",          // opcional
  "firstLastname": "string",
  "secondLastname": "string",      // opcional
  "password": "string",            // mínimo 8 caracteres
  "birthDate": "string",           // ISO 8601: "1990-01-01"
  "roles": ["string"]              // ["responsable"], etc.
}

Response 201:
{
  "mensaje": "Usuario registrado exitosamente"
}

Response 400:
{
  "success": false,
  "message": "El email ya está registrado",
  "statusCode": 400
}
```

#### 1.3 Configuración UI por Rol (CRÍTICO)
```http
GET /api/config/ui
Headers:
  Authorization: Bearer {token}

Response 200:
{
  "rolPrincipal": "supervisor",     // Rol principal del usuario
  "roles": ["supervisor", "responsable"],  // Todos los roles asignados
  "usuario": {
    "usuarioId": "uuid",
    "nombreCompleto": "Juan Pérez García",
    "email": "juan.perez@entidad.gov.co",
    "cargo": "Analista de Cumplimiento"
  },
  "menu": {
    "items": [
      {
        "id": "dashboard",
        "label": "Dashboard",
        "icon": "dashboard",
        "ruta": "/panel",
        "visible": true,
        "subItems": []
      },
      {
        "id": "reportes",
        "label": "Reportes",
        "icon": "file-text",
        "ruta": "/reportes",
        "visible": true,
        "subItems": [
          {
            "id": "mis-reportes",
            "label": "Mis Reportes",
            "ruta": "/mis-reportes",
            "visible": true
          },
          {
            "id": "validacion",
            "label": "Validación",
            "ruta": "/validacion/pendientes",
            "visible": true
          }
        ]
      },
      {
        "id": "entidades",
        "label": "Entidades",
        "icon": "building",
        "ruta": "/entidades",
        "visible": true
      },
      {
        "id": "usuarios",
        "label": "Usuarios",
        "icon": "users",
        "ruta": "/usuarios",
        "visible": true
      },
      {
        "id": "calendario",
        "label": "Calendario",
        "icon": "calendar",
        "ruta": "/calendario",
        "visible": true
      }
    ]
  },
  "permisos": {
    "puedeCrearReporte": true,
    "puedeEditarReporte": true,
    "puedeEliminarReporte": false,
    "puedeEnviarReporte": true,
    "puedeAprobarReporte": true,
    "puedeRechazarReporte": true,
    "puedeVerUsuarios": true,
    "puedeCrearUsuarios": false,
    "puedeEditarUsuarios": false,
    "puedeEliminarUsuarios": false,
    "puedeCambiarRoles": false,
    "puedeVerEntidades": true,
    "puedeCrearEntidades": false,
    "puedeEditarEntidades": false,
    "puedeEliminarEntidades": false,
    "puedeVerAuditoria": false,
    "puedeExportarReportes": true,
    "puedeConfigurarAlertas": false,
    "puedeConfigurarSistema": false
  },
  "dashboard": {
    "tipo": "supervisor",
    "rutaDashboard": "/supervisor/dashboard",
    "widgetsVisibles": [
      "pendientes-validacion",
      "mi-equipo",
      "metricas-mensuales",
      "reportes-criticos"
    ],
    "endpoints": {
      "dashboard": "/api/dashboard/estadisticas",
      "misPeriodos": "/api/flujo-reportes/mis-periodos",
      "pendientes": "/api/flujo-reportes/pendientes-validacion",
      "correcciones": "/api/flujo-reportes/mis-periodos/requieren-correccion"
    }
  }
}

Response 401:
{
  "success": false,
  "message": "Token inválido o expirado",
  "statusCode": 401
}
```

**Nota importante:** Este endpoint es **CRÍTICO** porque el frontend lo usa en `AuthContext.loadConfig()` al iniciar la aplicación para determinar el menú, permisos y vistas disponibles.

---

## 📊 2. REPORTES (CRUD BASE)

### Base URL: `/api/reportes`

#### 2.1 Listar Reportes
```http
GET /api/reportes?page=0&size=10&sort=fechaVencimiento,asc
Headers:
  Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "content": [
      {
        "reporteId": "uuid",
        "nombre": "Reporte SUI Mensual",
        "descripcion": "Reporte mensual de servicios públicos",
        "entidadId": "uuid",
        "entidadNombre": "Superintendencia de Servicios Públicos",
        "frecuencia": "MENSUAL",
        "formatoRequerido": "EXCEL",
        "baseLegal": "Resolución 123 de 2023",
        "fechaInicioVigencia": "2024-01-01",
        "fechaFinVigencia": null,
        "fechaVencimiento": "2024-12-05",
        "plazoAdicionalDias": 5,
        "linkInstrucciones": "https://sui.gov.co/instructivo",
        "responsableElaboracionId": ["uuid1", "uuid2"],
        "responsableElaboracionNombre": "Juan Pérez, María García",
        "responsableSupervisionId": ["uuid3"],
        "responsableSupervisionNombre": "Carlos Rodríguez",
        "correosNotificacion": ["juan@entidad.gov.co", "maria@entidad.gov.co"],
        "telefonoResponsable": "+57 300 123 4567",
        "estado": "PENDIENTE",
        "creadoEn": "2024-01-15T10:00:00Z",
        "actualizadoEn": "2024-12-01T14:30:00Z"
      }
    ],
    "totalPages": 5,
    "totalElements": 48,
    "size": 10,
    "number": 0,
    "first": true,
    "last": false,
    "empty": false
  },
  "message": "Reportes obtenidos exitosamente",
  "statusCode": 200
}
```

#### 2.2 Obtener Reporte por ID
```http
GET /api/reportes/{reporteId}
Headers:
  Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "reporteId": "uuid",
    "nombre": "string",
    "descripcion": "string",
    "entidadId": "uuid",
    "entidadNombre": "string",
    // ... resto de campos igual que en listar
  },
  "message": "Reporte obtenido exitosamente",
  "statusCode": 200
}
```

#### 2.3 Crear Reporte (Formato Nuevo con Responsables)
```http
POST /api/reportes
Headers:
  Authorization: Bearer {token}
Content-Type: application/json

Request Body (Formato Nuevo):
{
  "nombre": "Reporte SUI Mensual",
  "descripcion": "Descripción del reporte",
  "entidadId": "uuid",
  "frecuencia": "MENSUAL",              // MENSUAL, TRIMESTRAL, SEMESTRAL, ANUAL
  "formatoRequerido": "EXCEL",          // PDF, EXCEL, WORD, OTRO
  "baseLegal": "Resolución 123",
  "fechaInicioVigencia": "2024-01-01",
  "fechaFinVigencia": null,
  "fechaVencimiento": "2024-12-05",
  "plazoAdicionalDias": 5,
  "linkInstrucciones": "https://...",
  "responsables": [
    {
      "usuarioId": "uuid1",
      "tipoResponsabilidad": "elaboracion",  // elaboracion, supervision, revision
      "esPrincipal": true,
      "fechaInicio": "2024-01-01",
      "fechaFin": null,
      "observaciones": "Responsable principal"
    },
    {
      "usuarioId": "uuid2",
      "tipoResponsabilidad": "supervision",
      "esPrincipal": true,
      "fechaInicio": "2024-01-01"
    }
  ],
  "correosNotificacion": ["email@example.com"],
  "telefonoResponsable": "+57 300 123 4567",
  "estado": "PENDIENTE"
}

Request Body (Formato Legacy - Aún Funciona):
{
  "nombre": "Reporte SUI Mensual",
  "entidadId": "uuid",
  "frecuencia": "MENSUAL",
  "formatoRequerido": "EXCEL",
  "fechaInicioVigencia": "2024-01-01",
  "responsableElaboracionId": ["uuid1", "uuid2"],
  "responsableSupervisionId": ["uuid3"]
  // ... resto de campos
}

Response 201:
{
  "success": true,
  "data": {
    "reporteId": "uuid",
    // ... datos del reporte creado
  },
  "message": "Reporte creado exitosamente",
  "statusCode": 201
}
```

#### 2.4 Actualizar Reporte
```http
PUT /api/reportes/{reporteId}
Headers:
  Authorization: Bearer {token}
Content-Type: application/json

Request Body: (Igual que crear)

Response 200:
{
  "success": true,
  "data": { /* reporte actualizado */ },
  "message": "Reporte actualizado exitosamente",
  "statusCode": 200
}
```

#### 2.5 Eliminar Reporte
```http
DELETE /api/reportes/{reporteId}
Headers:
  Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "mensaje": "Reporte eliminado exitosamente"
  },
  "statusCode": 200
}
```

#### 2.6 Agregar Responsable a Reporte Existente (Nuevo)
```http
POST /api/reportes/{reporteId}/responsables
Headers:
  Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "usuarioId": "uuid",
  "tipoResponsabilidad": "revision",
  "esPrincipal": false,
  "fechaInicio": "2024-06-01",
  "observaciones": "Nuevo revisor de calidad"
}

Response 200:
{
  "success": true,
  "data": { /* reporte actualizado */ },
  "message": "Responsable agregado exitosamente",
  "statusCode": 200
}
```

#### 2.7 Cambiar Estado de Reporte
```http
PATCH /api/reportes/{reporteId}/estado?estado=EN_PROGRESO
Headers:
  Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": { /* reporte actualizado */ },
  "statusCode": 200
}
```

#### 2.8 Filtrar por Estado
```http
GET /api/reportes/estado/{estado}?page=0&size=10
Headers:
  Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "content": [ /* reportes */ ],
    // ... paginación
  },
  "statusCode": 200
}
```

#### 2.9 Reportes de una Entidad
```http
GET /api/reportes/entidad/{entidadId}?page=0&size=10
Headers:
  Authorization: Bearer {token}

Response 200: (Mismo formato que listar)
```

#### 2.10 Reportes Vencidos
```http
GET /api/reportes/vencidos
Headers:
  Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": [ /* lista de reportes vencidos */ ],
  "statusCode": 200
}
```

---

## 🔄 3. FLUJO DE REPORTES (Estados y Transiciones)

### Base URL: `/api/flujo-reportes`

**Estados del flujo:**
1. `pendiente` - Periodo creado, esperando elaboración
2. `en_elaboracion` - Responsable trabajando en el reporte
3. `enviado` - Enviado a supervisión
4. `en_revision` - Supervisor revisando
5. `requiere_correccion` - Supervisor solicitó cambios
6. `aprobado` - Supervisor aprobó
7. `rechazado` - Supervisor rechazó
8. `vencido` - Pasó la fecha límite
9. `extemporaneo` - Enviado fuera de plazo

#### 3.1 Obtener Mis Periodos (RESPONSABLE)
```http
GET /api/flujo-reportes/mis-periodos?page=0&size=10&sort=fechaVencimientoCalculada,asc
Headers:
  Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "content": [
      {
        "periodoId": "uuid",
        "reporteId": "uuid",
        "reporteNombre": "Reporte SUI Mensual",
        "entidadNombre": "Superintendencia",
        "periodoTipo": "mensual",
        "periodoInicio": "2024-11-01",
        "periodoFin": "2024-11-30",
        "fechaVencimientoCalculada": "2024-12-05",
        "estado": "pendiente",
        "estadoDescripcion": "Pendiente de elaboración",
        "fechaEnvioReal": null,
        "diasDesviacion": null,
        "responsableElaboracion": {
          "usuarioId": "uuid",
          "nombreCompleto": "Juan Pérez García",
          "email": "juan@entidad.gov.co",
          "cargo": "Analista"
        },
        "responsableSupervision": {
          "usuarioId": "uuid",
          "nombreCompleto": "Carlos Rodríguez",
          "email": "carlos@entidad.gov.co",
          "cargo": "Supervisor"
        },
        "comentarios": null,
        "cantidadArchivos": 0,
        "puedeEnviar": true,
        "puedeAprobar": false,
        "puedeRechazar": false,
        "puedeCorregir": false,
        "createdAt": "2024-11-01T00:00:00Z",
        "updatedAt": "2024-11-01T00:00:00Z"
      }
    ],
    "totalPages": 3,
    "totalElements": 28,
    "size": 10,
    "number": 0
  },
  "statusCode": 200
}
```

#### 3.2 Periodos Pendientes
```http
GET /api/flujo-reportes/mis-periodos/pendientes?page=0&size=10
Headers:
  Authorization: Bearer {token}

Response 200: (Mismo formato que mis-periodos)
```

#### 3.3 Periodos que Requieren Corrección
```http
GET /api/flujo-reportes/mis-periodos/requieren-correccion?page=0&size=10
Headers:
  Authorization: Bearer {token}

Response 200: (Mismo formato que mis-periodos)
```

#### 3.4 Enviar Reporte
```http
POST /api/flujo-reportes/enviar
Headers:
  Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "periodoId": "uuid",
  "comentarios": "Reporte completado según lineamientos",
  "evidenciasIds": ["uuid1", "uuid2", "uuid3"]  // IDs de archivos subidos
}

Response 200:
{
  "success": true,
  "data": {
    "periodoId": "uuid",
    "estado": "enviado",
    // ... resto de datos del periodo actualizado
  },
  "message": "Reporte enviado exitosamente",
  "statusCode": 200
}
```

#### 3.5 Corregir y Reenviar
```http
POST /api/flujo-reportes/corregir-reenviar
Headers:
  Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "periodoId": "uuid",
  "comentarios": "Correcciones realizadas según indicaciones",
  "evidenciasIds": ["uuid1", "uuid2"]
}

Response 200:
{
  "success": true,
  "data": { /* periodo actualizado */ },
  "message": "Reporte corregido y reenviado",
  "statusCode": 200
}
```

#### 3.6 Periodos Pendientes de Validación (SUPERVISOR)
```http
GET /api/flujo-reportes/pendientes-validacion?page=0&size=10
Headers:
  Authorization: Bearer {token}

Response 200: (Mismo formato que mis-periodos)
```

#### 3.7 Periodos Bajo Mi Supervisión
```http
GET /api/flujo-reportes/supervision?page=0&size=10
Headers:
  Authorization: Bearer {token}

Response 200: (Mismo formato que mis-periodos)
```

#### 3.8 Validar Reporte (Aprobar/Rechazar)
```http
POST /api/flujo-reportes/validar
Headers:
  Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "periodoId": "uuid",
  "accion": "aprobar",                    // "aprobar" o "rechazar"
  "comentarios": "Reporte aprobado sin observaciones",
  "motivoRechazo": null                   // Requerido si accion = "rechazar"
}

Response 200:
{
  "success": true,
  "data": { /* periodo actualizado con estado "aprobado" o "rechazado" */ },
  "message": "Reporte validado exitosamente",
  "statusCode": 200
}
```

#### 3.9 Aprobar Directamente
```http
POST /api/flujo-reportes/{periodoId}/aprobar?comentarios=Todo%20correcto
Headers:
  Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": { /* periodo aprobado */ },
  "statusCode": 200
}
```

#### 3.10 Rechazar Directamente
```http
POST /api/flujo-reportes/{periodoId}/rechazar?motivoRechazo=Datos%20inconsistentes
Headers:
  Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": { /* periodo rechazado */ },
  "statusCode": 200
}
```

#### 3.11 Solicitar Corrección
```http
POST /api/flujo-reportes/solicitar-correccion
Headers:
  Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "periodoId": "uuid",
  "motivoCorreccion": "Revisar cifras del tercer trimestre",
  "detallesCorreccion": "Los valores en la tabla 3 no coinciden con el consolidado",
  "fechaLimiteCorreccion": "2024-12-10"
}

Response 200:
{
  "success": true,
  "data": { /* periodo con estado "requiere_correccion" */ },
  "statusCode": 200
}
```

#### 3.12 Obtener Detalle de Periodo
```http
GET /api/flujo-reportes/periodos/{periodoId}
Headers:
  Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": { /* datos completos del periodo */ },
  "statusCode": 200
}
```

#### 3.13 Historial de Estados
```http
GET /api/flujo-reportes/periodos/{periodoId}/historial
Headers:
  Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": [
    {
      "estadoAnterior": "pendiente",
      "estadoNuevo": "en_elaboracion",
      "fecha": "2024-11-05T10:00:00Z",
      "usuarioNombre": "Juan Pérez García",
      "comentario": "Iniciado trabajo en el reporte"
    },
    {
      "estadoAnterior": "en_elaboracion",
      "estadoNuevo": "enviado",
      "fecha": "2024-11-28T16:30:00Z",
      "usuarioNombre": "Juan Pérez García",
      "comentario": "Reporte completado"
    }
  ],
  "statusCode": 200
}
```

#### 3.14 Filtrar por Estado
```http
GET /api/flujo-reportes/periodos/estado/{estado}?page=0&size=10
Headers:
  Authorization: Bearer {token}

Response 200: (Mismo formato que mis-periodos)
```

---

## 🏢 4. ENTIDADES

### Base URL: `/api/entidades`

#### 4.1 Listar Entidades
```http
GET /api/entidades?page=0&size=10&sort=nombre,asc
Headers:
  Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "content": [
      {
        "entidadId": "uuid",
        "nit": "900123456-7",
        "nombre": "Superintendencia de Servicios Públicos",
        "paginaWeb": "https://www.superservicios.gov.co",
        "baseLegal": "Ley 142 de 1994",
        "observaciones": "Ente regulador",
        "estado": "ACTIVA",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    // ... paginación
  },
  "statusCode": 200
}
```

#### 4.2 Entidades Activas
```http
GET /api/entidades/activas?page=0&size=100
Headers:
  Authorization: Bearer {token}

Response 200: (Mismo formato que listar, solo entidades con estado = ACTIVA)
```

#### 4.3 Obtener Entidad por ID
```http
GET /api/entidades/{entidadId}
Headers:
  Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": { /* datos de la entidad */ },
  "statusCode": 200
}
```

#### 4.4 Crear Entidad
```http
POST /api/entidades
Headers:
  Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "nit": "900123456-7",
  "nombre": "Nueva Entidad",
  "paginaWeb": "https://ejemplo.gov.co",
  "baseLegal": "Ley XYZ",
  "observaciones": "Observaciones adicionales",
  "estado": "ACTIVA"
}

Response 201:
{
  "success": true,
  "data": { /* entidad creada */ },
  "statusCode": 201
}
```

#### 4.5 Actualizar Entidad
```http
PUT /api/entidades/{entidadId}
Headers:
  Authorization: Bearer {token}
Content-Type: application/json

Request Body: (Igual que crear)

Response 200:
{
  "success": true,
  "data": { /* entidad actualizada */ },
  "statusCode": 200
}
```

#### 4.6 Eliminar Entidad
```http
DELETE /api/entidades/{entidadId}
Headers:
  Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "mensaje": "Entidad eliminada exitosamente"
  },
  "statusCode": 200
}
```

---

## 📎 5. EVIDENCIAS (Archivos)

### Base URL: `/api/evidencias`

#### 5.1 Subir Archivo
```http
POST /api/evidencias/reporte/{reporteId}
Headers:
  Authorization: Bearer {token}
Content-Type: multipart/form-data

Request Body (form-data):
  file: [binary file]

Response 200:
{
  "success": true,
  "data": {
    "id": "uuid",
    "nombreArchivo": "reporte_sui_nov_2024.xlsx",
    "tipoArchivo": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "tamano": 245678,                    // bytes
    "reporteId": "uuid",
    "subidoPorId": "uuid",
    "subidoPorNombre": "Juan Pérez",
    "creadoEn": "2024-12-04T10:30:00Z"
  },
  "message": "Archivo subido exitosamente",
  "statusCode": 200
}
```

#### 5.2 Listar Evidencias de un Reporte
```http
GET /api/evidencias/reporte/{reporteId}
Headers:
  Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "nombreArchivo": "reporte.xlsx",
      "tipoArchivo": "application/vnd.ms-excel",
      "tamano": 123456,
      "reporteId": "uuid",
      "subidoPorId": "uuid",
      "subidoPorNombre": "Juan Pérez",
      "creadoEn": "2024-12-01T10:00:00Z"
    }
  ],
  "statusCode": 200
}
```

#### 5.3 Descargar Evidencia
```http
GET /api/evidencias/{evidenciaId}/descargar
Headers:
  Authorization: Bearer {token}

Response 200:
  Content-Type: application/octet-stream
  Content-Disposition: attachment; filename="reporte.xlsx"
  [binary data]
```

#### 5.4 Obtener Metadata de Evidencia
```http
GET /api/evidencias/{evidenciaId}
Headers:
  Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "id": "uuid",
    "nombreArchivo": "reporte.xlsx",
    "tipoArchivo": "application/vnd.ms-excel",
    "tamano": 123456,
    "reporteId": "uuid",
    "subidoPorId": "uuid",
    "subidoPorNombre": "Juan Pérez",
    "creadoEn": "2024-12-01T10:00:00Z"
  },
  "statusCode": 200
}
```

#### 5.5 Eliminar Evidencia
```http
DELETE /api/evidencias/{evidenciaId}
Headers:
  Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "mensaje": "Evidencia eliminada exitosamente"
  },
  "statusCode": 200
}
```

---

## 👥 6. USUARIOS

### Base URL: `/api/usuarios`

#### 6.1 Listar Usuarios
```http
GET /api/usuarios?page=0&size=100&sort=firstName,asc
Headers:
  Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "content": [
      {
        "usuarioId": "uuid",
        "documentNumber": "123456789",
        "documentType": "CC",
        "email": "juan.perez@entidad.gov.co",
        "firstName": "Juan",
        "secondName": "Carlos",
        "firstLastname": "Pérez",
        "secondLastname": "García",
        "telefono": "+57 300 123 4567",
        "proceso": "Gestión de Reportes",
        "cargo": "Analista de Cumplimiento",
        "estado": "ACTIVO",
        "ultimoAcceso": "2024-12-04T09:30:00Z",
        "roles": ["responsable", "supervisor"],
        "createdAt": "2024-01-15T00:00:00Z",
        "updatedAt": "2024-12-01T10:00:00Z"
      }
    ],
    // ... paginación
  },
  "statusCode": 200
}
```

#### 6.2 Obtener Usuario por Document Number
```http
GET /api/usuarios/{documentNumber}
Headers:
  Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": { /* datos del usuario */ },
  "statusCode": 200
}
```

#### 6.3 Crear Usuario
```http
POST /api/auth/registro
Headers:
  Authorization: Bearer {token}
Content-Type: application/json

Request Body:
{
  "documentNumber": "987654321",
  "documentType": "CC",
  "email": "nuevo@entidad.gov.co",
  "firstName": "María",
  "secondName": "Fernanda",
  "firstLastname": "López",
  "secondLastname": "Martínez",
  "password": "Pass1234!",
  "birthDate": "1990-05-15",
  "telefono": "+57 310 987 6543",
  "proceso": "Auditoría",
  "cargo": "Auditor Junior",
  "roles": ["auditor"]
}

Response 201:
{
  "success": true,
  "data": { /* usuario creado */ },
  "statusCode": 201
}
```

#### 6.4 Actualizar Usuario
```http
PUT /api/usuarios/{documentNumber}
Headers:
  Authorization: Bearer {token}
Content-Type: application/json

Request Body: (Mismos campos que crear, password es opcional)

Response 200:
{
  "success": true,
  "data": { /* usuario actualizado */ },
  "statusCode": 200
}
```

#### 6.5 Eliminar Usuario
```http
DELETE /api/usuarios/{documentNumber}
Headers:
  Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "message": "Usuario eliminado exitosamente",
  "statusCode": 200
}
```

---

## 📈 7. DASHBOARD Y ESTADÍSTICAS

### Base URL: `/api/dashboard`

#### 7.1 Estadísticas Generales
```http
GET /api/dashboard/estadisticas?periodo=mes_actual
Headers:
  Authorization: Bearer {token}

Parámetros opcionales:
  - periodo: "mes_actual", "trimestre_actual", "año_actual", "personalizado"
  - fechaInicio: "2024-01-01" (si periodo=personalizado)
  - fechaFin: "2024-12-31" (si periodo=personalizado)

Response 200:
{
  "success": true,
  "data": {
    "totalReportes": 48,
    "reportesPendientes": 12,
    "reportesEnProgreso": 8,
    "reportesEnviados": 15,
    "reportesVencidos": 3,
    "tasaCumplimiento": 87.5
  },
  "statusCode": 200
}
```

#### 7.2 Tasa de Cumplimiento
```http
GET /api/dashboard/cumplimiento
Headers:
  Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": 87.5,                          // porcentaje
  "statusCode": 200
}
```

---

## 🔒 8. SEGURIDAD Y MANEJO DE ERRORES

### 8.1 Códigos de Estado HTTP

| Código | Significado | Uso |
|--------|-------------|-----|
| 200 | OK | Operación exitosa |
| 201 | Created | Recurso creado exitosamente |
| 204 | No Content | Eliminación exitosa sin contenido |
| 400 | Bad Request | Datos inválidos o incompletos |
| 401 | Unauthorized | Token inválido o expirado |
| 403 | Forbidden | Usuario sin permisos |
| 404 | Not Found | Recurso no encontrado |
| 409 | Conflict | Conflicto (ej: email duplicado) |
| 500 | Internal Server Error | Error del servidor |

### 8.2 Formato de Error Estándar

```json
{
  "success": false,
  "message": "Descripción del error",
  "errors": [
    {
      "field": "email",
      "message": "El email ya está registrado"
    }
  ],
  "statusCode": 400,
  "timestamp": "2024-12-04T10:00:00Z",
  "path": "/api/reportes"
}
```

### 8.3 Autenticación JWT

**Header requerido en todas las peticiones protegidas:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token debe incluir:**
- `usuarioId`: UUID del usuario
- `roles`: Array de roles
- `exp`: Timestamp de expiración (recomendado: 24 horas)

### 8.4 CORS

El backend debe permitir:
```
Access-Control-Allow-Origin: http://localhost:4321 (desarrollo)
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Allow-Credentials: true
```

---

## 📝 9. NOTAS DE IMPLEMENTACIÓN

### 9.1 Paginación
- Todos los endpoints que retornan listas deben soportar paginación
- Parámetros: `page` (0-indexed), `size` (default: 10), `sort` (ej: "nombre,asc")
- Formato de respuesta: objeto Page con `content`, `totalPages`, `totalElements`, etc.

### 9.2 Formato de Fechas
- Todas las fechas en formato ISO 8601: `YYYY-MM-DDTHH:mm:ssZ`
- Zona horaria: UTC o especificada con offset

### 9.3 Validaciones Requeridas
- **Email**: Formato válido y único
- **Password**: Mínimo 8 caracteres, al menos 1 mayúscula, 1 minúscula, 1 número
- **Document Number**: Único en el sistema
- **Roles**: Validar que existan en el sistema
- **Fechas**: fechaInicio debe ser anterior a fechaFin
- **Estados**: Solo transiciones válidas en el flujo

### 9.4 Reglas de Negocio Críticas

#### Flujo de Estados de Periodo:
```
pendiente → en_elaboracion → enviado → en_revision → aprobado/rechazado
                                  ↓
                          requiere_correccion → en_elaboracion
```

#### Permisos por Rol:
- **Admin**: Todos los permisos
- **Supervisor**: Aprobar/rechazar reportes, ver su equipo, crear entidades
- **Responsable**: Enviar reportes, ver sus reportes, subir evidencias
- **Auditor**: Solo lectura, generar reportes de cumplimiento

### 9.5 Archivos y Límites
- Tamaño máximo por archivo: 10 MB
- Formatos permitidos: PDF, XLSX, DOCX, PNG, JPG
- Almacenamiento: Sistema de archivos o S3-compatible

### 9.6 Notificaciones (Opcional pero Recomendado)
- Email al enviar reporte
- Email al aprobar/rechazar
- Email antes de vencimiento (3 días, 1 día, día de vencimiento)

---

## 🚀 10. PRIORIZACIÓN DE DESARROLLO

### Fase 1 (MVP - Crítico):
1. ✅ Autenticación (`/api/auth/login`, `/api/auth/registro`)
2. ✅ Configuración UI (`/api/config/ui`) - **MUY IMPORTANTE**
3. ✅ CRUD Reportes básico
4. ✅ CRUD Usuarios básico
5. ✅ CRUD Entidades básico

### Fase 2 (Funcionalidad Core):
6. ✅ Flujo de reportes (mis-periodos, enviar, validar)
7. ✅ Evidencias (subir, listar, descargar)
8. ✅ Dashboard básico

### Fase 3 (Avanzado):
9. ✅ Historial de estados
10. ✅ Nuevo formato de responsables
11. ✅ Notificaciones por email
12. ✅ Reportes de cumplimiento

---

## 📋 11. CHECKLIST DE VALIDACIÓN

Antes de considerar el backend completo, verificar:

- [ ] Todos los endpoints retornan el formato de respuesta estándar
- [ ] JWT funciona correctamente con expiración
- [ ] CORS configurado para desarrollo y producción
- [ ] Paginación funciona en todos los endpoints de listado
- [ ] Validaciones de negocio implementadas
- [ ] Manejo de errores consistente
- [ ] Logs de auditoría para cambios críticos
- [ ] Tests de integración para flujos principales
- [ ] Documentación Swagger/OpenAPI disponible
- [ ] Variables de entorno para configuración
- [ ] Base de datos con índices apropiados
- [ ] Respaldos automáticos configurados

---

## 📞 12. ENDPOINTS RESUMIDOS (Quick Reference)

### Autenticación
- `POST /api/auth/login` - Login
- `POST /api/auth/registro` - Registro
- `GET /api/config/ui` - Configuración por rol ⚠️ CRÍTICO

### Reportes
- `GET /api/reportes` - Listar
- `POST /api/reportes` - Crear
- `PUT /api/reportes/{id}` - Actualizar
- `DELETE /api/reportes/{id}` - Eliminar
- `POST /api/reportes/{id}/responsables` - Agregar responsable

### Flujo
- `GET /api/flujo-reportes/mis-periodos` - Mis periodos
- `POST /api/flujo-reportes/enviar` - Enviar reporte
- `GET /api/flujo-reportes/pendientes-validacion` - Pendientes (supervisor)
- `POST /api/flujo-reportes/validar` - Aprobar/Rechazar

### Entidades
- `GET /api/entidades` - Listar
- `POST /api/entidades` - Crear
- `PUT /api/entidades/{id}` - Actualizar
- `DELETE /api/entidades/{id}` - Eliminar

### Usuarios
- `GET /api/usuarios` - Listar
- `PUT /api/usuarios/{doc}` - Actualizar
- `DELETE /api/usuarios/{doc}` - Eliminar

### Evidencias
- `POST /api/evidencias/reporte/{id}` - Subir archivo
- `GET /api/evidencias/reporte/{id}` - Listar archivos
- `GET /api/evidencias/{id}/descargar` - Descargar

### Dashboard
- `GET /api/dashboard/estadisticas` - Estadísticas
- `GET /api/dashboard/cumplimiento` - Tasa de cumplimiento

---

**Total de Endpoints: 42**

**Prioridad Alta (MVP): 15 endpoints**
**Prioridad Media (Core): 18 endpoints**
**Prioridad Baja (Avanzado): 9 endpoints**
