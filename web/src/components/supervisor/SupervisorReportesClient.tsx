import { useState, useEffect } from 'react';
import { flujoReportesService, type ReportePeriodo, type Page } from '../../lib/services';
import { ModalValidarReporte } from '../modales/ModalValidarReporte';

type TabStatus = 'all' | 'pendiente_validacion' | 'aprobado' | 'requiere_correccion' | 'enviado';

interface ResponsableOption {
  id: string;
  nombre: string;
}

interface EntidadOption {
  id: string;
  nombre: string;
}

export default function SupervisorReportesClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportes, setReportes] = useState<ReportePeriodo[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [size] = useState(12);
  
  // Filtros
  const [activeTab, setActiveTab] = useState<TabStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroResponsable, setFiltroResponsable] = useState('');
  const [filtroEntidad, setFiltroEntidad] = useState('');
  
  // Datos para filtros - extraídos de los reportes
  const [responsables, setResponsables] = useState<ResponsableOption[]>([]);
  const [entidades, setEntidades] = useState<EntidadOption[]>([]);
  
  // Modal
  const [modalValidar, setModalValidar] = useState<{open: boolean; periodo: ReportePeriodo | null}>({
    open: false,
    periodo: null
  });
  const [detalle, setDetalle] = useState<{open: boolean; periodo: ReportePeriodo | null}>({
    open: false,
    periodo: null
  });
  const [toastMessage, setToastMessage] = useState<{type: 'success' | 'error'; message: string} | null>(null);

  // Contadores por tab
  const [contadores, setContadores] = useState({
    all: 0,
    pendiente_validacion: 0,
    aprobado: 0,
    requiere_correccion: 0,
    enviado: 0
  });

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    cargarReportes();
  }, [page, activeTab, filtroResponsable, filtroEntidad]);

  const cargarDatosIniciales = async () => {
    try {
      // Cargar todos los reportes para extraer filtros y contadores
      const todosData = await flujoReportesService.supervisionSupervisor(0, 200);
      const todos = todosData.content;
      
      // Extraer responsables únicos de los reportes
      const responsablesUnicos = new Map<string, string>();
      todos.forEach(r => {
        if (r.responsableElaboracion?.usuarioId && r.responsableElaboracion?.nombreCompleto) {
          responsablesUnicos.set(r.responsableElaboracion.usuarioId, r.responsableElaboracion.nombreCompleto);
        }
      });
      setResponsables(Array.from(responsablesUnicos.entries()).map(([id, nombre]) => ({ id, nombre })));
      
      // Extraer entidades únicas de los reportes (usar entidadNombre como clave)
      const entidadesUnicas = new Set<string>();
      todos.forEach(r => {
        if (r.entidadNombre) {
          entidadesUnicas.add(r.entidadNombre);
        }
      });
      setEntidades(Array.from(entidadesUnicas).map((nombre) => ({ id: nombre, nombre })));
      
      // Calcular contadores
      setContadores({
        all: todos.length,
        pendiente_validacion: todos.filter(r => ['pendiente_validacion', 'PENDIENTE_VALIDACION'].includes(r.estado)).length,
        aprobado: todos.filter(r => ['aprobado', 'APROBADO'].includes(r.estado)).length,
        requiere_correccion: todos.filter(r => ['requiere_correccion', 'REQUIERE_CORRECCION'].includes(r.estado)).length,
        enviado: todos.filter(r => ['enviado', 'ENVIADO'].includes(r.estado)).length
      });
    } catch (err) {
      console.error('Error al cargar datos iniciales:', err);
    }
  };

  const cargarReportes = async () => {
    try {
      setLoading(true);
      setError(null);

      let data: Page<ReportePeriodo>;
      
      if (activeTab === 'all') {
        data = await flujoReportesService.supervisionSupervisor(
          page, size, undefined, 
          filtroResponsable || undefined, 
          filtroEntidad || undefined
        );
      } else {
        data = await flujoReportesService.supervisionSupervisor(
          page, size, activeTab,
          filtroResponsable || undefined,
          filtroEntidad || undefined
        );
      }
      
      setReportes(data.content);
      setTotalElements(data.totalElements);

    } catch (err: any) {
      console.error('Error al cargar reportes:', err);
      setError(err.response?.data?.message || 'Error al cargar los reportes');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: TabStatus) => {
    setActiveTab(tab);
    setPage(0);
  };

  const handleValidacionSuccess = () => {
    setToastMessage({ type: 'success', message: 'Reporte validado exitosamente' });
    setModalValidar({ open: false, periodo: null });
    cargarReportes();
    cargarDatosIniciales();
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleValidacionError = (message: string) => {
    setToastMessage({ type: 'error', message });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const calcularDiasRestantes = (fechaVencimiento: string): { dias: number; urgencia: string } => {
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diffTime = vencimiento.getTime() - hoy.getTime();
    const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let urgencia = 'normal';
    if (dias < 0) urgencia = 'vencido';
    else if (dias === 0) urgencia = 'hoy';
    else if (dias <= 3) urgencia = 'urgente';
    else if (dias <= 7) urgencia = 'proximo';
    
    return { dias, urgencia };
  };

  const formatearFechaCorta = (fecha: string): string => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short'
    });
  };

  const getEstadoBadge = (estado: string) => {
    const estados: Record<string, { clase: string; texto: string }> = {
      'pendiente_validacion': { clase: 'pending', texto: 'Pendiente Revisión' },
      'PENDIENTE_VALIDACION': { clase: 'pending', texto: 'Pendiente Revisión' },
      'en_revision': { clase: 'warning', texto: 'En Revisión' },
      'EN_REVISION': { clase: 'warning', texto: 'En Revisión' },
      'aprobado': { clase: 'success', texto: 'Aprobado' },
      'APROBADO': { clase: 'success', texto: 'Aprobado' },
      'requiere_correccion': { clase: 'danger', texto: 'Requiere Corrección' },
      'REQUIERE_CORRECCION': { clase: 'danger', texto: 'Requiere Corrección' },
      'enviado': { clase: 'sent', texto: 'Enviado a Entidad' },
      'ENVIADO': { clase: 'sent', texto: 'Enviado a Entidad' }
    };
    return estados[estado] || { clase: 'neutral', texto: estado };
  };

  const filtrarPorBusqueda = (reportes: ReportePeriodo[]): ReportePeriodo[] => {
    if (!searchTerm) return reportes;
    const termino = searchTerm.toLowerCase();
    return reportes.filter(r => 
      r.reporteNombre?.toLowerCase().includes(termino) ||
      r.entidadNombre?.toLowerCase().includes(termino) ||
      r.responsableElaboracion?.nombreCompleto?.toLowerCase().includes(termino)
    );
  };

  const reportesFiltrados = filtrarPorBusqueda(reportes);

  if (error && reportes.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: 'var(--error-red-600)' }}>{error}</p>
        <button onClick={cargarReportes} className="btn-primary" style={{ marginTop: '1rem' }}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="reportes-page">
      {/* Toast de notificación */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          padding: '1rem 1.5rem',
          borderRadius: '8px',
          backgroundColor: toastMessage.type === 'success' ? 'var(--success-green-500)' : 'var(--error-red-500)',
          color: 'white',
          zIndex: 1001,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          {toastMessage.message}
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div className="header-info">
          <h1 className="page-title">Reportes del Equipo</h1>
          <p className="page-description">Revisión y aprobación de reportes del equipo</p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="status-tabs">
        <button 
          className={`status-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => handleTabChange('all')}
        >
          <span className="tab-label">Todos</span>
          <span className="tab-count">{contadores.all}</span>
        </button>
        <button 
          className={`status-tab ${activeTab === 'pendiente_validacion' ? 'active' : ''}`}
          onClick={() => handleTabChange('pendiente_validacion')}
        >
          <span className="tab-label">Pendientes Revisión</span>
          <span className="tab-count warning">{contadores.pendiente_validacion}</span>
        </button>
        <button 
          className={`status-tab ${activeTab === 'aprobado' ? 'active' : ''}`}
          onClick={() => handleTabChange('aprobado')}
        >
          <span className="tab-label">Aprobados</span>
          <span className="tab-count success">{contadores.aprobado}</span>
        </button>
        <button 
          className={`status-tab ${activeTab === 'requiere_correccion' ? 'active' : ''}`}
          onClick={() => handleTabChange('requiere_correccion')}
        >
          <span className="tab-label">Con Observaciones</span>
          <span className="tab-count danger">{contadores.requiere_correccion}</span>
        </button>
        <button 
          className={`status-tab ${activeTab === 'enviado' ? 'active' : ''}`}
          onClick={() => handleTabChange('enviado')}
        >
          <span className="tab-label">Enviados a Entidad</span>
          <span className="tab-count">{contadores.enviado}</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="filters-bar">
        <div className="search-box">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input 
            type="text" 
            placeholder="Buscar por código, título o responsable..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filters">
          <select 
            className="filter-select"
            value={filtroResponsable}
            onChange={(e) => { setFiltroResponsable(e.target.value); setPage(0); }}
          >
            <option value="">Todos los Responsables</option>
            {responsables.map(r => (
              <option key={r.id} value={r.id}>{r.nombre}</option>
            ))}
          </select>
          <select 
            className="filter-select"
            value={filtroEntidad}
            onChange={(e) => { setFiltroEntidad(e.target.value); setPage(0); }}
          >
            <option value="">Todas las Entidades</option>
            {entidades.map(e => (
              <option key={e.id} value={e.id}>{e.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
          <p style={{ marginTop: '1rem', color: 'var(--neutral-600)' }}>Cargando reportes...</p>
        </div>
      )}

      {/* Reports Grid */}
      {!loading && (
        <>
          {reportesFiltrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--neutral-500)' }}>
              <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 1rem', display: 'block' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <p>No hay reportes {activeTab !== 'all' ? 'con este estado' : ''}</p>
            </div>
          ) : (
            <div className="reports-grid">
              {reportesFiltrados.map((reporte) => {
                const { dias, urgencia } = calcularDiasRestantes(reporte.fechaVencimientoCalculada);
                const estadoBadge = getEstadoBadge(reporte.estado);
                const puedeValidar = ['pendiente_validacion', 'PENDIENTE_VALIDACION'].includes(reporte.estado);
                
                return (
                  <div key={reporte.periodoId} className={`report-card ${urgencia}`}>
                    <div className={`card-status-bar ${estadoBadge.clase}`}></div>
                    <div className="card-header">
                      <div className="card-badges">
                        <span className="badge entity">{reporte.entidadNombre}</span>
                        <span className={`badge status ${estadoBadge.clase}`}>{estadoBadge.texto}</span>
                      </div>
                      <span className={`card-date ${urgencia}`}>
                        {urgencia === 'vencido' ? `Vencido hace ${Math.abs(dias)} días` :
                         urgencia === 'hoy' ? 'Vence hoy' :
                         urgencia === 'urgente' ? `Vence en ${dias} días` :
                         `Vence ${formatearFechaCorta(reporte.fechaVencimientoCalculada)}`}
                      </span>
                    </div>
                    <div className="card-body">
                      <h3 className="card-title">{reporte.reporteNombre}</h3>
                      <p className="card-code">{reporte.periodoTipo} - {reporte.periodoInicio}</p>
                      <div className="card-meta">
                        <div className="meta-item">
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                          </svg>
                          {reporte.responsableElaboracion?.nombreCompleto || 'Sin asignar'}
                        </div>
                        {reporte.fechaEnvioReal && (
                          <div className="meta-item">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                              <polyline points="12,6 12,12 16,14"/>
                            </svg>
                            Enviado {formatearFechaCorta(reporte.fechaEnvioReal)}
                          </div>
                        )}
                      </div>
                      {reporte.cantidadArchivos > 0 && (
                        <div className="card-files">
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                          </svg>
                          {reporte.cantidadArchivos} archivo{reporte.cantidadArchivos > 1 ? 's' : ''} adjunto{reporte.cantidadArchivos > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                    <div className="card-footer">
                      <button className="btn-secondary" onClick={() => setDetalle({ open: true, periodo: reporte })}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                        Ver Detalle
                      </button>
                      {puedeValidar && (
                        <button 
                          className="btn-primary"
                          onClick={() => setModalValidar({ open: true, periodo: reporte })}
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9,11 12,14 22,4"/>
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                          </svg>
                          Revisar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal Detalle */}
          {detalle.open && detalle.periodo && (
            <div className="modal-overlay-fullscreen" onClick={() => setDetalle({ open: false, periodo: null })}>
              <div className="modal-content-large" onClick={(e) => e.stopPropagation()}>
                <button className="btn-close-floating" onClick={() => setDetalle({ open: false, periodo: null })} title="Cerrar">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
                <div style={{ padding: '1.5rem' }}>
                  <h2 style={{ marginBottom: '0.5rem' }}>{detalle.periodo.reporteNombre || 'Reporte'}</h2>
                  <p style={{ color: 'var(--neutral-600)', marginBottom: '1rem' }}>
                    Entidad: {detalle.periodo.entidadNombre || 'N/A'} · Estado: {detalle.periodo.estado || 'N/A'}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                    <div className="card" style={{ padding: '1rem' }}>
                      <h4 style={{ marginTop: 0 }}>Fechas</h4>
                      <p><strong>Inicio:</strong> {detalle.periodo.periodoInicio || '-'}</p>
                      <p><strong>Fin:</strong> {detalle.periodo.periodoFin || '-'}</p>
                      <p><strong>Vencimiento:</strong> {detalle.periodo.fechaVencimientoCalculada || '-'}</p>
                      {detalle.periodo.fechaEnvioReal && <p><strong>Enviado:</strong> {detalle.periodo.fechaEnvioReal}</p>}
                    </div>
                    <div className="card" style={{ padding: '1rem' }}>
                      <h4 style={{ marginTop: 0 }}>Responsables</h4>
                      <p><strong>Elabora:</strong> {detalle.periodo.responsableElaboracion?.nombreCompleto || 'Sin asignar'}</p>
                      <p><strong>Supervisa:</strong> {detalle.periodo.responsableSupervision?.nombreCompleto || 'Sin asignar'}</p>
                    </div>
                    <div className="card" style={{ padding: '1rem' }}>
                      <h4 style={{ marginTop: 0 }}>Evidencias</h4>
                      <p>{detalle.periodo.cantidadArchivos || 0} archivos adjuntos</p>
                    </div>
                  </div>
                  {detalle.periodo.comentarios && (
                    <div className="card" style={{ padding: '1rem', marginTop: '1rem' }}>
                      <h4 style={{ marginTop: 0 }}>Comentarios</h4>
                      <p style={{ whiteSpace: 'pre-wrap' }}>{detalle.periodo.comentarios}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Paginación */}
          {totalElements > size && (
            <div className="pagination">
              <button 
                className="btn-secondary"
                disabled={page === 0}
                onClick={() => setPage(p => Math.max(0, p - 1))}
              >
                Anterior
              </button>
              <span style={{ padding: '0.5rem 1rem', color: 'var(--neutral-600)' }}>
                Página {page + 1} de {Math.ceil(totalElements / size)}
              </span>
              <button 
                className="btn-secondary"
                disabled={(page + 1) * size >= totalElements}
                onClick={() => setPage(p => p + 1)}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal de Validación */}
      {modalValidar.open && modalValidar.periodo && (
        <ModalValidarReporte
          isOpen={modalValidar.open}
          onClose={() => setModalValidar({ open: false, periodo: null })}
          periodoId={modalValidar.periodo.periodoId}
          reporteNombre={modalValidar.periodo.reporteNombre}
          responsable={modalValidar.periodo.responsableElaboracion?.nombreCompleto || 'Sin asignar'}
          onSuccess={handleValidacionSuccess}
          onError={handleValidacionError}
        />
      )}

      <style>{`
        .reportes-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .page-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--neutral-900);
          margin: 0;
        }

        .page-description {
          font-size: 0.875rem;
          color: var(--neutral-500);
          margin: 0.25rem 0 0;
        }

        .status-tabs {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .status-tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: white;
          border: 1px solid var(--neutral-200);
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--neutral-600);
          cursor: pointer;
          transition: all 0.2s;
        }

        .status-tab:hover {
          background: var(--neutral-100);
        }

        .status-tab.active {
          background: var(--role-accent, #10b981);
          border-color: var(--role-accent, #10b981);
          color: white;
        }

        .tab-count {
          padding: 0.125rem 0.5rem;
          background: var(--neutral-200);
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .status-tab.active .tab-count {
          background: rgba(255,255,255,0.3);
        }

        .tab-count.warning {
          background: var(--warning-yellow-200);
          color: var(--warning-yellow-800);
        }

        .tab-count.success {
          background: var(--success-green-200);
          color: var(--success-green-800);
        }

        .tab-count.danger {
          background: var(--error-red-200);
          color: var(--error-red-800);
        }

        .filters-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.25rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          background: var(--neutral-100);
          border-radius: 8px;
          flex: 1;
          max-width: 400px;
        }

        .search-box svg {
          color: var(--neutral-400);
          flex-shrink: 0;
        }

        .search-input {
          border: none;
          background: transparent;
          outline: none;
          font-size: 0.875rem;
          width: 100%;
        }

        .filters {
          display: flex;
          gap: 0.75rem;
        }

        .filter-select {
          padding: 0.625rem 1rem;
          border: 1px solid var(--neutral-200);
          border-radius: 8px;
          font-size: 0.875rem;
          background: white;
          cursor: pointer;
        }

        .reports-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .report-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .report-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .card-status-bar {
          height: 4px;
          background: var(--neutral-200);
        }

        .card-status-bar.pending { background: var(--warning-yellow-500); }
        .card-status-bar.success { background: var(--success-green-500); }
        .card-status-bar.danger { background: var(--error-red-500); }
        .card-status-bar.sent { background: var(--color-primary-500, #3b82f6); }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1rem 0;
        }

        .card-badges {
          display: flex;
          gap: 0.5rem;
        }

        .badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.6875rem;
          font-weight: 600;
        }

        .badge.entity {
          background: var(--color-primary-100, #dbeafe);
          color: var(--color-primary-700, #1d4ed8);
        }

        .badge.status {
          background: var(--neutral-100);
          color: var(--neutral-600);
        }

        .badge.status.pending {
          background: var(--warning-yellow-100);
          color: var(--warning-yellow-700);
        }

        .badge.status.success {
          background: var(--success-green-100);
          color: var(--success-green-700);
        }

        .badge.status.danger {
          background: var(--error-red-100);
          color: var(--error-red-700);
        }

        .badge.status.sent {
          background: var(--color-primary-100, #dbeafe);
          color: var(--color-primary-700, #1d4ed8);
        }

        .card-date {
          font-size: 0.75rem;
          color: var(--neutral-500);
        }

        .card-date.vencido, .card-date.hoy {
          color: var(--error-red-600);
          font-weight: 600;
        }

        .card-date.urgente {
          color: var(--warning-yellow-700);
          font-weight: 500;
        }

        .card-body {
          padding: 1rem;
          flex: 1;
        }

        .card-title {
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--neutral-800);
          margin: 0 0 0.25rem;
        }

        .card-code {
          font-size: 0.75rem;
          color: var(--neutral-500);
          margin: 0 0 0.75rem;
        }

        .card-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.75rem;
          color: var(--neutral-500);
        }

        .card-files {
          margin-top: 0.75rem;
          font-size: 0.75rem;
          color: var(--neutral-600);
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .card-footer {
          display: flex;
          gap: 0.5rem;
          padding: 1rem;
          border-top: 1px solid var(--neutral-100);
        }

        .card-footer button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.375rem;
          padding: 0.5rem;
          border-radius: 6px;
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary {
          background: var(--neutral-100);
          border: none;
          color: var(--neutral-600);
        }

        .btn-secondary:hover:not(:disabled) {
          background: var(--neutral-200);
        }

        .btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary {
          background: var(--role-accent, #10b981);
          border: none;
          color: white;
        }

        .btn-primary:hover {
          filter: brightness(0.9);
        }

        .pagination {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 2rem;
          padding-bottom: 2rem;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--neutral-200);
          border-top-color: var(--role-accent, #10b981);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 1200px) {
          .reports-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .reports-grid {
            grid-template-columns: 1fr;
          }

          .filters-bar {
            flex-direction: column;
            align-items: stretch;
          }

          .search-box {
            max-width: 100%;
          }

          .filters {
            flex-wrap: wrap;
          }

          .status-tabs {
            overflow-x: auto;
            flex-wrap: nowrap;
            padding-bottom: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}
