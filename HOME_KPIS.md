# Home — KPIs Essenciais

Lista de até 6 KPIs com status e tendência. Cada item responde: "Que decisão isso permite tomar?"

1) Famílias ativas (30d)
- Definição: número de famílias com atividade nos últimos 30 dias.
- Decisão: se cair, reforçar ativação/onboarding; se subir, manter campanhas e garantir qualidade.

2) Cuidadores ativos (perfil 100%)
- Definição: % de cuidadores com perfil completo e pronto para matching.
- Decisão: se baixo, acionar fluxo de ativação de perfil; se alto, acelerar matching e ofertas.

3) Solicitações abertas
- Definição: total de solicitações sem conclusão ainda abertas.
- Decisão: se alto, direcionar operação para envio de propostas e reduzir tempo de espera.

4) Contratações concluídas (7d / 30d)
- Definição: total de contratações finalizadas nos últimos 7 e 30 dias.
- Decisão: queda sugere revisar funil/pricing; alta exige garantir capacidade e qualidade de atendimento.

5) Tempo médio até match
- Definição: tempo médio entre a abertura da solicitação e o match com cuidador.
- Decisão: se alto, ampliar oferta qualificada e otimizar recomendações; se baixo, manter SLAs e operação.

6) Abandono pós-aceite
- Definição: % de propostas aceitas que não avançam para pagamento.
- Decisão: se alto, revisar comunicação, confiança e fricções de pagamento.

Acessibilidade e UX
- Status em cores com contraste (WCAG) e tooltips explicativos.
- Navegação por teclado e labels acessíveis.

Fonte de dados
- `src/services/admin/overview/kpis.ts` agrega de `users`, `finance` e `pipeline` (somente leitura).