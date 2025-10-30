import { useState, useEffect } from 'react';
import { reportesService, type ReporteResponse, type Page } from '../lib/services';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileText, Calendar, Building2, User, Trash2, Edit } from 'lucide-react';

export default function ReportesList() {
  const [reportes, setReportes] = useState<ReporteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filtroEstado, setFiltroEstado] = useState('');

  useEffect(() => {
    loadReportes();
  }, [page, filtroEstado]);

  const loadReportes = async () => {
    setLoading(true);
    try {
      let data: Page<ReporteResponse>;
      if (filtroEstado) {
        data = await reportesService.porEstado(filtroEstado, page, 10);
      } else {
        data = await reportesService.listar(page, 10);
      }
      setReportes(data.content);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error loading reportes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este reporte?')) return;
    
    try {
      await reportesService.eliminar(id);
      loadReportes();
    } catch (error: any) {
      alert(error.response?.data?.mensaje || 'Error al eliminar el reporte');
    }
  };

  const getEstadoBadge = (estado: string) => {
    const classes = {
      PENDIENTE: 'badge-pendiente',
      EN_PROGRESO: 'badge-en-progreso',
      ENVIADO: 'badge-enviado',
    };
    return classes[estado as keyof typeof classes] || 'badge-pendiente';
  };

  if (loading && reportes.length === 0) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando reportes...</div>;
  }

  return (
    <div className="reportes-container">
      <div className="reportes-header">
        <div>
          <h2 className="reportes-title">Reportes Regulatorios</h2>
          <p className="reportes-subtitle">Gestiona todos los reportes del sistema</p>
        </div>
        <a href="/reportes/nuevo" className="btn btn-primary">
          Nuevo Reporte
        </a>
      </div>

      <div className="reportes-filters">
        <select
          className="form-select"
          value={filtroEstado}
          onChange={(e) => {
            setFiltroEstado(e.target.value);
            setPage(0);
          }}
          style={{ maxWidth: '200px' }}
        >
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="EN_PROGRESO">En Progreso</option>
          <option value="ENVIADO">Enviado</option>
        </select>
      </div>

      {reportes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--color-text-light)' }}>
            No hay reportes para mostrar.
          </p>
        </div>
      ) : (
        <>
          <div className="reportes-grid">
            {reportes.map((reporte) => (
              <div key={reporte.id} className="reporte-card">
                <div className="reporte-card-header">
                  <h3 className="reporte-card-title">{reporte.titulo}</h3>
                  <span className={`badge ${getEstadoBadge(reporte.estado)}`}>
                    {reporte.estado.replace('_', ' ')}
                  </span>
                </div>

                {reporte.descripcion && (
                  <p className="reporte-card-description">{reporte.descripcion}</p>
                )}

                <div className="reporte-card-details">
                  <div className="reporte-detail">
                    <Building2 size={16} />
                    <span>{reporte.entidadNombre}</span>
                  </div>
                  <div className="reporte-detail">
                    <User size={16} />
                    <span>{reporte.responsableNombre}</span>
                  </div>
                  <div className="reporte-detail">
                    <Calendar size={16} />
                    <span>
                      Vence: {format(new Date(reporte.fechaVencimiento), 'dd MMM yyyy', { locale: es })}
                    </span>
                  </div>
                  <div className="reporte-detail">
                    <FileText size={16} />
                    <span>{reporte.frecuencia} - {reporte.formato}</span>
                  </div>
                </div>

                <div className="reporte-card-actions">
                  <a href={`/reportes/${reporte.id}`} className="btn btn-sm btn-secondary">
                    <Edit size={14} />
                    Ver/Editar
                  </a>
                  <button
                    onClick={() => handleDelete(reporte.id)}
                    className="btn btn-sm btn-danger"
                  >
                    <Trash2 size={14} />
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-sm btn-secondary"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                Anterior
              </button>
              <span className="pagination-info">
                Página {page + 1} de {totalPages}
              </span>
              <button
                className="btn btn-sm btn-secondary"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
