/**
 * Growth KPIs - Torre de Controle
 * Fonte: GA4 (tráfego) + Firebase (cadastros)
 * Responde: "Estamos crescendo?"
 */

import { getAnalyticsClient } from '@/services/admin/analytics';
import { getFirestore } from '@/lib/server/firebaseAdmin';
import { toDate } from '@/lib/dateUtils';
import type { GrowthKPIs } from './types';

export async function getGrowthKPIs(): Promise<GrowthKPIs> {
  try {
    console.log('[Growth] Buscando dados GA4 + Firebase...');
    
    // 1. GA4 - Visitantes únicos e sessões (últimos 7 dias)
    const propertyId = `properties/${process.env.GA4_PROPERTY_ID}`;
    
    let visitantesUnicos = 0;
    let sessoes = 0;
    
    try {
      if (!process.env.GA4_PROPERTY_ID) {
        console.warn('[Growth] GA4_PROPERTY_ID não configurado - pulando métricas GA4');
      } else {
        const client = getAnalyticsClient();
        const [response] = await client.runReport({
          property: propertyId,
          dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          metrics: [
            { name: 'totalUsers' },
            { name: 'sessions' }
          ]
        });
        
        visitantesUnicos = parseInt(response.rows?.[0]?.metricValues?.[0]?.value || '0');
        sessoes = parseInt(response.rows?.[0]?.metricValues?.[1]?.value || '0');
        
        console.log('[Growth] GA4 - Visitantes:', visitantesUnicos, 'Sessões:', sessoes);
      }
    } catch (gaError) {
      console.error('[Growth] Erro ao buscar GA4:', gaError);
      // Continuar sem dados GA4
    }
    
    // 2. Firebase - Cadastros (últimos 7 dias)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const db = getFirestore();
    const usersSnap = await db
      .collection('users')
      .orderBy('createdAt', 'desc')
      .limit(1000)
      .get();
    
    const cadastrosUltimos7Dias = usersSnap.docs.filter((doc: any) => {
      const createdAt = toDate(doc.data().createdAt);
      return createdAt && createdAt >= sevenDaysAgo;
    }).length;
    
    console.log('[Growth] Cadastros (7d):', cadastrosUltimos7Dias);
    
    // 3. Taxa de Conversão (visitantes → cadastros)
    const taxaConversao = visitantesUnicos > 0
      ? (cadastrosUltimos7Dias / visitantesUnicos) * 100
      : 0;
    
    console.log('[Growth] Taxa conversão:', taxaConversao.toFixed(2) + '%');
    
    // 4. CAC (Customer Acquisition Cost)
    // ⚠️ NOTA: Valor placeholder ($50 por cadastro)
    // TODO: Substituir por dados reais de investimento em marketing
    const cacEstimado = 50;
    
    return {
      visitantesUnicos,
      sessoes,
      cadastros: cadastrosUltimos7Dias,
      taxaConversao: Math.round(taxaConversao * 100) / 100,
      cac: cacEstimado,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[Growth] ❌ Erro ao buscar KPIs:', error);
    
    // Retornar zeros em caso de erro
    return {
      visitantesUnicos: 0,
      sessoes: 0,
      cadastros: 0,
      taxaConversao: 0,
      cac: 50,
      timestamp: new Date().toISOString()
    };
  }
}
