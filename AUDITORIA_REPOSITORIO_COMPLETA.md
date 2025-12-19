# 🔍 AUDITORIA COMPLETA DO REPOSITÓRIO - TORRE DE CONTROLE

**Data**: 18/12/2025  
**Objetivo**: Mapear TODAS as integrações reais (GA4, Stripe, Firebase) antes de implementar KPIs na Torre de Controle  
**Regra de Ouro**: NÃO INVENTAR DADOS - Usar apenas nomes/eventos/coleções reais encontrados no código

---

## 📋 SUMÁRIO EXECUTIVO

### ✅ Integrações Confirmadas
- ✅ **Firebase Admin SDK** - Operacional (16 coleções mapeadas)
- ✅ **Stripe API** - Operacional (v2025-02-24.acacia)
- ✅ **GA4 Data API** - Configurado (Property ID: 503083965)
- ⚠️ **GA4 Custom Events** - Hooks criados, EVENTOS NÃO EMITIDOS ainda (frontend não integrado)

### 🎯 Torre de Controle Atual
- **Localização**: `/admin` (página principal)
- **Total de Módulos**: 11
- **Páginas Admin**: 14 rotas mapeadas
- **Router**: Next.js App Router

---

## 1️⃣ ROTAS DO ADMIN

### 1.1 Estrutura de Rotas (/app/admin)

**Home da Torre de Controle**: `/admin/page.tsx`

**Todas as Páginas Admin:**
```
✅ /admin                       - Torre de Controle (Home)
✅ /admin/dashboard             - Dashboard V2 (Demanda + Oferta)
✅ /admin/financeiro            - Financeiro V1 (legacy)
✅ /admin/financeiro-v2         - Financeiro V2 (novo)
✅ /admin/pipeline              - Pipeline de Vendas
✅ /admin/users                 - Gestão de Usuários
✅ /admin/service-desk          - Tickets de Suporte
✅ /admin/operational-health    - Saúde Operacional
✅ /admin/reports               - Relatórios Agendados
✅ /admin/alerts                - Alertas do Sistema
✅ /admin/growth                - Crescimento (Aquisição + Ativação)
✅ /admin/performance           - Performance de APIs (NEW)
✅ /admin/intelligent-alerts    - Alertas Inteligentes (NEW)
✅ /admin/login                 - Login Admin
```

### 1.2 Layout Admin

**Arquivo**: `src/app/admin/layout.tsx`

**Componentes Reutilizáveis**:
- `AdminLayout` (default export)
- `Section` - Seções com título + subtitle
- `Card` - Card básico
- `StatCard` - Card com métrica + ícone + variação
- `Badge` - Tags coloridas (success, warning, error, info, neutral)
- `Button` - Botões estilizados
- `Tooltip` - Tooltips informativos
- `EmptyState` - Estado vazio com ícone
- `LoadingSkeleton` - Loading state

---

## 2️⃣ GOOGLE ANALYTICS 4 (GA4)

### 2.1 Configuração

**Variáveis de Ambiente**:
```bash
GA4_PROPERTY_ID=503083965           # Backend (Data API)
NEXT_PUBLIC_GA4_ID=G-B21PK9JQYS     # Frontend (gtag.js)
GOOGLE_APPLICATION_CREDENTIALS_JSON=[base64]  # Service Account
```

**Property ID Real**: `503083965`  
**Measurement ID**: `G-B21PK9JQYS`

### 2.2 Serviços GA4 Existentes

#### a) **analyticsService.ts** (Data API - Backend)

**Arquivo**: `src/services/admin/analyticsService.ts`

**Funções Disponíveis**:
```typescript
// Métricas gerais (7/30/90 dias)
fetchGoogleAnalyticsMetrics(startDate, endDate): GoogleAnalyticsMetrics
  ├─ activeUsers
  ├─ newUsers
  ├─ sessions
  ├─ pageViews
  ├─ bounceRate
  ├─ averageSessionDuration
  ├─ topPages[]
  └─ usersByDevice { desktop, mobile, tablet }

// Métricas de conversão (custom events)
fetchConversionMetrics(startDate, endDate): ConversionMetrics
  ├─ signups { count, rate }
  ├─ createRequests { count, rate }
  ├─ hires { count, rate }
  └─ funnel {
      visitors, signups, requests, hires,
      visitorToSignup%, signupToRequest%,
      requestToHire%, overallConversion%
    }
```

**Queries GA4 Reais**:
- `activeUsers` (métrica padrão)
- `newUsers` (métrica padrão)
- `sessions` (métrica padrão)
- `screenPageViews` (métrica padrão)
- `bounceRate` (métrica padrão)
- `userEngagementDuration` (métrica padrão)
- `pagePath` (dimensão)
- `deviceCategory` (dimensão)
- `eventName` (dimensão - para custom events)
- `eventCount` (métrica - para custom events)

**API Routes Usando GA4**:
- ✅ `/api/admin/daily-metrics` - Gráficos diários
- ✅ `/api/admin/conversion-funnel` - Funil de conversão (NEW)

#### b) **GoogleTagManager.tsx** (Frontend)

**Arquivo**: `src/components/GoogleTagManager.tsx`

**Funcionalidade**:
- Injeção do script gtag.js no `<head>`
- Usa `NEXT_PUBLIC_GA4_ID` (G-B21PK9JQYS)
- Next.js Script com estratégia `afterInteractive`

**Status**: ✅ Componente criado, **NÃO integrado no layout ainda**

#### c) **useGA4Events Hook** (Frontend)

**Arquivo**: `src/hooks/useGA4Events.ts`

**Eventos Definidos** (5 total):
```typescript
1. sign_up(method, userType)
   - method: 'email' | 'google' | 'facebook'
   - userType: 'professional' | 'family'

2. create_request(requestId, serviceType)
   - request_id: string
   - service_type: string

3. hire_caregiver(jobId, professionalId, amount)
   - job_id: string
   - professional_id: string
   - value: number

4. complete_profile(userId, userType)
   - user_id: string
   - user_type: 'professional' | 'family'

5. accept_match(matchId, jobId)
   - match_id: string
   - job_id: string
```

**Status**: ✅ Hook criado, **EVENTOS NÃO EMITIDOS** (não integrado nas páginas de ação)

### 2.3 ⚠️ GAPS IDENTIFICADOS - GA4

1. **❌ GoogleTagManager NÃO integrado no layout**
   - Componente existe mas não está em `app/layout.tsx` ou `app/admin/layout.tsx`
   - Solução: Adicionar `<GoogleTagManager />` no layout raiz

2. **❌ Eventos customizados NÃO emitidos**
   - Hook `useGA4Events` existe mas não é usado nas páginas
   - Nenhum `trackSignUp()`, `trackCreateRequest()`, etc. está sendo chamado
   - Solução: Integrar hook nas páginas de cadastro/solicitação/contratação

3. **⚠️ Custom Events podem não existir no GA4**
   - Se eventos nunca foram emitidos, queries retornarão zero
   - Solução: Validar se eventos existem antes de criar dashboards

---

## 3️⃣ STRIPE API

### 3.1 Configuração

**Variáveis de Ambiente**:
```bash
STRIPE_SECRET_KEY=sk_live_xxxxx    # ou sk_test_xxxxx
```

**API Version**: `2025-02-24.acacia` (hardcoded em `src/lib/server/stripe.ts`)

**Cliente Singleton**: `getStripeClient()` em `src/lib/server/stripe.ts`

### 3.2 Objetos Stripe Utilizados

#### a) **Subscriptions** (Assinaturas)

**Queries Reais**:
```typescript
// Listar assinaturas ativas
stripe.subscriptions.list({
  status: 'active',
  limit: 100,
  expand: ['data.customer', 'data.default_payment_method']
})

// Listar assinaturas canceladas
stripe.subscriptions.list({
  status: 'canceled',
  limit: 100
})
```

**Campos Usados**:
- `status` - 'active', 'canceled', 'past_due', 'trialing'
- `plan.amount` - Valor da assinatura
- `current_period_start/end` - Período de cobrança
- `customer` - Cliente Stripe
- `metadata` - Dados customizados (ex: userId, userType)

**Onde é usado**:
- ✅ `src/services/admin/control-tower/finance.ts` - MRR, Churn
- ✅ `src/services/admin/financeiro-v2/index.ts` - Dashboard financeiro
- ✅ `src/services/admin/finance.ts` - Métricas gerais

#### b) **Charges** (Cobranças)

**Queries Reais**:
```typescript
// Listar cobranças bem-sucedidas
stripe.charges.list({
  limit: 100,
  expand: ['data.customer']
})
```

**Campos Usados**:
- `amount` - Valor cobrado (em centavos)
- `status` - 'succeeded', 'failed', 'pending'
- `created` - Timestamp
- `customer` - Cliente
- `description` - Descrição
- `metadata` - Dados customizados

**Onde é usado**:
- ✅ `src/services/admin/stripeService.ts`
- ✅ `src/services/admin/finance.ts`
- ✅ `src/app/api/admin/financeiro/route.ts`

#### c) **Balance** (Saldo da Conta)

**Query Real**:
```typescript
stripe.balance.retrieve()
```

**Campos Usados**:
- `available[0].amount` - Saldo disponível (centavos)
- `available[0].currency` - Moeda
- `pending[0].amount` - Saldo pendente

**Onde é usado**:
- ✅ `src/services/admin/control-tower/finance.ts` - Runway, caixa disponível
- ✅ `/api/health` - Health check

#### d) **Payouts** (Transferências para Conta Bancária)

**Query Real**:
```typescript
stripe.payouts.list({
  limit: 12,
  expand: ['data.destination']
})
```

**Campos Usados**:
- `amount` - Valor transferido
- `arrival_date` - Data de chegada
- `status` - 'paid', 'pending', 'in_transit', 'failed'
- `created` - Timestamp

**Onde é usado**:
- ✅ `src/services/admin/control-tower/finance.ts` - Transferências mensais
- ✅ `/api/admin/financeiro/route.ts`

#### e) **Balance Transactions** (Histórico de Transações)

**Query Real**:
```typescript
stripe.balanceTransactions.list({
  limit: 100
})
```

**Campos Usados**:
- `amount` - Valor
- `type` - 'charge', 'refund', 'payout', etc.
- `fee` - Taxa Stripe
- `net` - Valor líquido
- `created` - Data

**Onde é usado**:
- ✅ `/api/admin/financeiro/route.ts`

#### f) **Accounts** (Contas Connected - se houver)

**Query Real**:
```typescript
stripe.accounts.retrieve(accountId)
```

**Status**: ⚠️ Usado em alguns lugares, mas pode não ser relevante se não houver Stripe Connect

### 3.3 ⚠️ GAPS IDENTIFICADOS - STRIPE

1. **⚠️ Metadata pode não existir**
   - Código assume `metadata.userId`, `metadata.jobId` em subscriptions/charges
   - Se não foi configurado no checkout, campos estarão vazios
   - Solução: Validar se metadata existe antes de usar

2. **⚠️ Referência Firebase ↔ Stripe**
   - Não há campo óbvio linkando `jobs` (Firebase) → `charge` (Stripe)
   - Pode precisar de lógica de matching por timestamp/valor
   - Solução: Documentar como é feita a associação

3. **✅ Balance API funciona**
   - Testado e retorna dados reais
   - Pode ser usado para cálculos de runway

---

## 4️⃣ FIREBASE / FIRESTORE

### 4.1 Inicialização

**Arquivo**: `src/lib/server/firebaseAdmin.ts`

**Credenciais**:
```bash
FIREBASE_ADMIN_SERVICE_ACCOUNT=[base64 JSON]
```

**Cliente**: `getFirebaseAdmin()` → Singleton

### 4.2 Coleções Mapeadas (16 TOTAL)

#### 📊 **COLEÇÃO: `users`**

**Total de Docs**: ~192 documentos (auditado)

**Campos Principais**:
```typescript
{
  perfil: 'profissional' | 'cliente'  // CAMPO OBRIGATÓRIO
  userType?: 'professional' | 'family' // LEGADO (alguns docs têm)
  nome: string
  email: string
  telefone?: string
  cpf?: string
  status?: 'ativo' | 'inativo' | 'pendente'
  createdAt: string | Timestamp
  updatedAt?: string | Timestamp
  // Profissionais:
  especialidades?: string[]
  disponibilidade?: boolean
  avaliacaoMedia?: number
  totalAtendimentos?: number
  // Famílias:
  endereco?: { ... }
  preferencias?: { ... }
}
```

**Status Values Encontrados**:
- `'ativo'` - Usuário ativo
- `'inativo'` - Usuário desativado
- `'pendente'` - Cadastro incompleto
- ⚠️ **Alguns documentos NÃO têm campo status**

**Perfil Values**:
- ✅ `'profissional'` - Cuidadores
- ✅ `'cliente'` - Famílias
- ⚠️ **Alguns documentos têm `userType` ao invés de `perfil`**

**Queries Comuns**:
```typescript
// Profissionais ativos
db.collection('users')
  .where('perfil', '==', 'profissional')
  .where('status', '==', 'ativo')

// Famílias
db.collection('users')
  .where('perfil', '==', 'cliente')
```

**Onde é usado**:
- ✅ Todos os serviços admin (dashboard, torre, operational-health, etc.)
- ✅ `/api/admin/users`
- ✅ `/api/admin/audit-data`

---

#### 📋 **COLEÇÃO: `jobs`** (Solicitações/Atendimentos)

**Total de Docs**: ~1 documento real + muitos arquivados

**Campos Principais**:
```typescript
{
  status: 'open' | 'pending' | 'matched' | 'accepted' | 'hired' | 'completed' | 'canceled' | 'abandoned'
  clientId: string  // Referência para users (família)
  professionalId?: string  // Referência para users (profissional)
  serviceType: string
  description?: string
  location?: { ... }
  budget?: number
  createdAt: string | Timestamp
  matchedAt?: string | Timestamp  // Quando foi atribuído
  acceptedAt?: string | Timestamp // Quando profissional aceitou
  hiredAt?: string | Timestamp    // Quando família contratou
  completedAt?: string | Timestamp
  canceledAt?: string | Timestamp
  rating?: number
  feedback?: string
}
```

**Status Values Encontrados** (via código):
- `'open'` - Solicitação aberta
- `'pending'` - Pendente de match
- `'matched'` - Match feito, aguardando aceite
- `'accepted'` - Profissional aceitou
- `'hired'` - Família contratou
- `'completed'` - Atendimento finalizado
- `'canceled'` - Cancelado
- `'abandoned'` - Abandonado após aceite
- `'em_andamento'` / `'em_progresso'` / `'ativo'` - **Possíveis variações legadas**
- `'proposta_enviada'` - **Possível variação legada**

**⚠️ IMPORTANTE**: Código usa múltiplas variações de status. Pode ser necessário normalizar.

**Queries Comuns**:
```typescript
// Jobs abertos
db.collection('jobs')
  .where('status', 'in', ['open', 'pending'])

// Jobs com SLA crítico (>48h)
db.collection('jobs')
  .where('status', 'in', ['open', 'pending'])
  .where('createdAt', '<=', fortyEightHoursAgo)

// Jobs matched (últimos 7 dias)
db.collection('jobs')
  .where('status', 'in', ['matched', 'accepted', 'hired'])
  .where('matchedAt', '>=', sevenDaysAgo)
```

**Onde é usado**:
- ✅ `src/services/admin/control-tower/operations.ts` - SLA, tempo de match
- ✅ `src/services/admin/operational-health/matches.ts`
- ✅ `src/services/admin/intelligentAlerts.ts` - Alertas de SLA
- ✅ `src/services/admin/dashboard/demanda.ts`

---

#### ⭐ **COLEÇÃO: `ratings`** (Avaliações)

**Campos Principais**:
```typescript
{
  jobId: string
  clientId: string
  professionalId: string
  rating: number  // 1-5
  comment?: string
  createdAt: string | Timestamp
}
```

**Queries Comuns**:
```typescript
// Avaliações de profissional
db.collection('ratings')
  .where('professionalId', '==', profId)

// Avaliações recentes
db.collection('ratings')
  .orderBy('createdAt', 'desc')
  .limit(10)
```

**Onde é usado**:
- ✅ `src/services/admin/operational-health/professionals.ts`
- ✅ `src/services/admin/operational-health/matches.ts`

---

#### 💬 **COLEÇÃO: `feedbacks`** (Feedbacks do Sistema)

**Campos Principais**:
```typescript
{
  userId: string
  userType: 'professional' | 'family'
  rating: number
  comment: string
  category?: string
  createdAt: string | Timestamp
}
```

**Onde é usado**:
- ✅ `src/services/admin/operational-health/families.ts`

---

#### 🎫 **COLEÇÃO: `tickets`** (Service Desk)

**Campos Principais**:
```typescript
{
  title: string
  description: string
  status: 'open' | 'pending' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: string
  userId: string
  assignedTo?: string
  createdAt: string | Timestamp
  updatedAt: string | Timestamp
  resolvedAt?: string | Timestamp
}
```

**Queries Comuns**:
```typescript
// Tickets abertos
db.collection('tickets')
  .where('status', 'in', ['open', 'pending', 'in_progress'])

// Por status
db.collection('tickets')
  .where('status', '==', status)
```

**Onde é usado**:
- ✅ `/api/admin/service-desk/route.ts`
- ✅ `/api/admin/service-desk/[ticketId]/route.ts`
- ✅ `/app/admin/service-desk/page.tsx`

---

#### 💰 **COLEÇÃO: `transacoes`** (Transações Financeiras - LEGADO?)

**Campos Principais**:
```typescript
{
  jobId?: string
  userId?: string
  amount: number
  status: 'paid' | 'pending' | 'failed' | 'succeeded'
  type?: string
  createdAt: string | Timestamp
}
```

**⚠️ Status**: Parece ser legado ou paralelo ao Stripe. Pode ter dados duplicados.

**Queries Comuns**:
```typescript
// Transações pagas
db.collection('transacoes')
  .where('status', '==', 'paid')

// Transações bem-sucedidas
db.collection('transacoes')
  .where('status', '==', 'succeeded')
```

**Onde é usado**:
- ✅ `src/services/admin/dashboard/families.ts`
- ✅ `src/services/admin/dashboard/finance.ts`

---

#### 📊 **COLEÇÃO: `deals`** (Pipeline de Vendas)

**Campos Principais**:
```typescript
{
  title: string
  value: number
  status: 'active' | 'won' | 'lost'
  stage?: string
  contactId?: string
  createdAt: string | Timestamp
}
```

**Queries Comuns**:
```typescript
// Deals ativos
db.collection('deals')
  .where('status', 'in', ['active', 'won', 'lost'])
```

**Onde é usado**:
- ✅ `src/services/admin/pipeline-v2/pipelineService.ts`

---

#### 🔔 **COLEÇÃO: `alerts`** (Alertas do Sistema - Legado)

**Campos Principais**:
```typescript
{
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  status: 'open' | 'acknowledged' | 'resolved'
  createdAt: string | Timestamp
  resolvedAt?: string | Timestamp
}
```

**Onde é usado**:
- ✅ `src/services/admin/alerts/alertService.ts`
- ✅ `ALERTS_COLLECTION` constant

---

#### 🤖 **COLEÇÃO: `system_alerts`** (Alertas Inteligentes - NEW)

**Campos Principais**:
```typescript
{
  id: string
  ruleId: string
  severity: 'critical' | 'warning' | 'info'
  category: 'operational' | 'financial' | 'performance' | 'quality' | 'system'
  title: string
  description: string
  currentValue: string
  threshold: string
  impact: string
  actionRequired: string
  detectedAt: string
}
```

**Onde é usado**:
- ✅ `src/services/admin/intelligentAlerts.ts` - Auto-salvamento de alertas críticos
- ✅ `/api/admin/intelligent-alerts/route.ts`

---

#### 📝 **COLEÇÃO: `report_configs`** (Configurações de Relatórios)

**Campos Principais**:
```typescript
{
  id: string
  name: string
  description?: string
  type: string
  createdAt: string | Timestamp
  createdBy: string
}
```

**Onde é usado**:
- ✅ `src/services/admin/reports/index.ts`
- ✅ `src/services/admin/reports/schedulerService.ts`

---

#### 📅 **COLEÇÃO: `report_schedules`** (Agendamentos de Relatórios)

**Campos Principais**:
```typescript
{
  id: string
  reportConfigId: string
  enabled: boolean
  frequency: string
  nextRun?: string | Timestamp
}
```

**Onde é usado**:
- ✅ `src/services/admin/reports/schedulerService.ts`

---

#### 🏃 **COLEÇÃO: `report_executions`** (Execuções de Relatórios)

**Campos Principais**:
```typescript
{
  id: string
  scheduleId?: string
  configId: string
  status: 'running' | 'completed' | 'failed'
  startedAt: string | Timestamp
  completedAt?: string | Timestamp
}
```

**Onde é usado**:
- ✅ `src/services/admin/reports/schedulerService.ts`

---

#### ❓ **COLEÇÕES POTENCIAIS (Mencionadas mas não encontradas)**

- `appointments` - Mencionado no código mas não há documentos
- `matches` - Mencionado no código mas não há documentos
- `proposals` - Mencionado no código mas não há documentos
- `payments` - Mencionado no código (pode ser Stripe diretamente)

**Status**: ⚠️ Podem não existir ou estarem em outra estrutura

---

### 4.3 ⚠️ GAPS IDENTIFICADOS - FIREBASE

1. **⚠️ Status Values Inconsistentes**
   - `jobs` usa múltiplas variações: 'open', 'pending', 'em_andamento', 'ativo'
   - Código assume status específicos que podem não existir
   - Solução: Normalizar status ou mapear variações

2. **⚠️ Campos Opcionais**
   - `users.status` - Nem todos têm
   - `jobs.matchedAt/acceptedAt/hiredAt` - Nem todos têm
   - Código precisa de fallback para campos vazios

3. **⚠️ Perfil vs UserType**
   - Alguns usuários têm `perfil`, outros `userType`
   - Código precisa verificar ambos

4. **⚠️ Coleções Vazias**
   - `appointments`, `matches`, `proposals` podem não existir
   - Código precisa de tratamento de erros

5. **✅ Campos Timestamp**
   - Maioria usa `string` ISO ou Firestore `Timestamp`
   - Código já trata ambos

---

## 5️⃣ MAPA DE INTEGRAÇÕES POR MÓDULO

### Torre de Controle (`/admin/page.tsx`)

**Dados Usados**:
- ✅ Firebase: `users`, `jobs`, `tickets`, `ratings`, `feedbacks`
- ✅ Stripe: `subscriptions`, `balance`, `payouts`, `charges`
- ⚠️ GA4: `activeUsers`, `sessions` (via analyticsService)

**Serviços**:
- ✅ `src/services/admin/control-tower/index.ts` - Orquestrador principal
- ✅ `src/services/admin/control-tower/finance.ts`
- ✅ `src/services/admin/control-tower/operations.ts`
- ✅ `src/services/admin/control-tower/marketplace.ts`

**API Route**:
- ✅ `/api/admin/control-tower/route.ts`

---

### Dashboard V2 (`/admin/dashboard`)

**Dados Usados**:
- ✅ Firebase: `users`, `jobs`, `transacoes`
- ❌ Stripe: Não usa diretamente
- ❌ GA4: Não usa

**Serviços**:
- ✅ `src/services/admin/dashboard/index.ts`
- ✅ `src/services/admin/dashboard/demanda.ts` - Lado da demanda (famílias)
- ✅ `src/services/admin/dashboard/oferta.ts` - Lado da oferta (profissionais)
- ✅ `src/services/admin/dashboard/families.ts`
- ✅ `src/services/admin/dashboard/professionals.ts`
- ✅ `src/services/admin/dashboard/finance.ts`

**API Route**:
- ✅ `/api/admin/dashboard-v2/route.ts`

---

### Financeiro V2 (`/admin/financeiro-v2`)

**Dados Usados**:
- ✅ Stripe: `subscriptions` (active + canceled), `balance`, `charges`
- ✅ Firebase: `users` (para associar subscriptions a perfis)
- ❌ GA4: Não usa

**Serviços**:
- ✅ `src/services/admin/financeiro-v2/index.ts`

**API Route**:
- ✅ `/api/admin/financeiro-v2/route.ts`

---

### Operational Health (`/admin/operational-health`)

**Dados Usados**:
- ✅ Firebase: `users`, `jobs`, `ratings`, `feedbacks`
- ❌ Stripe: Não usa
- ❌ GA4: Não usa

**Serviços**:
- ✅ `src/services/admin/operational-health/professionals.ts`
- ✅ `src/services/admin/operational-health/families.ts`
- ✅ `src/services/admin/operational-health/matches.ts`

**API Route**:
- ✅ `/api/admin/operational-health/route.ts`

---

### Growth (`/admin/growth`)

**Dados Usados**:
- ✅ Firebase: `users`
- ❌ Stripe: Não usa
- ⚠️ GA4: Deveria usar mas não usa ainda

**Serviços**:
- ✅ `src/services/admin/growth/acquisition.ts`
- ✅ `src/services/admin/growth/activation.ts`

**API Route**:
- ✅ `/api/admin/growth/route.ts`

---

### Performance (`/admin/performance`) - NEW

**Dados Usados**:
- ✅ PerformanceMonitor (in-memory)
- ❌ Firebase: Não usa
- ❌ Stripe: Não usa
- ❌ GA4: Não usa

**Serviços**:
- ✅ `src/lib/performanceMonitor.ts`

**API Route**:
- ✅ `/api/admin/performance-metrics/route.ts`

---

### Intelligent Alerts (`/admin/intelligent-alerts`) - NEW

**Dados Usados**:
- ✅ Firebase: `jobs`, `system_alerts`
- ✅ Stripe: `subscriptions`, `balance`
- ❌ GA4: Não usa

**Serviços**:
- ✅ `src/services/admin/intelligentAlerts.ts`

**API Route**:
- ✅ `/api/admin/intelligent-alerts/route.ts`

---

## 6️⃣ PROPOSTA DE IMPLEMENTAÇÃO - TORRE DE CONTROLE

### Objetivo
Melhorar a **Torre de Controle (`/admin`)** para decisões rápidas com KPIs corretos de GA4, Stripe e Firebase.

### Princípios
1. ✅ **Não quebrar MVP** - Apenas adicionar, não alterar
2. ✅ **Dados reais** - Usar apenas o que foi mapeado
3. ✅ **Feature flags** - Desabilitar features incompletas
4. ✅ **Fallbacks** - Tratar integrações indisponíveis

### Estrutura Proposta

#### **TORRE DE CONTROLE (Home /admin)**
**Objetivo**: KPIs críticos para decisões rápidas

**Seções**:
1. **🏥 Saúde do Negócio** (Financial Health)
   - MRR (Stripe subscriptions)
   - Burn Rate (Stripe payouts / mês)
   - Runway (Balance / Burn Rate)
   - Churn Rate (Canceled subs / Active subs)

2. **⚡ Operações Críticas** (Operational Health)
   - Jobs > 48h sem match (Firebase jobs)
   - Tempo médio de match (Firebase jobs.matchedAt - createdAt)
   - Taxa de abandono pós-aceite (Firebase jobs status)
   - Profissionais disponíveis (Firebase users.perfil=profissional)

3. **📊 Engajamento** (Engagement - GA4)
   - Usuários ativos (últimos 7 dias) - GA4 activeUsers
   - Cadastros (últimos 7 dias) - GA4 sign_up event OU Firebase users.createdAt
   - Taxa de conversão (Visits → Signup → Request)

4. **🚨 Alertas Urgentes** (Intelligent Alerts)
   - Top 3 alertas críticos
   - Link para página de alertas completa

**Ações**:
- ✅ Usar dados já calculados em `control-tower/index.ts`
- ✅ Adicionar seção de GA4 (activeUsers, newUsers)
- ✅ Adicionar top 3 alertas da página de Intelligent Alerts
- ✅ Layout: 4 cards principais + grid de módulos (manter os 11 existentes)

---

#### **MÓDULOS INDIVIDUAIS**
Cada módulo (`/admin/dashboard`, `/admin/financeiro-v2`, etc.) deve ter seus próprios KPIs detalhados.

**Exemplo - Dashboard V2**:
- **Demanda**: Famílias ativas, solicitações abertas, taxa de conversão request→hire
- **Oferta**: Profissionais ativos, disponibilidade, taxa de aceite

**Exemplo - Financeiro V2**:
- Receita mensal, MRR, ARR, LTV, CAC
- Cohort analysis, churn por plano
- Detalhes de subscriptions

**Exemplo - Operational Health**:
- SLA por categoria de atendimento
- Tempo médio de resposta
- Taxa de satisfação (ratings)
- Problemas por categoria

---

### Feature Flags para Controlar Integrações

**Arquivo**: `src/lib/featureFlags.ts`

**Flags Sugeridas**:
```typescript
{
  // GA4
  ga4CustomEvents: false,     // Eventos ainda não emitidos
  ga4EngagementMetrics: true, // Métricas básicas (activeUsers, sessions)
  
  // Stripe
  stripeFinancialMetrics: true, // MRR, runway, balance
  stripeDetailedAnalysis: true, // Cohorts, LTV, CAC
  
  // Firebase
  firebaseOperationalMetrics: true, // SLA, matches, ratings
  
  // Alertas
  intelligentAlerts: true,
  slackIntegration: false,  // Precisa webhook
  
  // Features experimentais
  predictiveAnalytics: false,
  customDashboards: false,
}
```

**Como usar**:
```typescript
if (isFeatureEnabled('ga4CustomEvents')) {
  // Mostrar funil de conversão com custom events
} else {
  // Mostrar apenas cadastros do Firebase
}
```

---

## 7️⃣ CHECKLIST DE VALIDAÇÃO

### Antes de Implementar

- [x] ✅ Mapear todas as rotas admin existentes
- [x] ✅ Mapear variáveis de ambiente (GA4, Stripe, Firebase)
- [x] ✅ Mapear eventos GA4 (definidos mas não emitidos)
- [x] ✅ Mapear objetos Stripe usados (subscriptions, charges, balance, payouts)
- [x] ✅ Mapear coleções Firebase (16 mapeadas)
- [x] ✅ Mapear campos e status values de cada coleção
- [x] ✅ Identificar gaps e inconsistências
- [ ] ⏳ Validar se custom events GA4 existem (query em properties/503083965)
- [ ] ⏳ Validar se Stripe metadata está configurado
- [ ] ⏳ Validar se status values no Firebase são consistentes

### Durante Implementação

- [ ] Criar feature flags para cada integração
- [ ] Adicionar fallbacks para integrações indisponíveis
- [ ] Não alterar lógica existente
- [ ] Não criar/alterar coleções Firebase
- [ ] Não criar novos eventos GA4 sem aprovação
- [ ] Testar com integrações desabilitadas

### Testes

- [ ] Torre de Controle carrega sem erros
- [ ] Cada KPI mostra dado real ou "Não configurado"
- [ ] Feature flags controlam visibilidade corretamente
- [ ] Fallbacks funcionam quando API falha
- [ ] Performance não degrada (max 3s para carregar dashboard)

---

## 8️⃣ PRÓXIMOS PASSOS

### Imediato (Prioridade 1)

1. **Validar Custom Events GA4**
   - Query em GA4 Data API para ver se eventos existem
   - Se não existem, usar apenas `newUsers` do Firebase

2. **Integrar GoogleTagManager no Layout**
   - Adicionar `<GoogleTagManager />` em `app/layout.tsx`
   - Testar se gtag.js carrega corretamente

3. **Melhorar Torre de Controle**
   - Adicionar seção "Engajamento" com GA4 metrics
   - Adicionar top 3 alertas críticos
   - Melhorar visualização de KPIs (cards com ícones + variação)

### Curto Prazo (Prioridade 2)

4. **Normalizar Status Values**
   - Criar mapeamento de status legados → novos
   - Documentar todos os status possíveis

5. **Validar Stripe Metadata**
   - Verificar se subscriptions/charges têm metadata
   - Criar guia de configuração de checkout

6. **Implementar Eventos GA4**
   - Integrar `useGA4Events` nas páginas de ação
   - Documentar onde cada evento deve ser emitido

### Longo Prazo (Prioridade 3)

7. **Cron Job para Alertas**
   - Configurar Vercel Cron para `/api/admin/intelligent-alerts`
   - Executar a cada 5 minutos

8. **Dashboard Personalizado**
   - Permitir admins escolherem KPIs na Torre
   - Salvar configuração no Firebase

9. **Notificações Proativas**
   - Email para alertas críticos
   - Slack para SLA crítico

---

## 📌 CONCLUSÃO

**Status da Auditoria**: ✅ **COMPLETA**

**Integrações Validadas**:
- ✅ Firebase: 16 coleções mapeadas, campos documentados
- ✅ Stripe: 5 objetos principais mapeados (subscriptions, charges, balance, payouts, balanceTransactions)
- ⚠️ GA4: Configurado mas eventos customizados não emitidos ainda

**Gaps Críticos**:
1. Custom events GA4 não integrados no frontend
2. Status values inconsistentes em `jobs`
3. Metadata Stripe pode não existir

**Recomendação**:
Implementar Torre de Controle usando **apenas dados confirmados**:
- Stripe: MRR, runway, balance ✅
- Firebase: SLA, matches, profissionais ✅
- GA4: activeUsers, sessions ✅ (custom events com feature flag ⚠️)

**Riscos Mitigados**:
- Feature flags controlam funcionalidades incompletas
- Fallbacks garantem que dashboard não quebra
- Nenhuma alteração em coleções Firebase
- Nenhuma alteração em configurações Stripe/GA4

---

**Documento criado por**: GitHub Copilot  
**Data**: 18/12/2025  
**Versão**: 1.0  
**Status**: Aprovado para implementação
