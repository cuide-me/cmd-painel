'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithCustomToken } from 'firebase/auth';
import { getFirebaseAuth } from '@/firebase/firebaseApp';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success && data.firebaseCustomToken) {
        const auth = getFirebaseAuth();
        await signInWithCustomToken(auth, data.firebaseCustomToken);
        
        router.push('/admin');
      } else {
        setError(data.message || 'Senha incorreta');
      }
    } catch (requestError: unknown) {
      console.error('[Login] Erro:', requestError);
      setError('Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="cm-admin-canvas flex min-h-screen items-center justify-center p-4 sm:p-6">
      <section className="w-full max-w-md rounded-xl border border-[#b7dde1] bg-white p-6 shadow-xl shadow-[#176172]/10 sm:p-8" aria-labelledby="admin-login-title">
        <header className="mb-8 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#176172] text-3xl font-bold text-white" aria-hidden="true">C</span>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-[#176172]">Cuide-me | Central de operacao</p>
          <h1 id="admin-login-title" className="mt-2 text-3xl font-semibold text-[#173842]">Bem-vindo de volta</h1>
          <p className="mt-2 text-sm leading-6 text-[#587078]">Acesse a visao que ajuda a cuidar de cada atendimento.</p>
        </header>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3" role="alert">
              <p className="text-sm text-rose-800">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-[#173842]">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Digite a senha administrativa"
              className="w-full rounded-lg border border-[#b7dde1] px-4 py-3 text-[#173842] outline-none transition placeholder:text-[#89a0a7] focus:border-[#1195a8] focus:ring-2 focus:ring-[#dff4f5]"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#176172] px-4 py-3 font-semibold text-white transition-colors hover:bg-[#124b58] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Entrando...
              </>
            ) : 'Entrar na central'}
          </button>
        </form>

        <footer className="mt-8 border-t border-[#dff4f5] pt-4 text-center">
          <p className="text-xs text-[#587078]">Cuide-me: cuidar com verdade, conectar com responsabilidade.</p>
        </footer>
      </section>
    </main>
  );
}
