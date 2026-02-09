# Guia de Deployment - Torre de Controle

## 📋 Pré-requisitos

- Node.js 20.x ou superior
- npm ou yarn
- Conta Vercel (recomendado) ou Docker
- Firebase Admin SDK configurado
- Stripe API Key
- Google Analytics 4 Property ID

## 🚀 Deployment na Vercel (Recomendado)

### 1. Conectar Repositório

1. Acesse [vercel.com](https://vercel.com)
2. Clique em **New Project**
3. Importe o repositório `cuide-me/cmd-painel`
4. Configure o framework: **Next.js**

### 2. Configurar Variáveis de Ambiente

No painel da Vercel, vá em **Settings** → **Environment Variables** e adicione:

```env
FIREBASE_ADMIN_PROJECT_ID=seu-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@seu-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...-----END PRIVATE KEY-----
STRIPE_SECRET_KEY=<sua-chave-stripe-aqui>
GA_PROPERTY_ID=properties/123456789
ADMIN_EMAIL=admin@cuide.me
ADMIN_PASSWORD_HASH=$2b$10$...
WEBHOOK_SECRET_TOKEN=seu-token-secreto
```

**⚠️ IMPORTANTE:** 
- Marque todas as variáveis para **Production**, **Preview** e **Development**
- Para `FIREBASE_ADMIN_PRIVATE_KEY`, use o formato: `"-----BEGIN PRIVATE KEY-----\nSUA_CHAVE\n-----END PRIVATE KEY-----\n"`

### 3. Deploy

```bash
# Via CLI
npm install -g vercel
vercel login
vercel --prod

# Ou via Git
git push origin main  # Deploy automático
```

### 4. Domínio Customizado (Opcional)

1. Vá em **Settings** → **Domains**
2. Adicione: `admin.cuide.me`
3. Configure DNS:
   ```
   Type: CNAME
   Name: admin
   Value: cname.vercel-dns.com
   ```

## 🐳 Deployment com Docker

### 1. Build da Imagem

```bash
docker build -t torre-controle:latest .
```

### 2. Executar Container

```bash
docker run -d \
  --name torre-controle \
  -p 3000:3000 \
  --env-file .env.production \
  torre-controle:latest
```

### 3. Docker Compose

Crie `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env.production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

Execute:
```bash
docker-compose up -d
```

## ☁️ Deployment em Cloud Providers

### AWS (Elastic Beanstalk)

1. Instale EB CLI:
```bash
pip install awsebcli
```

2. Inicialize:
```bash
eb init -p node.js-20 torre-controle
```

3. Configure variáveis:
```bash
eb setenv FIREBASE_ADMIN_PROJECT_ID=xxx \
          STRIPE_SECRET_KEY=xxx \
          ...
```

4. Deploy:
```bash
eb create torre-controle-prod
eb deploy
```

### Google Cloud Run

1. Build da imagem:
```bash
gcloud builds submit --tag gcr.io/seu-project/torre-controle
```

2. Deploy:
```bash
gcloud run deploy torre-controle \
  --image gcr.io/seu-project/torre-controle \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars FIREBASE_ADMIN_PROJECT_ID=xxx,...
```

### Azure App Service

1. Crie App Service:
```bash
az webapp create \
  --name torre-controle \
  --resource-group cuide-me \
  --plan app-service-plan \
  --runtime "NODE|20-lts"
```

2. Configure variáveis:
```bash
az webapp config appsettings set \
  --name torre-controle \
  --resource-group cuide-me \
  --settings @env-vars.json
```

3. Deploy:
```bash
az webapp deployment source config \
  --name torre-controle \
  --resource-group cuide-me \
  --repo-url https://github.com/cuide-me/cmd-painel \
  --branch main
```

## 🔐 Configurações de Segurança

### 1. SSL/TLS

**Vercel:** Automático com Let's Encrypt

**Custom Server:**
```bash
# Certbot (Let's Encrypt)
sudo certbot --nginx -d admin.cuide.me
```

### 2. Firewall

Permita apenas portas necessárias:
```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

### 3. Rate Limiting (Nginx)

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/m;

server {
    location /api/ {
        limit_req zone=api_limit burst=10 nodelay;
        proxy_pass http://localhost:3000;
    }
}
```

## 📊 Monitoramento Pós-Deploy

### 1. Health Check

```bash
# Verificar saúde da aplicação
curl https://admin.cuide.me/api/admin/system/health?detailed=true
```

**Resposta Esperada:**
```json
{
  "status": "healthy",
  "uptime": 3600,
  "cache": { "total": 45, "valid": 42 },
  "rateLimit": { "totalIdentifiers": 12 }
}
```

### 2. Logs

**Vercel:**
```bash
vercel logs --follow
```

**Docker:**
```bash
docker logs -f torre-controle
```

**PM2:**
```bash
pm2 logs torre-controle
```

### 3. Métricas

Configure alertas no Vercel ou use ferramentas como:
- **Sentry** - Error tracking
- **DataDog** - APM
- **New Relic** - Performance monitoring

## 🔄 CI/CD Pipeline

### GitHub Actions

Crie `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build
        run: npm run build
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 🧪 Testes Pré-Deploy

```bash
# Build local
npm run build

# Iniciar produção local
npm start

# Testar endpoints
curl http://localhost:3000/api/health
curl http://localhost:3000/api/admin/system/health

# Performance test
npm run test:perf
```

## 📝 Checklist de Deploy

- [ ] Todas as variáveis de ambiente configuradas
- [ ] Firebase Admin SDK testado
- [ ] Stripe API Key válida
- [ ] Build local bem-sucedido
- [ ] Testes passando
- [ ] SSL/TLS configurado
- [ ] Domínio customizado configurado (opcional)
- [ ] Monitoring configurado
- [ ] Backup de dados configurado
- [ ] Rate limiting testado
- [ ] Cache funcionando
- [ ] Notificações testadas
- [ ] Webhooks configurados (se aplicável)

## 🆘 Troubleshooting

### Erro: "Firebase Admin initialization failed"

```bash
# Verifique se a variável está escapada corretamente
echo $FIREBASE_ADMIN_PRIVATE_KEY | grep "BEGIN PRIVATE KEY"

# No Vercel, use formato com \n escapado
"-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

### Erro: "Rate limit exceeded"

```bash
# Limpar rate limiter
curl -X POST http://localhost:3000/api/admin/system/reset-rate-limit
```

### Erro: "Cache full"

```bash
# Limpar cache manualmente
curl -X POST http://localhost:3000/api/admin/system/clear-cache
```

## 📞 Suporte

- **Email:** tech@cuide.me
- **Slack:** #torre-controle
- **Docs:** https://docs.cuide.me/admin
