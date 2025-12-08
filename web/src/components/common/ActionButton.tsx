import { useAuth } from '../../lib/contexts/AuthContext';
import type { PermisosConfig } from '../../lib/types/auth';
import type { ReactNode, ButtonHTMLAttributes } from 'react';

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  permiso: keyof PermisosConfig;
  children: ReactNode;
  hideIfNoPermission?: boolean;
}

export function ActionButton({ 
  permiso, 
  children, 
  hideIfNoPermission = true,
  disabled,
  ...props 
}: ActionButtonProps) {
  const { hasPermission } = useAuth();
  
  const hasAccess = hasPermission(permiso);

  if (!hasAccess && hideIfNoPermission) {
    return null;
  }

  return (
    <button 
      {...props}
      disabled={disabled || !hasAccess}
      style={{
        ...props.style,
        opacity: !hasAccess ? 0.5 : 1,
        cursor: !hasAccess ? 'not-allowed' : props.style?.cursor || 'pointer'
      }}
      title={!hasAccess ? 'No tienes permiso para esta acción' : props.title}
    >
      {children}
    </button>
  );
}
