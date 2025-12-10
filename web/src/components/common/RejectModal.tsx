import { useState, useEffect } from "react";

interface RejectModalProps {
  onConfirm: (motivo: string) => void;
  onCancel: () => void;
  submitting: boolean;
}

export default function RejectModal({
  onConfirm,
  onCancel,
  submitting,
}: RejectModalProps) {
  const [motivo, setMotivo] = useState("");

  // Manejar tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [submitting, onCancel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (motivo.trim().length < 10) {
      alert("El motivo debe tener al menos 10 caracteres");
      return;
    }
    onConfirm(motivo);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <h3>Rechazar Entrega</h3>
            <button
              type="button"
              onClick={onCancel}
              className="btn-close"
              aria-label="Cerrar"
            >
              <svg viewBox="0 0 24 24" width="24" height="24">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="modal-body">
            <p className="modal-description">
              Esta acción rechazará la entrega y notificará al responsable. Por favor,
              proporciona un motivo detallado del rechazo.
            </p>

            <div className="form-group">
              <label htmlFor="motivo-rechazo">
                Motivo del rechazo <span className="required">*</span>
              </label>
              <textarea
                id="motivo-rechazo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={5}
                placeholder="Explica claramente los motivos del rechazo..."
                required
                minLength={10}
                maxLength={2000}
                disabled={submitting}
              />
              <div className="char-counter">
                {motivo.length} / 2000 caracteres (mínimo 10)
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              disabled={submitting || motivo.trim().length < 10}
            >
              {submitting ? "Rechazando..." : "Confirmar Rechazo"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow: auto;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
                      0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 1.25rem;
          border-bottom: 1px solid var(--neutral-200);
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--neutral-900);
        }

        .btn-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 6px;
          background: transparent;
          cursor: pointer;
          flex-shrink: 0;
        }

        .btn-close svg {
          stroke: var(--neutral-600);
          stroke-width: 2;
        }

        .btn-close:hover {
          background: var(--neutral-100);
        }

        .modal-body {
          padding: 1.25rem;
        }

        .modal-description {
          margin: 0 0 1.5rem 0;
          color: var(--neutral-700);
          font-size: 0.9375rem;
          line-height: 1.6;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--neutral-900);
        }

        .required {
          color: #ef4444;
        }

        textarea {
          width: 100%;
          border: 1px solid var(--neutral-300);
          border-radius: 8px;
          padding: 0.75rem;
          font-family: inherit;
          font-size: 0.9375rem;
          color: var(--neutral-900);
          resize: vertical;
        }

        textarea:focus {
          outline: none;
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }

        textarea:disabled {
          background: var(--neutral-50);
          cursor: not-allowed;
        }

        .char-counter {
          font-size: 0.75rem;
          color: var(--neutral-500);
          text-align: right;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding: 1.25rem;
          border-top: 1px solid var(--neutral-200);
        }

        .btn {
          padding: 0.625rem 1.25rem;
          border: 1px solid transparent;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: white;
          border-color: var(--neutral-300);
          color: var(--neutral-700);
        }

        .btn-secondary:hover:not(:disabled) {
          background: var(--neutral-50);
        }

        .btn-danger {
          background: #ef4444;
          color: white;
        }

        .btn-danger:hover:not(:disabled) {
          background: #dc2626;
        }

        @media (max-width: 640px) {
          .modal-footer {
            flex-direction: column-reverse;
          }

          .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
