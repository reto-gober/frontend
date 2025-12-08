import { useAuth } from '../../lib/contexts/AuthContext';
import { Shield, CheckCircle, XCircle, Info } from 'lucide-react';

export function RoleInfo() {
  const { user, activeRole } = useAuth();

  if (!user || !activeRole) return null;

  const roleDescriptions: Record<string, { title: string; description: string; capabilities: string[] }> = {
    admin: {
      title: 'Administrador',
      description: 'Control total del sistema con acceso a todas las funcionalidades',
      capabilities: [
        'Gestionar usuarios y asignar roles',
        'Configurar entidades y estructura organizacional',
        'Crear y modificar tipos de reportes',
        'Supervisar y operar tareas de responsables desde la misma vista',
        'Ver estadísticas globales del sistema',
        'Gestionar permisos y configuraciones',
        'Auditoría completa del sistema'
      ]
    },
    supervisor: {
      title: 'Supervisor',
      description: 'Validación y supervisión de reportes de su equipo',
      capabilities: [
        'Validar reportes enviados por responsables',
        'Aprobar o rechazar reportes',
        'Solicitar correcciones con comentarios',
        'Ver reportes de su equipo',
        'Gestionar tareas de Responsable sin cambiar de vista',
        'Ver estadísticas de supervisión',
        'Gestionar responsables asignados'
      ]
    },
    responsable: {
      title: 'Responsable',
      description: 'Elaboración y envío de reportes asignados',
      capabilities: [
        'Ver reportes asignados',
        'Elaborar y enviar reportes',
        'Subir evidencias y archivos adjuntos',
        'Corregir reportes rechazados',
        'Ver historial de envíos',
        'Recibir notificaciones de vencimientos',
        'Ver estadísticas personales'
      ]
    },
    auditor: {
      title: 'Auditor',
      description: 'Auditoría y cumplimiento normativo (solo lectura)',
      capabilities: [
        'Ver todos los reportes (solo lectura)',
        'Acceder a bitácora de cambios',
        'Generar reportes de cumplimiento',
        'Ver métricas de auditoría',
        'Exportar datos para análisis',
        'Seguimiento de plazos y vencimientos'
      ]
    }
  };

  const currentRoleInfo = roleDescriptions[activeRole];

  return (
    <div style={{
      backgroundColor: 'var(--color-primary-50)',
      border: '1px solid var(--color-primary-200)',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      marginBottom: '2rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'start', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{
          width: '48px',
          height: '48px',
          backgroundColor: 'var(--color-primary-600)',
          borderRadius: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Shield size={24} style={{ color: 'white' }} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{
            margin: 0,
            fontSize: '1.25rem',
            fontWeight: '700',
            color: 'var(--neutral-900)',
            marginBottom: '0.25rem'
          }}>
            {currentRoleInfo.title}
          </h3>
          <p style={{
            margin: 0,
            fontSize: '0.875rem',
            color: 'var(--neutral-600)',
            lineHeight: '1.5'
          }}>
            {currentRoleInfo.description}
          </p>
        </div>
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        padding: '1rem',
        marginTop: '1rem'
      }}>
        <h4 style={{
          margin: '0 0 0.75rem 0',
          fontSize: '0.875rem',
          fontWeight: '600',
          color: 'var(--neutral-700)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Capacidades en esta vista
        </h4>
        <ul style={{
          margin: 0,
          padding: 0,
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          {currentRoleInfo.capabilities.map((capability, index) => (
            <li key={index} style={{
              display: 'flex',
              alignItems: 'start',
              gap: '0.5rem'
            }}>
              <CheckCircle 
                size={16} 
                style={{ 
                  color: 'var(--success-green-600)', 
                  marginTop: '0.125rem',
                  flexShrink: 0 
                }} 
              />
              <span style={{
                fontSize: '0.875rem',
                color: 'var(--neutral-700)',
                lineHeight: '1.5'
              }}>
                {capability}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {(activeRole === 'admin' || activeRole === 'supervisor') && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          backgroundColor: 'var(--color-primary-100)',
          borderRadius: '0.5rem',
          display: 'flex',
          alignItems: 'start',
          gap: '0.5rem'
        }}>
          <Info size={16} style={{ color: 'var(--color-primary-700)', marginTop: '0.125rem', flexShrink: 0 }} />
          <span style={{
            fontSize: '0.75rem',
            color: 'var(--color-primary-700)',
            lineHeight: '1.4'
          }}>
            Esta vista ya integra las capacidades de tus roles dependientes, sin necesidad de cambiar de pantalla.
          </span>
        </div>
      )}
    </div>
  );
}
