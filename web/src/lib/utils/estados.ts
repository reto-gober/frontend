/**
 * Utilidades para normalización de estados de reportes
 *
 * Estados válidos del backend (flujo-reportes):
 * - pendiente: Periodo creado, esperando elaboración
 * - en_elaboracion: Responsable trabajando en el reporte
 * - enviado_a_tiempo: Enviado a supervisión (a tiempo)
 * - enviado_tarde: Enviado fuera de plazo
 * - en_revision: Supervisor revisando
 * - requiere_correccion: Supervisor solicitó cambios
 * - aprobado: Supervisor aprobó
 * - rechazado: Supervisor rechazó
 * - vencido: Pasó la fecha límite sin enviar
 */

/**
 * Normaliza un estado a minúsculas para comparación consistente
 */
export const normalizarEstado = (estado: string | undefined | null): string => {
  return (estado || "").toLowerCase().trim();
};

/**
 * Verifica si un periodo está completado/enviado
 */
export const esEstadoCompletado = (estado: string): boolean => {
  const estadoNorm = normalizarEstado(estado);
  return [
    "enviado_a_tiempo",
    "enviado_tarde",
    "aprobado",
    "en_revision",
  ].includes(estadoNorm);
};

/**
 * Verifica si un periodo está pendiente
 */
export const esEstadoPendiente = (estado: string): boolean => {
  const estadoNorm = normalizarEstado(estado);
  return ["pendiente", "en_elaboracion", "requiere_correccion"].includes(
    estadoNorm
  );
};

/**
 * Verifica si un periodo fue enviado (sin importar si a tiempo o tarde)
 */
export const esEstadoEnviado = (estado: string): boolean => {
  const estadoNorm = normalizarEstado(estado);
  return [
    "enviado_a_tiempo",
    "enviado_tarde",
    "aprobado",
    "en_revision",
  ].includes(estadoNorm);
};

/**
 * Verifica si un periodo requiere corrección
 */
export const esEstadoRequiereCorreccion = (estado: string): boolean => {
  const estadoNorm = normalizarEstado(estado);
  return estadoNorm === "requiere_correccion";
};

/**
 * Verifica si un periodo está en revisión
 */
export const esEstadoEnRevision = (estado: string): boolean => {
  const estadoNorm = normalizarEstado(estado);
  return estadoNorm === "en_revision";
};

/**
 * Verifica si un periodo está aprobado
 */
export const esEstadoAprobado = (estado: string): boolean => {
  const estadoNorm = normalizarEstado(estado);
  return estadoNorm === "aprobado";
};

/**
 * Verifica si un periodo está vencido
 */
export const esEstadoVencido = (estado: string): boolean => {
  const estadoNorm = normalizarEstado(estado);
  return estadoNorm === "vencido";
};

/**
 * Verifica si un periodo fue enviado fuera de plazo (extemporáneo)
 */
export const esEstadoExtemporaneo = (estado: string): boolean => {
  const estadoNorm = normalizarEstado(estado);
  return estadoNorm === "enviado_tarde";
};
