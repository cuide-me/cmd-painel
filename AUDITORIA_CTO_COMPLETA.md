# 🔬 AUDITORIA CTO COMPLETA - Painel Admin Cuide.me

**Data:** 24 de Fevereiro de 2026  
**Versão Analisada:** 1.0.0 (Next.js 16.0.10)  
**Auditor:** CTO/Arquiteto Sênior  
**Status:** Auditoria Hardcore Completa

---

## 📊 A) MAPA DO SISTEMA

### Diagrama de Arquitetura (Textual)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND (Next.js 16)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  /admin/login          │  /admin (Dashboard)     │  /admin/torre-de-controle│
│  /admin/jobs           │  /admin/funil           │  /admin/alertas          │
│  /admin/service-desk   │  /admin/users           │                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            API ROUTES (Server)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  /api/admin/torre-de-controle  │  /api/admin/users    │  /api/admin/jobs    │
│  /api/admin/funil              │  /api/admin/tickets  │  /api/admin/alertas │
│  /api/health                   │  /api/test           │                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                   ┌─────────────────┼─────────────────┐
                   ▼                 ▼                 ▼
┌──────────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│     FIREBASE         │  │      STRIPE      │  │       GA4        │
├──────────────────────┤  ├──────────────────┤  ├──────────────────┤
│ • Firestore (dados)  │  │ • Charges        │  │ • Property Data  │
│ • Auth (admin SDK)   │  │ • Accounts       │  │ • Events         │
│ • Storage (certs)    │  │ • Balance        │  │                  │
└──────────────────────┘  └──────────────────┘  └──────────────────┘
```

### Coleções Firestore

| Coleção | Propósito | Docs Estimados |
|---------|-----------|----------------|
| `users` | Famílias + Profissionais | milhares |
| `jobs` | Solicitações de cuidado | milhares |
| `tickets` | Service Desk | centenas |
| `payment_confirmations` | Confirmações de pagamento | milhares |
| `transacoes` | Histórico financeiro | milhares |
| `feedbacks` | Avaliações | centenas |

### Fluxos Críticos Identificados

1. **Autenticação Admin**
   - Login via senha fixa → localStorage → x-admin-password header
   
2. **Torre de Controle (KPIs)**
   - GET /api/admin/torre-de-controle → calculateTorreDeControleMetrics() → Firestore queries
   
3. **Gestão de Jobs**
   - Listagem com filtros → normalização de status → agregações
   
4. **Alertas Operacionais**
   - Jobs sem match > 48h, pagamentos pendentes, profissionais inativos

---

## 📋 SCORECARD EXECUTIVO (0-10)

| Área | Score | Justificativa |
|------|-------|---------------|
| **🔴 Segurança** | **2/10** | Senha hardcoded, sem RBAC real, sem audit log |
| **🟡 Performance** | **5/10** | Cache in-memory básico, N+1 queries, sem pagination real |
| **🟡 Escalabilidade** | **4/10** | Leitura de todos os docs, sem índices otimizados |
| **🔴 Observabilidade** | **3/10** | console.log apenas, sem Sentry/métricas estruturadas |
| **🟢 Qualidade Código** | **7/10** | TypeScript, Zod, estrutura organizada |
| **🟡 UX Admin** | **6/10** | Design funcional, falta feedback de loading/errors |

**SCORE GERAL: 4.5/10** - Funcional para MVP, mas com riscos críticos para escala.

---

## 🚨 TOP 15 PROBLEMAS CRÍTICOS

### 🔴 CRÍTICO (Risco Imediato)

#### 1. Autenticação Insegura - CRITICAL
**Arquivo:** `src/app/admin/login/page.tsx`, `src/lib/server/auth.ts`
```typescript
// PROBLEMA: Senha hardcoded no código-fonte E exibida na UI
const ADMIN_PASSWORD = 'cuideme@admin321';
// UI mostra a senha: <p className="text-xs">Senha: cuideme@admin321</p>
```
**Risco:** Qualquer pessoa com acesso ao repo ou à página de login tem acesso admin.
**Correção:**
```typescript
// Use variável de ambiente
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) throw new Error('ADMIN_PASSWORD not configured');

// Remova a exibição da senha na UI
```
**Impacto:** 🔴 CRÍTICO | **Esforço:** Baixo (1h)

#### 2. Sem Controle de Sessão Real
**Arquivo:** `src/hooks/useFirebaseAuth.ts`, `src/lib/client/authFetch.ts`
```typescript
// PROBLEMA: localStorage === 'true' não é autenticação
const isLogged = localStorage.getItem('admin_logged') === 'true';

// PROBLEMA: Senha enviada em cada request
headers.set('x-admin-password', 'cuideme@admin321');
```
**Risco:** XSS pode roubar sessão, replay attacks possíveis.
**Correção:** Implementar Firebase Auth real ou JWT com httpOnly cookies.
**Impacto:** 🔴 CRÍTICO | **Esforço:** Alto (16h)

#### 3. Firebase Security Rules Não Auditadas
**Problema:** Não vi arquivo `firestore.rules` no repositório.
**Suposição:** Rules podem estar abertas ou mal configuradas.
**Correção:** Auditar e implementar rules mínimas:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Negar tudo por padrão
    match /{document=**} {
      allow read, write: if false;
    }
    // Rules específicas por coleção
  }
}
```
**Impacto:** 🔴 CRÍTICO | **Esforço:** Alto (8h)

#### 4. Logs com Dados Sensíveis
**Arquivo:** `src/lib/server/firebaseAdmin.ts`
```typescript
// PROBLEMA: Logando credenciais parciais
console.warn('  - Client Email:', clientEmail?.substring(0, 20) + '...');
console.warn('  - Primeiros 50 chars:', processedKey.substring(0, 50));
```
**Risco:** Credenciais podem vazar em logs de produção.
**Correção:** Remover logs de credenciais em produção:
```typescript
if (process.env.NODE_ENV === 'development') {
  console.debug('[Firebase Admin] Initialized');
}
```
**Impacto:** 🔴 CRÍTICO | **Esforço:** Baixo (30min)

#### 5. Ausência de Rate Limiting nas APIs Admin
**Problema:** APIs admin não usam o middleware de rate limiting existente.
**Arquivo:** Todas as rotas em `src/app/api/admin/*`
**Correção:**
```typescript
import { withRateLimit } from '@/lib/apiMiddleware';

export async function GET(request: NextRequest) {
  const rateLimitResult = withRateLimit('STRICT')(request);
  if (rateLimitResult instanceof NextResponse) return rateLimitResult;
  // ...
}
```
**Impacto:** 🔴 CRÍTICO | **Esforço:** Médio (4h)

---

### 🟡 ALTO (Escala/Performance/Dívida)

#### 6. Query N+1 e Full Scan em Jobs
**Arquivo:** `src/services/admin/torreDeControleMetrics.ts`
```typescript
// PROBLEMA: Busca TODOS os jobs, depois TODOS os payments, depois TODOS os users
const jobsSnapshot = await db.collection('jobs')
  .where('createdAt', '>=', windowStart)
  .get();
// Se tiver 100k jobs, isso quebra
```
**Correção:** 
- Implementar paginação com cursors
- Usar Firestore counters para agregações
- Criar índices compostos
**Impacto:** 🟡 ALTO | **Esforço:** Alto (24h)

#### 7. Cache In-Memory Não Distribuído
**Arquivo:** `src/app/api/admin/torre-de-controle/route.ts`
```typescript
const cache = new Map<string, CacheEntry>();
```
**Problema:** Em ambiente serverless (Vercel), cada instância tem seu próprio cache.
**Correção:** 
- Usar Redis (Upstash) para cache distribuído
- Ou Vercel KV
**Impacto:** 🟡 ALTO | **Esforço:** Médio (8h)

#### 8. Sem Audit Log de Ações Admin
**Problema:** Nenhuma ação administrativa é logada para auditoria.
**Correção:** Criar coleção `audit_logs` no Firestore:
```typescript
async function logAdminAction(action: string, userId: string, details: any) {
  await db.collection('audit_logs').add({
    action,
    userId,
    details,
    timestamp: FieldValue.serverTimestamp(),
    ip: request.headers.get('x-forwarded-for'),
  });
}
```
**Impacto:** 🟡 ALTO | **Esforço:** Médio (8h)

#### 9. Stripe Webhook Não Implementado
**Problema:** Não há endpoint para webhooks do Stripe.
**Risco:** Estados de pagamento desincronizados, chargebacks não tratados.
**Correção:** Implementar `/api/webhooks/stripe`:
```typescript
export async function POST(request: NextRequest) {
  const sig = request.headers.get('stripe-signature');
  const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  // Handle events
}
```
**Impacto:** 🟡 ALTO | **Esforço:** Alto (16h)

#### 10. Inconsistência de Status de Jobs
**Arquivo:** `src/services/admin/statusNormalizer.ts`
```typescript
const STATUS_MAP: Record<string, NormalizedJobStatus> = {
  'pending': 'pending',
  'pendente': 'pending',
  'open': 'pending',
  'proposta_enviada': 'pending',
  // ... múltiplos mapeamentos
};
```
**Problema:** Indica debt técnico no modelo de dados.
**Correção:** 
1. Migração para normalizar todos os status
2. Validação Zod na entrada de dados
**Impacto:** 🟡 ALTO | **Esforço:** Alto (16h)

---

### 🟢 MÉDIO (Limpeza/Consistência)

#### 11. Duplicação de Código em APIs
**Problema:** Padrão repetido em todas as rotas:
```typescript
const authResult = await verifyAdminAuth(request);
if (!authResult || !authResult.authorized) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
getFirebaseAdmin();
```
**Correção:** Criar higher-order function:
```typescript
export const withAdminAuth = (handler) => async (request) => {
  const auth = await verifyAdminAuth(request);
  if (!auth?.authorized) return unauthorized();
  getFirebaseAdmin();
  return handler(request, auth);
};
```
**Impacto:** 🟢 MÉDIO | **Esforço:** Médio (4h)

#### 12. Tipos Any Espalhados
**Vários arquivos:**
```typescript
const params: any = {};
jobs.forEach((job: any) => { ... });
```
**Correção:** Definir interfaces completas em `types.ts`.
**Impacto:** 🟢 MÉDIO | **Esforço:** Médio (8h)

#### 13. Testes Inexistentes
**Problema:** `jest.config.js` existe mas não há testes.
**Correção:** Priorizar testes em:
1. `auth.ts` - crítico
2. `statusNormalizer.ts` - lógica de negócio
3. `torreDeControleMetrics.ts` - cálculos
**Impacto:** 🟢 MÉDIO | **Esforço:** Alto (32h+)

#### 14. Error Boundaries Incompletos
**Arquivo:** `src/components/ErrorBoundary.tsx`
**Problema:** Existe mas não está sendo usado em todas as páginas.
**Correção:** Envolver todas as páginas admin com ErrorBoundary.
**Impacto:** 🟢 MÉDIO | **Esforço:** Baixo (2h)

#### 15. Monitoramento com console.log
**Problema:** Todo monitoramento é via console.log/warn/error.
**Correção:** Implementar Sentry ou similar:
```typescript
import * as Sentry from '@sentry/nextjs';
Sentry.captureException(error, { extra: context });
```
**Impacto:** 🟢 MÉDIO | **Esforço:** Médio (4h setup + ongoing)

---

## 📅 ROADMAP 30/60/90 DIAS

### 🗓️ 30 Dias - Estabilização + Quick Wins

| Semana | Tarefa | Prioridade | Esforço |
|--------|--------|------------|---------|
| 1 | Remover senha hardcoded, usar env vars | 🔴 | 2h |
| 1 | Remover senha da UI de login | 🔴 | 30min |
| 1 | Remover logs de credenciais | 🔴 | 1h |
| 1 | Auditar Firebase Security Rules | 🔴 | 8h |
| 2 | Implementar rate limiting nas APIs admin | 🔴 | 4h |
| 2 | Setup Sentry básico | 🟡 | 4h |
| 2 | Criar função withAdminAuth | 🟢 | 4h |
| 3 | Adicionar ErrorBoundary em todas páginas | 🟢 | 2h |
| 3 | Testes unitários para auth e statusNormalizer | 🟢 | 16h |
| 4 | Documentar modelo de dados atual | 🟢 | 8h |

**Entregáveis:**
- ✅ Sistema mais seguro (sem credenciais expostas)
- ✅ Rate limiting ativo
- ✅ Erros capturados no Sentry
- ✅ Testes básicos implementados

### 🗓️ 60 Dias - Estrutura + Observabilidade

| Semana | Tarefa | Prioridade | Esforço |
|--------|--------|------------|---------|
| 5 | Implementar Firebase Auth para admin (JWT) | 🔴 | 16h |
| 5 | Setup Audit Log básico | 🟡 | 8h |
| 6 | Implementar webhook Stripe | 🟡 | 16h |
| 6 | Redis/Upstash para cache distribuído | 🟡 | 8h |
| 7 | Otimizar queries com paginação | 🟡 | 16h |
| 7 | Criar índices Firestore necessários | 🟡 | 4h |
| 8 | Dashboard de métricas operacionais (SLIs) | 🟢 | 16h |
| 8 | Alertas Slack/Discord para erros críticos | 🟢 | 4h |

**Entregáveis:**
- ✅ Autenticação robusta com JWT
- ✅ Webhooks Stripe funcionando
- ✅ Queries otimizadas para escala
- ✅ Alertas automáticos configurados

### 🗓️ 90 Dias - Módulos Avançados + Governança

| Semana | Tarefa | Prioridade | Esforço |
|--------|--------|------------|---------|
| 9-10 | Módulo RBAC (roles admin) | 🟡 | 24h |
| 10 | Tela de Audit Log para admins | 🟢 | 16h |
| 11 | Migração para normalizar status de jobs | 🟡 | 16h |
| 11 | Implementar Stripe Billing (se aplicável) | 🟢 | 24h |
| 12 | Export GA4 → BigQuery | 🟢 | 8h |
| 12 | Dashboard BI básico (Metabase/Looker) | 🟢 | 16h |

**Entregáveis:**
- ✅ Sistema de permissões completo
- ✅ Visibilidade total de ações admin
- ✅ Dados limpos e normalizados
- ✅ BI operacional funcionando

---

## 🧩 MÓDULOS RECOMENDADOS

### 1. Gestão de Usuários e Permissões (RBAC)
**Valor:** Controle granular de quem pode fazer o quê.
**Complexidade:** Alta
**Dependências:** Firebase Auth com custom claims
**Custo:** R$ 0 (Firebase incluso)
**Dados:** `users.role`, `users.permissions[]`
**Riscos:** Lock-out de admins se mal configurado
**MVP:** 3 roles (superadmin, admin, viewer) com tela de gestão

### 2. Gestão de Profissionais
**Valor:** Visibilidade completa do supply-side.
**Complexidade:** Média
**Dependências:** Firestore, Storage (docs)
**Custo:** R$ 0
**Dados:** `users` (perfil=profissional), `verificacoes`, `documentos`
**Riscos:** LGPD (documentos sensíveis)
**MVP:** Lista, filtros, status de verificação, docs pendentes

### 3. Gestão de Pedidos/Atendimentos (Jobs)
**Valor:** Controle operacional do core business.
**Complexidade:** Média
**Dependências:** Firestore, Stripe
**Custo:** R$ 0
**Dados:** `jobs`, `payment_confirmations`
**Riscos:** Estados inconsistentes
**MVP:** Timeline do job, ações (cancelar, reabrir), SLA visual

### 4. Financeiro/Conciliação
**Valor:** Visibilidade de revenue, chargebacks, repasses.
**Complexidade:** Alta
**Dependências:** Stripe, webhooks, relatórios
**Custo:** R$ 0 (Stripe Dashboard como fallback)
**Dados:** `transacoes`, Stripe API
**Riscos:** Erros de cálculo em take rate
**MVP:** GMV, receita líquida, taxas, chargebacks abertos

### 5. Suporte/Atendimento (Tickets)
**Valor:** SLA de atendimento, priorização.
**Complexidade:** Baixa (já existe)
**Dependências:** Nenhuma
**Custo:** R$ 0
**Dados:** `tickets`
**Riscos:** Backlog infinito
**MVP:** Kanban, prioridade automática, tempo em aberto

### 6. Compliance/LGPD
**Valor:** Evitar multas, transparência.
**Complexidade:** Alta
**Dependências:** Firestore, Storage, processos
**Custo:** R$ 0 (implementação interna)
**Dados:** todos
**Riscos:** Implementação incompleta
**MVP:** Export de dados do usuário, solicitação de exclusão, log de consentimento

### 7. Relatórios e Métricas
**Valor:** Decisões data-driven.
**Complexidade:** Média
**Dependências:** BigQuery (opcional), Metabase
**Custo:** R$ 0 (Looker Studio) ou R$ 100-500/mês (Metabase Cloud)
**Dados:** todos
**Riscos:** Métricas incorretas
**MVP:** Cohort de retenção, CAC, LTV, funil de conversão

### 8. Fraude e Risco
**Valor:** Proteger marketplace de maus atores.
**Complexidade:** Alta
**Dependências:** Rules engine, ML (futuro)
**Custo:** R$ 0 inicial
**Dados:** `users`, `jobs`, `transacoes`
**Riscos:** False positives bloqueando usuários legítimos
**MVP:** Flags manuais, regras básicas (cancelamentos recorrentes)

### 9. Configurações Operacionais
**Valor:** Ops pode ajustar sem deploy.
**Complexidade:** Baixa
**Dependências:** Firestore
**Custo:** R$ 0
**Dados:** `config` (nova coleção)
**Riscos:** Configuração errada quebrando sistema
**MVP:** Feature flags UI, parâmetros de negócio (take rate, etc)

---

## 🔌 INTEGRAÇÕES RECOMENDADAS

### Must-Have (Implementar em 60 dias)

| Integração | Valor | Complexidade | Custo | Alternativa |
|------------|-------|--------------|-------|-------------|
| **Sentry** | Erros em tempo real, stack traces | Baixa | $26/mês | Rollbar, Bugsnag |
| **Upstash Redis** | Cache distribuído, rate limiting | Baixa | Free tier | Vercel KV |
| **Slack Webhooks** | Alertas operacionais | Baixa | R$ 0 | Discord, Teams |

### Nice-to-Have (Implementar em 90+ dias)

| Integração | Valor | Complexidade | Custo | Alternativa |
|------------|-------|--------------|-------|-------------|
| **SendGrid** | E-mail transacional | Baixa | Free tier | AWS SES, Mailgun |
| **BigQuery** | Analytics avançado (GA4 export) | Média | Free tier | - |
| **Metabase** | BI self-service | Média | $85/mês | Looker Studio (free) |
| **WhatsApp Business API** | Notificações | Alta | variável | Twilio, 360dialog |
| **LogRocket** | Replay de sessão | Baixa | $99/mês | FullStory |

### Avaliação Futuro

| Integração | Quando | Por Quê |
|------------|--------|---------|
| **Segment** | +100k usuários | Event pipeline unificado |
| **Zendesk** | +10 tickets/dia | CRM de suporte profissional |
| **Antifraude** | GMV > R$ 500k/mês | Proteger revenue |

---

## ✅ CHECKLIST DE HARDENING E GO-LIVE

### Segurança
- [ ] Remover todas as senhas hardcoded
- [ ] Implementar Firebase Auth ou JWT
- [ ] Auditar e aplicar Firestore Security Rules
- [ ] Remover logs de credenciais
- [ ] Implementar rate limiting em todas as APIs
- [ ] HTTPS enforced (Vercel já faz)
- [ ] CORS configurado corretamente
- [ ] Headers de segurança (CSP, XSS, etc)

### Observabilidade
- [ ] Sentry configurado
- [ ] Alertas Slack para erros críticos
- [ ] Health check automatizado
- [ ] Métricas de latência/throughput
- [ ] Logs estruturados (JSON)

### Performance
- [ ] Cache distribuído (Redis/KV)
- [ ] Paginação em todas as listas
- [ ] Índices Firestore criados
- [ ] Bundle analysis (< 300kb initial)

### Qualidade
- [ ] Testes unitários > 50% coverage em critical paths
- [ ] Testes E2E para fluxo de login
- [ ] TypeScript strict mode
- [ ] ESLint sem warnings

### Operacional
- [ ] Runbook de incidentes
- [ ] Processo de deploy documentado
- [ ] Rollback testado
- [ ] Backup de dados verificado

---

## ❓ PERGUNTAS PENDENTES

1. **Firebase Security Rules:** Onde estão? Posso auditar?
2. **Stripe Webhooks:** Existe endpoint configurado que não vi?
3. **GA4:** É usado apenas para leitura ou também tracking de eventos admin?
4. **Profissionais Verificados:** Qual o fluxo atual de verificação de documentos?
5. **Reembolsos/Disputes:** Qual o processo manual atual?
6. **Ambientes:** Existe ambiente de staging?
7. **CI/CD:** Qual pipeline atual? Testes automatizados no deploy?

---

## 📎 TEMPLATE DE AUDITORIA POR ARQUIVO

Para cada arquivo crítico, usei este template:

```markdown
### [Nome do Arquivo]

**Responsabilidade:** O que o arquivo faz
**Caminho:** `src/...`

#### Problemas e Riscos
1. **[Nome]** - [Descrição]
   - Tipo: bug/anti-pattern/segurança/performance
   - Severidade: 🔴/🟡/🟢

#### Melhorias Propostas
```typescript
// Código atual vs código proposto
```

#### Testes Recomendados
- [ ] Teste unitário: [descrição]
- [ ] Teste integração: [descrição]

#### Definition of Done
- [ ] Código alterado
- [ ] Testes passando
- [ ] Code review feito
- [ ] Deploy em staging
- [ ] Validação em produção
```

---

*Relatório gerado em 24/02/2026 - Auditoria CTO Hardcore v1.0*
