'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FamiliesRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/admin/familias');
  }, [router]);
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-lg">Redirecionando...</div>
    </div>
  );
}
