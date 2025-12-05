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
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedReporte, setSelectedReporte] = useState<ReporteResponse | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<{
    nombre: string;
    descripcion: string;
    entidadId: string;
    frecuencia: "MENSUAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL";
    formatoRequerido: "PDF" | "EXCEL" | "WORD" | "OTRO";
    baseLegal: string;
    fechaInicioVigencia: string;
    fechaFinVigencia: string;
    fechaVencimiento: string;
    plazoAdicionalDias: number;
    linkInstrucciones: string;
    responsableElaboracionId: string[];
    responsableSupervisionId: string[];
    correosNotificacion: string[];
    telefonoResponsable: string;
    estado: "PENDIENTE" | "EN_PROGRESO" | "ENVIADO";
  }>({
    nombre: '',
    descripcion: '',
    entidadId: '',
    frecuencia: 'MENSUAL',
    formatoRequerido: 'PDF',
    baseLegal: '',
    fechaInicioVigencia: new Date().toISOString().split('T')[0],
    fechaFinVigencia: '',
    fechaVencimiento: '',
    plazoAdicionalDias: 0,
    linkInstrucciones: '',
    responsableElaboracionId: [],
    responsableSupervisionId: [],
    correosNotificacion: [],
    telefonoResponsable: '',
    estado: 'PENDIENTE'
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

  const handleNuevoReporte = () => {
    setModalMode('create');
    setFormData({
      nombre: '',
      descripcion: '',
      entidadId: '',
      frecuencia: 'MENSUAL',
      formatoRequerido: 'PDF',
      baseLegal: '',
      fechaInicioVigencia: new Date().toISOString().split('T')[0],
      fechaFinVigencia: '',
      fechaVencimiento: '',
      plazoAdicionalDias: 0,
      linkInstrucciones: '',
      responsableElaboracionId: [],
      responsableSupervisionId: [],
      correosNotificacion: [],
      telefonoResponsable: '',
      estado: 'PENDIENTE'
    });
    setShowModal(true);
  };

  const handleEditReporte = (reporte: ReporteResponse) => {
    setModalMode('edit');
    setSelectedReporte(reporte);
    setFormData({
      nombre: reporte.nombre,
      descripcion: reporte.descripcion || '',
      entidadId: reporte.entidadId,
      frecuencia: reporte.frecuencia as "MENSUAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL",
      formatoRequerido: reporte.formatoRequerido as "PDF" | "EXCEL" | "WORD" | "OTRO",
      baseLegal: reporte.baseLegal || '',
      fechaInicioVigencia: reporte.fechaInicioVigencia || new Date().toISOString().split('T')[0],
      fechaFinVigencia: reporte.fechaFinVigencia || '',
      fechaVencimiento: reporte.fechaVencimiento,
      plazoAdicionalDias: reporte.plazoAdicionalDias || 0,
      linkInstrucciones: reporte.linkInstrucciones || '',
      responsableElaboracionId: reporte.responsableElaboracionId || [],
      responsableSupervisionId: reporte.responsableSupervisionId || [],
      correosNotificacion: reporte.correosNotificacion || [],
      telefonoResponsable: reporte.telefonoResponsable || '',
      estado: reporte.estado as "PENDIENTE" | "EN_PROGRESO" | "ENVIADO"
    });
    setShowModal(true);
  };

  const handleViewReporte = (reporte: ReporteResponse) => {
    setModalMode('view');
    setSelectedReporte(reporte);
    setShowModal(true);
  };

  const handleSaveReporte = async () => {
    try {
      setSaving(true);
      
      // Transformar los responsables al formato esperado por el API
      const responsables = [
        ...formData.responsableElaboracionId.map((usuarioId, index) => ({
          usuarioId,
          tipoResponsabilidad: 'elaboracion' as const,
          esPrincipal: index === 0,
          fechaInicio: formData.fechaInicioVigencia || new Date().toISOString().split('T')[0],
          observaciones: ''
        })),
        ...formData.responsableSupervisionId.map((usuarioId, index) => ({
          usuarioId,
          tipoResponsabilidad: 'supervision' as const,
          esPrincipal: index === 0,
          fechaInicio: formData.fechaInicioVigencia || new Date().toISOString().split('T')[0],
          observaciones: ''
        }))
      ];

      const dataToSend = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        entidadId: formData.entidadId,
        frecuencia: formData.frecuencia,
        formatoRequerido: formData.formatoRequerido,
        baseLegal: formData.baseLegal,
        fechaInicioVigencia: formData.fechaInicioVigencia,
        fechaFinVigencia: formData.fechaFinVigencia || undefined,
        fechaVencimiento: formData.fechaVencimiento,
        plazoAdicionalDias: formData.plazoAdicionalDias,
        linkInstrucciones: formData.linkInstrucciones,
        responsables: responsables,
        correosNotificacion: formData.correosNotificacion || [],
        telefonoResponsable: formData.telefonoResponsable || '',
        estado: formData.estado
      };
      
      if (modalMode === 'create') {
        await reportesService.crear(dataToSend);
      } else if (modalMode === 'edit' && selectedReporte) {
        await reportesService.actualizar(selectedReporte.reporteId, dataToSend);
      }

      await cargarDatos();
      setShowModal(false);
      setSelectedReporte(null);
    } catch (err) {
      console.error('Error al guardar reporte:', err);
      alert('Error al guardar el reporte');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReporte = async (reporteId: string) => {
    if (!confirm('¿Está seguro de eliminar este reporte?')) return;

    try {
      await reportesService.eliminar(reporteId);
      await cargarDatos();
    } catch (err) {
      console.error('Error al eliminar reporte:', err);
      alert('Error al eliminar el reporte');
    }
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
                      <button className="btn-icon" title="Ver detalles" onClick={() => handleViewReporte(reporte)}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
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
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {modalMode === 'create' && 'Nuevo Reporte'}
                {modalMode === 'edit' && 'Editar Reporte'}
                {modalMode === 'view' && 'Detalles del Reporte'}
              </h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              {modalMode === 'view' && selectedReporte ? (
                <div className="reporte-details">
                  <div className="detail-row">
                    <label>Nombre:</label>
                    <span>{selectedReporte.nombre}</span>
                  </div>
                  <div className="detail-row">
                    <label>Descripción:</label>
                    <span>{selectedReporte.descripcion || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <label>Entidad:</label>
                    <span>{selectedReporte.entidadNombre}</span>
                  </div>
                  <div className="detail-row">
                    <label>Frecuencia:</label>
                    <span>{selectedReporte.frecuencia}</span>
                  </div>
                  <div className="detail-row">
                    <label>Formato:</label>
                    <span>{selectedReporte.formatoRequerido}</span>
                  </div>
                  <div className="detail-row">
                    <label>Vencimiento:</label>
                    <span>{formatFechaVencimiento(selectedReporte.fechaVencimiento)}</span>
                  </div>
                  <div className="detail-row">
                    <label>Estado:</label>
                    <span className={`status-badge ${getEstadoBadgeClass(selectedReporte.estado)}`}>
                      {selectedReporte.estado}
                    </span>
                  </div>
                  <div className="detail-row">
                    <label>Responsables Elaboración:</label>
                    <span>
                      {selectedReporte.responsableElaboracionId && selectedReporte.responsableElaboracionId.length > 0 
                        ? selectedReporte.responsableElaboracionId.map(id => {
                            const usuario = usuarios.find(u => u.usuarioId === id);
                            return usuario ? `${usuario.firstName} ${usuario.firstLastname}` : id;
                          }).join(', ')
                        : 'No asignados'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <label>Responsables Supervisión:</label>
                    <span>
                      {selectedReporte.responsableSupervisionId && selectedReporte.responsableSupervisionId.length > 0 
                        ? selectedReporte.responsableSupervisionId.map(id => {
                            const usuario = usuarios.find(u => u.usuarioId === id);
                            return usuario ? `${usuario.firstName} ${usuario.firstLastname}` : id;
                          }).join(', ')
                        : 'No asignados'}
                    </span>
                  </div>
                </div>
              ) : (
                <form className="reporte-form" onSubmit={(e) => { e.preventDefault(); handleSaveReporte(); }}>
                  <div className="form-group">
                    <label>Nombre*</label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      required
                      disabled={modalMode === 'view'}
                    />
                  </div>

                  <div className="form-group">
                    <label>Descripción</label>
                    <textarea
                      value={formData.descripcion}
                      onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                      rows={3}
                      disabled={modalMode === 'view'}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Entidad*</label>
                      <select
                        value={formData.entidadId}
                        onChange={(e) => setFormData({...formData, entidadId: e.target.value})}
                        required
                        disabled={modalMode === 'view'}
                      >
                        <option value="">Seleccione...</option>
                        {entidades.map(e => (
                          <option key={e.entidadId} value={e.entidadId}>{e.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Frecuencia*</label>
                      <select
                        value={formData.frecuencia}
                        onChange={(e) => setFormData({...formData, frecuencia: e.target.value as any})}
                        required
                        disabled={modalMode === 'view'}
                      >
                        <option value="MENSUAL">Mensual</option>
                        <option value="TRIMESTRAL">Trimestral</option>
                        <option value="SEMESTRAL">Semestral</option>
                        <option value="ANUAL">Anual</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Formato Requerido*</label>
                      <select
                        value={formData.formatoRequerido}
                        onChange={(e) => setFormData({...formData, formatoRequerido: e.target.value as any})}
                        required
                        disabled={modalMode === 'view'}
                      >
                        <option value="PDF">PDF</option>
                        <option value="EXCEL">Excel</option>
                        <option value="WORD">Word</option>
                        <option value="OTRO">Otro</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Fecha Vencimiento*</label>
                      <input
                        type="date"
                        value={formData.fechaVencimiento}
                        onChange={(e) => setFormData({...formData, fechaVencimiento: e.target.value})}
                        required
                        disabled={modalMode === 'view'}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Base Legal</label>
                    <input
                      type="text"
                      value={formData.baseLegal}
                      onChange={(e) => setFormData({...formData, baseLegal: e.target.value})}
                      disabled={modalMode === 'view'}
                    />
                  </div>

                  <div className="form-group">
                    <label>Link de Instrucciones</label>
                    <input
                      type="url"
                      value={formData.linkInstrucciones}
                      onChange={(e) => setFormData({...formData, linkInstrucciones: e.target.value})}
                      disabled={modalMode === 'view'}
                    />
                  </div>

                  <div className="form-group">
                    <label>Responsables de Elaboración</label>
                    <input
                      type="text"
                      placeholder="Buscar responsables..."
                      value={searchResponsableElaboracion}
                      onChange={(e) => setSearchResponsableElaboracion(e.target.value)}
                      disabled={modalMode === 'view'}
                      style={{ marginBottom: '8px' }}
                    />
                    <div style={{ 
                      border: '1px solid #ddd', 
                      borderRadius: '4px', 
                      padding: '8px', 
                      maxHeight: '150px', 
                      overflowY: 'auto',
                      backgroundColor: '#fff'
                    }}>
                      {usuarios
                        .filter(u => u.roles?.some((r: string) => r.toUpperCase() === 'RESPONSABLE'))
                        .filter(u => {
                          const searchLower = searchResponsableElaboracion.toLowerCase();
                          return searchLower === '' || 
                            u.firstName?.toLowerCase().includes(searchLower) ||
                            u.firstLastname?.toLowerCase().includes(searchLower) ||
                            u.proceso?.toLowerCase().includes(searchLower);
                        })
                        .map(u => (
                          <label key={u.usuarioId} style={{ display: 'block', marginBottom: '4px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={formData.responsableElaboracionId.includes(u.usuarioId)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData, 
                                    responsableElaboracionId: [...formData.responsableElaboracionId, u.usuarioId]
                                  });
                                } else {
                                  setFormData({
                                    ...formData, 
                                    responsableElaboracionId: formData.responsableElaboracionId.filter(id => id !== u.usuarioId)
                                  });
                                }
                              }}
                              disabled={modalMode === 'view'}
                              style={{ marginRight: '8px' }}
                            />
                            {u.firstName} {u.firstLastname} - {u.proceso || 'Sin proceso'}
                          </label>
                        ))}
                      {usuarios.filter(u => u.roles?.some((r: string) => r.toUpperCase() === 'RESPONSABLE')).length === 0 && (
                        <div style={{ color: '#999', fontSize: '0.9rem' }}>No hay usuarios con rol RESPONSABLE</div>
                      )}
                    </div>
                    <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
                      Seleccionados: {formData.responsableElaboracionId.length}
                    </small>
                  </div>

                  <div className="form-group">
                    <label>Responsables de Supervisión</label>
                    <input
                      type="text"
                      placeholder="Buscar supervisores..."
                      value={searchResponsableSupervision}
                      onChange={(e) => setSearchResponsableSupervision(e.target.value)}
                      disabled={modalMode === 'view'}
                      style={{ marginBottom: '8px' }}
                    />
                    <div style={{ 
                      border: '1px solid #ddd', 
                      borderRadius: '4px', 
                      padding: '8px', 
                      maxHeight: '150px', 
                      overflowY: 'auto',
                      backgroundColor: '#fff'
                    }}>
                      {usuarios
                        .filter(u => u.roles?.some((r: string) => r.toUpperCase() === 'SUPERVISOR'))
                        .filter(u => {
                          const searchLower = searchResponsableSupervision.toLowerCase();
                          return searchLower === '' || 
                            u.firstName?.toLowerCase().includes(searchLower) ||
                            u.firstLastname?.toLowerCase().includes(searchLower) ||
                            u.proceso?.toLowerCase().includes(searchLower);
                        })
                        .map(u => (
                          <label key={u.usuarioId} style={{ display: 'block', marginBottom: '4px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={formData.responsableSupervisionId.includes(u.usuarioId)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData, 
                                    responsableSupervisionId: [...formData.responsableSupervisionId, u.usuarioId]
                                  });
                                } else {
                                  setFormData({
                                    ...formData, 
                                    responsableSupervisionId: formData.responsableSupervisionId.filter(id => id !== u.usuarioId)
                                  });
                                }
                              }}
                              disabled={modalMode === 'view'}
                              style={{ marginRight: '8px' }}
                            />
                            {u.firstName} {u.firstLastname} - {u.proceso || 'Sin proceso'}
                          </label>
                        ))}
                      {usuarios.filter(u => u.roles?.some((r: string) => r.toUpperCase() === 'SUPERVISOR')).length === 0 && (
                        <div style={{ color: '#999', fontSize: '0.9rem' }}>No hay usuarios con rol SUPERVISOR</div>
                      )}
                    </div>
                    <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
                      Seleccionados: {formData.responsableSupervisionId.length}
                    </small>
                  </div>

                  <div className="form-group">
                    <label>Plazo Adicional (días)</label>
                    <input
                      type="number"
                      value={formData.plazoAdicionalDias}
                      onChange={(e) => setFormData({...formData, plazoAdicionalDias: parseInt(e.target.value) || 0})}
                      min="0"
                      disabled={modalMode === 'view'}
                    />
                  </div>

                  {modalMode !== 'view' && (
                    <div className="modal-footer">
                      <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>
                        Cancelar
                      </button>
                      <button type="submit" className="btn-primary" disabled={saving}>
                        {saving ? 'Guardando...' : modalMode === 'create' ? 'Crear Reporte' : 'Guardar Cambios'}
                      </button>
                    </div>
                  )}
                </form>
              )}

              {modalMode === 'view' && (
                <div className="modal-footer">
                  <button className="btn-secondary" onClick={() => setShowModal(false)}>Cerrar</button>
                  {selectedReporte && (
                    <button className="btn-primary" onClick={() => handleEditReporte(selectedReporte)}>
                      Editar
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
