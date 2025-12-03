/**
 * Datos de ejemplo para testing y desarrollo
 * Puedes usar estos datos mock para probar componentes sin backend
 */

import type {
  ReporteConsolidado,
  ResponsableInfo,
  ContactoInfo,
  PeriodoReporte,
  Page,
} from "../types/reportes-consolidados";

// Responsables de ejemplo
export const responsablesMock: ResponsableInfo[] = [
  {
    id: "1",
    documentNumber: "12345678",
    nombre: "Juan Pérez García",
    email: "juan.perez@gobernacion.gov.co",
  },
  {
    id: "2",
    documentNumber: "87654321",
    nombre: "María González López",
    email: "maria.gonzalez@gobernacion.gov.co",
  },
];

// Contactos de ejemplo
export const contactosMock: ContactoInfo[] = [
  {
    nombre: "Pedro Martínez",
    cargo: "Coordinador",
    telefono: "+57 300 123 4567",
    email: "pedro.martinez@entidad.gov.co",
  },
  {
    nombre: "Ana Rodríguez",
    cargo: "Asistente",
    telefono: "+57 310 987 6543",
    email: "ana.rodriguez@entidad.gov.co",
  },
];

// Períodos de ejemplo
export const periodosMock: PeriodoReporte[] = [
  {
    periodoId: 1,
    reporteId: 1,
    fechaVencimiento: "2024-01-31T23:59:59",
    fechaEnvio: "2024-01-28T14:30:00",
    estado: "ENVIADO",
    diasRestantes: -300,
    vencido: false,
  },
  {
    periodoId: 2,
    reporteId: 1,
    fechaVencimiento: "2024-02-29T23:59:59",
    fechaEnvio: null,
    estado: "PENDIENTE",
    diasRestantes: 2,
    vencido: false,
  },
  {
    periodoId: 3,
    reporteId: 1,
    fechaVencimiento: "2024-03-31T23:59:59",
    fechaEnvio: null,
    estado: "PENDIENTE",
    diasRestantes: 30,
    vencido: false,
  },
];

// Reporte consolidado de ejemplo - Urgente
export const reporteUrgenteMock: ReporteConsolidado = {
  id: 1,
  titulo: "Informe Mensual de Actividades - URGENTE",
  descripcion:
    "Reporte consolidado de todas las actividades realizadas durante el mes",
  entidad: {
    id: 1,
    nombre: "Secretaría de Educación",
    codigo: "SEC-EDU-001",
  },
  responsables: responsablesMock,
  contactos: contactosMock,
  frecuencia: "MENSUAL",
  formato: "PDF",
  resolucion: "Resolución 123/2024",
  proximoVencimiento: "2024-12-05T23:59:59", // 2 días
  diasRestantes: 2,
  colorEstado: "naranja",
  estadoGeneral: "EN_PROGRESO",
  estadisticas: {
    totalPeriodos: 12,
    pendientes: 3,
    enProgreso: 2,
    enviados: 6,
    vencidos: 1,
    tasaCumplimiento: 67,
  },
  periodos: periodosMock,
  creadoEn: "2024-01-01T10:00:00",
  actualizadoEn: "2024-02-15T16:30:00",
};

// Reporte consolidado de ejemplo - OK
export const reporteOkMock: ReporteConsolidado = {
  id: 2,
  titulo: "Reporte Trimestral de Presupuesto",
  descripcion: "Seguimiento y control del presupuesto asignado",
  entidad: {
    id: 2,
    nombre: "Secretaría de Hacienda",
    codigo: "SEC-HAC-002",
  },
  responsables: [responsablesMock[0]],
  contactos: [contactosMock[0]],
  frecuencia: "TRIMESTRAL",
  formato: "EXCEL",
  resolucion: undefined,
  proximoVencimiento: "2025-03-31T23:59:59",
  diasRestantes: 90,
  colorEstado: "verde",
  estadoGeneral: "PENDIENTE",
  estadisticas: {
    totalPeriodos: 4,
    pendientes: 1,
    enProgreso: 0,
    enviados: 3,
    vencidos: 0,
    tasaCumplimiento: 75,
  },
  periodos: [],
  creadoEn: "2024-01-01T10:00:00",
  actualizadoEn: "2024-11-30T09:15:00",
};

// Reporte consolidado de ejemplo - Vencido
export const reporteVencidoMock: ReporteConsolidado = {
  id: 3,
  titulo: "Informe Anual de Gestión",
  descripcion: "Consolidado anual de resultados e indicadores",
  entidad: {
    id: 3,
    nombre: "Secretaría de Planeación",
    codigo: "SEC-PLA-003",
  },
  responsables: [responsablesMock[1]],
  contactos: [],
  frecuencia: "ANUAL",
  formato: "WORD",
  resolucion: "Decreto 456/2023",
  proximoVencimiento: "2024-11-30T23:59:59",
  diasRestantes: -2,
  colorEstado: "rojo",
  estadoGeneral: "VENCIDO",
  estadisticas: {
    totalPeriodos: 1,
    pendientes: 0,
    enProgreso: 0,
    enviados: 0,
    vencidos: 1,
    tasaCumplimiento: 0,
  },
  periodos: [],
  creadoEn: "2024-01-01T10:00:00",
  actualizadoEn: "2024-12-01T18:45:00",
};

// Reporte consolidado de ejemplo - Completado
export const reporteCompletadoMock: ReporteConsolidado = {
  id: 4,
  titulo: "Reporte Semestral de Proyectos",
  descripcion: "Seguimiento de proyectos estratégicos del semestre",
  entidad: {
    id: 4,
    nombre: "Secretaría de Obras Públicas",
    codigo: "SEC-OBR-004",
  },
  responsables: responsablesMock,
  contactos: contactosMock,
  frecuencia: "SEMESTRAL",
  formato: "PDF",
  resolucion: undefined,
  proximoVencimiento: null,
  diasRestantes: null,
  colorEstado: "verde",
  estadoGeneral: "ENVIADO",
  estadisticas: {
    totalPeriodos: 2,
    pendientes: 0,
    enProgreso: 0,
    enviados: 2,
    vencidos: 0,
    tasaCumplimiento: 100,
  },
  periodos: [],
  creadoEn: "2024-01-01T10:00:00",
  actualizadoEn: "2024-11-15T12:00:00",
};

// Lista de reportes mock
export const reportesMock: ReporteConsolidado[] = [
  reporteUrgenteMock,
  reporteOkMock,
  reporteVencidoMock,
  reporteCompletadoMock,
];

// Página mock para testing de paginación
export const paginaMock: Page<ReporteConsolidado> = {
  content: reportesMock,
  totalPages: 1,
  totalElements: 4,
  size: 10,
  number: 0,
  first: true,
  last: true,
  empty: false,
};

// Estadísticas mock
export const estadisticasMock = {
  total: 4,
  pendientes: 1,
  enProgreso: 1,
  enviados: 1,
  vencidos: 1,
  urgentes: 1,
  tasaCumplimiento: 60,
};

/**
 * Función helper para simular delay de red en tests
 */
export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Servicio mock para testing sin backend
 */
export const mockReportesConsolidadosService = {
  async listar(page = 0, size = 10) {
    await delay(500); // Simular latencia de red
    return paginaMock;
  },

  async obtenerPorId(id: number) {
    await delay(300);
    const reporte = reportesMock.find((r) => r.id === id);
    if (!reporte) throw new Error("Reporte no encontrado");
    return reporte;
  },

  async filtrarPorEstado(estado: string) {
    await delay(400);
    const filtrados = reportesMock.filter((r) => r.estadoGeneral === estado);
    return {
      ...paginaMock,
      content: filtrados,
      totalElements: filtrados.length,
    };
  },

  async obtenerEstadisticas() {
    await delay(300);
    return estadisticasMock;
  },
};

/**
 * Función para generar reportes aleatorios (útil para testing de rendimiento)
 */
export function generarReporteMock(id: number): ReporteConsolidado {
  const estados: Array<"PENDIENTE" | "EN_PROGRESO" | "ENVIADO" | "VENCIDO"> = [
    "PENDIENTE",
    "EN_PROGRESO",
    "ENVIADO",
    "VENCIDO",
  ];
  const frecuencias: Array<"MENSUAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL"> = [
    "MENSUAL",
    "TRIMESTRAL",
    "SEMESTRAL",
    "ANUAL",
  ];
  const formatos: Array<"PDF" | "EXCEL" | "WORD" | "OTRO"> = [
    "PDF",
    "EXCEL",
    "WORD",
    "OTRO",
  ];

  const estado = estados[Math.floor(Math.random() * estados.length)];
  const diasRestantes = Math.floor(Math.random() * 60) - 10;

  return {
    id,
    titulo: `Reporte de Prueba ${id}`,
    descripcion: `Descripción del reporte ${id} para testing`,
    entidad: {
      id: Math.floor(Math.random() * 10) + 1,
      nombre: `Entidad ${Math.floor(Math.random() * 10) + 1}`,
      codigo: `ENT-${String(id).padStart(3, "0")}`,
    },
    responsables: [responsablesMock[0]],
    contactos: [contactosMock[0]],
    frecuencia: frecuencias[Math.floor(Math.random() * frecuencias.length)],
    formato: formatos[Math.floor(Math.random() * formatos.length)],
    resolucion: Math.random() > 0.5 ? `RES-${id}/2024` : undefined,
    proximoVencimiento: new Date(
      Date.now() + diasRestantes * 24 * 60 * 60 * 1000
    ).toISOString(),
    diasRestantes,
    colorEstado:
      diasRestantes < 0
        ? "rojo"
        : diasRestantes <= 3
          ? "naranja"
          : diasRestantes <= 7
            ? "amarillo"
            : "verde",
    estadoGeneral: estado,
    estadisticas: {
      totalPeriodos: Math.floor(Math.random() * 12) + 1,
      pendientes: Math.floor(Math.random() * 5),
      enProgreso: Math.floor(Math.random() * 3),
      enviados: Math.floor(Math.random() * 10),
      vencidos: Math.floor(Math.random() * 2),
      tasaCumplimiento: Math.floor(Math.random() * 100),
    },
    periodos: [],
    creadoEn: new Date(2024, 0, 1).toISOString(),
    actualizadoEn: new Date().toISOString(),
  };
}

/**
 * Genera un array de reportes mock
 */
export function generarReportesMock(cantidad: number): ReporteConsolidado[] {
  return Array.from({ length: cantidad }, (_, i) => generarReporteMock(i + 1));
}
