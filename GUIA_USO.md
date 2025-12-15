# 🎯 Guia de Uso - Torre de Controle V2

## 📊 Visão Geral

A Torre de Controle V2 é um dashboard executivo que agrega métricas de **Firebase**, **Stripe** e **Google Analytics** para fornecer uma visão 360° da plataforma Cuide-me.

---

## 🚀 Acesso Rápido

### Ambiente de Produção
- **URL:** https://cmd-painel.vercel.app/admin
- **Login:** Use suas credenciais de administrador do Firebase

### Ambiente Local
```bash
npm install
npm run dev
```
- **URL:** http://localhost:3001/admin

---

## 📈 Páginas Disponíveis

### 🏠 Home (`/admin`)
**Objetivo:** Visão executiva em 30 segundos

**KPIs Principais:**
- 💰 **MRR (Monthly Recurring Revenue)** - Receita recorrente mensal do Stripe
- 👥 **Famílias Ativas** - Usuários tipo "family" no Firestore
- 🏥 **Profissionais Ativos** - Usuários tipo "professional" no Firestore
- 🔄 **Taxa de Conversão** - Conversão de propostas em contratações
- 📊 **Tráfego Mensal** - Visitantes únicos do Google Analytics
- 💼 **Pipeline Aberto** - Solicitações aguardando resposta

**Seções:**
- **Hero KPIs** - 6 métricas críticas com status e tendência
- **Alertas** - Problemas que requerem atenção imediata
- **Módulos** - Acesso rápido aos painéis detalhados

---

### 📊 Dashboard V2 (`/admin/dashboard`)
**Objetivo:** Análise detalhada de oferta, demanda e financeiro

**Blocos:**

#### 1️⃣ Profissionais (Oferta)
- Total de profissionais cadastrados
- Ativos vs Inativos
- Especialidades mais populares
- Taxa de resposta a solicitações
- Tempo médio de primeira resposta

#### 2️⃣ Famílias (Demanda)
- Total de famílias cadastradas
- Ativas vs Inativas
- Famílias com solicitações ativas
- Retenção mensal
- Necessidades mais buscadas

#### 3️⃣ Financeiro
- Receita mensal (MRR)
- Tickets médios
- Churn rate
- Assinaturas ativas
- Previsão de receita

**Filtros Disponíveis:**
- 📅 **Período:** 7d, 30d, 90d, 12m, custom
- 🎯 **Segmento:** Todos, Famílias, Profissionais
- 📍 **Região:** Todas, SP, RJ, etc.

---

### 💰 Financeiro (`/admin/financeiro`)
**Objetivo:** Análise profunda de receita e pagamentos

**Métricas:**
- 💵 **MRR Evolution** - Evolução da receita recorrente
- 📈 **Growth Rate** - Taxa de crescimento mensal
- 💳 **Payment Success Rate** - Taxa de sucesso de cobranças
- 🔄 **Churn Analysis** - Análise de cancelamentos
- 💰 **ARPU** - Average Revenue Per User

**Integrações:**
- Stripe API (pagamentos reais)
- Firebase (dados de usuários)
- Cruzamento de dados para análise de cohort

---

### 🔄 Pipeline (`/admin/pipeline`)
**Objetivo:** Acompanhar o funil de conversão

**Estágios:**
1. 📝 **Solicitações** - Famílias buscando profissionais
2. 💬 **Propostas** - Profissionais que responderam
3. ✅ **Contratações** - Matches confirmados
4. ⭐ **Avaliações** - Serviços concluídos e avaliados

**Métricas por Estágio:**
- Volume atual
- Taxa de conversão
- Tempo médio de permanência
- Dropoff reasons

**Visualizações:**
- Funil de conversão
- Evolução temporal
- Segmentação por especialidade

---

### 👥 Usuários (`/admin/users`)
**Objetivo:** Gestão e análise de base de usuários

**Funcionalidades:**
- Lista completa de usuários
- Filtros por tipo (family/professional)
- Busca por nome, email, CPF
- Status de conta (ativo, suspenso, banido)
- Ações administrativas

**Dados Exibidos:**
- Info pessoal (nome, email, telefone)
- Data de cadastro
- Último acesso
- Atividade (solicitações, propostas, contratos)
- Status de verificação

---

## 🔧 Configuração de Variáveis

### Variáveis Obrigatórias (Vercel)

```bash
# Firebase Admin (Server-side)
FIREBASE_ADMIN_SERVICE_ACCOUNT={"type":"service_account",...}

# Firebase Client (Frontend)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=projeto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Google Analytics 4
GA4_PROPERTY_ID=503083965
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}
```

### Configuração no Vercel

1. Acesse: https://vercel.com/cuide-me/cmd-painel/settings/environment-variables
2. Adicione cada variável
3. Marque para: **Production**, **Preview**, **Development**
4. Salve e faça redeploy

---

## 📊 Estrutura de Dados

### Firebase Collections

```typescript
// users/
{
  uid: string
  email: string
  displayName: string
  role: 'family' | 'professional'
  createdAt: Timestamp
  isActive: boolean
  // ... outros campos
}

// requests/
{
  id: string
  familyId: string
  status: 'pending' | 'matched' | 'completed'
  specialty: string
  createdAt: Timestamp
  // ... outros campos
}

// proposals/
{
  id: string
  requestId: string
  professionalId: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: Timestamp
  // ... outros campos
}

// contracts/
{
  id: string
  requestId: string
  proposalId: string
  professionalId: string
  familyId: string
  status: 'active' | 'completed' | 'cancelled'
  startDate: Timestamp
  // ... outros campos
}
```

### Stripe Objects

```typescript
// Subscriptions
{
  id: string
  customer: string
  status: 'active' | 'canceled' | 'past_due'
  current_period_end: timestamp
  plan: {
    amount: number
    interval: 'month' | 'year'
  }
}

// Charges
{
  id: string
  amount: number
  status: 'succeeded' | 'failed' | 'pending'
  created: timestamp
  customer: string
}
```

---

## 🎨 Design System

### Status Colors

```typescript
// KPI Status
healthy: '#10b981'  // Green - Tudo OK
warning: '#f59e0b'  // Amber - Atenção necessária
critical: '#ef4444' // Red - Ação urgente

// Trend Indicators
up: '#10b981'       // Green - Crescimento
down: '#ef4444'     // Red - Queda
stable: '#6b7280'   // Gray - Estável
```

### Alert Severity

```typescript
low: 'bg-blue-50 text-blue-700 border-blue-200'
medium: 'bg-yellow-50 text-yellow-700 border-yellow-200'
high: 'bg-orange-50 text-orange-700 border-orange-200'
critical: 'bg-red-50 text-red-700 border-red-200'
```

---

## 🔍 Troubleshooting

### Erro: "Cannot read properties of undefined"

**Causa:** Variáveis de ambiente não configuradas

**Solução:**
1. Verifique `.env.local` localmente
2. Confirme variáveis no Vercel
3. Faça redeploy após adicionar variáveis

---

### Dashboard mostra zeros em todas métricas

**Causa:** Credenciais inválidas ou permissões insuficientes

**Solução Firebase:**
1. Verifique se service account tem permissão "Cloud Datastore User"
2. Confirme que collections existem no Firestore

**Solução Stripe:**
1. Verifique se `STRIPE_SECRET_KEY` é válida
2. Teste com `sk_test_` primeiro
3. Confirme que há dados (subscriptions, charges)

**Solução Google Analytics:**
1. Verifique `GA4_PROPERTY_ID` (formato: `properties/123456789`)
2. Confirme que service account foi adicionado ao GA4 como "Viewer"
3. Teste a API no console do Google Cloud

---

### Build Error: "Cannot find module"

**Causa:** Dependências não instaladas

**Solução:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📚 Documentação Completa

- [**INTEGRATIONS_SETUP.md**](./INTEGRATIONS_SETUP.md) - Setup completo das integrações
- [**INTEGRATION_SUMMARY.md**](./INTEGRATION_SUMMARY.md) - Resumo das implementações
- [**TORRE_V2_ARCHITECTURE.md**](./TORRE_V2_ARCHITECTURE.md) - Arquitetura e decisões técnicas

---

## 🎯 Métricas de Sucesso

### Performance Goals
- ✅ **Load Time:** < 2s (First Contentful Paint)
- ✅ **Data Refresh:** < 500ms (API responses)
- ✅ **Build Time:** < 60s

### User Experience Goals
- ✅ **Decision Time:** < 30s para entender status da plataforma
- ✅ **Click Depth:** Máximo 2 cliques para qualquer métrica
- ✅ **Mobile Responsive:** Totalmente responsivo

---

## 🚀 Roadmap

### ✅ Concluído
- [x] Integração Firebase (Firestore aggregation)
- [x] Integração Stripe (financial metrics)
- [x] Integração Google Analytics 4
- [x] Dashboard V2 com filtros
- [x] Pipeline visualization
- [x] User management

### 🔄 Em Desenvolvimento
- [ ] Exportação de relatórios (PDF/Excel)
- [ ] Alertas automáticos (email/Slack)
- [ ] Análise de cohort
- [ ] Previsão de receita com ML

### 📋 Backlog
- [ ] Integração com CRM
- [ ] Dashboards customizáveis
- [ ] API pública para parceiros
- [ ] Mobile app

---

## 🤝 Suporte

Para dúvidas ou problemas:
1. Consulte a documentação técnica
2. Verifique os logs no Vercel
3. Entre em contato com o time de desenvolvimento

---

**Versão:** 2.0.0  
**Última Atualização:** Dezembro 2025  
**Autor:** Cuide-me Tech Team
