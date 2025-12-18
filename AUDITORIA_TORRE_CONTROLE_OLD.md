# 🔍 AUDITORIA COMPLETA - TORRE DE CONTROLE
**Data:** 2025-12-17  
**Objetivo:** Mapear integrações reais (GA4, Stripe, Firebase) antes de implementar KPIs decisórios

---

## 📊 1. ESTRUTURA ATUAL DO ADMIN

### 1.1 Router e Layout
- **Framework:** Next.js 16.0.10 (App Router)
- **Layout Principal:** `src/app/admin/layout.tsx`
- **Torre de Controle (Home):** `src/app/admin/page.tsx` ✅

### 1.2 Páginas Existentes
```
/admin                      → Torre de Controle V2 (Dashboard Decisório)
/admin/login                → Autenticação
/admin/users                → Gestão de Usuários
/admin/dashboard            → Dashboard v2 (antigo)
/admin/operational-health   → Saúde Operacional
/admin/pipeline             → Pipeline de Vendas
/admin/growth               → Métricas de Crescimento
/admin/financeiro           → Financeiro v1
/admin/financeiro-v2        → Financeiro v2
/admin/service-desk         → Service Desk
/admin/reports              → Relatórios
/admin/alerts               → Sistema de Alertas
```

### 1.3 APIs Existentes
```
/api/admin/control-tower             → Torre principal ✅
/api/admin/daily-metrics             → Métricas diárias (GA4 + Firebase) ✅
/api/admin/dashboard-v2              → Dashboard v2
/api/admin/operational-health        → Saúde operacional
/api/admin/pipeline                  → Pipeline v1
/api/admin/pipeline-v2               → Pipeline v2
/api/admin/financeiro                → Financeiro v1
/api/admin/financeiro-v2             → Financeiro v2
/api/admin/growth                    → Crescimento
/api/admin/users                     → Usuários
/api/admin/torre                     → Torre (antigo)
/api/admin/torre/overview            → Overview da torre
/api/admin/torre/alerts              → Alertas
/api/admin/torre/service-desk        → Service desk
/api/admin/torre-stats               → Estatísticas
/api/admin/service-desk              → Service desk v2
/api/admin/reports                   → Relatórios
/api/admin/alerts                    → Sistema de alertas
/api/admin/analytics                 → Analytics
/api/admin/cruzamento-stripe-firebase → Cruzamento Stripe-Firebase
/api/admin/auditoria-profissionais   → Auditoria profissionais
/api/admin/auditoria-especialidades  → Auditoria especialidades
/api/admin/check-data                → Verificação de dados
/api/admin/test-count                → Teste de contagem
/api/admin/simple-test               → Teste simples
```

---

## 🔌 2. INTEGRAÇÕES REAIS

### 2.1 Google Analytics 4 (GA4)

#### Configuração
- **Property ID:** `503083965`
- **Measurement ID:** `G-B21PK9JQYS`
- **Env Vars:**
  ```env
  GA4_PROPERTY_ID=503083965
  NEXT_PUBLIC_GA4_ID=G-B21PK9JQYS
  NEXT_PUBLIC_GA_MEASUREMENT_ID=G-B21PK9JQYS
  GOOGLE_APPLICATION_CREDENTIALS_JSON=[base64 do service account]
  ```

#### Cliente Existente
- **Arquivo:** `src/services/admin/analytics.ts`
- **SDK:** `@google-analytics/data` (BetaAnalyticsDataClient)
- **Métrica implementada:** `/api/admin/daily-metrics` (views + signups)

#### Eventos GA4 Identificados no Código

**❌ DESCOBERTA CRÍTICA:** Nenhum evento customizado sendo emitido no código atual!

```powershell
# Resultado da busca:
grep -r "gtag|logEvent|analytics.track|event:" src/
# Output: No matches found
```

**Implicações:**
1. O GA4 coleta apenas eventos automáticos (`page_view`, `first_visit`, etc.)
2. Não há tracking customizado de ações do usuário
3. Métricas disponíveis limitadas a tráfego e sessões

**Eventos Automáticos Disponíveis no GA4:**
- ✅ `page_view` (visualizações de página)
- ✅ `session_start` (início de sessão)
- ✅ `first_visit` (primeira visita)
- ✅ `user_engagement` (engajamento)

**⚠️ OPORTUNIDADE:** Implementar eventos customizados:
- `signup_completed` (cadastro concluído)
- `job_created` (job criado)
- `proposal_sent` (proposta enviada)
- `payment_completed` (pagamento concluído)
- `match_accepted` (match aceito)

#### Métricas GA4 Disponíveis
- ✅ `activeUsers` (usado em daily-metrics)
- ✅ `screenPageViews` (usado em daily-metrics)
- ✅ `eventCount`
- ✅ `newUsers`
- ✅ `sessions`
- ✅ `engagementRate`
- ✅ Custom events (precisam ser mapeados)

---

### 2.2 Stripe

#### Configuração
- **Env Vars:**
  ```env
  STRIPE_SECRET_KEY=sk_live_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  ```

#### Cliente Existente
- **Arquivo:** `src/lib/server/stripe.ts`
- **SDK:** `stripe@2025-02-24.acacia`
- **Serviços:** `src/services/admin/stripeService.ts`

#### Objetos Stripe Utilizados
✅ **Identificados no código:**
- `subscriptions` → MRR, ARR
- `accounts` → Connected accounts
- `payouts` → Payouts para profissionais
- `balance_transactions` → Transações
- `charges` → Cobranças
- `payment_intents` → Intenções de pagamento
- `checkout.sessions` → Sessões de checkout

#### Metadados Stripe → Firebase

**❌ DESCOBERTA CRÍTICA:** Nenhuma vinculação explícita encontrada no código!

```powershell
# Resultado da busca:
grep -r "checkout_session|payment_intent|customer_id|metadata" src/services/
# Output: Apenas em tipos de alertas/reports (não vinculação Stripe-Firebase)
```

**Implicações:**
1. Sistema financeiro (`financeiro.ts`) e cruzamento (`cruzamento-stripe-firebase`) existem mas não ficou clara a vinculação
2. Provável que vinculação seja feita por `userId` ou `email` (não por IDs do Stripe)
3. Não há tracking de `checkout_session_id` ou `payment_intent_id` nos jobs

**⚠️ RISCO:** Se vinculação é apenas por email/userId:
- Dificulta auditoria de pagamentos
- Impossível rastrear disputas específicas
- Hard de reconciliar discrepâncias

**RECOMENDAÇÃO:** Adicionar campos aos jobs:
```typescript
{
  stripeCustomerId?: string,
  checkoutSessionId?: string,
  paymentIntentId?: string,
  chargeId?: string,
}
```

---

### 2.3 Firebase / Firestore

#### Configuração
- **Env Vars:**
  ```env
  FIREBASE_ADMIN_CREDENTIALS=[base64 do service account]
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
  NEXT_PUBLIC_FIREBASE_API_KEY=...
  ```

#### Admin SDK
- **Arquivo:** `src/lib/server/firebaseAdmin.ts`
- **Inicialização:** ✅ Configurado

#### Coleções Reais (Mapeadas no Código)

##### **users** (192 docs: 183 profissional, 8 cliente)
```typescript
{
  perfil: 'profissional' | 'cliente',
  name: string,
  email: string,
  specialty?: string, // para profissionais
  disponivel?: boolean,
  status?: 'active' | 'inactive',
  createdAt: string | Timestamp,
  // ... outros campos
}
```

##### **jobs** (1 doc) - Collection principal de solicitações
```typescript
{
  clientId: string,           // antes: familyId
  specialistId: string,       // antes: professionalId
  status: string,
  createdAt: string | Timestamp,
  acceptedAt?: string | Timestamp,
  paidAt?: string | Timestamp,
  scheduledAt?: string | Timestamp,
  cancelledAt?: string | Timestamp,
  // ... outros campos
}
```

##### **feedbacks**
```typescript
{
  userId: string,
  score: number, // NPS
  comment?: string,
  createdAt: string | Timestamp,
  // ... outros campos
}
```

##### **tickets**
```typescript
{
  userId: string,
  userName: string,
  userType: string,           // ou 'perfil'
  source: 'detractor' | 'complaint' | 'bug' | 'question',
##### **proposals** ✅ CONFIRMADA
```typescript
// Collection usada em:
// - src/services/admin/users/index.ts (conta propostas ativas)
// - src/services/admin/pipeline/index.ts (pipeline de propostas)
// - src/services/admin/torre/modules.ts (propostas enviadas)
// - src/services/admin/torre/alerts.ts (propostas não pagas)

// Estrutura inferida:
{
  professionalId: string,  // ou specialistId
  status: 'pending' | 'active' | 'accepted' | 'rejected',
  createdAt: string | Timestamp,
  // ... outros campos
}

// ⚠️ NOTA: Status em jobs usa 'proposal_sent' e 'proposta_enviada'
// Pode haver duplicação: proposals collection + jobs.status='proposal_sent'
```reatedAt: string | Timestamp,
  // ... outros campos
}
```

##### **ratings**
```typescript
{
  score: number,
  rating: number,
  ratingType?: 'first_meeting' | ...,
  ratedType?: 'professional' | 'family',
  targetType?: string,
  createdAt: string | Timestamp,
  // ... outros campos
}
```

##### **proposals** (se existir - verificar)
```typescript
// Usado em users/index.ts linha 101
// Precisa confirmar se existe e qual a estrutura
```

##### **deals** (Pipeline v2)
```typescript
{
  stage: 'lead' | 'qualified' | 'proposal' | ...,
  value: number,
  createdAt: string | Timestamp,
  stageChangedAt?: string | Timestamp,
  // ... outros campos
}
```

##### **Coleções de Reports** (Sistema de relatórios)
- `report_configs`
- `report_schedules`
- `report_executions`

##### **Coleções de Alertas** (Sistema de alertas)
- `alerts` (ALERTS_COLLECTION)
- `alert_actions` (ALERT_ACTIONS_COLLECTION)

#### Status e Estados Utilizados

**jobs.status:**
```typescript
// Estados identificados no código:
'pending' | 'open' | 'matched' | 'proposal_sent' | 'accepted' | 
'match_accepted' | 'in_progress' | 'agendado' | 'em_andamento' |
'completed' | 'concluido' | 'declined' | 'canceled' | 'cancelled'
```

---

## 🎯 3. TORRE DE CONTROLE ATUAL

### 3.1 Estrutura da Página (`src/app/admin/page.tsx`)

#### Filosofia
```
Responde em 5 segundos:
1. Estamos ganhando ou perdendo dinheiro?
2. Onde está o gargalo agora?
3. O que vai virar problema se eu não agir hoje?
```

#### Seções Atuais
1. **Saúde Financeira** (Finance)
   - MRR Real vs Target
   - Burn Rate
   - Runway
   - MRR em Risco

2. **Saúde do Marketplace** (Marketplace)
   - Profissionais Disponíveis
   - Abandono Pós-Aceite

3. **Gargalos Operacionais** (Operations)
   - SLA de Resposta (<24h, 24-48h, >48h)
   - Tempo Médio de Match
   - Taxa de Conversão

#### API de Dados
- **Endpoint:** `/api/admin/control-tower`
- **Serviços:**
  - `src/services/admin/control-tower/finance.ts`
  - `src/services/admin/control-tower/marketplace.ts`
  - `src/services/admin/control-tower/operations.ts`

#### Gráficos Diários Implementados
- **Endpoint:** `/api/admin/daily-metrics`
- **Dados:**
  - Views do site (GA4)
  - Cadastros diários (Firebase)

---

## 📦 4. SERVIÇOS E MÓDULOS EXISTENTES

### 4.1 Análise dos Serviços

#### Financial Services
- `src/services/admin/stripeService.ts` → MRR, ARR, receita
- `src/services/admin/finance.ts` → Métricas financeiras
- `src/services/admin/control-tower/finance.ts` → Torre: saúde financeira

#### Analytics Services
- `src/services/admin/analytics.ts` → GA4 Data API
- `src/services/admin/analyticsService.ts` → Analytics gerais

#### Growth Services
- `src/services/admin/growth/acquisition.ts` → Aquisição
- `src/services/admin/growth/activation.ts` → Ativação

#### Operational Services
- `src/services/admin/operational-health/professionals.ts` → Saúde profissionais
- `src/services/admin/operational-health/families.ts` → Saúde famílias
- `src/services/admin/operational-health/matches.ts` → Qualidade de matches

#### Pipeline Services
- `src/services/admin/pipeline/getPipelineData.ts` → Pipeline v1
- `src/services/admin/pipeline-v2/pipelineService.ts` → Pipeline v2

#### Torre Services
- `src/services/admin/torre/overview.ts` → Overview
- `src/services/admin/torre/modules.ts` → Módulos
- `src/services/admin/torre/alerts.ts` → Alertas
- `src/services/admin/torre/growth.ts` → Crescimento
- `src/services/admin/torre/quality.ts` → Qualidade
- `src/services/admin/torre/serviceDesk.ts` → Service Desk

#### User Services
- `src/services/admin/users/index.ts` → Gestão de usuários
- `src/services/admin/users/listUsers.ts` → Listagem

#### Retention Services
- `src/services/admin/retentionService.ts` → Retenção

---

## 🚨 5. GAPS E OPORTUNIDADES IDENTIFICADAS

### 5.1 Integrações Incompletas

#### GA4
- ❌ **Eventos customizados não mapeados**
  - Quais eventos o front-end emite?
  - Quais estão disponíveis na Data API?
  - Sugestão: criar `docs/GA4_EVENTS_MAP.md`

- ⚠️ **Métricas avançadas não utilizadas**
  - Conversão de funil
  - Engajamento por página
  - Tempo médio de sessão
  - Taxa de rejeição

#### Stripe
- ⚠️ **Vinculação Stripe ↔ Firestore não documentada**
  - Como `jobs` conectam com `payment_intents`?
  - Metadata usado?
  - Webhooks configurados?

- ❌ **Métricas Stripe não expostas:**
  - Disputas (disputes)
  - Chargebacks
  - Taxa de aprovação de pagamentos
  - Falhas de pagamento

#### Firebase
- ✅ Schema bem mapeado
- ⚠️ Coleção `proposals` existe mas não é clara
- ⚠️ Status múltiplos (português/inglês) causam confusão

### 5.2 Torre de Controle - Gaps

#### Faltam KPIs Críticos:
1. **Financeiros:**
   - ❌ CAC (Customer Acquisition Cost)
   - ❌ LTV (Lifetime Value)
   - ❌ Taxa de churn financeiro
   - ❌ Receita por profissional

2. **Operacionais:**
   - ❌ Taxa de aceitação de propostas
   - ❌ Tempo médio até primeiro atendimento
   - ❌ Taxa de cancelamento pós-aceite
   - ❌ NPS score agregado

3. **Marketplace:**
   - ❌ Densidade de profissionais por especialidade
   - ❌ Taxa de ocupação média
   - ❌ Tempo médio de resposta

4. **Growth:**
   - ❌ Taxa de conversão cadastro → primeiro job
   - ❌ Ativação em D7/D30
   - ❌ Retenção cohort

#### Faltam Alertas:
- ❌ MRR caindo X% em Y dias
- ❌ Runway < 6 meses
- ❌ SLA crítico (>48h) acima de threshold
- ❌ Profissionais inativos > 30 dias
- ❌ Taxa de conversão abaixo da média

---

## 🎯 6. PROPOSTA DE ARQUITETURA

### 6.1 Princípios

1. **Não quebrar nada:**
   - Adicionar apenas código novo
   - Serviços em `/services/admin/torre-v3/` (novo namespace)
   - APIs em `/api/admin/torre-v3/` (novo namespace)

2. **Fonte de verdade por tipo:**
   ```
   GA4:      Eventos, tráfego, conversão de funil
   Stripe:   Pagamentos, MRR, ARR, disputas
   Firebase: Status operacionais, usuários, jobs, feedbacks
   ```

3. **Feature flags:**
   - Se integração não configurada → card mostra "Integração não configurada"
   - Permite deploy incremental

### 6.2 Estrutura Proposta

```
src/
  services/
    admin/
      torre-v3/              ← NOVO namespace isolado
        kpis/
          financial.ts       → CAC, LTV, Churn, MRR detalhado
          operational.ts     → SLA, tempo de match, ocupação
          marketplace.ts     → Densidade, taxa aceitação
          growth.ts          → Conversão, ativação, retenção
        alerts/
          financial.ts       → Alertas financeiros
          operational.ts     → Alertas operacionais
        integrations/
          ga4.ts            → Wrapper GA4 com fallback
          stripe.ts         → Wrapper Stripe com fallback
          firebase.ts       → Queries otimizadas
        types.ts            → TypeScript interfaces

  app/
    api/
      admin/
        torre-v3/            ← NOVO namespace isolado
          kpis/
            route.ts         → GET todos KPIs
          alerts/
            route.ts         → GET alertas ativos
    admin/
      page.tsx              → Torre V2 (modificar incrementalmente)
      
  components/
    admin/
      torre-v3/              ← NOVO namespace isolado
        KpiCard.tsx
        AlertBanner.tsx
        IntegrationStatus.tsx
```

---

## ✅ 7. PRÓXIMOS PASSOS (AGUARDANDO APROVAÇÃO)

### Etapa 1: Mapear Eventos GA4 (OBRIGATÓRIO)
```powershell
# Buscar eventos emitidos no front-end
grep -r "gtag\|logEvent\|analytics" src/app src/components
```
**Output esperado:** Lista de eventos customizados

### Etapa 2: Mapear Vinculação Stripe-Firebase
```typescript
// Descobrir como jobs conectam com payment_intents
// Procurar por: checkout_session_id, payment_intent_id em jobs
```

### Etapa 3: Criar Documento de KPIs
```markdown
# KPIs_TORRE_V3.md
Para cada KPI:
- Nome
- Fórmula de cálculo
- Fonte de dados (GA4/Stripe/Firebase)
- Query exata
- Threshold de alerta
```

### Etapa 4: Implementação Incremental
1. ✅ Criar namespace `torre-v3`
2. ✅ Implementar KPIs financeiros (Stripe)
3. ✅ Implementar KPIs operacionais (Firebase)
4. ✅ Implementar KPIs de growth (GA4 + Firebase)
5. ✅ Criar sistema de alertas
6. ✅ Atualizar Torre V2 com novos cards

---

## 🔐 8. CHECKLIST DE SEGURANÇA

- ✅ Não alterar coleções Firebase existentes
- ✅ Não modificar lógica de negócio em arquivos ativos
- ✅ Usar namespace isolado (`torre-v3`)
- ✅ Feature flags para integrações não configuradas
- ✅ Validação de env vars antes de usar
- ✅ Logs detalhados de erros (não silenciar)
- ✅ Testes unitários para novas queries
- ✅ Documentação inline de cada cálculo

---

## 📝 NOTAS FINAIS

**Status:** ⏸️ AGUARDANDO APROVAÇÃO

**Aguardando:**
1. Aprovação da arquitetura proposta
2. Mapeamento completo de eventos GA4
3. Documentação da vinculação Stripe-Firebase
4. Lista final de KPIs prioritários

**Não implementar sem aprovação de:**
- Mudanças em `src/app/admin/page.tsx` (Torre atual)
- Modificações em serviços existentes
- Novos índices/coleções no Firestore
