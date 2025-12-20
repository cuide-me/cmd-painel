'use client';

/**
 * ═══════════════════════════════════════════════════════
 * MODULE PAGE TEMPLATE
 * ═══════════════════════════════════════════════════════
 * 
 * Template padronizado para páginas de módulos com:
 * - Header com título, descrição e ações
 * - Filtros e exportação
 * - KPIs principais
 * - Visualizações (gráficos, tabelas, cards)
 * - Loading states e error handling
 */

import React, { ReactNode } from 'react';
import { SectionHeader, Card } from '@/components/admin/ui';
import DateRangeFilter, { type DateRange } from '@/components/admin/DateRangeFilter';
import ExportButton from '@/components/admin/ExportButton';

interface ModulePageLayoutProps {
  title: string;
  subtitle: string;
  icon: string;
  children: ReactNode;
  filters?: ReactNode;
  actions?: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function ModulePageLayout({
  title,
  subtitle,
  icon,
  children,
  filters,
  actions,
  onRefresh,
  refreshing = false
}: ModulePageLayoutProps) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-3xl shadow-lg">
            {icon}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            <p className="text-gray-600 mt-1">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <svg 
                className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {refreshing ? 'Atualizando...' : 'Atualizar'}
            </button>
          )}
          {actions}
        </div>
      </div>

      {/* Filters Bar */}
      {filters && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex flex-wrap items-center gap-4">
            {filters}
          </div>
        </div>
      )}

      {/* Content */}
      {children}
    </div>
  );
}

interface KpiGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
}

export function KpiGrid({ children, columns = 4 }: KpiGridProps) {
  const gridCols = {
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4'
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 ${gridCols[columns]} gap-6`}>
      {children}
    </div>
  );
}

interface ContentSectionProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  noPadding?: boolean;
}

export function ContentSection({ title, subtitle, children, noPadding = false }: ContentSectionProps) {
  return (
    <div className="space-y-4">
      {(title || subtitle) && (
        <div>
          {title && <h2 className="text-xl font-semibold text-gray-900">{title}</h2>}
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
      )}
      <div className={noPadding ? '' : ''}>
        {children}
      </div>
    </div>
  );
}

// Filter Wrapper
interface FiltersWrapperProps {
  dateRange?: {
    value: DateRange | null;
    onChange: (range: DateRange) => void;
  };
  exportData?: any;
  exportFilename?: string;
  children?: ReactNode;
}

export function FiltersWrapper({ 
  dateRange, 
  exportData, 
  exportFilename = 'data',
  children 
}: FiltersWrapperProps) {
  return (
    <>
      {dateRange && (
        <div className="flex-1">
          <DateRangeFilter onRangeChange={dateRange.onChange} />
        </div>
      )}
      
      {children}
      
      {exportData && (
        <ExportButton data={exportData} filename={exportFilename} />
      )}
    </>
  );
}

// Stat Grid for tables
interface DataTableProps {
  columns: Array<{
    key: string;
    label: string;
    align?: 'left' | 'center' | 'right';
    width?: string;
    render?: (value: any, row: any) => ReactNode;
  }>;
  data: any[];
  emptyMessage?: string;
}

export function DataTable({ columns, data, emptyMessage = 'Nenhum dado disponível' }: DataTableProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-3 text-${col.align || 'left'} text-xs font-semibold text-gray-700 uppercase tracking-wider ${col.width || ''}`}
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
                    className={`px-6 py-4 text-${col.align || 'left'} text-sm`}
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Info Box for insights
interface InfoBoxProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: ReactNode;
}

export function InfoBox({ variant = 'info', title, children }: InfoBoxProps) {
  const variants = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'ℹ️',
      titleColor: 'text-blue-900',
      textColor: 'text-blue-800'
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: '✅',
      titleColor: 'text-green-900',
      textColor: 'text-green-800'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: '⚠️',
      titleColor: 'text-yellow-900',
      textColor: 'text-yellow-800'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: '❌',
      titleColor: 'text-red-900',
      textColor: 'text-red-800'
    }
  };

  const style = variants[variant];

  return (
    <div className={`${style.bg} border ${style.border} rounded-xl p-4`}>
      <div className="flex gap-3">
        <span className="text-2xl flex-shrink-0">{style.icon}</span>
        <div className="flex-1">
          {title && <h4 className={`font-semibold ${style.titleColor} mb-1`}>{title}</h4>}
          <div className={`text-sm ${style.textColor}`}>{children}</div>
        </div>
      </div>
    </div>
  );
}
