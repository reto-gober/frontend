/**
 * Servicio para consumir el endpoint de Reportes Consolidados
 * Endpoint base: /api/reportes/consolidados
 */

import api from "../api";
import type {
  ReportesConsolidadosResponse,
  ReporteConsolidadoResponse,
  ReporteConsolidado,
  Page,
  FiltrosReportesConsolidados,
  EstadoReporte,
} from "../types/reportes-consolidados";

export const reportesConsolidadosService = {
  /**
   * Lista todos los reportes consolidados con paginación
   * GET /api/reportes/consolidados
   *
   * @param page - Número de página (0-indexed)
   * @param size - Tamaño de página
   * @param sort - Criterio de ordenamiento (ej: 'proximoVencimiento,asc')
   * @returns Promise con la respuesta paginada
   */
  async listar(
    page = 0,
    size = 10,
    sort = "proximoVencimiento,asc"
  ): Promise<Page<ReporteConsolidado>> {
    try {
      const response = await api.get<ReportesConsolidadosResponse>(
        "/api/reportes/consolidados",
        {
          params: { page, size, sort },
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
      // Fallback para respuestas directas
      return response.data as any;
    } catch (error: any) {
      console.error("Error al listar reportes consolidados:", error);
      throw error;
    }
  },

  /**
   * Obtiene un reporte consolidado por ID
   * GET /api/reportes/consolidados/{id}
   *
   * @param id - ID del reporte consolidado
   * @returns Promise con el reporte consolidado
   */
  async obtenerPorId(id: number): Promise<ReporteConsolidado> {
    try {
      const response = await api.get<ReporteConsolidadoResponse>(
        `/api/reportes/consolidados/${id}`
      );
      // Verificar si la respuesta tiene el formato { success, data }
      if (
        response.data &&
        typeof response.data === "object" &&
        "data" in response.data
      ) {
        return response.data.data;
      }
      // Fallback para respuestas directas
      return response.data as any;
    } catch (error: any) {
      console.error(`Error al obtener reporte ${id}:`, error);
      throw error;
    }
  },

  /**
   * Filtra reportes consolidados por estado
   * GET /api/reportes/consolidados/estado/{estado}
   *
   * @param estado - Estado del reporte (PENDIENTE, EN_PROGRESO, ENVIADO, VENCIDO)
   * @param page - Número de página
   * @param size - Tamaño de página
   * @param sort - Criterio de ordenamiento
   * @returns Promise con la respuesta paginada filtrada
   */
  async filtrarPorEstado(
    estado: EstadoReporte,
    page = 0,
    size = 10,
    sort = "proximoVencimiento,asc"
  ): Promise<Page<ReporteConsolidado>> {
    try {
      const response = await api.get<ReportesConsolidadosResponse>(
        "/api/reportes/consolidados",
        {
          params: { estado, page, size, sort },
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
      // Fallback para respuestas directas
      return response.data as any;
    } catch (error: any) {
      console.error(`Error al filtrar reportes por estado ${estado}:`, error);
      throw error;
    }
  },

  /**
   * Filtra reportes consolidados por entidad
   * GET /api/reportes/consolidados/entidad/{entidadId}
   *
   * @param entidadId - ID de la entidad
   * @param page - Número de página
   * @param size - Tamaño de página
   * @param sort - Criterio de ordenamiento
   * @returns Promise con la respuesta paginada filtrada
   */
  async filtrarPorEntidad(
    entidadId: number,
    page = 0,
    size = 10,
    sort = "proximoVencimiento,asc"
  ): Promise<Page<ReporteConsolidado>> {
    try {
      const response = await api.get<ReportesConsolidadosResponse>(
        `/api/reportes/consolidados/entidad/${entidadId}`,
        {
          params: { page, size, sort },
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
      // Fallback para respuestas directas
      return response.data as any;
    } catch (error: any) {
      console.error(`Error al filtrar por entidad ${entidadId}:`, error);
      throw error;
    }
  },

  /**
   * Filtra reportes consolidados por responsable
   * GET /api/reportes/consolidados/responsable/{responsableId}
   *
   * @param responsableId - ID del responsable (documento)
   * @param page - Número de página
   * @param size - Tamaño de página
   * @param sort - Criterio de ordenamiento
   * @returns Promise con la respuesta paginada filtrada
   */
  async filtrarPorResponsable(
    responsableId: string,
    page = 0,
    size = 10,
    sort = "proximoVencimiento,asc"
  ): Promise<Page<ReporteConsolidado>> {
    try {
      const response = await api.get<ReportesConsolidadosResponse>(
        `/api/reportes/consolidados/responsable/${responsableId}`,
        {
          params: { page, size, sort },
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
      // Fallback para respuestas directas
      return response.data as any;
    } catch (error: any) {
      console.error(
        `Error al filtrar por responsable ${responsableId}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Filtra reportes consolidados con múltiples criterios
   * Método helper que centraliza la lógica de filtrado
   *
   * @param filtros - Objeto con los filtros a aplicar
   * @returns Promise con la respuesta paginada filtrada
   */
  async filtrar(
    filtros: FiltrosReportesConsolidados
  ): Promise<Page<ReporteConsolidado>> {
    const {
      page = 0,
      size = 10,
      sort = "proximoVencimiento,asc",
      estado,
      entidadId,
      responsableId,
    } = filtros;

    // Priorizar filtros específicos
    if (estado) {
      return this.filtrarPorEstado(estado, page, size, sort);
    }

    if (entidadId) {
      return this.filtrarPorEntidad(entidadId, page, size, sort);
    }

    if (responsableId) {
      return this.filtrarPorResponsable(responsableId, page, size, sort);
    }

    // Sin filtros específicos, listar todos
    return this.listar(page, size, sort);
  },

  /**
   * Obtiene reportes consolidados urgentes (vencen en <= 3 días o vencidos)
   * Usa el filtro del backend y ordenamiento por proximidad
  async obtenerUrgentes(
    page = 0,
    size = 20
  ): Promise<Page<ReporteConsolidado>> {
    try {
      // Ordenar por días restantes ascendente para ver los más urgentes primero
      const response = await api.get<ReportesConsolidadosResponse>(
        "/api/reportes/consolidados",
        {
          params: {
            page,
            size,
            sort: "proximoVencimiento,asc",
          },
        }
      );

      // Verificar si la respuesta tiene el formato { success, data }
      let data;
      if (response.data && typeof response.data === 'object' && 'data' in response.data) {
        data = response.data.data;
      } else {
        data = response.data as any;
      }

      // Filtrar en el cliente para obtener solo urgentes (diasRestantes <= 3)
      const urgentes = data.content.filter(
        (reporte) =>
          reporte.diasRestantes !== null &&
          reporte.diasRestantes <= 3 &&
          reporte.estadoGeneral !== "ENVIADO"
      );

      return {
        ...data,
        content: urgentes,
        totalElements: urgentes.length,
      };
    } catch (error: any) {
      console.error("Error al obtener reportes urgentes:", error);
      throw error;
    }
  },  };
    } catch (error: any) {
      console.error("Error al obtener reportes urgentes:", error);
      throw error;
    }
  },

  /**
   * Obtiene estadísticas generales de reportes consolidados
   * Calcula métricas agregadas desde la lista completa
   *
   * @returns Promise con estadísticas agregadas
   */
  async obtenerEstadisticas(): Promise<{
    total: number;
    pendientes: number;
    enProgreso: number;
    enviados: number;
    vencidos: number;
    urgentes: number;
    tasaCumplimiento: number;
  }> {
    try {
      // Obtener todos los reportes (primera página con tamaño grande)
      const response = await this.listar(0, 1000);
      const reportes = response.content;

      const estadisticas = {
        total: reportes.length,
        pendientes: reportes.filter((r) => r.estadoGeneral === "PENDIENTE")
          .length,
        enProgreso: reportes.filter((r) => r.estadoGeneral === "EN_PROGRESO")
          .length,
        enviados: reportes.filter((r) => r.estadoGeneral === "ENVIADO").length,
        vencidos: reportes.filter((r) => r.estadoGeneral === "VENCIDO").length,
        urgentes: reportes.filter(
          (r) =>
            r.diasRestantes !== null &&
            r.diasRestantes <= 3 &&
            r.estadoGeneral !== "ENVIADO"
        ).length,
        tasaCumplimiento: 0,
      };

      // Calcular tasa de cumplimiento promedio
      if (reportes.length > 0) {
        const sumaTC = reportes.reduce(
          (sum, r) => sum + r.estadisticas.tasaCumplimiento,
          0
        );
        estadisticas.tasaCumplimiento = Math.round(sumaTC / reportes.length);
      }

      return estadisticas;
    } catch (error: any) {
      console.error("Error al obtener estadísticas:", error);
      throw error;
    }
  },
};

export default reportesConsolidadosService;
