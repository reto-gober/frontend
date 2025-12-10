import { useState, useEffect, useMemo } from "react";
import { ModalEnviarReporte } from "../modales/ModalEnviarReporte";
import {
  flujoReportesService,
  reportesService,
  type ReportePeriodo,
} from "../../lib/services";
import { useResponsableManual } from "../../lib/manual/responsableManual";
import { useToast, ToastContainer } from "../Toast";
import { usePendingTour } from "../../hooks/usePendingTour";

type ModoVista = "responsable" | "supervisor" | "admin";

interface MisReportesClientProps {
  modo?: ModoVista;
}

import { calcularDiasRestantes, esFechaVencida } from "../../lib/utils/fechas";
import {
  esEstadoPendiente,
  esEstadoEnviado,
  normalizarEstado,
} from "../../lib/utils/estados";

const titulos: Record<ModoVista, string> = {
  responsable: "Mis Reportes",
  supervisor: "Reportes Supervisados",
  admin: "Reportes del Sistema",
};

const descripciones: Record<ModoVista, string> = {
  responsable: "Reportes asignados a tu cargo",
  supervisor:
    "Sube o gestiona los reportes que supervisas y adjunta evidencias",
  admin: "Revisa y carga reportes de cualquier responsable y sus evidencias",
};

interface ArchivoDTO {
  archivoId: string;
  tipoArchivo: string;
  nombreOriginal: string;
  tamanoBytes: number;
  mimeType: string;
  subidoPor: string;
  subidoPorEmail: string;
  subidoEn: string;
  urlPublica: string | null;
}

type FilterType = "todos" | "activos" | "inactivos";

type EstadoGeneral = {
  code: string;
  label: string;
  badgeClass: string;
};

const obtenerVigenciaTexto = (periodo: ReportePeriodo): string => {
  return (
    (periodo as any).vigencia ||
    (periodo as any).vigenciaNombre ||
    (periodo as any).reporteVigencia ||
    (periodo as any).anioVigencia ||
    (periodo as any).periodicidad ||
    periodo.periodoTipo ||
    "Vigencia sin definir"
  );
};

const construirClaveGrupo = (periodo: ReportePeriodo): string => {
  return `${periodo.reporteId || "sin-reporte"}::${obtenerVigenciaTexto(periodo)}`;
};

const formatearFechaCorta = (fecha?: string | null): string => {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const normalizarFecha = (fecha?: string | null) => {
  if (!fecha) return null;
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  return d;
};

const obtenerRangoVigencia = (items: ReportePeriodo[]) => {
  const vigenciaInicio = items.reduce<string | null>((acc, p) => {
    const inicio =
      (p as any).fechaInicioVigencia ||
      (p as any).vigenciaInicio ||
      p.periodoInicio ||
      null;
    if (!inicio) return acc;
    if (!acc) return inicio;
    return new Date(inicio) < new Date(acc) ? inicio : acc;
  }, null);

  const vigenciaFin = items.reduce<string | null>((acc, p) => {
    const fin =
      (p as any).fechaFinVigencia ||
      (p as any).vigenciaFin ||
      p.periodoFin ||
      null;
    if (!fin) return acc;
    if (!acc) return fin;
    return new Date(fin) > new Date(acc) ? fin : acc;
  }, null);

  return { vigenciaInicio, vigenciaFin };
};

const esVigenciaActiva = (
  vigenciaInicio: string | null,
  vigenciaFin: string | null
) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const inicio = normalizarFecha(vigenciaInicio);
  const fin = normalizarFecha(vigenciaFin);

  if (inicio && hoy < inicio) return false;
  if (fin && hoy > fin) return false;
  return true;
};

const calcularResumenPeriodos = (items: ReportePeriodo[]) => {
  const vencidos = items.filter((p) => {
    if (!p.fechaVencimientoCalculada) return false;
    return (
      esFechaVencida(p.fechaVencimientoCalculada) && !esEstadoEnviado(p.estado)
    );
  }).length;

  const porVencer = items.filter((p) => {
    if (!p.fechaVencimientoCalculada) return false;
    const dias = calcularDiasRestantes(p.fechaVencimientoCalculada);
    return dias >= 0 && dias <= 3 && !esEstadoEnviado(p.estado);
  }).length;

  return {
    total: items.length,
    pendientes: items.filter((p) => esEstadoPendiente(p.estado)).length,
    enviados: items.filter((p) => esEstadoEnviado(p.estado)).length,
    vencidos,
    porVencer,
  };
};

const determinarEstadoGeneral = (items: ReportePeriodo[]): EstadoGeneral => {
  const estadosNormalizados = items.map((p) => normalizarEstado(p.estado));

  const hayVencido = items.some((p) => {
    if (!p.fechaVencimientoCalculada) return false;
    return (
      esFechaVencida(p.fechaVencimientoCalculada) && !esEstadoEnviado(p.estado)
    );
  });
  if (hayVencido)
    return { code: "vencido", label: "Vencido", badgeClass: "danger" };

  const hayPorVencer = items.some((p) => {
    if (!p.fechaVencimientoCalculada) return false;
    const dias = calcularDiasRestantes(p.fechaVencimientoCalculada);
    return dias >= 0 && dias <= 3 && !esEstadoEnviado(p.estado);
  });
  if (hayPorVencer)
    return { code: "por_vencer", label: "Por vencer", badgeClass: "warning" };

  const prioridad: Array<[string, EstadoGeneral]> = [
    [
      "requiere_correccion",
      {
        code: "requiere_correccion",
        label: "Requiere corrección",
        badgeClass: "warning",
      },
    ],
    [
      "en_revision",
      { code: "en_revision", label: "En revisión", badgeClass: "info" },
    ],
    [
      "en_elaboracion",
      {
        code: "en_elaboracion",
        label: "En elaboración",
        badgeClass: "neutral",
      },
    ],
    [
      "pendiente",
      { code: "pendiente", label: "Pendiente", badgeClass: "neutral" },
    ],
    [
      "enviado_tarde",
      { code: "enviado_tarde", label: "Enviado tarde", badgeClass: "info" },
    ],
    [
      "enviado_a_tiempo",
      { code: "enviado", label: "Enviado", badgeClass: "success" },
    ],
    [
      "pendiente_revision",
      {
        code: "en_revision",
        label: "Pendiente de revisión",
        badgeClass: "info",
      },
    ],
    ["enviado", { code: "enviado", label: "Enviado", badgeClass: "success" }],
    [
      "aprobado",
      { code: "aprobado", label: "Aprobado", badgeClass: "success" },
    ],
    [
      "rechazado",
      { code: "rechazado", label: "Rechazado", badgeClass: "danger" },
    ],
  ];

  const encontrado = prioridad.find(([code]) =>
    estadosNormalizados.includes(code)
  );
  return (
    encontrado?.[1] || {
      code: "sin_estado",
      label: "Sin estado",
      badgeClass: "neutral",
    }
  );
};

const obtenerPeriodoReferencia = (
  items: ReportePeriodo[]
): ReportePeriodo | undefined => {
  if (items.length === 0) return undefined;

  const pendientesOrdenados = [...items]
    .filter((p) => !esEstadoEnviado(p.estado))
    .sort((a, b) => {
      const fa = a.fechaVencimientoCalculada
        ? new Date(a.fechaVencimientoCalculada).getTime()
        : Number.MAX_SAFE_INTEGER;
      const fb = b.fechaVencimientoCalculada
        ? new Date(b.fechaVencimientoCalculada).getTime()
        : Number.MAX_SAFE_INTEGER;
      return fa - fb;
    });

  if (pendientesOrdenados.length > 0) return pendientesOrdenados[0];

  return [...items].sort((a, b) => {
    const fa = a.fechaVencimientoCalculada
      ? new Date(a.fechaVencimientoCalculada).getTime()
      : new Date(a.createdAt).getTime();
    const fb = b.fechaVencimientoCalculada
      ? new Date(b.fechaVencimientoCalculada).getTime()
      : new Date(b.createdAt).getTime();
    return fa - fb;
  })[0];
};

const agruparPorReporteVigencia = (items: ReportePeriodo[]) => {
  const mapa = new Map<
    string,
    {
      key: string;
      reporteId: string;
      nombre: string;
      entidad: string;
      vigencia: string;
      periodoTipo: string;
      periodos: ReportePeriodo[];
    }
  >();

  items.forEach((periodo) => {
    const key = construirClaveGrupo(periodo);
    const nombre =
      (periodo as any).reporteNombre || periodo.reporteNombre || "Reporte";
    const entidad =
      (periodo as any).entidadNombre || periodo.entidadNombre || "";
    const vigencia = obtenerVigenciaTexto(periodo);
    const periodoTipo =
      (periodo as any).periodoTipo ||
      (periodo as any).frecuencia ||
      periodo.periodoTipo ||
      "";

    if (!mapa.has(key)) {
      mapa.set(key, {
        key,
        reporteId: periodo.reporteId,
        nombre,
        entidad,
        vigencia,
        periodoTipo,
        periodos: [],
      });
    }

    mapa.get(key)!.periodos.push(periodo);
  });

  return Array.from(mapa.values());
};

export default function MisReportesClient({
  modo = "responsable",
}: MisReportesClientProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("todos");
  const [periodos, setPeriodos] = useState<ReportePeriodo[]>([]);
  const [archivosMap, setArchivosMap] = useState<Map<string, ArchivoDTO[]>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 6;
  const [pendingEntrega, setPendingEntrega] = useState<{
    periodoId: string;
    reporteId?: string;
    reporteNombre?: string;
  } | null>(null);
  const [highlightPeriodoId, setHighlightPeriodoId] = useState<string | null>(
    null
  );
  const [modalEnviar, setModalEnviar] = useState<{
    isOpen: boolean;
    periodoId: string;
    reporteNombre: string;
    esCorreccion: boolean;
  }>({ isOpen: false, periodoId: "", reporteNombre: "", esCorreccion: false });
  const { toasts, removeToast, success, error } = useToast();
  const manual = useResponsableManual();

  // Verificar tours pendientes después de navegación
  usePendingTour();

  // Contadores por estado
  const [counts, setCounts] = useState({
    todos: 0,
    activos: 0,
    inactivos: 0,
  });

  useEffect(() => {
    manual.registerTour({
      tourId: "responsable-mis-reportes",
      options: { stagePadding: 12 },
      sections: [
        { id: "encabezado", label: "Encabezado y contexto", steps: [] },
        { id: "filtros", label: "Filtros y estado", steps: [] },
        { id: "listado", label: "Listado y tarjetas", steps: [] },
        { id: "acciones", label: "Acciones rápidas", steps: [] },
      ],
    });
  }, [manual]);

  useEffect(() => {
    // Leer filtro de URL al cargar
    const params = new URLSearchParams(window.location.search);
    const filtroParam = params.get("filtro");
    const validFilters: FilterType[] = ["todos", "activos", "inactivos"];
    if (filtroParam && validFilters.includes(filtroParam as FilterType)) {
      setActiveFilter(filtroParam as FilterType);
    }

    const highlightParam = params.get("resaltarPeriodo");
    if (highlightParam) {
      setHighlightPeriodoId(highlightParam);
      setActiveFilter("todos");
    }

    const abrirEntrega = params.get("abrirEntrega");
    if (abrirEntrega) {
      setPendingEntrega({
        periodoId: abrirEntrega,
        reporteId: params.get("reporteId") || undefined,
        reporteNombre: params.get("reporteNombre") || undefined,
      });
    }

    if (highlightParam) {
      const url = new URL(window.location.href);
      url.searchParams.delete("resaltarPeriodo");
      window.history.replaceState({}, "", url);
    }
  }, []);

  useEffect(() => {
    loadPeriodos();
  }, []);

  useEffect(() => {
    if (!pendingEntrega) return;
    const targetPeriodo = periodos.find(
      (p) => p.periodoId === pendingEntrega.periodoId
    );
    if (!targetPeriodo) return;

    const params = new URLSearchParams({ periodoId: targetPeriodo.periodoId });
    const reporteIdToUse = pendingEntrega.reporteId || targetPeriodo.reporteId;
    if (reporteIdToUse) params.append("reporteId", reporteIdToUse);

    const reporteNombreToUse =
      pendingEntrega.reporteNombre || (targetPeriodo as any).reporteNombre;
    if (reporteNombreToUse) params.append("reporteNombre", reporteNombreToUse);

    // Limpiar el query param para no re-disparar
    const url = new URL(window.location.href);
    url.searchParams.delete("abrirEntrega");
    url.searchParams.delete("reporteId");
    url.searchParams.delete("reporteNombre");
    window.history.replaceState({}, "", url);

    window.location.href = `/roles/responsable/entrega?${params.toString()}`;
    setPendingEntrega(null);
  }, [pendingEntrega, periodos]);

  useEffect(() => {
    if (!highlightPeriodoId || periodos.length === 0) return;
    const target = document.getElementById(`periodo-${highlightPeriodoId}`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightPeriodoId, periodos]);

  const loadPeriodos = async () => {
    try {
      setLoading(true);

      console.log(
        "🔄 [MisReportes] Cargando periodos, filtro activo:",
        activeFilter
      );

      let allPeriodos: ReportePeriodo[] = [];

      if (modo === "admin") {
        // Administrador: trae todos los reportes y agrega sus periodos
        const reportesResponse = await reportesService.listar(0, 300);
        const reportes = reportesResponse.content || [];

        const periodosPorReporte = await Promise.all(
          reportes.map(async (reporte) => {
            try {
              const periodosPage =
                await flujoReportesService.periodosPorReporte(
                  reporte.reporteId,
                  0,
                  200
                );
              return periodosPage.content || [];
            } catch (err) {
              console.warn(
                "⚠️ [MisReportes] No se pudieron cargar los periodos del reporte",
                reporte.reporteId,
                err
              );
              return [] as ReportePeriodo[];
            }
          })
        );

        allPeriodos = periodosPorReporte.flat();
      } else {
        // Responsable/Supervisor: periodos asignados
        const allResponse = await flujoReportesService.misPeriodos(0, 1000);

        console.log("✅ [MisReportes] Respuesta recibida:", allResponse);

        if (!allResponse || !allResponse.content) {
          throw new Error(
            "La respuesta del servidor no tiene el formato esperado"
          );
        }

        allPeriodos = allResponse.content;
      }

      console.log("📊 [MisReportes] Total de periodos:", allPeriodos.length);

      // Si no hay periodos, mostrar estado vacío
      if (allPeriodos.length === 0) {
        console.warn("⚠️ [MisReportes] No hay periodos asignados al usuario");
        setPeriodos([]);
        setCounts({
          todos: 0,
          activos: 0,
          inactivos: 0,
        });
        setLoading(false);
        return;
      }

      const gruposCompletos = agruparPorReporteVigencia(allPeriodos);

      const activos = gruposCompletos.filter((g) => {
        const { vigenciaInicio, vigenciaFin } = obtenerRangoVigencia(
          g.periodos
        );
        return esVigenciaActiva(vigenciaInicio, vigenciaFin);
      }).length;

      const inactivos = gruposCompletos.length - activos;

      // Calcular contadores
      const now = new Date();
      const threeDaysFromNow = new Date(
        now.getTime() + 3 * 24 * 60 * 60 * 1000
      );

      const newCounts = {
        todos: gruposCompletos.length,
        activos,
        inactivos,
      };

      setCounts(newCounts);

      // Establecer todos los periodos
      setPeriodos(allPeriodos);

      // Cargar archivos para los periodos paginados
      const paginatedPeriodos = allPeriodos.slice(0, PAGE_SIZE);
      await loadArchivos(paginatedPeriodos);

      console.log("✅ [MisReportes] Datos cargados exitosamente");
      console.log("📈 [MisReportes] Contadores:", newCounts);
      console.log("📋 [MisReportes] Periodos totales:", allPeriodos.length);
    } catch (err: any) {
      console.error("❌ [MisReportes] Error cargando periodos:", err);
      console.error(
        "❌ [MisReportes] Respuesta del error:",
        err.response?.data
      );
      console.error("❌ [MisReportes] Status del error:", err.response?.status);

      const mensajeError =
        err.response?.data?.message ||
        err.message ||
        "Error al cargar reportes";
      error(mensajeError);
    } finally {
      setLoading(false);
    }
  };

  const loadArchivos = async (periodosToLoad: ReportePeriodo[]) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const newArchivosMap = new Map<string, ArchivoDTO[]>();

    // Cargar archivos para cada periodo
    await Promise.all(
      periodosToLoad.map(async (periodo) => {
        try {
          const response = await fetch(
            `http://localhost:8080/api/periodos/${periodo.periodoId}/archivos`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            newArchivosMap.set(periodo.periodoId, data.data.archivos || []);
          } else {
            console.warn(
              `No se pudieron cargar archivos para periodo ${periodo.periodoId}`
            );
            newArchivosMap.set(periodo.periodoId, []);
          }
        } catch (err) {
          console.error(
            `Error cargando archivos para periodo ${periodo.periodoId}:`,
            err
          );
          newArchivosMap.set(periodo.periodoId, []);
        }
      })
    );

    setArchivosMap(newArchivosMap);
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    // Actualizar URL sin recargar la página
    const url = new URL(window.location.href);
    url.searchParams.set("filtro", filter);
    window.history.pushState({}, "", url);
  };

  const handleVerEntregas = () => {
    window.location.href = "/roles/responsable/mis-tareas";
  };

  const handleVerDetalle = (periodoId: string) => {
    window.location.href = `/roles/responsable/reportes/${periodoId}?from=mis-reportes`;
  };

  const handleEnvioExitoso = () => {
    success("Reporte enviado exitosamente");
    loadPeriodos();
  };

  const filters = [
    { id: "todos" as FilterType, label: "Todos", count: counts.todos },
    {
      id: "activos" as FilterType,
      label: "Activos",
      count: counts.activos,
    },
    {
      id: "inactivos" as FilterType,
      label: "Inactivos",
      count: counts.inactivos,
    },
  ];

  const grupos = useMemo(() => {
    const agrupados = agruparPorReporteVigencia(periodos).map((grupo) => {
      const resumen = calcularResumenPeriodos(grupo.periodos);
      const periodoReferencia = obtenerPeriodoReferencia(grupo.periodos);
      const { vigenciaInicio, vigenciaFin } = obtenerRangoVigencia(
        grupo.periodos
      );
      const activo = esVigenciaActiva(vigenciaInicio, vigenciaFin);

      const resaltarId =
        highlightPeriodoId &&
        grupo.periodos.some((p) => p.periodoId === highlightPeriodoId)
          ? highlightPeriodoId
          : undefined;

      return {
        ...grupo,
        resumen,
        periodoReferencia,
        vigenciaInicio,
        vigenciaFin,
        activo,
        resaltarId,
      };
    });

    const filtrados = agrupados.filter((grupo) => {
      switch (activeFilter) {
        case "activos":
          return grupo.activo;
        case "inactivos":
          return !grupo.activo;
        case "todos":
        default:
          return true;
      }
    });

    return filtrados.sort((a, b) => {
      const nombre = a.nombre.localeCompare(b.nombre);
      if (nombre !== 0) return nombre;
      return a.vigencia.localeCompare(b.vigencia);
    });
  }, [periodos, activeFilter, highlightPeriodoId]);

  useEffect(() => {
    setPage(0);
  }, [activeFilter]);

  const totalPages = useMemo(
    () => Math.max(0, Math.ceil(grupos.length / PAGE_SIZE)),
    [grupos.length]
  );

  const currentPage = Math.min(page, Math.max(0, totalPages - 1));

  const gruposPagina = useMemo(() => {
    const start = currentPage * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return grupos.slice(start, end);
  }, [grupos, currentPage]);

  const handlePageChange = (nextPage: number) => {
    const bounded = Math.max(
      0,
      Math.min(nextPage, Math.max(0, totalPages - 1))
    );
    setPage(bounded);
  };

  return (
    <>
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <ModalEnviarReporte
        periodoId={modalEnviar.periodoId}
        reporteNombre={modalEnviar.reporteNombre}
        isOpen={modalEnviar.isOpen}
        esCorreccion={modalEnviar.esCorreccion}
        onClose={() => setModalEnviar({ ...modalEnviar, isOpen: false })}
        onSuccess={handleEnvioExitoso}
        onError={error}
      />

      <div className="mis-reportes-page">
        {/* Header */}
        <div className="page-header">
          <div className="header-info">
            <h1 className="page-title">{titulos[modo]}</h1>
            <p className="page-description">{descripciones[modo]}</p>
          </div>
        </div>

        {/* Status Tabs - Filtros */}
        <div className="status-tabs">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => handleFilterChange(filter.id)}
              className={`status-tab ${activeFilter === filter.id ? "active" : ""}`}
            >
              <span className="tab-count">{filter.count}</span>
              <span className="tab-label">{filter.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "300px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                border: "4px solid var(--neutral-200)",
                borderTop: "4px solid var(--role-accent)",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
          </div>
        ) : grupos.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "3rem 1rem",
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "var(--shadow-card)",
              border: "2px dashed var(--neutral-300)",
            }}
          >
            <svg
              style={{ margin: "0 auto 1rem", color: "var(--neutral-400)" }}
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3
              style={{
                fontSize: "1.125rem",
                fontWeight: "600",
                color: "var(--neutral-900)",
                marginBottom: "0.5rem",
              }}
            >
              {activeFilter === "todos" &&
                (modo === "responsable"
                  ? "No tienes reportes asignados"
                  : "No hay reportes disponibles")}
              {activeFilter === "activos" && "No hay reportes activos"}
              {activeFilter === "inactivos" && "No hay reportes inactivos"}
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--neutral-500)" }}>
              {activeFilter === "todos" &&
                (modo === "responsable"
                  ? "Cuando se te asignen reportes, aparecerán aquí"
                  : "Crea o asigna reportes para comenzar a gestionarlos")}
              {activeFilter === "activos" &&
                "No hay reportes dentro de una vigencia activa"}
              {activeFilter === "inactivos" &&
                "Todos los reportes están dentro de una vigencia activa"}
            </p>
          </div>
        ) : (
          <>
            <div className="reportes-list">
              {gruposPagina.map((grupo) => (
                <div
                  key={grupo.key}
                  id={
                    grupo.resaltarId ? `periodo-${grupo.resaltarId}` : undefined
                  }
                  className={`reporte-agrupado ${grupo.resaltarId ? "periodo-resaltado" : ""}`}
                >
                  <div className="agrupado-top">
                    <div>
                      <h2 className="grupo-title">{grupo.nombre}</h2>
                      {grupo.entidad && (
                        <p className="grupo-entidad">{grupo.entidad}</p>
                      )}
                    </div>
                    <span
                      className={`estado-chip ${grupo.activo ? "activo" : "inactivo"}`}
                    >
                      {grupo.activo ? "ACTIVO" : "INACTIVO"}
                    </span>
                  </div>

                  <div className="agrupado-meta">
                    <div>
                      <span className="meta-label">Vigencia</span>
                      <span className="meta-value">{`${formatearFechaCorta(grupo.vigenciaInicio)} - ${formatearFechaCorta(grupo.vigenciaFin)}`}</span>
                      <span className="meta-subvalue">{grupo.vigencia}</span>
                    </div>
                    <div>
                      <span className="meta-label">Periodicidad</span>
                      <span className="meta-value">
                        {grupo.periodoTipo || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="meta-label">Periodos</span>
                      <span className="meta-value">{grupo.resumen.total}</span>
                    </div>
                  </div>

                  <div className="agrupado-resumen">
                    <div>
                      <strong>{grupo.resumen.pendientes}</strong>
                      <span>Pendientes</span>
                    </div>
                    <div>
                      <strong>{grupo.resumen.vencidos}</strong>
                      <span>Vencidos</span>
                    </div>
                    <div>
                      <strong>{grupo.resumen.porVencer}</strong>
                      <span>Por vencer (3 días)</span>
                    </div>
                    <div>
                      <strong>{grupo.resumen.enviados}</strong>
                      <span>Enviados</span>
                    </div>
                  </div>

                  {grupo.periodoReferencia && (
                    <div className="agrupado-actions">
                      <button
                        className="btn btn-secondary btn-with-icon"
                        onClick={handleVerEntregas}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <line x1="8" y1="6" x2="21" y2="6"></line>
                          <line x1="8" y1="12" x2="21" y2="12"></line>
                          <line x1="8" y1="18" x2="21" y2="18"></line>
                          <line x1="3" y1="6" x2="3.01" y2="6"></line>
                          <line x1="3" y1="12" x2="3.01" y2="12"></line>
                          <line x1="3" y1="18" x2="3.01" y2="18"></line>
                        </svg>
                        Ver entregas
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* Paginación - siempre visible */}
            <div className="pagination">
              <button
                className="page-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                aria-label="Página anterior"
              >
                «
              </button>
              {Array.from({ length: totalPages }, (_, idx) => (
                <button
                  key={idx}
                  className={`page-number ${idx === currentPage ? "active" : ""}`}
                  onClick={() => handlePageChange(idx)}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                className="page-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
                aria-label="Página siguiente"
              >
                »
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .mis-reportes-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .page-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--neutral-900);
          margin: 0;
        }

        .page-description {
          font-size: 0.875rem;
          color: var(--neutral-500);
          margin: 0.25rem 0 0;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.35rem;
          margin-top: 1.5rem;
          flex-wrap: wrap;
        }

        .page-btn,
        .page-number {
          min-width: 36px;
          height: 36px;
          padding: 0 0.75rem;
          border: 1px solid var(--neutral-300);
          border-radius: 8px;
          background: white;
          color: var(--neutral-800);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .page-btn:disabled,
        .page-number:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-number.active {
          background: var(--role-accent);
          color: var(--neutral-900);
          border-color: var(--neutral-400);
          box-shadow: 0 2px 6px rgba(0,0,0,0.06);
        }

        .page-btn:not(:disabled):hover,
        .page-number:not(.active):not(:disabled):hover {
          background: var(--neutral-50);
        }

        /* Status Tabs */
        .status-tabs {
          display: flex;
          gap: 0.5rem;
          background: white;
          padding: 0.5rem;
          border-radius: 12px;
          box-shadow: var(--shadow-card);
          overflow-x: auto;
        }

        .status-tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          border: none;
          border-radius: 8px;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .status-tab:hover {
          background: var(--neutral-100);
        }

        .status-tab.active {
          background: var(--role-accent);
        }

        .tab-count {
          font-size: 1rem;
          font-weight: 700;
          color: var(--neutral-800);
        }

        .tab-label {
          font-size: 0.8125rem;
          color: var(--neutral-600);
          white-space: nowrap;
        }

        .status-tab.active .tab-count,
        .status-tab.active .tab-label {
          color: var(--neutral-900);
        }

        .reportes-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .reporte-agrupado {
          background: white;
          border-radius: 12px;
          box-shadow: var(--shadow-card);
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          transition: box-shadow 0.2s ease, transform 0.2s ease;
        }

        .reporte-agrupado.periodo-resaltado {
          box-shadow: 0 0 0 2px var(--role-accent), 0 10px 24px rgba(0, 0, 0, 0.12);
          background: var(--role-accent-light, #fff7ed);
          animation: pulse-resaltado 0.6s ease-in-out 2;
        }

        .agrupado-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
        }

        .grupo-title {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--neutral-900);
        }

        .grupo-entidad {
          margin: 0.15rem 0 0;
          color: var(--neutral-600);
          font-size: 0.9rem;
        }

        .estado-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.35rem 0.75rem;
          border-radius: 999px;
          font-weight: 700;
          font-size: 0.85rem;
          border: 1px solid var(--neutral-200);
          background: var(--neutral-50);
          color: var(--neutral-800);
        }

        .estado-chip.success {
          border-color: #c6f6d5;
          background: #f0fff4;
          color: #276749;
        }

        .estado-chip.activo {
          border-color: #c6f6d5;
          background: #f0fff4;
          color: #276749;
        }

        .estado-chip.info {
          border-color: #bee3f8;
          background: #ebf8ff;
          color: #2c5282;
        }

        .estado-chip.warning {
          border-color: #fefcbf;
          background: #fffbeb;
          color: #92400e;
        }

        .estado-chip.danger {
          border-color: #fed7d7;
          background: #fff5f5;
          color: #c53030;
        }

        .estado-chip.inactivo {
          border-color: #fed7d7;
          background: #fff5f5;
          color: #c53030;
        }

        .agrupado-meta {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 0.75rem;
        }

        .meta-label {
          display: block;
          font-size: 0.75rem;
          color: var(--neutral-500);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.2rem;
        }

        .meta-value {
          display: block;
          font-weight: 700;
          color: var(--neutral-900);
          font-size: 0.95rem;
        }

        .meta-subvalue {
          display: block;
          font-size: 0.8rem;
          color: var(--neutral-500);
          margin-top: 0.1rem;
        }

        .agrupado-resumen {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 0.75rem;
          background: var(--neutral-50);
          border: 1px dashed var(--neutral-200);
          border-radius: 10px;
          padding: 0.85rem 1rem;
        }

        .agrupado-resumen div {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          color: var(--neutral-700);
        }

        .agrupado-resumen strong {
          font-size: 1.2rem;
          color: var(--neutral-900);
        }

        .agrupado-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 0.5rem;
        }

        @keyframes pulse-resaltado {
          0% { transform: scale(1); }
          50% { transform: scale(1.01); }
          100% { transform: scale(1); }
        }
      `}</style>
    </>
  );
}
