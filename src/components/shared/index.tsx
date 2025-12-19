/**
 * Shared Components
 * Reusable UI components used across the application
 */

import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export function Card({ children, className = '', title }: CardProps) {
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      {children}
    </div>
  );
}

export interface AlertProps {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
  className?: string;
}

export function Alert({ children, variant = 'info', className = '' }: AlertProps) {
  const variantClasses = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };

  return (
    <div className={`border rounded-lg p-4 ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
}

export interface AlertBannerProps {
  title: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  className?: string;
}

export function AlertBanner({ title, message, severity, className = '' }: AlertBannerProps) {
  const severityClasses = {
    critical: 'bg-red-100 border-red-500 text-red-900',
    high: 'bg-orange-100 border-orange-500 text-orange-900',
    medium: 'bg-yellow-100 border-yellow-500 text-yellow-900',
    low: 'bg-blue-100 border-blue-500 text-blue-900',
  };

  return (
    <div className={`border-l-4 rounded p-4 ${severityClasses[severity]} ${className}`}>
      <h4 className="font-bold mb-1">{title}</h4>
      <p className="text-sm">{message}</p>
    </div>
  );
}

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}

export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({ title, value, change, icon, className = '' }: MetricCardProps) {
  const changeColor = change && change > 0 ? 'text-green-600' : change && change < 0 ? 'text-red-600' : 'text-gray-600';

  return (
    <Card className={className}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {change !== undefined && (
            <p className={`text-sm mt-1 ${changeColor}`}>
              {change > 0 ? '+' : ''}{change}%
            </p>
          )}
        </div>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
    </Card>
  );
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`inline-block animate-spin rounded-full border-4 border-solid border-current border-r-transparent ${sizeClasses[size]} ${className}`} role="status">
      <span className="sr-only">Loading...</span>
    </div>
  );
}
