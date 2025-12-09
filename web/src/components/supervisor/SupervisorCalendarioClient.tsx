import CalendarioResponsableClient from "../responsable/CalendarioResponsableClient";
import {
  calendarioService,
  flujoReportesService,
  type EventoCalendario,
  type ReportePeriodo,
} from "../../lib/services";

const mapEventosAReporte = (eventos: EventoCalendario[]): ReportePeriodo[] => {
  return (eventos || []).map((evento) => {
    const fechaReferencia =
      (evento as any).fechaVencimientoCalculada ||
      evento.fechaVencimiento ||
      evento.date ||
      evento.endDate ||
      evento.startDate;
    const fechaVenc = fechaReferencia || new Date().toISOString();

    return {
      periodoId:
        (evento as any).periodoId ||
        evento.eventoId ||
        evento.reporteId ||
        `${evento.titulo || "reporte"}-${fechaVenc}`,
      reporteId: (evento as any).reporteId,
      reporteNombre: (evento as any).reporteNombre || evento.titulo,
      entidadNombre:
        (evento as any).entidadNombre || (evento as any).entidad || "",
      fechaVencimientoCalculada: fechaVenc,
      estado: (evento as any).estado || evento.tipo || "pendiente",
      periodoInicio:
        (evento as any).periodoInicio || evento.startDate || fechaVenc,
      periodoFin: (evento as any).periodoFin || evento.endDate || fechaVenc,
      createdAt: evento.startDate || fechaVenc,
      updatedAt: evento.endDate || fechaVenc,
    } as ReportePeriodo;
  });
};

export default function SupervisorCalendarioClient() {
  const fetchPeriodos = async () => {
    // Intentar la misma ruta que Responsable (todos los periodos)
    try {
      const response = await flujoReportesService.misPeriodos(0, 1000);
      const periodos = response?.content || [];
      if (periodos.length > 0) return periodos;
    } catch (error) {
      console.warn(
        "[SupervisorCalendario] fallback a calendarioService.supervisor",
        error
      );
    }

    // Fallback: usar calendario de supervisor y mapear a la estructura esperada
    const response = await calendarioService.supervisor();
    return mapEventosAReporte(response?.eventos || []);
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
    window.location.href = `/roles/supervisor/reportes${
      params.toString() ? `?${params.toString()}` : ""
    }`;
  };

  return (
    <CalendarioResponsableClient
      rol="supervisor"
      fetchPeriodos={fetchPeriodos}
      onNavigate={onNavigate}
    />
  );
}
