/**
 * Tipos e Interfaces para Reportes Consolidados
 * Basado en el endpoint /api/reportes/consolidados
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
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
  sort?: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  numberOfElements?: number;
  pageable?: {
    offset: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    paged: boolean;
    pageNumber: number;
    pageSize: number;
    unpaged: boolean;
  };
}

export interface ResponsableInfo {
  id: string;
  documentNumber: string;
  nombre: string;
  email: string;
}

export interface ContactoInfo {
  nombre: string;
  cargo?: string;
  telefono?: string;
  email?: string;
}

export interface PeriodoReporte {
  periodoId: number;
  reporteId: number;
  fechaVencimiento: string;
  fechaEnvio?: string | null;
  estado: EstadoReporte;
  diasRestantes: number;
  vencido: boolean;
}

export interface EstadisticasReporte {
  totalPeriodos: number;
  pendientes: number;
  enProgreso: number;
  enviados: number;
  vencidos: number;
  tasaCumplimiento: number;
}

export interface ReporteConsolidado {
  id: number;
  titulo: string;
  descripcion?: string;
  entidad: {
    id: number;
    nombre: string;
    codigo?: string;
  };
  responsables: ResponsableInfo[];
  contactos: ContactoInfo[];
  frecuencia: FrecuenciaReporte;
  formato: FormatoReporte;
  resolucion?: string;
  proximoVencimiento: string | null;
  diasRestantes: number | null;
  colorEstado: ColorEstado;
  estadoGeneral: EstadoReporte;
  estadisticas: EstadisticasReporte;
  periodos: PeriodoReporte[];
  creadoEn: string;
  actualizadoEn: string;
}

export type EstadoReporte = "PENDIENTE" | "EN_PROGRESO" | "ENVIADO" | "VENCIDO";

export type FrecuenciaReporte =
  | "MENSUAL"
  | "TRIMESTRAL"
  | "SEMESTRAL"
  | "ANUAL";

export type FormatoReporte = "PDF" | "EXCEL" | "WORD" | "OTRO";

export type ColorEstado = "verde" | "amarillo" | "naranja" | "rojo" | "gris";

/**
 * Parámetros de filtrado para reportes consolidados
 */
export interface FiltrosReportesConsolidados {
  page?: number;
  size?: number;
  sort?: string;
  estado?: EstadoReporte;
  entidadId?: number;
  responsableId?: string;
}

/**
 * Respuesta del endpoint /api/reportes/consolidados
 */
export type ReportesConsolidadosResponse = ApiResponse<
  Page<ReporteConsolidado>
>;

/**
 * Respuesta del endpoint /api/reportes/consolidados/{id}
 */
export type ReporteConsolidadoResponse = ApiResponse<ReporteConsolidado>;
