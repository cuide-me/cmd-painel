# 🔧 CORREÇÃO DAS INTEGRAÇÕES

## ❌ Problemas Identificados

Após executar `npm run test:integrations`, identificamos que as credenciais no `.env.local` estão **incorretas ou incompletas**:

### 1. 🔥 Firebase Admin - CORROMPIDO ❌

```
Erro: Failed to parse FIREBASE_ADMIN_SERVICE_ACCOUNT
```

**Problema:** O valor atual é um placeholder truncado:
```
FIREBASE_ADMIN_SERVICE_ACCOUNT={"type":"service_account","project_id":"plataforma-cuide-me",...}
```

**Solução:** Precisa ser o JSON completo em base64.

---

### 2. 💳 Stripe - API KEY INVÁLIDA ❌

```
Erro: Invalid API Key provided
```

**Problema:** A chave parece ser um placeholder ou está quebrada.

**Solução:** Precisa ser uma chave válida do Stripe.

---

### 3. 📊 Google Analytics 4 - JSON MALFORMADO ❌

```
Erro: Unterminated string in JSON at position 262
```

**Problema:** O JSON das credenciais está incompleto ou mal formatado.

**Solução:** Precisa ser o JSON completo das credenciais.

---

## ✅ COMO CORRIGIR

### 🔥 Firebase Admin

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione o projeto `plataforma-cuide-me`
3. Vá em **⚙️ Project Settings** → **Service Accounts**
4. Clique em **Generate New Private Key**
5. Salve o arquivo JSON

**Opção A: Base64 (Recomendado para Vercel)**
```powershell
# No PowerShell:
$json = Get-Content -Raw serviceAccountKey.json
$bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
$base64 = [Convert]::ToBase64String($bytes)
Write-Output $base64
```

Copie o resultado e cole em:
```
FIREBASE_ADMIN_SERVICE_ACCOUNT=<base64_aqui>
```

**Opção B: Campos Separados**
Abra o JSON e extraia:
```
FIREBASE_PROJECT_ID=plataforma-cuide-me
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@plataforma-cuide-me.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nChave completa aqui\n-----END PRIVATE KEY-----"
```

⚠️ **IMPORTANTE:** A private key deve ter `\n` literais e estar entre aspas duplas.

---

### 💳 Stripe

1. Acesse o [Stripe Dashboard](https://dashboard.stripe.com/)
2. Vá em **Developers** → **API Keys**
3. Copie a **Secret Key**

Para **Teste**:
```
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
```

Para **Produção**:
```
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
```

⚠️ **ATENÇÃO:** Nunca commite chaves reais no git!

---

### 📊 Google Analytics 4

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Selecione o projeto `plataforma-cuide-me`
3. Vá em **IAM & Admin** → **Service Accounts**
4. Encontre ou crie uma service account
5. Clique em **Keys** → **Add Key** → **Create New Key** (JSON)
6. Salve o arquivo

**Converter para variável de ambiente:**
```powershell
# No PowerShell:
$json = Get-Content -Raw google-credentials.json
# Copiar o conteúdo inteiro em uma linha
$json -replace '\r?\n', ''
```

Copie o resultado (deve ser uma linha só) e cole em:
```
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"plataforma-cuide-me",...JSON COMPLETO...}
```

---

## 🧪 TESTAR APÓS CORRIGIR

Após atualizar o `.env.local`, execute:

```bash
npm run test:integrations
```

Você deve ver:
```
═══════════════════════════════════════
📊 RESULTADO FINAL:
═══════════════════════════════════════
🔥 Firebase: ✅ OK
💳 Stripe: ✅ OK
📊 GA4: ✅ OK
═══════════════════════════════════════

🎉 TODAS AS INTEGRAÇÕES FUNCIONANDO!
```

---

## 📋 CHECKLIST

- [ ] Firebase Admin SDK configurado (base64 ou campos separados)
- [ ] Stripe Secret Key válida
- [ ] Google Analytics 4 credentials JSON completo
- [ ] Teste executado com sucesso (`npm run test:integrations`)
- [ ] Build funcionando (`npm run build`)
- [ ] Variáveis sincronizadas no Vercel (se aplicável)

---

## 🔐 SEGURANÇA

**NUNCA:**
- ❌ Commite credenciais reais no git
- ❌ Compartilhe chaves em canais públicos
- ❌ Use credenciais de produção em desenvolvimento

**SEMPRE:**
- ✅ Use `.env.local` (já está no `.gitignore`)
- ✅ Use chaves de teste em desenvolvimento
- ✅ Rotacione chaves se expostas
- ✅ Configure secrets no Vercel separadamente

---

## 📞 SUPORTE

Se após seguir este guia ainda houver problemas, verifique:

1. **Console do Firebase:** Logs de erros de autenticação
2. **Dashboard do Stripe:** Logs de API requests
3. **Google Cloud Console:** Permissões da service account
4. **Terminal:** Mensagens de erro detalhadas do script de teste
