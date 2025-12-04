import { useAuth } from '../../lib/contexts/AuthContext';
import { ChevronDown, UserCheck } from 'lucide-react';
import { useState } from 'react';

export function RoleSwitcher() {
  const { activeRole, availableRoles, switchRole, canSwitchTo } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Si solo tiene un rol, no mostrar el selector
  if (availableRoles.length <= 1) {
    return null;
  }

  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    supervisor: 'Supervisor',
    responsable: 'Responsable',
    auditor: 'Auditor'
  };

  const roleColors: Record<string, { bg: string; border: string; text: string }> = {
    admin: { 
      bg: 'var(--error-red-50)', 
      border: 'var(--error-red-500)', 
      text: 'var(--error-red-700)' 
    },
    supervisor: { 
      bg: 'var(--color-primary-50)', 
      border: 'var(--color-primary-500)', 
      text: 'var(--color-primary-700)' 
    },
    responsable: { 
      bg: 'var(--success-green-50)', 
      border: 'var(--success-green-500)', 
      text: 'var(--success-green-700)' 
    },
    auditor: { 
      bg: 'var(--warning-yellow-50)', 
      border: 'var(--warning-yellow-500)', 
      text: 'var(--warning-yellow-800)' 
    }
  };

  const activeRoleColor = roleColors[activeRole || 'responsable'];

  return (
    <div style={{ position: 'relative', marginBottom: '1rem' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '0.75rem',
          backgroundColor: activeRoleColor.bg,
          border: `2px solid ${activeRoleColor.border}`,
          borderRadius: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          gap: '0.5rem'
        }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          flex: 1,
          minWidth: 0
        }}>
          <UserCheck size={16} style={{ color: activeRoleColor.text, flexShrink: 0 }} />
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'flex-start',
            minWidth: 0,
            flex: 1
          }}>
            <span style={{ 
              fontSize: '0.625rem', 
              color: activeRoleColor.text,
              opacity: 0.8,
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Actuando como
            </span>
            <span style={{ 
              fontSize: '0.875rem', 
              fontWeight: '600',
              color: activeRoleColor.text,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              width: '100%'
            }}>
              {roleLabels[activeRole || '']}
            </span>
          </div>
        </div>
        <ChevronDown 
          size={16} 
          style={{ 
            color: activeRoleColor.text,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s ease',
            flexShrink: 0
          }} 
        />
      </button>

      {isOpen && (
        <>
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
          />
          
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 0.5rem)',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '1px solid var(--neutral-200)',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            overflow: 'hidden'
          }}>
            <div style={{ padding: '0.5rem' }}>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                color: 'var(--neutral-500)',
                padding: '0.5rem 0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Cambiar vista a
              </div>
              
              {availableRoles.map((role: string) => {
                const isActive = role === activeRole;
                const color = roleColors[role];
                const canSwitch = canSwitchTo(role);
                
                return (
                  <button
                    key={role}
                    onClick={() => {
                      if (canSwitch && !isActive) {
                        switchRole(role);
                      }
                      setIsOpen(false);
                    }}
                    disabled={isActive || !canSwitch}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: isActive ? color.bg : 'white',
                      border: isActive ? `1px solid ${color.border}` : '1px solid transparent',
                      borderRadius: '0.375rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      cursor: isActive || !canSwitch ? 'default' : 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left',
                      opacity: !canSwitch ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive && canSwitch) {
                        e.currentTarget.style.backgroundColor = 'var(--neutral-50)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'white';
                      }
                    }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '0.375rem',
                      backgroundColor: color.bg,
                      border: `2px solid ${color.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <UserCheck size={16} style={{ color: color.text }} />
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: '600',
                        color: 'var(--neutral-900)',
                        marginBottom: '0.125rem'
                      }}>
                        {roleLabels[role]}
                      </div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--neutral-500)'
                      }}>
                        {role === 'admin' && 'Vista completa del sistema'}
                        {role === 'supervisor' && 'Validar y supervisar reportes'}
                        {role === 'responsable' && 'Gestionar mis reportes'}
                        {role === 'auditor' && 'Auditoría y cumplimiento'}
                      </div>
                    </div>
                    
                    {isActive && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: color.border,
                        flexShrink: 0
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
            
            <div style={{
              padding: '0.75rem',
              backgroundColor: 'var(--color-primary-50)',
              borderTop: '1px solid var(--color-primary-200)',
              fontSize: '0.75rem',
              color: 'var(--color-primary-700)',
              display: 'flex',
              alignItems: 'start',
              gap: '0.5rem'
            }}>
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                style={{ flexShrink: 0, marginTop: '0.125rem' }}
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              <span style={{ lineHeight: '1.4' }}>
                Al cambiar de rol, la página se recargará para aplicar los permisos y vistas correspondientes.
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
