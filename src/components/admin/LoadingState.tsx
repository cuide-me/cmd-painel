'use client';

import React from 'react';

interface LoadingStateProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

export default function LoadingState({ 
  size = 'md', 
  text = 'Carregando...', 
  fullScreen = false 
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizeClasses[size]} animate-spin`}>
        <svg 
          className="text-blue-600" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
      {text && (
        <p className={`${textSizeClasses[size]} text-gray-600 font-medium`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      {spinner}
    </div>
  );
}

// Skeleton para tabelas
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {/* Header */}
      <div className="h-10 bg-gray-200 rounded"></div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 bg-gray-100 rounded"></div>
      ))}
    </div>
  );
}

// Skeleton para cards
export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-300 rounded w-1/2"></div>
            <div className="h-3 bg-gray-100 rounded w-full"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Skeleton para gráficos
export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="animate-pulse">
      <div 
        className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-end justify-around p-6" 
        style={{ height: `${height}px` }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div 
            key={i} 
            className="bg-gray-300 rounded-t w-12" 
            style={{ height: `${Math.random() * 80 + 20}%` }}
          ></div>
        ))}
      </div>
    </div>
  );
}

// Skeleton para KPIs
export function KpiSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-3">
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            <div className="h-10 bg-gray-300 rounded w-1/2"></div>
            <div className="h-2 bg-gray-100 rounded w-1/3"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
