'use client';

/**
 * Admin Root Redirect
 * Redirects to Torre v2 dashboard
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRoot() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to Torre v2 dashboard
    router.replace('/admin/torre-v2');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="text-4xl mb-4">🎯</div>
        <div className="text-lg text-gray-600">Redirecting to Torre v2...</div>
      </div>
    </div>
  );
}
