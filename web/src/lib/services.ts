import api from "./api";

// Wrapper genérico para respuestas del backend
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  statusCode: number;
  timestamp: string;
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

export interface EntidadRequest {
  nit: string;
  nombre: string;
  paginaWeb: string;
  baseLegal: string;
  observaciones: string;
  estado: string;
}

export interface EntidadResponse {
  id: number;
  nit: string;
  nombre: string;
  paginaWeb: string;
  baseLegal: string;
  observaciones: string;
  estado: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface ReporteRequest {
  nombre: string;
  descripcion?: string;
  entidadId: string;
  frecuencia: "MENSUAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL";
  formatoRequerido: "PDF" | "EXCEL" | "WORD" | "OTRO";
  baseLegal?: string;
  fechaInicioVigencia?: string;
  fechaFinVigencia?: string;
  fechaVencimiento: string;
  plazoAdicionalDias?: number;
  linkInstrucciones?: string;
  responsableElaboracionId: string;
  responsableSupervisionId?: string;
  correosNotificacion?: string[];
  telefonoResponsable?: string;
  estado?: "PENDIENTE" | "EN_PROGRESO" | "ENVIADO";
}

export interface ReporteResponse {
  reporteId: string;
  nombre: string;
  descripcion?: string;
  entidadId: string;
  entidadNombre: string;
  frecuencia: string;
  formatoRequerido: string;
  baseLegal?: string;
  fechaInicioVigencia?: string;
  fechaFinVigencia?: string;
  fechaVencimiento: string;
  plazoAdicionalDias?: number;
  linkInstrucciones?: string;
  responsableElaboracionId: string;
  responsableElaboracionNombre: string;
  responsableSupervisionId?: string;
  responsableSupervisionNombre?: string;
  correosNotificacion?: string[];
  telefonoResponsable?: string;
  estado: string;
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
  usuarioId: string;
  documentNumber: string;
  documentType: string;
  email: string;
  firstName: string;
  secondName?: string;
  firstLastname: string;
  secondLastname?: string;
  birthDate: string;
  roles: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UsuarioRequest {
  documentNumber: string;
  documentType: string;
  email: string;
  firstName: string;
  secondName?: string;
  firstLastname: string;
  secondLastname?: string;
  password?: string;
  birthDate: string;
  roles: string[];
}

export const reportesService = {
  async listar(
    page = 0,
    size = 10,
    sort = "fechaVencimiento,asc"
  ): Promise<Page<ReporteResponse>> {
    const response = await api.get("/api/reportes", {
      params: { page, size, sort },
    });
    // Verificar si la respuesta tiene el formato { success, data }
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  async obtener(id: string): Promise<ReporteResponse> {
    const response = await api.get(`/api/reportes/${id}`);
    // Verificar si la respuesta tiene el formato { success, data }
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  async crear(data: ReporteRequest): Promise<ReporteResponse> {
    const response = await api.post("/api/reportes", data);
    // Verificar si la respuesta tiene el formato { success, data }
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  async actualizar(id: string, data: ReporteRequest): Promise<ReporteResponse> {
    const response = await api.put(`/api/reportes/${id}`, data);
    // Verificar si la respuesta tiene el formato { success, data }
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  async eliminar(id: string): Promise<{ mensaje: string }> {
    const response = await api.delete(`/api/reportes/${id}`);
    // Verificar si la respuesta tiene el formato { success, data }
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  async cambiarEstado(id: string, estado: string): Promise<ReporteResponse> {
    const response = await api.patch(`/api/reportes/${id}/estado`, null, {
      params: { estado },
    });
    // Verificar si la respuesta tiene el formato { success, data }
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  async porEstado(
    estado: string,
    page = 0,
    size = 10
  ): Promise<Page<ReporteResponse>> {
    const response = await api.get(`/api/reportes/estado/${estado}`, {
      params: { page, size },
    });
    // Verificar si la respuesta tiene el formato { success, data }
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  async porResponsable(
    responsableId: string,
    page = 0,
    size = 10
  ): Promise<Page<ReporteResponse>> {
    const response = await api.get(
      `/api/reportes/responsable/${responsableId}`,
      { params: { page, size } }
    );
    // Verificar si la respuesta tiene el formato { success, data }
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  async vencidos(): Promise<ReporteResponse[]> {
    const response = await api.get("/api/reportes/vencidos");
    // Verificar si la respuesta tiene el formato { success, data }
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },
};

export const entidadesService = {
  async listar(
    page = 0,
    size = 100,
    sort = "nombre,asc"
  ): Promise<Page<EntidadResponse>> {
    const response = await api.get("/api/entidades", {
      params: { page, size, sort },
    });
    // Verificar si la respuesta tiene el formato { success, data }
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  async activas(page = 0, size = 100): Promise<Page<EntidadResponse>> {
    const response = await api.get("/api/entidades/activas", {
      params: { page, size },
    });
    // Verificar si la respuesta tiene el formato { success, data }
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  async obtener(id: number): Promise<EntidadResponse> {
    const response = await api.get(`/api/entidades/${id}`);
    // Verificar si la respuesta tiene el formato { success, data }
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  async crear(data: EntidadRequest): Promise<EntidadResponse> {
    const response = await api.post("/api/entidades", data);
    // Verificar si la respuesta tiene el formato { success, data }
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  async actualizar(id: number, data: EntidadRequest): Promise<EntidadResponse> {
    const response = await api.put(`/api/entidades/${id}`, data);
    // Verificar si la respuesta tiene el formato { success, data }
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  async eliminar(id: number): Promise<{ mensaje: string }> {
    const response = await api.delete(`/api/entidades/${id}`);
    // Verificar si la respuesta tiene el formato { success, data }
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },
};

export const evidenciasService = {
  async subir(reporteId: number, file: File): Promise<EvidenciaResponse> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(
      `/api/evidencias/reporte/${reporteId}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return response.data;
  },

  async listarPorReporte(reporteId: number): Promise<EvidenciaResponse[]> {
    const response = await api.get(`/api/evidencias/reporte/${reporteId}`);
    return response.data;
  },

  async descargar(id: number) {
    const response = await api.get(`/api/evidencias/${id}/descargar`, {
      responseType: "blob",
    });
    const blob = new Blob([response.data], {
      type: response.headers["content-type"],
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    const disposition = response.headers["content-disposition"];
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
  async estadisticas(rango?: string): Promise<DashboardResponse> {
    const params = rango ? { rango } : undefined;
    const response = await api.get(
      "/api/dashboard/estadisticas",
      params ? { params } : undefined
    );
    return response.data;
  },

  async cumplimiento(): Promise<number> {
    const response = await api.get("/api/dashboard/cumplimiento");
    return response.data;
  },
};

export const usuariosService = {
  async listar(page = 0, size = 100): Promise<Page<UsuarioResponse>> {
    const response = await api.get("/api/usuarios", {
      params: { page, size, sort: "firstName,asc" },
    });
    // Verificar si la respuesta tiene el formato { success, data }
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  async obtener(documentNumber: string): Promise<UsuarioResponse> {
    const response = await api.get(`/api/usuarios/${documentNumber}`);
    // Verificar si la respuesta tiene el formato { success, data }
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  async crear(data: UsuarioRequest): Promise<UsuarioResponse> {
    const response = await api.post("/api/auth/registro", data);
    // Verificar si la respuesta tiene el formato { success, data }
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  async actualizar(
    documentNumber: string,
    data: UsuarioRequest
  ): Promise<UsuarioResponse> {
    const response = await api.put(`/api/usuarios/${documentNumber}`, data);
    // Verificar si la respuesta tiene el formato { success, data }
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },

  async eliminar(documentNumber: string): Promise<void> {
    const response = await api.delete(`/api/usuarios/${documentNumber}`);
    // Verificar si la respuesta tiene el formato { success, data }
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data;
    }
    return response.data;
  },
};
