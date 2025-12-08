/**
 * Utilidades para manejo y cálculo de fechas
 */

/**
 * Normaliza una fecha al inicio del día (00:00:00)
 * Esto previene problemas de comparación por horas
 */
export const normalizarFecha = (fecha: Date | string): Date => {
  const fechaNormalizada =
    typeof fecha === "string" ? new Date(fecha) : new Date(fecha);
  fechaNormalizada.setHours(0, 0, 0, 0);
  return fechaNormalizada;
};

/**
 * Calcula los días restantes hasta una fecha de vencimiento
 * Retorna negativo si ya venció
 */
export const calcularDiasRestantes = (
  fechaVencimiento: Date | string
): number => {
  const hoy = normalizarFecha(new Date());
  const vencimiento = normalizarFecha(fechaVencimiento);

  const diffTime = vencimiento.getTime() - hoy.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

/**
 * Verifica si una fecha ya venció
 */
export const esFechaVencida = (fechaVencimiento: Date | string): boolean => {
  return calcularDiasRestantes(fechaVencimiento) < 0;
};

/**
 * Verifica si una fecha vence hoy
 */
export const venceHoy = (fechaVencimiento: Date | string): boolean => {
  return calcularDiasRestantes(fechaVencimiento) === 0;
};

/**
 * Verifica si una fecha vence dentro de N días
 */
export const venceDentroDeNDias = (
  fechaVencimiento: Date | string,
  dias: number
): boolean => {
  const diasRestantes = calcularDiasRestantes(fechaVencimiento);
  const hoy = normalizarFecha(new Date());
  const limite = new Date(hoy);
  limite.setDate(limite.getDate() + dias);

  const vencimiento = normalizarFecha(fechaVencimiento);

  return vencimiento >= hoy && vencimiento <= limite;
};

/**
 * Formatea una fecha a formato legible en español
 */
export const formatearFecha = (fecha: Date | string): string => {
  const fechaObj = typeof fecha === "string" ? new Date(fecha) : fecha;
  return fechaObj.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/**
 * Formatea una fecha completa con día de la semana
 */
export const formatearFechaCompleta = (fecha: Date | string): string => {
  const fechaObj = typeof fecha === "string" ? new Date(fecha) : fecha;
  return fechaObj.toLocaleDateString("es-CO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * Obtiene un texto descriptivo para días restantes
 */
export const obtenerTextoVencimiento = (
  fechaVencimiento: Date | string
): string => {
  const diasRestantes = calcularDiasRestantes(fechaVencimiento);

  if (diasRestantes < 0) {
    const diasVencidos = Math.abs(diasRestantes);
    return `Venció hace ${diasVencidos} día${diasVencidos !== 1 ? "s" : ""}`;
  } else if (diasRestantes === 0) {
    return "Vence hoy";
  } else if (diasRestantes === 1) {
    return "Vence mañana";
  } else {
    return `Vence en ${diasRestantes} días`;
  }
};
