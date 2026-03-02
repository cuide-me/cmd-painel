/**
 * ═══════════════════════════════════════════════════════
 * EMPTY STATE COMPONENT
 * ═══════════════════════════════════════════════════════
 * Estado vazio com CTA
 */

import React from 'react';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: () => void;
  actionLabel?: string;
}

export function EmptyState({
  icon = '📭',
  title,
  description,
  action,
  actionLabel,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Icon */}
      <div className="text-6xl mb-4">
        {icon}
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-gray-500 mb-6 max-w-md">
          {description}
        </p>
      )}

      {/* Action */}
      {action && actionLabel && (
        <button
          onClick={action}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
