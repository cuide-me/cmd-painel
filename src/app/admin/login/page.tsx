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
      // Validar senha no backend (não no client)
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success && data.firebaseCustomToken) {
        const auth = getFirebaseAuth();
        await signInWithCustomToken(auth, data.firebaseCustomToken);
        
        console.log('[Login] Acesso concedido');
        router.push('/admin');
      } else {
        setError(data.message || 'Senha incorreta');
      }
    } catch (err: any) {
      console.error('[Login] Erro:', err);
      setError('Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
            🎯
          </div>
          <h1 className="text-3xl font-bold text-black mb-2">Cuide-me Admin</h1>
          <p className="text-black text-sm">Acesso restrito ao painel administrativo</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">❌ {error}</p>
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-black mb-2">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Digite a senha de administrador"
              className="w-full px-4 py-3 border border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Entrando...
              </>
            ) : (
              <>🔐 Entrar no Painel</>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-black">© 2025 Cuide-me - Sistema Administrativo</p>
        </div>
      </div>
    </div>
  );
}
