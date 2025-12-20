'use client';

/**
 * ═══════════════════════════════════════════════════════════
 * COMPONENTE: Loading Skeleton
 * ═══════════════════════════════════════════════════════════
 * Skeleton loader para charts e cards
 */

interface LoadingSkeletonProps {
  type?: 'chart' | 'card' | 'table';
  rows?: number;
}

export default function LoadingSkeleton({ type = 'card', rows = 3 }: LoadingSkeletonProps) {
  if (type === 'chart') {
    return (
      <div className="bg-white rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="flex items-end gap-2 h-48">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-gray-200 rounded-t"
                style={{ height: `${Math.random() * 100 + 50}px` }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="bg-white rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-2">
          {[...Array(rows)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-100 rounded"></div>
        <div className="h-4 bg-gray-100 rounded w-5/6"></div>
        <div className="h-4 bg-gray-100 rounded w-4/6"></div>
      </div>
    </div>
  );
}
