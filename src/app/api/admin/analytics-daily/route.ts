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
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
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
    
    // Converter para Timestamp do Firebase
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    // 1. BUSCAR DADOS DO GA4 (Acessos ao site)
    let ga4Data: Map<string, { websiteViews: number; loginPageViews: number }> = new Map();
    let ga4Error: string | null = null;
    
    try {
      const propertyId = process.env.GA4_PROPERTY_ID;
      console.log('[Analytics Daily] GA4_PROPERTY_ID:', propertyId ? 'Configurado' : 'NÃO CONFIGURADO');
      
      if (propertyId) {
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

        // Query para todos os pageviews (sem filtro de hostname)
        const [websiteResponse] = await analyticsDataClient.runReport({
          property,
          dateRanges: [{
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
          }],
          dimensions: [{ name: 'date' }],
          metrics: [{ name: 'screenPageViews' }],
        });

        console.log('[Analytics Daily] GA4 Website Response rows:', websiteResponse.rows?.length || 0);

        // Query para página de login (apenas filtro de pagePath)
        const [loginResponse] = await analyticsDataClient.runReport({
          property,
          dateRanges: [{
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
          }],
          dimensions: [{ name: 'date' }],
          metrics: [{ name: 'screenPageViews' }],
          dimensionFilter: {
            filter: {
              fieldName: 'pagePath',
              stringFilter: {
                matchType: 'CONTAINS',
                value: '/login',
              },
            },
          },
        });

        console.log('[Analytics Daily] GA4 Login Response rows:', loginResponse.rows?.length || 0);


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
      } else {
        console.log('[Analytics Daily] GA4_PROPERTY_ID não configurado - pulando GA4');
        ga4Error = 'GA4_PROPERTY_ID não configurado';
      }
    } catch (error: any) {
      console.error('[Analytics Daily] Erro ao buscar GA4:', error.message);
      ga4Error = error.message;
    }

    console.log('[Analytics Daily] Total de dias com dados GA4:', ga4Data.size);

    // 2. BUSCAR CADASTROS DO FIREBASE (users collection)
    const signupsMap: Map<string, number> = new Map();
    const professionalsMap: Map<string, number> = new Map();
    const clientsMap: Map<string, number> = new Map();

    try {
      console.log('[Analytics Daily] Buscando usuários do Firebase...');
      
      // Buscar TODOS os usuários primeiro para ver quantos existem
      const allUsersSnap = await db.collection('users').limit(10).get();
      console.log('[Analytics Daily] Total de usuários (sample):', allUsersSnap.size);
      
      if (allUsersSnap.size > 0) {
        const firstUser = allUsersSnap.docs[0].data();
        console.log('[Analytics Daily] Exemplo de usuário:', {
          temCreatedAt: !!firstUser.createdAt,
          userType: firstUser.userType,
          type: firstUser.type,
          campos: Object.keys(firstUser)
        });
      }
      
      // Agora buscar com filtro de data usando Timestamp
      const usersSnap = await db
        .collection('users')
        .where('createdAt', '>=', startTimestamp)
        .where('createdAt', '<=', endTimestamp)
        .get();

      console.log('[Analytics Daily] Usuários no período:', usersSnap.size);

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
            
            // Separar por tipo - checar vários campos possíveis
            const userType = data.userType || data.type || data.role || '';
            const isProfessional = 
              userType === 'professional' || 
              userType === 'cuidador' ||
              userType === 'caregiver' ||
              data.isProfessional === true;
            
            if (isProfessional) {
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

    console.log('[Analytics Daily] Total de cadastros:', signupsMap.size, 'dias com dados');
    console.log('[Analytics Daily] Profissionais:', Array.from(professionalsMap.values()).reduce((a,b) => a+b, 0));
    console.log('[Analytics Daily] Clientes:', Array.from(clientsMap.values()).reduce((a,b) => a+b, 0));

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
      ga4Error, // Incluir erro do GA4 se houver
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
