import { useState, useEffect } from 'react';
import { ProtectedRoute } from '../common/ProtectedRoute';
import { TarjetaPeriodo } from '../flujo/TarjetaPeriodo';
import { ModalEnviarReporte } from '../modales/ModalEnviarReporte';
import { flujoReportesService, type ReportePeriodo } from '../../lib/services';
import { useToast, ToastContainer } from '../Toast';

type TabType = 'todos' | 'pendientes' | 'correcciones';

export default function MisReportesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('pendientes');
  const [periodos, setPeriodos] = useState<ReportePeriodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [modalEnviar, setModalEnviar] = useState<{
    isOpen: boolean;
    periodoId: string;
    reporteNombre: string;
    esCorreccion: boolean;
  }>({ isOpen: false, periodoId: '', reporteNombre: '', esCorreccion: false });
  const { toasts, removeToast, success, error } = useToast();

  useEffect(() => {
    loadPeriodos();
  }, [activeTab, page]);

  const loadPeriodos = async () => {
    try {
      setLoading(true);
      let response;
      
      switch (activeTab) {
        case 'todos':
          response = await flujoReportesService.misPeriodos(page, 10);
          break;
        case 'pendientes':
          response = await flujoReportesService.misPeriodosPendientes(page, 10);
          break;
        case 'correcciones':
          response = await flujoReportesService.misPeríodosCorrecciones(page, 10);
          break;
      }
      setPeriodos(response.content);
      setTotalPages(response.totalPages);
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al cargar periodos');
    } finally {
      setLoading(false);
    }
  };

  const handleAccion = async (accion: string, periodoId: string) => {
    const periodo = periodos.find(p => p.periodoId === periodoId);
    if (!periodo) return;

    if (accion === 'ver') {
      window.location.href = `/mis-reportes/${periodoId}`;
      return;
    }

    if (accion === 'enviar') {
      setModalEnviar({
        isOpen: true,
        periodoId,
        reporteNombre: periodo.reporteNombre,
        esCorreccion: false
      });
      return;
    }

    if (accion === 'corregir') {
      setModalEnviar({
        isOpen: true,
        periodoId,
        reporteNombre: periodo.reporteNombre,
        esCorreccion: true
      });
      return;
    }
  };

  const handleEnvioExitoso = () => {
    success('Reporte enviado exitosamente');
    loadPeriodos();
  };

  const tabs = [
    { id: 'todos' as TabType, label: 'Todos', count: 0 },
    { id: 'pendientes' as TabType, label: 'Pendientes', count: 0 },
    { id: 'correcciones' as TabType, label: 'Requieren Corrección', count: 0 },
  ];

  return (
    <ProtectedRoute allowedRoles={['responsable', 'supervisor', 'admin']}>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      <ModalEnviarReporte
        periodoId={modalEnviar.periodoId}
        reporteNombre={modalEnviar.reporteNombre}
        isOpen={modalEnviar.isOpen}
        esCorreccion={modalEnviar.esCorreccion}
        onClose={() => setModalEnviar({ ...modalEnviar, isOpen: false })}
        onSuccess={handleEnvioExitoso}
        onError={error}
      />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--neutral-900)', margin: '0' }}>
            Mis Reportes
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--neutral-500)', marginTop: '0.5rem' }}>
            Administra tus reportes asignados y su estado de envío
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          borderBottom: '2px solid var(--neutral-200)',
          marginBottom: '2rem'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPage(0);
              }}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--color-primary-600)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--color-primary-600)' : 'var(--neutral-600)',
                fontWeight: activeTab === tab.id ? '600' : '500',
                fontSize: '0.875rem',
                cursor: 'pointer',
                marginBottom: '-2px',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  background: activeTab === tab.id ? 'var(--color-primary-600)' : 'var(--neutral-400)',
                  color: 'white',
                  padding: '0.125rem 0.5rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '300px' 
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid var(--neutral-200)',
              borderTop: '4px solid var(--color-primary-600)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          </div>
        ) : periodos.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            backgroundColor: 'var(--neutral-50)',
            borderRadius: '0.75rem',
            border: '2px dashed var(--neutral-300)'
          }}>
            <svg 
              style={{ margin: '0 auto 1rem', color: 'var(--neutral-400)' }}
              width="64" 
              height="64" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--neutral-900)', marginBottom: '0.5rem' }}>
              {activeTab === 'todos' && 'No tienes reportes asignados'}
              {activeTab === 'pendientes' && 'No hay reportes pendientes'}
              {activeTab === 'correcciones' && 'No hay reportes que requieran corrección'}
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--neutral-500)' }}>
              {activeTab === 'todos' && 'Cuando se te asignen reportes, aparecerán aquí'}
              {activeTab === 'pendientes' && 'Todos tus reportes están al día'}
              {activeTab === 'correcciones' && 'Todos tus reportes han sido aprobados'}
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {periodos.map(periodo => (
                <TarjetaPeriodo
                  key={periodo.periodoId}
                  periodo={periodo}
                  onAccion={handleAccion}
                  mostrarResponsables={false}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '2rem'
              }}>
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: page === 0 ? 'var(--neutral-100)' : 'white',
                    border: '1px solid var(--neutral-300)',
                    borderRadius: '0.5rem',
                    cursor: page === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: page === 0 ? 'var(--neutral-400)' : 'var(--neutral-700)'
                  }}
                >
                  Anterior
                </button>
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 1rem',
                  fontSize: '0.875rem',
                  color: 'var(--neutral-600)'
                }}>
                  Página {page + 1} de {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: page >= totalPages - 1 ? 'var(--neutral-100)' : 'white',
                    border: '1px solid var(--neutral-300)',
                    borderRadius: '0.5rem',
                    cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: page >= totalPages - 1 ? 'var(--neutral-400)' : 'var(--neutral-700)'
                  }}
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
