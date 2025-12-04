# Especificación Completa de Endpoints - Sistema de Gestión de Reportes

**Última actualización:** 2025-12-04  
**Versión:** 2.0  
**Backend Base URL:** `http://localhost:8080/api`

---

## 📋 Tabla de Contenidos

1. [Autenticación y Autorización](#1-autenticación-y-autorización)
2. [Configuración de UI](#2-configuración-de-ui)
3. [Reportes (CRUD)](#3-reportes-crud)
4. [Flujo de Reportes](#4-flujo-de-reportes)
5. [Entidades](#5-entidades)
6. [Usuarios](#6-usuarios)
7. [Evidencias](#7-evidencias)
8. [Dashboard](#8-dashboard)
9. [Responsables de Reportes](#9-responsables-de-reportes)
10. [Códigos de Estado y Errores](#10-códigos-de-estado-y-errores)

---

## 1. Autenticación y Autorización

### 1.1 Login
**Endpoint:** `POST /api/auth/login`  
**Autenticación:** No requerida  
**Descripción:** Inicia sesión y obtiene un token JWT

#### Request Body:
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

#### Response 200 (Success):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tipo": "Bearer",
  "usuarioId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "documentNumber": "123456789",
  "email": "admin@example.com",
  "firstName": "Juan",
  "secondName": "Carlos",
  "firstLastname": "Pérez",
  "secondLastname": "García",
  "roles": ["admin"]
}
```

#### Response 401 (Error):
```json
{
  "success": false,
  "message": "Credenciales inválidas",
  "statusCode": 401,
  "timestamp": "2025-12-04T10:00:00Z"
}
```

---

### 1.2 Registro
**Endpoint:** `POST /api/auth/registro`  
**Autenticación:** No requerida (puede requerir admin en producción)  
**Descripción:** Registra un nuevo usuario

#### Request Body:
```json
{
  "documentNumber": "987654321",
  "documentType": "CC",
  "email": "nuevo@example.com",
  "firstName": "María",
  "secondName": "Fernanda",
  "firstLastname": "López",
  "secondLastname": "Martínez",
  "password": "Pass1234!",
  "telefono": "+57 310 987 6543",
  "proceso": "Gestión de Reportes",
  "cargo": "Analista",
  "roles": ["responsable"]
}
```

#### Response 201 (Success):
```json
{
  "mensaje": "Usuario registrado exitosamente"
}
```

---

## 2. Configuración de UI

### 2.1 Obtener Configuración por Rol
**Endpoint:** `GET /api/config/ui`  
**Autenticación:** Bearer Token requerido  
**Descripción:** **CRÍTICO** - Retorna la configuración de UI, menú, permisos y endpoints según el rol del usuario autenticado

#### Headers:
```
Authorization: Bearer {token}
```

#### Response 200:
```json
{
  "success": true,
  "data": {
    "rolPrincipal": "admin",
    "roles": ["admin"],
    "usuario": {
      "usuarioId": "uuid",
      "nombreCompleto": "Juan Pérez García",
      "email": "admin@example.com",
      "cargo": "Administrador del Sistema"
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
              "id": "crear-reporte",
              "label": "Crear Reporte",
              "ruta": "/reportes/nuevo",
              "visible": true
            },
            {
              "id": "listar-reportes",
              "label": "Ver Todos",
              "ruta": "/reportes",
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
        }
      ]
    },
    "permisos": {
      "puedeCrearReporte": true,
      "puedeEditarReporte": true,
      "puedeEliminarReporte": true,
      "puedeEnviarReporte": true,
      "puedeAprobarReporte": true,
      "puedeRechazarReporte": true,
      "puedeVerUsuarios": true,
      "puedeCrearUsuarios": true,
      "puedeEditarUsuarios": true,
      "puedeEliminarUsuarios": true,
      "puedeCambiarRoles": true,
      "puedeVerEntidades": true,
      "puedeCrearEntidades": true,
      "puedeEditarEntidades": true,
      "puedeEliminarEntidades": true,
      "puedeVerAuditoria": true,
      "puedeExportarReportes": true,
      "puedeConfigurarAlertas": true,
      "puedeConfigurarSistema": true
    },
    "dashboard": {
      "tipo": "admin",
      "rutaDashboard": "/admin/dashboard",
      "widgetsVisibles": [
        "metricas-globales",
        "gestion-usuarios",
        "gestion-entidades",
        "alertas-globales",
        "calendario-global"
      ],
      "endpoints": {
        "dashboard": "/api/dashboard/admin",
        "estadisticas": "/api/dashboard/estadisticas"
      }
    }
  },
  "message": "Configuración obtenida exitosamente",
  "statusCode": 200,
  "timestamp": "2025-12-04T10:00:00Z"
}
```

**Nota:** La configuración varía según el rol:
- **admin:** Acceso total, todos los permisos
- **supervisor:** Aprobación, supervisión, sin crear/eliminar usuarios
- **responsable:** Solo sus reportes, sin gestión de usuarios/entidades
- **auditor:** Solo lectura, sin modificaciones

---

## 3. Reportes (CRUD)

### 3.1 Listar Reportes
**Endpoint:** `GET /api/reportes`  
**Autenticación:** Bearer Token  
**Descripción:** Lista todos los reportes con paginación

#### Query Parameters:
- `page` (int, default: 0): Número de página
- `size` (int, default: 10): Elementos por página
- `sort` (string, default: "fechaVencimiento,asc"): Ordenamiento

#### Response 200:
```json
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
        "responsableElaboracionIds": ["uuid1", "uuid2"],
        "responsableElaboracionNombres": "Juan Pérez, María García",
        "responsableSupervisionIds": ["uuid3"],
        "responsableSupervisionNombres": "Carlos Rodríguez",
        "correosNotificacion": ["juan@entidad.gov.co"],
        "telefonoResponsable": "+57 300 123 4567",
        "estado": "PENDIENTE",
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-12-01T14:30:00Z"
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

---

### 3.2 Obtener Reporte por ID
**Endpoint:** `GET /api/reportes/{reporteId}`  
**Autenticación:** Bearer Token  
**Descripción:** Obtiene un reporte específico por su UUID

#### Response 200:
```json
{
  "success": true,
  "data": {
    "reporteId": "uuid",
    "nombre": "Reporte SUI Mensual",
    "descripcion": "Descripción detallada",
    "entidadId": "uuid",
    "entidadNombre": "Superintendencia",
    "frecuencia": "MENSUAL",
    "formatoRequerido": "EXCEL",
    "baseLegal": "Resolución 123",
    "fechaInicioVigencia": "2024-01-01",
    "fechaFinVigencia": null,
    "fechaVencimiento": "2024-12-05",
    "plazoAdicionalDias": 5,
    "linkInstrucciones": "https://...",
    "responsables": [
      {
        "usuarioId": "uuid1",
        "nombreCompleto": "Juan Pérez",
        "tipoResponsabilidad": "elaboracion",
        "esPrincipal": true
      }
    ],
    "correosNotificacion": ["email@example.com"],
    "telefonoResponsable": "+57 300 123 4567",
    "estado": "PENDIENTE",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-12-01T14:30:00Z"
  },
  "statusCode": 200
}
```

---

### 3.3 Crear Reporte
**Endpoint:** `POST /api/reportes`  
**Autenticación:** Bearer Token  
**Roles permitidos:** admin, supervisor  
**Descripción:** Crea un nuevo reporte con sus responsables

#### Request Body:
```json
{
  "nombre": "Reporte SUI Mensual",
  "descripcion": "Reporte mensual de servicios públicos",
  "entidadId": "uuid",
  "frecuencia": "MENSUAL",
  "formatoRequerido": "EXCEL",
  "baseLegal": "Resolución 123 de 2023",
  "fechaInicioVigencia": "2024-01-01",
  "fechaFinVigencia": null,
  "fechaVencimiento": "2024-12-05",
  "plazoAdicionalDias": 5,
  "linkInstrucciones": "https://sui.gov.co/instructivo",
  "responsables": [
    {
      "usuarioId": "uuid1",
      "tipoResponsabilidad": "elaboracion",
      "esPrincipal": true,
      "fechaInicio": "2024-01-01",
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
```

**Valores permitidos:**
- `frecuencia`: "MENSUAL", "TRIMESTRAL", "SEMESTRAL", "ANUAL"
- `formatoRequerido`: "PDF", "EXCEL", "WORD", "OTRO"
- `tipoResponsabilidad`: "elaboracion", "supervision", "revision"

#### Response 201:
```json
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

---

### 3.4 Actualizar Reporte
**Endpoint:** `PUT /api/reportes/{reporteId}`  
**Autenticación:** Bearer Token  
**Roles permitidos:** admin, supervisor  
**Descripción:** Actualiza un reporte existente

#### Request Body:
Igual que crear reporte

#### Response 200:
```json
{
  "success": true,
  "data": {
    // ... reporte actualizado
  },
  "message": "Reporte actualizado exitosamente",
  "statusCode": 200
}
```

---

### 3.5 Eliminar Reporte
**Endpoint:** `DELETE /api/reportes/{reporteId}`  
**Autenticación:** Bearer Token  
**Roles permitidos:** admin  
**Descripción:** Elimina un reporte

#### Response 200:
```json
{
  "success": true,
  "data": {
    "mensaje": "Reporte eliminado exitosamente"
  },
  "statusCode": 200
}
```

---

### 3.6 Filtrar Reportes por Estado
**Endpoint:** `GET /api/reportes/estado/{estado}`  
**Autenticación:** Bearer Token  
**Descripción:** Lista reportes filtrados por estado

#### Estados permitidos:
- `PENDIENTE`
- `EN_PROGRESO`
- `COMPLETADO`
- `VENCIDO`

#### Query Parameters:
- `page`, `size`, `sort` (igual que listar)

---

### 3.7 Reportes de una Entidad
**Endpoint:** `GET /api/reportes/entidad/{entidadId}`  
**Autenticación:** Bearer Token  
**Descripción:** Lista todos los reportes de una entidad específica

---

### 3.8 Reportes Vencidos
**Endpoint:** `GET /api/reportes/vencidos`  
**Autenticación:** Bearer Token  
**Roles permitidos:** admin, supervisor, auditor  
**Descripción:** Lista todos los reportes vencidos

---

## 4. Flujo de Reportes

### Estados del Flujo:
1. `pendiente` - Esperando elaboración
2. `en_elaboracion` - En proceso de creación
3. `enviado` - Enviado a supervisión
4. `en_revision` - Siendo revisado
5. `requiere_correccion` - Necesita cambios
6. `aprobado` - Aprobado por supervisor
7. `rechazado` - Rechazado
8. `vencido` - Pasó la fecha límite
9. `extemporaneo` - Enviado fuera de plazo

---

### 4.1 Obtener Mis Periodos (Responsable)
**Endpoint:** `GET /api/flujo-reportes/mis-periodos`  
**Autenticación:** Bearer Token  
**Roles:** responsable  
**Descripción:** Lista los periodos de reportes asignados al usuario autenticado

#### Query Parameters:
- `page`, `size`, `sort`

#### Response 200:
```json
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
          "email": "juan@entidad.gov.co"
        },
        "responsableSupervision": {
          "usuarioId": "uuid",
          "nombreCompleto": "Carlos Rodríguez",
          "email": "carlos@entidad.gov.co"
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
    "totalElements": 28
  },
  "statusCode": 200
}
```

---

### 4.2 Periodos Pendientes
**Endpoint:** `GET /api/flujo-reportes/mis-periodos/pendientes`  
**Autenticación:** Bearer Token  
**Roles:** responsable  
**Descripción:** Solo periodos en estado "pendiente"

---

### 4.3 Periodos que Requieren Corrección
**Endpoint:** `GET /api/flujo-reportes/mis-periodos/requieren-correccion`  
**Autenticación:** Bearer Token  
**Roles:** responsable  
**Descripción:** Solo periodos en estado "requiere_correccion"

---

### 4.4 Enviar Reporte
**Endpoint:** `POST /api/flujo-reportes/enviar`  
**Autenticación:** Bearer Token  
**Roles:** responsable  
**Descripción:** Envía un periodo completado al supervisor

#### Request Body:
```json
{
  "periodoId": "uuid",
  "comentarios": "Reporte completado según lineamientos",
  "evidenciasIds": ["uuid1", "uuid2", "uuid3"]
}
```

#### Response 200:
```json
{
  "success": true,
  "data": {
    "periodoId": "uuid",
    "estado": "enviado",
    // ... resto de datos del periodo
  },
  "message": "Reporte enviado exitosamente",
  "statusCode": 200
}
```

---

### 4.5 Corregir y Reenviar
**Endpoint:** `POST /api/flujo-reportes/corregir-reenviar`  
**Autenticación:** Bearer Token  
**Roles:** responsable  
**Descripción:** Corrige y reenvía un periodo que requiere corrección

#### Request Body:
```json
{
  "periodoId": "uuid",
  "comentarios": "Correcciones realizadas según indicaciones",
  "evidenciasIds": ["uuid1", "uuid2"]
}
```

---

### 4.6 Periodos Pendientes de Validación (Supervisor)
**Endpoint:** `GET /api/flujo-reportes/pendientes-validacion`  
**Autenticación:** Bearer Token  
**Roles:** supervisor  
**Descripción:** Lista periodos enviados esperando revisión

---

### 4.7 Periodos Bajo Mi Supervisión
**Endpoint:** `GET /api/flujo-reportes/supervision`  
**Autenticación:** Bearer Token  
**Roles:** supervisor  
**Descripción:** Todos los periodos donde el usuario es supervisor

---

### 4.8 Validar Reporte (Aprobar/Rechazar)
**Endpoint:** `POST /api/flujo-reportes/validar`  
**Autenticación:** Bearer Token  
**Roles:** supervisor  
**Descripción:** Aprueba o rechaza un periodo enviado

#### Request Body:
```json
{
  "periodoId": "uuid",
  "accion": "aprobar",
  "comentarios": "Reporte aprobado sin observaciones",
  "motivoRechazo": null
}
```

**Acciones permitidas:** "aprobar", "rechazar"  
**Nota:** `motivoRechazo` es requerido si `accion` = "rechazar"

---

### 4.9 Aprobar Directamente
**Endpoint:** `POST /api/flujo-reportes/{periodoId}/aprobar`  
**Autenticación:** Bearer Token  
**Roles:** supervisor  
**Query Parameters:**
- `comentarios` (string): Comentarios opcionales

---

### 4.10 Rechazar Directamente
**Endpoint:** `POST /api/flujo-reportes/{periodoId}/rechazar`  
**Autenticación:** Bearer Token  
**Roles:** supervisor  
**Query Parameters:**
- `motivoRechazo` (string, required): Motivo del rechazo

---

### 4.11 Solicitar Corrección
**Endpoint:** `POST /api/flujo-reportes/solicitar-correccion`  
**Autenticación:** Bearer Token  
**Roles:** supervisor  
**Descripción:** Solicita correcciones sin rechazar completamente

#### Request Body:
```json
{
  "periodoId": "uuid",
  "motivoCorreccion": "Revisar cifras del tercer trimestre",
  "detallesCorreccion": "Los valores en la tabla 3 no coinciden",
  "fechaLimiteCorreccion": "2024-12-10"
}
```

---

### 4.12 Obtener Detalle de Periodo
**Endpoint:** `GET /api/flujo-reportes/periodos/{periodoId}`  
**Autenticación:** Bearer Token  
**Descripción:** Obtiene información completa de un periodo

---

### 4.13 Historial de Estados
**Endpoint:** `GET /api/flujo-reportes/periodos/{periodoId}/historial`  
**Autenticación:** Bearer Token  
**Descripción:** Historial de cambios de estado de un periodo

#### Response 200:
```json
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

---

## 5. Entidades

### 5.1 Listar Entidades
**Endpoint:** `GET /api/entidades`  
**Autenticación:** Bearer Token  
**Descripción:** Lista todas las entidades

#### Query Parameters:
- `page`, `size`, `sort`

#### Response 200:
```json
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
    "totalPages": 2,
    "totalElements": 15
  },
  "statusCode": 200
}
```

---

### 5.2 Entidades Activas
**Endpoint:** `GET /api/entidades/activas`  
**Autenticación:** Bearer Token  
**Descripción:** Solo entidades con estado "ACTIVA"

---

### 5.3 Obtener Entidad por ID
**Endpoint:** `GET /api/entidades/{entidadId}`  
**Autenticación:** Bearer Token

---

### 5.4 Crear Entidad
**Endpoint:** `POST /api/entidades`  
**Autenticación:** Bearer Token  
**Roles:** admin, supervisor

#### Request Body:
```json
{
  "nit": "900123456-7",
  "nombre": "Nueva Entidad",
  "paginaWeb": "https://ejemplo.gov.co",
  "baseLegal": "Ley XYZ",
  "observaciones": "Observaciones adicionales",
  "estado": "ACTIVA"
}
```

---

### 5.5 Actualizar Entidad
**Endpoint:** `PUT /api/entidades/{entidadId}`  
**Autenticación:** Bearer Token  
**Roles:** admin, supervisor

---

### 5.6 Eliminar Entidad
**Endpoint:** `DELETE /api/entidades/{entidadId}`  
**Autenticación:** Bearer Token  
**Roles:** admin

---

## 6. Usuarios

### 6.1 Listar Usuarios
**Endpoint:** `GET /api/usuarios`  
**Autenticación:** Bearer Token  
**Roles:** admin, supervisor

#### Response 200:
```json
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
        "ultimoAcceso": "2025-12-04T09:30:00Z",
        "roles": ["responsable", "supervisor"],
        "createdAt": "2024-01-15T00:00:00Z",
        "updatedAt": "2024-12-01T10:00:00Z"
      }
    ],
    "totalPages": 3,
    "totalElements": 25
  },
  "statusCode": 200
}
```

---

### 6.2 Obtener Usuario por Document Number
**Endpoint:** `GET /api/usuarios/{documentNumber}`  
**Autenticación:** Bearer Token

---

### 6.3 Actualizar Usuario
**Endpoint:** `PUT /api/usuarios/{documentNumber}`  
**Autenticación:** Bearer Token  
**Roles:** admin

---

### 6.4 Eliminar Usuario
**Endpoint:** `DELETE /api/usuarios/{documentNumber}`  
**Autenticación:** Bearer Token  
**Roles:** admin

---

## 7. Evidencias

### 7.1 Subir Archivo
**Endpoint:** `POST /api/evidencias/reporte/{reporteId}`  
**Autenticación:** Bearer Token  
**Content-Type:** multipart/form-data

#### Request:
- **Form field:** `file` (binary)

#### Response 200:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nombreArchivo": "reporte_sui_nov_2024.xlsx",
    "tipoArchivo": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "tamano": 245678,
    "reporteId": "uuid",
    "subidoPorId": "uuid",
    "subidoPorNombre": "Juan Pérez",
    "creadoEn": "2024-12-04T10:30:00Z"
  },
  "message": "Archivo subido exitosamente",
  "statusCode": 200
}
```

**Límites:**
- Tamaño máximo: 10 MB
- Formatos permitidos: PDF, XLSX, DOCX, PNG, JPG

---

### 7.2 Listar Evidencias de un Reporte
**Endpoint:** `GET /api/evidencias/reporte/{reporteId}`  
**Autenticación:** Bearer Token

---

### 7.3 Descargar Evidencia
**Endpoint:** `GET /api/evidencias/{evidenciaId}/descargar`  
**Autenticación:** Bearer Token  
**Response:** Archivo binario

---

### 7.4 Obtener Metadata de Evidencia
**Endpoint:** `GET /api/evidencias/{evidenciaId}`  
**Autenticación:** Bearer Token

---

### 7.5 Eliminar Evidencia
**Endpoint:** `DELETE /api/evidencias/{evidenciaId}`  
**Autenticación:** Bearer Token  
**Roles:** admin, responsable (solo sus archivos)

---

## 8. Dashboard

### 8.1 Dashboard General (Redirige según rol)
**Endpoint:** `GET /api/dashboard`  
**Autenticación:** Bearer Token  
**Descripción:** Retorna el dashboard correspondiente al rol del usuario

---

### 8.2 Estadísticas Generales
**Endpoint:** `GET /api/dashboard/estadisticas`  
**Autenticación:** Bearer Token  
**Roles:** admin, supervisor, auditor

#### Query Parameters:
- `periodo` (string): "mes_actual", "trimestre_actual", "año_actual", "personalizado"
- `fechaInicio` (date): Si periodo = "personalizado"
- `fechaFin` (date): Si periodo = "personalizado"

#### Response 200:
```json
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

---

### 8.3 Dashboard Admin
**Endpoint:** `GET /api/dashboard/admin`  
**Autenticación:** Bearer Token  
**Roles:** admin

#### Response incluye:
- Métricas globales del sistema
- Gestión de usuarios
- Gestión de entidades
- Alertas globales
- Calendario global

---

### 8.4 Dashboard Responsable
**Endpoint:** `GET /api/dashboard/responsable`  
**Autenticación:** Bearer Token  
**Roles:** responsable

#### Response incluye:
- KPIs personales
- Tareas pendientes
- Reportes próximos a vencer
- Alertas personales
- Calendario personal

---

### 8.5 Dashboard Supervisor
**Endpoint:** `GET /api/dashboard/supervisor`  
**Autenticación:** Bearer Token  
**Roles:** supervisor

#### Response incluye:
- KPIs de cumplimiento
- Reportes por revisar
- Alertas críticas
- Métricas por entidad
- Gráficos de cumplimiento

---

### 8.6 Dashboard Auditor
**Endpoint:** `GET /api/dashboard/auditor`  
**Autenticación:** Bearer Token  
**Roles:** auditor

#### Response incluye:
- Resumen ejecutivo
- Análisis de tendencias
- Cumplimiento por entidad
- Cumplimiento por obligación
- Reportes históricos

---

## 9. Responsables de Reportes

### 9.1 Agregar Responsable
**Endpoint:** `POST /api/reportes/{reporteId}/responsables`  
**Autenticación:** Bearer Token  
**Roles:** admin, supervisor

#### Request Body:
```json
{
  "usuarioId": "uuid",
  "tipoResponsabilidad": "revision",
  "esPrincipal": false,
  "fechaInicio": "2024-06-01",
  "observaciones": "Nuevo revisor de calidad"
}
```

---

### 9.2 Listar Responsables de un Reporte
**Endpoint:** `GET /api/reportes/{reporteId}/responsables`  
**Autenticación:** Bearer Token

---

### 9.3 Actualizar Responsable
**Endpoint:** `PUT /api/reporte-responsable/{responsableId}`  
**Autenticación:** Bearer Token  
**Roles:** admin, supervisor

---

### 9.4 Eliminar Responsable
**Endpoint:** `DELETE /api/reporte-responsable/{responsableId}`  
**Autenticación:** Bearer Token  
**Roles:** admin

---

## 10. Códigos de Estado y Errores

### Códigos HTTP

| Código | Significado | Uso |
|--------|-------------|-----|
| 200 | OK | Operación exitosa |
| 201 | Created | Recurso creado exitosamente |
| 204 | No Content | Eliminación exitosa |
| 400 | Bad Request | Datos inválidos |
| 401 | Unauthorized | Token inválido o expirado |
| 403 | Forbidden | Sin permisos |
| 404 | Not Found | Recurso no encontrado |
| 409 | Conflict | Conflicto (ej: email duplicado) |
| 500 | Internal Server Error | Error del servidor |

---

### Formato de Error Estándar

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
  "timestamp": "2025-12-04T10:00:00Z",
  "path": "/api/reportes"
}
```

---

## 📝 Notas Importantes

### Autenticación
- Todas las peticiones (excepto login y registro) requieren header:  
  `Authorization: Bearer {token}`
- Token JWT expira en 24 horas
- Debe incluir `usuarioId` y `roles` en el payload

### Paginación
- Todas las listas soportan paginación
- Parámetros: `page` (0-indexed), `size`, `sort`
- Ejemplo: `?page=0&size=10&sort=nombre,asc`

### Formatos de Fecha
- ISO 8601: `YYYY-MM-DDTHH:mm:ssZ`
- Zona horaria: UTC

### Roles del Sistema
- `admin`: Acceso completo
- `supervisor`: Supervisión y aprobación
- `responsable`: Elaboración de reportes
- `auditor`: Solo lectura

---

## 🎯 Checklist de Funcionalidades Implementadas

### ✅ Autenticación
- [x] Login con JWT
- [x] Registro de usuarios
- [x] Configuración UI por rol

### ✅ Reportes
- [x] CRUD completo
- [x] Múltiples responsables
- [x] Filtrado por estado
- [x] Filtrado por entidad

### ✅ Flujo de Reportes
- [x] Mis periodos
- [x] Enviar reporte
- [x] Aprobar/Rechazar
- [x] Solicitar corrección
- [x] Historial de estados

### ✅ Entidades
- [x] CRUD completo
- [x] Filtro de activas

### ✅ Usuarios
- [x] CRUD completo
- [x] Gestión de roles

### ✅ Evidencias
- [x] Subir archivos
- [x] Descargar archivos
- [x] Listar por reporte

### ✅ Dashboard
- [x] Dashboard por rol
- [x] Estadísticas generales
- [x] Métricas personalizadas

---

## 🚀 Próximos Pasos

### Funcionalidades Pendientes
- [ ] Notificaciones por email
- [ ] Exportación de reportes (PDF/Excel)
- [ ] Calendario de eventos
- [ ] Búsqueda avanzada
- [ ] Logs de auditoría

### Mejoras Técnicas
- [ ] Cache con Redis
- [ ] Rate limiting
- [ ] Compresión de respuestas
- [ ] WebSockets para notificaciones en tiempo real

---

**Contacto:** Para dudas o soporte, consultar la documentación del proyecto o contactar al equipo de desarrollo.