import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

/**
 * GET /api/admin/daily-metrics
 * Retorna métricas diárias para gráficos
 * - Cadastros por dia (últimos 30 dias) - Firebase
 * - Visualizações por dia (últimos 30 dias) - Google Analytics 4
 */
export async function GET(request: NextRequest) {
  try {
    // Autenticação
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    getFirebaseAdmin();
    const db = getFirestore();

    // Data de 30 dias atrás
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoTimestamp = thirtyDaysAgo.getTime();

    // CADASTROS POR DIA
    let signupsByDay: Record<string, number> = {};
    
    try {
      // Buscar últimos 500 users (sem filtro de data para evitar erro de índice)
      const usersSnap = await db
        .collection('users')
        .orderBy('createdAt', 'desc')
        .limit(500)
        .get();

      usersSnap.forEach(doc => {
        const data = doc.data();
        if (data.createdAt) {
          const createdDate = new Date(data.createdAt);
          // Filtrar últimos 30 dias manualmente
          if (createdDate.getTime() >= thirtyDaysAgoTimestamp) {
            const dateKey = createdDate.toISOString().split('T')[0];
            signupsByDay[dateKey] = (signupsByDay[dateKey] || 0) + 1;
          }
        }
      });
    } catch (error) {
      console.error('[DailyMetrics] Error fetching users:', error);
    }

    // VISUALIZAÇÕES POR DIA (via Google Analytics 4)
    let viewsByDay: Record<string, number> = {};
    
    try {
      const propertyId = process.env.GA4_PROPERTY_ID;
      
      if (propertyId) {
        const analyticsDataClient = new BetaAnalyticsDataClient({
          credentials: JSON.parse(
            Buffer.from(
              process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT || '',
              'base64'
            ).toString('utf-8')
          )
        });

        const [response] = await analyticsDataClient.runReport({
          property: `properties/${propertyId}`,
          dateRanges: [
            {
              startDate: '30daysAgo',
              endDate: 'today',
            },
          ],
          dimensions: [
            {
              name: 'date',
            },
          ],
          metrics: [
            {
              name: 'screenPageViews',
            },
          ],
        });

        // Processar resposta do GA4
        if (response.rows) {
          response.rows.forEach((row) => {
            if (row.dimensionValues && row.metricValues) {
              const dateStr = row.dimensionValues[0]?.value || '';
              // GA4 retorna data no formato YYYYMMDD, converter para YYYY-MM-DD
              const dateKey = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
              const views = parseInt(row.metricValues[0]?.value || '0', 10);
              viewsByDay[dateKey] = views;
            }
          });
        }
      } else {
        console.warn('[DailyMetrics] GA4_PROPERTY_ID não configurado');
      }
    } catch (error) {
      console.error('[DailyMetrics] Erro ao buscar dados do GA4:', error);
      // Continuar sem dados de visualizações
    }

    // Preencher gaps (dias sem dados)
    const dailyData: Array<{
      date: string;
      signups: number;
      views: number;
    }> = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      
      dailyData.push({
        date: dateKey,
        signups: signupsByDay[dateKey] || 0,
        views: viewsByDay[dateKey] || 0,
      });
    }

    return NextResponse.json({
      success: true,
      data: dailyData,
      summary: {
        totalSignups: Object.values(signupsByDay).reduce((a, b) => a + b, 0),
        totalViews: Object.values(viewsByDay).reduce((a, b) => a + b, 0),
        daysWithData: dailyData.filter(d => d.signups > 0 || d.views > 0).length,
      },
    });
  } catch (error: any) {
    console.error('[DailyMetrics API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch daily metrics' },
      { status: 500 }
    );
  }
}
