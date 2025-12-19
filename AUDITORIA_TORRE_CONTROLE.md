# 🎯 AUDITORIA COMPLETA: TORRE DE CONTROLE

**Data:** 2025-02-05  
**Auditor:** Staff Engineer + Data/Product Engineer  
**Objetivo:** Mapear estado atual e propor melhorias seguindo práticas de engenharia de dados

---

## 📋 SUMÁRIO EXECUTIVO

### Status Atual
- ✅ Torre de Controle V2 implementada e funcional
- ✅ Integração completa: GA4 + Stripe + Firebase
- ✅ Dashboard decisório com 4 blocos principais
- ⚠️ Faltam KPIs críticos e alertas pró-ativos
- ⚠️ Métricas de qualidade e retenção não mapeadas
- ⚠️ Faltam funis de conversão end-to-end

### Próximas Ações
1. **ADICIONAR** KPIs de qualidade (NPS, ratings, tempo de resposta)
2. **ADICIONAR** Sistema de alertas financeiros/operacionais
3. **ADICIONAR** Funis de conversão (signup → match → recorrência)
4. **ADICIONAR** Observabilidade (logs estruturados, métricas de performance)

---

## 🗺️ MAPA COMPLETO DO SISTEMA

### 1. INTEGRAÇÕES EXTERNAS

#### Google Analytics 4 (GA4)
```
Configuração:
- Property ID: 503083965
- Measurement ID: G-B21PK9JQYS
- Variáveis:
  * GA4_PROPERTY_ID=503083965
  * NEXT_PUBLIC_GA4_ID=G-B21PK9JQYS
  * GOOGLE_APPLICATION_CREDENTIALS_JSON (base64)

Cliente: BetaAnalyticsDataClient
Localização: src/services/admin/analytics.ts

Uso Atual:
✅ Pageviews (dailyMetrics)
✅ Eventos customizados (getEventsByName)
✅ Conversões
✅ Origem de tráfego
❌ Funil de conversão (não implementado)
❌ Eventos GA4 no produto (não mapeados)
```

#### Stripe API
```
Configuração:
- Secret Key: sk_live_... (produção)
- API Version: 2025-02-24.acacia
- Variáveis:
  * STRIPE_SECRET_KEY
  * NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

Cliente: Stripe SDK
Localização: src/lib/server/stripe.ts

Objetos em Uso:
✅ charges.list() - Receitas do mês
✅ subscriptions.list() - MRR, churn
✅ payouts.list() - Payout schedule
❌ checkout.sessions - Não mapeado
❌ payment_intents - Não mapeado
❌ invoices - Não mapeado
```

#### Firebase/Firestore
```
Configuração:
- Project: plataforma-cuide-me
- Variáveis:
  * FIREBASE_ADMIN_SERVICE_ACCOUNT (base64)
  * FIREBASE_PROJECT_ID

Cliente: Firebase Admin SDK
Localização: src/lib/server/firebaseAdmin.ts

Coleções Mapeadas:
✅ users - 192 docs (183 profissional, 8 cliente, 1 admin)
✅ jobs - Solicitações de cuidado
✅ feedbacks - Avaliações de serviço
✅ tickets - Service desk
✅ ratings - Avaliações de profissionais
❌ deals - Pipeline de vendas (mencionado, mas vazio?)
❌ proposals - Propostas (mencionado em users/index.ts)
❌ report_schedules - Relatórios agendados
❌ report_executions - Histórico de relatórios
❌ report_configs - Configurações de relatórios
❌ alerts_collection - Sistema de alertas (mencionado em alertService.ts)

Schema (CORRIGIDO em toda aplicação):
- clientId (não familyId)
- specialistId (não professionalId)
- perfil (não userType)
- Suporte a Timestamp + ISO strings via toDate()
```

---

### 2. ESTRUTURA DA TORRE DE CONTROLE

#### 2.1 Página Principal
**Arquivo:** `src/app/admin/page.tsx`

**Descrição:** Torre de Controle V2 - Dashboard Decisório  
**Pergunta Central:** "Estamos ganhando ou perdendo dinheiro? Onde está o gargalo? O que vai virar problema?"

**Blocos Implementados:**

1. **💰 Realidade do Negócio** (businessHealth)
   - Receita do Mês (current, percentChange, trend)
   - Burn Rate
   - Runway (meses de caixa)
   - MRR em Risco
   - Crescimento MoM

2. **⚙️ Gargalos Operacionais** (operations)
   - Jobs por SLA (no prazo, atrasadas)
   - Tempo Médio de Match
   - Funil de Conversão (cadastro → proposta → match → recorrência)

3. **🏪 Marketplace** (marketplace)
   - Profissionais Disponíveis
   - Taxa de Abandono Pós-Aceitação

4. **🚨 Ações Urgentes** (urgentActions)
   - Lista de alertas críticos
   - Priorização automática por risco

**Gráficos Adicionados:**
- ✅ Views diárias (GA4)
- ✅ Signups diários (Firebase)

**Auto-refresh:** 60 segundos

---

#### 2.2 API Route
**Arquivo:** `src/app/api/admin/control-tower/route.ts`

**Endpoint:** `GET /api/admin/control-tower`

**Fluxo:**
1. Autenticação via `verifyAdminAuth()`
2. Chama `getControlTowerDashboard()`
3. Retorna JSON com `{ success, data, meta }`

**Service Principal:** `src/services/admin/control-tower/index.ts`

---

#### 2.3 Services de Dados

**Localização:** `src/services/admin/control-tower/`

**Arquivos:**
```
├── index.ts           - Orquestrador principal (getControlTowerDashboard)
├── types.ts           - TypeScript interfaces
├── finance.ts         - Métricas financeiras (Stripe)
├── operations.ts      - Métricas operacionais (Firebase + Stripe)
├── marketplace.ts     - Métricas de marketplace (Firebase)
└── risk.ts            - Sistema de alertas e riscos
```

**Funções Implementadas:**

**finance.ts:**
- `getMonthRevenue()` - Receita do mês (Stripe charges)
- `getBurnRate()` - Queima de caixa (Stripe payouts)
- `getRunway()` - Meses de runway restantes
- `getMRRAtRisk()` - MRR de clientes inativos

**operations.ts:**
- `getRequestsBySLA()` - Jobs dentro/fora do SLA
- `getAverageTimeToMatch()` - Tempo médio de matching
- `getConversionFunnel()` - Funil de conversão

**marketplace.ts:**
- `getAvailableProfessionals()` - Profissionais disponíveis para matching
- `getPostAcceptAbandonment()` - Taxa de abandono após aceite

**risk.ts:**
- `generateUrgentActions()` - Gera alertas automáticos
- `calculateSystemHealth()` - Health score do sistema

---

### 3. ROTAS API ADMIN DISPONÍVEIS

**Localização:** `src/app/api/admin/`

```
├── alerts/                   - Sistema de alertas (torre)
├── analytics/                - Google Analytics (deprecated?)
├── audit-data/               - Auditoria de dados
├── auditoria-especialidades/ - Auditoria de especialistas
├── auditoria-profissionais/  - Auditoria de profissionais
├── check-data/               - Verificação de dados
├── control-tower/            ✅ Torre de Controle principal
├── cruzamento-stripe-firebase/ - Reconciliação Stripe/Firebase
├── daily-metrics/            ✅ Métricas diárias (GA4 + Firebase)
├── dashboard-v2/             - Dashboard V2 (deprecated?)
├── financeiro/               ✅ Métricas financeiras (Stripe)
├── financeiro-v2/            - Financeiro V2
├── growth/                   - Growth analytics
├── operational-health/       - Saúde operacional
├── pipeline/                 - Pipeline de vendas
├── pipeline-v2/              - Pipeline V2
├── reports/                  - Relatórios automatizados
├── service-desk/             ✅ Service desk (tickets)
├── simple-test/              - Testes
├── test-count/               - Teste de contagem
├── torre/                    - Torre (legacy?)
├── torre-stats/              - Torre stats
├── torre-v3/                 - Torre V3
└── users/                    ✅ Gestão de usuários
```

**⚠️ Atenção:** Múltiplas versões de rotas (torre, torre-stats, torre-v3, control-tower). **Recomendação:** Consolidar ou remover versões antigas.

---

### 4. EVENTOS GA4 NO PRODUTO

**Status:** ❌ **NÃO MAPEADOS**

**Achados:**
- Código busca eventos por nome (`getEventsByName()` no analytics.ts)
- Exemplos mencionados: `sign_up`, `purchase`, `contact_caregiver`
- **PROBLEMA:** Nenhum `gtag()` ou `logEvent()` encontrado no código server-side

**Ação Necessária:**
1. ❌ Buscar no código client-side (src/app/**/page.tsx)
2. ❌ Mapear eventos disparados pelo Google Tag Manager
3. ❌ Documentar taxonomia de eventos (nome, parâmetros, quando dispara)
4. ❌ Criar tabela de mapeamento eventos → funcionalidade

**Eventos Esperados (não confirmados):**
- `page_view` (automático)
- `sign_up` (cadastro)
- `profile_complete` (completar perfil)
- `contact_caregiver` (solicitar cuidado)
- `match_accepted` (aceitar match)
- `payment_success` (pagamento)

---

### 5. OBJETOS STRIPE EM USO

**Confirmados:**
- ✅ `charges` - Transações individuais (getMonthRevenue, financeiro)
- ✅ `subscriptions` - Assinaturas MRR (getMRRAtRisk)
- ✅ `payouts` - Pagamentos para profissionais (getBurnRate)

**Não Confirmados:**
- ❓ `checkout.sessions` - Sessões de checkout (mencionado mas não usado)
- ❓ `payment_intents` - Intenções de pagamento
- ❓ `invoices` - Faturas
- ❓ `customers` - Clientes Stripe
- ❓ `products` - Produtos/planos
- ❓ `prices` - Preços dos planos

**Ação Necessária:**
- ✅ Buscar referências no código
- ✅ Mapear objetos atualmente usados
- ❌ Documentar campos relevantes de cada objeto
- ❌ Identificar gaps de dados financeiros

---

### 6. COLEÇÕES FIREBASE/FIRESTORE

**Produção Confirmada:**

| Coleção | Schema | Docs | Uso na Torre |
|---------|--------|------|-------------|
| `users` | clientId, specialistId, perfil, nome, email, createdAt | 192 | ✅ Profissionais disponíveis, clientes ativos |
| `jobs` | clientId, specialistId, status, createdAt, updatedAt | 1+ | ✅ SLA, tempo de match, funil |
| `feedbacks` | jobId, rating, comment, createdAt | ? | ✅ NPS, satisfação |
| `tickets` | type, status, priority, createdAt, resolvedAt | ? | ✅ Service desk |
| `ratings` | specialistId, clientId, rating, createdAt | ? | ⚠️ Usado em operational-health, NÃO na torre |
| `proposals` | jobId, specialistId, status, createdAt | ? | ⚠️ Mencionado em users/index.ts, NÃO na torre |
| `deals` | stage, value, createdAt | 0? | ⚠️ Mencionado em pipeline-v2, possivelmente vazio |

**Sistema Interno (não domínio):**
- `report_schedules` - Relatórios agendados
- `report_executions` - Histórico de execução
- `report_configs` - Configurações de relatórios
- `alerts_collection` - Alertas (mencionado em alertService.ts)

**Campos Padrão (após correção):**
- ✅ `clientId` (ao invés de familyId)
- ✅ `specialistId` (ao invés de professionalId)
- ✅ `perfil` (ao invés de userType)
- ✅ Timestamps suportam `.toDate()` e ISO strings via helper

---

### 7. MÉTRICAS ATUALMENTE IMPLEMENTADAS

#### Financeiras (Stripe)
| Métrica | Fonte | Cálculo | Status |
|---------|-------|---------|--------|
| Receita do Mês | charges | Sum(amount where status=succeeded) | ✅ |
| MRR | subscriptions | Sum(amount where status=active) | ✅ |
| Burn Rate | payouts | Avg monthly payouts | ✅ |
| Runway | charges + payouts | MRR / Burn Rate | ✅ |
| MRR em Risco | subscriptions | MRR de clientes sem jobs 30d | ✅ |
| Crescimento MoM | charges | (Atual - Anterior) / Anterior | ✅ |

#### Operacionais (Firebase)
| Métrica | Fonte | Cálculo | Status |
|---------|-------|---------|--------|
| Jobs no Prazo | jobs | Count(createdAt < 48h ago) | ✅ |
| Jobs Atrasadas | jobs | Count(createdAt > 48h ago) | ✅ |
| Tempo Médio Match | jobs | Avg(matchedAt - createdAt) | ✅ |
| Funil Conversão | jobs + users | Cadastros → Propostas → Matches → Recorrência | ✅ |

#### Marketplace (Firebase)
| Métrica | Fonte | Cálculo | Status |
|---------|-------|---------|--------|
| Profissionais Disponíveis | users | Count(perfil=profissional, ativo=true, disponível=true) | ✅ |
| Taxa Abandono Pós-Aceite | jobs | Count(status=accepted → canceled) / Total aceitos | ✅ |

#### Tráfego (GA4)
| Métrica | Fonte | Cálculo | Status |
|---------|-------|---------|--------|
| Views Diárias | GA4 | runReport(screenPageViews) | ✅ |
| Signups Diários | Firebase | Count(users.createdAt) | ✅ |

---

### 8. MÉTRICAS NÃO IMPLEMENTADAS (GAPS)

#### Qualidade do Serviço ❌
- **NPS Score** (Net Promoter Score)
  - Fonte: feedbacks collection
  - Cálculo: (Promotores - Detratores) / Total * 100
  - Promotores: rating >= 9
  - Detratores: rating <= 6
  - **Impacto:** Crítico para retenção

- **Rating Médio por Profissional**
  - Fonte: ratings collection
  - Cálculo: Avg(rating) por specialistId
  - **Impacto:** Alto (qualidade do marketplace)

- **Tempo Médio de Resposta**
  - Fonte: tickets collection
  - Cálculo: Avg(resolvedAt - createdAt)
  - **Impacto:** Médio (satisfação do cliente)

- **Taxa de Resolução 1º Contato**
  - Fonte: tickets collection
  - Cálculo: Count(status=resolved sem reassign) / Total
  - **Impacto:** Alto (eficiência operacional)

#### Retenção e Lifetime Value ❌
- **Churn Rate** (Taxa de Cancelamento)
  - Fonte: Stripe subscriptions
  - Cálculo: Cancellations / Active subs
  - **Impacto:** CRÍTICO (saúde do negócio)

- **LTV (Lifetime Value)**
  - Fonte: Stripe charges + subscriptions
  - Cálculo: Avg revenue per customer * Avg lifetime
  - **Impacto:** CRÍTICO (estratégia de crescimento)

- **Retention Rate (Cohorts)**
  - Fonte: users + jobs
  - Cálculo: % usuários ativos por cohort mensal
  - **Impacto:** Alto (produto-mercado fit)

- **Frequência de Uso**
  - Fonte: jobs collection
  - Cálculo: Jobs per client per month
  - **Impacto:** Alto (engajamento)

#### Alertas Pró-Ativos ❌
- **Clientes em Risco** (Não usaram em 30d)
  - Fonte: jobs + subscriptions
  - Alerta: clientId sem jobs em 30d + subscription ativa
  - **Impacto:** CRÍTICO (churn prevention)

- **Profissionais Inativos** (Não aceitaram jobs em 14d)
  - Fonte: jobs + users
  - Alerta: specialistId sem jobs aceitos em 14d
  - **Impacto:** Alto (supply marketplace)

- **Queda Abrupta de Signups** (>30% week-over-week)
  - Fonte: GA4 + Firebase
  - Alerta: signups_week < signups_prev_week * 0.7
  - **Impacto:** CRÍTICO (aquisição)

- **Atraso Crítico de Pagamentos** (Payout atrasado >7d)
  - Fonte: Stripe payouts
  - Alerta: expected_payout_date < today - 7d
  - **Impacto:** CRÍTICO (cash flow)

#### Funis Detalhados ❌
- **Funil de Ativação** (Signup → Profile Complete → First Job)
  - Fonte: users + jobs
  - Etapas: Cadastro → Completar perfil → Criar job → Match
  - **Impacto:** Alto (product-led growth)

- **Funil de Recorrência** (First Job → Second Job → Subscription)
  - Fonte: jobs + subscriptions
  - Etapas: 1º job → 2º job → Assinatura
  - **Impacto:** CRÍTICO (LTV)

- **Funil de Conversão GA4** (Landing → Signup → First Job)
  - Fonte: GA4 events
  - Etapas: page_view → sign_up → contact_caregiver → match_accepted
  - **Impacto:** Alto (marketing attribution)

---

## 🔍 ANÁLISE DE RISCOS E OPORTUNIDADES

### Riscos Identificados

#### 1. 🔴 CRÍTICO: Múltiplas Versões de Rotas
**Problema:** Rotas duplicadas (torre, torre-stats, torre-v3, control-tower)  
**Impacto:** Confusão de qual usar, manutenção duplicada  
**Ação:** Consolidar em control-tower, deprecar antigas

#### 2. 🔴 CRÍTICO: Eventos GA4 Não Mapeados
**Problema:** Não sabemos quais eventos são disparados no produto  
**Impacto:** Impossível fazer attribution, otimizar funis  
**Ação:** Auditar código client-side, documentar eventos

#### 3. 🟡 ALTO: Métricas de Qualidade Ausentes
**Problema:** Sem NPS, ratings, tempo de resposta  
**Impacto:** Não detectamos problemas de qualidade cedo  
**Ação:** Implementar dashboard de qualidade

#### 4. 🟡 ALTO: Alertas Não Pró-Ativos
**Problema:** Alertas só aparecem quando problema já ocorreu  
**Impacto:** Perda de receita, churn evitável  
**Ação:** Implementar alertas preditivos (clientes em risco, etc)

#### 5. 🟢 MÉDIO: Observabilidade Limitada
**Problema:** Logs console.log, sem estruturação  
**Impacto:** Difícil debugar em produção  
**Ação:** Migrar para logs estruturados (JSON), adicionar tracing

### Oportunidades

#### 1. 🚀 Dashboards de Qualidade
- NPS tracking
- Rating por profissional
- Tempo de resposta service desk
- **ROI:** Detecção precoce de problemas de qualidade

#### 2. 🚀 Sistema de Alertas Inteligente
- Clientes em risco (sem jobs 30d)
- Profissionais inativos (sem jobs aceitos 14d)
- Queda de signups (>30% WoW)
- Atraso de pagamentos (>7d)
- **ROI:** Prevenção de churn, ação proativa

#### 3. 🚀 Funis Detalhados
- Ativação (signup → first job)
- Recorrência (first job → subscription)
- Marketing attribution (landing → conversion)
- **ROI:** Otimização de growth, aumento de LTV

#### 4. 🚀 Observabilidade Avançada
- Logs estruturados (JSON)
- Distributed tracing (OpenTelemetry)
- Métricas de performance (latency, error rate)
- **ROI:** Menor MTTR (Mean Time To Recovery)

---

## 📊 DADOS DE PRODUÇÃO (SNAPSHOT)

### Firebase
```
users: 192 docs
├── 183 profissional (95.3%)
├── 8 cliente (4.2%)
└── 1 admin (0.5%)

jobs: 1+ docs
feedbacks: ? docs
tickets: ? docs
ratings: ? docs
```

### Stripe
```
Charges: Production data available
Subscriptions: Production data available
Payouts: Production data available
```

### GA4
```
Property: 503083965
Measurement: G-B21PK9JQYS
Data: Last 30 days available
```

---

## ✅ RECOMENDAÇÕES PRIORIZADAS

### IMEDIATO (Esta Sprint)

#### 1. Consolidar Rotas API
```
❌ Remover/Deprecar:
- /api/admin/torre (legacy)
- /api/admin/torre-stats (legacy)
- /api/admin/torre-v3 (legacy)
- /api/admin/dashboard-v2 (legacy?)

✅ Manter:
- /api/admin/control-tower (principal)
- /api/admin/daily-metrics (gráficos)
- /api/admin/financeiro (financeiro)
- /api/admin/operational-health (operacional)
```

#### 2. Mapear Eventos GA4
```bash
# Buscar gtag() no código client-side
grep -r "gtag\(|logEvent" src/app

# Documentar eventos encontrados
# Criar EVENTOS_GA4.md com taxonomia
```

#### 3. Adicionar Métricas Críticas
```typescript
// src/services/admin/control-tower/quality.ts (NOVO)
export async function getNPS(): Promise<number>
export async function getAverageRating(): Promise<number>
export async function getAverageResponseTime(): Promise<number>

// src/services/admin/control-tower/retention.ts (NOVO)
export async function getChurnRate(): Promise<number>
export async function getLTV(): Promise<number>
export async function getRetentionByMês(): Promise<CohortData[]>
```

### CURTO PRAZO (Próximas 2 Sprints)

#### 4. Sistema de Alertas Inteligente
```typescript
// src/services/admin/alerts/predictive.ts (NOVO)
export async function detectClientsAtRisk(): Promise<Alert[]>
export async function detectInactiveProfessionals(): Promise<Alert[]>
export async function detectSignupDrops(): Promise<Alert[]>
export async function detectPaymentDelays(): Promise<Alert[]>

// Integrar com Torre de Controle
// Adicionar badge de alertas na navbar
// Email/Slack notifications
```

#### 5. Dashboard de Qualidade
```
Nova página: /admin/qualidade

KPIs:
- NPS Score (com trend)
- Rating Médio (geral + por profissional)
- Tempo Médio de Resposta (service desk)
- Taxa de Resolução 1º Contato
- Top profissionais (por rating)
- Bottom profissionais (em risco)
```

#### 6. Funis Avançados
```
Nova página: /admin/funis

Funis:
- Ativação (signup → profile → first job → match)
- Recorrência (first job → second job → subscription)
- Marketing (landing → signup → conversion)

Visualização: Sankey diagram ou funnel chart
Filtros: Data range, origem, perfil
```

### MÉDIO PRAZO (1-2 Meses)

#### 7. Observabilidade Avançada
```javascript
// Migrar de console.log para logs estruturados
import { logger } from '@/lib/observability/logger';

logger.info('Control Tower loaded', {
  userId: authResult.user.uid,
  duration: Date.now() - startTime,
  metrics: { revenue, mrr, burnRate }
});

// Adicionar tracing
import { trace } from '@/lib/observability/tracing';

const span = trace.startSpan('getControlTowerDashboard');
// ... código ...
span.end();
```

#### 8. Cohort Analysis
```
Nova página: /admin/cohorts

Análise:
- Retention por cohort mensal
- LTV por cohort
- Churn rate por cohort
- Comparação entre cohorts

Visualização: Heatmap de retention
```

#### 9. Documentação Completa
```markdown
Criar:
- EVENTOS_GA4.md - Taxonomia de eventos
- OBJETOS_STRIPE.md - Mapeamento de objetos Stripe
- COLECOES_FIREBASE.md - Schema de cada coleção
- TORRE_PLAYBOOK.md - Como usar a Torre de Controle
- ALERTAS_PLAYBOOK.md - Como responder a cada alerta
```

---

## 🛠️ IMPLEMENTAÇÃO SUGERIDA

### Fase 1: Foundation (Semana 1-2)
- [ ] Consolidar rotas API (remover legacy)
- [ ] Mapear eventos GA4 (auditoria client-side)
- [ ] Adicionar quality.ts e retention.ts
- [ ] Testes unitários para novos services

### Fase 2: Quality & Alerts (Semana 3-4)
- [ ] Dashboard de qualidade (/admin/qualidade)
- [ ] Sistema de alertas preditivos (predictive.ts)
- [ ] Integração alertas com Torre
- [ ] Testes E2E

### Fase 3: Funnels & Observability (Semana 5-6)
- [ ] Dashboard de funis (/admin/funis)
- [ ] Logs estruturados (logger.ts)
- [ ] Distributed tracing (tracing.ts)
- [ ] Performance monitoring

### Fase 4: Advanced Analytics (Semana 7-8)
- [ ] Cohort analysis (/admin/cohorts)
- [ ] LTV calculator
- [ ] Churn prediction model (ML?)
- [ ] Documentação completa

---

## 📝 NOTAS FINAIS

### O Que NÃO Fazer
- ❌ Alterar schema Firebase (clientId, specialistId, perfil)
- ❌ Mudar lógica de negócio existente
- ❌ Alterar configurações Stripe/GA4/Firebase
- ❌ Remover código sem confirmar que não é usado

### O Que PODE Fazer
- ✅ Adicionar novas páginas admin (/admin/*)
- ✅ Adicionar novos services (src/services/admin/*)
- ✅ Adicionar novas rotas API (/api/admin/*)
- ✅ Adicionar testes
- ✅ Melhorar logs e observabilidade
- ✅ Adicionar documentação

### Aprovações Necessárias
Para implementar melhorias que tocam:
1. Rotas API existentes → Revisar diff, aprovar
2. Services existentes → Revisar diff, aprovar
3. Schema de dados → ❌ Não tocar
4. Integrações externas → ❌ Não tocar

---

## 🎯 PRÓXIMOS PASSOS

1. **Revisar este documento** com o time
2. **Priorizar fases** de implementação
3. **Criar tasks** no backlog
4. **Começar Fase 1** (Foundation)

**Dúvidas ou sugestões?** Adicionar comentários neste documento.

---

**Fim da Auditoria**  
*Documento vivo - atualizar conforme implementação*
