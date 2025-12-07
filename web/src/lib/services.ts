import api from "./api";

// Wrapper genérico para respuestas del backend
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  statusCode: number;
  timestamp: string;
}

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface EntidadRequest {
  nit: string;
  nombre: string;
  paginaWeb?: string;
  baseLegal?: string;
  observaciones?: string;
  estado: string;
}

export interface EntidadResponse {
  entidadId: string;
  nit: string;
  nombre: string;
  paginaWeb: string;
  baseLegal: string;
  observaciones: string;
  estado: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResponsableReporte {
  usuarioId: string;
  tipoResponsabilidad: 'elaboracion' | 'supervision' | 'revision';
  esPrincipal: boolean;
  activo: boolean;
  orden: number;
  fechaInicio: string;
  fechaFin?: string;
  observaciones?: string;
}

export interface ReporteRequest {
  nombre: string;
  descripcion?: string;
  entidadId: string;
  frecuencia: string; // "mensual" | "trimestral" | "semestral" | "anual"
  formatoRequerido: string; // "Excel" | "PDF" | "Word" | "Otro"
  baseLegal?: string;
  fechaInicioVigencia?: string;
  fechaFinVigencia?: string | null;
  fechaVencimiento?: string;
  plazoAdicionalDias?: number;
  linkInstrucciones?: string;
  // Configuración de periodos
  durationMonths?: number;
  // Nuevo formato con array de responsables
  responsables?: ResponsableReporte[];
  // Correos y teléfono
  correosNotificacion?: string[];
  telefonoResponsable?: string;
  estado?: string; // "activo" | "inactivo" | "pendiente"
}

export interface ReporteResponse {
  reporteId: string;
  nombre: string;
  descripcion?: string;
  entidadId: string;
  entidadNombre: string;
  frecuencia: string;
  formatoRequerido: string;
  baseLegal?: string;
  fechaInicioVigencia?: string;
  fechaFinVigencia?: string | null;
  fechaVencimiento: string;
  plazoAdicionalDias?: number;
  linkInstrucciones?: string;
  // Campos legacy (compatibilidad)
  responsableElaboracionId?: string[];
  responsableElaboracionNombre?: string;
  responsableElaboracionIds?: string[];
  responsableElaboracionNombres?: string;
  responsableSupervisionId?: string[];
  responsableSupervisionNombre?: string;
  responsableSupervisionIds?: string[];
  responsableSupervisionNombres?: string;
  // Nuevo formato con array de responsables
  responsables?: Array<{
    usuarioId: string;
    nombreCompleto: string;
    tipoResponsabilidad: 'elaboracion' | 'supervision' | 'revision';
    esPrincipal: boolean;
  }>;
  correosNotificacion?: string[];
  telefonoResponsable?: string;
  estado: string;
  createdAt: string;
  updatedAt: string;
  // Legacy aliases
  creadoEn?: string;
  actualizadoEn?: string;
}

export interface EvidenciaResponse {
  id: string;
  nombreArchivo: string;
  tipoArchivo: string;
  tamano: number;
  reporteId: string;
  subidoPorId: string;
  subidoPorNombre: string;
  creadoEn: string;
}

export interface DashboardResponse {
  totalReportes: number;
  reportesPendientes: number;
  reportesEnProgreso: number;
  reportesEnviados: number;
  reportesVencidos: number;
  tasaCumplimiento: number;
}

// ==================== DASHBOARD SUPERVISOR ====================

export interface KpisSupervisor {
  reportesEnRevision: number;
  reportesRequierenCorreccion: number;
  reportesPendientes: number;
  reportesAtrasados: number;
}

export interface CargaResponsable {
  responsableId: string;
  nombreCompleto: string;
  email: string;
  totalReportes: number;
  pendientes: number;
  enRevision: number;
  aprobados: number;
  atrasados: number;
  porcentajeCumplimiento: number;
}

export interface DistribucionEntidad {
  entidadId: string;
  nombreEntidad: string;
  sigla: string;
  totalReportes: number;
  pendientes: number;
  aprobados: number;
  atrasados: number;
  porcentajeCumplimiento: number;
}

export interface DashboardSupervisorResponse {
  kpis: KpisSupervisor;
  estadoGeneral: Record<string, number>;
  cargaPorResponsable: CargaResponsable[];
  distribucionPorEntidad: DistribucionEntidad[];
}

// ==================== EVIDENCIAS SUPERVISOR ====================

export interface EvidenciaSupervisor {
  id: string;
  nombreArchivo: string;
  rutaArchivo: string;
  tipoArchivo: string;
  tamanioBytes: number;
  fechaCarga: string;
  reporte: {
    id: string;
    codigo: string;
    nombre: string;
    entidadNombre: string;
    periodo: string;
    estado: string;
    fechaVencimiento: string;
  };
  responsableCarga: {
    usuarioId: string;
    nombreCompleto: string;
    email: string;
  };
  urlDescarga?: string;
}

export interface UsuarioResponse {
  usuarioId: string;
  documentNumber: string;
  documentType: string | null;
  email: string;
  firstName: string;
  secondName?: string | null;
  firstLastname: string;
  secondLastname?: string | null;
  telefono?: string;
  proceso?: string;
  cargo?: string;
  estado?: string;
  ultimoAcceso?: string;
  roles: string[];
  createdAt?: string;
  updatedAt?: string;
  invitationId?: string; // ID de invitación si el usuario está invitado
}

export interface UsuarioRequest {
  documentNumber: string;
  documentType: string;
  email: string;
  firstName: string;
  secondName?: string;
  firstLastname: string;
  secondLastname?: string;
  password?: string;
  roles: string[];
}

// ==================== AUDITORÍA Y LOGS DE ACCESO ====================

export interface UserSessionLogResponse {
  sessionLogId: string;
  usuarioId?: string;
  usuarioNombre?: string;
  email: string;
  evento: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'TOKEN_REFRESH' | 'PASSWORD_CHANGE' | 'SESSION_EXPIRED';
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  datosAdicionales?: Record<string, any>;
}

export interface AccesosEstadisticasDTO {
  totalAccesos: number;
  loginsExitosos: number;
  loginsFallidos: number;
  usuariosUnicos: number;
  accesosUltimas24Horas: number;
  accesosUltimaSemana: number;
  accesosUltimoMes: number;
  accesosPorEvento: Record<string, number>;
  intentosFallidosRecientes: number;
}

export const reportesService = {
  async listar(
    page = 0,
    size = 10,
    sort = "fechaVencimiento,asc"
  ): Promise<Page<ReporteResponse>> {
    const response = await api.get("/api/reportes", {
      params: { page, size, sort },
    });
    // Verificar si la respuesta tiene el formato { success, data }
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  async obtener(id: string): Promise<ReporteResponse> {
    const response = await api.get(`/api/reportes/${id}`);
    // Verificar si la respuesta tiene el formato { success, data }
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  async crear(data: ReporteRequest): Promise<ReporteResponse> {
    const response = await api.post("/api/reportes", data);
    // Verificar si la respuesta tiene el formato { success, data }
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  async actualizar(id: string, data: ReporteRequest): Promise<ReporteResponse> {
    const response = await api.put(`/api/reportes/${id}`, data);
    // Verificar si la respuesta tiene el formato { success, data }
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  async eliminar(id: string): Promise<{ mensaje: string }> {
    const response = await api.delete(`/api/reportes/${id}`);
    // Verificar si la respuesta tiene el formato { success, data }
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  async agregarResponsable(
    reporteId: string,
    responsable: ResponsableReporte
  ): Promise<ReporteResponse> {
    const response = await api.post(
      `/api/reportes/${reporteId}/responsables`,
      responsable
    );
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  async cambiarEstado(id: string, estado: string): Promise<ReporteResponse> {
    const response = await api.patch(`/api/reportes/${id}/estado`, null, {
      params: { estado },
    });
    // Verificar si la respuesta tiene el formato { success, data }
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  async porEstado(
    estado: string,
    page = 0,
    size = 10
  ): Promise<Page<ReporteResponse>> {
    const response = await api.get(`/api/reportes/estado/${estado}`, {
      params: { page, size },
    });
    // Verificar si la respuesta tiene el formato { success, data }
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  async porResponsable(
    responsableId: string,
    page = 0,
    size = 10
  ): Promise<Page<ReporteResponse>> {
    const response = await api.get(
      `/api/reportes/responsable/${responsableId}`,
      { params: { page, size } }
    );
    // Verificar si la respuesta tiene el formato { success, data }
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  async vencidos(): Promise<ReporteResponse[]> {
    const response = await api.get("/api/reportes/vencidos");
    // Verificar si la respuesta tiene el formato { success, data }
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },
};

export const entidadesService = {
  async listar(page = 0, size = 100, sort = ['nombre,asc']): Promise<Page<EntidadResponse>> {
    const response = await api.get('/api/entidades', { params: { page, size, sort } });
    // Verificar si la respuesta tiene el formato { success, data }
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },

  async activas(page = 0, size = 100, sort = ['nombre,asc']): Promise<Page<EntidadResponse>> {
    const response = await api.get('/api/entidades', { params: { page, size, sort } });
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },

  async obtener(id: string): Promise<EntidadResponse> {
    const response = await api.get(`/api/entidades/${id}`);
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },

  async crear(data: EntidadRequest): Promise<EntidadResponse> {
    const response = await api.post('/api/entidades', data);
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },

  async actualizar(id: string, data: EntidadRequest): Promise<EntidadResponse> {
    const response = await api.put(`/api/entidades/${id}`, data);
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },

  async eliminar(id: string): Promise<{ mensaje: string }> {
    const response = await api.delete(`/api/entidades/${id}`);
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },
};

export const evidenciasService = {
  async subir(reporteId: string, file: File): Promise<EvidenciaResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/api/evidencias/reporte/${reporteId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    // Verificar si la respuesta tiene el formato { success, data }
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },

  async listarPorReporte(reporteId: string): Promise<EvidenciaResponse[]> {
    const response = await api.get(`/api/evidencias/reporte/${reporteId}`);
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },

  async descargar(id: string) {
    const response = await api.get(`/api/evidencias/${id}/descargar`, {
      responseType: "blob",
    });
    const blob = new Blob([response.data], {
      type: response.headers["content-type"],
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    const disposition = response.headers['content-disposition'];
    const match = disposition?.match(/filename="(.+)"/);
    a.href = url;
    a.download = match?.[1] || `evidencia-${id}`;
    a.click();
    window.URL.revokeObjectURL(url);
  },

  async eliminar(id: string): Promise<{ mensaje: string }> {
    const response = await api.delete(`/api/evidencias/${id}`);
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },
};

export const dashboardService = {
  async estadisticas(periodo?: string, fechaInicio?: string, fechaFin?: string): Promise<DashboardResponse> {
    const params: any = {};
    if (periodo) params.periodo = periodo;
    if (fechaInicio) params.fechaInicio = fechaInicio;
    if (fechaFin) params.fechaFin = fechaFin;
    const response = await api.get('/api/dashboard/estadisticas', { params });
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },

  async cumplimiento(): Promise<number> {
    const response = await api.get('/api/dashboard/cumplimiento');
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },

  // Dashboard por rol
  async dashboardAdmin(): Promise<any> {
    const response = await api.get('/api/dashboard/admin');
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },

  async dashboardResponsable(): Promise<any> {
    const response = await api.get('/api/dashboard/responsable');
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },

  async dashboardSupervisor(): Promise<DashboardSupervisorResponse> {
    const response = await api.get('/api/supervisor/dashboard');
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },

  async dashboardAuditor(): Promise<any> {
    const response = await api.get('/api/dashboard/auditor');
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },
};

export const usuariosService = {
  async listar(page = 0, size = 100): Promise<Page<UsuarioResponse>> {
    const response = await api.get("/api/usuarios", {
      params: { page, size, sort: "firstName,asc" },
    });
    // Verificar si la respuesta tiene el formato { success, data }
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  async obtener(documentNumber: string): Promise<UsuarioResponse> {
    const response = await api.get(`/api/usuarios/${documentNumber}`);
    // Verificar si la respuesta tiene el formato { success, data }
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  async crear(data: UsuarioRequest): Promise<UsuarioResponse> {
    const response = await api.post("/api/auth/registro", data);
    // Verificar si la respuesta tiene el formato { success, data }
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  async actualizar(documentNumber: string, data: UsuarioRequest): Promise<UsuarioResponse> {
    const response = await api.put(`/api/usuarios/${documentNumber}`, data);
    // Verificar si la respuesta tiene el formato { success, data }
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  async eliminar(documentNumber: string): Promise<void> {
    const response = await api.delete(`/api/usuarios/${documentNumber}`);
    // Verificar si la respuesta tiene el formato { success, data }
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  // Cambiar rol de usuario (usando PUT con workaround)
  async cambiarRol(documentNumber: string, nuevoRol: string): Promise<UsuarioResponse> {
    // Primero obtenemos los datos actuales del usuario
    const usuarioActual = await this.obtener(documentNumber);
    
    // Actualizamos solo el rol, manteniendo los demás campos
    const dataActualizada: UsuarioRequest = {
      documentNumber: usuarioActual.documentNumber,
      documentType: usuarioActual.documentType || 'CC',
      email: usuarioActual.email,
      firstName: usuarioActual.firstName,
      secondName: usuarioActual.secondName || '',
      firstLastname: usuarioActual.firstLastname,
      secondLastname: usuarioActual.secondLastname || '',
      roles: [nuevoRol]
    };

    return this.actualizar(documentNumber, dataActualizada);
  },

  // Desactivar usuario (usando nuevo endpoint PATCH)
  async desactivar(documentNumber: string): Promise<UsuarioResponse> {
    const response = await api.patch(`/api/usuarios/${documentNumber}/desactivar`);

    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  // Activar usuario (usando nuevo endpoint PATCH)
  async activar(documentNumber: string): Promise<UsuarioResponse> {
    const response = await api.patch(`/api/usuarios/${documentNumber}/activar`);

    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  // Invitar usuario
  async invitar(email: string, role: string): Promise<{ success: boolean; message: string; data?: any }> {
    const response = await api.post('/api/users/invite', { email, role });
    return response.data;
  },

  // Cancelar invitación
  async cancelarInvitacion(invitationId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/api/users/invite/${invitationId}`);
    return response.data;
  },

  // Validar token de invitación
  async validarTokenInvitacion(token: string): Promise<{ success: boolean; data: boolean; message: string }> {
    const response = await api.get(`/api/users/validate-invitation?token=${token}`);
    return response.data;
  },

  // Completar registro con invitación
  async completarRegistroInvitacion(data: {
    token: string;
    firstName: string;
    secondName?: string;
    firstLastname: string;
    secondLastname?: string;
    documentType: string;
    documentNumber: string;
    password: string;
    telefono?: string;
  }): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/api/users/complete-invitation', data);
    return response.data;
  },
};

// ==================== FLUJO DE REPORTES ====================

export interface ReportePeriodo {
  periodoId: string;
  reporteId: string;
  reporteNombre: string;
  entidadNombre: string;
  frecuencia?: string;
  periodoTipo: string;
  periodoInicio: string;
  periodoFin: string;
  periodo?: string;
  fechaVencimiento?: string;
  fechaVencimientoCalculada: string;
  estado: string;
  estadoDescripcion: string;
  fechaEnvioReal: string | null;
  diasDesviacion: number | null;
  responsableElaboracion: {
    usuarioId: string;
    nombreCompleto: string;
    email: string;
    cargo: string;
  };
  responsableSupervision: {
    usuarioId: string;
    nombreCompleto: string;
    email: string;
    cargo: string;
  };
  comentarios: string | null;
  cantidadArchivos: number;
  puedeEnviar: boolean;
  puedeAprobar: boolean;
  puedeRechazar: boolean;
  puedeCorregir: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EnviarReporteRequest {
  periodoId: string;
  comentarios?: string;
  evidenciasIds?: string[];
}

export interface ValidarReporteRequest {
  periodoId: string;
  accion: 'aprobar' | 'rechazar';
  comentarios?: string;
  motivoRechazo?: string;
}

export interface SolicitarCorreccionRequest {
  periodoId: string;
  motivoCorreccion: string;
  detallesCorreccion?: string;
  fechaLimiteCorreccion?: string;
}

export interface HistorialEstado {
  estadoAnterior: string;
  estadoNuevo: string;
  fecha: string;
  usuarioNombre: string;
  comentario: string | null;
}

export const flujoReportesService = {
  // Obtener mis periodos (RESPONSABLE)
  async misPeriodos(page = 0, size = 10, sort?: string): Promise<Page<ReportePeriodo>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    if (sort) params.append('sort', sort);
    
    const response = await api.get(`/api/flujo-reportes/mis-periodos?${params}`);
    return response.data.data;
  },

  // Obtener periodos pendientes
  async misPeriodosPendientes(page = 0, size = 10): Promise<Page<ReportePeriodo>> {
    const response = await api.get(`/api/flujo-reportes/mis-periodos/pendientes?page=${page}&size=${size}`);
    return response.data.data;
  },

  // Obtener periodos que requieren corrección
  async misPeríodosCorrecciones(page = 0, size = 10): Promise<Page<ReportePeriodo>> {
    const response = await api.get(`/api/flujo-reportes/mis-periodos/requieren-correccion?page=${page}&size=${size}`);
    return response.data.data;
  },

  // Enviar reporte
  async enviar(request: EnviarReporteRequest): Promise<ReportePeriodo> {
    const response = await api.post('/api/flujo-reportes/enviar', request);
    return response.data.data;
  },

  // Corregir y reenviar
  async corregirReenviar(request: EnviarReporteRequest): Promise<ReportePeriodo> {
    const response = await api.post('/api/flujo-reportes/corregir-reenviar', request);
    return response.data.data;
  },

  // Obtener periodos pendientes de validación (SUPERVISOR)
  async pendientesValidacion(page = 0, size = 10): Promise<Page<ReportePeriodo>> {
    const response = await api.get(`/api/flujo-reportes/pendientes-validacion?page=${page}&size=${size}`);
    return response.data.data;
  },

  // Obtener periodos bajo mi supervisión
  async supervision(page = 0, size = 10): Promise<Page<ReportePeriodo>> {
    const response = await api.get(`/api/flujo-reportes/supervision?page=${page}&size=${size}`);
    return response.data.data;
  },

  // Validar reporte (aprobar/rechazar)
  async validar(request: ValidarReporteRequest): Promise<ReportePeriodo> {
    const response = await api.post('/api/flujo-reportes/validar', request);
    return response.data.data;
  },

  // Aprobar directamente
  async aprobar(periodoId: string, comentarios?: string): Promise<ReportePeriodo> {
    const params = comentarios ? `?comentarios=${encodeURIComponent(comentarios)}` : '';
    const response = await api.post(`/api/flujo-reportes/${periodoId}/aprobar${params}`);
    return response.data.data;
  },

  // Rechazar directamente
  async rechazar(periodoId: string, motivoRechazo: string): Promise<ReportePeriodo> {
    const response = await api.post(`/api/flujo-reportes/${periodoId}/rechazar?motivoRechazo=${encodeURIComponent(motivoRechazo)}`);
    return response.data.data;
  },

  // Solicitar corrección con detalles
  async solicitarCorreccion(request: SolicitarCorreccionRequest): Promise<ReportePeriodo> {
    const response = await api.post('/api/flujo-reportes/solicitar-correccion', request);
    return response.data.data;
  },

  // Obtener detalle de un periodo
  async obtenerPeriodo(periodoId: string): Promise<ReportePeriodo> {
    const response = await api.get(`/api/flujo-reportes/periodos/${periodoId}`);
    return response.data.data;
  },

  // Obtener historial de estados
  async obtenerHistorial(periodoId: string): Promise<HistorialEstado[]> {
    const response = await api.get(`/api/flujo-reportes/periodos/${periodoId}/historial`);
    return response.data.data;
  },

  // Filtrar por estado
  async porEstado(estado: string, page = 0, size = 10): Promise<Page<ReportePeriodo>> {
    const response = await api.get(`/api/flujo-reportes/periodos/estado/${estado}?page=${page}&size=${size}`);
    return response.data.data;
  },

  // Obtener periodos supervisados con filtros
  async supervisionConFiltros(
    page = 0, 
    size = 10, 
    estado?: string, 
    responsableId?: string, 
    entidadId?: string
  ): Promise<Page<ReportePeriodo>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    if (estado) params.append('estado', estado);
    if (responsableId) params.append('responsableId', responsableId);
    if (entidadId) params.append('entidadId', entidadId);
    
    const response = await api.get(`/api/flujo-reportes/supervision?${params}`);
    return response.data.data;
  },

  // Supervisor v2 - periodos bajo supervisión del usuario autenticado (deduplicados en backend)
  async supervisionSupervisor(
    page = 0,
    size = 12,
    estado?: string,
    responsableId?: string,
    entidadId?: string
  ): Promise<Page<ReportePeriodo>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    if (estado) params.append('estado', estado);
    if (responsableId) params.append('responsableId', responsableId);
    if (entidadId) params.append('entidadId', entidadId);

    const response = await api.get(`/api/supervisor/reportes`, { params });
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },
};

// ==================== EVIDENCIAS SUPERVISOR ====================

export const evidenciasSupervisorService = {
  // Obtener evidencias bajo supervisión
  async listar(
    page = 0, 
    size = 10, 
    tipoArchivo?: string, 
    responsableId?: string, 
    entidadId?: string, 
    estado?: string
  ): Promise<Page<EvidenciaSupervisor>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    if (tipoArchivo) params.append('tipoArchivo', tipoArchivo);
    if (responsableId) params.append('responsableId', responsableId);
    if (entidadId) params.append('entidadId', entidadId);
    if (estado) params.append('estado', estado);
    
    const response = await api.get(`/api/evidencias/supervision?${params}`);
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },

  // Descargar evidencia
  async descargar(id: string): Promise<void> {
    const response = await api.get(`/api/evidencias/download/${id}`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], {
      type: response.headers['content-type'],
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    const disposition = response.headers['content-disposition'];
    const match = disposition?.match(/filename="(.+)"/);
    a.href = url;
    a.download = match?.[1] || `evidencia-${id}`;
    a.click();
    window.URL.revokeObjectURL(url);
  },
};
// ============================================
// INTERFACES Y SERVICIOS DE CALENDARIO
// ============================================

export interface EventoCalendario {
  eventoId?: string;
  reporteId?: string;
  titulo: string;
  // Tipo de evento determina qué campos usar
  tipo: 'periodo' | 'vencimiento' | 'VENCIMIENTO' | 'ENVIO' | 'APROBACION' | 'RECHAZO' | 'CORRECCION' | 'VALIDACION_PENDIENTE';
  
  // Para eventos tipo "periodo" (barra continua)
  startDate?: string;
  endDate?: string;
  
  // Para eventos tipo "vencimiento" (marcador puntual)
  date?: string;
  fechaVencimiento?: string; // Alias para compatibilidad
  
  estado?: string;
  color: string;
  descripcion?: string;
  
  // Campos opcionales según rol
  esMio?: boolean;
  puedoActuar?: boolean;
  responsableNombre?: string;
  responsable?: string; // Para supervisor
  supervisorNombre?: string;
  entidadNombre?: string;
  entidad?: string; // Para auditor
  tipoIncidencia?: string; // Para supervisor
  diasPendiente?: number;
  diasVencido?: number;
  requiereAccion?: boolean;
  fechaLimiteCorreccion?: string;
  tiempoRespuesta?: string;
  cumplimiento?: 'OPORTUNO' | 'EXTEMPORANEO' | 'VENCIDO';
}

export interface CalendarioResponse {
  eventos: EventoCalendario[];
  totalEventosMes: number;
  eventosVencidosMes: number;
  eventosProximosMes: number;
  // Campos específicos por rol
  misReportesPendientes?: number;
  misReportesEnviados?: number;
  incidenciasCriticas?: number;
  validacionesPendientes?: number;
  reportesVencidosEquipo?: number;
  equipoTotal?: number;
  reportesApropadosOportunos?: number;
  reportesExtemporaneos?: number;
  reportesRechazados?: number;
  tasaCumplimientoMes?: number;
  promedioTiempoRespuesta?: string;
}

export interface CalendarioFiltros {
  fechaInicio?: string;
  fechaFin?: string;
  tipo?: string;
  estado?: string;
  entidadId?: string;
}

export const calendarioService = {
  // Calendario Admin (Global)
  async admin(filtros?: CalendarioFiltros): Promise<CalendarioResponse> {
    const params = new URLSearchParams();
    if (filtros?.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
    if (filtros?.fechaFin) params.append('fechaFin', filtros.fechaFin);
    if (filtros?.tipo) params.append('tipo', filtros.tipo);
    if (filtros?.estado) params.append('estado', filtros.estado);
    if (filtros?.entidadId) params.append('entidadId', filtros.entidadId);

    const response = await api.get(`/api/dashboard/admin/calendario?${params.toString()}`);
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },

  // Calendario Responsable (Personal)
  async responsable(filtros?: CalendarioFiltros): Promise<CalendarioResponse> {
    const params = new URLSearchParams();
    if (filtros?.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
    if (filtros?.fechaFin) params.append('fechaFin', filtros.fechaFin);
    if (filtros?.tipo) params.append('tipo', filtros.tipo);
    if (filtros?.estado) params.append('estado', filtros.estado);

    const response = await api.get(`/api/dashboard/responsable/calendario?${params.toString()}`);
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },

  // Calendario Supervisor (Incidencias)
  async supervisor(filtros?: CalendarioFiltros): Promise<CalendarioResponse> {
    const params = new URLSearchParams();
    if (filtros?.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
    if (filtros?.fechaFin) params.append('fechaFin', filtros.fechaFin);
    if (filtros?.tipo) params.append('tipo', filtros.tipo);
    if (filtros?.estado) params.append('estado', filtros.estado);

    const response = await api.get(`/api/dashboard/supervisor/calendario?${params.toString()}`);
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },

  // Calendario Auditor (Consulta)
  async auditor(filtros?: CalendarioFiltros): Promise<CalendarioResponse> {
    const params = new URLSearchParams();
    if (filtros?.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
    if (filtros?.fechaFin) params.append('fechaFin', filtros.fechaFin);
    if (filtros?.tipo) params.append('tipo', filtros.tipo);
    if (filtros?.estado) params.append('estado', filtros.estado);
    if (filtros?.entidadId) params.append('entidadId', filtros.entidadId);

    const response = await api.get(`/api/dashboard/auditor/calendario?${params.toString()}`);
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },
};

// ==================== AUDITORÍA SERVICE ====================

export const auditoriaService = {
  // Obtener todos los logs (Admin)
  async obtenerLogs(
    page = 0,
    size = 20,
    usuarioId?: string,
    evento?: string,
    fechaDesde?: string,
    fechaHasta?: string
  ): Promise<Page<UserSessionLogResponse>> {
    const params: any = { page, size };
    if (usuarioId) params.usuarioId = usuarioId;
    if (evento) params.evento = evento;
    if (fechaDesde) params.fechaDesde = fechaDesde;
    if (fechaHasta) params.fechaHasta = fechaHasta;

    const response = await api.get('/api/auditoria/accesos', { params });
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },

  // Obtener estadísticas (Admin)
  async obtenerEstadisticas(): Promise<AccesosEstadisticasDTO> {
    const response = await api.get('/api/auditoria/accesos/estadisticas');
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },

  // Obtener accesos de un usuario específico (Admin)
  async obtenerAccesosUsuario(
    usuarioId: string,
    page = 0,
    size = 20
  ): Promise<Page<UserSessionLogResponse>> {
    const response = await api.get(`/api/auditoria/accesos/usuario/${usuarioId}`, {
      params: { page, size }
    });
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },

  // Obtener último acceso de un usuario (Admin)
  async obtenerUltimoAccesoUsuario(usuarioId: string): Promise<UserSessionLogResponse> {
    const response = await api.get(`/api/auditoria/accesos/usuario/${usuarioId}/ultimo`);
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },

  // Obtener mis propios accesos (Usuario autenticado)
  async obtenerMisAccesos(page = 0, size = 20): Promise<Page<UserSessionLogResponse>> {
    const response = await api.get('/api/auditoria/mis-accesos', {
      params: { page, size }
    });
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },

  // Obtener mi último acceso (Usuario autenticado)
  async obtenerMiUltimoAcceso(): Promise<UserSessionLogResponse> {
    const response = await api.get('/api/auditoria/mi-ultimo-acceso');
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },

  // Limpiar logs antiguos (Admin)
  async limpiarLogsAntiguos(diasRetencion = 90): Promise<void> {
    const response = await api.delete('/api/auditoria/accesos/limpiar', {
      params: { diasRetencion }
    });
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },
};

