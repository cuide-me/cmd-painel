/**
 * ═══════════════════════════════════════════════════════
 * API: ANALYTICS DAILY DATA
 * ═══════════════════════════════════════════════════════
 * Retorna dados diários de:
 * 1. Acessos ao site (GA4)
 * 2. Cadastros no Firebase
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

interface DailyData {
  date: string;
  websiteViews: number;      // Acessos ao www.cuide-me.com.br
  loginPageViews: number;     // Acessos ao /login
  signups: number;            // Total de cadastros
  professionals: number;      // Profissionais cadastrados
  clients: number;            // Clientes/Famílias cadastrados
}

export async function GET(request: NextRequest) {
  try {
    // Autenticação
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Inicializar Firebase
    getFirebaseAdmin();
    const db = getFirestore();

    // Parâmetros
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10); // Padrão: 30 dias

    // Calcular datas
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 1. BUSCAR DADOS DO GA4 (Acessos ao site)
    let ga4Data: Map<string, { websiteViews: number; loginPageViews: number }> = new Map();
    
    try {
      const propertyId = process.env.GA4_PROPERTY_ID;
      
      if (propertyId) {
        const analyticsDataClient = new BetaAnalyticsDataClient();

        // Query para página principal
        const [websiteResponse] = await analyticsDataClient.runReport({
          property: propertyId,
          dateRanges: [{
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
          }],
          dimensions: [{ name: 'date' }],
          metrics: [{ name: 'screenPageViews' }],
          dimensionFilter: {
            filter: {
              fieldName: 'hostName',
              stringFilter: {
                matchType: 'CONTAINS',
                value: 'cuide-me.com.br',
              },
            },
          },
        });

        // Query para página de login
        const [loginResponse] = await analyticsDataClient.runReport({
          property: propertyId,
          dateRanges: [{
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
          }],
          dimensions: [{ name: 'date' }],
          metrics: [{ name: 'screenPageViews' }],
          dimensionFilter: {
            andGroup: {
              expressions: [
                {
                  filter: {
                    fieldName: 'hostName',
                    stringFilter: {
                      matchType: 'CONTAINS',
                      value: 'cuide-me.com.br',
                    },
                  },
                },
                {
                  filter: {
                    fieldName: 'pagePath',
                    stringFilter: {
                      matchType: 'CONTAINS',
                      value: '/login',
                    },
                  },
                },
              ],
            },
          },
        });

        // Processar website views
        websiteResponse.rows?.forEach((row) => {
          const dateStr = row.dimensionValues?.[0]?.value || '';
          const views = parseInt(row.metricValues?.[0]?.value || '0', 10);
          
          if (dateStr) {
            const formattedDate = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
            if (!ga4Data.has(formattedDate)) {
              ga4Data.set(formattedDate, { websiteViews: 0, loginPageViews: 0 });
            }
            ga4Data.get(formattedDate)!.websiteViews = views;
          }
        });

        // Processar login page views
        loginResponse.rows?.forEach((row) => {
          const dateStr = row.dimensionValues?.[0]?.value || '';
          const views = parseInt(row.metricValues?.[0]?.value || '0', 10);
          
          if (dateStr) {
            const formattedDate = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
            if (!ga4Data.has(formattedDate)) {
              ga4Data.set(formattedDate, { websiteViews: 0, loginPageViews: 0 });
            }
            ga4Data.get(formattedDate)!.loginPageViews = views;
          }
        });
      }
    } catch (error) {
      console.error('[Analytics Daily] Erro ao buscar GA4:', error);
    }

    // 2. BUSCAR CADASTROS DO FIREBASE (users collection)
    const signupsMap: Map<string, number> = new Map();
    const professionalsMap: Map<string, number> = new Map();
    const clientsMap: Map<string, number> = new Map();

    try {
      const usersSnap = await db
        .collection('users')
        .where('createdAt', '>=', startDate)
        .where('createdAt', '<=', endDate)
        .get();

      usersSnap.forEach((doc) => {
        const data = doc.data();
        if (data.createdAt) {
          let createdDate: Date | null = null;

          // Converter timestamp para Date
          if (data.createdAt.toDate) {
            createdDate = data.createdAt.toDate();
          } else if (typeof data.createdAt === 'number') {
            createdDate = new Date(data.createdAt);
          } else if (typeof data.createdAt === 'string') {
            createdDate = new Date(data.createdAt);
          }

          if (createdDate && !isNaN(createdDate.getTime())) {
            const dateStr = createdDate.toISOString().split('T')[0];
            
            // Total geral
            signupsMap.set(dateStr, (signupsMap.get(dateStr) || 0) + 1);
            
            // Separar por tipo (userType: 'professional' ou 'client'/'family')
            const userType = data.userType || data.type || 'client';
            if (userType === 'professional' || userType === 'cuidador') {
              professionalsMap.set(dateStr, (professionalsMap.get(dateStr) || 0) + 1);
            } else {
              clientsMap.set(dateStr, (clientsMap.get(dateStr) || 0) + 1);
            }
          }
        }
      });
    } catch (error) {
      console.error('[Analytics Daily] Erro ao buscar cadastros:', error);
    }

    // 3. COMBINAR DADOS
    const dailyData: DailyData[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const ga4Info = ga4Data.get(dateStr) || { websiteViews: 0, loginPageViews: 0 };
      const signups = signupsMap.get(dateStr) || 0;
      const professionals = professionalsMap.get(dateStr) || 0;
      const clients = clientsMap.get(dateStr) || 0;

      dailyData.push({
        date: dateStr,
        websiteViews: ga4Info.websiteViews,
        loginPageViews: ga4Info.loginPageViews,
        signups,
        professionals,
        clients,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return NextResponse.json({
      success: true,
      data: dailyData,
      summary: {
        totalWebsiteViews: dailyData.reduce((sum, d) => sum + d.websiteViews, 0),
        totalLoginPageViews: dailyData.reduce((sum, d) => sum + d.loginPageViews, 0),
        totalSignups: dailyData.reduce((sum, d) => sum + d.signups, 0),
        totalProfessionals: dailyData.reduce((sum, d) => sum + d.professionals, 0),
        totalClients: dailyData.reduce((sum, d) => sum + d.clients, 0),
        days: dailyData.length,
      },
    });

  } catch (error: any) {
    console.error('[Analytics Daily] Erro:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar dados analíticos',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
