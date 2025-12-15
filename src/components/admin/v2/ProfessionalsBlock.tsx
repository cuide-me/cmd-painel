'use client';

import KpiCard from './KpiCard';
import type { ProfessionalsKpis } from '@/services/admin/dashboard';

interface ProfessionalsBlockProps {
  data: ProfessionalsKpis | null;
  loading: boolean;
}

export default function ProfessionalsBlock({ data, loading }: ProfessionalsBlockProps) {
  const formatTime = (minutes?: number) => {
    if (!minutes) return '';
    if (minutes < 60) return `${Math.round(minutes)}min em média`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h${mins}min em média`;
  };

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-black mb-6">💼 Saúde da Oferta (Profissionais)</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard
          title="Profissionais Disponíveis Hoje"
          value={loading ? '...' : data?.availableToday || 0}
          subtitle="Com notificações ativas"
          color="blue"
          loading={loading}
        />

        <KpiCard
          title="Profissionais com Perfil 100%"
          value={loading ? '...' : data?.profileComplete || 0}
          subtitle="Perfil completo"
          color="green"
          loading={loading}
        />

        <KpiCard
          title="Profissionais que Respondem < 2h"
          value={loading ? '...' : data?.fastResponders || 0}
          subtitle={loading ? '' : formatTime(data?.responseTimeAvgInMinutes)}
          color="orange"
          loading={loading}
        />
      </div>
    </div>
  );
}
