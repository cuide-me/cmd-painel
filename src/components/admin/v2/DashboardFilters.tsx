'use client';

import { useState } from 'react';
import type { DashboardFilterPreset, DashboardDateGrouping } from '@/services/admin/dashboard';

interface DashboardFiltersProps {
  onFilterChange: (filters: {
    preset: DashboardFilterPreset;
    grouping: DashboardDateGrouping;
    startDate?: Date;
    endDate?: Date;
  }) => void;
}

export default function DashboardFilters({ onFilterChange }: DashboardFiltersProps) {
  const [preset, setPreset] = useState<DashboardFilterPreset>('this_month');
  const [grouping, setGrouping] = useState<DashboardDateGrouping>('day');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handlePresetChange = (newPreset: DashboardFilterPreset) => {
    setPreset(newPreset);
    if (newPreset !== 'custom') {
      onFilterChange({ preset: newPreset, grouping });
    }
  };

  const handleGroupingChange = (newGrouping: DashboardDateGrouping) => {
    setGrouping(newGrouping);
    onFilterChange({
      preset,
      grouping: newGrouping,
      ...(preset === 'custom' && startDate && endDate
        ? {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
          }
        : {}),
    });
  };

  const handleCustomDateChange = () => {
    if (startDate && endDate) {
      onFilterChange({
        preset: 'custom',
        grouping,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    }
  };

  return (
    <div className="bg-white border rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-black mb-4">Filtros</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Presets */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">Período</label>
          <select
            value={preset}
            onChange={e => handlePresetChange(e.target.value as DashboardFilterPreset)}
            className="w-full px-3 py-2 border rounded-lg text-black bg-white"
          >
            <option value="today">Hoje</option>
            <option value="last_7_days">Últimos 7 dias</option>
            <option value="this_month">Este mês</option>
            <option value="this_year">Este ano</option>
            <option value="since_august_2025">Desde Agosto/2025</option>
            <option value="custom">Intervalo customizado</option>
          </select>
        </div>

        {/* Agrupamento */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">Agrupar por</label>
          <select
            value={grouping}
            onChange={e => handleGroupingChange(e.target.value as DashboardDateGrouping)}
            className="w-full px-3 py-2 border rounded-lg text-black bg-white"
          >
            <option value="day">Dia</option>
            <option value="week">Semana</option>
            <option value="month">Mês</option>
          </select>
        </div>

        {/* Datas customizadas */}
        {preset === 'custom' && (
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-black mb-2">Intervalo</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg text-black bg-white"
              />
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg text-black bg-white"
              />
            </div>
            <button
              onClick={handleCustomDateChange}
              className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Aplicar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
