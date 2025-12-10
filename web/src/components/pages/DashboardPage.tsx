import { useAuth } from '../../lib/contexts/AuthContext';
import { RoleInfo } from '../common/RoleInfo';
import { ProtectedRoute } from '../common/ProtectedRoute';

export default function DashboardPage() {
  const { user, activeRole } = useAuth();

  if (!user || !activeRole) return null;

  return (
    <ProtectedRoute>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: '700', 
            color: 'var(--neutral-900)', 
            margin: '0 0 0.5rem 0' 
          }}>
            Panel de Control
          </h1>
          <p style={{ 
            fontSize: '1rem', 
            color: 'var(--neutral-600)', 
            margin: 0 
          }}>
            Bienvenido, {user.usuario.nombreCompleto}
          </p>
        </div>

        {/* Role Info Card */}
        <RoleInfo />

        {/* Quick Actions Grid */}
        <div className="grid-auto-fit" style={{ marginBottom: '2rem' }}>
          {/* Responsable Actions */}
          {(activeRole === 'responsable' || activeRole === 'supervisor' || activeRole === 'admin') && (
            <>
              <QuickActionCard
                title="Mis Reportes"
                description="Ver y gestionar reportes asignados"
                icon="📋"
                href="/mis-reportes"
                color="blue"
              />
              <QuickActionCard
                title="Reportes Pendientes"
                description="Reportes que requieren atención"
                icon="⏰"
                href="/mis-reportes?tab=pendientes"
                color="orange"
                badge="3"
              />
            </>
          )}

          {/* Supervisor Actions */}
          {(activeRole === 'supervisor' || activeRole === 'admin') && (
            <>
              <QuickActionCard
                title="Validar Reportes"
                description="Aprobar o rechazar reportes enviados"
                icon="✓"
                href="/validacion/pendientes"
                color="green"
                badge="5"
              />
              <QuickActionCard
                title="Mi Equipo"
                description="Supervisar responsables asignados"
                icon="👥"
                href="/supervision/equipo"
                color="purple"
              />
            </>
          )}

          {/* Admin Actions */}
          {activeRole === 'admin' && (
            <>
              <QuickActionCard
                title="Gestión de Usuarios"
                description="Administrar usuarios y roles"
                icon="👤"
                href="/usuarios"
                color="red"
              />
              <QuickActionCard
                title="Configuración"
                description="Configurar sistema y permisos"
                icon="⚙️"
                href="/configuracion"
                color="gray"
              />
            </>
          )}

          {/* Auditor Actions */}
          {activeRole === 'auditor' && (
            <>
              <QuickActionCard
                title="Auditoría"
                description="Revisar cumplimiento normativo"
                icon="🔍"
                href="/auditoria"
                color="yellow"
              />
              <QuickActionCard
                title="Bitácora"
                description="Ver historial de cambios"
                icon="📖"
                href="/bitacora"
                color="blue"
              />
            </>
          )}
        </div>

        {/* Statistics Section - Placeholder */}
        <div style={{
          backgroundColor: 'white',
          border: '1px solid var(--neutral-200)',
          borderRadius: '0.75rem',
          padding: '1.5rem'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: 'var(--neutral-900)',
            marginBottom: '1rem'
          }}>
            Estadísticas
          </h2>
          <div className="grid-auto-fit-sm">
            <StatCard label="Total Reportes" value="24" trend="+12%" />
            <StatCard label="Pendientes" value="8" trend="-5%" />
            <StatCard label="Aprobados" value="14" trend="+8%" />
            <StatCard label="Vencidos" value="2" trend="-50%" isNegative />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'yellow' | 'gray';
  badge?: string;
}

function QuickActionCard({ title, description, icon, href, color, badge }: QuickActionCardProps) {
  const colors = {
    blue: { bg: 'var(--color-primary-50)', border: 'var(--color-primary-500)', text: 'var(--color-primary-700)' },
    green: { bg: 'var(--success-green-50)', border: 'var(--success-green-500)', text: 'var(--success-green-700)' },
    orange: { bg: 'var(--warning-yellow-50)', border: 'var(--warning-yellow-500)', text: 'var(--warning-yellow-800)' },
    red: { bg: 'var(--error-red-50)', border: 'var(--error-red-500)', text: 'var(--error-red-700)' },
    purple: { bg: '#f3e8ff', border: '#a855f7', text: '#7c3aed' },
    yellow: { bg: 'var(--warning-yellow-50)', border: 'var(--warning-yellow-300)', text: 'var(--warning-yellow-700)' },
    gray: { bg: 'var(--neutral-50)', border: 'var(--neutral-300)', text: 'var(--neutral-700)' }
  };

  const colorScheme = colors[color];

  return (
    <a
      href={href}
      style={{
        display: 'block',
        padding: '1.5rem',
        backgroundColor: 'white',
        border: `2px solid ${colorScheme.border}`,
        borderRadius: '0.75rem',
        textDecoration: 'none',
        transition: 'all 0.15s ease',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {badge && (
        <div style={{
          position: 'absolute',
          top: '-0.5rem',
          right: '-0.5rem',
          backgroundColor: 'var(--error-red-600)',
          color: 'white',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          fontWeight: '700',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
        }}>
          {badge}
        </div>
      )}
      <div style={{
        fontSize: '2rem',
        marginBottom: '0.75rem'
      }}>
        {icon}
      </div>
      <h3 style={{
        fontSize: '1.125rem',
        fontWeight: '600',
        color: 'var(--neutral-900)',
        marginBottom: '0.5rem'
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: '0.875rem',
        color: 'var(--neutral-600)',
        lineHeight: '1.5',
        margin: 0
      }}>
        {description}
      </p>
    </a>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  trend: string;
  isNegative?: boolean;
}

function StatCard({ label, value, trend, isNegative }: StatCardProps) {
  return (
    <div style={{
      padding: '1rem',
      backgroundColor: 'var(--neutral-50)',
      borderRadius: '0.5rem',
      border: '1px solid var(--neutral-200)'
    }}>
      <div style={{
        fontSize: '0.75rem',
        fontWeight: '500',
        color: 'var(--neutral-600)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '0.5rem'
      }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
        <span style={{
          fontSize: '1.875rem',
          fontWeight: '700',
          color: 'var(--neutral-900)'
        }}>
          {value}
        </span>
        <span style={{
          fontSize: '0.875rem',
          fontWeight: '600',
          color: isNegative ? 'var(--error-red-600)' : 'var(--success-green-600)'
        }}>
          {trend}
        </span>
      </div>
    </div>
  );
}
