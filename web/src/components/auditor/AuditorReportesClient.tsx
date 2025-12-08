import { useEffect, useMemo, useState } from 'react';
import { dashboardService, type ReporteConsultaAuditor } from '../../lib/services';

const estadoClases: Record<string, string> = {
  aprobado: 'sent',
  enviado_a_tiempo: 'sent',
  enviado_tarde: 'review',
  pendiente: 'pending',
  dentro_plazo: 'review',
  vencido: 'observations',
};

const estadoLabel = (estado?: string) => {
  if (!estado) return 'N/D';
  return estado.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

const formatearFecha = (fecha?: string | null) => {
  if (!fecha) return 'N/D';
  return new Date(fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function AuditorReportesClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportes, setReportes] = useState<ReporteConsultaAuditor[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEntidad, setFiltroEntidad] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  useEffect(() => {
    cargarReportes();
  }, []);

  const cargarReportes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardService.reportesAuditor();
      setReportes(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error al cargar reportes auditor:', err);
      const message = err?.response?.data?.message || 'No se pudieron cargar los reportes enviados';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const reportesFiltrados = useMemo(() => {
    return reportes.filter((rep) => {
      const coincideBusqueda =
        rep.obligacion.toLowerCase().includes(busqueda.toLowerCase()) ||
        (rep.responsable || '').toLowerCase().includes(busqueda.toLowerCase()) ||
        rep.entidad.toLowerCase().includes(busqueda.toLowerCase());
      const coincideEntidad = filtroEntidad ? rep.entidad === filtroEntidad : true;
      const coincideEstado = filtroEstado ? (rep.estado || '').toLowerCase() === filtroEstado.toLowerCase() : true;
      return coincideBusqueda && coincideEntidad && coincideEstado;
    });
  }, [reportes, busqueda, filtroEntidad, filtroEstado]);

  const exportar = () => {
    const headers = ['Obligacion', 'Entidad', 'Responsable', 'Estado', 'Fecha Vencimiento', 'Fecha Envio'];
    const rows = reportesFiltrados.map((r) => [
      r.obligacion,
      r.entidad,
      r.responsable || '',
      estadoLabel(r.estado),
      r.fechaVencimiento || '',
      r.fechaEnvio || '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reportes_auditor_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--neutral-600)' }}>Cargando reportes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: 'var(--error-red-600)' }}>{error}</p>
        <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={cargarReportes}>
          Reintentar
        </button>
      </div>
    );
  }

  const entidadesDisponibles = Array.from(new Set(reportes.map((r) => r.entidad))).sort();

  return (
    <div className="reportes-page">
      <div className="page-header">
        <div className="header-info">
          <h1 className="page-title">Reportes - Vista General</h1>
          <p className="page-description">Consulta consolidada de todos los reportes enviados</p>
        </div>
        <div className="header-actions">
          <button className="btn-export" onClick={exportar}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7,10 12,15 17,10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Exportar Lista
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="search-box">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por codigo, titulo o responsable..."
            className="search-input"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="filters">
          <select className="filter-select" value={filtroEntidad} onChange={(e) => setFiltroEntidad(e.target.value)}>
            <option value="">Entidad</option>
            {entidadesDisponibles.map((ent) => (
              <option key={ent} value={ent}>{ent}</option>
            ))}
          </select>
          <select className="filter-select" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <option value="">Estado</option>
            <option value="enviado_a_tiempo">Enviado</option>
            <option value="aprobado">Aprobado</option>
            <option value="pendiente">Pendiente</option>
            <option value="vencido">Vencido</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <div className="table-wrapper">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Codigo</th>
                <th>Titulo del Reporte</th>
                <th>Entidad</th>
                <th>Responsable</th>
                <th>Estado</th>
                <th>Fecha Vencimiento</th>
                <th>Fecha Envio</th>
              </tr>
            </thead>
            <tbody>
              {reportesFiltrados.map((rep) => (
                <tr key={rep.id} className={rep.estado === 'vencido' ? 'overdue' : ''}>
                  <td><span className="code">{rep.obligacion.slice(0, 8).toUpperCase()}</span></td>
                  <td>
                    <div className="report-title">
                      <span className="title">{rep.obligacion}</span>
                      <span className="subtitle">{rep.entidad}</span>
                    </div>
                  </td>
                  <td><span className="entity-badge sui">{rep.entidad.slice(0, 3).toUpperCase()}</span></td>
                  <td>
                    <div className="user-info">
                      <span className="user-name">{rep.responsable || 'No asignado'}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${estadoClases[rep.estado || ''] || 'review'}`}>
                      {estadoLabel(rep.estado)}
                    </span>
                  </td>
                  <td><span className="date">{formatearFecha(rep.fechaVencimiento)}</span></td>
                  <td><span className="date">{formatearFecha(rep.fechaEnvio)}</span></td>
                </tr>
              ))}
              {reportesFiltrados.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--neutral-600)', padding: '1rem' }}>
                    No hay reportes para mostrar con los filtros actuales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination (placeholder) */}
        <div className="table-footer">
          <div className="showing-info">
            Mostrando {reportesFiltrados.length} de {reportes.length} reportes
          </div>
          <div className="pagination">
            <button className="page-btn disabled">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button className="page-btn active">1</button>
            <button className="page-btn disabled">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
