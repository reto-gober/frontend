import { useEffect, useRef } from "react";

export type GuideItem = {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  onStart: () => void;
};

interface ManualIndexPanelProps {
  isOpen: boolean;
  onClose: () => void;
  guides: GuideItem[];
  title?: string;
}

export default function ManualIndexPanel({
  isOpen,
  onClose,
  guides,
  title = "Guías interactivas",
}: ManualIndexPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGuideClick = (guide: GuideItem) => {
    onClose();
    // Pequeño delay para que el panel se cierre antes de iniciar el tour
    setTimeout(() => {
      guide.onStart();
    }, 100);
  };

  return (
    <>
      <div className="manual-index-overlay" onClick={onClose} />
      <div className="manual-index-panel" ref={panelRef}>
        <div className="manual-index-header">
          <h3 className="manual-index-title">{title}</h3>
          <button
            className="manual-index-close"
            onClick={onClose}
            aria-label="Cerrar índice de guías"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="manual-index-description">
          Selecciona una guía para conocer las funcionalidades paso a paso.
        </div>

        <div className="manual-index-guides">
          {guides.map((guide) => (
            <button
              key={guide.id}
              className="manual-guide-item"
              onClick={() => handleGuideClick(guide)}
            >
              <div className="manual-guide-icon">
                {guide.icon || (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                )}
              </div>
              <div className="manual-guide-content">
                <h4 className="manual-guide-name">{guide.name}</h4>
                {guide.description && (
                  <p className="manual-guide-description">
                    {guide.description}
                  </p>
                )}
              </div>
              <div className="manual-guide-arrow">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        <div className="manual-index-footer">
          <p className="manual-index-hint">
            💡 Puedes cancelar cualquier guía presionando{" "}
            <kbd className="manual-kbd">ESC</kbd>
          </p>
        </div>
      </div>

      <style>{`
        .manual-index-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(2px);
          z-index: 9998;
          animation: manualFadeIn 0.2s ease-out;
        }

        .manual-index-panel {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 90%;
          max-width: 520px;
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 16px;
          border: 1px solid var(--neutral-200, #e5e7eb);
          box-shadow: 0 24px 48px rgba(15, 23, 42, 0.3),
                      0 8px 16px rgba(15, 23, 42, 0.15);
          z-index: 9999;
          animation: manualSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          max-height: 85vh;
          display: flex;
          flex-direction: column;
        }

        @keyframes manualFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes manualSlideUp {
          from {
            opacity: 0;
            transform: translate(-50%, -45%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }

        .manual-index-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 1.75rem;
          border-bottom: 1px solid var(--neutral-200, #e5e7eb);
        }

        .manual-index-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--neutral-900, #0f172a);
          margin: 0;
        }

        .manual-index-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: var(--neutral-500, #6b7280);
          cursor: pointer;
          transition: all 0.2s;
        }

        .manual-index-close:hover {
          background: var(--neutral-100, #f3f4f6);
          color: var(--neutral-700, #374151);
        }

        .manual-index-description {
          padding: 1rem 1.75rem;
          font-size: 0.875rem;
          color: var(--neutral-600, #475569);
          line-height: 1.5;
          background: var(--role-accent-light, #fff7ed);
          border-bottom: 1px solid var(--neutral-200, #e5e7eb);
        }

        .manual-index-guides {
          padding: 1rem;
          overflow-y: auto;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .manual-guide-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.25rem;
          background: white;
          border: 1.5px solid var(--neutral-200, #e5e7eb);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          width: 100%;
        }

        .manual-guide-item:hover {
          background: var(--role-accent-light, #fff7ed);
          border-color: #F4C453;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(244, 196, 83, 0.25);
        }

        .manual-guide-icon {
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--role-accent-light, #fff7ed);
          border-radius: 10px;
          color: #F4C453;
        }

        .manual-guide-item:hover .manual-guide-icon {
          background: #F4C453;
          color: var(--neutral-900, #0f172a);
        }

        .manual-guide-content {
          flex: 1;
          min-width: 0;
        }

        .manual-guide-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--neutral-900, #0f172a);
          margin: 0 0 0.25rem 0;
        }

        .manual-guide-description {
          font-size: 0.8rem;
          color: var(--neutral-600, #475569);
          margin: 0;
          line-height: 1.4;
        }

        .manual-guide-arrow {
          flex-shrink: 0;
          color: var(--neutral-400, #9ca3af);
          transition: all 0.2s;
        }

        .manual-guide-item:hover .manual-guide-arrow {
          color: #F4C453;
          transform: translateX(3px);
        }

        .manual-index-footer {
          padding: 1rem 1.75rem;
          border-top: 1px solid var(--neutral-200, #e5e7eb);
          background: var(--neutral-50, #f9fafb);
          border-radius: 0 0 16px 16px;
        }

        .manual-index-hint {
          font-size: 0.8rem;
          color: var(--neutral-600, #475569);
          margin: 0;
          text-align: center;
        }

        .manual-kbd {
          display: inline-block;
          padding: 0.15rem 0.4rem;
          background: white;
          border: 1px solid var(--neutral-300, #d1d5db);
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 700;
          font-family: monospace;
          color: var(--neutral-700, #374151);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        @media (max-width: 640px) {
          .manual-index-panel {
            width: 95%;
            max-height: 90vh;
          }

          .manual-index-header {
            padding: 1.25rem 1.25rem;
          }

          .manual-index-description {
            padding: 0.875rem 1.25rem;
          }

          .manual-index-guides {
            padding: 0.75rem;
          }

          .manual-guide-item {
            padding: 0.875rem 1rem;
          }

          .manual-guide-icon {
            width: 40px;
            height: 40px;
          }
        }
      `}</style>
    </>
  );
}
