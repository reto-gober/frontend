import { useEffect, useMemo, useState } from 'react';
import {
  flujoReportesService,
  evidenciasService,
  type Page,
  type ReportePeriodo,
  type EvidenciaResponse,
} from '../../lib/services';
import notifications from '../../lib/notifications';

interface Props {
  onIntervenir: (periodo: ReportePeriodo) => void;
}

type EstadoTab =
  | 'all'
  | 'pendiente_validacion'
  | 'aprobado'
  | 'requiere_correccion'
  | 'enviado'
  | 'enviado_tarde';

export default function AdminReportesEnviados({ onIntervenir }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportes, setReportes] = useState<ReportePeriodo[]>([]);
  const [page, setPage] = useState(0);
  const [size] = useState(12);
  const [totalElements, setTotalElements] = useState(0);

  const [estadoTab, setEstadoTab] = useState<EstadoTab>('all');
  const [filtroResponsable, setFiltroResponsable] = useState('');
  const [filtroEntidad, setFiltroEntidad] = useState('');
  const [filtroFrecuencia, setFiltroFrecuencia] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [responsables, setResponsables] = useState<{ id: string; nombre: string }[]>([]);
  const [entidades, setEntidades] = useState<{ id: string; nombre: string }[]>([]);
  const [frecuencias, setFrecuencias] = useState<string[]>([]);

  const [periodoExpandido, setPeriodoExpandido] = useState<string | null>(null);
  const [evidenciasPorPeriodo, setEvidenciasPorPeriodo] = useState<Record<string, EvidenciaResponse[]>>({});
  const [cargandoEvidencias, setCargandoEvidencias] = useState<Record<string, boolean>>({});

  useEffect(() => {
    cargarDatos(true);
  }, []);

  useEffect(() => {
    cargarDatos(false);
  }, [page, estadoTab, filtroResponsable, filtroEntidad]);

  const cargarDatos = async (inicial: boolean) => {
    try {
      setLoading(true);
      setError(null);

      const estadoParam = estadoTab === 'all' || estadoTab === 'enviado_tarde' ? undefined : estadoTab;
      const data: Page<ReportePeriodo> = await flujoReportesService.supervisionConFiltros(
        page,
        size,
        estadoParam,
        filtroResponsable || undefined,
        filtroEntidad || undefined
      );

      setReportes(data.content);
      setTotalElements(data.totalElements);

      if (inicial) {
        // construir filtros únicos
        const resp = new Map<string, string>();
        const ents = new Set<string>();
        const freqs = new Set<string>();
        data.content.forEach((r) => {
          if (r.responsableElaboracion?.usuarioId && r.responsableElaboracion?.nombreCompleto) {
            resp.set(r.responsableElaboracion.usuarioId, r.responsableElaboracion.nombreCompleto);
          }
          if (r.responsableSupervision?.usuarioId && r.responsableSupervision?.nombreCompleto) {
            resp.set(r.responsableSupervision.usuarioId, r.responsableSupervision.nombreCompleto);
          }
          if (r.entidadNombre) ents.add(r.entidadNombre);
          if (r.frecuencia || r.periodoTipo) freqs.add((r.frecuencia || r.periodoTipo || '').toUpperCase());
        });
        setResponsables(Array.from(resp.entries()).map(([id, nombre]) => ({ id, nombre })));
        setEntidades(Array.from(ents).map((nombre) => ({ id: nombre, nombre })));
        setFrecuencias(Array.from(freqs));
      }
    } catch (err: any) {
      console.error('Error cargando reportes enviados (admin):', err);
      setError(err.response?.data?.message || 'Error al cargar reportes enviados');
    } finally {
      setLoading(false);
    }
  };

  const toggleDetalle = async (periodo: ReportePeriodo) => {
    if (periodoExpandido === periodo.periodoId) {
      setPeriodoExpandido(null);
      return;
    }

    setPeriodoExpandido(periodo.periodoId);

    if (evidenciasPorPeriodo[periodo.periodoId]) return;

    setCargandoEvidencias((prev) => ({ ...prev, [periodo.periodoId]: true }));
    try {
      const lista = await evidenciasService.listarPorReporte(periodo.reporteId);
      const filtradas = Array.isArray(lista)
        ? lista.filter((ev: any) => !ev.periodoId || ev.periodoId === periodo.periodoId)
        : [];
      setEvidenciasPorPeriodo((prev) => ({ ...prev, [periodo.periodoId]: filtradas }));
    } catch (err) {
      console.error('Error cargando evidencias', err);
      notifications.error('No se pudieron cargar las evidencias');
    } finally {
      setCargandoEvidencias((prev) => ({ ...prev, [periodo.periodoId]: false }));
    }
  };

  const formatearFecha = (fecha?: string) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '');
  };

  const calcularDiasRestantes = (fechaVencimiento: string): { dias: number; clase: string } => {
    const hoy = new Date();
    const venc = new Date(fechaVencimiento);
    const diff = Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { dias: diff, clase: 'vencido' };
    if (diff === 0) return { dias: diff, clase: 'hoy' };
    if (diff <= 3) return { dias: diff, clase: 'urgente' };
    if (diff <= 7) return { dias: diff, clase: 'proximo' };
    return { dias: diff, clase: 'normal' };
  };

  const getEstadoBadge = (periodo: ReportePeriodo) => {
    const estado = (periodo.estado || '').toLowerCase();
    const esTarde = typeof periodo.diasDesviacion === 'number' && periodo.diasDesviacion > 0;
    if (estadoTab === 'enviado_tarde' || esTarde) {
      return { clase: 'warning', texto: 'Enviado tarde' };
    }
    const map: Record<string, { clase: string; texto: string }> = {
      pendiente_validacion: { clase: 'pending', texto: 'Pendiente' },
      en_revision: { clase: 'warning', texto: 'En Revisión' },
      aprobado: { clase: 'success', texto: 'Aprobado' },
      requiere_correccion: { clase: 'danger', texto: 'Con Observaciones' },
      enviado: { clase: 'sent', texto: 'Enviado a Entidad' },
      enviado_entidad: { clase: 'sent', texto: 'Enviado a Entidad' },
    };
    return map[estado] || { clase: 'neutral', texto: periodo.estado };
  };

  const reportesFiltrados = useMemo(() => {
    let data = [...reportes];

    if (estadoTab === 'enviado_tarde') {
      data = data.filter((r) => typeof r.diasDesviacion === 'number' && r.diasDesviacion > 0);
    }

    if (filtroFrecuencia) {
      data = data.filter((r) => (r.frecuencia || r.periodoTipo || '').toUpperCase() === filtroFrecuencia.toUpperCase());
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(
        (r) =>
          r.reporteNombre?.toLowerCase().includes(term) ||
          r.entidadNombre?.toLowerCase().includes(term) ||
          r.responsableElaboracion?.nombreCompleto?.toLowerCase().includes(term) ||
          r.responsableSupervision?.nombreCompleto?.toLowerCase().includes(term)
      );
    }

    return data;
  }, [reportes, estadoTab, filtroFrecuencia, searchTerm]);

  return (
    <div className="reportes-page" style={{ padding: 0 }}>
      <div className="filtros-card" style={{ marginBottom: '1rem' }}>
        <div className="chips-estados" style={{ marginBottom: '1rem' }}>
          {[
            { id: 'all', label: 'Todos' },
            { id: 'pendiente_validacion', label: 'Pendientes' },
            { id: 'aprobado', label: 'Aprobados' },
            { id: 'requiere_correccion', label: 'Con Observaciones' },
            { id: 'enviado', label: 'Enviados' },
            { id: 'enviado_tarde', label: 'Enviados tarde' },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`chip-estado ${estadoTab === tab.id ? 'active' : ''}`}
              onClick={() => {
                setEstadoTab(tab.id as EstadoTab);
                setPage(0);
              }}
              style={{ padding: '0.65rem 1.25rem' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="fila-busqueda" style={{ gap: '1rem', flexWrap: 'wrap' }}>
          <div className="search-box-principal" style={{ flex: '1 1 300px' }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por reporte, entidad o usuario..."
              className="search-input-principal"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filtros-secundarios" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select
              className="filter-select-mejorado"
              value={filtroResponsable}
              onChange={(e) => {
                setFiltroResponsable(e.target.value);
                setPage(0);
              }}
            >
              <option value="">Todos los responsables</option>
              {responsables.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
            </select>
            <select
              className="filter-select-mejorado"
              value={filtroEntidad}
              onChange={(e) => {
                setFiltroEntidad(e.target.value);
                setPage(0);
              }}
            >
              <option value="">Todas las entidades</option>
              {entidades.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </select>
            <select
              className="filter-select-mejorado"
              value={filtroFrecuencia}
              onChange={(e) => {
                setFiltroFrecuencia(e.target.value);
                setPage(0);
              }}
            >
              <option value="">Todas las frecuencias</option>
              {frecuencias.map((f) => (
                <option key={f} value={f}>
                  {f.charAt(0) + f.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <div className="loading-container">
          <div className="loading-spinner" />
          <p className="loading-text">Cargando reportes enviados...</p>
        </div>
      )}

      {!loading && error && reportesFiltrados.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--error-red-600)' }}>
          {error}
        </div>
      )}

      {!loading && reportesFiltrados.length === 0 && !error && (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <p className="empty-text">No hay reportes para los filtros seleccionados</p>
        </div>
      )}

      {!loading && reportesFiltrados.length > 0 && (
        <div className="reports-grid-mejorado">
          {reportesFiltrados.map((reporte) => {
            const estadoBadge = getEstadoBadge(reporte);
            const { dias, clase } = calcularDiasRestantes(reporte.fechaVencimientoCalculada);
            const esTarde = typeof reporte.diasDesviacion === 'number' && reporte.diasDesviacion > 0;
            return (
              <div key={reporte.periodoId} className="report-card-mejorada">
                <div className={`card-barra-estado ${estadoBadge.clase}`}></div>
                <div className="card-header-mejorado">
                  <div className="card-info-superior">
                    <h3 className="card-titulo-mejorado">{reporte.reporteNombre}</h3>
                    <span className={`badge-estado-mejorado ${estadoBadge.clase}`}>
                      {estadoBadge.texto}
                    </span>
                  </div>
                  <div className="card-meta-superior">
                    <span className="meta-frecuencia">{reporte.periodoTipo || reporte.frecuencia}</span>
                    <span className="meta-separador">•</span>
                    <span className={`meta-vencimiento ${clase}`}>
                      {clase === 'vencido'
                        ? `Vencido hace ${Math.abs(dias)}d`
                        : clase === 'hoy'
                        ? 'Vence hoy'
                        : clase === 'urgente'
                        ? `Vence en ${dias}d`
                        : `Vence ${formatearFecha(reporte.fechaVencimientoCalculada)}`}
                    </span>
                  </div>
                </div>

                <div className="card-body-mejorado">
                  <div className="info-clave">
                    <div className="info-item">
                      <span className="info-label">Entidad:</span>
                      <span className="info-value">{reporte.entidadNombre}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Elabora:</span>
                      <span className="info-value">{reporte.responsableElaboracion?.nombreCompleto || 'Sin asignar'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Supervisa:</span>
                      <span className="info-value">{reporte.responsableSupervision?.nombreCompleto || 'Sin asignar'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Periodo:</span>
                      <span className="info-value">
                        {formatearFecha(reporte.periodoInicio)} → {formatearFecha(reporte.periodoFin)}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Envío real:</span>
                      <span className={`info-value ${esTarde ? 'text-danger' : ''}`}>
                        {formatearFecha(reporte.fechaEnvioReal || '')}
                        {esTarde ? ` (+${reporte.diasDesviacion}d)` : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="card-footer-mejorado">
                  <div className="acciones-card">
                    <button className="btn-detalle-mejorado" onClick={() => toggleDetalle(reporte)}>
                      {periodoExpandido === reporte.periodoId ? 'Cerrar periodo' : 'Abrir periodo'}
                    </button>
                    <button className="btn-detalle-mejorado" onClick={() => onIntervenir(reporte)}>
                      Intervenir / Cargar
                    </button>
                  </div>
                </div>

                {periodoExpandido === reporte.periodoId && (
                  <div className="periodo-detalle-expansion">
                    <div className="detalle-columns">
                      <div className="detalle-tarjeta">
                        <h4>Fechas del período</h4>
                        <div className="dato-fila"><span className="dato-label">Inicio</span><span className="dato-value">{formatearFecha(reporte.periodoInicio)}</span></div>
                        <div className="dato-fila"><span className="dato-label">Fin</span><span className="dato-value">{formatearFecha(reporte.periodoFin)}</span></div>
                        <div className="dato-fila"><span className="dato-label">Vencimiento</span><span className="dato-value destaque-naranja">{formatearFecha(reporte.fechaVencimientoCalculada)}</span></div>
                        <div className="dato-fila"><span className="dato-label">Envío real</span><span className="dato-value destaque-verde">{reporte.fechaEnvioReal ? formatearFecha(reporte.fechaEnvioReal) : 'No enviado'}</span></div>
                        {typeof reporte.diasDesviacion === 'number' && (
                          <div className="dato-fila"><span className="dato-label">Desviación</span><span className={`dato-value ${reporte.diasDesviacion > 0 ? 'destaque-rojo' : 'destaque-verde'}`}>
                            {reporte.diasDesviacion > 0 ? `+${reporte.diasDesviacion} días` : 'Enviado a tiempo'}
                          </span></div>
                        )}
                      </div>

                      <div className="detalle-tarjeta">
                        <h4>Equipo responsable</h4>
                        <div className="responsable-item"><div className="responsable-rol">Elabora</div><div className="responsable-nombre">{reporte.responsableElaboracion?.nombreCompleto || 'Sin asignar'}</div></div>
                        <div className="responsable-item"><div className="responsable-rol">Supervisa</div><div className="responsable-nombre">{reporte.responsableSupervision?.nombreCompleto || 'Sin asignar'}</div></div>
                        {reporte.entidadNombre && (
                          <div className="responsable-item"><div className="responsable-rol">Entidad</div><div className="responsable-nombre">{reporte.entidadNombre}</div></div>
                        )}
                      </div>
                    </div>

                    <div className="detalle-tarjeta">
                      <h4>Evidencias</h4>
                      {cargandoEvidencias[reporte.periodoId] && <p style={{ color: '#64748b' }}>Cargando evidencias...</p>}
                      {!cargandoEvidencias[reporte.periodoId] && (evidenciasPorPeriodo[reporte.periodoId]?.length || 0) === 0 && (
                        <p style={{ color: '#64748b' }}>No hay evidencias adjuntas</p>
                      )}
                      {!cargandoEvidencias[reporte.periodoId] && (evidenciasPorPeriodo[reporte.periodoId]?.length || 0) > 0 && (
                        <div className="evidencias-lista">
                          {evidenciasPorPeriodo[reporte.periodoId].map((ev) => (
                            <div key={ev.id} className="evidencia-item">
                              <div>
                                <div className="evidencia-nombre">{ev.nombreArchivo}</div>
                                <div className="evidencia-meta">{((ev.tamano || 0) / 1024).toFixed(0)} KB · {formatearFecha(ev.creadoEn)}</div>
                              </div>
                              <button className="btn-detalle-mejorado" onClick={() => evidenciasService.descargar(ev.id)}>Descargar</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="detalle-tarjeta">
                      <h4>Historial de comentarios</h4>
                      {reporte.comentarios ? (
                        <div className="comentario-item">
                          <div className="comentario-header">Sistema · {formatearFecha(reporte.updatedAt)}</div>
                          <div className="comentario-texto">{reporte.comentarios}</div>
                        </div>
                      ) : (
                        <p style={{ color: '#64748b' }}>Sin comentarios registrados</p>
                      )}
                    </div>

                    <div className="detalle-tarjeta acciones">
                      <h4>Acciones del Administrador</h4>
                      <div className="acciones-flex">
                        <button className="btn-detalle-mejorado" onClick={() => onIntervenir(reporte)}>Intervenir / Cargar</button>
                        <button className="btn-detalle-mejorado" onClick={() => notifications.info('Función pendiente de implementación')}>Añadir comentario</button>
                        <button className="btn-detalle-mejorado" onClick={() => notifications.info('Notificación reenviada (simulado)')}>Reenviar notificación</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {reportesFiltrados.length > 0 && (
        <div className="paginacion-mejorada">
          <button className="btn-pag" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
            Anterior
          </button>
          <span className="pag-info">Página {page + 1}</span>
          <button
            className="btn-pag"
            disabled={(page + 1) * size >= totalElements}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </button>
        </div>
      )}

      <style>{`
        .reportes-page { padding: 0; display: flex; flex-direction: column; gap: 1rem; }
        .filtros-card { padding: 1.5rem; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0; background: #fff; border-radius: 16px; }
        .chips-estados { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .chip-estado { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; font-weight: 600; color: #475569; cursor: pointer; transition: all 0.2s ease; }
        .chip-estado.active { background: #eef2ff; border-color: #6366f1; color: #3730a3; }
        .search-box-principal { display: flex; align-items: center; gap: 0.5rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0.75rem 1rem; }
        .search-input-principal { border: none; outline: none; width: 100%; background: transparent; }
        .filter-select-mejorado { padding: 0.65rem 0.85rem; border-radius: 10px; border: 1px solid #e2e8f0; background: #f8fafc; min-width: 180px; }
        .reports-grid-mejorado { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem; }
        .report-card-mejorada { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06); overflow: hidden; display: flex; flex-direction: column; gap: 0.75rem; }
        .card-barra-estado { height: 6px; background: #e2e8f0; }
        .card-barra-estado.pending { background: #fbbf24; }
        .card-barra-estado.success { background: #22c55e; }
        .card-barra-estado.danger { background: #ef4444; }
        .card-barra-estado.sent { background: #06b6d4; }
        .card-barra-estado.warning { background: #f97316; }
        .card-header-mejorado { padding: 1rem 1rem 0 1rem; display: flex; flex-direction: column; gap: 0.25rem; }
        .card-info-superior { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; }
        .card-titulo-mejorado { margin: 0; font-size: 1rem; font-weight: 700; color: #0f172a; }
        .badge-estado-mejorado { padding: 0.35rem 0.6rem; border-radius: 999px; font-size: 0.8rem; font-weight: 700; text-transform: capitalize; }
        .badge-estado-mejorado.success { background: #dcfce7; color: #15803d; }
        .badge-estado-mejorado.pending { background: #fef9c3; color: #a16207; }
        .badge-estado-mejorado.danger { background: #fee2e2; color: #b91c1c; }
        .badge-estado-mejorado.sent { background: #cffafe; color: #0e7490; }
        .badge-estado-mejorado.warning { background: #ffedd5; color: #c2410c; }
        .card-meta-superior { display: flex; align-items: center; gap: 0.5rem; color: #64748b; font-size: 0.85rem; }
        .meta-vencimiento.vencido { color: #b91c1c; }
        .meta-vencimiento.urgente { color: #c2410c; }
        .meta-vencimiento.hoy { color: #eab308; }
        .meta-vencimiento.proximo { color: #2563eb; }
        .card-body-mejorado { padding: 0 1rem 0.5rem 1rem; }
        .info-clave { display: grid; grid-template-columns: 1fr; gap: 0.35rem; }
        .info-item { display: flex; gap: 0.35rem; font-size: 0.9rem; color: #475569; }
        .info-label { font-weight: 700; color: #0f172a; }
        .info-value { color: #0f172a; font-weight: 600; }
        .text-danger { color: #b91c1c; }
        .meta-separador { color: #cbd5e1; }
        .card-footer-mejorado { padding: 0 1rem 1rem 1rem; }
        .acciones-card { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .btn-detalle-mejorado { background: #eef2ff; color: #312e81; border: 1px solid #c7d2fe; border-radius: 10px; padding: 0.55rem 0.9rem; cursor: pointer; font-weight: 700; }
        .btn-detalle-mejorado:hover { background: #e0e7ff; }
        .paginacion-mejorada { display: flex; justify-content: center; align-items: center; gap: 1rem; padding: 1rem 0; }
        .btn-pag { padding: 0.5rem 0.9rem; border-radius: 10px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; }
        .pag-info { color: #475569; font-weight: 600; }
        .loading-container { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 2rem 0; color: #475569; }
        .loading-spinner { width: 42px; height: 42px; border: 5px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.9s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-text { margin: 0; font-weight: 700; }
        .empty-state { text-align: center; padding: 2rem 1rem; background: #fff; border-radius: 16px; border: 1px dashed #e2e8f0; }
        .empty-icon { font-size: 2rem; }
        .empty-title { margin: 0.35rem 0 0; font-weight: 800; color: #0f172a; }
        .empty-text { margin: 0.25rem 0 0; color: #64748b; }
        .periodo-detalle-expansion { border-top: 1px solid #e2e8f0; padding: 0.75rem 1rem 1rem 1rem; animation: expand 0.25s ease-in-out; display: flex; flex-direction: column; gap: 0.75rem; }
        @keyframes expand { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .detalle-columns { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 0.75rem; }
        .detalle-tarjeta { border: 1px solid #e2e8f0; border-radius: 12px; padding: 0.85rem; background: #f8fafc; }
        .detalle-tarjeta h4 { margin: 0 0 0.35rem 0; font-size: 1rem; font-weight: 700; color: #0f172a; }
        .dato-fila { display: flex; justify-content: space-between; font-size: 0.95rem; color: #475569; padding: 0.2rem 0; }
        .dato-label { font-weight: 700; }
        .dato-value { font-weight: 700; }
        .destaque-naranja { color: #c2410c; }
        .destaque-verde { color: #15803d; }
        .destaque-rojo { color: #b91c1c; }
        .responsable-item { display: flex; justify-content: space-between; padding: 0.25rem 0; font-weight: 600; color: #0f172a; }
        .responsable-rol { color: #64748b; font-weight: 700; }
        .evidencias-lista { display: flex; flex-direction: column; gap: 0.5rem; }
        .evidencia-item { display: flex; justify-content: space-between; gap: 0.5rem; align-items: center; padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 10px; background: #fff; }
        .evidencia-nombre { font-weight: 700; color: #0f172a; }
        .evidencia-meta { color: #64748b; font-size: 0.85rem; }
        .comentario-item { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.65rem; }
        .comentario-header { font-weight: 700; color: #475569; margin-bottom: 0.25rem; }
        .comentario-texto { color: #0f172a; white-space: pre-wrap; }
        .acciones-flex { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .alert-error { padding: 0.85rem 1rem; background: #fee2e2; color: #b91c1c; border: 1px solid #fecdd3; border-radius: 10px; }
      `}</style>
    </div>
  );
}
