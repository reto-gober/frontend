import { useState, useEffect } from "react";
import { flujoReportesService, type ReportePeriodo } from "../../lib/services";

type VistaCalendario = "mes" | "semana" | "lista";

interface EventoCalendario {
  periodoId: string;
  fecha: Date;
  titulo: string;
  entidad: string;
  estado: string;
  tipo: "pendiente" | "enviado" | "vencido" | "porVencer";
}

export default function CalendarioResponsableClient() {
  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState<VistaCalendario>("mes");
  const [mesActual, setMesActual] = useState(new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date | null>(
    new Date()
  );
  const [filtrosEntidades, setFiltrosEntidades] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    loadEventos();
  }, []);

  const loadEventos = async () => {
    try {
      setLoading(true);
      const response = await flujoReportesService.misPeriodos(0, 1000);
      const periodos = response.content;

      const now = new Date();
      const tresDias = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const eventosGenerados: EventoCalendario[] = [];
      const entidadesSet = new Set<string>();

      periodos.forEach((periodo) => {
        if (!periodo.fechaVencimientoCalculada) return;

        const fechaVenc = new Date(periodo.fechaVencimientoCalculada);
        let tipo: "pendiente" | "enviado" | "vencido" | "porVencer" =
          "pendiente";

        // Determinar tipo de evento
        if (
          periodo.estado === "enviado_a_tiempo" ||
          periodo.estado === "enviado_tarde" ||
          periodo.estado === "aprobado"
        ) {
          tipo = "enviado";
        } else if (fechaVenc < now) {
          tipo = "vencido";
        } else if (fechaVenc <= tresDias) {
          tipo = "porVencer";
        }

        eventosGenerados.push({
          periodoId: periodo.periodoId,
          fecha: fechaVenc,
          titulo: periodo.reporteNombre,
          entidad: periodo.entidadNombre,
          estado: periodo.estado,
          tipo,
        });

        entidadesSet.add(periodo.entidadNombre);
      });

      setEventos(eventosGenerados);
      setFiltrosEntidades(entidadesSet);
    } catch (err) {
      console.error("Error al cargar eventos:", err);
    } finally {
      setLoading(false);
    }
  };

  const proximosVencimientos = eventos
    .filter(
      (e) =>
        e.tipo === "vencido" || e.tipo === "porVencer" || e.tipo === "pendiente"
    )
    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
    .slice(0, 5);

  const eventosDelDia = diaSeleccionado
    ? eventos.filter((e) => {
        const eventoFecha = new Date(e.fecha);
        return (
          eventoFecha.getDate() === diaSeleccionado.getDate() &&
          eventoFecha.getMonth() === diaSeleccionado.getMonth() &&
          eventoFecha.getFullYear() === diaSeleccionado.getFullYear()
        );
      })
    : [];

  const generarDiasDelMes = () => {
    const primerDia = new Date(
      mesActual.getFullYear(),
      mesActual.getMonth(),
      1
    );
    const ultimoDia = new Date(
      mesActual.getFullYear(),
      mesActual.getMonth() + 1,
      0
    );
    const diasPrevios = primerDia.getDay();

    const dias: Array<{
      fecha: Date;
      esDelMes: boolean;
      eventos: EventoCalendario[];
    }> = [];

    // Días del mes anterior
    for (let i = diasPrevios - 1; i >= 0; i--) {
      const fecha = new Date(primerDia);
      fecha.setDate(fecha.getDate() - i - 1);
      dias.push({ fecha, esDelMes: false, eventos: [] });
    }

    // Días del mes actual
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const fecha = new Date(
        mesActual.getFullYear(),
        mesActual.getMonth(),
        dia
      );
      const eventosDelDia = eventos.filter((e) => {
        const eventoFecha = new Date(e.fecha);
        return (
          eventoFecha.getDate() === dia &&
          eventoFecha.getMonth() === mesActual.getMonth() &&
          eventoFecha.getFullYear() === mesActual.getFullYear()
        );
      });
      dias.push({ fecha, esDelMes: true, eventos: eventosDelDia });
    }

    // Días del mes siguiente
    const diasRestantes = 42 - dias.length;
    for (let i = 1; i <= diasRestantes; i++) {
      const fecha = new Date(ultimoDia);
      fecha.setDate(fecha.getDate() + i);
      dias.push({ fecha, esDelMes: false, eventos: [] });
    }

    return dias;
  };

  const generarDiasDeLaSemana = () => {
    const hoy = diaSeleccionado || new Date();
    const diaSemana = hoy.getDay();
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - diaSemana);

    const dias: Array<{ fecha: Date; eventos: EventoCalendario[] }> = [];

    for (let i = 0; i < 7; i++) {
      const fecha = new Date(inicioSemana);
      fecha.setDate(inicioSemana.getDate() + i);
      const eventosDelDia = eventos.filter((e) => {
        const eventoFecha = new Date(e.fecha);
        return (
          eventoFecha.getDate() === fecha.getDate() &&
          eventoFecha.getMonth() === fecha.getMonth() &&
          eventoFecha.getFullYear() === fecha.getFullYear()
        );
      });
      dias.push({ fecha, eventos: eventosDelDia });
    }

    return dias;
  };

  const cambiarSemana = (direccion: "prev" | "next") => {
    setDiaSeleccionado((prev) => {
      const nuevaFecha = new Date(prev || new Date());
      if (direccion === "prev") {
        nuevaFecha.setDate(nuevaFecha.getDate() - 7);
      } else {
        nuevaFecha.setDate(nuevaFecha.getDate() + 7);
      }
      return nuevaFecha;
    });
  };

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

  const irAHoy = () => {
    setMesActual(new Date());
    setDiaSeleccionado(new Date());
  };

  const formatearFecha = (fecha: Date) => {
    return fecha.toLocaleDateString("es-CO", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDiasRestantes = (fecha: Date) => {
    const now = new Date();
    const diff = fecha.getTime() - now.getTime();
    const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return dias;
  };

  const getColorEvento = (tipo: string) => {
    switch (tipo) {
      case "vencido":
        return "var(--error-red-500)";
      case "porVencer":
        return "var(--warning-yellow-500)";
      case "enviado":
        return "var(--success-green-500)";
      case "pendiente":
        return "var(--role-accent)";
      default:
        return "var(--neutral-400)";
    }
  };

  const getAccionTexto = (tipo: string, estado: string) => {
    if (estado === "requiere_correccion") return "Reenviar corrección";
    if (tipo === "enviado") return "En revisión";
    if (tipo === "vencido") return "Completar (Vencido)";
    if (tipo === "porVencer") return "Completar urgente";
    return "Completar / Enviar";
  };

  const esHoy = (fecha: Date) => {
    const hoy = new Date();
    return (
      fecha.getDate() === hoy.getDate() &&
      fecha.getMonth() === hoy.getMonth() &&
      fecha.getFullYear() === hoy.getFullYear()
    );
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

  const diasDelMes = generarDiasDelMes();
  const diasDeLaSemana = generarDiasDeLaSemana();

  return (
    <div className="calendario-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-info">
          <h1 className="page-title">Mi Calendario</h1>
          <p className="page-description">
            Vista de tus reportes y actividades programadas
          </p>
        </div>
        <div className="header-actions">
          <div className="view-toggle">
            <button
              className={`view-btn ${vista === "mes" ? "active" : ""}`}
              onClick={() => setVista("mes")}
            >
              Mes
            </button>
            <button
              className={`view-btn ${vista === "semana" ? "active" : ""}`}
              onClick={() => setVista("semana")}
            >
              Semana
            </button>
            <button
              className={`view-btn ${vista === "lista" ? "active" : ""}`}
              onClick={() => setVista("lista")}
            >
              Lista
            </button>
          </div>
        </div>
      </div>

      <div className="calendario-container">
        {/* Sidebar */}
        <div className="calendario-sidebar">
          <div className="sidebar-section">
            <h3 className="section-title">Próximos Vencimientos</h3>
            <div className="eventos-list">
              {proximosVencimientos.length === 0 ? (
                <p
                  style={{ fontSize: "0.8125rem", color: "var(--neutral-500)" }}
                >
                  No hay vencimientos próximos
                </p>
              ) : (
                proximosVencimientos.map((evento) => {
                  const diasRestantes = getDiasRestantes(evento.fecha);
                  const esUrgente =
                    evento.tipo === "vencido" || evento.tipo === "porVencer";

                  return (
                    <div
                      key={evento.periodoId}
                      className={`evento-item ${esUrgente ? (evento.tipo === "vencido" ? "urgent" : "warning") : ""}`}
                    >
                      <div className="evento-date">
                        <span className="date-day">
                          {evento.fecha.getDate()}
                        </span>
                        <span className="date-month">
                          {evento.fecha.toLocaleDateString("es-CO", {
                            month: "short",
                          })}
                        </span>
                      </div>
                      <div className="evento-info">
                        <h4 className="evento-title">{evento.titulo}</h4>
                        <p className="evento-description">{evento.entidad}</p>
                        <span
                          className={`evento-badge ${evento.tipo === "vencido" ? "urgent" : evento.tipo === "porVencer" ? "warning" : ""}`}
                        >
                          {evento.tipo === "vencido"
                            ? `Vencido hace ${Math.abs(diasRestantes)} día${Math.abs(diasRestantes) !== 1 ? "s" : ""}`
                            : `En ${diasRestantes} día${diasRestantes !== 1 ? "s" : ""}`}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="sidebar-section">
            <h3 className="section-title">Leyenda</h3>
            <div className="legend-list">
              <div className="legend-item">
                <span className="legend-color vencido"></span>
                <span className="legend-label">Vencido</span>
              </div>
              <div className="legend-item">
                <span className="legend-color porVencer"></span>
                <span className="legend-label">Por vencer</span>
              </div>
              <div className="legend-item">
                <span className="legend-color pendiente"></span>
                <span className="legend-label">Pendiente</span>
              </div>
              <div className="legend-item">
                <span className="legend-color enviado"></span>
                <span className="legend-label">Enviado</span>
              </div>
            </div>
          </div>
        </div>

        {/* Calendario principal */}
        <div className="calendario-main">
          <div className="calendario-card">
            {/* Navegación */}
            <div className="calendar-nav">
              <button
                className="nav-btn"
                onClick={() =>
                  vista === "semana"
                    ? cambiarSemana("prev")
                    : cambiarMes("prev")
                }
              >
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
              <h2 className="calendar-month">
                {vista === "semana"
                  ? `Semana del ${(diaSeleccionado || new Date()).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}`
                  : vista === "lista"
                    ? "Todos los reportes"
                    : mesActual.toLocaleDateString("es-CO", {
                        month: "long",
                        year: "numeric",
                      })}
              </h2>
              {vista !== "lista" && (
                <button
                  className="nav-btn"
                  onClick={() =>
                    vista === "semana"
                      ? cambiarSemana("next")
                      : cambiarMes("next")
                  }
                >
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
              )}
              <button className="btn-today" onClick={irAHoy}>
                Hoy
              </button>
            </div>

            {/* Vista Mes */}
            {vista === "mes" && (
              <>
                <div className="calendar-header">
                  <div className="day-header">Dom</div>
                  <div className="day-header">Lun</div>
                  <div className="day-header">Mar</div>
                  <div className="day-header">Mié</div>
                  <div className="day-header">Jue</div>
                  <div className="day-header">Vie</div>
                  <div className="day-header">Sáb</div>
                </div>

                <div className="calendar-grid">
                  {diasDelMes.map((dia, index) => {
                    const tieneEventos = dia.eventos.length > 0;
                    const tieneVencido = dia.eventos.some(
                      (e) => e.tipo === "vencido"
                    );
                    const tienePorVencer = dia.eventos.some(
                      (e) => e.tipo === "porVencer"
                    );
                    const hoy = esHoy(dia.fecha);
                    const seleccionado =
                      diaSeleccionado &&
                      dia.fecha.getDate() === diaSeleccionado.getDate() &&
                      dia.fecha.getMonth() === diaSeleccionado.getMonth() &&
                      dia.fecha.getFullYear() === diaSeleccionado.getFullYear();

                    return (
                      <div
                        key={index}
                        className={`calendar-day 
                          ${!dia.esDelMes ? "other-month" : ""} 
                          ${hoy ? "today" : ""} 
                          ${tieneVencido ? "has-urgent" : tienePorVencer ? "has-warning" : ""}
                          ${seleccionado ? "selected" : ""}
                        `}
                        onClick={() =>
                          dia.esDelMes && setDiaSeleccionado(dia.fecha)
                        }
                      >
                        <span className="day-number">
                          {dia.fecha.getDate()}
                        </span>
                        {tieneEventos && (
                          <div className="day-events">
                            {dia.eventos.map((evento) => (
                              <div
                                key={evento.periodoId}
                                className={`event-dot ${evento.tipo}`}
                                style={{
                                  backgroundColor: getColorEvento(evento.tipo),
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Vista Semana */}
            {vista === "semana" && (
              <div className="week-view">
                {diasDeLaSemana.map((dia, index) => {
                  const hoy = esHoy(dia.fecha);
                  const seleccionado =
                    diaSeleccionado &&
                    dia.fecha.getDate() === diaSeleccionado.getDate() &&
                    dia.fecha.getMonth() === diaSeleccionado.getMonth() &&
                    dia.fecha.getFullYear() === diaSeleccionado.getFullYear();

                  return (
                    <div
                      key={index}
                      className={`week-day ${hoy ? "today" : ""} ${seleccionado ? "selected" : ""}`}
                      onClick={() => setDiaSeleccionado(dia.fecha)}
                    >
                      <div className="week-day-header">
                        <span className="week-day-name">
                          {dia.fecha.toLocaleDateString("es-CO", {
                            weekday: "short",
                          })}
                        </span>
                        <span
                          className={`week-day-number ${hoy ? "today" : ""}`}
                        >
                          {dia.fecha.getDate()}
                        </span>
                      </div>
                      <div className="week-day-events">
                        {dia.eventos.length === 0 ? (
                          <div className="no-events">Sin reportes</div>
                        ) : (
                          dia.eventos.map((evento) => (
                            <div
                              key={evento.periodoId}
                              className={`week-event ${evento.tipo}`}
                            >
                              <div className="week-event-time">
                                {getDiasRestantes(evento.fecha) === 0
                                  ? "Hoy"
                                  : getDiasRestantes(evento.fecha) < 0
                                    ? `Vencido ${Math.abs(getDiasRestantes(evento.fecha))}d`
                                    : `En ${getDiasRestantes(evento.fecha)}d`}
                              </div>
                              <div className="week-event-title">
                                {evento.titulo}
                              </div>
                              <div className="week-event-entity">
                                {evento.entidad}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Vista Lista */}
            {vista === "lista" && (
              <div className="list-view">
                {eventos.length === 0 ? (
                  <div className="detail-empty">
                    <svg
                      viewBox="0 0 24 24"
                      width="48"
                      height="48"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <p>No hay reportes programados</p>
                  </div>
                ) : (
                  [...eventos]
                    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
                    .map((evento) => (
                      <div
                        key={evento.periodoId}
                        className={`list-event ${evento.tipo}`}
                      >
                        <div className="list-event-date">
                          <span className="list-date-day">
                            {evento.fecha.getDate()}
                          </span>
                          <span className="list-date-month">
                            {evento.fecha.toLocaleDateString("es-CO", {
                              month: "short",
                            })}
                          </span>
                          <span className="list-date-year">
                            {evento.fecha.getFullYear()}
                          </span>
                        </div>
                        <div className="list-event-content">
                          <h4>{evento.titulo}</h4>
                          <p>{evento.entidad}</p>
                          <div className={`list-event-status ${evento.tipo}`}>
                            {getAccionTexto(evento.tipo, evento.estado)}
                          </div>
                        </div>
                        <div className="list-event-badge">
                          {evento.tipo === "vencido"
                            ? `Vencido hace ${Math.abs(getDiasRestantes(evento.fecha))} día${Math.abs(getDiasRestantes(evento.fecha)) !== 1 ? "s" : ""}`
                            : evento.tipo === "enviado"
                              ? "Enviado"
                              : `En ${getDiasRestantes(evento.fecha)} día${getDiasRestantes(evento.fecha) !== 1 ? "s" : ""}`}
                        </div>
                      </div>
                    ))
                )}
              </div>
            )}
          </div>

          {/* Panel de día seleccionado - solo para vista mes y semana */}
          {vista !== "lista" && (
            <div className="day-detail-panel">
              <div className="detail-header">
                <h3>
                  {diaSeleccionado
                    ? formatearFecha(diaSeleccionado)
                    : "Selecciona un día"}
                </h3>
                {diaSeleccionado && esHoy(diaSeleccionado) && (
                  <span className="detail-badge">Hoy</span>
                )}
              </div>
              <div className="detail-events">
                {eventosDelDia.length === 0 ? (
                  <div className="detail-empty">
                    <svg
                      viewBox="0 0 24 24"
                      width="48"
                      height="48"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <p>No hay reportes para este día</p>
                  </div>
                ) : (
                  eventosDelDia.map((evento) => (
                    <div
                      key={evento.periodoId}
                      className={`detail-event ${evento.tipo}`}
                    >
                      <div className="event-time">
                        <svg
                          viewBox="0 0 24 24"
                          width="14"
                          height="14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12,6 12,12 16,14" />
                        </svg>
                        Vencimiento
                      </div>
                      <div className="event-content">
                        <h4>{evento.titulo}</h4>
                        <p>{evento.entidad}</p>
                      </div>
                      <div className={`event-status ${evento.tipo}`}>
                        {getAccionTexto(evento.tipo, evento.estado)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
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

        .view-toggle {
          display: flex;
          background: white;
          border-radius: 8px;
          padding: 0.25rem;
          box-shadow: var(--shadow-card);
        }

        .view-btn {
          padding: 0.5rem 1rem;
          border: none;
          background: transparent;
          border-radius: 6px;
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--neutral-600);
          cursor: pointer;
          transition: all 0.2s;
        }

        .view-btn.active {
          background: var(--role-accent);
          color: var(--neutral-900);
        }

        .view-btn:hover:not(.active) {
          background: var(--neutral-100);
        }

        .calendario-container {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 1.5rem;
        }

        .calendario-sidebar {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .sidebar-section {
          background: white;
          border-radius: 12px;
          padding: 1.25rem;
          box-shadow: var(--shadow-card);
        }

        .section-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--neutral-800);
          margin: 0 0 1rem;
        }

        .eventos-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .evento-item {
          display: flex;
          gap: 0.875rem;
          padding: 0.75rem;
          border-radius: 8px;
          background: var(--neutral-50);
          border-left: 3px solid var(--neutral-300);
          cursor: pointer;
          transition: all 0.2s;
        }

        .evento-item:hover {
          background: var(--neutral-100);
        }

        .evento-item.urgent {
          border-left-color: var(--error-red-500);
          background: var(--error-red-50);
        }

        .evento-item.warning {
          border-left-color: var(--warning-yellow-500);
          background: var(--warning-yellow-50);
        }

        .evento-date {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.25rem 0.5rem;
          background: white;
          border-radius: 6px;
          min-width: 45px;
        }

        .date-day {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--neutral-800);
          line-height: 1;
        }

        .date-month {
          font-size: 0.625rem;
          font-weight: 600;
          color: var(--neutral-500);
          text-transform: uppercase;
        }

        .evento-info {
          flex: 1;
          min-width: 0;
        }

        .evento-title {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--neutral-800);
          margin: 0;
        }

        .evento-description {
          font-size: 0.75rem;
          color: var(--neutral-500);
          margin: 0.125rem 0 0.375rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .evento-badge {
          display: inline-block;
          padding: 0.125rem 0.5rem;
          border-radius: 4px;
          font-size: 0.625rem;
          font-weight: 600;
          background: var(--neutral-200);
          color: var(--neutral-600);
        }

        .evento-badge.urgent {
          background: var(--error-red-100);
          color: var(--error-red-700);
        }

        .evento-badge.warning {
          background: var(--warning-yellow-100);
          color: var(--warning-yellow-700);
        }

        .legend-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 3px;
        }

        .legend-color.vencido { background: var(--error-red-500); }
        .legend-color.porVencer { background: var(--warning-yellow-500); }
        .legend-color.pendiente { background: var(--role-accent); }
        .legend-color.enviado { background: var(--success-green-500); }

        .legend-label {
          font-size: 0.8125rem;
          color: var(--neutral-600);
        }

        .calendario-main {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .calendario-card {
          background: white;
          border-radius: 12px;
          box-shadow: var(--shadow-card);
          padding: 1.5rem;
        }

        .calendar-nav {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .nav-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--neutral-200);
          border-radius: 8px;
          background: white;
          color: var(--neutral-600);
          cursor: pointer;
          transition: all 0.2s;
        }

        .nav-btn:hover {
          background: var(--neutral-100);
        }

        .calendar-month {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--neutral-900);
          margin: 0;
          flex: 1;
        }

        .btn-today {
          padding: 0.5rem 1rem;
          background: var(--role-accent);
          border: none;
          border-radius: 6px;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-today:hover {
          background: var(--role-accent-dark);
        }

        .calendar-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          margin-bottom: 0.5rem;
        }

        .day-header {
          text-align: center;
          padding: 0.75rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--neutral-500);
          text-transform: uppercase;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
          background: var(--neutral-200);
          border-radius: 8px;
          overflow: hidden;
        }

        .calendar-day {
          min-height: 90px;
          padding: 0.5rem;
          background: white;
          cursor: pointer;
          transition: background 0.2s;
          position: relative;
        }

        .calendar-day:hover {
          background: var(--neutral-50);
        }

        .calendar-day.other-month {
          background: var(--neutral-50);
        }

        .calendar-day.other-month .day-number {
          color: var(--neutral-400);
        }

        .calendar-day.today .day-number {
          background: var(--role-accent);
          color: white;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
        }

        .calendar-day.selected {
          background: var(--role-accent-light);
          border: 2px solid var(--role-accent);
        }

        .calendar-day.has-urgent {
          border: 2px solid var(--error-red-300);
        }

        .calendar-day.has-warning {
          border: 2px solid var(--warning-yellow-300);
        }

        .day-number {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--neutral-700);
        }

        .day-events {
          display: flex;
          gap: 4px;
          margin-top: 0.5rem;
          flex-wrap: wrap;
        }

        .event-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .event-dot.vencido { background: var(--error-red-500); }
        .event-dot.porVencer { background: var(--warning-yellow-500); }
        .event-dot.pendiente { background: var(--role-accent); }
        .event-dot.enviado { background: var(--success-green-500); }

        .day-detail-panel {
          background: white;
          border-radius: 12px;
          box-shadow: var(--shadow-card);
          padding: 1.25rem;
        }

        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--neutral-100);
        }

        .detail-header h3 {
          font-size: 1rem;
          font-weight: 600;
          color: var(--neutral-800);
          margin: 0;
        }

        .detail-badge {
          padding: 0.25rem 0.75rem;
          background: var(--role-accent);
          color: white;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .detail-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 1rem;
          color: var(--neutral-400);
        }

        .detail-empty svg {
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .detail-empty p {
          margin: 0;
          font-size: 0.875rem;
        }

        .detail-events {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .detail-event {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 1rem;
          border-radius: 8px;
          background: var(--neutral-50);
          border-left: 3px solid;
        }

        .detail-event.pendiente {
          border-left-color: var(--role-accent);
        }

        .detail-event.vencido {
          border-left-color: var(--error-red-500);
          background: var(--error-red-50);
        }

        .detail-event.porVencer {
          border-left-color: var(--warning-yellow-500);
          background: var(--warning-yellow-50);
        }

        .detail-event.enviado {
          border-left-color: var(--success-green-500);
          background: var(--success-green-50);
        }

        .event-content h4 {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--neutral-800);
          margin: 0 0 0.25rem;
        }

        .event-content p {
          font-size: 0.8125rem;
          color: var(--neutral-500);
          margin: 0;
        }

        .event-action {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--neutral-600);
          margin-top: 0.5rem;
        }

        .event-action svg {
          width: 14px;
          height: 14px;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          color: var(--neutral-500);
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--neutral-200);
          border-top-color: var(--role-accent);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .loading-container p {
          margin-top: 1rem;
          font-size: 0.875rem;
        }

        @media (max-width: 1024px) {
          .calendario-container {
            grid-template-columns: 1fr;
          }

          .calendario-sidebar {
            order: 2;
          }

          .calendario-main {
            order: 1;
          }
        }

        /* Vista Semana */
        .week-view {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
          background: var(--neutral-200);
          border-radius: 8px;
          overflow: hidden;
        }

        .week-day {
          background: white;
          min-height: 400px;
          display: flex;
          flex-direction: column;
          cursor: pointer;
          transition: all 0.2s;
        }

        .week-day:hover {
          background: var(--neutral-50);
        }

        .week-day.selected {
          background: var(--role-accent-light);
          border: 2px solid var(--role-accent);
        }

        .week-day-header {
          padding: 1rem;
          border-bottom: 2px solid var(--neutral-100);
          text-align: center;
          transition: all 0.2s;
        }

        .week-day:hover .week-day-header {
          background: rgba(0, 0, 0, 0.02);
        }

        .week-day-name {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--neutral-500);
          text-transform: uppercase;
          margin-bottom: 0.25rem;
        }

        .week-day-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          font-size: 1rem;
          font-weight: 600;
          color: var(--neutral-800);
        }

        .week-day-number.today {
          background: var(--role-accent);
          color: white;
          border-radius: 50%;
          font-weight: 700;
        }

        .week-day-events {
          flex: 1;
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .no-events {
          padding: 1rem;
          text-align: center;
          font-size: 0.75rem;
          color: var(--neutral-400);
        }

        .week-event {
          padding: 0.75rem;
          border-radius: 6px;
          border-left: 3px solid;
          background: var(--neutral-50);
          cursor: pointer;
          transition: all 0.2s;
        }

        .week-event:hover {
          background: var(--neutral-100);
          transform: translateY(-2px);
          box-shadow: var(--shadow-card);
        }

        .week-event.vencido {
          border-left-color: var(--error-red-500);
          background: var(--error-red-50);
        }

        .week-event.porVencer {
          border-left-color: var(--warning-yellow-500);
          background: var(--warning-yellow-50);
        }

        .week-event.pendiente {
          border-left-color: var(--role-accent);
        }

        .week-event.enviado {
          border-left-color: var(--success-green-500);
          background: var(--success-green-50);
        }

        .week-event-time {
          font-size: 0.625rem;
          font-weight: 600;
          color: var(--neutral-500);
          margin-bottom: 0.25rem;
        }

        .week-event-title {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--neutral-800);
          margin-bottom: 0.25rem;
          line-height: 1.2;
        }

        .week-event-entity {
          font-size: 0.7rem;
          color: var(--neutral-500);
        }

        /* Vista Lista */
        .list-view {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-height: 600px;
          overflow-y: auto;
          padding: 0.5rem;
        }

        .list-event {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: white;
          border-radius: 8px;
          border-left: 4px solid;
          box-shadow: var(--shadow-card);
          transition: all 0.2s;
          cursor: pointer;
        }

        .list-event:hover {
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .list-event.vencido {
          border-left-color: var(--error-red-500);
          background: var(--error-red-50);
        }

        .list-event.porVencer {
          border-left-color: var(--warning-yellow-500);
          background: var(--warning-yellow-50);
        }

        .list-event.pendiente {
          border-left-color: var(--role-accent);
        }

        .list-event.enviado {
          border-left-color: var(--success-green-500);
          background: var(--success-green-50);
        }

        .list-event-date {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.5rem;
          background: white;
          border-radius: 8px;
          min-width: 60px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .list-date-day {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--neutral-800);
          line-height: 1;
        }

        .list-date-month {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--neutral-500);
          text-transform: uppercase;
          margin-top: 0.125rem;
        }

        .list-date-year {
          font-size: 0.625rem;
          color: var(--neutral-400);
          margin-top: 0.125rem;
        }

        .list-event-content {
          flex: 1;
          min-width: 0;
        }

        .list-event-content h4 {
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--neutral-800);
          margin: 0 0 0.25rem;
        }

        .list-event-content p {
          font-size: 0.8125rem;
          color: var(--neutral-500);
          margin: 0 0 0.5rem;
        }

        .list-event-status {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          background: var(--neutral-200);
          color: var(--neutral-700);
        }

        .list-event-status.vencido {
          background: var(--error-red-100);
          color: var(--error-red-700);
        }

        .list-event-status.porVencer {
          background: var(--warning-yellow-100);
          color: var(--warning-yellow-700);
        }

        .list-event-status.enviado {
          background: var(--success-green-100);
          color: var(--success-green-700);
        }

        .list-event-badge {
          display: flex;
          align-items: center;
          padding: 0.5rem 1rem;
          background: white;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--neutral-600);
          white-space: nowrap;
        }

        @media (max-width: 768px) {
          .week-view {
            grid-template-columns: 1fr;
          }

          .list-event {
            flex-direction: column;
            align-items: flex-start;
          }

          .list-event-date {
            flex-direction: row;
            gap: 0.5rem;
            min-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
