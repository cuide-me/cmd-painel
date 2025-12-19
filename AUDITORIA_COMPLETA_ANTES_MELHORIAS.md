# 🔍 AUDITORIA COMPLETA DO PAINEL ADMINISTRATIVO

**Data:** 19 de Dezembro de 2025  
**Objetivo:** Mapear TUDO antes de implementar melhorias  
**Status:** ✅ AUDITORIA CONCLUÍDA

---

## 📋 ÍNDICE

1. [Rotas Administrativas](#1-rotas-administrativas)
2. [Integrações](#2-integrações)
3. [Firebase Collections](#3-firebase-collections)
4. [Google Analytics 4](#4-google-analytics-4)
5. [Stripe](#5-stripe)
6. [KPIs Existentes](#6-kpis-existentes)
7. [Problemas Identificados](#7-problemas-identificados)
8. [Oportunidades de Melhoria](#8-oportunidades-de-melhoria)

---

## 1. ROTAS ADMINISTRATIVAS

### 🏠 **Torre de Controle** (`/admin` - PÁGINA PRINCIPAL)

**Arquivo:** `src/app/admin/page.tsx`  
**Papel:** Dashboard decisório - responde em 5 segundos:
1. Estamos ganhando ou perdendo dinheiro?
2. Onde está o gargalo agora?
3. O que vai virar problema se eu não agir hoje?

**APIs Consumidas:**
- ❌ `/api/admin/control-tower` - **NÃO EXISTE** (rota comentada no código)
- ✅ `/api/admin/daily-metrics` - Views + Signups diários

**KPIs Exibidos:**
```typescript
// FINANCEIRO (Stripe)
- MRR (Monthly Recurring Revenue)
- Burn Rate
- Runway (meses)

// OPERACIONAL (Firebase)
- Profissionais Disponíveis
- SLA de Atendimento
- Taxa de Abandono

// GROWTH (GA4)
- Visitantes Únicos
- Taxa de Conversão
- CAC (Customer Acquisition Cost)

// QUALIDADE (Firebase)
- NPS Score
- Tickets Abertos
- Tempo Médio de Resposta
```

**Status:** ⚠️ **PARCIALMENTE IMPLEMENTADO**
- ✅ Gráficos diários funcionando
- ❌ API `/api/admin/control-tower` não existe
- ❌ Dashboard mostra dados mock/hardcoded

---

### 📁 **Páginas Disponíveis**

| Rota | Arquivo | APIs | Status |
|------|---------|------|--------|
| `/admin` | `page.tsx` | `daily-metrics` | ⚠️ Parcial |
| `/admin/login` | `login/page.tsx` | - | ✅ OK |
| `/admin/users` | `users/page.tsx` | `/api/admin/users` | ✅ OK |
| `/admin/growth-v2` | `growth-v2/` | - | ❌ Pasta vazia |
| `/admin/quality-v2` | `quality-v2/` | - | ❌ Pasta vazia |
| `/admin/ops-v2` | `ops-v2/` | - | ❌ Pasta vazia |
| `/admin/torre-v2` | `torre-v2/` | - | ❌ Pasta vazia |

**Observação:** Todas as pastas `-v2` estão **VAZIAS** (preparadas para implementação futura)

---

### 🔌 **APIs Administrativas Existentes**

| API Route | Arquivo | Fontes de Dados | Status |
|-----------|---------|-----------------|--------|
| `/api/admin/analytics` | `analytics/route.ts` | GA4 | ✅ OK |
| `/api/admin/auditoria-especialidades` | `auditoria-especialidades/route.ts` | Firebase (users) | ✅ OK |
| `/api/admin/auditoria-profissionais` | `auditoria-profissionais/route.ts` | Firebase (users) | ✅ OK |
| `/api/admin/cruzamento-stripe-firebase` | `cruzamento-stripe-firebase/route.ts` | Stripe + Firebase | ✅ OK |
| `/api/admin/daily-metrics` | `daily-metrics/route.ts` | GA4 + Firebase | ✅ OK |
| `/api/admin/dashboard-v2` | `dashboard-v2/route.ts` | Firebase | ✅ OK |
| `/api/admin/financeiro` | `financeiro/route.ts` | Stripe | ✅ OK |
| `/api/admin/pipeline-v2` | `pipeline-v2/route.ts` | Firebase | ✅ OK |
| `/api/admin/torre-stats` | `torre-stats/route.ts` | Firebase + Stripe | ✅ OK |
| `/api/admin/users` | `users/route.ts` | Firebase | ✅ OK |
| `/api/health` | `health/route.ts` | Todas | ✅ OK |

**Total:** 11 APIs ativas

---

## 2. INTEGRAÇÕES

### 🔥 **Firebase**

**Variáveis de Ambiente:**
```bash
# Admin SDK (Server-side)
FIREBASE_ADMIN_SERVICE_ACCOUNT=<base64_json>  # ✅ Configurado
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@plataforma-cuide-me.iam.gserviceaccount.com  # ✅ Configurado
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."  # ✅ Configurado
FIREBASE_PROJECT_ID=plataforma-cuide-me  # ✅ Configurado

# Client SDK (Client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...  # ✅ Configurado
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=plataforma-cuide-me.firebaseapp.com  # ✅ Configurado
NEXT_PUBLIC_FIREBASE_PROJECT_ID=plataforma-cuide-me  # ✅ Configurado
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=plataforma-cuide-me.appspot.com  # ✅ Configurado
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123...  # ✅ Configurado
NEXT_PUBLIC_FIREBASE_APP_ID=1:123...  # ✅ Configurado
```

**Status:** ✅ **TOTALMENTE CONFIGURADO**

**Arquivo de Inicialização:**
- Admin: `src/lib/server/firebaseAdmin.ts`
- Client: `src/firebase/firebaseApp.ts`

---

### 📊 **Google Analytics 4**

**Variáveis de Ambiente:**
```bash
GA4_PROPERTY_ID=503083965  # ✅ Configurado
NEXT_PUBLIC_GA4_ID=G-B21PK9JQYS  # ✅ Configurado
GOOGLE_APPLICATION_CREDENTIALS_JSON=<base64_service_account>  # ✅ Configurado
```

**Status:** ⚠️ **SERVER-SIDE OK, CLIENT-SIDE INCOMPLETO**

**Cliente:**
```typescript
// src/services/admin/analytics.ts
import { BetaAnalyticsDataClient } from '@google-analytics/data';
```

**Métricas Disponíveis (via runReport):**
- `activeUsers`
- `newUsers`
- `sessions`
- `screenPageViews`
- `bounceRate`
- `averageSessionDuration`
- `conversions`

**⚠️ PROBLEMA CRÍTICO:** Nenhum tracking client-side implementado
- ❌ Sem `gtag.js` ou `Google Tag Manager`
- ❌ Sem eventos customizados (`sign_up`, `contact_caregiver`, `payment_success`)
- ✅ Apenas pageviews automáticos capturados

---

### 💳 **Stripe**

**Variáveis de Ambiente:**
```bash
STRIPE_SECRET_KEY=sk_live_...  # ✅ Configurado (PRODUÇÃO)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...  # ✅ Configurado
```

**Status:** ✅ **TOTALMENTE CONFIGURADO**

**API Version:** `2025-02-24.acacia`

**Arquivo de Inicialização:** `src/lib/server/stripe.ts`

**Objetos Utilizados:**
```typescript
stripe.subscriptions.list()  // ✅ Usado em finance.ts
stripe.charges.list()        // ✅ Usado em financeiro.ts
stripe.payouts.list()        // ✅ Usado em financeiro.ts
stripe.refunds.list()        // ✅ Usado em stripeService.ts
```

**⚠️ Objetos NÃO Utilizados (mas disponíveis):**
- `stripe.checkout.sessions` - Checkout sessions
- `stripe.customers` - Dados de clientes
- `stripe.invoices` - Faturas
- `stripe.paymentIntents` - Intenções de pagamento
- `stripe.disputes` - Disputas/chargebacks

---

## 3. FIREBASE COLLECTIONS

### 📦 **Collections Existentes**

#### 🧑 **users** (192 documentos)
**Campos Reais:**
```typescript
{
  perfil: 'profissional' | 'cliente',  // ✅ NOVO schema
  userType: 'professional' | 'family',  // ⚠️ LEGADO (ainda existe)
  nome: string,
  email: string,
  telefone: string,
  cpf: string,
  createdAt: string | Timestamp,  // ⚠️ AMBOS formatos
  status?: 'ativo' | 'inativo' | 'pendente',
  especialidades?: string[],  // apenas profissionais
  disponibilidade?: boolean,  // apenas profissionais
  // ... outros campos
}
```

**Distribuição:**
- 183 profissionais (`perfil == 'profissional'`)
- 8 clientes (`perfil == 'cliente'`)
- 1 admin/outro

**Queries Usadas:**
```typescript
db.collection('users').where('perfil', '==', 'profissional')
db.collection('users').where('perfil', '==', 'cliente')
db.collection('users').where('perfil', '!=', 'profissional')  // demanda
```

---

#### 💼 **jobs** (1+ documentos)
**Campos Reais:**
```typescript
{
  clientId: string,           // ✅ NOVO schema
  familyId?: string,          // ⚠️ LEGADO (fallback)
  specialistId?: string,      // ✅ NOVO schema
  professionalId?: string,    // ⚠️ LEGADO (fallback)
  status: 'pending' | 'active' | 'completed' | 'cancelled',
  createdAt: string | Timestamp,  // ⚠️ AMBOS formatos
  scheduledAt?: string | Timestamp,
  completedAt?: string | Timestamp,
  // ... outros campos
}
```

**⚠️ PROBLEMA:** Collection muito pequena (apenas 1 doc)
- Pode indicar dados de teste
- Ou uso de outra collection (verificar schema legado `requests`)

**Queries Usadas:**
```typescript
db.collection('jobs').where('status', 'in', ['pending', 'active'])
db.collection('jobs').where('specialistId', '==', userId)
db.collection('jobs').where('clientId', '==', userId)
```

---

#### 🎫 **tickets** (quantidade desconhecida)
**Campos Presumidos:**
```typescript
{
  userId: string,
  type: 'suporte' | 'reclamacao' | 'duvida',
  status: 'open' | 'pending' | 'in_progress' | 'resolved' | 'closed',
  priority: 'baixa' | 'media' | 'alta' | 'urgente',
  createdAt: string | Timestamp,
  resolvedAt?: string | Timestamp,
  description: string,
  // ... outros campos
}
```

**Queries Usadas:**
```typescript
db.collection('tickets').where('status', 'in', ['open', 'pending', 'in_progress'])
```

---

#### 💬 **feedbacks** (quantidade desconhecida)
**Campos Presumidos:**
```typescript
{
  jobId: string,
  userId: string,
  rating: number,  // 1-5
  comment?: string,
  createdAt: string | Timestamp,
  // ... outros campos
}
```

**Queries Usadas:**
```typescript
db.collection('feedbacks').get()
```

---

### ⚠️ **PROBLEMAS DE SCHEMA**

#### 1. **Dualidade de Formatos de Data**
```typescript
// ❌ Código usa .toDate() mas dados são strings ISO
createdAt.toDate()  // Error se createdAt = "2025-12-19T10:00:00Z"

// ✅ Solução implementada
import { toDate } from '@/lib/dateUtils';
toDate(createdAt)  // Funciona com ambos
```

**Status:** ✅ **RESOLVIDO** (50+ correções aplicadas)

---

#### 2. **Dualidade de Nomes de Campos**
```typescript
// Código deve suportar AMBOS schemas
const profId = job.specialistId || job.professionalId;  // ✅ Correto
const clienteId = job.clientId || job.familyId;          // ✅ Correto
const tipo = user.perfil || user.userType;               // ✅ Correto
```

**Status:** ✅ **RESOLVIDO** (20+ fallbacks adicionados)

---

## 4. GOOGLE ANALYTICS 4

### 📈 **Métricas Server-Side (Funcionando)**

**Arquivo:** `src/services/admin/analytics.ts`

```typescript
// ✅ MÉTRICAS DISPONÍVEIS via runReport()
{
  totalUsers: number,           // Usuários totais
  newUsers: number,             // Novos usuários
  sessions: number,             // Sessões
  pageViews: number,            // Visualizações de página
  avgSessionDuration: number,   // Duração média (segundos)
  bounceRate: number,           // Taxa de rejeição (%)
  conversions: number,          // Conversões totais
  conversionRate: number,       // Taxa de conversão (%)
  topPages: Array<{
    path: string,
    views: number,
    uniqueUsers: number
  }>,
  trafficSources: Array<{
    source: string,
    medium: string,
    users: number,
    sessions: number
  }>
}
```

---

### ⚠️ **Eventos Client-Side (NÃO IMPLEMENTADOS)**

**Status:** ❌ **CRITICAL - NENHUM TRACKING CLIENT-SIDE**

**Eventos Esperados (NÃO EXISTEM):**
```typescript
// ❌ Cadastro
gtag('event', 'sign_up', {
  method: 'email'
});

// ❌ Criar Solicitação
gtag('event', 'contact_caregiver', {
  job_id: 'xxx',
  caregiver_type: 'xxx'
});

// ❌ Match Aceito
gtag('event', 'match_accepted', {
  job_id: 'xxx',
  professional_id: 'xxx'
});

// ❌ Pagamento
gtag('event', 'payment_success', {
  value: 100.00,
  currency: 'BRL',
  transaction_id: 'xxx'
});

// ❌ Assinatura
gtag('event', 'subscription_start', {
  plan: 'premium',
  value: 299.00
});
```

**Impacto:**
- ❌ Impossível criar funis de conversão precisos
- ❌ Impossível rastrear origem de cadastros
- ❌ Impossível calcular CAC por canal
- ❌ Impossível medir efetividade de campanhas
- ✅ Apenas pageviews automáticos disponíveis

**Solução Necessária:**
1. Adicionar Google Tag Manager no `layout.tsx`
2. Implementar eventos customizados nos componentes
3. Configurar conversões no GA4

---

## 5. STRIPE

### 💰 **Objetos Utilizados**

#### ✅ **subscriptions**
```typescript
// src/services/admin/finance.ts
const activeSubscriptions = await stripe.subscriptions.list({
  status: 'active',
  limit: 100
});

// Métricas calculadas:
- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)
- Active Subscriptions Count
- Churn Rate
```

---

#### ✅ **charges**
```typescript
// src/services/admin/financeiro.ts
const charges = await stripe.charges.list({
  limit: 100,
  created: { gte: timestamp }
});

// Métricas calculadas:
- Total Revenue
- Successful Payments
- Failed Payments
- Average Transaction Value
```

---

#### ✅ **payouts**
```typescript
// src/app/api/admin/financeiro/route.ts
const payouts = await stripe.payouts.list({
  limit: 10
});

// Usado para:
- Pending Payouts
- Payout History
- Balance Tracking
```

---

#### ✅ **refunds**
```typescript
// src/services/admin/stripeService.ts
const refunds = await stripe.refunds.list({
  limit: 100,
  created: created
});

// Métricas calculadas:
- Refunded Amount
- Refund Rate
```

---

### 🆕 **Objetos NÃO Utilizados (Oportunidades)**

#### ❌ **checkout.sessions**
```typescript
// Potencial uso:
stripe.checkout.sessions.list()

// Métricas possíveis:
- Taxa de conversão do checkout
- Abandono de carrinho
- Tempo médio até conversão
```

---

#### ❌ **customers**
```typescript
// Potencial uso:
stripe.customers.list()
stripe.customers.retrieve(id)

// Métricas possíveis:
- Customer Lifetime Value (LTV)
- Customers por status
- Métodos de pagamento salvos
```

---

#### ❌ **invoices**
```typescript
// Potencial uso:
stripe.invoices.list({ status: 'open' })

// Métricas possíveis:
- Faturas em aberto
- Faturas vencidas (Days Sales Outstanding)
- Taxa de pagamento no prazo
```

---

#### ❌ **paymentIntents**
```typescript
// Potencial uso:
stripe.paymentIntents.list()

// Métricas possíveis:
- Tentativas de pagamento
- Falhas por tipo de erro
- Conversão payment_intent → succeeded
```

---

#### ❌ **disputes**
```typescript
// Potencial uso:
stripe.disputes.list()

// Métricas possíveis:
- Chargebacks
- Disputas ganhas/perdidas
- Impacto financeiro
```

---

## 6. KPIS EXISTENTES

### 💰 **FINANCEIROS** (Stripe)

#### ✅ Implementados
```typescript
MRR (Monthly Recurring Revenue)
- Fonte: stripe.subscriptions.list({ status: 'active' })
- Cálculo: Soma de subscription.plan.amount / 100
- Localização: src/services/admin/finance.ts

Total Revenue
- Fonte: stripe.charges.list({ status: 'succeeded' })
- Cálculo: Soma de charge.amount / 100
- Localização: src/services/admin/stripeService.ts

Active Subscriptions
- Fonte: stripe.subscriptions.list({ status: 'active' })
- Cálculo: subscriptions.data.length
- Localização: src/services/admin/finance.ts

Churn Rate
- Fonte: stripe.subscriptions.list() com filtros de data
- Cálculo: (canceladas / ativas_início_período) * 100
- Localização: src/services/admin/finance.ts
```

#### ❌ NÃO Implementados (mas possíveis)
```typescript
ARR (Annual Recurring Revenue)
- MRR * 12

Quick Ratio
- (New MRR + Expansion MRR) / (Churned MRR + Contraction MRR)

NRR (Net Revenue Retention)
- Retenção de receita líquida

LTV (Lifetime Value)
- Valor médio * tempo médio de retenção

CAC Payback Period
- Meses até recuperar custo de aquisição

Burn Rate
- (Receita - Despesas) / mês

Runway
- Caixa atual / Burn Rate
```

---

### 👥 **OPERACIONAIS** (Firebase)

#### ✅ Implementados
```typescript
Total Users
- Fonte: db.collection('users').get()
- Localização: src/services/admin/users/index.ts

Profissionais Ativos
- Fonte: db.collection('users').where('perfil', '==', 'profissional')
- Localização: src/services/admin/dashboard/professionals.ts

Clientes Ativos
- Fonte: db.collection('users').where('perfil', '==', 'cliente')
- Localização: src/services/admin/dashboard/families.ts

Jobs Ativos
- Fonte: db.collection('jobs').where('status', 'in', ['pending', 'active'])
- Localização: src/services/admin/dashboard/demanda.ts
```

#### ❌ NÃO Implementados (mas possíveis)
```typescript
SLA de Atendimento
- Tempo médio entre job.createdAt → job.acceptedAt
- Percentual < 24h

Taxa de Abandono
- Jobs criados vs jobs aceitos
- Jobs aceitos vs jobs completados

Profissionais Disponíveis
- .where('disponibilidade', '==', true)
- Excluir profissionais em atendimento

Taxa de Match
- Propostas enviadas / Propostas aceitas

Tempo Médio de Resposta (Tickets)
- ticket.createdAt → ticket.firstResponseAt

Tickets em Atraso
- ticket.status != 'resolved' && (hoje - createdAt) > SLA
```

---

### 📊 **GROWTH** (GA4 + Firebase)

#### ✅ Implementados
```typescript
Visitantes Únicos
- Fonte: GA4 runReport({ metrics: [{ name: 'totalUsers' }] })
- Localização: src/services/admin/analytics.ts

Pageviews
- Fonte: GA4 runReport({ metrics: [{ name: 'screenPageViews' }] })
- Localização: src/app/api/admin/daily-metrics/route.ts

Cadastros Diários
- Fonte: Firebase users collection (contagem por createdAt)
- Localização: src/app/api/admin/daily-metrics/route.ts
```

#### ❌ NÃO Implementados (mas possíveis)
```typescript
Taxa de Conversão (Visitante → Cadastro)
- (Cadastros / Visitantes Únicos) * 100
- PROBLEMA: Sem tracking de eventos, apenas estimate

CAC (Customer Acquisition Cost)
- Investimento Marketing / Novos Clientes
- PROBLEMA: Precisa de dados de investimento externo

Taxa de Ativação
- Usuários que completaram perfil / Total cadastros
- PROBLEMA: Precisa de evento 'profile_complete'

Funil de Conversão
- Visitante → Cadastro → Perfil Completo → Primeiro Job → Match → Pagamento
- PROBLEMA: Faltam eventos GA4

Origem dos Cadastros
- Por canal (Orgânico, Pago, Direto, Referral)
- PROBLEMA: Sem eventos de cadastro com utm_source
```

---

### 🎯 **QUALIDADE** (Firebase)

#### ✅ Implementados
```typescript
// Nenhum KPI de qualidade implementado atualmente
```

#### ❌ NÃO Implementados (mas possíveis)
```typescript
NPS Score
- Fonte: feedbacks collection (rating)
- Cálculo: (Promotores - Detratores) / Total * 100
- Promotores: rating >= 4
- Neutros: rating == 3
- Detratores: rating <= 2

Tickets Abertos
- Fonte: tickets.where('status', 'in', ['open', 'pending', 'in_progress'])

Tickets em Atraso
- Fonte: tickets.where('status', '!=', 'resolved')
- Filtro: (hoje - createdAt) > SLA

Tempo Médio de Resolução
- Média de (ticket.resolvedAt - ticket.createdAt)

Taxa de Reincidência
- Usuários com múltiplos tickets no período

CSAT (Customer Satisfaction Score)
- Média de ratings (feedbacks)
```

---

## 7. PROBLEMAS IDENTIFICADOS

### 🔴 **CRÍTICOS**

#### 1. **Torre de Controle Incompleta**
**Problema:**
- Página `/admin` não tem API real (`/api/admin/control-tower` não existe)
- Dashboard mostra dados hardcoded/mock
- Não responde as 3 perguntas chave:
  1. ✅ Estamos ganhando ou perdendo dinheiro? → **Parcial** (MRR existe)
  2. ❌ Onde está o gargalo agora? → **Falta**
  3. ❌ O que vai virar problema se eu não agir hoje? → **Falta**

**Impacto:** Time não tem visibilidade de alertas críticos

**Solução:** Criar `/api/admin/control-tower` com dados reais

---

#### 2. **Tracking GA4 Ausente**
**Problema:**
- Nenhum evento client-side (`sign_up`, `contact_caregiver`, `payment_success`)
- Impossível criar funis de conversão
- Impossível atribuir origem de cadastros
- Impossível medir CAC por canal

**Impacto:** Decisões de marketing sem dados confiáveis

**Solução:** Implementar Google Tag Manager + eventos customizados

---

#### 3. **Falta Sistema de Alertas**
**Problema:**
- Nenhum alerta operacional implementado
- Nenhum alerta financeiro implementado
- SLA violations não monitorados
- Churn risk não identificado

**Impacto:** Problemas só descobertos quando já causaram prejuízo

**Solução:** Criar sistema de alertas com thresholds

---

### 🟡 **IMPORTANTES**

#### 4. **KPIs de Qualidade Ausentes**
**Problema:**
- NPS não calculado (feedbacks collection existe mas não usado)
- Tickets não monitorados (collection existe mas não usado)
- CSAT não implementado

**Impacto:** Qualidade do serviço não medida

**Solução:** Implementar dashboard de qualidade

---

#### 5. **Funil Incompleto**
**Problema:**
- Apenas inicio (visitantes) e fim (cadastros)
- Faltam etapas intermediárias:
  - Visualizou perfil profissional
  - Iniciou criação de job
  - Enviou proposta
  - Aceitou match
  - Realizou pagamento

**Impacto:** Não sabemos onde usuários desistem

**Solução:** Implementar tracking completo do funil

---

#### 6. **Métricas Financeiras Limitadas**
**Problema:**
- Apenas MRR e Revenue total
- Faltam métricas estratégicas:
  - Quick Ratio
  - NRR (Net Revenue Retention)
  - LTV:CAC ratio
  - Burn Rate
  - Runway

**Impacto:** Visão financeira incompleta

**Solução:** Implementar métricas avançadas usando Stripe

---

### 🟢 **MELHORIAS**

#### 7. **Páginas V2 Vazias**
**Problema:**
- `/admin/growth-v2` - pasta vazia
- `/admin/quality-v2` - pasta vazia
- `/admin/ops-v2` - pasta vazia
- `/admin/torre-v2` - pasta vazia

**Impacto:** Arquitetura preparada mas não implementada

**Solução:** Implementar páginas detalhadas

---

#### 8. **Objetos Stripe Subutilizados**
**Problema:**
- `checkout.sessions` - não usado (abandono de carrinho)
- `customers` - não usado (LTV)
- `invoices` - não usado (DSO)
- `paymentIntents` - não usado (falhas)
- `disputes` - não usado (chargebacks)

**Impacto:** Dados valiosos não utilizados

**Solução:** Criar dashboards específicos

---

## 8. OPORTUNIDADES DE MELHORIA

### 🎯 **PRIORIDADE MÁXIMA**

#### 1. **Completar Torre de Controle**
**O que fazer:**
- ✅ Criar `/api/admin/control-tower` com dados reais
- ✅ Implementar cálculo de **Burn Rate** e **Runway**
- ✅ Implementar **Sistema de Alertas**:
  - 🔴 MRR caindo > 10% (financeiro)
  - 🔴 SLA violations > 20% (operacional)
  - 🔴 Tickets em atraso > 10 (qualidade)
  - 🟡 Taxa de abandono > 30% (operacional)
  - 🟡 Churn > 5% (financeiro)
  - 🟡 NPS < 50 (qualidade)

**Fontes de Dados:**
- Stripe: MRR, Revenue, Churn
- Firebase: SLA, Abandono, Tickets
- GA4: Tráfego, Conversão

**Não precisa inventar:** Tudo já existe nas collections

---

#### 2. **Implementar Tracking GA4**
**O que fazer:**
- ✅ Adicionar Google Tag Manager no `layout.tsx`
- ✅ Implementar eventos críticos:
  ```typescript
  gtag('event', 'sign_up', { method: 'email' })
  gtag('event', 'profile_complete', { user_type: 'family' })
  gtag('event', 'contact_caregiver', { job_id: 'xxx' })
  gtag('event', 'match_accepted', { job_id: 'xxx' })
  gtag('event', 'payment_success', { value: 100, currency: 'BRL' })
  ```
- ✅ Configurar conversões no GA4 Admin

**Impacto:**
- Funis de conversão funcionais
- Atribuição de origem (utm_source)
- CAC por canal preciso

---

#### 3. **Dashboard de Qualidade**
**O que fazer:**
- ✅ Criar `/api/admin/quality` usando `feedbacks` + `tickets`
- ✅ Implementar KPIs:
  - NPS Score (promotores vs detratores)
  - CSAT (média de ratings)
  - Tickets abertos/em atraso
  - Tempo médio de resolução
  - Taxa de reincidência

**Fontes de Dados:**
- Firebase `feedbacks` collection (já existe)
- Firebase `tickets` collection (já existe)

**Não precisa inventar:** Collections já criadas

---

### 🚀 **PRIORIDADE ALTA**

#### 4. **Métricas Financeiras Avançadas**
**O que fazer:**
- ✅ Implementar via Stripe:
  - Quick Ratio: `(New MRR + Expansion MRR) / (Churned MRR + Contraction MRR)`
  - NRR: Net Revenue Retention
  - LTV: Lifetime Value
  - ARR: Annual Recurring Revenue (MRR * 12)
  - DSO: Days Sales Outstanding (via `invoices`)

**Fonte:** Apenas Stripe (subscription events)

---

#### 5. **Funil Completo de Conversão**
**O que fazer:**
- ✅ Mapear etapas:
  1. Visitante (GA4)
  2. Cadastro (Firebase users)
  3. Perfil Completo (user.profileComplete)
  4. Primeiro Job (Firebase jobs)
  5. Match Aceito (job.status == 'active')
  6. Pagamento (Stripe charge)
- ✅ Calcular conversão entre etapas
- ✅ Identificar maiores drop-offs

**Fontes:** GA4 + Firebase + Stripe

---

#### 6. **Dashboard de Abandono**
**O que fazer:**
- ✅ Taxa de abandono de jobs
- ✅ Taxa de abandono de checkout
- ✅ Tempo médio até abandono
- ✅ Razões de abandono (via tickets?)

**Fontes:**
- Firebase: jobs criados vs aceitos
- Stripe: checkout.sessions criadas vs succeeded

---

### 💡 **PRIORIDADE MÉDIA**

#### 7. **Páginas V2 Detalhadas**
**O que fazer:**
- `/admin/growth-v2`: Funil, CAC, LTV, Channels
- `/admin/quality-v2`: NPS, CSAT, Tickets, Reincidência
- `/admin/ops-v2`: SLA, Disponibilidade, Matches, Capacidade
- `/admin/torre-v2`: Visão consolidada (links para páginas acima)

**Arquitetura:**
- Torre = KPIs críticos de decisão
- Páginas V2 = Drill-down detalhado

---

#### 8. **Alertas Preditivos**
**O que fazer:**
- ✅ Churn Risk Score (baseado em comportamento)
- ✅ SLA Violation Prediction (baseado em volume)
- ✅ Runway Alert (antes de acabar o caixa)
- ✅ Capacity Alert (profissionais vs demanda)

**Fontes:** Firebase + Stripe (análise de tendências)

---

#### 9. **Dashboards Stripe Avançados**
**O que fazer:**
- ✅ Abandono de Checkout (`checkout.sessions`)
- ✅ LTV por Cohort (`customers`)
- ✅ DSO - Days Sales Outstanding (`invoices`)
- ✅ Falhas de Pagamento (`paymentIntents`)
- ✅ Chargebacks (`disputes`)

**Fonte:** Objetos Stripe não utilizados

---

## 📊 RESUMO EXECUTIVO

### ✅ **O QUE FUNCIONA**
- Firebase Admin SDK (server-side) ✅
- Firebase Client SDK ✅
- Stripe API (subscriptions, charges, payouts) ✅
- GA4 Server-Side (runReport) ✅
- 11 APIs administrativas ativas ✅
- Schema dual (novo + legado com fallbacks) ✅
- Date handling universal (Timestamp + ISO strings) ✅

### ❌ **O QUE FALTA**
- 🔴 Torre de Controle com dados reais
- 🔴 Sistema de Alertas (financeiro, operacional, qualidade)
- 🔴 Tracking GA4 Client-Side (eventos customizados)
- 🟡 Dashboard de Qualidade (NPS, CSAT, Tickets)
- 🟡 Funil de Conversão Completo
- 🟡 Métricas Financeiras Avançadas (Quick Ratio, NRR, LTV, Burn Rate, Runway)
- 🟢 Páginas V2 (growth, quality, ops, torre)
- 🟢 Objetos Stripe subutilizados

### 🎯 **PRÓXIMOS PASSOS**

**FASE 1 - Torre de Controle (1 semana)**
1. Criar `/api/admin/control-tower`
2. Implementar Burn Rate + Runway
3. Implementar Sistema de Alertas básico
4. Conectar dashboard real

**FASE 2 - Tracking & Qualidade (1 semana)**
1. Google Tag Manager + eventos GA4
2. Dashboard de Qualidade (NPS, CSAT, Tickets)
3. Funil de Conversão básico

**FASE 3 - Métricas Avançadas (1 semana)**
1. Métricas financeiras (Quick Ratio, NRR, LTV)
2. Funil completo com drop-offs
3. Alertas preditivos

**FASE 4 - Páginas V2 (2 semanas)**
1. Growth V2
2. Quality V2
3. Ops V2
4. Torre V2 (consolidação)

---

## 🔐 REGRAS DE SEGURANÇA

### ❌ **NÃO PODE TOCAR**
- Schema Firebase (perfil, clientId, specialistId, jobs)
- Configuração Stripe (apiVersion, keys)
- Configuração GA4 (property, credentials)
- Business logic (cálculos, validações)

### ✅ **PODE FAZER**
- Criar novas APIs (routes)
- Criar novos serviços (queries)
- Criar novos componentes (UI)
- Adicionar tracking (GA4 events)
- Adicionar observability (logs, errors)

### 🛡️ **SE PRECISAR TOCAR EM CÓDIGO SENSÍVEL**
1. ⛔ PARE IMEDIATAMENTE
2. 📋 Crie PROPOSTA DE MUDANÇA detalhada
3. ⏸️ Aguarde aprovação explícita
4. ✅ Só proceda com "ok, pode fazer"

---

**FIM DA AUDITORIA**

📌 **Documento criado em:** 2025-12-19  
📌 **Próxima ação:** Aguardar aprovação para começar FASE 1
