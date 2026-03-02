#!/usr/bin/env node

/**
 * Verifica se todas as variáveis de ambiente necessárias estão configuradas
 * Execute: node scripts/check-env.js
 */

const requiredEnvVars = {
  server: [
    'FIREBASE_ADMIN_SERVICE_ACCOUNT',
    'STRIPE_SECRET_KEY',
    'GA4_PROPERTY_ID',
    'GOOGLE_APPLICATION_CREDENTIALS_JSON',
  ],
  client: [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ],
};

console.log('🔍 Verificando variáveis de ambiente...\n');

let hasErrors = false;

// Check server-side env vars
console.log('📡 Variáveis Server-side:');
requiredEnvVars.server.forEach((varName) => {
  const value = process.env[varName];
  if (!value) {
    console.log(`  ❌ ${varName} - FALTANDO`);
    hasErrors = true;
  } else {
    const preview = value.length > 30 ? value.substring(0, 30) + '...' : value;
    console.log(`  ✅ ${varName} - OK (${preview})`);
  }
});

console.log('\n🌐 Variáveis Client-side:');
requiredEnvVars.client.forEach((varName) => {
  const value = process.env[varName];
  if (!value) {
    console.log(`  ❌ ${varName} - FALTANDO`);
    hasErrors = true;
  } else {
    console.log(`  ✅ ${varName} - OK`);
  }
});

console.log('\n' + '='.repeat(60));

if (hasErrors) {
  console.log('❌ ERRO: Algumas variáveis obrigatórias estão faltando!');
  console.log('\n📖 Consulte:');
  console.log('  - .env.example');
  console.log('  - INTEGRATIONS_SETUP.md');
  console.log('  - VERCEL_ENV.md');
  process.exit(1);
} else {
  console.log('✅ SUCESSO: Todas as variáveis obrigatórias estão configuradas!');
  console.log('\n🚀 Você pode iniciar o projeto com: npm run dev');
  process.exit(0);
}
