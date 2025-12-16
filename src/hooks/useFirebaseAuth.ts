/**
 * Hook para verificar autenticação Firebase
 * Redireciona para login se não autenticado
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirebaseApp } from '@/firebase/firebaseApp';

export function useFirebaseAuth() {
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const app = getFirebaseApp();
    const auth = getAuth(app);
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        // Não autenticado, redirecionar para login
        router.push('/admin/login');
        return;
      }
      
      // Usuário autenticado
      setUser(currentUser);
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, [router]);

  return { authReady, user };
}
