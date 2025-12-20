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
  description?: string;
}

const mainMenuItems: MenuItem[] = [
  { id: 'home', label: 'Torre de Controle', icon: moduleIcons.home, href: '/admin', description: 'Dashboard principal' },
  { id: 'executivo', label: 'Dashboard Executivo', icon: '📊', href: '/admin/executivo', description: 'Visão C-Level: GMV, LTV, CAC, ARR' },
  { id: 'dashboard', label: 'Dashboard V2', icon: '📈', href: '/admin/dashboard', description: 'Visão completa: Demanda, Oferta, Financeiro' },
  { id: 'marketplace', label: 'Marketplace', icon: moduleIcons.marketplace, href: '/admin/marketplace', description: 'Jobs, Matches, Conversões' },
  { id: 'familias', label: 'Famílias', icon: moduleIcons.familias, href: '/admin/familias', description: 'Gestão de famílias cadastradas' },
  { id: 'cuidadores', label: 'Cuidadores', icon: moduleIcons.cuidadores, href: '/admin/cuidadores', description: 'Gestão de profissionais' },
  { id: 'pipeline', label: 'Pipeline', icon: moduleIcons.pipeline, href: '/admin/pipeline', description: 'Funil de conversão' },
  { id: 'financeiro', label: 'Financeiro', icon: moduleIcons.financeiro, href: '/admin/financeiro', description: 'MRR, Churn, Receitas' },
  { id: 'confianca', label: 'Confiança & Qualidade', icon: moduleIcons.confianca, href: '/admin/confianca', description: 'NPS, Ratings, Satisfação' },
  { id: 'friccao', label: 'Fricção', icon: moduleIcons.friccao, href: '/admin/friccao', description: 'Pontos de atrito no fluxo' },
  { id: 'service-desk', label: 'Service Desk', icon: moduleIcons.serviceDesk, href: '/admin/service-desk', description: 'Tickets e suporte' },
];

const secondaryMenuItems: MenuItem[] = [
  { id: 'users', label: 'Usuários Admin', icon: '👥', href: '/admin/users', description: 'Gestão de administradores' },
  { id: 'settings', label: 'Configurações', icon: moduleIcons.settings, href: '/admin/settings', description: 'Preferências do sistema' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
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
                {/* Quick Menu Button */}
                <button
                  onClick={() => setQuickMenuOpen(!quickMenuOpen)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
                  title="Menu Rápido - Todos os Módulos"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                <NotificationBell />
              </div>
            </div>
          </header>

          {/* Quick Access Menu (Dropdown) */}
          {quickMenuOpen && (
            <>
              {/* Overlay */}
              <div 
                className="fixed inset-0 bg-black/20 z-40"
                onClick={() => setQuickMenuOpen(false)}
              />
              
              {/* Menu Dropdown */}
              <div className="fixed top-20 right-6 z-50 bg-white rounded-lg shadow-2xl border border-gray-200 w-96 max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">🚀 Acesso Rápido</h3>
                    <button
                      onClick={() => setQuickMenuOpen(false)}
                      className="p-1 hover:bg-white/20 rounded transition-colors"
                    >
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-sm text-blue-100 mt-1">Navegue entre todos os módulos</p>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(80vh-100px)]">
                  {/* Main Modules */}
                  <div className="p-3">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">
                      📊 Módulos Principais
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {mainMenuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.id}
                            href={item.href}
                            onClick={() => setQuickMenuOpen(false)}
                            className={`
                              p-3 rounded-lg border transition-all hover:shadow-md
                              ${isActive 
                                ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500' 
                                : 'bg-white border-gray-200 hover:border-blue-300'
                              }
                            `}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-2xl">{item.icon}</span>
                              <span className={`text-xs font-semibold ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>
                                {item.label}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  {/* Secondary Modules */}
                  <div className="p-3 border-t border-gray-200 bg-gray-50">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">
                      ⚙️ Administração
                    </div>
                    <div className="space-y-1">
                      {secondaryMenuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.id}
                            href={item.href}
                            onClick={() => setQuickMenuOpen(false)}
                            className={`
                              flex items-center gap-3 p-2.5 rounded-lg transition-all
                              ${isActive 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'hover:bg-gray-100 text-gray-700'
                              }
                            `}
                          >
                            <span className="text-xl">{item.icon}</span>
                            <div className="flex-1">
                              <div className="text-sm font-medium">{item.label}</div>
                              {item.description && (
                                <div className="text-xs text-gray-500">{item.description}</div>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="p-3 border-t border-gray-200">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">
                      📈 Status Rápido
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-xs text-green-600 font-medium">Sistema</div>
                        <div className="text-lg font-bold text-green-700">✓</div>
                      </div>
                      <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-xs text-blue-600 font-medium">APIs</div>
                        <div className="text-lg font-bold text-blue-700">49</div>
                      </div>
                      <div className="p-2 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="text-xs text-purple-600 font-medium">Módulos</div>
                        <div className="text-lg font-bold text-purple-700">{mainMenuItems.length}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Page Content */}
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
