/**
 * ═══════════════════════════════════════════════════════
 * PÁGINA - Torre de Controle
 * ═══════════════════════════════════════════════════════
 * /admin/torre-de-controle
 */

'use client';

import React from 'react';
import { TorreDeControleDashboard } from '@/components/admin/TorreDeControleDashboard';

export default function TorreDeControlePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TorreDeControleDashboard />
      </div>
    </div>
  );
}
