import React from 'react';
import type { UsuarioResponse } from '../../lib/services';

interface ResponsableFormData {
  usuarioId: string;
  tipoResponsabilidad: 'elaboracion' | 'supervision' | 'revision';
  esPrincipal: boolean;
  fechaInicio?: string;
  fechaFin?: string;
  observaciones?: string;
  nombre?: string;
}

interface Props {
  responsables: ResponsableFormData[];
  usuarios: UsuarioResponse[];
  onRemove: (usuarioId: string) => void;
  onTogglePrincipal: (usuarioId: string, tipo: 'elaboracion' | 'supervision' | 'revision') => void;
}

export default function ResponsablesList({ responsables, usuarios, onRemove, onTogglePrincipal }: Props) {
  if (responsables.length === 0) return null;

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)', marginBottom: '0.75rem' }}>
        Responsables asignados ({responsables.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {responsables.map((resp) => {
          const usuario = usuarios.find(u => u.usuarioId === resp.usuarioId);
          return usuario ? (
            <div
              key={resp.usuarioId}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto auto',
                gap: '0.75rem',
                alignItems: 'center',
                padding: '0.875rem',
                backgroundColor: 'var(--color-gray-50)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
              }}
            >
              <div>
                <div style={{ fontWeight: 500, color: 'var(--color-text)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  {usuario.firstName} {usuario.firstLastname}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                  {resp.tipoResponsabilidad === 'elaboracion' ? '📝 Elaboración' : '👁️ Supervisión'}
                  {usuario.cargo && ` • ${usuario.cargo}`}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onTogglePrincipal(resp.usuarioId, resp.tipoResponsabilidad)}
                style={{
                  padding: '0.5rem',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  color: resp.esPrincipal ? 'var(--color-warning-500)' : 'var(--color-gray-400)',
                  transition: 'color 0.2s',
                }}
                title={resp.esPrincipal ? 'Responsable principal' : 'Marcar como principal'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={resp.esPrincipal ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </button>

              <div style={{
                padding: '0.25rem 0.625rem',
                fontSize: '0.6875rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                borderRadius: '12px',
                backgroundColor: resp.esPrincipal ? 'var(--color-warning-100)' : 'var(--color-gray-200)',
                color: resp.esPrincipal ? 'var(--color-warning-700)' : 'var(--color-gray-600)',
              }}>
                {resp.esPrincipal ? 'Principal' : 'Auxiliar'}
              </div>

              <button
                type="button"
                onClick={() => onRemove(resp.usuarioId)}
                style={{
                  padding: '0.5rem',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--color-danger-500)',
                  transition: 'color 0.2s',
                }}
                title="Quitar responsable"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          ) : null;
        })}
      </div>
      
      <div style={{ 
        marginTop: '0.75rem',
        padding: '0.75rem',
        backgroundColor: 'var(--color-info-50)',
        border: '1px solid var(--color-info-200)',
        borderRadius: '6px',
        fontSize: '0.75rem',
        color: 'var(--color-info-800)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
        <span>La estrella indica el responsable <strong>principal</strong> de cada tipo (elaboración/supervisión)</span>
      </div>
    </div>
  );
}
