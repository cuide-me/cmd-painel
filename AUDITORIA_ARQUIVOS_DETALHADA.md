# AUDITORIA POR ARQUIVO - Estado Atual

Data de consolidacao: 2026-04-10

Este arquivo resume a fotografia atual de runtime apos limpeza de legado.

## Arquivos-Chave Ativos (Admin)

- src/app/admin/page.tsx
- src/app/admin/login/page.tsx
- src/app/admin/jobs/page.tsx
- src/app/admin/alertas/page.tsx
- src/app/admin/service-desk/page.tsx
- src/app/admin/users/page.tsx
- src/app/admin/torre-de-controle/page.tsx
- src/app/admin/torre-de-controle-v3/page.tsx (redirect)
- src/app/admin/funil/page.tsx (redirect)

## APIs Ativas

- src/app/api/admin/auth/login/route.ts
- src/app/api/admin/dashboard-v3/route.ts
- src/app/api/admin/jobs/route.ts
- src/app/api/admin/alertas/route.ts
- src/app/api/admin/tickets/route.ts
- src/app/api/admin/users/route.ts

## Servicos Ativos

- src/services/admin/dashboardV3Metrics.ts
- src/services/admin/dashboardV3Types.ts
- src/services/admin/jobs/*
- src/services/admin/alerts/*
- src/services/admin/tickets/*
- src/services/admin/users/*

## Itens Legados Removidos (Confirmado)

- src/app/api/admin/funil/route.ts
- src/app/api/admin/torre-de-controle/route.ts
- src/services/admin/funnel/*
- src/services/admin/torreDeControleMetrics.ts
- src/services/admin/torreDeControleTypes.ts
- src/components/admin/TorreDeControleDashboard.tsx
- src/components/admin/KpiCard.tsx (versao antiga)
- src/components/admin/RegionDrilldownTable.tsx
- src/components/admin/StatusPill.tsx

## Autenticacao (Runtime Atual)

- Cliente e APIs usam Firebase ID token.
- verifyAdminAuth nao aceita x-admin-password.
- verifyAdminAuth nao aceita Bearer legado admin:.

## Observacao Historica

Referencias antigas em documentos de estrategia ou roadmap devem ser lidas como historico, nao como contrato atual de runtime.
