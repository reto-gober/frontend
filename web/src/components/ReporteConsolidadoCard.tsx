/**
 * Componente Card para mostrar un reporte consolidado individual
 * Muestra información resumida con estado visual y advertencias de urgencia
 */

import type { ReporteConsolidado } from "../lib/types/reportes-consolidados";
import {
  formatearFecha,
  formatearEstado,
  obtenerClaseColor,
  obtenerClaseEstado,
  obtenerMensajeUrgencia,
  esUrgente,
  formatearFrecuencia,
  obtenerIniciales,
} from "../lib/utils/reportes-utils";
import {
  Building2,
  Calendar,
  Users,
  AlertCircle,
  TrendingUp,
  Clock,
  FileText,
} from "lucide-react";

interface ReporteConsolidadoCardProps {
  reporte: ReporteConsolidado;
  onClick?: (id: number) => void;
}

export default function ReporteConsolidadoCard({
  reporte,
  onClick,
}: ReporteConsolidadoCardProps) {
  const urgente = esUrgente(reporte.diasRestantes, reporte.estadoGeneral);
  const mensajeUrgencia = obtenerMensajeUrgencia(reporte.diasRestantes);
  const colorClass = obtenerClaseColor(reporte.colorEstado);
  const estadoClass = obtenerClaseEstado(reporte.estadoGeneral);

  const handleClick = () => {
    if (onClick) {
      onClick(reporte.id);
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden border-l-4 ${
        urgente ? "border-red-500" : "border-gray-300"
      } ${onClick ? "cursor-pointer" : ""}`}
      onClick={handleClick}
    >
      {/* Header con título y estado */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {reporte.titulo}
            </h3>
            {reporte.descripcion && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {reporte.descripcion}
              </p>
            )}
          </div>
          <div className="flex-shrink-0">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${estadoClass}`}
            >
              {formatearEstado(reporte.estadoGeneral)}
            </span>
          </div>
        </div>
      </div>

      {/* Información principal */}
      <div className="p-4 space-y-3">
        {/* Entidad */}
        <div className="flex items-center gap-2 text-sm">
          <Building2 className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span className="text-gray-700 font-medium">
            {reporte.entidad.nombre}
          </span>
          {reporte.entidad.codigo && (
            <span className="text-gray-500">({reporte.entidad.codigo})</span>
          )}
        </div>

        {/* Próximo vencimiento con indicador visual */}
        {reporte.proximoVencimiento && (
          <div className="flex items-start gap-2">
            <Calendar
              className={`w-4 h-4 flex-shrink-0 mt-0.5 ${urgente ? "text-red-500" : "text-gray-500"}`}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">
                  Próximo vencimiento:{" "}
                  {formatearFecha(reporte.proximoVencimiento)}
                </span>
              </div>
              {mensajeUrgencia && (
                <div
                  className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}
                >
                  {urgente && <AlertCircle className="w-3 h-3" />}
                  {mensajeUrgencia}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Responsables */}
        {reporte.responsables && reporte.responsables.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <div className="flex items-center gap-2 flex-wrap">
              {reporte.responsables.slice(0, 3).map((responsable) => (
                <div
                  key={responsable.id}
                  className="flex items-center gap-1.5"
                  title={`${responsable.nombre} (${responsable.email})`}
                >
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-medium">
                    {obtenerIniciales(responsable.nombre)}
                  </div>
                  <span className="text-gray-700">
                    {responsable.nombre.split(" ")[0]}
                  </span>
                </div>
              ))}
              {reporte.responsables.length > 3 && (
                <span className="text-gray-500 text-xs">
                  +{reporte.responsables.length - 3} más
                </span>
              )}
            </div>
          </div>
        )}

        {/* Frecuencia y formato */}
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatearFrecuencia(reporte.frecuencia)}</span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            <span>{reporte.formato}</span>
          </div>
        </div>
      </div>

      {/* Footer con estadísticas */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-xs text-gray-500">Total</div>
            <div className="text-sm font-semibold text-gray-900">
              {reporte.estadisticas.totalPeriodos}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Enviados</div>
            <div className="text-sm font-semibold text-green-600">
              {reporte.estadisticas.enviados}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Vencidos</div>
            <div className="text-sm font-semibold text-red-600">
              {reporte.estadisticas.vencidos}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>Cumpl.</span>
            </div>
            <div className="text-sm font-semibold text-blue-600">
              {reporte.estadisticas.tasaCumplimiento}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
