import { useState, useEffect } from 'react';
import { dashboardService, type DashboardResponse } from '../lib/services';

export default function DashboardStats() {
  const [stats, setStats] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await dashboardService.estadisticas();
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
    <div className="stats-grid">
      {cards.map((card) => (
        <div key={card.title} className="stat-card" style={{ backgroundColor: card.bgColor }}>
          <div className="stat-title">{card.title}</div>
          <div className="stat-value" style={{ color: card.color }}>
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}
