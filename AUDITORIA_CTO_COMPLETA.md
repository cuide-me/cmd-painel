# AUDITORIA CTO - Estado Pos-Reestruturacao

Data de consolidacao: 2026-04-10

Este documento substitui a leitura operacional da auditoria antiga e reflete apenas a superficie ativa apos os Sprints 3A-5A.

## Resumo Executivo

- Reestruturacao pesada concluida.
- Superficie admin consolidada em rotas e APIs ativas.
- Stack legado de funil e torre antiga removido do runtime.
- Autenticacao unificada em Firebase Auth (sem fallback legado).

## Superficie Admin Ativa

Rotas:

- /admin
- /admin/login
- /admin/jobs
- /admin/alertas
- /admin/service-desk
- /admin/users
- /admin/torre-de-controle

Redirects mantidos:

- /admin/torre-de-controle-v3 -> /admin/torre-de-controle
- /admin/funil -> /admin

APIs:

- POST /api/admin/auth/login
- GET /api/admin/dashboard-v3
- GET /api/admin/jobs
- GET /api/admin/alertas
- GET /api/admin/tickets
- GET /api/admin/users

## Legado Removido

- /api/admin/funil
- /api/admin/torre-de-controle
- componentes de torre antiga
- servicos e tipos de funil legado
- fallback server-side por x-admin-password
- fallback Bearer legado admin:
- uso real de auth via localStorage

## Autenticacao Atual (Hardening aplicado)

- Login com senha de ambiente no endpoint /api/admin/auth/login.
- Emissao de firebaseCustomToken.
- Sessao cliente no Firebase Auth.
- authFetch envia Authorization com Firebase ID token.
- verifyAdminAuth valida token Firebase + privilegio admin.

## Riscos Residuais

- Links externos para endpoints removidos retornam 404.
- Documentos estrategicos/historicos podem citar termos antigos como referencia de contexto, mas nao representam superficie ativa.

## Conclusao

Leitura operacional atual: usar somente as rotas e APIs listadas neste documento e no README.
