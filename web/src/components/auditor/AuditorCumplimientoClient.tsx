import { useEffect, useMemo, useState } from 'react';
import {
  dashboardService,
  type CumplimientoEntidadAuditor,
  type ReporteConsultaAuditor,
  type ResumenEjecutivoAuditor,
} from '../../lib/services';

type AlertaCumplimiento = {
  tipo: 'critical' | 'warning' | 'info';
  entidad?: string;
  titulo: string;
  descripcion: string;
};

export default function AuditorCumplimientoClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resumen, setResumen] = useState<ResumenEjecutivoAuditor | null>(null);
  const [entidades, setEntidades] = useState<CumplimientoEntidadAuditor[]>([]);
  const [reportes, setReportes] = useState<ReporteConsultaAuditor[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEntidad, setFiltroEntidad] = useState<string>('Todas');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dashboard, reportesResp] = await Promise.all([
        dashboardService.dashboardAuditor(),
        dashboardService.reportesAuditor().catch(() => []),
      ]);

      setResumen(dashboard?.resumenEjecutivo || null);
      setEntidades(dashboard?.cumplimientoPorEntidad || []);
      setReportes(Array.isArray(reportesResp) ? reportesResp : []);
    } catch (err: any) {
      console.error('Error al cargar cumplimiento auditor:', err);
      const message = err?.response?.data?.message || 'No se pudo cargar la informacion de cumplimiento';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const entidadesFiltradas = useMemo(() => {
    return entidades.filter((ent) => {
      const coincideBusqueda =
        ent.entidad.toLowerCase().includes(busqueda.toLowerCase()) ||
        (ent.tipoEntidad || '').toLowerCase().includes(busqueda.toLowerCase());
      const coincideFiltro = filtroEntidad === 'Todas' ? true : ent.entidad === filtroEntidad;
      return coincideBusqueda && coincideFiltro;
    });
  }, [entidades, busqueda, filtroEntidad]);

  const alertas = useMemo<AlertaCumplimiento[]>(() => {
    const lista: AlertaCumplimiento[] = [];
    const peorEntidad = [...entidades].sort((a, b) => a.porcentaje - b.porcentaje).slice(0, 2);
    peorEntidad.forEach((e) => {
      lista.push({
        tipo: e.porcentaje < 60 ? 'critical' : 'warning',
        entidad: e.entidad,
        titulo: 'Cumplimiento bajo',
        descripcion: `${e.porcentaje.toFixed(1)}% sobre ${e.totalObligaciones} obligaciones`,
      });
    });

    const vencidos = reportes
      .filter((r) => (r.estado || '').toLowerCase().includes('venc') || (r.fechaVencimiento && new Date(r.fechaVencimiento) < new Date()))
      .slice(0, 1);

    vencidos.forEach((r) => {
      lista.push({
        tipo: 'critical',
        entidad: r.entidad,
        titulo: `Vencido: ${r.obligacion}`,
        descripcion: `Responsable: ${r.responsable || 'No asignado'}`,
      });
    });

    return lista.slice(0, 3);
  }, [entidades, reportes]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--neutral-600)' }}>Cargando cumplimiento...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: 'var(--error-red-600)' }}>{error}</p>
        <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={cargarDatos}>
          Reintentar
        </button>
      </div>
    );
  }

  const porcentajeGlobal = resumen?.porcentajeCumplimiento ?? 0;
  const entidadTabs = ['Todas', ...entidades.slice(0, 5).map((e) => e.entidad)];

  return (
    <div className="cumplimiento-page">
      <div className="page-header">
        <div className="header-info">
          <h1 className="page-title">Cumplimiento Regulatorio</h1>
          <p className="page-description">Datos reales consolidados desde el backend</p>
        </div>
        <div className="header-actions">
          <div className="date-range">
            <span>{resumen ? `${resumen.nombreMes} ${resumen.anio}` : 'Mes actual'}</span>
          </div>
          <button className="btn-export" onClick={cargarDatos}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7,10 12,15 17,10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Actualizar
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12l2 2 4-4" />
            </svg>
          </div>
          <div className="summary-content">
            <span className="summary-value">{porcentajeGlobal.toFixed(1)}%</span>
            <span className="summary-label">Cumplimiento Global</span>
          </div>
          <div className="summary-trend up">
            {resumen?.variacionMensual !== undefined ? `${resumen.variacionMensual >= 0 ? '+' : '-'}${Math.abs(resumen.variacionMensual).toFixed(1)}%` : 'N/A'}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon blue">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div className="summary-content">
            <span className="summary-value">{resumen?.totalObligaciones ?? 0}</span>
            <span className="summary-label">Total Reportes</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon green">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="summary-content">
            <span className="summary-value">{resumen?.cumplidas ?? 0}</span>
            <span className="summary-label">A Tiempo</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon red">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="summary-content">
            <span className="summary-value">{resumen?.vencidas ?? 0}</span>
            <span className="summary-label">Fuera de Tiempo</span>
          </div>
        </div>
      </div>

      {/* Entity Filter Tabs */}
      <div className="entity-tabs">
        {entidadTabs.map((ent) => (
          <button
            key={ent}
            className={`entity-tab ${filtroEntidad === ent ? 'active' : ''}`}
            onClick={() => setFiltroEntidad(ent)}
          >
            <span className="tab-dot all"></span>
            {ent}
          </button>
        ))}
      </div>

      {/* Compliance Table */}
      <div className="compliance-table-container">
        <div className="table-header">
          <div className="table-title">
            <h3>Detalle de Cumplimiento por Entidad</h3>
            <span className="table-subtitle">Vista consolidada con datos reales</span>
          </div>
          <div className="table-search">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por entidad..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>
        <div className="table-wrapper">
          <table className="compliance-table">
            <thead>
              <tr>
                <th>Entidad</th>
                <th>Total</th>
                <th>Completados</th>
                <th>Pendientes</th>
                <th>Atrasados</th>
                <th>Cumplimiento</th>
              </tr>
            </thead>
            <tbody>
              {entidadesFiltradas.map((ent) => (
                <tr key={ent.entidadId}>
                  <td>
                    <div className="entity-info">
                      <span className="entity-badge sui">{ent.entidad.slice(0, 3).toUpperCase()}</span>
                      <span className="entity-name">{ent.entidad}</span>
                    </div>
                  </td>
                  <td className="center">{ent.totalObligaciones}</td>
                  <td className="center">
                    <span className="count-badge green">{ent.cumplidas}</span>
                  </td>
                  <td className="center">
                    <span className="count-badge yellow">{ent.pendientes}</span>
                  </td>
                  <td className="center">
                    <span className="count-badge red">{ent.vencidas}</span>
                  </td>
                  <td>
                    <div className="compliance-bar">
                      <div className="bar-track">
                        <div
                          className={`bar-fill ${ent.porcentaje >= 80 ? 'green' : ent.porcentaje >= 60 ? 'warning' : 'red'}`}
                          style={{ width: `${Math.min(ent.porcentaje, 100)}%` }}
                        ></div>
                      </div>
                      <span className={`bar-value ${ent.porcentaje < 60 ? 'warning' : ''}`}>{ent.porcentaje.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {entidadesFiltradas.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--neutral-500)', padding: '1rem' }}>
                    No hay entidades para mostrar con los filtros actuales
                  </td>
                </tr>
              )}
            </tbody>
            {entidadesFiltradas.length > 0 && (
              <tfoot>
                <tr>
                  <td><strong>TOTAL</strong></td>
                  <td className="center"><strong>{entidadesFiltradas.reduce((acc, e) => acc + e.totalObligaciones, 0)}</strong></td>
                  <td className="center"><strong>{entidadesFiltradas.reduce((acc, e) => acc + e.cumplidas, 0)}</strong></td>
                  <td className="center"><strong>{entidadesFiltradas.reduce((acc, e) => acc + e.pendientes, 0)}</strong></td>
                  <td className="center"><strong>{entidadesFiltradas.reduce((acc, e) => acc + e.vencidas, 0)}</strong></td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="alerts-section">
        <div className="alerts-header">
          <h3 className="alerts-title">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Alertas de Cumplimiento
          </h3>
        </div>
        <div className="alerts-grid">
          {alertas.length === 0 && (
            <p style={{ color: 'var(--neutral-600)', padding: '1rem' }}>No se encontraron alertas para mostrar.</p>
          )}
          {alertas.map((alerta, idx) => (
            <div key={idx} className={`alert-card ${alerta.tipo}`}>
              <div className="alert-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  {alerta.tipo === 'critical' ? (
                    <>
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </>
                  ) : (
                    <polyline points="12,6 12,12 16,14" />
                  )}
                </svg>
              </div>
              <div className="alert-content">
                {alerta.entidad && <span className="alert-badge">{alerta.entidad}</span>}
                <h4 className="alert-title">{alerta.titulo}</h4>
                <p className="alert-description">{alerta.descripcion}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
