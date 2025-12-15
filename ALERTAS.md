# Alertas & Riscos — Ação Imediata

Objetivo: antecipar problemas e direcionar ação.

Alertas padrão
- Solicitações sem proposta (>12h)
  - Decisão: direcionar operação para envio imediato de propostas.
- Propostas aceitas sem pagamento
  - Decisão: acionar contato e remover fricções de pagamento.
- Pagamentos falhos
  - Decisão: reprocessar, orientar famílias e verificar integrações Stripe.

Severidade
- `low`, `medium`, `high`, `critical` com priorização visual.

Fonte de dados
- `src/services/admin/overview/alerts.ts` agrega `pipeline` e `finance`.