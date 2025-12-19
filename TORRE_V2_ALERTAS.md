# 🚨 TORRE V2 - SISTEMA DE ALERTAS INTELIGENTES

**Data:** 2024-12-18  
**Status:** Em Definição  
**Baseado em:** TORRE_V2_KPIS.md + TORRE_V2_FUNIS.md

---

## 🎯 OBJETIVOS DO SISTEMA DE ALERTAS

1. **Identificar problemas antes que se tornem críticos**
2. **Priorizar ações com maior impacto no negócio**
3. **Fornecer contexto e ações recomendadas**
4. **Evitar alert fatigue (alertas demais)**
5. **Rastreabilidade (histórico de alertas e ações)**

---

## 📊 CATEGORIAS DE ALERTAS

### 🔴 CRÍTICOS (Ação Imediata)
**SLA:** Resolver em <2h  
**Notificação:** Email + SMS + Slack  
**Escalonamento:** Auto após 2h sem ação

### 🟡 ATENÇÃO (Monitorar)
**SLA:** Revisar em <24h  
**Notificação:** Email + Slack  
**Escalonamento:** Manual

### 🟢 INFORMATIVOS
**SLA:** N/A  
**Notificação:** Dashboard apenas  
**Escalonamento:** N/A

---

## 🚨 ALERTAS CRÍTICOS (VERMELHO)

### 1. Churn Rate Elevado
**Condição:**
```typescript
const churnRate = (canceledSubs / totalActiveSubs) * 100;
if (churnRate > 5) {
  createAlert({
    severity: 'critical',
    category: 'financial',
    title: 'Taxa de Churn Crítica',
    description: `Churn de ${churnRate.toFixed(1)}% no mês (meta: <5%)`,
    impact: 'high',
    affectedMetric: 'MRR',
    estimatedLoss: canceledMRR,
  });
}
```

**Impacto:**
- Perda de MRR
- Redução de LTV
- Indicador de problemas de produto/serviço

**Ações Recomendadas:**
1. Ligar para clientes que cancelaram (Win-back call)
2. Identificar padrão comum (NPS baixo? Ticket não resolvido?)
3. Oferecer desconto/crédito para reativação
4. Ajustar produto com base no feedback

**Dados Necessários:**
- Stripe: `subscriptions.list({ status: 'canceled' })`
- Firebase: Feedbacks dos clientes que cancelaram
- Firebase: Tickets abertos antes do cancelamento

---

### 2. SLA de Atendimento Quebrado
**Condição:**
```typescript
const jobsWithBrokenSLA = await db.collection('jobs')
  .where('status', '==', 'open')
  .where('createdAt', '<', twentyFourHoursAgo)
  .get();

if (jobsWithBrokenSLA.size > 10) {
  createAlert({
    severity: 'critical',
    category: 'operational',
    title: `${jobsWithBrokenSLA.size} Solicitações sem Match há >24h`,
    description: 'SLA de atendimento quebrado',
    impact: 'high',
    affectedMetric: 'Customer Satisfaction',
    affectedUsers: jobsWithBrokenSLA.docs.map(d => d.data().clientId),
  });
}
```

**Impacto:**
- Clientes insatisfeitos
- Risco de cancelamento
- Reputação da marca

**Ações Recomendadas:**
1. Notificar profissionais disponíveis manualmente
2. Oferecer bônus para aceite urgente
3. Contato CS proativo com clientes afetados
4. Revisar disponibilidade de profissionais

**Dados Necessários:**
- Firebase: `jobs` com status 'open' e createdAt antigo
- Firebase: Profissionais disponíveis por specialty

---

### 3. NPS Baixo com Múltiplos Detratores
**Condição:**
```typescript
const recentFeedbacks = await db.collection('feedbacks')
  .where('createdAt', '>=', last7Days)
  .get();

const detractors = recentFeedbacks.docs.filter(d => d.data().rating <= 6);

if (detractors.length >= 5) {
  createAlert({
    severity: 'critical',
    category: 'quality',
    title: `${detractors.length} Avaliações Negativas na Última Semana`,
    description: 'NPS crítico - ação imediata necessária',
    impact: 'high',
    affectedMetric: 'NPS',
  });
}
```

**Impacto:**
- Reputação
- Churn futuro
- Indicador de problemas operacionais

**Ações Recomendadas:**
1. CS ligar para cada detrator em 24h
2. Oferecer compensação (crédito, desconto)
3. Investigar causa raiz (profissional? processo? produto?)
4. Criar plano de ação corretiva

**Dados Necessários:**
- Firebase: `feedbacks` com rating baixo
- Firebase: Jobs associados aos feedbacks
- Firebase: Profissionais envolvidos

---

### 4. Runway Crítico (<6 meses)
**Condição:**
```typescript
const balance = await stripe.balance.retrieve();
const availableBalance = balance.available[0].amount / 100;
const monthlyBurnRate = Math.abs(await calculateBurnRate());
const runway = availableBalance / monthlyBurnRate;

if (runway < 6) {
  createAlert({
    severity: 'critical',
    category: 'financial',
    title: `Runway de ${runway.toFixed(1)} Meses`,
    description: 'Caixa crítico - ação urgente necessária',
    impact: 'critical',
    affectedMetric: 'Cash Flow',
  });
}
```

**Impacto:**
- Risco de falta de caixa
- Necessidade de captação urgente
- Possível redução de operações

**Ações Recomendadas:**
1. Reunião executiva emergencial
2. Plano de redução de custos
3. Acelerar captação de investimento
4. Avaliar linhas de crédito

**Dados Necessários:**
- Stripe: Balance
- Stripe: Receita mensal
- Stripe: Despesas mensais (payouts)

---

### 5. Burn Rate Negativo Acelerado
**Condição:**
```typescript
const currentBurnRate = await calculateBurnRate();
const previousBurnRate = await calculateBurnRate(lastMonth);

if (currentBurnRate < 0 && currentBurnRate < previousBurnRate * 1.3) {
  createAlert({
    severity: 'critical',
    category: 'financial',
    title: 'Burn Rate Acelerado',
    description: `Queimando ${Math.abs(currentBurnRate).toFixed(0)}/mês (+30% vs mês anterior)`,
    impact: 'high',
    affectedMetric: 'Runway',
  });
}
```

**Impacto:**
- Runway reduzido
- Risco de falta de caixa antecipado

**Ações Recomendadas:**
1. Identificar novos custos
2. Revisar payouts (suspeita de fraude?)
3. Negociar com fornecedores
4. Acelerar crescimento de receita

---

### 6. Taxa de Abandono Pós-Aceite Elevada
**Condição:**
```typescript
const abandonmentRate = await calculatePostAcceptAbandonmentRate();

if (abandonmentRate > 20) {
  createAlert({
    severity: 'critical',
    category: 'operational',
    title: `${abandonmentRate.toFixed(1)}% de Abandono Pós-Aceite`,
    description: 'Profissionais ou famílias desistindo após match',
    impact: 'high',
    affectedMetric: 'Conversion Rate',
  });
}
```

**Impacto:**
- Perda de receita
- Frustração de clientes
- Desperdício de operação

**Ações Recomendadas:**
1. Entrevistar profissionais que desistiram
2. Entrevistar famílias afetadas
3. Revisar processo de match (expectativas alinhadas?)
4. Melhorar onboarding pós-aceite

---

## 🟡 ALERTAS DE ATENÇÃO (AMARELO)

### 1. Taxa de Conversão Abaixo da Meta
**Condição:**
```typescript
const conversionRate = (payingUsers / signups) * 100;
if (conversionRate < 12) { // meta: 15%
  createAlert({
    severity: 'warning',
    category: 'growth',
    title: `Taxa de Conversão em ${conversionRate.toFixed(1)}%`,
    description: 'Abaixo da meta de 15%',
    impact: 'medium',
  });
}
```

**Ações:**
- Revisar funil de conversão
- Identificar etapa com maior drop
- Testar melhorias (A/B test)

---

### 2. Tickets Não Respondidos >48h
**Condição:**
```typescript
const agedTickets = await db.collection('tickets')
  .where('status', '==', 'open')
  .where('createdAt', '<', fortyEightHoursAgo)
  .get();

if (agedTickets.size > 0) {
  createAlert({
    severity: 'warning',
    category: 'quality',
    title: `${agedTickets.size} Tickets sem Resposta há >48h`,
  });
}
```

**Ações:**
- Distribuir tickets para CS
- Priorizar por gravidade
- Responder mesmo que sem solução (acknowledge)

---

### 3. Disponibilidade de Profissionais Baixa
**Condição:**
```typescript
const availableProfessionals = await getAvailableProfessionalsBySpecialty();

Object.entries(availableProfessionals).forEach(([specialty, count]) => {
  if (count < 5) {
    createAlert({
      severity: 'warning',
      category: 'operational',
      title: `Apenas ${count} ${specialty} Disponíveis`,
      description: 'Risco de não atender demanda',
    });
  }
});
```

**Ações:**
- Recrutamento urgente
- Reativar profissionais inativos
- Oferecer incentivos

---

### 4. MRR Estagnado
**Condição:**
```typescript
const mrrGrowth = ((currentMRR - previousMRR) / previousMRR) * 100;

if (mrrGrowth >= -5 && mrrGrowth <= 5) {
  createAlert({
    severity: 'warning',
    category: 'financial',
    title: 'MRR Estagnado',
    description: `Crescimento de ${mrrGrowth.toFixed(1)}% (meta: >10%)`,
  });
}
```

**Ações:**
- Revisar estratégia de aquisição
- Campanhas de expansão (upsell)
- Reduzir churn

---

### 5. CAC Alto
**Condição:**
```typescript
const cac = marketingSpend / newCustomers;

if (cac > 250) { // meta: <200
  createAlert({
    severity: 'warning',
    category: 'growth',
    title: `CAC em R$${cac.toFixed(0)}`,
    description: 'Acima da meta de R$200',
  });
}
```

**Ações:**
- Otimizar canais de aquisição
- Pausar canais não rentáveis
- Melhorar taxa de conversão

---

### 6. Tempo de Match Elevado
**Condição:**
```typescript
const avgTimeToMatch = await calculateAverageTimeToMatch();

if (avgTimeToMatch > 12) { // meta: <12h
  createAlert({
    severity: 'warning',
    category: 'operational',
    title: `Tempo Médio de Match: ${avgTimeToMatch.toFixed(1)}h`,
    description: 'Acima da meta de 12h',
  });
}
```

**Ações:**
- Notificações mais agressivas para profissionais
- Aumentar disponibilidade
- Revisar critérios de match

---

## 🟢 ALERTAS INFORMATIVOS (VERDE)

### 1. Meta Atingida
**Condição:** KPI acima da meta por 7 dias consecutivos  
**Ação:** Celebrar, comunicar ao time

### 2. Novo Recorde
**Condição:** Métrica bate recorde histórico  
**Ação:** Documentar aprendizados

### 3. Tendência Positiva
**Condição:** Métrica melhorando consistentemente  
**Ação:** Monitorar e replicar estratégias

---

## 🧮 SISTEMA DE PRIORIZAÇÃO

### Score de Prioridade (0-100)
```typescript
function calculateAlertPriority(alert: Alert): number {
  let score = 0;
  
  // Severidade (40 pontos)
  if (alert.severity === 'critical') score += 40;
  else if (alert.severity === 'warning') score += 20;
  
  // Impacto (30 pontos)
  if (alert.impact === 'critical') score += 30;
  else if (alert.impact === 'high') score += 20;
  else if (alert.impact === 'medium') score += 10;
  
  // Urgência (20 pontos)
  const hoursSinceCreated = (Date.now() - alert.createdAt.getTime()) / (1000 * 60 * 60);
  if (hoursSinceCreated > 24) score += 20;
  else if (hoursSinceCreated > 12) score += 15;
  else if (hoursSinceCreated > 4) score += 10;
  else if (hoursSinceCreated > 2) score += 5;
  
  // Usuários afetados (10 pontos)
  if (alert.affectedUsers && alert.affectedUsers.length > 50) score += 10;
  else if (alert.affectedUsers && alert.affectedUsers.length > 20) score += 7;
  else if (alert.affectedUsers && alert.affectedUsers.length > 10) score += 5;
  else if (alert.affectedUsers && alert.affectedUsers.length > 0) score += 3;
  
  return Math.min(score, 100);
}
```

### Classificação
- **P0 (90-100):** Drop everything
- **P1 (70-89):** Hoje
- **P2 (50-69):** Esta semana
- **P3 (0-49):** Backlog

---

## 🔔 CANAIS DE NOTIFICAÇÃO

### Por Severidade
| Severidade | Email | SMS | Slack | Dashboard | Push |
|------------|-------|-----|-------|-----------|------|
| 🔴 Crítico | ✅ | ✅ | ✅ | ✅ | ✅ |
| 🟡 Atenção | ✅ | ❌ | ✅ | ✅ | ✅ |
| 🟢 Info | ❌ | ❌ | ❌ | ✅ | ❌ |

### Por Categoria
| Categoria | Destinatário |
|-----------|--------------|
| Financial | CEO, CFO |
| Operational | COO, Ops Manager |
| Growth | CMO, Growth Lead |
| Quality | CS Manager, Product |

---

## 📊 ESTRUTURA DE DADOS

### Alert Interface
```typescript
interface Alert {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Classificação
  severity: 'critical' | 'warning' | 'info';
  category: 'financial' | 'operational' | 'growth' | 'quality';
  priority: number; // 0-100
  
  // Conteúdo
  title: string;
  description: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
  affectedMetric?: string;
  affectedUsers?: string[];
  estimatedLoss?: number; // em R$
  
  // Ações
  recommendedActions: string[];
  assignedTo?: string;
  
  // Lifecycle
  status: 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'dismissed';
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;
  
  // SLA
  sla: {
    expectedResponseTime: number; // em horas
    expectedResolutionTime: number; // em horas
    respondedAt?: Date;
    resolvedAt?: Date;
  };
  
  // Tracking
  escalated: boolean;
  escalatedAt?: Date;
  escalatedTo?: string;
  
  // Contexto
  sourceData?: any;
  relatedAlerts?: string[];
}
```

---

## 🔄 FLUXO DE VIDA DO ALERTA

```
CRIADO (open)
  ↓ (notificação enviada)
RECONHECIDO (acknowledged)
  ↓ (ação iniciada)
EM PROGRESSO (in_progress)
  ↓ (problema resolvido)
RESOLVIDO (resolved)
  OU
DISPENSADO (dismissed)
```

### Auto-Escalonamento
```typescript
async function checkAndEscalateAlerts() {
  const alerts = await getAlerts({ status: 'open' });
  
  alerts.forEach(async alert => {
    const hoursSinceCreated = (Date.now() - alert.createdAt.getTime()) / (1000 * 60 * 60);
    
    if (alert.severity === 'critical' && hoursSinceCreated > 2 && !alert.escalated) {
      await escalateAlert(alert.id, 'CEO');
      await sendNotification({
        to: 'ceo@company.com',
        subject: `[ESCALADO] ${alert.title}`,
        body: `Alerta crítico não resolvido após 2h.`
      });
    }
    
    if (alert.severity === 'warning' && hoursSinceCreated > 24 && !alert.escalated) {
      await escalateAlert(alert.id, 'Manager');
    }
  });
}
```

---

## 📈 DASHBOARD DE ALERTAS

### Visão Geral
- **Alertas Ativos:** Total por severidade
- **SLA:** % alertas resolvidos no prazo
- **Tempo Médio de Resolução:** Por categoria
- **Top 5 Alertas Recorrentes:** Padrões

### Por Categoria
- Financial
- Operational
- Growth
- Quality

### Histórico
- Timeline de alertas (últimos 30 dias)
- Taxa de resolução
- Alertas mais comuns
- Tempo médio por tipo

---

## 🧪 TESTES E VALIDAÇÃO

### Checklist de Validação
- [ ] Alert não dispara em dados mock/teste
- [ ] Notificações enviadas corretamente
- [ ] SLA calculado corretamente
- [ ] Auto-escalonamento funciona
- [ ] Ações recomendadas são acionáveis
- [ ] Dados de contexto suficientes

---

**Status:** ✅ DEFINIDO  
**Próximo:** Estrutura de Páginas (FASE 2.4)
