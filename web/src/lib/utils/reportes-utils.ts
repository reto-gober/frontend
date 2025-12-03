/**
 * Utilidades para formateo de fechas y manejo de estados
 * de reportes consolidados
 */

import { format, parseISO, differenceInDays, isValid } from "date-fns";
import { es } from "date-fns/locale";
import type { ColorEstado, EstadoReporte } from "../types/reportes-consolidados";

/**
 * Parsea una fecha string ISO 8601 a objeto Date
 * Maneja valores null/undefined de forma segura
 */
export function parseFecha(fecha: string | null | undefined): Date | null {
  if (!fecha) return null;
  try {
    const parsed = parseISO(fecha);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Formatea una fecha a formato legible en español
 */
export function formatearFecha(
  fecha: string | Date | null | undefined,
  formato = "dd/MM/yyyy"
): string {
  if (!fecha) return "Sin fecha";

  try {
    const date = typeof fecha === "string" ? parseISO(fecha) : fecha;
    if (!isValid(date)) return "Fecha inválida";
    return format(date, formato, { locale: es });
  } catch {
    return "Fecha inválida";
  }
}

/**
 * Formatea una fecha con hora
 */
export function formatearFechaHora(
  fecha: string | Date | null | undefined
): string {
  return formatearFecha(fecha, "dd/MM/yyyy HH:mm");
}

/**
 * Formatea una fecha en formato largo (ej: "15 de enero de 2024")
 */
export function formatearFechaLarga(
  fecha: string | Date | null | undefined
): string {
  return formatearFecha(fecha, "dd 'de' MMMM 'de' yyyy");
}

/**
 * Calcula días restantes entre hoy y una fecha
 */
export function calcularDiasRestantes(
  fecha: string | Date | null | undefined
): number | null {
  if (!fecha) return null;

  try {
    const date = typeof fecha === "string" ? parseISO(fecha) : fecha;
    if (!isValid(date)) return null;
    return differenceInDays(date, new Date());
  } catch {
    return null;
  }
}

/**
 * Determina si una fecha está vencida
 */
export function estaVencido(fecha: string | Date | null | undefined): boolean {
  const dias = calcularDiasRestantes(fecha);
  return dias !== null && dias < 0;
}

/**
 * Determina el color de estado basado en días restantes
 * Lógica del backend:
 * - Verde: > 7 días
 * - Amarillo: 4-7 días
 * - Naranja: 1-3 días
 * - Rojo: vencido (< 0 días)
 * - Gris: sin fecha o completado
 */
export function obtenerColorEstado(
  diasRestantes: number | null,
  estado?: EstadoReporte
): ColorEstado {
  // Si está enviado, siempre verde
  if (estado === "ENVIADO") return "verde";

  // Si no hay fecha, gris
  if (diasRestantes === null) return "gris";

  // Según días restantes
  if (diasRestantes < 0) return "rojo";
  if (diasRestantes <= 3) return "naranja";
  if (diasRestantes <= 7) return "amarillo";
  return "verde";
}

/**
 * Obtiene la clase CSS de color según el estado
 */
export function obtenerClaseColor(color: ColorEstado): string {
  const colores: Record<ColorEstado, string> = {
    verde: "bg-green-100 text-green-800 border-green-300",
    amarillo: "bg-yellow-100 text-yellow-800 border-yellow-300",
    naranja: "bg-orange-100 text-orange-800 border-orange-300",
    rojo: "bg-red-100 text-red-800 border-red-300",
    gris: "bg-gray-100 text-gray-800 border-gray-300",
  };
  return colores[color] || colores.gris;
}

/**
 * Obtiene el color hex según el estado (para gráficos)
 */
export function obtenerColorHex(color: ColorEstado): string {
  const colores: Record<ColorEstado, string> = {
    verde: "#10b981",
    amarillo: "#f59e0b",
    naranja: "#f97316",
    rojo: "#ef4444",
    gris: "#6b7280",
  };
  return colores[color] || colores.gris;
}

/**
 * Formatea el texto del estado
 */
export function formatearEstado(estado: EstadoReporte): string {
  const estados: Record<EstadoReporte, string> = {
    PENDIENTE: "Pendiente",
    EN_PROGRESO: "En Progreso",
    ENVIADO: "Enviado",
    VENCIDO: "Vencido",
  };
  return estados[estado] || estado;
}

/**
 * Obtiene clase CSS del badge de estado
 */
export function obtenerClaseEstado(estado: EstadoReporte): string {
  const clases: Record<EstadoReporte, string> = {
    PENDIENTE: "bg-gray-100 text-gray-800",
    EN_PROGRESO: "bg-blue-100 text-blue-800",
    ENVIADO: "bg-green-100 text-green-800",
    VENCIDO: "bg-red-100 text-red-800",
  };
  return clases[estado] || "bg-gray-100 text-gray-800";
}

/**
 * Genera mensaje de urgencia basado en días restantes
 */
export function obtenerMensajeUrgencia(
  diasRestantes: number | null
): string | null {
  if (diasRestantes === null) return null;

  if (diasRestantes < 0) {
    const diasVencidos = Math.abs(diasRestantes);
    return `Vencido hace ${diasVencidos} día${diasVencidos !== 1 ? "s" : ""}`;
  }

  if (diasRestantes === 0) return "Vence HOY";
  if (diasRestantes === 1) return "Vence MAÑANA";
  if (diasRestantes <= 3) return `URGENTE: ${diasRestantes} días restantes`;
  if (diasRestantes <= 7) return `${diasRestantes} días restantes`;

  return `${diasRestantes} días restantes`;
}

/**
 * Determina si un reporte requiere atención urgente
 */
export function esUrgente(
  diasRestantes: number | null,
  estado?: EstadoReporte
): boolean {
  if (estado === "ENVIADO") return false;
  if (diasRestantes === null) return false;
  return diasRestantes <= 3;
}

/**
 * Formatea la frecuencia del reporte
 */
export function formatearFrecuencia(frecuencia: string): string {
  const frecuencias: Record<string, string> = {
    MENSUAL: "Mensual",
    TRIMESTRAL: "Trimestral",
    SEMESTRAL: "Semestral",
    ANUAL: "Anual",
  };
  return frecuencias[frecuencia] || frecuencia;
}

/**
 * Formatea el formato del reporte
 */
export function formatearFormato(formato: string): string {
  const formatos: Record<string, string> = {
    PDF: "PDF",
    EXCEL: "Excel",
    WORD: "Word",
    OTRO: "Otro",
  };
  return formatos[formato] || formato;
}

/**
 * Calcula el porcentaje de cumplimiento
 */
export function calcularPorcentajeCumplimiento(
  enviados: number,
  total: number
): number {
  if (total === 0) return 0;
  return Math.round((enviados / total) * 100);
}

/**
 * Formatea un nombre completo a partir de partes
 */
export function formatearNombreCompleto(
  firstName: string,
  middleName?: string,
  lastName?: string,
  secondLastName?: string
): string {
  const partes = [firstName, middleName, lastName, secondLastName].filter(
    Boolean
  );
  return partes.join(" ");
}

/**
 * Extrae iniciales de un nombre
 */
export function obtenerIniciales(nombre: string): string {
  const palabras = nombre.trim().split(" ").filter(Boolean);
  if (palabras.length === 0) return "?";
  if (palabras.length === 1) return palabras[0].substring(0, 2).toUpperCase();
  return (palabras[0][0] + palabras[palabras.length - 1][0]).toUpperCase();
}

/**
 * Valida si una cadena es un email válido
 */
export function esEmailValido(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Trunca un texto a una longitud máxima
 */
export function truncar(texto: string, maxLength: number): string {
  if (texto.length <= maxLength) return texto;
  return texto.substring(0, maxLength - 3) + "...";
}
