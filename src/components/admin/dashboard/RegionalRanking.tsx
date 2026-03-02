/**
 * ═══════════════════════════════════════════════════════════════════════════
 * REGIONAL RANKING - Dashboard V3
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Ranking de regiões com métricas e heatmap visual
 */

'use client';

import React, { useState } from 'react';
import type { RegionalMetrics, TrendDirection } from '@/services/admin/dashboardV3Types';

interface RegionalRankingProps {
  regional: RegionalMetrics;
  onRegionClick?: (region: string) => void;
}

type SortKey = 'jobs' | 'gmv' | 'matchRate' | 'demandSupplyRatio';

function TrendArrow({ direction }: { direction: TrendDirection }) {
  const config = {
    up: { color: 'text-emerald-500', icon: '↑' },
    down: { color: 'text-red-500', icon: '↓' },
    stable: { color: 'text-gray-400', icon: '→' },
  };
  return <span className={config[direction].color}>{config[direction].icon}</span>;
}

function RatioIndicator({ ratio }: { ratio: number }) {
  // ratio > 1.5 = excess demand (red), < 0.7 = excess supply (blue), middle = balanced (green)
  let color = 'bg-emerald-100 text-emerald-700';
  let label = 'Balanceado';
  
  if (ratio > 2) {
    color = 'bg-red-100 text-red-700';
    label = 'Falta oferta';
  } else if (ratio > 1.5) {
    color = 'bg-amber-100 text-amber-700';
    label = 'Alta demanda';
  } else if (ratio < 0.5) {
    color = 'bg-blue-100 text-blue-700';
    label = 'Excesso oferta';
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>
        {label}
      </span>
      <span className="text-xs text-gray-500">({ratio.toFixed(2)})</span>
    </div>
  );
}

function CoverageStats({ coverage }: { coverage: RegionalMetrics['coverage'] }) {
  const coveragePercent = coverage.totalRegions > 0 
    ? (coverage.activeRegions / coverage.totalRegions) * 100 
    : 0;
  const balancedPercent = coverage.totalRegions > 0 
    ? (coverage.regionsBalanced / coverage.totalRegions) * 100 
    : 0;

  return (
    <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900">{coverage.totalRegions}</div>
        <div className="text-xs text-gray-600">Total</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-emerald-600">{coverage.activeRegions}</div>
        <div className="text-xs text-gray-600">Ativas</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">{coveragePercent.toFixed(0)}%</div>
        <div className="text-xs text-gray-600">Cobertura</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600">{balancedPercent.toFixed(0)}%</div>
        <div className="text-xs text-gray-600">Balanceadas</div>
      </div>
    </div>
  );
}

export function RegionalRanking({ regional, onRegionClick }: RegionalRankingProps) {
  const [sortKey, setSortKey] = useState<SortKey>('jobs');
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const sortedRegions = [...regional.topRegionsByGMV].sort((a, b) => {
    switch (sortKey) {
      case 'gmv': return b.gmv - a.gmv;
      case 'matchRate': return b.matchRate - a.matchRate;
      case 'demandSupplyRatio': return b.demandSupplyRatio - a.demandSupplyRatio;
      default: return b.jobs - a.jobs;
    }
  });

  const maxJobs = Math.max(...sortedRegions.map(r => r.jobs), 1);

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Performance Regional</h3>
            <p className="text-sm text-gray-600">Top regiões por atividade</p>
          </div>
          
          {/* Sort controls */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Ordenar:</span>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              {[
                { key: 'jobs' as SortKey, label: 'Jobs' },
                { key: 'matchRate' as SortKey, label: 'Match' },
                { key: 'demandSupplyRatio' as SortKey, label: 'D/O' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSortKey(key)}
                  className={`px-3 py-1 text-xs font-medium transition-colors ${
                    sortKey === key 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Coverage stats */}
        <CoverageStats coverage={regional.coverage} />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="text-xs text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Região</th>
              <th className="px-4 py-3 text-right">Jobs</th>
              <th className="px-4 py-3 text-right">Famílias</th>
              <th className="px-4 py-3 text-right">Cuidadores</th>
              <th className="px-4 py-3 text-right">Match Rate</th>
              <th className="px-4 py-3 text-right">Tempo Match</th>
              <th className="px-4 py-3 text-left">D/O Ratio</th>
              <th className="px-4 py-3 text-center">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedRegions.map((region, idx) => (
              <tr 
                key={region.region}
                className={`transition-colors ${
                  hoveredRegion === region.region ? 'bg-blue-50' : 'hover:bg-gray-50'
                } ${onRegionClick ? 'cursor-pointer' : ''}`}
                onMouseEnter={() => setHoveredRegion(region.region)}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={() => onRegionClick?.(region.region)}
              >
                <td className="px-4 py-3">
                  <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                    idx === 0 ? 'bg-amber-100 text-amber-700' :
                    idx === 1 ? 'bg-gray-200 text-gray-700' :
                    idx === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {idx + 1}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <div className="font-medium text-gray-900">{region.label}</div>
                    <div className="text-xs text-gray-500">{region.cidade}, {region.estado}</div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(region.jobs / maxJobs) * 100}%` }}
                      />
                    </div>
                    <span className="font-medium text-gray-900 w-8">{region.jobs}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-700">
                  {region.activeFamilies}
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-700">
                  {region.activeCaregivers}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`font-medium ${
                    region.matchRate >= 70 ? 'text-emerald-600' :
                    region.matchRate >= 50 ? 'text-amber-600' :
                    'text-red-600'
                  }`}>
                    {region.matchRate.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`font-medium ${
                    region.avgMatchTimeHours <= 24 ? 'text-emerald-600' :
                    region.avgMatchTimeHours <= 48 ? 'text-amber-600' :
                    'text-red-600'
                  }`}>
                    {region.avgMatchTimeHours.toFixed(0)}h
                  </span>
                </td>
                <td className="px-4 py-3">
                  <RatioIndicator ratio={region.demandSupplyRatio} />
                </td>
                <td className="px-4 py-3 text-center">
                  <TrendArrow direction={region.trend} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Problem regions */}
      {regional.problemRegions.length > 0 && (
        <div className="p-4 border-t border-gray-100 bg-red-50">
          <h4 className="text-sm font-medium text-red-800 mb-3">
            ⚠️ Regiões com Problemas ({regional.problemRegions.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {regional.problemRegions.map((region) => (
              <div 
                key={region.region}
                className="px-3 py-2 bg-white border border-red-200 rounded-lg"
              >
                <div className="font-medium text-gray-900 text-sm">{region.label}</div>
                <div className="text-xs text-red-600">
                  {region.issues.join(' • ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
