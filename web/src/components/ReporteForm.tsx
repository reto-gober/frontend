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
    responsableId: 0,
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
      [name]: name === 'entidadId' || name === 'responsableId' ? parseInt(value) : value,
    }));
  };

  return (
    <div className="reporte-form-container">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className="form-header">
        <h2 className="form-title">{reporteId ? 'Editar Reporte' : 'Nuevo Reporte'}</h2>
        <a href="/reportes" className="btn btn-secondary">
          Volver
        </a>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="titulo" className="form-label">Título *</label>
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
            <label htmlFor="entidadId" className="form-label">Entidad *</label>
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
            <label htmlFor="responsableId" className="form-label">Responsable *</label>
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
                <option key={usuario.id} value={usuario.id}>
                  {usuario.nombre} {usuario.apellido}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="frecuencia" className="form-label">Frecuencia *</label>
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
            <label htmlFor="formato" className="form-label">Formato *</label>
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
            <label htmlFor="fechaVencimiento" className="form-label">Fecha de Vencimiento *</label>
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

          <div className="form-group">
            <label htmlFor="estado" className="form-label">Estado *</label>
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

        <div className="form-group">
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
          <button type="submit" className="btn btn-primary" disabled={loading}>
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
