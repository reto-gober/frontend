import { useState, useEffect } from 'react';
import adminActionsService from '../../lib/services/adminActionsService';
import notifications from '../../lib/notifications';
import type { AdminActionSummary, AdminActionFilters } from '../../lib/types/admin';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import ModalHistorialAcciones from '../modales/ModalHistorialAcciones';

export default function AdminAuditoriaClient() {
  const [acciones, setAcciones] = useState<AdminActionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtros, setFiltros] = useState<AdminActionFilters>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadAcciones();
  }, [filtros, currentPage]);

  const loadAcciones = async () => {
    try {
      setIsLoading(true);
      const response = await adminActionsService.getActions(
        filtros,
        currentPage,
        20
      );
      
      setAcciones(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error: any) {
      notifications.error('Error al cargar el historial de auditoría');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: keyof AdminActionFilters, value: string) => {
    setFiltros(prev => ({
      ...prev,
      [key]: value || undefined
    }));
    setCurrentPage(0);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleVerDetalle = (accionId: string) => {
    setSelectedActionId(accionId);
    setShowModal(true);
  };

  const getActionTypeLabel = (type: string): string => {
    const types: Record<string, string> = {
      'OVERRIDE_SUBMIT': 'Marcado como enviado',
      'UPLOAD_EVIDENCE': 'Evidencia subida',
      'MARK_COMPLETED': 'Marcado como completado',
      'STATUS_CHANGE': 'Cambio de estado',
    };
    return types[type] || type;
  };

  const getActionTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      'OVERRIDE_SUBMIT': 'primary',
      'UPLOAD_EVIDENCE': 'success',
      'MARK_COMPLETED': 'purple',
      'STATUS_CHANGE': 'orange',
    };
    return colors[type] || 'neutral';
  };

  const formatDate = (dateString: string): string => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: es
      });
    } catch {
      return dateString;
    }
  };

  const exportToCSV = () => {
    if (!acciones || acciones.length === 0) {
      notifications.warning('No hay datos para exportar');
      return;
    }

    const csvContent = [
      ['Fecha', 'Tipo', 'Administrador', 'Responsable Afectado', 'Reporte', 'Motivo', 'Archivos'],
      ...acciones.map(a => [
        new Date(a.createdAt).toLocaleString('es-CO'),
        getActionTypeLabel(a.actionType),
        a.adminNombre,
        a.responsableAfectado,
        a.reporteNombre,
        a.motivo.replace(/\n/g, ' '),
        a.filesCount.toString()
      ])
    ]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `auditoria_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    notifications.success('Archivo CSV descargado exitosamente');
  };

  return (
    <div className="auditoria-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Auditoría de Acciones Administrativas</h1>
          <p className="page-subtitle">Registro completo de todas las acciones excepcionales realizadas por administradores</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={exportToCSV} disabled={!acciones || acciones.length === 0}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Exportar CSV
          </button>
          <button className="btn btn-primary" onClick={() => loadAcciones()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Actualizar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-card">
        <div className="filters-grid">
          <div className="form-group">
            <label className="form-label">Tipo de Acción</label>
            <select
              className="form-control"
              onChange={(e) => handleFilterChange('actionType', (e.target as HTMLSelectElement).value)}
            >
              <option value="">Todos</option>
              <option value="OVERRIDE_SUBMIT">Marcado como enviado</option>
              <option value="UPLOAD_EVIDENCE">Evidencia subida</option>
              <option value="MARK_COMPLETED">Marcado como completado</option>
              <option value="STATUS_CHANGE">Cambio de estado</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Fecha Inicio</label>
            <input
              type="date"
              className="form-control"
              onChange={(e) => handleFilterChange('startDate', (e.target as HTMLInputElement).value)}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Fecha Fin</label>
            <input
              type="date"
              className="form-control"
              onChange={(e) => handleFilterChange('endDate', (e.target as HTMLInputElement).value)}
            />
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon primary">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18" />
              <path d="M18 17V9" />
              <path d="M13 17V5" />
              <path d="M8 17v-3" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{totalElements}</div>
            <div className="stat-label">Total Acciones</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon success">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {acciones?.filter(a => a.actionType === 'OVERRIDE_SUBMIT').length || 0}
            </div>
            <div className="stat-label">Reportes Enviados</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon purple">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
              <polyline points="13 2 13 9 20 9" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">
              {acciones?.reduce((sum, a) => sum + a.filesCount, 0) || 0}
            </div>
            <div className="stat-label">Archivos Subidos</div>
          </div>
        </div>
      </div>

      {/* Tabla de Acciones */}
      <div className="dashboard-card">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner-large"></div>
            <p>Cargando auditoría...</p>
          </div>
        ) : !acciones || acciones.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p>No hay acciones administrativas registradas</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Administrador</th>
                    <th>Responsable Afectado</th>
                    <th>Reporte</th>
                    <th>Archivos</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {acciones.map((accion) => (
                    <tr key={accion.actionId}>
                      <td>
                        <div style={{ whiteSpace: 'nowrap', fontSize: '0.8125rem' }}>
                          {formatDate(accion.createdAt)}
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${getActionTypeColor(accion.actionType)}`}>
                          {getActionTypeLabel(accion.actionType)}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>
                          {accion.adminNombre}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.875rem', color: 'var(--neutral-700)' }}>
                          {accion.responsableAfectado}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.875rem', color: 'var(--neutral-700)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {accion.reporteNombre}
                        </div>
                      </td>
                      <td>
                        {accion.filesCount > 0 && (
                          <span className="badge badge-neutral">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline-block', marginRight: '4px' }}>
                              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                              <polyline points="13 2 13 9 20 9" />
                            </svg>
                            {accion.filesCount}
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleVerDetalle(accion.actionId)}
                        >
                          Ver Detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                >
                  Anterior
                </button>
                <span className="pagination-info">
                  Página {currentPage + 1} de {totalPages}
                </span>
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages - 1}
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de Detalle */}
      {showModal && selectedActionId && (
        <ModalHistorialAcciones
          periodoId={selectedActionId}
          reporteNombre="Detalle de Acción"
          onClose={() => {
            setShowModal(false);
            setSelectedActionId(null);
          }}
        />
      )}
    </div>
  );
}
