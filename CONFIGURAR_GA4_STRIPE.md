# 🔧 Configurar GA4 e Stripe

## Status Atual das Integrações

Após executar `npm run test:integrations`:

- ✅ **Firebase**: FUNCIONANDO PERFEITAMENTE
- ❌ **Stripe**: API Key inválida
- ⚠️ **GA4**: Falta permissão para a service account

---

## 📊 Configurar Google Analytics 4 (GA4)

### Problema
```
PERMISSION_DENIED: User does not have sufficient permissions for this property
```

### Solução: Adicionar Service Account ao GA4

**Passo 1: Acesse o Google Analytics**
- Vá para https://analytics.google.com/
- Selecione a propriedade **plataforma-cuide-me** (Property ID: `503083965`)

**Passo 2: Adicionar Usuário**
1. Clique em **Admin** (ícone de engrenagem, canto inferior esquerdo)
2. Na coluna **Property**, clique em **Property Access Management**
3. Clique no botão **+** (Add users) no canto superior direito
4. Adicione o email da service account:
   ```
   firebase-adminsdk-fbsvc@plataforma-cuide-me.iam.gserviceaccount.com
   ```

**Passo 3: Definir Permissões**
- **Role recomendada**: `Viewer` (para leitura de dados)
- Se precisar de mais acesso: `Analyst` ou `Editor`
- Marque: **Notify user by email** (NÃO) - é uma service account, não precisa

**Passo 4: Salvar**
- Clique em **Add** no canto superior direito
- Aguarde alguns segundos para as permissões propagarem

**Passo 5: Testar**
```bash
npm run test:integrations
```

Você deve ver:
```
📊 GA4: ✅ OK
✅ Última semana: X visualizações de página
```

---

## 💳 Configurar Stripe

### Problema
```
Invalid API Key provided: sk_live_***...NY9V
```

### Causa Provável
A chave do Stripe pode estar:
- Expirada
- Revogada
- Incorreta (copiada com erro)
- Não ativada para uso

### Solução: Obter Nova Chave

**Passo 1: Acesse o Dashboard**
- Vá para https://dashboard.stripe.com/
- Faça login na conta do **plataforma-cuide-me**

**Passo 2: Verificar Modo**
Para **TESTE** (desenvolvimento):
1. Clique em **Developers** no menu superior
2. Clique em **API Keys**
3. Certifique-se que está em **Test mode** (toggle no canto superior direito)
4. Copie a **Secret key** (começa com `sk_test_`)

Para **PRODUÇÃO** (live):
1. Clique em **Developers** no menu superior
2. Clique em **API Keys**
3. Ative **View live mode** (toggle no canto superior direito)
4. Copie a **Secret key** (começa com `sk_live_`)

⚠️ **IMPORTANTE**: Se não visualizar a chave completa, clique em **Reveal test/live key**

**Passo 3: Atualizar .env.local**

Para **TESTE**:
```bash
STRIPE_SECRET_KEY=sk_test_[sua_chave_de_teste_aqui]
```

Para **PRODUÇÃO**:
```bash
STRIPE_SECRET_KEY=sk_live_[sua_chave_de_producao_aqui]
```

**Passo 4: Testar**
```bash
npm run test:integrations
```

Você deve ver:
```
💳 Stripe: ✅ OK
✅ Cliente criado de teste: cus_XXXXX
```

---

## 🔐 Verificar Permissões Adicionais

### Stripe - Permissões Necessárias

Certifique-se que a API key tem as seguintes permissões:
- ✅ **Customers**: Read, Write
- ✅ **Payment Methods**: Read
- ✅ **Charges**: Read
- ✅ **Balance**: Read

Para verificar:
1. Dashboard → **Developers** → **API Keys**
2. Clique nos **três pontos** ao lado da key
3. **View key details**
4. Verifique **Permissions**

### GA4 - Verificar Property ID

Se o erro persistir após adicionar permissões, verifique se o Property ID está correto:

1. Google Analytics → **Admin** → **Property Settings**
2. O **Property ID** deve ser: `503083965`
3. Se diferente, atualize no `.env.local`:
   ```
   GA4_PROPERTY_ID=XXXXX (seu Property ID correto)
   ```

---

## 🧪 Testar Tudo Novamente

Após fazer as configurações acima, execute:

```bash
npm run test:integrations
```

**Resultado esperado:**
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

## 🚀 Próximos Passos

Após todas as integrações funcionarem:

1. **Build para produção**:
   ```bash
   npm run build
   ```

2. **Sincronizar com Vercel** (se aplicável):
   - Execute o script: `.\fix-vercel-env.ps1`
   - Ou configure manualmente no dashboard da Vercel

3. **Deploy**:
   ```bash
   git add .
   git commit -m "fix: update Stripe and GA4 credentials"
   git push origin main
   ```

---

## 📞 Troubleshooting

### GA4 ainda com erro após adicionar permissões?
- Aguarde 5-10 minutos para propagação
- Verifique se o email foi digitado corretamente
- Teste no **Google Cloud Console** se a service account existe:
  - https://console.cloud.google.com/
  - IAM & Admin → Service Accounts
  - Procure por `firebase-adminsdk-fbsvc@plataforma-cuide-me.iam.gserviceaccount.com`

### Stripe ainda inválida após trocar a chave?
- Certifique-se de copiar a chave **completa** (começa com `sk_`)
- Não deve ter espaços ou quebras de linha
- Teste diretamente no terminal:
  ```bash
  curl https://api.stripe.com/v1/charges -u sk_live_SUACHAVE:
  ```

### Firebase funcionando mas dados vazios?
- Normal! O teste verifica conexão, não dados
- Pode haver 0 famílias/profissionais cadastrados
- O importante é "Query executada com sucesso"
