import { useEffect, useState, useMemo } from "react";
import { TarjetaPeriodo } from "../flujo/TarjetaPeriodo";
import { flujoReportesService, type ReportePeriodo } from "../../lib/services";
import { useToast, ToastContainer } from "../Toast";
import { calcularDiasRestantes, esFechaVencida } from "../../lib/utils/fechas";
import { esEstadoEnviado, esEstadoPendiente } from "../../lib/utils/estados";
import { usePendingTour } from "../../hooks/usePendingTour";

type FilterType =
  | "todos"
  | "pendientes"
  | "enviados"
  | "vencidos"
  | "porVencer"
  | "rechazados"
  | "correccion";

const PAGE_SIZE = 10;

export default function MisTareasClient() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("todos");
  const [periodos, setPeriodos] = useState<ReportePeriodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageMeta, setPageMeta] = useState({
    totalPages: 0,
    totalElements: 0,
    size: PAGE_SIZE,
    number: 0,
  });
  const { toasts, removeToast, error } = useToast();

  // Hook para tours pendientes
  usePendingTour();

  const [counts, setCounts] = useState({
    todos: 0,
    pendientes: 0,
    enviados: 0,
    vencidos: 0,
    porVencer: 0,
    rechazados: 0,
    correccion: 0,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const filtroParam = params.get("filtro");
    if (filtroParam) {
      setActiveFilter(filtroParam as FilterType);
    }
  }, []);

  useEffect(() => {
    loadPeriodos();
    setPage(0);
  }, [activeFilter]);

  const loadPeriodos = async () => {
    try {
      setLoading(true);

      const response = await flujoReportesService.misPeriodos(0, 1000);
      if (!response || !response.content) {
        throw new Error(
          "La respuesta del servidor no tiene el formato esperado"
        );
      }

      const all = response.content;
      setPageMeta({
        totalPages: response.totalPages ?? 0,
        totalElements: response.totalElements ?? all.length,
        size: response.size ?? PAGE_SIZE,
        number: response.number ?? 0,
      });

      const newCounts = {
        todos: all.length,
        pendientes: all.filter((p) => esEstadoPendiente(p.estado)).length,
        enviados: all.filter((p) => esEstadoEnviado(p.estado)).length,
        vencidos: all.filter((p) => {
          if (!p.fechaVencimientoCalculada) return false;
          return (
            esFechaVencida(p.fechaVencimientoCalculada) &&
            !esEstadoEnviado(p.estado)
          );
        }).length,
        porVencer: all.filter((p) => {
          if (!p.fechaVencimientoCalculada) return false;
          const dias = calcularDiasRestantes(p.fechaVencimientoCalculada);
          return dias >= 0 && dias <= 3 && !esEstadoEnviado(p.estado);
        }).length,
        rechazados: all.filter(
          (p) => p.estado && p.estado.toLowerCase() === "rechazado"
        ).length,
        correccion: all.filter((p) => {
          const st = (p.estado || "").toLowerCase();
          return st === "requiere_correccion" || st === "corregir";
        }).length,
      };

      setCounts(newCounts);

      setPeriodos(all);
    } catch (err: any) {
      console.error("❌ [MisTareas] Error cargando periodos:", err);
      error(
        err.response?.data?.message || err.message || "Error al cargar tareas"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    const url = new URL(window.location.href);
    url.searchParams.set("filtro", filter);
    window.history.pushState({}, "", url);
  };

  const handleAccion = (accion: string, periodoId: string) => {
    const periodo = periodos.find((p) => p.periodoId === periodoId);
    if (!periodo) return;

    if (accion === "ver") {
      window.location.href = `/roles/responsable/reportes/${periodoId}`;
      return;
    }
  };

  const filters = [
    { id: "todos" as FilterType, label: "Todos", count: counts.todos },
    {
      id: "pendientes" as FilterType,
      label: "Pendientes",
      count: counts.pendientes,
    },
    { id: "vencidos" as FilterType, label: "Vencidos", count: counts.vencidos },
    {
      id: "porVencer" as FilterType,
      label: "Por Vencer (3 días)",
      count: counts.porVencer,
    },
    { id: "enviados" as FilterType, label: "Enviados", count: counts.enviados },
    {
      id: "correccion" as FilterType,
      label: "En Corrección",
      count: counts.correccion,
    },
    {
      id: "rechazados" as FilterType,
      label: "Rechazados",
      count: counts.rechazados,
    },
  ];

  const periodosFiltrados = useMemo(() => {
    let filtered = periodos;
    switch (activeFilter) {
      case "pendientes":
        filtered = periodos.filter((p) => esEstadoPendiente(p.estado));
        break;
      case "enviados":
        filtered = periodos.filter((p) => esEstadoEnviado(p.estado));
        break;
      case "vencidos":
        filtered = periodos.filter((p) => {
          if (!p.fechaVencimientoCalculada) return false;
          return (
            esFechaVencida(p.fechaVencimientoCalculada) &&
            !esEstadoEnviado(p.estado)
          );
        });
        break;
      case "porVencer":
        filtered = periodos.filter((p) => {
          if (!p.fechaVencimientoCalculada) return false;
          const dias = calcularDiasRestantes(p.fechaVencimientoCalculada);
          return dias >= 0 && dias <= 3 && !esEstadoEnviado(p.estado);
        });
        break;
      case "correccion":
        filtered = periodos.filter((p) => {
          const st = (p.estado || "").toLowerCase();
          return st === "requiere_correccion" || st === "corregir";
        });
        break;
      case "rechazados":
        filtered = periodos.filter(
          (p) => p.estado && p.estado.toLowerCase() === "rechazado"
        );
        break;
      case "todos":
      default:
        break;
    }

    return [...filtered].sort((a, b) => {
      const fa = a.fechaVencimientoCalculada
        ? new Date(a.fechaVencimientoCalculada).getTime()
        : 0;
      const fb = b.fechaVencimientoCalculada
        ? new Date(b.fechaVencimientoCalculada).getTime()
        : 0;
      return fa - fb;
    });
  }, [periodos, activeFilter]);

  const totalPagesUi = useMemo(() => {
    return Math.max(0, Math.ceil(periodosFiltrados.length / PAGE_SIZE));
  }, [periodosFiltrados.length]);

  const currentPage = Math.min(page, Math.max(0, totalPagesUi - 1));

  const periodosPagina = useMemo(() => {
    const start = currentPage * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return periodosFiltrados.slice(start, end);
  }, [periodosFiltrados, currentPage]);

  const handlePageChange = (nextPage: number) => {
    const bounded = Math.max(
      0,
      Math.min(nextPage, Math.max(0, totalPagesUi - 1))
    );
    setPage(bounded);
  };

  return (
    <div className="mis-tareas-page">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <div className="page-header">
        <div className="header-info">
          <h1 className="page-title">Mis Tareas</h1>
          <p className="page-description">
            Cada periodo asignado como tarea individual
          </p>
        </div>
      </div>

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

      {loading ? (
        <div className="loader-wrapper">
          <div className="loader" />
        </div>
      ) : periodosFiltrados.length === 0 ? (
        <div className="empty-state">
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
          <h3>
            {activeFilter === "todos" && "No tienes tareas asignadas"}
            {activeFilter === "pendientes" && "No hay tareas pendientes"}
            {activeFilter === "enviados" && "No hay tareas enviadas"}
            {activeFilter === "vencidos" && "No hay tareas vencidas"}
            {activeFilter === "porVencer" && "No hay tareas próximas a vencer"}
          </h3>
          <p>
            {activeFilter === "todos" &&
              "Cuando se te asignen tareas, aparecerán aquí"}
            {activeFilter === "pendientes" && "Todas tus tareas están al día"}
            {activeFilter === "enviados" && "Aún no has enviado ninguna tarea"}
            {activeFilter === "vencidos" &&
              "Excelente, no tienes tareas vencidas"}
            {activeFilter === "porVencer" &&
              "No hay tareas por vencer en los próximos 3 días"}
          </p>
        </div>
      ) : (
        <div className="tareas-list">
          {periodosPagina.map((periodo) => (
            <TarjetaPeriodo
              key={periodo.periodoId}
              periodo={periodo}
              onAccion={handleAccion}
              mostrarResponsables={false}
            />
          ))}
        </div>
      )}

      {/* Paginación - siempre visible */}
      {!loading && periodosFiltrados.length > 0 && (
        <div className="pagination">
          <button
            className="page-btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 0}
            aria-label="Página anterior"
          >
            «
          </button>
          {Array.from({ length: totalPagesUi }, (_, idx) => (
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
            disabled={currentPage >= totalPagesUi - 1}
            aria-label="Página siguiente"
          >
            »
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .mis-tareas-page {
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

        .status-tab:hover { background: var(--neutral-100); }

        .status-tab.active { background: var(--role-accent); }

        .tab-count {
          font-size: 1rem;
          font-weight: 700;
          color: var(--neutral-800);
        }

        .tab-label {
          font-size: 0.8125rem;
          color: var(--neutral-600);
        }

        .status-tab.active .tab-count,
        .status-tab.active .tab-label {
          color: var(--neutral-900);
        }

        .loader-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 300px;
        }

        .loader {
          width: 40px;
          height: 40px;
          border: 4px solid var(--neutral-200);
          border-top: 4px solid var(--role-accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
          background: white;
          border-radius: 12px;
          box-shadow: var(--shadow-card);
          border: 2px dashed var(--neutral-300);
        }

        .empty-state h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--neutral-900);
          margin-bottom: 0.5rem;
        }

        .empty-state p {
          font-size: 0.875rem;
          color: var(--neutral-500);
        }

        .tareas-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
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

      `}</style>
    </div>
  );
}
