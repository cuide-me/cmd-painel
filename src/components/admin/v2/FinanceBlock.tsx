'use client';

import KpiCard from './KpiCard';
import type { FinanceKpis } from '@/services/admin/dashboard';

interface FinanceBlockProps {
  data: FinanceKpis | null;
  loading: boolean;
}

export default function FinanceBlock({ data, loading }: FinanceBlockProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-black mb-6">💰 Dinheiro (Financeiro Essencial)</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <KpiCard
          title="Pagamentos Recebidos no Período"
          value={loading ? '...' : formatCurrency(data?.totalReceivedThisMonth || 0)}
          subtitle={
            loading
              ? ''
              : data?.averageTicket
                ? `Ticket médio: ${formatCurrency(data.averageTicket)}`
                : ''
          }
          color="green"
          loading={loading}
        />

        {data?.totalHoursSold && (
          <KpiCard
            title="Total de Horas Vendidas"
            value={loading ? '...' : data.totalHoursSold}
            subtitle="No período"
            color="blue"
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}
