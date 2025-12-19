# 📋 INVENTÁRIO COMPLETO - TORRE DE CONTROLE V2

**Data:** 2025-01-XX  
**Autor:** Staff Engineer  
**Objetivo:** Documentar estado atual do painel admin para construção da Torre v2

---

## 📁 1. ARQUITETURA

### 1.1 Stack
- **Framework:** Next.js 16.0.10
- **Rendering:** Turbopack, App Router
- **Language:** TypeScript (strict mode)
- **UI:** Recharts (visualizações)

### 1.2 Admin Routes (12 páginas)
```
/admin/
├── page.tsx ⭐ (Torre de Controle atual - /api/admin/control-tower)
├── page-old.tsx ⚠️ DEPRECATED - DELETAR
├── layout.tsx (auth check via localStorage)
├── torre/ ⚠️ VAZIO (reservado para Torre v2?)
├── dashboard/page.tsx
├── operational-health/page.tsx
├── users/page.tsx
├── pipeline/page.tsx
├── growth/page.tsx
├── financeiro/page.tsx
├── financeiro-v2/page.tsx ⚠️ DUPLICADO?
├── alerts/page.tsx
├── intelligent-alerts/
├── service-desk/page.tsx
├── reports/page.tsx
├── qualidade/
├── performance/
└── login/page.tsx
```

### 1.3 API Routes (27 endpoints)
```
/api/admin/
├── control-tower/ ⭐ (Torre atual)
├── daily-metrics/ (views + signups diários)
├── dashboard-v2/
├── financeiro/
├── financeiro-v2/ ⚠️ DUPLICADO?
├── pipeline/
├── pipeline-v2/ ⚠️ DUPLICADO?
├── torre/ (overview, alerts, service-desk)
├── users/
├── growth/
├── operational-health/
├── reports/
├── service-desk/
├── audit-data/
└── health/
```

---

## 🔗 2. INTEGRAÇÕES

### 2.1 Google Analytics 4

**ENV Variables:**
- `GA4_PROPERTY_ID=503083965` (server-side reports)
- `NEXT_PUBLIC_GA4_ID=G-B21PK9JQYS` ⚠️ NÃO USADO (client tracking)
- `GOOGLE_APPLICATION_CREDENTIALS_JSON` (base64 credentials)

**SDK:**
- `@google-analytics/data` v5.2.1 (BetaAnalyticsDataClient)

**Arquivos:**
- `src/services/admin/analytics.ts` (cliente principal)
- `src/services/admin/analyticsService.ts` (wrapper)
- `src/app/api/admin/daily-metrics/route.ts` (views diárias)

**Eventos Disponíveis:**
- ✅ Automáticos: `page_view`, `session_start`, `first_visit`, `user_engagement`
- ❌ Customizados: NÃO IMPLEMENTADOS
  - `sign_up`, `contact_caregiver`, `payment_success`, `subscription_start`, `match_accepted`

**⚠️ PROBLEMAS IDENTIFICADOS:**
- Nenhum `gtag()` ou `logEvent()` no client-side
- Tracking de conversões impossível sem eventos customizados
- Funis de marketing não rastreáveis

**Métricas Server-Side:**
- `activeUsers`, `newUsers`, `sessions`, `screenPageViews`, `bounceRate`, `avgSessionDuration`
- Top pages, traffic sources, conversions via `runReport()`

---

### 2.2 Stripe

**ENV Variables:**
- `STRIPE_SECRET_KEY` (sk_live_*) **PRODUÇÃO**
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (pk_live_*)

**SDK:**
- `stripe` v2025-02-24.acacia

**Arquivo Principal:**
- `src/lib/server/stripe.ts` (getStripeClient singleton)

**Objetos Usados:**
- `stripe.subscriptions.list()` (6 usos - MRR, churn)
- `stripe.charges.list()` (3 usos - revenue)
- `stripe.refunds.list()` (1 uso - reembolsos)
- `stripe.payouts.list()` (1 uso - burn rate)
- `stripe.balance.retrieve()` (2 usos - saldo)
- `stripe.accounts.retrieve()` (1 uso - Stripe Connect)

**⚠️ PROBLEMAS IDENTIFICADOS:**
- Nenhum webhook implementado (`/api/stripe/webhook` não existe)
- Eventos Stripe NÃO processados em tempo real
  - `subscription.created`, `payment_intent.succeeded`, `customer.subscription.deleted`
- Workaround atual: polling periódico via Stripe API

**Relação com Firestore:**
- `users.stripeAccountId` (Stripe Connect Account ID)
- Subscriptions NÃO armazenadas no Firebase (sempre buscadas do Stripe)
- Stripe é "source of truth" para dados financeiros

**Produtos/Preços:**
- ❌ Não listados via API
- Configuração manual no Stripe Dashboard
- Dados extraídos via `subscription.items.data[0].price`

---

### 2.3 Firebase

**ENV Variables:**
- `FIREBASE_ADMIN_SERVICE_ACCOUNT` (base64 JSON)

**SDK:**
- `firebase-admin` (Firestore, Auth)

**Arquivo Principal:**
- `src/lib/server/firebaseAdmin.ts` (getFirebaseAdmin singleton)

**Coleções:**

#### **users**
```typescript
{
  perfil: 'profissional' | 'cliente',
  createdAt: Date,
  specialty / especialidade / especialidades[]: string,
  stripeAccountId: string,
  porcentagemPerfil: number,
  profileComplete: boolean
}
```

#### **jobs** (solicitações/appointments)
```typescript
{
  clientId / familyId: string,          // legacy fallback
  specialistId / professionalId: string, // legacy fallback
  status: 'open' | 'accepted' | 'scheduled' | 'completed' | 'canceled' | 'declined',
  createdAt: Date,
  acceptedAt?: Date,
  specialty / especialidade: string,
  paymentStatus: 'paid' | 'pending' | ...
}
```

#### **feedbacks**
```typescript
{
  rating: number,
  comment: string,
  createdAt: Date
}
```

#### **tickets** (service desk)
```typescript
{
  status: 'open' | 'in_progress' | 'resolved' | 'closed',
  createdAt: Date,
  firstResponseAt?: Date,
  resolvedAt?: Date,
  priority: string
}
```

**Relacionamentos:**
```
users (perfil='cliente')
  └─→ jobs.clientId (1:N)
       └─→ feedbacks (1:N)

users (perfil='profissional')
  └─→ jobs.specialistId (1:N)
       └─→ users.stripeAccountId (1:1)

tickets (standalone)
  └─→ userId (optional)
```

**⚠️ ÍNDICES AUSENTES:**
- `users`: `perfil ASC, createdAt DESC`
- `jobs`: `status ASC, createdAt DESC`
- `tickets`: `status ASC, createdAt DESC`
- **Workaround:** Código busca `.limit(500)` sem `orderBy` e filtra manualmente

---

## 🛠️ 3. SERVIÇOS (/services/admin/)

### 3.1 Estrutura de Pastas
```
/services/admin/
├── alerts/               (Intelligent Alerts System)
├── analytics.ts          (GA4 Data API client)
├── analyticsService.ts   (GA4 wrapper)
├── control-tower/ ⭐     (Torre atual)
│   ├── finance.ts        (MRR, burn rate, runway)
│   ├── operations.ts     (SLA, time to match, funnel)
│   ├── marketplace.ts    (profissionais, abandono)
│   ├── risk.ts           (ações urgentes, system health)
│   └── index.ts          (getControlTowerDashboard)
├── dashboard/            (Dashboard v2 modules)
├── finance.ts
├── financeiro-v2/ ⚠️     (Duplicate?)
├── growth/               (Acquisition, activation, retention)
├── operational-health/   (Professionals, families, matches)
├── overview/             (Executive KPIs, trends, alerts)
├── pipeline/ ⚠️          (Duplicate?)
├── pipeline-v2/          (Deals, velocity)
├── qualidade/
├── reports/              (Generator, scheduler, export)
├── retentionService.ts   (Engagement, churn, cohorts)
├── stripeService.ts      (Stripe metrics)
├── torre/ ⭐             (Torre v1 - legacy)
├── torre-v3/             (Empty - future?)
└── users/                (List, summaries)
```

### 3.2 Funções Exportadas (Top 20)

| Serviço | Função | Descrição |
|---------|--------|-----------|
| control-tower | `getControlTowerDashboard()` | Dashboard decisório atual |
| control-tower/finance | `getMonthRevenue()` | MRR mensal |
| control-tower/finance | `getBurnRate()` | Queima de caixa |
| control-tower/finance | `getRunway()` | Meses até zerar caixa |
| control-tower/finance | `getMRRAtRisk()` | MRR em risco de churn |
| control-tower/operations | `getRequestsBySLA()` | Atendimento por SLA |
| control-tower/operations | `getAverageTimeToMatch()` | Tempo médio até match |
| control-tower/operations | `getConversionFunnel()` | Funil de conversão |
| control-tower/marketplace | `getAvailableProfessionals()` | Profissionais disponíveis |
| control-tower/marketplace | `getPostAcceptAbandonment()` | Taxa abandono pós-aceite |
| operational-health | `getProfessionalHealth()` | Saúde dos profissionais |
| operational-health | `getFamilyHealth()` | Saúde das famílias |
| operational-health | `getMatchQuality()` | Qualidade dos matches |
| analytics | `getAnalyticsMetrics()` | GA4 tráfego e conversões |
| stripeService | `fetchStripeMetrics()` | Stripe financeiro |
| growth | `getGrowthDashboard()` | Aquisição, ativação, retenção |
| reports | `generateReport()` | Gerador de relatórios |
| alerts | `createAlert()` | Sistema de alertas inteligentes |
| users | `listUsers()` | Listagem de usuários |
| pipeline-v2 | `getPipelineDashboard()` | Pipeline de vendas v2 |

### 3.3 Queries Principais

**GA4:**
- `runReport()` com métricas: `activeUsers`, `sessions`, `screenPageViews`, `bounceRate`
- Dimensões: `eventName`, `pagePath`, `sourceMedia`, `deviceCategory`

**Stripe:**
- `subscriptions.list({ status: 'active' })` → MRR
- `charges.list({ created: { gte: timestamp } })` → Revenue
- `payouts.list({ created: { gte: timestamp } })` → Burn rate

**Firebase:**
- `collection('users').where('perfil', '==', 'profissional|cliente')`
- `collection('jobs').where('status', 'in', [...statuses])`
- `collection('tickets').orderBy('createdAt', 'desc')`

---

## 🚨 4. PROBLEMAS IDENTIFICADOS

### 4.1 Arquivos Duplicados
- ⚠️ `page-old.tsx` (deprecated)
- ⚠️ `financeiro/` vs `financeiro-v2/`
- ⚠️ `pipeline/` vs `pipeline-v2/`
- ⚠️ `torre/` (vazio) vs `control-tower/` vs `torre-v3/`

### 4.2 Integração GA4
- ❌ Tracking client-side NÃO implementado (sem gtag.js/GTM)
- ❌ Eventos customizados ausentes (sign_up, purchase, etc)
- ❌ Funis de conversão impossíveis sem tracking

### 4.3 Integração Stripe
- ❌ Webhooks NÃO implementados
- ❌ Eventos Stripe processados via polling (ineficiente)
- ❌ Produtos/preços não listados via API

### 4.4 Integração Firebase
- ❌ Índices compostos ausentes (queries filtram manualmente)
- ⚠️ Uso de `.limit(500)` sem pagination (pode perder dados)
- ⚠️ Legacy field fallbacks (`familyId→clientId`, `professionalId→specialistId`)

### 4.5 Torre Atual (control-tower)
- ✅ Funcional mas complexa
- ⚠️ Auto-refresh 60s (pode sobrecarregar)
- ⚠️ Mistura lógica de negócio com queries (dificulta testes)
- ⚠️ Não usa cache (busca tudo a cada request)

---

## 🎯 5. RECOMENDAÇÕES PARA TORRE V2

### 5.1 Arquitetura
- ✅ Manter control-tower como base (funcionando)
- ✅ Adicionar camada de cache (Redis/Vercel KV)
- ✅ Separar queries (services) de lógica (controllers)
- ✅ Implementar pagination nas queries Firebase

### 5.2 Integrações
**GA4:**
- 🔴 CRÍTICO: Implementar GTM/gtag.js no layout.tsx
- 🔴 CRÍTICO: Adicionar tracking de eventos customizados
- 🟡 Criar funis de conversão (sign_up → contact → payment)

**Stripe:**
- 🟡 Implementar webhooks (`/api/stripe/webhook`)
- 🟡 Processar eventos em tempo real
- 🟢 Listar produtos/preços via API (opcional)

**Firebase:**
- 🔴 Criar índices compostos (perfil+createdAt, status+createdAt)
- 🟡 Implementar pagination cursor-based
- 🟢 Remover legacy field fallbacks (já corrigido)

### 5.3 Limpeza
- 🔴 DELETAR: `page-old.tsx`
- 🟡 AVALIAR: `financeiro` vs `financeiro-v2` (qual manter?)
- 🟡 AVALIAR: `pipeline` vs `pipeline-v2` (qual manter?)
- 🟡 AVALIAR: `torre/` vazio (usar para v2 ou deletar?)
- 🟡 AVALIAR: `torre-v3/` vazio (deletar?)

### 5.4 Observability
- ✅ Logging estruturado (já existe via console.log)
- ✅ Error tracking (adicionar Sentry?)
- ✅ Performance monitoring (Vercel Analytics?)
- ✅ Feature flags (LaunchDarkly/Vercel?)

---

## 📚 6. DOCUMENTOS DE REFERÊNCIA

**Já Existentes:**
- `AUDITORIA_TORRE_CONTROLE.md` (auditoria anterior)
- `EVENTOS_GA4.md` (taxonomia de eventos)
- `ANALISE_INTEGRACOES.md` (credenciais e setup)
- `INTEGRATION_SUMMARY.md` (resumo de integrações)
- `ESTRUTURA_COMPLETA.md` (estrutura de pastas)

**Novos (a criar):**
- `TORRE_V2_ROADMAP.md` (fases 2-8 detalhadas)
- `KPIS_DEFINITION.md` (KPIs da Torre v2)
- `FUNNELS_DEFINITION.md` (funis de conversão)
- `ALERTS_DEFINITION.md` (regras de alertas)

---

## ✅ STATUS DA FASE 1

**CONCLUÍDO:**
- ✅ 1.1 Mapeamento de Rotas (12 páginas, 27 APIs)
- ✅ 1.2 Auditoria GA4 (env vars, cliente, eventos, pipeline)
- ✅ 1.3 Auditoria Stripe (env vars, objetos, webhooks, relação Firebase)
- ✅ 1.4 Auditoria Firebase (coleções, campos, status, relacionamentos, índices)
- ✅ 1.5 Auditoria Serviços (19 pastas, 70+ funções exportadas)

**PRÓXIMOS PASSOS:**
- Fase 2: Definir KPIs, Funis e Alertas da Torre v2
- Fase 3: Implementar serviços de integração
- Fase 4: Criar API routes
- Fase 5: Construir frontend Torre v2
- Fase 6: Adicionar observability
- Fase 7: Documentar e rollout

---

**Data de Criação:** 2025-01-XX  
**Última Atualização:** 2025-01-XX  
**Autor:** Staff Engineer  
**Status:** ✅ COMPLETO
