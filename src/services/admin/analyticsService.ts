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

export interface ConversionMetrics {
  signups: {
    count: number;
    rate: number; // (signups / activeUsers) * 100
  };
  createRequests: {
    count: number;
    rate: number; // (requests / signups) * 100
  };
  hires: {
    count: number;
    rate: number; // (hires / requests) * 100
  };
  funnel: {
    visitors: number;
    signups: number;
    requests: number;
    hires: number;
    visitorToSignup: number; // %
    signupToRequest: number; // %
    requestToHire: number; // %
    overallConversion: number; // %
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
    console.warn('[GA4] GA4_PROPERTY_ID não configurado - retornando zeros');
    return getDefaultMetrics();
  }

  try {
    // GA4 usa as mesmas credenciais do Firebase Admin
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
  } catch (error: any) {
    console.warn('[GA4] Erro ao buscar métricas (retornando zeros):', error.message);
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

/**
 * Busca métricas de conversão (custom events)
 */
export async function fetchConversionMetrics(
  startDate: string = '30daysAgo',
  endDate: string = 'today'
): Promise<ConversionMetrics> {
  const propertyId = process.env.GA4_PROPERTY_ID;

  if (!propertyId) {
    console.warn('[GA4] GA4_PROPERTY_ID não configurado - retornando zeros');
    return getDefaultConversionMetrics();
  }

  try {
    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: JSON.parse(
        Buffer.from(
          process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT || '',
          'base64'
        ).toString('utf-8')
      )
    });

    // Query 1: Visitor count (activeUsers)
    const [visitorsResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [{ name: 'activeUsers' }],
    });

    const visitors = parseInt(visitorsResponse.rows?.[0]?.metricValues?.[0]?.value || '0');

    // Query 2: Custom events (sign_up, create_request, hire_caregiver)
    const [eventsResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          inListFilter: {
            values: ['sign_up', 'create_request', 'hire_caregiver']
          }
        }
      }
    });

    let signups = 0;
    let requests = 0;
    let hires = 0;

    if (eventsResponse.rows) {
      for (const row of eventsResponse.rows) {
        const eventName = row.dimensionValues?.[0]?.value || '';
        const count = parseInt(row.metricValues?.[0]?.value || '0');

        if (eventName === 'sign_up') signups = count;
        if (eventName === 'create_request') requests = count;
        if (eventName === 'hire_caregiver') hires = count;
      }
    }

    // Calculate conversion rates
    const signupRate = visitors > 0 ? (signups / visitors) * 100 : 0;
    const requestRate = signups > 0 ? (requests / signups) * 100 : 0;
    const hireRate = requests > 0 ? (hires / requests) * 100 : 0;
    const overallConversion = visitors > 0 ? (hires / visitors) * 100 : 0;

    return {
      signups: {
        count: signups,
        rate: signupRate,
      },
      createRequests: {
        count: requests,
        rate: requestRate,
      },
      hires: {
        count: hires,
        rate: hireRate,
      },
      funnel: {
        visitors,
        signups,
        requests,
        hires,
        visitorToSignup: signupRate,
        signupToRequest: requestRate,
        requestToHire: hireRate,
        overallConversion,
      },
    };
  } catch (error: any) {
    console.warn('[GA4] Erro ao buscar métricas de conversão:', error.message);
    return getDefaultConversionMetrics();
  }
}

function getDefaultConversionMetrics(): ConversionMetrics {
  return {
    signups: { count: 0, rate: 0 },
    createRequests: { count: 0, rate: 0 },
    hires: { count: 0, rate: 0 },
    funnel: {
      visitors: 0,
      signups: 0,
      requests: 0,
      hires: 0,
      visitorToSignup: 0,
      signupToRequest: 0,
      requestToHire: 0,
      overallConversion: 0,
    },
  };
}
