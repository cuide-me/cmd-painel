'use client';

import React from 'react';
import { Card, SectionHeader, MetricRow, Button } from '@/components/admin/ui';
import { utils } from '@/lib/designSystem';

/**
 * ═══════════════════════════════════════════════════════
 * MODULE PAGE TEMPLATE
 * ═══════════════════════════════════════════════════════
 * Template padrão para páginas de módulos
 */

interface KPIData {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
}

interface ModulePageProps {
  title: string;
  icon: string;
  description: string;
  kpis: KPIData[];
  children: React.ReactNode;
  actions?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }[];
  filters?: React.ReactNode;
}

export default function ModulePageTemplate({
  title,
  icon,
  description,
  kpis,
  children,
  actions,
  filters,
}: ModulePageProps) {
  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <div className="flex items-start justify-between">
        <SectionHeader title={title} subtitle={description} icon={icon} />
        {actions && (
          <div className="flex gap-3">
            {actions.map((action, idx) => (
              <Button
                key={idx}
                onClick={action.onClick}
                variant={action.variant || 'secondary'}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Filtros (se houver) */}
      {filters && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          {filters}
        </div>
      )}

      {/* KPIs Row */}
      {kpis.length > 0 && (
        <div className={`grid grid-cols-1 md:grid-cols-${Math.min(kpis.length, 4)} gap-4`}>
          {kpis.map((kpi, idx) => (
            <Card key={idx} className="text-center">
              <div className="text-sm text-gray-600 mb-2">{kpi.label}</div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{kpi.value}</div>
              {kpi.trend && kpi.trendValue && (
                <div className={`text-sm font-medium ${
                  kpi.trend === 'up' ? 'text-green-600' : 
                  kpi.trend === 'down' ? 'text-red-600' : 
                  'text-gray-600'
                }`}>
                  {kpi.trend === 'up' ? '↑' : kpi.trend === 'down' ? '↓' : '→'} {kpi.trendValue}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Conteúdo principal */}
      {children}
    </div>
  );
}

/**
 * ═══════════════════════════════════════════════════════
 * DATA TABLE - Tabela de dados reutilizável
 * ═══════════════════════════════════════════════════════
 */

interface Column {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  emptyMessage?: string;
}

export function DataTable({ columns, data, emptyMessage = 'Nenhum dado disponível' }: DataTableProps) {
  if (data.length === 0) {
    return (
      <Card>
        <div className="text-center py-12 text-gray-500">
          {emptyMessage}
        </div>
      </Card>
    );
  }

  return (
    <Card noPadding>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider text-${col.align || 'left'}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-6 py-4 text-sm text-gray-900 text-${col.align || 'left'}`}
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/**
 * ═══════════════════════════════════════════════════════
 * STATS GRID - Grid de estatísticas
 * ═══════════════════════════════════════════════════════
 */

interface Stat {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'stable';
}

interface StatsGridProps {
  stats: Stat[];
  columns?: 2 | 3 | 4;
}

export function StatsGrid({ stats, columns = 3 }: StatsGridProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-${columns} gap-4`}>
      {stats.map((stat, idx) => (
        <Card key={idx}>
          <MetricRow
            label={stat.label}
            value={stat.value}
            trend={stat.trend}
            highlight={!!stat.trend}
          />
        </Card>
      ))}
    </div>
  );
}
