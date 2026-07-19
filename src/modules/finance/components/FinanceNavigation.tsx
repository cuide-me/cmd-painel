'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/admin/financeiro', label: 'Visão geral' },
  { href: '/admin/financeiro/recebimentos', label: 'Recebimentos' },
  { href: '/admin/financeiro/repasses', label: 'Repasses' },
  { href: '/admin/financeiro/resultados', label: 'Resultados' },
];

export function FinanceNavigation() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Navegação financeira">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${active
              ? 'border-emerald-700 bg-emerald-700 text-white'
              : 'border-slate-300 bg-white text-slate-700 hover:border-emerald-600 hover:text-emerald-800'}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}