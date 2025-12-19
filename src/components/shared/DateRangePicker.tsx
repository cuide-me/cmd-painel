/**
 * ────────────────────────────────────────────────────────────────────────────
 * DATE RANGE PICKER - Filtro de Datas
 * ────────────────────────────────────────────────────────────────────────────
 * 
 * Componente para seleção de intervalo de datas com presets comuns.
 */

'use client';

import React, { useState } from 'react';

export interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
}

export interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  presets?: DateRange[];
}

const defaultPresets: DateRange[] = [
  { startDate: '7daysAgo', endDate: 'today', label: 'Últimos 7 dias' },
  { startDate: '30daysAgo', endDate: 'today', label: 'Últimos 30 dias' },
  { startDate: '90daysAgo', endDate: 'today', label: 'Últimos 90 dias' },
  { startDate: '180daysAgo', endDate: 'today', label: 'Últimos 6 meses' },
  { startDate: '365daysAgo', endDate: 'today', label: 'Último ano' },
];

export function DateRangePicker({
  value,
  onChange,
  presets = defaultPresets,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePresetClick = (preset: DateRange) => {
    onChange(preset);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span>📅</span>
        <span>{value.label}</span>
        <span className="text-gray-400">▼</span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 px-3 py-2 uppercase tracking-wide">
                Período
              </div>
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePresetClick(preset)}
                  className={`
                    w-full text-left px-3 py-2 rounded-md text-sm transition-colors
                    ${
                      preset.label === value.label
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
