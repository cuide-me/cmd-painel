/**
 * Hook para logout automático por inatividade (apenas admin)
 *
 * Monitora eventos do usuário (mouse, teclado, scroll, touch)
 * e desloga automaticamente após 30 minutos de inatividade
 */

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getFirebaseAuth } from '@/firebase/firebaseApp';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos em ms

export function useAdminInactivityTimeout(isAdmin: boolean) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Só ativa para admins
    if (!isAdmin) return;

    const resetTimer = () => {
      // Limpar timer anterior
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Criar novo timer
      timeoutRef.current = setTimeout(async () => {
        console.warn('[Admin] Sessão expirada por inatividade (30min)');

        // Deslogar
        const auth = getFirebaseAuth();
        await auth.signOut();

        // Redirecionar para login
        router.push('/admin/login?reason=inactivity');
      }, INACTIVITY_TIMEOUT);
    };

    // Eventos que indicam atividade
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    // Adicionar listeners
    events.forEach(event => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    // Iniciar timer
    resetTimer();

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [isAdmin, router]);
}
