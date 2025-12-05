import { useState, useEffect } from "react";
import { TarjetaPeriodo } from "../flujo/TarjetaPeriodo";
import { ModalEnviarReporte } from "../modales/ModalEnviarReporte";
import { flujoReportesService, type ReportePeriodo } from "../../lib/services";
import { useToast, ToastContainer } from "../Toast";

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
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
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
  }, []);

  useEffect(() => {
    loadPeriodos();
  }, [activeFilter, page]);

  const loadPeriodos = async () => {
    try {
      setLoading(true);
      let response;

      // Cargar todos los periodos primero para obtener contadores
      const allResponse = await flujoReportesService.misPeriodos(0, 1000);
      const allPeriodos = allResponse.content;

      // Calcular contadores
      const now = new Date();
      const threeDaysFromNow = new Date(
        now.getTime() + 3 * 24 * 60 * 60 * 1000
      );

      const newCounts = {
        todos: allPeriodos.length,
        pendientes: allPeriodos.filter(
          (p) =>
            p.estado === "NO_INICIADO" ||
            p.estado === "PENDIENTE_ENVIO" ||
            p.estado === "REQUIERE_CORRECCION"
        ).length,
        enviados: allPeriodos.filter(
          (p) => p.estado === "ENVIADO" || p.estado === "APROBADO"
        ).length,
        vencidos: allPeriodos.filter((p) => {
          if (!p.fechaVencimientoCalculada) return false;
          const vencimiento = new Date(p.fechaVencimientoCalculada);
          return (
            vencimiento < now &&
            p.estado !== "APROBADO" &&
            p.estado !== "ENVIADO"
          );
        }).length,
        porVencer: allPeriodos.filter((p) => {
          if (!p.fechaVencimientoCalculada) return false;
          const vencimiento = new Date(p.fechaVencimientoCalculada);
          return (
            vencimiento >= now &&
            vencimiento <= threeDaysFromNow &&
            p.estado !== "APROBADO" &&
            p.estado !== "ENVIADO"
          );
        }).length,
      };

      setCounts(newCounts);

      // Filtrar según el filtro activo
      let filteredPeriodos = allPeriodos;

      switch (activeFilter) {
        case "pendientes":
          filteredPeriodos = allPeriodos.filter(
            (p) =>
              p.estado === "NO_INICIADO" ||
              p.estado === "PENDIENTE_ENVIO" ||
              p.estado === "REQUIERE_CORRECCION"
          );
          break;
        case "enviados":
          filteredPeriodos = allPeriodos.filter(
            (p) => p.estado === "ENVIADO" || p.estado === "APROBADO"
          );
          break;
        case "vencidos":
          filteredPeriodos = allPeriodos.filter((p) => {
            if (!p.fechaVencimientoCalculada) return false;
            const vencimiento = new Date(p.fechaVencimientoCalculada);
            return (
              vencimiento < now &&
              p.estado !== "APROBADO" &&
              p.estado !== "ENVIADO"
            );
          });
          break;
        case "porVencer":
          filteredPeriodos = allPeriodos.filter((p) => {
            if (!p.fechaVencimientoCalculada) return false;
            const vencimiento = new Date(p.fechaVencimientoCalculada);
            return (
              vencimiento >= now &&
              vencimiento <= threeDaysFromNow &&
              p.estado !== "APROBADO" &&
              p.estado !== "ENVIADO"
            );
          });
          break;
        case "todos":
        default:
          // Ya está asignado
          break;
      }
      // Aplicar paginación manual
      const startIndex = page * 10;
      const endIndex = startIndex + 10;
      const paginatedPeriodos = filteredPeriodos.slice(startIndex, endIndex);

      setPeriodos(paginatedPeriodos);
      setTotalElements(filteredPeriodos.length);
      setTotalPages(Math.ceil(filteredPeriodos.length / 10));
    } catch (err: any) {
      error(err.response?.data?.message || "Error al cargar reportes");
      console.error("Error cargando periodos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    setPage(0);
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

    if (accion === "enviar") {
      setModalEnviar({
        isOpen: true,
        periodoId,
        reporteNombre: periodo.reporteNombre,
        esCorreccion: false,
      });
      return;
    }

    if (accion === "corregir") {
      setModalEnviar({
        isOpen: true,
        periodoId,
        reporteNombre: periodo.reporteNombre,
        esCorreccion: true,
      });
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
              {periodos.map((periodo) => (
                <TarjetaPeriodo
                  key={periodo.periodoId}
                  periodo={periodo}
                  onAccion={handleAccion}
                  mostrarResponsables={false}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginTop: "1rem",
                }}
              >
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="btn-action"
                  style={{
                    opacity: page === 0 ? 0.5 : 1,
                    cursor: page === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  Anterior
                </button>
                <span
                  style={{
                    padding: "0 1rem",
                    fontSize: "0.875rem",
                    color: "var(--neutral-600)",
                  }}
                >
                  Página {page + 1} de {totalPages}
                </span>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={page >= totalPages - 1}
                  className="btn-action"
                  style={{
                    opacity: page >= totalPages - 1 ? 0.5 : 1,
                    cursor: page >= totalPages - 1 ? "not-allowed" : "pointer",
                  }}
                >
                  Siguiente
                </button>
              </div>
            )}
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
