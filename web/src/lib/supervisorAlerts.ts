import { type ReportePeriodo } from './services';

const DAY_MS = 1000 * 60 * 60 * 24;

export type SupervisorAlertSeverity = 'critica' | 'advertencia' | 'info' | 'exito';
export type SupervisorAlertCategory = 'vencimiento' | 'revision' | 'correccion' | 'estado' | 'sistema';

export interface SupervisorAlert {
  id: string;
  tipo: SupervisorAlertSeverity;
  categoria: SupervisorAlertCategory;
  titulo: string;
  descripcion: string;
  fecha: string;
  vencimiento?: string;
  entidad?: string;
  responsable?: string;
  estado?: string;
  reporteNombre?: string;
  leida: boolean;
}

const normalizarEstado = (estado?: string): string => (estado || '').toUpperCase();

const diasHasta = (fechaIso?: string): number | null => {
  if (!fechaIso) return null;
  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) return null;
  return Math.ceil((fecha.getTime() - Date.now()) / DAY_MS);
};

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

export function buildSupervisorAlerts(periodos: ReportePeriodo[]): SupervisorAlert[] {
  const alertas: SupervisorAlert[] = [];
  const ahora = new Date();

  periodos.forEach((periodo) => {
    const estado = normalizarEstado(periodo.estado);
    const diasRestantes = diasHasta(periodo.fechaVencimientoCalculada);
    const esFinalizado = estado === 'APROBADO' || estado === 'ENVIADO';

    // Alertas por vencimiento o proximidad
    if (!esFinalizado && diasRestantes !== null) {
      if (diasRestantes < 0) {
        pushAlert(
          alertas,
          periodo,
          'vencido',
          'critica',
          'vencimiento',
          `Reporte vencido: ${periodo.reporteNombre}`,
          `Venció hace ${Math.abs(diasRestantes)} día${Math.abs(diasRestantes) === 1 ? '' : 's'}`
        );
      } else if (diasRestantes <= 3) {
        pushAlert(
          alertas,
          periodo,
          'por-vencer',
          'advertencia',
          'vencimiento',
          `Vence en ${diasRestantes} día${diasRestantes === 1 ? '' : 's'}: ${periodo.reporteNombre}`,
          `Pendiente antes del ${new Date(periodo.fechaVencimientoCalculada!).toLocaleDateString('es-CO')}`
        );
      }
    }

    // Alertas por revisión o corrección
    if (estado === 'REQUIERE_CORRECCION') {
      pushAlert(
        alertas,
        periodo,
        'correccion',
        'critica',
        'correccion',
        `Corrección requerida: ${periodo.reporteNombre}`,
        periodo.comentarios && periodo.comentarios.length > 0 
          ? periodo.comentarios[periodo.comentarios.length - 1].texto 
          : 'Se solicitaron correcciones en la última revisión.'
      );
    } else if (estado === 'PENDIENTE_VALIDACION' || estado === 'EN_REVISION') {
      const esCritico = diasRestantes !== null && diasRestantes <= 0;
      pushAlert(
        alertas,
        periodo,
        'revision',
        esCritico ? 'critica' : 'advertencia',
        'revision',
        `Revisión pendiente: ${periodo.reporteNombre}`,
        periodo.estadoDescripcion || 'El reporte está pendiente de revisión.'
      );
    }

    // Alertas informativas de avances recientes
    if (esFinalizado) {
      const fechaCambio = new Date(periodo.updatedAt || periodo.fechaVencimientoCalculada || ahora.toISOString());
      const diasTranscurridos = Math.abs(Math.ceil((ahora.getTime() - fechaCambio.getTime()) / DAY_MS));
      if (diasTranscurridos <= 14) {
        pushAlert(
          alertas,
          periodo,
          'completado',
          'exito',
          'estado',
          `${estado === 'APROBADO' ? 'Aprobado' : 'Enviado'}: ${periodo.reporteNombre}`,
          estado === 'APROBADO'
            ? 'Aprobado y listo para archivo.'
            : 'Enviado a la entidad correspondiente.'
        );
      }
    }
  });

  // Ordenar por fecha descendente y evitar duplicados
  alertas.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  const unicos = Array.from(new Map(alertas.map((a) => [a.id, a])).values());
  return unicos;
}

export function relativeTimeFromNow(fechaIso: string): string {
  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) return 'Fecha no disponible';

  const diffSeconds = Math.floor((Date.now() - fecha.getTime()) / 1000);
  if (diffSeconds < 60) return 'Hace un momento';
  if (diffSeconds < 3600) return `Hace ${Math.floor(diffSeconds / 60)} minuto${Math.floor(diffSeconds / 60) === 1 ? '' : 's'}`;
  if (diffSeconds < 86400) return `Hace ${Math.floor(diffSeconds / 3600)} hora${Math.floor(diffSeconds / 3600) === 1 ? '' : 's'}`;
  if (diffSeconds < 604800) return `Hace ${Math.floor(diffSeconds / 86400)} día${Math.floor(diffSeconds / 86400) === 1 ? '' : 's'}`;

  return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function countBySeverity(alertas: SupervisorAlert[]) {
  return alertas.reduce(
    (acc, alerta) => {
      acc.total += 1;
      if (alerta.tipo === 'critica') acc.criticas += 1;
      else if (alerta.tipo === 'advertencia') acc.advertencias += 1;
      else if (alerta.tipo === 'info') acc.informativas += 1;
      else if (alerta.tipo === 'exito') acc.resueltas += 1;
      return acc;
    },
    { criticas: 0, advertencias: 0, informativas: 0, resueltas: 0, total: 0 }
  );
}

export function countByCategory(alertas: SupervisorAlert[]) {
  return alertas.reduce(
    (acc, alerta) => {
      acc[alerta.categoria] = (acc[alerta.categoria] || 0) + 1;
      return acc;
    },
    {
      vencimiento: 0,
      revision: 0,
      correccion: 0,
      estado: 0,
      sistema: 0,
    } as Record<SupervisorAlertCategory, number>
  );
}
