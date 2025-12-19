'use client';

import { useEffect, useState } from 'react';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import Link from 'next/link';

export default function PerformancePage() {
  const { authReady } = useFirebaseAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authReady) {
      setLoading(false);
    }
  }, [authReady]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Performance</h1>
          <p className="text-gray-600">Métricas de performance da plataforma</p>
        </div>

        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Página em Desenvolvimento</h2>
          <p className="text-gray-600 mb-6">
            As métricas de performance estão sendo implementadas.
          </p>
          <Link
            href="/admin/torre"
            className="inline-block px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Ver Torre de Controle
          </Link>
        </div>
      </div>
    </div>
  );
}
