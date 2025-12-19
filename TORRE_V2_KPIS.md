# 🎯 TORRE V2 - DEFINIÇÃO DE KPIs

**Data:** 2024-12-18  
**Status:** Em Definição  
**Baseado em:** Inventário completo (INVENTARIO_TORRE_V2.md)

---

## 🌟 NORTH STAR METRICS (Torre de Controle)

Métricas que respondem: **"Estamos ganhando ou perdendo?"**

### 1. MRR (Monthly Recurring Revenue)
**Fonte:** Stripe API  
**Cálculo:** Soma de todas as assinaturas ativas  
**Meta:** Crescimento >10% MoM  
**Query:**
```typescript
const subscriptions = await stripe.subscriptions.list({ status: 'active' });
let mrr = 0;
subscriptions.data.forEach(sub => {
  const amount = sub.items.data[0]?.price.unit_amount || 0;
  const interval = sub.items.data[0]?.price.recurring?.interval || 'month';
  mrr += interval === 'year' ? (amount / 100 / 12) : (amount / 100);
});
```

**Componentes:**
- Novo MRR (novas assinaturas)
- Expansão MRR (upgrades)
- Churn MRR (cancelamentos)
- Contração MRR (downgrades)

**Status:**
- 🟢 Verde: MRR crescendo >10% MoM
- 🟡 Amarelo: MRR estável (-5% a +5%)
- 🔴 Vermelho: MRR caindo >5% MoM

---

### 2. Taxa de Conversão Geral
**Fonte:** GA4 + Stripe + Firebase  
**Cálculo:** (Pagamentos / Cadastros) × 100  
**Meta:** >15%  
**Query:**
```typescript
// Cadastros (GA4 ou Firebase)
const signups = await db.collection('users')
  .where('createdAt', '>=', startOfMonth)
  .get();

// Pagamentos (Stripe)
const charges = await stripe.charges.list({
  created: { gte: startTimestamp },
  status: 'succeeded'
});

const conversion = (charges.data.length / signups.size) * 100;
```

**Status:**
- 🟢 Verde: >15%
- 🟡 Amarelo: 10-15%
- 🔴 Vermelho: <10%

---

### 3. NPS (Net Promoter Score)
**Fonte:** Firebase (`feedbacks` collection)  
**Cálculo:** % Promotores (9-10) - % Detratores (0-6)  
**Meta:** >50  
**Query:**
```typescript
const feedbacks = await db.collection('feedbacks')
  .where('createdAt', '>=', startOfMonth)
  .get();

const ratings = feedbacks.docs.map(d => d.data().rating);
const promoters = ratings.filter(r => r >= 9).length;
const detractors = ratings.filter(r => r <= 6).length;
const nps = ((promoters - detractors) / ratings.length) * 100;
```

**Status:**
- 🟢 Verde: NPS >50 (Excelente)
- 🟡 Amarelo: NPS 0-50 (Bom)
- 🔴 Vermelho: NPS <0 (Crítico)

---

### 4. Alertas Críticos Ativos
**Fonte:** Firebase + Stripe + Cálculos  
**Cálculo:** Soma de alertas vermelhos  
**Meta:** 0  
**Tipos:**
- Churn >5% no mês
- SLA >24h em >10 solicitações
- Runway <6 meses
- Burn rate negativo
- NPS <7 com >5 detratores

**Status:**
- 🟢 Verde: 0 alertas críticos
- 🟡 Amarelo: 1-2 alertas críticos
- 🔴 Vermelho: 3+ alertas críticos

---

## 📊 KPIs POR MÓDULO

### 🚀 GROWTH (Crescimento)

#### 1. CAC (Customer Acquisition Cost)
**Fórmula:** Investimento em Marketing / Novos Clientes  
**Fonte:** Manual (input) + Firebase  
**Meta:** <R$200  
**Query:**
```typescript
const newUsers = await db.collection('users')
  .where('perfil', '==', 'cliente')
  .where('createdAt', '>=', startOfMonth)
  .get();

// Marketing spend (manual input ou GA4 ads)
const marketingSpend = 10000; // exemplo
const cac = marketingSpend / newUsers.size;
```

#### 2. LTV (Lifetime Value)
**Fórmula:** ARPU × Tempo Médio de Vida × Margem  
**Fonte:** Stripe + Firebase  
**Meta:** LTV/CAC > 3  
**Query:**
```typescript
// ARPU (Average Revenue Per User)
const totalRevenue = await stripe.charges.list({ status: 'succeeded' });
const activeUsers = await db.collection('users').where('perfil', '==', 'cliente').get();
const arpu = (totalRevenue.data.reduce((sum, c) => sum + c.amount, 0) / 100) / activeUsers.size;

// Lifetime (meses médios de retenção)
// Calcular via cohort analysis
const avgLifetime = 18; // exemplo

const ltv = arpu * avgLifetime;
```

#### 3. Payback Period
**Fórmula:** CAC / MRR Médio por Cliente  
**Meta:** <6 meses  
**Query:**
```typescript
const avgMrrPerCustomer = totalMrr / totalCustomers;
const payback = cac / avgMrrPerCustomer;
```

#### 4. Funil de Aquisição (GA4)
**Etapas:**
1. Landing Views → Sign Up Started → Sign Up Completed
2. Onboarding Started → Profile Completed
3. First Request Created → First Match

**Query GA4:**
```typescript
const funnel = await analyticsClient.runReport({
  property: propertyId,
  dateRanges: [{ startDate, endDate }],
  dimensions: [{ name: 'eventName' }],
  metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
  dimensionFilter: {
    filter: {
      fieldName: 'eventName',
      inListFilter: {
        values: ['page_view', 'sign_up', 'profile_complete', 'create_request']
      }
    }
  }
});
```

#### 5. Cohort Retention
**Fórmula:** % usuários ativos após N meses  
**Fonte:** Firebase  
**Meta:** >40% após 6 meses  

---

### 💰 FINANCEIRO

#### 1. MRR (Monthly Recurring Revenue)
**Ver North Star Metrics**

#### 2. ARR (Annual Recurring Revenue)
**Fórmula:** MRR × 12  
**Fonte:** Stripe  

#### 3. Churn Rate
**Fórmula:** (Cancelamentos no mês / Total clientes início do mês) × 100  
**Fonte:** Stripe  
**Meta:** <5%  
**Query:**
```typescript
const canceledSubs = await stripe.subscriptions.list({
  status: 'canceled',
  canceled_at: { gte: startTimestamp, lt: endTimestamp }
});

const activeSubsStart = await stripe.subscriptions.list({
  status: 'active',
  created: { lt: startTimestamp }
});

const churnRate = (canceledSubs.data.length / activeSubsStart.data.length) * 100;
```

#### 4. Burn Rate
**Fórmula:** Receita - Despesas (mensal)  
**Fonte:** Stripe (payouts como proxy de despesas)  
**Meta:** Positivo ou controlado  
**Query:**
```typescript
// Receita (charges)
const charges = await stripe.charges.list({
  created: { gte: startTimestamp },
  status: 'succeeded'
});
const revenue = charges.data.reduce((sum, c) => sum + c.amount, 0) / 100;

// Despesas (payouts a profissionais)
const payouts = await stripe.payouts.list({
  created: { gte: startTimestamp }
});
const expenses = payouts.data.reduce((sum, p) => sum + p.amount, 0) / 100;

const burnRate = revenue - expenses;
```

#### 5. Runway (Pista de Pouso)
**Fórmula:** Caixa Atual / |Burn Rate Mensal|  
**Fonte:** Stripe Balance  
**Meta:** >12 meses  
**Query:**
```typescript
const balance = await stripe.balance.retrieve();
const availableBalance = balance.available.reduce((sum, b) => sum + b.amount, 0) / 100;

const runway = availableBalance / Math.abs(burnRate);
```

**Status:**
- 🟢 Verde: >12 meses
- 🟡 Amarelo: 6-12 meses
- 🔴 Vermelho: <6 meses

#### 6. MRR em Risco
**Fórmula:** MRR de clientes com sinais de churn  
**Fonte:** Firebase + Stripe  
**Sinais:**
- Feedbacks negativos (rating <7)
- Tickets não resolvidos >7 dias
- Profissional desistiu pós-aceite
- Pagamento atrasado

---

### ⚙️ OPERACIONAL

#### 1. SLA de Atendimento
**Fórmula:** % solicitações atendidas em <24h  
**Fonte:** Firebase (`jobs` collection)  
**Meta:** >90%  
**Query:**
```typescript
const jobs = await db.collection('jobs')
  .where('createdAt', '>=', startOfMonth)
  .get();

const within24h = jobs.docs.filter(doc => {
  const data = doc.data();
  if (!data.acceptedAt) return false;
  
  const created = toDate(data.createdAt);
  const accepted = toDate(data.acceptedAt);
  const hours = (accepted.getTime() - created.getTime()) / (1000 * 60 * 60);
  
  return hours <= 24;
}).length;

const sla = (within24h / jobs.size) * 100;
```

**Status:**
- 🟢 Verde: >90%
- 🟡 Amarelo: 70-90%
- 🔴 Vermelho: <70%

#### 2. Tempo Médio de Match
**Fórmula:** Média (acceptedAt - createdAt)  
**Fonte:** Firebase  
**Meta:** <12h  

#### 3. Taxa de Aceite
**Fórmula:** (Jobs aceitos / Jobs criados) × 100  
**Fonte:** Firebase  
**Meta:** >80%  
**Query:**
```typescript
const totalJobs = await db.collection('jobs')
  .where('createdAt', '>=', startOfMonth)
  .get();

const acceptedJobs = totalJobs.docs.filter(doc => 
  doc.data().status === 'accepted' || 
  doc.data().status === 'scheduled' ||
  doc.data().status === 'completed'
).length;

const acceptanceRate = (acceptedJobs / totalJobs.size) * 100;
```

#### 4. Taxa de Rejeição/Abandono Pós-Aceite
**Fórmula:** (Jobs aceitos mas não finalizados / Jobs aceitos) × 100  
**Fonte:** Firebase  
**Meta:** <10%  
**Query:**
```typescript
const acceptedJobs = await db.collection('jobs')
  .where('status', 'in', ['accepted', 'scheduled'])
  .where('createdAt', '>=', thirtyDaysAgo)
  .get();

const completedOrActive = acceptedJobs.docs.filter(doc => {
  const data = doc.data();
  return data.status === 'completed' || 
         data.status === 'scheduled' ||
         (data.acceptedAt && 
          toDate(data.acceptedAt).getTime() >= sevenDaysAgo.getTime());
}).length;

const abandonmentRate = ((acceptedJobs.size - completedOrActive) / acceptedJobs.size) * 100;
```

#### 5. Profissionais Ativos
**Fórmula:** Profissionais com ≥1 job nos últimos 30 dias  
**Fonte:** Firebase  
**Query:**
```typescript
const recentJobs = await db.collection('jobs')
  .where('createdAt', '>=', thirtyDaysAgo)
  .get();

const activeProfessionals = new Set(
  recentJobs.docs.map(d => d.data().specialistId || d.data().professionalId)
).size;
```

#### 6. Famílias Ativas
**Fórmula:** Clientes com ≥1 job nos últimos 30 dias  
**Fonte:** Firebase  

---

### ✨ QUALIDADE

#### 1. NPS Geral
**Ver North Star Metrics**

#### 2. NPS por Etapa
**Etapas:**
- Pré-Match (experiência de busca)
- Match (qualidade do profissional)
- Atendimento (serviço prestado)
- Pós-Atendimento (suporte)

**Fonte:** Firebase (feedback com campo `stage`)  

#### 3. Tickets Críticos
**Fórmula:** Tickets com priority='high' não resolvidos >48h  
**Fonte:** Firebase (`tickets`)  
**Meta:** 0  
**Query:**
```typescript
const criticalTickets = await db.collection('tickets')
  .where('status', 'in', ['open', 'in_progress'])
  .where('priority', '==', 'high')
  .get();

const aged = criticalTickets.docs.filter(doc => {
  const created = toDate(doc.data().createdAt);
  const hoursSince = (Date.now() - created.getTime()) / (1000 * 60 * 60);
  return hoursSince > 48;
}).length;
```

#### 4. Tempo Médio de Resposta (First Response Time)
**Fórmula:** Média (firstResponseAt - createdAt)  
**Fonte:** Firebase  
**Meta:** <2h  

#### 5. Tempo Médio de Resolução
**Fórmula:** Média (resolvedAt - createdAt)  
**Fonte:** Firebase  
**Meta:** <24h  

#### 6. Feedbacks Negativos por Especialidade
**Fórmula:** % feedbacks com rating <7 por specialty  
**Fonte:** Firebase (join feedbacks + jobs)  
**Meta:** <15%  

---

## 📐 FÓRMULAS DE CÁLCULO

### Status de Saúde do Sistema (0-100)
```typescript
function calculateSystemHealth(metrics: {
  sla: number;              // 0-100
  acceptanceRate: number;   // 0-100
  churnRate: number;        // 0-100 (invertido)
  nps: number;              // -100 a 100
  abandonmentRate: number;  // 0-100 (invertido)
}): number {
  const score = (
    (metrics.sla * 0.25) +
    (metrics.acceptanceRate * 0.25) +
    ((100 - metrics.churnRate * 10) * 0.20) +
    (((metrics.nps + 100) / 2) * 0.20) +
    ((100 - metrics.abandonmentRate) * 0.10)
  );
  
  return Math.round(score);
}
```

**Status:**
- 🟢 Verde: >80 (Saudável)
- 🟡 Amarelo: 60-80 (Atenção)
- 🔴 Vermelho: <60 (Crítico)

---

## 🎨 CORES E THRESHOLDS

### Padrão de Status
- **🟢 Verde (Saudável):** Acima da meta
- **🟡 Amarelo (Atenção):** Próximo da meta (±10%)
- **🔴 Vermelho (Crítico):** Abaixo da meta ou problema ativo

### Thresholds por KPI
| KPI | Verde | Amarelo | Vermelho |
|-----|-------|---------|----------|
| MRR Growth | >10% | -5% a +5% | <-5% |
| Conversão | >15% | 10-15% | <10% |
| NPS | >50 | 0-50 | <0 |
| Churn | <3% | 3-5% | >5% |
| SLA | >90% | 70-90% | <70% |
| Runway | >12m | 6-12m | <6m |
| Acceptance | >80% | 60-80% | <60% |
| Abandonment | <10% | 10-20% | >20% |

---

## 📈 FREQUÊNCIA DE ATUALIZAÇÃO

| Módulo | Atualização | Cache |
|--------|-------------|-------|
| North Star | Tempo real | 5min |
| Financeiro | Diária | 1h |
| Growth | Semanal | 24h |
| Operacional | Tempo real | 15min |
| Qualidade | Diária | 1h |

---

**Status:** ✅ DEFINIDO  
**Próximo:** Definir Funis (FASE 2.2)
