import api from '../api';
import type {
  OverrideSubmitRequest,
  AdminActionDetail,
  AdminActionSummary,
  AdminActionFilters,
  PaginatedResponse
} from '../types/admin';

/**
 * Servicio para acciones administrativas excepcionales
 */
class AdminActionsService {
  /**
   * Marcar un reporte como enviado (override)
   * @param periodoId ID del periodo
   * @param request Datos de la solicitud
   * @param files Archivos opcionales
   */
  async overrideSubmit(
    periodoId: string,
    request: OverrideSubmitRequest,
    files?: File[]
  ): Promise<AdminActionDetail> {
    const formData = new FormData();
    
    // Añadir datos JSON
    formData.append('request', new Blob([JSON.stringify(request)], {
      type: 'application/json'
    }));
    
    // Añadir archivos si existen
    if (files && files.length > 0) {
      files.forEach((file, index) => {
        formData.append(`files`, file);
      });
    }
    
    const response = await api.post<AdminActionDetail>(
      `/api/admin/reports/${periodoId}/override-submit`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data;
  }

  /**
   * Obtener acciones administrativas con filtros
   */
  async getActions(
    filters: AdminActionFilters,
    page: number = 0,
    size: number = 10
  ): Promise<PaginatedResponse<AdminActionSummary>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    
    if (filters.adminId) params.append('adminId', filters.adminId);
    if (filters.actionType) params.append('actionType', filters.actionType);
    if (filters.periodoId) params.append('periodoId', filters.periodoId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    
    const response = await api.get<PaginatedResponse<AdminActionSummary>>(
      `/api/admin/actions?${params.toString()}`
    );
    
    return response.data;
  }

  /**
   * Obtener detalle de una acción administrativa
   */
  async getActionDetail(actionId: string): Promise<AdminActionDetail> {
    const response = await api.get<AdminActionDetail>(
      `/api/admin/actions/${actionId}`
    );
    
    return response.data;
  }

  /**
   * Obtener acciones por periodo
   */
  async getActionsByPeriodo(periodoId: string): Promise<AdminActionSummary[]> {
    const response = await this.getActions({ periodoId }, 0, 100);
    return response.content;
  }
}

export default new AdminActionsService();
