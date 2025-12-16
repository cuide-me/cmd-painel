# 🚨 ERRO 500 NO /api/admin/financeiro - CORREÇÃO

## Causa do Problema

O erro ocorre porque as **variáveis de ambiente não estão configuradas na Vercel**.

A API de financeiro precisa de:
- `STRIPE_SECRET_KEY` ← **Faltando na Vercel**
- `FIREBASE_ADMIN_SERVICE_ACCOUNT` 
- `GOOGLE_APPLICATION_CREDENTIALS_JSON`
- `GA4_PROPERTY_ID`

---

## 🔧 Solução Rápida

### Opção 1: Script Automático (Requer Vercel CLI)

```powershell
.\sync-vercel-env.ps1
```

### Opção 2: Configuração Manual (Recomendado)

**Passo 1: Acesse o Dashboard**
https://vercel.com/cuide-me/cmd-painel-main/settings/environment-variables

**Passo 2: Adicione as Variáveis**

Clique em **Add New** e adicione cada variável abaixo:

#### 1. STRIPE_SECRET_KEY
- **Name**: `STRIPE_SECRET_KEY`
- **Value**: Copie do `.env.local` local (começa com `sk_live_`)
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

#### 2. FIREBASE_ADMIN_SERVICE_ACCOUNT
- **Name**: `FIREBASE_ADMIN_SERVICE_ACCOUNT`
- **Value**: Copie do `.env.local` local (string base64 longa)
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

#### 3. GOOGLE_APPLICATION_CREDENTIALS_JSON
- **Name**: `GOOGLE_APPLICATION_CREDENTIALS_JSON`
- **Value**: Copie do `.env.local` local (string base64)
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

#### 4. GA4_PROPERTY_ID
- **Name**: `GA4_PROPERTY_ID`
- **Value**: `503083965`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

#### 5. Variáveis Públicas do Firebase
Adicione também estas (começam com `NEXT_PUBLIC_`):

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

**Dica:** Copie os valores do seu `.env.local`

---

## 📋 Copiar Valores do .env.local

Execute no PowerShell para ver os valores:

```powershell
Get-Content .env.local | Select-String "STRIPE_SECRET_KEY|FIREBASE_ADMIN|GA4_PROPERTY_ID|GOOGLE_APPLICATION"
```

---

## 🚀 Após Configurar

**Passo 3: Fazer Redeploy**

Opção A - Novo commit:
```bash
git commit --allow-empty -m "chore: trigger redeploy"
git push origin main
```

Opção B - Redeploy no dashboard:
1. Acesse: https://vercel.com/cuide-me/cmd-painel-main
2. Vá na aba **Deployments**
3. Clique nos **três pontos** do último deploy
4. Selecione **Redeploy**

---

## ✅ Verificar se Funcionou

Após o deploy, teste:
https://cmd-painel-main.vercel.app/api/admin/financeiro

Deve retornar JSON com:
```json
{
  "summary": {
    "totalReceived": ...
  },
  "transactions": [...]
}
```

---

## 🐛 Troubleshooting

### Erro persiste após adicionar variáveis?
- Aguarde 1-2 minutos para propagação
- Force um novo deploy
- Verifique se todas as variáveis têm **Production** marcado

### Como saber quais variáveis estão faltando?
1. Vercel Dashboard → Deployments
2. Clique no deploy com erro
3. Vá na aba **Functions**
4. Clique em `/api/admin/financeiro`
5. Veja os logs de erro

### Variável muito grande?
Se `FIREBASE_ADMIN_SERVICE_ACCOUNT` for muito grande:
- A Vercel aceita até 4KB por variável
- Nossa string base64 tem ~2KB, deve funcionar
- Se falhar, use campos separados (project_id, private_key, etc)

---

## 📞 Suporte

Se o problema persistir:
1. Verifique os logs na Vercel
2. Execute localmente: `npm run dev` e teste `http://localhost:3001/api/admin/financeiro`
3. Compare as variáveis locais (.env.local) com as da Vercel
