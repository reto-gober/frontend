import { useState, useEffect } from 'react';
import { reportesService, entidadesService, usuariosService, type ReporteRequest, type EntidadResponse, type UsuarioResponse } from '../lib/services';
import { useToast, ToastContainer } from './Toast';

interface Props {
  reporteId?: number;
}

export default function ReporteForm({ reporteId }: Props) {
  const [loading, setLoading] = useState(false);
  const [entidades, setEntidades] = useState<EntidadResponse[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioResponse[]>([]);
  const { toasts, removeToast, success, error } = useToast();
  const [formData, setFormData] = useState<ReporteRequest>({
    titulo: '',
    descripcion: '',
    entidadId: 0,
    frecuencia: 'MENSUAL',
    formato: 'PDF',
    resolucion: '',
    responsableId: '',
    fechaVencimiento: '',
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
        titulo: reporte.titulo,
        descripcion: reporte.descripcion || '',
        entidadId: reporte.entidadId,
        frecuencia: reporte.frecuencia as any,
        formato: reporte.formato as any,
        resolucion: reporte.resolucion || '',
        responsableId: reporte.responsableId,
        fechaVencimiento: reporte.fechaVencimiento,
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
      if (reporteId) {
        await reportesService.actualizar(reporteId, formData);
        success('Reporte actualizado exitosamente');
      } else {
        await reportesService.crear(formData);
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
    setFormData(prev => ({
      ...prev,
      [name]: name === 'entidadId' ? parseInt(value) : value,
    }));
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

      <form onSubmit={handleSubmit} className="card">
        {/* Sección Datos Principales - Púrpura */}
        <div className="form-section form-section-datos">
          <h3 className="form-section-title">Datos del Reporte</h3>
          <div className="form-grid-responsive">
            <div className="form-group">
              <label htmlFor="titulo" className="form-label">
                Título <span className="required-asterisk">*</span>
              </label>
              <input
                type="text"
                id="titulo"
                name="titulo"
                className="form-input"
                value={formData.titulo}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="entidadId" className="form-label">
                Entidad <span className="required-asterisk">*</span>
              </label>
              <select
                id="entidadId"
                name="entidadId"
                className="form-select"
                value={formData.entidadId}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar entidad...</option>
                {entidades.map(entidad => (
                  <option key={entidad.id} value={entidad.id}>
                    {entidad.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="responsableId" className="form-label">
                Responsable <span className="required-asterisk">*</span>
              </label>
              <select
                id="responsableId"
                name="responsableId"
                className="form-select"
                value={formData.responsableId}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar responsable...</option>
                {usuarios.map(usuario => (
                  <option key={usuario.documentNumber} value={usuario.documentNumber}>
                    {usuario.firstName} {usuario.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="estado" className="form-label">
                Estado <span className="required-asterisk">*</span>
              </label>
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
        </div>

        {/* Sección Fechas y Frecuencia - Verde */}
        <div className="form-section form-section-fechas">
          <h3 className="form-section-title">Frecuencia y Vencimiento</h3>
          <div className="form-grid-responsive">
            <div className="form-group">
              <label htmlFor="frecuencia" className="form-label">
                Frecuencia <span className="required-asterisk">*</span>
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

            <div className="form-group">
              <label htmlFor="fechaVencimiento" className="form-label">
                Fecha de Vencimiento <span className="required-asterisk">*</span>
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
          </div>
        </div>

        {/* Sección Detalles - Naranja */}
        <div className="form-section form-section-detalles">
          <h3 className="form-section-title">Detalles Adicionales</h3>
          <div className="form-grid-responsive">
            <div className="form-group">
              <label htmlFor="formato" className="form-label">
                Formato <span className="required-asterisk">*</span>
              </label>
              <select
                id="formato"
                name="formato"
                className="form-select"
                value={formData.formato}
                onChange={handleChange}
                required
              >
                <option value="PDF">PDF</option>
                <option value="EXCEL">Excel</option>
                <option value="WORD">Word</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="resolucion" className="form-label">Resolución</label>
              <input
                type="text"
                id="resolucion"
                name="resolucion"
                className="form-input"
                value={formData.resolucion}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="form-group form-group-full">
          <label htmlFor="descripcion" className="form-label">Descripción</label>
          <textarea
            id="descripcion"
            name="descripcion"
            className="form-textarea"
            value={formData.descripcion}
            onChange={handleChange}
            rows={4}
          />
        </div>

        <div className="form-actions">
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
      </form>
    </div>
  );
}
