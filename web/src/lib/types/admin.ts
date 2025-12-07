/**
 * Types para módulo de Admin
 */

// ============ Acciones Administrativas ============

export interface OverrideSubmitRequest {
  periodoId: string;
  originalResponsibleId: string;
  motivo: string;
  comentarios?: string;
  notificarSupervisor?: boolean;
  notificarResponsable?: boolean;
  confirmoResponsabilidad: boolean;
}

export interface FileMeta {
  fileName: string;
  fileSize: number;
  contentType: string;
  filePath: string;
  publicUrl: string;
  uploadedAt: string;
}

export interface AdminActionDetail {
  actionId: string;
  actionType: string;
  adminId: string;
  adminNombre: string;
  adminEmail: string;
  targetPeriodoId?: string;
  targetReporteId?: string;
  periodoDescripcion: string;
  reporteNombre: string;
  originalResponsibleId?: string;
  originalResponsibleNombre: string;
  originalResponsibleEmail: string;
  motivo: string;
  filesMeta?: Record<string, any>;
  additionalData?: Record<string, any>;
  ipOrigen?: string;
  userAgent?: string;
  createdAt: string;
  confirmed: boolean;
  files?: FileMeta[];
}

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

export interface AdminActionFilters {
  adminId?: string;
  actionType?: string;
  periodoId?: string;
  startDate?: string;
  endDate?: string;
}

// ============ Cumplimiento ============

export interface FiltrosCumplimientoDTO {
  entidadId?: string;
  responsableId?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface KpisSupervisorDTO {
  reportesEnRevision: number;
  reportesRequierenCorreccion: number;
  reportesPendientes: number;
  reportesAtrasados: number;
}

export interface AdminMetricsDTO {
  totalUsuariosActivos: number;
  totalReportesConfigurados: number;
  totalEntidades: number;
  accionesAdmin30Dias: number;
  reportesOverride30Dias: number;
  evidenciasSubidasPorAdmin30Dias: number;
  cumplimientoGlobalPorcentaje: number;
}

export interface CargaResponsableDTO {
  responsableId: string;
  nombreCompleto: string;
  email: string;
  cargo?: string;
  totalReportes: number;
  pendientes: number;
  enRevision: number;
  aprobados: number;
  atrasados: number;
  porcentajeCumplimiento: number;
}

export interface DistribucionEntidadDTO {
  entidadId: string;
  nombreEntidad: string;
  totalReportes: number;
  pendientes: number;
  enRevision: number;
  aprobados: number;
}

export interface SupervisorSummaryDTO {
  supervisorId: string;
  nombreCompleto: string;
  email: string;
  totalSupervisados: number;
  reportesBajoSupervision: number;
  reportesPendientesValidacion: number;
  porcentajeCumplimientoEquipo: number;
}

export interface AdminCumplimientoDTO {
  kpisGenerales: KpisSupervisorDTO;
  adminMetrics: AdminMetricsDTO;
  estadoGeneral: Record<string, number>;
  cargaPorResponsable: CargaResponsableDTO[];
  distribucionPorEntidad: DistribucionEntidadDTO[];
  topSupervisores: SupervisorSummaryDTO[];
  accionesRecientes: AdminActionSummary[];
}

// ============ Paginación ============

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
