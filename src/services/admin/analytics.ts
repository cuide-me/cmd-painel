/**
 * ────────────────────────────────────
 * GOOGLE ANALYTICS SERVICE
 * ────────────────────────────────────
 * Integração com Google Analytics 4 (GA4)
 * Para métricas de tráfego, conversões e comportamento
 */

import { BetaAnalyticsDataClient } from '@google-analytics/data';

let analyticsClient: BetaAnalyticsDataClient | null = null;

/**
 * Inicializa cliente do Google Analytics Data API
 */
function getAnalyticsClient(): BetaAnalyticsDataClient {
  if (analyticsClient) {
    return analyticsClient;
  }

  // Credenciais podem vir de:
  // 1. GOOGLE_ANALYTICS_CREDENTIALS (base64 JSON)
  // 2. GOOGLE_APPLICATION_CREDENTIALS (path to JSON file)
  // 3. Default application credentials (quando rodando no GCP)

  if (process.env.GOOGLE_ANALYTICS_CREDENTIALS) {
    try {
      const credentials = JSON.parse(
        Buffer.from(process.env.GOOGLE_ANALYTICS_CREDENTIALS, 'base64').toString('utf-8')
      );
      
      analyticsClient = new BetaAnalyticsDataClient({
        credentials,
      });
      
      return analyticsClient;
    } catch (error) {
      console.error('[Google Analytics] Error parsing credentials:', error);
      throw new Error('Invalid GOOGLE_ANALYTICS_CREDENTIALS format');
    }
  }

  // Fallback para default credentials
  analyticsClient = new BetaAnalyticsDataClient();
  return analyticsClient;
}

export interface AnalyticsMetrics {
  // Métricas de tráfego
  totalUsers: number;
  newUsers: number;
  sessions: number;
  pageViews: number;
  avgSessionDuration: number; // em segundos
  bounceRate: number; // porcentagem

  // Métricas de conversão
  conversions: number;
  conversionRate: number; // porcentagem
  
  // Top páginas
  topPages: Array<{
    path: string;
    views: number;
    uniqueUsers: number;
  }>;

  // Fontes de tráfego
  trafficSources: Array<{
    source: string;
    medium: string;
    users: number;
    sessions: number;
  }>;
}

/**
 * Retorna métricas do Google Analytics para o período especificado
 * @param propertyId - GA4 Property ID (ex: "properties/123456789")
 * @param startDate - Data inicial (formato: YYYY-MM-DD ou "30daysAgo")
 * @param endDate - Data final (formato: YYYY-MM-DD ou "today")
 */
export async function getAnalyticsMetrics(
  propertyId: string,
  startDate: string = '30daysAgo',
  endDate: string = 'today'
): Promise<AnalyticsMetrics> {
  try {
    const client = getAnalyticsClient();

    // 1. Métricas principais
    const [mainMetricsResponse] = await client.runReport({
      property: propertyId,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'totalUsers' },
        { name: 'newUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
        { name: 'conversions' },
      ],
    });

    const mainRow = mainMetricsResponse.rows?.[0];
    const totalUsers = parseInt(mainRow?.metricValues?.[0]?.value || '0');
    const newUsers = parseInt(mainRow?.metricValues?.[1]?.value || '0');
    const sessions = parseInt(mainRow?.metricValues?.[2]?.value || '0');
    const pageViews = parseInt(mainRow?.metricValues?.[3]?.value || '0');
    const avgSessionDuration = parseFloat(mainRow?.metricValues?.[4]?.value || '0');
    const bounceRate = parseFloat(mainRow?.metricValues?.[5]?.value || '0') * 100;
    const conversions = parseInt(mainRow?.metricValues?.[6]?.value || '0');
    const conversionRate = sessions > 0 ? (conversions / sessions) * 100 : 0;

    // 2. Top páginas
    const [topPagesResponse] = await client.runReport({
      property: propertyId,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'totalUsers' },
      ],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10,
    });

    const topPages = (topPagesResponse.rows || []).map(row => ({
      path: row.dimensionValues?.[0]?.value || '',
      views: parseInt(row.metricValues?.[0]?.value || '0'),
      uniqueUsers: parseInt(row.metricValues?.[1]?.value || '0'),
    }));

    // 3. Fontes de tráfego
    const [trafficSourcesResponse] = await client.runReport({
      property: propertyId,
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'sessionSource' },
        { name: 'sessionMedium' },
      ],
      metrics: [
        { name: 'totalUsers' },
        { name: 'sessions' },
      ],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 10,
    });

    const trafficSources = (trafficSourcesResponse.rows || []).map(row => ({
      source: row.dimensionValues?.[0]?.value || '',
      medium: row.dimensionValues?.[1]?.value || '',
      users: parseInt(row.metricValues?.[0]?.value || '0'),
      sessions: parseInt(row.metricValues?.[1]?.value || '0'),
    }));

    return {
      totalUsers,
      newUsers,
      sessions,
      pageViews,
      avgSessionDuration: Math.round(avgSessionDuration),
      bounceRate: Math.round(bounceRate * 100) / 100,
      conversions,
      conversionRate: Math.round(conversionRate * 100) / 100,
      topPages,
      trafficSources,
    };
  } catch (error) {
    console.error('[getAnalyticsMetrics] Error:', error);
    // Retorna zeros em caso de erro
    return {
      totalUsers: 0,
      newUsers: 0,
      sessions: 0,
      pageViews: 0,
      avgSessionDuration: 0,
      bounceRate: 0,
      conversions: 0,
      conversionRate: 0,
      topPages: [],
      trafficSources: [],
    };
  }
}

/**
 * Retorna métricas de conversão específicas para eventos personalizados
 * @param propertyId - GA4 Property ID
 * @param eventName - Nome do evento (ex: "sign_up", "purchase", "contact_caregiver")
 * @param startDate - Data inicial
 * @param endDate - Data final
 */
export async function getConversionMetrics(
  propertyId: string,
  eventName: string,
  startDate: string = '30daysAgo',
  endDate: string = 'today'
): Promise<{
  eventCount: number;
  uniqueUsers: number;
  conversionRate: number;
}> {
  try {
    const client = getAnalyticsClient();

    const [response] = await client.runReport({
      property: propertyId,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'eventName' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            value: eventName,
            matchType: 'EXACT',
          },
        },
      },
      metrics: [
        { name: 'eventCount' },
        { name: 'totalUsers' },
      ],
    });

    const row = response.rows?.[0];
    const eventCount = parseInt(row?.metricValues?.[0]?.value || '0');
    const uniqueUsers = parseInt(row?.metricValues?.[1]?.value || '0');

    // Para calcular taxa de conversão, precisamos do total de sessões
    const [sessionsResponse] = await client.runReport({
      property: propertyId,
      dateRanges: [{ startDate, endDate }],
      metrics: [{ name: 'sessions' }],
    });

    const totalSessions = parseInt(sessionsResponse.rows?.[0]?.metricValues?.[0]?.value || '0');
    const conversionRate = totalSessions > 0 ? (eventCount / totalSessions) * 100 : 0;

    return {
      eventCount,
      uniqueUsers,
      conversionRate: Math.round(conversionRate * 100) / 100,
    };
  } catch (error) {
    console.error('[getConversionMetrics] Error:', error);
    return {
      eventCount: 0,
      uniqueUsers: 0,
      conversionRate: 0,
    };
  }
}

/**
 * Retorna métricas de funil de conversão
 * Útil para analisar dropoff em cada etapa
 */
export async function getFunnelMetrics(
  propertyId: string,
  steps: string[], // Array de event names (ex: ["view_signup", "start_signup", "complete_signup"])
  startDate: string = '30daysAgo',
  endDate: string = 'today'
): Promise<Array<{
  step: string;
  users: number;
  dropoffRate: number;
}>> {
  try {
    const client = getAnalyticsClient();
    const results: Array<{ step: string; users: number; dropoffRate: number }> = [];
    let previousUsers = 0;

    for (let i = 0; i < steps.length; i++) {
      const [response] = await client.runReport({
        property: propertyId,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'eventName' }],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            stringFilter: {
              value: steps[i],
              matchType: 'EXACT',
            },
          },
        },
        metrics: [{ name: 'totalUsers' }],
      });

      const users = parseInt(response.rows?.[0]?.metricValues?.[0]?.value || '0');
      const dropoffRate = previousUsers > 0 ? ((previousUsers - users) / previousUsers) * 100 : 0;

      results.push({
        step: steps[i],
        users,
        dropoffRate: Math.round(dropoffRate * 100) / 100,
      });

      previousUsers = users;
    }

    return results;
  } catch (error) {
    console.error('[getFunnelMetrics] Error:', error);
    return steps.map(step => ({ step, users: 0, dropoffRate: 0 }));
  }
}
