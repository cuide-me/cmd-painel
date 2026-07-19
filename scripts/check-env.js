#!/usr/bin/env node

/**
 * Verifica se todas as variáveis de ambiente necessárias estão configuradas
 * Execute: node scripts/check-env.js
 */

require('dotenv').config({ path: '.env.local' });

const requiredEnvVars = {
  server: [
    {
      label: 'Firebase Admin SDK',
      groups: [
        ['FIREBASE_ADMIN_SERVICE_ACCOUNT'],
        ['FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL'],
      ],
    },
    { label: 'STRIPE_SECRET_KEY', keys: ['STRIPE_SECRET_KEY'] },
    {
      label: 'GA4 property ID',
      keys: ['GA4_PROPERTY_ID', 'GA_PROPERTY_ID', 'GOOGLE_ANALYTICS_PROPERTY_ID'],
    },
    {
      label: 'GA4 credentials JSON',
      keys: ['GOOGLE_APPLICATION_CREDENTIALS_JSON', 'GOOGLE_ANALYTICS_CREDENTIALS'],
    },
    { label: 'ADMIN_PASSWORD', keys: ['ADMIN_PASSWORD'] },
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

function resolveEnv(keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (value) {
      return { key, value };
    }
  }

  return null;
}

function resolveEnvGroup(groups) {
  for (const group of groups) {
    const resolvedEntries = group.map((key) => ({ key, value: process.env[key] })).filter((item) => item.value);
    if (resolvedEntries.length === group.length) {
      return resolvedEntries;
    }
  }

  return null;
}

// Check server-side env vars
console.log('📡 Variáveis Server-side:');
requiredEnvVars.server.forEach((entry) => {
  if (entry.groups) {
    const resolvedGroup = resolveEnvGroup(entry.groups);
    if (!resolvedGroup) {
      const options = entry.groups.map((group) => group.join(' + ')).join(' | ');
      console.log(`  ❌ ${entry.label} - FALTANDO (${options})`);
      hasErrors = true;
      return;
    }

    console.log(`  ✅ ${entry.label} - OK via ${resolvedGroup.map((item) => item.key).join(' + ')}`);
    return;
  }

  const resolved = resolveEnv(entry.keys);
  if (!resolved) {
    console.log(`  ❌ ${entry.label} - FALTANDO (${entry.keys.join(' | ')})`);
    hasErrors = true;
  } else {
    console.log(`  ✅ ${entry.label} - OK via ${resolved.key}`);
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
