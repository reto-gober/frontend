import { useState, useEffect } from 'react';
import { reportesService, entidadesService, usuariosService, type ReporteRequest, type ResponsableReporte, type EntidadResponse, type UsuarioResponse } from '../lib/services';
import { useToast, ToastContainer } from './Toast';

interface Props {
  reporteId?: string;
  useNewFormat?: boolean; // Flag para usar el nuevo formato
}

interface ResponsableFormData extends ResponsableReporte {
  nombre?: string; // Para mostrar en UI
}

export default function ReporteForm({ reporteId, useNewFormat = true }: Props) {
  const [loading, setLoading] = useState(false);
  const [entidades, setEntidades] = useState<EntidadResponse[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioResponse[]>([]);
  const [searchElaboracion, setSearchElaboracion] = useState('');
  const [searchSupervision, setSearchSupervision] = useState('');
  const [showElaboracionList, setShowElaboracionList] = useState(false);
  const [showSupervisionList, setShowSupervisionList] = useState(false);
  const { toasts, removeToast, success, error } = useToast();
  
  // Estado para responsables en nuevo formato
  const [responsables, setResponsables] = useState<ResponsableFormData[]>([]);
  
  const [formData, setFormData] = useState<ReporteRequest>({
    nombre: '',
    descripcion: '',
    entidadId: '',
    frecuencia: 'MENSUAL',
    formatoRequerido: 'PDF',
    baseLegal: '',
    fechaInicioVigencia: '',
    fechaFinVigencia: '',
    fechaVencimiento: '',
    plazoAdicionalDias: undefined,
    linkInstrucciones: '',
    responsableElaboracionId: [],
    responsableSupervisionId: [],
    correosNotificacion: [],
    telefonoResponsable: '',
    estado: 'PENDIENTE',
  });

  useEffect(() => {
    loadSelects();
    if (reporteId) {
      loadReporte();
    }
  }, [reporteId]);

  const loadSelects = async () => {
    try {
      const [entidadesData, usuariosData] = await Promise.all([
        entidadesService.activas(),
        usuariosService.listar(),
      ]);
      setEntidades(entidadesData.content);
      setUsuarios(usuariosData.content);
    } catch (error) {
      console.error('Error loading selects:', error);
    }
  };

  const loadReporte = async () => {
    if (!reporteId) return;
    try {
      const reporte = await reportesService.obtener(reporteId);
      setFormData({
        nombre: reporte.nombre,
        descripcion: reporte.descripcion || '',
        entidadId: reporte.entidadId,
        frecuencia: reporte.frecuencia as any,
        formatoRequerido: reporte.formatoRequerido as any,
        baseLegal: reporte.baseLegal || '',
        fechaInicioVigencia: reporte.fechaInicioVigencia || '',
        fechaFinVigencia: reporte.fechaFinVigencia || '',
        fechaVencimiento: reporte.fechaVencimiento,
        plazoAdicionalDias: reporte.plazoAdicionalDias,
        linkInstrucciones: reporte.linkInstrucciones || '',
        responsableElaboracionId: reporte.responsableElaboracionId || [],
        responsableSupervisionId: reporte.responsableSupervisionId || [],
        correosNotificacion: reporte.correosNotificacion || [],
        telefonoResponsable: reporte.telefonoResponsable || '',
        estado: reporte.estado as any,
      });
    } catch (error) {
      console.error('Error loading reporte:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let payload: ReporteRequest;
      
      if (useNewFormat && responsables.length > 0) {
        // Usar nuevo formato con array de responsables
        payload = {
          ...formData,
          responsables: responsables.map(r => ({
            usuarioId: r.usuarioId,
            tipoResponsabilidad: r.tipoResponsabilidad,
            esPrincipal: r.esPrincipal,
            fechaInicio: r.fechaInicio || new Date().toISOString().split('T')[0],
            fechaFin: r.fechaFin,
            observaciones: r.observaciones,
          })),
          // Remover campos legacy si se usa nuevo formato
          responsableElaboracionId: undefined,
          responsableSupervisionId: undefined,
        };
      } else {
        // Usar formato legacy
        payload = formData;
      }
      
      if (reporteId) {
        await reportesService.actualizar(reporteId, payload);
        success('Reporte actualizado exitosamente');
      } else {
        await reportesService.crear(payload);
        success('Reporte creado exitosamente');
      }
      setTimeout(() => {
        window.location.href = '/reportes';
      }, 1000);
    } catch (err: any) {
      error(err.response?.data?.mensaje || 'Error al guardar el reporte');
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Manejar campo numérico
    if (name === 'plazoAdicionalDias') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? undefined : parseInt(value, 10),
      }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // ===== FUNCIONES PARA NUEVO FORMATO =====
  const addResponsableNuevoFormato = (
    usuarioId: string,
    tipo: 'elaboracion' | 'supervision' | 'revision',
    esPrincipal: boolean = false
  ) => {
    const usuario = usuarios.find(u => u.usuarioId === usuarioId);
    if (!usuario) return;

    const nuevoResponsable: ResponsableFormData = {
      usuarioId,
      tipoResponsabilidad: tipo,
      esPrincipal,
      fechaInicio: new Date().toISOString().split('T')[0],
      nombre: `${usuario.firstName} ${usuario.firstLastname}`,
    };

    setResponsables(prev => [...prev, nuevoResponsable]);
  };

  const removeResponsableNuevoFormato = (usuarioId: string) => {
    setResponsables(prev => prev.filter(r => r.usuarioId !== usuarioId));
  };

  const updateResponsableNuevoFormato = (
    usuarioId: string,
    updates: Partial<ResponsableFormData>
  ) => {
    setResponsables(prev =>
      prev.map(r => (r.usuarioId === usuarioId ? { ...r, ...updates } : r))
    );
  };

  const togglePrincipalNuevoFormato = (usuarioId: string, tipo: 'elaboracion' | 'supervision' | 'revision') => {
    setResponsables(prev =>
      prev.map(r => {
        if (r.usuarioId === usuarioId) {
          return { ...r, esPrincipal: !r.esPrincipal };
        }
        // Si se marca como principal, desmarcar otros del mismo tipo
        if (r.tipoResponsabilidad === tipo && r.usuarioId !== usuarioId) {
          return { ...r, esPrincipal: false };
        }
        return r;
      })
    );
  };

  // ===== FUNCIONES PARA FORMATO LEGACY =====
  const toggleResponsable = (type: 'elaboracion' | 'supervision', usuarioId: string) => {
    const field = type === 'elaboracion' ? 'responsableElaboracionId' : 'responsableSupervisionId';
    setFormData(prev => {
      const current = prev[field] || [];
      const updated = current.includes(usuarioId)
        ? current.filter(id => id !== usuarioId)
        : [...current, usuarioId];
      
      // Actualizar teléfono si es elaboración y hay al menos un responsable
      if (type === 'elaboracion') {
        const firstResponsable = usuarios.find(u => updated[0] === u.usuarioId);
        return {
          ...prev,
          [field]: updated,
          telefonoResponsable: firstResponsable?.telefono || '',
        };
      }
      
      return {
        ...prev,
        [field]: updated,
      };
    });
  };

  const addResponsable = (type: 'elaboracion' | 'supervision', usuarioId: string) => {
    if (!usuarioId) return;
    
    const field = type === 'elaboracion' ? 'responsableElaboracionId' : 'responsableSupervisionId';
    setFormData(prev => {
      const current = prev[field] || [];
      if (current.includes(usuarioId)) return prev;
      
      const updated = [...current, usuarioId];
      const usuario = usuarios.find(u => u.usuarioId === usuarioId);
      
      // Recopilar emails de todos los responsables
      const allResponsables = [
        ...(formData.responsableElaboracionId || []),
        ...(formData.responsableSupervisionId || [])
      ];
      if (!allResponsables.includes(usuarioId)) {
        allResponsables.push(usuarioId);
      }
      const emails = allResponsables
        .map(id => usuarios.find(u => u.usuarioId === id)?.email)
        .filter((email): email is string => !!email);
      
      // Actualizar teléfono si es elaboración y es el primer responsable
      if (type === 'elaboracion' && current.length === 0) {
        return {
          ...prev,
          [field]: updated,
          telefonoResponsable: usuario?.telefono || '',
          correosNotificacion: emails,
        };
      }
      
      return {
        ...prev,
        [field]: updated,
        correosNotificacion: emails,
      };
    });
    
    // Limpiar búsqueda y ocultar lista
    if (type === 'elaboracion') {
      setSearchElaboracion('');
      setShowElaboracionList(false);
    } else {
      setSearchSupervision('');
      setShowSupervisionList(false);
    }
  };

  const removeResponsable = (type: 'elaboracion' | 'supervision', usuarioId: string) => {
    const field = type === 'elaboracion' ? 'responsableElaboracionId' : 'responsableSupervisionId';
    setFormData(prev => {
      const updated = (prev[field] || []).filter(id => id !== usuarioId);
      
      // Actualizar correos eliminando el del usuario removido
      const allResponsables = [
        ...(type === 'elaboracion' ? updated : (prev.responsableElaboracionId || [])),
        ...(type === 'supervision' ? updated : (prev.responsableSupervisionId || []))
      ];
      const emails = allResponsables
        .map(id => usuarios.find(u => u.usuarioId === id)?.email)
        .filter((email): email is string => !!email);
      
      // Actualizar teléfono si es elaboración
      if (type === 'elaboracion') {
        const firstResponsable = usuarios.find(u => updated[0] === u.usuarioId);
        return {
          ...prev,
          [field]: updated,
          telefonoResponsable: firstResponsable?.telefono || '',
          correosNotificacion: emails,
        };
      }
      
      return {
        ...prev,
        [field]: updated,
        correosNotificacion: emails,
      };
    });
  };

  const getFilteredUsuarios = (type: 'elaboracion' | 'supervision', search: string) => {
    const field = type === 'elaboracion' ? 'responsableElaboracionId' : 'responsableSupervisionId';
    const selected = formData[field] || [];
    
    return usuarios
      .filter(u => !selected.includes(u.usuarioId))
      .filter(u => {
        if (!search) return true;
        const fullName = `${u.firstName} ${u.firstLastname}`.toLowerCase();
        return fullName.includes(search.toLowerCase());
      })
      .slice(0, 5); // Limitar a 5 resultados
  };

  return (
    <div className="reporte-form-container">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className="form-header">
        <div className="form-header-content">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="form-header-icon">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          <h2 className="form-title">{reporteId ? 'Editar Reporte' : 'Nuevo Reporte'}</h2>
        </div>
        <a href="/reportes" className="btn btn-secondary">
          Volver
        </a>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
          {/* Formulario principal */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Información General */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '0.875rem', borderBottom: '2px solid var(--color-primary-100)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-primary-600)' }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 600, color: 'var(--color-primary-900)' }}>
                  Información General
                </h3>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ minHeight: '92px' }}>
                  <label htmlFor="nombre" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)', marginBottom: '0.375rem' }}>
                    Nombre del reporte <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginBottom: '0.5rem' }}>
                    Descriptivo y único
                  </div>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    className="form-input"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div style={{ minHeight: '92px' }}>
                  <label htmlFor="entidadId" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)', marginBottom: '0.375rem' }}>
                    Entidad <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginBottom: '0.5rem' }}>
                    Organización responsable
                  </div>
                  <select
                    id="entidadId"
                    name="entidadId"
                    className="form-select"
                    value={formData.entidadId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {entidades.map(entidad => (
                      <option key={entidad.entidadId} value={entidad.entidadId}>
                        {entidad.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ minHeight: '92px' }}>
                  <label htmlFor="estado" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)', marginBottom: '0.375rem' }}>
                    Estado <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <div style={{ fontSize: '0.75rem', color: 'transparent', marginBottom: '0.5rem' }}>
                    -
                  </div>
                  <select
                    id="estado"
                    name="estado"
                    className="form-select"
                    value={formData.estado}
                    onChange={handleChange}
                    required
                  >
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="EN_PROGRESO">En Progreso</option>
                    <option value="ENVIADO">Enviado</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="descripcion" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
                  Descripción
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  className="form-textarea"
                  value={formData.descripcion}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Opcional: contexto adicional del reporte..."
                />
              </div>
            </div>

            {/* Equipo Responsable */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '0.875rem', borderBottom: '2px solid var(--color-primary-100)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-primary-600)' }}>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 600, color: 'var(--color-primary-900)' }}>
                    Equipo Responsable
                  </h3>
                </div>
                
                {/* Toggle formato nuevo/legacy */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                    {useNewFormat ? 'Formato Avanzado' : 'Formato Simple'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      // Confirmar cambio si hay datos
                      if ((useNewFormat && responsables.length > 0) || 
                          (!useNewFormat && (formData.responsableElaboracionId?.length || formData.responsableSupervisionId?.length))) {
                        if (!confirm('¿Cambiar formato? Se perderán los responsables actuales.')) return;
                        setResponsables([]);
                        setFormData(prev => ({
                          ...prev,
                          responsableElaboracionId: [],
                          responsableSupervisionId: [],
                        }));
                      }
                      // Toggle
                      if (useNewFormat) {
                        // Cambiar de nuevo a legacy
                        window.location.href = window.location.pathname + '?legacy=true';
                      } else {
                        // Cambiar de legacy a nuevo
                        window.location.href = window.location.pathname;
                      }
                    }}
                    style={{
                      width: '38px',
                      height: '20px',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: useNewFormat ? 'var(--color-primary-500)' : 'var(--color-gray-300)',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: '2px',
                      left: useNewFormat ? '20px' : '2px',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      transition: 'left 0.2s',
                    }} />
                  </button>
                </div>
              </div>

              {useNewFormat ? (
                // ===== FORMATO NUEVO =====
                <>
                  <div style={{ 
                    backgroundColor: 'var(--color-info-50)', 
                    border: '1px solid var(--color-info-200)',
                    borderRadius: '6px',
                    padding: '0.875rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    gap: '0.75rem'
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-info-600)', flexShrink: 0, marginTop: '2px' }}>
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-info-900)' }}>
                      <strong>Formato Avanzado:</strong> Asigna múltiples responsables con roles específicos (Elaboración, Supervisión, Revisión) y marca responsables principales.
                    </div>
                  </div>

                  {/* Lista de responsables actuales */}
                  {responsables.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)', marginBottom: '0.75rem' }}>
                        Responsables asignados ({responsables.length})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {responsables.map((resp) => {
                          const usuario = usuarios.find(u => u.usuarioId === resp.usuarioId);
                          return (
                            <div key={resp.usuarioId} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '1rem',
                              padding: '0.875rem',
                              backgroundColor: 'var(--color-gray-50)',
                              border: '1px solid var(--color-border)',
                              borderRadius: '6px',
                            }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                  <span style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--color-text)' }}>
                                    {usuario?.firstName} {usuario?.firstLastname}
                                  </span>
                                  {resp.esPrincipal && (
                                    <span style={{
                                      fontSize: '0.6875rem',
                                      fontWeight: 600,
                                      padding: '0.125rem 0.5rem',
                                      backgroundColor: 'var(--color-warning-100)',
                                      color: 'var(--color-warning-800)',
                                      borderRadius: '10px',
                                    }}>
                                      PRINCIPAL
                                    </span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                                  <span style={{
                                    padding: '0.125rem 0.5rem',
                                    backgroundColor: resp.tipoResponsabilidad === 'elaboracion' 
                                      ? 'var(--color-primary-100)' 
                                      : resp.tipoResponsabilidad === 'supervision'
                                      ? 'var(--color-success-100)'
                                      : 'var(--color-info-100)',
                                    color: resp.tipoResponsabilidad === 'elaboracion' 
                                      ? 'var(--color-primary-700)' 
                                      : resp.tipoResponsabilidad === 'supervision'
                                      ? 'var(--color-success-700)'
                                      : 'var(--color-info-700)',
                                    borderRadius: '4px',
                                    fontWeight: 500,
                                  }}>
                                    {resp.tipoResponsabilidad.charAt(0).toUpperCase() + resp.tipoResponsabilidad.slice(1)}
                                  </span>
                                  <span>Desde: {resp.fechaInicio}</span>
                                </div>
                              </div>
                              
                              <button
                                type="button"
                                onClick={() => togglePrincipalNuevoFormato(resp.usuarioId, resp.tipoResponsabilidad)}
                                style={{
                                  padding: '0.375rem 0.75rem',
                                  fontSize: '0.75rem',
                                  border: '1px solid var(--color-border)',
                                  borderRadius: '4px',
                                  backgroundColor: 'white',
                                  cursor: 'pointer',
                                  fontWeight: 500,
                                }}
                                title={resp.esPrincipal ? 'Desmarcar como principal' : 'Marcar como principal'}
                              >
                                ⭐
                              </button>
                              
                              <button
                                type="button"
                                onClick={() => removeResponsableNuevoFormato(resp.usuarioId)}
                                style={{
                                  padding: '0.375rem 0.75rem',
                                  fontSize: '0.875rem',
                                  border: '1px solid var(--color-danger-300)',
                                  borderRadius: '4px',
                                  backgroundColor: 'white',
                                  color: 'var(--color-danger-600)',
                                  cursor: 'pointer',
                                  fontWeight: 500,
                                }}
                              >
                                Quitar
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Selector para agregar nuevo responsable */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 140px', gap: '0.75rem', alignItems: 'end' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
                        Usuario
                      </label>
                      <select
                        className="form-select"
                        value=""
                        onChange={(e) => {
                          const usuarioId = e.target.value;
                          if (usuarioId && !responsables.find(r => r.usuarioId === usuarioId)) {
                            addResponsableNuevoFormato(usuarioId, 'elaboracion', false);
                          }
                          e.target.value = '';
                        }}
                      >
                        <option value="">Seleccionar usuario...</option>
                        {usuarios
                          .filter(u => !responsables.find(r => r.usuarioId === u.usuarioId))
                          .map(usuario => (
                            <option key={usuario.usuarioId} value={usuario.usuarioId}>
                              {usuario.firstName} {usuario.firstLastname} {usuario.cargo ? `- ${usuario.cargo}` : ''}
                            </option>
                          ))}
                      </select>
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
                        Tipo
                      </label>
                      <select className="form-select" disabled>
                        <option>Elaboración</option>
                      </select>
                    </div>
                    
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', paddingBottom: '0.625rem' }}>
                      Seleccione arriba
                    </div>
                  </div>
                </>
              ) : (
                // ===== FORMATO LEGACY =====
                <>
              {/* Responsables de Elaboración */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)', marginBottom: '0.375rem' }}>
                  Elaboración <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginBottom: '0.625rem' }}>
                  Personas encargadas de elaborar el reporte
                </div>
                
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Buscar persona..."
                      value={searchElaboracion}
                      onChange={(e) => {
                        setSearchElaboracion(e.target.value);
                        setShowElaboracionList(true);
                      }}
                      onFocus={() => setShowElaboracionList(true)}
                      onBlur={() => setTimeout(() => setShowElaboracionList(false), 200)}
                      style={{ paddingLeft: '2.5rem' }}
                    />
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }}>
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.35-4.35"></path>
                    </svg>
                  </div>
                  
                  {showElaboracionList && getFilteredUsuarios('elaboracion', searchElaboracion).length > 0 && (
                    <div style={{ 
                      position: 'absolute', 
                      top: '100%', 
                      left: 0, 
                      right: 0, 
                      backgroundColor: 'white', 
                      border: '1px solid var(--color-border)', 
                      borderRadius: '6px', 
                      marginTop: '0.25rem', 
                      maxHeight: '220px', 
                      overflowY: 'auto', 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
                      zIndex: 10 
                    }}>
                      {getFilteredUsuarios('elaboracion', searchElaboracion).map(usuario => (
                        <button
                          key={usuario.usuarioId}
                          type="button"
                          onClick={() => addResponsable('elaboracion', usuario.usuarioId)}
                          style={{ 
                            width: '100%', 
                            padding: '0.75rem', 
                            border: 'none', 
                            background: 'none', 
                            textAlign: 'left', 
                            cursor: 'pointer',
                            transition: 'background-color 0.15s',
                            borderBottom: '1px solid var(--color-gray-100)'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-50)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--color-text)' }}>
                            {usuario.firstName} {usuario.firstLastname}
                          </div>
                          {usuario.cargo && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '0.125rem' }}>
                              {usuario.cargo}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {(formData.responsableElaboracionId?.length || 0) > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem', marginTop: '0.875rem' }}>
                    {formData.responsableElaboracionId?.map(id => {
                      const usuario = usuarios.find(u => u.usuarioId === id);
                      return usuario ? (
                        <div key={id} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          padding: '0.75rem', 
                          backgroundColor: 'var(--color-primary-50)', 
                          border: '1px solid var(--color-primary-200)',
                          borderRadius: '6px',
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--color-primary-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {usuario.firstName} {usuario.firstLastname}
                            </div>
                            {usuario.cargo && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-primary-700)', marginTop: '0.125rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {usuario.cargo}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeResponsable('elaboracion', id)}
                            style={{ 
                              background: 'none', 
                              border: 'none', 
                              color: 'var(--color-primary-600)', 
                              cursor: 'pointer', 
                              padding: '0.25rem',
                              fontSize: '1.25rem', 
                              lineHeight: 1,
                              borderRadius: '4px',
                              marginLeft: '0.5rem',
                              flexShrink: 0,
                              transition: 'background-color 0.15s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-100)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            title="Quitar"
                          >
                            ×
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Responsables de Supervisión */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)', marginBottom: '0.375rem' }}>
                  Supervisión
                </label>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginBottom: '0.625rem' }}>
                  Personas que supervisan y validan el reporte
                </div>
                
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Buscar supervisor..."
                      value={searchSupervision}
                      onChange={(e) => {
                        setSearchSupervision(e.target.value);
                        setShowSupervisionList(true);
                      }}
                      onFocus={() => setShowSupervisionList(true)}
                      onBlur={() => setTimeout(() => setShowSupervisionList(false), 200)}
                      style={{ paddingLeft: '2.5rem' }}
                    />
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }}>
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.35-4.35"></path>
                    </svg>
                  </div>
                  
                  {showSupervisionList && getFilteredUsuarios('supervision', searchSupervision).length > 0 && (
                    <div style={{ 
                      position: 'absolute', 
                      top: '100%', 
                      left: 0, 
                      right: 0, 
                      backgroundColor: 'white', 
                      border: '1px solid var(--color-border)', 
                      borderRadius: '6px', 
                      marginTop: '0.25rem', 
                      maxHeight: '220px', 
                      overflowY: 'auto', 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
                      zIndex: 10 
                    }}>
                      {getFilteredUsuarios('supervision', searchSupervision).map(usuario => (
                        <button
                          key={usuario.usuarioId}
                          type="button"
                          onClick={() => addResponsable('supervision', usuario.usuarioId)}
                          style={{ 
                            width: '100%', 
                            padding: '0.75rem', 
                            border: 'none', 
                            background: 'none', 
                            textAlign: 'left', 
                            cursor: 'pointer',
                            transition: 'background-color 0.15s',
                            borderBottom: '1px solid var(--color-gray-100)'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-50)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--color-text)' }}>
                            {usuario.firstName} {usuario.firstLastname}
                          </div>
                          {usuario.cargo && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '0.125rem' }}>
                              {usuario.cargo}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {(formData.responsableSupervisionId || []).length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem', marginTop: '0.875rem' }}>
                    {(formData.responsableSupervisionId || []).map(id => {
                      const usuario = usuarios.find(u => u.usuarioId === id);
                      return usuario ? (
                        <div key={id} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          padding: '0.75rem', 
                          backgroundColor: 'var(--color-green-50)', 
                          border: '1px solid var(--color-green-200)',
                          borderRadius: '6px',
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--color-green-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {usuario.firstName} {usuario.firstLastname}
                            </div>
                            {usuario.cargo && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-green-700)', marginTop: '0.125rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {usuario.cargo}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeResponsable('supervision', id)}
                            style={{ 
                              background: 'none', 
                              border: 'none', 
                              color: 'var(--color-green-600)', 
                              cursor: 'pointer', 
                              padding: '0.25rem',
                              fontSize: '1.25rem', 
                              lineHeight: 1,
                              borderRadius: '4px',
                              marginLeft: '0.5rem',
                              flexShrink: 0,
                              transition: 'background-color 0.15s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-green-100)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            title="Quitar"
                          >
                            ×
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
              </>
              )}
            </div>

            {/* Frecuencia y Plazos */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '0.875rem', borderBottom: '2px solid var(--color-primary-100)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-primary-600)' }}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 600, color: 'var(--color-primary-900)' }}>
                  Frecuencia y Plazos
                </h3>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label htmlFor="frecuencia" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
                    Frecuencia <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <select
                    id="frecuencia"
                    name="frecuencia"
                    className="form-select"
                    value={formData.frecuencia}
                    onChange={handleChange}
                    required
                  >
                    <option value="MENSUAL">Mensual</option>
                    <option value="TRIMESTRAL">Trimestral</option>
                    <option value="SEMESTRAL">Semestral</option>
                    <option value="ANUAL">Anual</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="fechaVencimiento" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
                    Fecha Vencimiento <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <input
                    type="date"
                    id="fechaVencimiento"
                    name="fechaVencimiento"
                    className="form-input"
                    value={formData.fechaVencimiento}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="plazoAdicionalDias" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
                    Plazo Adicional (días)
                  </label>
                  <input
                    type="number"
                    id="plazoAdicionalDias"
                    name="plazoAdicionalDias"
                    className="form-input"
                    value={formData.plazoAdicionalDias || ''}
                    onChange={handleChange}
                    min="0"
                    placeholder="0"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label htmlFor="fechaInicioVigencia" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
                    Inicio Vigencia
                  </label>
                  <input
                    type="date"
                    id="fechaInicioVigencia"
                    name="fechaInicioVigencia"
                    className="form-input"
                    value={formData.fechaInicioVigencia}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="fechaFinVigencia" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
                    Fin Vigencia
                  </label>
                  <input
                    type="date"
                    id="fechaFinVigencia"
                    name="fechaFinVigencia"
                    className="form-input"
                    value={formData.fechaFinVigencia}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Información Adicional */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '0.875rem', borderBottom: '2px solid var(--color-primary-100)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-primary-600)' }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 600, color: 'var(--color-primary-900)' }}>
                  Información Adicional
                </h3>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label htmlFor="formatoRequerido" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
                    Formato Requerido <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <select
                    id="formatoRequerido"
                    name="formatoRequerido"
                    className="form-select"
                    value={formData.formatoRequerido}
                    onChange={handleChange}
                    required
                  >
                    <option value="PDF">PDF</option>
                    <option value="EXCEL">Excel</option>
                    <option value="WORD">Word</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="baseLegal" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
                    Base Legal
                  </label>
                  <input
                    type="text"
                    id="baseLegal"
                    name="baseLegal"
                    className="form-input"
                    value={formData.baseLegal}
                    onChange={handleChange}
                    placeholder="Ej: Resolución 001 de 2024"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label htmlFor="linkInstrucciones" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
                    Link de Instrucciones
                  </label>
                  <input
                    type="url"
                    id="linkInstrucciones"
                    name="linkInstrucciones"
                    className="form-input"
                    value={formData.linkInstrucciones}
                    onChange={handleChange}
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label htmlFor="telefonoResponsable" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
                    Teléfono Responsable
                  </label>
                  <input
                    type="tel"
                    id="telefonoResponsable"
                    name="telefonoResponsable"
                    className="form-input"
                    value={formData.telefonoResponsable}
                    disabled
                    placeholder="Auto: del responsable"
                    style={{ backgroundColor: 'var(--color-gray-50)', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="correosNotificacion" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)', marginBottom: '0.375rem' }}>
                  Correos de Notificación
                </label>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginBottom: '0.5rem' }}>
                  Automático: emails de todos los responsables
                </div>
                <input
                  type="text"
                  id="correosNotificacion"
                  name="correosNotificacion"
                  className="form-input"
                  value={formData.correosNotificacion?.join(', ') || ''}
                  disabled
                  placeholder="Se agregarán automáticamente"
                  style={{ backgroundColor: 'var(--color-gray-50)', cursor: 'not-allowed' }}
                />
              </div>
            </div>

            {/* Botones de acción */}
            <div className="card" style={{ padding: '1rem 1.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-start' }}>
                <button type="submit" className="btn btn-purple btn-with-icon" disabled={loading}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                  </svg>
                  {loading ? 'Guardando...' : (reporteId ? 'Actualizar Reporte' : 'Crear Reporte')}
                </button>
                <a href="/reportes" className="btn btn-secondary">
                  Cancelar
                </a>
              </div>
            </div>
          </div>

          {/* Panel lateral - Resumen */}
          <div style={{ position: 'sticky', top: '1.5rem' }}>
            <div className="card" style={{ padding: '1.5rem', backgroundColor: 'var(--color-primary-50)', border: '1px solid var(--color-primary-200)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-primary-700)' }}>
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--color-primary-900)' }}>
                  Resumen del Reporte
                </h4>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
                <div>
                  <div style={{ color: 'var(--color-primary-700)', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.375rem' }}>
                    Nombre
                  </div>
                  <div style={{ color: 'var(--color-primary-900)', fontWeight: 500, lineHeight: 1.4 }}>
                    {formData.nombre || '—'}
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--color-primary-700)', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.375rem' }}>
                    Entidad
                  </div>
                  <div style={{ color: 'var(--color-primary-900)', fontWeight: 500, lineHeight: 1.4 }}>
                    {entidades.find(e => e.entidadId === formData.entidadId)?.nombre || '—'}
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--color-primary-700)', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.375rem' }}>
                    Estado
                  </div>
                  <div>
                    <span className={
                      formData.estado === 'PENDIENTE' ? 'badge badge-warning' :
                      formData.estado === 'EN_PROGRESO' ? 'badge badge-info' :
                      'badge badge-aprobado'
                    } style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem' }}>
                      {formData.estado === 'PENDIENTE' ? 'Pendiente' :
                       formData.estado === 'EN_PROGRESO' ? 'En Progreso' :
                       'Enviado'}
                    </span>
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--color-primary-700)', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.375rem' }}>
                    Elaboradores ({formData.responsableElaboracionId?.length || 0})
                  </div>
                  <div style={{ color: 'var(--color-primary-900)' }}>
                    {(formData.responsableElaboracionId?.length || 0) > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        {formData.responsableElaboracionId?.slice(0, 3).map(id => {
                          const usuario = usuarios.find(u => u.usuarioId === id);
                          return usuario ? (
                            <div key={id} style={{ fontSize: '0.8125rem', lineHeight: 1.4 }}>
                              • {usuario.firstName} {usuario.firstLastname}
                            </div>
                          ) : null;
                        })}
                        {(formData.responsableElaboracionId?.length || 0) > 3 && (
                          <div style={{ fontSize: '0.8125rem', color: 'var(--color-primary-600)', fontWeight: 500 }}>
                            +{(formData.responsableElaboracionId?.length || 0) - 3} más
                          </div>
                        )}
                      </div>
                    ) : '—'}
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--color-primary-700)', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.375rem' }}>
                    Supervisores ({(formData.responsableSupervisionId || []).length})
                  </div>
                  <div style={{ color: 'var(--color-primary-900)' }}>
                    {(formData.responsableSupervisionId || []).length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        {(formData.responsableSupervisionId || []).slice(0, 3).map(id => {
                          const usuario = usuarios.find(u => u.usuarioId === id);
                          return usuario ? (
                            <div key={id} style={{ fontSize: '0.8125rem', lineHeight: 1.4 }}>
                              • {usuario.firstName} {usuario.firstLastname}
                            </div>
                          ) : null;
                        })}
                        {(formData.responsableSupervisionId || []).length > 3 && (
                          <div style={{ fontSize: '0.8125rem', color: 'var(--color-primary-600)', fontWeight: 500 }}>
                            +{(formData.responsableSupervisionId || []).length - 3} más
                          </div>
                        )}
                      </div>
                    ) : '—'}
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--color-primary-700)', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.375rem' }}>
                    Vencimiento
                  </div>
                  <div style={{ color: 'var(--color-primary-900)', fontWeight: 500, lineHeight: 1.4 }}>
                    {formData.fechaVencimiento ? new Date(formData.fechaVencimiento + 'T00:00:00').toLocaleDateString('es-CO', { 
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }) : '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
