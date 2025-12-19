/**
 * ────────────────────────────────────────────────────────────────────────────
 * COHORTS TABLE - Tabela de Análise de Cohorts
 * ────────────────────────────────────────────────────────────────────────────
 */

'use client';

import React, { useState } from 'react';

interface Cohort {
  cohortDate: string;
  initialSize: number;
  retention: {
    week1: number;
    week2: number;
    week4: number;
    week8: number;
    week12: number;
  };
  ltv: number;
  churnRate: number;
}

export interface CohortsTableProps {
  cohorts: Cohort[];
  loading?: boolean;
}

export function CohortsTable({ cohorts, loading = false }: CohortsTableProps) {
  const [sortBy, setSortBy] = useState<keyof Cohort>('cohortDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  if (loading) {
    return (
      <div className="border rounded-lg bg-white shadow-sm p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const getRetentionColor = (value: number): string => {
    if (value >= 80) return 'bg-green-100 text-green-800';
    if (value >= 60) return 'bg-yellow-100 text-yellow-800';
    if (value >= 40) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="border rounded-lg bg-white shadow-sm">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Análise de Cohorts</h3>
        <p className="text-sm text-gray-500 mt-1">
          Retenção de usuários ao longo do tempo por cohort
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Cohort
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Tamanho
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Semana 1
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Semana 2
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Semana 4
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Semana 8
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Semana 12
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                LTV
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Churn
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {cohorts.map((cohort) => (
              <tr key={cohort.cohortDate} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {new Date(cohort.cohortDate).toLocaleDateString('pt-BR', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">
                  {cohort.initialSize.toLocaleString('pt-BR')}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRetentionColor(
                      cohort.retention.week1
                    )}`}
                  >
                    {cohort.retention.week1.toFixed(0)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRetentionColor(
                      cohort.retention.week2
                    )}`}
                  >
                    {cohort.retention.week2.toFixed(0)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRetentionColor(
                      cohort.retention.week4
                    )}`}
                  >
                    {cohort.retention.week4.toFixed(0)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRetentionColor(
                      cohort.retention.week8
                    )}`}
                  >
                    {cohort.retention.week8.toFixed(0)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRetentionColor(
                      cohort.retention.week12
                    )}`}
                  >
                    {cohort.retention.week12.toFixed(0)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                  R$ {cohort.ltv.toFixed(0)}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">
                  {cohort.churnRate.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="px-6 py-4 border-t bg-gray-50">
        <div className="flex items-center gap-6 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>≥80% (Excelente)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>60-79% (Bom)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>40-59% (Regular)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>&lt;40% (Crítico)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
