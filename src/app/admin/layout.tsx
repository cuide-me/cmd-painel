'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ToastProvider } from '@/components/admin/ToastNotifications';
import NotificationBell from '@/components/admin/NotificationBell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Não verificar autenticação na página de login
    if (pathname === '/admin/login') {
      return;
    }

    // Verificar se está logado
    const isLogged = localStorage.getItem('admin_logged');

    if (!isLogged || isLogged !== 'true') {
      // Redirecionar para login se não estiver autenticado
      router.push('/admin/login');
    }
  }, [pathname, router]);

  // Se estiver na página de login, renderizar normalmente
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Para outras páginas, renderizar com notificações
  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header com Notification Bell */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎯</span>
              <h1 className="text-xl font-bold text-gray-900">Torre de Controle</h1>
            </div>
            <NotificationBell />
          </div>
        </header>
        
        {/* Content */}
        <main>{children}</main>
      </div>
    </ToastProvider>
  );
}
