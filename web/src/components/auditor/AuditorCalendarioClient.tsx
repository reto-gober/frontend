import CalendarioResponsableClient from "../responsable/CalendarioResponsableClient";
import { flujoReportesService, type ReportePeriodo } from "../../lib/services";

export default function AuditorCalendarioClient() {
  const fetchPeriodos = async () => {
    // Usar el mismo método que Responsable para cargar TODOS los periodos
    // Eliminando el filtro de fechas que limitaba solo al mes actual
    const response = await flujoReportesService.misPeriodos(0, 1000);

    return response?.content || [];
  };

  const onNavigate = ({
    periodoId,
    reporteId,
    reporteNombre,
  }: {
    periodoId?: string;
    reporteId?: string;
    reporteNombre?: string;
  }) => {
    const id = reporteId || periodoId;
    const params = new URLSearchParams();
    if (id) params.set("resaltarReporte", id);
    if (reporteNombre) params.set("reporteNombre", reporteNombre);
    window.location.href = `/roles/auditor/reportes${
      params.toString() ? `?${params.toString()}` : ""
    }`;
  };

  return (
    <CalendarioResponsableClient
      rol="auditor"
      fetchPeriodos={fetchPeriodos}
      onNavigate={onNavigate}
    />
  );
}
