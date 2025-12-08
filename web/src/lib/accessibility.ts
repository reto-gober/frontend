export type AccessibilitySettings = {
  fontScale: number; // 1.0 = 100%
  highContrast: boolean;
  darkMode: boolean;
  underlineLinks: boolean;
  focusOutline: boolean;
  textUnderlineButtons: boolean;
  grayscale: boolean;
};

export const ACCESSIBILITY_STORAGE_KEY = 'tracely.accessibility.v1';

export const defaultAccessibilitySettings: AccessibilitySettings = {
  fontScale: 1,
  highContrast: false,
  darkMode: false,
  underlineLinks: false,
  focusOutline: true,
  textUnderlineButtons: false,
  grayscale: false,
};

export function loadAccessibilitySettings(): AccessibilitySettings {
  if (typeof localStorage === 'undefined') return { ...defaultAccessibilitySettings };
  try {
    const raw = localStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
    if (!raw) return { ...defaultAccessibilitySettings };
    const parsed = JSON.parse(raw) as Partial<AccessibilitySettings>;
    return { ...defaultAccessibilitySettings, ...parsed };
  } catch {
    return { ...defaultAccessibilitySettings };
  }
}

export function saveAccessibilitySettings(settings: AccessibilitySettings) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(settings));
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--font-scale', settings.fontScale.toString());
    }
  } catch {
    // ignore storage errors (quota, privacy modes)
  }
}

export function applyAccessibilitySettings(settings: AccessibilitySettings) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const body = document.body;

  root.style.setProperty('--font-scale', settings.fontScale.toString());

  body.classList.toggle('a11y-high-contrast', settings.highContrast);
  body.classList.toggle('a11y-dark', settings.darkMode);
  body.classList.toggle('a11y-underline', settings.underlineLinks);
  body.classList.toggle('a11y-focus-outline', settings.focusOutline);
  body.classList.toggle('a11y-underline-buttons', settings.textUnderlineButtons);
  body.classList.toggle('a11y-grayscale', settings.grayscale);
}

export function resetAccessibilitySettings() {
  const defaults = { ...defaultAccessibilitySettings };
  saveAccessibilitySettings(defaults);
  applyAccessibilitySettings(defaults);
  return defaults;
}
