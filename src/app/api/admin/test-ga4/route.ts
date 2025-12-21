import { NextRequest, NextResponse } from 'next/server';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

export async function GET(request: NextRequest) {
  try {
    const propertyId = process.env.GA4_PROPERTY_ID;
    
    if (!propertyId) {
      return NextResponse.json({
        error: 'GA4_PROPERTY_ID não configurado',
        propertyId: null
      }, { status: 500 });
    }

    // Usar as mesmas credenciais do Firebase Admin
    let credentials;
    if (process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(
        Buffer.from(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT, 'base64').toString('utf-8')
      );
      credentials = {
        client_email: serviceAccount.client_email,
        private_key: serviceAccount.private_key,
      };
    }

    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials
    });

    // Formatar property ID corretamente
    const property = `properties/${propertyId}`;

    // Teste simples: buscar dados dos últimos 7 dias
    const [response] = await analyticsDataClient.runReport({
      property,
      dateRanges: [{
        startDate: '7daysAgo',
        endDate: 'today',
      }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'activeUsers' }],
    });

    return NextResponse.json({
      success: true,
      propertyId,
      rowCount: response.rows?.length || 0,
      sample: response.rows?.slice(0, 3).map(row => ({
        date: row.dimensionValues?.[0]?.value,
        users: row.metricValues?.[0]?.value
      }))
    });

  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
      propertyId: process.env.GA4_PROPERTY_ID
    }, { status: 500 });
  }
}
