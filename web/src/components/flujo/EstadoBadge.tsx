interface EstadoBadgeProps {
  estado: string;
  estadoDescripcion?: string;
}

export function EstadoBadge({ estado, estadoDescripcion }: EstadoBadgeProps) {
  const getEstadoConfig = () => {
    switch (estado) {
      case 'pendiente':
        return {
          color: '#6b7280',
          bg: '#f3f4f6',
          icon: '⏳',
          label: estadoDescripcion || 'Pendiente'
        };
      case 'en_elaboracion':
        return {
          color: '#2563eb',
          bg: '#dbeafe',
          icon: '📝',
          label: estadoDescripcion || 'En Elaboración'
        };
      case 'enviado_a_tiempo':
        return {
          color: '#059669',
          bg: '#d1fae5',
          icon: '✅',
          label: estadoDescripcion || 'Enviado a Tiempo'
        };
      case 'enviado_tarde':
        return {
          color: '#d97706',
          bg: '#fef3c7',
          icon: '⚠️',
          label: estadoDescripcion || 'Enviado Tarde'
        };
      case 'en_revision':
        return {
          color: '#2563eb',
          bg: '#dbeafe',
          icon: '🔍',
          label: estadoDescripcion || 'En Revisión'
        };
      case 'requiere_correccion':
        return {
          color: '#ea580c',
          bg: '#ffedd5',
          icon: '🔄',
          label: estadoDescripcion || 'Requiere Corrección'
        };
      case 'aprobado':
        return {
          color: '#059669',
          bg: '#d1fae5',
          icon: '✓',
          label: estadoDescripcion || 'Aprobado'
        };
      case 'rechazado':
        return {
          color: '#dc2626',
          bg: '#fee2e2',
          icon: '✗',
          label: estadoDescripcion || 'Rechazado'
        };
      case 'vencido':
        return {
          color: '#991b1b',
          bg: '#fecaca',
          icon: '❌',
          label: estadoDescripcion || 'Vencido'
        };
      default:
        return {
          color: '#6b7280',
          bg: '#f3f4f6',
          icon: '•',
          label: estadoDescripcion || estado
        };
    }
  };

  const config = getEstadoConfig();

  return (
    <span 
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.375rem 0.75rem',
        borderRadius: '6px',
        fontSize: '0.8125rem',
        fontWeight: 600,
        backgroundColor: config.bg,
        color: config.color,
        whiteSpace: 'nowrap'
      }}
    >
      <span style={{ fontSize: '0.875rem' }}>{config.icon}</span>
      {config.label}
    </span>
  );
}
