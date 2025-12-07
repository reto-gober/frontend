// Tipos para el flujo de reportes

export type EstadoPeriodo =
  | 'pendiente'
  | 'en_elaboracion'
  | 'enviado_a_tiempo'
  | 'enviado_tarde'
  | 'en_revision'
  | 'requiere_correccion'
  | 'aprobado'
  | 'rechazado'
  | 'vencido';

export interface ResponsableInfo {
  usuarioId: string;
  nombreCompleto: string;
  email: string;
  cargo: string;
}

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
  estado: EstadoPeriodo;
  estadoDescripcion: string;
  fechaEnvioReal: string | null;
  diasDesviacion: number | null;
  responsableElaboracion: ResponsableInfo;
  responsableSupervision: ResponsableInfo;
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

export interface CorregirReenvirRequest {
  periodoId: string;
  comentarios: string;
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

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
