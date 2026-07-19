'use client';

import { ReactNode, useId, useState } from 'react';

interface TooltipProps {
  content: ReactNode;
  children?: ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [show, setShow] = useState(false);
  const tooltipId = useId();

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        onClick={() => setShow(!show)}
        aria-label="Mais informações"
        aria-describedby={show ? tooltipId : undefined}
        aria-expanded={show}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-xs text-slate-700 transition-colors hover:bg-blue-700 hover:text-white"
      >
        {children || 'i'}
      </button>
      {show && (
        <div id={tooltipId} role="tooltip" className="absolute z-50 w-64 -translate-y-full rounded-lg bg-slate-900 p-2 text-xs text-white shadow-lg -top-2 left-6">
          <div className="relative">
            {content}
            <div className="absolute w-2 h-2 bg-slate-900 transform rotate-45 -bottom-1 left-2"></div>
          </div>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
  tooltip?: string;
}

export function StatCard({ label, value, change, icon, trend, tooltip }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">{label}</p>
            {tooltip && <Tooltip content={tooltip} />}
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {change !== undefined && (
            <p className={`text-xs font-medium mt-1 flex items-center gap-1 ${
              trend === 'up' ? 'text-green-600' :
              trend === 'down' ? 'text-red-600' :
              'text-slate-600'
            }`}>
              {trend === 'up' && '↑'}
              {trend === 'down' && '↓'}
              {Math.abs(change).toFixed(1)}%
            </p>
          )}
        </div>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  tooltip?: string;
}

export function Section({ title, children, action, tooltip }: SectionProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {tooltip && <Tooltip content={tooltip} />}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export function Card({ children, className = '', padding = 'md', onClick }: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  const classes = `rounded-lg border border-slate-200 bg-white ${paddingClasses[padding]} ${onClick ? 'cursor-pointer transition-shadow hover:shadow-md' : ''} ${className}`;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`block w-full text-left ${classes}`}>
        {children}
      </button>
    );
  }

  return <div className={classes}>{children}</div>;
}

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  className = ''
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60';

  const variantClasses = {
    primary: 'bg-blue-700 text-white hover:bg-blue-800 active:bg-blue-900',
    secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300',
    ghost: 'text-slate-700 hover:bg-slate-100 active:bg-slate-200'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

interface BadgeProps {
  children: ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}

export function Badge({ children, variant = 'neutral' }: BadgeProps) {
  const variantClasses = {
    success: 'border-emerald-300 bg-emerald-100 text-emerald-900',
    warning: 'border-amber-300 bg-amber-100 text-amber-900',
    error: 'border-rose-300 bg-rose-100 text-rose-900',
    info: 'border-blue-300 bg-blue-100 text-blue-900',
    neutral: 'border-slate-300 bg-slate-100 text-slate-800'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${variantClasses[variant]}`}>
      {children}
    </span>
  );
}

interface TableProps {
  headers: string[];
  rows: ReactNode[][];
  compact?: boolean;
}

export function Table({ headers, rows, compact = false }: TableProps) {
  return (
    <div className="overflow-x-auto" tabIndex={0} aria-label="Área rolável da tabela">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {headers.map((header, i) => (
              <th
                key={`${header}-${i}`}
                scope="col"
                className={`text-left text-xs font-semibold text-slate-700 uppercase tracking-wide ${
                  compact ? 'px-3 py-2' : 'px-4 py-3'
                }`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, i) => (
            <tr key={i} className="transition-colors hover:bg-slate-50">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`text-sm text-slate-700 ${
                    compact ? 'px-3 py-2' : 'px-4 py-3'
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="border-b border-slate-200 mb-6">
      <nav className="flex gap-6" aria-label="Abas">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            aria-current={activeTab === tab.id ? 'page' : undefined}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = '📭', title, description, action, onAction }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="mb-3 text-5xl" aria-hidden="true">{icon}</div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-600 mb-4">{description}</p>}
      {action && (
        <button
          onClick={onAction}
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800"
        >
          {action}
        </button>
      )}
    </div>
  );
}

export function LoadingSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-20 bg-slate-200 rounded-lg"></div>
      ))}
    </div>
  );
}
