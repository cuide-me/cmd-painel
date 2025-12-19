# 📊 Metrics Glossary - Torre v2

Definição de todos os KPIs e métricas usados na Torre de Controle.

---

## 📋 Categorias

1. [Revenue Metrics](#revenue-metrics)
2. [Growth Metrics](#growth-metrics)
3. [Operations Metrics](#operations-metrics)
4. [Quality Metrics](#quality-metrics)
5. [Cohort Metrics](#cohort-metrics)
6. [Financial Health](#financial-health)

---

## 💰 Revenue Metrics

### MRR (Monthly Recurring Revenue)
**Definição:** Receita recorrente mensal de assinaturas ativas.

**Cálculo:**
```
MRR = Soma(valor_mensal_assinatura × quantidade_assinaturas_ativas)
```

**Fonte:** Stripe Subscriptions

**Bom valor:** 
- Early stage: > R$ 10k/mês
- Growth stage: > R$ 100k/mês
- Scale stage: > R$ 1M/mês

**Como melhorar:**
- Aumentar conversão trial → paid
- Reduzir churn
- Upsell para planos maiores
- Cross-sell serviços adicionais

---

### ARR (Annual Recurring Revenue)
**Definição:** Receita recorrente anualizada.

**Cálculo:**
```
ARR = MRR × 12
```

**Fonte:** Calculado do MRR

**Uso:** Métricas de longo prazo, valuation, fundraising

---

### Churn Rate (Taxa de Cancelamento)
**Definição:** Percentual de clientes que cancelaram no período.

**Cálculo:**
```
Churn Rate = (Cancelamentos no período / Clientes ativos no início) × 100
```

**Fonte:** Stripe Subscriptions (status = canceled)

**Bom valor:**
- Monthly churn: < 5%
- Annual churn: < 40%
- SaaS B2C: 5-7% mensal é aceitável

**Alertas:**
- 🟢 < 3% - Excelente
- 🟡 3-5% - Normal
- 🔴 > 5% - Crítico

**Como reduzir:**
- Melhorar onboarding
- Engajamento proativo
- Customer success dedicado
- Identificar sinais de churn antecipadamente

---

### Revenue Churn
**Definição:** Receita perdida por cancelamentos.

**Cálculo:**
```
Revenue Churn = (MRR perdido / MRR início do mês) × 100
```

**Diferença do Customer Churn:** Considera o valor, não apenas quantidade.

**Bom valor:** < 3% mensal

---

## 📈 Growth Metrics

### CAC (Customer Acquisition Cost)
**Definição:** Custo médio para adquirir um novo cliente.

**Cálculo:**
```
CAC = Custos de Marketing + Custos de Sales / Novos Clientes Adquiridos
```

**Fonte:** 
- Custos: Manual (marketing spend)
- Novos clientes: GA4 (sign_up_complete events)

**Bom valor:**
- CAC < R$ 100 para B2C
- CAC/LTV ratio: 1:3 ideal
- Payback < 12 meses

**Como otimizar:**
- Melhorar conversão do funnel
- Reduzir custo por lead (CPL)
- Aumentar organic acquisition
- Otimizar canais com melhor ROI

---

### LTV (Lifetime Value)
**Definição:** Receita total esperada de um cliente durante seu ciclo de vida.

**Cálculo:**
```
LTV = ARPU × 1/Churn Rate
```

Onde:
- ARPU = Average Revenue Per User (R$/mês)
- Churn Rate = Taxa mensal de cancelamento

**Exemplo:**
```
ARPU = R$ 150/mês
Churn = 5%/mês
LTV = 150 × (1/0.05) = 150 × 20 = R$ 3.000
```

**Fonte:** Stripe (revenue) + Firestore (users)

**Bom valor:**
- LTV/CAC > 3:1 (ideal)
- LTV/CAC > 5:1 (excelente)

---

### LTV/CAC Ratio
**Definição:** Retorno sobre investimento em aquisição.

**Cálculo:**
```
LTV/CAC Ratio = LTV / CAC
```

**Interpretação:**
- < 1 - Insustentável (perdendo dinheiro)
- 1-3 - Break-even ou low margin
- 3-5 - Saudável (target zone)
- > 5 - Excelente (ou subinvestindo em growth)

**Como melhorar:**
- Aumentar LTV (reduzir churn, upsell)
- Reduzir CAC (otimizar marketing)

---

### Payback Period
**Definição:** Tempo para recuperar o CAC.

**Cálculo:**
```
Payback Period = CAC / (ARPU × Gross Margin%)
```

**Exemplo:**
```
CAC = R$ 300
ARPU = R$ 150/mês
Gross Margin = 80%
Payback = 300 / (150 × 0.8) = 2.5 meses
```

**Bom valor:**
- < 6 meses - Excelente
- 6-12 meses - Saudável
- > 12 meses - Problemático

---

### Conversion Rate (Funnel)
**Definição:** Taxa de conversão em cada etapa do funel.

**Acquisition Funnel:**
```
Page View → Sign Up → Profile Complete
```

**Conversion Funnel:**
```
Profile Complete → Create Request → First Match → Payment
```

**Cálculo:**
```
Conversion Rate = (Próxima etapa / Etapa atual) × 100
```

**Fonte:** GA4 events

**Bom valor:**
- Sign up: 2-5%
- Profile complete: 60-80%
- First request: 40-60%
- Payment: 30-50%

**Como melhorar:**
- A/B testing de copy/design
- Reduzir friction no processo
- Personalizar onboarding
- Retargeting de abandono

---

### Active Users
**Definição:** Usuários que interagiram na plataforma no período.

**Tipos:**
- **DAU** (Daily Active Users)
- **WAU** (Weekly Active Users)
- **MAU** (Monthly Active Users)

**Cálculo:**
```
MAU = Usuários únicos com lastActive nos últimos 30 dias
```

**Fonte:** Firestore `users` collection

**Bom valor:** Depende do modelo, mas buscar:
- DAU/MAU > 20% (sticky product)
- Crescimento MAU > 10%/mês

---

## ⚙️ Operations Metrics

### SLA Compliance Rate
**Definição:** Percentual de jobs atendidos dentro do SLA (24h).

**Cálculo:**
```
SLA Compliance = (Jobs dentro SLA / Total jobs) × 100
```

**Fonte:** Firestore `jobs` collection (timestamp analysis)

**Bom valor:**
- > 95% - Excelente
- 90-95% - Bom
- 85-90% - Aceitável
- < 85% - Crítico

**Meta Torre v2:** > 90%

**Como melhorar:**
- Aumentar supply de profissionais
- Melhorar matching algorithm
- Priorizar jobs críticos
- Alertas proativos

---

### Average Response Time
**Definição:** Tempo médio até primeira resposta do profissional.

**Cálculo:**
```
Avg Response Time = Média(timestamp_resposta - timestamp_solicitação)
```

**Fonte:** Firestore `jobs` collection

**Bom valor:**
- < 4h - Excelente
- 4-12h - Bom
- 12-24h - SLA
- > 24h - Breach

---

### Professional Utilization Rate
**Definição:** Taxa de ocupação dos profissionais.

**Cálculo:**
```
Utilization = (Jobs ativos / Profissionais ativos) × 100
```

**Fonte:** Firestore `jobs` + `professionals`

**Bom valor:**
- 60-80% - Balanceado
- < 60% - Oversupply (idle capacity)
- > 80% - Undersupply (risk of burnout)

**Alertas:**
- > 90% em specialty específica = gargalo

---

### Supply/Demand Ratio
**Definição:** Relação entre oferta e demanda.

**Cálculo:**
```
Ratio = Profissionais ativos / Jobs pendentes
```

**Interpretação:**
- > 1.5 - Oversupply
- 0.7-1.5 - Balanced
- < 0.7 - Undersupply

**Ação:**
- Undersupply → Contratar mais profissionais
- Oversupply → Investir em marketing para mais clientes

---

### Match Rate
**Definição:** Taxa de sucesso no matching.

**Cálculo:**
```
Match Rate = (Jobs matched / Jobs criados) × 100
```

**Fonte:** Firestore `jobs` (status = matched)

**Bom valor:** > 85%

**Como melhorar:**
- Melhorar algoritmo de matching
- Expandir rede de profissionais
- Flexibilizar critérios de match
- Notificações proativas

---

## ⭐ Quality Metrics

### NPS (Net Promoter Score)
**Definição:** Métrica de satisfação e lealdade do cliente.

**Cálculo:**
```
NPS = % Promotores - % Detratores
```

Onde:
- **Promotores** (9-10): Fans que recomendarão
- **Passivos** (7-8): Satisfeitos mas não leais
- **Detratores** (0-6): Insatisfeitos, podem fazer bad press

**Fonte:** Firestore `feedback` collection (score 0-10)

**Bom valor:**
- > 70 - World class
- 50-70 - Excelente
- 30-50 - Bom
- 0-30 - Melhorar
- < 0 - Crítico

**Como melhorar:**
- Identificar e resolver pain points
- Follow-up com detratores
- Converter passivos em promotores
- Customer success proativo

---

### Average Rating
**Definição:** Avaliação média dos serviços (1-5 estrelas).

**Cálculo:**
```
Avg Rating = Média(ratings)
```

**Fonte:** Firestore `feedback` collection

**Bom valor:**
- > 4.5 - Excelente
- 4.0-4.5 - Bom
- 3.5-4.0 - Aceitável
- < 3.5 - Crítico

---

### Response Rate
**Definição:** Taxa de resposta a pesquisas de feedback.

**Cálculo:**
```
Response Rate = (Feedbacks recebidos / Jobs completados) × 100
```

**Bom valor:** > 30%

**Como aumentar:**
- Simplificar processo de feedback
- Timing ideal (logo após job)
- Incentivos (desconto próxima sessão)
- Notificações por email/push

---

## 📊 Cohort Metrics

### Cohort Retention Rate
**Definição:** Percentual de usuários que continuam ativos após N semanas.

**Períodos:**
- Week 1 retention
- Week 2 retention
- Week 4 retention
- Week 8 retention
- Week 12 retention

**Cálculo:**
```
Week N Retention = (Usuários ativos Week N / Tamanho inicial cohort) × 100
```

**Fonte:** Firestore `users` (createdAt + lastActive)

**Bom valor:**
- Week 1: > 60%
- Week 4: > 40%
- Week 12: > 20%

**Benchmark por cohort:** Comparar cohorts para identificar melhorias no produto.

---

## 💸 Financial Health

### Burn Rate
**Definição:** Taxa de gasto de caixa mensal.

**Cálculo:**
```
Burn Rate = Custos mensais - Receita mensal
```

**Fonte:** Manual (custos operacionais) + Stripe (receita)

**Tipos:**
- **Gross Burn:** Total de custos mensais
- **Net Burn:** Custos - Receita

**Como reduzir:**
- Otimizar custos fixos
- Aumentar receita
- Postergar contratações não críticas

---

### Runway
**Definição:** Meses até acabar o caixa.

**Cálculo:**
```
Runway = Caixa disponível / Burn Rate mensal
```

**Exemplo:**
```
Caixa = R$ 500k
Burn Rate = R$ 50k/mês
Runway = 500 / 50 = 10 meses
```

**Alertas:**
- 🟢 > 12 meses - Healthy
- 🟡 6-12 meses - Warning
- 🔴 < 6 meses - Critical

**Ação se < 6 meses:**
- Fundraising
- Cortar custos
- Acelerar receita

---

### Cash Flow
**Definição:** Movimento de dinheiro (entrada - saída).

**Componentes:**
- **Inflow:** MRR + one-time payments
- **Outflow:** Custos fixos + variáveis

**Projeções:**
- 30 dias
- 60 dias
- 90 dias

**Monitoramento:** Semanal para early-stage, mensal para scale-up.

---

## 📐 Fórmulas Compostas

### Rule of 40
**Definição:** Growth Rate + Profit Margin > 40%

**Cálculo:**
```
Rule of 40 = Growth Rate % + EBITDA Margin %
```

**Interpretação:**
- > 40% - Saudável (SaaS benchmark)
- 20-40% - Aceitável
- < 20% - Problemático

**Uso:** Avaliar balanço entre crescimento e profitabilidade.

---

### Magic Number
**Definição:** Eficiência de S&M spend.

**Cálculo:**
```
Magic Number = (MRR trimestre atual - MRR trimestre anterior) / S&M spend trimestre anterior
```

**Interpretação:**
- > 1.0 - Excelente (cada R$ 1 gera > R$ 1 MRR)
- 0.75-1.0 - Bom
- 0.5-0.75 - Aceitável
- < 0.5 - Ineficiente

---

## 🎯 KPI Targets (Torre v2)

| Métrica | Current | Target Q1 | Target Q2 | Target Q3 |
|---------|---------|-----------|-----------|-----------|
| MRR | R$ 125k | R$ 150k | R$ 200k | R$ 300k |
| Churn Rate | 4.8% | < 4% | < 3% | < 2.5% |
| CAC | R$ 65 | R$ 55 | R$ 45 | R$ 40 |
| LTV/CAC | 6.9:1 | > 7:1 | > 8:1 | > 10:1 |
| NPS | 52 | > 55 | > 60 | > 65 |
| SLA Compliance | 87% | > 90% | > 92% | > 95% |
| MAU | 1,245 | 1,500 | 2,000 | 3,000 |

---

## 📚 Referências

- [SaaS Metrics 2.0](https://www.forentrepreneurs.com/saas-metrics-2/)
- [Startup Metrics for Pirates (AARRR)](https://www.slideshare.net/dmc500hats/startup-metrics-for-pirates-long-version)
- [The SaaS Metrics That Matter](https://www.mckinsey.com/industries/technology-media-and-telecommunications/our-insights/grow-fast-or-die-slow-focusing-on-customer-success-to-drive-growth)
- [Cohort Analysis Guide](https://amplitude.com/blog/cohort-analysis)
