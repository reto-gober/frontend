import type { ReportePeriodo } from "../../lib/services";
import { EstadoBadge } from "./EstadoBadge";
import { DiasHastaVencimiento } from "./DiasHastaVencimiento";
import FilesList from '../reportes/FilesList';
import FileViewer from '../reportes/FileViewer';
import { useState } from 'react';

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

interface TarjetaPeriodoProps {
  periodo: ReportePeriodo;
  onAccion?: (accion: string, periodoId: string) => void;
  mostrarResponsables?: boolean;
  archivos?: ArchivoDTO[];
  resaltar?: boolean;
}

export function TarjetaPeriodo({
  periodo,
  onAccion,
  mostrarResponsables = false, archivos = [],
  resaltar = false,
}: TarjetaPeriodoProps) {
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<ArchivoDTO | null>(null);
  
  const formatearFecha = (fecha: string) => {
    return new Date(fecha + "T00:00:00").toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatearFechaHora = (fechaHora: string) => {
    // Si la fecha ya incluye timestamp, usarla directamente
    const date = fechaHora.includes('T') ? new Date(fechaHora) : new Date(fechaHora + 'T00:00:00');
    return date.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };



  const formatearPeriodo = () => {
    const inicio = formatearFecha(periodo.periodoInicio);
    const fin = formatearFecha(periodo.periodoFin);
    return `${inicio} - ${fin}`;
  };

  const cardStyles = {
    padding: "1.5rem",
    marginBottom: "1rem",
    transition: "all 0.2s",
    cursor: "pointer",
    boxShadow: resaltar
      ? "0 0 0 2px var(--role-accent), 0 8px 20px rgba(0,0,0,0.08)"
      : undefined,
    background: resaltar ? "var(--role-accent-light, #fff7ed)" : undefined,
    borderRadius: "8px",
  };

  return (
    <div
      className="card"
      style={cardStyles}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = resaltar
          ? "0 0 0 2px var(--role-accent), 0 8px 20px rgba(0,0,0,0.08)"
          : "";
        e.currentTarget.style.transform = "";
        if (resaltar) {
          e.currentTarget.style.background =
            "var(--role-accent-light, #fff7ed)";
        }
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "1rem",
        }}
      >
        <div style={{ flex: 1 }}>
          <h3
            style={{
              margin: 0,
              fontSize: "1.125rem",
              fontWeight: 600,
              color: "var(--color-text)",
              marginBottom: "0.5rem",
            }}
          >
            {periodo.reporteNombre}
          </h3>
          <div
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-light)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              </svg>
              {periodo.entidadNombre}
            </span>
            <span style={{ color: "var(--color-border)" }}>•</span>
            <span
              style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              {formatearPeriodo()}
            </span>
          </div>
        </div>
        <EstadoBadge
          estado={periodo.estado}
          estadoDescripcion={periodo.estadoDescripcion}
        />
      </div>

      {/* Info Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--color-text-light)",
              fontWeight: 500,
              marginBottom: "0.25rem",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Fecha Vencimiento
          </div>
          <div
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--color-text)",
            }}
          >
            {formatearFecha(periodo.fechaVencimientoCalculada)}
          </div>
          <div style={{ marginTop: "0.375rem" }}>
            <DiasHastaVencimiento
              fechaVencimiento={periodo.fechaVencimientoCalculada}
              estado={periodo.estado}
            />
          </div>
        </div>

        {periodo.fechaEnvioReal && (
          <div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--color-text-light)",
                fontWeight: 500,
                marginBottom: "0.25rem",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Fecha Envío
            </div>
            <div
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--color-text)",
              }}
            >
              {formatearFechaHora(periodo.fechaEnvioReal)}
            </div>
            {periodo.diasDesviacion !== null && (
              <div style={{
                fontSize: '0.75rem',
                color: periodo.diasDesviacion > 0 ? 'var(--color-danger)' : 'var(--color-success)',
                marginTop: '0.25rem'
              }}>
                {periodo.diasDesviacion > 0 
                  ? `${periodo.diasDesviacion} día${periodo.diasDesviacion !== 1 ? 's' : ''} de retraso`
                  : `${Math.abs(periodo.diasDesviacion)} día${Math.abs(periodo.diasDesviacion) !== 1 ? 's' : ''} de anticipación`
                }
              </div>
            )}
            {periodo.diasDesviacion === 0 && (
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--color-success)',
                marginTop: '0.25rem',
                fontWeight: 500
              }}>
                ✓ Enviado justo a tiempo
              </div>
            )}
          </div>
        )}

        <div>
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--color-text-light)",
              fontWeight: 500,
              marginBottom: "0.25rem",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Archivos Adjuntos
          </div>
          <div
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--color-text)",
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
            </svg>
            {periodo.cantidadArchivos} archivo
            {periodo.cantidadArchivos !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Responsables */}
      {mostrarResponsables && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
            marginBottom: "1rem",
            paddingTop: "1rem",
            borderTop: "1px solid var(--color-border)",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--color-text-light)",
                fontWeight: 500,
                marginBottom: "0.375rem",
              }}
            >
              Responsable Elaboración
            </div>
            <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>
              {periodo.responsableElaboracion.nombreCompleto}
            </div>
            <div
              style={{ fontSize: "0.75rem", color: "var(--color-text-light)" }}
            >
              {periodo.responsableElaboracion.cargo}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--color-text-light)",
                fontWeight: 500,
                marginBottom: "0.375rem",
              }}
            >
              Responsable Supervisión
            </div>
            <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>
              {periodo.responsableSupervision.nombreCompleto}
            </div>
            <div
              style={{ fontSize: "0.75rem", color: "var(--color-text-light)" }}
            >
              {periodo.responsableSupervision.cargo}
            </div>
          </div>
        </div>
      )}

      {/* Comentarios */}
      {periodo.comentarios && (
        <div
          style={{
            padding: "0.75rem",
            backgroundColor: "var(--color-gray-50)",
            borderRadius: "6px",
            marginBottom: "1rem",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--color-text-light)",
              fontWeight: 500,
              marginBottom: "0.375rem",
            }}
          >
            Comentarios
          </div>
          <div
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text)",
              whiteSpace: "pre-wrap",
            }}
          >
            {periodo.comentarios}
          </div>
        </div>
      )}

      {/* Archivos Adjuntos */}
      {archivos && archivos.length > 0 && (
        <div style={{
          marginBottom: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--color-border)'
        }}>
          <div style={{
            fontSize: '0.75rem',
            color: 'var(--color-text-light)',
            fontWeight: 500,
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Archivos Adjuntos ({archivos.length})
          </div>
          <FilesList 
            periodoId={periodo.periodoId}
            archivos={archivos}
            onViewFile={setArchivoSeleccionado}
            compact={true}
          />
        </div>
      )}

      {/* Acciones */}
      {onAccion && (
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          {/* Botón Ver Detalle - Siempre disponible */}
          <button
            className="btn btn-secondary btn-with-icon"
            onClick={() => onAccion('ver', periodo.periodoId)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            Ver Detalle
          </button>

          {/* Acciones del Responsable */}
          {periodo.puedeEnviar && (
            <button
              className="btn btn-primary btn-with-icon"
              onClick={() => onAccion("enviar", periodo.periodoId)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
              Enviar Reporte
            </button>
          )}
          {periodo.puedeCorregir && (
            <button
              className="btn btn-warning btn-with-icon"
              onClick={() => onAccion("corregir", periodo.periodoId)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
              Corregir y Reenviar
            </button>
          )}

          {/* Acciones del Supervisor - NO mostrar si mostrarResponsables es false */}
          {mostrarResponsables && periodo.puedeAprobar && (
            <button
              className="btn btn-success btn-with-icon"
              onClick={() => onAccion("aprobar", periodo.periodoId)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Aprobar
            </button>
          )}
          {mostrarResponsables && periodo.puedeRechazar && (
            <button
              className="btn btn-danger btn-with-icon"
              onClick={() => onAccion("rechazar", periodo.periodoId)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              Rechazar
            </button>
          )}
        </div>
      )}

      {/* Modal de visualización */}
      {archivoSeleccionado && (
        <FileViewer
          archivo={archivoSeleccionado}
          periodoId={periodo.periodoId}
          onClose={() => setArchivoSeleccionado(null)}
        />
      )}
    </div>
  );
}  
