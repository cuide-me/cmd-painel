/**
 * Script de teste das integrações
 * Verifica Firebase, Stripe e GA4
 */

// Carregar variáveis de ambiente
import { config } from 'dotenv';
import { resolve } from 'path';

// Carregar .env.local primeiro, depois .env
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

import { getFirebaseAdmin } from '../src/lib/server/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';
import { getStripeClient } from '../src/lib/server/stripe';
import { getGa4AdminConfig } from '../src/lib/server/ga4Admin';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

async function testFirebase() {
  console.log('\n🔥 TESTANDO FIREBASE...\n');
  
  try {
    const app = getFirebaseAdmin();
    console.log('✅ Firebase Admin inicializado');
    
    const db = getFirestore(app);
    console.log('✅ Firestore conectado');
    
    // Testar query simples
    const usersRef = db.collection('users');
    const snapshot = await usersRef.limit(5).get();
    console.log(`✅ Query executada: ${snapshot.size} documentos encontrados`);
    
    // Contar por role
    const familiesSnapshot = await usersRef.where('role', '==', 'family').count().get();
    const prosSnapshot = await usersRef.where('role', '==', 'professional').count().get();
    
    console.log(`✅ Famílias: ${familiesSnapshot.data().count}`);
    console.log(`✅ Profissionais: ${prosSnapshot.data().count}`);
    
    return true;
  } catch (error) {
    console.error('❌ ERRO Firebase:', error);
    return false;
  }
}

async function testStripe() {
  console.log('\n💳 TESTANDO STRIPE...\n');
  
  try {
    const stripe = getStripeClient();
    console.log('✅ Stripe client inicializado');
    
    // Testar API
    const balance = await stripe.balance.retrieve();
    console.log('✅ Balance recuperado');
    console.log(`   Available: ${balance.available.map(b => `${b.amount} ${b.currency}`).join(', ')}`);
    
    // Contar subscriptions ativas
    const subscriptions = await stripe.subscriptions.list({ 
      status: 'active',
      limit: 1
    });
    console.log(`✅ Subscriptions ativas: ${subscriptions.data.length > 0 ? 'Sim' : 'Nenhuma'}`);
    
    // Listar últimas charges
    const charges = await stripe.charges.list({ limit: 5 });
    console.log(`✅ Últimas charges: ${charges.data.length} encontradas`);
    
    return true;
  } catch (error: any) {
    console.error('❌ ERRO Stripe:', error.message);
    return false;
  }
}

async function testGA4() {
  console.log('\n📊 TESTANDO GOOGLE ANALYTICS 4...\n');
  
  try {
    const { propertyId, credentials, error } = getGa4AdminConfig();

    if (!propertyId || !credentials) {
      throw new Error(error || 'GA4 não configurado');
    }

    console.log(`✅ Property ID: ${propertyId}`);

    console.log(`✅ Credentials parseadas: ${credentials.client_email}`);
    
    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials,
    });
    console.log('✅ Analytics client inicializado');
    
    // Testar query simples
    const [response] = await analyticsDataClient.runReport({
      property: propertyId,
      dateRanges: [
        {
          startDate: '7daysAgo',
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
          name: 'activeUsers',
        },
      ],
    });
    
    console.log(`✅ Relatório executado: ${response.rows?.length || 0} linhas retornadas`);
    
    if (response.rows && response.rows.length > 0) {
      const totalUsers = response.rows.reduce((sum, row) => {
        return sum + parseInt(row.metricValues?.[0]?.value || '0');
      }, 0);
      console.log(`✅ Total usuários ativos (7d): ${totalUsers}`);
    }
    
    return true;
  } catch (error: any) {
    console.error('❌ ERRO GA4:', error.message);
    if (error.details) {
      console.error('   Detalhes:', error.details);
    }
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('🔍 TESTE DE INTEGRAÇÕES');
  console.log('═══════════════════════════════════════');
  
  const results = {
    firebase: await testFirebase(),
    stripe: await testStripe(),
    ga4: await testGA4(),
  };
  
  console.log('\n═══════════════════════════════════════');
  console.log('📊 RESULTADO FINAL:');
  console.log('═══════════════════════════════════════');
  console.log(`🔥 Firebase: ${results.firebase ? '✅ OK' : '❌ FALHOU'}`);
  console.log(`💳 Stripe: ${results.stripe ? '✅ OK' : '❌ FALHOU'}`);
  console.log(`📊 GA4: ${results.ga4 ? '✅ OK' : '❌ FALHOU'}`);
  console.log('═══════════════════════════════════════\n');
  
  const allOk = Object.values(results).every(r => r);
  
  if (allOk) {
    console.log('🎉 TODAS AS INTEGRAÇÕES FUNCIONANDO!\n');
    process.exit(0);
  } else {
    console.log('⚠️ ALGUMAS INTEGRAÇÕES COM PROBLEMAS\n');
    process.exit(1);
  }
}

main();
