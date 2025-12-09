import { useState, useEffect } from 'react';
import { flujoReportesService, type ReportePeriodo } from '../../lib/services';
import { ModalEnviarReporte } from '../modales/ModalEnviarReporte';
import notifications from '../../lib/notifications';

type TabStatus = 'all' | 'pendiente' | 'en_progreso' | 'completado' | 'vencido';

export default function SupervisorGestionReportesClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodos, setPeriodos] = useState<ReportePeriodo[]>([]);
  const [periodosFuente, setPeriodosFuente] = useState<ReportePeriodo[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  
  // Filtros
  const [activeTab, setActiveTab] = useState<TabStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEntidad, setFiltroEntidad] = useState('');
  const [filtroFrecuencia, setFiltroFrecuencia] = useState('');
  
  // Datos para filtros
  const [entidades, setEntidades] = useState<{id: string; nombre: string}[]>([]);
  
  // Contadores por tab
  const [contadores, setContadores] = useState({
    all: 0,
    pendiente: 0,
    en_progreso: 0,
    completado: 0,
    vencido: 0
  });
  const [modalEnviar, setModalEnviar] = useState<{
    isOpen: boolean;
    periodoId: string;
    reporteNombre: string;
    esCorreccion: boolean;
  }>({ isOpen: false, periodoId: '', reporteNombre: '', esCorreccion: false });

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    cargarPeriodos();
  }, [page, activeTab, filtroEntidad, filtroFrecuencia, searchTerm]);

  const cargarDatosIniciales = async () => {
    try {
      // Cargar todos los periodos para extraer filtros y contadores
      const todosData = await flujoReportesService.supervision(0, 1000);
      const todos = todosData.content || [];
      setPeriodosFuente(todos);
      
      console.log('📊 Periodos cargados para estadísticas:', todos);
      
      // Extraer entidades únicas
      const entidadesUnicas = new Set<string>();
      todos.forEach(p => {
        if (p.entidadNombre) {
          entidadesUnicas.add(p.entidadNombre);
        }
      });
      setEntidades(Array.from(entidadesUnicas).map((nombre) => ({ id: nombre, nombre })));
      
      // Calcular contadores - basados en estados reales de periodos
      const ahora = new Date();
      const stats = {
        all: todos.length,
        pendiente: 0,
        en_progreso: 0,
        completado: 0,
        vencido: 0
      };

      todos.forEach(p => {
        const estado = (p.estado || '').toLowerCase();
        
        // Pendientes: borrador, pendiente_elaboracion
        if (estado.includes('borrador') || estado === 'pendiente' || estado.includes('pendiente_elaboracion')) {
          stats.pendiente++;
        }
        // En progreso: en revisión, validación, corrección
        else if (estado.includes('revision') || estado.includes('validacion') || estado.includes('correccion')) {
          stats.en_progreso++;
        }
        // Completados: aprobado, enviado
        else if (estado.includes('aprobado') || estado.includes('enviado')) {
          stats.completado++;
        }

        // Vencidos: fecha pasada y no completado
        const fechaVenc = p.fechaVencimiento || p.fechaVencimientoCalculada;
        if (fechaVenc) {
          const vencimiento = new Date(fechaVenc);
          const noCompletado = !estado.includes('aprobado') && !estado.includes('enviado');
          if (vencimiento < ahora && noCompletado) {
            stats.vencido++;
          }
        }
      });

      console.log('📊 Estadísticas calculadas:', stats);
      setContadores(stats);

      // Primera visualización con los datos cargados
      aplicarFiltros(todos);
    } catch (err) {
      console.error('Error al cargar datos iniciales:', err);
    }
  };

  const cargarPeriodos = async () => {
    try {
      setLoading(true);
      setError(null);

      // Usar cache local si existe, de lo contrario cargar una vez
      let base = periodosFuente;
      if (base.length === 0) {
        const data = await flujoReportesService.supervision(page, size);
        base = data.content || [];
        setPeriodosFuente(base);
      }

      aplicarFiltros(base);

    } catch (err: any) {
      console.error('Error al cargar periodos:', err);
      setError(err.response?.data?.message || 'Error al cargar los periodos de reportes');
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = (lista: ReportePeriodo[]) => {
      let filtrados = [...lista];
      
      // Aplicar filtros locales
      const ahora = new Date();
      
      // Filtro de estado según tab
      if (activeTab !== 'all') {
        if (activeTab === 'vencido') {
          filtrados = filtrados.filter(p => {
            const fechaVenc = p.fechaVencimiento || p.fechaVencimientoCalculada;
            if (!fechaVenc) return false;
            const vencimiento = new Date(fechaVenc);
            const estado = (p.estado || '').toLowerCase();
            const noCompletado = !estado.includes('aprobado') && !estado.includes('enviado');
            return vencimiento < ahora && noCompletado;
          });
        } else if (activeTab === 'pendiente') {
          filtrados = filtrados.filter(p => {
            const estado = (p.estado || '').toLowerCase();
            return estado.includes('borrador') || estado === 'pendiente' || estado.includes('pendiente_elaboracion');
          });
        } else if (activeTab === 'en_progreso') {
          filtrados = filtrados.filter(p => {
            const estado = (p.estado || '').toLowerCase();
            return estado.includes('revision') || estado.includes('validacion') || estado.includes('correccion');
          });
        } else if (activeTab === 'completado') {
          filtrados = filtrados.filter(p => {
            const estado = (p.estado || '').toLowerCase();
            return estado.includes('aprobado') || estado.includes('enviado');
          });
        }
      }
      
      // Filtro de búsqueda
      if (searchTerm) {
        filtrados = filtrados.filter(p =>
          p.reporteNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.entidadNombre?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Filtro de entidad
      if (filtroEntidad) {
        filtrados = filtrados.filter(p => p.entidadNombre === filtroEntidad);
      }
      
      // Filtro de frecuencia (normalizado para evitar diferencias de mayúsculas/espacios)
      if (filtroFrecuencia) {
        const normalize = (v: string | undefined) => (v || '').trim().toLowerCase();
        filtrados = filtrados.filter(p => {
          const target = normalize(filtroFrecuencia);
          const freq = normalize(p.frecuencia || p.periodoTipo);
          if (!freq) return true; // si no hay dato, no eliminar
          return freq === target || freq.includes(target);
        });
      }
      
      setPeriodos(filtrados);
      setTotalElements(filtrados.length);
  };

  const handleTabChange = (tab: TabStatus) => {
    setActiveTab(tab);
    setPage(0);
  };

  const formatearFecha = (fecha: string): string => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const calcularDiasRestantes = (fechaVencimiento: string): { dias: number; urgencia: string } => {
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diffTime = vencimiento.getTime() - hoy.getTime();
    const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let urgencia = 'normal';
    if (dias < 0) urgencia = 'vencido';
    else if (dias <= 3) urgencia = 'critico';
    else if (dias <= 7) urgencia = 'advertencia';
    
    return { dias, urgencia };
  };

  const getEstadoBadgeClass = (estado: string): string => {
    const estadoLower = (estado || '').toLowerCase();
    if (estadoLower.includes('aprobado') || estadoLower.includes('enviado')) return 'badge-success';
    if (estadoLower.includes('revision') || estadoLower.includes('validacion')) return 'badge-info';
    if (estadoLower.includes('correccion')) return 'badge-warning';
    return 'badge-default';
  };

  const getEstadoLabel = (estado: string): string => {
    const estadoLower = (estado || '').toLowerCase();
    if (estadoLower === 'borrador') return 'Borrador';
    if (estadoLower.includes('pendiente_elaboracion')) return 'Pendiente Elaboración';
    if (estadoLower.includes('pendiente_validacion')) return 'Pendiente Validación';
    if (estadoLower.includes('requiere_correccion')) return 'Requiere Corrección';
    if (estadoLower.includes('aprobado')) return 'Aprobado';
    if (estadoLower.includes('enviado')) return 'Enviado';
    return estado || 'ACTIVO';
  };

  const abrirEnvio = (periodo: ReportePeriodo) => {
    setModalEnviar({
      isOpen: true,
      periodoId: periodo.periodoId,
      reporteNombre: periodo.reporteNombre || 'Reporte',
      esCorreccion: (periodo.estado || '').toLowerCase().includes('correccion'),
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--neutral-600)' }}>Cargando reportes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: 'var(--error-red-600)' }}>{error}</p>
        <button onClick={cargarPeriodos} className="btn-primary" style={{ marginTop: '1rem' }}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="reportes-page">
        {/* Header */}
        <div className="page-header">
        <div className="header-info">
          <h1 className="page-title">Gestión de Reportes</h1>
          <p className="page-description">Vista global de todos los reportes del sistema</p>
        </div>
        <div className="header-actions">
          <button className="btn-export" onClick={() => notifications.info('Función de exportar en desarrollo')}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Exportar
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="stats-grid">
        <div className={`stat-card ${activeTab === 'all' ? 'active' : ''}`} onClick={() => handleTabChange('all')}>
          <div className="stat-value">{contadores.all}</div>
          <div className="stat-label">Todos</div>
        </div>
        <div className={`stat-card ${activeTab === 'pendiente' ? 'active' : ''}`} onClick={() => handleTabChange('pendiente')}>
          <div className="stat-value">{contadores.pendiente}</div>
          <div className="stat-label">Pendientes</div>
        </div>
        <div className={`stat-card ${activeTab === 'en_progreso' ? 'active' : ''}`} onClick={() => handleTabChange('en_progreso')}>
          <div className="stat-value">{contadores.en_progreso}</div>
          <div className="stat-label">En Progreso</div>
        </div>
        <div className={`stat-card ${activeTab === 'completado' ? 'active' : ''}`} onClick={() => handleTabChange('completado')}>
          <div className="stat-value">{contadores.completado}</div>
          <div className="stat-label">Completados</div>
        </div>
        <div className={`stat-card ${activeTab === 'vencido' ? 'active' : ''}`} onClick={() => handleTabChange('vencido')}>
          <div className="stat-value danger">{contadores.vencido}</div>
          <div className="stat-label">Vencidos</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-bar">
        <div className="search-box">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar reportes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select 
          className="filter-select"
          value={filtroEntidad}
          onChange={(e) => setFiltroEntidad(e.target.value)}
        >
          <option value="">Todas las entidades</option>
          {entidades.map(e => (
            <option key={e.id} value={e.nombre}>{e.nombre}</option>
          ))}
        </select>
        
        <select 
          className="filter-select"
          value={filtroFrecuencia}
          onChange={(e) => setFiltroFrecuencia(e.target.value)}
        >
          <option value="">Frecuencia</option>
          <option value="mensual">Mensual</option>
          <option value="trimestral">Trimestral</option>
          <option value="semestral">Semestral</option>
          <option value="anual">Anual</option>
        </select>
      </div>

      {/* Tabla de Reportes */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>NOMBRE</th>
              <th>ENTIDAD</th>
              <th>FRECUENCIA</th>
              <th>VENCIMIENTO</th>
              <th>ESTADO</th>
              <th>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {periodos.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--neutral-500)' }}>
                  No se encontraron reportes
                </td>
              </tr>
            ) : (
              periodos.map(periodo => {
                const fechaVenc = periodo.fechaVencimiento || periodo.fechaVencimientoCalculada;
                const { dias, urgencia } = fechaVenc 
                  ? calcularDiasRestantes(fechaVenc)
                  : { dias: 0, urgencia: 'normal' };
                return (
                  <tr key={periodo.periodoId}>
                    <td>
                      <div className="cell-content">
                        <strong>{periodo.reporteNombre || 'Sin nombre'}</strong>
                        {periodo.periodo && (
                          <small style={{ color: 'var(--neutral-500)' }}>Periodo: {periodo.periodo}</small>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="entity-tag">{periodo.entidadNombre || '—'}</span>
                    </td>
                    <td>{periodo.frecuencia || '—'}</td>
                    <td>
                      {fechaVenc ? (
                        <div className={`vencimiento ${urgencia}`}>
                          <span>{formatearFecha(fechaVenc)}</span>
                          <small>
                            {dias >= 0 ? `${dias} días restantes` : `Vencido hace ${Math.abs(dias)} días`}
                          </small>
                        </div>
                      ) : '—'}
                    </td>
                    <td>
                      <span className={`badge ${getEstadoBadgeClass(periodo.estado)}`}>
                        {getEstadoLabel(periodo.estado)}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-icon" 
                          title="Ver detalle"
                          onClick={() => window.location.href = `/roles/supervisor/reportes`}
                        >
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalElements > size && (
        <div className="pagination">
          <button 
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            className="btn-pagination"
          >
            Anterior
          </button>
          <span className="pagination-info">
            Página {page + 1} de {Math.ceil(totalElements / size)}
          </span>
          <button 
            disabled={(page + 1) * size >= totalElements}
            onClick={() => setPage(p => p + 1)}
            className="btn-pagination"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>

    <ModalEnviarReporte
      periodoId={modalEnviar.periodoId}
      reporteNombre={modalEnviar.reporteNombre}
      isOpen={modalEnviar.isOpen}
      esCorreccion={modalEnviar.esCorreccion}
      onClose={() => setModalEnviar((prev) => ({ ...prev, isOpen: false }))}
      onSuccess={() => {
        setModalEnviar((prev) => ({ ...prev, isOpen: false }));
        cargarPeriodos();
      }}
      onError={(msg) => notifications.error(msg)}
    />
    </>
  );
}
