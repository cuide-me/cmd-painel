# 🏥 Torre de Controle V2 - Cuide-me

[![Deploy](https://img.shields.io/badge/deploy-vercel-black)](https://cmd-painel.vercel.app/admin)
[![Next.js](https://img.shields.io/badge/Next.js-16.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.7-orange)](https://firebase.google.com/)
[![Stripe](https://img.shields.io/badge/Stripe-17.5-purple)](https://stripe.com/)

Painel administrativo executivo da plataforma Cuide-me com integrações reais de **Firebase**, **Stripe** e **Google Analytics 4**.

## 🎯 Visão Geral

A **Torre de Controle V2** é o centro de comando do marketplace Cuide-me, oferecendo visibilidade completa sobre operações, métricas executivas e alertas em tempo real através de dados agregados de múltiplas fontes.

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

## 📊 Funcionalidades

### 🏠 Home - Torre de Controle
- **6 KPIs Executivos** com status (verde/amarelo/vermelho) e trends
  - 💰 MRR (Stripe) | 👥 Famílias Ativas (Firebase) | 🏥 Profissionais Ativos (Firebase)
  - 🔄 Taxa Conversão (Firebase) | 📊 Tráfego (GA4) | 💼 Pipeline Aberto (Firebase)
- **Sistema de Alertas** operacionais em tempo real
- **Navegação Modular** para todos os painéis especializados

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
