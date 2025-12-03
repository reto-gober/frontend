/**
 * Hook personalizado para manejar reportes consolidados
 * Gestiona carga, paginación, filtrado y estado de reportes consolidados
 */

import { useState, useEffect, useCallback } from "react";
import reportesConsolidadosService from "../services/reportes-consolidados.service";
import type {
  ReporteConsolidado,
  FiltrosReportesConsolidados,
  EstadoReporte,
} from "../types/reportes-consolidados";

interface UseReportesConsolidadosOptions {
  autoLoad?: boolean;
  initialPage?: number;
  initialSize?: number;
  initialSort?: string;
  initialFiltros?: Partial<FiltrosReportesConsolidados>;
}

interface UseReportesConsolidadosReturn {
  // Estado
  reportes: ReporteConsolidado[];
  loading: boolean;
  error: string | null;

  // Paginación
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  isFirst: boolean;
  isLast: boolean;
  isEmpty: boolean;

  // Filtros
  filtros: FiltrosReportesConsolidados;
  sort: string;

  // Acciones
  cargar: () => Promise<void>;
  refrescar: () => Promise<void>;
  cambiarPagina: (newPage: number) => void;
  cambiarTamano: (newSize: number) => void;
  cambiarSort: (newSort: string) => void;
  aplicarFiltros: (newFiltros: Partial<FiltrosReportesConsolidados>) => void;
  limpiarFiltros: () => void;
  filtrarPorEstado: (estado: EstadoReporte | null) => void;
  filtrarPorEntidad: (entidadId: number | null) => void;
  filtrarPorResponsable: (responsableId: string | null) => void;
}

/**
 * Hook para gestionar reportes consolidados
 */
export function useReportesConsolidados(
  options: UseReportesConsolidadosOptions = {}
): UseReportesConsolidadosReturn {
  const {
    autoLoad = true,
    initialPage = 0,
    initialSize = 10,
    initialSort = "proximoVencimiento,asc",
    initialFiltros = {},
  } = options;

  // Estado de datos
  const [reportes, setReportes] = useState<ReporteConsolidado[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado de paginación
  const [page, setPage] = useState(initialPage);
  const [size, setSize] = useState(initialSize);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isFirst, setIsFirst] = useState(true);
  const [isLast, setIsLast] = useState(true);
  const [isEmpty, setIsEmpty] = useState(true);

  // Estado de filtros
  const [sort, setSort] = useState(initialSort);
  const [filtros, setFiltros] = useState<FiltrosReportesConsolidados>({
    page: initialPage,
    size: initialSize,
    sort: initialSort,
    ...initialFiltros,
  });

  /**
   * Función para cargar reportes
   */
  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await reportesConsolidadosService.filtrar({
        ...filtros,
        page,
        size,
        sort,
      });

      setReportes(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setIsFirst(response.first);
      setIsLast(response.last);
      setIsEmpty(response.empty);
    } catch (err: any) {
      const mensaje =
        err.response?.data?.mensaje ||
        err.message ||
        "Error al cargar reportes consolidados";
      setError(mensaje);
      console.error("Error en useReportesConsolidados:", err);

      // Si es error 401, el interceptor ya redirige a login
      // Limpiar datos en caso de error
      setReportes([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [filtros, page, size, sort]);

  /**
   * Función para refrescar (recargar desde página actual)
   */
  const refrescar = useCallback(async () => {
    await cargar();
  }, [cargar]);

  /**
   * Cambiar página
   */
  const cambiarPagina = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  /**
   * Cambiar tamaño de página
   */
  const cambiarTamano = useCallback((newSize: number) => {
    setSize(newSize);
    setPage(0); // Reset a primera página al cambiar tamaño
  }, []);

  /**
   * Cambiar ordenamiento
   */
  const cambiarSort = useCallback((newSort: string) => {
    setSort(newSort);
    setPage(0); // Reset a primera página al cambiar orden
  }, []);

  /**
   * Aplicar filtros
   */
  const aplicarFiltros = useCallback(
    (newFiltros: Partial<FiltrosReportesConsolidados>) => {
      setFiltros((prev) => ({ ...prev, ...newFiltros }));
      setPage(0); // Reset a primera página al aplicar filtros
    },
    []
  );

  /**
   * Limpiar todos los filtros
   */
  const limpiarFiltros = useCallback(() => {
    setFiltros({
      page: 0,
      size,
      sort,
    });
    setPage(0);
  }, [size, sort]);

  /**
   * Filtrar por estado
   */
  const filtrarPorEstado = useCallback((estado: EstadoReporte | null) => {
    setFiltros((prev) => ({
      ...prev,
      estado: estado || undefined,
      entidadId: undefined,
      responsableId: undefined,
    }));
    setPage(0);
  }, []);

  /**
   * Filtrar por entidad
   */
  const filtrarPorEntidad = useCallback((entidadId: number | null) => {
    setFiltros((prev) => ({
      ...prev,
      entidadId: entidadId || undefined,
      estado: undefined,
      responsableId: undefined,
    }));
    setPage(0);
  }, []);

  /**
   * Filtrar por responsable
   */
  const filtrarPorResponsable = useCallback((responsableId: string | null) => {
    setFiltros((prev) => ({
      ...prev,
      responsableId: responsableId || undefined,
      estado: undefined,
      entidadId: undefined,
    }));
    setPage(0);
  }, []);

  /**
   * Auto-cargar al montar o cuando cambien dependencias
   */
  useEffect(() => {
    if (autoLoad) {
      cargar();
    }
  }, [autoLoad, cargar]);

  return {
    // Estado
    reportes,
    loading,
    error,

    // Paginación
    page,
    size,
    totalPages,
    totalElements,
    isFirst,
    isLast,
    isEmpty,

    // Filtros
    filtros,
    sort,

    // Acciones
    cargar,
    refrescar,
    cambiarPagina,
    cambiarTamano,
    cambiarSort,
    aplicarFiltros,
    limpiarFiltros,
    filtrarPorEstado,
    filtrarPorEntidad,
    filtrarPorResponsable,
  };
}

/**
 * Hook simplificado para obtener un reporte consolidado por ID
 */
export function useReporteConsolidado(id: number | null) {
  const [reporte, setReporte] = useState<ReporteConsolidado | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!id) {
      setReporte(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await reportesConsolidadosService.obtenerPorId(id);
      setReporte(data);
    } catch (err: any) {
      const mensaje =
        err.response?.data?.mensaje ||
        err.message ||
        "Error al cargar el reporte consolidado";
      setError(mensaje);
      console.error("Error en useReporteConsolidado:", err);
      setReporte(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const refrescar = useCallback(async () => {
    await cargar();
  }, [cargar]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { reporte, loading, error, refrescar };
}

/**
 * Hook para obtener estadísticas de reportes consolidados
 */
export function useEstadisticasConsolidadas() {
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    pendientes: 0,
    enProgreso: 0,
    enviados: 0,
    vencidos: 0,
    urgentes: 0,
    tasaCumplimiento: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await reportesConsolidadosService.obtenerEstadisticas();
      setEstadisticas(data);
    } catch (err: any) {
      const mensaje =
        err.response?.data?.mensaje ||
        err.message ||
        "Error al cargar estadísticas";
      setError(mensaje);
      console.error("Error en useEstadisticasConsolidadas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { estadisticas, loading, error, refrescar: cargar };
}
