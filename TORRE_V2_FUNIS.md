# 🎯 TORRE V2 - DEFINIÇÃO DE FUNIS

**Data:** 2024-12-18  
**Status:** Em Definição  
**Baseado em:** TORRE_V2_KPIS.md + INVENTARIO_TORRE_V2.md

---

## 📊 ESTRUTURA GERAL DE FUNIS

Cada funil possui:
- **Etapas:** Passos sequenciais com drop-off
- **Fonte de Dados:** GA4, Firebase ou Stripe
- **Métricas:** Taxa de conversão por etapa + geral
- **Alertas:** Quando conversão <meta
- **Ações:** O que fazer quando funil quebra

---

## 🚀 FUNIL 1: AQUISIÇÃO (GA4 + Firebase)

**Objetivo:** Converter visitantes em usuários cadastrados

### Etapas

```
ETAPA 1: Landing Page View
  ↓ (Drop: 70-80%)
ETAPA 2: Sign Up Started
  ↓ (Drop: 30-40%)
ETAPA 3: Sign Up Completed
  ↓ (Drop: 20-30%)
ETAPA 4: Profile Started
  ↓ (Drop: 10-20%)
ETAPA 5: Profile Completed (Ativação)
```

### Fontes de Dados

**GA4 (Eventos Customizados - A IMPLEMENTAR):**
```typescript
// Landing
gtag('event', 'page_view', {
  page_title: 'Home',
  page_location: window.location.href
});

// Sign Up Started
gtag('event', 'sign_up_started', {
  method: 'email',
  page: '/signup'
});

// Sign Up Completed
gtag('event', 'sign_up', {
  method: 'email',
  user_type: 'cliente' | 'profissional'
});

// Profile Started
gtag('event', 'profile_started', {
  user_type: 'cliente' | 'profissional'
});

// Profile Completed
gtag('event', 'profile_complete', {
  user_type: 'cliente' | 'profissional',
  completion_rate: 100
});
```

**Firebase (Verificação):**
```typescript
// Usuários criados
const signups = await db.collection('users')
  .where('createdAt', '>=', startDate)
  .get();

// Usuários com perfil completo
const activated = signups.docs.filter(d => 
  d.data().profileComplete === true ||
  d.data().porcentagemPerfil >= 90
).length;
```

### Query do Funil (GA4)
```typescript
async function getAcquisitionFunnel(startDate: string, endDate: string) {
  const analyticsClient = getAnalyticsClient();
  
  // Buscar eventos do funil
  const [response] = await analyticsClient.runReport({
    property: `properties/${process.env.GA4_PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'eventName' }],
    metrics: [
      { name: 'eventCount' },
      { name: 'totalUsers' }
    ],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        inListFilter: {
          values: [
            'page_view',
            'sign_up_started',
            'sign_up',
            'profile_started',
            'profile_complete'
          ]
        }
      }
    }
  });

  // Processar resposta
  const eventMap = new Map();
  response.rows?.forEach(row => {
    const eventName = row.dimensionValues?.[0]?.value;
    const count = parseInt(row.metricValues?.[0]?.value || '0');
    const users = parseInt(row.metricValues?.[1]?.value || '0');
    eventMap.set(eventName, { count, users });
  });

  return {
    step1_landing: eventMap.get('page_view')?.users || 0,
    step2_signupStarted: eventMap.get('sign_up_started')?.users || 0,
    step3_signupCompleted: eventMap.get('sign_up')?.users || 0,
    step4_profileStarted: eventMap.get('profile_started')?.users || 0,
    step5_profileCompleted: eventMap.get('profile_complete')?.users || 0,
  };
}
```

### Métricas
- **Taxa Geral:** (Profile Completed / Landing Views) × 100
- **Meta:** >5%
- **Taxa por Etapa:**
  - Landing → Sign Up Started: >20%
  - Sign Up Started → Completed: >60%
  - Sign Up → Profile Started: >70%
  - Profile Started → Completed: >80%

### Alertas
- 🔴 Taxa geral <3%
- 🟡 Taxa geral 3-5%
- 🟢 Taxa geral >5%

### Ações
- **Drop em Landing → Sign Up:** Melhorar CTA, mensagem de valor
- **Drop em Sign Up:** Simplificar formulário, reduzir campos
- **Drop em Profile:** Onboarding guiado, gamificação

---

## 💼 FUNIL 2: CONVERSÃO (Firebase + Stripe)

**Objetivo:** Converter usuários ativados em clientes pagantes

### Etapas

```
ETAPA 1: Profile Completed (Ativado)
  ↓ (Drop: 40-50%)
ETAPA 2: First Request Created
  ↓ (Drop: 20-30%)
ETAPA 3: Match Received
  ↓ (Drop: 10-20%)
ETAPA 4: Match Accepted
  ↓ (Drop: 10-15%)
ETAPA 5: Payment Completed
  ↓ (Drop: 5-10%)
ETAPA 6: Service Started
```

### Fontes de Dados

**Firebase:**
```typescript
async function getConversionFunnel(startDate: Date, endDate: Date) {
  const db = getFirestore();
  
  // Etapa 1: Usuários ativados
  const activatedUsers = await db.collection('users')
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<=', endDate)
    .where('perfil', '==', 'cliente')
    .get();
  
  const activatedIds = activatedUsers.docs
    .filter(d => d.data().profileComplete === true)
    .map(d => d.id);
  
  // Etapa 2: Solicitações criadas
  const requests = await db.collection('jobs')
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<=', endDate)
    .get();
  
  const requestsByUser = new Map();
  requests.docs.forEach(doc => {
    const clientId = doc.data().clientId || doc.data().familyId;
    if (!requestsByUser.has(clientId)) {
      requestsByUser.set(clientId, []);
    }
    requestsByUser.get(clientId).push(doc.data());
  });
  
  const usersWithRequests = Array.from(requestsByUser.keys())
    .filter(id => activatedIds.includes(id));
  
  // Etapa 3: Matches recebidos
  const usersWithMatches = usersWithRequests.filter(userId => {
    const userRequests = requestsByUser.get(userId);
    return userRequests.some((r: any) => 
      r.specialistId || r.professionalId
    );
  });
  
  // Etapa 4: Matches aceitos
  const usersWithAcceptedMatches = usersWithRequests.filter(userId => {
    const userRequests = requestsByUser.get(userId);
    return userRequests.some((r: any) => 
      r.status === 'accepted' || 
      r.status === 'scheduled' ||
      r.status === 'completed'
    );
  });
  
  return {
    step1_activated: activatedIds.length,
    step2_requestCreated: usersWithRequests.length,
    step3_matchReceived: usersWithMatches.length,
    step4_matchAccepted: usersWithAcceptedMatches.length,
  };
}
```

**Stripe (Etapas 5 e 6):**
```typescript
// Etapa 5: Pagamentos
const charges = await stripe.charges.list({
  created: { gte: startTimestamp, lte: endTimestamp },
  status: 'succeeded'
});

// Cruzar com Firebase para identificar usuários
const paidUserIds = new Set();
charges.data.forEach(charge => {
  // Identificar userId via metadata ou customer
  const userId = charge.metadata?.userId;
  if (userId) paidUserIds.add(userId);
});

// Etapa 6: Serviços iniciados
const completedJobs = await db.collection('jobs')
  .where('status', 'in', ['scheduled', 'completed'])
  .where('createdAt', '>=', startDate)
  .get();
```

### GA4 (Eventos de Conversão - A IMPLEMENTAR)
```typescript
// Criar solicitação
gtag('event', 'create_request', {
  request_type: 'cuidador' | 'enfermeiro',
  urgency: 'immediate' | 'scheduled'
});

// Match recebido
gtag('event', 'receive_match', {
  request_id: jobId,
  professional_id: specialistId
});

// Match aceito
gtag('event', 'accept_match', {
  request_id: jobId,
  professional_id: specialistId
});

// Pagamento
gtag('event', 'purchase', {
  transaction_id: chargeId,
  value: amount,
  currency: 'BRL',
  items: [{
    item_id: 'service',
    item_name: 'Atendimento'
  }]
});

// Serviço iniciado
gtag('event', 'service_started', {
  request_id: jobId,
  professional_id: specialistId
});
```

### Métricas
- **Taxa Geral:** (Service Started / Activated) × 100
- **Meta:** >15%
- **Taxa por Etapa:**
  - Activated → Request: >50%
  - Request → Match: >70%
  - Match → Accepted: >80%
  - Accepted → Payment: >85%
  - Payment → Service: >95%

### Alertas
- 🔴 Taxa geral <10%
- 🟡 Taxa geral 10-15%
- 🟢 Taxa geral >15%

### Ações
- **Drop em Request:** Email/push de incentivo, onboarding
- **Drop em Match:** Aumentar disponibilidade de profissionais
- **Drop em Accept:** Melhorar perfis, adicionar reviews
- **Drop em Payment:** Simplificar checkout, adicionar formas de pagamento
- **Drop em Service:** Follow-up CS, resolver bloqueios

---

## 🔄 FUNIL 3: RETENÇÃO (Firebase + Stripe)

**Objetivo:** Converter primeira compra em cliente recorrente

### Etapas

```
ETAPA 1: First Service Completed
  ↓ (Drop: 30-40%)
ETAPA 2: Feedback Submitted
  ↓ (Drop: 20-30%)
ETAPA 3: Second Request Created (D+30)
  ↓ (Drop: 15-25%)
ETAPA 4: Third Request Created (D+60)
  ↓ (Drop: 10-15%)
ETAPA 5: Subscription Created (Recurring)
```

### Fontes de Dados

**Firebase:**
```typescript
async function getRetentionFunnel(cohortStartDate: Date) {
  const db = getFirestore();
  
  // Etapa 1: Primeiro serviço completo
  const firstServices = await db.collection('jobs')
    .where('status', '==', 'completed')
    .where('createdAt', '>=', cohortStartDate)
    .get();
  
  // Agrupar por cliente e identificar primeiro serviço
  const clientFirstService = new Map();
  firstServices.docs.forEach(doc => {
    const data = doc.data();
    const clientId = data.clientId || data.familyId;
    const createdAt = toDate(data.createdAt);
    
    if (!clientFirstService.has(clientId) || 
        createdAt < clientFirstService.get(clientId).date) {
      clientFirstService.set(clientId, {
        date: createdAt,
        jobId: doc.id
      });
    }
  });
  
  const step1_firstService = Array.from(clientFirstService.keys());
  
  // Etapa 2: Feedback enviado
  const feedbacks = await db.collection('feedbacks').get();
  const clientsWithFeedback = new Set();
  feedbacks.docs.forEach(doc => {
    // Assumindo que feedback tem jobId ou clientId
    const jobId = doc.data().jobId;
    // Buscar clientId do job
    clientsWithFeedback.add(/* clientId */);
  });
  
  const step2_feedback = step1_firstService.filter(id => 
    clientsWithFeedback.has(id)
  );
  
  // Etapa 3: Segunda solicitação (30 dias)
  const thirtyDaysLater = new Date(cohortStartDate);
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
  
  const allJobs = await db.collection('jobs').get();
  const jobsByClient = new Map();
  allJobs.docs.forEach(doc => {
    const clientId = doc.data().clientId || doc.data().familyId;
    if (!jobsByClient.has(clientId)) {
      jobsByClient.set(clientId, []);
    }
    jobsByClient.get(clientId).push(doc.data());
  });
  
  const step3_secondRequest = step1_firstService.filter(clientId => {
    const jobs = jobsByClient.get(clientId) || [];
    return jobs.length >= 2;
  });
  
  // Etapa 4: Terceira solicitação (60 dias)
  const step4_thirdRequest = step1_firstService.filter(clientId => {
    const jobs = jobsByClient.get(clientId) || [];
    return jobs.length >= 3;
  });
  
  return {
    step1_firstService: step1_firstService.length,
    step2_feedback: step2_feedback.length,
    step3_secondRequest: step3_secondRequest.length,
    step4_thirdRequest: step4_thirdRequest.length,
  };
}
```

**Stripe (Etapa 5):**
```typescript
// Assinaturas criadas
const subscriptions = await stripe.subscriptions.list({
  created: { gte: startTimestamp },
  status: 'active'
});

// Cruzar com clientes que completaram serviços
const recurringClients = subscriptions.data.filter(sub => {
  const userId = sub.metadata?.userId;
  return step1_firstService.includes(userId);
}).length;
```

### Cohort Analysis
```typescript
interface CohortData {
  month: string;
  newUsers: number;
  retained: {
    month1: number; // % retidos após 1 mês
    month2: number;
    month3: number;
    month6: number;
    month12: number;
  };
}

async function generateCohortAnalysis(months: number = 12): Promise<CohortData[]> {
  const cohorts: CohortData[] = [];
  
  for (let i = 0; i < months; i++) {
    const cohortDate = new Date();
    cohortDate.setMonth(cohortDate.getMonth() - i);
    const cohortStart = new Date(cohortDate.getFullYear(), cohortDate.getMonth(), 1);
    const cohortEnd = new Date(cohortDate.getFullYear(), cohortDate.getMonth() + 1, 0);
    
    // Usuários novos neste mês
    const newUsers = await db.collection('users')
      .where('createdAt', '>=', cohortStart)
      .where('createdAt', '<=', cohortEnd)
      .where('perfil', '==', 'cliente')
      .get();
    
    const userIds = newUsers.docs.map(d => d.id);
    
    // Calcular retenção para cada período
    const retention = {
      month1: await calculateRetention(userIds, cohortStart, 1),
      month2: await calculateRetention(userIds, cohortStart, 2),
      month3: await calculateRetention(userIds, cohortStart, 3),
      month6: await calculateRetention(userIds, cohortStart, 6),
      month12: await calculateRetention(userIds, cohortStart, 12),
    };
    
    cohorts.push({
      month: cohortStart.toISOString().slice(0, 7),
      newUsers: userIds.length,
      retained: retention
    });
  }
  
  return cohorts;
}

async function calculateRetention(
  userIds: string[],
  cohortStart: Date,
  monthsLater: number
): Promise<number> {
  const checkDate = new Date(cohortStart);
  checkDate.setMonth(checkDate.getMonth() + monthsLater);
  
  const activeUsers = await db.collection('jobs')
    .where('clientId', 'in', userIds)
    .where('createdAt', '>=', checkDate)
    .get();
  
  const activeUserIds = new Set(
    activeUsers.docs.map(d => d.data().clientId || d.data().familyId)
  );
  
  return (activeUserIds.size / userIds.length) * 100;
}
```

### Métricas
- **Taxa Geral:** (Recurring / First Service) × 100
- **Meta:** >30% após 3 meses
- **Retenção por Período:**
  - 1 mês: >60%
  - 3 meses: >40%
  - 6 meses: >30%
  - 12 meses: >20%

### Alertas
- 🔴 Retenção M3 <25%
- 🟡 Retenção M3 25-35%
- 🟢 Retenção M3 >35%

### Ações
- **Drop em Feedback:** Email automático solicitando avaliação
- **Drop em 2ª Request:** Email com incentivo (desconto, crédito)
- **Drop em 3ª Request:** CS proativo, identificar necessidades
- **Drop em Recurring:** Oferta de assinatura com benefícios

---

## 🎨 VISUALIZAÇÃO DOS FUNIS

### Componente Recharts (Exemplo)
```typescript
import { Funnel, FunnelChart, LabelList, ResponsiveContainer } from 'recharts';

interface FunnelData {
  name: string;
  value: number;
  fill: string;
}

export function AcquisitionFunnelChart({ data }: { data: FunnelData[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <FunnelChart>
        <Funnel
          dataKey="value"
          data={data}
          isAnimationActive
        >
          <LabelList 
            position="right" 
            fill="#000" 
            stroke="none" 
            dataKey="name" 
          />
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  );
}

// Uso:
const acquisitionData = [
  { name: 'Landing Views', value: 10000, fill: '#8884d8' },
  { name: 'Sign Up Started', value: 2000, fill: '#83a6ed' },
  { name: 'Sign Up Completed', value: 1200, fill: '#8dd1e1' },
  { name: 'Profile Started', value: 840, fill: '#82ca9d' },
  { name: 'Profile Completed', value: 672, fill: '#a4de6c' },
];
```

---

## 📊 DASHBOARDS POR FUNIL

### Dashboard Aquisição
- Funil visual (5 etapas)
- Taxa de conversão por etapa
- Comparativo período anterior
- Principais drop-offs
- Ações recomendadas

### Dashboard Conversão
- Funil visual (6 etapas)
- Tempo médio em cada etapa
- Taxa de abandono por etapa
- Principais gargalos
- Valor médio por conversão

### Dashboard Retenção
- Cohort analysis (tabela + heatmap)
- Curva de retenção
- LTV por cohort
- Churn rate por período
- Ações de reativação

---

## 🔗 INTEGRAÇÃO COM ALERTAS

Cada funil gera alertas quando:
- Taxa de conversão <meta por 3 dias consecutivos
- Drop em etapa específica >20% vs período anterior
- Tempo em etapa >2x a média
- Abandono em etapa crítica (pagamento, aceite)

---

**Status:** ✅ DEFINIDO  
**Próximo:** Definir Alertas (FASE 2.3)
