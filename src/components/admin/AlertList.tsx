/**
 * ═══════════════════════════════════════════════════════
 * ALERT LIST COMPONENT
 * ═══════════════════════════════════════════════════════
 * Lista de alertas do dashboard
 */

'use client';

import React from 'react';
import { AlertBanner } from './ui';
import type { DashboardAlert } from '@/services/admin/dashboard';

interface AlertListProps {
  alerts: DashboardAlert[];
}

export function AlertList({ alerts }: AlertListProps) {
  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Alertas Críticos
      </h2>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <AlertBanner
            key={alert.id}
            type={alert.type}
            title={alert.title}
            description={alert.description}
            actionLabel={alert.actionLabel}
          />
        ))}
      </div>
    </div>
  );
}
