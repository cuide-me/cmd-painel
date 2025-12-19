/**
 * API Route: Control Tower
 * Torre de Controle - Dashboard decisório
 * 
 * Retorna KPIs consolidados + alertas automáticos
 * Responde as 3 perguntas críticas:
 * 1. Estamos ganhando ou perdendo dinheiro?
 * 2. Onde está o gargalo agora?
 * 3. O que vai virar problema se eu não agir hoje?
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getFinanceKPIs, 
  getOperationsKPIs, 
  getGrowthKPIs, 
  getQualityKPIs,
  generateAlerts 
} from '@/services/admin/control-tower';
import type { ControlTowerDashboard } from '@/services/admin/control-tower';

export async function GET(request: NextRequest) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🏗️  TORRE DE CONTROLE - Buscando dados...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const startTime = Date.now();

    // Buscar KPIs em paralelo para otimizar performance
    console.log('[ControlTower] 🔄 Buscando KPIs em paralelo...');
    
    const [finance, operations, growth, quality] = await Promise.all([
      getFinanceKPIs(),
      getOperationsKPIs(),
      getGrowthKPIs(),
      getQualityKPIs()
    ]);

    console.log('\n[ControlTower] ✅ KPIs obtidos:');
    console.log('  💰 Finance:', {
      mrr: finance.mrr,
      mrrGrowth: finance.mrrGrowth + '%',
      churn: finance.churnRate + '%'
    });
    console.log('  👥 Operations:', {
      disponíveis: operations.profissionaisDisponiveis,
      sla: operations.slaCompliance + '%',
      abandono: operations.taxaAbandono + '%'
    });
    console.log('  📈 Growth:', {
      visitantes: growth.visitantesUnicos,
      cadastros: growth.cadastros,
      conversão: growth.taxaConversao + '%'
    });
    console.log('  🎯 Quality:', {
      nps: quality.npsScore,
      ticketsAbertos: quality.ticketsAbertos,
      ticketsAtraso: quality.ticketsEmAtraso
    });

    // Gerar alertas baseados nos KPIs
    console.log('\n[ControlTower] 🚨 Gerando alertas...');
    const alerts = await generateAlerts({
      finance,
      operations,
      growth,
      quality
    });

    // Montar resposta
    const dashboard: ControlTowerDashboard = {
      finance,
      operations,
      growth,
      quality,
      alerts,
      timestamp: new Date().toISOString()
    };

    const elapsed = Date.now() - startTime;
    console.log(`\n[ControlTower] ✅ Dashboard montado em ${elapsed}ms`);
    console.log(`[ControlTower] 🚨 ${alerts.length} alertas gerados\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return NextResponse.json(dashboard, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0'  // Não cachear (dados em tempo real)
      }
    });

  } catch (error) {
    console.error('\n[ControlTower] ❌ ERRO:', error);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return NextResponse.json(
      { 
        error: 'Erro ao buscar dados da Torre de Controle',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
