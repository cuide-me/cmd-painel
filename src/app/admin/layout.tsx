'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ToastProvider } from '@/components/admin/ToastNotifications';
import NotificationBell from '@/components/admin/NotificationBell';
import { moduleIcons } from '@/lib/designSystem';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  badge?: number;
}

const mainMenuItems: MenuItem[] = [
  { id: 'home', label: 'Dashboard', icon: moduleIcons.home, href: '/admin' },
  { id: 'executivo', label: 'Executivo (C-Level)', icon: '📊', href: '/admin/executivo' },
  { id: 'marketplace', label: 'Marketplace', icon: moduleIcons.marketplace, href: '/admin/marketplace' },
  { id: 'familias', label: 'Famílias', icon: moduleIcons.familias, href: '/admin/familias' },
  { id: 'cuidadores', label: 'Cuidadores', icon: moduleIcons.cuidadores, href: '/admin/cuidadores' },
  { id: 'pipeline', label: 'Pipeline', icon: moduleIcons.pipeline, href: '/admin/pipeline' },
  { id: 'financeiro', label: 'Financeiro', icon: moduleIcons.financeiro, href: '/admin/financeiro' },
  { id: 'confianca', label: 'Confiança', icon: moduleIcons.confianca, href: '/admin/confianca' },
  { id: 'friccao', label: 'Fricção', icon: moduleIcons.friccao, href: '/admin/friccao' },
  { id: 'service-desk', label: 'Service Desk', icon: moduleIcons.serviceDesk, href: '/admin/service-desk' },
];

const secondaryMenuItems: MenuItem[] = [
  { id: 'users', label: 'Usuários', icon: '👥', href: '/admin/users' },
  { id: 'settings', label: 'Configurações', icon: moduleIcons.settings, href: '/admin/settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState({ name: 'Admin', email: 'admin@cuide.me' });

  useEffect(() => {
    // Não verificar autenticação na página de login
    if (pathname === '/admin/login') {
      return;
    }

    // Verificar se está logado
    const isLogged = localStorage.getItem('admin_logged');

    if (!isLogged || isLogged !== 'true') {
      router.push('/admin/login');
    }
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem('admin_logged');
    router.push('/admin/login');
  };

  // Se estiver na página de login, renderizar sem layout
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <aside 
          className={`
            fixed inset-y-0 left-0 z-50 
            bg-white border-r border-gray-200
            transition-all duration-300 ease-in-out
            ${sidebarOpen ? 'w-64' : 'w-20'}
          `}
        >
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎯</span>
              {sidebarOpen && (
                <div>
                  <h1 className="text-sm font-bold text-gray-900">Torre de Controle</h1>
                  <p className="text-xs text-gray-500">Cuide.me</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {sidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                )}
              </svg>
            </button>
          </div>

          {/* Main Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-2">
            <div className="space-y-1">
              {mainMenuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                      ${isActive 
                        ? 'bg-blue-50 text-blue-700 font-medium' 
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <span className="text-xl flex-shrink-0">{item.icon}</span>
                    {sidebarOpen && (
                      <span className="text-sm truncate">{item.label}</span>
                    )}
                    {item.badge && sidebarOpen && (
                      <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Divider */}
            <div className="my-4 border-t border-gray-200"></div>

            {/* Secondary Navigation */}
            <div className="space-y-1">
              {secondaryMenuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                      ${isActive 
                        ? 'bg-blue-50 text-blue-700 font-medium' 
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <span className="text-xl flex-shrink-0">{item.icon}</span>
                    {sidebarOpen && (
                      <span className="text-sm truncate">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-200">
            <div className={`flex items-center gap-3 ${sidebarOpen ? '' : 'justify-center'}`}>
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                A
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              )}
            </div>
            {sidebarOpen && (
              <button
                onClick={handleLogout}
                className="mt-3 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Sair
              </button>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <div className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
          {/* Top Bar */}
          <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-40">
            <div className="h-full px-6 flex items-center justify-between">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm">
                <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                  Home
                </Link>
                {pathname !== '/admin' && (
                  <>
                    <span className="text-gray-400">/</span>
                    <span className="text-gray-900 font-medium">
                      {mainMenuItems.find(item => item.href === pathname)?.label || 'Página'}
                    </span>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                <NotificationBell />
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
