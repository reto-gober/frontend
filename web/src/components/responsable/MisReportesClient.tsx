import { useState, useEffect, useMemo } from "react";
import { TarjetaPeriodo } from "../flujo/TarjetaPeriodo";
import { ModalEnviarReporte } from "../modales/ModalEnviarReporte";
import { flujoReportesService, type ReportePeriodo } from "../../lib/services";
import { useToast, ToastContainer } from "../Toast";
import { calcularDiasRestantes, esFechaVencida } from "../../lib/utils/fechas";
import { esEstadoPendiente, esEstadoEnviado } from "../../lib/utils/estados";

type FilterType =
  | "todos"
  | "pendientes"
  | "enviados"
  | "enProgreso"
  | "enRevision"
  | "vencidos"
  | "porVencer";

export default function MisReportesClient() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("todos");
  const [periodos, setPeriodos] = useState<ReportePeriodo[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Contadores por estado
  const [counts, setCounts] = useState({
    todos: 0,
    pendientes: 0,
    enviados: 0,
    vencidos: 0,
    porVencer: 0,
  });

  useEffect(() => {
    // Leer filtro de URL al cargar
    const params = new URLSearchParams(window.location.search);
    const filtroParam = params.get("filtro");
    if (filtroParam) {
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
  }, [activeFilter]);

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

      // Cargar todos los periodos primero para obtener contadores
      const allResponse = await flujoReportesService.misPeriodos(0, 1000);

      console.log("✅ [MisReportes] Respuesta recibida:", allResponse);

      if (!allResponse || !allResponse.content) {
        throw new Error(
          "La respuesta del servidor no tiene el formato esperado"
        );
      }

      const allPeriodos = allResponse.content;
      console.log("📊 [MisReportes] Total de periodos:", allPeriodos.length);

      // Si no hay periodos, mostrar estado vacío
      if (allPeriodos.length === 0) {
        console.warn("⚠️ [MisReportes] No hay periodos asignados al usuario");
        setPeriodos([]);
        setCounts({
          todos: 0,
          pendientes: 0,
          enviados: 0,
          vencidos: 0,
          porVencer: 0,
        });
        setLoading(false);
        return;
      }

      // Calcular contadores
      const now = new Date();
      const threeDaysFromNow = new Date(
        now.getTime() + 3 * 24 * 60 * 60 * 1000
      );

      const newCounts = {
        todos: allPeriodos.length,
        pendientes: allPeriodos.filter((p) => esEstadoPendiente(p.estado))
          .length,
        enviados: allPeriodos.filter((p) => esEstadoEnviado(p.estado)).length,
        vencidos: allPeriodos.filter((p) => {
          if (!p.fechaVencimientoCalculada) return false;
          return (
            esFechaVencida(p.fechaVencimientoCalculada) &&
            !esEstadoEnviado(p.estado)
          );
        }).length,
        porVencer: allPeriodos.filter((p) => {
          if (!p.fechaVencimientoCalculada) return false;
          const dias = calcularDiasRestantes(p.fechaVencimientoCalculada);
          return dias >= 0 && dias <= 3 && !esEstadoEnviado(p.estado);
        }).length,
      };

      setCounts(newCounts);

      // Filtrar según el filtro activo
      let filteredPeriodos = allPeriodos;

      switch (activeFilter) {
        case "pendientes":
          filteredPeriodos = allPeriodos.filter((p) =>
            esEstadoPendiente(p.estado)
          );
          break;
        case "enviados":
          filteredPeriodos = allPeriodos.filter((p) =>
            esEstadoEnviado(p.estado)
          );
          break;
        case "vencidos":
          filteredPeriodos = allPeriodos.filter((p) => {
            if (!p.fechaVencimientoCalculada) return false;
            return (
              esFechaVencida(p.fechaVencimientoCalculada) &&
              !esEstadoEnviado(p.estado)
            );
          });
          break;
        case "porVencer":
          filteredPeriodos = allPeriodos.filter((p) => {
            if (!p.fechaVencimientoCalculada) return false;
            const dias = calcularDiasRestantes(p.fechaVencimientoCalculada);
            return dias >= 0 && dias <= 3 && !esEstadoEnviado(p.estado);
          });
          break;
          break;
        case "todos":
        default:
          // Ya está asignado
          break;
      }
      setPeriodos(filteredPeriodos);

      console.log("✅ [MisReportes] Datos cargados exitosamente");
      console.log("📈 [MisReportes] Contadores:", newCounts);
      console.log(
        "📋 [MisReportes] Periodos filtrados:",
        filteredPeriodos.length
      );
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

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    // Actualizar URL sin recargar la página
    const url = new URL(window.location.href);
    url.searchParams.set("filtro", filter);
    window.history.pushState({}, "", url);
  };

  const handleAccion = async (accion: string, periodoId: string) => {
    const periodo = periodos.find((p) => p.periodoId === periodoId);
    if (!periodo) return;

    if (accion === "ver") {
      window.location.href = `/mis-reportes/${periodoId}`;
      return;
    }

    if (accion === "enviar" || accion === "corregir") {
      const params = new URLSearchParams({
        periodoId: periodo.periodoId,
        reporteId: periodo.reporteId,
      });
      if ((periodo as any).reporteNombre) {
        params.append("reporteNombre", (periodo as any).reporteNombre);
      }
      window.location.href = `/roles/responsable/entrega?${params.toString()}`;
      return;
    }
  };

  const handleEnvioExitoso = () => {
    success("Reporte enviado exitosamente");
    loadPeriodos();
  };

  const filters = [
    { id: "todos" as FilterType, label: "Todos", count: counts.todos },
    {
      id: "pendientes" as FilterType,
      label: "Pendientes",
      count: counts.pendientes,
    },
    {
      id: "vencidos" as FilterType,
      label: "Vencidos",
      count: counts.vencidos,
    },
    {
      id: "porVencer" as FilterType,
      label: "Por Vencer (3 días)",
      count: counts.porVencer,
    },
    { id: "enviados" as FilterType, label: "Enviados", count: counts.enviados },
  ];

  const grupos = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        nombre: string;
        entidad: string;
        periodos: ReportePeriodo[];
      }
    >();

    periodos.forEach((periodo) => {
      const key =
        periodo.reporteId ||
        (periodo as any).reporteId ||
        (periodo as any).reporteNombre ||
        (periodo as any).nombreReporte ||
        "sin-reporte";

      if (!map.has(key)) {
        map.set(key, {
          key,
          nombre:
            (periodo as any).reporteNombre ||
            (periodo as any).nombreReporte ||
            "Reporte",
          entidad: (periodo as any).entidadNombre || "",
          periodos: [],
        });
      }

      map.get(key)!.periodos.push(periodo);
    });

    return Array.from(map.values())
      .map((grupo) => ({
        ...grupo,
        periodos: [...grupo.periodos].sort((a, b) => {
          const fa = a.fechaVencimientoCalculada
            ? new Date(a.fechaVencimientoCalculada).getTime()
            : 0;
          const fb = b.fechaVencimientoCalculada
            ? new Date(b.fechaVencimientoCalculada).getTime()
            : 0;
          return fa - fb;
        }),
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [periodos]);

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
            <h1 className="page-title">Mis Reportes</h1>
            <p className="page-description">Reportes asignados a tu cargo</p>
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
        ) : periodos.length === 0 ? (
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
              {activeFilter === "todos" && "No tienes reportes asignados"}
              {activeFilter === "pendientes" && "No hay reportes pendientes"}
              {activeFilter === "enviados" && "No hay reportes enviados"}
              {activeFilter === "vencidos" && "No hay reportes vencidos"}
              {activeFilter === "porVencer" && "No hay reportes por vencer"}
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--neutral-500)" }}>
              {activeFilter === "todos" &&
                "Cuando se te asignen reportes, aparecerán aquí"}
              {activeFilter === "pendientes" &&
                "Todos tus reportes están al día"}
              {activeFilter === "enviados" &&
                "Aún no has enviado ningún reporte"}
              {activeFilter === "vencidos" &&
                "¡Excelente! Todos tus reportes están al día"}
              {activeFilter === "porVencer" &&
                "No tienes reportes próximos a vencer en los próximos 3 días"}
            </p>
          </div>
        ) : (
          <>
            <div className="reportes-list">
              {grupos.map((grupo) => (
                <div key={grupo.key} className="reporte-grupo">
                  <div className="grupo-header">
                    <div>
                      <h2 className="grupo-title">{grupo.nombre}</h2>
                      {grupo.entidad && (
                        <p className="grupo-entidad">{grupo.entidad}</p>
                      )}
                    </div>
                    <span className="grupo-count">
                      {grupo.periodos.length} periodo
                      {grupo.periodos.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="grupo-periodos">
                    {grupo.periodos.map((periodo) => {
                      const esResaltado =
                        highlightPeriodoId === periodo.periodoId;
                      return (
                        <div
                          key={periodo.periodoId}
                          id={`periodo-${periodo.periodoId}`}
                          className={`reporte-wrapper ${esResaltado ? "periodo-resaltado" : ""}`}
                        >
                          <TarjetaPeriodo
                            periodo={periodo}
                            onAccion={handleAccion}
                            mostrarResponsables={false}
                            resaltar={esResaltado}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
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

        .reporte-grupo {
          background: white;
          border-radius: 12px;
          box-shadow: var(--shadow-card);
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .grupo-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
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

        .grupo-count {
          background: var(--neutral-100);
          color: var(--neutral-700);
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          font-weight: 700;
          font-size: 0.85rem;
        }

        .grupo-periodos {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .reporte-wrapper {
          scroll-margin-top: 80px;
          transition: transform 0.2s ease;
        }

        .reporte-wrapper.periodo-resaltado .card {
          box-shadow: 0 0 0 2px var(--role-accent), 0 10px 24px rgba(0, 0, 0, 0.12);
          background: var(--role-accent-light, #fff7ed);
        }

        .reporte-wrapper.periodo-resaltado {
          animation: pulse-resaltado 0.6s ease-in-out 2;
        }

        @keyframes pulse-resaltado {
          0% { transform: scale(1); }
          50% { transform: scale(1.01); }
          100% { transform: scale(1); }
        }

        .btn-action {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          border: 1px solid var(--neutral-300);
          border-radius: 8px;
          background: white;
          color: var(--neutral-700);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-action:hover:not(:disabled) {
          background: var(--neutral-50);
          border-color: var(--neutral-400);
        }

        .btn-action:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </>
  );
}
