# 🏥 Torre de Controle V3.0 - Cuide.me

[![Deploy](https://img.shields.io/badge/deploy-vercel-black)](https://cmd-painel-main.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.7-orange)](https://firebase.google.com/)
[![Stripe](https://img.shields.io/badge/Stripe-17.5-purple)](https://stripe.com/)
[![GA4](https://img.shields.io/badge/GA4-5.2-yellow)](https://developers.google.com/analytics)
[![Version](https://img.shields.io/badge/version-3.0.0-success)](./CHANGELOG.md)

Painel administrativo executivo completo da plataforma Cuide.me com **6 módulos v3.0**, sistema de **design tokens**, **normalização de status**, **integrações real-time** e **analytics avançado**.

## 🎯 Visão Geral

A **Torre de Controle V3.0** é o centro de comando completo do marketplace Cuide.me, oferecendo:

### 🆕 Novos Módulos (V3.0 - Fevereiro 2026)

**🎯 Torre de Controle** - Dashboard executivo com 6 KPIs críticos (demanda, oferta, match rate, GMV, ticket médio, jobs ativos)  
**💼 Atendimentos** - Gestão completa de jobs com filtros, enriquecimento de dados e exportação CSV  
**📈 Funil de Conversão** - 7 estágios (Visitantes → GA4 → Cadastros → Famílias → Jobs → Match → Pagamentos → Concluídos)  
**🚨 Alertas** - 7 tipos de alertas críticos (jobs sem match 48h, pagamentos pendentes, tickets críticos, etc)  
**🎫 Service Desk** - Gestão de tickets com SLA tracking e priorização dinâmica  
**👥 Usuários** - Gerenciamento de famílias e profissionais com agregação de dados em tempo real  

### ⚙️ Infraestrutura V3.0

✅ **Design System Unificado** - Tokens de cores, espaçamento, tipografia e ícones padronizados  
✅ **Normalização de Status** - Jobs (5 estados) e Tickets (3 estados) com mapeamento PT/EN  
✅ **Componentes Reutilizáveis** - KpiCard, StatusBadge, AlertBanner, EmptyState  
✅ **Integrações Reais** - Firebase (7 collections), Stripe (charges), GA4 (analytics)  
✅ **Degradação Graciosa** - "Não disponível" quando dados ausentes (auditável)  
✅ **19 Rotas** - Build validado em 5.0s com TypeScript strict  
✅ **100% Real Data** - Zero dados mockados, agregação client/server otimizada  

**Deploy em Produção:** https://cmd-painel-main.vercel.app

## 📋 Documentação

- **[CHANGELOG.md](./CHANGELOG.md)** - Histórico completo de versões
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Guia de deploy (Vercel, Docker, AWS, GCP)
- **[MAPA_DE_DADOS.md](./MAPA_DE_DADOS.md)** - Auditoria de collections Firebase
- **[PAINEL_ADMIN_ARQUITETURA.md](./PAINEL_ADMIN_ARQUITETURA.md)** - Arquitetura detalhada do painel v3.0
- **[.env.example](./.env.example)** - Template de variáveis de ambiente

## 🏗️ Arquitetura V3.0

### Estrutura de Módulos

Cada módulo segue o padrão **Service → API → Page**:

```
src/
├── services/admin/          # Camada de dados (Firebase, Stripe, GA4)
│   ├── dashboard/          # Métricas, alertas, regiões
│   ├── users/              # Agregação de famílias e profissionais
│   ├── jobs/               # Atendimentos com enriquecimento
│   ├── funnel/             # Conversão em 7 estágios (GA4)
│   ├── alerts/             # 7 tipos de alertas críticos
│   └── tickets/            # Service desk com SLA
│
├── app/api/admin/          # Handlers autenticados
│   ├── users/route.ts      # GET /api/admin/users
│   ├── jobs/route.ts       # GET /api/admin/jobs
│   ├── funil/route.ts      # GET /api/admin/funil
│   ├── alertas/route.ts    # GET /api/admin/alertas
│   └── tickets/route.ts    # GET /api/admin/tickets
│
├── app/admin/              # Páginas client-side
│   ├── page.tsx            # 🎯 Torre de Controle (dashboard)
│   ├── users/page.tsx      # 👥 Usuários (familias + profissionais)
│   ├── jobs/page.tsx       # 💼 Atendimentos (com filtros)
│   ├── funil/page.tsx      # 📈 Funil de conversão
│   ├── alertas/page.tsx    # 🚨 Alertas críticos
│   └── service-desk/page.tsx # 🎫 Tickets
│
├── lib/admin/              # Utilitários
│   ├── designSystem.ts     # Tokens, cores, indicadores
│   ├── formatters.ts       # Moeda, %, datas, números
│   └── dateHelpers.ts      # Cálculos de tempo
│
└── components/admin/ui/    # Componentes reutilizáveis
    ├── KpiCard.tsx         # Cards de métricas
    ├── StatusBadge.tsx     # Status coloridos
    ├── AlertBanner.tsx     # Banners de alerta
    └── EmptyState.tsx      # Estado vazio
```

### Normalização de Status

**Jobs (5 estados):**
```typescript
pending    → Aguardando match
matched    → Profissional atribuído
active     → Em andamento
completed  → Finalizado
cancelled  → Cancelado
```

**Tickets (3 estados):**
```typescript
A_FAZER         → Novo ticket
EM_ATENDIMENTO  → Em progresso
CONCLUIDO       → Resolvido
```

### Integrações

| Fonte | Uso | Status |
|-------|-----|--------|
| **Firebase** | users, jobs, tickets, payments, ratings | ✅ Real-time |
| **Stripe** | charges, account status | ✅ Real-time |
| **GA4** | Visitantes (funil estágio 1) | ✅ Opcional |

## 🚀 Setup Rápido

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie `.env.local` baseado no template:

```bash
cp .env.example .env.local
```

**Variáveis obrigatórias:**
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`
- `FIREBASE_ADMIN_SERVICE_ACCOUNT` (base64, para GA4)
- `STRIPE_SECRET_KEY`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH`

**Variáveis opcionais (GA4):**
- `GA4_PROPERTY_ID` (para funil de conversão - estágio "Visitantes")

Veja guia completo em **[.env.example](./.env.example)**

### 3. Rodar em Desenvolvimento
```bash
npm run dev
```

Acesse: **http://localhost:3000/admin**

### 4. Build para Produção
```bash
npm run build
npm start
```

## 📊 Módulos Implementados

### 1. 🏠 **Home Dashboard** (`/admin`)
Visão executiva com 5 blocos principais:
- 📈 **Demanda** - Solicitações abertas, SLA, tempo médio de match
- 👥 **Oferta** - Profissionais disponíveis, taxa de conversão  
- ✅ **Núcleo do Negócio** - Atendimentos concluídos, índice de satisfação
- 💰 **Financeiro** - GMV, receita, ticket médio, taxa de cancelamento (Stripe)
- 🛡️ **Confiança** - Tickets de suporte, tempo de resposta, SLA
- 📊 **Gráficos Diários** - Métricas dos últimos 30 dias com Recharts

### 2. 🏪 **Marketplace** (`/admin/marketplace`)
Validação de equilíbrio entre oferta e demanda:
- Razão oferta/demanda com status (saudável/atenção/crítico)
- Qualidade do matching (score 0-100)
- Cobertura geográfica (cidades e estados)
- Balanceamento por especialidade
- Identificação de especialidades com falta de oferta

### 3. 👨‍👩‍👧 **Famílias** (`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       `)
Analytics completo do lado da demanda:
- Overview (famílias ativas, tempo resposta, satisfação)
- Jornada completa (cadastro → solicitação → match → conclusão)
- Solicitações por estado e especialidade
- Urgências (>48h sem atendimento, famílias insatisfeitas)
- Taxas de conversão entre etapas

### 4. 👩‍⚕️ **Cuidadores** (`/admin/cuidadores`)
Analytics completo do lado da oferta:
- Overview (cuidadores ativos, retenção, disponibilidade)
- Performance geral (NPS, taxa de aceite, taxa de conclusão)
- Top performers ranqueados por NPS
- Distribuição por especialidade e cidade
- Níveis de engajamento (altamente ativos, moderados, inativos)

### 5. 🔄 **Pipeline** (`/admin/pipeline`)
Funil de conversão completo:
- 4 etapas do funil visualizadas (cadastro → solicitação → match → conclusão)
- Taxas de conversão entre cada etapa
- Identificação automática de gargalos
- Ações sugeridas por gargalo com prioridade
- Previsões para próximo mês
- Taxa de conversão geral end-to-end

### 6. 💰 **Financeiro** (`/admin/financeiro`)
Análise financeira profunda (100% Stripe):
- Receita total e crescimento (tendência automática)
- Transações detalhadas (total, sucesso, falhas, métodos de pagamento)
- Assinaturas (ativas, MRR, ARR, churn rate, LTV, CAC)
- Métricas (GMV, comissão plataforma, margens bruta/líquida)
- Projeções 30 dias e 12 meses
- Formatação de moeda em Real (BRL)

### 7. 🛡️ **Confiança & Qualidade** (`/admin/confianca`)
Suporte e satisfação:
- Suporte (tickets abertos/resolvidos/pendentes/urgentes)
- Tempos médios (resposta e resolução)
- SLA de atendimento com indicador visual
- NPS detalhado (geral + promotores/neutros/detratores)
- Qualidade dos matches (score, taxa conclusão/cancelamento)
- Média de avaliações (0-5 estrelas)
- Ações recomendadas prioritizadas (crítica/alta/média)

### 8. ⚠️ **Pontos de Fricção** (`/admin/friccao`)
Identificação e priorização de problemas:
- Fricções identificadas automaticamente (abandono, erro, demora, confusão, bloqueio)
- Impacto total (usuários perdidos, receita perdida, conversão perdida)
- Gravidade automática (crítica/alta/média/baixa)
- Matriz de priorização (score, esforço, impacto, ROI)
- Recomendações detalhadas com passos de implementação
- Resultado esperado e prazo por fricção
- ROI estimado por solução

### 📈 Módulos Disponíveis
- **Dashboard V2** - Análise detalhada de oferta, demanda e financeiro com filtros
- **Pipeline** - Funil completo: solicitações → propostas → contratações
- **Financeiro** - Receitas, MRR, churn, growth rate (integração Stripe)
- **Usuários** - Gestão de famílias e profissionais (Firebase)
- **Analytics** - Tráfego, conversões, fontes (Google Analytics 4)

### 🔌 Integrações Reais

#### Firebase (Firestore)
- Agregação de usuários por role (families/professionals)
- Contagem de solicitações, propostas e contratos
- Cálculo de taxas de conversão e atividade
- Queries otimizadas com índices

#### Stripe API
- MRR (Monthly Recurring Revenue) de assinaturas ativas
- Receita total de cobranças bem-sucedidas
- Churn rate (cancelamentos últimos 30 dias)
- Contagem de assinaturas por status

#### Google Analytics 4
- Tráfego de usuários (ativos, novos, engajados)
- Métricas de conversão e eventos
- Top páginas e fontes de tráfego
- Análise de funil

📖 **Setup completo:** [INTEGRATIONS_SETUP.md](./INTEGRATIONS_SETUP.md)

## 🏗️ Estrutura

```
src/
├── app/admin/              # Páginas do painel
│   ├── page.tsx           # 🏠 Home - Torre de Controle
│   ├── dashboard/         # Dashboard v2
│   ├── pipeline/          # Pipeline
│   └── financeiro/        # Financeiro
├── app/api/admin/         # API routes protegidas
│   └── torre/             # Endpoints da Torre
├── components/admin/      # Componentes reutilizáveis
│   └── torre/             # KpiCard, AlertCard, ModuleCard
├── services/admin/        # Lógica de negócio
│   ├── overview/          # KPIs e alertas executivos
│   ├── torre/             # Módulos da Torre
│   ├── dashboard/         # Dashboard v2
│   └── pipeline/          # Pipeline
├── hooks/                 # useAdminAuth, useAdminInactivityTimeout
└── lib/                   # Utilities (Firebase Admin, Auth)
```

## 🔒 Segurança

- ✅ Autenticação Firebase obrigatória
- ✅ `requireUser()` em todas as rotas API
- ✅ Double-check de permissões no Firestore
- ✅ Rate limiting: 100 req/min por IP
- ✅ Session timeout: 5min de inatividade
- ✅ **Apenas leitura** - Nenhuma alteração de dados

## 📜 Scripts

```bash
npm run dev       # Servidor de desenvolvimento (porta 3001)
npm run build     # Build para produção
npm run start     # Servidor de produção
npm run lint      # ESLint check
```

## 📦 Deploy no Vercel

### Variáveis de Ambiente Obrigatórias:

Veja guia detalhado: **[VERCEL_ENV.md](./VERCEL_ENV.md)**

**Resumo:**
1. `FIREBASE_ADMIN_SERVICE_ACCOUNT` (base64)
2. `STRIPE_SECRET_KEY`

### Fluxo de Deploy:
1. Desenvolver em `cmd-master`
2. Criar PR para `main`
3. Merge → Deploy automático no Vercel

## 📚 Documentação

### Guias de Setup
- **[INTEGRATIONS_SETUP.md](./INTEGRATIONS_SETUP.md)** - 🔌 Setup completo das integrações (Firebase, Stripe, GA4)
- **[INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md)** - 📋 Resumo das implementações
- **[TORRE_V2_ARCHITECTURE.md](./TORRE_V2_ARCHITECTURE.md)** - 🏗️ Arquitetura e decisões técnicas
- **[GUIA_USO.md](./GUIA_USO.md)** - 📖 Guia completo de uso do painel
- **[VERCEL_ENV.md](./VERCEL_ENV.md)** - 🔐 Guia de variáveis de ambiente

### Documentação Técnica
- **[ESTRUTURA_COMPLETA.md](./ESTRUTURA_COMPLETA.md)** - Overview completo do projeto
- **[TORRE_DE_CONTROLE.md](./TORRE_DE_CONTROLE.md)** - Arquitetura da Torre
- **[HOME_KPIS.md](./HOME_KPIS.md)** - Detalhamento dos 6 KPIs
- **[PIPELINE.md](./PIPELINE.md)** - Pipeline de contratação
- **[SERVICE_DESK.md](./SERVICE_DESK.md)** - Service Desk e SLA
- **[ALERTAS.md](./ALERTAS.md)** - Sistema de alertas

## 🔍 Health Check

Endpoint para monitoramento de integrações:

```bash
GET /api/health
```

Retorna status de:
- Firebase Admin SDK
- Stripe API
- Google Analytics API

## 🎯 Performance

- ⚡ **Build Time:** ~50s
- 🚀 **First Load:** < 2s
- 📊 **API Response:** < 500ms
- 🔄 **Auto-refresh:** 30s (background)

---

## ✅ Status: PRONTO PARA PRODUÇÃO

Torre de Controle completa e funcional! 🚀

Vercel: admin.cuide-me.com.br
