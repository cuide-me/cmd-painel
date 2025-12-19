# 🚀 Rollout Plan - Torre v2

Plano de deployment controlado com feature flags para minimizar riscos.

---

## 📋 Pré-requisitos

### 1. Configuração Completa

**Obrigatório:**
- [x] Firebase configurado e testado
- [x] Feature flags implementados
- [x] Logging e error tracking ativos
- [x] Health check endpoint funcionando
- [x] Documentação completa

**Opcional (pode ser ativado depois):**
- [ ] Google Analytics 4 configurado
- [ ] Stripe configurado

### 2. Testes Executados

```bash
# Rodar todos os testes
npm test

# Testes de integração
npm run test:integrations

# Verificar saúde do sistema
npm run check:health
```

### 3. Checklist de Deploy

- [ ] Todas as env vars configuradas no Vercel
- [ ] Build local passou sem erros
- [ ] Testes unitários passando
- [ ] Testes de integração passando
- [ ] Health check retorna 200
- [ ] Feature flags configuradas corretamente

---

## 🎯 Estratégia de Rollout

### Phase 1: Staging (Internal Testing) - 1 dia

**Objetivo:** Validar em ambiente de staging antes de produção.

**Steps:**

1. **Deploy to Staging**
   ```bash
   # Deploy para ambiente de staging
   vercel --env=staging
   ```

2. **Configurar Feature Flags**
   ```bash
   # No Vercel dashboard (staging)
   FEATURE_TORRE_V2=true
   FEATURE_FIREBASE=true
   FEATURE_GA4=false      # Opcional
   FEATURE_STRIPE=false   # Opcional
   ```

3. **Smoke Tests**
   - [ ] Login funciona
   - [ ] Dashboard principal carrega
   - [ ] Dashboard v2 carrega
   - [ ] Health check retorna healthy
   - [ ] Logs aparecem corretamente

4. **Internal QA**
   - [ ] CEO/CTO testam dashboard
   - [ ] Finance team valida métricas
   - [ ] Ops team valida operações
   - [ ] Quality team valida NPS

**Critérios de Sucesso:**
- ✅ Zero erros críticos
- ✅ Performance aceitável (< 3s load time)
- ✅ Dados corretos comparados com versão antiga
- ✅ Aprovação do time interno

---

### Phase 2: Production - Soft Launch (Internal Only) - 2-3 dias

**Objetivo:** Deploy em produção mas acesso restrito.

**Steps:**

1. **Deploy to Production**
   ```bash
   vercel --prod
   ```

2. **Feature Flags - Desabilitado por padrão**
   ```bash
   # No Vercel dashboard (production)
   FEATURE_TORRE_V2=false   # Desabilitado inicialmente
   FEATURE_FIREBASE=true
   FEATURE_GA4=false
   FEATURE_STRIPE=false
   ```

3. **Ativar via Runtime Override (apenas para admins)**
   ```javascript
   // No browser console (somente admins conhecem)
   window.__featureFlags.enable('TORRE_V2')
   ```

4. **Monitoramento Intensivo**
   - [ ] Setup alertas no Vercel
   - [ ] Monitorar logs em tempo real
   - [ ] Dashboard de métricas aberto
   - [ ] Health checks a cada 5 minutos

**Critérios de Sucesso:**
- ✅ Funciona em produção sem erros
- ✅ Performance igual ou melhor que staging
- ✅ Dados consistentes
- ✅ 2-3 dias sem incidentes

---

### Phase 3: Beta Rollout (10% de usuários) - 1 semana

**Objetivo:** Expor para pequeno grupo de usuários reais.

**Steps:**

1. **Gradual Rollout**
   ```bash
   # Ativar para 10% dos usuários
   FEATURE_TORRE_V2=true
   FEATURE_TORRE_V2_ROLLOUT_PERCENTAGE=10
   ```

2. **Selecionar Beta Users**
   - Usuários internos (CEO, CTO, Finance team)
   - Power users (usuários mais engajados)
   - Mix de perfis (diferentes especialidades)

3. **Coletar Feedback**
   - [ ] Survey de satisfação
   - [ ] Entrevistas com beta users
   - [ ] Analytics de uso (GA4)
   - [ ] Error tracking

4. **Monitorar Métricas**
   - Page load time
   - Error rate
   - User engagement
   - Bounce rate

**Critérios de Sucesso:**
- ✅ Error rate < 1%
- ✅ Feedback positivo (> 80%)
- ✅ Nenhum bug crítico reportado
- ✅ Métricas melhores ou iguais à v1

---

### Phase 4: Gradual Rollout (50% → 100%) - 1-2 semanas

**Objetivo:** Rollout completo para todos os usuários.

**Steps:**

1. **50% Rollout** (Semana 1)
   ```bash
   FEATURE_TORRE_V2_ROLLOUT_PERCENTAGE=50
   ```
   - Monitorar por 3-4 dias
   - Comparar métricas entre grupos
   - A/B testing implícito

2. **75% Rollout** (Semana 1.5)
   ```bash
   FEATURE_TORRE_V2_ROLLOUT_PERCENTAGE=75
   ```
   - Monitorar por 2-3 dias
   - Últimas otimizações

3. **100% Rollout** (Semana 2)
   ```bash
   FEATURE_TORRE_V2=true
   FEATURE_TORRE_V2_ROLLOUT_PERCENTAGE=100
   ```
   - Torre v2 agora é padrão
   - v1 pode ser desativada

**Critérios de Sucesso:**
- ✅ Nenhum aumento em churn
- ✅ Métricas de engagement iguais ou melhores
- ✅ Feedback positivo
- ✅ Time está confortável

---

### Phase 5: Optional Integrations - Conforme necessidade

**GA4 (Opcional):**
```bash
# Quando precisar de funnel analysis
FEATURE_GA4=true
GA4_PROPERTY_ID=your_property_id
```

**Stripe (Opcional):**
```bash
# Quando precisar de dados financeiros avançados
FEATURE_STRIPE=true
STRIPE_SECRET_KEY=sk_live_...
```

---

## 🔄 Rollback Plan

**Se algo der errado em qualquer fase:**

### Quick Rollback (< 1 minuto)

```bash
# Desabilitar Torre v2 imediatamente
FEATURE_TORRE_V2=false
```

Isso reverte para a versão antiga sem precisar fazer redeploy.

### Full Rollback (< 5 minutos)

```bash
# Reverter deploy no Vercel
vercel rollback
```

### Triggers para Rollback

**Rollback imediato se:**
- Error rate > 5%
- Page load time > 5 segundos
- Health check falha
- Bug crítico que impede uso

**Considerar rollback se:**
- Feedback negativo consistente
- Error rate > 2%
- Performance degradou
- Churn aumentou

---

## 📊 Métricas de Sucesso

### Performance

| Métrica | Target | Critical Threshold |
|---------|--------|-------------------|
| Page Load Time | < 2s | > 5s |
| Time to Interactive | < 3s | > 6s |
| API Response Time | < 500ms | > 2s |

### Reliability

| Métrica | Target | Critical Threshold |
|---------|--------|-------------------|
| Error Rate | < 0.5% | > 2% |
| Uptime | > 99.9% | < 99% |
| Health Check Success | 100% | < 95% |

### User Experience

| Métrica | Target | Critical Threshold |
|---------|--------|-------------------|
| NPS | > 50 | < 30 |
| Bounce Rate | < 20% | > 40% |
| User Feedback | > 80% positive | < 60% positive |

---

## 🚨 Incident Response

### P0 - Critical (Production Down)

**Response Time:** < 15 minutes

**Actions:**
1. Immediate rollback via feature flag
2. Notify CEO + CTO via Slack
3. All hands on deck
4. Post-mortem required

### P1 - High (Major Feature Broken)

**Response Time:** < 1 hour

**Actions:**
1. Investigate root cause
2. Fix or rollback
3. Notify affected users
4. Post-mortem recommended

### P2 - Medium (Minor Issue)

**Response Time:** < 4 hours

**Actions:**
1. Create ticket
2. Fix in next deploy
3. Document in changelog

---

## 📅 Timeline Estimado

| Phase | Duration | Date Range (Exemplo) |
|-------|----------|---------------------|
| Staging | 1 dia | Dec 20 |
| Soft Launch | 2-3 dias | Dec 21-23 |
| Beta (10%) | 1 semana | Dec 24-30 |
| 50% Rollout | 3-4 dias | Dec 31 - Jan 3 |
| 75% Rollout | 2-3 dias | Jan 4-6 |
| 100% Rollout | - | Jan 7 |
| **Total** | **~2-3 semanas** | **Dec 20 - Jan 7** |

---

## ✅ Go/No-Go Checklist

**Before Each Phase:**

- [ ] Previous phase completed successfully
- [ ] All tests passing
- [ ] Monitoring in place
- [ ] Team is available for support
- [ ] Rollback plan tested
- [ ] Stakeholders informed

**Red Flags (Do NOT proceed):**

- ❌ Tests failing
- ❌ Health check unhealthy
- ❌ Critical bugs unresolved
- ❌ Team unavailable (holidays, weekend)
- ❌ Other major incidents ongoing

---

## 📞 Communication Plan

### Internal Communication

**Daily Standups durante rollout:**
- Status update
- Metrics review
- Issues encountered
- Next steps

**Channels:**
- #torre-v2-rollout (Slack)
- Daily email summary
- Dashboard compartilhado

### External Communication

**To Users (se necessário):**
- [ ] Announcement: "Nova versão do dashboard"
- [ ] Release notes
- [ ] Tutorial/walkthrough
- [ ] Support contact

---

## 🎓 Training

**Before 100% rollout:**

1. **Admin Team Training**
   - [ ] Walkthrough da nova interface
   - [ ] Como interpretar novas métricas
   - [ ] Troubleshooting comum

2. **Documentation**
   - [ ] User guide atualizado
   - [ ] Video tutorials
   - [ ] FAQ

3. **Support Preparation**
   - [ ] Support team treinado
   - [ ] Scripts de resposta prontos
   - [ ] Escalation process definido

---

## 📚 Post-Rollout

**After 100% rollout:**

1. **Retrospective**
   - [ ] O que funcionou bem?
   - [ ] O que pode melhorar?
   - [ ] Lições aprendidas

2. **Documentation**
   - [ ] Update runbooks
   - [ ] Document known issues
   - [ ] Update training materials

3. **Cleanup**
   - [ ] Remove código v1 obsoleto
   - [ ] Archive documentação antiga
   - [ ] Celebrate success! 🎉

---

## 🔗 Related Documentation

- [INTEGRATIONS.md](./INTEGRATIONS.md) - Setup das integrações
- [ALERTS_PLAYBOOK.md](./ALERTS_PLAYBOOK.md) - Como responder a alertas
- [OBSERVABILITY.md](./OBSERVABILITY.md) - Sistema de monitoring
- [API_REFERENCE.md](./API_REFERENCE.md) - Documentação das APIs
