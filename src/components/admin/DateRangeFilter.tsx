'use client';

/**
 * ═══════════════════════════════════════════════════════════
 * COMPONENTE: Date Range Filter
 * ═══════════════════════════════════════════════════════════
 * Filtro reutilizável de período
 */

import { useState } from 'react';

export type DateRange = {
  startDate: string;
  endDate: string;
};

export type Preset = '7d' | '30d' | '90d' | 'all' | 'custom';

interface DateRangeFilterProps {
  onRangeChange: (range: DateRange) => void;
  defaultPreset?: Preset;
}

export default function DateRangeFilter({ onRangeChange, defaultPreset = '30d' }: DateRangeFilterProps) {
  const [preset, setPreset] = useState<Preset>(defaultPreset);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const getDateRange = (preset: Preset): DateRange => {
    const now = new Date();
    const end = now.toISOString().split('T')[0];
    let start = end;

    switch (preset) {
      case '7d':
        const d7 = new Date(now);
        d7.setDate(d7.getDate() - 7);
        start = d7.toISOString().split('T')[0];
        break;
      case '30d':
        const d30 = new Date(now);
        d30.setDate(d30.getDate() - 30);
        start = d30.toISOString().split('T')[0];
        break;
      case '90d':
        const d90 = new Date(now);
        d90.setDate(d90.getDate() - 90);
        start = d90.toISOString().split('T')[0];
        break;
      case 'all':
        start = '2020-01-01';
        break;
      case 'custom':
        return { startDate: customStart, endDate: customEnd };
    }

    return { startDate: start, endDate: end };
  };

  const handlePresetChange = (newPreset: Preset) => {
    setPreset(newPreset);
    if (newPreset !== 'custom') {
      const range = getDateRange(newPreset);
      onRangeChange(range);
    }
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      onRangeChange({ startDate: customStart, endDate: customEnd });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-gray-700">📅 Período:</span>
        
        <div className="flex gap-2">
          <button
            onClick={() => handlePresetChange('7d')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              preset === '7d'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            7 dias
          </button>
          <button
            onClick={() => handlePresetChange('30d')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              preset === '30d'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            30 dias
          </button>
          <button
            onClick={() => handlePresetChange('90d')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              preset === '90d'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            90 dias
          </button>
          <button
            onClick={() => handlePresetChange('all')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              preset === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => handlePresetChange('custom')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              preset === 'custom'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Personalizado
          </button>
        </div>

        {preset === 'custom' && (
          <div className="flex items-center gap-2 ml-auto">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-1.5 border rounded text-sm"
            />
            <span className="text-gray-500">até</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-1.5 border rounded text-sm"
            />
            <button
              onClick={handleCustomApply}
              disabled={!customStart || !customEnd}
              className="px-4 py-1.5 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Aplicar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
