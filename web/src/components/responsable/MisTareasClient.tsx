import { useState, useEffect } from "react";
import { flujoReportesService, type ReportePeriodo } from "../../lib/services";
import {
  calcularDiasRestantes,
  obtenerTextoVencimiento,
} from "../../lib/utils/fechas";
import {
  esEstadoCompletado,
  esEstadoRequiereCorreccion,
  normalizarEstado,
} from "../../lib/utils/estados";

type FiltroTarea = "todas" | "pendientes" | "completadas" | "vencidas";

export default function MisTareasClient() {
  const [tareas, setTareas] = useState<ReportePeriodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroActivo, setFiltroActivo] = useState<FiltroTarea>("todas");
  const [tareasMarcadas, setTareasMarcadas] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadTareas();
  }, []);

  const loadTareas = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("🔍 [MisTareasClient] Iniciando carga de tareas...");
      console.log(
        "🔍 [MisTareasClient] Token en localStorage:",
        localStorage.getItem("token") ? "✅ Presente" : "❌ No encontrado"
      );

      const response = await flujoReportesService.misPeriodos(0, 100);

      console.log("🔍 [MisTareasClient] Respuesta completa:", response);
      console.log(
        "🔍 [MisTareasClient] Cantidad de periodos:",
        response?.content?.length || 0
      );

      if (response?.content && response.content.length > 0) {
        console.log(
          "🔍 [MisTareasClient] Primer periodo:",
          response.content[0]
        );
        console.log(
          "🔍 [MisTareasClient] Estados de todos los periodos:",
          response.content.map((p) => ({ id: p.periodoId, estado: p.estado }))
        );
      }

      setTareas(response.content);
      console.log(
        "✅ [MisTareasClient] Tareas cargadas exitosamente:",
        response.content.length
      );
    } catch (err: any) {
      console.error("❌ [MisTareasClient] Error al cargar tareas:", err);
      console.error(
        "❌ [MisTareasClient] Respuesta del error:",
        err.response?.data
      );
      console.error(
        "❌ [MisTareasClient] Status del error:",
        err.response?.status
      );
      console.error("❌ [MisTareasClient] URL llamada:", err.config?.url);
      setError("Error al cargar las tareas. Por favor, intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const getPrioridad = (periodo: ReportePeriodo): "high" | "medium" | "low" => {
    const diasRestantes = calcularDiasRestantes(
      periodo.fechaVencimientoCalculada
    );
    if (diasRestantes < 0 || esEstadoRequiereCorreccion(periodo.estado))
      return "high";
    if (diasRestantes <= 3) return "medium";
    return "low";
  };

  const esVencida = (periodo: ReportePeriodo): boolean => {
    return (
      calcularDiasRestantes(periodo.fechaVencimientoCalculada) < 0 &&
      !esEstadoCompletado(periodo.estado)
    );
  };

  const esParaHoy = (periodo: ReportePeriodo): boolean => {
    return (
      calcularDiasRestantes(periodo.fechaVencimientoCalculada) === 0 &&
      !esEstadoCompletado(periodo.estado)
    );
  };

  const esPendiente = (periodo: ReportePeriodo): boolean => {
    return !esEstadoCompletado(periodo.estado) && !esVencida(periodo);
  };

  const esCompletada = (periodo: ReportePeriodo): boolean => {
    return esEstadoCompletado(periodo.estado);
  };

  const tareasFiltradas = tareas.filter((tarea) => {
    switch (filtroActivo) {
      case "pendientes":
        return esPendiente(tarea);
      case "completadas":
        return esCompletada(tarea);
      case "vencidas":
        return esVencida(tarea);
      default:
        return true;
    }
  });

  console.log("📊 [MisTareasClient] Tareas totales:", tareas.length);
  console.log("📊 [MisTareasClient] Filtro activo:", filtroActivo);
  console.log("📊 [MisTareasClient] Tareas filtradas:", tareasFiltradas.length);

  const tareasVencidas = tareasFiltradas.filter(esVencida);
  const tareasParaHoy = tareasFiltradas.filter(esParaHoy);
  const tareasPendientesNormales = tareasFiltradas.filter(
    (t) => !esVencida(t) && !esParaHoy(t) && !esCompletada(t)
  );
  const tareasCompletadas = tareasFiltradas.filter(esCompletada);

  const contadores = {
    todas: tareas.length,
    pendientes: tareas.filter(esPendiente).length,
    completadas: tareas.filter(esCompletada).length,
    vencidas: tareas.filter(esVencida).length,
    paraHoy: tareas.filter(esParaHoy).length,
  };

  console.log("📊 [MisTareasClient] Contadores:", contadores);
  console.log("📊 [MisTareasClient] Vencidas:", tareasVencidas.length);
  console.log("📊 [MisTareasClient] Para hoy:", tareasParaHoy.length);
  console.log("📊 [MisTareasClient] Completadas:", tareasCompletadas.length);

  const toggleTareaMarcada = (periodoId: string) => {
    setTareasMarcadas((prev) => {
      const nuevas = new Set(prev);
      if (nuevas.has(periodoId)) {
        nuevas.delete(periodoId);
      } else {
        nuevas.add(periodoId);
      }
      return nuevas;
    });
  };

  const getTextoFechaVencimiento = (periodo: ReportePeriodo): string => {
    return obtenerTextoVencimiento(periodo.fechaVencimientoCalculada);
  };

  const getDescripcionTarea = (periodo: ReportePeriodo): string => {
    const estado = normalizarEstado(periodo.estado);
    if (estado === "requiere_correccion") {
      return `Requiere corrección${periodo.comentarios ? ": " + periodo.comentarios : ""}`;
    }
    if (estado === "pendiente") {
      return `Completar y enviar reporte de ${periodo.periodoTipo}`;
    }
    if (estado === "en_elaboracion") {
      return `En elaboración - ${periodo.periodoTipo}`;
    }
    if (
      estado === "enviado_a_tiempo" ||
      estado === "enviado_tarde" ||
      estado === "en_revision"
    ) {
      return "Reporte enviado, en proceso de revisión";
    }
    if (estado === "aprobado") {
      return "Reporte aprobado";
    }
    if (estado === "vencido") {
      return "Reporte vencido - fecha límite superada";
    }
    return periodo.estadoDescripcion || "Sin descripción";
  };

  const handleIrAReporte = (periodoId: string) => {
    window.location.href = `/roles/responsable/mis-reportes?periodo=${periodoId}`;
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
          color: "var(--neutral-500)",
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
    );
  }

  // Mensaje de error
  if (error) {
    return (
      <div className="mis-tareas-page">
        <div className="page-header">
          <h1 className="page-title">Mis Tareas</h1>
        </div>
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            backgroundColor: "#fee2e2",
            borderRadius: "8px",
            color: "#dc2626",
            marginTop: "2rem",
          }}
        >
          <h3>❌ Error al cargar datos</h3>
          <p>{error}</p>
          <p style={{ fontSize: "0.875rem", marginTop: "1rem" }}>
            Por favor, verifica la consola del navegador (F12) para más
            detalles.
          </p>
          <button
            onClick={loadTareas}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              backgroundColor: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Mensaje cuando no hay datos
  if (tareas.length === 0) {
    return (
      <div className="mis-tareas-page">
        <div className="page-header">
          <h1 className="page-title">Mis Tareas</h1>
        </div>
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            backgroundColor: "#f3f4f6",
            borderRadius: "8px",
            marginTop: "2rem",
          }}
        >
          <h3>📋 No hay tareas asignadas</h3>
          <p>No se encontraron periodos de reportes asignados a tu usuario.</p>
          <p
            style={{
              fontSize: "0.875rem",
              marginTop: "1rem",
              color: "#6b7280",
            }}
          >
            Verifica la consola del navegador (F12) para ver los logs
            detallados.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mis-tareas-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-info">
          <h1 className="page-title">Mis Tareas</h1>
          <p className="page-description">
            Gestión de tareas y actividades pendientes
          </p>
        </div>
        <div className="header-stats">
          <div className="stat-badge pending">
            <span className="stat-number">{contadores.pendientes}</span>
            <span className="stat-label">Pendientes</span>
          </div>
          <div className="stat-badge today">
            <span className="stat-number">{contadores.paraHoy}</span>
            <span className="stat-label">Para Hoy</span>
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="quick-filters">
        <button
          className={`filter-btn ${filtroActivo === "todas" ? "active" : ""}`}
          onClick={() => setFiltroActivo("todas")}
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          </svg>
          Todas ({contadores.todas})
        </button>
        <button
          className={`filter-btn ${filtroActivo === "pendientes" ? "active" : ""}`}
          onClick={() => setFiltroActivo("pendientes")}
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12,6 12,12 16,14" />
          </svg>
          Pendientes ({contadores.pendientes})
        </button>
        <button
          className={`filter-btn ${filtroActivo === "completadas" ? "active" : ""}`}
          onClick={() => setFiltroActivo("completadas")}
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          Completadas ({contadores.completadas})
        </button>
        <button
          className={`filter-btn ${filtroActivo === "vencidas" ? "active" : ""}`}
          onClick={() => setFiltroActivo("vencidas")}
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Vencidas ({contadores.vencidas})
        </button>
      </div>

      {/* Tareas List */}
      <div className="tareas-container">
        {/* Sección: Vencidas */}
        {tareasVencidas.length > 0 && (
          <div className="tareas-section overdue">
            <div className="section-header">
              <div className="section-title">
                <span className="section-icon">
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  </svg>
                </span>
                <h2>Vencidas</h2>
                <span className="count">{tareasVencidas.length}</span>
              </div>
            </div>
            <div className="tareas-list">
              {tareasVencidas.map((tarea) => (
                <div key={tarea.periodoId} className="tarea-item overdue">
                  <div className="tarea-checkbox">
                    <input
                      type="checkbox"
                      id={`task-${tarea.periodoId}`}
                      checked={tareasMarcadas.has(tarea.periodoId)}
                      onChange={() => toggleTareaMarcada(tarea.periodoId)}
                    />
                    <label htmlFor={`task-${tarea.periodoId}`}></label>
                  </div>
                  <div className="tarea-content">
                    <div className="tarea-header">
                      <h3 className="tarea-title">{tarea.reporteNombre}</h3>
                      <div className={`tarea-priority ${getPrioridad(tarea)}`}>
                        <svg
                          viewBox="0 0 24 24"
                          width="14"
                          height="14"
                          fill="currentColor"
                        >
                          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                        </svg>
                        {getPrioridad(tarea) === "high"
                          ? "Alta"
                          : getPrioridad(tarea) === "medium"
                            ? "Media"
                            : "Baja"}
                      </div>
                    </div>
                    <p className="tarea-description">
                      {getDescripcionTarea(tarea)}
                    </p>
                    <div className="tarea-meta">
                      <span className="meta-item danger">
                        <svg
                          viewBox="0 0 24 24"
                          width="14"
                          height="14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect
                            x="3"
                            y="4"
                            width="18"
                            height="18"
                            rx="2"
                            ry="2"
                          />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {getTextoFechaVencimiento(tarea)}
                      </span>
                      <span className="meta-item">
                        <svg
                          viewBox="0 0 24 24"
                          width="14"
                          height="14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        </svg>
                        {tarea.entidadNombre}
                      </span>
                    </div>
                  </div>
                  <div className="tarea-actions">
                    <button
                      className="action-btn primary"
                      onClick={() => handleIrAReporte(tarea.periodoId)}
                      title="Ir al reporte"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sección: Para Hoy */}
        {tareasParaHoy.length > 0 && (
          <div className="tareas-section today">
            <div className="section-header">
              <div className="section-title">
                <span className="section-icon">
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12,6 12,12 16,14" />
                  </svg>
                </span>
                <h2>Para Hoy</h2>
                <span className="count">{tareasParaHoy.length}</span>
              </div>
            </div>
            <div className="tareas-list">
              {tareasParaHoy.map((tarea) => (
                <div key={tarea.periodoId} className="tarea-item">
                  <div className="tarea-checkbox">
                    <input
                      type="checkbox"
                      id={`task-${tarea.periodoId}`}
                      checked={tareasMarcadas.has(tarea.periodoId)}
                      onChange={() => toggleTareaMarcada(tarea.periodoId)}
                    />
                    <label htmlFor={`task-${tarea.periodoId}`}></label>
                  </div>
                  <div className="tarea-content">
                    <div className="tarea-header">
                      <h3 className="tarea-title">{tarea.reporteNombre}</h3>
                      <div className={`tarea-priority ${getPrioridad(tarea)}`}>
                        <svg
                          viewBox="0 0 24 24"
                          width="14"
                          height="14"
                          fill="currentColor"
                        >
                          {getPrioridad(tarea) === "high" && (
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                          )}
                          {getPrioridad(tarea) === "medium" && (
                            <rect x="4" y="4" width="16" height="16" rx="2" />
                          )}
                          {getPrioridad(tarea) === "low" && (
                            <circle cx="12" cy="12" r="8" />
                          )}
                        </svg>
                        {getPrioridad(tarea) === "high"
                          ? "Alta"
                          : getPrioridad(tarea) === "medium"
                            ? "Media"
                            : "Baja"}
                      </div>
                    </div>
                    <p className="tarea-description">
                      {getDescripcionTarea(tarea)}
                    </p>
                    <div className="tarea-meta">
                      <span className="meta-item warning">
                        <svg
                          viewBox="0 0 24 24"
                          width="14"
                          height="14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect
                            x="3"
                            y="4"
                            width="18"
                            height="18"
                            rx="2"
                            ry="2"
                          />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {getTextoFechaVencimiento(tarea)}
                      </span>
                      <span className="meta-item">
                        <svg
                          viewBox="0 0 24 24"
                          width="14"
                          height="14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        </svg>
                        {tarea.entidadNombre}
                      </span>
                    </div>
                  </div>
                  <div className="tarea-actions">
                    <button
                      className="action-btn primary"
                      onClick={() => handleIrAReporte(tarea.periodoId)}
                      title="Ir al reporte"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sección: Pendientes */}
        {tareasPendientesNormales.length > 0 && (
          <div className="tareas-section">
            <div className="section-header">
              <div className="section-title">
                <span className="section-icon">
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                </span>
                <h2>Próximas</h2>
                <span className="count">{tareasPendientesNormales.length}</span>
              </div>
            </div>
            <div className="tareas-list">
              {tareasPendientesNormales.map((tarea) => (
                <div key={tarea.periodoId} className="tarea-item">
                  <div className="tarea-checkbox">
                    <input
                      type="checkbox"
                      id={`task-${tarea.periodoId}`}
                      checked={tareasMarcadas.has(tarea.periodoId)}
                      onChange={() => toggleTareaMarcada(tarea.periodoId)}
                    />
                    <label htmlFor={`task-${tarea.periodoId}`}></label>
                  </div>
                  <div className="tarea-content">
                    <div className="tarea-header">
                      <h3 className="tarea-title">{tarea.reporteNombre}</h3>
                      <div className={`tarea-priority ${getPrioridad(tarea)}`}>
                        <svg
                          viewBox="0 0 24 24"
                          width="14"
                          height="14"
                          fill="currentColor"
                        >
                          {getPrioridad(tarea) === "high" && (
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                          )}
                          {getPrioridad(tarea) === "medium" && (
                            <rect x="4" y="4" width="16" height="16" rx="2" />
                          )}
                          {getPrioridad(tarea) === "low" && (
                            <circle cx="12" cy="12" r="8" />
                          )}
                        </svg>
                        {getPrioridad(tarea) === "high"
                          ? "Alta"
                          : getPrioridad(tarea) === "medium"
                            ? "Media"
                            : "Baja"}
                      </div>
                    </div>
                    <p className="tarea-description">
                      {getDescripcionTarea(tarea)}
                    </p>
                    <div className="tarea-meta">
                      <span className="meta-item">
                        <svg
                          viewBox="0 0 24 24"
                          width="14"
                          height="14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect
                            x="3"
                            y="4"
                            width="18"
                            height="18"
                            rx="2"
                            ry="2"
                          />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {getTextoFechaVencimiento(tarea)}
                      </span>
                      <span className="meta-item">
                        <svg
                          viewBox="0 0 24 24"
                          width="14"
                          height="14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        </svg>
                        {tarea.entidadNombre}
                      </span>
                    </div>
                  </div>
                  <div className="tarea-actions">
                    <button
                      className="action-btn"
                      onClick={() => handleIrAReporte(tarea.periodoId)}
                      title="Ir al reporte"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sección: Completadas */}
        {tareasCompletadas.length > 0 && (
          <div className="tareas-section completed">
            <div className="section-header">
              <div className="section-title">
                <span className="section-icon">
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </span>
                <h2>Completadas</h2>
                <span className="count">{tareasCompletadas.length}</span>
              </div>
            </div>
            <div className="tareas-list">
              {tareasCompletadas.map((tarea) => (
                <div key={tarea.periodoId} className="tarea-item completed">
                  <div className="tarea-checkbox">
                    <input
                      type="checkbox"
                      id={`task-${tarea.periodoId}`}
                      checked={true}
                      disabled
                    />
                    <label htmlFor={`task-${tarea.periodoId}`}></label>
                  </div>
                  <div className="tarea-content">
                    <div className="tarea-header">
                      <h3 className="tarea-title">{tarea.reporteNombre}</h3>
                      <div className="tarea-status success">
                        <svg
                          viewBox="0 0 24 24"
                          width="14"
                          height="14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        {tarea.estado === "APROBADO" ? "Aprobado" : "Enviado"}
                      </div>
                    </div>
                    <p className="tarea-description">
                      {getDescripcionTarea(tarea)}
                    </p>
                    <div className="tarea-meta">
                      <span className="meta-item success">
                        <svg
                          viewBox="0 0 24 24"
                          width="14"
                          height="14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect
                            x="3"
                            y="4"
                            width="18"
                            height="18"
                            rx="2"
                            ry="2"
                          />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {tarea.fechaEnvioReal
                          ? new Date(tarea.fechaEnvioReal).toLocaleDateString(
                              "es-CO"
                            )
                          : "Completado"}
                      </span>
                      <span className="meta-item">
                        <svg
                          viewBox="0 0 24 24"
                          width="14"
                          height="14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        </svg>
                        {tarea.entidadNombre}
                      </span>
                    </div>
                  </div>
                  <div className="tarea-actions">
                    <button
                      className="action-btn"
                      onClick={() => handleIrAReporte(tarea.periodoId)}
                      title="Ver reporte"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mensaje cuando no hay tareas */}
        {tareasFiltradas.length === 0 && (
          <div
            style={{
              padding: "4rem 2rem",
              textAlign: "center",
              color: "var(--neutral-400)",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="64"
              height="64"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              style={{ opacity: 0.5, margin: "0 auto 1rem" }}
            >
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <p style={{ fontSize: "0.875rem" }}>
              {filtroActivo === "todas" && "No tienes tareas asignadas"}
              {filtroActivo === "pendientes" && "No tienes tareas pendientes"}
              {filtroActivo === "completadas" && "No tienes tareas completadas"}
              {filtroActivo === "vencidas" && "No tienes tareas vencidas"}
            </p>
          </div>
        )}
      </div>

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
          align-items: flex-start;
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

        .header-stats {
          display: flex;
          gap: 0.75rem;
        }

        .stat-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.75rem 1.25rem;
          border-radius: 10px;
          min-width: 80px;
        }

        .stat-badge.pending {
          background: var(--warning-yellow-100);
        }

        .stat-badge.today {
          background: var(--color-primary-100);
        }

        .stat-number {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .stat-badge.pending .stat-number { color: var(--warning-yellow-700); }
        .stat-badge.today .stat-number { color: var(--color-primary-700); }

        .stat-label {
          font-size: 0.6875rem;
          color: var(--neutral-600);
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .quick-filters {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .filter-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          background: white;
          border: 1px solid var(--neutral-200);
          border-radius: 8px;
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--neutral-600);
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-btn:hover {
          background: var(--neutral-100);
        }

        .filter-btn.active {
          background: var(--role-accent);
          border-color: var(--role-accent);
          color: var(--neutral-900);
        }

        .filter-btn svg {
          opacity: 0.7;
        }

        .tareas-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .tareas-section {
          background: white;
          border-radius: 12px;
          box-shadow: var(--shadow-card);
          overflow: hidden;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--neutral-100);
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .section-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
        }

        .tareas-section.overdue .section-icon {
          background: var(--error-red-100);
          color: var(--error-red-600);
        }

        .tareas-section.today .section-icon {
          background: var(--warning-yellow-100);
          color: var(--warning-yellow-600);
        }

        .tareas-section.completed .section-icon {
          background: var(--success-green-100);
          color: var(--success-green-600);
        }

        .section-title h2 {
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--neutral-800);
          margin: 0;
        }

        .section-title .count {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--neutral-500);
          padding: 0.125rem 0.5rem;
          background: var(--neutral-100);
          border-radius: 10px;
        }

        .tareas-list {
          padding: 0.5rem;
        }

        .tarea-item {
          display: flex;
          align-items: flex-start;
          gap: 0.875rem;
          padding: 1rem;
          border-radius: 8px;
          transition: background 0.2s;
        }

        .tarea-item:hover {
          background: var(--neutral-50);
        }

        .tarea-item.overdue {
          background: var(--error-red-50);
          border-left: 3px solid var(--error-red-500);
        }

        .tarea-item.completed {
          opacity: 0.8;
        }

        .tarea-checkbox {
          flex-shrink: 0;
          margin-top: 0.125rem;
        }

        .tarea-checkbox input {
          display: none;
        }

        .tarea-checkbox label {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border: 2px solid var(--neutral-300);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tarea-checkbox label:hover {
          border-color: var(--role-accent);
        }

        .tarea-checkbox input:checked + label {
          background: var(--success-green-500);
          border-color: var(--success-green-500);
        }

        .tarea-checkbox input:checked + label::after {
          content: '✓';
          color: white;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .tarea-content {
          flex: 1;
          min-width: 0;
        }

        .tarea-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 0.25rem;
        }

        .tarea-title {
          font-size: 0.9375rem;
          font-weight: 500;
          color: var(--neutral-800);
          margin: 0;
        }

        .tarea-priority {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.125rem 0.5rem;
          border-radius: 4px;
          font-size: 0.6875rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .tarea-priority.high {
          background: var(--error-red-100);
          color: var(--error-red-700);
        }

        .tarea-priority.medium {
          background: var(--warning-yellow-100);
          color: var(--warning-yellow-700);
        }

        .tarea-priority.low {
          background: var(--neutral-100);
          color: var(--neutral-600);
        }

        .tarea-status {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.125rem 0.5rem;
          border-radius: 4px;
          font-size: 0.6875rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .tarea-status.success {
          background: var(--success-green-100);
          color: var(--success-green-700);
        }

        .tarea-description {
          font-size: 0.8125rem;
          color: var(--neutral-600);
          margin: 0 0 0.5rem;
          line-height: 1.4;
        }

        .tarea-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.75rem;
          color: var(--neutral-500);
        }

        .meta-item svg {
          opacity: 0.7;
        }

        .meta-item.danger {
          color: var(--error-red-600);
        }

        .meta-item.warning {
          color: var(--warning-yellow-700);
        }

        .meta-item.success {
          color: var(--success-green-600);
        }

        .tarea-actions {
          display: flex;
          gap: 0.375rem;
          flex-shrink: 0;
        }

        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border: 1px solid var(--neutral-200);
          border-radius: 6px;
          background: white;
          color: var(--neutral-500);
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: var(--neutral-100);
          color: var(--neutral-700);
        }

        .action-btn.primary {
          background: var(--role-accent);
          border-color: var(--role-accent);
          color: var(--neutral-900);
        }

        .action-btn.primary:hover {
          background: var(--role-accent-dark);
        }
      `}</style>
    </div>
  );
}
