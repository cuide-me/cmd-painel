'use client';

import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminInactivityTimeout } from '@/hooks/useAdminInactivityTimeout';

interface CuidadoresData {
  overview: {
    cuidadoresAtivos: number;
    taxaRetencao: number;
    disponibilidadeMedia: number;
  };
  performance: {
    topPerformers: Array<{
      nome: string;
      atendimentos: number;
      nps: number;
    }>;
    npsGeral: number;
    taxaAceite: number;
    taxaConclusao: number;
  };
  porEspecialidade: Array<{ especialidade: string; quantidade: number }>;
  porCidade: Array<{ cidade: string; quantidade: number }>;
  engagement: {
    altamenteAtivos: number;
    moderadamenteAtivos: number;
    inativos: number;
  };
}

export default function CuidadoresPage() {
  useAdminAuth();
  useAdminInactivityTimeout(true);
  
  const [data, setData] = useState<CuidadoresData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const response = await fetch('/api/admin/cuidadores');
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Cuidadores (Oferta)</h1>

        {/* Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Cuidadores Ativos</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {data?.overview.cuidadoresAtivos}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Taxa de Retenção</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {data?.overview.taxaRetencao.toFixed(1)}%
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Disponibilidade Média</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {data?.overview.disponibilidadeMedia.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Performance */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="text-sm text-gray-600">NPS Geral</div>
              <div className="text-3xl font-bold text-blue-600 mt-2">
                {data?.performance.npsGeral.toFixed(0)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Taxa de Aceite</div>
              <div className="text-3xl font-bold text-blue-600 mt-2">
                {data?.performance.taxaAceite.toFixed(1)}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Taxa de Conclusão</div>
              <div className="text-3xl font-bold text-blue-600 mt-2">
                {data?.performance.taxaConclusao.toFixed(1)}%
              </div>
            </div>
          </div>

          <h3 className="text-lg font-medium text-gray-900 mb-3">Top Performers</h3>
          <div className="space-y-3">
            {data?.performance.topPerformers.map((performer, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900">{performer.nome}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600">{performer.atendimentos} atendimentos</span>
                  <span className="text-green-600 font-medium">NPS: {performer.nps.toFixed(0)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Por Especialidade */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Por Especialidade</h2>
            <div className="space-y-3">
              {data?.porEspecialidade.slice(0, 6).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-900">{item.especialidade}</span>
                  <span className="text-lg font-semibold text-blue-600">{item.quantidade}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Por Cidade */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Por Cidade</h2>
            <div className="space-y-3">
              {data?.porCidade.slice(0, 6).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-900">{item.cidade}</span>
                  <span className="text-lg font-semibold text-blue-600">{item.quantidade}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Engagement */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Nível de Engajamento</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-green-700">Altamente Ativos</div>
              <div className="text-3xl font-bold text-green-900 mt-2">
                {data?.engagement.altamenteAtivos}
              </div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-sm text-yellow-700">Moderadamente Ativos</div>
              <div className="text-3xl font-bold text-yellow-900 mt-2">
                {data?.engagement.moderadamenteAtivos}
              </div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-sm text-red-700">Inativos</div>
              <div className="text-3xl font-bold text-red-900 mt-2">
                {data?.engagement.inativos}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
