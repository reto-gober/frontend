import { useState, useEffect } from 'react';
import { evidenciasService, type EvidenciaResponse } from '../lib/services';
import { Upload, Download, Trash2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  reporteId: number;
}

export default function EvidenciasList({ reporteId }: Props) {
  const [evidencias, setEvidencias] = useState<EvidenciaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadEvidencias();
  }, [reporteId]);

  const loadEvidencias = async () => {
    try {
      const data = await evidenciasService.listarPorReporte(reporteId);
      setEvidencias(data);
    } catch (error) {
      console.error('Error loading evidencias:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await evidenciasService.subir(reporteId, file);
      loadEvidencias();
      e.target.value = '';
    } catch (error: any) {
      alert(error.response?.data?.mensaje || 'Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (id: number) => {
    try {
      await evidenciasService.descargar(id);
    } catch (error: any) {
      alert('Error al descargar el archivo');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta evidencia?')) return;

    try {
      await evidenciasService.eliminar(id);
      loadEvidencias();
    } catch (error: any) {
      alert(error.response?.data?.mensaje || 'Error al eliminar la evidencia');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '1rem' }}>Cargando evidencias...</div>;
  }

  return (
    <div className="evidencias-container">
      <div className="evidencias-header">
        <h3 className="evidencias-title">Evidencias y Archivos</h3>
        <label className="btn btn-sm btn-primary upload-btn">
          <Upload size={14} />
          {uploading ? 'Subiendo...' : 'Subir Archivo'}
          <input
            type="file"
            onChange={handleUpload}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {evidencias.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-light)' }}>
          No hay evidencias cargadas para este reporte.
        </div>
      ) : (
        <div className="evidencias-list">
          {evidencias.map((evidencia) => (
            <div key={evidencia.id} className="evidencia-item">
              <div className="evidencia-icon">
                <FileText size={20} />
              </div>
              <div className="evidencia-info">
                <div className="evidencia-name">{evidencia.nombreArchivo}</div>
                <div className="evidencia-meta">
                  {formatFileSize(evidencia.tamano)} • 
                  Subido por {evidencia.subidoPorNombre} • 
                  {format(new Date(evidencia.creadoEn), 'dd MMM yyyy', { locale: es })}
                </div>
              </div>
              <div className="evidencia-actions">
                <button
                  onClick={() => handleDownload(evidencia.id)}
                  className="btn btn-sm btn-secondary"
                  title="Descargar"
                >
                  <Download size={14} />
                </button>
                <button
                  onClick={() => handleDelete(evidencia.id)}
                  className="btn btn-sm btn-danger"
                  title="Eliminar"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
