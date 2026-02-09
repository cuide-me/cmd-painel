'use client';

/**
 * Admin Layout Component
 * Standardized layout for all admin pages
 */

import { useRouter } from 'next/navigation';
import { ReactNode, useState } from 'react';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  icon?: string;
}

export default function AdminLayout({ children, title, subtitle, icon = '📊' }: AdminLayoutProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Back Button */}
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Torre de Controle
            </button>

            {/* Title */}
            <div className="flex items-center gap-2">
              <span className="text-xl">{icon}</span>
              <div className="text-right">
                <h1 className="text-sm font-semibold text-slate-900">{title}</h1>
                {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}

// Tooltip Component
interface TooltipProps {
  content: string;
  children?: ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 hover:bg-blue-500 hover:text-white text-slate-600 text-xs transition-colors cursor-help"
      >
        {children || 'i'}
      </button>
      {show && (
        <div className="absolute z-50 w-64 p-2 text-xs text-white bg-slate-900 rounded-lg shadow-lg -top-2 left-6 transform -translate-y-full">
          <div className="relative">
            {content}
            <div className="absolute w-2 h-2 bg-slate-900 transform rotate-45 -bottom-1 left-2"></div>
          </div>
        </div>
      )}
    </div>
  );
}

// Stat Card Component
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

// Section Component
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

// Card Component
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

  return (
    <div 
      className={`bg-white rounded-lg border border-slate-200 ${paddingClasses[padding]} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// Button Component
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
  const baseClasses = 'font-medium rounded-lg transition-all inline-flex items-center justify-center';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-300',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300 disabled:bg-slate-50',
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

// Badge Component
interface BadgeProps {
  children: ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}

export function Badge({ children, variant = 'neutral' }: BadgeProps) {
  const variantClasses = {
    success: 'bg-green-100 text-green-700 border-green-200',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    error: 'bg-red-100 text-red-700 border-red-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${variantClasses[variant]}`}>
      {children}
    </span>
  );
}

// Table Component
interface TableProps {
  headers: string[];
  rows: ReactNode[][];
  compact?: boolean;
}

export function Table({ headers, rows, compact = false }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {headers.map((header, i) => (
              <th
                key={i}
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
            <tr key={i} className="hover:bg-slate-50 transition-colors">
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

// Tabs Component
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
      <nav className="flex gap-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
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

// Empty State Component
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
      <div className="text-5xl mb-3">{icon}</div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-600 mb-4">{description}</p>}
      {action && (
        <button 
          onClick={onAction}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          {action}
        </button>
      )}
    </div>
  );
}

// Loading Skeleton
export function LoadingSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-20 bg-slate-200 rounded-lg"></div>
      ))}
    </div>
  );
}
