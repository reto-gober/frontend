import { useEffect, useState } from "react";
import {
  entidadesService,
  type EntidadImportError,
  type EntidadImportLogResponse,
  type EntidadImportPreview,
  type EntidadImportResponseDto,
  type EntidadRequest,
  type EntidadResponse,
  type Page,
} from "../lib/services";
import {
  Building2,
  Edit,
  Trash2,
  Plus,
  Upload,
  FileDown,
  History,
} from "lucide-react";
import { useToast, ToastContainer } from "./Toast";
import notifications from "../lib/notifications";

type ImportStep = "seleccion" | "preview";

export default function EntidadesList() {
  const [entidades, setEntidades] = useState<EntidadResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toasts, removeToast, success, error: showError } = useToast();
  const [formData, setFormData] = useState<EntidadRequest>({
    nit: "",
    nombre: "",
    paginaWeb: "",
    baseLegal: "",
    observaciones: "",
    estado: "ACTIVO",
  });

  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState<ImportStep>("seleccion");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<EntidadImportPreview[]>([]);
  const [importErrors, setImportErrors] = useState<EntidadImportError[]>([]);
  const [importStats, setImportStats] = useState<EntidadImportResponseDto | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importHistory, setImportHistory] = useState<EntidadImportLogResponse[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    loadEntidades();
    loadImportHistory();
  }, []);

  const loadEntidades = async () => {
    setLoading(true);
    try {
      const data: Page<EntidadResponse> = await entidadesService.listar();
      setEntidades(data.content || []);
    } catch (err) {
      console.error("Error loading entidades:", err);
      setEntidades([]);
      showError("Error al cargar las entidades");
    } finally {
      setLoading(false);
    }
  };

  const loadImportHistory = async () => {
    setHistoryLoading(true);
    try {
      const data: Page<EntidadImportLogResponse> = await entidadesService.historialImportaciones(0, 5);
      setImportHistory(data.content || []);
    } catch (err) {
      console.error("Error loading import history", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const resetImportState = () => {
    setImportStep("seleccion");
    setSelectedFile(null);
    setImportPreview([]);
    setImportErrors([]);
    setImportStats(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await entidadesService.actualizar(editingId, formData);
        success("Entidad actualizada exitosamente");
      } else {
        await entidadesService.crear(formData);
        success("Entidad creada exitosamente");
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        nit: "",
        nombre: "",
        paginaWeb: "",
        baseLegal: "",
        observaciones: "",
        estado: "ACTIVO",
      });
      loadEntidades();
    } catch (err: any) {
      showError(err.response?.data?.mensaje || "Error al guardar la entidad");
    }
  };

  const handleEdit = (entidad: EntidadResponse) => {
    setFormData({
      nit: entidad.nit,
      nombre: entidad.nombre,
      paginaWeb: entidad.paginaWeb,
      baseLegal: entidad.baseLegal,
      observaciones: entidad.observaciones,
      estado: entidad.estado,
    });
    setEditingId(entidad.entidadId);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await notifications.confirm(
      "Esta acción no se puede deshacer",
      "¿Eliminar entidad?",
      "Sí, eliminar",
      "Cancelar"
    );
    if (!confirmed) return;

    try {
      await entidadesService.eliminar(id);
      success("Entidad eliminada exitosamente");
      loadEntidades();
    } catch (err: any) {
      showError(err.response?.data?.mensaje || "Error al eliminar la entidad");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      nit: "",
      nombre: "",
      paginaWeb: "",
      baseLegal: "",
      observaciones: "",
      estado: "ACTIVO",
    });
  };

  const onFileSelected = async (file: File) => {
    setSelectedFile(file);
    setImportLoading(true);
    setImportPreview([]);
    setImportErrors([]);
    setImportStats(null);

    try {
      const result = await entidadesService.importarArchivo(file, false);
      setImportPreview(result.preview || []);
      setImportErrors(result.errores || []);
      setImportStats(result);
      setImportStep("preview");
      if (!result.valid) {
        showError("El archivo tiene observaciones. Corrige los errores para continuar.");
      }
    } catch (err: any) {
      showError(
        err.response?.data?.message ||
        err.response?.data?.mensaje ||
        "No se pudo analizar el archivo"
      );
    } finally {
      setImportLoading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleConfirmImport = async () => {
    if (!selectedFile || !importStats?.valid) {
      showError("Carga un archivo válido antes de confirmar");
      return;
    }

    setImportLoading(true);
    try {
      const result = await entidadesService.importarArchivo(selectedFile, true);
      if (result.valid) {
        success(`Importación completada: ${result.registrosValidos} entidades creadas.`);
        setShowImportModal(false);
        resetImportState();
        loadEntidades();
        loadImportHistory();
      } else {
        setImportErrors(result.errores || []);
        setImportStats(result);
        showError("La importación se detuvo por errores en el archivo.");
      }
    } catch (err: any) {
      showError(
        err.response?.data?.message ||
        err.response?.data?.mensaje ||
        "No se pudo completar la importación"
      );
    } finally {
      setImportLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await entidadesService.descargarPlantilla();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "plantilla-entidades.xlsx";
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showError("No se pudo descargar la plantilla");
    }
  };

  const renderImportModal = () => {
    if (!showImportModal) return null;

    return (
      <div className="modal-overlay" role="dialog" aria-modal="true">
        <div className="modal-content import-modal">
          <div className="modal-header">
            <div>
              <h3 className="modal-title">Importar entidades</h3>
              <p className="modal-subtitle">
                Carga un archivo .xlsx o .csv con las columnas nit, nombre, paginaWeb,
                baseLegal, observaciones y estado.
              </p>
            </div>
            <button
              className="modal-close-btn"
              onClick={() => {
                setShowImportModal(false);
                resetImportState();
              }}
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>

          <div className="modal-body">
            <div
              className={`import-dropzone ${importStep === "preview" ? "compressed" : ""}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <Upload size={24} />
              <p className="import-title">Arrastra y suelta tu archivo aquí</p>
              <p className="import-subtitle">Formatos permitidos: .xlsx, .csv</p>
              <label className="btn btn-sm btn-secondary" style={{ marginTop: "0.5rem" }}>
                Seleccionar archivo
                <input type="file" accept=".xlsx,.csv" onChange={handleFileInput} hidden />
              </label>
              {selectedFile && (
                <p className="import-file">
                  Archivo seleccionado: <strong>{selectedFile.name}</strong>
                </p>
              )}
            </div>

            {importStats && (
              <div className="import-stats">
                <div>
                  <span className="label">Filas detectadas</span>
                  <strong>{importStats.totalRegistros}</strong>
                </div>
                <div>
                  <span className="label">Registros válidos</span>
                  <strong className="text-success">{importStats.registrosValidos}</strong>
                </div>
                <div>
                  <span className="label">Registros inválidos</span>
                  <strong className="text-danger">{importStats.registrosInvalidos}</strong>
                </div>
                <div>
                  <span className="label">Filas ignoradas</span>
                  <strong>{importStats.filasIgnoradas}</strong>
                </div>
              </div>
            )}

            {importPreview.length > 0 && (
              <div className="import-preview">
                <div className="preview-header">
                  <h4>Vista previa (primeros 10 registros)</h4>
                  <span className="badge badge-neutral">{importPreview.length} filas</span>
                </div>
                <div className="import-table-wrapper">
                  <table className="import-table">
                    <thead>
                      <tr>
                        <th>NIT</th>
                        <th>Nombre</th>
                        <th>Página</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.map((row, idx) => (
                        <tr key={`${row.nit}-${idx}`}>
                          <td>{row.nit}</td>
                          <td>{row.nombre}</td>
                          <td>{row.paginaWeb || "-"}</td>
                          <td>{row.estado}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {importErrors.length > 0 && (
              <div className="import-errors">
                <h4>Errores encontrados</h4>
                <ul>
                  {importErrors.map((err) => (
                    <li key={`${err.fila}-${err.mensaje}`}>
                      <span className="badge badge-pendiente">Fila {err.fila}</span>
                      <span>{err.mensaje}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="modal-footer import-footer">
            <div className="footer-left">
              <button className="btn btn-link" onClick={handleDownloadTemplate}>
                <FileDown size={16} /> Descargar plantilla
              </button>
              <button className="btn btn-link" onClick={resetImportState} disabled={importLoading}>
                Reiniciar
              </button>
            </div>
            <div className="footer-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowImportModal(false);
                  resetImportState();
                }}
                disabled={importLoading}
              >
                Cancelar
              </button>
              <button
                className="btn btn-orange"
                disabled={importLoading || !selectedFile || !!importErrors.length || !importStats?.valid}
                onClick={handleConfirmImport}
              >
                {importLoading ? "Procesando..." : "Importar ahora"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        Cargando entidades...
      </div>
    );
  }

  return (
    <div className="entidades-container">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className="entidades-header">
        <div>
          <h2 className="entidades-title">Entidades de Control</h2>
          <p className="entidades-subtitle">Gestiona las entidades regulatorias</p>
        </div>
        <div className="header-actions">
          <button
            onClick={() => {
              resetImportState();
              setShowImportModal(true);
            }}
            className="btn btn-secondary"
          >
            <Upload size={16} /> Importar Entidades
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-orange"
            disabled={showForm}
          >
            <Plus size={16} />
            Nueva Entidad
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card mb-2">
          <h3 className="form-subtitle">{editingId ? "Editar Entidad" : "Nueva Entidad"}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">NIT *</label>
              <input
                type="text"
                className="form-input"
                value={formData.nit}
                onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input
                type="text"
                className="form-input"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Página Web *</label>
              <input
                type="url"
                className="form-input"
                value={formData.paginaWeb}
                onChange={(e) => setFormData({ ...formData, paginaWeb: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Base Legal *</label>
              <textarea
                className="form-textarea"
                value={formData.baseLegal}
                onChange={(e) => setFormData({ ...formData, baseLegal: e.target.value })}
                rows={3}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Observaciones *</label>
              <textarea
                className="form-textarea"
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                rows={3}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Estado *</label>
              <select
                className="form-input"
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                required
              >
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
              </select>
            </div>

            <div className="form-actions-inline">
              <button type="submit" className="btn btn-orange">
                {editingId ? "Actualizar" : "Crear"}
              </button>
              <button type="button" onClick={handleCancel} className="btn btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-header-flex">
          <div>
            <h3 className="card-title">Historial de cargas masivas</h3>
            <p className="card-subtitle">Últimas 5 importaciones</p>
          </div>
          <button className="btn btn-sm btn-secondary" onClick={loadImportHistory} disabled={historyLoading}>
            <History size={14} /> Refrescar
          </button>
        </div>
        {importHistory.length === 0 ? (
          <p className="muted">Aún no hay importaciones registradas.</p>
        ) : (
          <div className="import-history-table-wrapper">
            <table className="import-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Usuario</th>
                  <th>Archivo</th>
                  <th>Válidos</th>
                  <th>Inválidos</th>
                </tr>
              </thead>
              <tbody>
                {importHistory.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.fecha).toLocaleString()}</td>
                    <td>{log.usuarioNombre || "-"}</td>
                    <td>{log.archivoNombre || "-"}</td>
                    <td className="text-success">{log.registrosValidos}</td>
                    <td className="text-danger">{log.registrosInvalidos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {entidades.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <p style={{ color: "var(--color-text-light)" }}>No hay entidades registradas.</p>
        </div>
      ) : (
        <div className="entidades-grid">
          {entidades.map((entidad) => (
            <div key={entidad.entidadId} className="entidad-card">
              <div className="entidad-card-header">
                <div className="entidad-icon">
                  <Building2 size={24} />
                </div>
                <div className="entidad-info">
                  <h3 className="entidad-name">{entidad.nombre}</h3>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--color-text-light)",
                      marginTop: "0.25rem",
                    }}
                  >
                    NIT: {entidad.nit}
                  </p>
                </div>
                <div>
                  {entidad.estado === "ACTIVO" || entidad.estado?.toLowerCase() === "activo" ? (
                    <span className="badge badge-enviado">Activo</span>
                  ) : (
                    <span className="badge badge-pendiente">Inactivo</span>
                  )}
                </div>
              </div>

              <div
                style={{
                  marginTop: "1rem",
                  fontSize: "0.875rem",
                  color: "var(--color-text)",
                }}
              >
                {entidad.paginaWeb && (
                  <p style={{ marginBottom: "0.5rem" }}>
                    <strong>Web:</strong>{" "}
                    <a href={entidad.paginaWeb} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>
                      {entidad.paginaWeb}
                    </a>
                  </p>
                )}
                {entidad.baseLegal && (
                  <p style={{ marginBottom: "0.5rem" }}>
                    <strong>Base Legal:</strong> {entidad.baseLegal}
                  </p>
                )}
                {entidad.observaciones && (
                  <p style={{ marginBottom: "0.5rem" }}>
                    <strong>Observaciones:</strong> {entidad.observaciones}
                  </p>
                )}
              </div>

              <div className="entidad-actions">
                <button onClick={() => handleEdit(entidad)} className="btn btn-sm btn-secondary">
                  <Edit size={14} />
                  Editar
                </button>
                <button onClick={() => handleDelete(entidad.entidadId)} className="btn btn-sm btn-danger">
                  <Trash2 size={14} />
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {renderImportModal()}
    </div>
  );
}
