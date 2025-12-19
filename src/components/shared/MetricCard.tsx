/**
 * ────────────────────────────────────────────────────────────────────────────
 * METRIC CARD - Componente Reutilizável
 * ────────────────────────────────────────────────────────────────────────────
 * 
 * Card padronizado para exibir métricas com suporte a:
 * - Valor principal + variação
 * - Ícone + cor personalizável
 * - Trend indicator (↑↓)
 * - Loading state
 */

'use client';

import React from 'react';

export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    label?: string;
    isPositive?: boolean;
  };
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
  loading?: boolean;
  subtitle?: string;
  onClick?: () => void;
}

const colorClasses = {
  blue: 'bg-blue-50 border-blue-200 text-blue-700',
  green: 'bg-green-50 border-green-200 text-green-700',
  red: 'bg-red-50 border-red-200 text-red-700',
  yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  purple: 'bg-purple-50 border-purple-200 text-purple-700',
  gray: 'bg-gray-50 border-gray-200 text-gray-700',
};

const changeColors = {
  positive: 'text-green-600 bg-green-50',
  negative: 'text-red-600 bg-red-50',
};

export function MetricCard({
  title,
  value,
  change,
  icon,
  color = 'blue',
  loading = false,
  subtitle,
  onClick,
}: MetricCardProps) {
  const isClickable = !!onClick;

  if (loading) {
    return (
      <div className="border rounded-lg p-6 bg-white shadow-sm animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
      </div>
    );
  }

  return (
    <div
      className={`
        border rounded-lg p-6 bg-white shadow-sm transition-all
        ${isClickable ? 'cursor-pointer hover:shadow-md hover:scale-[1.02]' : ''}
      `}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {icon && (
          <div className={`p-2 rounded-lg border ${colorClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mb-2">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>

      {/* Change Indicator */}
      {change && (
        <div className="flex items-center gap-2">
          <span
            className={`
              inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium
              ${change.isPositive ? changeColors.positive : changeColors.negative}
            `}
          >
            {change.isPositive ? '↑' : '↓'}
            {Math.abs(change.value)}%
          </span>
          {change.label && (
            <span className="text-xs text-gray-500">{change.label}</span>
          )}
        </div>
      )}
    </div>
  );
}
