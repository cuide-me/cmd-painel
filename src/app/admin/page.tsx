/**
 * ═══════════════════════════════════════════════════════
 * ADMIN DASHBOARD v3.0 - PAINEL REESTRUTURADO
 * ═══════════════════════════════════════════════════════
 * Baseado 100% em dados reais: Firebase + Stripe + GA4
 * 
 * Métricas:
 * 1. Demanda (famílias únicas)
 * 2. Oferta (profissionais únicos)
 * 3. Taxa de Match
 * 4. GMV Mensal (Stripe)
 * 5. Ticket Médio
 * 6. Jobs Ativos
 * 
 * Alertas automáticos:
 * - Jobs sem match > 48h
 * - Pagamentos pendentes > 72h
 * - Tickets críticos abertos
 * 
 * Top 5 Regiões por demanda
 */

import React from 'react';
import Link from 'next/link';
import { getDashboardMetrics } from '@/services/admin/dashboard';
import { getDashboardAlerts } from '@/services/admin/dashboard';
import { getTopRegions } from '@/services/admin/dashboard';
import { DashboardStats } from '@/components/admin/DashboardStats';
import { AlertList } from '@/components/admin/AlertList';
import { TopRegions } from '@/components/admin/TopRegions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboardPage() {
  console.log('[AdminDashboard] Renderizando página...');
  
  // Buscar dados em paralelo
  const [metrics, alerts, topRegions] = await Promise.all([
    getDashboardMetrics(30),
    getDashboardAlerts(),
    getTopRegions(5, 30),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            🏥 Dashboard Cuide-me
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Última atualização: {new Date().toLocaleString('pt-BR')}
          </p>
        </div>
        <Link 
          href="/admin/torre-de-controle-v3"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
        >
          🎛️ Torre de Controle V3
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded">Novo</span>
        </Link>
      </div>

      {/* KPIs Grid */}
      <div className="mb-6">
        <DashboardStats metrics={metrics} />
      </div>

      {/* Alertas */}
      {alerts.length > 0 && (
        <div className="mb-6">
          <AlertList alerts={alerts} />
        </div>
      )}

      {/* Top Regiões */}
      <div>
        <TopRegions regions={topRegions} />
      </div>
    </div>
  );
}
