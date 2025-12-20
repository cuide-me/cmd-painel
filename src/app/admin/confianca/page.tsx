'use client';

import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminInactivityTimeout } from '@/hooks/useAdminInactivityTimeout';
import { authFetch } from '@/lib/client/authFetch';

interface ConfiancaData {
  suporte: {
    ticketsAbertos: number;
    ticketsResolvidos: number;
    ticketsPendentes: number;
    tempoMedioResposta: number;
    slaAtendimento: number;
    urgentes: number;
  };
  satisfacao: {
    npsGeral: number;
    promotores: number;
    neutros: number;
    detratores: number;
    totalRespostas: number;
  };
  qualidade: {
    matchQuality: number;
    taxaConclusao: number;
    taxaCancelamento: number;
    mediaAvaliacoes: number;
  };
  acoes: Array<{
    area: string;
    acao: string;
    prioridade: string;
    impactoEsperado: string;
  }>;
}

export default function ConfiancaPage() {
  useAdminAuth();
  useAdminInactivityTimeout(true);
  
  const [data, setData] = useState<ConfiancaData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const response = await authFetch('/api/admin/confianca-qualidade');
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Confiança & Qualidade</h1>

        {/* Suporte */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Suporte</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-700">Tickets Abertos</div>
              <div className="text-3xl font-bold text-blue-900 mt-1">
                {data?.suporte.ticketsAbertos}
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-green-700">Resolvidos</div>
              <div className="text-3xl font-bold text-green-900 mt-1">
                {data?.suporte.ticketsResolvidos}
              </div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-sm text-yellow-700">Pendentes</div>
              <div className="text-3xl font-bold text-yellow-900 mt-1">
                {data?.suporte.ticketsPendentes}
              </div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-sm text-red-700">Urgentes</div>
              <div className="text-3xl font-bold text-red-900 mt-1">
                {data?.suporte.urgentes}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-gray-600">Tempo Médio de Resposta</span>
              <span className="font-bold text-gray-900">{data?.suporte.tempoMedioResposta}h</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-gray-600">SLA Atendimento</span>
              <span className={`font-bold ${
                (data?.suporte.slaAtendimento || 0) >= 90 ? 'text-green-600' : 'text-red-600'
              }`}>
                {data?.suporte.slaAtendimento.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* NPS */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Satisfação (NPS)</h2>
          <div className="text-center mb-6">
            <div className="text-6xl font-bold text-blue-600">
              {data?.satisfacao.npsGeral.toFixed(0)}
            </div>
            <div className="text-gray-600 mt-2">NPS Geral</div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-green-700">Promotores</div>
              <div className="text-2xl font-bold text-green-900 mt-1">
                {data?.satisfacao.promotores}
              </div>
              <div className="text-xs text-green-600 mt-1">
                {(data?.satisfacao?.totalRespostas ?? 0) > 0 
                  ? (((data?.satisfacao?.promotores ?? 0) / (data?.satisfacao?.totalRespostas ?? 1)) * 100).toFixed(0)
                  : 0}%
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-700">Neutros</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {data?.satisfacao.neutros}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {(data?.satisfacao?.totalRespostas ?? 0) > 0 
                  ? (((data?.satisfacao?.neutros ?? 0) / (data?.satisfacao?.totalRespostas ?? 1)) * 100).toFixed(0)
                  : 0}%
              </div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-sm text-red-700">Detratores</div>
              <div className="text-2xl font-bold text-red-900 mt-1">
                {data?.satisfacao.detratores}
              </div>
              <div className="text-xs text-red-600 mt-1">
                {(data?.satisfacao?.totalRespostas ?? 0) > 0 
                  ? (((data?.satisfacao?.detratores ?? 0) / (data?.satisfacao?.totalRespostas ?? 1)) * 100).toFixed(0)
                  : 0}%
              </div>
            </div>
          </div>
        </div>

        {/* Qualidade */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Qualidade dos Atendimentos</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-600">Qualidade do Match</div>
              <div className="text-3xl font-bold text-blue-600 mt-1">
                {data?.qualidade.matchQuality.toFixed(0)}/100
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Taxa de Conclusão</div>
              <div className="text-3xl font-bold text-green-600 mt-1">
                {data?.qualidade.taxaConclusao.toFixed(1)}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Taxa de Cancelamento</div>
              <div className="text-3xl font-bold text-red-600 mt-1">
                {data?.qualidade.taxaCancelamento.toFixed(1)}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Média de Avaliações</div>
              <div className="text-3xl font-bold text-yellow-600 mt-1">
                {data?.qualidade.mediaAvaliacoes.toFixed(1)}/5
              </div>
            </div>
          </div>
        </div>

        {/* Ações Recomendadas */}
        {data?.acoes && data.acoes.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Ações Recomendadas</h2>
            <div className="space-y-3">
              {data.acoes.map((acao, index) => (
                <div
                  key={index}
                  className={`border-l-4 p-4 ${
                    acao.prioridade === 'critica'
                      ? 'bg-red-50 border-red-500'
                      : acao.prioridade === 'alta'
                      ? 'bg-yellow-50 border-yellow-500'
                      : 'bg-blue-50 border-blue-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase text-gray-600">
                          {acao.area}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          acao.prioridade === 'critica'
                            ? 'bg-red-100 text-red-800'
                            : acao.prioridade === 'alta'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {acao.prioridade}
                        </span>
                      </div>
                      <div className="font-medium text-gray-900">{acao.acao}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        💡 {acao.impactoEsperado}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
