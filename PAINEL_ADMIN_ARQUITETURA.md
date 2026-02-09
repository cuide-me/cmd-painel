# 🏥 PAINEL ADMINISTRATIVO CUIDE-ME
## Arquitetura Completa Baseada em Dados Reais

> **Data da Auditoria:** 08/02/2026  
> **Versão:** 3.0.0  
> **Status:** ✅ Mapeamento 100% Baseado em Dados Reais  
> **Princípio:** ZERO dados inventados | ZERO métricas mockadas

---

## 📋 ÍNDICE

1. [Auditoria de Dados](#auditoria-de-dados)
2. [Arquitetura do Painel](#arquitetura-do-painel)
3. [Módulos Detalhados](#módulos-detalhados)
4. [Diretrizes de Design](#diretrizes-de-design)
5. [Wireframes](#wireframes)
6. [O Que NÃO Existe](#o-que-não-existe)
7. [Plano de Implementação](#plano-de-implementação)

---

## 🔍 AUDITORIA DE DADOS

### **Collections Firestore Confirmadas**

#### 1. **`users`** - Usuários (Famílias + Profissionais)
```typescript
interface UserDocument {
  // === CAMPOS REAIS MAPEADOS ===
  
  // Identificação
  id: string;                           // ✅ Document ID
  perfil: 'cliente' | 'profissional';   // ✅ CAMPO CRÍTICO
  
  // Dados Pessoais
  nome?: string;                        // ✅ Nome completo
  email?: string;                       // ✅ Email
  telefone?: string;                    // ✅ Telefone
  cpf?: string;                         // ✅ CPF
  dataNascimento?: Timestamp | string;  // ✅ Data nascimento
  
  // Localização (geográfica)
  endereco?: string;                    // ✅ Endereço completo
  cidade?: string;                      // ✅ Cidade
  estado?: string;                      // ✅ UF (2 letras)
  cep?: string;                         // ✅ CEP
  
  // Campos específicos PROFISSIONAIS
  especialidades?: string[];            // ✅ Array ex: ["enfermagem", "cuidador"]
  disponibilidade?: string;             // ✅ Texto livre
  experiencia?: string;                 // ✅ Anos ou descrição
  
  // Stripe
  stripeCustomerId?: string;            // ✅ ID Stripe Customer
  
  // Metadata
  createdAt: Timestamp | string;        // ✅ Data de cadastro
  updatedAt?: Timestamp | string;       // ✅ Última atualização
  ativo?: boolean;                      // ✅ Status ativo/inativo
}
```

**Breakdown:**
- **`perfil: 'cliente'`** → Famílias (DEMANDA)  
- **`perfil: 'profissional'`** → Cuidadores (OFERTA)

**Métricas Possíveis:**
- ✅ Total de famílias (`perfil === 'cliente'`)
- ✅ Total de profissionais (`perfil === 'profissional'`)
- ✅ Cadastros por período (`createdAt >= startDate`)
- ✅ Distribuição geográfica (`cidade`, `estado`)
- ✅ Profissionais por especialidade (`especialidades`)
- ✅ Taxa de ativação (usuários com `ativo === true`)

---

#### 2. **`jobs`** - Vagas/Solicitações de Cuidado
```typescript
interface JobDocument {
  // === CAMPOS REAIS MAPEADOS ===
  
  // Identificação
  id: string;                           // ✅ Document ID
  
  // Relacionamentos
  clientId?: string;                    // ✅ Ref: users (perfil: cliente)
  familyId?: string;                    // ✅ Alias para clientId
  professionalId?: string;              // ✅ Ref: users (perfil: profissional)
  specialistId?: string;                // ✅ Alias para professionalId
  
  // Detalhes da vaga
  titulo?: string;                      // ✅ Título do job
  descricao?: string;                   // ✅ Descrição
  tipo?: string;                        // ✅ Ex: "tempo integral"
  specialty?: string;                   // ✅ Especialidade necessária
  
  // Status do Job (MÚLTIPLAS VERSÕES - PT/EN)
  status:
    // Versão PT-BR
    | 'pendente'
    | 'proposta_aceita'
    | 'concluido'
    | 'cancelado'
    // Versão EN
    | 'pending'
    | 'open'
    | 'matched'
    | 'accepted'
    | 'in_progress'
    | 'active'
    | 'completed'
    | 'cancelled';
  
  // Candidaturas/Matches
  candidatos?: string[];                // ✅ Array de professionalIds
  matches?: Array<{
    professionalId: string;
    status: 'pending' | 'accepted' | 'declined';
    createdAt: Timestamp;
    acceptedAt?: Timestamp;
    declinedAt?: Timestamp;
  }>;
  
  // Proposta
  proposal?: {
    sentAt?: Timestamp;                 // ✅ Data envio proposta
    clientDecisionAt?: Timestamp;       // ✅ Data decisão cliente
    status?: string;
  };
  
  // Atendimento
  attendanceRegistered?: boolean;       // ✅ Serviço realizado
  
  // Pagamento
  paymentId?: string;                   // ✅ Ref Stripe payment
  valor?: number;                       // ✅ Valor do job
  
  // Localização (herdada do cliente)
  cidade?: string;                      // ✅ Cidade
  estado?: string;                      // ✅ UF
  
  // Metadata
  createdAt: Timestamp | string;        // ✅ Data de criação
  updatedAt?: Timestamp | string;       // ✅ Última atualização
  completedAt?: Timestamp;              // ✅ Data conclusão
}
```

**Status Normalizados (para queries):**
```typescript
// MAPEAMENTO STATUS
const STATUS_MAP = {
  // Criados/Pendentes
  pending: ['pending', 'pendente', 'open'],
  
  // Match realizado
  matched: ['matched', 'proposta_aceita', 'accepted'],
  
  // Em andamento
  active: ['active', 'in_progress'],
  
  // Concluídos
  completed: ['completed', 'concluido', 'attendanceRegistered: true'],
  
  // Cancelados
  cancelled: ['cancelled', 'cancelado']
};
```

**Métricas Possíveis:**
- ✅ Total de jobs criados
- ✅ Jobs por status
- ✅ Tempo médio até match (`createdAt` → `proposal.sentAt`)
- ✅ Taxa de match (jobs com `professionalId`)
- ✅ Taxa de conclusão (status = completed)
- ✅ Taxa de cancelamento
- ✅ Distribuição geográfica de demanda
- ✅ Jobs por especialidade
- ✅ Famílias únicas (`Set(clientId)`)
- ✅ Profissionais únicos (`Set(professionalId)`)

---

#### 3. **`tickets`** - Service Desk / Chamados
```typescript
interface TicketDocument {
  // === CAMPOS REAIS MAPEADOS ===
  
  // Identificação
  id: string;                           // ✅ Document ID
  
  // Conteúdo
  titulo?: string;                      // ✅ Título
  descricao?: string;                   // ✅ Descrição
  tipo?: 
    | 'RECLAMAÇÃO'
    | 'PROBLEMA'
    | 'SUGESTÃO'
    | string;                           // ✅ Tipo
  
  // Status (múltiplas versões)
  status:
    | 'A_FAZER'
    | 'EM_ATENDIMENTO'
    | 'CONCLUIDO'
    | 'open'
    | 'in_progress'
    | 'resolved'
    | 'closed'
    | string;
  
  // Usuário
  usuarioId?: string;                   // ✅ Ref: users
  usuarioNome?: string;                 // ✅ Nome do usuário
  
  // Metadata
  createdAt: Timestamp | string;        // ✅ criadoEm / createdAt
  updatedAt?: Timestamp | string;       // ✅ atualizadoEm / updatedAt
  closedAt?: Timestamp;                 // ✅ Data fechamento
}
```

**Métricas Possíveis:**
- ✅ Total de tickets
- ✅ Tickets por status
- ✅ Tickets por tipo (RECLAMAÇÃO, PROBLEMA, SUGESTÃO)
- ✅ Tempo médio de resolução (`createdAt` → `closedAt`)
- ✅ Tickets em aberto (status != CONCLUIDO/closed)
- ✅ SLA: tickets > 48h sem resposta

---

#### 4. **`feedbacks`** - Avaliações Textuais
```typescript
interface FeedbackDocument {
  // === CAMPOS REAIS MAPEADOS ===
  
  // Identificação
  id: string;                           // ✅ Document ID
  
  // Relacionamentos
  usuarioId?: string;                   // ✅ Quem avaliou
  professionalId?: string;              // ✅ Profissional avaliado
  jobId?: string;                       // ✅ Job relacionado
  
  // Conteúdo
  comentario?: string;                  // ✅ Comentário textual
  rating?: number;                      // ✅ Nota 1-5
  
  // Metadata
  createdAt: Timestamp | string;        // ✅ Data
}
```

---

#### 5. **`ratings`** - Avaliações Numéricas
```typescript
interface RatingDocument {
  // === CAMPOS REAIS MAPEADOS ===
  
  // Identificação
  id: string;                           // ✅ Document ID
  
  // Relacionamentos
  professionalId?: string;              // ✅ Profissional avaliado
  usuarioId?: string;                   // ✅ Quem avaliou
  jobId?: string;                       // ✅ Job relacionado
  
  // Avaliação
  rating: number;                       // ✅ Nota 1-5
  categoria?: string;                   // ✅ Categoria
  
  // Metadata
  createdAt: Timestamp | string;        // ✅ Data
}
```

**Métricas Possíveis (feedbacks + ratings):**
- ✅ Avaliação média geral
- ✅ Avaliação média por profissional
- ✅ Distribuição de notas (1-5)
- ✅ NPS (se rating >= 4 = promotor, 3 = neutro, <= 2 = detrator)
- ✅ Total de avaliações
- ✅ Taxa de avaliação (jobs concluídos com avaliação)

---

#### 6. **`payment_confirmations`** - Confirmações de Pagamento
```typescript
interface PaymentConfirmationDocument {
  // === CAMPOS REAIS MAPEADOS ===
  
  // Identificação
  id: string;                           // ✅ Document ID
  
  // Status
  businessStatus: 'confirmed' | string; // ✅ Status de negócio
  
  // Valor
  amount?: number;                      // ✅ Valor (centavos ou reais)
  
  // Metadata
  confirmedAt: Timestamp | string;      // ✅ Data de confirmação
}
```

**Uso:** Pagamentos confirmados (fonte complementar ao Stripe)

---

#### 7. **`transacoes`** - Transações Financeiras
```typescript
interface TransacaoDocument {
  // === CAMPOS REAIS MAPEADOS ===
  
  // Identificação
  id: string;                           // ✅ Document ID
  
  // Valor
  valor?: number;                       // ✅ Valor da transação
  
  // Tipo
  tipo?: string;                        // ✅ Tipo de transação
  
  // Metadata
  createdAt: Timestamp | string;        // ✅ Data
}
```

**Uso:** Registro de transações financeiras

---

#### 8. **`proposals`** - Propostas (Opcional)
```typescript
interface ProposalDocument {
  // === CAMPOS REAIS MAPEADOS ===
  
  // Identificação
  id: string;                           // ✅ Document ID
  
  // Status
  status: 'pending' | 'active' | string;// ✅ Status
  
  // Metadata
  createdAt?: Timestamp;                // ✅ Data
}
```

---

### **Stripe API - Objetos Disponíveis**

#### 1. **Charges** (`stripe.charges.list()`)
```typescript
interface StripeCharge {
  id: string;                           // ✅ Charge ID
  amount: number;                       // ✅ Valor em centavos
  status:                               // ✅ Status
    | 'succeeded'
    | 'pending'
    | 'failed';
  created: number;                      // ✅ Timestamp Unix
  customer?: string;                    // ✅ Customer ID
  description?: string;                 // ✅ Descrição
  metadata?: {                          // ✅ Metadata customizada
    jobId?: string;
    userId?: string;
  };
}
```

**Métricas Possíveis:**
- ✅ Receita bruta (soma `amount` onde `status === 'succeeded'`)
- ✅ GMV (Gross Merchandise Value)
- ✅ Taxa de sucesso de pagamentos
- ✅ Valor médio por transação
- ✅ Receita por período
- ✅ Falhas de pagamento (`status === 'failed'`)

---

#### 2. **Subscriptions** (`stripe.subscriptions.list()`)
```typescript
interface StripeSubscription {
  id: string;                           // ✅ Subscription ID
  status:                               // ✅ Status
    | 'active'
    | 'canceled'
    | 'incomplete'
    | 'past_due'
    | 'trialing';
  current_period_start: number;         // ✅ Timestamp
  current_period_end: number;           // ✅ Timestamp
  customer: string;                     // ✅ Customer ID
  items: {                              // ✅ Items
    data: Array<{
      price: { unit_amount: number };
      quantity: number;
    }>;
  };
}
```

**Métricas Possíveis:**
- ✅ MRR (Monthly Recurring Revenue)
- ✅ Assinaturas ativas
- ✅ Churn rate
- ✅ Taxa de renovação
- ✅ Lifetime Value (LTV)

---

### **Google Analytics 4 - Métricas Disponíveis**

#### **Métricas Padrão GA4** (via `runReport` API)
```typescript
const GA4_METRICS = {
  // Tráfego
  'totalUsers': 'Usuários únicos',
  'newUsers': 'Novos usuários',
  'sessions': 'Sessões',
  'screenPageViews': 'Visualizações de página',
  
  // Engajamento
  'averageSessionDuration': 'Duração média (segundos)',
  'bounceRate': 'Taxa de rejeição',
  'engagementRate': 'Taxa de engajamento',
  
  // Conversão
  'conversions': 'Conversões totais',
  'totalRevenue': 'Receita total',
  'eventCount': 'Contagem de eventos',
};

const GA4_DIMENSIONS = {
  'date': 'Data (YYYYMMDD)',
  'pagePath': 'URL da página',
  'sessionSource': 'Fonte de tráfego',
  'sessionMedium': 'Meio (organic, cpc, etc.)',
  'deviceCategory': 'Categoria de dispositivo',
  'city': 'Cidade',
  'country': 'País',
};
```

**⚠️ IMPORTANTE:** 
- ✅ GA4 rastreia **apenas métricas automáticas** (pageviews, sessions, etc.)
- ❌ **NÃO há eventos customizados** implementados no web
- ❌ Não usar eventos como `purchase`, `sign_up`, etc. (não existem)

**Métricas Possíveis:**
- ✅ Usuários diários/mensais
- ✅ Taxa de rejeição
- ✅ Páginas mais visitadas
- ✅ Fontes de tráfego (organic, direct, referral)
- ✅ Duração média de sessão
- ✅ Visitantes únicos por período

---

## 🏗️ ARQUITETURA DO PAINEL

### **Princípios de Design**

#### 1. **Minimalismo Intencional**
- Cada elemento tem propósito claro
- Zero decoração
- Hierarquia visual forte
- Alta legibilidade

#### 2. **HealthTech Identity**
- Tons de azul como cor primária
- Verde apenas para status positivos
- Vermelho apenas para alertas/riscos
- Branco predominante
- Tipografia limpa (Inter, system-ui)

#### 3. **Orientação à Decisão**
Cada métrica responde:
- **"O que isso significa?"** → Contexto visual
- **"Está bom ou ruim?"** → Indicadores de status
- **"O que fazer?"** → Ações específicas

#### 4. **Auditabilidade Total**
- Fonte de dados explícita
- Data/hora da última atualização
- Filtros aplicados visíveis
- Drill-down para dados brutos

---

### **Design System - Cuide-me**

#### **Paleta de Cores**
```css
/* Primary (Cuide-me Blue) */
--primary-50:  #eff6ff;
--primary-100: #dbeafe;
--primary-500: #3b82f6;
--primary-600: #2563eb; /* BRAND */
--primary-700: #1d4ed8;
--primary-900: #1e3a8a;

/* Success (Healthcare Green) */
--success-50:  #f0fdf4;
--success-500: #10b981;
--success-600: #059669;

/* Warning (Attention Amber) */
--warning-50:  #fffbeb;
--warning-500: #f59e0b;
--warning-600: #d97706;

/* Error (Risk Red) */
--error-50:  #fef2f2;
--error-500: #ef4444;
--error-600: #dc2626;

/* Neutral (Clean) */
--gray-50:  #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-300: #d1d5db;
--gray-500: #6b7280;
--gray-700: #374151;
--gray-900: #111827;
```

#### **Tipografia**
```css
/* Família */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Tamanhos (escala harmônica) */
--text-xs:   0.75rem;  /* 12px */
--text-sm:   0.875rem; /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg:   1.125rem; /* 18px */
--text-xl:   1.25rem;  /* 20px */
--text-2xl:  1.5rem;   /* 24px */
--text-3xl:  1.875rem; /* 30px */
--text-4xl:  2.25rem;  /* 36px */

/* Pesos */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

#### **Spacing (escala 4px)**
```css
--space-1:  0.25rem;  /* 4px */
--space-2:  0.5rem;   /* 8px */
--space-3:  0.75rem;  /* 12px */
--space-4:  1rem;     /* 16px */
--space-6:  1.5rem;   /* 24px */
--space-8:  2rem;     /* 32px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

#### **Componentes Base**

##### **KPI Card**
```tsx
interface KpiCardProps {
  title: string;              // Título da métrica
  value: number | string;     // Valor principal
  unit?: string;              // Unidade (ex: "jobs", "R$")
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;        // Variação %
  status?: 'ok' | 'warning' | 'critical';
  subtitle?: string;          // Contexto adicional
  lastUpdate?: string;        // Data última atualização
  dataSource: string;         // Ex: "Firebase:jobs"
}

// Estados visuais
status: 'ok'       → border-l-4 border-success-500
status: 'warning'  → border-l-4 border-warning-500
status: 'critical' → border-l-4 border-error-500
```

##### **Status Badge**
```tsx
interface StatusBadgeProps {
  status: 
    | 'pending'     // bg-gray-100 text-gray-700
    | 'active'      // bg-blue-100 text-blue-700
    | 'completed'   // bg-green-100 text-green-700
    | 'cancelled'   // bg-red-100 text-red-700
    | 'warning';    // bg-amber-100 text-amber-700
  label: string;
  size?: 'sm' | 'md';
}
```

##### **Data Table**
```tsx
interface DataTableProps {
  columns: Array<{
    key: string;
    label: string;
    width?: string;
    align?: 'left' | 'center' | 'right';
    format?: (value: any) => React.ReactNode;
  }>;
  data: any[];
  emptyMessage?: string;
  loading?: boolean;
  pagination?: boolean;
  pageSize?: number;
}
```

##### **Filter Bar**
```tsx
interface FilterBarProps {
  filters: Array<{
    type: 'date-range' | 'select' | 'search' | 'toggle';
    label: string;
    value: any;
    onChange: (value: any) => void;
    options?: Array<{ label: string; value: any }>;
  }>;
  onClear?: () => void;
}
```

---

## 📊 MÓDULOS DETALHADOS

### **MÓDULO 1: VISÃO GERAL (Dashboard)**

#### **Objetivo**
Fornecer snapshot do estado atual do marketplace em tempo real.

#### **Layout**
```
┌─────────────────────────────────────────────────────────┐
│ 🏥 Dashboard Cuide-me                    [Atualizar] ⚙️ │
│ Última atualização: 08/02/2026 14:35                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │ DEMANDA      │ │ OFERTA       │ │ MATCH        │   │
│  │ 248 famílias │ │ 156 cuidador.│ │ 78% taxa     │   │
│  │ +12% ↑       │ │ +8% ↑        │ │ -3% ↓        │   │
│  │ ● OK         │ │ ● OK         │ │ ⚠ WARNING    │   │
│  └──────────────┘ └──────────────┘ └──────────────┘   │
│                                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │ GMV MENSAL   │ │ TICKET MÉDIO │ │ JOBS ATIVOS  │   │
│  │ R$ 124.580   │ │ R$ 1.240     │ │ 42 jobs      │   │
│  │ +22% ↑       │ │ +5% ↑        │ │ ● OK         │   │
│  │ ● OK         │ │ ● OK         │ │              │   │
│  └──────────────┘ └──────────────┘ └──────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ALERTAS CRÍTICOS                                │   │
│  │ ⚠ 3 jobs sem match > 48h                        │   │
│  │ ⚠ 2 pagamentos pendentes > 72h                  │   │
│  │ ✓ Sem tickets críticos em aberto                │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ TOP 5 REGIÕES (por demanda)                     │   │
│  │ 1. São Paulo/SP        82 jobs                  │   │
│  │ 2. Rio de Janeiro/RJ   54 jobs                  │   │
│  │ 3. Belo Horizonte/MG   31 jobs                  │   │
│  │ 4. Curitiba/PR         28 jobs                  │   │
│  │ 5. Porto Alegre/RS     19 jobs                  │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

#### **KPIs e Fontes de Dados**

##### **1. Demanda (Famílias Ativas)**
```typescript
// Fonte: Firebase → jobs
const familiasAtivas = {
  value: new Set(jobs.map(j => j.clientId || j.familyId)).size,
  period: 'Últimos 30 dias',
  dataSource: 'Firebase:jobs',
  calculation: 'COUNT(DISTINCT clientId WHERE createdAt >= NOW() - 30 days)',
  status: value >= 200 ? 'ok' : value >= 100 ? 'warning' : 'critical',
};
```

##### **2. Oferta (Cuidadores Ativos)**
```typescript
// Fonte: Firebase → jobs (profissionais com jobs)
const cuidadoresAtivos = {
  value: new Set(jobs.map(j => j.professionalId || j.specialistId).filter(Boolean)).size,
  period: 'Últimos 30 dias',
  dataSource: 'Firebase:jobs',
  calculation: 'COUNT(DISTINCT professionalId WHERE createdAt >= NOW() - 30 days)',
  status: value >= 100 ? 'ok' : value >= 50 ? 'warning' : 'critical',
};
```

##### **3. Taxa de Match**
```typescript
// Fonte: Firebase → jobs
const taxaMatch = {
  value: (jobs.filter(j => j.professionalId).length / jobs.length) * 100,
  unit: '%',
  period: 'Últimos 30 dias',
  dataSource: 'Firebase:jobs',
  calculation: '(COUNT(jobs WHERE professionalId IS NOT NULL) / COUNT(jobs)) * 100',
  status: value >= 70 ? 'ok' : value >= 50 ? 'warning' : 'critical',
};
```

##### **4. GMV Mensal**
```typescript
// Fonte 1: Stripe → charges
// Fonte 2: Firebase → payment_confirmations (backup)
const gmvMensal = {
  value: charges
    .filter(c => c.status === 'succeeded' && isCurrentMonth(c.created))
    .reduce((sum, c) => sum + c.amount, 0) / 100, // centavos → reais
  unit: 'R$',
  period: 'Mês atual',
  dataSource: 'Stripe:charges',
  calculation: 'SUM(amount WHERE status=succeeded AND created >= MONTH_START) / 100',
  status: value >= 100000 ? 'ok' : value >= 50000 ? 'warning' : 'critical',
};
```

##### **5. Ticket Médio**
```typescript
// Fonte: Stripe → charges + Firebase → jobs
const ticketMedio = {
  value: gmvMensal.value / jobs.filter(j => j.status === 'completed').length,
  unit: 'R$',
  period: 'Mês atual',
  dataSource: 'Stripe:charges + Firebase:jobs',
  calculation: 'GMV / COUNT(jobs WHERE status=completed)',
};
```

##### **6. Jobs Ativos**
```typescript
// Fonte: Firebase → jobs
const jobsAtivos = {
  value: jobs.filter(j => 
    ['pending', 'open', 'matched', 'active', 'in_progress'].includes(j.status)
  ).length,
  period: 'Tempo real',
  dataSource: 'Firebase:jobs',
  calculation: 'COUNT(jobs WHERE status IN (pending, open, matched, active, in_progress))',
  status: value > 0 ? 'ok' : 'warning',
};
```

#### **Alertas Automáticos**
```typescript
const alerts = [
  // Alerta 1: Jobs sem match
  {
    id: 'jobs-sem-match',
    type: 'warning',
    title: `${jobsSemMatch48h} jobs sem match > 48h`,
    dataSource: 'Firebase:jobs',
    condition: 'createdAt < NOW() - 48h AND professionalId IS NULL',
    action: 'Ver jobs',
    link: '/admin/jobs?filter=sem-match',
  },
  
  // Alerta 2: Pagamentos pendentes
  {
    id: 'pagamentos-pendentes',
    type: 'warning',
    title: `${pagamentosPendentes} pagamentos pendentes > 72h`,
    dataSource: 'Stripe:charges',
    condition: 'status=pending AND created < NOW() - 72h',
    action: 'Ver pagamentos',
    link: '/admin/pagamentos?filter=pendentes',
  },
  
  // Alerta 3: Tickets críticos
  {
    id: 'tickets-criticos',
    type: tickets.filter(t => t.tipo === 'RECLAMAÇÃO' && t.status !== 'CONCLUIDO').length > 0 ? 'critical' : 'ok',
    title: tickets.length > 0 
      ? `${tickets.length} tickets críticos em aberto`
      : 'Sem tickets críticos em aberto',
    dataSource: 'Firebase:tickets',
    condition: "tipo='RECLAMAÇÃO' AND status != 'CONCLUIDO'",
    action: tickets.length > 0 ? 'Ver tickets' : undefined,
    link: tickets.length > 0 ? '/admin/service-desk' : undefined,
  },
];
```

#### **Top Regiões**
```typescript
// Fonte: Firebase → jobs
interface RegionStats {
  cidade: string;
  estado: string;
  label: string;     // "São Paulo/SP"
  jobsCount: number;
  familiasCount: number;
  cuidadoresCount: number;
}

const topRegioes = jobs
  .reduce((map, job) => {
    const key = `${job.cidade || 'Não informado'}/${job.estado || 'N/A'}`;
    if (!map.has(key)) {
      map.set(key, {
        cidade: job.cidade,
        estado: job.estado,
        label: key,
        jobsCount: 0,
        familiasCount: new Set(),
        cuidadoresCount: new Set(),
      });
    }
    const region = map.get(key)!;
    region.jobsCount++;
    if (job.clientId) region.familiasCount.add(job.clientId);
    if (job.professionalId) region.cuidadoresCount.add(job.professionalId);
    return map;
  }, new Map<string, any>())
  .entries()
  .map(([_, stats]) => ({
    ...stats,
    familiasCount: stats.familiasCount.size,
    cuidadoresCount: stats.cuidadoresCount.size,
  }))
  .sort((a, b) => b.jobsCount - a.jobsCount)
  .slice(0, 5);
```

---

### **MÓDULO 2: FUNIL DE CONVERSÃO**

#### **Objetivo**
Visualizar conversão real do funil, baseado em dados existentes.

#### **Estágios do Funil (DADOS REAIS)**

```typescript
const funnelStages = [
  {
    stage: 1,
    label: 'Visitantes Únicos',
    dataSource: 'GA4:totalUsers',
    metric: 'totalUsers',
    period: 'Últimos 30 dias',
    value: ga4Data.totalUsers,
    description: 'Usuários únicos que visitaram o site',
  },
  
  {
    stage: 2,
    label: 'Cadastros Iniciados',
    dataSource: 'Firebase:users',
    calculation: 'COUNT(users WHERE createdAt >= NOW() - 30 days)',
    value: users.filter(u => isLast30Days(u.createdAt)).length,
    conversionRate: (value / funnelStages[0].value) * 100,
    dropOff: funnelStages[0].value - value,
    description: 'Usuários que criaram conta',
  },
  
  {
    stage: 3,
    label: 'Famílias Ativas',
    dataSource: 'Firebase:users',
    calculation: "COUNT(users WHERE perfil='cliente' AND createdAt >= NOW() - 30 days)",
    value: users.filter(u => u.perfil === 'cliente' && isLast30Days(u.createdAt)).length,
    conversionRate: (value / funnelStages[1].value) * 100,
    dropOff: funnelStages[1].value - value,
    description: 'Usuários que se cadastraram como família',
  },
  
  {
    stage: 4,
    label: 'Jobs Criados',
    dataSource: 'Firebase:jobs',
    calculation: 'COUNT(jobs WHERE createdAt >= NOW() - 30 days)',
    value: jobs.filter(j => isLast30Days(j.createdAt)).length,
    conversionRate: (value / funnelStages[2].value) * 100,
    dropOff: funnelStages[2].value - value,
    description: 'Famílias que criaram pelo menos 1 job',
  },
  
  {
    stage: 5,
    label: 'Match Realizado',
    dataSource: 'Firebase:jobs',
    calculation: 'COUNT(jobs WHERE professionalId IS NOT NULL AND createdAt >= NOW() - 30 days)',
    value: jobs.filter(j => j.professionalId && isLast30Days(j.createdAt)).length,
    conversionRate: (value / funnelStages[3].value) * 100,
    dropOff: funnelStages[3].value - value,
    description: 'Jobs que encontraram profissional',
  },
  
  {
    stage: 6,
    label: 'Pagamento Confirmado',
    dataSource: 'Stripe:charges',
    calculation: "COUNT(charges WHERE status='succeeded' AND created >= NOW() - 30 days)",
    value: charges.filter(c => c.status === 'succeeded' && isLast30Days(c.created)).length,
    conversionRate: (value / funnelStages[4].value) * 100,
    dropOff: funnelStages[4].value - value,
    description: 'Pagamentos realizados com sucesso',
  },
  
  {
    stage: 7,
    label: 'Serviço Concluído',
    dataSource: 'Firebase:jobs',
    calculation: "COUNT(jobs WHERE status IN ('completed', 'concluido') AND createdAt >= NOW() - 30 days)",
    value: jobs.filter(j => 
      ['completed', 'concluido'].includes(j.status) && isLast30Days(j.createdAt)
    ).length,
    conversionRate: (value / funnelStages[5].value) * 100,
    dropOff: funnelStages[5].value - value,
    description: 'Serviços efetivamente realizados',
  },
];
```

#### **Visualização**
```
┌─────────────────────────────────────────────────┐
│ 📊 Funil de Conversão - Últimos 30 dias        │
├─────────────────────────────────────────────────┤
│                                                 │
│  1. VISITANTES ÚNICOS                           │
│  ████████████████████████████████  15.240       │
│                                                 │
│  ↓ 93% perdidos (Fonte: GA4)                    │
│                                                 │
│  2. CADASTROS INICIADOS                         │
│  ███████  1.068                                 │
│  Conversão: 7.0%                                │
│                                                 │
│  ↓ 23% perdidos                                 │
│                                                 │
│  3. FAMÍLIAS ATIVAS                             │
│  ██████  822                                    │
│  Conversão: 77% (do cadastro)                   │
│                                                 │
│  ↓ 70% sem criar job                            │
│                                                 │
│  4. JOBS CRIADOS                                │
│  ██  248                                        │
│  Conversão: 30% (das famílias)                  │
│                                                 │
│  ↓ 15% sem match                                │
│                                                 │
│  5. MATCH REALIZADO                             │
│  ██  211                                        │
│  Conversão: 85% (dos jobs)                      │
│                                                 │
│  ↓ 8% sem pagamento                             │
│                                                 │
│  6. PAGAMENTO CONFIRMADO                        │
│  ██  194                                        │
│  Conversão: 92% (dos matches)                   │
│                                                 │
│  ↓ 5% não concluídos                            │
│                                                 │
│  7. SERVIÇO CONCLUÍDO                           │
│  █  184                                         │
│  Conversão: 95% (dos pagos)                     │
│                                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Conversão End-to-End: 1.2%                     │
│  (visitantes → serviço concluído)               │
└─────────────────────────────────────────────────┘
```

#### **Pontos de Atenção (Automáticos)**
```typescript
const funnelInsights = [
  {
    stage: 'Visitantes → Cadastro',
    dropOff: 93,
    severity: 'critical',
    message: '93% dos visitantes não se cadastram',
    possibleCauses: [
      'Proposta de valor não clara',
      'Formulário de cadastro muito complexo',
      'Falta de prova social',
    ],
    recommendation: 'Testar simplificação do onboarding',
  },
  
  {
    stage: 'Famílias → Jobs',
    dropOff: 70,
    severity: 'critical',
    message: '70% das famílias não criam jobs',
    possibleCauses: [
      'Processo de criar job não é intuitivo',
      'Cadastro sem intenção imediata',
      'Desistência após ver preços',
    ],
    recommendation: 'Análise qualitativa: pesquisa com famílias inativas',
  },
  
  {
    stage: 'Jobs → Match',
    dropOff: 15,
    severity: 'warning',
    message: '15% dos jobs não encontram profissional',
    possibleCauses: [
      'Oferta insuficiente em regiões específicas',
      'Especialidades raras',
      'Preço proposto muito baixo',
    ],
    recommendation: 'Expandir oferta nas regiões com maior demanda',
  },
];
```

---

### **MÓDULO 3: USUÁRIOS - CLIENTES (FAMÍLIAS)**

#### **Objetivo**
Gerenciar famílias cadastradas, acompanhar jornada e identificar problemas.

#### **Filtros Disponíveis**
```typescript
interface FamiliaFilters {
  status: 'todas' | 'ativas' | 'inativas';
  periodo: 'todos' | 'ultimos-7-dias' | 'ultimos-30-dias' | 'ultimos-90-dias';
  regiao: string;  // cidade/estado
  jobsMin: number; // filtrar por min jobs criados
  search: string;  // busca por nome/email
}
```

#### **Tabela de Famílias**
```typescript
interface FamiliaRow {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  cidade: string;
  estado: string;
  dataCadastro: Date;
  status: 'ativa' | 'inativa';
  
  // Métricas agregadas
  stats: {
    jobsCriados: number;
    jobsConcluidos: number;
    jobsCancelados: number;
    valorGasto: number;        // Soma de payments
    ultimoJob: Date | null;
    avaliacaoMedia: number | null;
  };
  
  // Flags
  flags: {
    temStripeId: boolean;
    temTicketsAbertos: boolean;
    temProblemasRecorrentes: boolean;
  };
}
```

#### **Colunas da Tabela**
```
┌──────────────────────────────────────────────────────────────────────────┐
│ 👨‍👩‍👧 Famílias (248)                      [Filtros] [Exportar]         │
├──────────────────────────────────────────────────────────────────────────┤
│ Nome            Email          Cidade/UF  Cadastro   Jobs  Gasto  Status │
├──────────────────────────────────────────────────────────────────────────┤
│ Maria Silva     maria@...      SP/SP      15/01/26   5     R$6.2k ✓ Ativa│
│ ⚠ 1 ticket aberto                                                        │
│                                                             [Ver detalhes]│
├──────────────────────────────────────────────────────────────────────────┤
│ João Santos     joao@...       RJ/RJ      10/01/26   2     R$2.4k ✓ Ativa│
│                                                             [Ver detalhes]│
├──────────────────────────────────────────────────────────────────────────┤
│ Ana Costa       ana@...        MG/MG      05/01/26   0     R$0    ○ Inati│
│ ⚠ Cadastrada há 33 dias, 0 jobs                                          │
│                                                             [Ver detalhes]│
└──────────────────────────────────────────────────────────────────────────┘
```

#### **Detalhes da Família (Modal/Página)**
```typescript
interface FamiliaDetalhes {
  // Identificação
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  cpf?: string;
  
  // Localização
  endereco?: string;
  cidade: string;
  estado: string;
  cep?: string;
  
  // Stripe
  stripeCustomerId?: string;
  
  // Timeline de Jobs
  jobs: Array<{
    id: string;
    titulo: string;
    status: string;
    createdAt: Date;
    profissional?: string;
    valor?: number;
    completedAt?: Date;
  }>;
  
  // Histórico de Pagamentos
  pagamentos: Array<{
    id: string;
    jobId: string;
    valor: number;
    status: string;
    date: Date;
  }>;
  
  // Histórico de Tickets
  tickets: Array<{
    id: string;
    tipo: string;
    titulo: string;
    status: string;
    createdAt: Date;
  }>;
  
  // Avaliações Dadas
  avaliacoes: Array<{
    jobId: string;
    profissional: string;
    rating: number;
    comentario?: string;
    date: Date;
  }>;
}
```

#### **Ações Admin**
```typescript
const acoesAdmin = [
  {
    id: 'visualizar',
    label: 'Ver detalhes completos',
    icon: '👁️',
    action: () => navigate(`/admin/familias/${familiaId}`),
  },
  {
    id: 'bloquear',
    label: 'Bloquear família',
    icon: '🚫',
    requireConfirmation: true,
    action: () => blockUser(familiaId),
    condition: familia => !familia.bloqueada,
  },
  {
    id: 'desbloquear',
    label: 'Desbloquear família',
    icon: '✅',
    action: () => unblockUser(familiaId),
    condition: familia => familia.bloqueada,
  },
  {
    id: 'criar-ticket',
    label: 'Criar ticket de suporte',
    icon: '🎫',
    action: () => navigate(`/admin/service-desk/novo?usuarioId=${familiaId}`),
  },
];
```

---

### **MÓDULO 4: USUÁRIOS - PROFISSIONAIS (CUIDADORES)**

#### **Objetivo**
Gerenciar cuidadores, monitorar performance e disponibilidade.

#### **Filtros Disponíveis**
```typescript
interface CuidadorFilters {
  status: 'todos' | 'ativos' | 'inativos' | 'bloqueados';
  especialidade: string;  // da lista de especialidades
  regiao: string;
  avaliacaoMin: number;   // 1-5
  period: '7dias' | '30dias' | '90dias';
}
```

#### **Tabela de Cuidadores**
```typescript
interface CuidadorRow {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  cidade: string;
  estado: string;
  
  // Profissional
  especialidades: string[];
  dataCadastro: Date;
  status: 'ativo' | 'inativo' | 'bloqueado';
  
  // Performance
  stats: {
    jobsAceitos: number;
    jobsConcluidos: number;
    jobsCancelados: number;
    taxaCancelamento: number;  // %
    taxaAceitacao: number;     // % (propostas aceitas / propostas recebidas)
    avaliacaoMedia: number | null;
    totalAvaliacoes: number;
    receitaGerada: number;     // Soma total jobs
  };
  
  // Stripe
  stripeConnected: boolean;
  stripeAccountId?: string;
  
  // Flags
  flags: {
    disponivel: boolean;
    temTicketsAbertos: boolean;
    taxaCancelamentoAlta: boolean;      // > 20%
    semJobsHa90Dias: boolean;
  };
}
```

#### **Colunas da Tabela**
```
┌────────────────────────────────────────────────────────────────────────────────┐
│ 🧑‍⚕️ Cuidadores (156)                            [Filtros] [Exportar]        │
├────────────────────────────────────────────────────────────────────────────────┤
│ Nome         Especialidades   Cidade/UF  Jobs  Aval.  Stripe  Status   Ações  │
├────────────────────────────────────────────────────────────────────────────────┤
│ Paulo Lima   Enfermagem       SP/SP      18    4.8★   ✓       ✓ Ativo  [...]  │
│              Cuidador                    (2❌)                                  │
│                                                                                 │
├────────────────────────────────────────────────────────────────────────────────┤
│ Carla Dias   Cuidador         RJ/RJ      12    4.5★   ✓       ✓ Ativo  [...]  │
│                                          (0❌)                                  │
│                                                                                 │
├────────────────────────────────────────────────────────────────────────────────┤
│ José Santos  Técnico Enf.     MG/MG      8     3.2★   ✗       ⚠ Baixa  [...]  │
│                                          (4❌)        (não config.)    aval.   │
│ ⚠ Taxa cancelamento: 33% | Stripe não configurado                              │
│                                                                                 │
├────────────────────────────────────────────────────────────────────────────────┤
│ Fernanda R.  Enfermagem       SP/SP      0     -      ✓       ○ Inativo[...]  │
│ ⚠ Cadastrada há 120 dias, 0 jobs aceitos                                       │
└────────────────────────────────────────────────────────────────────────────────┘
```

#### **Detalhes do Cuidador**
```typescript
interface CuidadorDetalhes {
  // Identificação
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  cpf?: string;
  dataNascimento?: Date;
  
  // Profissional
  especialidades: string[];
  disponibilidade?: string;
  experiencia?: string;
  
  // Stripe
  stripeCustomerId?: string;
  stripeConnected: boolean;
  stripeAccountId?: string;
  
  // Timeline de Jobs
  jobs: Array<{
    id: string;
    familia: string;
    titulo: string;
    status: string;
    createdAt: Date;
    acceptedAt?: Date;
    completedAt?: Date;
    cancelledBy?: 'professional' | 'client';
    valor?: number;
    avaliacao?: {
      rating: number;
      comentario?: string;
    };
  }>;
  
  // Avaliações Recebidas
  avaliacoes: Array<{
    jobId: string;
    familia: string;
    rating: number;
    comentario?: string;
    date: Date;
  }>;
  
  // Tickets relacionados
  tickets: Array<{
    id: string;
    tipo: string;
    titulo: string;
    status: string;
    createdAt: Date;
  }>;
}
```

#### **Alertas Específicos Cuidadores**
```typescript
const alertasCuidador = [
  {
    id: 'stripe-nao-configurado',
    type: 'warning',
    condition: !cuidador.stripeConnected && cuidador.jobsAceitos > 0,
    message: 'Stripe não configurado mas tem jobs aceitos',
    action: 'Solicitar configuração Stripe',
  },
  {
    id: 'taxa-cancelamento-alta',
    type: 'critical',
    condition: cuidador.stats.taxaCancelamento > 20,
    message: `Taxa de cancelamento: ${cuidador.stats.taxaCancelamento}% (crítico)`,
    action: 'Revisar histórico de cancelamentos',
  },
  {
    id: 'avaliacao-baixa',
    type: 'warning',
    condition: cuidador.stats.avaliacaoMedia < 3.5 && cuidador.stats.totalAvaliacoes >= 3,
    message: `Avaliação média baixa: ${cuidador.stats.avaliacaoMedia}★`,
    action: 'Verificar feedbacks negativos',
  },
  {
    id: 'sem-jobs-90-dias',
    type: 'warning',
    condition: diasSemJobs(cuidador) >= 90,
    message: 'Sem jobs há 90+ dias',
    action: 'Verificar se está ativo na plataforma',
  },
];
```

#### **Ações Admin**
```typescript
const acoesCuidador = [
  {
    id: 'visualizar',
    label: 'Ver detalhes completos',
    icon: '👁️',
  },
  {
    id: 'ativar',
    label: 'Ativar profissional',
    condition: c => c.status === 'inativo',
  },
  {
    id: 'desativar',
    label: 'Desativar profissional',
    condition: c => c.status === 'ativo',
    requireConfirmation: true,
  },
  {
    id: 'bloquear',
    label: 'Bloquear (suspensão)',
    condition: c => c.status !== 'bloqueado',
    requireConfirmation: true,
    requireReason: true,
  },
  {
    id: 'desbloquear',
    label: 'Desbloquear',
    condition: c => c.status === 'bloqueado',
  },
  {
    id: 'ver-stripe',
    label: 'Ver conta Stripe',
    condition: c => c.stripeConnected,
    action: () => window.open(`https://dashboard.stripe.com/connect/accounts/${c.stripeAccountId}`),
  },
];
```

---

### **MÓDULO 5: JOBS (ATENDIMENTOS)**

#### **Objetivo**
Visualizar e gerenciar todos os jobs da plataforma.

#### **Status de Jobs (Normalizado)**
```typescript
type JobStatus = 
  | 'pending'      // Criado, aguardando match
  | 'matched'      // Match realizado (profissional atribuído)
  | 'active'       // Serviço em andamento
  | 'completed'    // Concluído
  | 'cancelled';   // Cancelado

// Mapeamento de status reais → normalizado
const STATUS_MAPPING = {
  'pending': ['pending', 'pendente', 'open'],
  'matched': ['matched', 'proposta_aceita', 'accepted'],
  'active': ['active', 'in_progress'],
  'completed': ['completed', 'concluido', 'attendanceRegistered:true'],
  'cancelled': ['cancelled', 'cancelado'],
};
```

#### **Filtros**
```typescript
interface JobFilters {
  status: JobStatus | 'todos';
  periodo: 'todos' | '7dias' | '30dias' | '90dias';
  regiao: string;
  especialidade: string;
  valorMin: number;
  valorMax: number;
  comProblemas: boolean; // jobs sem match > 48h, pagamento pendente, etc.
}
```

#### **Tabela de Jobs**
```typescript
interface JobRow {
  id: string;
  titulo: string;
  familia: {
    id: string;
    nome: string;
    cidade: string;
    estado: string;
  };
  profissional?: {
    id: string;
    nome: string;
  };
  especialidade?: string;
  status: JobStatus;
  valor?: number;
  createdAt: Date;
  matchedAt?: Date;      // proposal.sentAt
  completedAt?: Date;
  
  // Timings
  tempoAteMatch?: number;  // horas
  tempoTotal?: number;     // horas (createdAt → completedAt)
  
  // Flags
  flags: {
    semMatchHa48h: boolean;
    pagamentoPendente: boolean;
    canceladoPelaFamilia: boolean;
    canceladoPeloProfissional: boolean;
    temAvaliacao: boolean;
  };
}
```

#### **Colunas da Tabela**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 💼 Jobs (562)                                      [Filtros] [Exportar]      │
├──────────────────────────────────────────────────────────────────────────────┤
│ ID    Família       Profissional  Especialidade  Status      Valor   Data    │
├──────────────────────────────────────────────────────────────────────────────┤
│ #1245 Maria Silva   Paulo Lima    Enfermagem     ✓ Concluído R$1.2k 05/02   │
│       SP/SP                                       Aval: 5★                    │
│                                                                     [Detalhes]│
├──────────────────────────────────────────────────────────────────────────────┤
│ #1244 João Santos   -             Cuidador       ⏳ Pendente R$800  03/02   │
│       RJ/RJ                                       ⚠ 5 dias sem match          │
│                                                                     [Detalhes]│
├──────────────────────────────────────────────────────────────────────────────┤
│ #1243 Ana Costa     Carla Dias    Cuidador       🔵 Ativo    R$950  02/02   │
│       MG/MG                                       Pago                        │
│                                                                     [Detalhes]│
├──────────────────────────────────────────────────────────────────────────────┤
│ #1242 Pedro Alves   José Santos   Técnico Enf.   ❌ Cancelado R$1.1k 01/02   │
│       PR/PR                                       Por: Profissional           │
│                                                                     [Detalhes]│
└──────────────────────────────────────────────────────────────────────────────┘
```

#### **Detalhes do Job**
```typescript
interface JobDetalhes {
  // Identificação
  id: string;
  titulo: string;
  descricao?: string;
  tipo?: string;
  especialidade?: string;
  
  // Relacionamentos
  familia: {
    id: string;
    nome: string;
    email: string;
    telefone?: string;
    endereco?: string;
    cidade: string;
    estado: string;
  };
  
  profissional?: {
    id: string;
    nome: string;
    email: string;
    telefone?: string;
    especialidades: string[];
  };
  
  // Timeline
  timeline: Array<{
    timestamp: Date;
    event: 
      | 'criado'
      | 'proposta_enviada'
      | 'proposta_aceita'
      | 'proposta_recusada'
      | 'pagamento_iniciado'
      | 'pagamento_confirmado'
      | 'servico_iniciado'
      | 'servico_concluido'
      | 'cancelado'
      | 'avaliado';
    actor?: 'familia' | 'profissional' | 'sistema';
    details?: string;
  }>;
  
  // Pagamento
  pagamento?: {
    stripeChargeId?: string;
    valor: number;
    status: 'pending' | 'succeeded' | 'failed';
    paidAt?: Date;
  };
  
  // Avaliação
  avaliacao?: {
    rating: number;
    comentario?: string;
    createdAt: Date;
  };
  
  // Status
  status: JobStatus;
  createdAt: Date;
  completedAt?: Date;
}
```

#### **Alertas por Job**
```typescript
const jobAlerts = [
  {
    condition: job.status === 'pending' && daysSince(job.createdAt) >= 2,
    type: 'warning',
    message: 'Sem match há 48+ horas',
    action: 'Buscar profissionais disponíveis na região',
  },
  {
    condition: job.pagamento?.status === 'pending' && hoursSince(job.pagamento.createdAt) >= 72,
    type: 'critical',
    message: 'Pagamento pendente há 72+ horas',
    action: 'Contatar família para resolver pagamento',
  },
  {
    condition: job.status === 'completed' && !job.avaliacao && daysSince(job.completedAt) >= 7,
    type: 'info',
    message: 'Serviço concluído sem avaliação',
    action: 'Enviar lembrete de avaliação',
  },
];
```

---

### **MÓDULO 6: STATUS & ALERTAS**

#### **Objetivo**
Centralizar alertas críticos e acionáveis baseados em dados reais.

#### **Categorias de Alertas**

##### **1. Alertas de Match**
```typescript
const matchAlerts = {
  id: 'jobs-sem-match',
  title: 'Jobs sem profissional',
  dataSource: 'Firebase:jobs',
  query: 'status=pending AND professionalId IS NULL AND createdAt < NOW() - 48h',
  items: jobs
    .filter(j => 
      ['pending', 'open'].includes(j.status) &&
      !j.professionalId &&
      hoursSince(j.createdAt) >= 48
    )
    .map(j => ({
      jobId: j.id,
      familia: j.clientId,
      cidade: j.cidade,
      estado: j.estado,
      especialidade: j.specialty,
 hoursSinceCreation: hoursSince(j.createdAt),
      action: 'Buscar profissionais disponíveis',
    })),
  severity: items.length > 5 ? 'critical' : 'warning',
};
```

##### **2. Alertas de Pagamento**
```typescript
const paymentAlerts = {
  id: 'pagamentos-pendentes',
  title: 'Pagamentos pendentes',
  dataSource: 'Stripe:charges',
  query: "status='pending' AND created < NOW() - 72h",
  items: charges
    .filter(c => 
      c.status === 'pending' &&
      hoursSince(c.created) >= 72
    )
    .map(c => ({
      chargeId: c.id,
      familiaId: c.metadata?.userId,
      jobId: c.metadata?.jobId,
      valor: c.amount / 100,
      hoursPending: hoursSince(c.created),
      action: 'Verificar e contatar família',
    })),
  severity: 'critical',
};
```

##### **3. Alertas de Profissionais**
```typescript
const professionalAlerts = {
  id: 'profissionais-inativos-com-jobs',
  title: 'Profissionais inativos com jobs ativos',
  dataSource: 'Firebase:users + Firebase:jobs',
  query: "users.ativo=false AND jobs.professionalId=users.id AND jobs.status IN (active, matched)",
  items: jobs
    .filter(j => ['active', 'matched'].includes(j.status) && j.professionalId)
    .map(j => ({
      user: users.find(u => u.id === j.professionalId),
      job: j,
    }))
    .filter(item => item.user?.ativo === false)
    .map(({ user, job }) => ({
      profissionalId: user.id,
      profissionalNome: user.nome,
      jobId: job.id,
      familiaId: job.clientId,
      action: 'Reatribuir job ou reativar profissional',
    })),
  severity: 'critical',
};
```

##### **4. Alertas de Cancelamento**
```typescript
const cancellationAlerts = {
  id: 'profissionais-taxa-alta-cancelamento',
  title: 'Profissionais com taxa de cancelamento > 25%',
  dataSource: 'Firebase:jobs',
  calculation: `
    (COUNT(jobs WHERE professionalId=X AND status=cancelled) / 
     COUNT(jobs WHERE professionalId=X)) * 100
  `,
  items: Array.from(
    jobs.reduce((map, job) => {
      const pid = job.professionalId;
      if (!pid) return map;
      
      if (!map.has(pid)) {
        map.set(pid, { total: 0, cancelled: 0 });
      }
      const stats = map.get(pid)!;
      stats.total++;
      if (['cancelled', 'cancelado'].includes(job.status)) {
        stats.cancelled++;
      }
      return map;
    }, new Map())
  )
    .map(([pid, stats]) => ({
      profissionalId: pid,
      profissional: users.find(u => u.id === pid)?.nome,
      taxaCancelamento: (stats.cancelled / stats.total) * 100,
      totalJobs: stats.total,
      cancelados: stats.cancelled,
    }))
    .filter(item => item.taxaCancelamento > 25 && item.totalJobs >= 4)
    .sort((a, b) => b.taxaCancelamento - a.taxaCancelamento),
  severity: 'warning',
};
```

##### **5. Alertas de Tickets**
```typescript
const ticketAlerts = {
  id: 'tickets-criticos-abertos',
  title: 'Tickets críticos em aberto',
  dataSource: 'Firebase:tickets',
  query: "tipo='RECLAMAÇÃO' AND status NOT IN (CONCLUIDO, closed)",
  items: tickets
    .filter(t => 
      t.tipo === 'RECLAMAÇÃO' &&
      !['CONCLUIDO', 'closed'].includes(t.status)
    )
    .map(t => ({
      ticketId: t.id,
      titulo: t.titulo,
      usuarioId: t.usuarioId,
      usuarioNome: t.usuarioNome,
      daysSinceCreated: daysSince(t.createdAt),
      action: 'Priorizar resolução',
    }))
    .sort((a, b) => b.daysSinceCreated - a.daysSinceCreated),
  severity: 'critical',
};
```

#### **Dashboard de Alertas**
```
┌─────────────────────────────────────────────────────────┐
│ 🚨 Status & Alertas                                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ❌ CRÍTICO (3)                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                         │
│  • Pagamentos pendentes > 72h (2 casos)                │
│    Fonte: Stripe:charges                               │
│    [Ver detalhes]                                      │
│                                                         │
│  • Profissionais inativos com jobs ativos (1 caso)     │
│    Fonte: Firebase:users + Firebase:jobs               │
│    [Ver detalhes]                                      │
│                                                         │
│  ⚠️ ATENÇÃO (5)                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                         │
│  • Jobs sem match > 48h (3 casos)                      │
│    Regiões: SP/SP (1), RJ/RJ (2)                       │
│    [Buscar profissionais]                              │
│                                                         │
│  • Profissionais com cancelamento > 25% (2 casos)      │
│    [Ver lista]                                         │
│                                                         │
│  ℹ️ INFO (2)                                            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                         │
│  • Jobs concluídos sem avaliação (2 casos)             │
│    [Enviar lembretes]                                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### **MÓDULO 7: SERVICE DESK (TICKETS)**

#### **Objetivo**
Gerenciar tickets de suporte em formato Kanban.

#### **Tipos de Ticket**
```typescript
type TipoTicket = 'RECLAMAÇÃO' | 'PROBLEMA' | 'SUGESTÃO';

type StatusTicket = 
  | 'A_FAZER'         // Novo, não atribuído
  | 'EM_ATENDIMENTO'  // Em resolução
  | 'CONCLUIDO';      // Resolvido
```

#### **Estrutura do Ticket**
```typescript
interface Ticket {
  id: string;
  titulo: string;
  descricao: string;
  tipo: TipoTicket;
  status: StatusTicket;
  
  // Usuário
  usuarioId?: string;
  usuarioNome?: string;
  usuarioTipo?: 'cliente' | 'profissional';
  
  // Prioridade (calculada)
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  
  // Metadata
  createdAt: Date;
  updatedAt?: Date;
  closedAt?: Date;
  
  // Tempos
  tempoEmAberto?: number;        // horas
  tempoAteResolucao?: number;    // horas
}

// Cálculo de prioridade
function calcularPrioridade(ticket: Ticket): Ticket['prioridade'] {
  const horasEmAberto = hoursSince(ticket.createdAt);
  
  if (ticket.tipo === 'RECLAMAÇÃO') {
    if (horasEmAberto >= 48) return 'urgente';
    if (horasEmAberto >= 24) return 'alta';
    return 'media';
  }
  
  if (ticket.tipo === 'PROBLEMA') {
    if (horasEmAberto >= 72) return 'alta';
    return 'media';
  }
  
  return 'baixa'; // SUGESTÃO
}
```

#### **Visualização Kanban**
```
┌───────────────────────────────────────────────────────────────────────┐
│ 🎫 Service Desk                     [Novo Ticket] [Filtros]          │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│ │ A FAZER (3)  │  │ EM ATEND (2) │  │ CONCLUÍDO (5)│               │
│ ├──────────────┤  ├──────────────┤  ├──────────────┤               │
│ │              │  │              │  │              │               │
│ │ ┌──────────┐ │  │ ┌──────────┐ │  │ ┌──────────┐ │               │
│ │ │🔴URGENTE  │ │  │ │⚠️ ALTA   │ │  │ │✅         │ │               │
│ │ │RECLAMAÇÃO│ │  │ │PROBLEMA  │ │  │ │PROBLEMA  │ │               │
│ │ │──────────│ │  │ │──────────│ │  │ │──────────│ │               │
│ │ │Pagamento │ │  │ │Match não │ │  │ │Cadastro  │ │               │
│ │ │duplicado │ │  │ │funciona  │ │  │ │incompleto│ │               │
│ │ │          │ │  │ │          │ │  │ │          │ │               │
│ │ │Maria S.  │ │  │ │João S.   │ │  │ │Ana C.    │ │               │
│ │ │72h aberto│ │  │ │4h EM ATD │ │  │ │Resolvido │ │               │
│ │ └──────────┘ │  │ └──────────┘ │  │ │2h        │ │               │
│ │              │  │              │  │ └──────────┘ │               │
│ │ ┌──────────┐ │  │ ┌──────────┐ │  │              │               │
│ │ │⚠️ ALTA   │ │  │ │🔵 MÉDIA  │ │  │ [Ver mais...]│               │
│ │ │RECLAMAÇÃO│ │  │ │SUGESTÃO  │ │  │              │               │
│ │ │──────────│ │  │ │──────────│ │  │              │               │
│ │ │Cuidador  │ │  │ │Melhorar  │ │  │              │               │
│ │ │não campa.│ │  │ │filtros   │ │  │              │               │
│ │ │          │ │  │ │          │ │  │              │               │
│ │ │Paulo L.  │ │  │ │Pedro A.  │ │  │              │               │
│ │ │36h aberto│ │  │ │1h EM ATD │ │  │              │               │
│ │ └──────────┘ │  │ └──────────┘ │  │              │               │
│ │              │  │              │  │              │               │
│ │ [Ver mais...]│  │              │  │              │               │
│ └──────────────┘  └──────────────┘  └──────────────┘               │
│                                                                       │
│ SLA: ⚠️ 1 ticket > 48h sem resposta                                 │
└───────────────────────────────────────────────────────────────────────┘
```

#### **Métricas do Service Desk**
```typescript
const serviceDeskMetrics = {
  totalAbertos: tickets.filter(t => t.status !== 'CONCLUIDO').length,
  totalConcluidos: tickets.filter(t => t.status === 'CONCLUIDO').length,
  
  tempoMedioResolucao: 
    tickets
      .filter(t => t.closedAt && t.tempoAteResolucao)
      .reduce((sum, t) => sum + t.tempoAteResolucao!, 0) /
    tickets.filter(t => t.closedAt).length,
  
  ticketsPorTipo: {
    RECLAMAÇÃO: tickets.filter(t => t.tipo === 'RECLAMAÇÃO').length,
    PROBLEMA: tickets.filter(t => t.tipo === 'PROBLEMA').length,
    SUGESTÃO: tickets.filter(t => t.tipo === 'SUGESTÃO').length,
  },
  
  slaViolations: tickets.filter(t => 
    t.status !== 'CONCLUIDO' &&
    hoursSince(t.createdAt) >= 48
  ).length,
};
```

---

## 🎨 DIRETRIZES DE DESIGN

### **Princípios Fundamentais**

#### 1. **Hierarquia Visual Clara**
```
Nível 1: Números grandes (métricas principais)
  └─ font-size: 2.25rem (36px)
  └─ font-weight: 700 (bold)
  └─ color: gray-900

Nível 2: Labels e títulos
  └─ font-size: 0.875rem (14px)
  └─ font-weight: 500 (medium)
  └─ color: gray-600

Nível 3: Metadados
  └─ font-size: 0.75rem (12px)
  └─ font-weight: 400 (normal)
  └─ color: gray-500
```

#### 2. **Status com Significado**
```typescript
// Sistema de cores semântico
const STATUS_COLORS = {
  // Sucesso (verde): tudo ok, meta atingida
  ok: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-500',
    icon: '✓',
  },
  
  // Atenção (amarelo): requer monitoramento
  warning: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-500',
    icon: '⚠',
  },
  
  // Crítico (vermelho): ação imediata necessária
  critical: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-500',
    icon: '●',
  },
  
  // Info (azul): neutro, informativo
  info: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-500',
    icon: 'ℹ',
  },
};
```

#### 3. **Espaçamento Consistente**
```typescript
// Grid de 8px (Tailwind padrão)
const SPACING = {
  card: 'p-6',           // 24px padding
  section: 'space-y-4',  // 16px entre elementos
  group: 'space-y-2',    // 8px em grupos relacionados
  gap: 'gap-6',          // 24px em grids
};
```

#### 4. **Responsividade**
```typescript
// Breakpoints
const BREAKPOINTS = {
  mobile: '< 640px',    // 1 coluna
  tablet: '640-1024px', // 2 colunas
  desktop: '> 1024px',  // 3-4 colunas
};

// Grid adaptativo
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

---

## 📐 WIREFRAMES

### **Layout Principal**
```
┌─────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🏥 CUIDE-ME ADMIN                [Admin] [Sair]    │ │ <- Header
│ └─────────────────────────────────────────────────────┘ │
├───────────┬─────────────────────────────────────────────────┤
│           │                                             │
│ SIDEBAR   │ CONTENT AREA                                │
│           │                                             │
│ 📊 Visão  │ ┌─────────────────────────────────────┐   │
│    Geral  │ │                                     │   │
│           │ │        CONTEÚDO DO MÓDULO           │   │
│ 👥 Usuários│ │                                     │   │
│  • Famílias│ │                                     │   │
│  • Cuidador│ │                                     │   │
│           │ └─────────────────────────────────────┘   │
│ 💼 Jobs   │                                             │
│           │                                             │
│ 🚨 Alertas│                                             │
│           │                                             │
│ 🎫 Tickets│                                             │
│           │                                             │
│ 📈 Funil  │                                             │
│           │                                             │
│ ⚙️  Config │                                             │
│           │                                             │
└───────────┴─────────────────────────────────────────────────┘
```

### **Anatomia de um KPI Card**
```
┌─────────────────────────────────┐
│ ┃ TÍTULO DA MÉTRICA            │ <- border-l-4 (status color)
│ ┃                               │
│ ┃ 1,234                         │ <- Valor (text-4xl font-bold)
│ ┃ unidade                       │ <- Unidade (text-sm text-gray-500)
│ ┃                               │
│ ┃ +12% ↑                        │ <- Trend (text-sm)
│ ┃                               │
│ ┃ ━━━━━━━━━━━━━━━━━━━━━━━━━━  │ <- Divider (opcional)
│ ┃                               │
│ ┃ 📌 Contexto adicional         │ <- Subtitle (text-xs)
│ ┃                               │
│ ┃ Fonte: Firebase:jobs          │ <- Data source (text-xs gray-400)
│ ┃ Atualizado: 08/02 14:35       │ <- Last update
└─────────────────────────────────┘
```

---

## ❌ O QUE NÃO EXISTE

### **Dados NÃO Disponíveis**

#### 1. **Eventos GA4 Customizados**
❌ **NÃO existem:**
- `purchase` (evento de compra)
- `sign_up` (evento de cadastro)
- `contact_caregiver` (contato com cuidador)
- Qualquer evento customizado web

✅ **Usar apenas:**
- `totalUsers` (métrica padrão)
- `sessions` (métrica padrão)
- `screenPageViews` (métrica padrão)
- `bounceRate` (métrica padrão)

#### 2. **Campos que NÃO existem em Jobs**
❌ NÃO criar mockups de:
- `sla` (tempo garantido de resposta)
- `priority` (prioridade do job)
- `category` (categoria detalhada)
- `duration` (duração prevista)
- `location` (coordenadas GPS)

✅ **Usar campos reais:**
- `status` (múltiplas versões PT/EN)
- `specialty` (especialidade)
- `valor` (valor do job)
- `cidade`, `estado` (localização textual)

#### 3. **Métricas Preditivas**
❌ **NÃO criar:**
- LTV projetado (sem histórico suficiente)
- Churn risk score (sem ML implementado)
- Previsão de demanda (sem modelo)
- Probabilidade de match (sem algoritmo)

✅ **Usar apenas métricas descritivas:**
- Taxa de match real (passado)
- Tempo médio real de match
- Conversão real do funil

#### 4. **Integrações Externas Inexistentes**
❌ **NÃO assumir:**
- Twilio/WhatsApp integrado
- SendGrid/Email transacional
- Zendesk/Intercom
- Segment/Mixpanel
- Datadog/Sentry

✅ **Usar apenas:**
- Firebase (Auth, Firestore, Analytics)
- Stripe (Charges, Subscriptions)
- Google Analytics 4 (métricas padrão)

---

## 🚀 PLANO DE IMPLEMENTAÇÃO

### **FASE 1: Fundações (Semana 1)**

#### 1.1 Design System
```typescript
// Criar: src/lib/designSystem.ts
export const colors = { /* paleta completa */ };
export const typography = { /* escala de tipos */ };
export const spacing = { /* grid 8px */ };
```

#### 1.2 Componentes Base
```bash
src/components/admin/ui/
├── KpiCard.tsx
├── StatusBadge.tsx
├── DataTable.tsx
├── FilterBar.tsx
├── AlertBanner.tsx
└── index.ts
```

#### 1.3 Services (Camada de Dados)
```bash
src/services/admin/
├── dashboard.ts      # Métricas dashboard
├── jobs.ts           # Gerenciamento de jobs
├── users.ts          # Famílias + Profissionais
├── tickets.ts        # Service desk
└── funil.ts          # Funil de conversão
```

---

### **FASE 2: Módulos Core (Semana 2-3)**

#### 2.1 Dashboard (Visão Geral)
```
✅ 6 KPIs principais
✅ Alertas críticos
✅ Top 5 regiões
✅ Auto-refresh (60s)
✅ Filtro de período
```

#### 2.2 Módulo de Usuários
```
✅ Tabela de Famílias
✅ Tabela de Profissionais
✅ Detalhes individuais
✅ Ações admin (bloquear, desbloquear)
✅ Filtros múltiplos
✅ Exportar CSV
```

#### 2.3 Módulo de Jobs
```
✅ Tabela de jobs
✅ Normalização de status
✅ Detalhes de job
✅ Timeline de eventos
✅ Filtros avançados
```

---

### **FASE 3: Módulos Avançados (Semana 4)**

#### 3.1 Funil de Conversão
```
✅ 7 estágios
✅ Taxas de conversão
✅ Drop-off por estágio
✅ Insights automáticos
```

#### 3.2 Status & Alertas
```
✅ 5 categorias de alertas
✅ Dashboard consolidado
✅ Ações rápidas
✅ Severidade visual
```

#### 3.3 Service Desk
```
✅ Kanban 3 colunas
✅ Drag & drop
✅ Priorização automática
✅ SLA monitoring
✅ Métricas de resolução
```

---

### **FASE 4: Refinamento (Semana 5)**

#### 4.1 Performance
```
✅ Cache inteligente (Redis)
✅ Rate limiting por rota
✅ Lazy loading
✅ Skeleton states
```

#### 4.2 UX Final
```
✅ Loading states
✅ Empty states
✅ Error boundaries
✅ Toasts de confirmação
✅ Navegação keyboard
```

#### 4.3 Documentação
```
✅ API docs (cada endpoint)
✅ Guia de uso admin
✅ Changelog
✅ Playbook de alertas
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

### **Antes de Implementar Qualquer Métrica**

- [ ] A fonte de dados existe? (Firestore collection, Stripe API, GA4)
- [ ] O campo existe na collection? (verificar schema)
- [ ] Os dados são consistentes? (PT/EN, formatos)
- [ ] A query é auditável? (pode ser verificada manualmente)
- [ ] Tem data de atualização? (timestamp visível)
- [ ] Tem fonte explícita? (ex: "Firebase:jobs")

### **Antes de Lançar um Módulo**

- [ ] Loading states implementados
- [ ] Empty states com ações claras
- [ ] Error boundaries
- [ ] Filtros funcionando
- [ ] Export de dados (CSV)
- [ ] Responsivo (mobile, tablet, desktop)
- [ ] Auditado manualmente (compare com Firebase Console)

---

## 🎯 MÉTRICAS DE SUCESSO DO PAINEL

### **KPIs do Produto (Painel Admin)**

1. **Tempo para identificar problema crítico** < 30s
   - Alertas visíveis no dashboard
   - Severidade clara

2. **Taxa de ação em alertas** > 80%
   - Alertas acionáveis
   - Ações de 1-click

3. **Acurácia dos dados** = 100%
   - Auditoria manual semanal
   - Zero discrepâncias com Firebase

4. **Satisfação dos admins** > 8/10
   - Pesquisa quinzenal
   - Feedback qualitativo

---

## 📞 CONTATO & SUPORTE

**Documentação:**
- Arquivo: `PAINEL_ADMIN_ARQUITETURA.md`
- Data: 08/02/2026
- Versão: 3.0.0

**Próximos Passos:**
1. Revisar arquitetura com stakeholders
2. Aprovar priorização de módulos
3. Iniciar FASE 1 (Fundações)

---

**FIM DA DOCUMENTAÇÃO**

🏥 **Cuide-me** - Cuidado de qualidade, baseado em dados reais.
