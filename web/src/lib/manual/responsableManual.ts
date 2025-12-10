import { driver, type DriveStep, type Driver } from "driver.js";
import "driver.js/dist/driver.css";

type DriverOptions = NonNullable<Parameters<typeof driver>[0]>;
export type ManualDriveStep = DriveStep & { skipIfMissingSelector?: string };

export type ManualSection = {
  id: string;
  label?: string;
  steps: ManualDriveStep[];
};

export type ManualTourConfig = {
  tourId: string;
  sections: ManualSection[];
  options?: DriverOptions;
  nextTourId?: string; // Tour a iniciar al finalizar este
  targetRoute?: string; // Ruta de destino para este tour
};

export type StartTourOptions = {
  tourId: string;
  startSectionId?: string;
  navigateTo?: string; // Nueva opción para navegación automática
};

type RegisteredTour = {
  tourId: string;
  sections: ManualSection[];
  options?: DriverOptions;
  nextTourId?: string;
  targetRoute?: string;
};

const BASE_OPTIONS: DriverOptions = {
  allowClose: true,
  showProgress: true,
  overlayOpacity: 0.55,
  stagePadding: 8,
  allowKeyboardControl: true,
  prevBtnText: "Anterior",
  nextBtnText: "Siguiente",
  doneBtnText: "Siguiente",
  progressText: "{{current}} de {{total}}",
};

const STYLE_ID = "responsable-driver-theme";

const setThemeFlag = () => {
  if (typeof document === "undefined") return;
  document.body.dataset.driverTheme = "responsable";
};

const clearThemeFlag = () => {
  if (typeof document === "undefined") return;
  delete document.body.dataset.driverTheme;
};

const injectResponsableStyles = () => {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    [data-driver-theme="responsable"] .driver-overlay {
      background: radial-gradient(circle at 20% 20%, rgba(10, 37, 64, 0.4), rgba(10, 37, 64, 0.7));
    }

    [data-driver-theme="responsable"] .driver-popover {
      border-radius: 14px;
      border: 1px solid var(--neutral-200, #e5e7eb);
      box-shadow: 0 20px 45px rgba(15, 23, 42, 0.25);
      background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
      color: var(--neutral-900, #0f172a);
      max-width: 360px;
      font-family: inherit;
    }

    [data-driver-theme="responsable"] .driver-popover .driver-popover-title {
      font-size: 1rem;
      font-weight: 800;
      color: var(--neutral-900, #0f172a);
      margin-bottom: 0.35rem;
    }

    [data-driver-theme="responsable"] .driver-popover .driver-popover-description {
      color: var(--neutral-600, #475569);
      font-size: 0.92rem;
      line-height: 1.45;
    }

    [data-driver-theme="responsable"] .driver-popover .driver-popover-progress-text {
      background: var(--role-accent-light, #fff7ed);
      color: var(--neutral-800, #1f2937);
      border-radius: 999px;
      padding: 0.35rem 0.75rem;
      font-weight: 700;
      border: 1px solid var(--neutral-200, #e5e7eb);
    }

    [data-driver-theme="responsable"] .driver-popover .driver-popover-close-btn {
      color: var(--neutral-400, #94a3b8);
      outline: none !important;
    }

    [data-driver-theme="responsable"] .driver-popover .driver-popover-close-btn:focus {
      outline: none !important;
      box-shadow: none !important;
    }

    [data-driver-theme="responsable"] .driver-popover .driver-popover-footer {
      gap: 0.6rem;
    }

    [data-driver-theme="responsable"] .driver-popover .driver-popover-btn {
      border-radius: 10px;
      font-weight: 700;
      border: 1px solid transparent;
      transition: transform 0.15s ease, box-shadow 0.2s ease, background 0.2s ease;
      box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
      padding: 0.55rem 1rem;
      font-size: 0.92rem;
      font-family: inherit;
      outline: none !important;
    }

    [data-driver-theme="responsable"] .driver-popover .driver-popover-btn:focus {
      outline: none !important;
    }

    [data-driver-theme="responsable"] .driver-popover .driver-popover-prev-btn {
      background: linear-gradient(180deg, #f8fafc 0%, #eef2f6 100%);
      color: var(--neutral-800, #1f2937);
      border-color: var(--neutral-300, #d1d5db);
    }

    [data-driver-theme="responsable"] .driver-popover .driver-popover-next-btn,
    [data-driver-theme="responsable"] .driver-popover .driver-popover-done-btn {
      background: #F4C453;
      color: var(--neutral-900, #0f172a);
      border-color: var(--neutral-300, #d1d5db);
    }

    [data-driver-theme="responsable"] .driver-popover .driver-popover-next-btn:hover,
    [data-driver-theme="responsable"] .driver-popover .driver-popover-done-btn:hover {
      background: #e7b84d;
    }

    [data-driver-theme="responsable"] .driver-popover .driver-popover-btn:hover {
      transform: translateY(-1px);
    }
  `;

  document.head.appendChild(style);
};
const buildSequentialSteps = (
  sections: ManualSection[],
  startSectionId?: string
): ManualDriveStep[] => {
  if (!sections.length) return [];

  const sectionOrder = sections.map((section) => section.id);
  const startIndex = startSectionId ? sectionOrder.indexOf(startSectionId) : 0;

  const normalizedSections =
    startIndex > -1
      ? [...sections.slice(startIndex), ...sections.slice(0, startIndex)]
      : sections;

  const steps = normalizedSections.flatMap((section) =>
    section.steps.map((step) => ({ ...step }))
  );

  // Configurar automáticamente el último paso con botón "Hecho"
  if (steps.length > 0) {
    const lastStep = steps[steps.length - 1];
    lastStep.popover = {
      ...lastStep.popover,
      doneBtnText: "Hecho",
    };
  }

  return steps;
};

const createDriverInstance = (
  options?: DriverOptions,
  setActive?: (id: string | null) => void,
  onTourComplete?: () => void
): { instance: Driver; attachDoneCloser: () => void } | null => {
  if (typeof window === "undefined") return null;
  injectResponsableStyles();
  setThemeFlag();

  let driverInstanceRef: Driver | null = null;

  const attachCloseGuards = (
    driverInstance: Driver | null,
    allowOverlayClose: boolean
  ) => {
    if (!driverInstance || typeof document === "undefined") return () => {};

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Esc") {
        event.stopPropagation();
        driverInstance.destroy();
      }
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      if (target.closest(".driver-popover-close-btn")) {
        event.stopPropagation();
        driverInstance.destroy();
        return;
      }

      if (allowOverlayClose && target.classList.contains("driver-overlay")) {
        event.stopPropagation();
        driverInstance.destroy();
      }
    };

    document.addEventListener("keydown", handleKeydown, true);
    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("keydown", handleKeydown, true);
      document.removeEventListener("click", handleClick, true);
    };
  };

  const doneClickHandler = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    // Destruir el driver completamente
    if (driverInstanceRef) {
      driverInstanceRef.destroy();
    }
  };

  const attachDoneCloser = () => {
    if (typeof document === "undefined") return;
    const doneBtn = document.querySelector<HTMLButtonElement>(
      ".driver-popover-done-btn"
    );
    if (!doneBtn) return;

    // Evitar duplicar listeners en re-render del popover
    doneBtn.removeEventListener("click", doneClickHandler, true);
    doneBtn.addEventListener("click", doneClickHandler, true);
  };

  const userOptions = options as Record<string, unknown> | undefined;
  let cleanupCloseGuards: (() => void) | undefined;

  const withNavRelabel = (
    cb?: (...cbArgs: unknown[]) => void
  ): ((...cbArgs: unknown[]) => void) => {
    return (...cbArgs: unknown[]) => {
      startNavObserver();
      relabelNavigationButtons();
      // Adjuntar el listener del botón "Hecho" cada vez que se renderiza un paso
      attachDoneCloser();
      // Scroll al elemento destacado con delays para asegurar que el DOM esté listo
      setTimeout(() => scrollToHighlightedElement(), 100);
      setTimeout(() => {
        scrollToHighlightedElement();
        // Volver a adjuntar después del delay para asegurar que el botón esté disponible
        attachDoneCloser();
      }, 300);
      cb?.(...cbArgs);
    };
  };

  const mergedOptions = {
    ...BASE_OPTIONS,
    allowClose: options?.allowClose ?? true, // Respetar config, por defecto permitir cerrar
    allowKeyboardControl: options?.allowKeyboardControl ?? true,
    ...(options || {}),
    onHighlightStarted: withNavRelabel(
      userOptions?.onHighlightStarted as
        | ((...cbArgs: unknown[]) => void)
        | undefined
    ),
    onPopoverRendered: withNavRelabel((...cbArgs: unknown[]) => {
      attachDoneCloser();
      const rendered = userOptions?.onPopoverRendered as
        | ((...cbArgs: unknown[]) => void)
        | undefined;
      rendered?.(...cbArgs);
    }),
    onDestroyStarted: (...args: unknown[]) => {
      // Llamar al callback personalizado antes de destruir
      const destroyStarted = userOptions?.onDestroyStarted as
        | ((...cbArgs: unknown[]) => void)
        | undefined;
      destroyStarted?.(...args);
      // NO ejecutar onTourComplete aquí para no bloquear el cierre
    },
    onReset: (...args: unknown[]) => {
      clearThemeFlag();
      stopNavObserver();
      cleanupCloseGuards?.();
      setActive?.(null);
      const reset = userOptions?.onReset as
        | ((...cbArgs: unknown[]) => void)
        | undefined;
      reset?.(...args);
    },
    onDestroyed: (...args: unknown[]) => {
      clearThemeFlag();
      stopNavObserver();
      cleanupCloseGuards?.();
      setActive?.(null);
      const destroyed = userOptions?.onDestroyed as
        | ((...cbArgs: unknown[]) => void)
        | undefined;
      destroyed?.(...args);

      // Ejecutar onTourComplete DESPUÉS de que el tour se destruya completamente
      if (onTourComplete) {
        onTourComplete();
      }
    },
  } as DriverOptions;

  const instance = driver(mergedOptions);
  driverInstanceRef = instance;
  cleanupCloseGuards = attachCloseGuards(
    instance,
    mergedOptions.allowClose !== false
  );
  return { instance, attachDoneCloser };
};

const relabelNavigationButtons = () => {
  if (typeof document === "undefined") return;
  const prev = document.querySelector<HTMLButtonElement>(
    ".driver-popover-prev-btn"
  );
  const next = document.querySelector<HTMLButtonElement>(
    ".driver-popover-next-btn"
  );
  const done = document.querySelector<HTMLButtonElement>(
    ".driver-popover-done-btn"
  );
  const close = document.querySelector<HTMLButtonElement>(
    ".driver-popover-close-btn"
  );

  if (prev && prev.textContent !== "Anterior") prev.textContent = "Anterior";
  if (next && next.textContent !== "Siguiente") next.textContent = "Siguiente";
  // El botón "done" mantiene su texto original (puede ser "Siguiente" o "Hecho")
  // No lo sobrescribimos para respetar la configuración del paso

  // Remover foco de todos los botones del popover para evitar el resaltado naranja
  [prev, next, done, close].forEach((btn) => {
    if (btn && document.activeElement === btn) {
      btn.blur();
    }
  });
};

const scrollToHighlightedElement = () => {
  if (typeof document === "undefined") return;

  const highlightedElement = document.querySelector(".driver-active-element");
  if (!highlightedElement) return;

  const rect = highlightedElement.getBoundingClientRect();
  const windowHeight =
    window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;

  // Verificar si el elemento es parte del topbar (elementos en la parte superior)
  const isTopbarElement = rect.top < 100 && rect.top >= 0;

  // Para elementos del topbar, usar márgenes más permisivos
  const topMargin = isTopbarElement ? 0 : 80; // Sin margen para topbar
  const bottomMargin = 80; // Margen inferior
  const sideMargin = 20; // Margen lateral

  const isFullyVisible =
    rect.top >= topMargin &&
    rect.left >= sideMargin &&
    rect.bottom <= windowHeight - bottomMargin &&
    rect.right <= windowWidth - sideMargin;

  // Si no está completamente visible, hacer scroll
  if (!isFullyVisible) {
    // Calcular si el elemento está más cerca del top o del bottom
    const isCloserToTop = rect.top < windowHeight / 2;

    highlightedElement.scrollIntoView({
      behavior: "smooth",
      block: isCloserToTop ? "start" : "center",
      inline: "center",
    });

    // Ajuste adicional después del scroll para elementos grandes (solo si no es topbar)
    if (!isTopbarElement) {
      setTimeout(() => {
        const newRect = highlightedElement.getBoundingClientRect();
        if (newRect.top < topMargin) {
          window.scrollBy({
            top: newRect.top - topMargin - 20,
            behavior: "smooth",
          });
        }
      }, 300);
    }
  }
};

const waitForElement = (
  selector: string,
  timeoutMs = 2500,
  intervalMs = 100
) => {
  return new Promise<void>((resolve) => {
    if (typeof document === "undefined") {
      resolve();
      return;
    }

    const start = Date.now();

    const check = () => {
      if (document.querySelector(selector)) {
        resolve();
        return;
      }

      if (Date.now() - start >= timeoutMs) {
        console.warn(
          `[manual] Elemento no encontrado (${selector}) dentro del tiempo; se continúa el tour.`
        );
        resolve();
        return;
      }

      setTimeout(check, intervalMs);
    };

    check();
  });
};

let navObserver: MutationObserver | null = null;

const stopNavObserver = () => {
  navObserver?.disconnect();
  navObserver = null;
};

const startNavObserver = () => {
  if (
    typeof document === "undefined" ||
    typeof MutationObserver === "undefined"
  )
    return;

  const target = document.querySelector(".driver-popover");
  if (!target) {
    // Reintenta una sola vez cuando el popover termine de montarse
    setTimeout(startNavObserver, 40);
    return;
  }

  stopNavObserver();
  navObserver = new MutationObserver(() => {
    relabelNavigationButtons();
  });

  navObserver.observe(target, {
    childList: true,
    subtree: true,
    characterData: true,
  });
};

export const createResponsableManual = () => {
  const registry = new Map<string, RegisteredTour>();
  let activeTourId: string | null = null;
  let attachDoneCloserRef: (() => void) | null = null;

  const registerTour = (config: ManualTourConfig) => {
    registry.set(config.tourId, {
      tourId: config.tourId,
      sections: config.sections,
      options: config.options,
      nextTourId: config.nextTourId,
      targetRoute: config.targetRoute,
    });
  };

  const startTour = ({
    tourId,
    startSectionId,
    navigateTo,
  }: StartTourOptions) => {
    if (activeTourId) {
      console.warn(
        `[manual] Ya hay un tour activo (${activeTourId}), se omite uno nuevo.`
      );
      return;
    }

    const tour = registry.get(tourId);
    if (!tour) {
      console.warn(`[manual] Tour no encontrado: ${tourId}`);
      return;
    }

    const steps = buildSequentialSteps(tour.sections, startSectionId);
    if (!steps.length) {
      console.warn(
        `[manual] El tour ${tourId} no tiene pasos configurados aún.`
      );
      return;
    }

    // Si se requiere navegación, hacerla antes de iniciar el tour
    if (navigateTo && typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      if (currentPath !== navigateTo) {
        window.location.href = navigateTo;
        // Guardar el tourId en sessionStorage para iniciarlo después de la navegación
        sessionStorage.setItem("pendingTourId", tourId);
        if (startSectionId) {
          sessionStorage.setItem("pendingTourStartSection", startSectionId);
        }
        return;
      }
    }

    // Iniciar el tour con un pequeño delay para asegurar que el DOM esté listo
    const initTour = () => {
      const onTourComplete = () => {
        // Si el tour tiene un nextTourId, iniciarlo después de completar
        if (tour.nextTourId) {
          const nextTour = registry.get(tour.nextTourId);
          if (nextTour) {
            // Esperar un poco antes de iniciar el siguiente tour
            setTimeout(() => {
              activeTourId = null; // Resetear para permitir el siguiente tour
              startTour({
                tourId: tour.nextTourId!,
                navigateTo: nextTour.targetRoute,
              });
            }, 500);
          }
        }
      };
      const stepsForRun = steps
        .filter((step) => {
          const skipSelector = step.skipIfMissingSelector;
          if (!skipSelector || typeof document === "undefined") return true;
          return Boolean(document.querySelector(skipSelector));
        })
        .map((step) => ({
          ...step,
          popover: step.popover ? { ...step.popover } : undefined,
        }));
      if (stepsForRun.length) {
        const last = stepsForRun[stepsForRun.length - 1];
        last.popover = { ...last.popover, doneBtnText: "Hecho" };
      }

      const driverResult = createDriverInstance(
        tour.options,
        (id) => {
          activeTourId = id;
        },
        onTourComplete
      );

      if (!driverResult) return;

      const { instance: driverInstance, attachDoneCloser } = driverResult;
      attachDoneCloserRef = attachDoneCloser;

      driverInstance?.setSteps(stepsForRun);
      activeTourId = tourId;
      driverInstance?.drive();
      startNavObserver();
      requestAnimationFrame(() => {
        relabelNavigationButtons();
        attachDoneCloser();
      });
      setTimeout(() => {
        relabelNavigationButtons();
        attachDoneCloser();
      }, 80);
      setTimeout(() => {
        attachDoneCloser();
      }, 200);
    };

    if (navigateTo) {
      // Esperar a que la página termine de cargar
      setTimeout(initTour, 800);
    } else {
      initTour();
    }
  };

  return {
    registerTour,
    startTour,
    getRegisteredTours: () => Array.from(registry.keys()),
    getTourSections: (tourId: string) => registry.get(tourId)?.sections || [],
    checkPendingTour: () => {
      // Verificar si hay un tour pendiente después de la navegación
      if (typeof window === "undefined") return;

      const pendingTourId = sessionStorage.getItem("pendingTourId");
      const pendingStartSection = sessionStorage.getItem(
        "pendingTourStartSection"
      );

      if (pendingTourId) {
        sessionStorage.removeItem("pendingTourId");
        sessionStorage.removeItem("pendingTourStartSection");

        // Iniciar el tour pendiente con un delay
        setTimeout(() => {
          startTour({
            tourId: pendingTourId,
            startSectionId: pendingStartSection || undefined,
          });
        }, 1000);
      }
    },
  };
};
const responsableManualSingleton = createResponsableManual();

const registerSidebarTour = () => {
  responsableManualSingleton.registerTour({
    tourId: "tour-sidebar",
    sections: [
      {
        id: "sidebar",
        label: "Barra lateral",
        steps: [
          {
            element: ".responsable-sidebar .collapse-btn",
            popover: {
              title: "Contraer o expandir",
              description: "Oculta o muestra los textos para ganar espacio.",
              side: "right",
            },
          },
          {
            element:
              '.responsable-sidebar a[href="/roles/responsable/dashboard"]',
            popover: {
              title: "Dashboard personal",
              description: "Indicadores rápidos de tu avance.",
              side: "right",
            },
          },
          {
            element:
              '.responsable-sidebar a[href="/roles/responsable/mis-reportes"]',
            popover: {
              title: "Mis reportes",
              description: "Lista tus reportes asignados.",
              side: "right",
            },
          },
          {
            element:
              '.responsable-sidebar a[href="/roles/responsable/mis-tareas"]',
            popover: {
              title: "Mis tareas",
              description: "Pendientes y correcciones por enviar.",
              side: "right",
            },
          },
          {
            element:
              '.responsable-sidebar a[href="/roles/responsable/alertas"]',
            popover: {
              title: "Alertas y badge",
              description:
                "Vencidos y por vencer. El número muestra las alertas.",
              side: "right",
            },
          },
          {
            element:
              '.responsable-sidebar a[href="/roles/responsable/calendario"]',
            popover: {
              title: "Calendario",
              description: "Visualiza plazos por fecha.",
              side: "right",
            },
          },
        ],
      },
    ],
  });
};

const registerTopbarTour = () => {
  responsableManualSingleton.registerTour({
    tourId: "tour-topbar",
    sections: [
      {
        id: "topbar",
        label: "Barra superior",
        steps: [
          {
            element: ".role-topbar .page-title",
            popover: {
              title: "Título de la página",
              description: "Muestra la sección actual en la que te encuentras.",
              side: "bottom",
            },
          },
          {
            element: ".role-topbar .a11y-panel-trigger",
            popover: {
              title: "Panel de accesibilidad",
              description: "Ajusta el tamaño de fuente y el contraste visual.",
              side: "bottom",
            },
          },
          {
            element: ".role-topbar .notifications-bell",
            popover: {
              title: "Campana de notificaciones",
              description:
                "Recibe avisos importantes. El badge muestra el número de pendientes.",
              side: "bottom",
            },
          },
          {
            element: ".role-topbar .user-name-display",
            popover: {
              title: "Nombre del usuario",
              description: "Tu nombre de usuario actual en el sistema.",
              side: "bottom",
            },
          },
          {
            element: ".role-topbar .btn-logout",
            popover: {
              title: "Cerrar sesión",
              description: "Sal del sistema de forma segura.",
              side: "bottom",
            },
          },
        ],
      },
    ],
  });
};

const registerDashboardTour = () => {
  responsableManualSingleton.registerTour({
    tourId: "tour-dashboard",
    sections: [
      {
        id: "dashboard-overview",
        label: "Panel de control",
        steps: [
          {
            element: ".dashboard-header-bar .filter-select",
            popover: {
              title: "Filtro de período",
              description:
                "Filtra los datos por período: mensual, bimestral, trimestral, etc.",
              side: "bottom",
            },
          },
          {
            element: ".kpis-grid .kpi-card.neutral",
            popover: {
              title: "Reportes pendientes",
              description: "Cantidad de reportes que aún no has enviado.",
              side: "top",
            },
          },
          {
            element: ".kpis-grid .kpi-card.success",
            popover: {
              title: "Reportes enviados",
              description: "Total de reportes que ya completaste y enviaste.",
              side: "top",
            },
          },
          {
            element: ".kpis-grid .kpi-card.danger",
            popover: {
              title: "Reportes vencidos",
              description:
                "Reportes con fecha límite superada. Requieren atención urgente.",
              side: "top",
            },
          },
          {
            element: ".kpis-grid .kpi-card.warning",
            popover: {
              title: "Por vencer",
              description: "Reportes próximos a vencer (3 días o menos).",
              side: "top",
            },
          },
          {
            element: ".dashboard-grid .dashboard-card:nth-child(1)",
            popover: {
              title: "Gráfico de estados",
              description:
                "Visualización completa del estado de tus reportes con título, gráfica y leyenda de colores.",
              side: "left",
            },
          },
          {
            element: ".dashboard-grid .dashboard-card.wide",
            popover: {
              title: "Próximos vencimientos",
              description:
                "Lista completa de reportes ordenados por fecha de vencimiento.",
              side: "top",
            },
          },
        ],
      },
    ],
  });
};

const registerAlertasTour = () => {
  responsableManualSingleton.registerTour({
    tourId: "tour-alertas",
    targetRoute: "/roles/responsable/alertas",
    sections: [
      {
        id: "alertas-overview",
        label: "Alertas y notificaciones",
        steps: [
          {
            element: ".alertas-summary .summary-card.critical",
            popover: {
              title: "Alertas críticas",
              description:
                "Vencimientos o errores urgentes. Observa el contador total de críticas.",
              side: "bottom",
            },
            skipIfMissingSelector: ".alertas-list .alerta-card",
            onHighlightStarted: () =>
              waitForElement(".alertas-summary .summary-card.critical"),
          },
          {
            element: ".alertas-summary .summary-card.warning",
            popover: {
              title: "Alertas de advertencia",
              description:
                "Pendientes próximos a vencer o correcciones requeridas.",
              side: "bottom",
            },
            skipIfMissingSelector: ".alertas-list .alerta-card",
            onHighlightStarted: () =>
              waitForElement(".alertas-summary .summary-card.warning"),
          },
          {
            element: ".alertas-summary .summary-card.info",
            popover: {
              title: "Alertas informativas",
              description: "Avisos generales o recordatorios sin urgencia.",
              side: "bottom",
            },
            skipIfMissingSelector: ".alertas-list .alerta-card",
            onHighlightStarted: () =>
              waitForElement(".alertas-summary .summary-card.info"),
          },
          {
            element: ".alertas-summary .summary-card.success",
            popover: {
              title: "Alertas de éxito",
              description:
                "Confirmaciones de aprobaciones recientes en tus reportes.",
              side: "bottom",
            },
            skipIfMissingSelector: ".alertas-list .alerta-card",
            onHighlightStarted: () =>
              waitForElement(".alertas-summary .summary-card.success"),
          },
          {
            element: ".filters-bar",
            popover: {
              title: "Filtros superiores",
              description:
                "Usa las pestañas para ver todas, no leídas o leídas y el selector para filtrar por tipo de alerta.",
              side: "bottom",
            },
            onHighlightStarted: () => waitForElement(".filters-bar"),
          },
          {
            element: ".btn-mark-all",
            popover: {
              title: "Marcar todas como leídas",
              description:
                "Marca en un clic todas las alertas pendientes y limpia el contador.",
              side: "left",
            },
            skipIfMissingSelector: ".alertas-list .alerta-card",
            onHighlightStarted: () => waitForElement(".btn-mark-all"),
          },
          {
            element: ".alertas-list .alerta-card .alerta-actions",
            popover: {
              title: "Ver reporte",
              description:
                "Abre el reporte asociado a la alerta para revisarlo o actuar.",
              side: "top",
            },
            skipIfMissingSelector:
              ".alertas-list .alerta-card .alerta-action-btn",
            onHighlightStarted: () =>
              waitForElement(".alertas-list .alerta-card .alerta-actions"),
          },
        ],
      },
    ],
  });
};

const registerMisReportesTour = () => {
  responsableManualSingleton.registerTour({
    tourId: "tour-mis-reportes",
    sections: [
      {
        id: "mis-reportes-overview",
        label: "Mis Reportes",
        steps: [
          {
            element: ".status-tabs",
            popover: {
              title: "Filtros de estado",
              description:
                "Filtra tus reportes por: Todos, Activos o Inactivos según su vigencia.",
              side: "bottom",
            },
          },
          {
            element: ".reportes-list .reporte-agrupado:first-child",
            popover: {
              title: "Tarjeta de reporte agrupado",
              description:
                "Cada tarjeta agrupa los períodos de un mismo reporte por vigencia.",
              side: "top",
            },
          },
          {
            element:
              ".reportes-list .reporte-agrupado:first-child .estado-chip",
            popover: {
              title: "Estado del grupo",
              description:
                "Indica si el grupo está ACTIVO (dentro de vigencia) o INACTIVO (fuera de vigencia).",
              side: "left",
            },
          },
          {
            element:
              ".reportes-list .reporte-agrupado:first-child .agrupado-meta",
            popover: {
              title: "Información de vigencia",
              description:
                "Muestra el rango de fechas de vigencia, periodicidad y cantidad de períodos.",
              side: "top",
            },
          },
          {
            element:
              ".reportes-list .reporte-agrupado:first-child .agrupado-resumen",
            popover: {
              title: "Resumen de conteos",
              description:
                "Contadores de reportes: pendientes, vencidos, por vencer (3 días) y enviados.",
              side: "top",
            },
          },
          {
            element:
              ".reportes-list .reporte-agrupado:first-child .btn-secondary",
            popover: {
              title: "Ver entregas",
              description:
                "Accede al listado de todas las entregas realizadas para este reporte.",
              side: "top",
            },
          },
          {
            element: ".pagination",
            popover: {
              title: "Controles de paginación",
              description:
                "Navega entre páginas si tienes más de 6 grupos de reportes. La paginación siempre estará visible.",
              side: "top",
            },
            onHighlightStarted: () => waitForElement(".pagination"),
          },
        ],
      },
    ],
  });
};

/**
 * Tour: Calendario
 * Guía completa para navegar y utilizar el calendario de vencimientos
 */
const registerCalendarioTour = () => {
  responsableManualSingleton.registerTour({
    tourId: "tour-calendario",
    targetRoute: "/roles/responsable/calendario",
    sections: [
      {
        id: "calendario-overview",
        label: "Calendario de vencimientos",
        steps: [
          {
            element: ".calendar-view-selector",
            popover: {
              title: "Selector de vista del calendario",
              description:
                "Aquí puedes cambiar entre tres modos de visualización: Vista Mensual para ver todo el mes completo, Vista Semanal para enfocarte en una semana específica, o Vista Lista para ver todos los vencimientos en formato de lista cronológica. Cada vista te ayuda a organizar tu trabajo según tus necesidades.",
              side: "bottom",
            },
            skipIfMissingSelector: ".calendar-container",
            onHighlightStarted: () => waitForElement(".calendar-view-selector"),
          },
          {
            element: ".calendar-navigation .btn-today",
            popover: {
              title: "Botón Hoy - Regresa al presente",
              description:
                "Si has navegado a fechas futuras o pasadas y quieres volver rápidamente al día actual, haz clic aquí. Es útil cuando estás revisando históricos o planificando y necesitas regresar a la fecha de hoy.",
              side: "bottom",
            },
            skipIfMissingSelector: ".calendar-container",
            onHighlightStarted: () =>
              waitForElement(".calendar-navigation .btn-today"),
          },
          {
            element: ".calendar-navigation .btn-prev",
            popover: {
              title: "Navegar hacia atrás",
              description:
                "Retrocede en el tiempo: si estás en vista mensual irás al mes anterior, en vista semanal a la semana anterior, y en vista lista al período anterior. Úsalo para revisar reportes pasados o consultar el historial de entregas.",
              side: "bottom",
            },
            skipIfMissingSelector: ".calendar-container",
            onHighlightStarted: () =>
              waitForElement(".calendar-navigation .btn-prev"),
          },
          {
            element: ".calendar-navigation .btn-next",
            popover: {
              title: "Navegar hacia adelante",
              description:
                "Avanza en el tiempo: si estás en vista mensual irás al mes siguiente, en vista semanal a la próxima semana, y en vista lista al siguiente período. Ideal para planificar y ver qué reportes vencen próximamente.",
              side: "bottom",
            },
            skipIfMissingSelector: ".calendar-container",
            onHighlightStarted: () =>
              waitForElement(".calendar-navigation .btn-next"),
          },
          {
            element: ".calendar-grid .calendar-day.has-events",
            popover: {
              title: "Días con reportes programados",
              description:
                "Los días que tienen reportes aparecen destacados con indicadores de colores según el estado: gris para pendientes, rojo para vencidos, amarillo para próximos a vencer (3 días o menos) y verde para enviados. El número de puntos o badges indica cuántos reportes hay ese día. Haz clic en cualquier día para ver el detalle completo de sus reportes.",
              side: "top",
            },
            skipIfMissingSelector: ".calendar-grid .calendar-day.has-events",
            onHighlightStarted: () =>
              waitForElement(".calendar-grid .calendar-day.has-events"),
          },
          {
            element: ".calendar-day-mini-list",
            popover: {
              title: "Vista previa rápida al pasar el cursor",
              description:
                "Al colocar el cursor sobre cualquier día con eventos (sin hacer clic), aparece automáticamente una mini lista emergente que te muestra un resumen rápido de los reportes programados para ese día: nombre del reporte, estado actual y tiempo restante. Es perfecto para revisar información sin necesidad de hacer clic.",
              side: "left",
            },
            skipIfMissingSelector: ".calendar-day-mini-list",
            onHighlightStarted: () => waitForElement(".calendar-day-mini-list"),
          },
          {
            element: ".calendar-day-details",
            popover: {
              title: "Detalle completo de reportes del día",
              description:
                "Cuando haces clic en un día del calendario, esta área se expande mostrando la lista completa y detallada de todos los reportes con vencimiento en esa fecha. Aquí verás el nombre completo del reporte, el estado actual, la entidad responsable, los días restantes hasta el vencimiento, y botones de acción para gestionar cada reporte. Es tu vista principal para trabajar con los reportes de un día específico.",
              side: "top",
            },
            skipIfMissingSelector: ".calendar-day-details",
            onHighlightStarted: () => waitForElement(".calendar-day-details"),
          },
          {
            element: ".calendar-sidebar .upcoming-events",
            popover: {
              title: "Panel de próximos vencimientos",
              description:
                "Este panel lateral permanente te muestra una lista ordenada cronológicamente de los reportes que están próximos a vencer, empezando por los más urgentes. Es como tu agenda prioritaria: siempre visible, siempre actualizada. Aquí puedes identificar rápidamente qué reportes requieren tu atención inmediata sin importar en qué mes o semana estés navegando el calendario.",
              side: "left",
            },
            skipIfMissingSelector: ".calendar-sidebar .upcoming-events",
            onHighlightStarted: () =>
              waitForElement(".calendar-sidebar .upcoming-events"),
          },
          {
            element: ".calendar-legend",
            popover: {
              title: "Leyenda de colores y estados",
              description:
                "Esta guía visual te explica el significado de cada color usado en el calendario: Gris o Neutral = Reportes pendientes por enviar, Rojo o Crítico = Reportes vencidos que requieren atención urgente, Amarillo o Advertencia = Reportes próximos a vencer en 3 días o menos, Verde o Éxito = Reportes ya enviados y completados. Usa esta referencia para interpretar rápidamente el estado de tus reportes en el calendario.",
              side: "top",
            },
            skipIfMissingSelector: ".calendar-legend",
            onHighlightStarted: () => waitForElement(".calendar-legend"),
          },
          {
            element: ".calendar-event-item:first-child",
            popover: {
              title: "Acciones sobre eventos del calendario",
              description:
                "Cada reporte mostrado en el calendario es interactivo. Haz clic sobre cualquier evento para abrir la vista detallada completa del reporte, donde podrás ver toda la información, adjuntar archivos, escribir comentarios, enviar tu entrega o realizar correcciones si fue rechazado. El calendario no solo es para visualizar, también es tu punto de acceso rápido para actuar sobre cada reporte.",
              side: "top",
            },
            skipIfMissingSelector: ".calendar-event-item",
            onHighlightStarted: () =>
              waitForElement(".calendar-event-item:first-child"),
          },
        ],
      },
    ],
  });
};

/**
 * Tour: Mis Tareas
 * Guía para entender y gestionar las tareas asignadas al responsable
 */
const registerMisTareasTour = () => {
  responsableManualSingleton.registerTour({
    tourId: "tour-mis-tareas",
    targetRoute: "/roles/responsable/mis-tareas",
    sections: [
      {
        id: "mis-tareas-overview",
        label: "Mis Tareas",
        steps: [
          {
            element: ".status-tabs",
            popover: {
              title: "Filtros de estado",
              description:
                "Filtra tus tareas por: Todos, Pendientes, Vencidos, Por vencer (próximos 3 días) o Enviados.",
              side: "bottom",
            },
          },
          {
            element: ".tareas-list .card:first-child",
            popover: {
              title: "Tarjeta de período",
              description:
                "Cada tarjeta representa un período de reporte específico con toda su información y acciones disponibles.",
              side: "top",
            },
            onHighlightStarted: () =>
              waitForElement(".tareas-list .card:first-child"),
          },
          {
            element: ".tareas-list .card:first-child .estado-badge",
            popover: {
              title: "Estado del período",
              description:
                "Indica el estado actual: Pendiente, Enviado, En Revisión, Aprobado, Rechazado o Vencido.",
              side: "left",
            },
            onHighlightStarted: () =>
              waitForElement(".tareas-list .card:first-child .estado-badge"),
          },
          {
            element: ".tareas-list .card:first-child .dias-vencimiento",
            popover: {
              title: "Días restantes",
              description:
                "Muestra cuántos días faltan para el vencimiento. Se resalta en rojo si está vencido o próximo a vencer.",
              side: "right",
            },
            onHighlightStarted: () =>
              waitForElement(
                ".tareas-list .card:first-child .dias-vencimiento"
              ),
          },
          {
            element: ".tareas-list .card:first-child",
            popover: {
              title: "Comentarios y archivos",
              description:
                "En la tarjeta verás el último comentario (si existe) y la cantidad de archivos adjuntos al período.",
              side: "top",
            },
          },
          {
            element: ".tareas-list .card:first-child .btn-secondary",
            popover: {
              title: "Ver detalle",
              description:
                "Accede a la vista completa del período para revisar información, comentarios, archivos y enviar o corregir tu reporte.",
              side: "top",
            },
          },
          {
            element: ".pagination",
            popover: {
              title: "Controles de paginación",
              description:
                "Navega entre páginas si tienes más de 6 tareas. La paginación siempre estará visible.",
              side: "top",
            },
            onHighlightStarted: () => waitForElement(".pagination"),
          },
        ],
      },
    ],
  });
};

registerSidebarTour();
registerTopbarTour();
registerDashboardTour();
registerMisReportesTour();
registerMisTareasTour();
registerAlertasTour();
registerCalendarioTour();

export const useResponsableManual = () => responsableManualSingleton;
