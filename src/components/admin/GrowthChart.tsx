'use client';

import { useState, useEffect } from 'react';

interface GrowthData {
  date: string;
  profissionais: number;
  clientes: number;
  total: number;
}

interface GrowthChartProps {
  initialDays?: number;
}

export function GrowthChart({ initialDays = 7 }: GrowthChartProps) {
  const [data, setData] = useState<GrowthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | '7' | '15' | 'custom'>(
    initialDays === 1 ? 'today' : initialDays === 7 ? '7' : '15'
  );
  const [customDays, setCustomDays] = useState(30);
  const [showCustomInput, setShowCustomInput] = useState(false);

  const fetchData = async (days: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/growth?days=${days}`);
      const result = await response.json();
      setData(result.chartData || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const days = period === 'today' ? 1 : period === '7' ? 7 : period === '15' ? 15 : customDays;
    fetchData(days);
  }, [period, customDays]);

  const handlePeriodChange = (newPeriod: typeof period) => {
    setPeriod(newPeriod);
    setShowCustomInput(newPeriod === 'custom');
  };

  const maxValue = Math.max(...data.map(d => Math.max(d.profissionais, d.clientes, d.total)), 1);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="bg-white border border-black rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-black">📈 Crescimento de Usuários</h3>
          <p className="text-sm text-black mt-1">Novos cadastros por dia</p>
        </div>

        {/* Filtros de período */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePeriodChange('today')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              period === 'today'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-black hover:bg-black hover:text-white'
            }`}
          >
            Hoje
          </button>
          <button
            onClick={() => handlePeriodChange('7')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              period === '7'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-black hover:bg-black hover:text-white'
            }`}
          >
            7 dias
          </button>
          <button
            onClick={() => handlePeriodChange('15')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              period === '15'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-black hover:bg-black hover:text-white'
            }`}
          >
            15 dias
          </button>
          <button
            onClick={() => handlePeriodChange('custom')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              period === 'custom'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-black hover:bg-black hover:text-white'
            }`}
          >
            Custom
          </button>

          {showCustomInput && (
            <input
              type="number"
              min="1"
              max="90"
              value={customDays}
              onChange={e => setCustomDays(Number(e.target.value))}
              className="w-20 px-2 py-1.5 border-2 border-black rounded-lg text-sm text-black"
              placeholder="Dias"
            />
          )}
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-black">Carregando gráfico...</p>
        </div>
      ) : (
        <>
          {/* Legenda */}
          <div className="flex items-center gap-6 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <span className="text-sm text-black">Profissionais</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              <span className="text-sm text-black">Clientes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
              <span className="text-sm text-black">Total</span>
            </div>
          </div>

          {/* Gráfico de barras */}
          <div className="relative h-64">
            <div className="absolute inset-0 flex items-end gap-1 px-2">
              {data.map((item, index) => (
                <div key={item.date} className="flex-1 flex flex-col items-center gap-1">
                  {/* Barra Total */}
                  <div
                    className="w-full bg-purple-200 rounded-t hover:bg-purple-300 transition-colors relative group"
                    style={{ height: `${(item.total / maxValue) * 100}%` }}
                  >
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      Total: {item.total}
                    </div>
                  </div>

                  {/* Barra Profissionais */}
                  <div
                    className="w-full bg-blue-500 hover:bg-blue-600 transition-colors relative group"
                    style={{ height: `${(item.profissionais / maxValue) * 100}%` }}
                  >
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      Prof: {item.profissionais}
                    </div>
                  </div>

                  {/* Barra Clientes */}
                  <div
                    className="w-full bg-green-500 hover:bg-green-600 transition-colors relative group"
                    style={{ height: `${(item.clientes / maxValue) * 100}%` }}
                  >
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      Clientes: {item.clientes}
                    </div>
                  </div>

                  {/* Label da data */}
                  <span className="text-xs text-black mt-1">{formatDate(item.date)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totais */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-black">Profissionais</p>
              <p className="text-2xl font-bold text-blue-600">
                {data.reduce((sum, d) => sum + d.profissionais, 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-black">Clientes</p>
              <p className="text-2xl font-bold text-green-600">
                {data.reduce((sum, d) => sum + d.clientes, 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-black">Total</p>
              <p className="text-2xl font-bold text-purple-600">
                {data.reduce((sum, d) => sum + d.total, 0)}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
