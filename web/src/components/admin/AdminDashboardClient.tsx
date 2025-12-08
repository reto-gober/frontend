import { useState, useEffect } from 'react';
import { dashboardService, usuariosService, entidadesService } from '../../lib/services';

interface DashboardStats {
  usuariosActivos: number;
  usuariosCreados: number;
  rolesModificados: number;
  reglasAlerta: number;
  periodoTexto: string;
}

interface DistribucionRol {
  rol: string;
  cantidad: number;
  porcentaje: number;
  color: string;
}

interface ActividadItem {
  usuario: string;
  accion: string;
  tiempo: string;
  avatar: string;
  tipo: string;
}

export default function AdminDashboardClient() {
  const [periodo, setPeriodo] = useState('mensual');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [distribucion, setDistribucion] = useState<DistribucionRol[]>([]);
  const [estadoEntidades, setEstadoEntidades] = useState({ activas: 0, inactivas: 0, total: 0 });
  const [actividad, setActividad] = useState<ActividadItem[]>([]);

  useEffect(() => {
    cargarDatos();
  }, [periodo]);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      // Cargar datos del dashboard admin
      const [dashData, usuariosData, entidadesData] = await Promise.all([
        dashboardService.dashboardAdmin().catch(() => null),
        usuariosService.listar(0, 100).catch(() => ({ content: [] })),
        entidadesService.listar(0, 100).catch(() => ({ content: [] }))
      ]);

      // Procesar usuarios activos y distribución por rol
      const usuarios = usuariosData.content || [];
      const usuariosActivos = usuarios.filter(u => u.estado === 'ACTIVO').length;
      
      // Contar por roles
      const rolesCount: { [key: string]: number } = {};
      usuarios.forEach(u => {
        u.roles.forEach(rol => {
          rolesCount[rol] = (rolesCount[rol] || 0) + 1;
        });
      });

      const totalUsuarios = usuarios.length;
      const distribucionCalculada: DistribucionRol[] = [
        {
          rol: 'Administradores',
          cantidad: rolesCount['admin'] || 0,
          porcentaje: totalUsuarios > 0 ? Math.round(((rolesCount['admin'] || 0) / totalUsuarios) * 100) : 0,
          color: '#3d85d1'
        },
        {
          rol: 'Responsables',
          cantidad: rolesCount['responsable'] || 0,
          porcentaje: totalUsuarios > 0 ? Math.round(((rolesCount['responsable'] || 0) / totalUsuarios) * 100) : 0,
          color: '#F4C453'
        },
        {
          rol: 'Supervisores',
          cantidad: rolesCount['supervisor'] || 0,
          porcentaje: totalUsuarios > 0 ? Math.round(((rolesCount['supervisor'] || 0) / totalUsuarios) * 100) : 0,
          color: '#4ADE80'
        },
        {
          rol: 'Auditores',
          cantidad: rolesCount['auditor'] || 0,
          porcentaje: totalUsuarios > 0 ? Math.round(((rolesCount['auditor'] || 0) / totalUsuarios) * 100) : 0,
          color: '#A78BFA'
        }
      ];

      // Procesar entidades
      const entidades = entidadesData.content || [];
      const entidadesActivas = entidades.filter(e => e.estado === 'ACTIVA').length;
      const entidadesInactivas = entidades.length - entidadesActivas;

      // Simular actividad reciente (esto debería venir de un endpoint de logs/auditoría)
      const actividadSimulada: ActividadItem[] = usuarios.slice(0, 6).map((u, i) => {
        const tiempos = ['Hace 15 minutos', 'Hace 1 hora', 'Hace 2 horas', 'Hace 3 horas', 'Ayer, 16:30', 'Ayer, 10:15'];
        const acciones = [
          'Envió invitación a nuevo usuario',
          `Modificó rol de usuario a ${u.roles[0]}`,
          'Fue creado en el sistema',
          'Actualizó su perfil',
          'Inició sesión',
          'Cerró sesión'
        ];
        const tipos = ['invitacion', 'rol', 'estado', 'perfil', 'login', 'logout'];
        
        return {
          usuario: `${u.firstName} ${u.firstLastname}`,
          accion: acciones[i] || 'Acción realizada',
          tiempo: tiempos[i] || 'Hace un momento',
          avatar: `${u.firstName[0]}${u.firstLastname[0]}`,
          tipo: tipos[i] || 'general'
        };
      });

      setStats({
        usuariosActivos,
        usuariosCreados: usuarios.length,
        rolesModificados: Object.keys(rolesCount).length,
        reglasAlerta: 12, // Esto vendría de endpoint de alertas
        periodoTexto: periodo === 'mensual' ? 'en el último mes' : periodo === 'trimestral' ? 'en el último trimestre' : 'en el último año'
      });

      setDistribucion(distribucionCalculada);
      setEstadoEntidades({
        activas: entidadesActivas,
        inactivas: entidadesInactivas,
        total: entidades.length
      });
      setActividad(actividadSimulada);

    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="loading-spinner">Cargando dashboard...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#e11d48' }}>
        Error al cargar el dashboard
      </div>
    );
  }

  const totalUsuarios = distribucion.reduce((sum, d) => sum + d.cantidad, 0);

  return (
    <div className="dashboard-admin">
      {/* Barra Superior con Filtros */}
      <header className="dashboard-header-bar">
        <div className="header-left">
          <div className="period-filter">
            <label htmlFor="periodo-select" className="filter-label">Periodo:</label>
            <select 
              id="periodo-select" 
              className="filter-select"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
            >
              <option value="mensual">Mensual</option>
              <option value="trimestral">Trimestral</option>
              <option value="anual">Anual</option>
            </select>
          </div>
          <span className="period-text">Periodo: últimos 30 días</span>
        </div>
      </header>

      {/* KPIs Principales */}
      <div className="kpis-row">
        <div className="kpi-card">
          <div className="kpi-icon blue">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div className="kpi-content">
            <span className="kpi-value">{stats.usuariosActivos}</span>
            <span className="kpi-label">Usuarios activos</span>
            <span className="kpi-period">{stats.periodoTexto}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon green">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <line x1="20" y1="8" x2="20" y2="14"/>
              <line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
          </div>
          <div className="kpi-content">
            <span className="kpi-value">{stats.usuariosCreados}</span>
            <span className="kpi-label">Usuarios creados</span>
            <span className="kpi-period">{stats.periodoTexto}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon orange">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </div>
          <div className="kpi-content">
            <span className="kpi-value">{stats.rolesModificados}</span>
            <span className="kpi-label">Roles modificados</span>
            <span className="kpi-period">{stats.periodoTexto}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon purple">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div className="kpi-content">
            <span className="kpi-value">{stats.reglasAlerta}</span>
            <span className="kpi-label">Reglas de alerta configuradas</span>
            <span className="kpi-period">activas actualmente</span>
          </div>
        </div>
      </div>

      {/* Gráficos y Resúmenes */}
      <div className="dashboard-grid">
        {/* Distribución de Usuarios por Rol */}
        <div className="dashboard-card chart-card">
          <div className="card-header">
            <h3 className="card-title">Distribución de Usuarios por Rol</h3>
          </div>
          <div className="card-body">
            <div className="donut-chart-container">
              <svg viewBox="0 0 200 200" className="donut-chart">
                {/* Aquí iría el gráfico de dona generado con SVG */}
                <circle cx="100" cy="100" r="80" fill="none" stroke="#e5e7eb" strokeWidth="40"/>
                {distribucion.map((d, i) => {
                  const offset = distribucion.slice(0, i).reduce((sum, item) => sum + item.porcentaje, 0);
                  const strokeDasharray = `${(d.porcentaje / 100) * 502} 502`;
                  const strokeDashoffset = -(offset / 100) * 502;
                  
                  return (
                    <circle
                      key={i}
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke={d.color}
                      strokeWidth="40"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      transform="rotate(-90 100 100)"
                    />
                  );
                })}
              </svg>
              <div className="donut-center">
                <span className="donut-value">{totalUsuarios}</span>
                <span className="donut-label">usuarios</span>
              </div>
            </div>
            <div className="chart-legend">
              {distribucion.map((item, i) => (
                <div key={i} className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: item.color }}></span>
                  <span className="legend-label">{item.rol}</span>
                  <span className="legend-value">{item.cantidad} ({item.porcentaje}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Estado de Entidades de Control */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">Estado de Entidades de Control</h3>
          </div>
          <div className="card-body">
            <div className="entities-stats">
              <div className="entity-stat-item">
                <div className="stat-icon-large green">
                  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <div className="stat-info">
                  <span className="stat-value-large">{estadoEntidades.activas}</span>
                  <span className="stat-label-large">Entidades activas</span>
                </div>
              </div>
              <div className="entity-stat-item">
                <div className="stat-icon-large gray">
                  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                </div>
                <div className="stat-info">
                  <span className="stat-value-large">{estadoEntidades.inactivas}</span>
                  <span className="stat-label-large">Entidades inactivas</span>
                </div>
              </div>
            </div>
            <div className="total-entities">
              <span className="total-label">Total de entidades:</span>
              <span className="total-value">{estadoEntidades.total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actividad Administrativa Reciente */}
      <div className="dashboard-card activity-card">
        <div className="card-header">
          <h3 className="card-title">Actividad Administrativa Reciente</h3>
          <a href="#" className="link-view-all">Ver todo →</a>
        </div>
        <div className="card-body">
          <div className="activity-list">
            {actividad.map((act, i) => (
              <div key={i} className="activity-item">
                <div className={`activity-avatar ${act.tipo}`}>{act.avatar}</div>
                <div className="activity-content">
                  <div className="activity-text">
                    <strong>{act.usuario}</strong> {act.accion}
                  </div>
                  <span className="activity-time">{act.tiempo}</span>
                </div>
                <span className={`activity-badge ${act.tipo}`}>
                  {act.tipo === 'invitacion' && 'INVITACIÓN'}
                  {act.tipo === 'rol' && 'ROL'}
                  {act.tipo === 'estado' && 'ESTADO'}
                  {act.tipo === 'perfil' && 'PERFIL'}
                  {act.tipo === 'login' && 'LOGIN'}
                  {act.tipo === 'logout' && 'LOGOUT'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
