/**
 * Serviço de Analytics para o painel administrativo
 * Integração com Google Analytics 4
 */

import { BetaAnalyticsDataClient } from '@google-analytics/data';

export interface GoogleAnalyticsMetrics {
  activeUsers: number;
  newUsers: number;
  sessions: number;
  pageViews: number;
  bounceRate: number;
  averageSessionDuration: number;
  topPages: Array<{
    page: string;
    views: number;
  }>;
  usersByDevice: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
}

/**
 * Busca métricas do Google Analytics 4
 */
export async function fetchGoogleAnalyticsMetrics(
  startDate: string = '30daysAgo',
  endDate: string = 'today'
): Promise<GoogleAnalyticsMetrics> {
  const propertyId = process.env.GA4_PROPERTY_ID;

  if (!propertyId) {
    console.warn('GA4_PROPERTY_ID não configurado');
    return getDefaultMetrics();
  }

  try {
    const analyticsDataClient = new BetaAnalyticsDataClient();

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate,
          endDate,
        },
      ],
      dimensions: [
        {
          name: 'deviceCategory',
        },
      ],
      metrics: [
        {
          name: 'activeUsers',
        },
        {
          name: 'newUsers',
        },
        {
          name: 'sessions',
        },
        {
          name: 'screenPageViews',
        },
        {
          name: 'bounceRate',
        },
        {
          name: 'averageSessionDuration',
        },
      ],
    });

    const metrics: GoogleAnalyticsMetrics = {
      activeUsers: 0,
      newUsers: 0,
      sessions: 0,
      pageViews: 0,
      bounceRate: 0,
      averageSessionDuration: 0,
      topPages: [],
      usersByDevice: {
        desktop: 0,
        mobile: 0,
        tablet: 0,
      },
    };

    // Processar resposta
    if (response.rows) {
      for (const row of response.rows) {
        const device = row.dimensionValues?.[0]?.value?.toLowerCase() || 'desktop';
        const activeUsers = parseInt(row.metricValues?.[0]?.value || '0');
        const newUsers = parseInt(row.metricValues?.[1]?.value || '0');
        const sessions = parseInt(row.metricValues?.[2]?.value || '0');
        const pageViews = parseInt(row.metricValues?.[3]?.value || '0');

        metrics.activeUsers += activeUsers;
        metrics.newUsers += newUsers;
        metrics.sessions += sessions;
        metrics.pageViews += pageViews;

        if (device === 'mobile') {
          metrics.usersByDevice.mobile += activeUsers;
        } else if (device === 'tablet') {
          metrics.usersByDevice.tablet += activeUsers;
        } else {
          metrics.usersByDevice.desktop += activeUsers;
        }
      }

      // Calcular médias
      if (response.rows.length > 0) {
        const firstRow = response.rows[0];
        metrics.bounceRate = parseFloat(firstRow.metricValues?.[4]?.value || '0');
        metrics.averageSessionDuration = parseFloat(firstRow.metricValues?.[5]?.value || '0');
      }
    }

    return metrics;
  } catch (error) {
    console.error('Erro ao buscar métricas do GA4:', error);
    return getDefaultMetrics();
  }
}

function getDefaultMetrics(): GoogleAnalyticsMetrics {
  return {
    activeUsers: 0,
    newUsers: 0,
    sessions: 0,
    pageViews: 0,
    bounceRate: 0,
    averageSessionDuration: 0,
    topPages: [],
    usersByDevice: {
      desktop: 0,
      mobile: 0,
      tablet: 0,
    },
  };
}
