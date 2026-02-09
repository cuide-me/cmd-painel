/**
 * ═══════════════════════════════════════════════════════
 * COMPONENTE - Status Pill
 * ═══════════════════════════════════════════════════════
 */

import React from 'react';
import type { AlertStatus, Trend } from '@/services/admin/torreDeControleTypes';

interface StatusPillProps {
  status: AlertStatus;
  label?: string;
}

export function StatusPill({ status, label }: StatusPillProps) {
  const colors = {
    ok: 'bg-green-100 text-green-800 border-green-300',
    atencao: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    critico: 'bg-red-100 text-red-800 border-red-300',
  };

  const icons = {
    ok: '✓',
    atencao: '⚠',
    critico: '✕',
  };

  const labels = {
    ok: 'OK',
    atencao: 'Atenção',
    critico: 'Crítico',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[status]}`}
      role="status"
      aria-live="polite"
    >
      <span className="mr-1" aria-hidden="true">{icons[status]}</span>
      {label || labels[status]}
    </span>
  );
}

interface TrendIndicatorProps {
  trend: Trend;
  value?: number;
}

export function TrendIndicator({ trend, value }: TrendIndicatorProps) {
  const colors = {
    up: 'text-green-600',
    down: 'text-red-600',
    stable: 'text-gray-600',
  };

  const icons = {
    up: '↑',
    down: '↓',
    stable: '→',
  };

  return (
    <span className={`inline-flex items-center text-sm font-medium ${colors[trend]}`}>
      <span className="mr-1" aria-hidden="true">{icons[trend]}</span>
      {value !== undefined && `${value > 0 ? '+' : ''}${value.toFixed(1)}%`}
    </span>
  );
}

interface BadgeProps {
  label: string;
  variant?: 'info' | 'warning' | 'neutral';
}

export function Badge({ label, variant = 'neutral' }: BadgeProps) {
  const colors = {
    info: 'bg-blue-100 text-blue-800 border-blue-300',
    warning: 'bg-orange-100 text-orange-800 border-orange-300',
    neutral: 'bg-gray-100 text-gray-700 border-gray-300',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${colors[variant]}`}>
      {label}
    </span>
  );
}
