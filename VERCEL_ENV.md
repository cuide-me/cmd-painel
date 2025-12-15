# ✅ Variáveis de Ambiente no Vercel

Para o painel funcionar no Vercel, configure estas variáveis:

## 🔥 Firebase Admin SDK (OBRIGATÓRIO)

### Opção 1 (RECOMENDADO): Service Account em Base64

```
FIREBASE_ADMIN_SERVICE_ACCOUNT
```

**Como obter:**
1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Vá em **Project Settings** → **Service Accounts**
3. Clique em **Generate New Private Key** (baixa um JSON)
4. Converta para base64:
   - **Linux/Mac:** `cat service-account.json | base64 -w 0`
   - **Windows PowerShell:** `[Convert]::ToBase64String([IO.File]::ReadAllBytes("service-account.json"))`
5. Cole o resultado completo na variável `FIREBASE_ADMIN_SERVICE_ACCOUNT` no Vercel

### Opção 2 (Alternativa): Campos Individuais

```
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
```

**Como obter:**
- Abra o JSON da service account
- `project_id` → `FIREBASE_PROJECT_ID`
- `client_email` → `FIREBASE_CLIENT_EMAIL`
- `private_key` → `FIREBASE_PRIVATE_KEY` (mantenha os `\n` literais)

⚠️ **IMPORTANTE:** Se usar `FIREBASE_PRIVATE_KEY`, certifique-se de que:
- Está entre aspas no Vercel: `"-----BEGIN PRIVATE KEY-----\n..."`
- Contém `\n` literais (não quebras de linha reais)
- Não foi truncado ao copiar/colar

---

## 💳 Stripe (OBRIGATÓRIO)

```
STRIPE_SECRET_KEY
```

**Como obter:**
1. Acesse [Stripe Dashboard](https://dashboard.stripe.com/)
2. Vá em **Developers** → **API Keys**
3. Copie a **Secret Key** (começa com `sk_test_` ou `sk_live_`)

---

## 📊 Firebase Client (OPCIONAL)

Apenas necessário se houver autenticação no frontend:

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

**Como obter:**
1. Firebase Console → **Project Settings** → **General**
2. Role até **Your apps** → escolha/adicione Web app
3. Copie cada campo do objeto `firebaseConfig`

---

## 📈 Google Analytics 4 (OPCIONAL)

```
GA4_PROPERTY_ID
```

Apenas se quiser integrar métricas do Google Analytics.

---

## 🚦 Rate Limiting (OPCIONAL)

```
RATE_LIMIT_MAX=5
RATE_LIMIT_WINDOW_MS=60000
```

Padrão: 5 requisições a cada 60 segundos por IP.

---

## 🌐 URLs (OPCIONAL)

```
NEXT_PUBLIC_APP_URL=https://seu-dominio.vercel.app
NEXT_PUBLIC_API_URL=https://seu-dominio.vercel.app
```

O Vercel injeta automaticamente `VERCEL_URL`, mas você pode sobrescrever se necessário.

---

## ✅ Checklist de Deploy

- [ ] `FIREBASE_ADMIN_SERVICE_ACCOUNT` (base64 do JSON) **OU** os 3 campos individuais
- [ ] `STRIPE_SECRET_KEY` (começa com `sk_`)
- [ ] Commit e push para `cmd-master` ou `main`
- [ ] Vercel detecta automaticamente e faz build
- [ ] Teste com `https://seu-dominio.vercel.app/admin`

---

## 🔍 Debug de Erros Comuns

### "Failed to initialize Firebase Admin SDK"
- Verifique se `FIREBASE_ADMIN_SERVICE_ACCOUNT` está completo (base64 grande)
- Ou se os 3 campos individuais estão todos preenchidos
- Certifique-se de que `FIREBASE_PRIVATE_KEY` contém `\n` literais

### "Stripe error: Invalid API Key"
- Confirme que `STRIPE_SECRET_KEY` começa com `sk_test_` ou `sk_live_`
- Verifique se não há espaços em branco no início/fim

### "Cannot read property X of undefined"
- Alguma variável obrigatória está faltando
- Rode `vercel env pull` localmente para testar

---

## 📦 Como Adicionar no Vercel

1. Acesse o projeto no [Vercel Dashboard](https://vercel.com/dashboard)
2. Vá em **Settings** → **Environment Variables**
3. Adicione cada variável acima
4. Escolha o ambiente: **Production**, **Preview**, e/ou **Development**
5. Clique em **Save**
6. Faça um novo deploy (commit + push ou manualmente no Vercel)

---

## 🚀 Pronto!

Com essas variáveis configuradas, o painel deve funcionar completamente no Vercel.
