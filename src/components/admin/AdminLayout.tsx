'use client';

/**
 * Admin Layout Component
 * Standardized layout for all admin pages
 */

import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';

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

export * from './AdminPrimitives';
