# 🏥 Torre de Controle - Cuide.me

[![Deploy](https://img.shields.io/badge/deploy-vercel-black)](https://cmd-painel-main-o1d4vgngc-felipe-pachecos-projects-53eb7e7c.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.7-orange)](https://firebase.google.com/)
[![Stripe](https://img.shields.io/badge/Stripe-17.5-purple)](https://stripe.com/)
[![Recharts](https://img.shields.io/badge/Recharts-2.15-green)](https://recharts.org/)

Painel administrativo executivo completo da plataforma Cuide.me com **8 módulos especializados** e integrações reais de **Firebase**, **Stripe** e **Google Analytics 4**.

## 🎯 Visão Geral

A **Torre de Controle** é o centro de comando completo do marketplace Cuide.me, oferecendo:

✅ **8 Módulos Especializados** - Home, Marketplace, Famílias, Cuidadores, Pipeline, Financeiro, Confiança, Fricção  
✅ **8 APIs Funcionais** - Dados em tempo real de Firebase + Stripe + GA4  
✅ **41 Rotas** - Build passando em produção  
✅ **100% Português** - Interface e métricas localizadas  
✅ **Arquitetura 3-Source** - Segregação clara Firebase (ops) + Stripe ($$) + GA4 (behavior)  

**Deploy em Produção:** https://cmd-painel-main-o1d4vgngc-felipe-pachecos-projects-53eb7e7c.vercel.app

## 🚀 Setup Rápido

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie `.env.local` baseado no template:

```bash
cp .env.local.template .env.local
```

**Variáveis obrigatórias:**
- `FIREBASE_ADMIN_SERVICE_ACCOUNT` (base64 do JSON) ou campos individuais
- `STRIPE_SECRET_KEY`

Veja guia completo em **[VERCEL_ENV.md](./VERCEL_ENV.md)**

### 3. Rodar em Desenvolvimento
```bash
npm run dev
```

Acesse: **http://localhost:3001/admin**

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

### 3. 👨‍👩‍👧 **Famílias** (`/admin/familias`)
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
