# Deploy Instructions - CMD Painel

## 1. Push para GitHub

Primeiro, crie o repositório no GitHub: https://github.com/cuide-me/cmd-painel

Depois, conecte o repositório local:

```bash
cd c:\Users\felip\Downloads\cmd-painel

# Adicionar remote
git remote add origin https://github.com/cuide-me/cmd-painel.git

# Push inicial
git branch -M main
git push -u origin main
```

## 2. Configurar Vercel

### Opção A: Via CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Opção B: Via Dashboard

1. Acesse https://vercel.com/new
2. Importe o repositório `cuide-me/cmd-painel`
3. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`
   - **Development Command**: `npm run dev`

## 3. Environment Variables (Vercel)

Adicione no dashboard da Vercel (Settings → Environment Variables):

### Firebase Admin SDK
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (lembre-se das aspas e \n)
- `FIREBASE_DATABASE_URL`

### Firebase Client
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Stripe
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### URLs
- `NEXT_PUBLIC_APP_URL`: https://admin.cuide-me.com.br
- `NEXT_PUBLIC_API_URL`: https://admin.cuide-me.com.br

## 4. Configurar Domínio Customizado

1. No Vercel dashboard do projeto
2. Settings → Domains
3. Adicionar: `admin.cuide-me.com.br`
4. Configurar DNS (no provedor do domínio):
   - **Tipo**: CNAME
   - **Nome**: admin
   - **Valor**: cname.vercel-dns.com

## 5. Testar Deploy

Após deploy:

1. Acesse: https://admin.cuide-me.com.br/admin/login
2. Teste login com usuário admin
3. Verifique todas as páginas:
   - /admin/dashboard
   - /admin/financeiro
   - /admin/pipeline
   - /admin/users
4. Teste APIs no console:
   ```javascript
   fetch('/api/admin/torre-stats')
     .then(r => r.json())
     .then(console.log)
   ```

## 6. Monitoramento

Configure na Vercel:
- **Analytics**: Ativar Vercel Analytics
- **Speed Insights**: Ativar Web Vitals
- **Logs**: Runtime Logs habilitados

Opcional - Sentry:
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

## 7. CI/CD (Opcional)

Criar `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
  
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
```

## 8. Segurança Pós-Deploy

- [ ] Testar autenticação admin
- [ ] Verificar rate limiting (100 req/min)
- [ ] Testar session timeout (5min inatividade)
- [ ] Verificar headers de segurança (CSP, HSTS)
- [ ] Confirmar HTTPS funcionando
- [ ] Testar todas as APIs protegidas
- [ ] Validar logs estruturados

## 9. Rollback (Se necessário)

```bash
# Listar deployments
vercel ls

# Promover deployment anterior
vercel promote [deployment-url] --prod
```

## Status Atual

- ✅ Repositório local criado e commitado
- ⏳ Push para GitHub (aguardando criação do repo)
- ⏳ Deploy Vercel (aguardando push)
- ⏳ Configuração DNS (aguardando deploy)
- ⏳ Testes em produção (aguardando DNS)

## Suporte

Documentação completa em:
- Cuide-me-main: `docs/MIGRATION_ADMIN_PANEL.md`
- Next.js: https://nextjs.org/docs
- Vercel: https://vercel.com/docs
- Firebase Admin: https://firebase.google.com/docs/admin/setup
