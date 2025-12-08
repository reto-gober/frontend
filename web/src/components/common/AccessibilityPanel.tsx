import { useEffect, useMemo, useRef, useState } from 'react';
import type { AccessibilitySettings } from '../../lib/accessibility';
import {
  ACCESSIBILITY_STORAGE_KEY,
  applyAccessibilitySettings,
  defaultAccessibilitySettings,
  loadAccessibilitySettings,
  saveAccessibilitySettings,
  resetAccessibilitySettings,
} from '../../lib/accessibility';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function AccessibilityPanel() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>(() => loadAccessibilitySettings());
  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    applyAccessibilitySettings(settings);
    saveAccessibilitySettings(settings);
  }, [settings]);

  useEffect(() => {
    const stored = loadAccessibilitySettings();
    setSettings(stored);
    applyAccessibilitySettings(stored);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!open) return;
      const target = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(target) && !triggerRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const fontScalePercent = useMemo(() => Math.round(settings.fontScale * 100), [settings.fontScale]);

  const updateSetting = (partial: Partial<AccessibilitySettings>) => {
    if (partial.fontScale !== undefined && typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--font-scale', partial.fontScale.toString());
    }
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  const handleReset = () => {
    const defaults = resetAccessibilitySettings();
    setSettings(defaults);
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={triggerRef}
        className="a11y-panel-trigger"
        aria-expanded={open}
        aria-controls="a11y-panel"
        aria-label="Abrir panel de accesibilidad"
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="false" role="img" aria-label="Accesibilidad">♿</span>
        Accesibilidad
      </button>

      {open && (
        <div
          ref={panelRef}
          id="a11y-panel"
          className="a11y-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Panel de accesibilidad"
        >
          <header>
            <h3>Opciones de accesibilidad</h3>
            <button
              className="small-btn"
              onClick={() => setOpen(false)}
              aria-label="Cerrar panel de accesibilidad"
            >
              Cerrar
            </button>
          </header>

          <div className="a11y-options">
            <div className="a11y-group" aria-labelledby="a11y-group-colores">
              <h4 id="a11y-group-colores">Colores</h4>
              <div className="option-row">
                <label htmlFor="high-contrast">Modo alto contraste</label>
                <input
                  id="high-contrast"
                  type="checkbox"
                  className="toggle-input"
                  checked={settings.highContrast}
                  onChange={(e) => updateSetting({ highContrast: e.target.checked })}
                  aria-label="Activar modo alto contraste"
                />
              </div>
              <div className="option-row">
                <label htmlFor="grayscale">Modo escala de grises</label>
                <input
                  id="grayscale"
                  type="checkbox"
                  className="toggle-input"
                  checked={settings.grayscale}
                  onChange={(e) => updateSetting({ grayscale: e.target.checked })}
                  aria-label="Activar modo escala de grises"
                />
              </div>
              <div className="option-row">
                <label htmlFor="dark-mode">Modo oscuro accesible</label>
                <input
                  id="dark-mode"
                  type="checkbox"
                  className="toggle-input"
                  checked={settings.darkMode}
                  onChange={(e) => updateSetting({ darkMode: e.target.checked })}
                  aria-label="Activar modo oscuro"
                />
              </div>
            </div>

            <div className="a11y-group" aria-labelledby="a11y-group-lectura">
              <h4 id="a11y-group-lectura">Lectura</h4>
              <div className="option-row" aria-live="polite">
                <label htmlFor="font-scale">Tamaño de texto: {fontScalePercent}%</label>
                <div className="btn-group" id="font-scale">
                  <button
                    className="small-btn"
                    onClick={() => updateSetting({ fontScale: clamp(settings.fontScale - 0.1, 0.8, 1.3) })}
                    aria-label="Reducir tamaño de texto"
                  >
                    -
                  </button>
                  <button
                    className="small-btn"
                    onClick={() => updateSetting({ fontScale: clamp(settings.fontScale + 0.1, 0.8, 1.3) })}
                    aria-label="Aumentar tamaño de texto"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="a11y-group" aria-labelledby="a11y-group-visibilidad">
              <h4 id="a11y-group-visibilidad">Visibilidad</h4>
              <div className="option-row">
                <label htmlFor="underline-links">Subrayar enlaces</label>
                <input
                  id="underline-links"
                  type="checkbox"
                  className="toggle-input"
                  checked={settings.underlineLinks}
                  onChange={(e) => updateSetting({ underlineLinks: e.target.checked })}
                  aria-label="Subrayar enlaces"
                />
              </div>
              <div className="option-row">
                <label htmlFor="underline-buttons">Subrayar botones</label>
                <input
                  id="underline-buttons"
                  type="checkbox"
                  className="toggle-input"
                  checked={settings.textUnderlineButtons}
                  onChange={(e) => updateSetting({ textUnderlineButtons: e.target.checked })}
                  aria-label="Subrayar botones"
                />
              </div>
            </div>

            <div className="a11y-group" aria-labelledby="a11y-group-navegacion">
              <h4 id="a11y-group-navegacion">Navegación</h4>
              <div className="option-row">
                <label htmlFor="focus-outline">Foco visible</label>
                <input
                  id="focus-outline"
                  type="checkbox"
                  className="toggle-input"
                  checked={settings.focusOutline}
                  onChange={(e) => updateSetting({ focusOutline: e.target.checked })}
                  aria-label="Resaltar foco para navegación con teclado"
                />
              </div>
            </div>
          </div>

          <button className="reset-btn" onClick={handleReset} aria-label="Restablecer accesibilidad">
            Restablecer configuración
          </button>
        </div>
      )}
    </div>
  );
}

export default AccessibilityPanel;
