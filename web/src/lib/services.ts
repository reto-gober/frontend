import api from "./api";

// Wrapper genérico para respuestas del backend
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  statusCode: number;
  timestamp: string;
}

// ==================== PASSWORD RESET ====================

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
  token?: string;
  data?: {
    token?: string;
  };
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
  tipoResponsabilidad: "elaboracion" | "supervision" | "revision";
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
    tipoResponsabilidad: "elaboracion" | "supervision" | "revision";
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
  urlPublica?: string; // URL directa para acceder al archivo (campo adicional del backend)
}

export interface DashboardResponse {
  totalReportes: number;
  reportesPendientes: number;
  reportesEnProgreso: number;
  reportesEnviados: number;
  reportesVencidos: number;
  tasaCumplimiento: number;
}

// ==================== DASHBOARD AUDITOR ====================

export interface ResumenEjecutivoAuditor {
  mes: number;
  anio: number;
  nombreMes: string;
  totalObligaciones: number;
  cumplidas: number;
  pendientes: number;
  vencidas: number;
  porcentajeCumplimiento: number;
  porcentajeMesAnterior?: number;
  variacionMensual?: number;
  porcentajeAnioAnterior?: number;
  variacionAnual?: number;
  nivelDesempeno?: string;
  promedioTiempoEntrega?: number;
}

export interface AnalisisTendenciasAuditor {
  meses: string[];
  porcentajesCumplimiento: number[];
  totalObligaciones: number[];
  cumplidas: number[];
  vencidas: number[];
  trimestres?: string[];
  porcentajesTrimestre?: number[];
  tendenciaProyectada?: number;
  direccionTendencia?: string;
}

export interface CumplimientoEntidadAuditor {
  entidadId: string;
  entidad: string;
  tipoEntidad?: string;
  totalObligaciones: number;
  cumplidas: number;
  pendientes: number;
  vencidas: number;
  porcentaje: number;
  ranking?: string;
  variacionVsMesAnterior?: number;
}

export interface CumplimientoObligacionAuditor {
  obligacionId: string;
  obligacion: string;
  entidadReguladora: string;
  periodicidad: string;
  totalReportes: number;
  cumplidos: number;
  vencidos: number;
  porcentaje: number;
  promedioTiempoEntrega?: number;
}

export interface RegistroHistoricoAuditor {
  anio: number;
  mes: number;
  periodo: string;
  total: number;
  cumplidas: number;
  vencidas: number;
  porcentaje: number;
}

export interface HistorialAuditor {
  registros: RegistroHistoricoAuditor[];
  anioActual: number;
  porcentajeAnual: number;
  totalAnual: number;
  cumplidasAnual: number;
}

export interface ReporteConsultaAuditor {
  id: string;
  obligacion: string;
  entidad: string;
  responsable: string;
  estado: string;
  fechaVencimiento: string | null;
  fechaEnvio: string | null;
  dentroDelTiempo?: boolean;
  diasAnticipacion?: number | null;
  tieneEvidencia?: boolean;
  urlEvidencia?: string;
  nombreArchivo?: string;
}

export interface EventoCalendarioAuditor {
  eventoId: string;
  reporteId: string;
  titulo: string;
  startDate: string;
  endDate: string;
  fechaVencimiento: string;
  tipo: string;
  estado: string;
  entidad: string;
  color: string;
  descripcion?: string;
}

export interface CalendarioAuditor {
  eventos: EventoCalendarioAuditor[];
  resumenMes?: {
    totalEventos: number;
    cumplidos: number;
    pendientes: number;
    vencidos: number;
  };
}

export interface AlertaLecturaAuditor {
  id: string;
  mensaje: string;
  tipo: string;
  entidad: string;
  obligacion: string;
  fechaVencimiento: string | null;
  fechaCreacion: string;
}

export interface AlertasAuditor {
  alertas: AlertaLecturaAuditor[];
  totalAlertas?: number;
  alertasCriticas?: number;
}

export interface DashboardAuditor {
  resumenEjecutivo?: ResumenEjecutivoAuditor;
  analisisTendencias?: AnalisisTendenciasAuditor;
  cumplimientoPorEntidad?: CumplimientoEntidadAuditor[];
  cumplimientoPorObligacion?: CumplimientoObligacionAuditor[];
  historialCumplimiento?: HistorialAuditor;
  reportesEnviados?: ReporteConsultaAuditor[];
  calendarioConsulta?: CalendarioAuditor;
  alertasGlobales?: AlertasAuditor;
}

// ==================== DASHBOARD SUPERVISOR ====================

export interface KpisSupervisor {
  reportesEnRevision: number;
  reportesRequierenCorreccion: number;
  reportesPendientes: number;
  reportesAtrasados: number;
  porcentajeCumplimientoATiempo: number;
  totalEnviadosATiempo: number;
  totalEnviadosTarde: number;
  totalVencidos: number;
  totalPendientes: number;
  diasRetrasoPromedio: number;
  porcentajeCumplimientoAnterior?: number;
  deltaPorcentajeCumplimiento?: number;
  diasRetrasoPromedioAnterior?: number;
  deltaDiasRetrasoPromedio?: number;
  totalProximosVencer?: number;
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
  vencidos?: number;
  retrasoPromedio?: number;
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
  enviadosATiempo?: number;
  porcentajeCumplimiento: number;
}

export interface TendenciaTemporal {
  vista: 'mensual' | 'trimestral' | string;
  etiquetas: string[];
  aTiempo: number[];
  tarde: number[];
  vencido: number[];
  pendiente: number[];
}

export interface AlertaPrioritaria {
  periodoId: string;
  reporteId: string;
  nombreReporte: string;
  entidad: string;
  responsable: string;
  estado: string;
  fechaLimite: string;
  diasRestantes: number;
  tipo: string;
  color: string;
  accionSugerida: string;
}

export interface AccionPendienteSupervisor {
  periodoId: string;
  reporteId: string;
  nombreReporte: string;
  entidad: string;
  estado: string;
  fechaLimite: string;
  tipo: string;
  responsable: string;
}

export interface DashboardSupervisorResponse {
  kpis: KpisSupervisor;
  estadoGeneral: Record<string, number>;
  distribucionEstados?: Record<string, number>;
  cargaPorResponsable: CargaResponsable[];
  distribucionPorEntidad: DistribucionEntidad[];
  tendenciaTemporal?: TendenciaTemporal;
  alertasPrioritarias?: AlertaPrioritaria[];
  accionesPendientes?: AccionPendienteSupervisor[];
  entidadesMayorIncumplimiento?: DistribucionEntidad[];
  responsablesMayorIncumplimiento?: CargaResponsable[];
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
  evento:
    | "LOGIN_SUCCESS"
    | "LOGIN_FAILED"
    | "LOGOUT"
    | "TOKEN_REFRESH"
    | "PASSWORD_CHANGE"
    | "SESSION_EXPIRED";
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
  async listar(
    page = 0,
    size = 100,
    sort = ["nombre,asc"]
  ): Promise<Page<EntidadResponse>> {
    const response = await api.get("/api/entidades", {
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

  async activas(
    page = 0,
    size = 100,
    sort = ["nombre,asc"]
  ): Promise<Page<EntidadResponse>> {
    const response = await api.get("/api/entidades", {
      params: { page, size, sort },
    });
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  async obtener(id: string): Promise<EntidadResponse> {
    const response = await api.get(`/api/entidades/${id}`);
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  async crear(data: EntidadRequest): Promise<EntidadResponse> {
    const response = await api.post("/api/entidades", data);
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  async actualizar(id: string, data: EntidadRequest): Promise<EntidadResponse> {
    const response = await api.put(`/api/entidades/${id}`, data);
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
    const response = await api.delete(`/api/entidades/${id}`);
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

export const evidenciasService = {
  async subir(reporteId: string, file: File): Promise<EvidenciaResponse> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(
      `/api/evidencias/reporte/${reporteId}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
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

  async subirPorPeriodo(periodoId: string, file: File): Promise<EvidenciaResponse> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(
      `/api/evidencias/periodo/${periodoId}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
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

  async listarPorReporte(reporteId: string): Promise<EvidenciaResponse[]> {
    const response = await api.get(`/api/evidencias/reporte/${reporteId}`);
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
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
    const a = document.createElement("a");
    const disposition = response.headers["content-disposition"];
    const match = disposition?.match(/filename="(.+)"/);
    a.href = url;
    a.download = match?.[1] || `evidencia-${id}`;
    a.click();
    window.URL.revokeObjectURL(url);
  },

  async obtenerBlob(id: string): Promise<Blob> {
    const response = await api.get(`/api/evidencias/${id}/descargar`, {
      responseType: "blob",
    });
    return new Blob([response.data], {
      type: response.headers["content-type"] || "application/octet-stream",
    });
  },

  async eliminar(id: string): Promise<{ mensaje: string }> {
    const response = await api.delete(`/api/evidencias/${id}`);
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

// ==================== ARCHIVOS DE PERIODOS ====================

export interface ArchivoDTO {
  archivoId: string;
  tipoArchivo: string;
  nombreOriginal: string;
  linkStorage: string;
  urlPublica: string | null;
  tamanoBytes: number;
  mimeType: string;
  hashIntegridad?: string;
  subidoPorId: string;
  subidoPorNombre: string;
  subidoEn: string;
  esReportePrincipal?: boolean;
}

export interface PeriodoArchivosResponse {
  periodoId: string;
  archivos: ArchivoDTO[];
}

export interface SignedUrlResponse {
  url: string;
  ttlMinutes: number | null;
}

export const archivosService = {
  async obtenerArchivosPorPeriodo(periodoId: string): Promise<PeriodoArchivosResponse> {
    const response = await api.get(`/api/periodos/${periodoId}/archivos`);
    if (response.data && typeof response.data === "object" && "data" in response.data) {
      return response.data.data;
    }
    return response.data;
  },

  async generarUrlTemporal(periodoId: string, archivoId: string, ttlMinutes?: number): Promise<SignedUrlResponse> {
    const params = ttlMinutes ? `?ttlMinutes=${ttlMinutes}` : '';
    const response = await api.get(`/api/periodos/${periodoId}/archivos/${archivoId}/url${params}`);
    if (response.data && typeof response.data === "object" && "data" in response.data) {
      return response.data.data;
    }
    return response.data;
  },

  async visualizarArchivo(periodoId: string, archivoId: string) {
    const urlResponse = await this.generarUrlTemporal(periodoId, archivoId, 10);
    window.open(urlResponse.url, '_blank');
  },

  async descargarArchivo(periodoId: string, archivoId: string, nombreArchivo: string) {
    const urlResponse = await this.generarUrlTemporal(periodoId, archivoId, 5);
    const a = document.createElement("a");
    a.href = urlResponse.url;
    a.download = nombreArchivo;
    a.click();
  }
};

export const dashboardService = {
  async estadisticas(
    periodo?: string,
    fechaInicio?: string,
    fechaFin?: string
  ): Promise<DashboardResponse> {
    const params: any = {};
    if (periodo) params.periodo = periodo;
    if (fechaInicio) params.fechaInicio = fechaInicio;
    if (fechaFin) params.fechaFin = fechaFin;
    const response = await api.get("/api/dashboard/estadisticas", { params });
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  async cumplimiento(): Promise<number> {
    const response = await api.get("/api/dashboard/cumplimiento");
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  // Dashboard por rol
  async dashboardAdmin(): Promise<any> {
    const response = await api.get("/api/dashboard/admin");
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  async dashboardResponsable(): Promise<any> {
    const response = await api.get("/api/dashboard/responsable");
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  async dashboardSupervisor(filters?: {
    entidadId?: string;
    responsableId?: string;
    frecuencia?: string;
    estado?: string;
    tipoAlerta?: string;
    fechaInicio?: string;
    fechaFin?: string;
    vistaTemporal?: string;
    limitePeriodos?: number;
  }): Promise<DashboardSupervisorResponse> {
    const params = new URLSearchParams();
    if (filters?.entidadId) params.append('entidadId', filters.entidadId);
    if (filters?.responsableId) params.append('responsableId', filters.responsableId);
    if (filters?.frecuencia) params.append('frecuencia', filters.frecuencia);
    if (filters?.estado) params.append('estado', filters.estado);
    if (filters?.tipoAlerta) params.append('tipoAlerta', filters.tipoAlerta);
    if (filters?.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
    if (filters?.fechaFin) params.append('fechaFin', filters.fechaFin);
    if (filters?.vistaTemporal) params.append('vistaTemporal', filters.vistaTemporal);
    if (filters?.limitePeriodos) params.append('limitePeriodos', filters.limitePeriodos.toString());

    // Usamos el endpoint v2 del backend `/api/dashboard/supervisor/v2` (igual convención que otros roles)
    const query = params.toString();
    const response = await api.get(`/api/dashboard/supervisor/v2${query ? `?${query}` : ''}`);
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },

  async dashboardAuditor(): Promise<any> {
    const response = await api.get("/api/dashboard/auditor");
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  async resumenAuditor(): Promise<ResumenEjecutivoAuditor> {
    const response = await api.get('/api/dashboard/auditor/resumen-ejecutivo');
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },

  async tendenciasAuditor(): Promise<AnalisisTendenciasAuditor> {
    const response = await api.get('/api/dashboard/auditor/tendencias');
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },

  async cumplimientoEntidadAuditor(): Promise<CumplimientoEntidadAuditor[]> {
    const response = await api.get('/api/dashboard/auditor/cumplimiento-entidad');
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },

  async cumplimientoObligacionAuditor(): Promise<CumplimientoObligacionAuditor[]> {
    const response = await api.get('/api/dashboard/auditor/cumplimiento-obligacion');
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },

  async historialAuditor(): Promise<HistorialAuditor> {
    const response = await api.get('/api/dashboard/auditor/historial');
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },

  async reportesAuditor(): Promise<ReporteConsultaAuditor[]> {
    const response = await api.get('/api/dashboard/auditor/reportes');
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data;
    }
    return response.data;
  },

  async calendarioAuditor(): Promise<CalendarioAuditor> {
    const response = await api.get('/api/dashboard/auditor/calendario');
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

  async actualizar(
    documentNumber: string,
    data: UsuarioRequest
  ): Promise<UsuarioResponse> {
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

  // Cambiar rol de usuario (usando PATCH)
  async cambiarRol(
    documentNumber: string,
    nuevoRol: string
  ): Promise<UsuarioResponse> {
    const response = await api.patch(
      `/api/usuarios/${documentNumber}/rol`,
      null,
      {
        params: { rolCodigo: nuevoRol }
      }
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

  // Desactivar usuario (usando nuevo endpoint PATCH)
  async desactivar(documentNumber: string): Promise<UsuarioResponse> {
    const response = await api.patch(
      `/api/usuarios/${documentNumber}/desactivar`
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

  // Activar usuario (usando nuevo endpoint PATCH)
  async activar(documentNumber: string): Promise<UsuarioResponse> {
    // Primero obtenemos los datos actuales del usuario
    const usuarioActual = await this.obtener(documentNumber);

    // Actualizamos el estado a activo
    const dataActualizada: UsuarioRequest = {
      documentNumber: usuarioActual.documentNumber,
      documentType: usuarioActual.documentType || "CC",
      email: usuarioActual.email,
      firstName: usuarioActual.firstName,
      secondName: usuarioActual.secondName || "",
      firstLastname: usuarioActual.firstLastname,
      secondLastname: usuarioActual.secondLastname || "",
      roles: usuarioActual.roles,
    };

    // El campo 'activo' debe ir en el request
    const response = await api.put(`/api/usuarios/${documentNumber}`, {
      ...dataActualizada,
      activo: true,
    });

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
  async invitar(
    email: string,
    role: string
  ): Promise<{ success: boolean; message: string; data?: any }> {
    const response = await api.post("/api/users/invite", { email, role });
    return response.data;
  },

  // Cancelar invitación
  async cancelarInvitacion(
    invitationId: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/api/users/invite/${invitationId}`);
    return response.data;
  },

  // Validar token de invitación
  async validarTokenInvitacion(
    token: string
  ): Promise<{ success: boolean; data: boolean; message: string }> {
    const response = await api.get(
      `/api/users/validate-invitation?token=${token}`
    );
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
    const response = await api.post("/api/users/complete-invitation", data);
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
  responsableEnvio?: {
    usuarioId: string;
    nombreCompleto: string;
    email: string;
    cargo: string;
  };
  comentarios: ComentarioInfo[] | null;
  comentariosTexto?: string | null; // Legacy field
  cantidadArchivos: number;
  archivos?: ArchivoDTO[];
  puedeEnviar: boolean;
  puedeAprobar: boolean;
  puedeRechazar: boolean;
  puedeCorregir: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ArchivoDTO {
  archivoId: string;
  tipoArchivo: string;
  nombreOriginal: string;
  tamanoBytes: number;
  mimeType: string;
  subidoPor: string;
  subidoPorEmail: string;
  subidoEn: string;
  urlPublica: string | null;
}

export interface ComentarioInfo {
  autor: string;
  cargo: string;
  fecha: string;
  accion: string;
  texto: string;
}

export interface EnviarReporteRequest {
  periodoId: string;
  comentarios?: string;
  evidenciasIds?: string[];
}

export interface ValidarReporteRequest {
  periodoId: string;
  accion: "aprobar" | "rechazar" | "revisar" | "corregir";
  comentarios?: string;
  motivoRechazo?: string; // Obligatorio para "rechazar" y "corregir"
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
  async misPeriodos(
    page = 0,
    size = 10,
    sort?: string
  ): Promise<Page<ReportePeriodo>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    if (sort) params.append("sort", sort);

    const url = `/api/flujo-reportes/mis-periodos?${params}`;
    console.log("🌐 [flujoReportesService] Llamando a:", url);

    try {
      const response = await api.get(url);

      console.log(
        "✅ [flujoReportesService] Respuesta status:",
        response.status
      );
      console.log("📊 [flujoReportesService] Estructura de respuesta:", {
        hasData: !!response.data,
        hasDataProperty: response.data && "data" in response.data,
        dataType: typeof response.data,
        keys: response.data ? Object.keys(response.data) : [],
      });

      if (!response.data) {
        throw new Error("Respuesta vacía del servidor");
      }

      // Manejar ambos formatos de respuesta
      if (response.data.data) {
        console.log("📦 [flujoReportesService] Usando response.data.data");
        console.log(
          "📋 [flujoReportesService] Cantidad de periodos:",
          response.data.data?.content?.length || 0
        );
        return response.data.data;
      } else if (response.data.content) {
        console.log(
          "📦 [flujoReportesService] Usando response.data directamente"
        );
        console.log(
          "📋 [flujoReportesService] Cantidad de periodos:",
          response.data.content.length
        );
        return response.data;
      } else {
        console.error(
          "❌ [flujoReportesService] Formato de respuesta inesperado:",
          response.data
        );
        throw new Error("Formato de respuesta del servidor no reconocido");
      }
    } catch (error: any) {
      console.error("❌ [flujoReportesService] Error en la petición:", error);
      console.error("❌ [flujoReportesService] URL:", url);
      console.error(
        "❌ [flujoReportesService] Response:",
        error.response?.data
      );
      throw error;
    }
  },

  // Obtener periodos por reporte (ADMIN/AUDITOR)
  async periodosPorReporte(
    reporteId: string,
    page = 0,
    size = 50
  ): Promise<Page<ReportePeriodo>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    const url = `/api/flujo-reportes/reportes/${reporteId}/periodos?${params}`;

    try {
      const response = await api.get(url);

      if (response.data?.data) {
        return response.data.data;
      }
      if (response.data?.content) {
        return response.data;
      }
      throw new Error("Formato de respuesta no reconocido al listar periodos por reporte");
    } catch (error) {
      console.error("❌ [flujoReportesService] Error listando periodos del reporte", reporteId, error);
      throw error;
    }
  },

  // Obtener periodos pendientes
  async misPeriodosPendientes(
    page = 0,
    size = 10
  ): Promise<Page<ReportePeriodo>> {
    const response = await api.get(
      `/api/flujo-reportes/mis-periodos/pendientes?page=${page}&size=${size}`
    );
    return response.data.data;
  },

  // Obtener periodos que requieren corrección
  async misPeríodosCorrecciones(
    page = 0,
    size = 10
  ): Promise<Page<ReportePeriodo>> {
    const response = await api.get(
      `/api/flujo-reportes/mis-periodos/requieren-correccion?page=${page}&size=${size}`
    );
    return response.data.data;
  },

  // Enviar reporte
  async enviar(request: EnviarReporteRequest): Promise<ReportePeriodo> {
    const response = await api.post("/api/flujo-reportes/enviar", request);
    return response.data.data;
  },

  // Corregir y reenviar
  async corregirReenviar(
    request: EnviarReporteRequest
  ): Promise<ReportePeriodo> {
    const response = await api.post(
      "/api/flujo-reportes/corregir-reenviar",
      request
    );
    return response.data.data;
  },

  // Obtener periodos pendientes de validación (SUPERVISOR)
  async pendientesValidacion(
    page = 0,
    size = 10
  ): Promise<Page<ReportePeriodo>> {
    const response = await api.get(
      `/api/flujo-reportes/pendientes-validacion?page=${page}&size=${size}`
    );
    return response.data.data;
  },

  // Obtener periodos bajo mi supervisión
  async supervision(page = 0, size = 10): Promise<Page<ReportePeriodo>> {
    const response = await api.get(
      `/api/flujo-reportes/supervision?page=${page}&size=${size}`
    );
    return response.data.data;
  },

  // Validar reporte (aprobar/rechazar)
  async validar(request: ValidarReporteRequest): Promise<ReportePeriodo> {
    const response = await api.post("/api/flujo-reportes/validar", request);
    return response.data.data;
  },

  // Aprobar directamente
  async aprobar(
    periodoId: string,
    comentarios?: string
  ): Promise<ReportePeriodo> {
    const params = comentarios
      ? `?comentarios=${encodeURIComponent(comentarios)}`
      : "";
    const response = await api.post(
      `/api/flujo-reportes/${periodoId}/aprobar${params}`
    );
    return response.data.data;
  },

  // Rechazar directamente
  async rechazar(
    periodoId: string,
    motivoRechazo: string
  ): Promise<ReportePeriodo> {
    const response = await api.post(
      `/api/flujo-reportes/${periodoId}/rechazar?motivoRechazo=${encodeURIComponent(motivoRechazo)}`
    );
    return response.data.data;
  },

  // Solicitar corrección con detalles
  async solicitarCorreccion(
    request: SolicitarCorreccionRequest
  ): Promise<ReportePeriodo> {
    const response = await api.post(
      "/api/flujo-reportes/solicitar-correccion",
      request
    );
    return response.data.data;
  },

  // Obtener detalle de un periodo
  async obtenerPeriodo(periodoId: string): Promise<ReportePeriodo> {
    const response = await api.get(`/api/flujo-reportes/periodos/${periodoId}`);
    return response.data.data;
  },

  // Obtener historial de estados
  async obtenerHistorial(periodoId: string): Promise<HistorialEstado[]> {
    const response = await api.get(
      `/api/flujo-reportes/periodos/${periodoId}/historial`
    );
    return response.data.data;
  },

  // Filtrar por estado
  async porEstado(
    estado: string,
    page = 0,
    size = 10
  ): Promise<Page<ReportePeriodo>> {
    const response = await api.get(
      `/api/flujo-reportes/periodos/estado/${estado}?page=${page}&size=${size}`
    );
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
    if (estado) params.append("estado", estado);
    if (responsableId) params.append("responsableId", responsableId);
    if (entidadId) params.append("entidadId", entidadId);

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
    if (estado) params.append("estado", estado);
    if (responsableId) params.append("responsableId", responsableId);
    if (entidadId) params.append("entidadId", entidadId);

    const response = await api.get(`/api/flujo-reportes/supervision?${params}`);
    return response.data.data;
  },

  // ==================== COMENTARIOS ====================
  
  // Obtener comentarios de un periodo
  async obtenerComentarios(periodoId: string): Promise<ComentarioInfo[]> {
    const response = await api.get(`/api/flujo-reportes/periodos/${periodoId}/comentarios`);
    return response.data.data;
  },

  // Agregar comentario adicional
  async agregarComentario(request: {
    periodoId: string;
    texto: string;
  }): Promise<ComentarioInfo> {
    const response = await api.post("/api/flujo-reportes/comentarios", request);
    return response.data.data;
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
    if (tipoArchivo) params.append("tipoArchivo", tipoArchivo);
    if (responsableId) params.append("responsableId", responsableId);
    if (entidadId) params.append("entidadId", entidadId);
    if (estado) params.append("estado", estado);

    const response = await api.get(`/api/evidencias/supervision?${params}`);
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  // Descargar evidencia
  async descargar(id: string): Promise<void> {
    const response = await api.get(`/api/evidencias/download/${id}`, {
      responseType: "blob",
    });
    const blob = new Blob([response.data], {
      type: response.headers["content-type"],
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    const disposition = response.headers["content-disposition"];
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
  tipo:
    | "periodo"
    | "vencimiento"
    | "VENCIMIENTO"
    | "ENVIO"
    | "APROBACION"
    | "RECHAZO"
    | "CORRECCION"
    | "VALIDACION_PENDIENTE";

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
  responsableId?: string;
  supervisorNombre?: string;
  supervisorId?: string;
  entidadNombre?: string;
  entidad?: string; // Para auditor
  tipoIncidencia?: string; // Para supervisor
  diasPendiente?: number;
  diasVencido?: number;
  requiereAccion?: boolean;
  fechaLimiteCorreccion?: string;
  tiempoRespuesta?: string;
  cumplimiento?: "OPORTUNO" | "EXTEMPORANEO" | "VENCIDO";
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
    if (filtros?.fechaInicio) params.append("fechaInicio", filtros.fechaInicio);
    if (filtros?.fechaFin) params.append("fechaFin", filtros.fechaFin);
    if (filtros?.tipo) params.append("tipo", filtros.tipo);
    if (filtros?.estado) params.append("estado", filtros.estado);
    if (filtros?.entidadId) params.append("entidadId", filtros.entidadId);

    const response = await api.get(
      `/api/dashboard/admin/calendario?${params.toString()}`
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

  // Calendario Responsable (Personal)
  async responsable(filtros?: CalendarioFiltros): Promise<CalendarioResponse> {
    const params = new URLSearchParams();
    if (filtros?.fechaInicio) params.append("fechaInicio", filtros.fechaInicio);
    if (filtros?.fechaFin) params.append("fechaFin", filtros.fechaFin);
    if (filtros?.tipo) params.append("tipo", filtros.tipo);
    if (filtros?.estado) params.append("estado", filtros.estado);

    const url = `/api/dashboard/responsable/calendario?${params.toString()}`;
    console.log("🌐 [calendarioService] Llamando a:", url);

    try {
      const response = await api.get(url);

      console.log("✅ [calendarioService] Respuesta status:", response.status);
      console.log("📊 [calendarioService] Estructura de respuesta:", {
        hasData: !!response.data,
        hasDataProperty: response.data && "data" in response.data,
        dataType: typeof response.data,
      });

      if (!response.data) {
        throw new Error("Respuesta vacía del servidor");
      }

      // Manejar ambos formatos de respuesta
      if (response.data.data) {
        console.log("📦 [calendarioService] Usando response.data.data");
        console.log(
          "📋 [calendarioService] Eventos:",
          response.data.data?.eventos?.length || 0
        );
        return response.data.data;
      } else if (response.data.eventos) {
        console.log("📦 [calendarioService] Usando response.data directamente");
        console.log(
          "📋 [calendarioService] Eventos:",
          response.data.eventos.length
        );
        return response.data;
      } else {
        console.error(
          "❌ [calendarioService] Formato de respuesta inesperado:",
          response.data
        );
        throw new Error("Formato de respuesta del servidor no reconocido");
      }
    } catch (error: any) {
      console.error("❌ [calendarioService] Error en la petición:", error);
      console.error("❌ [calendarioService] URL:", url);
      console.error("❌ [calendarioService] Response:", error.response?.data);
      throw error;
    }
  },

  // Calendario Supervisor (Incidencias)
  async supervisor(filtros?: CalendarioFiltros): Promise<CalendarioResponse> {
    const params = new URLSearchParams();
    if (filtros?.fechaInicio) params.append("fechaInicio", filtros.fechaInicio);
    if (filtros?.fechaFin) params.append("fechaFin", filtros.fechaFin);
    if (filtros?.tipo) params.append("tipo", filtros.tipo);
    if (filtros?.estado) params.append("estado", filtros.estado);
    if (filtros?.entidadId) params.append('entidadId', filtros.entidadId);

    try {
      const response = await api.get(
      `/api/dashboard/supervisor/calendario?${params.toString()}`
    );
      const data = 
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    
        ? response.data.data
        : response.data;

      // Compatibilidad si el backend envía "incidencias" en lugar de "eventos"
      if (data && !data.eventos && Array.isArray((data as any).incidencias)) {
        return { ...data, eventos: (data as any).incidencias };
      }

      return data;
    } catch (error) {
      console.error('[calendarioService.supervisor] Error cargando calendario:', error);
      return {
        eventos: [],
        totalEventosMes: 0,
        eventosVencidosMes: 0,
        eventosProximosMes: 0,
        validacionesPendientes: 0,
        incidenciasCriticas: 0,
      };
    }
  },

  // Calendario Auditor (Consulta)
  async auditor(filtros?: CalendarioFiltros): Promise<CalendarioResponse> {
    const params = new URLSearchParams();
    if (filtros?.fechaInicio) params.append("fechaInicio", filtros.fechaInicio);
    if (filtros?.fechaFin) params.append("fechaFin", filtros.fechaFin);
    if (filtros?.tipo) params.append("tipo", filtros.tipo);
    if (filtros?.estado) params.append("estado", filtros.estado);
    if (filtros?.entidadId) params.append("entidadId", filtros.entidadId);

    const response = await api.get(
      `/api/dashboard/auditor/calendario?${params.toString()}`
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

    const response = await api.get("/api/auditoria/accesos", { params });
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  // Obtener estadísticas (Admin)
  async obtenerEstadisticas(): Promise<AccesosEstadisticasDTO> {
    const response = await api.get("/api/auditoria/accesos/estadisticas");
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
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
    const response = await api.get(
      `/api/auditoria/accesos/usuario/${usuarioId}`,
      {
        params: { page, size },
      }
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

  // Obtener último acceso de un usuario (Admin)
  async obtenerUltimoAccesoUsuario(
    usuarioId: string
  ): Promise<UserSessionLogResponse> {
    const response = await api.get(
      `/api/auditoria/accesos/usuario/${usuarioId}/ultimo`
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

  // Obtener mis propios accesos (Usuario autenticado)
  async obtenerMisAccesos(
    page = 0,
    size = 20
  ): Promise<Page<UserSessionLogResponse>> {
    const response = await api.get("/api/auditoria/mis-accesos", {
      params: { page, size },
    });
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  // Obtener mi último acceso (Usuario autenticado)
  async obtenerMiUltimoAcceso(): Promise<UserSessionLogResponse> {
    const response = await api.get("/api/auditoria/mi-ultimo-acceso");
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  // Limpiar logs antiguos (Admin)
  async limpiarLogsAntiguos(diasRetencion = 90): Promise<void> {
    const response = await api.delete("/api/auditoria/accesos/limpiar", {
      params: { diasRetencion },
    });
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

// ==================== ADMIN ACTIONS ====================

export interface AdminActionSummary {
  actionId: string;
  actionType: string;
  adminNombre: string;
  responsableAfectado: string;
  periodoDescripcion: string;
  reporteNombre: string;
  motivo: string;
  createdAt: string;
  filesCount: number;
  additionalData?: Record<string, any>;
}

export const adminActionsService = {
  /**
   * Obtener acciones administrativas recientes
   */
  async obtenerAcciones(
    page = 0,
    size = 10,
    adminId?: string,
    actionType?: string,
    periodoId?: string
  ): Promise<Page<AdminActionSummary>> {
    const params: Record<string, any> = { page, size };
    if (adminId) params.adminId = adminId;
    if (actionType) params.actionType = actionType;
    if (periodoId) params.periodoId = periodoId;

    const response = await api.get("/api/admin/actions", { params });
    
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  /**
   * Obtener acciones recientes (simplificado para dashboard)
   */
  async obtenerActividadReciente(limit = 10): Promise<AdminActionSummary[]> {
    const result = await this.obtenerAcciones(0, limit);
    return result.content || [];
  },
};

// ==================== PASSWORD RESET SERVICES ====================

export const passwordResetService = {
  /**
   * Solicitar código de recuperación de contraseña
   */
  async forgotPassword(email: string): Promise<PasswordResetResponse> {
    const response = await api.post<PasswordResetResponse>(
      "/api/auth/password/forgot",
      { email }
    );
    return response.data;
  },

  /**
   * Verificar código de 6 dígitos
   */
  async verifyCode(email: string, code: string): Promise<PasswordResetResponse> {
    const response = await api.post<PasswordResetResponse>(
      "/api/auth/password/verify-code",
      { email, code }
    );
    return response.data;
  },

  /**
   * Cambiar contraseña con token
   */
  async resetPassword(token: string, newPassword: string): Promise<PasswordResetResponse> {
    const response = await api.post<PasswordResetResponse>(
      "/api/auth/password/reset",
      { token, newPassword }
    );
    return response.data;
  },
};
