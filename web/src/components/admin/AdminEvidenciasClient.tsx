import { useState, useEffect } from 'react';
import { reportesService, evidenciasService, type ReporteResponse } from '../../lib/services';

interface EvidenciaAgregada {
  id: string;
  nombreArchivo: string;
  tipoArchivo: string;
  tamano: number;
  reporteNombre: string;
  entidadNombre: string;
  creadoEn: string;
}

export default function AdminEvidenciasClient() {
  const [evidencias, setEvidencias] = useState<EvidenciaAgregada[]>([]);
  const [filteredEvidencias, setFilteredEvidencias] = useState<EvidenciaAgregada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    tamanoTotal: 0,
    porTipo: {} as Record<string, number>
  });

  useEffect(() => {
    cargarEvidencias();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [searchTerm, filterTipo, evidencias]);

  const cargarEvidencias = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 1. Cargar todos los reportes
      const reportesData = await reportesService.listar(0, 1000);
      
      // 2. Por cada reporte, cargar sus evidencias
      const todasEvidencias: EvidenciaAgregada[] = [];
      
      for (const reporte of reportesData.content.slice(0, 50)) { // Limitar a 50 reportes para rendimiento
        try {
          const evidenciasReporte = await evidenciasService.listarPorReporte(reporte.reporteId);
          
          evidenciasReporte.forEach((ev: any) => {
            todasEvidencias.push({
              id: ev.id,
              nombreArchivo: ev.nombreArchivo,
              tipoArchivo: ev.tipoArchivo,
              tamano: ev.tamano,
              reporteNombre: reporte.nombre,
              entidadNombre: reporte.entidadNombre || 'N/A',
              creadoEn: ev.creadoEn
            });
          });
        } catch (err) {
          // Continuar si un reporte no tiene evidencias
          console.log(`No hay evidencias para ${reporte.nombre}`);
        }
      }
      
      setEvidencias(todasEvidencias);
      setFilteredEvidencias(todasEvidencias);
      calcularEstadisticas(todasEvidencias);
    } catch (err) {
      console.error('Error al cargar evidencias:', err);
      setError('Error al cargar las evidencias');
    } finally {
      setLoading(false);
    }
  };

  const calcularEstadisticas = (evs: EvidenciaAgregada[]) => {
    const tamanoTotal = evs.reduce((sum, ev) => sum + ev.tamano, 0);
    const porTipo: Record<string, number> = {};
    
    evs.forEach(ev => {
      const extension = ev.nombreArchivo.split('.').pop() || 'otro';
      porTipo[extension] = (porTipo[extension] || 0) + 1;
    });
    
    setEstadisticas({
      total: evs.length,
      tamanoTotal,
      porTipo
    });
  };

  const aplicarFiltros = () => {
    let filtered = [...evidencias];

    if (searchTerm) {
      filtered = filtered.filter(ev =>
        ev.nombreArchivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ev.reporteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ev.entidadNombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterTipo) {
      filtered = filtered.filter(ev => 
        ev.nombreArchivo.toLowerCase().endsWith(`.${filterTipo.toLowerCase()}`)
      );
    }

    setFilteredEvidencias(filtered);
  };

  const formatTamano = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getTipoIcon = (nombreArchivo: string) => {
    const ext = nombreArchivo.split('.').pop()?.toLowerCase();
    switch(ext) {
      case 'pdf': return '📄';
      case 'xlsx':
      case 'xls': return '📊';
      case 'docx':
      case 'doc': return '📝';
      case 'png':
      case 'jpg':
      case 'jpeg': return '🖼️';
      default: return '📎';
    }
  };

  if (loading) {
    return (
      <div className="evidencias-page">
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
          <p style={{ marginTop: '1rem', color: 'var(--neutral-600)' }}>Cargando evidencias...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="evidencias-page">
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <p style={{ color: 'var(--error-red-600)' }}>{error}</p>
          <button onClick={cargarEvidencias} className="btn-primary" style={{ marginTop: '1rem' }}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="evidencias-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-info">
          <h1 className="page-title">Gestión de Evidencias</h1>
          <p className="page-description">Archivos y documentos del sistema</p>
        </div>
      </div>

      {/* Stats */}
      <div className="evidencias-stats">
        <div className="stat-card">
          <span className="stat-value">{estadisticas.total}</span>
          <span className="stat-label">Total Archivos</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{formatTamano(estadisticas.tamanoTotal)}</span>
          <span className="stat-label">Almacenamiento</span>
        </div>
        {Object.entries(estadisticas.porTipo).slice(0, 3).map(([tipo, cantidad]) => (
          <div key={tipo} className="stat-card">
            <span className="stat-value">{cantidad}</span>
            <span className="stat-label">{tipo.toUpperCase()}</span>
          </div>
        ))}
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
            placeholder="Buscar evidencias..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select className="filter-select" value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)}>
          <option value="">Todos los tipos</option>
          <option value="pdf">PDF</option>
          <option value="xlsx">Excel</option>
          <option value="docx">Word</option>
          <option value="png">Imagen</option>
        </select>
      </div>

      {/* Grid de archivos */}
      <div className="evidencias-grid">
        {filteredEvidencias.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--neutral-500)' }}>
            No se encontraron evidencias
          </div>
        ) : (
          filteredEvidencias.map(ev => (
            <div key={ev.id} className="evidencia-card">
              <div className="evidencia-icon">
                {getTipoIcon(ev.nombreArchivo)}
              </div>
              <div className="evidencia-info">
                <h4 className="evidencia-nombre">{ev.nombreArchivo}</h4>
                <p className="evidencia-reporte">{ev.reporteNombre}</p>
                <p className="evidencia-entidad">{ev.entidadNombre}</p>
              </div>
              <div className="evidencia-meta">
                <span className="evidencia-tamano">{formatTamano(ev.tamano)}</span>
                <span className="evidencia-fecha">{formatFecha(ev.creadoEn)}</span>
              </div>
              <div className="evidencia-actions">
                <button className="btn-icon" title="Descargar">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </button>
                <button className="btn-icon danger" title="Eliminar">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
