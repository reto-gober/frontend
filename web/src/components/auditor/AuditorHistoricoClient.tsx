import { useEffect, useMemo, useState } from 'react';
import {
  dashboardService,
  type DashboardAuditor,
} from '../../lib/services';

type FilaHistorica = {
  mes: string;
  total: number;
  cumplidas: number;
  vencidas: number;
  porcentaje: number;
};

export default function AuditorHistoricoClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<DashboardAuditor | null>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardService.dashboardAuditor();
      setDashboard(data);
    } catch (err: any) {
      console.error('Error al cargar historico auditor:', err);
      const message = err?.response?.data?.message || 'No se pudo cargar el historico';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const tendencias = dashboard?.analisisTendencias || null;
  const resumen = dashboard?.resumenEjecutivo || null;

  const filas: FilaHistorica[] = useMemo(() => {
    if (!tendencias) return [];
    return tendencias.meses.map((mes, idx) => ({
      mes,
      total: tendencias.totalObligaciones[idx] || 0,
      cumplidas: tendencias.cumplidas[idx] || 0,
      vencidas: tendencias.vencidas[idx] || 0,
      porcentaje: tendencias.porcentajesCumplimiento[idx] || 0,
    }));
  }, [tendencias]);

  const stats = useMemo(() => {
    if (!tendencias) {
      return { promedio: 0, mejorMes: '-', mejorValor: 0, mesActual: '-', totalReportes: 0 };
    }
    const promedio =
      tendencias.porcentajesCumplimiento.reduce((acc, v) => acc + v, 0) /
      (tendencias.porcentajesCumplimiento.length || 1);
    const mejorIdx = tendencias.porcentajesCumplimiento.indexOf(
      Math.max(...tendencias.porcentajesCumplimiento),
    );
    const mesActual = tendencias.meses[tendencias.meses.length - 1] || 'Actual';
    const mejorMes = tendencias.meses[mejorIdx] || '-';
    const mejorValor = tendencias.porcentajesCumplimiento[mejorIdx] || 0;
    const totalReportes = tendencias.totalObligaciones.reduce((acc, v) => acc + v, 0);
    return { promedio, mejorMes, mejorValor, mesActual, totalReportes };
  }, [tendencias]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--neutral-600)' }}>Cargando historico...</p>
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

  return (
    <div className="historico-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-info">
          <h1 className="page-title">Historico de Cumplimiento</h1>
          <p className="page-description">Evolucion temporal basada en datos reales</p>
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

      {/* Period Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-header">
            <span className="summary-label">Promedio 6 meses</span>
          </div>
          <div className="summary-value">{stats.promedio.toFixed(1)}%</div>
          <div className="summary-trend">
            <span className="trend-text">Promedio de cumplimiento</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-header">
            <span className="summary-label">Mejor Mes</span>
          </div>
          <div className="summary-value">{stats.mejorValor.toFixed(1)}%</div>
          <div className="summary-trend">
            <span className="trend-text">{stats.mejorMes}</span>
          </div>
        </div>
        <div className="summary-card highlight">
          <div className="summary-header">
            <span className="summary-label">Mes Actual</span>
          </div>
          <div className="summary-value">
            {(tendencias?.porcentajesCumplimiento.slice(-1)[0] ?? 0).toFixed(1)}%
          </div>
          <div className="summary-trend">
            <span className="trend-text">{stats.mesActual}</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-header">
            <span className="summary-label">Reportes Totales</span>
          </div>
          <div className="summary-value">{stats.totalReportes}</div>
          <div className="summary-trend">
            <span className="trend-text">En los ultimos 6 meses</span>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="chart-section">
        <div className="chart-header">
          <h3 className="chart-title">Evolucion del Cumplimiento</h3>
        </div>
        <div className="chart-container">
          <div className="line-chart" style={{ padding: '1rem' }}>
            <div className="chart-y-axis">
              <span>100%</span>
              <span>80%</span>
              <span>60%</span>
              <span>40%</span>
              <span>20%</span>
              <span>0%</span>
            </div>
            <div className="chart-area" style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
              {filas.map((fila) => (
                <div key={fila.mes} style={{ flex: 1 }}>
                  <div
                    style={{
                      height: `${fila.porcentaje}%`,
                      background: 'linear-gradient(180deg, var(--role-accent) 0%, var(--role-accent-light) 100%)',
                      borderRadius: '6px 6px 0 0',
                      minHeight: '12px',
                    }}
                    title={`${fila.porcentaje.toFixed(1)}%`}
                  ></div>
                  <div className="chart-x-axis" style={{ textAlign: 'center', marginTop: '0.35rem' }}>
                    <span>{fila.mes}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-line purple"></span>
              <span className="legend-text">Cumplimiento global</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed History Table */}
      <div className="table-section">
        <div className="table-header">
          <h3 className="table-title">Historico Detallado por Mes</h3>
        </div>
        <div className="table-wrapper">
          <table className="compliance-table">
            <thead>
              <tr>
                <th>Mes</th>
                <th>Total Reportes</th>
                <th>Cumplidos</th>
                <th>Vencidos</th>
                <th>Cumplimiento</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((fila) => (
                <tr key={fila.mes}>
                  <td>{fila.mes}</td>
                  <td className="center">{fila.total}</td>
                  <td className="center">{fila.cumplidas}</td>
                  <td className="center">{fila.vencidas}</td>
                  <td className="center">{fila.porcentaje.toFixed(1)}%</td>
                </tr>
              ))}
              {filas.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--neutral-600)', padding: '1rem' }}>
                    No hay datos historicos disponibles.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
