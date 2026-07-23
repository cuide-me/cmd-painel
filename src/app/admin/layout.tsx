'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import type { AdminPermission } from '@/modules/shared/auth/permissions';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  badge?: number;
  description?: string;
  hiddenInMenu?: boolean;
  permission: AdminPermission;
}

const mainMenuItems: MenuItem[] = [
  { id: 'kpi', label: 'Painel de KPI', icon: '📊', href: '/admin', description: 'Visao executiva e operacional consolidada', permission: 'dashboard.read' },
  { id: 'finance', label: 'Financeiro', icon: '💰', href: '/admin/financeiro', description: 'Recebimentos, repasses e resultados', permission: 'finance.read' },
  { id: 'jobs', label: 'Atendimentos', icon: '💼', href: '/admin/jobs', description: 'Gestão de jobs e atendimentos', permission: 'jobs.read' },
  { id: 'alerts', label: 'Alertas', icon: '🚨', href: '/admin/alertas', description: 'Monitoramento e alertas críticos', permission: 'alerts.read' },
  { id: 'service-desk', label: 'Service Desk', icon: '🎫', href: '/admin/service-desk', description: 'Gestão de tickets e suporte', permission: 'tickets.read' },
];

const secondaryMenuItems: MenuItem[] = [
  { id: 'users', label: 'Usuários', icon: '👥', href: '/admin/users', description: 'Gestão de familias e profissionais', permission: 'users.read' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAdmin, loading, can, logout } = useAdminAuth();
  const visibleMainMenuItems = mainMenuItems.filter((item) => can(item.permission));
  const visibleSecondaryMenuItems = secondaryMenuItems.filter((item) => can(item.permission));
  const menuItems = [...visibleMainMenuItems, ...visibleSecondaryMenuItems];

  useEffect(() => {
    if (pathname !== '/admin/login' && !loading && !isAdmin) {
      router.push('/admin/login');
    }
  }, [pathname, router, isAdmin, loading]);

  const handleLogout = async () => {
    await logout();
  };

  if (pathname === '/admin/login') return <>{children}</>;

  if (loading) {
    return (
      <div className="cm-admin-canvas flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-[#b7dde1] border-t-[#1195a8]" />
          <p className="text-sm text-[#587078]">Validando sessao...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cm-admin-canvas min-h-screen text-[var(--cm-text)]">
      <a href="#main-content" className="sr-only z-[60] rounded-md bg-white px-3 py-2 text-sm font-medium text-[#176172] shadow focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Pular para o conteudo principal
      </a>
      <div className="mx-auto flex min-h-screen max-w-[1920px]">
        <aside className="hidden w-64 shrink-0 border-r border-[var(--cm-border)] bg-white/90 px-4 py-6 lg:flex lg:flex-col">
          <Link href="/admin" className="flex items-center gap-3 px-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#176172] text-lg font-bold text-white" aria-hidden="true">C</span>
            <div>
              <p className="text-base font-bold text-[#173842]">Cuide-me</p>
              <p className="text-xs text-[#587078]">Central de operacao</p>
            </div>
          </Link>

          <nav className="mt-9 space-y-1" aria-label="Navegacao principal">
            {menuItems.map((item) => (
              <Link key={item.id} href={item.href} data-active={pathname === item.href} className="cm-admin-sidebar-link flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors">
                <span className="text-base" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="mt-auto border-t border-[var(--cm-border)] pt-4">
            <p className="truncate px-2 text-sm font-medium text-[#173842]">{user?.displayName || 'Admin'}</p>
            <p className="truncate px-2 pt-0.5 text-xs text-[#587078]">{user?.email || 'Sessao administrativa'}</p>
            <button onClick={handleLogout} className="mt-3 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-[#587078] transition-colors hover:bg-rose-50 hover:text-rose-700">
              Sair da sessao
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-[var(--cm-border)] bg-white/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <Link href="/admin" className="flex items-center gap-2 lg:hidden">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#176172] text-sm font-bold text-white" aria-hidden="true">C</span>
                <span className="text-sm font-bold text-[#173842]">Cuide-me</span>
              </Link>
              <div className="hidden lg:block">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#587078]">Central de operacao</p>
                <p className="mt-0.5 text-sm font-medium text-[#173842]">{menuItems.find((item) => item.href === pathname)?.label || 'Visao geral'}</p>
              </div>
              <div className="ml-auto flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium text-[#173842]">{user?.displayName || 'Admin'}</p>
                  <p className="text-xs text-[#587078]">Operacao Cuide-me</p>
                </div>
                <button onClick={handleLogout} className="rounded-full border border-[var(--cm-border)] px-3 py-1.5 text-xs font-semibold text-[#176172] transition-colors hover:bg-[var(--cm-brand-soft)]" title="Sair da sessao">
                  Sair
                </button>
              </div>
            </div>
            <nav className="mt-3 flex gap-2 overflow-x-auto pb-0.5 lg:hidden" aria-label="Navegacao principal">
              {menuItems.map((item) => (
                <Link key={item.id} href={item.href} data-active={pathname === item.href} className="cm-admin-sidebar-link shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold">
                  {item.label}
                </Link>
              ))}
            </nav>
          </header>

          <main id="main-content" className="mx-auto max-w-[1720px] p-4 sm:p-6 lg:p-8" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
