import { useState, useEffect } from "react";
import { reportesService, ReporteResponse, Page } from "../../lib/services";
import { esEstadoEnviado } from "../../lib/utils/estados";

interface EntidadCumplimiento {
  id: string;
  nombre: string;
  codigo: string;
  reportesTotales: number;
  reportesEnviados: number;
  reportesPendientes: number;
  porcentaje: number;
  estado: "excelente" | "bueno" | "riesgo" | "critico";
  ultimoReporte: string;
  tendencia: "up" | "down" | "stable";
}

// Función para calcular el estado de cumplimiento
const calcularEstado = (porcentaje: number): EntidadCumplimiento["estado"] => {
  if (porcentaje >= 90) return "excelente";
  if (porcentaje >= 75) return "bueno";
  if (porcentaje >= 50) return "riesgo";
  return "critico";
};

// Función para agrupar reportes por entidad
const agruparPorEntidad = (
  reportes: ReporteResponse[]
): EntidadCumplimiento[] => {
  const entidadesMap = new Map<string, EntidadCumplimiento>();

  reportes.forEach((reporte) => {
    const key = reporte.entidadId;

    if (!entidadesMap.has(key)) {
      entidadesMap.set(key, {
        id: reporte.entidadId,
        nombre: reporte.entidadNombre,
        codigo: reporte.entidadNombre
          .split(" ")
          .map((word) => word[0])
          .join("")
          .toUpperCase()
          .substring(0, 6),
        reportesTotales: 0,
        reportesEnviados: 0,
        reportesPendientes: 0,
        porcentaje: 0,
        estado: "critico",
        ultimoReporte: reporte.updatedAt || reporte.createdAt,
        tendencia: "stable",
      });
    }

    const entidad = entidadesMap.get(key)!;
    entidad.reportesTotales++;

    if (esEstadoEnviado(reporte.estado)) {
      entidad.reportesEnviados++;
    } else {
      entidad.reportesPendientes++;
    }

    // Actualizar último reporte si es más reciente
    const fechaReporte = new Date(reporte.updatedAt || reporte.createdAt);
    const fechaUltimo = new Date(entidad.ultimoReporte);
    if (fechaReporte > fechaUltimo) {
      entidad.ultimoReporte = reporte.updatedAt || reporte.createdAt;
    }
  });

  // Calcular porcentajes y estados
  return Array.from(entidadesMap.values()).map((entidad) => {
    entidad.porcentaje =
      entidad.reportesTotales > 0
        ? Math.round((entidad.reportesEnviados / entidad.reportesTotales) * 100)
        : 0;
    entidad.estado = calcularEstado(entidad.porcentaje);
    return entidad;
  });
};

interface CumplimientoTableProps {
  showSearch?: boolean;
  showExport?: boolean;
  onRowClick?: (entidad: EntidadCumplimiento) => void;
  readonly?: boolean;
}

export default function CumplimientoTable({
  showSearch = true,
  showExport = true,
  onRowClick,
  readonly = false,
}: CumplimientoTableProps) {
  const [busqueda, setBusqueda] = useState("");
  const [ordenarPor, setOrdenarPor] =
    useState<keyof EntidadCumplimiento>("porcentaje");
  const [ordenAsc, setOrdenAsc] = useState(false);
  const [entidades, setEntidades] = useState<EntidadCumplimiento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      // Cargar todos los reportes y agrupar por entidad
      const response = await reportesService.listar(0, 1000);
      const entidadesAgrupadas = agruparPorEntidad(response.content);
      setEntidades(entidadesAgrupadas);
    } catch (error) {
      console.error("Error al cargar datos de cumplimiento:", error);
      setEntidades([]);
    } finally {
      setLoading(false);
    }
  };

  const entidadesFiltradas = entidades
    .filter(
      (e) =>
        e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        e.codigo.toLowerCase().includes(busqueda.toLowerCase())
    )
    .sort((a, b) => {
      const valorA = a[ordenarPor];
      const valorB = b[ordenarPor];
      if (typeof valorA === "number" && typeof valorB === "number") {
        return ordenAsc ? valorA - valorB : valorB - valorA;
      }
      return 0;
    });

  const getEstadoClase = (estado: EntidadCumplimiento["estado"]) => {
    switch (estado) {
      case "excelente":
        return "status-excellent";
      case "bueno":
        return "status-good";
      case "riesgo":
        return "status-risk";
      case "critico":
        return "status-critical";
    }
  };

  const getEstadoTexto = (estado: EntidadCumplimiento["estado"]) => {
    switch (estado) {
      case "excelente":
        return "Excelente";
      case "bueno":
        return "Bueno";
      case "riesgo":
        return "En Riesgo";
      case "critico":
        return "Crítico";
    }
  };

  const getTendenciaIcono = (tendencia: EntidadCumplimiento["tendencia"]) => {
    switch (tendencia) {
      case "up":
        return (
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          </svg>
        );
      case "down":
        return (
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
          </svg>
        );
      case "stable":
        return (
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        );
    }
  };

  const handleSort = (columna: keyof EntidadCumplimiento) => {
    if (ordenarPor === columna) {
      setOrdenAsc(!ordenAsc);
    } else {
      setOrdenarPor(columna);
      setOrdenAsc(false);
    }
  };

  return (
    <div className="cumplimiento-table-component">
      {(showSearch || showExport) && (
        <div className="table-toolbar">
          {showSearch && (
            <div className="search-box">
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Buscar entidad..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          )}
          {showExport && (
            <button className="btn-export">
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Exportar
            </button>
          )}
        </div>
      )}

      <div className="table-wrapper">
        <table className="cumplimiento-table">
          <thead>
            <tr>
              <th>Entidad</th>
              <th
                className="sortable center"
                onClick={() => handleSort("reportesTotales")}
              >
                Total
                <span className="sort-icon">↕</span>
              </th>
              <th className="center">Enviados</th>
              <th className="center">Pendientes</th>
              <th className="sortable" onClick={() => handleSort("porcentaje")}>
                Cumplimiento
                <span className="sort-icon">↕</span>
              </th>
              <th className="center">Tendencia</th>
              <th className="center">Estado</th>
              <th>Último Reporte</th>
            </tr>
          </thead>
          <tbody>
            {entidadesFiltradas.map((entidad) => (
              <tr
                key={entidad.id}
                onClick={() => onRowClick?.(entidad)}
                className={onRowClick ? "clickable" : ""}
              >
                <td>
                  <div className="entidad-info">
                    <span className="entidad-codigo">{entidad.codigo}</span>
                    <span className="entidad-nombre">{entidad.nombre}</span>
                  </div>
                </td>
                <td className="center">
                  <span className="count-badge">{entidad.reportesTotales}</span>
                </td>
                <td className="center">
                  <span className="count-badge success">
                    {entidad.reportesEnviados}
                  </span>
                </td>
                <td className="center">
                  <span
                    className={`count-badge ${entidad.reportesPendientes > 0 ? "warning" : ""}`}
                  >
                    {entidad.reportesPendientes}
                  </span>
                </td>
                <td>
                  <div className="cumplimiento-cell">
                    <div className="progress-bar">
                      <div
                        className={`progress-fill ${entidad.porcentaje >= 90 ? "excellent" : entidad.porcentaje >= 80 ? "good" : entidad.porcentaje >= 70 ? "risk" : "critical"}`}
                        style={{ width: `${entidad.porcentaje}%` }}
                      />
                    </div>
                    <span className="porcentaje-valor">
                      {entidad.porcentaje}%
                    </span>
                  </div>
                </td>
                <td className="center">
                  <span className={`tendencia-icon ${entidad.tendencia}`}>
                    {getTendenciaIcono(entidad.tendencia)}
                  </span>
                </td>
                <td className="center">
                  <span
                    className={`estado-badge ${getEstadoClase(entidad.estado)}`}
                  >
                    {getEstadoTexto(entidad.estado)}
                  </span>
                </td>
                <td>
                  <span className="fecha">{entidad.ultimoReporte}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {readonly && (
        <div className="readonly-notice">
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
          <span>Vista de solo lectura</span>
        </div>
      )}

      <style>{`
        .cumplimiento-table-component {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .table-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: white;
          border: 1px solid var(--neutral-200, #e5e7eb);
          border-radius: 8px;
          flex: 1;
          max-width: 300px;
        }

        .search-box svg {
          color: var(--neutral-400, #9ca3af);
        }

        .search-box input {
          border: none;
          outline: none;
          flex: 1;
          font-size: 0.875rem;
          background: transparent;
        }

        .btn-export {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: var(--role-accent, #3d85d1);
          border: none;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-export:hover {
          opacity: 0.9;
        }

        .table-wrapper {
          overflow-x: auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .cumplimiento-table {
          width: 100%;
          border-collapse: collapse;
        }

        .cumplimiento-table th {
          padding: 0.875rem 1rem;
          text-align: left;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--neutral-500, #6b7280);
          background: var(--neutral-50, #f9fafb);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }

        .cumplimiento-table th.sortable {
          cursor: pointer;
          user-select: none;
        }

        .cumplimiento-table th.sortable:hover {
          background: var(--neutral-100, #f3f4f6);
        }

        .sort-icon {
          margin-left: 0.25rem;
          opacity: 0.5;
        }

        .cumplimiento-table td {
          padding: 1rem;
          font-size: 0.875rem;
          color: var(--neutral-700, #374151);
          border-top: 1px solid var(--neutral-100, #f3f4f6);
        }

        .cumplimiento-table tr.clickable {
          cursor: pointer;
        }

        .cumplimiento-table tr.clickable:hover td {
          background: var(--neutral-50, #f9fafb);
        }

        .center {
          text-align: center;
        }

        .entidad-info {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .entidad-codigo {
          font-weight: 600;
          color: var(--neutral-800, #1f2937);
        }

        .entidad-nombre {
          font-size: 0.75rem;
          color: var(--neutral-500, #6b7280);
        }

        .count-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 28px;
          height: 24px;
          padding: 0 0.5rem;
          background: var(--neutral-100, #f3f4f6);
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--neutral-600, #4b5563);
        }

        .count-badge.success {
          background: #dcfce7;
          color: #16a34a;
        }

        .count-badge.warning {
          background: #fef9e6;
          color: #d4a72c;
        }

        .cumplimiento-cell {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .progress-bar {
          flex: 1;
          height: 8px;
          background: var(--neutral-200, #e5e7eb);
          border-radius: 4px;
          overflow: hidden;
          min-width: 80px;
        }

        .progress-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .progress-fill.excellent {
          background: #22c55e;
        }

        .progress-fill.good {
          background: #84cc16;
        }

        .progress-fill.risk {
          background: #F4C453;
        }

        .progress-fill.critical {
          background: #ef4444;
        }

        .porcentaje-valor {
          font-weight: 600;
          min-width: 40px;
        }

        .tendencia-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 6px;
        }

        .tendencia-icon.up {
          background: #dcfce7;
          color: #16a34a;
        }

        .tendencia-icon.down {
          background: #fef2f2;
          color: #dc2626;
        }

        .tendencia-icon.stable {
          background: var(--neutral-100, #f3f4f6);
          color: var(--neutral-500, #6b7280);
        }

        .estado-badge {
          display: inline-flex;
          padding: 0.25rem 0.625rem;
          border-radius: 12px;
          font-size: 0.6875rem;
          font-weight: 600;
        }

        .status-excellent {
          background: #dcfce7;
          color: #16a34a;
        }

        .status-good {
          background: #ecfccb;
          color: #65a30d;
        }

        .status-risk {
          background: #fef9e6;
          color: #d4a72c;
        }

        .status-critical {
          background: #fef2f2;
          color: #dc2626;
        }

        .fecha {
          font-size: 0.8125rem;
          color: var(--neutral-500, #6b7280);
        }

        .readonly-notice {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: var(--neutral-100, #f3f4f6);
          border-radius: 8px;
          font-size: 0.75rem;
          color: var(--neutral-500, #6b7280);
        }
      `}</style>
    </div>
  );
}
