import { useState, useEffect } from 'react';
import { reportesService, entidadesService, usuariosService, type ReporteResponse, type EntidadResponse } from '../../lib/services';

export default function AdminReportesClient() {
  const [reportes, setReportes] = useState<ReporteResponse[]>([]);
  const [filteredReportes, setFilteredReportes] = useState<ReporteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEntidad, setFilterEntidad] = useState('');
  const [filterFrecuencia, setFilterFrecuencia] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  const [entidades, setEntidades] = useState<EntidadResponse[]>([]);
  const [estadisticas, setEstadisticas] = useState({
    todos: 0,
    pendientes: 0,
    enProgreso: 0,
    completados: 0,
    vencidos: 0
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    aplicarFiltros();
    calcularEstadisticas();
  }, [searchTerm, filterEntidad, filterFrecuencia, filterEstado, reportes]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [reportesData, entidadesData] = await Promise.all([
        reportesService.listar(0, 1000),
        entidadesService.listar(0, 100)
      ]);

      setReportes(reportesData.content);
      setFilteredReportes(reportesData.content);
      setEntidades(entidadesData.content);
    } catch (err) {
      console.error('Error al cargar reportes:', err);
      setError('Error al cargar los reportes');
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let filtered = [...reportes];

    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterEntidad) {
      filtered = filtered.filter(r => r.entidadId === filterEntidad);
    }

    if (filterFrecuencia) {
      filtered = filtered.filter(r => r.frecuencia === filterFrecuencia);
    }

    if (filterEstado) {
      filtered = filtered.filter(r => r.estado === filterEstado);
    }

    setFilteredReportes(filtered);
  };

  const calcularEstadisticas = () => {
    setEstadisticas({
      todos: reportes.length,
      pendientes: reportes.filter(r => r.estado === 'PENDIENTE').length,
      enProgreso: reportes.filter(r => r.estado === 'EN_PROGRESO').length,
      completados: reportes.filter(r => r.estado === 'COMPLETADO').length,
      vencidos: reportes.filter(r => r.estado === 'VENCIDO').length
    });
  };

  const getEstadoBadgeClass = (estado: string) => {
    switch(estado) {
      case 'PENDIENTE': return 'pending';
      case 'EN_PROGRESO': return 'progress';
      case 'COMPLETADO': return 'completed';
      case 'VENCIDO': return 'overdue';
      default: return 'default';
    }
  };

  const formatFechaVencimiento = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="reportes-page">
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
          <p style={{ marginTop: '1rem', color: 'var(--neutral-600)' }}>Cargando reportes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reportes-page">
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <p style={{ color: 'var(--error-red-600)' }}>{error}</p>
          <button onClick={cargarDatos} className="btn-primary" style={{ marginTop: '1rem' }}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="reportes-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-info">
          <h1 className="page-title">Gestión de Reportes</h1>
          <p className="page-description">Vista global de todos los reportes del sistema</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7,10 12,15 17,10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Exportar
          </button>
          <button className="btn-primary">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="11" x2="12" y2="17"/>
              <line x1="9" y1="14" x2="15" y2="14"/>
            </svg>
            Nuevo Reporte
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="status-stats">
        <div className="status-card all active">
          <span className="status-count">{estadisticas.todos}</span>
          <span className="status-label">Todos</span>
        </div>
        <div className="status-card pending">
          <span className="status-count">{estadisticas.pendientes}</span>
          <span className="status-label">Pendientes</span>
        </div>
        <div className="status-card progress">
          <span className="status-count">{estadisticas.enProgreso}</span>
          <span className="status-label">En Progreso</span>
        </div>
        <div className="status-card sent">
          <span className="status-count">{estadisticas.completados}</span>
          <span className="status-label">Completados</span>
        </div>
        <div className="status-card overdue">
          <span className="status-count">{estadisticas.vencidos}</span>
          <span className="status-label">Vencidos</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-bar">
        <div className="search-box">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar reportes..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select className="filter-select" value={filterEntidad} onChange={(e) => setFilterEntidad(e.target.value)}>
            <option value="">Todas las entidades</option>
            {entidades.map(e => (
              <option key={e.entidadId} value={e.entidadId}>{e.nombre}</option>
            ))}
          </select>
          <select className="filter-select" value={filterFrecuencia} onChange={(e) => setFilterFrecuencia(e.target.value)}>
            <option value="">Frecuencia</option>
            <option value="MENSUAL">Mensual</option>
            <option value="TRIMESTRAL">Trimestral</option>
            <option value="SEMESTRAL">Semestral</option>
            <option value="ANUAL">Anual</option>
          </select>
          <select className="filter-select" value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="EN_PROGRESO">En Progreso</option>
            <option value="COMPLETADO">Completado</option>
            <option value="VENCIDO">Vencido</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="table-container">
        <table className="reportes-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Entidad</th>
              <th>Frecuencia</th>
              <th>Vencimiento</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredReportes.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--neutral-500)' }}>
                  No se encontraron reportes
                </td>
              </tr>
            ) : (
              filteredReportes.map(reporte => (
                <tr key={reporte.reporteId}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{reporte.nombre}</div>
                    {reporte.descripcion && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', marginTop: '0.25rem' }}>
                        {reporte.descripcion.substring(0, 60)}...
                      </div>
                    )}
                  </td>
                  <td>{reporte.entidadNombre || 'N/A'}</td>
                  <td>{reporte.frecuencia}</td>
                  <td>{formatFechaVencimiento(reporte.fechaVencimiento)}</td>
                  <td>
                    <span className={`status-badge ${getEstadoBadgeClass(reporte.estado)}`}>
                      {reporte.estado}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon" title="Ver detalles">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                      <button className="btn-icon" title="Editar">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
