import api from './api';

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface EntidadRequest {
  nombre: string;
  codigo: string;
  descripcion?: string;
  activo: boolean;
}

export interface EntidadResponse {
  id: number;
  nombre: string;
  codigo: string;
  descripcion?: string;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export interface ReporteRequest {
  titulo: string;
  descripcion?: string;
  entidadId: number;
  frecuencia: 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
  formato: 'PDF' | 'EXCEL' | 'WORD' | 'OTRO';
  resolucion?: string;
  responsableId: number;
  fechaVencimiento: string;
  estado?: 'PENDIENTE' | 'EN_PROGRESO' | 'ENVIADO';
}

export interface ReporteResponse {
  id: number;
  titulo: string;
  descripcion?: string;
  entidadId: number;
  entidadNombre: string;
  frecuencia: string;
  formato: string;
  resolucion?: string;
  responsableId: number;
  responsableNombre: string;
  fechaVencimiento: string;
  estado: string;
  fechaEnvio?: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface EvidenciaResponse {
  id: number;
  nombreArchivo: string;
  tipoArchivo: string;
  tamano: number;
  reporteId: number;
  subidoPorId: number;
  subidoPorNombre: string;
  creadoEn: string;
}

export interface DashboardResponse {
  totalReportes: number;
  reportesPendientes: number;
  reportesEnProgreso: number;
  reportesEnviados: number;
  reportesVencidos: number;
  tasaCumplimiento: number;
}

export interface UsuarioResponse {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  activo: boolean;
  roles: string[];
  creadoEn: string;
  actualizadoEn: string;
}

export const reportesService = {
  async listar(page = 0, size = 10, sort = 'fechaVencimiento,asc'): Promise<Page<ReporteResponse>> {
    const response = await api.get('/api/reportes', { params: { page, size, sort } });
    return response.data;
  },

  async obtener(id: number): Promise<ReporteResponse> {
    const response = await api.get(`/api/reportes/${id}`);
    return response.data;
  },

  async crear(data: ReporteRequest): Promise<ReporteResponse> {
    const response = await api.post('/api/reportes', data);
    return response.data;
  },

  async actualizar(id: number, data: ReporteRequest): Promise<ReporteResponse> {
    const response = await api.put(`/api/reportes/${id}`, data);
    return response.data;
  },

  async eliminar(id: number): Promise<{ mensaje: string }> {
    const response = await api.delete(`/api/reportes/${id}`);
    return response.data;
  },

  async cambiarEstado(id: number, estado: string): Promise<ReporteResponse> {
    const response = await api.patch(`/api/reportes/${id}/estado`, null, { params: { estado } });
    return response.data;
  },

  async porEstado(estado: string, page = 0, size = 10): Promise<Page<ReporteResponse>> {
    const response = await api.get(`/api/reportes/estado/${estado}`, { params: { page, size } });
    return response.data;
  },

  async porResponsable(responsableId: number, page = 0, size = 10): Promise<Page<ReporteResponse>> {
    const response = await api.get(`/api/reportes/responsable/${responsableId}`, { params: { page, size } });
    return response.data;
  },

  async vencidos(): Promise<ReporteResponse[]> {
    const response = await api.get('/api/reportes/vencidos');
    return response.data;
  },
};

export const entidadesService = {
  async listar(page = 0, size = 100, sort = 'nombre,asc'): Promise<Page<EntidadResponse>> {
    const response = await api.get('/api/entidades', { params: { page, size, sort } });
    return response.data;
  },

  async activas(page = 0, size = 100): Promise<Page<EntidadResponse>> {
    const response = await api.get('/api/entidades/activas', { params: { page, size } });
    return response.data;
  },

  async obtener(id: number): Promise<EntidadResponse> {
    const response = await api.get(`/api/entidades/${id}`);
    return response.data;
  },

  async crear(data: EntidadRequest): Promise<EntidadResponse> {
    const response = await api.post('/api/entidades', data);
    return response.data;
  },

  async actualizar(id: number, data: EntidadRequest): Promise<EntidadResponse> {
    const response = await api.put(`/api/entidades/${id}`, data);
    return response.data;
  },

  async eliminar(id: number): Promise<{ mensaje: string }> {
    const response = await api.delete(`/api/entidades/${id}`);
    return response.data;
  },
};

export const evidenciasService = {
  async subir(reporteId: number, file: File): Promise<EvidenciaResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/api/evidencias/reporte/${reporteId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async listarPorReporte(reporteId: number): Promise<EvidenciaResponse[]> {
    const response = await api.get(`/api/evidencias/reporte/${reporteId}`);
    return response.data;
  },

  async descargar(id: number) {
    const response = await api.get(`/api/evidencias/${id}/descargar`, { responseType: 'blob' });
    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    const disposition = response.headers['content-disposition'];
    const match = disposition?.match(/filename="(.+)"/);
    a.href = url;
    a.download = match?.[1] || `evidencia-${id}`;
    a.click();
    window.URL.revokeObjectURL(url);
  },

  async eliminar(id: number): Promise<{ mensaje: string }> {
    const response = await api.delete(`/api/evidencias/${id}`);
    return response.data;
  },
};

export const dashboardService = {
  async estadisticas(): Promise<DashboardResponse> {
    const response = await api.get('/api/dashboard/estadisticas');
    return response.data;
  },

  async cumplimiento(): Promise<number> {
    const response = await api.get('/api/dashboard/cumplimiento');
    return response.data;
  },
};

export const usuariosService = {
  async listar(page = 0, size = 100): Promise<Page<UsuarioResponse>> {
    const response = await api.get('/api/usuarios', { params: { page, size } });
    return response.data;
  },

  async obtener(id: number): Promise<UsuarioResponse> {
    const response = await api.get(`/api/usuarios/${id}`);
    return response.data;
  },
};
