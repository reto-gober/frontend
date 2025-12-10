import React from 'react';

interface Props {
  frequencyMode: 'preset' | 'custom';
  frequencyPreset: number;
  customFrequency: number;
  onFrequencyModeChange: (mode: 'preset' | 'custom') => void;
  onFrequencyPresetChange: (value: number) => void;
  onCustomFrequencyChange: (value: number) => void;
}

export default function PeriodConfig({
  frequencyMode,
  frequencyPreset,
  customFrequency,
  onFrequencyModeChange,
  onFrequencyPresetChange,
  onCustomFrequencyChange,
}: Props) {
  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '0.875rem', borderBottom: '2px solid var(--color-primary-100)' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-primary-600)' }}>
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 600, color: 'var(--color-primary-900)' }}>
          Frecuencia de Generación
        </h3>
      </div>
      
      <div style={{ 
        backgroundColor: 'var(--color-info-50)', 
        border: '1px solid var(--color-info-200)',
        borderRadius: '6px',
        padding: '0.875rem',
        marginBottom: '1.5rem',
        display: 'flex',
        gap: '0.75rem'
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-info-600)', flexShrink: 0, marginTop: '2px' }}>
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <div style={{ fontSize: '0.8125rem', color: 'var(--color-info-900)' }}>
          Estos valores determinan cuántos periodos se generarán automáticamente y con qué frecuencia.
        </div>
      </div>

      {/* Frecuencia de generación */}
      <div>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)', marginBottom: '0.75rem' }}>
          Cada cuánto generar periodos <span style={{ color: 'var(--color-danger)' }}>*</span>
        </label>
        
        <div className="grid-5cols">
          {[
            { label: 'Mensual', value: 1 },
            { label: 'Bimensual', value: 2 },
            { label: 'Trimestral', value: 3 },
            { label: 'Semestral', value: 6 },
            { label: 'Personalizado', value: 'custom' as const },
          ].map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => {
                if (option.value === 'custom') {
                  onFrequencyModeChange('custom');
                } else {
                  onFrequencyModeChange('preset');
                  onFrequencyPresetChange(option.value as number);
                }
              }}
              style={{
                padding: '0.75rem',
                border: '2px solid',
                borderColor: (frequencyMode === 'preset' && frequencyPreset === option.value) || (frequencyMode === 'custom' && option.value === 'custom')
                  ? 'var(--color-success-500)'
                  : 'var(--color-border)',
                backgroundColor: (frequencyMode === 'preset' && frequencyPreset === option.value) || (frequencyMode === 'custom' && option.value === 'custom')
                  ? 'var(--color-success-50)'
                  : 'white',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: (frequencyMode === 'preset' && frequencyPreset === option.value) || (frequencyMode === 'custom' && option.value === 'custom') ? 600 : 500,
                color: (frequencyMode === 'preset' && frequencyPreset === option.value) || (frequencyMode === 'custom' && option.value === 'custom')
                  ? 'var(--color-success-700)'
                  : 'var(--color-text)',
                transition: 'all 0.2s',
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
        
        {frequencyMode === 'custom' && (
          <div style={{ padding: '1rem', backgroundColor: 'var(--color-gray-50)', borderRadius: '6px' }}>
            <label htmlFor="customFrequency" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
              Cada cuántos meses
            </label>
            <input
              type="number"
              id="customFrequency"
              className="form-input"
              value={customFrequency}
              onChange={(e) => onCustomFrequencyChange(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              placeholder="1"
            />
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-light)', marginTop: '0.5rem' }}>
              Generará un periodo cada <strong>{customFrequency}</strong> {customFrequency === 1 ? 'mes' : 'meses'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
