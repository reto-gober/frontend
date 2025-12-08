import { type ReportePeriodo } from './services';
import {
  type SupervisorAlert,
  type SupervisorAlertCategory,
  type SupervisorAlertSeverity,
} from './supervisorAlerts';

const DAY_MS = 1000 * 60 * 60 * 24;

const pushAlert = (
  lista: SupervisorAlert[],
  periodo: ReportePeriodo,
  idPrefix: string,
  tipo: SupervisorAlertSeverity,
  categoria: SupervisorAlertCategory,
  titulo: string,
  descripcion: string,
  fecha?: string
) => {
  lista.push({
    id: `${idPrefix}-${periodo.periodoId}`,
    tipo,
    categoria,
    titulo,
    descripcion,
    fecha: fecha || periodo.updatedAt || periodo.fechaVencimientoCalculada || new Date().toISOString(),
    vencimiento: periodo.fechaVencimientoCalculada,
    entidad: periodo.entidadNombre,
    responsable: periodo.responsableElaboracion?.nombreCompleto,
    estado: periodo.estadoDescripcion || periodo.estado,
    reporteNombre: periodo.reporteNombre,
    leida: false,
  });
};

export function buildResponsableAlerts(periodos: ReportePeriodo[]): SupervisorAlert[] {
  const alertas: SupervisorAlert[] = [];
  const ahora = new Date();
  const tresDiasDespues = new Date(ahora.getTime() + 3 * DAY_MS);

  periodos.forEach((periodo) => {
    if (!periodo.fechaVencimientoCalculada) return;

    const fechaVenc = new Date(periodo.fechaVencimientoCalculada);
    const esEnviado = periodo.estado === 'ENVIADO' || periodo.estado === 'APROBADO';

    // Críticas: vencidos
    if (fechaVenc < ahora && !esEnviado) {
      const diasVencido = Math.ceil((ahora.getTime() - fechaVenc.getTime()) / DAY_MS);
      pushAlert(
        alertas,
        periodo,
        'vencido',
        'critica',
        'vencimiento',
        'Reporte vencido',
        `${periodo.reporteNombre} - ${periodo.entidadNombre} venció hace ${diasVencido} día${diasVencido > 1 ? 's' : ''}`
      );
    }

    // Advertencias: por vencer en <= 3 días
    if (!esEnviado && fechaVenc >= ahora && fechaVenc <= tresDiasDespues) {
      const diasRestantes = Math.ceil((fechaVenc.getTime() - ahora.getTime()) / DAY_MS);
      pushAlert(
        alertas,
        periodo,
        'por-vencer',
        'advertencia',
        'vencimiento',
        'Reporte próximo a vencer',
        `${periodo.reporteNombre} - ${periodo.entidadNombre} vence en ${diasRestantes} día${diasRestantes > 1 ? 's' : ''}`
      );
    }

    // Advertencias: correcciones
    if (periodo.estado === 'REQUIERE_CORRECCION') {
      pushAlert(
        alertas,
        periodo,
        'correccion',
        'advertencia',
        'correccion',
        'Corrección requerida',
        `${periodo.reporteNombre} - ${periodo.entidadNombre} requiere correcciones`
      );
    }

    // Éxito: aprobados recientes (<= 7 días)
    if (periodo.estado === 'APROBADO') {
      const fechaUpdate = new Date(periodo.updatedAt || periodo.fechaVencimientoCalculada || ahora.toISOString());
      const diasDesdeAprobacion = Math.ceil((ahora.getTime() - fechaUpdate.getTime()) / DAY_MS);
      if (diasDesdeAprobacion <= 7) {
        pushAlert(
          alertas,
          periodo,
          'aprobado',
          'exito',
          'estado',
          'Reporte aprobado',
          `${periodo.reporteNombre} - ${periodo.entidadNombre} fue aprobado`
        );
      }
    }
  });

  alertas.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  return Array.from(new Map(alertas.map((a) => [a.id, a])).values());
}
