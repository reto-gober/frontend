import React from 'react';
import type { UsuarioResponse } from '../../lib/services';

interface ResponsableFormData {
  usuarioId: string;
  tipoResponsabilidad: 'elaboracion' | 'supervision' | 'revision';
  esPrincipal: boolean;
}

interface Props {
  usuarios: UsuarioResponse[];
  responsables: ResponsableFormData[];
  onAdd: (usuarioId: string, tipo: 'elaboracion' | 'supervision' | 'revision', esPrincipal: boolean) => void;
}

export default function ResponsableSelector({ usuarios, responsables, onAdd }: Props) {
  const [selectedTipo, setSelectedTipo] = React.useState<'elaboracion' | 'supervision'>('elaboracion');

  const getFilteredUsuarios = () => {
    // Filtrar usuarios ya asignados
    const asignados = responsables.map(r => r.usuarioId);
    
    // Filtrar por rol según el tipo seleccionado
    return usuarios.filter(u => {
      if (asignados.includes(u.usuarioId)) return false;
      
      if (selectedTipo === 'elaboracion') {
        return u.roles?.some((r: string) => r.toUpperCase() === 'RESPONSABLE');
      } else {
        return u.roles?.some((r: string) => 
          r.toUpperCase() === 'SUPERVISOR' || r.toUpperCase() === 'ADMIN'
        );
      }
    });
  };

  const handleAgregar = () => {
    const usuarioSelect = document.getElementById('nuevoUsuario') as HTMLSelectElement;
    const usuarioId = usuarioSelect?.value;
    
    if (usuarioId && !responsables.find(r => r.usuarioId === usuarioId)) {
      onAdd(usuarioId, selectedTipo, false);
      usuarioSelect.value = '';
    }
  };

  const usuariosFiltrados = getFilteredUsuarios();

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '0.75rem', alignItems: 'end' }}>
        <div>
          <label htmlFor="nuevoUsuario" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
            Usuario
          </label>
          <select
            id="nuevoUsuario"
            className="form-select"
            defaultValue=""
          >
            <option value="">Seleccionar usuario...</option>
            {usuariosFiltrados.map(usuario => (
              <option key={usuario.usuarioId} value={usuario.usuarioId}>
                {usuario.firstName} {usuario.firstLastname} {usuario.cargo ? `- ${usuario.cargo}` : ''}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="nuevoTipo" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
            Tipo
          </label>
          <select 
            id="nuevoTipo" 
            className="form-select" 
            value={selectedTipo}
            onChange={(e) => setSelectedTipo(e.target.value as 'elaboracion' | 'supervision')}
          >
            <option value="elaboracion">Elaboración</option>
            <option value="supervision">Supervisión</option>
          </select>
        </div>
        
        <button
          type="button"
          className="btn btn-primary"
          style={{ marginBottom: '0', height: '42px' }}
          onClick={handleAgregar}
        >
          Agregar
        </button>
      </div>
      
      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-light)', marginTop: '0.5rem', paddingLeft: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
        {selectedTipo === 'elaboracion' ? (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>Solo usuarios con rol Responsable</span>
          </>
        ) : (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <span>Solo usuarios con rol Supervisor o Admin</span>
          </>
        )}
      </div>
    </div>
  );
}
