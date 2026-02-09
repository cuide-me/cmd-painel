/**
 * ═══════════════════════════════════════════════════════
 * ALERT BANNER COMPONENT
 * ═══════════════════════════════════════════════════════
 * Banner para exibir alertas no dashboard
 */

import React from 'react';
import { getStatusColors } from '@/lib/admin/designSystem';

export interface AlertBannerProps {
  type: 'ok' | 'warning' | 'critical' | 'info';
  title: string;
  description?: string;
  action?: () => void;
  actionLabel?: string;
}

export function AlertBanner({
  type,
  title,
  description,
  action,
  actionLabel = 'Ver detalhes',
}: AlertBannerProps) {
  const colors = getStatusColors(type);

  const icons = {
    ok: '✓',
    warning: '⚠',
    critical: '●',
    info: 'ℹ',
  };

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border-l-4
        ${colors.bg} ${colors.border}
      `}
    >
      {/* Icon */}
      <div className={`text-lg ${colors.text}`}>
        {icons[type]}
      </div>

      {/* Content */}
      <div className="flex-1">
        <h4 className={`font-semibold ${colors.text}`}>
          {title}
        </h4>
        {description && (
          <p className="text-sm text-gray-600 mt-1">
            {description}
          </p>
        )}
      </div>

      {/* Action */}
      {action && (
        <button
          onClick={action}
          className={`
            px-3 py-1 text-sm font-medium rounded
            ${colors.text} hover:underline
            transition-all duration-150
          `}
        >
          {actionLabel} →
        </button>
      )}
    </div>
  );
}
