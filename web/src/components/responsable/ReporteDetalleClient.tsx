import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, AlertCircle, Calendar, Clock, User, FileText } from 'lucide-react';
import FilesList from '../reportes/FilesList';
import FileViewer from '../reportes/FileViewer';
import '../../styles/reporte-detalle.css';

interface ArchivoDTO {
  archivoId: string;
  tipoArchivo: string;
  nombreOriginal: string;
  tamanoBytes: number;
  mimeType: string;
  subidoPor: string;
  subidoPorEmail: string;
  subidoEn: string;
  urlPublica: string | null;
}

interface ResponsableInfo {
  nombre: string;
  email: string;
  cargo: string;
}

interface ComentarioDTO {
  autor: string;
  fecha: string;
  texto: string;
  accion: string;
}

interface PeriodoDetalle {
  periodoId: string;
  reporteNombre: string;
  entidadNombre: string;
  periodoInicio: string;
  periodoFin: string;
  fechaVencimientoCalculada: string;
  fechaEnvioReal: string | null;
  estado: string;
  estadoDescripcion: string;
  diasDesviacion: number | null;
  responsableElaboracion: ResponsableInfo | null;
  responsableSupervision: ResponsableInfo | null;
  comentarios: ComentarioDTO[];
  archivos: ArchivoDTO[];
}

interface ReporteDetalleClientProps {
  periodoId: string;
  backHref?: string;
  backLabel?: string;
}

export default function ReporteDetalleClient({ periodoId, backHref, backLabel }: ReporteDetalleClientProps) {
  const [detalle, setDetalle] = useState<PeriodoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<ArchivoDTO | null>(null);

  useEffect(() => {
    loadDetalle();
  }, [periodoId]);

  const loadDetalle = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/periodos/${periodoId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar el detalle del periodo');
      }

      const data = await response.json();
      console.log('📊 Detalle recibido:', data.data);
      console.log('📎 Archivos encontrados:', data.data.archivos?.length || 0);
      setDetalle(data.data);
    } catch (err: any) {
      console.error('❌ Error cargando detalle:', err);
      setError(err.message || 'Error al cargar el detalle');
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatearFechaHora = (fechaHora: string) => {
    const date = fechaHora.includes('T') ? new Date(fechaHora) : new Date(fechaHora + 'T00:00:00');
    return date.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoClass = (estado: string): string => {
    const estadoLower = estado.toLowerCase();
    if (estadoLower.includes('pendiente') || estadoLower.includes('borrador')) return 'estado-pendiente';
    if (estadoLower.includes('enviado') || estadoLower.includes('revision')) return 'estado-enviado';
    if (estadoLower.includes('aprobado') || estadoLower.includes('completado')) return 'estado-aprobado';
    if (estadoLower.includes('rechazado')) return 'estado-rechazado';
    return 'estado-default';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <Loader2 className="spinner" />
          <p className="loading-text">Cargando detalle del reporte...</p>
        </div>
      </div>
    );
  }

  if (error || !detalle) {
    return (
      <div className="error-container">
        <div className="error-card">
          <div className="error-content">
            <AlertCircle className="error-icon" />
            <h2 className="error-title">Error</h2>
            <p className="error-message">{error || 'No se pudo cargar el detalle'}</p>
            <button
              onClick={() => window.history.back()}
              className="error-button"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reporte-detalle-container">
      <div className="reporte-detalle-wrapper">
        {/* Header con botón de regreso */}
        <div className="reporte-header">
          <button
            onClick={() => {
              if (backHref) {
                window.location.href = backHref;
              } else {
                window.history.back();
              }
            }}
            className="back-button"
          >
            <ArrowLeft />
            <span>{backLabel || 'Volver a Mis Reportes'}</span>
          </button>
          
          <div className="header-card">
            <div className="header-content">
              <div className="header-info">
                <h1 className="header-title">
                  {detalle.reporteNombre}
                </h1>
                <p className="header-subtitle">{detalle.entidadNombre}</p>
              </div>
              <span className={`estado-badge ${getEstadoClass(detalle.estado)}`}>
                {detalle.estadoDescripcion}
              </span>
            </div>
          </div>
        </div>

        {/* Grid de información */}
        <div className="info-grid">
          {/* Fechas */}
          <div className="info-card">
            <h2 className="card-title">
              <Calendar style={{ color: '#2563eb' }} />
              Fechas
            </h2>
            <div className="card-content">
              <div className="field-group">
                <p className="field-label">Periodo</p>
                <p className="field-value">
                  {formatearFecha(detalle.periodoInicio)} - {formatearFecha(detalle.periodoFin)}
                </p>
              </div>
              <div className="field-group">
                <p className="field-label">Fecha de Vencimiento</p>
                <p className="field-value">{formatearFecha(detalle.fechaVencimientoCalculada)}</p>
              </div>
              {detalle.fechaEnvioReal && (
                <div className="field-group">
                  <p className="field-label">Fecha de Envío</p>
                  <p className="field-value">{formatearFechaHora(detalle.fechaEnvioReal)}</p>
                  {detalle.diasDesviacion !== null && detalle.diasDesviacion !== 0 && (
                    <span className={`desviacion-badge ${detalle.diasDesviacion > 0 ? 'retraso' : 'anticipacion'}`}>
                      {detalle.diasDesviacion > 0 
                        ? `${detalle.diasDesviacion} día${detalle.diasDesviacion !== 1 ? 's' : ''} de retraso`
                        : `${Math.abs(detalle.diasDesviacion)} día${Math.abs(detalle.diasDesviacion) !== 1 ? 's' : ''} de anticipación`
                      }
                    </span>
                  )}
                  {detalle.diasDesviacion === 0 && (
                    <span className="desviacion-badge a-tiempo">
                      Enviado a tiempo
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Responsables */}
          <div className="info-card">
            <h2 className="card-title">
              <User style={{ color: '#7c3aed' }} />
              Responsables
            </h2>
            <div className="card-content">
              {detalle.responsableElaboracion && (
                <div className="responsable-card elaboracion">
                  <p className="responsable-role">Elaboración</p>
                  <p className="responsable-name">{detalle.responsableElaboracion.nombre}</p>
                  <p className="responsable-cargo">{detalle.responsableElaboracion.cargo}</p>
                  <p className="responsable-email">{detalle.responsableElaboracion.email}</p>
                </div>
              )}
              {detalle.responsableSupervision && (
                <div className="responsable-card supervision">
                  <p className="responsable-role">Supervisión</p>
                  <p className="responsable-name">{detalle.responsableSupervision.nombre}</p>
                  <p className="responsable-cargo">{detalle.responsableSupervision.cargo}</p>
                  <p className="responsable-email">{detalle.responsableSupervision.email}</p>
                </div>
              )}
              {!detalle.responsableElaboracion && !detalle.responsableSupervision && (
                <p className="no-responsables">No hay responsables asignados</p>
              )}
            </div>
          </div>
        </div>

        {/* Archivos */}
        <div className="info-card">
          <div className="archivos-header">
            <h2 className="card-title">
              <FileText style={{ color: '#16a34a' }} />
              Archivos Adjuntos
            </h2>
            <span className="count-badge">
              {detalle.archivos.length}
            </span>
          </div>
          {detalle.archivos.length > 0 ? (
            <FilesList
              periodoId={detalle.periodoId}
              archivos={detalle.archivos}
              onViewFile={setArchivoSeleccionado}
              compact={false}
            />
          ) : (
            <div className="empty-state">
              <FileText />
              <p className="empty-state-title">No hay archivos adjuntos</p>
              <p className="empty-state-subtitle">Los archivos aparecerán aquí cuando se suban</p>
            </div>
          )}
        </div>

        {/* Comentarios */}
        {detalle.comentarios.length > 0 && (
          <div className="info-card">
            <div className="archivos-header">
              <h2 className="card-title">
                <Clock style={{ color: '#4f46e5' }} />
                Historial de Comentarios
              </h2>
              <span className="count-badge" style={{ backgroundColor: '#e0e7ff', color: '#3730a3' }}>
                {detalle.comentarios.length}
              </span>
            </div>
            <div className="comentarios-list">
              {detalle.comentarios.map((comentario, index) => (
                <div key={index} className="comentario-card">
                  <div className="comentario-header">
                    <div className="comentario-author-info">
                      <p className="comentario-author">{comentario.autor}</p>
                      <p className="comentario-date">{comentario.fecha}</p>
                    </div>
                    <span className="comentario-action">
                      {comentario.accion}
                    </span>
                  </div>
                  <p className="comentario-text">{comentario.texto}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de visualización */}
      {archivoSeleccionado && (
        <FileViewer
          archivo={archivoSeleccionado}
          periodoId={detalle.periodoId}
          onClose={() => setArchivoSeleccionado(null)}
        />
      )}
    </div>
  );
}
