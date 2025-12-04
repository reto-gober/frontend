import { useState, useEffect } from 'react';
import { entidadesService, reportesService, type EntidadResponse, type ReporteResponse } from '../../lib/services';

interface EntidadWithStats extends EntidadResponse {
  cantidadReportes: number;
  cantidadResponsables: number;
  cumplimiento: number;
}

export default function AdminEntidadesClient() {
  const [entidades, setEntidades] = useState<EntidadWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarEntidades();
  }, []);

  const cargarEntidades = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [entidadesData, reportesData] = await Promise.all([
        entidadesService.listar(0, 100),
        reportesService.listar(0, 1000)
      ]);

      // Calcular estadísticas por entidad
      const entidadesConStats: EntidadWithStats[] = entidadesData.content.map(entidad => {
        const reportesEntidad = reportesData.content.filter(r => r.entidadId === entidad.entidadId);
        const responsablesUnicos = new Set(reportesEntidad.flatMap(r => r.responsableElaboracionIds || []));
        
        // Calcular cumplimiento (reportes completados vs total)
        const completados = reportesEntidad.filter(r => r.estado === 'COMPLETADO').length;
        const cumplimiento = reportesEntidad.length > 0 
          ? Math.round((completados / reportesEntidad.length) * 100)
          : 0;

        return {
          ...entidad,
          cantidadReportes: reportesEntidad.length,
          cantidadResponsables: responsablesUnicos.size,
          cumplimiento
        };
      });

      setEntidades(entidadesConStats);
    } catch (err) {
      console.error('Error al cargar entidades:', err);
      setError('Error al cargar las entidades');
    } finally {
      setLoading(false);
    }
  };

  const getLogoColor = (index: number) => {
    const colors = ['blue', 'orange', 'green', 'purple', 'red'];
    return colors[index % colors.length];
  };

  const getSigla = (nombre: string) => {
    return nombre.split(' ').map(word => word.charAt(0)).join('').toUpperCase().substring(0, 4);
  };

  if (loading) {
    return (
      <div className="entidades-page">
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
          <p style={{ marginTop: '1rem', color: 'var(--neutral-600)' }}>Cargando entidades...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="entidades-page">
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <p style={{ color: 'var(--error-red-600)' }}>{error}</p>
          <button onClick={cargarEntidades} className="btn-primary" style={{ marginTop: '1rem' }}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="entidades-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-info">
          <h1 className="page-title">Gestión de Entidades</h1>
          <p className="page-description">Administra las entidades regulatorias del sistema</p>
        </div>
        <button className="btn-primary" id="btnNuevaEntidad">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 22V8l9-5 9 5v14"/>
            <line x1="12" y1="8" x2="12" y2="14"/>
            <line x1="9" y1="11" x2="15" y2="11"/>
          </svg>
          Nueva Entidad
        </button>
      </div>

      {/* Grid de entidades */}
      <div className="entidades-grid">
        {entidades.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--neutral-500)' }}>
            No hay entidades registradas
          </div>
        ) : (
          entidades.map((entidad, index) => (
            <div key={entidad.entidadId} className="entidad-card">
              <div className="entidad-header">
                <div className={`entidad-logo ${getLogoColor(index)}`}>
                  <span>{getSigla(entidad.nombre)}</span>
                </div>
                <div className="entidad-actions">
                  <button className="btn-icon" title="Editar">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="entidad-info">
                <h3 className="entidad-nombre">{entidad.nombre}</h3>
                <span className="entidad-sigla">{getSigla(entidad.nombre)}</span>
              </div>
              <div className="entidad-stats">
                <div className="stat-item">
                  <span className="stat-value">{entidad.cantidadReportes}</span>
                  <span className="stat-label">Reportes</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{entidad.cantidadResponsables}</span>
                  <span className="stat-label">Responsables</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{entidad.cumplimiento}%</span>
                  <span className="stat-label">Cumplimiento</span>
                </div>
              </div>
              <div className="entidad-footer">
                <span className={`status-${entidad.estado === 'ACTIVA' ? 'active' : 'inactive'}`}>
                  {entidad.estado}
                </span>
                <a href={`/roles/admin/reportes?entidad=${entidad.entidadId}`} className="link-reportes">
                  Ver reportes →
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
