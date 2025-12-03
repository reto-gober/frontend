/**
 * Componente de widget de estadísticas para reportes consolidados
 * Puede integrarse en el dashboard principal
 */

import { useEstadisticasConsolidadas } from "../lib/hooks/useReportesConsolidados";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Loader2,
} from "lucide-react";

export default function ReportesConsolidadosStats() {
  const { estadisticas, loading, error } = useEstadisticasConsolidadas();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          <span className="ml-2 text-gray-600">Cargando estadísticas...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-sm text-red-700">
            Error al cargar estadísticas
          </span>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "Total Reportes",
      value: estadisticas.total,
      icon: FileText,
      color: "blue",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      iconColor: "text-blue-500",
    },
    {
      label: "Urgentes",
      value: estadisticas.urgentes,
      icon: AlertCircle,
      color: "red",
      bgColor: "bg-red-50",
      textColor: "text-red-600",
      iconColor: "text-red-500",
    },
    {
      label: "Pendientes",
      value: estadisticas.pendientes,
      icon: Clock,
      color: "yellow",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-600",
      iconColor: "text-yellow-500",
    },
    {
      label: "Enviados",
      value: estadisticas.enviados,
      icon: CheckCircle2,
      color: "green",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      iconColor: "text-green-500",
    },
    {
      label: "Cumplimiento",
      value: `${estadisticas.tasaCumplimiento}%`,
      icon: TrendingUp,
      color: "purple",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
      iconColor: "text-purple-500",
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Reportes Consolidados
        </h3>
        <a
          href="/reportes/consolidados"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Ver todos →
        </a>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`${stat.bgColor} rounded-lg p-4 transition-transform hover:scale-105`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
              <div className={`text-2xl font-bold ${stat.textColor}`}>
                {stat.value}
              </div>
              <div className="text-xs text-gray-600 mt-1">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Alertas de urgencia */}
      {estadisticas.urgentes > 0 && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span className="text-sm text-red-800">
              <strong>{estadisticas.urgentes}</strong>{" "}
              {estadisticas.urgentes === 1
                ? "reporte requiere"
                : "reportes requieren"}{" "}
              atención urgente
            </span>
          </div>
        </div>
      )}

      {/* Reportes vencidos */}
      {estadisticas.vencidos > 0 && (
        <div className="mt-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-600 flex-shrink-0" />
            <span className="text-sm text-orange-800">
              <strong>{estadisticas.vencidos}</strong>{" "}
              {estadisticas.vencidos === 1
                ? "reporte vencido"
                : "reportes vencidos"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
