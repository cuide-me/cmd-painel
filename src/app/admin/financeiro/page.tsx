'use client';

import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminInactivityTimeout } from '@/hooks/useAdminInactivityTimeout';

interface FinanceiroData {
  receita: {
    total: number;
    crescimento: {
      variacao: number;
      tendencia: string;
    };
  };
  transacoes: {
    total: number;
    sucesso: number;
    taxaSucesso: number;
    valorMedio: number;
  };
  assinaturas: {
    ativas: number;
    mrr: number;
    arr: number;
    churnRate: number;
    ltv: number;
  };
  metricas: {
    gmv: number;
    comissaoPlataforma: number;
    margemBruta: number;
    margemLiquida: number;
    ticketMedio: number;
  };
  projecoes: {
    proximoMes: {
      receitaEsperada: number;
      mrr: number;
    };
    proximo12Meses: {
      receitaTotal: number;
      arr: number;
    };
  };
}

export default function FinanceiroPage() {
  useAdminAuth();
  useAdminInactivityTimeout(true);
  
  const [data, setData] = useState<FinanceiroData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const response = await fetch('/api/admin/financeiro-detalhado');
      if (!response.ok) throw new Error('Erro ao carregar dados');
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Financeiro Detalhado</h1>

        {/* Receita */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Receita</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-gray-600">Total (30 dias)</div>
              <div className="text-4xl font-bold text-gray-900 mt-1">
                {formatCurrency(data?.receita.total || 0)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Crescimento</div>
              <div className={`text-4xl font-bold mt-1 ${
                (data?.receita.crescimento.variacao || 0) > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(data?.receita.crescimento.variacao || 0) > 0 ? '+' : ''}
                {data?.receita.crescimento.variacao.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 mt-1 capitalize">
                {data?.receita.crescimento.tendencia}
              </div>
            </div>
          </div>
        </div>

        {/* Transações */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Transações</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-600">Total</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {data?.transacoes.total}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Sucesso</div>
              <div className="text-2xl font-bold text-green-600 mt-1">
                {data?.transacoes.sucesso}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Taxa de Sucesso</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">
                {data?.transacoes.taxaSucesso.toFixed(1)}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Valor Médio</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(data?.transacoes.valorMedio || 0)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Assinaturas */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Assinaturas</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Assinaturas Ativas</span>
                <span className="text-2xl font-bold text-gray-900">{data?.assinaturas.ativas}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">MRR</span>
                <span className="text-2xl font-bold text-blue-600">
                  {formatCurrency(data?.assinaturas.mrr || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">ARR</span>
                <span className="text-2xl font-bold text-blue-600">
                  {formatCurrency(data?.assinaturas.arr || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Churn Rate</span>
                <span className="text-2xl font-bold text-red-600">
                  {data?.assinaturas.churnRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">LTV Médio</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(data?.assinaturas.ltv || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Métricas */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Métricas</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">GMV</span>
                <span className="text-2xl font-bold text-gray-900">
                  {formatCurrency(data?.metricas.gmv || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Comissão Plataforma</span>
                <span className="text-2xl font-bold text-blue-600">
                  {formatCurrency(data?.metricas.comissaoPlataforma || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Margem Bruta</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(data?.metricas.margemBruta || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Margem Líquida</span>
                <span className="text-2xl font-bold text-green-600">
                  {data?.metricas.margemLiquida.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Ticket Médio</span>
                <span className="text-2xl font-bold text-gray-900">
                  {formatCurrency(data?.metricas.ticketMedio || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Projeções */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Projeções</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-700 mb-2">Próximo Mês</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Receita Esperada</span>
                  <span className="font-bold text-blue-900">
                    {formatCurrency(data?.projecoes.proximoMes.receitaEsperada || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">MRR</span>
                  <span className="font-bold text-blue-900">
                    {formatCurrency(data?.projecoes.proximoMes.mrr || 0)}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-green-700 mb-2">Próximos 12 Meses</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Receita Total</span>
                  <span className="font-bold text-green-900">
                    {formatCurrency(data?.projecoes.proximo12Meses.receitaTotal || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">ARR</span>
                  <span className="font-bold text-green-900">
                    {formatCurrency(data?.projecoes.proximo12Meses.arr || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
