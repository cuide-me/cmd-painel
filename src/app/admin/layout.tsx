'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  badge?: number;
  description?: string;
}

const mainMenuItems: MenuItem[] = [
  { id: 'torre', label: 'Torre de Controle', icon: '🎯', href: '/admin', description: 'Dashboard executivo com KPIs críticos' },
  { id: 'torre-detail', label: 'Torre (Detalhes)', icon: '📊', href: '/admin/torre-de-controle', description: 'Visão detalhada com drill-down regional' },
];

const secondaryMenuItems: MenuItem[] = [
  { id: 'users', label: 'Usuários Admin', icon: '👥', href: '/admin/users', description: 'Gestão de administradores' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
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
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="h-full px-6 flex items-center justify-between max-w-[1920px] mx-auto">
            {/* Logo & Breadcrumb */}
            <div className="flex items-center gap-6">
              <Link href="/admin" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <span className="text-2xl">🎯</span>
                <div>
                  <h1 className="text-sm font-bold text-gray-900">Torre de Controle</h1>
                  <p className="text-xs text-gray-500">Cuide.me</p>
                </div>
              </Link>
              
              {pathname !== '/admin' && (
                <>
                  <span className="text-gray-300">/</span>
                  <span className="text-sm text-gray-900 font-medium">
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
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
                title="Menu Rápido - Todos os Módulos"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span>Módulos</span>
              </button>

              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              
              {/* User Menu */}
              <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                  title="Sair"
                >
                  <svg className="w-5 h-5 text-gray-600 group-hover:text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
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
            <div className="fixed top-20 right-6 z-50 bg-white rounded-lg shadow-2xl border border-gray-200 w-[800px] max-h-[80vh] overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">🚀 Todos os Módulos</h3>
                  <button
                    onClick={() => setQuickMenuOpen(false)}
                    className="p-1 hover:bg-white/20 rounded transition-colors"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-blue-100 mt-1">Navegue rapidamente entre as áreas</p>
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(80vh-100px)] p-4">
                {/* Main Modules */}
                <div className="mb-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-3">
                    📊 Módulos Principais
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {mainMenuItems.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={() => setQuickMenuOpen(false)}
                          className={`
                            p-4 rounded-lg border transition-all hover:shadow-md
                            ${isActive 
                              ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500' 
                              : 'bg-white border-gray-200 hover:border-blue-300'
                            }
                          `}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-3xl">{item.icon}</span>
                            <span className={`text-sm font-semibold ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>
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
                <div className="border-t border-gray-200 pt-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-3">
                    ⚙️ Administração
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {secondaryMenuItems.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={() => setQuickMenuOpen(false)}
                          className={`
                            p-4 rounded-lg border transition-all hover:shadow-md
                            ${isActive 
                              ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500' 
                              : 'bg-white border-gray-200 hover:border-blue-300'
                            }
                          `}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-3xl">{item.icon}</span>
                            <span className={`text-sm font-semibold ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>
                              {item.label}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-xs text-gray-500">{item.description}</p>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

      {/* Page Content */}
      <main className="p-6 max-w-[1920px] mx-auto">
        {children}
      </main>
    </div>
  );
}
