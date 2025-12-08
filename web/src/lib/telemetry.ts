// Sistema de logging y telemetría frontend
// Registra acciones críticas del usuario para auditoría y análisis

interface LogEntry {
  action: string;
  timestamp: string;
  userId?: string;
  metadata?: Record<string, any>;
}

const LOG_STORAGE_KEY = "app_telemetry_logs";
const MAX_LOGS = 100;

export function logAction(action: string, metadata?: Record<string, any>): void {
  try {
    const entry: LogEntry = {
      action,
      timestamp: new Date().toISOString(),
      userId: getCurrentUserId(),
      metadata,
    };

    // Obtener logs existentes
    const existingLogs = getLogs();
    
    // Agregar nuevo log al inicio
    existingLogs.unshift(entry);
    
    // Mantener solo los últimos MAX_LOGS
    const trimmedLogs = existingLogs.slice(0, MAX_LOGS);
    
    // Guardar en localStorage
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(trimmedLogs));
    
    // Log en consola en desarrollo
    if (process.env.NODE_ENV === "development") {
      console.log("[Telemetry]", action, metadata);
    }
  } catch (error) {
    console.error("[Telemetry] Error logging action:", error);
  }
}

export function getLogs(): LogEntry[] {
  try {
    const logsStr = localStorage.getItem(LOG_STORAGE_KEY);
    return logsStr ? JSON.parse(logsStr) : [];
  } catch (error) {
    console.error("[Telemetry] Error reading logs:", error);
    return [];
  }
}

export function clearLogs(): void {
  localStorage.removeItem(LOG_STORAGE_KEY);
}

function getCurrentUserId(): string | undefined {
  try {
    const usuarioStr = localStorage.getItem("usuario");
    if (usuarioStr) {
      const usuario = JSON.parse(usuarioStr);
      return usuario.usuarioId || usuario.id;
    }
  } catch (error) {
    console.error("[Telemetry] Error getting user ID:", error);
  }
  return undefined;
}

// Acciones predefinidas para auditoría
export const TelemetryActions = {
  REPORTE_ENVIADO: "reporte_enviado",
  REPORTE_APROBADO: "reporte_aprobado",
  REPORTE_RECHAZADO: "reporte_rechazado",
  REPORTE_CORRECCION_SOLICITADA: "reporte_correccion_solicitada",
  ARCHIVO_SUBIDO: "archivo_subido",
  ARCHIVO_VISUALIZADO: "archivo_visualizado",
  ARCHIVO_DESCARGADO: "archivo_descargado",
  COMENTARIO_AGREGADO: "comentario_agregado",
} as const;
