/**
 * Componente principal para listar reportes consolidados
 * Incluye filtros, paginación y vista en cards
 */

import { useState, useEffect } from "react";
import { useReportesConsolidados } from "../lib/hooks/useReportesConsolidados";
import ReporteConsolidadoCard from "./ReporteConsolidadoCard";
import type { EstadoReporte } from "../lib/types/reportes-consolidados";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  entidadesService,
  usuariosService,
  type EntidadResponse,
  type UsuarioResponse,
} from "../lib/services";

export default function ReportesConsolidadosList() {
  const {
    reportes,
    loading,
    error,
    page,
    totalPages,
    totalElements,
    isFirst,
    isLast,
    isEmpty,
    cambiarPagina,
    cambiarTamano,
    cambiarSort,
    filtrarPorEstado,
    filtrarPorEntidad,
    filtrarPorResponsable,
    limpiarFiltros,
    refrescar,
  } = useReportesConsolidados({
    autoLoad: true,
    initialSize: 12,
  });

  // Estados para filtros
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoReporte | "">("");
  const [entidadFiltro, setEntidadFiltro] = useState<number | "">("");
  const [responsableFiltro, setResponsableFiltro] = useState<string>("");
  const [ordenamiento, setOrdenamiento] = useState("proximoVencimiento,asc");

  // Datos para selectores
  const [entidades, setEntidades] = useState<EntidadResponse[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioResponse[]>([]);
  const [loadingFiltros, setLoadingFiltros] = useState(false);

  // Cargar datos para filtros
  useEffect(() => {
    const cargarDatosFiltros = async () => {
      setLoadingFiltros(true);
      try {
        const [entidadesData, usuariosData] = await Promise.all([
          entidadesService.activas(0, 100),
          usuariosService.listar(0, 100),
        ]);
        setEntidades(entidadesData.content);
        setUsuarios(usuariosData.content);
      } catch (err) {
        console.error("Error al cargar datos de filtros:", err);
      } finally {
        setLoadingFiltros(false);
      }
    };

    cargarDatosFiltros();
  }, []);

  // Aplicar filtros
  const handleAplicarFiltros = () => {
    if (estadoFiltro) {
      filtrarPorEstado(estadoFiltro);
    } else if (entidadFiltro) {
      filtrarPorEntidad(Number(entidadFiltro));
    } else if (responsableFiltro) {
      filtrarPorResponsable(responsableFiltro);
    } else {
      limpiarFiltros();
    }
  };

  // Limpiar filtros
  const handleLimpiarFiltros = () => {
    setEstadoFiltro("");
    setEntidadFiltro("");
    setResponsableFiltro("");
    limpiarFiltros();
  };

  // Cambiar ordenamiento
  const handleCambiarOrdenamiento = (nuevoOrden: string) => {
    setOrdenamiento(nuevoOrden);
    cambiarSort(nuevoOrden);
  };

  // Navegar a detalle
  const handleVerDetalle = (id: number) => {
    window.location.href = `/reportes/consolidados/${id}`;
  };

  return (
    <div className="space-y-6">
      {/* Header con título y botón de refrescar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Reportes Consolidados
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {totalElements} {totalElements === 1 ? "reporte" : "reportes"}{" "}
            encontrados
          </p>
        </div>
        <button
          onClick={refrescar}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refrescar
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Filtro por estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={estadoFiltro}
              onChange={(e) =>
                setEstadoFiltro(e.target.value as EstadoReporte | "")
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="EN_PROGRESO">En Progreso</option>
              <option value="ENVIADO">Enviado</option>
              <option value="VENCIDO">Vencido</option>
            </select>
          </div>

          {/* Filtro por entidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entidad
            </label>
            <select
              value={entidadFiltro}
              onChange={(e) =>
                setEntidadFiltro(e.target.value ? Number(e.target.value) : "")
              }
              disabled={loadingFiltros}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            >
              <option value="">Todas</option>
              {entidades.map((entidad) => (
                <option key={entidad.id} value={entidad.id}>
                  {entidad.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por responsable */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Responsable
            </label>
            <select
              value={responsableFiltro}
              onChange={(e) => setResponsableFiltro(e.target.value)}
              disabled={loadingFiltros}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            >
              <option value="">Todos</option>
              {usuarios.map((usuario) => (
                <option
                  key={usuario.documentNumber}
                  value={usuario.documentNumber}
                >
                  {usuario.firstName} {usuario.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Ordenamiento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ordenar por
            </label>
            <select
              value={ordenamiento}
              onChange={(e) => handleCambiarOrdenamiento(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="proximoVencimiento,asc">
                Vencimiento (próximo primero)
              </option>
              <option value="proximoVencimiento,desc">
                Vencimiento (lejano primero)
              </option>
              <option value="titulo,asc">Título (A-Z)</option>
              <option value="titulo,desc">Título (Z-A)</option>
              <option value="estadisticas.tasaCumplimiento,desc">
                Mayor cumplimiento
              </option>
              <option value="estadisticas.tasaCumplimiento,asc">
                Menor cumplimiento
              </option>
            </select>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleAplicarFiltros}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Aplicar Filtros
          </button>
          <button
            onClick={handleLimpiarFiltros}
            disabled={loading}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Estado de carga */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-3 text-gray-600">Cargando reportes...</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-red-900">
              Error al cargar reportes
            </h4>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Lista vacía */}
      {isEmpty && !loading && !error && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No se encontraron reportes
          </h3>
          <p className="text-gray-600">
            Intenta ajustar los filtros o limpiarlos para ver más resultados.
          </p>
        </div>
      )}

      {/* Grid de cards */}
      {!isEmpty && !loading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportes.map((reporte) => (
              <ReporteConsolidadoCard
                key={reporte.id}
                reporte={reporte}
                onClick={handleVerDetalle}
              />
            ))}
          </div>

          {/* Paginación */}
          <div className="flex items-center justify-between bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600">
              Página {page + 1} de {totalPages} ({totalElements}{" "}
              {totalElements === 1 ? "registro" : "registros"})
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => cambiarPagina(page - 1)}
                disabled={isFirst || loading}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i;
                  } else if (page < 3) {
                    pageNum = i;
                  } else if (page > totalPages - 3) {
                    pageNum = totalPages - 5 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => cambiarPagina(pageNum)}
                      disabled={loading}
                      className={`px-3 py-1 rounded-lg transition-colors ${
                        page === pageNum
                          ? "bg-blue-600 text-white"
                          : "border border-gray-300 hover:bg-gray-50"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => cambiarPagina(page + 1)}
                disabled={isLast || loading}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
