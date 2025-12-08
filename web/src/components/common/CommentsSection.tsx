// Componente de sección de comentarios estilo conversación
// TODO: Implementar completamente según especificaciones
// Por ahora, placeholder para estructura básica

import { useState } from "react";

interface Comment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  role: string;
  timestamp: string;
  isOfficial?: boolean;
}

interface CommentsSectionProps {
  periodoId: string;
  currentUser: any;
  isVisible: boolean;
  onToggle: () => void;
}

export default function CommentsSection({
  periodoId,
  currentUser,
  isVisible,
  onToggle,
}: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  return (
    <div className="comments-section">
      <button onClick={onToggle} className="comments-toggle">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span>Conversación ({comments.length})</span>
        <svg viewBox="0 0 24 24" width="16" height="16" className={isVisible ? "rotated" : ""}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isVisible && (
        <div className="comments-content">
          <p className="comments-placeholder">Sección de comentarios en desarrollo</p>
        </div>
      )}

      <style>{`
        .comments-section {
          background: white;
          border: 1px solid var(--neutral-200);
          border-radius: 12px;
          overflow: hidden;
        }

        .comments-toggle {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--neutral-900);
          transition: background 0.2s ease;
        }

        .comments-toggle:hover {
          background: var(--neutral-50);
        }

        .comments-toggle svg:first-child {
          stroke: var(--role-accent);
          fill: none;
          stroke-width: 2;
        }

        .comments-toggle svg:last-child {
          stroke: var(--neutral-600);
          fill: none;
          stroke-width: 2;
          margin-left: auto;
          transition: transform 0.2s ease;
        }

        .comments-toggle svg.rotated {
          transform: rotate(180deg);
        }

        .comments-content {
          padding: 1rem 1.25rem;
          border-top: 1px solid var(--neutral-200);
        }

        .comments-placeholder {
          margin: 2rem 0;
          text-align: center;
          color: var(--neutral-500);
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}
