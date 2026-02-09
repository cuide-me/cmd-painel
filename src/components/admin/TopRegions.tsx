/**
 * ═══════════════════════════════════════════════════════
 * TOP REGIONS COMPONENT
 * ═══════════════════════════════════════════════════════
 * Visualiza top 5 regiões por demanda
 */

'use client';

import React from 'react';
import type { RegionStats } from '@/services/admin/dashboard';

interface TopRegionsProps {
  regions: RegionStats[];
}

export function TopRegions({ regions }: TopRegionsProps) {
  if (regions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Top Regiões
        </h2>
        <p className="text-gray-500 text-sm">Nenhum dado disponível</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Top 5 Regiões (por demanda)
      </h2>
      <div className="space-y-3">
        {regions.map((region, index) => (
          <div
            key={region.key}
            className="flex justify-between items-center pb-3 border-b border-gray-100 last:border-0"
          >
            <div className="flex items-center gap-3">
              {/* Ranking */}
              <span className="text-gray-400 font-medium w-6">
                {index + 1}.
              </span>
              
              {/* Nome da região */}
              <div>
                <span className="font-medium text-gray-900">
                  {region.label}
                </span>
                <div className="text-xs text-gray-500">
                  {region.cidade} / {region.estado}
                </div>
              </div>
            </div>

            {/* Métricas */}
            <div className="text-right">
              <div className="font-semibold text-gray-900">
                {region.jobs} jobs
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
