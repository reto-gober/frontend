import { useState, useEffect } from 'react';
import adminCumplimientoService from '../../lib/services/adminCumplimientoService';
import notifications from '../../lib/notifications';
import type { AdminCumplimientoDTO, FiltrosCumplimientoDTO } from '../../lib/types/admin';
import '../../styles/cumplimiento.css';

export default function AdminCumplimientoClient() {
  const [data, setData] = useState<AdminCumplimientoDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'miembros' | 'entidades' | 'timeline'>('miembros');
  const [filtros, setFiltros] = useState<FiltrosCumplimientoDTO>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('totalReportes');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadData();
  }, [filtros]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const responseData = await adminCumplimientoService.getCumplimiento(filtros);
      setData(responseData);
    } catch (error: any) {
      notifications.error('Error al cargar datos de cumplimiento');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: keyof FiltrosCumplimientoDTO, value: string) => {
    setFiltros(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const handleTabChange = (tab: 'miembros' | 'entidades' | 'timeline') => {
    setActiveTab(tab);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedData = () => {
    if (!data) return [];
    
    let items: any[] = activeTab === 'miembros' 
      ? [...(data.cargaPorResponsable || [])]
      : [...(data.distribucionPorEntidad || [])];
    
    // Filtrar por búsqueda
    if (searchTerm) {
      items = items.filter(item => {
        const searchIn = activeTab === 'miembros'
          ? `${(item as any).nombreCompleto} ${(item as any).email}`.toLowerCase()
          : (item as any).nombreEntidad.toLowerCase();
        return searchIn.includes(searchTerm.toLowerCase());
      });
    }
    
    // Ordenar
    items.sort((a, b) => {
      const aVal = (a as any)[sortField];
      const bVal = (b as any)[sortField];
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      return (aVal < bVal ? -1 : aVal > bVal ? 1 : 0) * multiplier;
    });
    
    return items;
  };

  const renderKPIs = () => {
    if (!data || !data.kpisGenerales) return null;
    
    const kpis = [
      {
        icon: 'eye',
        label: 'En Revisión',
        value: data.kpisGenerales.reportesEnRevision,
        color: 'blue'
      },
      {
        icon: 'alert',
        label: 'Requieren Corrección',
        value: data.kpisGenerales.reportesRequierenCorreccion,
        color: 'orange'
      },
      {
        icon: 'clock',
        label: 'Pendientes',
        value: data.kpisGenerales.reportesPendientes,
        color: 'purple'
      },
      {
        icon: 'x-circle',
        label: 'Atrasados',
        value: data.kpisGenerales.reportesAtrasados,
        color: 'red'
      }
    ];

    return (
      <div className="kpis-row">
        {kpis.map(kpi => (
          <div key={kpi.label} className="kpi-card">
            <div className={`kpi-icon ${kpi.color}`}>
              {renderIcon(kpi.icon)}
            </div>
            <div className="kpi-content">
              <div className="kpi-value">{kpi.value}</div>
              <div className="kpi-label">{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handleNavigate = (path: string) => {
    window.location.href = path;
  };

  const renderAdminMetrics = () => {
    if (!data || !data.adminMetrics) return null;
    
    return (
      <div className="admin-metrics-grid">
        <div className="metric-card" onClick={() => handleNavigate('/roles/admin/reportes')}>
          <div className="metric-icon reports">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div className="metric-content">
            <div className="metric-value">{data.adminMetrics.totalReportesConfigurados}</div>
            <div className="metric-label">Reportes Configurados</div>
          </div>
        </div>
        
        <div className="metric-card" onClick={() => handleNavigate('/roles/admin/entidades')}>
          <div className="metric-icon entities">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div className="metric-content">
            <div className="metric-value">{data.adminMetrics.totalEntidades}</div>
            <div className="metric-label">Entidades</div>
          </div>
        </div>
        
        <div className="metric-card metric-highlight">
          <div className="metric-icon compliance">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="metric-content">
            <div className="metric-value">{data.adminMetrics.cumplimientoGlobalPorcentaje.toFixed(1)}%</div>
            <div className="metric-label">Cumplimiento Global</div>
          </div>
        </div>
      </div>
    );
  };

  const renderTablaMiembros = () => {
    const items = getSortedData();
    
    return (
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th onClick={() => handleSort('nombreCompleto')}>
                Miembro {sortField === 'nombreCompleto' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('totalReportes')}>
                Asignados {sortField === 'totalReportes' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('pendientes')}>
                Pendientes {sortField === 'pendientes' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('enRevision')}>
                En Revisión {sortField === 'enRevision' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('aprobados')}>
                Aprobados {sortField === 'aprobados' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('atrasados')}>
                Atrasados {sortField === 'atrasados' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('porcentajeCumplimiento')}>
                Cumplimiento {sortField === 'porcentajeCumplimiento' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any) => (
              <tr key={item.responsableId}>
                <td>
                  <div className="user-cell">
                    <div className="user-avatar">{item.nombreCompleto.charAt(0)}</div>
                    <div className="user-info">
                      <div className="user-name">{item.nombreCompleto}</div>
                      <div className="user-email">{item.email}</div>
                    </div>
                  </div>
                </td>
                <td><span className="badge badge-neutral">{item.totalReportes}</span></td>
                <td><span className="badge badge-purple">{item.pendientes}</span></td>
                <td><span className="badge badge-blue">{item.enRevision}</span></td>
                <td><span className="badge badge-green">{item.aprobados}</span></td>
                <td><span className="badge badge-red">{item.atrasados}</span></td>
                <td>
                  <div className="progress-cell">
                    <div className="progress-bar-mini">
                      <div 
                        className="progress-fill-mini" 
                        style={{ width: `${item.porcentajeCumplimiento}%` }}
                      />
                    </div>
                    <span className="progress-text-mini">{item.porcentajeCumplimiento.toFixed(0)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTablaEntidades = () => {
    const items = getSortedData();
    
    return (
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th onClick={() => handleSort('nombreEntidad')}>
                Entidad {sortField === 'nombreEntidad' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('totalReportes')}>
                Total {sortField === 'totalReportes' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('pendientes')}>
                Pendientes {sortField === 'pendientes' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('enRevision')}>
                En Revisión {sortField === 'enRevision' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('aprobados')}>
                Aprobados {sortField === 'aprobados' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any) => (
              <tr key={item.entidadId}>
                <td>
                  <div className="entity-cell">
                    <div className="entity-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      </svg>
                    </div>
                    <strong>{item.nombreEntidad}</strong>
                  </div>
                </td>
                <td><span className="badge badge-neutral">{item.totalReportes}</span></td>
                <td><span className="badge badge-purple">{item.pendientes}</span></td>
                <td><span className="badge badge-blue">{item.enRevision}</span></td>
                <td><span className="badge badge-green">{item.aprobados}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTimeline = () => {
    if (!data || !data.accionesRecientes || data.accionesRecientes.length === 0) {
      return (
        <div className="empty-state">
          <p>No hay acciones recientes para mostrar</p>
        </div>
      );
    }

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    };

    const getStateClass = (actionType: string) => {
      const typeMap: Record<string, string> = {
        'override_submit': 'enviado',
        'override_approve': 'aprobado',
        'override_reject': 'rechazado',
        'evidence_upload': 'en_revision',
        'correction_requested': 'requiere_correccion'
      };
      return typeMap[actionType] || 'enviado';
    };

    const getActionLabel = (actionType: string) => {
      const labels: Record<string, string> = {
        'override_submit': 'Reporte Enviado (Admin)',
        'override_approve': 'Reporte Aprobado (Admin)',
        'override_reject': 'Reporte Rechazado (Admin)',
        'evidence_upload': 'Evidencia Subida (Admin)',
        'correction_requested': 'Corrección Solicitada'
      };
      return labels[actionType] || actionType;
    };

    return (
      <div className="timeline-container">
        {data.accionesRecientes.map((accion: any) => (
          <div key={accion.actionId} className="timeline-item">
            <div className={`timeline-dot ${getStateClass(accion.actionType)}`} />
            <div className="timeline-content">
              <div className="timeline-header">
                <div className="timeline-title">{getActionLabel(accion.actionType)}</div>
                <div className="timeline-date">{formatDate(accion.createdAt)}</div>
              </div>
              <div className="timeline-meta">
                {accion.adminNombre && (
                  <div className="timeline-meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>{accion.adminNombre}</span>
                  </div>
                )}
                {accion.reporteNombre && (
                  <div className="timeline-meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span>{accion.reporteNombre}</span>
                  </div>
                )}
                {accion.responsableAfectado && (
                  <div className="timeline-meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 1v6m0 6v6m6-6h-6m6 0h6" />
                    </svg>
                    <span>Afectado: {accion.responsableAfectado}</span>
                  </div>
                )}
              </div>
              {accion.motivo && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#6b7280' }}>
                  {accion.motivo}
                </div>
              )}
              {accion.filesCount > 0 && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#3b82f6' }}>
                  📎 {accion.filesCount} archivo{accion.filesCount > 1 ? 's' : ''} adjunto{accion.filesCount > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderIcon = (icon: string) => {
    const iconComponents: Record<string, React.ReactElement> = {
      eye: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
      alert: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
      clock: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      'x-circle': (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      )
    };
    
    return iconComponents[icon] || null;
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner-large"></div>
        <p>Cargando datos de cumplimiento...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="error-container">
        <p>Error al cargar los datos</p>
      </div>
    );
  }

  return (
    <div className="cumplimiento-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Cumplimiento Regulatorio</h1>
          <p className="page-subtitle">Vista consolidada del cumplimiento general del sistema</p>
        </div>
        <button className="btn btn-primary" onClick={() => loadData()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          Actualizar
        </button>
      </div>

      {/* KPIs Generales */}
      {renderKPIs()}

      {/* Métricas Admin */}
      {renderAdminMetrics()}

      {/* Filtros y Búsqueda */}
      <div className="filters-bar">
        <div className="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onInput={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'miembros' ? 'active' : ''}`}
            onClick={() => handleTabChange('miembros')}
          >
            Por Miembro
          </button>
          <button
            className={`tab ${activeTab === 'entidades' ? 'active' : ''}`}
            onClick={() => handleTabChange('entidades')}
          >
            Por Entidad
          </button>
          <button
            className={`tab ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => handleTabChange('timeline')}
          >
            Línea de Tiempo
          </button>
        </div>
      </div>

      {/* Contenido de Tabs */}
      <div className="tab-content">
        {activeTab === 'miembros' && renderTablaMiembros()}
        {activeTab === 'entidades' && renderTablaEntidades()}
        {activeTab === 'timeline' && renderTimeline()}
      </div>
    </div>
  );
}
