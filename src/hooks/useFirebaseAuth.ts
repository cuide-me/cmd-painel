/**
 * Hook para verificar autenticação simples
 * Redireciona para login se não autenticado
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useFirebaseAuth() {
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Verificação simples no localStorage
    const isLogged = localStorage.getItem('admin_logged') === 'true';
    
    if (!isLogged) {
      router.push('/admin/login');
      return;
    }
    
    // Usuário autenticado
    setUser({ email: 'admin@cuide-me.com' });
    setAuthReady(true);
  }, [router]);

  return { authReady, user };
}
