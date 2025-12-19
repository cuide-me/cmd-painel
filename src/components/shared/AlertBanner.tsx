/**
 * ────────────────────────────────────────────────────────────────────────────
 * ALERT BANNER - Alertas Padronizados
 * ────────────────────────────────────────────────────────────────────────────
 * 
 * Banner para exibir alertas críticos, avisos e informações.
 * Suporta diferentes severidades e ações.
 */

'use client';

import React from 'react';

export interface AlertBannerProps {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
  icon?: React.ReactNode;
}

const severityStyles = {
  critical: {
    container: 'bg-red-50 border-red-200',
    title: 'text-red-900',
    message: 'text-red-700',
    icon: 'text-red-600',
    button: 'text-red-700 hover:bg-red-100',
  },
  high: {
    container: 'bg-orange-50 border-orange-200',
    title: 'text-orange-900',
    message: 'text-orange-700',
    icon: 'text-orange-600',
    button: 'text-orange-700 hover:bg-orange-100',
  },
  medium: {
    container: 'bg-yellow-50 border-yellow-200',
    title: 'text-yellow-900',
    message: 'text-yellow-700',
    icon: 'text-yellow-600',
    button: 'text-yellow-700 hover:bg-yellow-100',
  },
  low: {
    container: 'bg-blue-50 border-blue-200',
    title: 'text-blue-900',
    message: 'text-blue-700',
    icon: 'text-blue-600',
    button: 'text-blue-700 hover:bg-blue-100',
  },
  info: {
    container: 'bg-gray-50 border-gray-200',
    title: 'text-gray-900',
    message: 'text-gray-700',
    icon: 'text-gray-600',
    button: 'text-gray-700 hover:bg-gray-100',
  },
};

const defaultIcons = {
  critical: '🚨',
  high: '⚠️',
  medium: '⚡',
  low: 'ℹ️',
  info: '💡',
};

export function AlertBanner({
  severity,
  title,
  message,
  action,
  onDismiss,
  icon,
}: AlertBannerProps) {
  const styles = severityStyles[severity];
  const displayIcon = icon || defaultIcons[severity];

  return (
    <div className={`border rounded-lg p-4 ${styles.container}`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`text-xl ${styles.icon}`}>
          {displayIcon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-semibold mb-1 ${styles.title}`}>
            {title}
          </h4>
          <p className={`text-sm ${styles.message}`}>
            {message}
          </p>

          {/* Action Button */}
          {action && (
            <button
              onClick={action.onClick}
              className={`mt-3 text-sm font-medium underline ${styles.button}`}
            >
              {action.label}
            </button>
          )}
        </div>

        {/* Dismiss Button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`text-sm font-medium px-2 py-1 rounded ${styles.button}`}
            aria-label="Dismiss"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
