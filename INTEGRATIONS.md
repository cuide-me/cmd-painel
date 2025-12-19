# 🔌 Integrations Guide - Torre v2

Guia completo de configuração de todas as integrações externas.

---

## 📋 Índice

1. [Firebase (OBRIGATÓRIO)](#firebase)
2. [Google Analytics 4 (OPCIONAL)](#google-analytics-4)
3. [Stripe (OPCIONAL)](#stripe)
4. [Troubleshooting](#troubleshooting)

---

## 🔥 Firebase

**Status:** OBRIGATÓRIO  
**Usado em:** Todas as métricas (users, professionals, jobs)  
**Custo:** Gratuito até 50k reads/dia

### Setup

#### 1. Criar Projeto Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Click em "Add project"
3. Nome do projeto: `cuide-me-painel` (ou seu nome)
4. Desabilitar Google Analytics (opcional nesta etapa)
5. Criar projeto

#### 2. Habilitar Firestore

1. No menu lateral: **Build** → **Firestore Database**
2. Click "Create database"
3. Modo: **Production mode** (ou Test mode para desenvolvimento)
4. Localização: `southamerica-east1` (São Paulo)
5. Click "Enable"

#### 3. Gerar Service Account Key

1. No menu lateral: **⚙️ Project Settings**
2. Aba **Service Accounts**
3. Click "Generate new private key"
4. Confirmar e baixar arquivo JSON

#### 4. Configurar Environment Variables

**Opção 1: Service Account Completo (Recomendado para Vercel)**

```bash
# Converta o JSON para Base64
cat service-account.json | base64 -w 0 > firebase-admin-b64.txt

# No .env.local:
FIREBASE_ADMIN_SERVICE_ACCOUNT=<conteúdo do arquivo base64>
```

**Opção 2: Variáveis Separadas**

Do arquivo JSON baixado, extrair:

```bash
# .env.local
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQI...\n-----END PRIVATE KEY-----\n"
```

**⚠️ IMPORTANTE:** A chave privada deve ter `\n` literais, não quebras de linha reais.

#### 5. Configurar Client SDK (Frontend)

1. No Firebase Console: **⚙️ Project Settings**
2. Scroll até "Your apps"
3. Click no ícone **</>** (Web)
4. Registrar app: `Torre v2 Dashboard`
5. Copiar configuração:

```bash
# .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

#### 6. Verificar Conexão

```bash
# Testar health check
curl http://localhost:3000/api/health/integrations | jq '.integrations.firebase'

# Deve retornar:
{
  "status": "healthy",
  "latency": 45,
  "configured": true,
  "enabled": true
}
```

### Estrutura de Dados Esperada

```
firestore/
├── users/                    # Usuários (clientes + profissionais)
│   ├── {userId}/
│   │   ├── email
│   │   ├── role: "client" | "professional"
│   │   ├── createdAt
│   │   └── lastActive
│
├── professionals/            # Dados de profissionais
│   ├── {professionalId}/
│   │   ├── specialty
│   │   ├── active: boolean
│   │   └── rating
│
├── jobs/                     # Atendimentos/jobs
│   ├── {jobId}/
│   │   ├── clientId
│   │   ├── professionalId
│   │   ├── specialty
│   │   ├── status: "pending" | "matched" | "completed"
│   │   ├── createdAt
│   │   └── completedAt
│
└── feedback/                 # Avaliações NPS
    ├── {feedbackId}/
        ├── userId
        ├── score: 0-10
        ├── comment
        └── createdAt
```

### Permissões Necessárias

Service Account precisa das roles:
- `Cloud Datastore User` - Read/write Firestore
- `Firebase Admin` - Admin SDK access

---

## 📊 Google Analytics 4

**Status:** OPCIONAL  
**Usado em:** Growth metrics (acquisition funnel, user behavior)  
**Custo:** Gratuito até 10M events/mês

### Setup

#### 1. Criar Propriedade GA4

1. Acesse [Google Analytics](https://analytics.google.com)
2. Admin → Create Property
3. Nome: `Cuide-me - Painel Torre`
4. Time zone: `Brazil - São Paulo`
5. Currency: `BRL`
6. Next → Create

#### 2. Obter Measurement ID

1. Admin → Data Streams
2. Click "Add stream" → Web
3. Website URL: `your-app.vercel.app`
4. Stream name: `Torre v2`
5. Create stream
6. Copiar **Measurement ID** (formato: `G-XXXXXXXXXX`)

```bash
# .env.local
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

#### 3. Habilitar Data API

1. No Admin: **Property Settings**
2. Click "Data API"
3. Enable "Google Analytics Data API"

#### 4. Obter Property ID

1. Admin → Property Settings
2. Property ID está no formato: `properties/123456789`

```bash
# .env.local
GA4_PROPERTY_ID=properties/123456789
```

#### 5. Criar Service Account

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Selecione projeto Firebase/GA4
3. IAM & Admin → Service Accounts
4. Create Service Account:
   - Name: `ga4-readonly`
   - Role: `Viewer`
5. Create key → JSON

#### 6. Dar Permissão ao Service Account

1. Volte ao GA4 Admin
2. Property Access Management
3. Click "+" (Add users)
4. Email: `ga4-readonly@your-project.iam.gserviceaccount.com`
5. Role: **Viewer**
6. Add

#### 7. Configurar Credentials

```bash
# Converter JSON para Base64
cat ga4-service-account.json | base64 -w 0 > ga4-credentials-b64.txt

# .env.local
GOOGLE_APPLICATION_CREDENTIALS_B64=<conteúdo do arquivo base64>
```

#### 8. Verificar Conexão

```bash
curl http://localhost:3000/api/health/integrations | jq '.integrations.ga4'

# Deve retornar:
{
  "status": "healthy",
  "latency": 120,
  "configured": true,
  "enabled": true
}
```

### Events Trackeados

**Acquisition Funnel:**
- `page_view` - Visita ao site
- `sign_up` - Cadastro iniciado
- `sign_up_complete` - Cadastro completo
- `profile_complete` - Perfil completado

**Conversion Funnel:**
- `begin_checkout` - Iniciar solicitação
- `add_payment_info` - Adicionar pagamento
- `purchase` - Compra concluída

**Engagement:**
- `session_start` - Início de sessão
- `user_engagement` - Interação ativa

---

## 💳 Stripe

**Status:** OPCIONAL  
**Usado em:** Financial metrics (MRR, transactions, churn)  
**Custo:** 2.99% + R$0.39 por transação (sem custo para leitura de dados)

### Setup

#### 1. Criar Conta Stripe

1. Acesse [Stripe Dashboard](https://dashboard.stripe.com)
2. Sign up / Login
3. Complete verification (necessário para produção)

#### 2. Obter API Keys

1. Developers → API keys
2. Copiar:
   - **Publishable key** (começa com `pk_`)
   - **Secret key** (começa com `sk_`)

```bash
# .env.local
# Test keys (para desenvolvimento)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Production keys (para produção - mudar depois)
# STRIPE_SECRET_KEY=sk_live_...
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

#### 3. Configurar Webhooks (Opcional)

1. Developers → Webhooks
2. Add endpoint
3. Endpoint URL: `https://your-app.vercel.app/api/webhooks/stripe`
4. Events to send:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Add endpoint
6. Copiar **Signing secret**

```bash
# .env.local
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_WEBHOOKS_ENABLED=true
```

#### 4. Estrutura de Dados Esperada

**Customers:**
- Metadata deve conter: `firebaseUid` (link com Firebase)

**Subscriptions:**
- Products com metadata: `plan_type`, `specialty`

**Invoices:**
- Linked to subscriptions

#### 5. Verificar Conexão

```bash
curl http://localhost:3000/api/health/integrations | jq '.integrations.stripe'

# Deve retornar:
{
  "status": "healthy",
  "latency": 89,
  "configured": true,
  "enabled": true,
  "webhooks": true
}
```

### Produtos Recomendados

Criar products no Stripe para cada serviço:

```bash
# Exemplo de produtos
- Psicologia Individual (R$ 180/sessão)
- Terapia Ocupacional (R$ 150/sessão)
- Fonoaudiologia (R$ 140/sessão)
- Plano Mensal (R$ 600/mês)
```

---

## 🔧 Troubleshooting

### Firebase

**Erro: "Firebase Admin not initialized"**
```bash
# Verificar se variáveis estão definidas
echo $FIREBASE_PROJECT_ID
echo $FIREBASE_CLIENT_EMAIL

# Verificar sintaxe da private key
# Deve ter \n literais, não quebras de linha
```

**Erro: "Permission denied"**
- Verificar se service account tem role `Cloud Datastore User`
- Verificar se Firestore está habilitado
- Verificar regras do Firestore

**Erro: "Invalid credentials"**
- Regenerar service account key
- Verificar se JSON está completo
- Testar com base64 encoding

### Google Analytics 4

**Erro: "GA4 not configured"**
```bash
# Verificar ambas variáveis
echo $NEXT_PUBLIC_GA4_MEASUREMENT_ID  # G-XXXXXXXXXX
echo $GA4_PROPERTY_ID                  # properties/123456789
```

**Erro: "Access denied"**
- Verificar se service account tem permissão Viewer no GA4
- Verificar se Data API está habilitada
- Aguardar até 24h para propagação de permissões

**Erro: "No data available"**
- GA4 precisa de 24-48h para começar a coletar dados
- Verificar se tracking está instalado no site
- Usar DebugView para testar eventos em tempo real

### Stripe

**Erro: "Invalid API key"**
- Verificar se está usando test key em dev, live key em prod
- Regenerar API keys se necessário
- Não confundir publishable com secret key

**Erro: "Webhook signature invalid"**
- Verificar se webhook secret está correto
- Verificar se endpoint está público (não requer auth)
- Testar webhook no Stripe Dashboard

**Erro: "No data found"**
- Criar alguns customers/subscriptions de teste
- Aguardar até 1h para índices atualizarem
- Verificar filtros de data nas queries

---

## ✅ Checklist de Configuração

### Mínimo (Firebase only)
- [ ] Projeto Firebase criado
- [ ] Firestore habilitado
- [ ] Service account configurado
- [ ] Env vars configuradas
- [ ] Health check retorna "healthy"
- [ ] Torre v2 carrega sem erros

### Completo (All integrations)
- [ ] Firebase configurado ✅
- [ ] GA4 configurado
- [ ] Stripe configurado
- [ ] Webhooks configurados (opcional)
- [ ] Feature flags ajustados
- [ ] Health checks todos "healthy"
- [ ] Dados reais aparecendo no dashboard

---

## 📚 Recursos

**Firebase:**
- [Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

**Google Analytics 4:**
- [Data API Overview](https://developers.google.com/analytics/devguides/reporting/data/v1)
- [Event Reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/events)
- [DebugView](https://support.google.com/analytics/answer/7201382)

**Stripe:**
- [API Documentation](https://stripe.com/docs/api)
- [Testing Guide](https://stripe.com/docs/testing)
- [Webhooks](https://stripe.com/docs/webhooks)

---

## 🆘 Support

**Problemas de configuração?**
1. Verifique health check: `/api/health/integrations`
2. Consulte logs: `LOG_LEVEL=debug npm run dev`
3. Teste com curl/Postman
4. Abra issue no GitHub com logs (sem credentials!)
