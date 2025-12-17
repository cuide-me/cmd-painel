import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * GET /api/admin/daily-metrics
 * Retorna métricas diárias para gráficos
 * - Cadastros por dia (últimos 30 dias)
 * - Visualizações por dia (via events ou GA4)
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

    // CADASTROS POR DIA
    const usersSnap = await db
      .collection('users')
      .where('createdAt', '>=', thirtyDaysAgo.toISOString())
      .get();

    const signupsByDay: Record<string, number> = {};
    
    usersSnap.forEach(doc => {
      const data = doc.data();
      if (data.createdAt) {
        const date = new Date(data.createdAt);
        const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
        signupsByDay[dateKey] = (signupsByDay[dateKey] || 0) + 1;
      }
    });

    // VISUALIZAÇÕES POR DIA (via events)
    const eventsSnap = await db
      .collection('events')
      .where('timestamp', '>=', thirtyDaysAgo.toISOString())
      .where('eventType', '==', 'page_view')
      .get();

    const viewsByDay: Record<string, number> = {};
    
    eventsSnap.forEach(doc => {
      const data = doc.data();
      if (data.timestamp) {
        const date = new Date(data.timestamp);
        const dateKey = date.toISOString().split('T')[0];
        viewsByDay[dateKey] = (viewsByDay[dateKey] || 0) + 1;
      }
    });

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
