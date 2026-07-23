'use client';

/**
 * Admin Layout Component
 * Standardized layout for all admin pages
 */

import { ReactNode } from 'react';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  icon?: string;
}

export default function AdminLayout({ children, title, subtitle, icon = '📊' }: AdminLayoutProps) {
  return (
    <div className="space-y-6">
      <header className="flex items-start gap-3 border-b border-[var(--cm-border)] pb-5">
        <span className="mt-0.5 text-xl" aria-hidden="true">{icon}</span>
        <div>
          <h1 className="text-2xl font-semibold text-[#173842]">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-[#587078]">{subtitle}</p>}
        </div>
      </header>
      <div>{children}</div>
    </div>
  );
}

export * from './AdminPrimitives';
