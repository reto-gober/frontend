import { useEffect, useMemo, useState } from 'react';
import {
  dashboardService,
  type CumplimientoEntidadAuditor,
  type ResumenEjecutivoAuditor,
} from '../../lib/services';

const colorClases = ['sui', 'creg', 'anh', 'sspd', 'minenergia'];

export default function AuditorEntidadesClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entidades, setEntidades] = useState<CumplimientoEntidadAuditor[]>([]);
  const [resumen, setResumen] = useState<ResumenEjecutivoAuditor | null>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashboard, entidadesResp] = await Promise.all([
        dashboardService.dashboardAuditor(),
        dashboardService.cumplimientoEntidadAuditor().catch(() => []),
      ]);

      setResumen(dashboard?.resumenEjecutivo || null);
      const dataset = dashboard?.cumplimientoPorEntidad && dashboard.cumplimientoPorEntidad.length > 0
        ? dashboard.cumplimientoPorEntidad
        : Array.isArray(entidadesResp) ? entidadesResp : [];
      setEntidades(dataset);
    } catch (err: any) {
      console.error('Error al cargar entidades auditor:', err);
      const message = err?.response?.data?.message || 'No se pudieron cargar las entidades';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const totalEntidades = entidades.length;
    const totalReportes = entidades.reduce((acc, e) => acc + e.totalObligaciones, 0);
    const pendientes = entidades.reduce((acc, e) => acc + e.pendientes, 0);
    const promedio = totalEntidades > 0 ? entidades.reduce((acc, e) => acc + e.porcentaje, 0) / totalEntidades : 0;
    return { totalEntidades, totalReportes, pendientes, promedio };
  }, [entidades]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--neutral-600)' }}>Cargando entidades...</p>
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
    <div className="entidades-page">
      <div className="page-header">
        <div className="header-info">
          <h1 className="page-title">Entidades Regulatorias</h1>
          <p className="page-description">Informacion consolidada desde el backend</p>
        </div>
        <div className="header-actions">
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
              <path d="M3 21h18" />
              <path d="M5 21V7l8-4v18" />
              <path d="M19 21V11l-6-4" />
              <path d="M9 9v.01" />
              <path d="M9 12v.01" />
              <path d="M9 15v.01" />
              <path d="M9 18v.01" />
            </svg>
          </div>
          <div className="summary-content">
            <span className="summary-value">{stats.totalEntidades}</span>
            <span className="summary-label">Entidades Activas</span>
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
            <span className="summary-value">{stats.totalReportes}</span>
            <span className="summary-label">Reportes Totales</span>
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
            <span className="summary-value">{stats.promedio.toFixed(1)}%</span>
            <span className="summary-label">Cumplimiento Global</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon yellow">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
          </div>
          <div className="summary-content">
            <span className="summary-value">{stats.pendientes}</span>
            <span className="summary-label">Reportes Pendientes</span>
          </div>
        </div>
      </div>

      {/* Entities Grid */}
      <div className="entities-grid">
        {entidades.map((ent, idx) => {
          const clase = colorClases[idx % colorClases.length];
          return (
            <div className="entity-card" key={ent.entidadId}>
              <div className={`entity-header ${clase}`}>
                <div className="entity-logo">
                  <span className="logo-text">{ent.entidad.slice(0, 3).toUpperCase()}</span>
                </div>
                <div className="entity-title">
                  <h3>{ent.entidad}</h3>
                  <span className="entity-type">{ent.tipoEntidad || 'Entidad Reguladora'}</span>
                </div>
                <div className={`entity-status ${ent.porcentaje >= 80 ? 'ok' : ent.porcentaje >= 60 ? '' : 'critical'}`}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  {ent.porcentaje >= 80 ? 'OK' : ent.porcentaje >= 60 ? 'Atencion' : 'Critico'}
                </div>
              </div>
              <div className="entity-body">
                <div className="entity-stats">
                  <div className="stat-item">
                    <span className="stat-value">{ent.totalObligaciones}</span>
                    <span className="stat-label">Reportes</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value success">{ent.cumplidas}</span>
                    <span className="stat-label">Enviados</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value warning">{ent.pendientes}</span>
                    <span className="stat-label">Pendientes</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value danger">{ent.vencidas}</span>
                    <span className="stat-label">Atrasados</span>
                  </div>
                </div>
                <div className="compliance-bar">
                  <div className="bar-header">
                    <span className="bar-label">Cumplimiento</span>
                    <span className="bar-value">{ent.porcentaje.toFixed(1)}%</span>
                  </div>
                  <div className="bar-track">
                    <div className={`bar-fill ${clase}`} style={{ width: `${Math.min(ent.porcentaje, 100)}%` }}></div>
                  </div>
                </div>
                <div className="entity-details">
                  <div className="detail-row">
                    <span className="detail-label">Responsables asignados:</span>
                    <span className="detail-value">{resumen?.totalObligaciones ? Math.max(1, Math.round(ent.totalObligaciones / (resumen.totalObligaciones || 1))) : 'N/D'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Pendientes:</span>
                    <span className="detail-value">{ent.pendientes}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Vencidos:</span>
                    <span className={`detail-value ${ent.vencidas > 0 ? 'urgent' : ''}`}>{ent.vencidas}</span>
                  </div>
                </div>
              </div>
              <div className="entity-footer">
                <a href={`/roles/auditor/reportes?entity=${encodeURIComponent(ent.entidad)}`} className="btn-link">
                  Ver Reportes
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </a>
              </div>
            </div>
          );
        })}
        {entidades.length === 0 && (
          <p style={{ color: 'var(--neutral-600)', padding: '1rem' }}>
            No hay entidades registradas con obligaciones para mostrar.
          </p>
        )}
      </div>
    </div>
  );
}
