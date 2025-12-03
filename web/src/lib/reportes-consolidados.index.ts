/**
 * Índice centralizado para exportaciones de Reportes Consolidados
 * Facilita las importaciones en otros componentes
 */

// Tipos e Interfaces
export type {
  ApiResponse,
  Page,
  ResponsableInfo,
  ContactoInfo,
  PeriodoReporte,
  EstadisticasReporte,
  ReporteConsolidado,
  EstadoReporte,
  FrecuenciaReporte,
  FormatoReporte,
  ColorEstado,
  FiltrosReportesConsolidados,
  ReportesConsolidadosResponse,
  ReporteConsolidadoResponse,
} from "./types/reportes-consolidados";

// Servicios
export { default as reportesConsolidadosService } from "./services/reportes-consolidados.service";

// Hooks
export {
  useReportesConsolidados,
  useReporteConsolidado,
  useEstadisticasConsolidadas,
} from "./hooks/useReportesConsolidados";

// Utilidades
export {
  parseFecha,
  formatearFecha,
  formatearFechaHora,
  formatearFechaLarga,
  calcularDiasRestantes,
  estaVencido,
  obtenerColorEstado,
  obtenerClaseColor,
  obtenerColorHex,
  formatearEstado,
  obtenerClaseEstado,
  obtenerMensajeUrgencia,
  esUrgente,
  formatearFrecuencia,
  formatearFormato,
  calcularPorcentajeCumplimiento,
  formatearNombreCompleto,
  obtenerIniciales,
  esEmailValido,
  truncar,
} from "./utils/reportes-utils";
