/**
 * Hook para gerenciar autenticação de administradores
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirestoreDb } from '@/firebase/firebaseApp';
import {
  getAdminRole,
  hasAdminPermission,
  type AdminPermission,
  type AdminRole,
} from '@/modules/shared/auth/permissions';

interface AdminAuthState {
  user: User | null;
  isAdmin: boolean;
  role: AdminRole | null;
  loading: boolean;
  error: string | null;
}

export function useAdminAuth() {
  const [state, setState] = useState<AdminAuthState>({
    user: null,
    isAdmin: false,
    role: null,
    loading: true,
    error: null,
  });
  const router = useRouter();

  useEffect(() => {
    const auth = getFirebaseAuth();
    const db = getFirestoreDb();

    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (!user) {
        setState({ user: null, isAdmin: false, role: null, loading: false, error: null });
        return;
      }

      try {
        const tokenResult = await user.getIdTokenResult();
        const hasAdminClaim = tokenResult.claims.admin === true || tokenResult.claims.role === 'admin';

        // Verifica se o usuário tem role de admin no Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        const userData = userDoc.exists() ? userDoc.data() : null;
        const hasFirestoreAdmin =
          userData?.role === 'admin' ||
          userData?.perfil === 'admin' ||
          userData?.isAdmin === true;

        const isAdmin = hasAdminClaim || hasFirestoreAdmin;
        const role = getAdminRole(tokenResult.claims) || (hasFirestoreAdmin ? 'admin' : null);

        setState({
          user,
          isAdmin,
          role,
          loading: false,
          error: isAdmin ? null : 'Acesso negado: usuário não é administrador',
        });
      } catch (error) {
        console.error('Erro ao verificar permissões de admin:', error);
        setState({
          user: null,
          isAdmin: false,
          role: null,
          loading: false,
          error: 'Erro ao verificar permissões',
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = useCallback(async () => {
    try {
      const auth = getFirebaseAuth();
      await auth.signOut();
      router.push('/admin/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }, [router]);

  const can = useCallback(
    (permission: AdminPermission) => state.role !== null && hasAdminPermission(state.role, permission),
    [state.role],
  );

  return { ...state, authReady: !state.loading && state.isAdmin, can, logout };
}
