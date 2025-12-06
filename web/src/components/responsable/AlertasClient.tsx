import { useState, useEffect } from "react";
import { flujoReportesService, type ReportePeriodo } from "../../lib/services";

interface Alerta {
  id: string;
  tipo: "critica" | "advertencia" | "info" | "exito";
  titulo: string;
  mensaje: string;
  fecha: string;
  leida: boolean;
  periodoId?: string;
  reporteNombre?: string;
}

export default function AlertasClient() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"todas" | "noLeidas" | "leidas">(
    "todas"
  );
  const [tipoFiltro, setTipoFiltro] = useState<string>("");

  useEffect(() => {
    loadAlertas();
  }, []);

  const loadAlertas = async () => {
    try {
      setLoading(true);

      // Cargar todos los periodos para generar alertas
      const response = await flujoReportesService.misPeriodos(0, 1000);
      const periodos = response.content;

      const now = new Date();
      const tresDias = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const generatedAlertas: Alerta[] = [];

      periodos.forEach((periodo) => {
        if (!periodo.fechaVencimientoCalculada) return;

        const fechaVenc = new Date(periodo.fechaVencimientoCalculada);
        const esEnviado =
          periodo.estado === "ENVIADO" || periodo.estado === "APROBADO";

        // Alertas críticas - Reportes vencidos
        if (fechaVenc < now && !esEnviado) {
          const diasVencido = Math.ceil(
            (now.getTime() - fechaVenc.getTime()) / (1000 * 60 * 60 * 24)
          );
          generatedAlertas.push({
            id: `vencido-${periodo.periodoId}`,
            tipo: "critica",
            titulo: "Reporte vencido",
            mensaje: `${periodo.reporteNombre} - ${periodo.entidadNombre} venció hace ${diasVencido} día${diasVencido > 1 ? "s" : ""}`,
            fecha: fechaVenc.toISOString(),
            leida: false,
            periodoId: periodo.periodoId,
            reporteNombre: periodo.reporteNombre,
          });
        }

        // Alertas de advertencia - Por vencer en 3 días
        if (fechaVenc >= now && fechaVenc <= tresDias && !esEnviado) {
          const diasRestantes = Math.ceil(
            (fechaVenc.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          generatedAlertas.push({
            id: `porvencer-${periodo.periodoId}`,
            tipo: "advertencia",
            titulo: "Reporte próximo a vencer",
            mensaje: `${periodo.reporteNombre} - ${periodo.entidadNombre} vence en ${diasRestantes} día${diasRestantes > 1 ? "s" : ""}`,
            fecha: fechaVenc.toISOString(),
            leida: false,
            periodoId: periodo.periodoId,
            reporteNombre: periodo.reporteNombre,
          });
        }

        // Alertas de corrección requerida
        if (periodo.estado === "REQUIERE_CORRECCION") {
          generatedAlertas.push({
            id: `correccion-${periodo.periodoId}`,
            tipo: "advertencia",
            titulo: "Corrección requerida",
            mensaje: `${periodo.reporteNombre} - ${periodo.entidadNombre} requiere correcciones`,
            fecha: periodo.updatedAt,
            leida: false,
            periodoId: periodo.periodoId,
            reporteNombre: periodo.reporteNombre,
          });
        }

        // Alertas de éxito - Reportes aprobados recientemente
        if (periodo.estado === "APROBADO") {
          const updatedDate = new Date(periodo.updatedAt);
          const diasDesdeAprobacion = Math.ceil(
            (now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (diasDesdeAprobacion <= 7) {
            generatedAlertas.push({
              id: `aprobado-${periodo.periodoId}`,
              tipo: "exito",
              titulo: "Reporte aprobado",
              mensaje: `${periodo.reporteNombre} - ${periodo.entidadNombre} fue aprobado`,
              fecha: periodo.updatedAt,
              leida: true,
              periodoId: periodo.periodoId,
              reporteNombre: periodo.reporteNombre,
            });
          }
        }
      });

      // Ordenar por fecha (más recientes primero)
      generatedAlertas.sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );

      setAlertas(generatedAlertas);
    } catch (err) {
      console.error("Error al cargar alertas:", err);
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLeida = async (alertaId: string) => {
    try {
      // Actualizar localmente primero para feedback inmediato
      setAlertas((prev) =>
        prev.map((a) => (a.id === alertaId ? { ...a, leida: true } : a))
      );
      
      // Aquí se enviaría al backend si hubiera un endpoint para ello
      // await api.post('/api/alertas/marcar-leida', { alertaId });
    } catch (err) {
      console.error('Error al marcar alerta como leída:', err);
    }
  };

  const marcarTodasComoLeidas = async () => {
    const alertasNoLeidas = alertas.filter(a => !a.leida);
    
    if (alertasNoLeidas.length === 0) {
      alert('No hay alertas pendientes por marcar como leídas');
      return;
    }

    try {
      // Actualizar localmente
      setAlertas((prev) => prev.map((a) => ({ ...a, leida: true })));
      
      // Aquí se enviaría al backend si hubiera un endpoint para ello
      // await api.post('/api/alertas/marcar-todas-leidas');
      
      // Feedback al usuario
      const mensaje = alertasNoLeidas.length === 1 
        ? 'Se marcó 1 alerta como leída'
        : `Se marcaron ${alertasNoLeidas.length} alertas como leídas`;
      
      // Mostrar mensaje temporal
      showToast(mensaje, 'success');
    } catch (err) {
      console.error('Error al marcar todas como leídas:', err);
      showToast('Error al marcar alertas como leídas', 'error');
    }
  };

  const showToast = (mensaje: string, tipo: 'success' | 'error') => {
    // Crear elemento de toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.textContent = mensaje;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      background: ${tipo === 'success' ? 'var(--success-green-500)' : 'var(--error-red-500)'};
      color: white;
      border-radius: 8px;
      box-shadow: var(--shadow-card);
      z-index: 9999;
      animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    
    // Eliminar después de 3 segundos
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  };

  const alertasFiltradas = alertas.filter((a) => {
    if (filtro === "noLeidas" && a.leida) return false;
    if (filtro === "leidas" && !a.leida) return false;
    if (tipoFiltro && a.tipo !== tipoFiltro) return false;
    return true;
  });

  const contadores = {
    criticas: alertas.filter((a) => a.tipo === "critica").length,
    advertencias: alertas.filter((a) => a.tipo === "advertencia").length,
    informativas: alertas.filter((a) => a.tipo === "info").length,
    exito: alertas.filter((a) => a.tipo === "exito").length,
    noLeidas: alertas.filter((a) => !a.leida).length,
    leidas: alertas.filter((a) => a.leida).length,
  };

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha);
    const ahora = new Date();
    const diff = Math.floor((ahora.getTime() - date.getTime()) / 1000);

    if (diff < 60) return "Hace un momento";
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} minutos`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} horas`;
    if (diff < 604800) return `Hace ${Math.floor(diff / 86400)} días`;

    return date.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const agruparPorFecha = () => {
    const grupos: { [key: string]: Alerta[] } = {};
    const hoy = new Date().setHours(0, 0, 0, 0);
    const ayer = new Date(hoy - 86400000);

    alertasFiltradas.forEach((alerta) => {
      const fecha = new Date(alerta.fecha).setHours(0, 0, 0, 0);
      let grupo = "";

      if (fecha === hoy) grupo = "Hoy";
      else if (fecha === ayer.getTime()) grupo = "Ayer";
      else
        grupo = new Date(alerta.fecha).toLocaleDateString("es-CO", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });

      if (!grupos[grupo]) grupos[grupo] = [];
      grupos[grupo].push(alerta);
    });

    return grupos;
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

  const grupos = agruparPorFecha();
  const hayAlertasNoLeidas = alertas.some(a => !a.leida);

  return (
    <div className="alertas-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-info">
          <h1 className="page-title">Alertas y Notificaciones</h1>
          <p className="page-description">
            Centro de alertas y notificaciones importantes
          </p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-mark-all" 
            onClick={marcarTodasComoLeidas}
            disabled={!hayAlertasNoLeidas}
            title={!hayAlertasNoLeidas ? 'No hay alertas pendientes' : 'Marcar todas como leídas'}
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="9,11 12,14 22,4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            Marcar todas como leídas
          </button>
        </div>
      </div>

      {/* Alertas Summary */}
      <div className="alertas-summary">
        <div className="summary-card critical">
          <div className="summary-icon">
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="summary-content">
            <span className="summary-number">{contadores.criticas}</span>
            <span className="summary-label">Críticas</span>
          </div>
        </div>
        <div className="summary-card warning">
          <div className="summary-icon">
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="summary-content">
            <span className="summary-number">{contadores.advertencias}</span>
            <span className="summary-label">Advertencias</span>
          </div>
        </div>
        <div className="summary-card info">
          <div className="summary-icon">
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <div className="summary-content">
            <span className="summary-number">{contadores.informativas}</span>
            <span className="summary-label">Informativas</span>
          </div>
        </div>
        <div className="summary-card success">
          <div className="summary-icon">
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="summary-content">
            <span className="summary-number">{contadores.exito}</span>
            <span className="summary-label">Éxito</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-bar">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filtro === "todas" ? "active" : ""}`}
            onClick={() => setFiltro("todas")}
          >
            Todas ({alertas.length})
          </button>
          <button
            className={`filter-tab ${filtro === "noLeidas" ? "active" : ""}`}
            onClick={() => setFiltro("noLeidas")}
          >
            No leídas ({contadores.noLeidas})
          </button>
          <button
            className={`filter-tab ${filtro === "leidas" ? "active" : ""}`}
            onClick={() => setFiltro("leidas")}
          >
            Leídas ({contadores.leidas})
          </button>
        </div>
        <div className="filter-actions">
          <select
            className="filter-select"
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value)}
          >
            <option value="">Todos los tipos</option>
            <option value="critica">Críticas</option>
            <option value="advertencia">Advertencias</option>
            <option value="info">Informativas</option>
            <option value="exito">Éxito</option>
          </select>
        </div>
      </div>

      {/* Alertas List */}
      <div className="alertas-container">
        {Object.keys(grupos).length === 0 ? (
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
              No hay alertas para mostrar
            </p>
          </div>
        ) : (
          Object.entries(grupos).map(([fecha, alertasGrupo]) => (
            <div key={fecha} className="alertas-group">
              <h3 className="group-title">{fecha}</h3>
              <div className="alertas-list">
                {alertasGrupo.map((alerta) => (
                  <div
                    key={alerta.id}
                    className={`alerta-card ${alerta.tipo} ${alerta.leida ? "read" : "unread"}`}
                    onClick={() => !alerta.leida && marcarComoLeida(alerta.id)}
                  >
                    <div className="alerta-indicator"></div>
                    <div className="alerta-content">
                      <div className="alerta-header">
                        <h4 className="alerta-title">{alerta.titulo}</h4>
                        <span className="alerta-time">
                          {formatearFecha(alerta.fecha)}
                        </span>
                      </div>
                      <p className="alerta-message">{alerta.mensaje}</p>
                      {alerta.periodoId && (
                        <div className="alerta-actions">
                          <button
                            className="alerta-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `/roles/responsable/mis-reportes`;
                            }}
                          >
                            Ver reporte
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .alertas-page {
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

        .btn-mark-all {
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

        .btn-mark-all:hover {
          background: var(--neutral-100);
        }

        .btn-mark-all:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: var(--neutral-50);
        }

        .btn-mark-all:disabled:hover {
          background: var(--neutral-50);
        }

        .alertas-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }

        .summary-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem;
          background: white;
          border-radius: 12px;
          box-shadow: var(--shadow-card);
          border-left: 4px solid;
        }

        .summary-card.critical { border-left-color: var(--error-red-500); }
        .summary-card.warning { border-left-color: var(--warning-yellow-500); }
        .summary-card.info { border-left-color: var(--color-primary-500); }
        .summary-card.success { border-left-color: var(--success-green-500); }

        .summary-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
        }

        .summary-card.critical .summary-icon {
          background: var(--error-red-100);
          color: var(--error-red-600);
        }

        .summary-card.warning .summary-icon {
          background: var(--warning-yellow-100);
          color: var(--warning-yellow-600);
        }

        .summary-card.info .summary-icon {
          background: var(--color-primary-100);
          color: var(--color-primary-600);
        }

        .summary-card.success .summary-icon {
          background: var(--success-green-100);
          color: var(--success-green-600);
        }

        .summary-content {
          display: flex;
          flex-direction: column;
        }

        .summary-number {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--neutral-900);
        }

        .summary-label {
          font-size: 0.8125rem;
          color: var(--neutral-500);
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

        .filter-select {
          padding: 0.5rem 1rem;
          border: 1px solid var(--neutral-200);
          border-radius: 6px;
          font-size: 0.8125rem;
          background: white;
          cursor: pointer;
        }

        .alertas-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .alertas-group {
          background: white;
          border-radius: 12px;
          box-shadow: var(--shadow-card);
          overflow: hidden;
        }

        .group-title {
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--neutral-800);
          padding: 1rem 1.25rem;
          background: var(--neutral-50);
          border-bottom: 1px solid var(--neutral-100);
          margin: 0;
        }

        .alertas-list {
          display: flex;
          flex-direction: column;
        }

        .alerta-card {
          display: flex;
          align-items: flex-start;
          gap: 0.875rem;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--neutral-100);
          transition: background 0.2s;
          cursor: pointer;
        }

        .alerta-card:last-child {
          border-bottom: none;
        }

        .alerta-card:hover {
          background: var(--neutral-50);
        }

        .alerta-card.unread {
          background: var(--role-accent-light, #fef3e2);
        }

        .alerta-card.unread:hover {
          background: var(--role-accent, #fde8c3);
        }

        .alerta-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-top: 0.5rem;
          flex-shrink: 0;
        }

        .alerta-card.unread .alerta-indicator {
          background: var(--role-accent-dark, #f59e0b);
        }

        .alerta-card.read .alerta-indicator {
          background: transparent;
        }

        .alerta-content {
          flex: 1;
          min-width: 0;
        }

        .alerta-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 0.25rem;
        }

        .alerta-title {
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--neutral-800);
          margin: 0;
        }

        .alerta-time {
          font-size: 0.75rem;
          color: var(--neutral-400);
          white-space: nowrap;
        }

        .alerta-message {
          font-size: 0.8125rem;
          color: var(--neutral-600);
          margin: 0 0 0.75rem;
          line-height: 1.5;
        }

        .alerta-actions {
          display: flex;
          gap: 0.75rem;
        }

        .alerta-action-btn {
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--role-accent-dark, #f59e0b);
          text-decoration: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
        }

        .alerta-action-btn:hover {
          text-decoration: underline;
        }

        @media (max-width: 768px) {
          .alertas-summary {
            grid-template-columns: repeat(2, 1fr);
          }

          .filters-bar {
            flex-direction: column;
            gap: 0.75rem;
          }

          .alerta-header {
            flex-direction: column;
            gap: 0.25rem;
          }
        }

        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
