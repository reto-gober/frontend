import api from '../api';
import type {
  AdminCumplimientoDTO,
  FiltrosCumplimientoDTO
} from '../types/admin';

/**
 * Servicio para el módulo de cumplimiento administrativo
 */
class AdminCumplimientoService {
  /**
   * Obtener dashboard de cumplimiento para admin
   */
  async getCumplimiento(filtros?: FiltrosCumplimientoDTO): Promise<AdminCumplimientoDTO> {
    const params = new URLSearchParams();
    
    if (filtros?.entidadId) params.append('entidadId', filtros.entidadId);
    if (filtros?.responsableId) params.append('responsableId', filtros.responsableId);
    if (filtros?.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
    if (filtros?.fechaFin) params.append('fechaFin', filtros.fechaFin);
    
    const queryString = params.toString();
    const url = queryString 
      ? `/api/admin/cumplimiento?${queryString}`
      : '/api/admin/cumplimiento';
    
    const response = await api.get<AdminCumplimientoDTO>(url);
    return response.data;
  }
}

export default new AdminCumplimientoService();
