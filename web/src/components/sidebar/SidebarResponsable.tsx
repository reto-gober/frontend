import { useState, useEffect } from "react";
import { flujoReportesService } from "../../lib/services";
import { esEstadoEnviado } from "../../lib/utils/estados";
import { useResponsableManual } from "../../lib/manual/responsableManual";
import ManualIndexPanel, { type GuideItem } from "../common/ManualIndexPanel";

const menuItems = [
  {
    label: "Dashboard Personal",
    href: "/roles/responsable/dashboard",
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="7" height="9" />
        <rect x="14" y="3" width="7" height="5" />
        <rect x="14" y="12" width="7" height="9" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: "Mis Reportes",
    href: "/roles/responsable/mis-reportes",
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    label: "Mis Tareas Pendientes",
    href: "/roles/responsable/mis-tareas",
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    label: "Alertas",
    href: "/roles/responsable/alertas",
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    label: "Calendario",
    href: "/roles/responsable/calendario",
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
];

export default function SidebarResponsable() {
  const [collapsed, setCollapsed] = useState(false);
  const [currentPath, setCurrentPath] = useState("");
  const [badges, setBadges] = useState<{ alertas: number }>({ alertas: 0 });
  const [manualIndexOpen, setManualIndexOpen] = useState(false);
  const manual = useResponsableManual();

  // Configuración de guías disponibles
  const availableGuides: GuideItem[] = [
    {
      id: "tour-sidebar",
      name: "Guía del menú lateral",
      description: "Conoce las opciones de navegación y el badge de alertas.",
      onStart: () => manual.startTour({ tourId: "tour-sidebar" }),
    },
    {
      id: "tour-topbar",
      name: "Guía de la barra superior",
      description:
        "Descubre las funciones del panel de accesibilidad, notificaciones y más.",
      onStart: () => manual.startTour({ tourId: "tour-topbar" }),
    },
    {
      id: "tour-dashboard",
      name: "Guía del dashboard",
      description:
        "Descubre los indicadores, gráficos y reportes de tu panel principal.",
      onStart: () =>
        manual.startTour({
          tourId: "tour-dashboard",
          navigateTo: "/roles/responsable/dashboard",
        }),
    },
    {
      id: "tour-mis-reportes",
      name: "Guía de mis reportes",
      description:
        "Aprende a filtrar, revisar y gestionar tus reportes agrupados por vigencia.",
      onStart: () =>
        manual.startTour({
          tourId: "tour-mis-reportes",
          navigateTo: "/roles/responsable/mis-reportes",
        }),
    },
    {
      id: "tour-mis-tareas",
      name: "Guía de mis tareas",
      description: "Aprende a gestionar tus tareas y entregas pendientes.",
      onStart: () =>
        manual.startTour({
          tourId: "tour-mis-tareas",
          navigateTo: "/roles/responsable/mis-tareas",
        }),
    },
    {
      id: "tour-alertas",
      name: "Guía de alertas",
      description: "Aprende a filtrar, leer y abrir alertas.",
      onStart: () =>
        manual.startTour({
          tourId: "tour-alertas",
          navigateTo: "/roles/responsable/alertas",
        }),
    },
    {
      id: "tour-calendario",
      name: "Guía del calendario",
      description:
        "Aprende a navegar por el calendario, cambiar vistas y revisar vencimientos.",
      onStart: () =>
        manual.startTour({
          tourId: "tour-calendario",
          navigateTo: "/roles/responsable/calendario",
        }),
    },
  ];

  useEffect(() => {
    // Establecer el path actual solo en el cliente
    if (typeof window !== "undefined") {
      setCurrentPath(window.location.pathname);
    }
  }, []);

  useEffect(() => {
    // Cargar contadores de alertas
    const loadBadges = async () => {
      try {
        const response = await flujoReportesService.misPeriodos(0, 1000);
        const periodos = response.content;

        const now = new Date();
        const tresDias = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        let alertasCount = 0;

        periodos.forEach((periodo) => {
          if (!periodo.fechaVencimientoCalculada) return;

          const fechaVenc = new Date(periodo.fechaVencimientoCalculada);
          const enviado = esEstadoEnviado(periodo.estado);

          // Contar alertas críticas - Reportes vencidos
          if (fechaVenc < now && !enviado) {
            alertasCount++;
          }

          // Contar alertas de advertencia - Por vencer en 3 días
          if (fechaVenc >= now && fechaVenc <= tresDias && !enviado) {
            alertasCount++;
          }

          // Contar alertas de corrección requerida
          if (periodo.estado === "requiere_correccion") {
            alertasCount++;
          }
        });

        setBadges({ alertas: alertasCount });
      } catch (err) {
        console.error("Error al cargar badges:", err);
        setBadges({ alertas: 0 });
      }
    };

    loadBadges();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const container = document.querySelector(".role-container");
      if (container) {
        if (collapsed) {
          container.classList.add("sidebar-collapsed");
          container.classList.remove("sidebar-expanded");
        } else {
          container.classList.add("sidebar-expanded");
          container.classList.remove("sidebar-collapsed");
        }
      }
    }
  }, [collapsed]);

  return (
    <aside
      className={`role-sidebar responsable-sidebar ${collapsed ? "is-collapsed" : ""}`}
    >
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="brand-icon responsable">
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          {!collapsed && <span className="brand-text">Responsable</span>}
        </div>
        <button
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expandir" : "Contraer"}
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d={collapsed ? "M9 18l6-6-6-6" : "M15 18l-6-6 6-6"} />
          </svg>
        </button>
        <button
          className="collapse-btn"
          aria-label="Abrir índice de guías"
          title="Ayuda"
          onClick={() => setManualIndexOpen(true)}
        >
          <span style={{ fontWeight: 800, fontSize: "14px" }}>?</span>
        </button>
      </div>

      <ManualIndexPanel
        isOpen={manualIndexOpen}
        onClose={() => setManualIndexOpen(false)}
        guides={availableGuides}
      />

      <nav className="sidebar-nav">
        {menuItems.map((item, index) => {
          const isAlertasItem = item.href === "/roles/responsable/alertas";
          const hasBadge = isAlertasItem && badges.alertas > 0;

          return (
            <a
              key={item.href}
              href={item.href}
              className={`nav-link ${currentPath === item.href ? "active" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && <span className="nav-label">{item.label}</span>}
              {hasBadge && (
                <span className="nav-badge">
                  {badges.alertas > 99 ? "99+" : badges.alertas}
                </span>
              )}
            </a>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {!collapsed && (
          <div className="user-info">
            <div className="user-avatar responsable">R</div>
            <div className="user-details">
              <span className="user-name">Usuario Responsable</span>
              <span className="user-role">Responsable</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
