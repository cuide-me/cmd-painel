/**
 * ────────────────────────────────────
 * SCRIPT: Auditoria de Coleções Firebase
 * ────────────────────────────────────
 * Conta documentos e mapeia campos de cada coleção
 * 
 * Uso:
 * tsx scripts/audit-firebase-collections.ts
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Inicializar Firebase Admin
if (getApps().length === 0) {
  const serviceAccountBase64 = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT;
  
  if (!serviceAccountBase64) {
    console.error('❌ FIREBASE_ADMIN_SERVICE_ACCOUNT não configurado');
    process.exit(1);
  }

  try {
    const serviceAccount = JSON.parse(
      Buffer.from(serviceAccountBase64, 'base64').toString('utf-8')
    );

    initializeApp({
      credential: cert(serviceAccount),
    });

    console.log('✅ Firebase Admin inicializado\n');
  } catch (error: any) {
    console.error('❌ Erro ao inicializar Firebase Admin:', error.message);
    process.exit(1);
  }
}

const db = getFirestore();

interface CollectionStats {
  name: string;
  count: number;
  fields: Map<string, { count: number; types: Set<string>; samples: any[] }>;
  breakdown?: { [key: string]: number };
}

/**
 * Audita uma coleção
 */
async function auditCollection(collectionName: string): Promise<CollectionStats> {
  console.log(`📊 Auditando coleção: ${collectionName}`);
  
  const snapshot = await db.collection(collectionName).get();
  const stats: CollectionStats = {
    name: collectionName,
    count: snapshot.size,
    fields: new Map(),
  };

  // Mapear campos
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    
    Object.keys(data).forEach(fieldName => {
      const value = data[fieldName];
      const type = typeof value;
      
      if (!stats.fields.has(fieldName)) {
        stats.fields.set(fieldName, {
          count: 0,
          types: new Set(),
          samples: [],
        });
      }

      const fieldStats = stats.fields.get(fieldName)!;
      fieldStats.count++;
      fieldStats.types.add(type);
      
      // Adicionar sample (primeiros 3)
      if (fieldStats.samples.length < 3) {
        if (type === 'object' && value?.toDate) {
          fieldStats.samples.push(`Timestamp(${value.toDate().toISOString()})`);
        } else if (type === 'object') {
          fieldStats.samples.push(JSON.stringify(value));
        } else {
          fieldStats.samples.push(value);
        }
      }
    });
  });

  return stats;
}

/**
 * Auditoria de users com breakdown por perfil
 */
async function auditUsers(): Promise<CollectionStats> {
  const stats = await auditCollection('users');
  
  const snapshot = await db.collection('users').get();
  const breakdown: { [key: string]: number } = {};

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const perfil = data.perfil || 'unknown';
    breakdown[perfil] = (breakdown[perfil] || 0) + 1;
  });

  stats.breakdown = breakdown;
  return stats;
}

/**
 * Auditoria de jobs com breakdown por status
 */
async function auditJobs(): Promise<CollectionStats> {
  const stats = await auditCollection('jobs');
  
  const snapshot = await db.collection('jobs').get();
  const breakdown: { [key: string]: number } = {};

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const status = data.status || 'unknown';
    breakdown[status] = (breakdown[status] || 0) + 1;
  });

  stats.breakdown = breakdown;
  return stats;
}

/**
 * Auditoria de tickets com breakdown por status
 */
async function auditTickets(): Promise<CollectionStats> {
  const stats = await auditCollection('tickets');
  
  const snapshot = await db.collection('tickets').get();
  const breakdown: { [key: string]: number } = {};

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const status = data.status || 'unknown';
    breakdown[status] = (breakdown[status] || 0) + 1;
  });

  stats.breakdown = breakdown;
  return stats;
}

/**
 * Calcular rating médio em feedbacks
 */
async function getFeedbacksStats(): Promise<CollectionStats & { avgRating?: number }> {
  const stats = await auditCollection('feedbacks');
  
  const snapshot = await db.collection('feedbacks').get();
  let totalRating = 0;
  let ratingCount = 0;

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.rating && typeof data.rating === 'number') {
      totalRating += data.rating;
      ratingCount++;
    }
  });

  return {
    ...stats,
    avgRating: ratingCount > 0 ? totalRating / ratingCount : undefined,
  };
}

/**
 * Função principal
 */
async function main() {
  console.log('🔍 AUDITORIA DE COLEÇÕES FIREBASE\n');
  console.log('='.repeat(60));
  console.log('\n');

  try {
    // Auditar coleções principais
    const usersStats = await auditUsers();
    const jobsStats = await auditJobs();
    const feedbacksStats = await getFeedbacksStats();
    const ratingsStats = await auditCollection('ratings');
    const ticketsStats = await auditTickets();

    // Tentar coleções opcionais
    let proposalsStats: CollectionStats | null = null;
    let dealsStats: CollectionStats | null = null;
    
    try {
      proposalsStats = await auditCollection('proposals');
    } catch (error) {
      console.log('⚠️  Coleção "proposals" não existe ou está vazia\n');
    }

    try {
      dealsStats = await auditCollection('deals');
    } catch (error) {
      console.log('⚠️  Coleção "deals" não existe ou está vazia\n');
    }

    // Exibir resultados
    console.log('\n');
    console.log('📊 RESULTADO DA AUDITORIA');
    console.log('='.repeat(60));
    console.log('\n');

    // Users
    console.log(`📁 users: ${usersStats.count} docs`);
    if (usersStats.breakdown) {
      Object.entries(usersStats.breakdown).forEach(([perfil, count]) => {
        const percentage = ((count / usersStats.count) * 100).toFixed(1);
        console.log(`   ├── ${perfil}: ${count} (${percentage}%)`);
      });
    }
    console.log('\n');

    // Jobs
    console.log(`📁 jobs: ${jobsStats.count} docs`);
    if (jobsStats.breakdown) {
      Object.entries(jobsStats.breakdown).forEach(([status, count]) => {
        console.log(`   ├── ${status}: ${count}`);
      });
    }
    console.log('\n');

    // Feedbacks
    console.log(`📁 feedbacks: ${feedbacksStats.count} docs`);
    if (feedbacksStats.avgRating) {
      console.log(`   └── Rating médio: ${feedbacksStats.avgRating.toFixed(2)}/5.0`);
    }
    console.log('\n');

    // Ratings
    console.log(`📁 ratings: ${ratingsStats.count} docs\n`);

    // Tickets
    console.log(`📁 tickets: ${ticketsStats.count} docs`);
    if (ticketsStats.breakdown) {
      Object.entries(ticketsStats.breakdown).forEach(([status, count]) => {
        console.log(`   ├── ${status}: ${count}`);
      });
    }
    console.log('\n');

    // Proposals (opcional)
    if (proposalsStats) {
      console.log(`📁 proposals: ${proposalsStats.count} docs\n`);
    }

    // Deals (opcional)
    if (dealsStats) {
      console.log(`📁 deals: ${dealsStats.count} docs\n`);
    }

    // Campos mais comuns
    console.log('\n');
    console.log('🔍 CAMPOS MAIS COMUNS (users)');
    console.log('='.repeat(60));
    const sortedFields = Array.from(usersStats.fields.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10);

    sortedFields.forEach(([field, stats]) => {
      const percentage = ((stats.count / usersStats.count) * 100).toFixed(1);
      const types = Array.from(stats.types).join(', ');
      console.log(`   ${field}: ${stats.count} docs (${percentage}%) - Type: ${types}`);
      
      if (stats.samples.length > 0) {
        console.log(`      Samples: ${stats.samples.slice(0, 2).join(', ')}`);
      }
    });

    console.log('\n');
    console.log('✅ Auditoria concluída com sucesso!');

  } catch (error: any) {
    console.error('\n❌ Erro na auditoria:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Executar
main();
