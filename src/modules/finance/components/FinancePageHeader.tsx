import type { ReactNode } from 'react';
import { FinanceNavigation } from './FinanceNavigation';

export function FinancePageHeader({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return (
    <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Cuide-me</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">{description}</p>
        </div>
        {actions}
      </div>
      <div className="mt-5 border-t border-slate-100 pt-4"><FinanceNavigation /></div>
    </header>
  );
}