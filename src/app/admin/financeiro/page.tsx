'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface FinanceiroData {
  summary: {
    totalReceived: number;
    totalFees: number;
    netRevenue: number;
    transactionCount: number;
    averageTicket: number;
  };
  revenueByMonth: Record<string, number>;
  transactions: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    created: number;
    description: string;
    customerEmail: string;
    paymentMethod: string;
  }>;
  payouts: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    created: number;
    arrivalDate: number;
    method: string;
  }>;
}

export default function AdminFinanceiroPage() {
  const router = useRouter();
  const [data, setData] = useState<FinanceiroData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/financeiro');
      if (!response.ok) throw new Error('Erro ao carregar dados financeiros');

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('admin_logged') === 'true';
    if (!isLoggedIn) {
      router.push('/admin');
      return;
    }

    fetchData();
  }, [fetchData, router]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div
              className="relative w-16 h-16 cursor-pointer"
              onClick={() => router.push('/admin')}
            >
              <Image
                src="/logo-cuide-me.png"
                alt="Cuide-me"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-black">Financeiro</h1>
              <p className="text-sm text-black mt-1">Receitas, pagamentos e transações do Stripe</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              🔄 Atualizar
            </button>
            <button
              onClick={() => router.push('/admin')}
              className="px-4 py-2 bg-white text-black border-2 border-black rounded-lg hover:bg-black hover:text-white"
            >
              ← Voltar
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
            <p className="text-black">❌ {error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-black text-xl">Carregando dados financeiros...</p>
          </div>
        ) : data ? (
          <>
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                <div className="text-sm text-black mb-1">Receita Bruta</div>
                <div className="text-2xl font-bold text-black">
                  {formatCurrency(data.summary.totalReceived)}
                </div>
              </div>
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
                <div className="text-sm text-black mb-1">Taxas Stripe</div>
                <div className="text-2xl font-bold text-black">
                  {formatCurrency(data.summary.totalFees)}
                </div>
              </div>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                <div className="text-sm text-black mb-1">Receita Líquida</div>
                <div className="text-2xl font-bold text-black">
                  {formatCurrency(data.summary.netRevenue)}
                </div>
              </div>
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
                <div className="text-sm text-black mb-1">Transações</div>
                <div className="text-2xl font-bold text-black">{data.summary.transactionCount}</div>
              </div>
              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6">
                <div className="text-sm text-black mb-1">Ticket Médio</div>
                <div className="text-2xl font-bold text-black">
                  {formatCurrency(data.summary.averageTicket)}
                </div>
              </div>
            </div>

            {/* Receita por Mês */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-black mb-6">
                📊 Receita por Mês (Últimos 90 dias)
              </h2>
              <div className="bg-white border-2 border-black rounded-lg p-6">
                <div className="space-y-4">
                  {Object.entries(data.revenueByMonth)
                    .sort(([a], [b]) => b.localeCompare(a))
                    .map(([month, amount]) => {
                      const [year, monthNum] = month.split('-');
                      const monthName = new Date(
                        parseInt(year),
                        parseInt(monthNum) - 1
                      ).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                      return (
                        <div key={month} className="flex justify-between items-center">
                          <span className="text-black font-semibold capitalize">{monthName}</span>
                          <span className="text-black text-xl font-bold">
                            {formatCurrency(amount / 100)}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Transações Recentes */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-black mb-6">
                💳 Transações Recentes (50 últimas)
              </h2>
              <div className="bg-white border-2 border-black rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-black text-white">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Data</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Descrição</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Cliente</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Método</th>
                        <th className="px-6 py-3 text-right text-sm font-semibold">Valor</th>
                        <th className="px-6 py-3 text-center text-sm font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black">
                      {data.transactions.map(tx => (
                        <tr
                          key={tx.id}
                          className="hover:bg-black hover:text-white transition-colors"
                        >
                          <td className="px-6 py-4 text-sm text-black">{formatDate(tx.created)}</td>
                          <td className="px-6 py-4 text-sm text-black">{tx.description}</td>
                          <td className="px-6 py-4 text-sm text-black">{tx.customerEmail}</td>
                          <td className="px-6 py-4 text-sm text-black uppercase">
                            {tx.paymentMethod}
                          </td>
                          <td className="px-6 py-4 text-sm text-black text-right font-bold">
                            {formatCurrency(tx.amount)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Payouts */}
            {data.payouts.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-black mb-6">🏦 Transferências (Payouts)</h2>
                <div className="bg-white border-2 border-black rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-black text-white">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-semibold">
                            Data Criação
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold">
                            Data Chegada
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold">Método</th>
                          <th className="px-6 py-3 text-right text-sm font-semibold">Valor</th>
                          <th className="px-6 py-3 text-center text-sm font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black">
                        {data.payouts.map(payout => (
                          <tr
                            key={payout.id}
                            className="hover:bg-black hover:text-white transition-colors"
                          >
                            <td className="px-6 py-4 text-sm text-black">
                              {formatDate(payout.created)}
                            </td>
                            <td className="px-6 py-4 text-sm text-black">
                              {formatDate(payout.arrivalDate)}
                            </td>
                            <td className="px-6 py-4 text-sm text-black uppercase">
                              {payout.method}
                            </td>
                            <td className="px-6 py-4 text-sm text-black text-right font-bold">
                              {formatCurrency(payout.amount)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span
                                className={`px-2 py-1 rounded text-xs font-semibold ${
                                  payout.status === 'paid'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {payout.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
