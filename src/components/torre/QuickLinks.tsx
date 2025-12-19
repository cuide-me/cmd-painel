/**
 * ────────────────────────────────────────────────────────────────────────────
 * QUICK LINKS - Navegação para Módulos
 * ────────────────────────────────────────────────────────────────────────────
 */

'use client';

import React from 'react';
import Link from 'next/link';

interface ModuleLink {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  stats?: {
    label: string;
    value: string;
    trend?: 'up' | 'down' | 'stable';
  };
}

const colorClasses = {
  blue: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
  green: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100',
  purple: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100',
  orange: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100',
  red: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100',
};

export interface QuickLinksProps {
  modules?: ModuleLink[];
  loading?: boolean;
}

const defaultModules: ModuleLink[] = [
  {
    id: 'growth',
    title: 'Growth',
    description: 'Funis, cohorts e aquisição',
    href: '/admin/growth-v2',
    icon: '📈',
    color: 'blue',
    stats: { label: 'CAC', value: 'R$ 45', trend: 'down' },
  },
  {
    id: 'finance',
    title: 'Financeiro',
    description: 'MRR, churn e cash flow',
    href: '/admin/finance-v2',
    icon: '💰',
    color: 'green',
    stats: { label: 'MRR', value: 'R$ 125k', trend: 'up' },
  },
  {
    id: 'operations',
    title: 'Operações',
    description: 'SLA, matching e capacidade',
    href: '/admin/ops-v2',
    icon: '⚙️',
    color: 'purple',
    stats: { label: 'SLA', value: '87%', trend: 'stable' },
  },
  {
    id: 'quality',
    title: 'Qualidade',
    description: 'NPS, tickets e feedbacks',
    href: '/admin/quality-v2',
    icon: '⭐',
    color: 'orange',
    stats: { label: 'NPS', value: '52', trend: 'up' },
  },
];

export function QuickLinks({ 
  modules = defaultModules,
  loading = false,
}: QuickLinksProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Módulos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border rounded-lg p-6 bg-white animate-pulse">
              <div className="h-8 w-8 bg-gray-200 rounded mb-4"></div>
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Módulos</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {modules.map((module) => (
          <Link
            key={module.id}
            href={module.href}
            className={`
              block border rounded-lg p-6 transition-all
              ${colorClasses[module.color]}
            `}
          >
            {/* Icon */}
            <div className="text-3xl mb-3">{module.icon}</div>

            {/* Title & Description */}
            <h3 className="text-lg font-semibold mb-1">{module.title}</h3>
            <p className="text-sm opacity-80 mb-4">{module.description}</p>

            {/* Stats */}
            {module.stats && (
              <div className="flex items-center justify-between pt-3 border-t border-current border-opacity-20">
                <span className="text-xs font-medium opacity-70">
                  {module.stats.label}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold">
                    {module.stats.value}
                  </span>
                  {module.stats.trend && (
                    <span className="text-xs">
                      {module.stats.trend === 'up' && '↑'}
                      {module.stats.trend === 'down' && '↓'}
                      {module.stats.trend === 'stable' && '→'}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Hover Arrow */}
            <div className="mt-3 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              Ver detalhes →
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
