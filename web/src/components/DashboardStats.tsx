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

  const rangoSelector = (
    <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
      {RANGOS.map(r => (
        <button
          key={r.value}
          type="button"
          onClick={() => setRango(r.value)}
          style={{
            padding: '0.5rem 1.2rem',
            borderRadius: '2rem',
            border: 'none',
            background: rango === r.value ? 'white' : 'transparent',
            boxShadow: rango === r.value ? '0 0 0 2px #cbd5e1' : 'none',
            color: '#1e293b',
            fontWeight: rango === r.value ? 'bold' : 'normal',
            cursor: 'pointer',
            outline: 'none',
            transition: 'all 0.2s',
          }}
        >
          {r.label}
        </button>
      ))}
    </div>
  );

  const cards = [
    {
      title: 'Total Reportes',
      value: stats.totalReportes,
      color: 'var(--color-primary-600)',
      bgColor: 'var(--color-primary-50)',
    },
    {
      title: 'Pendientes',
      value: stats.reportesPendientes,
      color: 'var(--color-warning)',
      bgColor: '#fef3c7',
    },
    {
      title: 'En Progreso',
      value: stats.reportesEnProgreso,
      color: 'var(--color-info)',
      bgColor: '#dbeafe',
    },
    {
      title: 'Enviados',
      value: stats.reportesEnviados,
      color: 'var(--color-success)',
      bgColor: '#d1fae5',
    },
    {
      title: 'Vencidos',
      value: stats.reportesVencidos,
      color: 'var(--color-error)',
      bgColor: '#fee2e2',
    },
    {
      title: 'Cumplimiento',
      value: `${(stats.tasaCumplimiento * 100).toFixed(1)}%`,
      color: stats.tasaCumplimiento >= 0.9 ? 'var(--color-success)' : 'var(--color-warning)',
      bgColor: stats.tasaCumplimiento >= 0.9 ? '#d1fae5' : '#fef3c7',
    },
  ];

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '1rem', fontWeight: 500, color: '#2563eb' }}>
        Resumen de reportes regulatorios
      </div>
      {rangoSelector}
      <div className="stats-grid">
        {cards.map((card) => {
          let link: string | null = null;
          if (card.title === 'Total Reportes') link = '/reportes';
          if (card.title === 'Pendientes') link = '/reportes?estado=PENDIENTE';
          if (card.title === 'En Progreso') link = '/reportes?estado=EN_PROGRESO';
          if (card.title === 'Enviados') link = '/reportes?estado=ENVIADO';
          if (card.title === 'Vencidos') link = '/reportes?estado=VENCIDO';

          if (link) {
            return (
              <a
                key={card.title}
                href={link}
                className="stat-card"
                style={{ backgroundColor: card.bgColor, textDecoration: 'none', color: 'inherit', display: 'block' }}
              >
                <div className="stat-title">{card.title}</div>
                <div className="stat-value" style={{ color: card.color }}>
                  {card.value}
                </div>
              </a>
            );
          } else {
            return (
              <div key={card.title} className="stat-card" style={{ backgroundColor: card.bgColor }}>
                <div className="stat-title">{card.title}</div>
                <div className="stat-value" style={{ color: card.color }}>
                  {card.value}
                </div>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}
