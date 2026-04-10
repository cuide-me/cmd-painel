# Painel Admin Cuide-me - Superficie Ativa

Repositorio do painel administrativo apos a reestruturacao (Sprints 3 e 4).

## Estado Atual

Este repositorio documenta somente a superficie ativa do painel.
Stack legado de torre antiga e funil legado foi removido do runtime.

## Rotas Admin Ativas

- /admin
- /admin/login
- /admin/jobs
- /admin/alertas
- /admin/service-desk
- /admin/users
- /admin/torre-de-controle

## Redirects Temporarios Ativos

- /admin/torre-de-controle-v3 -> /admin/torre-de-controle
- /admin/funil -> /admin

## APIs Admin Ativas

- GET /api/admin/dashboard-v3
- GET /api/admin/jobs
- GET /api/admin/alertas
- GET /api/admin/tickets
- GET /api/admin/users
- POST /api/admin/auth/login

## APIs Removidas (Legado)

- /api/admin/funil
- /api/admin/torre-de-controle

Ambas retornam 404 por remocao fisica.

## Autenticacao Atual

- Login admin: POST /api/admin/auth/login valida senha de ambiente e retorna firebaseCustomToken.
- Cliente: signInWithCustomToken no Firebase Auth.
- Chamadas protegidas: Authorization: Bearer <Firebase ID token> via authFetch.
- Server-side: verificacao admin via token Firebase e privilegio admin (claims e fallback Firestore para perfil admin).

Nao ha suporte ativo para:

- x-admin-password
- Bearer legado no formato admin:
- sessao fake por localStorage

## Modulos Suportados Hoje

- Torre operacional v3 (home + dashboard-v3)
- Atendimentos (jobs)
- Alertas
- Service Desk
- Usuarios

## Estrutura Relevante

```text
src/app/admin/
  page.tsx
  login/page.tsx
  jobs/page.tsx
  alertas/page.tsx
  service-desk/page.tsx
  users/page.tsx
  torre-de-controle/page.tsx
  torre-de-controle-v3/page.tsx   # redirect
  funil/page.tsx               # redirect

src/app/api/admin/
  auth/login/route.ts
  dashboard-v3/route.ts
  jobs/route.ts
  alertas/route.ts
  tickets/route.ts
  users/route.ts
```

## Comandos

```bash
npm install
npm run dev
npm run build
npm start
```

## Notas de Documentacao

- Arquivos de auditoria agora refletem estado pos-reestruturacao.
- Referencias antigas foram marcadas como legado removido.
