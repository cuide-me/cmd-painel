/**
 * ────────────────────────────────────
 * COMPONENTE: Module Card
 * ────────────────────────────────────
 * Card de navegação para módulos da Torre
 */

import Link from 'next/link';
import type { ModuleSummary } from '@/services/admin/torre/types';

interface ModuleCardProps {
  module: ModuleSummary;
}

export default function ModuleCard({ module }: ModuleCardProps) {
  const statusColors = {
    healthy: 'text-green-600',
    warning: 'text-yellow-600',
    critical: 'text-red-600',
  };

  return (
    <Link
      href={module.href}
      className={`
        block p-6 rounded-lg transition-all
        ${module.color} text-white
        hover:shadow-xl transform hover:scale-105
      `}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-4xl">{module.icon}</span>
        <h3 className="text-xl font-bold">{module.title}</h3>
      </div>

      {/* Metrics */}
      <div className="space-y-2">
        {module.metrics.map((metric, idx) => (
          <div key={idx} className="flex justify-between items-center">
            <span className="text-sm opacity-90">{metric.label}</span>
            <span className={`
              font-bold text-lg
              ${metric.status ? `px-2 py-0.5 rounded ${
                metric.status === 'healthy' ? 'bg-green-500' :
                metric.status === 'warning' ? 'bg-yellow-500' :
                'bg-red-500'
              }` : ''}
            `}>
              {metric.value}
            </span>
          </div>
        ))}
      </div>

      {/* Action indicator */}
      <div className="mt-4 pt-4 border-t border-white/30 text-sm opacity-80 flex items-center justify-between">
        <span>Ver detalhes</span>
        <span>→</span>
      </div>
    </Link>
  );
}
