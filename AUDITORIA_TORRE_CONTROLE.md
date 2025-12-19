# 🔍 Auditoria Completa - Torre de Controle

**Data:** 2025-01-XX
**Objetivo:** Inventariar todas as integrações e fontes de dados para melhorias na Torre de Controle

---

## 📊 1. ROTAS ADMIN EXISTENTES

### Páginas Descobertas
```
/admin                      → Torre de Controle (main dashboard)
/admin/dashboard            → Dashboard v1 (legado?)
/admin/operational-health   → Saúde operacional
/admin/pipeline             → Pipeline de vendas
/admin/users                → Gestão de usuários
/admin/growth               → Métricas de crescimento
/admin/financeiro           → Financeiro v1
/admin/financeiro-v2        → Financeiro v2 (novo)
/admin/service-desk         → Central de atendimento
/admin/alerts               → Sistema de alertas
/admin/reports              → Relatórios
/admin/login                → Login admin
```

### API Routes Principais
```
GET /api/admin/control-tower        → Dashboard Torre de Controle
GET /api/admin/daily-metrics        → Métricas diárias (views + signups)
GET /api/admin/analytics            → Métricas GA4 detalhadas
GET /api/admin/dashboard-v2         → Dashboard v2
GET /api/admin/financeiro           → Dados financeiros
GET /api/admin/users                → Lista de usuários
GET /api/admin/pipeline             → Pipeline de conversão
GET /api/admin/torre-stats          → Estatísticas torre
GET /api/admin/growth               → Métricas de crescimento
GET /api/admin/service-desk         → Tickets de suporte
GET /api/admin/alerts               → Alertas do sistema
```

---

## 🔥 2. FIREBASE (FIRESTORE)

### Coleções Existentes
```
✅ users                    → 192 documentos (183 profissional, 8 cliente, 1 admin)
✅ jobs                     → 1 documento
✅ feedbacks                → Feedback de usuários
✅ tickets                  → Service desk
✅ ratings                  → Avaliações
✅ proposals                → Propostas de trabalho
✅ deals                    → Negócios (pipeline v2)
✅ transacoes               → Transações financeiras
✅ payments                 → Pagamentos
✅ contracts                → Contratos
✅ messages                 → Mensagens
✅ report_schedules         → Agendamentos de relatórios
✅ report_configs           → Configurações de relatórios
✅ report_executions        → Execuções de relatórios
✅ alerts                   → Sistema de alertas
✅ alert_actions            → Ações de alertas
```

### Schema Principal (jobs)
```typescript
{
  id: string
  clientId: string          // Cliente (não familyId)
  specialistId: string      // Especialista (não professionalId)
  status: string            // Status do job
  createdAt: Timestamp | string (ISO)
  updatedAt: Timestamp | string (ISO)
  // ... outros campos
}
```

### Schema Principal (users)
```typescript
{
  id: string
  perfil: 'profissional' | 'cliente' | 'admin'  // (não userType)
  nome: string
  email: string
  createdAt: Timestamp | string (ISO)
  stripeAccountId?: string
  // ... outros campos
}
```

### Queries Comuns
```typescript
// Buscar profissionais
db.collection('users').where('perfil', '==', 'profissional')

// Buscar clientes
db.collection('users').where('perfil', '==', 'cliente')

// Jobs recentes
db.collection('jobs').where('createdAt', '>=', startDate)

// Tickets abertos
db.collection('tickets').where('status', '==', 'open')
```

---

## 💳 3. STRIPE

### Configuração
```bash
STRIPE_SECRET_KEY=sk_test_xxxxx
API Version: 2025-02-24.acacia
```

### Cliente Singleton
```typescript
// src/lib/server/stripe.ts
import Stripe from 'stripe';

export function getStripeClient(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-24.acacia',
    typescript: true,
  });
}
```

### Objetos Stripe Utilizados

#### 1. Subscriptions (Assinaturas)
```typescript
stripe.subscriptions.list({
  status: 'active',
  limit: 100,
  expand: ['data.plan']
})

// Campos usados:
- id
- status ('active', 'canceled', 'past_due')
- current_period_start
- current_period_end
- plan.amount (MRR)
- customer
```

#### 2. Charges (Cobranças)
```typescript
stripe.charges.list({
  limit: 100,
  created: { gte: timestamp }
})

// Campos usados:
- id
- amount
- status ('succeeded', 'failed')
- created
```

#### 3. Balance (Saldo)
```typescript
stripe.balance.retrieve()

// Campos usados:
- available[0].amount (saldo disponível)
- pending[0].amount (saldo pendente)
```

#### 4. Payouts (Transferências)
```typescript
stripe.payouts.list({
  created: { gte: timestamp, lte: timestamp },
  limit: 50
})

// Campos usados:
- amount (burn rate calculation)
- arrival_date
- status
```

#### 5. Accounts (Stripe Connect)
```typescript
stripe.accounts.retrieve(accountId)

// Campos usados:
- id
- charges_enabled
- payouts_enabled
- requirements.currently_due
- requirements.disabled_reason
```

### Métricas Calculadas
```typescript
{
  mrr: number,                    // Monthly Recurring Revenue
  totalRevenue: number,           // Total de charges succeeded
  activeSubscriptions: number,    // Count de assinaturas ativas
  churnRate: number,              // % cancelamentos (30 dias)
  burnRate: number,               // Gastos mensais (payouts)
  runway: number,                 // Meses de sobrevivência
  cashBalance: number             // Saldo disponível
}
```

---

## 📊 4. GOOGLE ANALYTICS 4 (GA4)

### Configuração
```bash
GA4_PROPERTY_ID=503083965
NEXT_PUBLIC_GA4_ID=G-B21PK9JQYS
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-B21PK9JQYS
FIREBASE_ADMIN_SERVICE_ACCOUNT=<base64_credentials>
```

### Cliente GA4
```typescript
// src/services/admin/analyticsService.ts
import { BetaAnalyticsDataClient } from '@google-analytics/data';

const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: JSON.parse(
    Buffer.from(
      process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT || '',
      'base64'
    ).toString('utf-8')
  )
});
```

### Métricas Disponíveis
```typescript
// Métricas básicas
{
  activeUsers: number,           // Usuários ativos (7 dias)
  newUsers: number,              // Novos usuários (7 dias)
  sessions: number,              // Total de sessões
  screenPageViews: number,       // Total de visualizações
  bounceRate: number,            // Taxa de rejeição
  averageSessionDuration: number // Duração média (segundos)
}

// Dimensões
{
  deviceCategory: 'desktop' | 'mobile' | 'tablet'
}
```

### Eventos GA4 Rastreados (hipótese - não encontrados no código)
```
❌ NÃO ENCONTRADO: Nenhum gtag() ou logEvent() no código frontend
⚠️  APENAS PAGEVIEWS: O código atual só busca pageviews do GA4
⚠️  SEM CUSTOM EVENTS: Não há eventos personalizados implementados

SUGESTÃO: Implementar:
- sign_up (cadastro)
- create_request (criar solicitação)
- hire_caregiver (contratar cuidador)
- complete_profile (completar perfil)
- view_professional (ver perfil profissional)
```

### Queries GA4 Utilizadas
```typescript
// 1. Daily Metrics (últimos 30 dias)
analyticsDataClient.runReport({
  property: `properties/${propertyId}`,
  dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
  dimensions: [{ name: 'date' }],
  metrics: [{ name: 'screenPageViews' }]
});

// 2. Metrics Overview (7 dias)
analyticsDataClient.runReport({
  property: `properties/${propertyId}`,
  dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
  dimensions: [{ name: 'deviceCategory' }],
  metrics: [
    { name: 'activeUsers' },
    { name: 'newUsers' },
    { name: 'sessions' },
    { name: 'screenPageViews' },
    { name: 'bounceRate' },
    { name: 'averageSessionDuration' }
  ]
});
```

---

## 🔗 5. INTEGRAÇÕES EXISTENTES

### Fluxo de Dados Atual

```
┌──────────────────┐
│   Frontend       │
│  /admin/page.tsx │
└────────┬─────────┘
         │
         │ fetch('/api/admin/control-tower')
         │ fetch('/api/admin/daily-metrics')
         ▼
┌─────────────────────────┐
│   API Routes            │
│  - control-tower        │
│  - daily-metrics        │
└────────┬────────────────┘
         │
         │ import services
         ▼
┌──────────────────────────────────┐
│   Services                       │
│  - control-tower/index.ts        │
│  - control-tower/finance.ts      │
│  - control-tower/operations.ts   │
│  - control-tower/marketplace.ts  │
│  - control-tower/risk.ts         │
│  - analyticsService.ts           │
└────────┬─────────────────────────┘
         │
         │ calls
         ▼
┌──────────────────────────────────┐
│   Data Sources                   │
│  - Firebase (getFirestore)       │
│  - Stripe (getStripeClient)      │
│  - GA4 (BetaAnalyticsDataClient) │
└──────────────────────────────────┘
```

### Services Implementados

#### control-tower/ (Torre Principal)
```typescript
✅ finance.ts
   - getMonthRevenue()
   - getBurnRate()
   - getRunway()
   - getMRRAtRisk()

✅ operations.ts
   - getRequestsBySLA()
   - getAverageTimeToMatch()
   - getConversionFunnel()

✅ marketplace.ts
   - getAvailableProfessionals()
   - getPostAcceptAbandonment()

✅ risk.ts
   - calculateSystemHealth()
   - generateUrgentActions()

✅ index.ts
   - getControlTowerDashboard() (orchestrator)
```

#### dashboard/ (Dashboard v1)
```typescript
✅ professionals.ts - Métricas de cuidadores
✅ families.ts - Métricas de clientes
✅ demanda.ts - Análise de demanda
✅ oferta.ts - Análise de oferta
✅ finance.ts - Finanças
✅ financeiro.ts - Financeiro alternativo
✅ index.ts - Orchestrator
```

#### operational-health/
```typescript
✅ professionals.ts - Saúde de profissionais
✅ families.ts - Saúde de clientes
✅ matches.ts - Matches e conversões
```

#### pipeline/
```typescript
✅ index.ts - Pipeline overview
✅ getPipelineData.ts - Dados detalhados pipeline
```

#### users/
```typescript
✅ index.ts - Métricas de usuários
✅ listUsers.ts - Lista paginada de usuários
```

#### growth/
```typescript
✅ acquisition.ts - Aquisição de usuários
✅ activation.ts - Ativação de usuários
```

#### torre/ (Torre v1 - legado?)
```typescript
✅ alerts.ts - Alertas operacionais
✅ growth.ts - Crescimento
✅ modules.ts - Módulos
✅ overview.ts - Visão geral
✅ quality.ts - Qualidade
✅ serviceDesk.ts - Service desk
```

---

## 📈 6. KPIs IMPLEMENTADOS (Torre de Controle Atual)

### Realidade do Negócio (Business Health)
```typescript
{
  monthRevenue: {
    current: number,
    previous: number,
    percentChange: number,
    trend: 'up' | 'down' | 'stable',
    isMock: boolean
  },
  
  burnRate: {
    amount: number,
    netBurn: number,
    status: 'profit' | 'neutral' | 'burning',
    isMock: boolean
  },
  
  runway: {
    months: number,
    status: 'healthy' | 'warning' | 'critical',
    cashBalance: number,
    isMock: boolean
  },
  
  mrrAtRisk: {
    amount: number,
    percentage: number,
    reasons: Array<{
      label: string,
      value: number,
      count: number
    }>
  },
  
  systemHealth: {
    score: number,  // 0-100
    status: 'healthy' | 'warning' | 'critical',
    issues: string[]
  }
}
```

### Gargalos Operacionais (Operations)
```typescript
{
  requestsBySLA: {
    underTwentyFour: { count, value, status: 'ok' },
    twentyFourToFortyEight: { count, value, status: 'warning' },
    overFortyEight: { count, value, status: 'critical' }
  },
  
  averageTimeToMatch: {
    hours: number,
    target: number,
    status: 'good' | 'acceptable' | 'poor',
    trend: 'improving' | 'stable' | 'worsening',
    last7Days: number[]
  },
  
  conversionFunnel: {
    created: { count, percentage },
    matched: { count, percentage, conversionRate },
    paid: { count, percentage, conversionRate },
    dropoffs: {
      createdToMatched: number,
      matchedToPaid: number
    }
  }
}
```

### Saúde do Marketplace (Marketplace)
```typescript
{
  availableProfessionals: {
    count: number,
    openDemand: number,
    balance: 'surplus' | 'balanced' | 'deficit',
    ratio: number
  },
  
  postAcceptAbandonment: {
    rate: number,
    count: number,
    acceptableLimit: number,
    status: 'ok' | 'warning' | 'critical',
    trend: 'improving' | 'stable' | 'worsening'
  }
}
```

### Analytics (GA4)
```typescript
{
  activeUsers: number,
  newUsers: number,
  sessions: number,
  pageViews: number,
  conversionRate: number,
  topPages: Array<{ page: string, views: number }>
}
```

---

## 🚨 7. GAPS E OPORTUNIDADES

### ❌ Gaps Identificados

#### GA4
```
⚠️  SEM CUSTOM EVENTS
- Não há eventos personalizados implementados
- Apenas pageviews são rastreados
- Impossível rastrear funil de conversão real

IMPACTO: Não conseguimos medir:
- Taxa de conversão de cadastro
- Taxa de conversão de solicitação
- Taxa de conversão de contratação
- Origem de tráfego efetivo
```

#### Stripe
```
✅ BEM IMPLEMENTADO
- Subscriptions, charges, payouts, balance, accounts
- MRR, churn, burn rate, runway calculados
- Stripe Connect para profissionais

SUGESTÕES:
- Adicionar payment_intents para mais detalhes
- Adicionar checkout.sessions para funil
- Adicionar balance_transactions para histórico completo
```

#### Firebase
```
✅ SCHEMA CORRETO
- Todas as queries usam 'jobs' (não 'requests')
- Campos corretos: clientId, specialistId, perfil
- Date handling universal com toDate()

OPORTUNIDADES:
- Adicionar timestamps de ações do usuário
- Rastrear eventos de negócio no Firestore
- Criar subcoleções para histórico detalhado
```

### 🎯 Oportunidades de Melhoria

#### 1. Implementar Custom Events GA4
```typescript
// Frontend (src/app/signup/page.tsx, etc.)
gtag('event', 'sign_up', {
  method: 'email',
  user_type: 'professional' | 'family'
});

gtag('event', 'create_request', {
  request_id: string,
  service_type: string
});

gtag('event', 'hire_caregiver', {
  request_id: string,
  professional_id: string
});
```

#### 2. Adicionar Feature Flags
```typescript
// Para controlar funcionalidades incompletas
{
  ga4CustomEvents: false,  // Até implementar
  stripeAdvanced: true,    // Já funciona
  realTimeAlerts: false    // Futura
}
```

#### 3. Alertas Inteligentes (já implementado parcialmente)
```typescript
// src/services/admin/alerts/alertService.ts
- ✅ Sistema de alertas com SLA
- ✅ Ações e rastreamento
- ⚠️  Falta: Notificações push
- ⚠️  Falta: Webhook para Slack/Discord
```

#### 4. Dashboard de Performance
```
CRIAR: /admin/performance
- Tempo de resposta de APIs
- Taxa de erro por endpoint
- Uso de recursos (Firebase reads, Stripe calls)
- Cache hit rate
```

---

## 📊 8. MÉTRICAS PRIORITÁRIAS (Sugestão)

### Para Torre de Controle (Homepage /admin)
```
🎯 KPIs PRINCIPAIS (Hero Cards):
1. Receita do Mês (Stripe MRR)
2. Burn Rate / Runway (Stripe Payouts + Balance)
3. Solicitações Abertas > 48h (Firebase jobs + SLA)

📊 KPIs SECUNDÁRIOS:
4. Famílias Ativas (30d) - Firebase
5. Cuidadores Ativos - Firebase
6. Taxa de Conversão - Firebase + Stripe
7. NPS / Satisfação - Firebase feedbacks/ratings
8. Tempo Médio de Match - Firebase jobs timestamps

📈 CHARTS:
- Daily Views (GA4)
- Daily Signups (Firebase)
- Weekly Revenue (Stripe)
- Conversion Funnel (Firebase)
```

### Para Módulos Específicos
```
/admin/growth
- Aquisição (GA4 + Firebase)
- Ativação (Firebase)
- Retenção (Firebase + Stripe)
- Referral (Firebase)
- Revenue (Stripe)

/admin/operational-health
- SLA compliance
- Match speed
- Abandonment rate
- Professional availability

/admin/financeiro
- MRR
- ARR
- Churn
- LTV
- CAC (se GA4 com custom events)
```

---

## ✅ 9. CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Validação (FEITO ✅)
- [x] Auditar rotas admin
- [x] Auditar configuração GA4
- [x] Auditar configuração Stripe
- [x] Auditar schema Firebase
- [x] Mapear serviços existentes
- [x] Identificar gaps

### Fase 2: Planejamento (PRÓXIMA)
- [ ] Definir KPIs prioritários com stakeholder
- [ ] Desenhar nova arquitetura de componentes
- [ ] Criar wireframes/mockups (se necessário)
- [ ] Definir critérios de sucesso

### Fase 3: Implementação
- [ ] Implementar custom events GA4 (frontend)
- [ ] Criar novos services conforme necessário
- [ ] Refatorar componentes da Torre
- [ ] Adicionar testes unitários
- [ ] Adicionar feature flags

### Fase 4: Observabilidade
- [ ] Adicionar logging estruturado
- [ ] Adicionar métricas de performance
- [ ] Configurar alertas automáticos
- [ ] Dashboard de saúde do sistema

---

## 📝 10. NOTAS TÉCNICAS

### Constraints (NÃO PODE ALTERAR)
```
❌ Schema Firebase (jobs, clientId, specialistId, perfil)
❌ Business logic de conversão
❌ Stripe API configuration
❌ GA4 Property ID
```

### Pode Alterar (Safe)
```
✅ Componentes React na Torre
✅ Novos serviços em services/admin/
✅ Novos API routes em app/api/admin/
✅ Types em control-tower/types.ts
✅ Adicionar observabilidade
✅ Adicionar feature flags
```

### Performance Considerations
```
- Firebase: Limite de 500 docs por query (usar pagination)
- Stripe: Rate limit de 100 req/s (usar cache)
- GA4: Quota de 200k requests/dia (agrupar queries)
```

---

## 🎯 PRÓXIMOS PASSOS

1. **Validar com Stakeholder:**
   - Revisar KPIs prioritários
   - Confirmar métricas de sucesso
   - Alinhar expectativas

2. **Implementar Quick Wins:**
   - Adicionar custom events GA4
   - Melhorar visualização de KPIs existentes
   - Adicionar tooltips explicativos

3. **Planejar Features Avançadas:**
   - Real-time alerts
   - Predictive analytics
   - A/B testing dashboard
   - Multi-tenant (se aplicável)

---

**Fim da Auditoria** ✅
