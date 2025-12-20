'use client';

import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminInactivityTimeout } from '@/hooks/useAdminInactivityTimeout';
import { authFetch } from '@/lib/client/authFetch';

interface FriccaoData {
  friccoes: Array<{
    id: string;
    etapa: string;
    descricao: string;
    tipo: string;
    gravidade: string;
    frequencia: number;
    usuariosAfetados: number;
    impactoConversao: number;
  }>;
  impactoTotal: {
    usuariosPerdidos: number;
    receitaPerdida: number;
    conversaoPerdida: number;
  };
  priorizacao: Array<{
    friccaoId: string;
    score: number;
    roi: number;
    esforco: string;
    impacto: string;
  }>;
  recomendacoes: Array<{
    friccaoId: string;
    solucao: string;
    passos: string[];
    resultadoEsperado: string;
    prazo: string;
  }>;
}

export default function FriccaoPage() {
  useAdminAuth();
  useAdminInactivityTimeout(true);
  
  const [data, setData] = useState<FriccaoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const response = await authFetch('/api/admin/friccao');
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Pontos de Fricção</h1>

        {/* Impacto Total */}
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-red-900 mb-4">⚠️ Impacto Total das Fricções</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-sm text-gray-600">Usuários Perdidos</div>
              <div className="text-3xl font-bold text-red-600 mt-1">
                {data?.impactoTotal.usuariosPerdidos}
              </div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-sm text-gray-600">Receita Perdida</div>
              <div className="text-3xl font-bold text-red-600 mt-1">
                {formatCurrency(data?.impactoTotal.receitaPerdida || 0)}
              </div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-sm text-gray-600">Conversão Perdida</div>
              <div className="text-3xl font-bold text-red-600 mt-1">
                {data?.impactoTotal.conversaoPerdida.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Fricções Identificadas */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Fricções Identificadas</h2>
          <div className="space-y-4">
            {data?.friccoes
              .sort((a, b) => {
                const prioridadeOrder = { critica: 0, alta: 1, media: 2, baixa: 3 };
                return prioridadeOrder[a.gravidade as keyof typeof prioridadeOrder] - 
                       prioridadeOrder[b.gravidade as keyof typeof prioridadeOrder];
              })
              .map((friccao, index) => {
                const recomendacao = data.recomendacoes.find(r => r.friccaoId === friccao.id);
                const priorizacao = data.priorizacao.find(p => p.friccaoId === friccao.id);
                
                return (
                  <div
                    key={index}
                    className={`border-l-4 p-4 ${
                      friccao.gravidade === 'critica'
                        ? 'bg-red-50 border-red-500'
                        : friccao.gravidade === 'alta'
                        ? 'bg-orange-50 border-orange-500'
                        : 'bg-yellow-50 border-yellow-500'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${
                            friccao.gravidade === 'critica'
                              ? 'bg-red-100 text-red-800'
                              : friccao.gravidade === 'alta'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {friccao.gravidade}
                          </span>
                          <span className="text-xs text-gray-500 uppercase">{friccao.tipo}</span>
                        </div>
                        <div className="font-bold text-lg text-gray-900">{friccao.etapa}</div>
                        <div className="text-gray-700 mt-1">{friccao.descricao}</div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-sm text-gray-600">Impacto</div>
                        <div className="text-2xl font-bold text-red-600">
                          {friccao.impactoConversao.toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {friccao.usuariosAfetados} afetados
                        </div>
                      </div>
                    </div>

                    {recomendacao && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="font-medium text-gray-900 mb-2">
                          💡 {recomendacao.solucao}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-2">Passos:</div>
                            <ul className="text-sm space-y-1">
                              {recomendacao.passos.map((passo, i) => (
                                <li key={i} className="text-gray-600">• {passo}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-700">Resultado Esperado:</div>
                            <div className="text-sm text-green-700 mt-1">{recomendacao.resultadoEsperado}</div>
                            <div className="text-sm text-gray-600 mt-2">
                              <strong>Prazo:</strong> {recomendacao.prazo}
                            </div>
                            {priorizacao && (
                              <div className="text-sm text-gray-600 mt-1">
                                <strong>ROI Estimado:</strong> {formatCurrency(priorizacao.roi)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* Priorização */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Matriz de Priorização</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Fricção</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Score</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Esforço</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Impacto</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.priorizacao
                  .sort((a, b) => b.score - a.score)
                  .map((item, index) => {
                    const friccao = data.friccoes.find(f => f.id === item.friccaoId);
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {friccao?.etapa}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-800 font-bold">
                            {item.score.toFixed(0)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            item.esforco === 'baixo'
                              ? 'bg-green-100 text-green-800'
                              : item.esforco === 'medio'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {item.esforco}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            item.impacto === 'alto'
                              ? 'bg-red-100 text-red-800'
                              : item.impacto === 'medio'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {item.impacto}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                          {formatCurrency(item.roi)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
