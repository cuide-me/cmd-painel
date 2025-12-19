# 🏗️ TORRE V2 - ESTRUTURA DE PÁGINAS

**Data:** 2024-12-18  
**Status:** Em Definição  
**Baseado em:** TORRE_V2_KPIS.md + TORRE_V2_FUNIS.md + TORRE_V2_ALERTAS.md

---

## 🗺️ MAPA DE NAVEGAÇÃO

```
/admin (Torre de Controle) ⭐
├── /admin/growth (Crescimento)
├── /admin/financeiro (Financeiro)
├── /admin/operacional (Operações) [ou renomear operational-health]
├── /admin/qualidade (Qualidade)
├── /admin/users (Usuários) [já existe]
├── /admin/pipeline (Pipeline) [já existe]
├── /admin/alerts (Alertas Inteligentes) [já existe]
├── /admin/reports (Relatórios) [já existe]
└── /admin/service-desk (Atendimento) [já existe]
```

---

## 🎯 /admin (TORRE DE CONTROLE)

**Objetivo:** Visão executiva de 30 segundos. Responder:
1. Estamos ganhando ou perdendo dinheiro?
2. Onde está o gargalo agora?
3. O que vai virar problema se eu não agir hoje?

### Layout
```
┌─────────────────────────────────────────────────────┐
│ 🎯 Torre de Controle - Dashboard Decisório          │
│ Atualizado há 2 minutos                              │
├─────────────────────────────────────────────────────┤
│                                                      │
│ 🌟 NORTH STAR METRICS (4 cards grandes)             │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│ │   MRR    │ │  Taxa    │ │   NPS    │ │ Alertas  ││
│ │  R$120k  │ │ Conversão│ │    68    │ │Críticos  ││
│ │  ↑ 12%   │ │   14.2%  │ │  ↑ 5pts  │ │    2     ││
│ │  🟢      │ │   🟡     │ │   🟢     │ │   🔴     ││
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘│
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│ 🚨 ALERTAS CRÍTICOS (3-5 mais urgentes)             │
│ ┌─────────────────────────────────────────────────┐│
│ │ 🔴 P0 │ 12 Solicitações sem Match há >24h      ││
│ │       │ SLA quebrado - 12 famílias afetadas    ││
│ │       │ ⚡ Notificar profissionais             ││
│ ├───────┴────────────────────────────────────────┤│
│ │ 🔴 P0 │ Taxa de Churn em 6.2% este mês        ││
│ │       │ 8 cancelamentos (meta: <5%)           ││
│ │       │ 💬 Win-back call urgente              ││
│ └─────────────────────────────────────────────────┘│
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│ 📊 KPIS SECUNDÁRIOS (6 cards menores)               │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
│ │ Burn   │ │ Runway │ │  SLA   │ │ Aceite │       │
│ │ -R$5k  │ │ 18 m   │ │  92%   │ │  87%   │       │
│ └────────┘ └────────┘ └────────┘ └────────┘       │
│ ┌────────┐ ┌────────┐                              │
│ │  CAC   │ │  LTV   │                              │
│ │ R$180  │ │ R$2.1k │                              │
│ └────────┘ └────────┘                              │
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│ 🔗 ACESSO RÁPIDO                                     │
│ [Growth] [Financeiro] [Operacional] [Qualidade]    │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Componentes
```typescript
<TorreDeControle>
  <NorthStarMetrics>
    <MetricCard 
      label="MRR" 
      value={formatCurrency(mrr)}
      change={mrrGrowth}
      status={mrrStatus}
      onClick={() => router.push('/admin/financeiro')}
    />
    {/* ... outros 3 cards */}
  </NorthStarMetrics>

  <CriticalAlerts>
    {criticalAlerts.slice(0, 5).map(alert => (
      <AlertCard
        key={alert.id}
        severity={alert.severity}
        priority={alert.priority}
        title={alert.title}
        description={alert.description}
        actions={alert.recommendedActions}
        onClick={() => router.push(`/admin/alerts/${alert.id}`)}
      />
    ))}
  </CriticalAlerts>

  <SecondaryKpis>
    {/* 6 cards menores */}
  </SecondaryKpis>

  <QuickLinks>
    {/* Botões para módulos */}
  </QuickLinks>
</TorreDeControle>
```

### API
- `GET /api/admin/torre-v2` (ou reutilizar `/api/admin/control-tower`)
- Cache: 5 minutos
- Timeout: 10s

---

## 🚀 /admin/growth (CRESCIMENTO)

**Objetivo:** Aquisição, ativação, retenção

### Layout
```
┌─────────────────────────────────────────────────────┐
│ 🚀 Crescimento - Growth Dashboard                    │
├─────────────────────────────────────────────────────┤
│                                                      │
│ KPIs PRINCIPAIS                                      │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│ │   CAC   │ │   LTV   │ │ LTV/CAC │ │ Payback │   │
│ │  R$180  │ │ R$2100  │ │   11.7  │ │  4.2m   │   │
│ │  ↓ 8%   │ │  ↑ 15%  │ │   🟢    │ │   🟢    │   │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│ 📊 FUNIL DE AQUISIÇÃO (GA4)                          │
│ ┌─────────────────────────────────────────────────┐│
│ │  Landing Views              10,000              ││
│ │    ↓ 20% ──────────────────────────────────     ││
│ │  Sign Up Started             2,000              ││
│ │    ↓ 60% ──────────────────────                 ││
│ │  Sign Up Completed           1,200              ││
│ │    ↓ 70% ────────────                           ││
│ │  Profile Started               840              ││
│ │    ↓ 80% ──────                                 ││
│ │  Profile Completed             672              ││
│ │                                                  ││
│ │  Taxa Geral: 6.7% (meta: >5%) 🟢                ││
│ └─────────────────────────────────────────────────┘│
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│ 📈 COHORT ANALYSIS (Retenção)                        │
│ ┌─────────────────────────────────────────────────┐│
│ │ Cohort │ M0  │ M1  │ M2  │ M3  │ M6  │ M12     ││
│ │────────┼─────┼─────┼─────┼─────┼─────┼──────  ││
│ │ 2024-06│ 100%│ 68% │ 52% │ 43% │ 32% │ 21%    ││
│ │ 2024-07│ 100%│ 72% │ 58% │ 47% │ 35% │ -      ││
│ │ 2024-08│ 100%│ 75% │ 61% │ 50% │ -   │ -      ││
│ │ 2024-09│ 100%│ 78% │ 64% │ -   │ -   │ -      ││
│ └─────────────────────────────────────────────────┘│
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│ 📊 GRÁFICOS                                          │
│ [Cadastros por Dia] [Taxa de Ativação] [CAC Trend] │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Componentes
- `<FunnelChart>` (Recharts Funnel)
- `<CohortTable>` (tabela + heatmap)
- `<LineChart>` (cadastros, ativação)
- `<MetricCard>` (CAC, LTV, Payback)

### API
- `GET /api/admin/growth-v2`
- Cache: 1 hora

---

## 💰 /admin/financeiro (FINANCEIRO)

**Objetivo:** Saúde financeira em tempo real

### Layout
```
┌─────────────────────────────────────────────────────┐
│ 💰 Financeiro - Receita, Churn, Runway              │
├─────────────────────────────────────────────────────┤
│                                                      │
│ RECEITA                                              │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│ │   MRR   │ │   ARR   │ │  Novo   │ │  Churn  │   │
│ │ R$120k  │ │ R$1.44M │ │ R$18k   │ │  R$7k   │   │
│ │  ↑ 12%  │ │  ↑ 12%  │ │   🟢    │ │   🔴    │   │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│ SAÚDE FINANCEIRA                                     │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐                │
│ │  Burn   │ │ Runway  │ │ MRR em  │                │
│ │  Rate   │ │         │ │  Risco  │                │
│ │ -R$5k   │ │  18m    │ │ R$12k   │                │
│ │   🟡    │ │   🟢    │ │   🔴    │                │
│ └─────────┘ └─────────┘ └─────────┘                │
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│ 📈 MRR BREAKDOWN                                     │
│ ┌─────────────────────────────────────────────────┐│
│ │  Novo MRR:        +R$18,000                     ││
│ │  Expansão MRR:     +R$5,000                     ││
│ │  Churn MRR:        -R$7,000                     ││
│ │  Contração MRR:    -R$1,000                     ││
│ │  ─────────────────────────────                  ││
│ │  MRR Líquido:     +R$15,000 (+12.5%)            ││
│ └─────────────────────────────────────────────────┘│
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│ 📊 GRÁFICOS                                          │
│ [MRR por Mês] [Churn Rate] [Burn Rate Trend]       │
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│ 💳 STRIPE DASHBOARD EMBED (se possível)              │
│ <iframe src="https://dashboard.stripe.com/...">    │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Componentes
- `<MRRBreakdown>` (componente customizado)
- `<LineChart>` (MRR, churn, burn)
- `<MetricCard>` (receita, runway)
- `<StripeEmbed>` (iframe ou link direto)

### API
- `GET /api/admin/financeiro-v3` (ou reutilizar existente)
- Cache: 1 hora
- Dados Stripe em tempo real (sem cache)

---

## ⚙️ /admin/operacional (OPERAÇÕES)

**Objetivo:** SLA, matches, disponibilidade

### Layout
```
┌─────────────────────────────────────────────────────┐
│ ⚙️ Operacional - SLA, Matches, Disponibilidade       │
├─────────────────────────────────────────────────────┤
│                                                      │
│ PERFORMANCE                                          │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│ │   SLA    │ │  Tempo   │ │   Taxa   │             │
│ │          │ │  Match   │ │  Aceite  │             │
│ │   92%    │ │   8.5h   │ │   87%    │             │
│ │   🟢     │ │   🟢     │ │   🟢     │             │
│ └──────────┘ └──────────┘ └──────────┘             │
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│ 📊 FUNIL DE CONVERSÃO                                │
│ ┌─────────────────────────────────────────────────┐│
│ │  Solicitações Criadas        320                ││
│ │    ↓ 75% ────────────────────────               ││
│ │  Matches Enviados            240                ││
│ │    ↓ 85% ─────────────────                      ││
│ │  Matches Aceitos             204                ││
│ │    ↓ 90% ──────────                             ││
│ │  Pagamento Completo          184                ││
│ │    ↓ 95% ─────                                  ││
│ │  Serviço Iniciado            175                ││
│ │                                                  ││
│ │  Taxa Geral: 54.7% 🟢                            ││
│ └─────────────────────────────────────────────────┘│
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│ 👥 DISPONIBILIDADE                                   │
│ ┌─────────────────────────────────────────────────┐│
│ │ Especialidade      │ Ativos │ Disponíveis │ SLA ││
│ │────────────────────┼────────┼─────────────┼─────││
│ │ Cuidador           │   145  │      42     │ 94% ││
│ │ Enfermeiro         │    87  │      18     │ 89% ││
│ │ Fisioterapeuta     │    52  │       8     │ 85% ││
│ │ Acompanhante       │   210  │      67     │ 96% ││
│ └─────────────────────────────────────────────────┘│
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│ 🚨 ALERTAS OPERACIONAIS                              │
│ [12 Solicitações sem Match >24h]                    │
│ [Cuidadores: Apenas 8 disponíveis (baixo)]          │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Componentes
- `<FunnelChart>` (conversão operacional)
- `<AvailabilityTable>` (profissionais por specialty)
- `<SLAGauge>` (indicador visual de SLA)
- `<TimeToMatchChart>` (distribuição)

### API
- `GET /api/admin/operacional-v2` (ou renomear operational-health)
- Cache: 15 minutos

---

## ✨ /admin/qualidade (QUALIDADE)

**Objetivo:** NPS, feedbacks, tickets

### Layout
```
┌─────────────────────────────────────────────────────┐
│ ✨ Qualidade - NPS, Feedbacks, Atendimento           │
├─────────────────────────────────────────────────────┤
│                                                      │
│ NPS                                                  │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│ │   NPS    │ │Promotores│ │Detratores│             │
│ │   Geral  │ │          │ │          │             │
│ │    68    │ │   72%    │ │   12%    │             │
│ │   🟢     │ │   🟢     │ │   🟢     │             │
│ └──────────┘ └──────────┘ └──────────┘             │
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│ 📊 NPS POR ETAPA                                     │
│ ┌─────────────────────────────────────────────────┐│
│ │ Busca/Match:       NPS 65 (🟢)                  ││
│ │ Profissional:      NPS 72 (🟢)                  ││
│ │ Atendimento:       NPS 70 (🟢)                  ││
│ │ Pós-Atendimento:   NPS 58 (🟡)                  ││
│ └─────────────────────────────────────────────────┘│
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│ 🎫 SERVICE DESK                                      │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│ │ Críticos │ │  Tempo   │ │   Taxa   │             │
│ │  >48h    │ │Resposta  │ │Resolução │             │
│ │     0    │ │   1.8h   │ │   94%    │             │
│ │   🟢     │ │   🟢     │ │   🟢     │             │
│ └──────────┘ └──────────┘ └──────────┘             │
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│ 👎 FEEDBACKS NEGATIVOS RECENTES                      │
│ ┌─────────────────────────────────────────────────┐│
│ │ ⭐⭐ | Cliente ABC | Profissional chegou 30min  ││
│ │      atrasado. Atendimento ok mas pontualidade ││
│ │      ruim. [Ver detalhes]                       ││
│ │────────────────────────────────────────────────│││
│ │ ⭐⭐⭐ | Cliente XYZ | Solicitei enfermeira mas ││
│ │      enviaram cuidadora. Confusão no cadastro. ││
│ │      [Ver detalhes]                             ││
│ └─────────────────────────────────────────────────┘│
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Componentes
- `<NPSGauge>` (indicador circular)
- `<NPSByStage>` (breakdown)
- `<FeedbackList>` (lista com filtros)
- `<TicketMetrics>` (cards)

### API
- `GET /api/admin/qualidade-v2`
- Cache: 1 hora

---

## 🎨 COMPONENTES COMPARTILHADOS

### Design System
```typescript
// Cores
const colors = {
  critical: '#DC2626', // red-600
  warning: '#F59E0B',  // amber-500
  success: '#10B981',  // green-500
  info: '#3B82F6',     // blue-500
  neutral: '#6B7280',  // gray-500
};

// Status Badges
<Badge status="success">🟢 Saudável</Badge>
<Badge status="warning">🟡 Atenção</Badge>
<Badge status="critical">🔴 Crítico</Badge>

// Metric Cards
<MetricCard
  label="MRR"
  value="R$ 120.000"
  change={12.5}
  trend="up"
  status="success"
  icon="💰"
  onClick={handleClick}
/>

// Alert Cards
<AlertCard
  severity="critical"
  priority={95}
  title="SLA Quebrado"
  description="12 solicitações sem match"
  actions={['Notificar', 'Escalar']}
/>

// Funnel Chart
<FunnelChart data={funnelData} />

// Line Chart (Recharts)
<LineChart data={timeSeriesData} />

// Cohort Table
<CohortTable cohorts={cohortData} />
```

### Layout Padrão
```typescript
<AdminLayout>
  <Header>
    <Title>Módulo</Title>
    <LastUpdated>Atualizado há 2min</LastUpdated>
    <RefreshButton onClick={refresh} />
  </Header>

  <Section title="KPIs Principais">
    <Grid cols={4}>
      {/* Metric cards */}
    </Grid>
  </Section>

  <Section title="Visualizações">
    {/* Charts */}
  </Section>

  <Section title="Detalhes">
    {/* Tables, lists */}
  </Section>
</AdminLayout>
```

---

## 📱 RESPONSIVIDADE

### Breakpoints
- Desktop: >1024px (grid 4 colunas)
- Tablet: 768-1024px (grid 2 colunas)
- Mobile: <768px (grid 1 coluna, scroll horizontal)

### Mobile First
- Cards empilhados
- Charts adaptados (altura reduzida)
- Tabelas com scroll horizontal
- Menus colapsáveis

---

## 🔗 NAVEGAÇÃO

### Header Global
```
┌────────────────────────────────────────────┐
│ 🎯 Cuide.me Admin                          │
│ [Torre] [Growth] [Financeiro] [...] [User]│
└────────────────────────────────────────────┘
```

### Sidebar (opcional)
```
🎯 Torre de Controle
🚀 Crescimento
💰 Financeiro
⚙️ Operacional
✨ Qualidade
───────────────
👥 Usuários
📊 Pipeline
🚨 Alertas
📄 Relatórios
🎧 Service Desk
```

---

## 🚀 PERFORMANCE

### Otimizações
- Server-side rendering (SSR)
- Cache de APIs (5min a 1h)
- Lazy loading de charts
- Virtualization em tabelas grandes
- Prefetch de rotas

### Loading States
```typescript
{loading ? (
  <Skeleton lines={8} />
) : (
  <Dashboard data={data} />
)}
```

---

**Status:** ✅ DEFINIDO  
**Próximo:** FASE 3 - Implementar Serviços (GA4, Stripe, Firebase)
