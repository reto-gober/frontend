interface Props {
  adminName?: string;
  motivo?: string;
  fecha?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function BadgeAdminAction({ adminName, motivo, fecha, size = 'md' }: Props) {
  const sizeClasses = {
    sm: 'badge-sm',
    md: 'badge-md',
    lg: 'badge-lg'
  };

  const tooltipContent = `
    ${adminName ? `Administrador: ${adminName}\n` : ''}
    ${motivo ? `Motivo: ${motivo}\n` : ''}
    ${fecha ? `Fecha: ${fecha}` : ''}
  `.trim();

  return (
    <span 
      className={`badge-admin ${sizeClasses[size]}`}
      title={tooltipContent}
      data-tooltip={tooltipContent}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
      <span>Completado por Admin</span>
    </span>
  );
}

export default BadgeAdminAction;
