import { useCallback, useMemo, useState, type DragEvent } from "react";

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  selectedFiles: File[];
  onRemoveFile: (index: number) => void;
  uploadProgress?: Record<string, number>;
  disabled?: boolean;
  maxFiles?: number;
  accept?: string;
  label?: string;
  helperText?: string;
  inputId?: string;
  multiple?: boolean;
}

export default function FileUploadZone({
  onFilesSelected,
  selectedFiles,
  onRemoveFile,
  uploadProgress = {},
  disabled = false,
  maxFiles = 10,
  accept = ".pdf,.zip,.rar,.7z,.doc,.docx,.xlsx,.xls",
  label,
  helperText,
  inputId,
  multiple = true,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputIdToUse = useMemo(
    () => inputId || `file-input-${Math.random().toString(36).slice(2, 8)}`,
    [inputId]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      if (selectedFiles.length + files.length > maxFiles) {
        alert(`Solo puedes subir un maximo de ${maxFiles} archivos`);
        return;
      }

      onFilesSelected(files);
    },
    [disabled, selectedFiles.length, maxFiles, onFilesSelected]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || disabled) return;

      const files = Array.from(e.target.files);
      if (selectedFiles.length + files.length > maxFiles) {
        alert(`Solo puedes subir un maximo de ${maxFiles} archivos`);
        return;
      }

      onFilesSelected(files);
      e.target.value = ""; // Reset input
    },
    [disabled, selectedFiles.length, maxFiles, onFilesSelected]
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="upload-zone-container">
      <div
        className={`upload-dropzone ${isDragging ? "is-dragging" : ""} ${
          disabled ? "is-disabled" : ""
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id={inputIdToUse}
          multiple={multiple}
          accept={accept}
          onChange={handleFileSelect}
          disabled={disabled}
          style={{ display: "none" }}
          aria-label="Seleccionar archivos para subir"
        />
        <label htmlFor={inputIdToUse} className="upload-label">
          <svg
            viewBox="0 0 24 24"
            width="48"
            height="48"
            className="upload-icon"
          >
            <path d="M12 19V5" />
            <polyline points="5 12 12 5 19 12" />
            <rect x="4" y="19" width="16" height="2" rx="1" />
          </svg>
          <div className="upload-text">
            <p className="upload-main-text">
              <strong>{label ?? "Arrastra archivos aqui"}</strong> o haz clic para seleccionar
            </p>
            <p className="upload-sub-text">
              {helperText ?? `Archivos permitidos segun el filtro de extensiones${multiple ? ` (Max. ${maxFiles})` : ""}`}
            </p>
          </div>
        </label>
      </div>

      {selectedFiles.length > 0 && (
        <div className="selected-files-list">
          <h4>Archivos seleccionados ({selectedFiles.length})</h4>
          {selectedFiles.map((file, index) => {
            const progress = uploadProgress[file.name];
            const isUploading = progress !== undefined && progress < 100;

            return (
              <div key={`${file.name}-${index}`} className="file-item">
                <div className="file-info">
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    className="file-icon"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                  </svg>
                  <div className="file-details">
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">{formatFileSize(file.size)}</span>
                  </div>
                </div>

                {isUploading ? (
                  <div className="progress-container">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="progress-text">{progress}%</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onRemoveFile(index)}
                    className="btn-remove"
                    disabled={disabled}
                    aria-label={`Eliminar ${file.name}`}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .upload-zone-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .upload-dropzone {
          border: 2px dashed var(--neutral-300);
          border-radius: 12px;
          padding: 2rem;
          background: var(--neutral-50);
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .upload-dropzone.is-dragging {
          border-color: var(--role-accent);
          background: var(--role-accent-light, rgba(var(--role-accent-rgb), 0.1));
          transform: scale(1.02);
        }

        .upload-dropzone.is-disabled {
          opacity: 0.5;
          cursor: not-allowed;
          pointer-events: none;
        }

        .upload-dropzone:not(.is-disabled):hover {
          border-color: var(--role-accent);
          background: white;
        }

        .upload-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          cursor: pointer;
        }

        .upload-icon {
          stroke: var(--role-accent, var(--neutral-500));
          fill: none;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .upload-text {
          text-align: center;
        }

        .upload-main-text {
          margin: 0 0 0.5rem 0;
          color: var(--neutral-900);
          font-size: 1rem;
        }

        .upload-sub-text {
          margin: 0;
          color: var(--neutral-600);
          font-size: 0.875rem;
        }

        .selected-files-list {
          background: white;
          border: 1px solid var(--neutral-200);
          border-radius: 12px;
          padding: 1rem;
        }

        .selected-files-list h4 {
          margin: 0 0 1rem 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--neutral-700);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .file-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          border-radius: 8px;
          background: var(--neutral-50);
          margin-bottom: 0.5rem;
        }

        .file-item:last-child {
          margin-bottom: 0;
        }

        .file-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex: 1;
          min-width: 0;
        }

        .file-icon {
          stroke: var(--role-accent, var(--neutral-500));
          fill: none;
          stroke-width: 2;
          flex-shrink: 0;
        }

        .file-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          min-width: 0;
        }

        .file-name {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--neutral-900);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .file-size {
          font-size: 0.75rem;
          color: var(--neutral-600);
        }

        .progress-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          min-width: 150px;
        }

        .progress-bar {
          flex: 1;
          height: 6px;
          background: var(--neutral-200);
          border-radius: 999px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: var(--role-accent);
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--role-accent);
          min-width: 40px;
          text-align: right;
        }

        .btn-remove {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: 1px solid var(--neutral-300);
          border-radius: 6px;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .btn-remove svg {
          stroke: var(--neutral-600);
          stroke-width: 2;
          stroke-linecap: round;
        }

        .btn-remove:hover:not(:disabled) {
          border-color: var(--error-red-400);
          background: var(--error-red-50);
        }

        .btn-remove:hover:not(:disabled) svg {
          stroke: var(--error-red-600);
        }

        .btn-remove:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 640px) {
          .upload-dropzone {
            padding: 1.5rem 1rem;
          }

          .upload-icon {
            width: 36px;
            height: 36px;
          }

          .progress-container {
            min-width: 100px;
          }

          .file-item {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
