# 🔐 Guia de Configuração de Integrações

## 📋 Visão Geral

Este documento detalha como configurar as integrações com **Firebase**, **Stripe** e **Google Analytics** para a Torre de Controle.

---

## 🔥 Firebase Admin SDK

### Variáveis de Ambiente

**Opção 1: Service Account Base64 (Recomendado para Vercel)**

```bash
FIREBASE_ADMIN_SERVICE_ACCOUNT=<base64_encoded_json>
```

Para gerar o base64:
```bash
# Linux/Mac
base64 -i serviceAccountKey.json

# Windows PowerShell
[Convert]::ToBase64String([System.IO.File]::ReadAllBytes("serviceAccountKey.json"))
```

**Opção 2: Credenciais Separadas**

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourPrivateKeyHere\n-----END PRIVATE KEY-----"
```

### Como Obter as Credenciais

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Vá em **Project Settings** → **Service Accounts**
4. Clique em **Generate New Private Key**
5. Salve o arquivo JSON
6. Converta para base64 ou extraia os campos

### Coleções Necessárias no Firestore

```
users/
├── role: "family" | "professional" | "admin"
├── profileComplete: boolean
├── createdAt: timestamp
└── ...

requests/
├── userId: string (family ID)
├── status: "open" | "pending" | "closed"
├── createdAt: timestamp
└── ...

proposals/
├── requestId: string
├── professionalId: string
├── status: "pending" | "accepted" | "rejected"
├── createdAt: timestamp
└── ...

contracts/
├── requestId: string
├── professionalId: string
├── familyId: string
├── createdAt: timestamp
└── ...
```

---

## 💳 Stripe

### Variáveis de Ambiente

```bash
STRIPE_SECRET_KEY=sk_test_xxxxx  # ou sk_live_xxxxx para produção
```

### Como Obter a Secret Key

1. Acesse o [Stripe Dashboard](https://dashboard.stripe.com/)
2. Vá em **Developers** → **API Keys**
3. Copie a **Secret Key** (começa com `sk_test_` ou `sk_live_`)
4. **NUNCA** commite essa chave no git

### O que a Integração Faz

- **MRR (Monthly Recurring Revenue)**: Soma de todas subscriptions ativas convertidas para valor mensal
- **Total Revenue**: Soma de todos charges com status `succeeded`
- **Active Subscriptions**: Contagem de subscriptions com status `active`
- **Churn Rate**: Percentual de cancelamentos nos últimos 30 dias

### Estrutura Esperada no Stripe

```
Subscriptions:
├── status: "active" | "canceled" | "past_due"
├── items.data[].price.unit_amount: number (em centavos)
├── items.data[].price.recurring.interval: "month" | "year"
└── canceled_at: timestamp (se cancelado)

Charges:
├── status: "succeeded" | "failed"
├── amount: number (em centavos)
└── created: timestamp
```

---

## 📊 Google Analytics 4 (GA4)

### Variáveis de Ambiente

```bash
GOOGLE_ANALYTICS_PROPERTY_ID=properties/123456789
GOOGLE_ANALYTICS_CREDENTIALS=<base64_encoded_json>
```

**Alternativa:** Usar `GOOGLE_APPLICATION_CREDENTIALS` apontando para o arquivo JSON

### Como Obter as Credenciais

#### 1. Criar Service Account no Google Cloud

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Selecione o projeto vinculado ao GA4
3. Vá em **IAM & Admin** → **Service Accounts**
4. Clique em **Create Service Account**
5. Nome: `analytics-reader` (ou qualquer nome)
6. Clique em **Create and Continue**
7. Adicione o papel: **Viewer** (ou **Analytics Viewer**)
8. Clique em **Done**
9. Clique na service account criada
10. Vá em **Keys** → **Add Key** → **Create New Key**
11. Escolha **JSON** e clique em **Create**
12. Salve o arquivo JSON
13. Converta para base64:
    ```bash
    # PowerShell
    [Convert]::ToBase64String([System.IO.File]::ReadAllBytes("service-account.json"))
    ```

#### 2. Obter o Property ID do GA4

1. Acesse o [Google Analytics](https://analytics.google.com/)
2. Selecione a propriedade GA4
3. Vá em **Admin** → **Property Settings**
4. Copie o **Property ID** (número de 9 dígitos)
5. O formato final é: `properties/123456789`

#### 3. Adicionar Service Account ao GA4

1. No Google Analytics, vá em **Admin** → **Property Access Management**
2. Clique em **+** (Add Users)
3. Cole o email da service account (formato: `xxxxx@project-id.iam.gserviceaccount.com`)
4. Selecione o papel: **Viewer**
5. Clique em **Add**

### Eventos Personalizados Rastreados

A Torre de Controle busca estes eventos GA4:

```javascript
// Cadastro de usuário
gtag('event', 'sign_up', {
  method: 'email'
});

// Criação de request
gtag('event', 'create_request', {
  category: 'engagement'
});

// Contratação de cuidador
gtag('event', 'hire_caregiver', {
  category: 'conversion'
});
```

### Implementação no Frontend

Adicione o GA4 no `app/layout.tsx`:

```tsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html>
      <head>
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### Métricas Disponíveis

A API `/api/admin/analytics` retorna:

```typescript
{
  traffic: {
    totalUsers: number;        // Total de usuários
    newUsers: number;          // Novos usuários
    sessions: number;          // Sessões
    pageViews: number;         // Visualizações de página
    avgSessionDuration: number; // Duração média (segundos)
    bounceRate: number;        // Taxa de rejeição (%)
  },
  conversions: {
    total: number;    // Total de conversões
    rate: number;     // Taxa de conversão (%)
  },
  customConversions: {
    signups: { count, users, rate },
    requests: { count, users, rate },
    hires: { count, users, rate },
  },
  topPages: Array<{ path, views, uniqueUsers }>,
  trafficSources: Array<{ source, medium, users, sessions }>
}
```

---

## 🚀 Configuração no Vercel

### 1. Adicionar Environment Variables

1. Acesse o [Vercel Dashboard](https://vercel.com/)
2. Selecione o projeto
3. Vá em **Settings** → **Environment Variables**
4. Adicione cada variável:

```bash
# Firebase
FIREBASE_ADMIN_SERVICE_ACCOUNT=<base64_do_json>

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxx

# Google Analytics
GOOGLE_ANALYTICS_PROPERTY_ID=properties/123456789
GOOGLE_ANALYTICS_CREDENTIALS=<base64_do_json>

# GA4 Frontend (público)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

5. Selecione os ambientes: **Production**, **Preview**, **Development**
6. Clique em **Save**

### 2. Redeploy

Após adicionar as variáveis, faça um novo deploy:

```bash
git commit --allow-empty -m "chore: trigger redeploy with new env vars"
git push origin main
```

---

## 🧪 Testando Localmente

### 1. Criar arquivo `.env.local`

```bash
# .env.local (NUNCA COMMITAR)

# Firebase
FIREBASE_ADMIN_SERVICE_ACCOUNT=eyJ0eXBlIjoic2Vydmlj...
# ou
FIREBASE_PROJECT_ID=your-project
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx

# Google Analytics
GOOGLE_ANALYTICS_PROPERTY_ID=properties/123456789
GOOGLE_ANALYTICS_CREDENTIALS=eyJ0eXBlIjoic2Vydmlj...

# GA4 Frontend
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 2. Rodar o servidor

```bash
npm run dev
```

### 3. Testar endpoints

```bash
# Torre de Controle Overview (Firebase + Stripe)
curl http://localhost:3000/api/admin/torre/overview

# Google Analytics
curl http://localhost:3000/api/admin/analytics

# Com parâmetros personalizados
curl "http://localhost:3000/api/admin/analytics?startDate=7daysAgo&endDate=today"
```

---

## ⚠️ Troubleshooting

### Firebase: "SDK não inicializado"

**Causa:** Credenciais inválidas ou ausentes

**Solução:**
1. Verifique se `FIREBASE_ADMIN_SERVICE_ACCOUNT` está configurado
2. Valide o base64: `echo $FIREBASE_ADMIN_SERVICE_ACCOUNT | base64 -d | jq`
3. Verifique os logs: procure por `[Firebase Admin]` no console

### Stripe: "STRIPE_SECRET_KEY não configurado"

**Causa:** Variável de ambiente ausente

**Solução:**
1. Adicione `STRIPE_SECRET_KEY` no `.env.local` ou Vercel
2. Use `sk_test_` para testes, `sk_live_` para produção
3. Verifique se não há espaços extras na chave

### Google Analytics: "Property not found"

**Causa:** Property ID inválido ou service account sem acesso

**Solução:**
1. Verifique o formato: `properties/123456789`
2. Confirme que a service account foi adicionada ao GA4 com permissão **Viewer**
3. Aguarde até 24h para propagação de permissões (normalmente é instantâneo)

### Erro: "Module not found: @google-analytics/data"

**Causa:** Pacote não instalado

**Solução:**
```bash
npm install @google-analytics/data
```

---

## 📚 Referências

- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Stripe API](https://stripe.com/docs/api)
- [Google Analytics Data API](https://developers.google.com/analytics/devguides/reporting/data/v1)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)

---

## 🔒 Segurança

### ✅ Boas Práticas

1. **NUNCA** commite credenciais no git
2. Use `.env.local` para desenvolvimento (já está no `.gitignore`)
3. Rotacione as chaves regularmente (a cada 90 dias)
4. Use secret keys de teste (`sk_test_`) em desenvolvimento
5. Limite permissões das service accounts (princípio do menor privilégio)
6. Monitore logs de acesso no Firebase Console e Stripe Dashboard

### ❌ Não Fazer

- ❌ Expor `STRIPE_SECRET_KEY` no frontend
- ❌ Commitar arquivos `.json` de credenciais
- ❌ Usar credenciais de produção em desenvolvimento
- ❌ Compartilhar chaves por email ou chat
- ❌ Deixar variáveis hardcoded no código

---

**Versão:** 1.0.0  
**Última Atualização:** 2025-12-15
