'use client';

import KpiCard from './KpiCard';
import type { FamiliesKpis } from '@/services/admin/dashboard';

interface FamiliesBlockProps {
  data: FamiliesKpis | null;
  loading: boolean;
}

export default function FamiliesBlock({ data, loading }: FamiliesBlockProps) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-black mb-6">🚀 Aceleradores do Negócio (Famílias)</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Famílias Novas"
          value={loading ? '...' : data?.newFamilies.today || 0}
          subtitle={
            loading
              ? ''
              : `${data?.newFamilies.week || 0} esta semana • ${data?.newFamilies.month || 0} este mês`
          }
          color="blue"
          loading={loading}
        />

        <KpiCard
          title="Famílias em Atendimento"
          value={loading ? '...' : data?.activeFamilies.total || 0}
          subtitle={
            loading
              ? ''
              : `${data?.activeFamilies.byStage.contacted} contatadas • ${data?.activeFamilies.byStage.match_started} em match`
          }
          color="green"
          loading={loading}
        />

        <KpiCard
          title="Famílias com Propostas"
          value={loading ? '...' : data?.proposals.last7Days || 0}
          subtitle="Últimos 7 dias"
          color="orange"
          loading={loading}
        />

        <KpiCard
          title="Famílias Pagantes"
          value={loading ? '...' : data?.payingFamilies.month || 0}
          subtitle="Mês atual"
          color="purple"
          loading={loading}
        />
      </div>
    </div>
  );
}
