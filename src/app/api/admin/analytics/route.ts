/**
 * ────────────────────────────────────
 * API: Google Analytics Metrics
 * ────────────────────────────────────
 * GET /api/admin/analytics
 * 
 * Retorna métricas do Google Analytics 4
 */

import { NextResponse } from 'next/server';
import { getAnalyticsMetrics, getConversionMetrics } from '@/services/admin/analytics';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/analytics
 * Query params:
 * - startDate (opcional): data inicial (default: 30daysAgo)
 * - endDate (opcional): data final (default: today)
 * - propertyId (opcional): GA4 property ID (default: env var)
 */
export async function GET(request: Request) {
  try {
    // Parse query params
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || '30daysAgo';
    const endDate = searchParams.get('endDate') || 'today';
    const propertyId = searchParams.get('propertyId') || process.env.GOOGLE_ANALYTICS_PROPERTY_ID;

    if (!propertyId) {
      return NextResponse.json(
        { 
          error: 'GOOGLE_ANALYTICS_PROPERTY_ID não configurado',
          message: 'Configure a variável de ambiente GOOGLE_ANALYTICS_PROPERTY_ID'
        },
        { status: 500 }
      );
    }

    // Buscar métricas principais
    const metrics = await getAnalyticsMetrics(propertyId, startDate, endDate);

    // Buscar métricas de conversões específicas (eventos personalizados)
    const signupConversions = await getConversionMetrics(
      propertyId,
      'sign_up',
      startDate,
      endDate
    );

    const requestConversions = await getConversionMetrics(
      propertyId,
      'create_request',
      startDate,
      endDate
    );

    const hireConversions = await getConversionMetrics(
      propertyId,
      'hire_caregiver',
      startDate,
      endDate
    );

    return NextResponse.json({
      success: true,
      data: {
        // Métricas principais
        traffic: {
          totalUsers: metrics.totalUsers,
          newUsers: metrics.newUsers,
          sessions: metrics.sessions,
          pageViews: metrics.pageViews,
          avgSessionDuration: metrics.avgSessionDuration,
          bounceRate: metrics.bounceRate,
        },

        // Conversões gerais
        conversions: {
          total: metrics.conversions,
          rate: metrics.conversionRate,
        },

        // Conversões específicas
        customConversions: {
          signups: {
            count: signupConversions.eventCount,
            users: signupConversions.uniqueUsers,
            rate: signupConversions.conversionRate,
          },
          requests: {
            count: requestConversions.eventCount,
            users: requestConversions.uniqueUsers,
            rate: requestConversions.conversionRate,
          },
          hires: {
            count: hireConversions.eventCount,
            users: hireConversions.uniqueUsers,
            rate: hireConversions.conversionRate,
          },
        },

        // Top páginas
        topPages: metrics.topPages,

        // Fontes de tráfego
        trafficSources: metrics.trafficSources,

        // Metadata
        period: {
          startDate,
          endDate,
        },
        fetchedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[GET /api/admin/analytics] Error:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao buscar métricas do Google Analytics',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
