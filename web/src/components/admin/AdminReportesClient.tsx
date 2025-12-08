import { useState, useEffect } from 'react';
import {
  reportesService,
  entidadesService,
  usuariosService,
  flujoReportesService,
  type ReporteResponse,
  type EntidadResponse,
  type ReportePeriodo,
} from '../../lib/services';
import ReporteForm from '../ReporteForm';
import { ModalEnviarReporte } from '../modales/ModalEnviarReporte';
import notifications from '../../lib/notifications';
import AdminReportesEnviados from './AdminReportesEnviados';
import { evidenciasService, type EvidenciaResponse } from '../../lib/services';

type PeriodoDecorado = ReportePeriodo & {
  estadoTemporal: 'enviado' | 'activo' | 'futuro' | 'vencido';
  label: string;
};

export default function AdminReportesClient() {
  const [activeView, setActiveView] = useState<'gestion' | 'enviados'>('gestion');
  const [reportes, setReportes] = useState<ReporteResponse[]>([]);
  const [filteredReportes, setFilteredReportes] = useState<ReporteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEntidad, setFilterEntidad] = useState('');
  const [filterFrecuencia, setFilterFrecuencia] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  const [entidades, setEntidades] = useState<EntidadResponse[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [searchResponsableElaboracion, setSearchResponsableElaboracion] = useState('');
  const [searchResponsableSupervision, setSearchResponsableSupervision] = useState('');
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
  });

  const [detalleReporte, setDetalleReporte] = useState({
    open: false,
    reporte: null as ReporteResponse | null,
    periodos: [] as ReportePeriodo[],
    loading: false,
    error: '' as string | null,
  });

  const [periodoExpandido, setPeriodoExpandido] = useState<string | null>(null);
  const [evidenciasPorPeriodo, setEvidenciasPorPeriodo] = useState<Record<string, EvidenciaResponse[]>>({});
  const [cargandoEvidencias, setCargandoEvidencias] = useState<Record<string, boolean>>({});

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
      
      const [reportesData, entidadesData, usuariosData] = await Promise.all([
        reportesService.listar(0, 1000),
        entidadesService.listar(0, 100),
        usuariosService.listar(0, 100)
      ]);

      setReportes(reportesData.content);
      setFilteredReportes(reportesData.content);
      setEntidades(entidadesData.content);
      setUsuarios(usuariosData.content);
      
      console.log('Usuarios cargados:', usuariosData.content);
      console.log('Responsables:', usuariosData.content.filter(u => u.roles?.includes('RESPONSABLE')));
      console.log('Supervisores:', usuariosData.content.filter(u => u.roles?.includes('SUPERVISOR')));
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

  const abrirPanelCargaDesdePeriodo = (periodo: ReportePeriodo) => {
    if (!periodo.reporteId || !periodo.reporteNombre) {
      notifications.error('No se pudo identificar el reporte para intervenir');
      return;
    }
    abrirPanelCarga(periodo.reporteId, periodo.reporteNombre, periodo.periodoId);
  };

  const abrirDetalleReporte = async (reporte: ReporteResponse) => {
    setDetalleReporte({ open: true, reporte, periodos: [], loading: true, error: null });
    setPeriodoExpandido(null);
    setEvidenciasPorPeriodo({});
    setCargandoEvidencias({});
    try {
      const res = await flujoReportesService.periodosPorReporte(reporte.reporteId, 0, 500);
      const periodos = (res.content || []).sort(
        (a, b) => new Date(b.periodoInicio).getTime() - new Date(a.periodoInicio).getTime()
      );
      setDetalleReporte({ open: true, reporte, periodos, loading: false, error: null });
    } catch (err: any) {
      setDetalleReporte({ open: true, reporte, periodos: [], loading: false, error: err?.message || 'Error al cargar periodos' });
    }
  };

  const togglePeriodoDetalle = async (periodo: ReportePeriodo) => {
    if (periodoExpandido === periodo.periodoId) {
      setPeriodoExpandido(null);
      return;
    }

    setPeriodoExpandido(periodo.periodoId);

    if (evidenciasPorPeriodo[periodo.periodoId]) return;

    setCargandoEvidencias((prev) => ({ ...prev, [periodo.periodoId]: true }));
    try {
      const lista = await evidenciasService.listarPorReporte(periodo.reporteId);
      const filtradas = Array.isArray(lista)
        ? lista.filter((ev: any) => !ev.periodoId || ev.periodoId === periodo.periodoId)
        : [];
      setEvidenciasPorPeriodo((prev) => ({ ...prev, [periodo.periodoId]: filtradas }));
    } catch (err) {
      console.error('Error cargando evidencias del periodo', err);
      notifications.error('No se pudieron cargar las evidencias de este periodo');
    } finally {
      setCargandoEvidencias((prev) => ({ ...prev, [periodo.periodoId]: false }));
    }
  };

  const cerrarDetalleReporteVista = () => {
    setDetalleReporte({ open: false, reporte: null, periodos: [], loading: false, error: null });
    setPeriodoExpandido(null);
    setEvidenciasPorPeriodo({});
    setCargandoEvidencias({});
  };

  const cerrarPanelCarga = () => {
    setPanelCarga({ open: false, loading: false, reporteId: '', reporteNombre: '', periodos: [], seleccionado: '' });
  };

  const lanzarEnvio = () => {
    const periodoSeleccionado = panelCarga.periodos.find((p) => p.periodoId === panelCarga.seleccionado);
    if (!periodoSeleccionado || periodoSeleccionado.estadoTemporal === 'enviado') {
      notifications.info('Selecciona un periodo válido para cargar el reporte');
      return;
    }
    setModalEnviar({
      isOpen: true,
      periodoId: periodoSeleccionado.periodoId,
      reporteNombre: panelCarga.reporteNombre,
      esCorreccion: false,
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
      {/* Header con tabs */}
      <div className="page-header">
        <div className="header-info">
          <h1 className="page-title">Gestión de Reportes</h1>
          <p className="page-description">Vista global de todos los reportes del sistema</p>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button
              className={`chip-estado ${activeView === 'gestion' ? 'active' : ''}`}
              onClick={() => setActiveView('gestion')}
              style={{ padding: '0.5rem 1rem' }}
            >
              Gestión
            </button>
            <button
              className={`chip-estado ${activeView === 'enviados' ? 'active' : ''}`}
              onClick={() => setActiveView('enviados')}
              style={{ padding: '0.5rem 1rem' }}
            >
              Reportes Enviados
            </button>
          </div>
        </div>
        {activeView === 'gestion' && (
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
        )}
      </div>

      {activeView === 'gestion' ? (
        detalleReporte.open ? (
          <div className="detalle-reporte-page">
            <div className="detalle-top-bar">
              <button className="btn-volver" onClick={cerrarDetalleReporteVista}>
                ← Volver a Gestión de Reportes
              </button>
            </div>

            <div className="detalle-encabezado">
              <div>
                <p className="detalle-overline">Reporte</p>
                <h2 className="detalle-titulo">{detalleReporte.reporte?.nombre}</h2>
                <div className="detalle-meta">
                  <span>{detalleReporte.reporte?.entidadNombre}</span>
                  <span className="meta-separador">•</span>
                  <span>{detalleReporte.reporte?.frecuencia}</span>
                </div>
              </div>
              <div className="detalle-resumen">
                <div>
                  <p className="detalle-label">Supervisor</p>
                  <p className="detalle-value">{detalleReporte.periodos[0]?.responsableSupervision?.nombreCompleto || 'Sin asignar'}</p>
                </div>
                <div>
                  <p className="detalle-label">Responsable</p>
                  <p className="detalle-value">{detalleReporte.periodos[0]?.responsableElaboracion?.nombreCompleto || 'Sin asignar'}</p>
                </div>
                <div>
                  <p className="detalle-label">Entidad</p>
                  <p className="detalle-value">{detalleReporte.reporte?.entidadNombre}</p>
                </div>
                <div>
                  <p className="detalle-label">Estado</p>
                  <span className={`badge-estado-mejorado ${getEstadoBadgeClass(detalleReporte.reporte?.estado || '')}`}>
                    {detalleReporte.reporte?.estado || '—'}
                  </span>
                </div>
              </div>
            </div>

            {detalleReporte.loading && (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div className="loading-spinner" style={{ margin: '0 auto' }} />
                <p style={{ color: 'var(--neutral-600)' }}>Cargando periodos...</p>
              </div>
            )}

            {detalleReporte.error && (
              <div className="alert-error">{detalleReporte.error}</div>
            )}

            {!detalleReporte.loading && (
              <div className="lista-periodos-grid">
                {detalleReporte.periodos.map((p) => {
                  const estado = (p.estado || '').toLowerCase();
                  const esTarde = typeof p.diasDesviacion === 'number' && p.diasDesviacion > 0;
                  const badgeClass = esTarde
                    ? 'warning'
                    : estado.includes('aprobado')
                    ? 'success'
                    : estado.includes('correccion')
                    ? 'danger'
                    : estado.includes('enviado')
                    ? 'sent'
                    : estado.includes('pendiente')
                    ? 'pending'
                    : 'neutral';
                  const badgeText = esTarde
                    ? 'Enviado tarde'
                    : estado.includes('aprobado')
                    ? 'Aprobado'
                    : estado.includes('correccion')
                    ? 'Con Observaciones'
                    : estado.includes('enviado')
                    ? 'Enviado'
                    : estado.includes('pendiente')
                    ? 'Pendiente'
                    : p.estado;

                  return (
                    <div key={p.periodoId} className="periodo-card">
                      <div className={`card-barra-estado ${badgeClass}`} />
                      <div className="periodo-card-header">
                        <div>
                          <p className="periodo-overline">{p.periodoTipo}</p>
                          <h3 className="periodo-titulo">{formatFechaCorta(p.periodoInicio)} → {formatFechaCorta(p.periodoFin)}</h3>
                          <div className="card-meta-superior">
                            <span className="meta-frecuencia">Vence {formatFechaCorta(p.fechaVencimientoCalculada)}</span>
                            {typeof p.diasDesviacion === 'number' && (
                              <>
                                <span className="meta-separador">•</span>
                                <span className={`meta-vencimiento ${esTarde ? 'vencido' : 'proximo'}`}>
                                  {esTarde ? `+${p.diasDesviacion}d` : `${p.diasDesviacion}d`}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className={`badge-estado-mejorado ${badgeClass}`}>{badgeText}</span>
                      </div>

                      <div className="periodo-resumen">
                        <div>
                          <p className="detalle-label">Fecha envío</p>
                          <p className="detalle-value">{p.fechaEnvioReal ? formatFechaCorta(p.fechaEnvioReal) : 'No enviado'}</p>
                        </div>
                        <div>
                          <p className="detalle-label">Retraso</p>
                          <p className="detalle-value">{typeof p.diasDesviacion === 'number' ? (p.diasDesviacion > 0 ? `+${p.diasDesviacion} días` : 'A tiempo') : '—'}</p>
                        </div>
                        <div>
                          <p className="detalle-label">Evidencias</p>
                          <p className="detalle-value">{p.cantidadArchivos || 0}</p>
                        </div>
                        <div>
                          <p className="detalle-label">Estado</p>
                          <p className="detalle-value">{p.estadoDescripcion || p.estado}</p>
                        </div>
                      </div>

                      <div className="acciones-card">
                        <button className="btn-detalle-mejorado" onClick={() => togglePeriodoDetalle(p)}>
                          {periodoExpandido === p.periodoId ? 'Cerrar periodo' : 'Abrir periodo'}
                        </button>
                        <button className="btn-detalle-mejorado" onClick={() => abrirPanelCarga(p.reporteId, detalleReporte.reporte!.nombre, p.periodoId)}>
                          Intervenir / Cargar
                        </button>
                      </div>

                      {periodoExpandido === p.periodoId && (
                        <div className="periodo-detalle-expansion">
                          <div className="detalle-columns">
                            <div className="detalle-tarjeta">
                              <h4>Fechas del período</h4>
                              <div className="dato-fila"><span className="dato-label">Inicio</span><span className="dato-value">{formatFechaCorta(p.periodoInicio)}</span></div>
                              <div className="dato-fila"><span className="dato-label">Fin</span><span className="dato-value">{formatFechaCorta(p.periodoFin)}</span></div>
                              <div className="dato-fila"><span className="dato-label">Vencimiento</span><span className="dato-value destaque-naranja">{formatFechaCorta(p.fechaVencimientoCalculada)}</span></div>
                              <div className="dato-fila"><span className="dato-label">Envío real</span><span className="dato-value destaque-verde">{p.fechaEnvioReal ? formatFechaCorta(p.fechaEnvioReal) : 'No enviado'}</span></div>
                              <div className="dato-fila"><span className="dato-label">Desviación</span><span className={`dato-value ${p.diasDesviacion && p.diasDesviacion > 0 ? 'destaque-rojo' : 'destaque-verde'}`}>
                                {typeof p.diasDesviacion === 'number' ? (p.diasDesviacion > 0 ? `+${p.diasDesviacion} días` : 'Enviado a tiempo') : 'Sin dato'}
                              </span></div>
                            </div>

                            <div className="detalle-tarjeta">
                              <h4>Equipo responsable</h4>
                              <div className="responsable-item"><div className="responsable-rol">Elabora</div><div className="responsable-nombre">{p.responsableElaboracion?.nombreCompleto || 'Sin asignar'}</div></div>
                              <div className="responsable-item"><div className="responsable-rol">Supervisa</div><div className="responsable-nombre">{p.responsableSupervision?.nombreCompleto || 'Sin asignar'}</div></div>
                              {p.entidadNombre && (
                                <div className="responsable-item"><div className="responsable-rol">Entidad</div><div className="responsable-nombre">{p.entidadNombre}</div></div>
                              )}
                            </div>
                          </div>

                          <div className="detalle-tarjeta">
                            <h4>Evidencias</h4>
                            {cargandoEvidencias[p.periodoId] && <p style={{ color: 'var(--neutral-600)' }}>Cargando evidencias...</p>}
                            {!cargandoEvidencias[p.periodoId] && (evidenciasPorPeriodo[p.periodoId]?.length || 0) === 0 && (
                              <p style={{ color: 'var(--neutral-600)' }}>No hay evidencias adjuntas</p>
                            )}
                            {!cargandoEvidencias[p.periodoId] && (evidenciasPorPeriodo[p.periodoId]?.length || 0) > 0 && (
                              <div className="evidencias-lista">
                                {evidenciasPorPeriodo[p.periodoId].map((ev) => (
                                  <div key={ev.id} className="evidencia-item">
                                    <div>
                                      <div className="evidencia-nombre">{ev.nombreArchivo}</div>
                                      <div className="evidencia-meta">{((ev.tamano || 0) / 1024).toFixed(0)} KB · {new Date(ev.creadoEn).toLocaleDateString('es-CO')}</div>
                                    </div>
                                    <button className="btn-detalle-mejorado" onClick={() => evidenciasService.descargar(ev.id)}>Descargar</button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="detalle-tarjeta">
                            <h4>Historial de comentarios</h4>
                            {p.comentarios ? (
                              <div className="comentario-item">
                                <div className="comentario-header">Sistema · {new Date(p.updatedAt).toLocaleString('es-CO')}</div>
                                <div className="comentario-texto">{p.comentarios}</div>
                              </div>
                            ) : (
                              <p style={{ color: 'var(--neutral-600)' }}>Sin comentarios registrados</p>
                            )}
                          </div>

                          <div className="detalle-tarjeta acciones">
                            <h4>Acciones del Administrador</h4>
                            <div className="acciones-flex">
                              <button className="btn-detalle-mejorado" onClick={() => abrirPanelCarga(p.reporteId, detalleReporte.reporte!.nombre, p.periodoId)}>Intervenir / Cargar</button>
                              <button className="btn-detalle-mejorado" onClick={() => notifications.info('Función pendiente de implementación')}>Añadir comentario</button>
                              <button className="btn-detalle-mejorado" onClick={() => notifications.info('Notificación reenviada (simulado)')}>Reenviar notificación</button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <>
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
          </>
        )
      ) : (
        <AdminReportesEnviados onIntervenir={abrirPanelCargaDesdePeriodo} />
      )}

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
      {panelCarga.open && (
        <div className="side-panel-overlay" onClick={cerrarPanelCarga}>
          <aside className="side-panel" onClick={(e) => e.stopPropagation()}>
            <div className="side-panel-header">
              <div>
                <p className="side-panel-overline">Intervención manual</p>
                <h3 className="side-panel-title">{panelCarga.reporteNombre}</h3>
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

      <style>{`
        .detalle-reporte-page { padding: 0.5rem 0 2rem 0; display: flex; flex-direction: column; gap: 1rem; }
        .detalle-top-bar { display: flex; justify-content: space-between; align-items: center; }
        .btn-volver { background: #eef2ff; color: #312e81; border: 1px solid #c7d2fe; border-radius: 10px; padding: 0.55rem 0.9rem; cursor: pointer; font-weight: 700; }
        .detalle-encabezado { background: #fff; border-radius: 16px; padding: 1.25rem 1.5rem; box-shadow: 0 12px 30px rgba(15,23,42,0.08); display: flex; justify-content: space-between; gap: 1rem; align-items: center; }
        .detalle-overline { text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; font-size: 0.75rem; margin: 0 0 0.25rem 0; }
        .detalle-titulo { margin: 0; font-size: 1.4rem; font-weight: 800; color: #0f172a; }
        .detalle-meta { display: flex; gap: 0.35rem; color: #475569; align-items: center; }
        .detalle-resumen { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.75rem; text-align: left; }
        .detalle-label { margin: 0; color: #64748b; font-weight: 700; font-size: 0.85rem; }
        .detalle-value { margin: 0; color: #0f172a; font-weight: 700; }
        .lista-periodos-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 1rem; }
        .periodo-card { position: relative; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1rem; background: #fff; box-shadow: 0 10px 28px rgba(15,23,42,0.06); display: flex; flex-direction: column; gap: 0.75rem; }
        .card-barra-estado { position: absolute; left: 0; top: 0; width: 6px; height: 100%; border-radius: 16px 0 0 16px; background: #e2e8f0; }
        .card-barra-estado.success { background: #22c55e; }
        .card-barra-estado.danger { background: #ef4444; }
        .card-barra-estado.sent { background: #06b6d4; }
        .card-barra-estado.warning { background: #f97316; }
        .card-barra-estado.pending { background: #eab308; }
        .periodo-card-header { display: flex; justify-content: space-between; gap: 0.75rem; align-items: flex-start; }
        .periodo-overline { margin: 0; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.78rem; }
        .periodo-titulo { margin: 0.1rem 0 0; font-size: 1.1rem; font-weight: 800; color: #0f172a; }
        .badge-estado-mejorado { padding: 0.35rem 0.6rem; border-radius: 999px; font-size: 0.8rem; font-weight: 700; text-transform: capitalize; }
        .badge-estado-mejorado.success { background: #dcfce7; color: #15803d; }
        .badge-estado-mejorado.pending { background: #fef9c3; color: #a16207; }
        .badge-estado-mejorado.danger { background: #fee2e2; color: #b91c1c; }
        .badge-estado-mejorado.sent { background: #cffafe; color: #0e7490; }
        .badge-estado-mejorado.warning { background: #ffedd5; color: #c2410c; }
        .periodo-resumen { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.75rem; background: #f8fafc; border: 1px dashed #e2e8f0; border-radius: 12px; padding: 0.75rem; }
        .acciones-card { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .btn-detalle-mejorado { background: #eef2ff; color: #312e81; border: 1px solid #c7d2fe; border-radius: 10px; padding: 0.55rem 0.9rem; cursor: pointer; font-weight: 700; }
        .btn-detalle-mejorado:hover { background: #e0e7ff; }
        .periodo-detalle-expansion { border-top: 1px solid #e2e8f0; padding-top: 0.75rem; animation: expand 0.25s ease-in-out; display: flex; flex-direction: column; gap: 0.75rem; }
        @keyframes expand { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .detalle-columns { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 0.75rem; }
        .detalle-tarjeta { border: 1px solid #e2e8f0; border-radius: 12px; padding: 0.85rem; background: #f8fafc; }
        .detalle-tarjeta h4 { margin: 0 0 0.35rem 0; font-size: 1rem; font-weight: 700; color: #0f172a; }
        .dato-fila { display: flex; justify-content: space-between; font-size: 0.95rem; color: #475569; padding: 0.2rem 0; }
        .dato-label { font-weight: 700; }
        .dato-value { font-weight: 700; }
        .destaque-naranja { color: #c2410c; }
        .destaque-verde { color: #15803d; }
        .destaque-rojo { color: #b91c1c; }
        .responsable-item { display: flex; justify-content: space-between; padding: 0.25rem 0; font-weight: 600; color: #0f172a; }
        .responsable-rol { color: #64748b; font-weight: 700; }
        .evidencias-lista { display: flex; flex-direction: column; gap: 0.5rem; }
        .evidencia-item { display: flex; justify-content: space-between; gap: 0.5rem; align-items: center; padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 10px; background: #fff; }
        .evidencia-nombre { font-weight: 700; color: #0f172a; }
        .evidencia-meta { color: #64748b; font-size: 0.85rem; }
        .comentario-item { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.65rem; }
        .comentario-header { font-weight: 700; color: #475569; margin-bottom: 0.25rem; }
        .comentario-texto { color: #0f172a; white-space: pre-wrap; }
        .acciones-flex { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .alert-error { padding: 0.85rem 1rem; background: #fee2e2; color: #b91c1c; border: 1px solid #fecdd3; border-radius: 10px; }
      `}</style>
    </div>
  );
}
