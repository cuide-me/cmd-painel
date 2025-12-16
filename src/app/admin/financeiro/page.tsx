'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getAuth } from 'firebase/auth';
import { getFirebaseApp } from '@/firebase/firebaseApp';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { authFetch } from '@/lib/client/authFetch';

interface FinanceiroData {
  summary: {
    totalReceived: number;
    totalRefunded: number;
    totalFees: number;
    netRevenue: number;
    transactionCount: number;
    refundCount: number;
    refundRate: number;
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
    refunded: boolean;
    refundedAmount: number;
    partiallyRefunded: boolean;
    refunds: Array<{
      id: string;
      amount: number;
      created: number;
      reason: string | null;
      status: string;
    }>;
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
  const { authReady } = useFirebaseAuth();
  const [data, setData] = useState<FinanceiroData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await authFetch('/api/admin/financeiro');
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
    // Só buscar dados quando autenticação estiver pronta
    if (!authReady) return;

    fetchData();
  }, [authReady, fetchData]);

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
              className="cursor-pointer"
              onClick={() => router.push('/admin')}
            >
              <div className="text-3xl font-black bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
                Cuide.me
              </div>
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
              {/* Receita Bruta */}
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 group relative">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm text-black">Receita Bruta</div>
                  <div className="relative">
                    <span className="text-gray-400 cursor-help text-lg" title="Informações">ℹ️</span>
                    <div className="hidden group-hover:block absolute right-0 top-6 w-64 p-3 bg-black text-white text-xs rounded-lg shadow-lg z-10">
                      <strong>Receita Bruta:</strong> Total de pagamentos aprovados (succeeded) nos últimos 90 dias, antes de descontar taxas e reembolsos. Inclui todos os valores recebidos via Stripe.
                    </div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-black">
                  {formatCurrency(data.summary.totalReceived)}
                </div>
              </div>

              {/* Taxas Stripe */}
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 group relative">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm text-black">Taxas Stripe</div>
                  <div className="relative">
                    <span className="text-gray-400 cursor-help text-lg" title="Informações">ℹ️</span>
                    <div className="hidden group-hover:block absolute right-0 top-6 w-64 p-3 bg-black text-white text-xs rounded-lg shadow-lg z-10">
                      <strong>Taxas Stripe:</strong> Total de fees cobradas pelo Stripe (geralmente 4,99% + R$0,39 por transação). Inclui taxas de processamento de cartão, bandeira e gateway de pagamento.
                    </div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-black">
                  {formatCurrency(data.summary.totalFees)}
                </div>
              </div>

              {/* Receita Líquida */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 group relative">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm text-black">Receita Líquida</div>
                  <div className="relative">
                    <span className="text-gray-400 cursor-help text-lg" title="Informações">ℹ️</span>
                    <div className="hidden group-hover:block absolute right-0 top-6 w-64 p-3 bg-black text-white text-xs rounded-lg shadow-lg z-10">
                      <strong>Receita Líquida:</strong> Valor real que você recebe. Calculado como: Receita Bruta - Taxas Stripe - Reembolsos. Este é o valor que será depositado em sua conta.
                    </div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-black">
                  {formatCurrency(data.summary.netRevenue)}
                </div>
              </div>

              {/* Transações */}
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6 group relative">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm text-black">Transações</div>
                  <div className="relative">
                    <span className="text-gray-400 cursor-help text-lg" title="Informações">ℹ️</span>
                    <div className="hidden group-hover:block absolute right-0 top-6 w-64 p-3 bg-black text-white text-xs rounded-lg shadow-lg z-10">
                      <strong>Transações:</strong> Número total de pagamentos aprovados (succeeded) nos últimos 90 dias. Não inclui pagamentos falhados, pendentes ou cancelados.
                    </div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-black">{data.summary.transactionCount}</div>
              </div>

              {/* Ticket Médio */}
              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6 group relative">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm text-black">Ticket Médio</div>
                  <div className="relative">
                    <span className="text-gray-400 cursor-help text-lg" title="Informações">ℹ️</span>
                    <div className="hidden group-hover:block absolute right-0 top-6 w-64 p-3 bg-black text-white text-xs rounded-lg shadow-lg z-10">
                      <strong>Ticket Médio:</strong> Valor médio por transação. Calculado como: Receita Bruta ÷ Número de Transações. Útil para entender o comportamento de compra dos clientes.
                    </div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-black">
                  {formatCurrency(data.summary.averageTicket)}
                </div>
              </div>
            </div>

            {/* Card de Reembolsos */}
            {data.summary.refundCount > 0 && (
              <div className="mb-8 p-6 bg-yellow-50 border-2 border-yellow-300 rounded-lg group relative">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">↩️</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-bold text-black">Reembolsos</div>
                      <div className="relative">
                        <span className="text-gray-400 cursor-help text-lg" title="Informações">ℹ️</span>
                        <div className="hidden group-hover:block absolute left-0 top-6 w-72 p-3 bg-black text-white text-xs rounded-lg shadow-lg z-10">
                          <strong>Reembolsos:</strong> Total devolvido aos clientes por cancelamentos, insatisfação ou problemas com o serviço. Este valor já está descontado da Receita Líquida. Inclui reembolsos parciais e totais.
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {data.summary.refundCount} transação(ões) reembolsada(s)
                    </div>
                  </div>
                </div>
                <div className="text-3xl font-bold text-black mt-3">
                  {formatCurrency(data.summary.totalRefunded)}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="text-sm text-gray-600">
                    Total reembolsado aos clientes
                  </div>
                  <div className={`text-sm font-semibold px-2 py-1 rounded ${
                    data.summary.refundRate < 5
                      ? 'bg-green-100 text-green-700'
                      : data.summary.refundRate < 10
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {data.summary.refundRate.toFixed(1)}% de taxa de reembolso
                  </div>
                </div>
              </div>
            )}

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
                          className={`hover:bg-gray-50 transition-colors ${
                            tx.refunded ? 'bg-yellow-50' : ''
                          }`}
                        >
                          <td className="px-6 py-4 text-sm text-black">{formatDate(tx.created)}</td>
                          <td className="px-6 py-4 text-sm">
                            <div className="text-black">{tx.description}</div>
                            {tx.refunded && (
                              <div className="flex items-center gap-1 mt-1">
                                <span className="text-xs text-yellow-700">
                                  ↩️ Reembolsado: {formatCurrency(tx.refundedAmount)}
                                </span>
                                {tx.partiallyRefunded && (
                                  <span className="text-xs text-yellow-600">(Parcial)</span>
                                )}
                              </div>
                            )}
                            {tx.refunds.length > 0 && (
                              <div className="mt-1 space-y-1">
                                {tx.refunds.map(refund => (
                                  <div key={refund.id} className="text-xs text-gray-600">
                                    • {formatDate(refund.created)} - {formatCurrency(refund.amount)}
                                    {refund.reason && ` (${refund.reason})`}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-black">{tx.customerEmail}</td>
                          <td className="px-6 py-4 text-sm text-black uppercase">
                            {tx.paymentMethod}
                          </td>
                          <td className="px-6 py-4 text-sm text-black text-right font-bold">
                            {formatCurrency(tx.amount)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {tx.refunded ? (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
                                {tx.partiallyRefunded ? 'parcial refund' : 'refunded'}
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                                succeeded
                              </span>
                            )}
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
