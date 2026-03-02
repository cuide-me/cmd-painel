/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HEALTH SCORE CARD - Dashboard V3
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Componente visual do Health Score do marketplace
 */

'use client';

import React from 'react';
import type { HealthScore, HealthLevel, TrendDirection } from '@/services/admin/dashboardV3Types';

interface HealthScoreCardProps {
  healthScore: HealthScore;
}

const LEVEL_CONFIG: Record<HealthLevel, { color: string; bg: string; label: string; emoji: string }> = {
  excellent: { color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', label: 'Excelente', emoji: '🚀' },
  good: { color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', label: 'Bom', emoji: '✅' },
  warning: { color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', label: 'Atenção', emoji: '⚠️' },
  critical: { color: 'text-red-600', bg: 'bg-red-50 border-red-200', label: 'Crítico', emoji: '🚨' },
};

const DIMENSION_LABELS: Record<keyof HealthScore['dimensions'], string> = {
  liquidity: 'Liquidez',
  velocity: 'Velocidade',
  quality: 'Qualidade',
  financial: 'Financeiro',
  retention: 'Retenção',
};

function TrendBadge({ direction, value }: { direction: TrendDirection; value: number }) {
  const config = {
    up: { icon: '↑', color: 'text-emerald-600 bg-emerald-50' },
    down: { icon: '↓', color: 'text-red-600 bg-red-50' },
    stable: { icon: '→', color: 'text-gray-600 bg-gray-50' },
  };
  const { icon, color } = config[direction];
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      {icon} {Math.abs(value).toFixed(1)}%
    </span>
  );
}

function DimensionBar({ label, score }: { label: string; score: number }) {
  const getColor = (s: number) => {
    if (s >= 80) return 'bg-emerald-500';
    if (s >= 60) return 'bg-blue-500';
    if (s >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-600 w-20 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor(score)} rounded-full transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-700 w-8">{score}</span>
    </div>
  );
}

export function HealthScoreCard({ healthScore }: HealthScoreCardProps) {
  const config = LEVEL_CONFIG[healthScore.level];
  
  // Calcular ângulo para o gauge (0-180 graus)
  const gaugeAngle = (healthScore.score / 100) * 180;
  
  return (
    <div className={`rounded-xl border-2 ${config.bg} p-6`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Health Score</h2>
          <p className="text-sm text-gray-600">Saúde geral do marketplace</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{config.emoji}</span>
          <span className={`font-medium ${config.color}`}>{config.label}</span>
        </div>
      </div>

      {/* Score Principal */}
      <div className="flex items-center gap-8 mb-6">
        {/* Gauge visual */}
        <div className="relative w-32 h-16">
          <svg viewBox="0 0 100 50" className="w-full h-full">
            {/* Background arc */}
            <path
              d="M 10 50 A 40 40 0 0 1 90 50"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* Colored arc */}
            <path
              d="M 10 50 A 40 40 0 0 1 90 50"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              className={config.color}
              strokeDasharray={`${(gaugeAngle / 180) * 125.6} 125.6`}
            />
          </svg>
          <div className="absolute inset-x-0 -bottom-2 text-center">
            <span className={`text-4xl font-bold ${config.color}`}>{healthScore.score}</span>
          </div>
        </div>

        {/* Trend */}
        <div className="flex-1">
          <div className="text-sm text-gray-600 mb-1">vs. período anterior</div>
          <TrendBadge 
            direction={healthScore.trend.direction} 
            value={healthScore.trend.changePercent} 
          />
        </div>
      </div>

      {/* Dimensões */}
      <div className="space-y-3 mb-6">
        {Object.entries(healthScore.dimensions).map(([key, score]) => (
          <DimensionBar 
            key={key} 
            label={DIMENSION_LABELS[key as keyof HealthScore['dimensions']]} 
            score={score} 
          />
        ))}
      </div>

      {/* Fatores */}
      <div className="grid grid-cols-2 gap-4">
        {healthScore.topFactors.positive.length > 0 && (
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
            <div className="text-xs font-medium text-emerald-700 mb-2">Pontos Fortes</div>
            <ul className="space-y-1">
              {healthScore.topFactors.positive.map((f, i) => (
                <li key={i} className="text-xs text-emerald-600">✓ {f}</li>
              ))}
            </ul>
          </div>
        )}
        {healthScore.topFactors.negative.length > 0 && (
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
            <div className="text-xs font-medium text-amber-700 mb-2">Pontos de Atenção</div>
            <ul className="space-y-1">
              {healthScore.topFactors.negative.map((f, i) => (
                <li key={i} className="text-xs text-amber-600">! {f}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
