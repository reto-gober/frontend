import { useState, useEffect } from "react";
import { flujoReportesService, type ReportePeriodo } from "../../lib/services";

interface EventoCalendario {
  id: string;
  periodoId: string;
  fecha: Date;
  titulo: string;
  descripcion: string;
  tipo: "vencimiento" | "enviado" | "aprobado";
  estado: string;
}

type VistaCalendario = "mes" | "lista";

export default function CalendarioClient() {
  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState<VistaCalendario>("lista");
  const [mesActual, setMesActual] = useState(new Date());
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");

  useEffect(() => {
    loadEventos();
  }, []);

  const loadEventos = async () => {
    try {
      setLoading(true);

      const response = await flujoReportesService.misPeriodos(0, 1000);
      const periodos = response.content;

      const eventosGenerados: EventoCalendario[] = [];
      const now = new Date();

      periodos.forEach((periodo) => {
        if (!periodo.fechaVencimientoCalculada) return;

        const fechaVenc = new Date(periodo.fechaVencimientoCalculada);

        // Evento de vencimiento
        eventosGenerados.push({
          id: `venc-${periodo.periodoId}`,
          periodoId: periodo.periodoId,
          fecha: fechaVenc,
          titulo: periodo.reporteNombre,
          descripcion: `Vencimiento - ${periodo.entidadNombre}`,
          tipo: "vencimiento",
          estado: periodo.estado,
        });

        // Evento de envío si el estado indica que fue enviado
        if (
          periodo.estado === "enviado_a_tiempo" ||
          periodo.estado === "enviado_tarde" ||
          periodo.estado === "aprobado"
        ) {
          eventosGenerados.push({
            id: `env-${periodo.periodoId}`,
            periodoId: periodo.periodoId,
            fecha: new Date(periodo.updatedAt),
            titulo: periodo.reporteNombre,
            descripcion: `Enviado - ${periodo.entidadNombre}`,
            tipo: "enviado",
            estado: periodo.estado,
          });
        }

        // Evento de aprobación si fue aprobado
        if (periodo.estado === "aprobado" && periodo.updatedAt) {
          eventosGenerados.push({
            id: `apr-${periodo.periodoId}`,
            periodoId: periodo.periodoId,
            fecha: new Date(periodo.updatedAt),
            titulo: periodo.reporteNombre,
            descripcion: `Aprobado - ${periodo.entidadNombre}`,
            tipo: "aprobado",
            estado: periodo.estado,
          });
        }
      });

      // Ordenar por fecha
      eventosGenerados.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

      setEventos(eventosGenerados);
    } catch (err) {
      console.error("Error al cargar eventos del calendario:", err);
    } finally {
      setLoading(false);
    }
  };

  const eventosFiltrados = eventos.filter((evento) => {
    if (filtroEstado === "pendientes") {
      return (
        evento.tipo === "vencimiento" &&
        (evento.estado === "pendiente" ||
          evento.estado === "en_elaboracion" ||
          evento.estado === "requiere_correccion")
      );
    }
    if (filtroEstado === "enviados") {
      return (
        evento.estado === "enviado_a_tiempo" ||
        evento.estado === "enviado_tarde" ||
        evento.estado === "aprobado"
      );
    }
    return true;
  });

  // Filtrar eventos por mes si la vista es 'mes'
  const eventosMes =
    vista === "mes"
      ? eventosFiltrados.filter((e) => {
          const eventoMes = e.fecha.getMonth();
          const eventoAno = e.fecha.getFullYear();
          return (
            eventoMes === mesActual.getMonth() &&
            eventoAno === mesActual.getFullYear()
          );
        })
      : eventosFiltrados;

  const cambiarMes = (direccion: "prev" | "next") => {
    setMesActual((prev) => {
      const nuevaFecha = new Date(prev);
      if (direccion === "prev") {
        nuevaFecha.setMonth(nuevaFecha.getMonth() - 1);
      } else {
        nuevaFecha.setMonth(nuevaFecha.getMonth() + 1);
      }
      return nuevaFecha;
    });
  };

  const formatearFecha = (fecha: Date) => {
    const dia = fecha.getDate();
    const mes = fecha.toLocaleDateString("es-CO", { month: "short" });
    return { dia: dia.toString().padStart(2, "0"), mes };
  };

  const formatearFechaCompleta = (fecha: Date) => {
    return fecha.toLocaleDateString("es-CO", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getColorEvento = (tipo: string) => {
    switch (tipo) {
      case "vencimiento":
        return "var(--color-warning-500)";
      case "enviado":
        return "var(--color-info-500)";
      case "aprobado":
        return "var(--color-success-500)";
      default:
        return "var(--neutral-400)";
    }
  };

  const contadores = {
    todos: eventos.length,
    pendientes: eventos.filter(
      (e) =>
        e.tipo === "vencimiento" &&
        (e.estado === "pendiente" ||
          e.estado === "en_elaboracion" ||
          e.estado === "requiere_correccion")
    ).length,
    enviados: eventos.filter(
      (e) =>
        e.estado === "enviado_a_tiempo" ||
        e.estado === "enviado_tarde" ||
        e.estado === "aprobado"
    ).length,
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
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

  return (
    <div className="calendario-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-info">
          <h1 className="page-title">Calendario de Reportes</h1>
          <p className="page-description">
            Visualiza fechas importantes y eventos de tus reportes
          </p>
        </div>
        <div className="header-actions">
          <div className="view-switcher">
            <button
              className={`view-btn ${vista === "lista" ? "active" : ""}`}
              onClick={() => setVista("lista")}
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              Lista
            </button>
            <button
              className={`view-btn ${vista === "mes" ? "active" : ""}`}
              onClick={() => setVista("mes")}
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Mes
            </button>
          </div>
        </div>
      </div>

      {/* Navegación de mes (solo en vista mes) */}
      {vista === "mes" && (
        <div className="month-navigation">
          <button className="month-nav-btn" onClick={() => cambiarMes("prev")}>
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h2 className="month-title">
            {mesActual.toLocaleDateString("es-CO", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <button className="month-nav-btn" onClick={() => cambiarMes("next")}>
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}

      {/* Filtros */}
      <div className="filters-bar">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filtroEstado === "todos" ? "active" : ""}`}
            onClick={() => setFiltroEstado("todos")}
          >
            Todos ({contadores.todos})
          </button>
          <button
            className={`filter-tab ${filtroEstado === "pendientes" ? "active" : ""}`}
            onClick={() => setFiltroEstado("pendientes")}
          >
            Pendientes ({contadores.pendientes})
          </button>
          <button
            className={`filter-tab ${filtroEstado === "enviados" ? "active" : ""}`}
            onClick={() => setFiltroEstado("enviados")}
          >
            Completados ({contadores.enviados})
          </button>
        </div>
      </div>

      {/* Eventos */}
      <div className="eventos-container">
        {eventosMes.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "3rem",
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <p style={{ color: "var(--neutral-500)" }}>
              {vista === "mes"
                ? `No hay eventos programados para ${mesActual.toLocaleDateString("es-CO", { month: "long", year: "numeric" })}`
                : "No hay eventos para mostrar"}
            </p>
          </div>
        ) : (
          <div className="eventos-list">
            {eventosMes.map((evento) => {
              const { dia, mes } = formatearFecha(evento.fecha);
              const esProximo =
                evento.fecha > new Date() &&
                evento.fecha < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

              return (
                <div
                  key={evento.id}
                  className={`evento-card ${evento.tipo} ${esProximo ? "proximo" : ""}`}
                  style={{ borderLeftColor: getColorEvento(evento.tipo) }}
                >
                  <div className="evento-date">
                    <span className="date-day">{dia}</span>
                    <span className="date-month">{mes}</span>
                  </div>
                  <div className="evento-content">
                    <div className="evento-header">
                      <h4 className="evento-title">{evento.titulo}</h4>
                      <span
                        className="evento-badge"
                        style={{ backgroundColor: getColorEvento(evento.tipo) }}
                      >
                        {evento.tipo === "vencimiento" && "Vencimiento"}
                        {evento.tipo === "enviado" && "Enviado"}
                        {evento.tipo === "aprobado" && "Aprobado"}
                      </span>
                    </div>
                    <p className="evento-description">{evento.descripcion}</p>
                    <div className="evento-footer">
                      <span className="evento-date-full">
                        {formatearFechaCompleta(evento.fecha)}
                      </span>
                      <button
                        className="evento-action-btn"
                        onClick={() =>
                          (window.location.href =
                            "/roles/responsable/mis-reportes")
                        }
                      >
                        Ver detalles
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .calendario-page {
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

        .view-switcher {
          display: flex;
          gap: 0.5rem;
          background: white;
          padding: 0.25rem;
          border-radius: 8px;
          box-shadow: var(--shadow-card);
        }

        .view-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: transparent;
          border: none;
          border-radius: 6px;
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--neutral-600);
          cursor: pointer;
          transition: all 0.2s;
        }

        .view-btn:hover {
          background: var(--neutral-100);
        }

        .view-btn.active {
          background: var(--role-accent);
          color: var(--neutral-900);
        }

        .month-navigation {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          background: white;
          border-radius: 12px;
          box-shadow: var(--shadow-card);
        }

        .month-nav-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: transparent;
          border: 1px solid var(--neutral-200);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--neutral-600);
        }

        .month-nav-btn:hover {
          background: var(--neutral-100);
          border-color: var(--neutral-300);
        }

        .month-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--neutral-800);
          margin: 0;
          text-transform: capitalize;
        }

        .filters-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background: white;
          border-radius: 12px;
          box-shadow: var(--shadow-card);
        }

        .filter-tabs {
          display: flex;
          gap: 0.25rem;
        }

        .filter-tab {
          padding: 0.5rem 1rem;
          background: transparent;
          border: none;
          border-radius: 6px;
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--neutral-600);
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-tab:hover {
          background: var(--neutral-100);
        }

        .filter-tab.active {
          background: var(--role-accent);
          color: var(--neutral-900);
        }

        .eventos-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .eventos-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .evento-card {
          display: flex;
          gap: 1rem;
          padding: 1.25rem;
          background: white;
          border-radius: 12px;
          box-shadow: var(--shadow-card);
          border-left: 4px solid;
          transition: all 0.2s;
        }

        .evento-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .evento-card.proximo {
          background: var(--role-accent-light, #fef3e2);
        }

        .evento-date {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-width: 60px;
          padding: 0.5rem;
          background: var(--neutral-50);
          border-radius: 8px;
        }

        .date-day {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--neutral-900);
          line-height: 1;
        }

        .date-month {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--neutral-500);
          text-transform: uppercase;
          margin-top: 0.25rem;
        }

        .evento-content {
          flex: 1;
          min-width: 0;
        }

        .evento-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }

        .evento-title {
          font-size: 1rem;
          font-weight: 600;
          color: var(--neutral-800);
          margin: 0;
        }

        .evento-badge {
          padding: 0.25rem 0.625rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          color: white;
          white-space: nowrap;
        }

        .evento-description {
          font-size: 0.875rem;
          color: var(--neutral-600);
          margin: 0 0 0.75rem;
        }

        .evento-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        .evento-date-full {
          font-size: 0.75rem;
          color: var(--neutral-400);
          text-transform: capitalize;
        }

        .evento-action-btn {
          padding: 0.375rem 0.875rem;
          background: var(--role-accent);
          border: none;
          border-radius: 6px;
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--neutral-900);
          cursor: pointer;
          transition: all 0.2s;
        }

        .evento-action-btn:hover {
          background: var(--role-accent-dark, #f59e0b);
          color: white;
        }

        @media (max-width: 768px) {
          .evento-card {
            flex-direction: column;
          }

          .evento-date {
            flex-direction: row;
            gap: 0.5rem;
            min-width: auto;
            width: 100%;
          }

          .evento-footer {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
