interface DiasHastaVencimientoProps {
  fechaVencimiento: string;
  estado: string;
}

export function DiasHastaVencimiento({ fechaVencimiento, estado }: DiasHastaVencimientoProps) {
  const calcularDias = () => {
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento + 'T00:00:00');
    const diffTime = vencimiento.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const dias = calcularDias();

  // No mostrar si ya está enviado, aprobado o rechazado
  if (['enviado_a_tiempo', 'enviado_tarde', 'en_revision', 'aprobado', 'rechazado'].includes(estado)) {
    return null;
  }

  const getConfig = () => {
    if (dias < 0) {
      return {
        color: '#dc2626',
        bg: '#fee2e2',
        icon: '❌',
        text: `Vencido hace ${Math.abs(dias)} día${Math.abs(dias) !== 1 ? 's' : ''}`
      };
    } else if (dias === 0) {
      return {
        color: '#ea580c',
        bg: '#ffedd5',
        icon: '⚠️',
        text: 'Vence hoy'
      };
    } else if (dias <= 3) {
      return {
        color: '#d97706',
        bg: '#fef3c7',
        icon: '⏰',
        text: `Vence en ${dias} día${dias !== 1 ? 's' : ''}`
      };
    } else if (dias <= 7) {
      return {
        color: '#2563eb',
        bg: '#dbeafe',
        icon: '📅',
        text: `${dias} días restantes`
      };
    } else {
      return {
        color: '#059669',
        bg: '#d1fae5',
        icon: '✓',
        text: `${dias} días restantes`
      };
    }
  };

  const config = getConfig();

  return (
    <div 
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.375rem 0.75rem',
        borderRadius: '6px',
        fontSize: '0.8125rem',
        fontWeight: 500,
        backgroundColor: config.bg,
        color: config.color
      }}
    >
      <span>{config.icon}</span>
      <span>{config.text}</span>
    </div>
  );
}
