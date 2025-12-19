/**
 * ────────────────────────────────────────────────────────────────────────────
 * CHART WRAPPER - Wrapper para Recharts
 * ────────────────────────────────────────────────────────────────────────────
 * 
 * Container padronizado para charts com:
 * - Loading state
 * - Error state
 * - Empty state
 * - Título e descrição
 */

'use client';

import React from 'react';

export interface ChartWrapperProps {
  title: string;
  description?: string;
  loading?: boolean;
  error?: string;
  empty?: boolean;
  emptyMessage?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function ChartWrapper({
  title,
  description,
  loading = false,
  error,
  empty = false,
  emptyMessage = 'Nenhum dado disponível para o período selecionado.',
  children,
  actions,
}: ChartWrapperProps) {
  return (
    <div className="border rounded-lg bg-white shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
        {actions && <div className="ml-4">{actions}</div>}
      </div>

      {/* Content */}
      <div className="p-6">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-4 text-sm text-gray-500">Carregando dados...</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center max-w-md">
              <div className="text-4xl mb-4">⚠️</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Erro ao carregar dados
              </h4>
              <p className="text-sm text-gray-600">{error}</p>
            </div>
          </div>
        )}

        {empty && !loading && !error && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center max-w-md">
              <div className="text-4xl mb-4">📊</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Sem dados
              </h4>
              <p className="text-sm text-gray-600">{emptyMessage}</p>
            </div>
          </div>
        )}

        {!loading && !error && !empty && children}
      </div>
    </div>
  );
}
