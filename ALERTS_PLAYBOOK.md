# 🚨 Alerts Playbook - Torre v2

Guia de investigação e resolução para todos os alertas da Torre de Controle.

---

## 📋 Índice

1. [Como Usar Este Playbook](#como-usar-este-playbook)
2. [Níveis de Severidade](#níveis-de-severidade)
3. [P0 - Critical Alerts](#p0---critical-alerts)
4. [P1 - High Priority](#p1---high-priority)
5. [P2 - Medium Priority](#p2---medium-priority)
6. [P3 - Low Priority](#p3---low-priority)
7. [Troubleshooting Geral](#troubleshooting-geral)
8. [Escalation Matrix](#escalation-matrix)

---

## 📖 Como Usar Este Playbook

**Quando um alerta dispara:**

1. **Identifique a severidade** (P0/P1/P2/P3)
2. **Localize o alerta** neste playbook
3. **Siga os passos de investigação** na ordem
4. **Execute as ações de resolução** conforme necessário
5. **Documente o incidente** no post-mortem (se P0/P1)
6. **Notifique stakeholders** conforme matriz de escalação

**Estrutura de cada alerta:**
- 🎯 Trigger condition
- 🔍 Investigation steps
- ⚡ Resolution actions
- 📊 Related metrics
- 🔗 Related playbooks

---

## 🚦 Níveis de Severidade

| Nível | Descrição | Response Time | Exemplos |
|-------|-----------|---------------|----------|
| **P0** | Critical - Sistema down ou perda de receita | < 15 min | Integração Firebase down, checkout quebrado |
| **P1** | High - Funcionalidade core afetada | < 1 hora | SLA breach > 90%, churn spike |
| **P2** | Medium - Degradação de experiência | < 4 horas | NPS queda, low utilization |
| **P3** | Low - Impacto mínimo ou informativo | < 24 horas | Threshold approaching, minor optimization |

---

## 🔴 P0 - Critical Alerts

### 🚨 Firebase Connection Failed

**Trigger:** Health check `/api/health/integrations` retorna status `unhealthy` para Firebase.

**Impacto:** 
- Todos os dados indisponíveis
- Dashboard não carrega
- Sistema completamente inoperante

**Investigation:**

```bash
# 1. Check health endpoint
curl https://your-domain.com/api/health/integrations

# 2. Check Vercel logs
vercel logs --follow

# 3. Check Firestore status
# https://status.firebase.google.com/
```

**Common Causes:**
- ❌ Service account credentials inválidas
- ❌ FIREBASE_ADMIN_SDK_B64 incorreta
- ❌ Firestore API desabilitada
- ❌ Quota exceeded
- ❌ Firebase down (rare)

**Resolution:**

```bash
# 1. Verify env vars in Vercel
vercel env ls

# 2. Re-add Firebase credentials
# Option A: Use base64 service account
vercel env add FIREBASE_ADMIN_SDK_B64

# Option B: Use separate vars
vercel env add FIREBASE_PROJECT_ID
vercel env add FIREBASE_CLIENT_EMAIL
vercel env add FIREBASE_PRIVATE_KEY

# 3. Redeploy
vercel --prod

# 4. Verify health
curl https://your-domain.com/api/health/integrations
```

**Escalation:** 
- Immediate: CTO + DevOps
- If unresolved in 30 min: All hands

**Post-Resolution:**
- [ ] Document root cause
- [ ] Update runbook if new issue
- [ ] Schedule post-mortem

---

### 🚨 Stripe Integration Failed

**Trigger:** Payments não processando OR health check retorna `unhealthy` para Stripe.

**Impacto:**
- Novos pagamentos bloqueados
- Perda de receita direta
- Churn involuntário

**Investigation:**

```bash
# 1. Check Stripe dashboard
# https://dashboard.stripe.com/events

# 2. Check health endpoint
curl https://your-domain.com/api/health/integrations

# 3. Check Vercel logs for Stripe errors
vercel logs --filter "stripe"
```

**Common Causes:**
- ❌ API key inválida ou expirada
- ❌ Webhook secret incorreto
- ❌ Stripe account suspended
- ❌ Rate limit exceeded

**Resolution:**

```bash
# 1. Verify API key is correct
# https://dashboard.stripe.com/apikeys

# 2. Update env var
vercel env add STRIPE_SECRET_KEY

# 3. Verify webhook endpoint
# https://dashboard.stripe.com/webhooks

# 4. Redeploy
vercel --prod
```

**Immediate Workaround:**
- Process payments manually via Stripe Dashboard
- Notify customers of temporary issue

**Escalation:**
- Immediate: CTO + Finance team
- Contact Stripe support if account issue

---

### 🚨 MRR Drop > 10%

**Trigger:** MRR caiu mais de 10% comparado ao mês anterior.

**Impacto:**
- Receita em risco
- Burn rate pode acelerar
- Runway reduzido

**Investigation:**

```bash
# 1. Check recent cancellations
curl https://your-domain.com/api/admin/dashboard-v2?period=7d

# 2. Check Stripe dashboard
# https://dashboard.stripe.com/subscriptions?status=canceled

# 3. Analyze churn reasons
# Review cancellation surveys
```

**Common Causes:**
- ❌ High-value customer churned
- ❌ Pricing change backfired
- ❌ Competitor launched aggressive promo
- ❌ Product quality issue
- ❌ Seasonal effect

**Resolution:**

**Immediate actions:**
1. Identify churned customers (last 7 days)
2. Reach out personally to understand why
3. Offer win-back campaign if applicable
4. Review recent product changes

**Short-term (1 week):**
1. Launch retention campaign
2. Offer upgrades/add-ons to existing customers
3. Increase sales/marketing push
4. Review pricing strategy

**Long-term (1 month):**
1. Fix root cause identified
2. Improve onboarding
3. Strengthen customer success
4. Product improvements

**Escalation:**
- Immediate: CEO + CFO
- Daily updates until stabilized

---

### 🚨 SLA Compliance < 80%

**Trigger:** Menos de 80% dos jobs sendo atendidos dentro de 24h.

**Impacto:**
- Clientes insatisfeitos
- Churn risk
- NPS drop
- Breach de contratos SLA

**Investigation:**

```bash
# 1. Check capacity dashboard
curl https://your-domain.com/api/admin/torre/capacity

# 2. Identify bottleneck specialties
curl https://your-domain.com/api/admin/torre/service-desk

# 3. Check professional utilization
# Review demand vs supply ratio
```

**Common Causes:**
- ❌ Undersupply em specialty específica
- ❌ Spike de demanda inesperado
- ❌ Profissionais inativos/férias
- ❌ Matching algorithm ineficiente

**Resolution:**

**Immediate (< 1h):**
1. Identify jobs > 20h pending
2. Manual intervention: reassign ou escalate
3. Contact professionals directly
4. Set expectations com clientes

**Short-term (1 day):**
1. Emergency recruitment para specialty gargalo
2. Incentivos para profissionais aceitarem jobs
3. Relaxar matching criteria temporariamente
4. Comunicar aos clientes afetados

**Long-term (1 week):**
1. Contratar profissionais permanentes
2. Melhorar algoritmo de matching
3. Implementar surge pricing se aplicável
4. Review capacity planning

**Escalation:**
- Immediate: Ops Manager
- If < 75%: CTO + CEO
- Daily standups até resolver

---

## 🟠 P1 - High Priority

### 🟡 Churn Rate > 5%

**Trigger:** Taxa de cancelamento mensal ultrapassou 5%.

**Impacto:**
- Crescimento desacelerado
- LTV/CAC ratio piorado
- Receita em risco

**Investigation:**

```bash
# 1. Check churn dashboard
curl https://your-domain.com/api/admin/dashboard-v2?period=30d

# 2. Segment churn by cohort
# Are new users churning faster?

# 3. Analyze cancellation reasons
# Survey responses, support tickets
```

**Common Causes:**
- ❌ Poor onboarding experience
- ❌ Value not clear to customers
- ❌ Competitor advantage
- ❌ Pricing too high vs perceived value
- ❌ Product bugs/issues

**Resolution:**

**Immediate (1 day):**
1. Contact churned customers (last 7 days)
2. Offer win-back incentive
3. Understand cancellation reason
4. Fix any critical product issues

**Short-term (1 week):**
1. Improve onboarding flow
2. Increase customer touchpoints
3. Proactive customer success outreach
4. Implement churn prediction model

**Long-term (1 month):**
1. Product improvements based on feedback
2. Better customer segmentation
3. Loyalty program
4. Regular NPS surveys

**Related Metrics:**
- NPS
- MAU
- LTV/CAC

**Escalation:**
- 1 hour: Customer Success Lead
- 1 day: VP Growth
- Daily reviews until < 4%

---

### 🟡 NPS < 30

**Trigger:** Net Promoter Score abaixo de 30.

**Impacto:**
- Brand reputation risk
- Churn aumentará
- Organic growth prejudicado
- Referrals diminuem

**Investigation:**

```bash
# 1. Check NPS dashboard
curl https://your-domain.com/api/admin/torre/nps

# 2. Analyze detractor comments
# Review last 50 NPS responses

# 3. Cross-reference with support tickets
# Are there common complaints?
```

**Common Causes:**
- ❌ Recente degradação de serviço
- ❌ Expectativa vs realidade gap
- ❌ Poor customer support
- ❌ Product bugs
- ❌ Competitor doing better

**Resolution:**

**Immediate (1 day):**
1. Personal outreach to all detractors (0-6)
2. Understand their pain points
3. Offer resolution or compensation
4. Fix critical issues raised

**Short-term (1 week):**
1. Address top 3 complaints
2. Improve response time
3. Product quality improvements
4. Training for customer-facing teams

**Long-term (1 month):**
1. Systematic feedback loop
2. Quarterly NPS surveys
3. Close the loop: Show customers we listened
4. Convert passives (7-8) to promoters (9-10)

**Target:** NPS > 50 within 60 days

**Escalation:**
- 1 day: Product Manager + Customer Success
- 1 week: CEO review

---

### 🟡 GA4 Integration Degraded

**Trigger:** Health check retorna `degraded` para GA4.

**Impacto:**
- Funnel analysis indisponível
- Growth metrics imprecisos
- Marketing optimization prejudicado

**Investigation:**

```bash
# 1. Check health endpoint
curl https://your-domain.com/api/health/integrations

# 2. Test GA4 Data API manually
# https://console.cloud.google.com/apis/api/analyticsdata.googleapis.com

# 3. Check quota usage
# https://console.cloud.google.com/apis/api/analyticsdata.googleapis.com/quotas
```

**Common Causes:**
- ❌ Service account permissions revoked
- ❌ API quota exceeded
- ❌ Property ID incorreto
- ❌ Data API desabilitada

**Resolution:**

```bash
# 1. Verify service account has Viewer role
# https://analytics.google.com/analytics/web/#/a{ACCOUNT}/p{PROPERTY}/admin/access-management

# 2. Check Data API is enabled
gcloud services enable analyticsdata.googleapis.com

# 3. Update env vars if needed
vercel env add GA4_PROPERTY_ID

# 4. Redeploy
vercel --prod
```

**Workaround:** GA4 é opcional. Dashboard funcionará sem essa integração, mas funnel analysis ficará indisponível.

**Escalation:**
- 4 hours: Growth team notified
- 1 day: Resolve ou disable feature flag

---

### 🟡 Low Professional Utilization (< 50%)

**Trigger:** Taxa de utilização dos profissionais abaixo de 50%.

**Impacto:**
- Profissionais inativos podem sair da plataforma
- Custo fixo alto vs receita
- Oversupply = desperdício

**Investigation:**

```bash
# 1. Check capacity dashboard
curl https://your-domain.com/api/admin/torre/capacity

# 2. Segment by specialty
# Are all specialties underutilized?

# 3. Check demand trends
# Is demand dropping or supply increased?
```

**Common Causes:**
- ❌ Seasonal low demand
- ❌ Over-hiring de profissionais
- ❌ Profissionais não aceitando jobs
- ❌ Matching ineficiente

**Resolution:**

**Immediate (1 day):**
1. Review inactive professionals
2. Communicate availability expectations
3. Off-board professionals não engajados

**Short-term (1 week):**
1. Increase marketing para gerar demand
2. Cross-train professionals em specialties com demand
3. Adjust matching algorithm
4. Promotional campaigns

**Long-term (1 month):**
1. Better capacity planning
2. Seasonal hiring strategy
3. Flexible pricing (dynamic pricing)

**Target:** Utilization 60-80%

**Escalation:**
- 1 week: Ops Manager
- If trend continues 2 weeks: VP Operations

---

## 🟡 P2 - Medium Priority

### 🟢 Conversion Rate Drop (> 10%)

**Trigger:** Taxa de conversão em qualquer etapa do funnel caiu mais de 10%.

**Impacto:**
- Menos customers
- CAC aumenta
- Growth desacelerado

**Investigation:**

```bash
# 1. Check funnel dashboard
curl https://your-domain.com/api/admin/torre/funnel-analysis?period=30d

# 2. Compare with previous period
# Identify which step dropped

# 3. Review recent changes
# Product releases, marketing changes
```

**Common Causes:**
- ❌ Recent product change
- ❌ Landing page A/B test lost
- ❌ Competitor campaign
- ❌ Seasonal effect
- ❌ Technical bug

**Resolution:**

**Immediate (4 hours):**
1. Rollback recent product changes se houver
2. Check for technical bugs (JS errors, broken forms)
3. Review user session recordings (Hotjar/FullStory)

**Short-term (1 week):**
1. A/B test variations
2. Simplify onboarding flow
3. Improve messaging/copy
4. Add social proof

**Long-term (1 month):**
1. Continuous A/B testing program
2. User research interviews
3. Personalization based on segment

**Escalation:**
- 1 day: Growth PM
- 1 week: VP Product if unresolved

---

### 🟢 Payment Failure Rate > 5%

**Trigger:** Mais de 5% dos payments falhando.

**Impacto:**
- Involuntary churn
- Revenue loss
- Poor customer experience

**Investigation:**

```bash
# 1. Check Stripe dashboard
# https://dashboard.stripe.com/payments?status=failed

# 2. Analyze failure reasons
# Insufficient funds, card expired, declined

# 3. Check retry logic
# Are we retrying failed payments?
```

**Common Causes:**
- ❌ Credit card expired
- ❌ Insufficient funds
- ❌ Bank fraud detection
- ❌ Incorrect billing info

**Resolution:**

**Immediate (4 hours):**
1. Email customers com payment falhado
2. Provide update payment method link
3. Grace period antes de downgrade/cancel

**Short-term (1 week):**
1. Implement Stripe Smart Retries
2. Pre-expiration card update emails
3. Alternative payment methods
4. Better billing communication

**Long-term (1 month):**
1. Dunning management system
2. Backup payment methods
3. Payment optimization

**Target:** < 2% failure rate

**Escalation:**
- 1 day: Finance team
- 1 week: Engineering if technical issue

---

### 🟢 Response Rate < 20%

**Trigger:** Menos de 20% dos usuários respondendo pesquisas NPS/feedback.

**Impacto:**
- Dados imprecisos
- Não conseguimos identificar problemas
- Product decisions sem contexto

**Investigation:**

```bash
# 1. Check NPS dashboard
curl https://your-domain.com/api/admin/torre/nps

# 2. Review survey timing
# When are we asking for feedback?

# 3. Check email open rates
# Are emails sendo entregues?
```

**Common Causes:**
- ❌ Survey muito longa
- ❌ Timing ruim (durante onboarding)
- ❌ Falta de incentivo
- ❌ Email indo para spam

**Resolution:**

**Short-term (1 week):**
1. Simplify survey (1 question + comment)
2. Optimize timing (após job completo)
3. A/B test messaging
4. Add incentive (desconto pequeno)

**Long-term (1 month):**
1. In-app surveys além de email
2. Gamification
3. Close the loop: Show impact of feedback

**Target:** > 30% response rate

**Escalation:**
- 2 weeks: Product Manager

---

## 🔵 P3 - Low Priority

### 🔵 MAU Growth < 5%

**Trigger:** Crescimento de Monthly Active Users abaixo de 5%.

**Impacto:**
- Growth desacelerado
- Targets não atingidos
- Investors concern

**Investigation:**

```bash
# 1. Check growth dashboard
curl https://your-domain.com/api/admin/torre/growth

# 2. Analyze acquisition channels
# Which channels declining?

# 3. Check activation rate
# Are new sign-ups becoming active?
```

**Resolution:**

**Short-term (2 weeks):**
1. Increase marketing spend
2. Referral program
3. Content marketing
4. Partnerships

**Long-term (1 month):**
1. Product-led growth initiatives
2. Viral loops
3. SEO optimization
4. Community building

**Escalation:**
- 2 weeks: Growth team review
- 1 month: Strategy session with CEO

---

### 🔵 CAC Increasing (> 10%)

**Trigger:** Customer Acquisition Cost aumentou mais de 10%.

**Impacto:**
- LTV/CAC ratio piorado
- Unit economics arriscados
- Menos budget para contratar

**Investigation:**

```bash
# 1. Check finance dashboard
curl https://your-domain.com/api/admin/financeiro

# 2. Analyze marketing spend
# Which channels became more expensive?

# 3. Check conversion rates
# Lower conversion = higher CAC
```

**Resolution:**

**Short-term (2 weeks):**
1. Pause underperforming channels
2. Optimize ad creative/targeting
3. Improve landing pages
4. Increase organic channels

**Long-term (1 month):**
1. Content marketing strategy
2. SEO investment
3. Referral program
4. Product-led growth

**Target:** CAC < R$ 50

**Escalation:**
- 2 weeks: Marketing lead
- 1 month: CFO review

---

## 🛠️ Troubleshooting Geral

### Dashboard Não Carrega

**Checklist:**

```bash
# 1. Check health endpoint
curl https://your-domain.com/api/health/integrations

# 2. Check browser console
# Open DevTools → Console tab

# 3. Check network tab
# Are API calls returning 200?

# 4. Check Vercel status
# https://www.vercel-status.com/

# 5. Check Firebase status
# https://status.firebase.google.com/
```

**Common Issues:**
- [ ] Feature flag disabled
- [ ] API rate limited
- [ ] Browser cache issue (hard refresh)
- [ ] CORS error (check domains)

---

### API Retornando 500

**Investigation:**

```bash
# 1. Check Vercel logs
vercel logs --follow

# 2. Check error tracking
# Browser console → Application → __errorTracking

# 3. Reproduce locally
npm run dev

# 4. Check recent deploys
vercel ls
```

**Common Causes:**
- [ ] Env var missing
- [ ] Integration timeout
- [ ] Invalid data format
- [ ] Rate limit exceeded

---

### Feature Flag Not Working

**Investigation:**

```javascript
// In browser console
window.__featureFlags.getStatus()
window.__featureFlags.enable('TORRE_V2')
window.__featureFlags.disable('TORRE_V2')
```

**Common Issues:**
- [ ] Env var não definida
- [ ] Cache issue (clear browser cache)
- [ ] Need redeploy após mudar env var

---

## 📞 Escalation Matrix

### P0 - Critical

| Time | Action | Who |
|------|--------|-----|
| 0 min | Alert fires | Slack #alerts-critical |
| 15 min | Incident declared | On-call engineer |
| 30 min | Status page updated | DevOps |
| 30 min | Escalate if unresolved | CTO + CEO |
| 60 min | All hands on deck | Everyone |
| 2 hours | External communication | Customer success → clients |

### P1 - High

| Time | Action | Who |
|------|--------|-----|
| 0 min | Alert fires | Slack #alerts-high |
| 1 hour | Assign owner | Team lead |
| 4 hours | Escalate if unresolved | Director |
| 1 day | Executive review | VP/C-level |

### P2 - Medium

| Time | Action | Who |
|------|--------|-----|
| 0 min | Alert fires | Slack #alerts |
| 4 hours | Triage and assign | Team lead |
| 1 week | Review if unresolved | Manager |

### P3 - Low

| Time | Action | Who |
|------|--------|-----|
| 0 min | Alert fires | Slack #alerts |
| 24 hours | Review in standup | Team |
| 2 weeks | Escalate if trend | Manager |

---

## 📝 Post-Incident Template

**Para todos os P0 e P1:**

```markdown
# Incident Report: [Title]

**Date:** YYYY-MM-DD
**Duration:** Xh Xm
**Severity:** P0/P1
**Impact:** [Users/Revenue affected]

## Timeline
- HH:MM - Alert fired
- HH:MM - Investigation started
- HH:MM - Root cause identified
- HH:MM - Fix deployed
- HH:MM - Verified resolved

## Root Cause
[What happened and why]

## Resolution
[What fixed it]

## Action Items
- [ ] Action 1 (Owner: Name, Due: Date)
- [ ] Action 2 (Owner: Name, Due: Date)

## Lessons Learned
- What went well?
- What can improve?
- Process changes?
```

---

## 📚 Related Documentation

- [METRICS_GLOSSARY.md](./METRICS_GLOSSARY.md) - Definições de métricas
- [INTEGRATIONS.md](./INTEGRATIONS.md) - Setup de integrações
- [OBSERVABILITY.md](./OBSERVABILITY.md) - Sistema de logs e monitoring
- [API_REFERENCE.md](./API_REFERENCE.md) - Documentação das APIs

---

## 🆘 Emergency Contacts

**On-Call Rotation:**
- Week 1: [Name] - [Phone]
- Week 2: [Name] - [Phone]

**Key Contacts:**
- CTO: [Email/Phone]
- DevOps Lead: [Email/Phone]
- Customer Success: [Email/Phone]

**External Support:**
- Vercel Support: support@vercel.com
- Firebase Support: https://firebase.google.com/support
- Stripe Support: https://support.stripe.com/
