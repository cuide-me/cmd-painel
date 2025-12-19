/**
 * ────────────────────────────────────────────────────────────────────────────
 * LOADING STATE - Estado de Carregamento Padronizado
 * ────────────────────────────────────────────────────────────────────────────
 */

'use client';

import React from 'react';

export interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-4',
  lg: 'h-12 w-12 border-4',
};

export function LoadingState({
  message = 'Carregando...',
  fullScreen = false,
  size = 'md',
}: LoadingStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div
        className={`
          ${sizeClasses[size]}
          animate-spin rounded-full border-solid border-blue-600 border-r-transparent
        `}
      />
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      {content}
    </div>
  );
}

/**
 * ────────────────────────────────────────────────────────────────────────────
 * SKELETON LOADER - Para cards e listas
 * ────────────────────────────────────────────────────────────────────────────
 */

export interface SkeletonProps {
  count?: number;
  className?: string;
}

export function Skeleton({ count = 1, className = '' }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-gray-200 rounded ${className}`}
        />
      ))}
    </>
  );
}

/**
 * Card Skeleton
 */
export function MetricCardSkeleton() {
  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
      <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
    </div>
  );
}

/**
 * Chart Skeleton
 */
export function ChartSkeleton() {
  return (
    <div className="border rounded-lg bg-white shadow-sm animate-pulse">
      <div className="px-6 py-4 border-b">
        <div className="h-5 bg-gray-200 rounded w-1/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/3 mt-2"></div>
      </div>
      <div className="p-6">
        <div className="h-64 bg-gray-100 rounded"></div>
      </div>
    </div>
  );
}
