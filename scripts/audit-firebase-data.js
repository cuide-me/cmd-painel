/**
 * Script de Auditoria de Dados Firebase
 * Verifica estrutura real das collections e campos
 */

const admin = require('firebase-admin');

// Inicializar Firebase Admin
const serviceAccount = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT;
if (!serviceAccount) {
  console.error('❌ FIREBASE_ADMIN_SERVICE_ACCOUNT não configurado');
  process.exit(1);
}

const credentials = JSON.parse(Buffer.from(serviceAccount, 'base64').toString('utf8'));

admin.initializeApp({
  credential: admin.credential.cert(credentials),
});

const db = admin.firestore();

async function auditCollection(collectionName, sampleSize = 5) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 AUDITORIA: ${collectionName}`);
  console.log('='.repeat(60));

  try {
    const snapshot = await db.collection(collectionName).limit(sampleSize).get();
    
    console.log(`\n📈 Total de documentos (amostra): ${snapshot.size}`);
    
    if (snapshot.empty) {
      console.log('⚠️  Collection vazia ou não existe');
      return;
    }

    // Analisar campos presentes
    const fieldSet = new Set();
    const fieldTypes = {};
    const fieldExamples = {};

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      Object.keys(data).forEach(field => {
        fieldSet.add(field);
        
        if (!fieldTypes[field]) {
          fieldTypes[field] = new Set();
          fieldExamples[field] = [];
        }
        
        const value = data[field];
        const type = Array.isArray(value) ? 'array' : typeof value;
        fieldTypes[field].add(type);
        
        // Guardar exemplo (primeiros 3 valores únicos)
        if (fieldExamples[field].length < 3) {
          const example = value?.toDate ? value.toDate().toISOString() : 
                         typeof value === 'object' ? JSON.stringify(value).substring(0, 50) : 
                         value;
          if (!fieldExamples[field].includes(example)) {
            fieldExamples[field].push(example);
          }
        }
      });
    });

    console.log('\n📋 Campos encontrados:\n');
    const sortedFields = Array.from(fieldSet).sort();
    
    sortedFields.forEach(field => {
      const types = Array.from(fieldTypes[field]).join(' | ');
      const examples = fieldExamples[field].slice(0, 2).join(', ');
      console.log(`  • ${field}`);
      console.log(`    Tipo: ${types}`);
      if (examples) {
        console.log(`    Exemplo: ${examples}`);
      }
    });

    // Mostrar um documento completo como exemplo
    console.log('\n📄 Exemplo de documento completo:\n');
    const firstDoc = snapshot.docs[0];
    console.log(JSON.stringify(firstDoc.data(), null, 2).substring(0, 500) + '...');

  } catch (error) {
    console.error(`❌ Erro ao auditar ${collectionName}:`, error.message);
  }
}

async function auditUsers() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('👥 AUDITORIA DETALHADA: users');
  console.log('='.repeat(60));

  try {
    // Verificar perfis existentes
    const usersSnap = await db.collection('users').limit(100).get();
    console.log(`\n📊 Total de usuários (amostra): ${usersSnap.size}`);

    const perfis = {};
    const userTypes = {};
    
    usersSnap.docs.forEach(doc => {
      const data = doc.data();
      
      if (data.perfil) {
        perfis[data.perfil] = (perfis[data.perfil] || 0) + 1;
      }
      
      if (data.userType) {
        userTypes[data.userType] = (userTypes[data.userType] || 0) + 1;
      }
    });

    console.log('\n📊 Distribuição por campo "perfil":');
    Object.entries(perfis).forEach(([perfil, count]) => {
      console.log(`  • ${perfil}: ${count} usuários`);
    });

    console.log('\n📊 Distribuição por campo "userType":');
    if (Object.keys(userTypes).length === 0) {
      console.log('  ⚠️  Campo "userType" NÃO EXISTE nos documentos');
    } else {
      Object.entries(userTypes).forEach(([type, count]) => {
        console.log(`  • ${type}: ${count} usuários`);
      });
    }

    // Profissionais
    const profSnap = await db.collection('users').where('perfil', '==', 'profissional').limit(5).get();
    console.log(`\n👨‍⚕️ Profissionais encontrados: ${profSnap.size}`);
    if (profSnap.size > 0) {
      const prof = profSnap.docs[0].data();
      console.log('   Campos do profissional:', Object.keys(prof).join(', '));
    }

    // Famílias
    const famSnap = await db.collection('users').where('perfil', '==', 'cliente').limit(5).get();
    console.log(`\n👨‍👩‍👧 Famílias encontradas: ${famSnap.size}`);
    if (famSnap.size > 0) {
      const fam = famSnap.docs[0].data();
      console.log('   Campos da família:', Object.keys(fam).join(', '));
    }

  } catch (error) {
    console.error('❌ Erro ao auditar users:', error.message);
  }
}

async function main() {
  console.log('\n🔍 INICIANDO AUDITORIA DO FIREBASE\n');
  console.log('Data:', new Date().toISOString());
  console.log('='.repeat(60));

  // Auditar principais collections
  await auditUsers();
  await auditCollection('requests', 10);
  await auditCollection('appointments', 5);
  await auditCollection('matches', 5);
  await auditCollection('jobs', 5);
  await auditCollection('feedbacks', 5);
  await auditCollection('ratings', 5);

  console.log('\n\n✅ AUDITORIA CONCLUÍDA\n');
  process.exit(0);
}

main();
