import React, { useState } from 'react';
import { 
  Download, 
  Eye, 
  File, 
  FileText, 
  Image as ImageIcon, 
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import type { ArchivoDTO } from '../../lib/services';
import '../../styles/files-list.css';

interface FilesListProps {
  periodoId: string;
  archivos: ArchivoDTO[];
  onViewFile?: (archivo: ArchivoDTO) => void;
  compact?: boolean;
}

const FilesList: React.FC<FilesListProps> = ({ 
  periodoId, 
  archivos, 
  onViewFile,
  compact = false 
}) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Formatear tamaño de archivo
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Obtener icono según tipo MIME
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon />;
    if (mimeType === 'application/pdf') return <FileText />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) 
      return <FileSpreadsheet />;
    return <File />;
  };

  // Obtener URL de descarga
  const obtenerUrlDescarga = async (archivoId: string): Promise<string> => {
    const archivo = archivos.find(a => a.archivoId === archivoId);
    
    // Si tiene URL pública, usarla directamente
    if (archivo?.urlPublica) {
      return archivo.urlPublica;
    }

    // Sino, generar URL temporal
    const token = localStorage.getItem('token');
    const response = await fetch(
      `http://localhost:8080/api/periodos/${periodoId}/archivos/${archivoId}/url`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Error al generar URL de descarga');
    }

    const data = await response.json();
    return data.data.url;
  };

  // Descargar archivo
  const handleDownload = async (archivo: ArchivoDTO) => {
    try {
      setError(null);
      setDownloadingId(archivo.archivoId);

      const url = await obtenerUrlDescarga(archivo.archivoId);

      // Crear enlace temporal y forzar descarga
      const link = document.createElement('a');
      link.href = url;
      link.download = archivo.nombreOriginal;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      console.error('Error al descargar archivo:', err);
      setError('Error al descargar el archivo');
    } finally {
      setDownloadingId(null);
    }
  };

  // Ver archivo en modal
  const handleView = (archivo: ArchivoDTO) => {
    if (onViewFile) {
      onViewFile(archivo);
    }
  };

  // Determinar si el archivo es visualizable
  const isViewable = (mimeType: string): boolean => {
    return mimeType.startsWith('image/') || mimeType === 'application/pdf';
  };

  if (!archivos || archivos.length === 0) {
    return (
      <div className="files-empty-state">
        <File />
        <p>No hay archivos adjuntos</p>
      </div>
    );
  }

  return (
    <div className={`files-list-container ${compact ? 'compact' : ''}`}>
      {error && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          fontSize: '0.875rem', 
          color: '#dc2626', 
          backgroundColor: '#fef2f2', 
          padding: '0.5rem 0.75rem', 
          borderRadius: '0.375rem' 
        }}>
          <AlertCircle style={{ width: '1rem', height: '1rem' }} />
          {error}
        </div>
      )}

      {archivos.map((archivo) => (
        <div key={archivo.archivoId} className="file-item">
          {/* Icono */}
          <div className="file-item-icon">
            {getFileIcon(archivo.mimeType)}
          </div>

          {/* Contenido */}
          <div className="file-item-content">
            <h4 className="file-item-name">{archivo.nombreOriginal}</h4>
            <div className="file-item-metadata">
              <span>{formatSize(archivo.tamanoBytes)}</span>
            </div>
          </div>

          {/* Acciones */}
          <div className="file-item-actions">
            {/* Botón ver (solo para imágenes y PDFs) */}
            {isViewable(archivo.mimeType) && (
              <button
                onClick={() => handleView(archivo)}
                className="file-action-btn file-action-btn-view"
                title="Ver archivo"
              >
                <Eye />
              </button>
            )}

            {/* Botón descargar */}
            <button
              onClick={() => handleDownload(archivo)}
              disabled={downloadingId === archivo.archivoId}
              className="file-action-btn file-action-btn-download"
              title="Descargar archivo"
              style={downloadingId === archivo.archivoId ? { opacity: 0.5, cursor: 'wait' } : {}}
            >
              <Download style={downloadingId === archivo.archivoId ? { animation: 'pulse 2s infinite' } : {}} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FilesList;
