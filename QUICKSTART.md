# 🚀 Quick Start - Desenvolvimento

## Setup Inicial (5 minutos)

### 1️⃣ Clone e Instale
```bash
git clone https://github.com/cuide-me/cmd-painel.git
cd cmd-painel
npm install
```

### 2️⃣ Configure Variáveis
```bash
# Copie o template
cp .env.example .env.local

# Edite .env.local com suas credenciais
# Consulte INTEGRATIONS_SETUP.md para detalhes
```

### 3️⃣ Verifique Configuração
```bash
npm run check:env
```

### 4️⃣ Inicie o Servidor
```bash
npm run dev
```

Acesse: http://localhost:3001/admin

---

## ✅ Checklist de Deploy

Antes de fazer deploy para produção:

- [ ] ✅ Build local passa: `npm run build`
- [ ] ✅ Variáveis configuradas: `npm run check:env`
- [ ] ✅ Health check OK: `npm run check:health` (com servidor rodando)
- [ ] ✅ Todas as integrações testadas localmente
- [ ] ✅ Variáveis adicionadas no Vercel
- [ ] ✅ PR criado e aprovado
- [ ] ✅ Merge para main

---

## 🔧 Scripts Úteis

```bash
npm run dev           # Servidor desenvolvimento (porta 3001)
npm run build         # Build de produção
npm run start         # Servidor de produção
npm run lint          # Verificar código
npm run check:env     # Verificar variáveis de ambiente
npm run check:health  # Testar health check (dev server rodando)
```

---

## 🐛 Troubleshooting Rápido

### Erro: "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Erro: "Firebase Admin not initialized"
```bash
# Verifique se FIREBASE_ADMIN_SERVICE_ACCOUNT está configurado
npm run check:env
```

### Erro: Build falha
```bash
# Teste localmente primeiro
npm run build

# Veja os logs detalhados
```

### Dashboard mostra zeros
- Verifique credenciais do Firebase/Stripe/GA4
- Teste cada integração individualmente em `/api/health`
- Confira permissões das service accounts

---

## 📚 Documentação Completa

- [GUIA_USO.md](./GUIA_USO.md) - Guia completo de uso
- [INTEGRATIONS_SETUP.md](./INTEGRATIONS_SETUP.md) - Setup das integrações
- [TORRE_V2_ARCHITECTURE.md](./TORRE_V2_ARCHITECTURE.md) - Arquitetura técnica
