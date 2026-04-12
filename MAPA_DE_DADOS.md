# Mapa de Dados - Base Historica

> Inventario historico usado na fase anterior do painel.
> Para a leitura oficial da superficie atual, use `KPI_PAINEL_OFICIAL.md` e o codigo em `src/services/admin/kpiDashboardMetrics.ts`.

> **Auditoria Completa**: Firestore, Stripe, GA4  
> **Data**: 2024-12-20  
> **Status**: ✅ Mapeamento baseado no código existente

---

## 🔥 FIRESTORE - Collections

### **1. users** (Usuários - Famílias + Profissionais)
```typescript
{
  // Identificação
  id: string (auto-generated doc ID)
  perfil: 'cliente' | 'profissional'
  
  // Dados pessoais
  nome?: string
  email?: string
  telefone?: string
  cpf?: string
  dataNascimento?: string | Timestamp
  
  // Localização
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  
  // Profissionais específicos
  especialidades?: string[] // ex: ["enfermagem", "cuidador"]
  disponibilidade?: string
  experiencia?: string
  
  // Stripe
  stripeCustomerId?: string
  
  // Metadados
  createdAt: string | Timestamp
  updatedAt?: string | Timestamp
  ativo?: boolean
}
```

**Breakdown por perfil**:
- `perfil: 'cliente'` → Famílias (demanda)
- `perfil: 'profissional'` → Cuidadores (oferta)

---

### **2. jobs** (Vagas/Solicitações de Cuidado)
```typescript
{
  // Identificação
  id: string (auto-generated doc ID)
  
  // Relacionamento
  clienteId: string // ref: users (perfil: cliente)
  professionalId?: string // ref: users (perfil: profissional) - após match
  
  // Detalhes da vaga
  titulo?: string
  descricao?: string
  tipo?: string // ex: "tempo integral", "meio período"
  
  // Status do job
  status: 'pending' | 'open' | 'matched' | 'active' | 'completed' | 'cancelled'
  
  // Candidaturas/Matches
  candidatos?: string[] // array de professionalIds
  matches?: Array<{
    professionalId: string
    status: 'pending' | 'accepted' | 'declined'
    createdAt: Timestamp
    acceptedAt?: Timestamp
    declinedAt?: Timestamp
  }>
  
  // Pagamento
  paymentId?: string // pode referenciar Stripe charge/payment_intent
  valor?: number
  
  // Metadados
  createdAt: string | Timestamp
  updatedAt?: string | Timestamp
  completedAt?: Timestamp
}
```

**Breakdown por status**:
- `pending/open` → Em aberto (demanda ativa)
- `matched` → Match realizado (aguardando confirmação)
- `active` → Serviço em andamento
- `completed` → Concluído
- `cancelled` → Cancelado

---

### **3. tickets** (Service Desk / Chamados)
```typescript
{
  // Identificação
  id: string (auto-generated doc ID)
  
  // Conteúdo
  titulo?: string
  descricao?: string
  tipo?: 'RECLAMAÇÃO' | 'PROBLEMA' | 'SUGESTÃO' | string
  
  // Status
  status: 'A_FAZER' | 'EM_ATENDIMENTO' | 'CONCLUIDO' | 'open' | 'closed' | string
  
  // Usuário
  usuarioId?: string
  usuarioNome?: string
  
  // Metadados
  createdAt: string | Timestamp (field: 'criadoEm' ou 'createdAt')
  updatedAt?: string | Timestamp (field: 'atualizadoEm' ou 'updatedAt')
  closedAt?: Timestamp
}
```

**Status possíveis**:
- `A_FAZER` / `open` → Novo
- `EM_ATENDIMENTO` → Em atendimento
- `CONCLUIDO` / `closed` → Resolvido

---

### **4. feedbacks** (Avaliações/Comentários)
```typescript
{
  // Identificação
  id: string (auto-generated doc ID)
  
  // Relacionamento
  usuarioId?: string // quem deu o feedback
  professionalId?: string // profissional avaliado
  jobId?: string // job relacionado
  
  // Conteúdo
  comentario?: string
  rating?: number // 1-5
  
  // Metadados
  createdAt: string | Timestamp
}
```

---

### **5. ratings** (Avaliações Numéricas)
```typescript
{
  // Identificação
  id: string (auto-generated doc ID)
  
  // Relacionamento
  professionalId?: string
  usuarioId?: string
  jobId?: string
  
  // Avaliação
  rating: number // 1-5
  categoria?: string
  
  // Metadados
  createdAt: string | Timestamp
}
```

---

### **6. payments** (Pagamentos - registro local)
```typescript
{
  // Identificação
  id: string (auto-generated doc ID)
  
  // Relacionamento
  usuarioId?: string
  jobId?: string
  
  // Stripe
  stripeChargeId?: string
  stripePaymentIntentId?: string
  
  // Valores
  valor?: number
  status?: string
  
  // Metadados
  createdAt: string | Timestamp
}
```

**Nota**: Pode existir mas dados financeiros principais vêm do **Stripe API**.

---

## 💳 STRIPE - API Objects

### **Objetos usados no código**:

#### **1. Charges** (`stripe.charges.list()`)
```typescript
// Usado em: stripeService.ts, finance.ts, financeiro.ts
stripe.charges.list({
  limit: 100,
  created: { gte: timestamp }
})

// Campos importantes:
- id: string
- amount: number (centavos)
- status: 'succeeded' | 'pending' | 'failed'
- created: timestamp
- customer: string
- description?: string
- metadata?: { jobId?, userId? }
```

**Uso**: Receita bruta, GMV, conversão de pagamento.

---

#### **2. Subscriptions** (`stripe.subscriptions.list()`)
```typescript
// Usado em: finance.ts, test-integrations.ts
stripe.subscriptions.list({
  status: 'active', // ou 'canceled'
  limit: 100
})

// Campos importantes:
- id: string
- status: 'active' | 'canceled' | 'incomplete' | 'past_due'
- current_period_start: timestamp
- current_period_end: timestamp
- customer: string
- items: { price, quantity }
```

**Uso**: MRR (Monthly Recurring Revenue), churn, assinaturas ativas.

---

#### **3. Customers** (implícito)
```typescript
// Referenciado em users.stripeCustomerId
// Pode ser usado para cruzamento Stripe <-> Firebase
```

---

## 📊 GOOGLE ANALYTICS 4 (GA4)

### **Configuração**:
```typescript
// Environment Variables:
GA4_PROPERTY_ID=properties/123456789
FIREBASE_ADMIN_SERVICE_ACCOUNT=<base64 JSON credentials>

// Cliente:
import { BetaAnalyticsDataClient } from '@google-analytics/data';
const client = new BetaAnalyticsDataClient({ credentials });
```

### **Métricas disponíveis via GA4 API**:

#### **Métricas de Tráfego** (via `runReport`)
```typescript
// Usado em: analytics.ts, daily-metrics/route.ts, analyticsService.ts

metrics: [
  'totalUsers',        // Usuários únicos
  'newUsers',          // Novos usuários
  'sessions',          // Sessões
  'screenPageViews',   // Visualizações de página
  'averageSessionDuration', // Tempo médio sessão (segundos)
  'bounceRate',        // Taxa de rejeição
  'conversions',       // Conversões totais
]

dimensions: [
  'date',              // YYYYMMDD
  'pagePath',          // URL da página
  'sessionSource',     // Fonte de tráfego
  'sessionMedium',     // Meio (organic, cpc, etc.)
]
```

#### **Eventos GA4** (NÃO implementados no código)
⚠️ **IMPORTANTE**: O código atual **NÃO cria eventos customizados no GA4**.

Apenas usa **métricas padrão** do GA4:
- `screenPageViews` (automático)
- `sessions` (automático)
- `totalUsers` (automático)
- `newUsers` (automático)

**Eventos mencionados em comentários** (mas NÃO rastreados):
- `sign_up` (comentário em analytics.ts)
- `purchase` (comentário em analytics.ts)
- `contact_caregiver` (comentário em analytics.ts)

**Decisão**: **Usar apenas métricas padrão GA4** (não criar eventos novos).

---

## 🎯 MAPEAMENTO TORRE DE CONTROLE

### **CARD 1: Demanda (Famílias)**
**Fonte de dados**: Firebase `users` (perfil: cliente)

Métricas:
- Total famílias ativas
- Novas famílias (últimos 30 dias)
- Taxa conversão (famílias → jobs criados)
- Tempo médio até primeiro job

---

### **CARD 2: Oferta (Cuidadores)**
**Fonte de dados**: Firebase `users` (perfil: profissional)

Métricas:
- Total cuidadores ativos
- Novos cuidadores (últimos 30 dias)
- Taxa ativação (cadastro → primeiro job)
- Disponibilidade média

---

### **CARD 3: Core MVP (Marketplace)**
**Fonte de dados**: Firebase `jobs`

Métricas:
- Jobs ativos
- Taxa de match (jobs → matched)
- Tempo médio de match
- Taxa conversão (matched → completed)

---

### **CARD 4: Financeiro**
**Fonte de dados**: Stripe `charges` + Firebase `jobs`

Métricas:
- GMV (Gross Merchandise Value)
- Receita (charges succeeded)
- Ticket médio
- Taxa conversão (jobs → pagamento)

---

### **CARD 5: Confiança**
**Fonte de dados**: Firebase `tickets`, `feedbacks`, `ratings`

Métricas:
- Tickets abertos (críticos)
- Rating médio (últimos 30 dias)
- NPS (se implementado)
- Alertas críticos

---

### **SERVICE DESK (Kanban)**
**Fonte de dados**: Firebase `tickets`

Colunas:
- A Fazer (`status: 'A_FAZER'` ou `'open'`)
- Em Atendimento (`status: 'EM_ATENDIMENTO'`)
- Concluído (`status: 'CONCLUIDO'` ou `'closed'`)

Campos exibidos:
- `titulo`
- `tipo` (RECLAMAÇÃO, PROBLEMA, SUGESTÃO)
- `usuarioNome`
- `createdAt`

---

## ✅ CONCLUSÃO DA AUDITORIA

### **Collections Firestore confirmadas**:
1. ✅ `users` (perfil: cliente/profissional)
2. ✅ `jobs` (status: pending/matched/active/completed/cancelled)
3. ✅ `tickets` (status: A_FAZER/EM_ATENDIMENTO/CONCLUIDO)
4. ✅ `feedbacks` (rating: 1-5)
5. ✅ `ratings` (rating: 1-5)
6. ⚠️ `payments` (pode existir, mas usar Stripe como fonte principal)

### **Stripe API confirmado**:
1. ✅ `stripe.charges.list()` → Receita, GMV
2. ✅ `stripe.subscriptions.list()` → MRR, churn

### **Google Analytics 4 confirmado**:
1. ✅ Métricas padrão: `totalUsers`, `sessions`, `screenPageViews`, `bounceRate`
2. ✅ Dimensões: `date`, `pagePath`, `sessionSource`
3. ❌ Eventos customizados: **NÃO implementados** (não criar novos)

### **Decisões arquiteturais**:
- ✅ Usar nomenclatura **PT-BR** (cuidadores, familias, confianca, etc.)
- ✅ Usar collection `tickets` existente (não criar `chamados`)
- ✅ Remover páginas duplicadas EN (caregivers, families, trust, friction)
- ✅ Usar apenas métricas GA4 padrão (não criar eventos)
- ✅ Fonte financeira principal: **Stripe API** (não `payments` collection)

---

**Próximo passo**: Implementar FASE 1 - Homepage com 5 Cards
