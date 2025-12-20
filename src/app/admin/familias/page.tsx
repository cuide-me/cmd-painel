'use client';

import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminInactivityTimeout } from '@/hooks/useAdminInactivityTimeout';
import { authFetch } from '@/lib/client/authFetch';

interface FamiliasData {
  overview: {
    familiasAtivas: number;
    tempoRespostaMedia: number;
    satisfacaoMedia: number;
  };
  jornada: {
    cadastradas: number;
    comSolicitacao: number;
    comMatch: number;
    concluidas: number;
    taxas: {
      cadastroParaSolicitacao: number;
      solicitacaoParaMatch: number;
      matchParaConclusao: number;
    };
  };
  urgencias: {
    solicitacoesAtrasadas: number;
    familiasInsatisfeitas: number;
  };
  porEstado: Array<{ estado: string; quantidade: number }>;
  porEspecialidade: Array<{ especialidade: string; quantidade: number }>;
}

export default function FamiliasPage() {
  useAdminAuth();
  useAdminInactivityTimeout(true);
  
  const [data, setData] = useState<FamiliasData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const response = await authFetch('/api/admin/familias');
      if (!response.ok) throw new Error('Erro ao carregar dados');
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Famílias (Demanda)</h1>

        {/* Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Famílias Ativas</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {data?.overview.familiasAtivas}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Tempo Resposta Médio</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {data?.overview.tempoRespostaMedia.toFixed(1)}h
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Satisfação Média</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {data?.overview.satisfacaoMedia.toFixed(1)}/5
            </div>
          </div>
        </div>

        {/* Jornada */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Jornada da Família</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-gray-600 text-sm mb-2">Cadastradas</div>
              <div className="text-3xl font-bold text-blue-600">
                {data?.jornada.cadastradas}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-600 text-sm mb-2">Com Solicitação</div>
              <div className="text-3xl font-bold text-blue-600">
                {data?.jornada.comSolicitacao}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {data?.jornada.taxas.cadastroParaSolicitacao.toFixed(0)}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-600 text-sm mb-2">Com Match</div>
              <div className="text-3xl font-bold text-blue-600">
                {data?.jornada.comMatch}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {data?.jornada.taxas.solicitacaoParaMatch.toFixed(0)}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-600 text-sm mb-2">Concluídas</div>
              <div className="text-3xl font-bold text-green-600">
                {data?.jornada.concluidas}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {data?.jornada.taxas.matchParaConclusao.toFixed(0)}%
              </div>
            </div>
          </div>
        </div>

        {/* Urgências */}
        {((data?.urgencias?.solicitacoesAtrasadas ?? 0) > 0 || (data?.urgencias?.familiasInsatisfeitas ?? 0) > 0) && (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-6">
            <h3 className="text-lg font-bold text-red-900 mb-3">⚠️ Urgências</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-red-700">Solicitações Atrasadas (&gt;48h)</div>
                <div className="text-2xl font-bold text-red-900">
                  {data?.urgencias.solicitacoesAtrasadas}
                </div>
              </div>
              <div>
                <div className="text-sm text-red-700">Famílias Insatisfeitas</div>
                <div className="text-2xl font-bold text-red-900">
                  {data?.urgencias.familiasInsatisfeitas}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Por Estado */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Por Estado</h2>
            <div className="space-y-3">
              {data?.porEstado.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-900">{item.estado}</span>
                  <span className="text-lg font-semibold text-blue-600">{item.quantidade}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Por Especialidade */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Por Especialidade</h2>
            <div className="space-y-3">
              {data?.porEspecialidade.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-900">{item.especialidade}</span>
                  <span className="text-lg font-semibold text-blue-600">{item.quantidade}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
