import { useState, useEffect } from 'react';
import { dashboardService, type DashboardResponse } from '../lib/services';

const RANGOS = [
  { label: '30D', value: '30D' },
  { label: '3M', value: '3M' },
  { label: '6M', value: '6M' },
  { label: '12M', value: '12M' },
];

export default function DashboardStats() {
  const [stats, setStats] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [rango, setRango] = useState('30D');

  useEffect(() => {
    loadStats(rango);
  }, [rango]);

  const loadStats = async (rango: string) => {
    setLoading(true);
    try {
      const data = await dashboardService.estadisticas(rango);
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando estadísticas...</div>;
  }

  if (!stats) {
    return <div className="alert alert-error">Error al cargar las estadísticas</div>;
  }

  // Colores pastel exactos según especificación
  const cards = [
    {
      title: 'Pendientes',
      value: stats.reportesPendientes,
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
      bgColor: '#FEF7C3', // Amarillo pastel
      borderColor: '#FDE047',
      textColor: '#854D0E',
      link: '/reportes?estado=PENDIENTE',
    },
    {
      title: 'En Progreso',
      value: stats.reportesEnProgreso,
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
        </svg>
      ),
      bgColor: '#E0F2FE', // Azul pastel
      borderColor: '#7DD3FC',
      textColor: '#0369A1',
      link: '/reportes?estado=EN_PROGRESO',
    },
    {
      title: 'Enviados',
      value: stats.reportesEnviados,
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ),
      bgColor: '#DCFCE7', // Verde pastel
      borderColor: '#86EFAC',
      textColor: '#166534',
      link: '/reportes?estado=ENVIADO',
    },
    {
      title: 'Vencidos',
      value: stats.reportesVencidos,
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      ),
      bgColor: '#FFE4E6', // Rosa pastel
      borderColor: '#FDA4AF',
      textColor: '#BE123C',
      link: '/reportes?estado=VENCIDO',
    },
    {
      title: 'Cumplimiento',
      value: `${(stats.tasaCumplimiento * 100).toFixed(1)}%`,
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      ),
      bgColor: '#FFEDD5', // Naranja pastel
      borderColor: '#FDBA74',
      textColor: '#C2410C',
    },
    {
      title: 'Total Reportes',
      value: stats.totalReportes,
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="12" y1="18" x2="12" y2="12"/>
          <line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
      ),
      bgColor: '#F1F5F9', // Gris neutro
      borderColor: '#CBD5E1',
      textColor: '#475569',
      link: '/reportes',
    },
  ];

  return (
    <div>
      <div className="dashboard-header">
        <h3 className="dashboard-subtitle">Resumen de reportes regulatorios</h3>
      </div>

      {/* Filtros estilo chips */}
      <div className="filter-chips">
        {RANGOS.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => setRango(r.value)}
            className={`chip ${rango === r.value ? 'chip-active' : ''}`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Grid de tarjetas */}
      <div className="stats-grid">
        {cards.map((card) => (
          card.link ? (
            <a
              key={card.title}
              href={card.link}
              className="stat-card"
              style={{
                backgroundColor: card.bgColor,
                borderColor: card.borderColor,
              }}
            >
              <div className="stat-card-icon" style={{ color: card.textColor }}>
                {card.icon}
              </div>
              <div className="stat-card-content">
                <div className="stat-card-title">{card.title}</div>
                <div className="stat-card-value" style={{ color: card.textColor }}>
                  {card.value}
                </div>
              </div>
            </a>
          ) : (
            <div
              key={card.title}
              className="stat-card"
              style={{
                backgroundColor: card.bgColor,
                borderColor: card.borderColor,
              }}
            >
              <div className="stat-card-icon" style={{ color: card.textColor }}>
                {card.icon}
              </div>
              <div className="stat-card-content">
                <div className="stat-card-title">{card.title}</div>
                <div className="stat-card-value" style={{ color: card.textColor }}>
                  {card.value}
                </div>
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}
