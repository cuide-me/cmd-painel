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

    const analyticsDataClient = new BetaAnalyticsDataClient();

    // Teste simples: buscar dados dos últimos 7 dias
    const [response] = await analyticsDataClient.runReport({
      property: propertyId,
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
