# Product Strategy - Documento Historico

> Analise preservada como referencia da fase anterior do painel.
> Nao representa a definicao oficial atual de KPI, nomenclatura ou prioridades do produto.

## 🎯 Executive Summary

**Produto:** Torre de Controle V2 (Admin Dashboard)  
**Tipo:** Marketplace Two-Sided (Famílias ↔ Cuidadores)  
**Status Atual:** Funcional, mas sub-otimizado para tomada de decisão estratégica  
**Oportunidade:** Transformar de painel operacional para **Command Center Estratégico**

---

## 📈 Análise Atual - Framework AARRR

### 🔍 O que temos hoje

| Pilar | Cobertura | Gap Crítico |
|-------|-----------|-------------|
| **Acquisition** | 40% | ❌ CAC, CPA, canais de aquisição |
| **Activation** | 60% | ⚠️ First Value Time, onboarding drop-off |
| **Retention** | 70% | ✅ Churn, mas falta cohort analysis |
| **Revenue** | 80% | ✅ MRR, mas falta LTV, unit economics |
| **Referral** | 10% | ❌ NPS existe, mas sem viral loops |

**Score AARRR:** 52/100 ⚠️

---

## 🚨 Indicadores Faltando (Críticos)

### 1. **North Star Metric** ❌
**Problema:** Não há uma métrica única que guie todas as decisões.

**Sugestão:**
```
North Star = "Jobs Completed with 4+ Rating per Month"
```

**Por quê:**
- Combina demanda (jobs criados)
- Oferta (cuidadores disponíveis)
- Qualidade (rating)
- Receita (jobs pagos)

**Implementação:**
```typescript
interface NorthStarMetric {
  value: number;              // Jobs completados com 4+ rating
  target: number;             // Meta mensal
  percentageOfGoal: number;   // % da meta
  weekOverWeek: number;       // Crescimento semanal
  monthOverMonth: number;     // Crescimento mensal
  contributors: {
    jobsCompleted: number;
    highRatingRate: number;   // % de jobs com 4+
    avgRating: number;
  };
}
```

---

### 2. **Unit Economics** ❌
**Problema:** Não sabemos se cada transação é lucrativa.

**Métricas Faltando:**

```typescript
interface UnitEconomics {
  // Custos de Aquisição
  cac: {
    familia: number;           // CAC por família
    cuidador: number;          // CAC por cuidador
    blended: number;           // CAC médio ponderado
  };
  
  // Lifetime Value
  ltv: {
    familia: number;           // LTV família (6-12 meses)
    cuidador: number;          // LTV cuidador (retention)
  };
  
  // Ratios Críticos
  ltvCacRatio: number;         // Ideal: >3.0
  
  // Margem Unitária
  avgJobRevenue: number;       // Receita média por job
  platformFee: number;         // Taxa da plataforma (%)
  grossMargin: number;         // Margem bruta
  
  // Payback Period
  paybackMonths: number;       // Ideal: <12 meses
  
  // Contribution Margin
  contributionMargin: number;  // Receita - custos variáveis
}
```

**Por quê é crítico:**
- Define se o modelo de negócio é sustentável
- Indica quanto podemos gastar em marketing
- Mostra quais canais/segmentos são lucrativos

---

### 3. **Cohort Analysis** ❌
**Problema:** Não vemos retenção por coorte (mês de entrada).

**Implementação:**

```typescript
interface CohortAnalysis {
  month: string;               // "2025-01"
  cohortSize: number;          // Usuários que entraram
  
  retention: {
    month1: number;            // % ativos após 1 mês
    month3: number;            // % ativos após 3 meses
    month6: number;            // % ativos após 6 meses
    month12: number;           // % ativos após 12 meses
  };
  
  revenue: {
    month1: number;            // Receita mês 1
    month3: number;            // Receita acumulada mês 3
    month6: number;            // Receita acumulada mês 6
    month12: number;           // Receita acumulada mês 12
  };
  
  behavior: {
    avgJobsPerUser: number;
    avgRevenuePerUser: number;
    churnedUsers: number;
    churnReasons: Record<string, number>;
  };
}
```

**Visualização:**
- Heatmap de retenção (mês de coorte x mês de vida)
- Gráfico de receita acumulada por coorte
- Comparação de coortes (Q1 vs Q2 vs Q3)

---

### 4. **Acquisition Metrics** ❌
**Problema:** Não sabemos de onde vêm os usuários.

```typescript
interface AcquisitionMetrics {
  // Por Canal
  byChannel: Array<{
    channel: 'organic' | 'paid_social' | 'paid_search' | 'referral' | 'direct';
    users: number;
    cost: number;              // Gasto no canal
    cac: number;               // CAC do canal
    conversionRate: number;    // % que viram clientes
    roi: number;               // ROI do canal
  }>;
  
  // Funil de Aquisição
  funnel: {
    visitors: number;          // Visitantes únicos
    signups: number;           // Cadastros
    activated: number;         // Completaram perfil
    firstJob: number;          // Criaram/aceitaram 1º job
    conversionRate: number;    // visitors → firstJob
  };
  
  // Velocidade
  timeToFirstJob: {
    median: number;            // Mediana (dias)
    p90: number;               // 90º percentil
    bySource: Record<string, number>;
  };
}
```

---

### 5. **Marketplace Liquidity** ⚠️
**Problema:** Temos balance, mas não liquidez (velocidade de match).

```typescript
interface MarketplaceLiquidity {
  // Supply/Demand Ratio
  ratio: number;               // Ideal: 1.2 - 1.5
  
  // Velocidade de Match
  timeToMatch: {
    median: number;            // Mediana (horas)
    p25: number;               // 25º percentil
    p75: number;               // 75º percentil
    p90: number;               // 90º percentil (SLA)
  };
  
  // Taxa de Preenchimento
  fillRate: number;            // % de jobs que encontram match
  
  // Qualidade do Match
  matchQuality: {
    acceptanceRate: number;    // % de matches aceitos
    completionRate: number;    // % de matches completados
    avgRating: number;         // Rating médio dos matches
  };
  
  // Thickness (profundidade do mercado)
  avgCandidatesPerJob: number; // Ideal: >3
  avgJobsPerProfessional: number;
  
  // Bottlenecks
  bottlenecks: Array<{
    specialty: string;
    region: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    demandSupplyGap: number;
  }>;
}
```

---

### 6. **Customer Satisfaction Score (CSAT)** ⚠️
**Problema:** Temos NPS, mas falta CSAT por jornada.

```typescript
interface CustomerSatisfaction {
  // NPS (já temos)
  nps: number;
  
  // CSAT por Touchpoint
  byTouchpoint: Array<{
    touchpoint: 'signup' | 'profile' | 'job_creation' | 'match' | 'service' | 'payment';
    score: number;             // 1-5
    responses: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  
  // Customer Effort Score (CES)
  ces: {
    overall: number;           // 1-7 (1=muito difícil, 7=muito fácil)
    byTask: Record<string, number>;
  };
  
  // Sentiment Analysis
  sentiment: {
    positive: number;          // %
    neutral: number;           // %
    negative: number;          // %
    topIssues: string[];
  };
}
```

---

### 7. **Operational Efficiency** ⚠️
**Problema:** Métricas operacionais espalhadas, sem consolidação.

```typescript
interface OperationalEfficiency {
  // Custo de Servir
  costToServe: {
    perJob: number;            // Custo operacional por job
    perUser: number;           // Custo por usuário ativo
    supportTickets: number;    // Custo por ticket
  };
  
  // Produtividade do Suporte
  support: {
    ticketsPerDay: number;
    avgResolutionTime: number; // Horas
    firstContactResolution: number; // %
    csatScore: number;         // 1-5
    costPerTicket: number;
  };
  
  // Automação
  automation: {
    automatedMatches: number;  // % de matches automáticos
    automatedPayments: number; // % de pagamentos sem intervenção
    manualInterventions: number; // # intervenções manuais/dia
  };
  
  // Qualidade dos Dados
  dataQuality: {
    profileCompleteness: number; // % campos preenchidos
    duplicateUsers: number;
    invalidData: number;
  };
}
```

---

## 🎯 Indicadores por Stakeholder

### 📊 **Para o CEO**

**Dashboard Executivo (1 tela, 30 segundos)**

```typescript
interface CEODashboard {
  northStar: {
    value: number;
    target: number;
    trend: 'up' | 'down' | 'stable';
  };
  
  keyMetrics: {
    gmv: number;               // Gross Merchandise Value
    revenue: number;           // Receita do mês
    activeUsers: number;       // Usuários ativos (30d)
    jobsCompleted: number;     // Jobs completados
  };
  
  health: {
    ltvCacRatio: number;       // Unit economics
    grossMargin: number;       // Margem
    burnRate: number;          // Queima mensal (se aplicável)
    monthsOfRunway: number;    // Pista de caixa
  };
  
  alerts: Array<{
    type: 'critical' | 'warning' | 'info';
    message: string;
    metric: string;
    impact: string;
  }>;
}
```

---

### 💰 **Para o CFO**

**Dashboard Financeiro**

```typescript
interface CFODashboard {
  // P&L Simplificado
  pnl: {
    revenue: {
      mrr: number;
      arr: number;
      growth: number;          // % MoM
    };
    costs: {
      cogs: number;            // Custo dos serviços
      sales: number;           // CAC total
      support: number;
      tech: number;
      total: number;
    };
    margins: {
      gross: number;           // %
      contribution: number;    // %
      ebitda: number;          // %
    };
  };
  
  // Cash Flow
  cashFlow: {
    operating: number;
    investing: number;
    financing: number;
    netChange: number;
    endingBalance: number;
  };
  
  // Unit Economics
  economics: {
    ltv: number;
    cac: number;
    ltvCacRatio: number;
    paybackMonths: number;
    marginsPerJob: number;
  };
  
  // Forecast
  forecast: {
    nextMonthRevenue: number;
    nextQuarterRevenue: number;
    confidence: number;        // %
  };
}
```

---

### 🎨 **Para o Head of Product**

**Dashboard de Produto**

```typescript
interface ProductDashboard {
  // Adoção de Features
  featureAdoption: Array<{
    feature: string;
    users: number;             // Usuários que usaram
    usage: number;             // Uso médio
    retention: number;         // % que voltou a usar
    impact: number;            // Impacto no North Star
  }>;
  
  // Jornadas
  journeys: {
    familia: {
      signupToFirstJob: number;     // Tempo médio (horas)
      dropOffPoints: Array<{
        step: string;
        dropRate: number;
      }>;
    };
    cuidador: {
      signupToFirstMatch: number;
      activationRate: number;
    };
  };
  
  // Qualidade
  quality: {
    bugReports: number;
    p1Bugs: number;            // Bugs críticos
    crashRate: number;         // %
    performanceScore: number;  // 0-100
  };
  
  // Experimentos A/B
  experiments: Array<{
    name: string;
    status: 'running' | 'completed' | 'paused';
    winner: 'A' | 'B' | 'inconclusive';
    lift: number;              // % melhoria
    confidence: number;        // %
  }>;
}
```

---

### 📣 **Para o Head of Marketing**

**Dashboard de Marketing**

```typescript
interface MarketingDashboard {
  // Performance por Canal
  channels: Array<{
    channel: string;
    spend: number;
    impressions: number;
    clicks: number;
    signups: number;
    customers: number;
    cac: number;
    roi: number;
    roas: number;              // Return on Ad Spend
  }>;
  
  // Funil de Aquisição
  funnel: {
    top: number;               // Awareness
    middle: number;            // Consideration
    bottom: number;            // Conversion
    conversionRates: {
      topToMiddle: number;
      middleToBottom: number;
      overall: number;
    };
  };
  
  // Retenção & Engagement
  engagement: {
    dau: number;               // Daily Active Users
    mau: number;               // Monthly Active Users
    dauMauRatio: number;       // Stickiness
    l7: number;                // % retorno em 7 dias
    l30: number;               // % retorno em 30 dias
  };
  
  // Conteúdo
  content: {
    blogPosts: number;
    organicTraffic: number;
    emailOpen: number;         // %
    emailClick: number;        // %
    socialEngagement: number;
  };
}
```

---

### 🎧 **Para o Head of Customer Success**

**Dashboard de CS**

```typescript
interface CustomerSuccessDashboard {
  // Saúde dos Clientes
  customerHealth: {
    healthy: number;           // % clientes saudáveis
    atRisk: number;            // % em risco
    churned: number;           // % que churnam
    
    healthScore: {
      avg: number;             // 0-100
      distribution: Record<string, number>;
    };
  };
  
  // Suporte
  support: {
    openTickets: number;
    avgResponseTime: number;   // Horas
    avgResolutionTime: number; // Horas
    csat: number;              // 1-5
    backlog: number;
  };
  
  // Onboarding
  onboarding: {
    inProgress: number;
    completed: number;
    dropOff: number;
    timeToValue: number;       // Dias até 1º job
  };
  
  // Upsell/Cross-sell
  expansion: {
    upsellRate: number;        // %
    expansionRevenue: number;
    netRevenueRetention: number; // % (ideal >100%)
  };
}
```

---

## 🔥 Top 10 Indicadores que Faltam (Prioridade)

### 🥇 **Alta Prioridade (Implementar em 2 semanas)**

1. **North Star Metric**
   - `Jobs Completed with 4+ Rating/Month`
   - Impacto: Alinha todos os times
   - Esforço: Médio (2-3 dias)

2. **LTV:CAC Ratio**
   - Determina sustentabilidade do negócio
   - Impacto: Crítico para fundraising
   - Esforço: Alto (1 semana - precisa tracking de custos)

3. **Time to Match (P50, P90)**
   - Velocidade do marketplace
   - Impacto: Alto (afeta satisfação e conversão)
   - Esforço: Baixo (1 dia - query Firestore)

4. **Cohort Retention Table**
   - Entender retenção por período de entrada
   - Impacto: Alto (prever churn, LTV)
   - Esforço: Médio (3 dias)

5. **Fill Rate**
   - % de jobs que encontram match em 24h
   - Impacto: Alto (liquidez do marketplace)
   - Esforço: Baixo (2 dias)

---

### 🥈 **Média Prioridade (Implementar em 1 mês)**

6. **CAC por Canal**
   - Facebook, Google, Organic, Referral
   - Impacto: Alto (otimizar marketing spend)
   - Esforço: Alto (requer UTM tracking + integração analytics)

7. **Customer Health Score**
   - Composto: Atividade + NPS + Frequência + Valor
   - Impacto: Médio (prevenir churn)
   - Esforço: Médio (4 dias)

8. **Gross Margin por Job**
   - Margem real descontando custos variáveis
   - Impacto: Alto (unit economics)
   - Esforço: Médio (3 dias)

9. **CSAT por Touchpoint**
   - Signup, Match, Payment, Support
   - Impacto: Médio (identificar fricções)
   - Esforço: Alto (requer survey framework)

10. **Product Adoption Rate**
    - % de usuários usando features principais
    - Impacto: Médio (priorizar roadmap)
    - Esforço: Médio (3 dias)

---

## 📐 Framework de Decisão: RICE Score

Priorizando features/melhorias do dashboard:

| Feature | Reach | Impact | Confidence | Effort | RICE Score |
|---------|-------|--------|------------|--------|------------|
| North Star Metric | 100% | 3 | 100% | 2 | **150** ⭐ |
| LTV:CAC Ratio | 100% | 3 | 80% | 5 | **48** |
| Cohort Analysis | 80% | 3 | 90% | 3 | **72** |
| Time to Match | 90% | 2 | 100% | 1 | **180** ⭐⭐ |
| Fill Rate | 90% | 2 | 100% | 2 | **90** |
| CAC por Canal | 60% | 3 | 70% | 8 | **16** |
| Health Score | 50% | 2 | 60% | 4 | **15** |
| Gross Margin/Job | 80% | 3 | 90% | 3 | **72** |
| CSAT Touchpoint | 70% | 2 | 80% | 6 | **19** |
| Feature Adoption | 60% | 2 | 70% | 3 | **28** |

**Priorização Final:**
1. ⭐⭐ Time to Match (RICE: 180)
2. ⭐ North Star Metric (RICE: 150)
3. Fill Rate (RICE: 90)
4. Cohort Analysis (RICE: 72)
5. Gross Margin/Job (RICE: 72)

---

## 🎯 Roadmap de Indicadores (90 dias)

### 📅 **Sprint 1 (Semanas 1-2): Quick Wins**

**Objetivo:** Entregar indicadores críticos de liquidez

- [ ] Time to Match (P50, P90, P99)
- [ ] Fill Rate (24h, 48h, 7d)
- [ ] North Star Metric (Jobs 4+ Rating)
- [ ] Dashboard de Liquidez do Marketplace

**Entregável:** 1 nova página "Marketplace Health"

---

### 📅 **Sprint 2 (Semanas 3-4): Economics**

**Objetivo:** Validar unit economics

- [ ] LTV por coorte (6 meses)
- [ ] CAC estimado (sem tracking ainda)
- [ ] Gross Margin por job
- [ ] LTV:CAC Ratio
- [ ] Payback Period

**Entregável:** Card "Unit Economics" na homepage

---

### 📅 **Sprint 3 (Semanas 5-6): Cohorts**

**Objetivo:** Entender retenção profunda

- [ ] Cohort Retention Table (famílias)
- [ ] Cohort Retention Table (cuidadores)
- [ ] Cohort Revenue Curve
- [ ] Churn Prediction Model (v1)

**Entregável:** Página "Cohort Analysis"

---

### 📅 **Sprint 4 (Semanas 7-8): Acquisition**

**Objetivo:** Entender de onde vêm usuários

- [ ] Implementar UTM tracking
- [ ] Dashboard de canais (manual)
- [ ] Funil de aquisição
- [ ] CAC por canal

**Entregável:** Página "Acquisition"

---

### 📅 **Sprint 5 (Semanas 9-10): Customer Health**

**Objetivo:** Prevenir churn

- [ ] Customer Health Score
- [ ] Segmentação (healthy/at-risk/churned)
- [ ] Early Warning System
- [ ] CSAT por touchpoint (survey)

**Entregável:** Página "Customer Health"

---

### 📅 **Sprint 6 (Semanas 11-12): Polish + Stakeholder Views**

**Objetivo:** Dashboards por role

- [ ] CEO Dashboard (North Star + 5 métricas)
- [ ] CFO Dashboard (P&L + Economics)
- [ ] Product Dashboard (Features + Experimentos)
- [ ] Marketing Dashboard (Canais + Funil)
- [ ] CS Dashboard (Health + Suporte)

**Entregável:** 5 dashboards por stakeholder

---

## 💡 Recomendações Estratégicas

### 🔴 **Crítico (Fazer AGORA)**

1. **Definir North Star Metric**
   - Reunir C-level
   - Decidir: Jobs 4+ Rating ou outro
   - Comunicar para toda empresa
   - Colocar em DESTAQUE no dashboard

2. **Medir Time to Match**
   - É o indicador de saúde do marketplace
   - Se >24h, marketplace não está líquido
   - Correlaciona com satisfação

3. **Calcular LTV:CAC**
   - Se <1.0 → modelo quebrado
   - Se 1.0-3.0 → zona de risco
   - Se >3.0 → modelo saudável
   - Precisa disso para decisões de marketing

---

### 🟡 **Importante (Próximas 4 semanas)**

4. **Implementar Cohort Analysis**
   - Ver qual mês trouxe melhores usuários
   - Entender curva de retenção
   - Prever LTV com mais precisão

5. **Tracking de Aquisição**
   - UTMs em todos os links
   - Integrar GA4 → Firebase
   - Dashboards por canal

6. **Customer Health Score**
   - Fórmula simples: Atividade (40%) + Satisfação (30%) + Frequência (20%) + Valor (10%)
   - Alertas para at-risk

---

### 🟢 **Desejável (Próximos 3 meses)**

7. **A/B Testing Framework**
   - Experimentar preços, features, UX
   - Medir impacto no North Star

8. **Predictive Analytics**
   - Modelo de churn prediction
   - Forecast de receita
   - Demand forecasting

9. **Benchmarking**
   - Comparar com outros marketplaces
   - Industry standards (time to match, fill rate)

---

## 📊 Templates de Queries (Implementação)

### Query 1: Time to Match

```typescript
// Firestore query
const getTimeToMatch = async (startDate: string, endDate: string) => {
  const jobs = await db.collection('jobs')
    .where('status', '==', 'matched')
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<=', endDate)
    .get();
  
  const times = jobs.docs.map(doc => {
    const data = doc.data();
    const created = data.createdAt.toDate();
    const matched = data.matches?.find(m => m.status === 'accepted')?.acceptedAt?.toDate();
    
    if (!matched) return null;
    
    const diffHours = (matched - created) / (1000 * 60 * 60);
    return diffHours;
  }).filter(Boolean);
  
  times.sort((a, b) => a - b);
  
  return {
    median: times[Math.floor(times.length / 2)],
    p90: times[Math.floor(times.length * 0.9)],
    p95: times[Math.floor(times.length * 0.95)],
    avg: times.reduce((a, b) => a + b, 0) / times.length
  };
};
```

### Query 2: Fill Rate

```typescript
const getFillRate = async (startDate: string, endDate: string, windowHours = 24) => {
  const allJobs = await db.collection('jobs')
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<=', endDate)
    .get();
  
  let filled = 0;
  
  allJobs.docs.forEach(doc => {
    const data = doc.data();
    const created = data.createdAt.toDate();
    const matched = data.matches?.find(m => m.status === 'accepted')?.acceptedAt?.toDate();
    
    if (matched) {
      const diffHours = (matched - created) / (1000 * 60 * 60);
      if (diffHours <= windowHours) {
        filled++;
      }
    }
  });
  
  return {
    totalJobs: allJobs.size,
    filledInWindow: filled,
    fillRate: (filled / allJobs.size) * 100
  };
};
```

### Query 3: Cohort Retention

```typescript
const getCohortRetention = async (cohortMonth: string) => {
  // Usuários que entraram no cohortMonth
  const cohortUsers = await db.collection('users')
    .where('createdAt', '>=', `${cohortMonth}-01`)
    .where('createdAt', '<', getNextMonth(cohortMonth))
    .get();
  
  const cohortSize = cohortUsers.size;
  const userIds = cohortUsers.docs.map(d => d.id);
  
  // Calcular atividade nos meses seguintes
  const retention = {};
  
  for (let i = 1; i <= 12; i++) {
    const targetMonth = addMonths(cohortMonth, i);
    
    // Contar quantos fizeram job nesse mês
    const activeUsers = await db.collection('jobs')
      .where('clienteId', 'in', userIds.slice(0, 10)) // Firestore limit
      .where('createdAt', '>=', `${targetMonth}-01`)
      .where('createdAt', '<', getNextMonth(targetMonth))
      .get();
    
    const uniqueActive = new Set(activeUsers.docs.map(d => d.data().clienteId)).size;
    
    retention[`month${i}`] = (uniqueActive / cohortSize) * 100;
  }
  
  return {
    cohortMonth,
    cohortSize,
    retention
  };
};
```

---

## 🎯 Conclusão & Next Steps

### ✅ O que fazer SEGUNDA-FEIRA:

1. **Agendar reunião de 1h** com C-level
   - Decidir North Star Metric
   - Alinhar prioridades de indicadores

2. **Criar task no backlog**
   - "Implementar Time to Match" (2 story points)
   - "Implementar Fill Rate" (2 story points)
   - "Dashboard de North Star" (3 story points)

3. **Começar tracking de custos**
   - Levantar custo de marketing por canal
   - Calcular custo de servir por job
   - Preparar planilha de LTV:CAC

### 📊 Indicadores-chave por ordem de implementação:

```
Semana 1-2:
1. Time to Match
2. Fill Rate
3. North Star Metric

Semana 3-4:
4. LTV:CAC Ratio
5. Gross Margin

Semana 5-6:
6. Cohort Retention
7. Customer Health Score

Semana 7-8:
8. CAC por Canal
9. Funnel de Aquisição

Semana 9-12:
10. Dashboards por Stakeholder
```

---

**Transforme o Torre de Controle de um painel operacional em um verdadeiro Command Center estratégico! 🚀**
