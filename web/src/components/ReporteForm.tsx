import { useState, useEffect } from 'react';
import { reportesService, entidadesService, usuariosService, type ReporteRequest, type ResponsableReporte, type EntidadResponse, type UsuarioResponse } from '../lib/services';
import { useToast, ToastContainer } from './Toast';
import ResponsablesList from './ReporteForm/ResponsablesList';
import ResponsableSelector from './ReporteForm/ResponsableSelector';
import MultiUserSelector from './ReporteForm/MultiUserSelector';
import notifications from '../lib/notifications';

interface Props {
  reporteId?: string;
  useNewFormat?: boolean; // Flag para usar el nuevo formato
  onClose?: () => void; // Callback para cerrar modal (usado en admin)
}

interface ResponsableFormData extends ResponsableReporte {
  nombre?: string; // Para mostrar en UI
}

export default function ReporteForm({ reporteId, useNewFormat = true, onClose }: Props) {
  const [loading, setLoading] = useState<boolean>(!!reporteId);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [entidades, setEntidades] = useState<EntidadResponse[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioResponse[]>([]);
  const [selectedResponsables, setSelectedResponsables] = useState<string[]>([]);
  const [selectedSupervisores, setSelectedSupervisores] = useState<string[]>([]);
  const { toasts, removeToast, success, error } = useToast();
  
  // Estado para responsables en nuevo formato
  const [responsables, setResponsables] = useState<ResponsableFormData[]>([]);
  
  const [diasPersonalizados, setDiasPersonalizados] = useState<number | ''>('');

  const [formData, setFormData] = useState<ReporteRequest>({
    nombre: '',
    descripcion: '',
    entidadId: '',
    frecuencia: 'mensual',
    formatoRequerido: 'Excel',
    baseLegal: '',
    fechaInicioVigencia: '',
    fechaFinVigencia: null,
    fechaVencimiento: '',
    plazoAdicionalDias: undefined,
    linkInstrucciones: '',
    correosNotificacion: [],
    telefonoResponsable: '',
    estado: 'activo',
  });

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        await loadSelects();
        if (reporteId) {
          await loadReporte();
        }
      } catch (err) {
        console.error('Error inicializando formulario de reporte:', err);
        if (mounted) {
          setLoadError('No se pudo cargar la información del reporte');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    init();
    return () => {
      mounted = false;
    };
  }, [reporteId]);

  const loadSelects = async () => {
    try {
      const [entidadesData, usuariosData] = await Promise.all([
        entidadesService.activas(),
        usuariosService.listar(),
      ]);
      console.log('Entidades cargadas:', entidadesData);
      console.log('Usuarios cargados:', usuariosData);
      setEntidades(entidadesData.content || entidadesData || []);
      setUsuarios(usuariosData.content || usuariosData || []);
    } catch (err) {
      console.error('Error loading selects:', err);
      error('Error al cargar entidades y usuarios');
      throw err;
    }
  };

  const loadReporte = async () => {
    if (!reporteId) return;
    try {
      const reporte = await reportesService.obtener(reporteId);
      console.log('Reporte cargado:', reporte);
      
      setFormData({
        nombre: reporte.nombre,
        descripcion: reporte.descripcion || '',
        entidadId: reporte.entidadId,
        frecuencia: reporte.frecuencia,
        formatoRequerido: reporte.formatoRequerido,
        baseLegal: reporte.baseLegal || '',
        fechaInicioVigencia: reporte.fechaInicioVigencia || '',
        fechaFinVigencia: reporte.fechaFinVigencia || null,
        fechaVencimiento: reporte.fechaVencimiento,
        plazoAdicionalDias: reporte.plazoAdicionalDias,
        linkInstrucciones: reporte.linkInstrucciones || '',
        correosNotificacion: reporte.correosNotificacion || [],
        telefonoResponsable: reporte.telefonoResponsable || '',
        estado: reporte.estado,
      });
      
      // Inicializar los arrays de selección para el nuevo formato
      // Convertir responsables de la nueva estructura o legacy
      const elaboradores: string[] = [];
      const supervisores: string[] = [];
      
      if (reporte.responsables && reporte.responsables.length > 0) {
        // Usar nueva estructura de responsables
        reporte.responsables.forEach((resp: any) => {
          if (resp.tipoResponsabilidadCodigo === 'elaboracion' && resp.activo) {
            elaboradores.push(resp.usuarioId);
          } else if (resp.tipoResponsabilidadCodigo === 'supervision' && resp.activo) {
            supervisores.push(resp.usuarioId);
          }
        });
      } else {
        // Usar campos legacy si no hay responsables nuevos
        if (reporte.responsableElaboracionId) {
          elaboradores.push(reporte.responsableElaboracionId);
        }
        if (reporte.responsableSupervisionId) {
          supervisores.push(reporte.responsableSupervisionId);
        }
      }
      
      setSelectedResponsables(elaboradores);
      setSelectedSupervisores(supervisores);
      
      console.log('Elaboradores cargados:', elaboradores);
      console.log('Supervisores cargados:', supervisores);
    } catch (error) {
      console.error('Error loading reporte:', error);
      setLoadError('No se pudo cargar la información del reporte seleccionado');
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validar frecuencia personalizada
      if (formData.frecuencia === 'personalizada' && !diasPersonalizados) {
        error('Debe especificar los días para la frecuencia personalizada');
        setSaving(false);
        return;
      }

      // Calcular duración en meses a partir de las fechas de vigencia
      let durationMonths = 0;
      if (formData.fechaInicioVigencia && formData.fechaFinVigencia) {
        const inicio = new Date(formData.fechaInicioVigencia);
        const fin = new Date(formData.fechaFinVigencia);
        const diffTime = Math.abs(fin.getTime() - inicio.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        durationMonths = Math.ceil(diffDays / 30); // Aproximación de meses
      }
      
      // Validar
      if (durationMonths < 1) {
        error('Debe especificar fechas de inicio y fin de vigencia válidas');
        setSaving(false);
        return;
      }

      // Determinar la frecuencia final como string
      const frecuenciaFinal = formData.frecuencia === 'personalizada' 
        ? `${diasPersonalizados}` 
        : formData.frecuencia;
      
      let payload: ReporteRequest;
      
      if (useNewFormat && (selectedResponsables.length > 0 || selectedSupervisores.length > 0)) {
        // Usar nuevo formato con array de responsables
        const fechaActual = new Date().toISOString().split('T')[0];
        
        payload = {
          ...formData,
          frecuencia: frecuenciaFinal,
          estado: reporteId ? formData.estado : 'activo',
          fechaFinVigencia: formData.fechaFinVigencia || null,
          durationMonths,
          responsables: [
            ...selectedResponsables.map((userId, index) => ({
              usuarioId: userId,
              tipoResponsabilidad: 'elaboracion' as const,
              esPrincipal: index === 0,
              activo: true,
              orden: index + 1,
              fechaInicio: fechaActual,
            })),
            ...selectedSupervisores.map((userId, index) => ({
              usuarioId: userId,
              tipoResponsabilidad: 'supervision' as const,
              esPrincipal: index === 0,
              activo: true,
              orden: index + 1,
              fechaInicio: fechaActual,
            })),
          ],
        };
      } else {
        // Usar formato legacy
        payload = {
          ...formData,
          frecuencia: frecuenciaFinal,
          estado: reporteId ? formData.estado : 'activo',
          fechaFinVigencia: formData.fechaFinVigencia || null,
          durationMonths,
        };
      }
      
      if (reporteId) {
        await reportesService.actualizar(reporteId, payload);
        success('Reporte actualizado exitosamente');
      } else {
        await reportesService.crear(payload);
        success('Reporte creado exitosamente');
      }
      
      // Si hay callback onClose (modal), usarlo; si no, redirigir
      setTimeout(() => {
        if (onClose) {
          onClose();
        } else {
          window.location.href = '/reportes';
        }
      }, 1000);
    } catch (err: any) {
      error(err.response?.data?.message || err.response?.data?.mensaje || 'Error al guardar el reporte');
    } finally {
      setSaving(false);
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
      activo: true,
      orden: responsables.length + 1,
      fechaInicio: new Date().toISOString().split('T')[0],
      nombre: usuario ? `${usuario.firstName} ${usuario.firstLastname}` : '',
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

  if (loading) {
    return (
      <div className="reporte-form-container" style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--neutral-600)' }}>
          Cargando información del reporte...
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="reporte-form-container" style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--error-red-600)', marginBottom: '1rem' }}>{loadError}</p>
        <button
          className="btn btn-secondary"
          onClick={() => {
            setLoadError(null);
            setLoading(true);
            loadSelects()
              .then(() => (reporteId ? loadReporte() : Promise.resolve()))
              .catch(() => setLoadError('No se pudo recargar el formulario'))
              .finally(() => setLoading(false));
          }}
        >
          Reintentar
        </button>
      </div>
    );
  }

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
        {onClose ? (
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Volver
          </button>
        ) : (
          <a href="/reportes" className="btn btn-secondary">
            Volver
          </a>
        )}
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
                    Entidad a entregar el reporte <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginBottom: '0.5rem' }}>
                    Organización destinataria
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
                
                {/* Toggle formato nuevo/legacy - Solo mostrar si NO está en modal */}
                {!onClose && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                      {useNewFormat ? 'Formato Avanzado' : 'Formato Simple'}
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        // Confirmar cambio si hay datos
                        if ((useNewFormat && responsables.length > 0) || 
                            (!useNewFormat && (selectedResponsables.length > 0 || selectedSupervisores.length > 0))) {
                        const confirmed = await notifications.confirm(
                          'Se perderán los responsables actuales',
                          '¿Cambiar formato?',
                          'Sí, cambiar',
                          'Cancelar'
                        );
                        if (!confirmed) return;
                        setResponsables([]);
                        setSelectedResponsables([]);
                        setSelectedSupervisores([]);
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
                )}
              </div>

              {useNewFormat && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <MultiUserSelector
                      usuarios={usuarios}
                      selectedIds={selectedResponsables}
                      onSelectionChange={setSelectedResponsables}
                      roleFilter="RESPONSABLE"
                      label="Responsables de Elaboración"
                      placeholder="Buscar responsables..."
                    />

                    <MultiUserSelector
                      usuarios={usuarios}
                      selectedIds={selectedSupervisores}
                      onSelectionChange={setSelectedSupervisores}
                      roleFilter="SUPERVISOR"
                      label="Supervisores"
                      placeholder="Buscar supervisores..."
                    />
                  </div>
                </>
              )}
            </div>

            {/* Plazos y Vigencia */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '0.875rem', borderBottom: '2px solid var(--color-primary-100)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-primary-600)' }}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 600, color: 'var(--color-primary-900)' }}>
                  Plazos y Vigencia
                </h3>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)', marginBottom: '0.75rem' }}>
                  Frecuencia de Reporte <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                  {[
                    { 
                      value: 'diaria', 
                      label: 'Diaria', 
                      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="12" y2="18"/></svg>,
                      dias: 1 
                    },
                    { 
                      value: 'semanal', 
                      label: 'Semanal', 
                      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg>,
                      dias: 7 
                    },
                    { 
                      value: 'quincenal', 
                      label: 'Quincenal', 
                      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="8" y2="18"/><line x1="16" y1="14" x2="16" y2="18"/></svg>,
                      dias: 15 
                    },
                    { 
                      value: 'mensual', 
                      label: 'Mensual', 
                      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
                      dias: 30 
                    },
                    { 
                      value: 'bimestral', 
                      label: 'Bimestral', 
                      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="10" y1="4" x2="10" y2="22"/><line x1="14" y1="4" x2="14" y2="22"/></svg>,
                      dias: 60 
                    },
                    { 
                      value: 'trimestral', 
                      label: 'Trimestral', 
                      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="4" x2="8" y2="22"/><line x1="12" y1="4" x2="12" y2="22"/><line x1="16" y1="4" x2="16" y2="22"/></svg>,
                      dias: 90 
                    },
                    { 
                      value: 'semestral', 
                      label: 'Semestral', 
                      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="4" x2="12" y2="22"/></svg>,
                      dias: 180 
                    },
                    { 
                      value: 'anual', 
                      label: 'Anual', 
                      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="12" cy="15" r="3"/></svg>,
                      dias: 365 
                    },
                  ].map(({ value, label, icon, dias }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, frecuencia: value }));
                        setDiasPersonalizados('');
                      }}
                      style={{
                        padding: '0.75rem',
                        border: formData.frecuencia === value ? '2px solid var(--color-primary-500)' : '1px solid var(--neutral-300)',
                        borderRadius: '8px',
                        backgroundColor: formData.frecuencia === value ? 'var(--color-primary-50)' : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.375rem',
                      }}
                    >
                      <div style={{ color: formData.frecuencia === value ? 'var(--color-primary-600)' : 'var(--neutral-600)' }}>
                        {icon}
                      </div>
                      <span style={{ 
                        fontSize: '0.8125rem', 
                        fontWeight: formData.frecuencia === value ? 600 : 500,
                        color: formData.frecuencia === value ? 'var(--color-primary-700)' : 'var(--color-text)'
                      }}>
                        {label}
                      </span>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--neutral-500)' }}>
                        {dias} día{dias !== 1 ? 's' : ''}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Opción Personalizada */}
                <div style={{ marginTop: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, frecuencia: 'personalizada' }));
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: formData.frecuencia === 'personalizada' ? '2px solid var(--color-primary-500)' : '1px solid var(--neutral-300)',
                      borderRadius: '8px',
                      backgroundColor: formData.frecuencia === 'personalizada' ? 'var(--color-primary-50)' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: formData.frecuencia === 'personalizada' ? 'var(--color-primary-600)' : 'var(--neutral-600)' }}>
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l4.2 4.2M23 12h-6m-6 0H1m13.2 5.2l-4.2-4.2m0-6l-4.2-4.2"/>
                    </svg>
                    <span style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: formData.frecuencia === 'personalizada' ? 600 : 500,
                      color: formData.frecuencia === 'personalizada' ? 'var(--color-primary-700)' : 'var(--color-text)'
                    }}>
                      Frecuencia Personalizada
                    </span>
                  </button>

                  {formData.frecuencia === 'personalizada' && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <label htmlFor="diasPersonalizados" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
                        Cada cuántos días se reporta <span style={{ color: 'var(--color-danger)' }}>*</span>
                      </label>
                      <input
                        type="number"
                        id="diasPersonalizados"
                        className="form-input"
                        value={diasPersonalizados}
                        onChange={(e) => setDiasPersonalizados(e.target.value ? parseInt(e.target.value) : '')}
                        min="1"
                        max="999"
                        placeholder="Ej: 45 días"
                        required={formData.frecuencia === 'personalizada'}
                        style={{ maxWidth: '200px' }}
                      />
                      {diasPersonalizados && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--neutral-600)', marginTop: '0.375rem' }}>
                          El reporte se generará cada {diasPersonalizados} día{diasPersonalizados !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
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
                    value={formData.fechaFinVigencia || ''}
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
              
              {/* Campo oculto para formato */}
              <input type="hidden" name="formato" value="otro" />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1rem' }}>
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
            </div>

            {/* Botones de acción */}
            <div className="card" style={{ padding: '1rem 1.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-start' }}>
                <button type="submit" className="btn btn-purple btn-with-icon" disabled={loading || saving}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                  </svg>
                  {saving ? 'Guardando...' : (reporteId ? 'Actualizar Reporte' : 'Crear Reporte')}
                </button>
                {onClose ? (
                  <button type="button" onClick={onClose} className="btn btn-secondary">
                    Cancelar
                  </button>
                ) : (
                  <a href="/reportes" className="btn btn-secondary">
                    Cancelar
                  </a>
                )}
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
                    Elaboradores ({Array.isArray(selectedResponsables) ? selectedResponsables.length : 0})
                  </div>
                  <div style={{ color: 'var(--color-primary-900)' }}>
                    {Array.isArray(selectedResponsables) && selectedResponsables.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        {selectedResponsables.slice(0, 3).map(id => {
                          const usuario = usuarios.find(u => u.usuarioId === id);
                          return usuario ? (
                            <div key={id} style={{ fontSize: '0.8125rem', lineHeight: 1.4 }}>
                              • {usuario.firstName} {usuario.firstLastname}
                            </div>
                          ) : null;
                        })}
                        {selectedResponsables.length > 3 && (
                          <div style={{ fontSize: '0.8125rem', color: 'var(--color-primary-600)', fontWeight: 500 }}>
                            +{selectedResponsables.length - 3} más
                          </div>
                        )}
                      </div>
                    ) : '—'}
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--color-primary-700)', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.375rem' }}>
                    Supervisores ({Array.isArray(selectedSupervisores) ? selectedSupervisores.length : 0})
                  </div>
                  <div style={{ color: 'var(--color-primary-900)' }}>
                    {Array.isArray(selectedSupervisores) && selectedSupervisores.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        {selectedSupervisores.slice(0, 3).map(id => {
                          const usuario = usuarios.find(u => u.usuarioId === id);
                          return usuario ? (
                            <div key={id} style={{ fontSize: '0.8125rem', lineHeight: 1.4 }}>
                              • {usuario.firstName} {usuario.firstLastname}
                            </div>
                          ) : null;
                        })}
                        {selectedSupervisores.length > 3 && (
                          <div style={{ fontSize: '0.8125rem', color: 'var(--color-primary-600)', fontWeight: 500 }}>
                            +{selectedSupervisores.length - 3} más
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
