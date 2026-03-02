# 📂 AUDITORIA POR ARQUIVO - Detalhamento Completo

Este documento complementa `AUDITORIA_CTO_COMPLETA.md` com análise arquivo a arquivo.

---

## 🔐 ARQUIVOS DE AUTENTICAÇÃO

### 1. src/lib/server/auth.ts

**Responsabilidade:** Middleware de autenticação server-side para APIs.

#### O que o arquivo faz
- `verifyAdminAuth()`: Verifica autenticação via senha simples OU Firebase token
- `requireUser()`: Valida token Firebase
- `requireAdmin()`: Valida token + verifica role admin
- `optionalUser()`: Auth opcional

#### Problemas e Riscos

1. **Senha hardcoded como fallback** - 🔴 CRÍTICO
```typescript
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'cuideme@admin321';
// Se env var não existir, usa senha padrão
```
   - Tipo: segurança
   - Risco: Atacante sabe a senha padrão lendo o código

2. **Ausência de brute-force protection** - 🟡 ALTO
   - Tipo: segurança
   - Não há limite de tentativas de login

3. **Logs excessivos em produção** - 🟢 MÉDIO
```typescript
console.warn(`[AUTH] ❌ User ${uid} attempted to access admin route without privileges`);
```
   - Expõe UIDs em logs

#### Melhorias Propostas

```typescript
// ANTES
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'cuideme@admin321';

// DEPOIS
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  throw new Error('ADMIN_PASSWORD environment variable is required');
}

// Adicionar rate limiting
const rateLimiter = new Map<string, { attempts: number; blockedUntil: number }>();

export async function verifyAdminAuth(request: NextRequest): Promise<AdminAuthResult | null> {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  
  // Check rate limit
  const limit = rateLimiter.get(ip);
  if (limit && limit.blockedUntil > Date.now()) {
    return null; // Blocked
  }
  
  const simpleAuth = request.headers.get('x-admin-password');
  
  if (simpleAuth !== ADMIN_PASSWORD) {
    // Increment failed attempts
    const current = rateLimiter.get(ip) || { attempts: 0, blockedUntil: 0 };
    current.attempts++;
    if (current.attempts >= 5) {
      current.blockedUntil = Date.now() + 15 * 60 * 1000; // 15min block
    }
    rateLimiter.set(ip, current);
    return null;
  }
  
  // Reset on success
  rateLimiter.delete(ip);
  return { authorized: true, uid: 'admin' };
}
```

#### Testes Recomendados
- [ ] Unit: `verifyAdminAuth` retorna null sem header
- [ ] Unit: `verifyAdminAuth` retorna authorized=true com senha correta
- [ ] Unit: `requireAdmin` rejeita user sem role admin
- [ ] Integration: API retorna 401 sem auth
- [ ] Integration: Rate limiting bloqueia após 5 falhas

#### Definition of Done
- [ ] Senha padrão removida
- [ ] Rate limiting implementado
- [ ] Testes passando
- [ ] Logs não expõem dados sensíveis em prod

---

### 2. src/app/admin/login/page.tsx

**Responsabilidade:** Página de login do admin.

#### O que o arquivo faz
- Formulário de login com senha
- Salva estado de auth no localStorage
- Redireciona para /admin após login

#### Problemas e Riscos

1. **Senha exibida na UI** - 🔴 CRÍTICO
```tsx
<p className="text-xs text-gray-500 mt-2">Senha: cuideme@admin321</p>
```
   - Tipo: segurança
   - Qualquer visitante vê a senha

2. **Senha hardcoded no componente** - 🔴 CRÍTICO
```typescript
const ADMIN_PASSWORD = 'cuideme@admin321';
```

3. **Autenticação via localStorage** - 🟡 ALTO
```typescript
localStorage.setItem('admin_logged', 'true');
```
   - Tipo: segurança
   - XSS pode acessar/modificar
   - Sem expiração

#### Melhorias Propostas

```tsx
// 1. Remover exibição da senha
// DELETE: <p className="text-xs text-gray-500 mt-2">Senha: cuideme@admin321</p>

// 2. Validar no backend e receber token
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    // Validar no backend
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Senha incorreta');
    }

    // Token armazenado em httpOnly cookie pelo backend
    router.push('/admin');
  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

#### Testes Recomendados
- [ ] E2E: Login com senha correta redireciona para /admin
- [ ] E2E: Login com senha incorreta mostra erro
- [ ] E2E: Página de login não exibe a senha
- [ ] Unit: Formulário não submete se senha vazia

#### Definition of Done
- [ ] Senha removida da UI
- [ ] Validação movida para backend
- [ ] Token em httpOnly cookie
- [ ] Testes E2E passando

---

### 3. src/lib/client/authFetch.ts

**Responsabilidade:** Wrapper fetch com autenticação para chamadas do client.

#### O que o arquivo faz
- Adiciona headers de autenticação a cada request
- Verifica se usuário está "logado" via localStorage

#### Problemas e Riscos

1. **Senha enviada em cada request** - 🔴 CRÍTICO
```typescript
headers.set('x-admin-password', 'cuideme@admin321');
```
   - Tipo: segurança
   - Senha trafega em todas as requisições

2. **Verificação frágil de auth** - 🟡 ALTO
```typescript
const isLogged = localStorage.getItem('admin_logged') === 'true';
```

#### Melhorias Propostas

```typescript
// Com JWT em httpOnly cookie, este arquivo fica simples:
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...options,
    credentials: 'include', // Envia cookies automaticamente
  });
}

// O cookie é managed pelo browser, não pelo JS
```

---

## 🔥 ARQUIVOS FIREBASE

### 4. src/lib/server/firebaseAdmin.ts

**Responsabilidade:** Inicialização do Firebase Admin SDK.

#### O que o arquivo faz
- Singleton para Firebase Admin
- Parse de credenciais (base64 ou env vars separadas)
- Normalização de private key

#### Problemas e Riscos

1. **Logs de credenciais** - 🔴 CRÍTICO
```typescript
console.warn('  - Client Email:', clientEmail?.substring(0, 20) + '...');
console.warn('  - Primeiros 50 chars:', processedKey.substring(0, 50));
```
   - Logs podem ir para serviços de agregação (Vercel logs)

2. **Proxy stub pode mascarar erros** - 🟡 ALTO
```typescript
adminApp = new Proxy({} as App, {
  get() {
    throw new Error('[Firebase Admin] SDK não inicializado');
  },
});
```
   - Difícil debugar quando stub é retornado

3. **Erro silencioso em build** - 🟢 MÉDIO
```typescript
if (process.env.VERCEL || typeof window === 'undefined') {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[Firebase Admin] ⚠️ Build sem credenciais');
  }
}
```

#### Melhorias Propostas

```typescript
export function getFirebaseAdmin(): App {
  // Remover todos os logs de credenciais
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Firebase Admin] Initializing...');
  }
  
  // ... resto do código
  
  // Ao invés de Proxy, falhar explicitamente
  if (!projectId || !privateKey || !clientEmail) {
    if (process.env.VERCEL && process.env.NODE_ENV === 'production') {
      throw new Error('Firebase credentials missing in production');
    }
    // Em dev/build, retornar null e checar depois
    return null as any;
  }
  
  // ... inicialização normal
}
```

#### Testes Recomendados
- [ ] Unit: Inicializa com credenciais válidas
- [ ] Unit: Lança erro sem credenciais em produção
- [ ] Unit: Normaliza private key corretamente
- [ ] Integration: Query Firestore funciona após init

---

### 5. src/firebase/firebaseApp.ts

**Responsabilidade:** Firebase Client SDK (browser).

#### O que o arquivo faz
- Singleton para Firebase App no client
- Getters para Auth e Firestore

#### Problemas e Riscos

1. **Configuração adequada** - ✅ OK
   - Usa NEXT_PUBLIC_ corretamente
   - Singleton pattern correto

2. **Sem validação de config** - 🟢 MÉDIO
```typescript
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  // ... pode ser undefined
};
```

#### Melhorias Propostas

```typescript
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  // ...
};

// Validar antes de inicializar
function validateConfig() {
  const required = ['apiKey', 'authDomain', 'projectId'];
  const missing = required.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);
  
  if (missing.length > 0) {
    throw new Error(`Missing Firebase config: ${missing.join(', ')}`);
  }
}
```

---

## 📊 ARQUIVOS DE SERVICES/MÉTRICAS

### 6. src/services/admin/torreDeControleMetrics.ts

**Responsabilidade:** Cálculo de métricas da Torre de Controle.

#### O que o arquivo faz
- Busca jobs, payments, transações, users
- Calcula KPIs: famílias ativas, cuidadores, conversão, GMV, etc.
- Retorna estrutura para dashboard

#### Problemas e Riscos

1. **Full table scan** - 🟡 ALTO
```typescript
const usersSnapshot = await db.collection('users').get();
// Busca TODOS os usuários
```
   - Com 100k users, isso quebra

2. **N+1 query patterns** - 🟡 ALTO
```typescript
// Busca jobs, depois payments, depois transacoes, depois users
// 4 queries sequenciais
```

3. **Sem paginação** - 🟡 ALTO
```typescript
const jobsSnapshot = await db
  .collection('jobs')
  .where('createdAt', '>=', windowStart)
  .get();
// Pode retornar milhões de docs
```

4. **Cálculos em memória** - 🟢 MÉDIO
   - Toda agregação acontece no Node.js
   - Para volume alto, vai estourar memória

#### Melhorias Propostas

```typescript
// 1. Usar Firestore Counters para métricas agregadas
// Criar collection: metrics_daily com docs por dia

// 2. Para jobs, usar Stream API com limites
async function* streamJobs(db: Firestore, windowStart: Timestamp, batchSize = 1000) {
  let lastDoc: QueryDocumentSnapshot | null = null;
  
  while (true) {
    let query = db.collection('jobs')
      .where('createdAt', '>=', windowStart)
      .orderBy('createdAt')
      .limit(batchSize);
    
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }
    
    const snapshot = await query.get();
    if (snapshot.empty) break;
    
    for (const doc of snapshot.docs) {
      yield { id: doc.id, ...doc.data() };
    }
    
    lastDoc = snapshot.docs[snapshot.docs.length - 1];
  }
}

// 3. Usar índices compostos para queries frequentes
// firestore.indexes.json:
{
  "indexes": [
    {
      "collectionGroup": "jobs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "createdAt", "order": "DESCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    }
  ]
}

// 4. Pre-computar agregações diárias via Cloud Functions
```

#### Testes Recomendados
- [ ] Unit: `calculateFamiliasAtivas` retorna contagem correta
- [ ] Unit: `calculateGMVMensal` calcula soma correta
- [ ] Unit: `normalizeJobStatus` normaliza todos os status
- [ ] Integration: Endpoint retorna dados estruturados
- [ ] Load: 10k jobs processados em < 5s

#### Performance Targets
- P95 latência: < 2s para 30 dias de dados
- Memória: < 256MB mesmo com 100k jobs

---

### 7. src/services/admin/users/listUsers.ts

**Responsabilidade:** Listagem de usuários com agregações.

#### O que o arquivo faz
- Lista usuários com filtros (perfil, search)
- Busca jobs, payments, ratings para enriquecer dados
- Gera URLs assinadas para certificados

#### Problemas e Riscos

1. **Limit absurdo** - 🟡 ALTO
```typescript
const pageSize = params?.pageSize || 1000;
// 1000 usuários por "página"
```

2. **Busca todos os jobs** - 🟡 ALTO
```typescript
const jobsSnap = await db.collection('jobs').get();
// Todos os jobs para fazer join em memória
```

3. **Múltiplas chamadas Stripe por usuário** - 🟡 ALTO
```typescript
async function getStripeAccountStatus(stripeAccountId: string): Promise<string> {
  const account = await stripe.accounts.retrieve(stripeAccountId);
  // Uma chamada por profissional com conta Stripe
}
```
   - Rate limit do Stripe: 100 req/s

#### Melhorias Propostas

```typescript
// 1. Paginação real
const pageSize = Math.min(params?.pageSize || 50, 100);

// 2. Batch Stripe calls
async function getStripeAccountsStatuses(ids: string[]): Promise<Map<string, string>> {
  // Stripe permite até 100 em batch
  const results = new Map();
  const batches = chunk(ids, 100);
  
  for (const batch of batches) {
    const accounts = await stripe.accounts.list({
      ids: batch,
      limit: 100,
    });
    // Processar...
  }
  
  return results;
}

// 3. Cache de status Stripe (5 minutos)
const stripeStatusCache = new Map<string, { status: string; expiry: number }>();
```

---

### 8. src/services/admin/statusNormalizer.ts

**Responsabilidade:** Normalização de status de jobs entre versões PT/EN.

#### O que o arquivo faz
- Mapeia status legados para status normalizados
- Helper functions: isJobCompleted, isJobCancelled, etc.

#### Problemas e Riscos

1. **Debt técnico evidenciado** - 🟢 MÉDIO
```typescript
const STATUS_MAP: Record<string, NormalizedJobStatus> = {
  'pending': 'pending',
  'pendente': 'pending',
  'open': 'pending',
  // ... 12+ mapeamentos
};
```
   - Indica inconsistência histórica no modelo de dados

2. **Fallback silencioso** - 🟢 MÉDIO
```typescript
if (!normalized) {
  console.warn(`Status desconhecido: "${status}"`);
  return 'pending'; // Assume pending
}
```
   - Jobs com status errado viram pending

#### Melhorias Propostas

```typescript
// 1. Adicionar enum explícito
export enum JobStatus {
  PENDING = 'pending',
  MATCHED = 'matched',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// 2. Validação na entrada (API)
import { z } from 'zod';

export const JobStatusSchema = z.enum([
  'pending', 'pendente', 'open', 'proposta_enviada',
  'matched', 'proposta_aceita', 'accepted',
  'active', 'in_progress',
  'completed', 'concluido',
  'cancelled', 'cancelado',
]);

// 3. Migração para normalizar dados existentes
async function migrateJobStatuses() {
  const batch = db.batch();
  const jobs = await db.collection('jobs').get();
  
  jobs.docs.forEach(doc => {
    const normalized = normalizeJobStatus(doc.data().status);
    if (doc.data().status !== normalized) {
      batch.update(doc.ref, { 
        status: normalized,
        _statusMigratedAt: FieldValue.serverTimestamp(),
        _statusOriginal: doc.data().status,
      });
    }
  });
  
  await batch.commit();
}
```

---

## 🎨 ARQUIVOS DE COMPONENTES

### 9. src/components/admin/TorreDeControleDashboard.tsx

**Responsabilidade:** Dashboard principal da Torre de Controle.

#### O que o arquivo faz
- Renderiza KPIs, alertas, top regiões
- Controla filtros (window, region)
- Drilldown por região

#### Problemas e Riscos

1. **Senha hardcoded no client** - 🔴 CRÍTICO
```typescript
const ADMIN_PASSWORD = 'cuideme@admin321';

const response = await fetch(`/api/admin/torre-de-controle?${params}`, {
  headers: {
    'x-admin-password': ADMIN_PASSWORD,
  },
});
```

2. **Sem debounce em filtros** - 🟢 MÉDIO
```typescript
onChange={(e) => setWindow(Number(e.target.value))}
// Cada mudança dispara fetch imediato
```

3. **Sem loading skeleton** - 🟢 MÉDIO
   - Loading state genérico, não mostra estrutura

#### Melhorias Propostas

```typescript
// 1. Usar authFetch ao invés de senha hardcoded
import { authFetch } from '@/lib/client/authFetch';

// Com httpOnly cookie
const response = await authFetch(`/api/admin/torre-de-controle?${params}`);

// 2. Debounce em filtros
import { useDebouncedCallback } from 'use-debounce';

const debouncedFetch = useDebouncedCallback(fetchData, 300);

// 3. Loading skeleton
{loading && (
  <div className="grid grid-cols-4 gap-4">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-lg" />
    ))}
  </div>
)}
```

---

### 10. src/components/admin/AdminLayout.tsx

**Responsabilidade:** Layout principal com sidebar, tooltips, cards.

#### O que o arquivo faz
- Layout responsivo com menu lateral
- Componentes reutilizáveis: StatCard, Section, Tooltip
- Navegação entre módulos

#### Problemas e Riscos

1. **Layout bem estruturado** - ✅ OK
   - Componentes desacoplados
   - Props bem tipadas

2. **Tooltip poderia ser mais acessível** - 🟢 BAIXO
```typescript
<button
  type="button"
  onMouseEnter={() => setShow(true)}
  // Sem suporte a teclado
```

#### Melhorias Propostas

```typescript
// Adicionar suporte a teclado
<button
  type="button"
  onMouseEnter={() => setShow(true)}
  onMouseLeave={() => setShow(false)}
  onFocus={() => setShow(true)}
  onBlur={() => setShow(false)}
  aria-describedby={`tooltip-${id}`}
>
```

---

## 🧪 ARQUIVOS DE HOOKS

### 11. src/hooks/useAutoRefresh.ts

**Responsabilidade:** Auto-refresh com controle manual.

#### O que o arquivo faz
- Timer para refresh automático
- Countdown visual
- Toggle on/off

#### Problemas e Riscos

1. **Memory leak potencial** - 🟢 MÉDIO
```typescript
useEffect(() => {
  // Intervals criados mas não limpos em caso de erro
}, [isEnabled, interval, onRefresh]);
```

2. **onRefresh em dependências** - 🟢 BAIXO
   - Pode causar re-render infinito se callback não estável

#### Melhorias Propostas

```typescript
import { useCallback, useEffect, useRef, useState } from 'react';

export function useAutoRefresh({ onRefresh, interval = 60000, enabled = false }) {
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [countdown, setCountdown] = useState(interval / 1000);
  
  // Estabilizar callback
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;
  
  useEffect(() => {
    if (!isEnabled) return;
    
    setCountdown(interval / 1000);
    
    const refreshInterval = setInterval(() => {
      onRefreshRef.current();
      setCountdown(interval / 1000);
    }, interval);
    
    const countdownInterval = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => {
      clearInterval(refreshInterval);
      clearInterval(countdownInterval);
    };
  }, [isEnabled, interval]);
  
  // ... rest
}
```

---

### 12. src/hooks/useAdminInactivityTimeout.ts

**Responsabilidade:** Logout automático por inatividade.

#### O que o arquivo faz
- Monitora eventos de atividade
- Logout após 30 min de inatividade
- Redireciona para login

#### Problemas e Riscos

1. **Usa Firebase Auth mas sistema usa localStorage** - 🟡 MÉDIO
```typescript
const auth = getFirebaseAuth();
await auth.signOut();
```
   - Mismatch: login é localStorage, logout é Firebase

2. **Timeout fixo** - 🟢 BAIXO
   - 30 min hardcoded, poderia ser configurável

#### Melhorias Propostas

```typescript
// Unificar com sistema de auth atual
const handleLogout = () => {
  localStorage.removeItem('admin_logged');
  router.push('/admin/login?reason=inactivity');
};

// Timer já limpo corretamente no cleanup

// Timeout configurável
const INACTIVITY_TIMEOUT = Number(process.env.NEXT_PUBLIC_ADMIN_TIMEOUT_MS) || 30 * 60 * 1000;
```

---

## ⚙️ ARQUIVOS DE CONFIGURAÇÃO

### 13. package.json

**Análise de Dependências:**

| Dependência | Versão | Status | Notas |
|-------------|--------|--------|-------|
| next | 16.0.10 | ✅ | Última major |
| react | 19.2.1 | ✅ | Última |
| firebase | 12.6.0 | ✅ | Atualizado |
| firebase-admin | 12.7.0 | ✅ | Atualizado |
| stripe | 17.5.0 | ✅ | Atualizado |
| zod | 3.24.1 | ✅ | Validação presente |
| jest | - | ⚠️ | Não instalado! |

**Problemas:**
1. Jest no devDependencies está faltando
2. Scripts de test existem mas dependência não

**Correção:**
```bash
npm install -D jest ts-jest @types/jest
```

### 14. tsconfig.json

**Status:** ✅ Bem configurado
- `strict: true` ✅
- `isolatedModules: true` ✅
- Path aliases ✅

### 15. next.config.ts

**Status:** ⚠️ Muito básico
```typescript
const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {},
};
```

**Faltando:**
- Security headers
- CSP
- Image optimization config
- Logging config

**Melhorias:**
```typescript
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};
```

---

## 📊 RESUMO DE SEVERIDADES

| Severidade | Arquivos | Descrição |
|------------|----------|-----------|
| 🔴 CRÍTICO | 6 | auth.ts, login/page.tsx, authFetch.ts, firebaseAdmin.ts, TorreDeControleDashboard.tsx, sem firestore.rules |
| 🟡 ALTO | 8 | torreDeControleMetrics.ts, listUsers.ts, listAlerts.ts, todas as APIs sem rate limit |
| 🟢 MÉDIO | 12 | Components, hooks, tipos any, testes faltando |

---

*Auditoria detalhada gerada em 24/02/2026*
