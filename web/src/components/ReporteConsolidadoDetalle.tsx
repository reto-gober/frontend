/**
 * Componente para visualizar el detalle completo de un reporte consolidado
 * Incluye información de entidad, responsables, contactos, períodos y estadísticas
 */

import { useReporteConsolidado } from "../lib/hooks/useReportesConsolidados";
import type { PeriodoReporte } from "../lib/types/reportes-consolidados";
import {
  formatearFecha,
  formatearFechaLarga,
  formatearEstado,
  obtenerClaseColor,
  obtenerClaseEstado,
  obtenerMensajeUrgencia,
  formatearFrecuencia,
  formatearFormato,
  obtenerIniciales,
  esUrgente,
} from "../lib/utils/reportes-utils";
import {
  Building2,
  Users,
  Calendar,
  Clock,
  FileText,
  TrendingUp,
  AlertCircle,
  Mail,
  Phone,
  Briefcase,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface ReporteConsolidadoDetalleProps {
  id: number;
}

export default function ReporteConsolidadoDetalle({
  id,
}: ReporteConsolidadoDetalleProps) {
  const { reporte, loading, error, refrescar } = useReporteConsolidado(id);

  const handleVolver = () => {
    window.location.href = "/reportes/consolidados";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-3 text-gray-600">
          Cargando detalle del reporte...
        </span>
      </div>
    );
  }

  if (error || !reporte) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-red-900">
              Error al cargar el reporte
            </h4>
            <p className="text-sm text-red-700 mt-1">
              {error || "Reporte no encontrado"}
            </p>
            <button
              onClick={handleVolver}
              className="mt-3 text-sm text-red-700 underline hover:text-red-900"
            >
              Volver a la lista
            </button>
          </div>
        </div>
      </div>
    );
  }

  const urgente = esUrgente(reporte.diasRestantes, reporte.estadoGeneral);
  const mensajeUrgencia = obtenerMensajeUrgencia(reporte.diasRestantes);
  const colorClass = obtenerClaseColor(reporte.colorEstado);
  const estadoClass = obtenerClaseEstado(reporte.estadoGeneral);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <button
          onClick={handleVolver}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la lista
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">
              {reporte.titulo}
            </h1>
            {reporte.descripcion && (
              <p className="text-gray-600 mt-2">{reporte.descripcion}</p>
            )}
          </div>
          <span
            className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${estadoClass}`}
          >
            {formatearEstado(reporte.estadoGeneral)}
          </span>
        </div>

        {/* Alerta de urgencia */}
        {urgente && mensajeUrgencia && (
          <div
            className={`mt-4 flex items-center gap-2 px-4 py-3 rounded-lg ${colorClass}`}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-semibold">{mensajeUrgencia}</span>
          </div>
        )}
      </div>

      {/* Grid de información principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna 1: Información básica */}
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Información del Reporte
          </h2>

          <div className="space-y-3 text-sm">
            <div>
              <span className="text-gray-500">Frecuencia:</span>
              <span className="ml-2 font-medium text-gray-900">
                {formatearFrecuencia(reporte.frecuencia)}
              </span>
            </div>

            <div>
              <span className="text-gray-500">Formato:</span>
              <span className="ml-2 font-medium text-gray-900">
                {formatearFormato(reporte.formato)}
              </span>
            </div>

            {reporte.resolucion && (
              <div>
                <span className="text-gray-500">Resolución:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {reporte.resolucion}
                </span>
              </div>
            )}

            <div>
              <span className="text-gray-500">Próximo vencimiento:</span>
              <div className="mt-1">
                {reporte.proximoVencimiento ? (
                  <>
                    <div className="font-medium text-gray-900">
                      {formatearFechaLarga(reporte.proximoVencimiento)}
                    </div>
                    {mensajeUrgencia && (
                      <div
                        className={`mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${colorClass}`}
                      >
                        <Clock className="w-3 h-3" />
                        {mensajeUrgencia}
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-gray-400">Sin fecha definida</span>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <span className="text-gray-500">Creado:</span>
              <span className="ml-2 text-gray-900">
                {formatearFecha(reporte.creadoEn)}
              </span>
            </div>

            <div>
              <span className="text-gray-500">Actualizado:</span>
              <span className="ml-2 text-gray-900">
                {formatearFecha(reporte.actualizadoEn)}
              </span>
            </div>
          </div>
        </div>

        {/* Columna 2: Entidad y responsables */}
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Entidad */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <Building2 className="w-5 h-5" />
              Entidad
            </h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="font-medium text-gray-900">
                {reporte.entidad.nombre}
              </div>
              {reporte.entidad.codigo && (
                <div className="text-sm text-gray-600 mt-1">
                  Código: {reporte.entidad.codigo}
                </div>
              )}
            </div>
          </div>

          {/* Responsables */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <Users className="w-5 h-5" />
              Responsables ({reporte.responsables?.length || 0})
            </h2>
            {reporte.responsables && reporte.responsables.length > 0 ? (
              <div className="space-y-2">
                {reporte.responsables.map((responsable) => (
                  <div
                    key={responsable.id}
                    className="flex items-center gap-3 bg-gray-50 rounded-lg p-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold flex-shrink-0">
                      {obtenerIniciales(responsable.nombre)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {responsable.nombre}
                      </div>
                      <div className="text-xs text-gray-600 truncate">
                        {responsable.email}
                      </div>
                      <div className="text-xs text-gray-500">
                        Doc: {responsable.documentNumber}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No hay responsables asignados
              </p>
            )}
          </div>

          {/* Contactos */}
          {reporte.contactos && reporte.contactos.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <Briefcase className="w-5 h-5" />
                Contactos ({reporte.contactos.length})
              </h2>
              <div className="space-y-2">
                {reporte.contactos.map((contacto, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-3 text-sm"
                  >
                    <div className="font-medium text-gray-900">
                      {contacto.nombre}
                    </div>
                    {contacto.cargo && (
                      <div className="text-gray-600 mt-1">{contacto.cargo}</div>
                    )}
                    {contacto.email && (
                      <div className="flex items-center gap-1 text-gray-600 mt-1">
                        <Mail className="w-3 h-3" />
                        <a
                          href={`mailto:${contacto.email}`}
                          className="hover:text-blue-600"
                        >
                          {contacto.email}
                        </a>
                      </div>
                    )}
                    {contacto.telefono && (
                      <div className="flex items-center gap-1 text-gray-600 mt-1">
                        <Phone className="w-3 h-3" />
                        <a
                          href={`tel:${contacto.telefono}`}
                          className="hover:text-blue-600"
                        >
                          {contacto.telefono}
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Columna 3: Estadísticas */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5" />
            Estadísticas
          </h2>

          <div className="space-y-4">
            {/* Métricas principales */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {reporte.estadisticas.totalPeriodos}
                </div>
                <div className="text-sm text-gray-600 mt-1">Total Períodos</div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-600">
                  {reporte.estadisticas.tasaCumplimiento}%
                </div>
                <div className="text-sm text-gray-600 mt-1">Cumplimiento</div>
              </div>
            </div>

            {/* Desglose por estado */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Pendientes</span>
                <span className="font-semibold text-gray-900">
                  {reporte.estadisticas.pendientes}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-gray-700">En Progreso</span>
                <span className="font-semibold text-blue-600">
                  {reporte.estadisticas.enProgreso}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-700">Enviados</span>
                <span className="font-semibold text-green-600">
                  {reporte.estadisticas.enviados}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-sm text-gray-700">Vencidos</span>
                <span className="font-semibold text-red-600">
                  {reporte.estadisticas.vencidos}
                </span>
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600 mb-2">
                Progreso de cumplimiento
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-green-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${reporte.estadisticas.tasaCumplimiento}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de períodos */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5" />
          Períodos Asociados ({reporte.periodos?.length || 0})
        </h2>

        {reporte.periodos && reporte.periodos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Período ID
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Reporte ID
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Vencimiento
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Envío
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">
                    Días Restantes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reporte.periodos.map((periodo: PeriodoReporte) => {
                  const periodoUrgente = esUrgente(
                    periodo.diasRestantes,
                    periodo.estado
                  );
                  const periodoColorClass = obtenerClaseColor(
                    periodo.estado === "ENVIADO"
                      ? "verde"
                      : periodo.vencido
                        ? "rojo"
                        : periodo.diasRestantes <= 3
                          ? "naranja"
                          : periodo.diasRestantes <= 7
                            ? "amarillo"
                            : "verde"
                  );

                  return (
                    <tr
                      key={periodo.periodoId}
                      className={periodoUrgente ? "bg-red-50" : ""}
                    >
                      <td className="px-4 py-3">{periodo.periodoId}</td>
                      <td className="px-4 py-3">{periodo.reporteId}</td>
                      <td className="px-4 py-3">
                        {formatearFecha(periodo.fechaVencimiento)}
                      </td>
                      <td className="px-4 py-3">
                        {periodo.fechaEnvio ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="w-4 h-4" />
                            {formatearFecha(periodo.fechaEnvio)}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${obtenerClaseEstado(periodo.estado)}`}
                        >
                          {formatearEstado(periodo.estado)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {periodo.vencido ? (
                          <div className="flex items-center gap-1 text-red-600 font-medium">
                            <XCircle className="w-4 h-4" />
                            Vencido ({Math.abs(periodo.diasRestantes)} días)
                          </div>
                        ) : periodo.estado === "ENVIADO" ? (
                          <span className="text-green-600">Completado</span>
                        ) : (
                          <span
                            className={`font-medium ${periodoUrgente ? "text-red-600" : "text-gray-900"}`}
                          >
                            {periodo.diasRestantes} días
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No hay períodos asociados a este reporte
          </p>
        )}
      </div>
    </div>
  );
}
