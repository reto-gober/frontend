import { useState, useEffect } from "react";
import {
  flujoReportesService,
  archivosService,
  type ReportePeriodo,
  type Page,
  type ArchivoDTO,
} from "../../lib/services";
import { ModalValidarReporte } from "../modales/ModalValidarReporte";
import FileViewer from "../reportes/FileViewer";

type TabStatus =
  | "all"
  | "pendiente_validacion"
  | "aprobado"
  | "requiere_correccion"
  | "enviado";

interface ResponsableOption {
  id: string;
  nombre: string;
}

interface EntidadOption {
  id: string;
  nombre: string;
}

export default function SupervisorReportesClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportes, setReportes] = useState<ReportePeriodo[]>([]);
  const [todosLosReportes, setTodosLosReportes] = useState<ReportePeriodo[]>(
    []
  ); // Guardar todos para filtros
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [size] = useState(12);
  const [highlightReporteId, setHighlightReporteId] = useState<string | null>(
    null
  );

  // Filtros
  const [activeTab, setActiveTab] = useState<TabStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroResponsable, setFiltroResponsable] = useState("");
  const [filtroEntidad, setFiltroEntidad] = useState("");

  // Datos para filtros - extraídos de los reportes
  const [responsables, setResponsables] = useState<ResponsableOption[]>([]);
  const [entidades, setEntidades] = useState<EntidadOption[]>([]);

  // Modal
  const [modalValidar, setModalValidar] = useState<{
    open: boolean;
    periodo: ReportePeriodo | null;
  }>({
    open: false,
    periodo: null,
  });
  const [detalle, setDetalle] = useState<{
    open: boolean;
    periodo: ReportePeriodo | null;
  }>({
    open: false,
    periodo: null,
  });
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Estados para archivos del modal de detalle
  const [archivosDetalle, setArchivosDetalle] = useState<ArchivoDTO[]>([]);
  const [cargandoArchivosDetalle, setCargandoArchivosDetalle] = useState(false);

  // Estado para el visor de archivos
  const [archivoViewer, setArchivoViewer] = useState<{
    open: boolean;
    archivo: ArchivoDTO | null;
    periodoId: string | null;
  }>({
    open: false,
    archivo: null,
    periodoId: null,
  });

  // Contadores por tab
  const [contadores, setContadores] = useState({
    all: 0,
    pendiente_validacion: 0,
    aprobado: 0,
    requiere_correccion: 0,
    enviado: 0,
  });

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resaltar = params.get("resaltarReporte");
    if (resaltar) {
      setHighlightReporteId(resaltar);
      setActiveTab("all");
      setSearchTerm("");
      setFiltroResponsable("");
      setFiltroEntidad("");
      setPage(0);

      const url = new URL(window.location.href);
      url.searchParams.delete("resaltarReporte");
      url.searchParams.delete("reporteNombre");
      window.history.replaceState({}, "", url);

      setTimeout(() => setHighlightReporteId(null), 4500);
      const target = document.getElementById(`reporte-${resaltar}`);
      if (target)
        target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  useEffect(() => {
    cargarReportes();
  }, [page, activeTab, filtroResponsable, filtroEntidad]);

  // Recalcular contadores cuando cambien los filtros o reportes
  useEffect(() => {
    if (todosLosReportes.length > 0 && !loading) {
      // Aplicar solo filtros de responsable y entidad para contadores (no búsqueda de texto)
      let reportesParaContadores = [...todosLosReportes];

      if (filtroResponsable) {
        reportesParaContadores = reportesParaContadores.filter(
          (r) => r.responsableElaboracion?.usuarioId === filtroResponsable
        );
      }

      if (filtroEntidad) {
        reportesParaContadores = reportesParaContadores.filter(
          (r) => r.entidadNombre === filtroEntidad
        );
      }

      actualizarContadores(reportesParaContadores);
    }
  }, [filtroResponsable, filtroEntidad, todosLosReportes, loading]);

  const aplicarFiltrosLocales = (
    reportesBase: ReportePeriodo[]
  ): ReportePeriodo[] => {
    let resultado = [...reportesBase];

    // Aplicar filtro de búsqueda
    if (searchTerm) {
      const termino = searchTerm.toLowerCase();
      resultado = resultado.filter(
        (r) =>
          r.reporteNombre?.toLowerCase().includes(termino) ||
          r.entidadNombre?.toLowerCase().includes(termino) ||
          r.responsableElaboracion?.nombreCompleto
            ?.toLowerCase()
            .includes(termino) ||
          r.frecuencia?.toLowerCase().includes(termino) ||
          getEstadoBadge(r.estado).texto.toLowerCase().includes(termino)
      );
    }

    return resultado;
  };

  // Cargar archivos cuando se abre el modal de detalle
  useEffect(() => {
    if (detalle.open && detalle.periodo) {
      cargarArchivosDetalle(detalle.periodo.periodoId);
    } else {
      setArchivosDetalle([]);
    }
  }, [detalle.open, detalle.periodo]);

  const cargarArchivosDetalle = async (periodoId: string) => {
    setCargandoArchivosDetalle(true);
    try {
      const response =
        await archivosService.obtenerArchivosPorPeriodo(periodoId);
      setArchivosDetalle(response.archivos || []);
    } catch (err) {
      console.error("Error cargando archivos:", err);
      setArchivosDetalle([]);
    } finally {
      setCargandoArchivosDetalle(false);
    }
  };

  const handleVisualizarArchivoDetalle = async (
    periodoId: string,
    archivoId: string
  ) => {
    const archivo = archivosDetalle.find((a) => a.archivoId === archivoId);
    if (archivo) {
      setArchivoViewer({ open: true, archivo, periodoId });
    }
  };

  const handleDescargarArchivoDetalle = async (
    periodoId: string,
    archivoId: string,
    nombreArchivo: string
  ) => {
    try {
      await archivosService.descargarArchivo(
        periodoId,
        archivoId,
        nombreArchivo
      );
    } catch (err) {
      console.error("Error al descargar el archivo");
    }
  };

  const cargarDatosIniciales = async () => {
    try {
      // Cargar todos los reportes para extraer filtros y contadores
      const todosData = await flujoReportesService.supervisionSupervisor(
        0,
        1000
      );
      const todos = todosData.content;

      setTodosLosReportes(todos);

      // Extraer responsables únicos de los reportes
      const responsablesUnicos = new Map<string, string>();
      todos.forEach((r) => {
        if (
          r.responsableElaboracion?.usuarioId &&
          r.responsableElaboracion?.nombreCompleto
        ) {
          responsablesUnicos.set(
            r.responsableElaboracion.usuarioId,
            r.responsableElaboracion.nombreCompleto
          );
        }
      });
      setResponsables(
        Array.from(responsablesUnicos.entries()).map(([id, nombre]) => ({
          id,
          nombre,
        }))
      );

      // Extraer entidades únicas de los reportes (usar entidadNombre como clave)
      const entidadesUnicas = new Set<string>();
      todos.forEach((r) => {
        if (r.entidadNombre) {
          entidadesUnicas.add(r.entidadNombre);
        }
      });
      setEntidades(
        Array.from(entidadesUnicas).map((nombre) => ({ id: nombre, nombre }))
      );

      actualizarContadores(todos);
    } catch (err) {
      console.error("Error al cargar datos iniciales:", err);
    }
  };

  const actualizarContadores = (reportes: ReportePeriodo[]) => {
    // Calcular contadores - incluir nuevo estado pendiente_revision
    setContadores({
      all: reportes.length,
      pendiente_validacion: reportes.filter((r) =>
        [
          "pendiente_validacion",
          "PENDIENTE_VALIDACION",
          "pendiente_revision",
          "PENDIENTE_REVISION",
        ].includes(r.estado)
      ).length,
      aprobado: reportes.filter((r) =>
        ["aprobado", "APROBADO"].includes(r.estado)
      ).length,
      requiere_correccion: reportes.filter((r) =>
        [
          "requiere_correccion",
          "REQUIERE_CORRECCION",
          "corregir",
          "CORREGIR",
        ].includes(r.estado)
      ).length,
      enviado: reportes.filter((r) => ["enviado", "ENVIADO"].includes(r.estado))
        .length,
    });
  };

  const cargarReportes = async () => {
    try {
      setLoading(true);
      setError(null);

      // Si no hay datos iniciales cargados, cargarlos primero
      let reportesBase = todosLosReportes;
      if (reportesBase.length === 0) {
        const data = await flujoReportesService.supervisionSupervisor(0, 1000);
        reportesBase = data.content;
        setTodosLosReportes(reportesBase);
      }

      let reportesFiltrados = [...reportesBase];

      // Aplicar filtro por estado (tab activo)
      if (activeTab !== "all") {
        if (activeTab === "pendiente_validacion") {
          reportesFiltrados = reportesFiltrados.filter((r) =>
            [
              "pendiente_validacion",
              "PENDIENTE_VALIDACION",
              "pendiente_revision",
              "PENDIENTE_REVISION",
            ].includes(r.estado)
          );
        } else if (activeTab === "aprobado") {
          reportesFiltrados = reportesFiltrados.filter((r) =>
            ["aprobado", "APROBADO"].includes(r.estado)
          );
        } else if (activeTab === "requiere_correccion") {
          reportesFiltrados = reportesFiltrados.filter((r) =>
            [
              "requiere_correccion",
              "REQUIERE_CORRECCION",
              "corregir",
              "CORREGIR",
            ].includes(r.estado)
          );
        } else if (activeTab === "enviado") {
          reportesFiltrados = reportesFiltrados.filter((r) =>
            ["enviado", "ENVIADO"].includes(r.estado)
          );
        }
      }

      // Aplicar filtro por responsable
      if (filtroResponsable) {
        reportesFiltrados = reportesFiltrados.filter(
          (r) => r.responsableElaboracion?.usuarioId === filtroResponsable
        );
      }

      // Aplicar filtro por entidad
      if (filtroEntidad) {
        reportesFiltrados = reportesFiltrados.filter(
          (r) => r.entidadNombre === filtroEntidad
        );
      }

      // Actualizar contadores basados en los reportes filtrados (sin búsqueda de texto)
      actualizarContadores(reportesFiltrados);

      // Aplicar paginación manual
      const inicio = page * size;
      const fin = inicio + size;
      const reportesPaginados = reportesFiltrados.slice(inicio, fin);

      setReportes(reportesPaginados);
      setTotalElements(reportesFiltrados.length);
    } catch (err: any) {
      console.error("Error al cargar reportes:", err);
      setError(err.response?.data?.message || "Error al cargar los reportes");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: TabStatus) => {
    setActiveTab(tab);
    setPage(0);
  };

  const handleValidacionSuccess = () => {
    setToastMessage({
      type: "success",
      message: "Reporte validado exitosamente",
    });
    setModalValidar({ open: false, periodo: null });
    cargarReportes();
    cargarDatosIniciales();
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleValidacionError = (message: string) => {
    setToastMessage({ type: "error", message });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const calcularDiasRestantes = (
    fechaVencimiento: string
  ): { dias: number; urgencia: string } => {
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diffTime = vencimiento.getTime() - hoy.getTime();
    const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let urgencia = "normal";
    if (dias < 0) urgencia = "vencido";
    else if (dias === 0) urgencia = "hoy";
    else if (dias <= 3) urgencia = "urgente";
    else if (dias <= 7) urgencia = "proximo";

    return { dias, urgencia };
  };

  const formatearFechaCorta = (fecha: string): string => {
    return new Date(fecha).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
    });
  };

  const getEstadoBadge = (estado: string) => {
    const estados: Record<string, { clase: string; texto: string }> = {
      pendiente_revision: { clase: "pending", texto: "Pendiente Revisión" },
      PENDIENTE_REVISION: { clase: "pending", texto: "Pendiente Revisión" },
      pendiente_validacion: { clase: "pending", texto: "Pendiente Revisión" },
      PENDIENTE_VALIDACION: { clase: "pending", texto: "Pendiente Revisión" },
      en_revision: { clase: "warning", texto: "En Revisión" },
      EN_REVISION: { clase: "warning", texto: "En Revisión" },
      aprobado: { clase: "success", texto: "Aprobado" },
      APROBADO: { clase: "success", texto: "Aprobado" },
      corregir: { clase: "danger", texto: "Requiere Corrección" },
      CORREGIR: { clase: "danger", texto: "Requiere Corrección" },
      requiere_correccion: { clase: "danger", texto: "Requiere Corrección" },
      REQUIERE_CORRECCION: { clase: "danger", texto: "Requiere Corrección" },
      rechazado: { clase: "rejected", texto: "Rechazado" },
      RECHAZADO: { clase: "rejected", texto: "Rechazado" },
      enviado: { clase: "sent", texto: "Enviado a Entidad" },
      ENVIADO: { clase: "sent", texto: "Enviado a Entidad" },
    };
    return estados[estado] || { clase: "neutral", texto: estado };
  };

  const filtrarPorBusqueda = (reportes: ReportePeriodo[]): ReportePeriodo[] => {
    if (!searchTerm) return reportes;
    const termino = searchTerm.toLowerCase();
    return reportes.filter(
      (r) =>
        r.reporteNombre?.toLowerCase().includes(termino) ||
        r.entidadNombre?.toLowerCase().includes(termino) ||
        r.responsableElaboracion?.nombreCompleto
          ?.toLowerCase()
          .includes(termino) ||
        r.frecuencia?.toLowerCase().includes(termino) ||
        getEstadoBadge(r.estado).texto.toLowerCase().includes(termino)
    );
  };

  const reportesFiltrados = filtrarPorBusqueda(reportes);

  if (error && reportes.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        <p style={{ color: "var(--error-red-600)" }}>{error}</p>
        <button
          onClick={cargarReportes}
          className="btn-primary"
          style={{ marginTop: "1rem" }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="reportes-page">
      {/* Toast de notificación */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            top: "1rem",
            right: "1rem",
            padding: "1rem 1.5rem",
            borderRadius: "8px",
            backgroundColor:
              toastMessage.type === "success"
                ? "var(--success-green-500)"
                : "var(--error-red-500)",
            color: "white",
            zIndex: 1001,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          {toastMessage.message}
        </div>
      )}

      {/* Contenedor principal centrado */}
      <div className="reportes-container">
        {/* SECCIÓN: Filtros y Acciones */}
        <div className="seccion-filtros">
          <div className="filtros-card">
            {/* Fila 1: Chips de Estado */}
            <div className="chips-estados">
              <button
                className={`chip-estado ${activeTab === "all" ? "active" : ""}`}
                onClick={() => handleTabChange("all")}
              >
                <span className="chip-label">Todos</span>
                <span className="chip-count">{contadores.all}</span>
              </button>
              <button
                className={`chip-estado ${activeTab === "pendiente_validacion" ? "active" : ""}`}
                onClick={() => handleTabChange("pendiente_validacion")}
              >
                <span className="chip-label">Pendientes Revisión</span>
                <span className="chip-count warning">
                  {contadores.pendiente_validacion}
                </span>
              </button>
              <button
                className={`chip-estado ${activeTab === "aprobado" ? "active" : ""}`}
                onClick={() => handleTabChange("aprobado")}
              >
                <span className="chip-label">Aprobados</span>
                <span className="chip-count success">
                  {contadores.aprobado}
                </span>
              </button>
              <button
                className={`chip-estado ${activeTab === "requiere_correccion" ? "active" : ""}`}
                onClick={() => handleTabChange("requiere_correccion")}
              >
                <span className="chip-label">Con Observaciones</span>
                <span className="chip-count danger">
                  {contadores.requiere_correccion}
                </span>
              </button>
              <button
                className={`chip-estado ${activeTab === "enviado" ? "active" : ""}`}
                onClick={() => handleTabChange("enviado")}
              >
                <span className="chip-label">Enviados a Entidad</span>
                <span className="chip-count sent">{contadores.enviado}</span>
              </button>
            </div>

            {/* Separador */}
            <div className="filtros-separador"></div>

            {/* Fila 2: Búsqueda y Filtros */}
            <div className="fila-busqueda">
              <div className="search-box-principal">
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar por reporte, responsable o entidad..."
                  className="search-input-principal"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="filtros-secundarios">
                <select
                  className="filter-select-mejorado"
                  value={filtroResponsable}
                  onChange={(e) => {
                    setFiltroResponsable(e.target.value);
                    setPage(0);
                  }}
                >
                  <option value="">Todos los Responsables</option>
                  {responsables.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre}
                    </option>
                  ))}
                </select>
                <select
                  className="filter-select-mejorado"
                  value={filtroEntidad}
                  onChange={(e) => {
                    setFiltroEntidad(e.target.value);
                    setPage(0);
                  }}
                >
                  <option value="">Todas las Entidades</option>
                  {entidades.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: Lista de Reportes */}
        <div className="seccion-reportes">
          {/* Loading State */}
          {loading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-text">Cargando reportes...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && reportesFiltrados.length === 0 && (
            <div className="empty-state">
              <svg
                viewBox="0 0 24 24"
                width="64"
                height="64"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <p className="empty-text">
                No hay reportes{" "}
                {activeTab !== "all" ? "con este estado" : "disponibles"}
              </p>
            </div>
          )}

          {/* Reports Grid Mejorado */}
          {!loading && reportesFiltrados.length > 0 && (
            <div className="reports-grid-mejorado">
              {reportesFiltrados.map((reporte) => {
                const { dias, urgencia } = calcularDiasRestantes(
                  reporte.fechaVencimientoCalculada
                );
                const estadoBadge = getEstadoBadge(reporte.estado);
                const puedeValidar = [
                  "pendiente_validacion",
                  "PENDIENTE_VALIDACION",
                ].includes(reporte.estado);
                const isHighlighted =
                  highlightReporteId === reporte.reporteId ||
                  highlightReporteId === reporte.periodoId;

                return (
                  <div
                    key={reporte.periodoId}
                    id={`reporte-${reporte.periodoId}`}
                    className="report-card-mejorada"
                    style={
                      isHighlighted
                        ? {
                            outline: "2px solid var(--accent-color, #10b981)",
                            outlineOffset: "2px",
                            background: "rgba(16, 185, 129, 0.08)",
                          }
                        : undefined
                    }
                  >
                    {/* Barra superior de estado */}
                    <div
                      className={`card-barra-estado ${estadoBadge.clase}`}
                    ></div>

                    {/* Header Compacto */}
                    <div className="card-header-mejorado">
                      <div className="card-info-superior">
                        <h3 className="card-titulo-mejorado">
                          {reporte.reporteNombre}
                        </h3>
                        <span
                          className={`badge-estado-mejorado ${estadoBadge.clase}`}
                        >
                          {estadoBadge.texto}
                        </span>
                      </div>
                      <div className="card-meta-superior">
                        <span className="meta-frecuencia">
                          {reporte.periodoTipo}
                        </span>
                        <span className="meta-separador">•</span>
                        <span className={`meta-vencimiento ${urgencia}`}>
                          {urgencia === "vencido"
                            ? `Vencido hace ${Math.abs(dias)}d`
                            : urgencia === "hoy"
                              ? "Vence hoy"
                              : urgencia === "urgente"
                                ? `Vence en ${dias}d`
                                : `Vence ${formatearFechaCorta(reporte.fechaVencimientoCalculada)}`}
                        </span>
                      </div>
                    </div>

                    {/* Body Compacto */}
                    <div className="card-body-mejorado">
                      {/* Información clave */}
                      <div className="info-clave">
                        <div className="info-item">
                          <svg
                            viewBox="0 0 24 24"
                            width="16"
                            height="16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                          </svg>
                          <span className="info-label">Entidad:</span>
                          <span className="info-value">
                            {reporte.entidadNombre}
                          </span>
                        </div>

                        <div className="info-item">
                          <svg
                            viewBox="0 0 24 24"
                            width="16"
                            height="16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          <span className="info-label">Responsable:</span>
                          <span className="info-value">
                            {reporte.responsableElaboracion?.nombreCompleto ||
                              "Sin asignar"}
                          </span>
                        </div>

                        {typeof reporte.diasDesviacion === "number" &&
                          reporte.diasDesviacion !== 0 && (
                            <div className="info-item">
                              <svg
                                viewBox="0 0 24 24"
                                width="16"
                                height="16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                              <span className="info-label">Desviación:</span>
                              <span
                                className={`info-value ${reporte.diasDesviacion > 0 ? "negativo" : "positivo"}`}
                              >
                                {reporte.diasDesviacion > 0 ? "+" : ""}
                                {reporte.diasDesviacion} días
                              </span>
                            </div>
                          )}

                        {reporte.cantidadArchivos > 0 && (
                          <div className="info-item">
                            <svg
                              viewBox="0 0 24 24"
                              width="16"
                              height="16"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                            </svg>
                            <span className="info-value evidencias">
                              {reporte.cantidadArchivos} archivo
                              {reporte.cantidadArchivos > 1 ? "s" : ""}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Compacto */}
                    <div className="card-footer-mejorado">
                      {puedeValidar ? (
                        <button
                          className="btn-revisar-mejorado btn-primary-action"
                          onClick={() =>
                            setModalValidar({ open: true, periodo: reporte })
                          }
                        >
                          <svg
                            viewBox="0 0 24 24"
                            width="16"
                            height="16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="9 11 12 14 22 4" />
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                          </svg>
                          Revisar
                        </button>
                      ) : (
                        <button
                          className="btn-detalle-mejorado"
                          onClick={() =>
                            setDetalle({ open: true, periodo: reporte })
                          }
                        >
                          <svg
                            viewBox="0 0 24 24"
                            width="16"
                            height="16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          Ver Detalle
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Paginación Mejorada */}
          {!loading && totalElements > size && (
            <div className="paginacion-mejorada">
              <button
                className="btn-pag"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Anterior
              </button>
              <div className="pag-info">
                <span className="pag-actual">Página {page + 1}</span>
                <span className="pag-separador">de</span>
                <span className="pag-total">
                  {Math.ceil(totalElements / size)}
                </span>
              </div>
              <button
                className="btn-pag"
                disabled={(page + 1) * size >= totalElements}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Detalle Ultra Mejorado CON DISEÑO DE 2 COLUMNAS */}
      {detalle.open && detalle.periodo && (
        <div
          className="modal-overlay-mejorado"
          onClick={() => setDetalle({ open: false, periodo: null })}
        >
          <div
            className="modal-detalle-dos-columnas"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Mejorado */}
            <div className="modal-header-dos-col">
              <div className="header-left-dos-col">
                <div className="icon-reporte-grande">
                  <svg
                    viewBox="0 0 24 24"
                    width="28"
                    height="28"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div className="header-info-dos-col">
                  <h2 className="titulo-modal-dos-col">
                    {detalle.periodo.reporteNombre || "Reporte"}
                  </h2>
                  <p className="subtitulo-modal-dos-col">
                    {detalle.periodo.periodoTipo} ·{" "}
                    {detalle.periodo.periodoInicio}
                  </p>
                </div>
              </div>
              <div className="header-right-dos-col">
                <span
                  className={`badge-estado-modal ${getEstadoBadge(detalle.periodo.estado).clase}`}
                >
                  {getEstadoBadge(detalle.periodo.estado).texto}
                </span>
                <button
                  className="btn-close-modal"
                  onClick={() => setDetalle({ open: false, periodo: null })}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body con 2 Columnas */}
            <div className="modal-body-dos-col">
              {/* Columna Izquierda */}
              <div className="columna-izq">
                {/* Tarjeta Fechas del Período */}
                <div className="tarjeta-modal">
                  <div className="tarjeta-header-modal">
                    <div className="icono-tarjeta naranja">
                      <svg
                        viewBox="0 0 24 24"
                        width="20"
                        height="20"
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
                    </div>
                    <h3 className="titulo-tarjeta-modal">Fechas del Período</h3>
                  </div>
                  <div className="tarjeta-body-modal">
                    <div className="dato-fila">
                      <span className="dato-label">Inicio:</span>
                      <span className="dato-value">
                        {detalle.periodo.periodoInicio || "-"}
                      </span>
                    </div>
                    <div className="dato-fila">
                      <span className="dato-label">Fin:</span>
                      <span className="dato-value">
                        {detalle.periodo.periodoFin || "-"}
                      </span>
                    </div>
                    <div className="dato-fila">
                      <span className="dato-label">Vencimiento:</span>
                      <span className="dato-value destaque-naranja">
                        {detalle.periodo.fechaVencimientoCalculada || "-"}
                      </span>
                    </div>
                    {detalle.periodo.fechaEnvioReal && (
                      <div className="dato-fila">
                        <span className="dato-label">Enviado:</span>
                        <span className="dato-value destaque-verde">
                          {detalle.periodo.fechaEnvioReal}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tarjeta Archivos - Separando Reporte y Evidencias */}
                <div className="tarjeta-modal">
                  <div className="tarjeta-header-modal">
                    <div className="icono-tarjeta verde">
                      <svg
                        viewBox="0 0 24 24"
                        width="20"
                        height="20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                      </svg>
                    </div>
                    <h3 className="titulo-tarjeta-modal">Archivos</h3>
                  </div>
                  <div className="tarjeta-body-modal">
                    {cargandoArchivosDetalle ? (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "2rem",
                          color: "var(--color-text-light)",
                        }}
                      >
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          style={{
                            animation: "spin 1s linear infinite",
                            display: "inline-block",
                            marginBottom: "0.5rem",
                          }}
                        >
                          <line x1="12" y1="2" x2="12" y2="6"></line>
                          <line x1="12" y1="18" x2="12" y2="22"></line>
                          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                          <line
                            x1="16.24"
                            y1="16.24"
                            x2="19.07"
                            y2="19.07"
                          ></line>
                          <line x1="2" y1="12" x2="6" y2="12"></line>
                          <line x1="18" y1="12" x2="22" y2="12"></line>
                          <line
                            x1="4.93"
                            y1="19.07"
                            x2="7.76"
                            y2="16.24"
                          ></line>
                          <line
                            x1="16.24"
                            y1="7.76"
                            x2="19.07"
                            y2="4.93"
                          ></line>
                        </svg>
                        <p>Cargando archivos...</p>
                      </div>
                    ) : (
                      <div className="archivo-seccion">
                        <div className="archivo-seccion-header">
                          <svg
                            viewBox="0 0 24 24"
                            width="16"
                            height="16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                          </svg>
                          <span className="archivo-seccion-titulo">
                            Archivos Adjuntos
                          </span>
                        </div>
                        {archivosDetalle.length > 0 ? (
                          <div
                            style={{
                              maxHeight: "300px",
                              overflowY: "auto",
                              border: "1px solid #e5e7eb",
                              borderRadius: "8px",
                            }}
                          >
                            {archivosDetalle.map((archivo, index) => (
                              <div
                                key={archivo.archivoId}
                                style={{
                                  padding: "0.75rem",
                                  borderBottom:
                                    index < archivosDetalle.length - 1
                                      ? "1px solid #e5e7eb"
                                      : "none",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  backgroundColor: "white",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.75rem",
                                    flex: 1,
                                    minWidth: 0,
                                  }}
                                >
                                  <svg
                                    viewBox="0 0 24 24"
                                    width="20"
                                    height="20"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                                    <polyline points="13 2 13 9 20 9" />
                                  </svg>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                      style={{
                                        fontWeight: 500,
                                        fontSize: "0.875rem",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {archivo.nombreOriginal}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "0.75rem",
                                        color: "var(--color-text-light)",
                                        marginTop: "0.25rem",
                                      }}
                                    >
                                      {(archivo.tamanoBytes / 1024).toFixed(2)}{" "}
                                      KB
                                    </div>
                                  </div>
                                </div>
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                  <button
                                    onClick={() =>
                                      handleVisualizarArchivoDetalle(
                                        detalle.periodo!.periodoId,
                                        archivo.archivoId
                                      )
                                    }
                                    style={{
                                      padding: "0.5rem",
                                      border: "1px solid #d1d5db",
                                      borderRadius: "6px",
                                      background: "white",
                                      cursor: "pointer",
                                    }}
                                    title="Ver archivo"
                                  >
                                    <svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    >
                                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                      <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDescargarArchivoDetalle(
                                        detalle.periodo!.periodoId,
                                        archivo.archivoId,
                                        archivo.nombreOriginal
                                      )
                                    }
                                    style={{
                                      padding: "0.5rem",
                                      border: "1px solid #d1d5db",
                                      borderRadius: "6px",
                                      background: "white",
                                      cursor: "pointer",
                                    }}
                                    title="Descargar archivo"
                                  >
                                    <svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    >
                                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                      <polyline points="7 10 12 15 17 10"></polyline>
                                      <line
                                        x1="12"
                                        y1="15"
                                        x2="12"
                                        y2="3"
                                      ></line>
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="evidencias-vacio">
                            <span className="vacio-icono-info">ℹ</span>
                            <span>No hay archivos adjuntos</span>
                          </div>
                        )}
                      </div>
                    )}

                    {typeof detalle.periodo.diasDesviacion === "number" && (
                      <div
                        className="dato-fila"
                        style={{
                          marginTop: "1rem",
                          paddingTop: "1rem",
                          borderTop: "1px solid #e2e8f0",
                        }}
                      >
                        <span className="dato-label">Desviación:</span>
                        <span
                          className={`dato-value ${detalle.periodo.diasDesviacion > 0 ? "destaque-rojo" : "destaque-verde"}`}
                        >
                          {detalle.periodo.diasDesviacion > 0 ? "+" : ""}
                          {detalle.periodo.diasDesviacion} días
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Columna Derecha */}
              <div className="columna-der">
                {/* Tarjeta Equipo Responsable */}
                <div className="tarjeta-modal">
                  <div className="tarjeta-header-modal">
                    <div className="icono-tarjeta azul">
                      <svg
                        viewBox="0 0 24 24"
                        width="20"
                        height="20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </div>
                    <h3 className="titulo-tarjeta-modal">Equipo Responsable</h3>
                  </div>
                  <div className="tarjeta-body-modal">
                    <div className="responsable-item">
                      <div className="avatar-responsable elabora">E</div>
                      <div className="responsable-datos">
                        <div className="responsable-rol">Elabora</div>
                        <div className="responsable-nombre">
                          {detalle.periodo.responsableElaboracion
                            ?.nombreCompleto || "Sin asignar"}
                        </div>
                      </div>
                    </div>
                    <div className="responsable-item">
                      <div className="avatar-responsable supervisa">S</div>
                      <div className="responsable-datos">
                        <div className="responsable-rol">Supervisa</div>
                        <div className="responsable-nombre">
                          {detalle.periodo.responsableSupervision
                            ?.nombreCompleto || "Sin asignar"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tarjeta Info Adicional */}
                {detalle.periodo.entidadNombre && (
                  <div className="tarjeta-modal">
                    <div className="tarjeta-header-modal">
                      <div className="icono-tarjeta gris">
                        <svg
                          viewBox="0 0 24 24"
                          width="20"
                          height="20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        </svg>
                      </div>
                      <h3 className="titulo-tarjeta-modal">Entidad</h3>
                    </div>
                    <div className="tarjeta-body-modal">
                      <div className="entidad-nombre-grande">
                        {detalle.periodo.entidadNombre}
                      </div>
                    </div>
                  </div>
                )}

                {/* Comentarios (si existen) */}
                {detalle.periodo.comentarios && (
                  <div className="tarjeta-modal">
                    <div className="tarjeta-header-modal">
                      <div className="icono-tarjeta morado">
                        <svg
                          viewBox="0 0 24 24"
                          width="20"
                          height="20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      </div>
                      <h3 className="titulo-tarjeta-modal">Comentarios</h3>
                    </div>
                    <div className="tarjeta-body-modal">
                      {detalle.periodo.comentarios &&
                      detalle.periodo.comentarios.length > 0 ? (
                        <div className="comentarios-lista">
                          {detalle.periodo.comentarios.map(
                            (comentario, idx) => (
                              <div key={idx} className="comentario-item">
                                <div className="comentario-header">
                                  {comentario.autor} · {comentario.cargo} ·{" "}
                                  {comentario.fecha}
                                </div>
                                <div className="comentario-accion">
                                  {comentario.accion}
                                </div>
                                <div className="comentario-texto">
                                  {comentario.texto}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <p style={{ color: "#64748b" }}>Sin comentarios</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Fijo Inferior */}
            <div className="modal-footer-fijo">
              <button
                className="btn-modal-secundario"
                onClick={() => setDetalle({ open: false, periodo: null })}
              >
                Cerrar
              </button>
              {[
                "pendiente_validacion",
                "PENDIENTE_VALIDACION",
                "pendiente_revision",
                "PENDIENTE_REVISION",
              ].includes(detalle.periodo.estado) && (
                <button
                  className="btn-modal-primario"
                  onClick={() => {
                    setModalValidar({ open: true, periodo: detalle.periodo });
                    setDetalle({ open: false, periodo: null });
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="9 11 12 14 22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                  Revisar Reporte
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Validación */}
      {modalValidar.open && modalValidar.periodo && (
        <ModalValidarReporte
          isOpen={modalValidar.open}
          onClose={() => setModalValidar({ open: false, periodo: null })}
          periodoId={modalValidar.periodo.periodoId}
          reporteNombre={modalValidar.periodo.reporteNombre}
          responsable={
            modalValidar.periodo.responsableElaboracion?.nombreCompleto ||
            "Sin asignar"
          }
          onSuccess={handleValidacionSuccess}
          onError={handleValidacionError}
        />
      )}

      <style>{`
        /* ================================================ */
        /* DISEÑO MEJORADO - VISTA PRINCIPAL REPORTES */
        /* Max-width 1200px, Filtros en tarjeta, Grid 3 columnas */
        /* ================================================ */

        .reportes-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          padding: 2rem 1.5rem;
        }

        /* Contenedor centrado con max-width */
        .reportes-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }

        /* ========== SECCIÓN: FILTROS Y ACCIONES ========== */
        .seccion-filtros {
          padding: 0;
        }

        .filtros-card {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          border: 1px solid #e2e8f0;
        }

        /* Fila 1: Chips de Estado */
        .chips-estados {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .chip-estado {
          display: inline-flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.875rem 1.5rem;
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 0.9375rem;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .chip-estado:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .chip-estado.active {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-color: #10b981;
          color: white;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .chip-label {
          font-weight: 600;
        }

        .chip-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 28px;
          padding: 0.25rem 0.625rem;
          background: rgba(148, 163, 184, 0.15);
          border-radius: 8px;
          font-size: 0.8125rem;
          font-weight: 700;
        }

        .chip-estado.active .chip-count {
          background: rgba(255, 255, 255, 0.25);
          color: white;
        }

        .chip-count.warning {
          background: #fff7ed;
          color: #ea580c;
        }

        .chip-count.success {
          background: #f0fdf4;
          color: #16a34a;
        }

        .chip-count.danger {
          background: #fef2f2;
          color: #dc2626;
        }

        .chip-count.sent {
          background: #eff6ff;
          color: #2563eb;
        }

        /* Separador visual */
        .filtros-separador {
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, #cbd5e1 50%, transparent 100%);
          margin: 1.5rem 0;
        }

        /* Fila 2: B\u00fasqueda y Filtros Secundarios */
        .fila-busqueda {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .search-box-principal {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          transition: all 0.2s;
        }

        .search-box-principal:focus-within {
          background: white;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .search-box-principal svg {
          color: #94a3b8;
          flex-shrink: 0;
        }

        .search-input-principal {
          border: none;
          background: transparent;
          outline: none;
          font-size: 0.9375rem;
          width: 100%;
          color: #0f172a;
          font-weight: 500;
        }

        .search-input-principal::placeholder {
          color: #94a3b8;
        }

        .filtros-secundarios {
          display: flex;
          gap: 0.75rem;
        }

        .filter-select-mejorado {
          padding: 1rem 1.25rem;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 600;
          background: white;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 180px;
        }

        .filter-select-mejorado:hover {
          border-color: #cbd5e1;
        }

        .filter-select-mejorado:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        /* ========== SECCIÓN 3: LISTA DE REPORTES ========== */
        .seccion-reportes {
          min-height: 400px;
        }

        /* Loading */
        .loading-container {
          text-align: center;
          padding: 4rem 2rem;
        }

        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #e2e8f0;
          border-top-color: #10b981;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 1.5rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading-text {
          color: #64748b;
          font-size: 1rem;
          font-weight: 500;
          margin: 0;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: #94a3b8;
        }

        .empty-state svg {
          margin: 0 auto 1.5rem;
          display: block;
        }

        .empty-text {
          font-size: 1.0625rem;
          font-weight: 600;
          color: #64748b;
          margin: 0;
        }

        /* Grid de Reportes Mejorado - 3 COLUMNAS */
        .reports-grid-mejorado {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }

        /* Tarjetas Compactas y Mejoradas */
        .report-card-mejorada {
          background: white;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          border: 1px solid #e2e8f0;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
        }

        .report-card-mejorada:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          border-color: #cbd5e1;
        }

        .card-barra-estado {
          height: 5px;
          background: #cbd5e1;
        }

        .card-barra-estado.pending {
          background: linear-gradient(90deg, #f59e0b 0%, #ea580c 100%);
        }

        .card-barra-estado.success {
          background: linear-gradient(90deg, #10b981 0%, #059669 100%);
        }

        .card-barra-estado.danger {
          background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
        }

        .card-barra-estado.sent {
          background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
        }

        /* Header de tarjeta */
        .card-header-mejorado {
          padding: 1.25rem 1.25rem 0.75rem;
        }

        .card-info-superior {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 0.75rem;
          margin-bottom: 0.625rem;
        }

        .card-titulo-mejorado {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
          line-height: 1.4;
          flex: 1;
        }

        .badge-estado-mejorado {
          padding: 0.375rem 0.75rem;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: capitalize;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .badge-estado-mejorado.pending {
          background: #fff7ed;
          color: #ea580c;
          border: 1px solid #fed7aa;
        }

        .badge-estado-mejorado.success {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
        }

        .badge-estado-mejorado.danger {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .badge-estado-mejorado.sent {
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
        }

        .card-meta-superior {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8125rem;
        }

        .meta-frecuencia {
          color: #64748b;
          font-weight: 600;
        }

        .meta-separador {
          color: #cbd5e1;
        }

        .meta-vencimiento {
          font-weight: 600;
        }

        .meta-vencimiento.vencido,
        .meta-vencimiento.hoy {
          color: #dc2626;
        }

        .meta-vencimiento.urgente {
          color: #ea580c;
        }

        .meta-vencimiento.proximo {
          color: #f59e0b;
        }

        .meta-vencimiento.normal {
          color: #10b981;
        }

        /* Body de tarjeta */
        .card-body-mejorado {
          padding: 0 1.25rem 1.25rem;
          flex: 1;
        }

        .info-clave {
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8125rem;
        }

        .info-item svg {
          color: #94a3b8;
          flex-shrink: 0;
        }

        .info-label {
          color: #64748b;
          font-weight: 600;
        }

        .info-value {
          color: #0f172a;
          font-weight: 600;
          flex: 1;
        }

        .info-value.negativo {
          color: #dc2626;
        }

        .info-value.positivo {
          color: #10b981;
        }

        .info-value.evidencias {
          color: #2563eb;
        }

        /* Footer de tarjeta */
        .card-footer-mejorado {
          display: flex;
          gap: 0.625rem;
          padding: 1rem 1.25rem;
          border-top: 1px solid #f1f5f9;
          background: #f8fafc;
        }

        .btn-detalle-mejorado,
        .btn-revisar-mejorado {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          border-radius: 10px;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn-detalle-mejorado {
          background: #f1f5f9;
          color: #475569;
        }

        .btn-detalle-mejorado:hover {
          background: #e2e8f0;
          transform: translateY(-1px);
        }

        .btn-revisar-mejorado {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
        }

        .btn-revisar-mejorado:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }

        /* Paginación Mejorada */
        .paginacion-mejorada {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1.5rem;
          margin-top: 2.5rem;
          padding: 1.5rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .btn-pag {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-pag:hover:not(:disabled) {
          background: white;
          border-color: #cbd5e1;
          transform: translateY(-2px);
        }

        .btn-pag:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pag-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9375rem;
          font-weight: 600;
        }

        .pag-actual {
          color: #0f172a;
        }

        .pag-separador {
          color: #94a3b8;
        }

        .pag-total {
          color: #64748b;
        }

        /* Overlay para modal */
        .modal-overlay-fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        /* ========== RESPONSIVE ========== */
        @media (max-width: 1200px) {
          .reports-grid-mejorado {
            grid-template-columns: repeat(2, 1fr);
          }

          .reportes-container {
            max-width: 960px;
          }
        }

        @media (max-width: 768px) {
          .reportes-page {
            padding: 1.5rem 1rem;
          }

          .reportes-container {
            gap: 1.5rem;
          }

          .seccion-header {
            padding: 1rem 0;
          }

          .page-title {
            font-size: 1.5rem;
          }

          .page-description {
            font-size: 0.875rem;
          }

          .filtros-card {
            padding: 1.5rem;
          }

          .chips-estados {
            overflow-x: auto;
            flex-wrap: nowrap;
            padding-bottom: 0.5rem;
            margin-bottom: 1rem;
          }

          .chip-estado {
            flex-shrink: 0;
            padding: 0.75rem 1.25rem;
          }

          .fila-busqueda {
            flex-direction: column;
            gap: 0.75rem;
          }

          .filtros-secundarios {
            width: 100%;
            flex-direction: column;
          }

          .filter-select-mejorado {
            width: 100%;
            min-width: auto;
          }

          .reports-grid-mejorado {
            grid-template-columns: 1fr;
          }

          .paginacion-mejorada {
            flex-direction: column;
            gap: 1rem;
          }

          .btn-pag {
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .page-title {
            font-size: 1.25rem;
          }

          .card-footer-mejorado {
            flex-direction: column;
          }

          .btn-detalle-mejorado,
          .btn-revisar-mejorado {
            width: 100%;
          }
        }

        /* ========== ESTILOS PARA SECCIONES DE ARCHIVOS ========== */
        .archivo-seccion {
          margin-bottom: 1rem;
        }

        .archivo-seccion:last-child {
          margin-bottom: 0;
        }

        .archivo-seccion-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #e2e8f0;
        }

        .archivo-seccion-header svg {
          color: #64748b;
        }

        .archivo-seccion-titulo {
          font-size: 0.875rem;
          font-weight: 600;
          color: #334155;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .archivo-principal {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #bbf7d0;
        }

        .archivo-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .archivo-item.principal svg {
          color: #10b981;
        }

        .archivo-nombre {
          flex: 1;
          font-size: 0.875rem;
          font-weight: 500;
          color: #166534;
        }

        .archivo-badge {
          padding: 0.25rem 0.75rem;
          background: #10b981;
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: 12px;
        }

        .archivo-vacio-mensaje {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: #fef2f2;
          color: #991b1b;
          font-size: 0.875rem;
          border-radius: 8px;
          border: 1px solid #fecaca;
        }

        .vacio-icono {
          font-size: 1.25rem;
        }

        .archivo-separador {
          height: 1px;
          background: linear-gradient(to right, transparent, #e2e8f0, transparent);
          margin: 1.25rem 0;
        }

        .evidencias-lista {
          padding: 0.75rem 1rem;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .evidencias-contador {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #475569;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .evidencias-contador svg {
          color: #64748b;
        }

        .evidencias-vacio {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #64748b;
          font-size: 0.875rem;
        }

        .vacio-icono-info {
          font-size: 1.125rem;
          color: #94a3b8;
        }

        .btn-primary-action {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
        }

        .btn-primary-action:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
        }
      `}</style>

      {/* Visor de archivos */}
      {archivoViewer.open &&
        archivoViewer.archivo &&
        archivoViewer.periodoId && (
          <FileViewer
            archivo={archivoViewer.archivo}
            periodoId={archivoViewer.periodoId}
            onClose={() =>
              setArchivoViewer({ open: false, archivo: null, periodoId: null })
            }
          />
        )}
    </div>
  );
}
