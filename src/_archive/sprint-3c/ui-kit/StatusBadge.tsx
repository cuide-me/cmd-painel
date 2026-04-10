/**
 * ═══════════════════════════════════════════════════════
 * STATUS BADGE COMPONENT
 * ═══════════════════════════════════════════════════════
 * Badge para exibir status de jobs, tickets, etc.
 */

import React from 'react';
import { getJobStatusColors, getTicketStatusColors } from '@/lib/admin/designSystem';
import type { NormalizedJobStatus } from '@/services/admin/statusNormalizer';
import type { NormalizedTicketStatus } from '@/services/admin/statusNormalizer';

interface StatusBadgeProps {
  type: 'job' | 'ticket';
  status: NormalizedJobStatus | NormalizedTicketStatus | string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function StatusBadge({
  type,
  status,
  label,
  size = 'md',
  showIcon = true,
}: StatusBadgeProps) {
  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  // Get colors based on type
  let colors;
  let icon = '';
  let displayLabel = label || status;

  if (type === 'job') {
    const jobStatus = status as NormalizedJobStatus;
    colors = getJobStatusColors(jobStatus);
    icon = colors.icon;
    displayLabel = label || colors.label;
  } else if (type === 'ticket') {
    const ticketStatus = status as NormalizedTicketStatus;
    colors = getTicketStatusColors(ticketStatus);
    displayLabel = label || colors.label;
  } else {
    // Fallback
    colors = {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
    };
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-medium
        ${colors.bg} ${colors.text}
        ${sizeClasses[size]}
      `}
    >
      {showIcon && icon && <span>{icon}</span>}
      <span>{displayLabel}</span>
    </span>
  );
}
