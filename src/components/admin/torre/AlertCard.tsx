/**
 * ────────────────────────────────────
 * COMPONENTE: Alert Card
 * ────────────────────────────────────
 * Card de alerta com severidade e ação
 */

import Link from 'next/link';
import type { Alert } from '@/services/admin/torre/types';

interface AlertCardProps {
  alert: Alert;
}

export default function AlertCard({ alert }: AlertCardProps) {
  const severityStyles = {
    critical: 'bg-red-100 border-red-500 text-red-900',
    high: 'bg-orange-100 border-orange-500 text-orange-900',
    medium: 'bg-yellow-100 border-yellow-500 text-yellow-900',
    low: 'bg-blue-100 border-blue-500 text-blue-900',
  };

  const severityIcons = {
    critical: '🚨',
    high: '⚠️',
    medium: '⚡',
    low: 'ℹ️',
  };

  return (
    <div className={`
      p-4 rounded-lg border-l-4 ${severityStyles[alert.severity]}
    `}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{severityIcons[alert.severity]}</span>
        
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-bold text-lg">{alert.title}</h4>
            <span className="text-xs uppercase font-bold px-2 py-1 rounded bg-white/50">
              {alert.severity}
            </span>
          </div>
          
          <p className="text-sm mt-1 opacity-80">
            {alert.description}
          </p>
          
          <div className="flex items-center gap-4 mt-3 text-sm">
            <div>
              <span className="opacity-70">Valor: </span>
              <span className="font-bold">{alert.metric}</span>
            </div>
            <div>
              <span className="opacity-70">Limite: </span>
              <span className="font-bold">{alert.threshold}</span>
            </div>
            <div>
              <span className="opacity-70">Módulo: </span>
              <span className="font-bold capitalize">{alert.module}</span>
            </div>
          </div>
          
          {alert.actionUrl && (
            <Link
              href={alert.actionUrl}
              className="
                inline-block mt-3 px-4 py-2 rounded
                bg-white/80 hover:bg-white
                font-medium text-sm transition-all
              "
            >
              Ir para {alert.module} →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
