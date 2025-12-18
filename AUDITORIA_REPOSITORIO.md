# 📋 AUDITORIA COMPLETA DO REPOSITÓRIO
**Data:** 2024-01-XX  
**Objetivo:** Inventariar TODOS os dados reais antes de implementar melhorias na Torre de Controle

---

## ✅ PASSO 2.1 - ROTAS ADMIN

### Admin Pages (12 rotas)
| Rota | Arquivo | Função |
|------|---------|--------|
| `/admin` | `src/app/admin/page.tsx` | **Torre de Controle V2** - Dashboard principal decisório |
| `/admin/dashboard` | `src/app/admin/dashboard/page.tsx` | Dashboard secundário |
| `/admin/operational-health` | `src/app/admin/operational-health/page.tsx` | Saúde operacional (profissionais, famílias, matches) |
| `/admin/pipeline` | `src/app/admin/pipeline/page.tsx` | Pipeline de vendas |
| `/admin/users` | `src/app/admin/users/page.tsx` | Gerenciamento de usuários |
| `/admin/growth` | `src/app/admin/growth/page.tsx` | Métricas de crescimento |
| `/admin/financeiro` | `src/app/admin/financeiro/page.tsx` | Financeiro V1 |
| `/admin/financeiro-v2` | `src/app/admin/financeiro-v2/page.tsx` | Financeiro V2 |
| `/admin/service-desk` | `src/app/admin/service-desk/page.tsx` | Atendimento/tickets |
| `/admin/alerts` | `src/app/admin/alerts/page.tsx` | Sistema de alertas |
| `/admin/reports` | `src/app/admin/reports/page.tsx` | Geração de relatórios |
| `/admin/login` | `src/app/admin/login/page.tsx` | Autenticação admin |

### Página Principal - `/admin/page.tsx`
**Características:**
- Nome: "Torre de Controle V2 - Dashboard Decisório"
- Auto-refresh a cada 60 segundos
- Usa `authFetch` para chamadas autenticadas
- Renderiza `LineChart` do Recharts para métricas diárias
- APIs chamadas:
  - `GET /api/admin/control-tower` (dados principais)
  - `GET /api/admin/daily-metrics` (gráficos diários)

### Layout Admin - `/admin/layout.tsx`
- Verifica `localStorage.getItem('admin_logged')`
- Redireciona para `/admin/login` se não autenticado
- Wrapper simples sem lógica adicional

---

## ✅ PASSO 2.2 - GOOGLE ANALYTICS 4

### Configuração GA4
**Property ID:** `503083965`  
**Variável de ambiente:** `GA4_PROPERTY_ID`  
**Credenciais:** `GOOGLE_ANALYTICS_CREDENTIALS` (base64 JSON do service account)

### Cliente GA4
**Arquivo:** `src/services/admin/analyticsService.ts`
```typescript
import { BetaAnalyticsDataClient } from '@google-analytics/data';
```

### Métricas GA4 Buscadas
| Métrica | Descrição |
|---------|-----------|
| `activeUsers` | Usuários ativos no período |
| `newUsers` | Novos usuários |
| `sessions` | Sessões totais |
| `screenPageViews` | Visualizações de página |
| `bounceRate` | Taxa de rejeição |
| `averageSessionDuration` | Duração média da sessão |
| **Device breakdown** | Por categoria de dispositivo |

### Interface Retornada
```typescript
interface GoogleAnalyticsMetrics {
  activeUsers: number;
  newUsers: number;
  sessions: number;
  pageViews: number;
  bounceRate: number;
  averageSessionDuration: number;
  deviceCategories: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
}
```

### Eventos GA4 Encontrados (LIMITADO)
⚠️ **IMPORTANTE:** Poucos eventos encontrados no código backend

| Evento | Localização | Status |
|--------|-------------|--------|
| `sign_up` | Comentários em `analytics.ts` | ⚠️ Referência apenas |
| `purchase` | Types `avgPurchaseFrequency` | ⚠️ Tipo definido |

**CONCLUSÃO:** 
- ❌ **Não há implementação robusta de eventos personalizados no backend**
- ✅ GA4 está configurado apenas para **métricas gerais** (usuários, sessões, pageviews)
- 🔍 **Eventos podem estar no frontend/mobile** (fora do escopo desta auditoria)

### APIs GA4 Criadas
| Rota | Função |
|------|--------|
| `/api/admin/analytics` | Retorna métricas do `analyticsService.ts` |
| `/api/admin/daily-metrics` | Combina GA4 + Firebase para gráficos diários |

---

## ✅ PASSO 2.3 - STRIPE

### Configuração Stripe
**API Version:** `2025-02-24.acacia`  
**Variável de ambiente:** `STRIPE_SECRET_KEY`  
**Cliente:** `src/lib/server/stripe.ts` exporta `getStripeClient()`

### Objetos Stripe Utilizados

#### 1. **Subscriptions** (Assinaturas)
**Usado em:**
- `src/services/admin/financeiro-v2/index.ts`
- `src/services/admin/control-tower/finance.ts`
- `src/services/admin/finance.ts`

**Queries:**
```typescript
// Assinaturas ativas
stripe.subscriptions.list({ status: 'active', limit: 100 })

// Assinaturas canceladas
stripe.subscriptions.list({ status: 'canceled', limit: 100 })
```

**Campos usados:**
- `items.data[0].price.unit_amount` (valor em centavos)
- `items.data[0].price.recurring.interval` ('month' | 'year')
- `items.data[0].price.nickname` (nome do plano)
- `status` ('active' | 'canceled' | 'past_due' | 'trialing')
- `canceled_at` (timestamp de cancelamento)

**Cálculos:**
- **MRR** (Monthly Recurring Revenue) = soma de todas assinaturas normalizadas para mês
- **ARR** (Annual Recurring Revenue) = MRR * 12
- **Churn Rate** = cancelamentos do mês / total de clientes

#### 2. **Charges** (Pagamentos)
**Usado em:**
- `src/services/admin/stripeService.ts`
- `src/services/admin/dashboard/financeiro.ts`

**Queries:**
```typescript
stripe.charges.list({
  limit: 100,
  created: { gte: timestampInicio }
})
```

**Campos usados:**
- `status` ('succeeded' | 'failed')
- `amount` (valor em centavos)
- `payment_method_details.type` ('card' | 'pix' | other)
- `created` (timestamp)

**Métricas:**
- Total de receita (soma de charges bem-sucedidos)
- Pagamentos falhados
- Breakdown por método de pagamento

#### 3. **Payouts** (Transferências)
**Usado em:**
- `src/services/admin/control-tower/finance.ts` (Burn Rate)

**Queries:**
```typescript
stripe.payouts.list({
  created: { gte: startTimestamp },
  limit: 100
})
```

**Função:** Calcular despesas (pagamentos aos profissionais)
- **Burn Rate** = Total de payouts no mês
- **Net Burn** = MRR - Payouts

#### 4. **Balance** (Saldo)
**Usado em:**
- `src/services/admin/control-tower/finance.ts` (Runway)

**Query:**
```typescript
stripe.balance.retrieve()
```

**Campos usados:**
- `available[]` (saldos disponíveis por moeda)
- `pending[]` (saldos pendentes)

**Cálculo de Runway:**
```typescript
cashBalance = (available + pending) / 100
runway = cashBalance / abs(netBurn)
```

#### 5. **Refunds** (Reembolsos)
**Usado em:**
- `src/services/admin/stripeService.ts`

**Query:**
```typescript
stripe.refunds.list({ limit: 100, created })
```

**Métricas:** Total de valores reembolsados

### ❌ Webhooks Stripe
**Status:** **NÃO ENCONTRADOS**
- Nenhum arquivo em `src/app/api/**/webhook*`
- Nenhuma rota `route.ts` processando webhooks Stripe
- Apenas referências a "webhook" em contexto de relatórios agendados (não Stripe)

**Implicação:**
- Dados financeiros dependem de **polling** (consultas periódicas)
- Não há processamento em tempo real de eventos Stripe

### 🔗 Ligação Stripe ↔ Firebase
**METADATA:** Apenas 2 referências encontradas em `alertService.ts` (não relacionadas a Stripe)

**CONCLUSÃO:**
- ❌ **Não há campo `metadata` sistemático nos objetos Stripe**
- ❌ **Não há ID de usuário Firebase nos subscriptions**
- ⚠️ **Ligação entre Stripe e Firebase não está explícita no código auditado**

**Possíveis cenários:**
1. Ligação feita via email (subscription → user.email)
2. Metadata não consultado nos serviços auditados
3. Ligação feita em outro sistema (mobile/frontend)

---

## ✅ PASSO 2.4 - FIREBASE COLLECTIONS

### Collections Encontradas

#### 1. **users** (192 documentos)
**Campos principais:**
```typescript
{
  perfil: 'profissional' | 'cliente'  // ✅ CAMPO PRINCIPAL
  userType: string                     // ⚠️ Campo legado
  email: string
  nome: string
  createdAt: Timestamp
  stripeAccountId?: string             // Profissionais
  // ... outros campos
}
```

**Distribuição:**
- Profissionais: `perfil === 'profissional'`
- Clientes/Famílias: `perfil === 'cliente'`

**Usado em:**
- Todos os módulos do admin
- Queries com `.where('perfil', '==', 'profissional')`

#### 2. **jobs** (Contratações)
**Campos principais:**
```typescript
{
  clientId: string           // ✅ ID da família (users doc)
  specialistId?: string      // ✅ ID do profissional (users doc)
  status: string             // 'pending' | 'accepted' | 'declined' | 'completed'
  paymentStatus?: string     // 'paid' | 'pending' | ...
  acceptedAt?: Timestamp
  completedAt?: Timestamp
  createdAt: Timestamp
  valor?: number
  // ... outros campos
}
```

**Status values encontrados:**
- `pending` - Aguardando
- `accepted` - Aceito pelo profissional
- `declined` - Recusado
- `completed` - Finalizado

**Usado para:**
- Matches (profissionais ↔ famílias)
- Cálculo de MRR em risco
- Taxa de conversão do pipeline
- Operações diárias

#### 3. **feedbacks**
**Estrutura:**
```typescript
{
  userId: string        // Quem deixou feedback
  jobId?: string        // Contratação relacionada
  rating?: number
  comment?: string
  createdAt: Timestamp
}
```

**Usado em:**
- Saúde operacional (satisfação de famílias)
- Qualidade do serviço

#### 4. **tickets** (Service Desk)
**Estrutura:**
```typescript
{
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  userId: string
  subject: string
  description: string
  priority?: string
  createdAt: Timestamp
  resolvedAt?: Timestamp
}
```

**API:** `/api/admin/service-desk`

#### 5. **ratings** (Avaliações)
**Estrutura:**
```typescript
{
  rating: number        // 1-5
  professionalId: string
  clientId: string
  jobId?: string
  createdAt: Timestamp
}
```

**Usado em:**
- Saúde operacional (matches)
- Taxa de avaliação positiva

#### 6. **deals** (Pipeline)
**Estrutura:**
```typescript
{
  status: 'active' | 'won' | 'lost' | 'on_hold'
  value: number
  stage: string
  createdAt: Timestamp
}
```

**Usado em:**
- `src/services/admin/pipeline-v2/`

#### 7. Collections de Relatórios (SISTEMA INTERNO)
- `report_configs` - Configurações de relatórios
- `report_schedules` - Agendamentos
- `report_executions` - Histórico de execuções

#### 8. Collections de Alertas (SISTEMA INTERNO)
- `alerts` (constante: `ALERTS_COLLECTION`)
- `alert_actions` (constante: `ALERT_ACTIONS_COLLECTION`)

### ❌ Collections NÃO encontradas / Vazias
Testado em `audit-data/route.ts`:
- `appointments` - Collection não existe ou vazia
- `matches` - Collection não existe ou vazia

**Nota:** Jobs + Users são suficientes para calcular matches

---

## 📊 RESUMO DE DADOS DISPONÍVEIS

### Google Analytics 4
✅ **Disponível:**
- Usuários ativos, novos usuários, sessões
- Pageviews, bounce rate, duração média
- Breakdown por dispositivo

❌ **NÃO Disponível:**
- Eventos personalizados robustos
- Funil de conversão configurado
- Tracking de ações específicas (sign_up, purchase, etc.)

### Stripe
✅ **Disponível:**
- Assinaturas ativas/canceladas → MRR, ARR, Churn
- Charges → Receita total, métodos de pagamento
- Payouts → Burn rate
- Balance → Runway (meses de caixa)

❌ **NÃO Disponível:**
- Webhooks em tempo real
- Metadata ligando Stripe ↔ Firebase
- Invoices detalhados

### Firebase Firestore
✅ **Disponível:**
- **users** (192 docs) → Profissionais + Clientes
- **jobs** → Contratações (status, pagamento, datas)
- **feedbacks** → Satisfação
- **ratings** → Avaliações
- **tickets** → Suporte

❌ **NÃO Disponível:**
- Collection `appointments` (vazia/não existe)
- Collection `matches` (vazia/não existe - calcular via jobs)

---

## 🎯 CONCLUSÕES PARA IMPLEMENTAÇÃO

### O que PODE ser implementado:

#### ✅ KPIs Financeiros (Linha 1)
**Fonte:** Stripe
- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)
- Churn Rate (cancelamentos / total)
- ARPU (Average Revenue Per User)
- LTV (Lifetime Value) estimado
- Burn Rate (payouts)
- Runway (balance / burn)

#### ✅ KPIs Operacionais (Linha 2)
**Fonte:** Firebase jobs + users
- Total de contratações (`jobs.count()`)
- Taxa de aceitação (`status: 'accepted' / total`)
- Tempo médio de resposta (`acceptedAt - createdAt`)
- Contratações completadas vs pendentes
- Profissionais ativos (com jobs aceitos)
- Famílias ativas (com jobs criados)

#### ✅ Saúde do Marketplace (Linha 3)
**Fonte:** Firebase users + jobs + ratings
- Supply (profissionais com `perfil: 'profissional'`)
- Demand (jobs com `status: 'pending'`)
- Supply/Demand Ratio
- Match Rate (jobs aceitos / jobs criados)
- Rating médio (ratings collection)

#### ⚠️ LIMITAÇÕES

**Funil de Conversão:** 
- ❌ **Não pode ser implementado com GA4 atual**
- Razão: Sem eventos personalizados (pageview → sign_up → payment → completed)
- Alternativa: Funil SIMPLIFICADO via Firebase:
  1. Usuário criado (`users.createdAt`)
  2. Job criado (`jobs.createdAt`)
  3. Job aceito (`jobs.status: 'accepted'`)
  4. Job pago (`jobs.paymentStatus: 'paid'`)
  5. Job completado (`jobs.status: 'completed'`)

**Alertas:**
- ✅ Podem ser implementados via:
  - Firebase queries (contadores de jobs/users)
  - Stripe (MRR em queda, churn alto)
  - Thresholds definidos no código

**Service Desk Metrics:**
- ✅ Collection `tickets` existe
- Métricas possíveis:
  - Tempo médio de resolução
  - Taxa de resolução
  - Tickets por status
  - SLA compliance

---

## 🚀 PRÓXIMOS PASSOS

### Implementação Recomendada

1. **Criar serviços agregadores** (sem modificar existentes):
   - `src/services/admin/torre-v3/kpis.ts` (calcula todos os KPIs)
   - `src/services/admin/torre-v3/funnel.ts` (funil simplificado Firebase)
   - `src/services/admin/torre-v3/alerts.ts` (regras de alerta)

2. **Criar API route nova**:
   - `src/app/api/admin/torre-v3/route.ts` (agrega tudo)

3. **Criar componentes React novos**:
   - `src/components/admin/torre-v3/KPIDashboard.tsx`
   - `src/components/admin/torre-v3/ConversionFunnel.tsx`
   - `src/components/admin/torre-v3/AlertPanel.tsx`

4. **Atualizar página principal**:
   - `src/app/admin/page.tsx` (adicionar novos componentes)

### ⚠️ REGRAS DE IMPLEMENTAÇÃO

✅ **PERMITIDO:**
- Criar novos arquivos
- Adicionar imports em arquivos existentes
- Criar novos componentes
- Criar novas rotas API

❌ **PROIBIDO:**
- Alterar lógica de serviços existentes
- Modificar schema do Firebase
- Alterar configuração Stripe/GA4
- Inventar eventos/collections que não existem

---

**FIM DA AUDITORIA**
