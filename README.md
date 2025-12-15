# 🏥 Torre de Controle - Cuide-me

Painel administrativo executivo da plataforma Cuide-me.

## 🎯 Visão Geral

A **Torre de Controle** é o centro de comando do marketplace Cuide-me, oferecendo visibilidade completa sobre operações, métricas executivas e alertas em tempo real.

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

### Home - Torre de Controle
- **6 KPIs Executivos** com status (verde/amarelo/vermelho) e trends
- **Sistema de Alertas** operacionais (pedidos sem proposta, pagamentos pendentes)
- **Navegação Modular** para Dashboard, Pipeline, Financeiro, Usuários, Qualidade, Suporte

### Módulos Disponíveis
- **Dashboard v2** - Visão geral de demanda x oferta
- **Pipeline** - Funil de contratação completo
- **Financeiro** - Receitas, pagamentos, MRR
- **Usuários** - Gestão de famílias e profissionais
- **Qualidade** - NPS, ratings, trust score
- **Service Desk** - Tickets e SLA

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

- **[ESTRUTURA_COMPLETA.md](./ESTRUTURA_COMPLETA.md)** - Overview completo do projeto
- **[VERCEL_ENV.md](./VERCEL_ENV.md)** - Guia de variáveis de ambiente
- **[TORRE_DE_CONTROLE.md](./TORRE_DE_CONTROLE.md)** - Arquitetura da Torre
- **[HOME_KPIS.md](./HOME_KPIS.md)** - Detalhamento dos 6 KPIs
- **[PIPELINE.md](./PIPELINE.md)** - Pipeline de contratação
- **[SERVICE_DESK.md](./SERVICE_DESK.md)** - Service Desk e SLA
- **[ALERTAS.md](./ALERTAS.md)** - Sistema de alertas

---

## ✅ Status: PRONTO PARA PRODUÇÃO

Torre de Controle completa e funcional! 🚀

Vercel: admin.cuide-me.com.br
