'use client';

import React from 'react';
import Link from 'next/link';
import { designTokens, statusColors, trendIndicators } from '@/lib/designSystem';

/**
 * ═══════════════════════════════════════════════════════
 * STAT CARD - Cartão de estatística
 * ═══════════════════════════════════════════════════════
 */

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  status?: 'active' | 'pending' | 'inactive' | 'error' | 'success' | 'warning';
  href?: string;
  onClick?: () => void;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  status,
  href,
  onClick,
  className = ''
}: StatCardProps) {
  const content = (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 transition-all hover:shadow-md hover:border-blue-300 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
            {title}
          </h3>
        </div>
        {icon && (
          <div className="text-3xl opacity-80">
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mb-3">
        <div className="text-3xl font-bold text-gray-900 leading-none">
          {value}
        </div>
        {subtitle && (
          <div className="text-sm text-gray-500 mt-1">
            {subtitle}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Trend */}
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${trendIndicators[trend].color}`}>
            <span>{trendIndicators[trend].icon}</span>
            {trendValue && <span>{trendValue}</span>}
          </div>
        )}

        {/* Status Badge */}
        {status && (
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusColors[status]}`}>
            {status}
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} className="block w-full text-left">
        {content}
      </button>
    );
  }

  return content;
}

/**
 * ═══════════════════════════════════════════════════════
 * METRIC ROW - Linha de métrica (label + value)
 * ═══════════════════════════════════════════════════════
 */

interface MetricRowProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  highlight?: boolean;
}

export function MetricRow({ label, value, trend, highlight }: MetricRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-semibold ${highlight ? 'text-blue-600' : 'text-gray-900'}`}>
          {value}
        </span>
        {trend && (
          <span className={`text-xs ${trendIndicators[trend].color}`}>
            {trendIndicators[trend].icon}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * ═══════════════════════════════════════════════════════
 * SECTION HEADER - Cabeçalho de seção
 * ═══════════════════════════════════════════════════════
 */

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
}

export function SectionHeader({ title, subtitle, icon, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {icon && <span className="text-3xl">{icon}</span>}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
      </div>
      
      {action && (
        <button
          onClick={action.onClick}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            action.variant === 'secondary'
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/**
 * ═══════════════════════════════════════════════════════
 * CARD CONTAINER - Container genérico de card
 * ═══════════════════════════════════════════════════════
 */

interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function Card({ title, subtitle, children, className = '', noPadding = false }: CardProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-gray-200">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>
    </div>
  );
}

/**
 * ═══════════════════════════════════════════════════════
 * BADGE - Badge de status/tag
 * ═══════════════════════════════════════════════════════
 */

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

export function Badge({ children, variant = 'default', size = 'md' }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-800 border-gray-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
}

/**
 * ═══════════════════════════════════════════════════════
 * BUTTON - Botão estilizado
 * ═══════════════════════════════════════════════════════
 */

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon,
  onClick, 
  disabled = false,
  className = ''
}: ButtonProps) {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 disabled:bg-gray-50',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 disabled:text-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2 
        font-medium rounded-lg transition-all
        disabled:cursor-not-allowed disabled:opacity-50
        ${variants[variant]} 
        ${sizes[size]}
        ${className}
      `}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════════════
// NOVOS COMPONENTES V3.0 (PAINEL REESTRUTURADO)
// ═══════════════════════════════════════════════════════

export { KpiCard } from './KpiCard';
export type { KpiCardProps } from './KpiCard';

export { StatusBadge } from './StatusBadge';

export { AlertBanner } from './AlertBanner';
export type { AlertBannerProps } from './AlertBanner';

export { EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';
