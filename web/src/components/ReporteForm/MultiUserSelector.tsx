import React, { useState, useRef, useEffect } from 'react';
import type { UsuarioResponse } from '../../lib/services';

interface Props {
  usuarios: UsuarioResponse[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  roleFilter: 'RESPONSABLE' | 'SUPERVISOR';
  label: string;
  placeholder?: string;
}

export default function MultiUserSelector({ 
  usuarios, 
  selectedIds, 
  onSelectionChange, 
  roleFilter,
  label,
  placeholder = 'Buscar usuario...'
}: Props) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filtrar usuarios por rol y búsqueda
  const filteredUsuarios = usuarios.filter(u => {
    // Filtrar por rol
    const hasRole = roleFilter === 'RESPONSABLE'
      ? u.roles?.some((r: string) => r.toUpperCase() === 'RESPONSABLE')
      : u.roles?.some((r: string) => r.toUpperCase() === 'SUPERVISOR' || r.toUpperCase() === 'ADMIN');
    
    if (!hasRole) return false;

    // Filtrar por búsqueda
    if (!search) return true;
    const searchLower = search.toLowerCase();
    const fullName = `${u.firstName} ${u.firstLastname}`.toLowerCase();
    const cargo = u.cargo?.toLowerCase() || '';
    return fullName.includes(searchLower) || cargo.includes(searchLower);
  });

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleUser = (usuarioId: string) => {
    if (selectedIds.includes(usuarioId)) {
      onSelectionChange(selectedIds.filter(id => id !== usuarioId));
    } else {
      onSelectionChange([...selectedIds, usuarioId]);
    }
  };

  const removeUser = (usuarioId: string) => {
    onSelectionChange(selectedIds.filter(id => id !== usuarioId));
  };

  const selectedUsuarios = usuarios.filter(u => selectedIds.includes(u.usuarioId));

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
        {label}
      </label>

      {/* Chips de usuarios seleccionados */}
      {selectedUsuarios.length > 0 && (
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '0.5rem', 
          marginBottom: '0.5rem',
          padding: '0.5rem',
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '6px'
        }}>
          {selectedUsuarios.map(usuario => (
            <div
              key={usuario.usuarioId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.375rem 0.75rem',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                borderRadius: '20px',
                fontSize: '0.875rem',
                fontWeight: 500
              }}
            >
              <span>{usuario.firstName} {usuario.firstLastname}</span>
              <button
                type="button"
                onClick={() => removeUser(usuario.usuarioId)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '1.2rem',
                  lineHeight: 1
                }}
                aria-label="Eliminar"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input de búsqueda */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          className="form-input"
          placeholder={placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
          style={{
            width: '100%',
            padding: '0.625rem 2.5rem 0.625rem 0.75rem',
            fontSize: '0.9375rem',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            backgroundColor: 'var(--color-bg)',
            color: 'var(--color-text)'
          }}
        />
        <div style={{
          position: 'absolute',
          right: '0.75rem',
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          color: 'var(--color-text-light)'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </div>
      </div>

      {/* Dropdown de resultados */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '0.25rem',
          backgroundColor: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
          maxHeight: '250px',
          overflowY: 'auto',
          zIndex: 1000,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}>
          {filteredUsuarios.length === 0 ? (
            <div style={{ 
              padding: '0.75rem 1rem', 
              color: 'var(--color-text-light)', 
              fontSize: '0.875rem',
              textAlign: 'center'
            }}>
              No se encontraron usuarios
            </div>
          ) : (
            filteredUsuarios.map(usuario => {
              const isSelected = selectedIds.includes(usuario.usuarioId);
              return (
                <div
                  key={usuario.usuarioId}
                  onClick={() => toggleUser(usuario.usuarioId)}
                  style={{
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'var(--color-primary-light)' : 'transparent',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {/* Checkbox */}
                  <div style={{
                    width: '18px',
                    height: '18px',
                    border: '2px solid var(--color-border)',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isSelected ? 'var(--color-primary)' : 'transparent',
                    borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                    flexShrink: 0
                  }}>
                    {isSelected && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>

                  {/* Información del usuario */}
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '0.9375rem', 
                      fontWeight: 500, 
                      color: 'var(--color-text)' 
                    }}>
                      {usuario.firstName} {usuario.firstLastname}
                    </div>
                    <div style={{ 
                      fontSize: '0.8125rem', 
                      color: 'var(--color-text-light)',
                      marginTop: '0.125rem'
                    }}>
                      {usuario.roles && usuario.roles.length > 0 ? (
                        <span style={{ 
                          textTransform: 'capitalize',
                          fontWeight: 500
                        }}>
                          {usuario.roles.join(', ')}
                        </span>
                      ) : (
                        <span style={{ fontStyle: 'italic' }}>Sin rol asignado</span>
                      )}
                      {usuario.cargo && (
                        <span> • {usuario.cargo}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Contador */}
      <div style={{ 
        fontSize: '0.75rem', 
        color: 'var(--color-text-light)', 
        marginTop: '0.375rem',
        paddingLeft: '0.25rem'
      }}>
        {selectedIds.length} {selectedIds.length === 1 ? 'usuario seleccionado' : 'usuarios seleccionados'}
      </div>
    </div>
  );
}
