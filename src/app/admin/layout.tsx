'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

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

  // Para outras páginas, renderizar só se estiver logado
  // (durante o useEffect, pode haver um flash, mas é rápido)
  return <>{children}</>;
}
