import { useState, useEffect } from 'react';
import {
  reportesService,
  entidadesService,
  flujoReportesService,
  type ReporteResponse,
  type EntidadResponse,
  type ReportePeriodo,
} from '../../lib/services';
import ReporteForm from '../ReporteForm';
import { ModalEnviarReporte } from '../modales/ModalEnviarReporte';
import notifications from '../../lib/notifications';

type PeriodoDecorado = ReportePeriodo & {
  estadoTemporal: 'enviado' | 'activo' | 'futuro' | 'vencido';
  label: string;
};

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

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingReporteId, setEditingReporteId] = useState<string | undefined>(undefined);

  // Panel lateral para intervención manual (carga de reporte/evidencia)
  const [panelCarga, setPanelCarga] = useState({
    open: false,
    loading: false,
    reporteId: '',
    reporteNombre: '',
    periodos: [] as PeriodoDecorado[],
    seleccionado: '' as string,
  });

  const [modalEnviar, setModalEnviar] = useState({
    isOpen: false,
    periodoId: '',
    reporteNombre: '',
    esCorreccion: false,
    periodoInicio: '',
    periodoFin: '',
    frecuencia: '',
  });

  // Modal para seleccionar período al ver detalle
  const [modalSeleccionPeriodo, setModalSeleccionPeriodo] = useState({
    open: false,
    loading: false,
    reporteNombre: '',
    periodos: [] as PeriodoDecorado[],
    seleccionado: '' as string,
  });

  const frecuenciaLabel = (frecuencia?: string) => {
    const map: Record<string, string> = {
      MENSUAL: 'Mensual',
      TRIMESTRAL: 'Trimestral',
      SEMESTRAL: 'Semestral',
      ANUAL: 'Anual',
    };
    if (!frecuencia) return 'Periodo';
    const key = frecuencia.toUpperCase();
    return map[key] || frecuencia.charAt(0).toUpperCase() + frecuencia.slice(1).toLowerCase();
  };

  const formatFechaCorta = (fecha: string) => {
    if (!fecha) return '';
    try {
      return new Date(fecha).toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).replace('.', '');
    } catch (e) {
      return fecha;
    }
  };

  const obtenerEstadoTemporal = (periodo: ReportePeriodo): PeriodoDecorado['estadoTemporal'] => {
    const estadoLower = (periodo.estado || '').toLowerCase();
    if (periodo.fechaEnvioReal || estadoLower.includes('enviado')) return 'enviado';

    const ahora = new Date();
    const inicio = new Date(periodo.periodoInicio);
    const fin = new Date(periodo.periodoFin);

    if (ahora >= inicio && ahora <= fin) return 'activo';
    if (ahora < inicio) return 'futuro';
    return 'vencido';
  };

  const construirLabelPeriodo = (periodo: ReportePeriodo, reporteNombre: string) => {
    const freq = frecuenciaLabel(periodo.frecuencia || periodo.periodoTipo);
    const inicio = formatFechaCorta(periodo.periodoInicio);
    const fin = formatFechaCorta(periodo.periodoFin);
    const estadoTemporal = obtenerEstadoTemporal(periodo);
    const estadoTexto =
      estadoTemporal === 'activo'
        ? 'Activo'
        : estadoTemporal === 'futuro'
        ? 'Próximo'
        : estadoTemporal === 'vencido'
        ? 'Vencido'
        : 'Enviado';

    return `${freq} - ${reporteNombre} - ${inicio} -> ${fin} [${estadoTexto}]`;
  };

  const elegirPeriodoPreferido = (periodos: PeriodoDecorado[]) => {
    if (!periodos.length) return '';

    const disponibles = periodos.filter((p) => p.estadoTemporal !== 'enviado');
    if (!disponibles.length) return '';

    const ahora = new Date();
    const activo = disponibles.find((p) => p.estadoTemporal === 'activo');
    if (activo) return activo.periodoId;

    const calcularDistancia = (p: PeriodoDecorado) => {
      const inicio = new Date(p.periodoInicio).getTime();
      const fin = new Date(p.periodoFin).getTime();
      if (p.estadoTemporal === 'futuro') return Math.abs(inicio - ahora.getTime());
      if (p.estadoTemporal === 'vencido') return Math.abs(ahora.getTime() - fin);
      return 0;
    };

    let mejor = disponibles[0];
    let mejorDist = calcularDistancia(mejor);
    let mejorFuturo = mejor.estadoTemporal === 'futuro';

    for (let i = 1; i < disponibles.length; i++) {
      const candidato = disponibles[i];
      const dist = calcularDistancia(candidato);
      const esFuturo = candidato.estadoTemporal === 'futuro';

      if (
        dist < mejorDist ||
        (dist === mejorDist && esFuturo && !mejorFuturo)
      ) {
        mejor = candidato;
        mejorDist = dist;
        mejorFuturo = esFuturo;
      }
    }

    return mejor.periodoId;
  };

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
    // Los reportes tienen estados: activo, cancelado, suspendido
    // Las estadísticas de cumplimiento deberían venir de los periodos, no de los reportes
    setEstadisticas({
      todos: reportes.length,
      pendientes: 0, // No aplica a nivel de reporte
      enProgreso: reportes.filter(r => r.estado?.toLowerCase() === 'activo').length,
      completados: 0, // No aplica a nivel de reporte
      vencidos: reportes.filter(r => r.estado?.toLowerCase() === 'cancelado' || r.estado?.toLowerCase() === 'suspendido').length
    });
  };

  const getEstadoBadgeClass = (estado: string) => {
    const estadoLower = estado?.toLowerCase() || '';
    switch(estadoLower) {
      case 'activo': return 'active';
      case 'cancelado': return 'cancelled';
      case 'suspendido': return 'suspended';
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

  const handleNuevoReporte = () => {
    setEditingReporteId(undefined);
    setShowModal(true);
  };

  const handleEditReporte = (reporte: ReporteResponse) => {
    setEditingReporteId(reporte.reporteId);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingReporteId(undefined);
    // Recargar lista después de cerrar modal
    setTimeout(() => {
      cargarDatos();
    }, 500);
  };

  const handleDeleteReporte = async (reporteId: string) => {
    const confirmed = await notifications.confirm(
      'Esta acción no se puede deshacer',
      '¿Eliminar reporte?',
      'Sí, eliminar',
      'Cancelar'
    );
    if (!confirmed) return;

    try {
      await reportesService.eliminar(reporteId);
      await cargarDatos();
      notifications.success('Reporte eliminado correctamente');
    } catch (err) {
      console.error('Error al eliminar reporte:', err);
      notifications.error('Error al eliminar el reporte');
    }
  };

  const abrirDetalleReporte = async (reporte: ReporteResponse) => {
    try {
      setModalSeleccionPeriodo((prev) => ({ ...prev, open: true, loading: true, reporteNombre: reporte.nombre }));
      const periodosPage = await flujoReportesService.periodosPorReporte(reporte.reporteId, 0, 200);
      const periodosBase = periodosPage.content || [];
      const periodosOrdenados = [...periodosBase].sort(
        (a, b) => new Date(b.periodoInicio).getTime() - new Date(a.periodoInicio).getTime()
      );

      const periodosDecorados: PeriodoDecorado[] = periodosOrdenados.map((p) => ({
        ...p,
        estadoTemporal: obtenerEstadoTemporal(p),
        label: construirLabelPeriodo(p, reporte.nombre),
      }));

      if (periodosDecorados.length === 0) {
        notifications.info('Este reporte no tiene períodos disponibles para mostrar.');
        setModalSeleccionPeriodo({ open: false, loading: false, reporteNombre: '', periodos: [], seleccionado: '' });
        return;
      }

      // Seleccionar el período más reciente por defecto
      const seleccionado = periodosDecorados[0]?.periodoId || '';

      setModalSeleccionPeriodo((prev) => ({
        ...prev,
        loading: false,
        periodos: periodosDecorados,
        seleccionado,
      }));
    } catch (err) {
      console.error('Error abriendo detalle del reporte', err);
      notifications.error('No se pudo abrir el detalle del reporte');
      setModalSeleccionPeriodo({ open: false, loading: false, reporteNombre: '', periodos: [], seleccionado: '' });
    }
  };

  const abrirPanelCarga = async (reporteId: string, reporteNombre: string, preseleccion?: string) => {
    try {
      setPanelCarga((prev) => ({ ...prev, open: true, loading: true, reporteId, reporteNombre }));
      const periodosPage = await flujoReportesService.periodosPorReporte(reporteId, 0, 200);
      const periodosBase = periodosPage.content || [];
      const periodosOrdenados = [...periodosBase].sort(
        (a, b) => new Date(a.periodoInicio).getTime() - new Date(b.periodoInicio).getTime()
      );

      const periodosDecorados: PeriodoDecorado[] = periodosOrdenados.map((p) => ({
        ...p,
        estadoTemporal: obtenerEstadoTemporal(p),
        label: construirLabelPeriodo(p, reporteNombre),
      }));

      const seleccionado = preseleccion || elegirPeriodoPreferido(periodosDecorados);

      if (!seleccionado && periodosDecorados.length > 0) {
        notifications.info('Todos los periodos de este reporte ya fueron enviados.');
      }

      setPanelCarga((prev) => ({
        ...prev,
        loading: false,
        periodos: periodosDecorados,
        seleccionado,
      }));
    } catch (err) {
      console.error('Error cargando periodos del reporte', err);
      notifications.error('No se pudieron cargar los periodos de este reporte');
      setPanelCarga((prev) => ({ ...prev, loading: false }));
    }
  };

  const cerrarPanelCarga = () => {
    setPanelCarga({ open: false, loading: false, reporteId: '', reporteNombre: '', periodos: [], seleccionado: '' });
  };

  const cerrarModalSeleccionPeriodo = () => {
    setModalSeleccionPeriodo({ open: false, loading: false, reporteNombre: '', periodos: [], seleccionado: '' });
  };

  const navegarAPeriodoSeleccionado = () => {
    if (!modalSeleccionPeriodo.seleccionado) {
      notifications.info('Selecciona un período para ver su detalle');
      return;
    }
    
    // Detectar el rol actual desde la URL
    const currentPath = window.location.pathname;
    const isAdmin = currentPath.includes('/roles/admin/');
    const isSupervisor = currentPath.includes('/roles/supervisor/');
    
    let basePath = '/roles/admin/reportes';
    if (isSupervisor) {
      basePath = '/roles/supervisor/reportes';
    }
    
    window.location.href = `${basePath}/${modalSeleccionPeriodo.seleccionado}`;
  };

  const lanzarEnvio = () => {
    const periodoSeleccionado = panelCarga.periodos.find((p) => p.periodoId === panelCarga.seleccionado);
    if (!periodoSeleccionado || periodoSeleccionado.estadoTemporal === 'enviado') {
      notifications.info('Selecciona un periodo válido para cargar el reporte');
      return;
    }
    // Cerrar panel lateral antes de abrir el modal para evitar superposición
    setPanelCarga((prev) => ({ ...prev, open: false }));
    setModalEnviar({
      isOpen: true,
      periodoId: periodoSeleccionado.periodoId,
      reporteNombre: panelCarga.reporteNombre,
      esCorreccion: false,
      periodoInicio: periodoSeleccionado.periodoInicio,
      periodoFin: periodoSeleccionado.periodoFin,
      frecuencia: periodoSeleccionado.frecuencia || periodoSeleccionado.periodoTipo || '',
    });
  };

  const handleExportar = () => {
    // Crear CSV
    const headers = ['Nombre', 'Entidad', 'Frecuencia', 'Vencimiento', 'Estado'];
    const rows = filteredReportes.map(r => [
      r.nombre,
      r.entidadNombre || 'N/A',
      r.frecuencia,
      formatFechaVencimiento(r.fechaVencimiento),
      r.estado
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reportes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
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
          <button className="btn-secondary" onClick={handleExportar}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7,10 12,15 17,10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Exportar
          </button>
          <button className="btn-primary" onClick={handleNuevoReporte}>
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
          <span className="status-label">Sin Configurar</span>
        </div>
        <div className="status-card progress">
          <span className="status-count">{estadisticas.enProgreso}</span>
          <span className="status-label">Activos</span>
        </div>
        <div className="status-card sent">
          <span className="status-count">{estadisticas.completados}</span>
          <span className="status-label">Configurados</span>
        </div>
        <div className="status-card overdue">
          <span className="status-count">{estadisticas.vencidos}</span>
          <span className="status-label">Inactivos</span>
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
            <option value="activo">Activo</option>
            <option value="cancelado">Cancelado</option>
            <option value="suspendido">Suspendido</option>
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
                      <button className="btn-icon" title="Editar" onClick={() => handleEditReporte(reporte)}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button className="btn-icon danger" title="Eliminar" onClick={() => handleDeleteReporte(reporte.reporteId)}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                      <button className="btn-icon" title="Ver detalle" onClick={() => abrirDetalleReporte(reporte)}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="8" x2="12" y2="12"/>
                          <line x1="12" y1="16" x2="12" y2="16"/>
                        </svg>
                      </button>
                      <button className="btn-icon" title="Intervenir / Cargar" onClick={() => abrirPanelCarga(reporte.reporteId, reporte.nombre)}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 19V6"/>
                          <polyline points="7 11 12 6 17 11"/>
                          <path d="M5 19h14"/>
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

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay-fullscreen" onClick={handleModalClose}>
          <div className="modal-content-large" onClick={(e) => e.stopPropagation()}>
            <button className="btn-close-floating" onClick={handleModalClose} title="Cerrar">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            
            <div className="modal-form-wrapper">
              <ReporteForm reporteId={editingReporteId} onClose={handleModalClose} />
            </div>
          </div>
        </div>
      )}

      {/* Panel lateral de carga manual */}
      {panelCarga.open && !modalEnviar.isOpen && (
        <div className="side-panel-overlay" onClick={cerrarPanelCarga}>
          <aside className="side-panel" onClick={(e) => e.stopPropagation()}>
            <div className="side-panel-header">
              <div>
                <p className="side-panel-overline">Intervención manual</p>
                <h3 className="side-panel-title">{panelCarga.reporteNombre}</h3>
                {panelCarga.seleccionado && (
                  <div className="side-panel-meta">
                    <span className="chip-estado info">{panelCarga.periodos.find(p => p.periodoId === panelCarga.seleccionado)?.frecuencia || panelCarga.periodos.find(p => p.periodoId === panelCarga.seleccionado)?.periodoTipo}</span>
                    <span className="side-panel-periodo">
                      {formatFechaCorta(panelCarga.periodos.find(p => p.periodoId === panelCarga.seleccionado)?.periodoInicio || '')} → {formatFechaCorta(panelCarga.periodos.find(p => p.periodoId === panelCarga.seleccionado)?.periodoFin || '')}
                    </span>
                  </div>
                )}
              </div>
              <button className="btn-icon" onClick={cerrarPanelCarga} aria-label="Cerrar">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {panelCarga.loading ? (
              <div style={{ padding: '1rem', textAlign: 'center' }}>
                <div className="loading-spinner" style={{ margin: '1rem auto' }} />
                <p style={{ color: 'var(--neutral-600)' }}>Cargando periodos...</p>
              </div>
            ) : panelCarga.periodos.length === 0 ? (
              <p style={{ padding: '1rem', color: 'var(--neutral-600)' }}>
                No hay periodos disponibles para este reporte.
              </p>
            ) : (
              <div className="side-panel-body">
                <label className="side-panel-label">Selecciona el periodo a intervenir</label>
                <select
                  className="side-panel-select"
                  value={panelCarga.seleccionado}
                  onChange={(e) => setPanelCarga((prev) => ({ ...prev, seleccionado: e.target.value }))}
                >
                  {panelCarga.periodos.map((p) => (
                    <option
                      key={p.periodoId}
                      value={p.periodoId}
                      disabled={p.estadoTemporal === 'enviado'}
                    >
                      {p.label}
                    </option>
                  ))}
                </select>

                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--neutral-600)' }}>
                    Activos se seleccionan automáticamente. Enviados se deshabilitan.
                  </span>
                </div>

                <button
                  className="btn-primary"
                  style={{ width: '100%', marginTop: '1rem' }}
                  onClick={lanzarEnvio}
                  disabled={!panelCarga.seleccionado || panelCarga.periodos.find((p) => p.periodoId === panelCarga.seleccionado)?.estadoTemporal === 'enviado'}
                >
                  Cargar reporte / evidencias
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      <ModalEnviarReporte
        periodoId={modalEnviar.periodoId}
        reporteNombre={modalEnviar.reporteNombre}
        periodoInicio={modalEnviar.periodoInicio}
        periodoFin={modalEnviar.periodoFin}
        frecuencia={modalEnviar.frecuencia}
        isOpen={modalEnviar.isOpen}
        esCorreccion={modalEnviar.esCorreccion}
        onClose={() => setModalEnviar((prev) => ({ ...prev, isOpen: false }))}
        onSuccess={() => {
          setModalEnviar((prev) => ({ ...prev, isOpen: false }));
          cerrarPanelCarga();
          cargarDatos();
        }}
        onError={(msg) => notifications.error(msg)}
      />

      {/* Modal de selección de período para ver detalle */}
      {modalSeleccionPeriodo.open && (
        <div className="modal-overlay-fullscreen" onClick={cerrarModalSeleccionPeriodo}>
          <div className="modal-selector-periodo" onClick={(e) => e.stopPropagation()}>
            
            {/* Header del Modal */}
            <div className="modal-selector-header">
              <div className="modal-selector-header-content">
                <h2 className="modal-selector-title">Seleccionar Período</h2>
                <p className="modal-selector-subtitle">{modalSeleccionPeriodo.reporteNombre}</p>
                <span className="modal-selector-count">
                  {modalSeleccionPeriodo.periodos.length} período{modalSeleccionPeriodo.periodos.length !== 1 ? 's' : ''} disponible{modalSeleccionPeriodo.periodos.length !== 1 ? 's' : ''}
                </span>
              </div>
              <button className="modal-selector-close" onClick={cerrarModalSeleccionPeriodo} aria-label="Cerrar">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Divisor */}
            <div className="modal-selector-divider"></div>

            {modalSeleccionPeriodo.loading ? (
              <div className="modal-selector-loading">
                <div className="loading-spinner" />
                <p>Cargando períodos...</p>
              </div>
            ) : modalSeleccionPeriodo.periodos.length === 0 ? (
              <div className="modal-selector-empty">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p>No hay períodos disponibles para este reporte.</p>
              </div>
            ) : (
              <>
                {/* Lista de Períodos con Scroll */}
                <div className="modal-selector-body">
                  <div className="periodos-lista-scroll">
                    {modalSeleccionPeriodo.periodos.map((p) => {
                      const isSelected = modalSeleccionPeriodo.seleccionado === p.periodoId;
                      
                      // Determinar estado y estilo
                      let estadoLabel = '';
                      let estadoClass = '';
                      
                      if (p.estadoTemporal === 'enviado') {
                        estadoLabel = 'ENVIADO';
                        estadoClass = 'estado-enviado';
                      } else if (p.estadoTemporal === 'futuro') {
                        estadoLabel = 'PRÓXIMO';
                        estadoClass = 'estado-proximo';
                      } else if (p.estadoTemporal === 'activo') {
                        estadoLabel = 'PENDIENTE';
                        estadoClass = 'estado-pendiente';
                      } else {
                        estadoLabel = 'VENCIDO';
                        estadoClass = 'estado-vencido';
                      }
                      
                      return (
                        <div
                          key={p.periodoId}
                          className={`periodo-card-selector ${isSelected ? 'periodo-selected' : ''}`}
                          onClick={() => setModalSeleccionPeriodo((prev) => ({ ...prev, seleccionado: p.periodoId }))}
                        >
                          {/* Radio Button */}
                          <div className="periodo-radio">
                            <div className={`radio-button ${isSelected ? 'radio-checked' : ''}`}>
                              {isSelected && <div className="radio-inner" />}
                            </div>
                          </div>

                          {/* Contenido del Período */}
                          <div className="periodo-content">
                            {/* Primera línea: Tipo y Estado */}
                            <div className="periodo-header-line">
                              <span className="periodo-tipo">{frecuenciaLabel(p.frecuencia || p.periodoTipo)}</span>
                              <span className={`periodo-estado-chip ${estadoClass}`}>
                                {estadoLabel}
                              </span>
                            </div>

                            {/* Segunda línea: Fechas del período */}
                            <div className="periodo-fechas-line">
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                              </svg>
                              <span>{formatFechaCorta(p.periodoInicio)} → {formatFechaCorta(p.periodoFin)}</span>
                            </div>

                            {/* Tercera línea: Fecha de vencimiento (si existe) */}
                            {p.fechaVencimientoCalculada && (
                              <div className="periodo-vencimiento-line">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10"/>
                                  <polyline points="12 6 12 12 16 14"/>
                                </svg>
                                <span>Vence: {formatFechaCorta(p.fechaVencimientoCalculada)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer con botones */}
                <div className="modal-selector-footer">
                  <button className="btn-secondary" onClick={cerrarModalSeleccionPeriodo}>
                    Cancelar
                  </button>
                  <button
                    className="btn-primary btn-with-icon"
                    onClick={navegarAPeriodoSeleccionado}
                    disabled={!modalSeleccionPeriodo.seleccionado}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    Ver Detalle del Período
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
