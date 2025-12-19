'use client';

import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminInactivityTimeout } from '@/hooks/useAdminInactivityTimeout';

interface MarketplaceData {
  supplyDemand: {
    ratio: number;
    activeSupply: number;
    activeDemand: number;
    status: string;
  };
  matchQuality: {
    score: number;
    avgTime: number;
    successRate: number;
  };
  coverage: {
    cities: number;
    states: number;
    topCities: Array<{ city: string; coverage: number }>;
  };
  specialtyBalance: {
    balanced: number;
    needSupply: string[];
    oversupplied: string[];
  };
}

export default function MarketplacePage() {
  useAdminAuth();
  useAdminInactivityTimeout(true);
  
  const [data, setData] = useState<MarketplaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/marketplace-validation');
      if (!response.ok) throw new Error('Erro ao carregar dados');
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err.message);
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">Erro: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Validação de Marketplace</h1>
          <p className="text-gray-600 mt-2">Análise de equilíbrio entre oferta e demanda</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Supply/Demand Ratio */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Razão Oferta/Demanda</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {data?.supplyDemand.ratio.toFixed(2)}
            </div>
            <div className={`text-sm mt-2 ${
              data?.supplyDemand.status === 'saudável' ? 'text-green-600' :
              data?.supplyDemand.status === 'atenção' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {data?.supplyDemand.status}
            </div>
          </div>

          {/* Match Quality */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Qualidade do Match</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {data?.matchQuality.score.toFixed(0)}/100
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Taxa de sucesso: {data?.matchQuality.successRate.toFixed(1)}%
            </div>
          </div>

          {/* Geographic Coverage */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Cobertura Geográfica</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {data?.coverage.cities}
            </div>
            <div className="text-sm text-gray-600 mt-2">
              cidades em {data?.coverage.states} estados
            </div>
          </div>

          {/* Specialty Balance */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Especialidades Balanceadas</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {data?.specialtyBalance.balanced}%
            </div>
            <div className="text-sm text-gray-600 mt-2">
              das especialidades
            </div>
          </div>
        </div>

        {/* Top Cities */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Principais Cidades</h2>
          <div className="space-y-3">
            {data?.coverage.topCities.map((city, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-900">{city.city}</span>
                <div className="flex items-center gap-3">
                  <div className="w-48 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${city.coverage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {city.coverage.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Specialty Issues */}
        {(data?.specialtyBalance?.needSupply?.length ?? 0) > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6">
            <h3 className="text-lg font-bold text-yellow-900 mb-2">
              Especialidades com Falta de Oferta
            </h3>
            <div className="flex flex-wrap gap-2">
              {data?.specialtyBalance?.needSupply?.map((spec, index) => (
                <span
                  key={index}
                  className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
