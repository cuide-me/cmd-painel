# CMD Painel - Cuide-me Admin Panel

Painel administrativo separado do Cuide-me MVP.

## Setup Rapido

1. Instale dependencias:
```bash
npm install
```

2. Configure variaveis de ambiente:
```bash
cp .env.example .env.local
# Edite .env.local com credenciais reais
```

3. Rode em desenvolvimento:
```bash
npm run dev
```

Acesse: http://localhost:3001/admin

## Estrutura

- src/app/admin/ - Paginas do painel
- src/app/api/admin/ - API routes protegidas
- src/components/admin/ - Componentes
- src/hooks/ - useAdminAuth, useAdminInactivityTimeout
- src/services/admin/ - Logica de negocio
- src/lib/ - Utilities

## Seguranca

- Autenticacao Firebase obrigatoria
- requireAdmin() em todas as rotas
- Double-check no Firestore
- Rate limiting: 100 req/min
- Session timeout: 5min inatividade

## Scripts

- npm run dev - Dev mode (porta 3001)
- npm run build - Build producao
- npm run start - Servidor producao
- npm run lint - ESLint

## Deploy

Vercel: admin.cuide-me.com.br
