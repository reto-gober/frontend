import React, { useEffect, useMemo, useState } from 'react';
import api from '../../lib/api';
import { fetchCached, invalidateCache } from '../../lib/fetcher';
import './configuracion.css';

const TAB_KEYS = ['general', 'notificaciones', 'alertas', 'seguridad'] as const;
type TabKey = (typeof TAB_KEYS)[number];

type Settings = {
  companyName?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpFromEmail?: string;
  smtpFromName?: string;
  smtpEnabled?: boolean;
  sessionTimeoutMinutes?: number;
  maxLoginAttempts?: number;
  schedulerNotificationHour?: string;
};

type SmtpSource = { source?: string } | null;

type AlertLevel = {
  dias: number;
  mensaje: string;
  activo: boolean;
};

type GlobalAlertRules = {
  primera?: AlertLevel;
  preventiva?: AlertLevel;
  urgente?: AlertLevel;
  updatedAt?: string;
} | null;

type FormState = {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  smtpHost: string;
  smtpPort: string;
  smtpUsername: string;
  smtpPassword: string;
  smtpFromEmail: string;
  smtpFromName: string;
  smtpEnabled: boolean;
  sessionTimeout: string;
  maxAttempts: string;
  schedulerHour: string;
};

const initialForm: FormState = {
  companyName: '',
  companyEmail: '',
  companyPhone: '',
  companyAddress: '',
  smtpHost: '',
  smtpPort: '',
  smtpUsername: '',
  smtpPassword: '********',
  smtpFromEmail: '',
  smtpFromName: '',
  smtpEnabled: false,
  sessionTimeout: '',
  maxAttempts: '',
  schedulerHour: '08:00',
};

function mapSettingsToForm(settings: Settings | null): FormState {
  if (!settings) return initialForm;
  return {
    companyName: settings.companyName ?? '',
    companyEmail: settings.companyEmail ?? '',
    companyPhone: settings.companyPhone ?? '',
    companyAddress: settings.companyAddress ?? '',
    smtpHost: settings.smtpHost ?? '',
    smtpPort: settings.smtpPort?.toString() ?? '',
    smtpUsername: settings.smtpUsername ?? '',
    smtpPassword: '********',
    smtpFromEmail: settings.smtpFromEmail ?? '',
    smtpFromName: settings.smtpFromName ?? '',
    smtpEnabled: !!settings.smtpEnabled,
    sessionTimeout: settings.sessionTimeoutMinutes?.toString() ?? '',
    maxAttempts: settings.maxLoginAttempts?.toString() ?? '',
    schedulerHour: settings.schedulerNotificationHour ?? '08:00',
  };
}

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [form, setForm] = useState<FormState>(initialForm);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [smtpSource, setSmtpSource] = useState<SmtpSource>(null);
  const [alertRules, setAlertRules] = useState<GlobalAlertRules>(null);
  const [alertFormPrimera, setAlertFormPrimera] = useState({ dias: 7, mensaje: 'Recordatorio: el reporte vence pronto', activo: true });
  const [alertFormPreventiva, setAlertFormPreventiva] = useState({ dias: 3, mensaje: 'Alerta preventiva: quedan pocos días', activo: true });
  const [alertFormUrgente, setAlertFormUrgente] = useState({ dias: 1, mensaje: 'Alerta urgente: vencimiento inminente', activo: true });
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [smtpStatus, setSmtpStatus] = useState('');
  const [smtpLocked, setSmtpLocked] = useState(true);
  const [smtpTestOk, setSmtpTestOk] = useState(false);
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const smtpFields = useMemo(
    () => new Set<keyof FormState>([
      'smtpHost',
      'smtpPort',
      'smtpUsername',
      'smtpPassword',
      'smtpFromEmail',
      'smtpFromName',
      'smtpEnabled',
    ]),
    []
  );

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setSaveStatus('Cargando...');
      try {
        const [settingsData, smtpSourceData] = await Promise.all([
          fetchCached<Settings>('systemSettings', '/api/admin/settings/system'),
          api.get('/api/admin/settings/smtp/source').then((r) => r.data as SmtpSource),
        ]);

        if (!mounted) return;
        setSettings(settingsData);
        setForm(mapSettingsToForm(settingsData));
        setSmtpSource(smtpSourceData);
        setSmtpLocked(smtpSourceData?.source === 'environment');
        setSaveStatus('Listo');
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setSaveStatus('Error al cargar configuraciones');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const onFieldChange = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.type === 'checkbox' ? (event.target as HTMLInputElement).checked : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value as any }));
    if (smtpFields.has(field)) {
      setSmtpTestOk(false);
      setSaveStatus('');
      setSmtpStatus('');
    }
  };

  const unlockSmtp = () => {
    setSmtpLocked(false);
    setSmtpStatus('Sobrescribe los valores por defecto. Ejecuta la prueba SMTP antes de guardar.');
  };

  const testSmtp = async () => {
    setSmtpTesting(true);
    setSmtpStatus('Probando...');
    setSmtpTestOk(false);
    setSaveStatus('');
    try {
      const payload = {
        host: form.smtpHost,
        port: Number(form.smtpPort),
        username: form.smtpUsername,
        password: form.smtpPassword,
      };
      const res = await api.post('/api/admin/settings/smtp/test', payload);
      const ok = !!res.data?.success;
      setSmtpTestOk(ok);
      setSmtpStatus(ok ? 'Conexión SMTP validada. Ahora puedes guardar.' : res.data?.message || 'No se pudo validar SMTP');
    } catch (err: any) {
      console.error(err);
      const message = err?.response?.data?.message || err?.message || 'Error al probar SMTP';
      setSmtpStatus(message);
    } finally {
      setSmtpTesting(false);
    }
  };

  const saveGeneralSettings = async () => {
    setSaving(true);
    setSaveStatus('Guardando información general...');
    try {
      const payload = {
        companyName: form.companyName,
        companyEmail: form.companyEmail,
        companyPhone: form.companyPhone,
        companyAddress: form.companyAddress,
        schedulerNotificationHour: form.schedulerHour,
      };
      const res = await api.patch('/api/admin/settings/system', payload);
      setSettings({ ...settings, ...res.data?.data });
      invalidateCache(['systemSettings']);
      setSaveStatus('Información general guardada correctamente');
    } catch (err: any) {
      console.error(err);
      const message = err?.response?.data?.message || err?.message || 'No se pudo guardar';
      setSaveStatus(message);
    } finally {
      setSaving(false);
    }
  };

  const saveSmtpSettings = async () => {
    if (!smtpTestOk) {
      setSaveStatus('Ejecuta primero la prueba SMTP');
      return;
    }
    setSaving(true);
    setSaveStatus('Guardando configuración SMTP...');
    try {
      const payload = {
        smtpHost: form.smtpHost,
        smtpPort: Number(form.smtpPort),
        smtpUsername: form.smtpUsername,
        smtpPassword: form.smtpPassword,
        smtpFromEmail: form.smtpFromEmail,
        smtpFromName: form.smtpFromName,
        smtpEnabled: form.smtpEnabled,
      };
      const res = await api.patch('/api/admin/settings/system', payload);
      setSettings({ ...settings, ...res.data?.data });
      invalidateCache(['systemSettings']);
      setSaveStatus('Configuración SMTP guardada correctamente');
      setSmtpTestOk(false);
    } catch (err: any) {
      console.error(err);
      const message = err?.response?.data?.message || err?.message || 'No se pudo guardar';
      setSaveStatus(message);
    } finally {
      setSaving(false);
    }
  };

  const saveSecuritySettings = async () => {
    setSaving(true);
    setSaveStatus('Guardando configuración de seguridad...');
    try {
      const payload = {
        sessionTimeoutMinutes: Number(form.sessionTimeout),
        maxLoginAttempts: Number(form.maxAttempts),
      };
      const res = await api.patch('/api/admin/settings/system', payload);
      setSettings({ ...settings, ...res.data?.data });
      invalidateCache(['systemSettings']);
      setSaveStatus('Configuración de seguridad guardada correctamente');
    } catch (err: any) {
      console.error(err);
      const message = err?.response?.data?.message || err?.message || 'No se pudo guardar';
      setSaveStatus(message);
    } finally {
      setSaving(false);
    }
  };

  const loadAlertRules = async () => {
    setAlertsLoading(true);
    invalidateCache(['alertRules']);
    try {
      const data = await fetchCached<GlobalAlertRules>('alertRules', '/api/admin/settings/alerts/rules');
      setAlertRules(data);
      if (data?.primera) setAlertFormPrimera(data.primera);
      if (data?.preventiva) setAlertFormPreventiva(data.preventiva);
      if (data?.urgente) setAlertFormUrgente(data.urgente);
    } catch (err) {
      console.error(err);
      setAlertRules(null);
    } finally {
      setAlertsLoading(false);
    }
  };

  const saveAlertRules = async () => {
    setSaveStatus('Guardando reglas globales...');
    setAlertsLoading(true);
    try {
      const payload = {
        primera: alertFormPrimera,
        preventiva: alertFormPreventiva,
        urgente: alertFormUrgente,
      };
      await api.put('/api/admin/settings/alerts/rules', payload);
      invalidateCache(['alertRules']);
      setSaveStatus('Reglas globales guardadas correctamente');
      await loadAlertRules();
    } catch (err: any) {
      console.error(err);
      const message = err?.response?.data?.message || err?.message || 'No se pudieron guardar las reglas';
      setSaveStatus(message);
    } finally {
      setAlertsLoading(false);
    }
  };

  const processAlerts = async () => {
    if (!confirm('¿Procesar alertas manualmente ahora?')) return;
    setSaveStatus('Ejecutando alertas...');
    try {
      const res = await api.post('/api/admin/settings/alerts/process');
      const data = res.data?.data || {};
      setSaveStatus(`Procesado: ${data.alertasGeneradas || 0} alertas generadas`);
      await loadAlertRules();
    } catch (err: any) {
      console.error(err);
      const message = err?.response?.data?.message || err?.message || 'Error al procesar alertas';
      setSaveStatus(message);
    }
  };

  useEffect(() => {
    if (activeTab === 'alertas' && !alertRules && !alertsLoading) {
      loadAlertRules();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const isSmtpLocked = smtpSource?.source === 'environment' && smtpLocked;

  return (
    <div className="configuracion-page" data-loading={loading}>
      <div className="page-header">
        <div className="header-info">
          <h1 className="page-title">Configuración del Sistema</h1>
          <p className="page-description">Ajustes generales, SMTP y reglas de alertas</p>
        </div>
      </div>

      <div className="config-tabs" role="tablist">
        {TAB_KEYS.map((key) => (
          <button
            key={key}
            className={`tab-btn ${activeTab === key ? 'active' : ''}`}
            role="tab"
            aria-selected={activeTab === key}
            onClick={() => setActiveTab(key)}
          >
            {key === 'notificaciones' ? 'SMTP' : key.charAt(0).toUpperCase() + key.slice(1)}
          </button>
        ))}
      </div>

      <div className="config-content">
        {activeTab === 'general' && (
          <section className="config-section" id="tab-general">
            <div className="section-card">
              <div className="section-header">
                <h3 className="section-title">Información de la empresa</h3>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="companyName">Nombre</label>
                  <input id="companyName" type="text" className="form-input" value={form.companyName} onChange={onFieldChange('companyName')} placeholder="Llanogas" />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="companyEmail">Email</label>
                  <input id="companyEmail" type="email" className="form-input" value={form.companyEmail} onChange={onFieldChange('companyEmail')} placeholder="contacto@llanogas.com" />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="companyPhone">Teléfono</label>
                  <input id="companyPhone" type="text" className="form-input" value={form.companyPhone} onChange={onFieldChange('companyPhone')} placeholder="+57" />
                </div>
                <div className="form-group full-width">
                  <label className="form-label" htmlFor="companyAddress">Dirección</label>
                  <input id="companyAddress" type="text" className="form-input" value={form.companyAddress} onChange={onFieldChange('companyAddress')} placeholder="Dirección" />
                </div>
              </div>
            </div>

            <div className="section-card">
              <div className="section-header">
                <h3 className="section-title">Scheduler de notificaciones</h3>
              </div>
              <p className="section-hint">Configura la hora en la que el sistema procesará y enviará las notificaciones automáticas.</p>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="schedulerHour">Hora de ejecución</label>
                  <input 
                    id="schedulerHour" 
                    type="time" 
                    className="form-input" 
                    value={form.schedulerHour} 
                    onChange={onFieldChange('schedulerHour')} 
                  />
                  <small className="form-help">Las notificaciones se procesarán diariamente a esta hora</small>
                </div>
              </div>
              <div className="actions-row">
                <button 
                  className="btn-primary" 
                  onClick={saveGeneralSettings}
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar información general'}
                </button>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'notificaciones' && (
          <section className="config-section" id="tab-notificaciones">
            <div className="section-card">
              <div className="section-header">
                <h3 className="section-title">SMTP</h3>
                <div className="section-actions">
                  {smtpSource?.source === 'environment' && <span className="badge badge-env">Usando valores por defecto (ENV)</span>}
                  {isSmtpLocked ? (
                    <button className="btn-link" onClick={unlockSmtp}>Editar SMTP</button>
                  ) : null}
                </div>
              </div>
              <p className="section-hint">Los campos quedan bloqueados si vienen de variables de entorno. Al sobrescribir se requiere prueba SMTP antes de guardar.</p>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" htmlFor="smtpHost">Servidor SMTP</label>
                  <input id="smtpHost" type="text" className="form-input" value={form.smtpHost} onChange={onFieldChange('smtpHost')} disabled={isSmtpLocked} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="smtpPort">Puerto</label>
                  <input id="smtpPort" type="number" className="form-input" value={form.smtpPort} onChange={onFieldChange('smtpPort')} disabled={isSmtpLocked} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="smtpUsername">Usuario</label>
                  <input id="smtpUsername" type="email" className="form-input" value={form.smtpUsername} onChange={onFieldChange('smtpUsername')} disabled={isSmtpLocked} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="smtpPassword">Contraseña</label>
                  <input id="smtpPassword" type="password" className="form-input" value={form.smtpPassword} onChange={onFieldChange('smtpPassword')} disabled={isSmtpLocked} placeholder="********" />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="smtpFromEmail">Email remitente</label>
                  <input id="smtpFromEmail" type="email" className="form-input" value={form.smtpFromEmail} onChange={onFieldChange('smtpFromEmail')} disabled={isSmtpLocked} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="smtpFromName">Nombre remitente</label>
                  <input id="smtpFromName" type="text" className="form-input" value={form.smtpFromName} onChange={onFieldChange('smtpFromName')} disabled={isSmtpLocked} />
                </div>
                <div className="form-group">
                  <label className="form-label">SMTP habilitado</label>
                  <label className="toggle-switch">
                    <input id="smtpEnabled" type="checkbox" checked={form.smtpEnabled} onChange={onFieldChange('smtpEnabled')} disabled={isSmtpLocked} />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
              <div className="smtp-actions">
                <div className="actions-row">
                  <button className="btn-secondary" onClick={testSmtp} disabled={isSmtpLocked || smtpTesting}>
                    {smtpTesting && <span className="spinner" aria-hidden="true"></span>}
                    Probar conexión
                  </button>
                  <button 
                    className="btn-primary" 
                    onClick={saveSmtpSettings}
                    disabled={isSmtpLocked || !smtpTestOk || saving}
                  >
                    {saving ? 'Guardando...' : 'Guardar configuración SMTP'}
                  </button>
                </div>
                <div className="status" aria-live="polite">{smtpStatus}</div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'alertas' && (
          <section className="config-section" id="tab-alertas">
            <div className="section-card">
              <div className="section-header">
                <h3 className="section-title">Reglas de alertas globales</h3>
                <span className="section-hint">Estas reglas aplican globalmente a todos los reportes del sistema.</span>
              </div>
              
              {alertsLoading && <p className="status">Cargando configuración...</p>}
              
              {!alertsLoading && (
                <>
                  <div className="alert-levels">
                    <div className="alert-level-group" role="group" aria-labelledby="primera-title">
                      <h4 id="primera-title" className="level-title">Primera alerta</h4>
                      <div className="form-grid">
                        <div className="form-group">
                          <label className="form-label" htmlFor="primera-dias">Días antes</label>
                          <input 
                            id="primera-dias" 
                            type="number" 
                            className="form-input" 
                            min="0" 
                            value={alertFormPrimera.dias} 
                            onChange={(e) => setAlertFormPrimera({ ...alertFormPrimera, dias: Number(e.target.value) })}
                          />
                        </div>
                        <div className="form-group full-width">
                          <label className="form-label" htmlFor="primera-mensaje">Mensaje</label>
                          <textarea 
                            id="primera-mensaje" 
                            className="form-input" 
                            rows={2}
                            minLength={5}
                            maxLength={1000}
                            value={alertFormPrimera.mensaje} 
                            onChange={(e) => setAlertFormPrimera({ ...alertFormPrimera, mensaje: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Activo</label>
                          <label className="toggle-switch">
                            <input 
                              type="checkbox" 
                              checked={alertFormPrimera.activo} 
                              onChange={(e) => setAlertFormPrimera({ ...alertFormPrimera, activo: e.target.checked })}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="alert-level-group" role="group" aria-labelledby="preventiva-title">
                      <h4 id="preventiva-title" className="level-title">Alerta preventiva</h4>
                      <div className="form-grid">
                        <div className="form-group">
                          <label className="form-label" htmlFor="preventiva-dias">Días antes</label>
                          <input 
                            id="preventiva-dias" 
                            type="number" 
                            className="form-input" 
                            min="0" 
                            value={alertFormPreventiva.dias} 
                            onChange={(e) => setAlertFormPreventiva({ ...alertFormPreventiva, dias: Number(e.target.value) })}
                          />
                        </div>
                        <div className="form-group full-width">
                          <label className="form-label" htmlFor="preventiva-mensaje">Mensaje</label>
                          <textarea 
                            id="preventiva-mensaje" 
                            className="form-input" 
                            rows={2}
                            minLength={5}
                            maxLength={1000}
                            value={alertFormPreventiva.mensaje} 
                            onChange={(e) => setAlertFormPreventiva({ ...alertFormPreventiva, mensaje: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Activo</label>
                          <label className="toggle-switch">
                            <input 
                              type="checkbox" 
                              checked={alertFormPreventiva.activo} 
                              onChange={(e) => setAlertFormPreventiva({ ...alertFormPreventiva, activo: e.target.checked })}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="alert-level-group" role="group" aria-labelledby="urgente-title">
                      <h4 id="urgente-title" className="level-title">Alerta urgente</h4>
                      <div className="form-grid">
                        <div className="form-group">
                          <label className="form-label" htmlFor="urgente-dias">Días antes</label>
                          <input 
                            id="urgente-dias" 
                            type="number" 
                            className="form-input" 
                            min="0" 
                            value={alertFormUrgente.dias} 
                            onChange={(e) => setAlertFormUrgente({ ...alertFormUrgente, dias: Number(e.target.value) })}
                          />
                        </div>
                        <div className="form-group full-width">
                          <label className="form-label" htmlFor="urgente-mensaje">Mensaje</label>
                          <textarea 
                            id="urgente-mensaje" 
                            className="form-input" 
                            rows={2}
                            minLength={5}
                            maxLength={1000}
                            value={alertFormUrgente.mensaje} 
                            onChange={(e) => setAlertFormUrgente({ ...alertFormUrgente, mensaje: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Activo</label>
                          <label className="toggle-switch">
                            <input 
                              type="checkbox" 
                              checked={alertFormUrgente.activo} 
                              onChange={(e) => setAlertFormUrgente({ ...alertFormUrgente, activo: e.target.checked })}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {alertRules?.updatedAt && (
                    <p className="status">Última actualización: {new Date(alertRules.updatedAt).toLocaleString()}</p>
                  )}

                  <div className="actions-row">
                    <button 
                      className="btn-primary" 
                      onClick={saveAlertRules}
                      disabled={alertsLoading}
                    >
                      Guardar reglas globales
                    </button>
                    <button 
                      className="btn-secondary" 
                      onClick={processAlerts}
                      disabled={alertsLoading}
                    >
                      Procesar alertas manual
                    </button>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {activeTab === 'seguridad' && (
          <section className="config-section" id="tab-seguridad">
            <div className="section-card">
              <div className="section-header">
                <h3 className="section-title">Sesiones</h3>
                <span className="section-hint">Valores validados en backend</span>
              </div>
              <div className="settings-list">
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-name">Expiración de sesión</span>
                    <span className="setting-description">Minutos de inactividad antes de cerrar sesión</span>
                  </div>
                  <div className="input-with-suffix">
                    <input id="sessionTimeout" type="number" className="form-input small" min="15" max="480" value={form.sessionTimeout} onChange={onFieldChange('sessionTimeout')} />
                    <span className="suffix">min</span>
                  </div>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-name">Intentos máximos</span>
                    <span className="setting-description">Bloqueo por intentos fallidos</span>
                  </div>
                  <div className="input-with-suffix">
                    <input id="maxAttempts" type="number" className="form-input small" min="3" max="10" value={form.maxAttempts} onChange={onFieldChange('maxAttempts')} />
                    <span className="suffix">intentos</span>
                  </div>
                </div>
              </div>
              <div className="actions-row">
                <button 
                  className="btn-primary" 
                  onClick={saveSecuritySettings}
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar configuración de seguridad'}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      {saveStatus && (
        <div className="config-footer">
          <div className="status" id="saveStatus" aria-live="polite">{saveStatus}</div>
        </div>
      )}
    </div>
  );
}
