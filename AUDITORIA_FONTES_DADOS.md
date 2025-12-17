# Auditoria de Fontes de Dados - CMD Painel

## 📊 Mapeamento Correto por Fonte

### ✅ STRIPE (Pagamentos e Assinaturas)
**Deve vir da API do Stripe:**
- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)
- Assinaturas ativas/canceladas
- Quick Ratio (New MRR / Churned MRR)
- NRR (Net Revenue Retention)
- Burn Rate (se baseado em payouts)
- Runway (se baseado em balance)
- Status de contas Stripe Connect
- Transações/Charges
- Refunds

**Arquivos:**
- ✅ `src/services/admin/financeiro-v2/index.ts` - OK (usa Stripe)
- ✅ `src/services/admin/control-tower/finance.ts` - OK (usa Stripe)
- ✅ `src/services/admin/users/listUsers.ts` - OK (status Stripe Connect)
- ✅ `src/services/admin/stripeService.ts` - OK (serviço dedicado)

---

### ✅ GOOGLE ANALYTICS 4 (Tráfego e Comportamento)
**Deve vir da API do GA4:**
- Usuários ativos (activeUsers)
- Novos usuários (newUsers)
- Sessões
- Pageviews / Screen Page Views
- Taxa de rejeição (bounceRate)
- Duração média de sessão
- Usuários por dispositivo (desktop/mobile/tablet)
- Top páginas visitadas
- **📈 Visualizações diárias (gráfico)**

**Arquivos:**
- ✅ `src/services/admin/analyticsService.ts` - OK (serviço GA4)
- ✅ `src/services/admin/control-tower/index.ts` - OK (usa analyticsService)
- ✅ `src/app/api/admin/daily-metrics/route.ts` - OK (usa GA4 para views)

---

### ✅ FIREBASE FIRESTORE (Dados Operacionais)
**Deve vir do Firestore:**
- **Users:**
  - Total de usuários
  - Cadastros por dia
  - Perfil (profissional/cliente)
  - Dados de perfil (nome, email, especialidade)
  - Data de criação (createdAt)
  
- **Jobs (antigas "requests"):**
  - Solicitações/agendamentos
  - Status (pendente, aceito, recusado, cancelado, etc)
  - clientId / specialistId
  - Datas (createdAt, acceptedAt, etc)
  - SLA de atendimento
  
- **Feedbacks/Ratings:**
  - Avaliações
  - Satisfação
  
- **Tickets:**
  - Service Desk
  - Problemas reportados
  
- **Alerts:**
  - Alertas de qualidade
  - Alertas de risco

**Arquivos usando Firebase (CORRETO):**
- ✅ `src/services/admin/operational-health/` - OK
- ✅ `src/services/admin/growth/` - OK
- ✅ `src/services/admin/pipeline-v2/` - OK
- ✅ `src/services/admin/alerts/` - OK
- ✅ `src/services/admin/torre/` - OK
- ✅ `src/services/admin/users/` - OK
- ✅ `src/app/api/admin/daily-metrics/route.ts` - OK (cadastros do Firebase)

---

## 🔍 Verificações Necessárias

### ❓ Dados que podem estar MISTURADOS ou ERRADOS:

1. **Growth / Acquisition:**
   - Usar GA4 para tráfego e origem
   - Usar Firebase para conversões (cadastros)
   
2. **Conversion Funnel:**
   - Landing Page Views → GA4
   - Sign-ups → Firebase
   - First Job → Firebase
   - Conversão → Firebase

3. **Operational Health:**
   - SLA, matches, profissionais → Firebase ✅
   - Não deve ter dados de Stripe aqui

---

## 🎯 Ação Necessária

Verificar se há algum serviço que:
1. Busca dados financeiros do Firebase (deveria ser Stripe)
2. Busca métricas de tráfego do Firebase (deveria ser GA4)
3. Busca dados operacionais do Stripe (deveria ser Firebase)

## ✅ Correções Aplicadas

1. **Growth/Acquisition Service** - CORRIGIDO
   - Antes: Usava `users.length` como visitantes (errado)
   - Depois: Busca visitantes do GA4 + cadastros do Firebase
   - Arquivo: `src/services/admin/growth/acquisition.ts`

2. **Daily Metrics API** - CORRIGIDO
   - Antes: Tentava buscar visualizações do Firebase events
   - Depois: Busca visualizações do GA4 + cadastros do Firebase
   - Arquivo: `src/app/api/admin/daily-metrics/route.ts`

## ⚠️ Dados Estimados (Placeholders que ainda existem)

Estes são **cálculos estimados** quando dados reais não estão disponíveis:

1. **Control Tower - Burn Rate Fallback**
   - Se não conseguir dados reais de payouts do Stripe
   - Estima como 70% do MRR
   - Flag: `isMock: true`

2. **Control Tower - Runway Fallback**
   - Se não conseguir saldo real do Stripe
   - Estima baseado em MRR
   - Flag: `isMock: true`

3. **Operational Health - Response Time**
   - Fixo em 12h (TODO: implementar tracking real)
   
4. **Operational Health - Availability**
   - Estimado (TODO: implementar tracking real)

5. **Growth - Revenue Score**
   - Placeholder: 75 (TODO: integrar com Financeiro 2.0)

6. **Growth - Referral Score**
   - Placeholder: 60 (TODO: implementar tracking de referrals)

7. **Pipeline V2 - ROI Calculation**
   - Estimado (mock)

8. **Reports - Mock Implementation**
   - Sistema de reports usa dados simulados temporários
   - Requer refatoração completa

## Status: ✅ FONTES PRINCIPAIS CORRIGIDAS
- Stripe → Dados financeiros ✅
- GA4 → Dados de tráfego ✅  
- Firebase → Dados operacionais ✅
