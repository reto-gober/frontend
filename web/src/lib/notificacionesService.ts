import api from './api';

export type NotificacionTipo = 'critica' | 'advertencia' | 'informativa' | 'exito' | 'info';

export interface NotificacionDTO {
  notificacionId: string;
  usuarioId?: string;
  periodoId?: string;
  titulo?: string;
  tipo?: NotificacionTipo;
  canal?: string;
  mensaje?: string;
  fechaProgramada?: string;
  fechaEnviado?: string;
  leido?: boolean;
  intentosEnvio?: number;
  metadata?: Record<string, any> | null;
  reporteNombre?: string;
  entidadNombre?: string;
}

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

interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode?: number;
  success?: boolean;
}

const notificacionesService = {
  async listar(page = 0, size = 20): Promise<Page<NotificacionDTO>> {
    const { data } = await api.get<ApiResponse<Page<NotificacionDTO>>>(
      '/api/notificaciones',
      { params: { page, size } }
    );
    return (data as any).data ?? (data as any); // compatibilidad con/ sin envoltorio ApiResponse
  },

  async contador(): Promise<number> {
    const { data } = await api.get<ApiResponse<number>>('/api/notificaciones/contador');
    return (data as any).data ?? (data as any);
  },

  async marcarLeida(notificacionId: string): Promise<void> {
    await api.post(`/api/notificaciones/${notificacionId}/leer`);
  },

  async marcarTodas(): Promise<void> {
    await api.post('/api/notificaciones/leer-todas');
  },
};

export default notificacionesService;
