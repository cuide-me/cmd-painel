/**
 * ────────────────────────────────────
 * SCRIPT: Investigar Coleções Vazias
 * ────────────────────────────────────
 * Investiga por que ratings, proposals e deals estão vazias
 * 
 * Uso:
 * tsx scripts/investigate-empty-collections.ts
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

async function main() {
  console.log('🔍 INVESTIGAÇÃO: COLEÇÕES VAZIAS\n');
  console.log('='.repeat(60));
  console.log('\n');

  try {
    // 1. Verificar se ratings está realmente vazia ou tem outro nome
    console.log('📊 INVESTIGANDO: ratings\n');
    
    const possibleRatingCollections = [
      'ratings',
      'rating',
      'avaliacoes',
      'avaliacao',
      'reviews',
      'review',
      'feedbacks', // já sabemos que tem 12 docs
    ];

    console.log('Buscando em coleções possíveis:');
    for (const name of possibleRatingCollections) {
      try {
        const snapshot = await db.collection(name).limit(5).get();
        if (snapshot.size > 0) {
          console.log(`  ✅ ${name}: ${snapshot.size} docs (primeiros 5)`);
          
          // Mostrar estrutura
          const sample = snapshot.docs[0].data();
          console.log(`     Campos: ${Object.keys(sample).join(', ')}`);
          
          // Verificar se tem campo 'rating'
          if (sample.rating !== undefined) {
            console.log(`     ⭐ Tem campo 'rating': ${sample.rating}`);
          }
        } else {
          console.log(`  ⚪ ${name}: vazia`);
        }
      } catch (error) {
        console.log(`  ❌ ${name}: não existe`);
      }
    }

    // 2. Verificar proposals
    console.log('\n\n📊 INVESTIGANDO: proposals\n');
    
    const possibleProposalCollections = [
      'proposals',
      'proposal',
      'propostas',
      'proposta',
      'offers',
      'offer',
      'bids',
      'bid',
    ];

    console.log('Buscando em coleções possíveis:');
    for (const name of possibleProposalCollections) {
      try {
        const snapshot = await db.collection(name).limit(5).get();
        if (snapshot.size > 0) {
          console.log(`  ✅ ${name}: ${snapshot.size} docs`);
          
          const sample = snapshot.docs[0].data();
          console.log(`     Campos: ${Object.keys(sample).join(', ')}`);
        } else {
          console.log(`  ⚪ ${name}: vazia`);
        }
      } catch (error) {
        console.log(`  ❌ ${name}: não existe`);
      }
    }

    // 3. Verificar se proposals está embeded dentro de jobs
    console.log('\n\n📊 VERIFICANDO: proposals dentro de jobs\n');
    
    const jobsSnapshot = await db.collection('jobs').get();
    console.log(`Total de jobs: ${jobsSnapshot.size}`);
    
    if (jobsSnapshot.size > 0) {
      jobsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.proposal) {
          console.log(`\n  Job ${doc.id} tem proposal embeded:`);
          console.log(`    Provider: ${data.proposal.providerId}`);
          console.log(`    Value: R$ ${data.proposal.valueTotal}`);
          console.log(`    Status: ${data.status}`);
        }
        
        if (data.proposals) {
          console.log(`\n  Job ${doc.id} tem array de proposals:`);
          console.log(`    Total: ${data.proposals.length}`);
        }
      });
    }

    // 4. Verificar se ratings está dentro de outras coleções
    console.log('\n\n📊 VERIFICANDO: ratings dentro de outras coleções\n');
    
    // Verificar users
    const usersSnapshot = await db.collection('users').limit(5).get();
    let foundRatingsInUsers = false;
    
    usersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.ratings || data.rating || data.reviews) {
        foundRatingsInUsers = true;
        console.log(`  User ${doc.id} tem ratings:`, data.ratings || data.rating);
      }
    });
    
    if (!foundRatingsInUsers) {
      console.log('  ⚪ Users não têm campo de ratings embeded');
    }

    // Verificar jobs
    const jobsWithRatings = jobsSnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.ratings || data.rating || data.review;
    });
    
    if (jobsWithRatings.length > 0) {
      console.log(`\n  ✅ ${jobsWithRatings.length} jobs têm ratings embeded`);
      jobsWithRatings.forEach(doc => {
        const data = doc.data();
        console.log(`    Job ${doc.id}: ${data.ratings || data.rating}`);
      });
    } else {
      console.log('\n  ⚪ Jobs não têm campo de ratings embeded');
    }

    // 5. Verificar subcollections
    console.log('\n\n📊 VERIFICANDO: subcollections\n');
    
    // Verificar se jobs têm subcoleção de proposals
    if (jobsSnapshot.size > 0) {
      const firstJob = jobsSnapshot.docs[0];
      const proposalsSubcollection = await firstJob.ref.collection('proposals').limit(5).get();
      
      if (proposalsSubcollection.size > 0) {
        console.log(`  ✅ Jobs têm subcoleção 'proposals': ${proposalsSubcollection.size} docs`);
        const sample = proposalsSubcollection.docs[0].data();
        console.log(`     Campos: ${Object.keys(sample).join(', ')}`);
      } else {
        console.log('  ⚪ Jobs não têm subcoleção de proposals');
      }
      
      // Verificar se jobs têm subcoleção de ratings
      const ratingsSubcollection = await firstJob.ref.collection('ratings').limit(5).get();
      
      if (ratingsSubcollection.size > 0) {
        console.log(`  ✅ Jobs têm subcoleção 'ratings': ${ratingsSubcollection.size} docs`);
        const sample = ratingsSubcollection.docs[0].data();
        console.log(`     Campos: ${Object.keys(sample).join(', ')}`);
      } else {
        console.log('  ⚪ Jobs não têm subcoleção de ratings');
      }
    }

    // Verificar se users têm subcoleção de ratings
    if (usersSnapshot.size > 0) {
      const firstUser = usersSnapshot.docs[0];
      const ratingsSubcollection = await firstUser.ref.collection('ratings').limit(5).get();
      
      if (ratingsSubcollection.size > 0) {
        console.log(`  ✅ Users têm subcoleção 'ratings': ${ratingsSubcollection.size} docs`);
        const sample = ratingsSubcollection.docs[0].data();
        console.log(`     Campos: ${Object.keys(sample).join(', ')}`);
      } else {
        console.log('  ⚪ Users não têm subcoleção de ratings');
      }
    }

    // 6. Verificar deals
    console.log('\n\n📊 INVESTIGANDO: deals\n');
    
    const possibleDealCollections = [
      'deals',
      'deal',
      'negocios',
      'negocio',
      'vendas',
      'venda',
    ];

    console.log('Buscando em coleções possíveis:');
    for (const name of possibleDealCollections) {
      try {
        const snapshot = await db.collection(name).limit(5).get();
        if (snapshot.size > 0) {
          console.log(`  ✅ ${name}: ${snapshot.size} docs`);
          
          const sample = snapshot.docs[0].data();
          console.log(`     Campos: ${Object.keys(sample).join(', ')}`);
        } else {
          console.log(`  ⚪ ${name}: vazia`);
        }
      } catch (error) {
        console.log(`  ❌ ${name}: não existe`);
      }
    }

    console.log('\n\n✅ Investigação concluída!');
    console.log('\n📝 CONCLUSÕES:');
    console.log('   - Verificar se feedbacks (12 docs) serve como ratings');
    console.log('   - Verificar se proposals estão embeded em jobs');
    console.log('   - Verificar se ratings estão em subcollections');

  } catch (error: any) {
    console.error('\n❌ Erro na investigação:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Executar
main();
