/**
 * ────────────────────────────────────
 * SCRIPT: Investigar Jobs em Todas as Coleções
 * ────────────────────────────────────
 * Busca por jobs/solicitações em todas as coleções possíveis
 * 
 * Uso:
 * tsx scripts/investigate-jobs.ts
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

/**
 * Busca em uma coleção específica
 */
async function searchCollection(collectionName: string) {
  try {
    const snapshot = await db.collection(collectionName).limit(100).get();
    return {
      name: collectionName,
      count: snapshot.size,
      exists: true,
      samples: snapshot.docs.slice(0, 3).map(doc => ({
        id: doc.id,
        data: doc.data()
      }))
    };
  } catch (error: any) {
    return {
      name: collectionName,
      count: 0,
      exists: false,
      error: error.message
    };
  }
}

/**
 * Lista todas as coleções do Firebase
 */
async function listAllCollections() {
  console.log('📋 Listando todas as coleções do Firebase...\n');
  
  const collections = await db.listCollections();
  
  console.log(`Encontradas ${collections.length} coleções:\n`);
  
  for (const collection of collections) {
    const snapshot = await db.collection(collection.id).limit(1).get();
    console.log(`  - ${collection.id} (${snapshot.size > 0 ? '✅ com dados' : '⚠️ vazia'})`);
  }
  
  return collections.map(c => c.id);
}

/**
 * Função principal
 */
async function main() {
  console.log('🔍 INVESTIGAÇÃO: JOBS E SOLICITAÇÕES\n');
  console.log('='.repeat(60));
  console.log('\n');

  try {
    // 1. Listar todas as coleções
    const allCollections = await listAllCollections();
    console.log('\n');

    // 2. Buscar em coleções conhecidas
    console.log('🔎 Buscando por jobs/solicitações em coleções conhecidas:\n');
    
    const collectionsToSearch = [
      'jobs',
      'job',
      'solicitacoes',
      'solicitacao',
      'requests',
      'request',
      'servicos',
      'servico',
      'atendimentos',
      'atendimento',
      'matches',
      'match',
      'agendamentos',
      'agendamento'
    ];

    const results = await Promise.all(
      collectionsToSearch.map(name => searchCollection(name))
    );

    results.forEach(result => {
      if (result.exists) {
        console.log(`\n📁 ${result.name}: ${result.count} documentos`);
        
        if (result.count > 0 && result.samples && result.samples.length > 0) {
          console.log('   Exemplo de documento:');
          const sample = result.samples[0];
          console.log(`   ID: ${sample.id}`);
          console.log('   Campos:', Object.keys(sample.data).join(', '));
          
          // Mostrar alguns campos importantes
          const importantFields = ['status', 'clientId', 'specialistId', 'createdAt', 'updatedAt', 'type'];
          importantFields.forEach(field => {
            if (sample.data[field]) {
              let value = sample.data[field];
              if (value?.toDate) {
                value = value.toDate().toISOString();
              }
              console.log(`   ${field}: ${JSON.stringify(value)}`);
            }
          });
        }
      } else {
        console.log(`   ⚠️ ${result.name}: Não existe ou vazia`);
      }
    });

    // 3. Buscar coleções que contenham "job" no nome
    console.log('\n\n🔍 Buscando coleções com "job" ou "request" no nome:\n');
    
    const jobRelatedCollections = allCollections.filter(name => 
      name.toLowerCase().includes('job') || 
      name.toLowerCase().includes('request') ||
      name.toLowerCase().includes('solicit')
    );

    if (jobRelatedCollections.length > 0) {
      console.log('Encontradas:');
      for (const collectionName of jobRelatedCollections) {
        const snapshot = await db.collection(collectionName).limit(100).get();
        console.log(`  - ${collectionName}: ${snapshot.size} docs`);
        
        if (snapshot.size > 0) {
          const sample = snapshot.docs[0].data();
          console.log(`    Campos: ${Object.keys(sample).join(', ')}`);
        }
      }
    } else {
      console.log('Nenhuma coleção relacionada a jobs encontrada.');
    }

    // 4. Verificar jobs por status
    console.log('\n\n📊 Analisando coleção "jobs" em detalhes:\n');
    
    const jobsSnapshot = await db.collection('jobs').get();
    console.log(`Total de documentos: ${jobsSnapshot.size}`);
    
    if (jobsSnapshot.size > 0) {
      const statusCount: { [key: string]: number } = {};
      const typeCount: { [key: string]: number } = {};
      
      jobsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const status = data.status || 'unknown';
        const type = data.type || 'unknown';
        
        statusCount[status] = (statusCount[status] || 0) + 1;
        typeCount[type] = (typeCount[type] || 0) + 1;
      });

      console.log('\nBreakdown por status:');
      Object.entries(statusCount).forEach(([status, count]) => {
        console.log(`  - ${status}: ${count}`);
      });

      console.log('\nBreakdown por tipo:');
      Object.entries(typeCount).forEach(([type, count]) => {
        console.log(`  - ${type}: ${count}`);
      });

      // Mostrar alguns exemplos completos
      console.log('\n📄 Exemplos de documentos (primeiros 3):');
      jobsSnapshot.docs.slice(0, 3).forEach((doc, index) => {
        console.log(`\nDocumento ${index + 1}:`);
        console.log(`ID: ${doc.id}`);
        const data = doc.data();
        Object.entries(data).forEach(([key, value]) => {
          if (value?.toDate) {
            console.log(`  ${key}: ${value.toDate().toISOString()}`);
          } else if (typeof value === 'object') {
            console.log(`  ${key}: ${JSON.stringify(value)}`);
          } else {
            console.log(`  ${key}: ${value}`);
          }
        });
      });
    }

    console.log('\n\n✅ Investigação concluída!');

  } catch (error: any) {
    console.error('\n❌ Erro na investigação:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Executar
main();
