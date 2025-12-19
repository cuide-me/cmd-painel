/**
 * ────────────────────────────────────────────────────────────────────────────
 * ACQUISITION FUNNEL - Componente de Funil
 * ────────────────────────────────────────────────────────────────────────────
 */

'use client';

import React from 'react';

interface FunnelStage {
  name: string;
  value: number;
  conversionRate: number;
  dropoffRate: number;
}

export interface AcquisitionFunnelProps {
  stages: FunnelStage[];
  loading?: boolean;
}

export function AcquisitionFunnel({ stages, loading = false }: AcquisitionFunnelProps) {
  if (loading) {
    return (
      <div className="border rounded-lg bg-white shadow-sm p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const maxValue = stages[0]?.value || 1;

  return (
    <div className="border rounded-lg bg-white shadow-sm">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Funil de Aquisição</h3>
        <p className="text-sm text-gray-500 mt-1">
          Taxa de conversão em cada etapa do funil
        </p>
      </div>

      <div className="p-6">
        <div className="space-y-6">
          {stages.map((stage, index) => {
            const widthPercentage = (stage.value / maxValue) * 100;
            const isFirst = index === 0;

            return (
              <div key={stage.name} className="relative">
                {/* Stage Bar */}
                <div
                  className="relative h-16 rounded-lg transition-all"
                  style={{
                    width: `${widthPercentage}%`,
                    minWidth: '50%',
                    background: `linear-gradient(to right, 
                      ${isFirst ? '#3b82f6' : index === stages.length - 1 ? '#10b981' : '#6366f1'}, 
                      ${isFirst ? '#60a5fa' : index === stages.length - 1 ? '#34d399' : '#818cf8'})`,
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-between px-4 text-white">
                    <div>
                      <div className="font-semibold">{stage.name}</div>
                      <div className="text-sm opacity-90">
                        {stage.value.toLocaleString('pt-BR')} usuários
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {stage.conversionRate.toFixed(1)}%
                      </div>
                      {!isFirst && (
                        <div className="text-sm opacity-90">
                          -{stage.dropoffRate.toFixed(1)}% dropoff
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Arrow between stages */}
                {index < stages.length - 1 && (
                  <div className="flex items-center justify-center my-2">
                    <div className="text-gray-400">↓</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-6 border-t grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {stages[0]?.value.toLocaleString('pt-BR')}
            </div>
            <div className="text-sm text-gray-500">Topo do Funil</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {stages[stages.length - 1]?.value.toLocaleString('pt-BR')}
            </div>
            <div className="text-sm text-gray-500">Conversões</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {stages[stages.length - 1]?.conversionRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">Taxa Final</div>
          </div>
        </div>
      </div>
    </div>
  );
}
