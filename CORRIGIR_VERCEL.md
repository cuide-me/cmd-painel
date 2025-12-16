# 🔧 CORREÇÃO URGENTE - Variáveis Firebase no Vercel

## ⚠️ PROBLEMA
Todas as variáveis do Firebase no Vercel têm `\r\n` (CRLF) no final → erro 400 Bad Request

## 🎯 SOLUÇÃO RÁPIDA

### 1️⃣ Acesse:
https://vercel.com/felipe-pachecos-projects-53eb7e7c/cmd-painel-main/settings/environment-variables

### 2️⃣ Para CADA variável abaixo, clique em "Edit" e cole o valor limpo:

---

**NEXT_PUBLIC_FIREBASE_API_KEY**
```
AIzaSyBgQvhrv2u4d6IknZN_IRl-dtsnslqSfrEE
```

**NEXT_PUBLIC_FIREBASE_APP_ID**
```
1:915790013418:web:dc9b9-abdefcd2e2c
```

**NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN**
```
plataforma-cuide-me.firebaseapp.com
```

**NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID**
```
915790013418
```

**NEXT_PUBLIC_FIREBASE_PROJECT_ID**
```
plataforma-cuide-me
```

**NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET**
```
plataforma-cuide-me.firebasestorage.app
```

---

### 3️⃣ Após corrigir, aguarde 1-2 minutos e teste:
https://cmd-painel-main.vercel.app/admin/login

---

## ✅ Como saber se funcionou?

No console do navegador (F12), a URL deve ser:
```
✅ CORRETO: ...key=AIzaSyBgQvhrv2u4d6IknZN_IRl-dtsnslqSfrEE
❌ ERRADO:  ...key=AIzaSyBgQvhrv2u4d6IknZN_IRl-dtsnslqSfrEE%0D%0A
```
