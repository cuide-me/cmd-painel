'use client';

import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminInactivityTimeout } from '@/hooks/useAdminInactivityTimeout';
import { authFetch } from '@/lib/client/authFetch';

interface PipelineData {
  funil: {
    etapas: Array<{
      nome: string;
      descricao: string;
      quantidade: number;
      percentualDoInicio: number;
      taxaConversaoAteProxima: number;
    }>;
    taxaConversaoGeral: number;
  };
  taxasConversao: {
    cadastroParaSolicitacao: number;
    solicitacaoParaMatch: number;
    matchParaConclusao: number;
    cadastroParaConclusao: number;
  };
  gargalos: {
    identificados: Array<{
      etapa: string;
      problema: string;
      impacto: number;
      volumeAfetado: number;
      acaoSugerida: string;
      prioridade: string;
    }>;
  };
  previsoes: {
    proximoMes: {
      cadastrosEsperados: number;
      solicitacoesEsperadas: number;
      matchesEsperados: number;
      conclusoesEsperadas: number;
    };
  };
}

export default function PipelinePage() {
  useAdminAuth();
  useAdminInactivityTimeout(true);
  
  const [data, setData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const response = await authFetch('/api/admin/pipeline');
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Pipeline de Conversão</h1>

        {/* Funil */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Funil Completo</h2>
          <div className="space-y-4">
            {data?.funil.etapas.map((etapa, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium text-gray-900">{etapa.nome}</div>
                    <div className="text-sm text-gray-600">{etapa.descricao}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{etapa.quantidade}</div>
                    <div className="text-sm text-gray-600">
                      {etapa.percentualDoInicio.toFixed(1)}% do início
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${etapa.percentualDoInicio}%` }}
                  />
                </div>
                {index < data.funil.etapas.length - 1 && (
                  <div className="text-sm text-gray-600 mt-2 ml-2">
                    ↓ {etapa.taxaConversaoAteProxima.toFixed(1)}% convertem para próxima etapa
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-lg font-medium text-gray-900">
              Taxa de Conversão Geral:{' '}
              <span className="text-blue-600">{data?.funil.taxaConversaoGeral.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Gargalos */}
        {data?.gargalos.identificados && data.gargalos.identificados.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Gargalos Identificados</h2>
            <div className="space-y-4">
              {data.gargalos.identificados.map((gargalo, index) => (
                <div
                  key={index}
                  className={`border-l-4 p-4 ${
                    gargalo.prioridade === 'critica'
                      ? 'bg-red-50 border-red-500'
                      : 'bg-yellow-50 border-yellow-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{gargalo.etapa}</div>
                      <div className="text-sm text-gray-700 mt-1">{gargalo.problema}</div>
                      <div className="text-sm text-gray-600 mt-2">
                        💡 {gargalo.acaoSugerida}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-red-600">
                        {gargalo.impacto.toFixed(0)}%
                      </div>
                      <div className="text-sm text-gray-600">{gargalo.volumeAfetado} afetados</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Previsões */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Previsões para Próximo Mês</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-600">Cadastros</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {data?.previsoes.proximoMes.cadastrosEsperados}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Solicitações</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {data?.previsoes.proximoMes.solicitacoesEsperadas}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Matches</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {data?.previsoes.proximoMes.matchesEsperados}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Conclusões</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {data?.previsoes.proximoMes.conclusoesEsperadas}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
