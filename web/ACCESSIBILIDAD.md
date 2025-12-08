# Accesibilidad en Tracely

Este módulo añade un panel universal de accesibilidad visible en el header de todos los roles (Administrador, Supervisor, Responsable, Auditor y layouts genéricos).

## Panel de accesibilidad
- Botón ♿ en el header abre un panel con:
  - Aumentar/reducir tamaño de texto (+10%/-10%, hasta 130% / 80%).
  - Modo alto contraste.
  - Modo oscuro accesible.
  - Modo escala de grises.
  - Subrayado de enlaces y opcionalmente botones.
  - Foco visible reforzado para navegación por teclado.
  - Restablecer configuración.
- El panel es un `dialog` accesible, cierra con `Esc`, mantiene foco y cierra al hacer clic fuera.

## Persistencia
- Preferencias se guardan en `localStorage` (`tracely.accessibility.v1`).
- Al cargar la app, se aplican automáticamente (clases `a11y-*` y variable `--a11y-font-scale`).

## Estilos globales
- `accessibility.css` define estados: `a11y-high-contrast`, `a11y-dark`, `a11y-underline`, `a11y-focus-outline`, `a11y-underline-buttons`.
- `--a11y-font-scale` ajusta el `font-size` base.
- Foco visible con contorno naranja de alto contraste.

## Cómo extender
- Usa `applyAccessibilitySettings` y `loadAccessibilitySettings` desde `src/lib/accessibility.ts` para aplicar ajustes en nuevos módulos.
- Para componentes nuevos, asegura que botones e inputs tengan `aria-label`, roles y gestionen `Tab/Shift+Tab/Enter/Espacio`.
- Los estados por color deben incluir texto o `aria-label` descriptivo.

## Depuración
- Verifica en DevTools que el `body` tenga las clases `a11y-*` correspondientes.
- Revisa `localStorage` clave `tracely.accessibility.v1` para comprobar persistencia.
- Usa `:focus-visible` para validar el contorno de foco. Ajusta contrastes para WCAG AA (≥4.5:1 texto, ≥3:1 interactivos).
