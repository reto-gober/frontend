interface ActionButtonsProps {
  permissions: {
    canSubmit: boolean;
    canValidate: boolean;
    canReject: boolean;
    canRequestCorrection: boolean;
  };
  submitting: boolean;
  onSubmit: () => void;
  onValidate: () => void;
  onRequestCorrection: () => void;
  onReject: () => void;
  hasNewFiles: boolean;
  hasComment: boolean;
}

export default function ActionButtons({
  permissions,
  submitting,
  onSubmit,
  onValidate,
  onRequestCorrection,
  onReject,
  hasNewFiles,
  hasComment,
}: ActionButtonsProps) {
  return (
    <div className="action-buttons">
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => window.history.back()}
        disabled={submitting}
      >
        Volver
      </button>

      {permissions.canSubmit && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={onSubmit}
          disabled={submitting || !hasNewFiles}
          aria-label="Enviar entrega"
        >
          {submitting ? "Enviando..." : "Enviar Entrega"}
        </button>
      )}

      {permissions.canValidate && (
        <button
          type="button"
          className="btn btn-success"
          onClick={onValidate}
          disabled={submitting}
          aria-label="Validar entrega"
        >
          {submitting ? "Validando..." : "Validar Entrega"}
        </button>
      )}

      {permissions.canRequestCorrection && (
        <button
          type="button"
          className="btn btn-warning"
          onClick={onRequestCorrection}
          disabled={submitting || !hasComment}
          aria-label="Solicitar corrección"
        >
          Solicitar Corrección
        </button>
      )}

      {permissions.canReject && (
        <button
          type="button"
          className="btn btn-danger"
          onClick={onReject}
          disabled={submitting}
          aria-label="Rechazar entrega"
        >
          Rechazar
        </button>
      )}

      <style>{`
        .action-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          flex-wrap: wrap;
          padding-top: 1rem;
          border-top: 1px solid var(--neutral-200);
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: 1px solid transparent;
          border-radius: 8px;
          font-size: 0.9375rem;
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
          border-color: var(--neutral-400);
        }

        .btn-primary {
          background: var(--role-accent);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .btn-success {
          background: #10b981;
          color: white;
        }

        .btn-success:hover:not(:disabled) {
          background: #059669;
        }

        .btn-warning {
          background: #f59e0b;
          color: white;
        }

        .btn-warning:hover:not(:disabled) {
          background: #d97706;
        }

        .btn-danger {
          background: #ef4444;
          color: white;
        }

        .btn-danger:hover:not(:disabled) {
          background: #dc2626;
        }

        @media (max-width: 640px) {
          .action-buttons {
            flex-direction: column;
          }

          .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
