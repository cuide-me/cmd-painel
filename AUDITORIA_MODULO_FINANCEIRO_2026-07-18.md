# Auditoria do modulo financeiro - Painel Administrativo Cuide-me

Data: 2026-07-18

Escopo: auditoria read-only da implementacao atual do painel administrativo em `cmd-painel`. Este documento nao cria telas, APIs, colecoes, campos, calculos novos nem altera regras de negocio.

## Resumo executivo

O painel nao possui hoje um modulo financeiro administrativo dedicado. A leitura financeira esta fragmentada entre a home de KPI, alertas, usuarios e integracoes Stripe. A fonte de transacoes usada pelo painel e o Stripe; a colecao Firestore `payments` e lida apenas para contar pagamentos por usuario, sem contrato de valor, status, data ou conciliacao.

Ha dados suficientes para uma primeira visao administrativa de recebimentos baseada em charges Stripe e para relacionar parte deles a jobs quando houver `paymentIntentId`, `paymentId`, `stripePaymentIntentId` ou `proposal.paymentIntentId`. Nao ha base confiavel no painel para DRE, repasses por profissional, taxas Stripe efetivas, impostos, custos operacionais, CAC ou lucro. Essas metricas nao devem ser exibidas como valores enquanto a fonte, a semantica e a conciliacao nao estiverem definidas.

Conclusao: a reestruturacao deve comecar criando uma camada financeira somente de leitura sobre as fontes existentes, com contratos explicitos de disponibilidade e reconciliacao. Nenhuma regra de pagamento, Stripe Connect ou Firestore deve ser alterada na primeira entrega.

## Estrutura atual

### Paginas, navegacao e UI

- Nao existe a rota `/admin/financeiro`, nem itens financeiros no menu administrativo em `src/app/admin/layout.tsx`.
- A home `/admin`, implementada em `src/app/admin/page.tsx`, exibe o painel de KPI e operacao. Ela inclui contagem de pagamentos confirmados, taxa de reembolso, tempo entre aceite e pagamento e a observacao de que LTV e receita recorrente nao possuem base financeira historica confiavel.
- `/admin/alertas` agrupa excecoes de pagamento e financeiro: match sem pagamento, charges pendentes ha mais de 72 horas, charges falhos e reembolsos processados.
- `/admin/users` mostra uma contagem de `pagamentosRealizados` por usuario e o status de conta Stripe Connect. Nao mostra valores financeiros, repasses ou conciliacao.
- `/admin/funil` usa Stripe apenas para confirmar o fechamento e medir o tempo entre aceite e pagamento.
- Nao ha componentes administrativos especificos para cards financeiros, tabelas de recebimentos ou repasses, filtros financeiros, paginação financeira, graficos de receita ou DRE.
- Os componentes `PayoutStatusCard` e `StripeStatusCard` pertencem a jornadas de profissional/Stripe Connect, nao a um modulo financeiro administrativo. Eles mostram disponibilidade/configuracao de conta, nao valores ou agenda real de repasse.

### APIs, services e hooks

- `GET /api/admin/dashboard-v3` usa `calculateKpiDashboardMetrics` de `src/services/admin/kpiDashboardMetrics.ts`. Apesar do nome, esse endpoint nao usa `dashboardV3Metrics.ts`.
- `src/services/admin/dashboardV3Metrics.ts` calcula uma segunda superficie de home operacional, incluindo GMV semanal e receita estimada. A funcao `calculateDashboardV3Metrics` nao possui consumidor administrativo identificado nesta auditoria.
- `src/services/admin/alerts/listAlerts.ts` consulta jobs, charges e refunds para formar alertas operacionais. Sua consulta Stripe e limitada a 100 charges e 100 refunds.
- `src/services/admin/users/listUsers.ts` faz leitura integral de `payments` exclusivamente para contar documentos por `usuarioId` ou `userId`.
- Nao ha service, repository, hook, provider ou tipo de dominio dedicado a financeiro.
- Os unicos hooks administrativos encontrados sao `useAdminAuth` e `useAutoRefresh`; nenhum coordena dados financeiros.
- O papel `finance` existe em `src/modules/shared/auth/permissions.ts`, mas possui somente `dashboard.read` e `users.read`. Nao existe permissao especifica para leitura financeira, exportacao, conciliacao ou operacao de repasse.

### Dados e consultas atuais

| Fonte | Uso atual no painel | Campos/relacoes consumidos | Limite observado |
| --- | --- | --- | --- |
| Stripe Charges | GMV, contagem de pagamentos confirmados, conciliacao de tempo, alertas | `id`, `payment_intent`, `created`, `status`, `amount` | Dashboard KPI percorre ate 1.500 charges na janela combinada; alertas e home operacional usam 100. |
| Stripe Refunds | Alertas de reembolso | `id`, `created`, `status`, `amount`, `charge`, `reason` | 100 refunds nos alertas. |
| Stripe Connect Accounts | Status de habilitacao de profissional | `charges_enabled`, `payouts_enabled`, requisitos da conta | Uma consulta por conta na listagem de usuarios, com cache de 60 s. |
| Firestore `jobs` | Relacao operacional e conciliacao com charge | `createdAt`, `status`, `clientId`/aliases, `professionalId`/aliases, `paymentIntentId`, `paymentId`, `stripePaymentIntentId`, `proposal.paymentIntentId`, timestamps de proposta/aceite | Consultas por data nos dashboards; leitura global em usuarios. |
| Firestore `users` | Perfil, status de profissional e Stripe | perfil, atividade, verificacao, dados de Stripe e identidade | Leitura integral no KPI legado; busca paginada no modulo de usuarios. |
| Firestore `payments` | Contagem de pagamentos por usuario | `usuarioId` ou `userId` | Sem campos financeiros consumidos; leitura integral por acesso a usuarios. |
| Firestore `ratings`, `tickets` | Contexto operacional, nao contabil | rating, usuario, ticket | Sem calculo financeiro. |
| GA4 | Eventos e taxas de funil | `payment_confirmed`, `refund_processed`, `service_canceled` e demais eventos | Contagens de eventos; nao contem valores financeiros. |

O repositorio nao consulta `payouts`, `transfers`, `balance transactions`, `application fees`, `disputes` ou `payment intents` no modulo administrativo. Tambem nao ha consulta administrativa a colecoes Firestore `refunds`, `transactions`, `payment_confirmations`, `transfers` ou `payouts`.

## Calculos financeiros existentes

### GMV

`dashboardV3Metrics.ts` soma `charge.amount / 100` de charges Stripe com `status === 'succeeded'` criadas na ultima semana. Esse e o unico calculo monetario administrativo atual.

Limites:

- a fonte e Stripe, portanto nao depende da colecao `payments`;
- nao considera refunds, disputes, fees, transferencias nem disponibilidade de saldo;
- a rotina busca apenas uma pagina de 100 charges;
- nao ha associacao obrigatoria de todos os charges a um job, cliente ou profissional na resposta administrativa.

### Receita da plataforma

`dashboardV3Metrics.ts` calcula `GMV * PLATFORM_TAKE_RATE` quando a variavel de ambiente esta definida entre 0 e 1. O valor nao e derivado de `application_fee_amount`, fee real, desconto, cupom, transferencia ou registro financeiro por transacao.

Esse numero e uma estimativa operacional, nao receita contabil conciliada. Ele nao deve alimentar DRE, margem, receita liquida ou relatórios financeiros sem uma definicao aprovada de taxa efetiva e de como descontos/refunds alteram a comissao.

### Taxas, refunds e reembolsos

- Os alertas somam refunds Stripe bem-sucedidos somente para texto operacional, sem expor uma serie financeira ou impacto na receita.
- A taxa de reembolso do dashboard e calculada por eventos GA4 `refund_processed` sobre `payment_confirmed`; ela e uma taxa de eventos, nao uma conciliacao de valores reembolsados.
- Nao ha calculo administrativo de taxa Stripe, imposto, chargeback, custo operacional, lucro bruto, lucro operacional ou margem liquida.

### Marketplace e recorrencia

- A taxa de recompra existente conta, por janela semanal, clientes com dois ou mais jobs criados. Ela nao confirma pagamento, servico concluido nem receita recorrente.
- Nao ha calculo de LTV, CAC, churn, retencao financeira ou frequencia de contratacao baseada em transacoes liquidadas.

## Problemas encontrados

### P0 - Nao existe um contrato financeiro administrativo

O dominio financeiro nao tem tipos, DTOs, service, endpoint ou pagina dedicados. A mesma informacao esta fragmentada em KPI, alertas e usuarios, impedindo uma definicao unica de recebimento, repasse, status e data financeira.

Impacto: uma nova tela tenderia a repetir consultas Stripe e regras locais, aumentando o risco de valores divergentes.

### P0 - Receita da plataforma e estimada por configuracao global

O calculo atual de receita usa `PLATFORM_TAKE_RATE`, em vez de valores efetivos por transacao. Taxas podem variar por cupom, desconto, regra futura, refund ou configuracao Stripe Connect.

Impacto: o numero pode ser útil como sinal provisório de operacao, mas nao e confiavel para DRE, receita liquida, margem ou decisao contabil.

### P0 - Repasses nao sao visiveis nem conciliados

O painel conhece apenas se a conta Connect esta habilitada. Nao consulta transfers, payouts, reversoes, datas previstas, datas realizadas ou falhas de payout.

Impacto: nao e possivel construir a tabela de repasses solicitada com dados reais sem integrar a leitura dessas fontes Stripe ou consumir uma fonte persistida ja existente e aprovada.

### P0 - Dados de custo e resultado nao existem no contrato atual

Taxas Stripe efetivas, impostos, custos operacionais, disputas/chargebacks e contas a pagar nao sao carregados. Sem essas fontes, receita liquida, lucro bruto, lucro operacional e margem liquida seriam valores inventados.

### P1 - Consultas e limites podem produzir leitura parcial

- O dashboard KPI pode truncar Stripe em 1.500 charges por janela combinada.
- Alertas e home operacional leem apenas 100 registros Stripe por tipo.
- A home chama o endpoint `dashboard-v3`, mas este usa o contrato `kpiDashboardMetrics`; o service `dashboardV3Metrics` permanece paralelo e sem consumidor identificado.
- `listUsers` varre globalmente `jobs`, `payments`, `ratings` e `tickets` mesmo quando a tela pede uma pagina de usuarios.

Impacto: resultados financeiros podem ficar incompletos em volume alto, e o custo/latencia cresce com a base.

### P1 - Relacionamento transacional e inconsistente

A conciliacao job-charge tenta quatro nomes de campo de pagamento no job. Isso e uma adaptacao apropriada ao legado, mas evidencia ausencia de uma chave de conciliacao administrativa canonica. A colecao `payments` tambem nao possui um contrato financeiro consumido pelo painel.

Impacto: filtros por cliente, profissional e atendimento nao podem ser considerados completos sem uma estrategia explicita para charges sem vinculo ou com chaves legadas.

### P1 - UX financeira inexistente

Nao ha navegacao para financeiro, visao por recebimento, estado de conciliacao, detalhes de transacao, filtro por profissional/cliente, paginação ou exportacao financeira. Alertas misturam excecao financeira com eventos de experiencia e operacao.

### P2 - Autorizacao financeira e observabilidade insuficientes para o dominio

O papel `finance` tem permissao ampla de dashboard e usuarios, sem escopo financeiro dedicado. Tambem nao ha auditoria de consulta/exportacao de dados financeiros no painel.

## Matriz de viabilidade dos indicadores solicitados

| Indicador | Situacao | Fonte atual e regra possivel | Lacuna ou restricao |
| --- | --- | --- | --- |
| GMV | Parcialmente calculavel | Somar `amount` de charges Stripe `succeeded` por `created`. | Paginação completa, definicao de tratamento de refunds/disputes e reconciliacao de charge sem job. |
| Total recebido dos clientes | Parcialmente calculavel | Mesmo conjunto de charges bem-sucedidos. | Definir se e bruto capturado, liquido de refund ou saldo disponivel. |
| Plantões vendidos | Parcialmente calculavel | Jobs conciliados a charges bem-sucedidos. | Chave canonica e cobertura de todos os jobs/charges. |
| Horas vendidas | Nao calculavel com seguranca | Nenhum campo de duracao e consumido pelo painel. | Campo canonico de duracao/turno e sua unidade em `jobs`. |
| Ticket medio | Parcialmente calculavel | GMV dividido por charges bem-sucedidos ou jobs conciliados. | Definir denominador oficial e excluir duplicidade/refund conforme regra aprovada. |
| Clientes ativos | Parcialmente calculavel | Clientes unicos em jobs conciliados ou metadata Stripe, se disponivel. | Relacionamento charge-cliente nao e carregado no contrato atual. |
| Profissionais ativos | Parcialmente calculavel | Profissionais unicos de jobs conciliados. | Relacao obrigatoria charge-job-profissional. |
| Receita bruta da Cuide-me | Apenas estimativa | GMV x `PLATFORM_TAKE_RATE`. | `application_fee` ou regra efetiva por transacao; nao usar como contabil. |
| Receita liquida | Nao calculavel | Nao ha composicao confiavel de fees, impostos, refunds e custos. | Taxas Stripe efetivas, impostos e regra de reconhecimento. |
| Take rate | Apenas estimativa | `PLATFORM_TAKE_RATE` quando configurada. | Comissao efetiva e descontos/refunds por transacao. |
| Receita media por cliente/profissional | Nao calculavel com seguranca | Exigiria receita efetiva e vinculo transacional. | Receita conciliada e identidades associadas. |
| Taxas Stripe | Nao calculavel | Nenhuma leitura de balance transaction/fee. | Taxa real por charge e seu periodo de competencia. |
| Impostos | Nao calculavel | Nenhuma fonte. | Fonte fiscal/contabil e regras de competencia. |
| Estornos e reembolsos | Parcialmente calculavel | Refunds Stripe com `status` e `amount`. | Paginação, estornos parciais, chargebacks/disputes e vinculo por atendimento. |
| Custos operacionais | Nao calculavel | Nenhuma fonte. | Fonte de custos aprovada; nao criar colecao sem decisao de negocio. |
| Lucro bruto, operacional, margem liquida | Nao calculavel | Dependem dos itens acima. | Modelo de resultado e fontes de custo/imposto. |
| LTV | Nao calculavel | Nao ha receita liquida por cliente ao longo da vida. | Historico conciliado e definicao de coorte. |
| CAC | Nao calculavel | Nao ha custo de aquisicao. | Fonte de investimento/campanha e atribuicao de cliente. |
| Churn e retencao | Nao calculavel com seguranca | Ha eventos e jobs, mas sem coorte/periodo de atividade oficial. | Definicao de atividade, coortes e observacao historica. |
| Repeat rate | Parcialmente calculavel | Taxa semanal atual: clientes com >= 2 jobs criados. | Deve definir se o evento valido e pagamento ou conclusao, nao apenas job criado. |
| Frequencia media de contratacao | Nao calculavel com seguranca | Pode derivar de jobs, mas nao de contratacoes liquidadas. | Definicao de evento financeiro valido e periodo. |

## Proposta de estrutura para aprovacao

### Principios

1. Preservar o Stripe como fonte financeira transacional e Firestore como fonte operacional/relacional existente.
2. Nao usar `payments` como fonte de valor enquanto seus campos e sua confiabilidade nao forem verificados e formalizados.
3. Exibir `Indisponivel` com motivo quando uma metrica nao tiver fonte suficiente; nunca converter ausencia em zero.
4. Centralizar normalizacao de valores monetarios em centavos e vinculos charge-job em uma camada financeira server-side.
5. Usar paginação cursor-based para tabelas e agregacao por periodo sem leituras integrais por request.
6. Manter o dashboard atual intacto durante a introducao do modulo; o financeiro entra como superficie independente, sem substituir KPI operacional.

### Areas propostas

#### 1. Visao geral

Rota proposta: `/admin/financeiro`.

- KPIs confiaveis de volume: GMV, recebimentos brutos, pagamentos confirmados, ticket medio e base ativa quando houver conciliacao suficiente.
- Bloco de qualidade: percentual de recebimentos vinculados a job, itens sem vinculo, fonte e atualizacao.
- Serie temporal de GMV e recebimentos; agrupamento diario, semanal, mensal e anual quando a janela possuir cobertura completa.
- Bloco de receitas, custos e resultado mostrando somente itens calculaveis. Os demais aparecem como indisponiveis com a fonte faltante, sem estimativas contabeis.

#### 2. Recebimentos

Rota proposta: `/admin/financeiro/recebimentos`.

Tabela paginada de charges Stripe com:

- cliente, quando houver vinculo confiavel;
- atendimento/job relacionado, quando houver conciliacao;
- data do charge;
- valor pago em centavos formatado;
- moeda, metodo de pagamento e status Stripe quando expostos pela fonte;
- identificador Stripe e link de detalhe interno;
- qualidade do vinculo: conciliado, sem job, sem cliente ou divergente.

Filtros: periodo, status, cliente e profissional. Filtros por cliente/profissional devem operar somente sobre registros conciliados e declarar itens sem vinculo.

#### 3. Repasses

Rota proposta: `/admin/financeiro/repasses`.

A tela deve ser entregue somente depois de existir uma fonte de leitura aprovada para transfers/payouts Stripe ou uma fonte persistida ja existente confirmada no ambiente. O contrato esperado e:

- profissional;
- valor do repasse;
- status;
- data prevista e realizada;
- atendimento relacionado;
- identificadores Stripe;
- classificacao pendente, pago, aguardando Stripe, cancelado ou falho.

O status atual de conta Connect nao deve ser apresentado como se fosse status de repasse.

#### 4. Resultados

Rota proposta: `/admin/financeiro/resultados`.

Uma DRE simplificada so deve exibir linhas para fontes comprovadas:

```text
Receita Bruta
(-) Taxas Stripe                 [indisponivel ate haver fee efetiva]
(-) Impostos                     [indisponivel ate haver fonte fiscal]
(-) Estornos e Reembolsos        [parcial: refunds Stripe]
= Receita Liquida                [indisponivel enquanto componentes faltarem]
(-) Custos Operacionais          [indisponivel ate haver fonte aprovada]
= Lucro Operacional              [indisponivel enquanto componentes faltarem]
```

O agrupamento diario, semanal, mensal e anual depende da paginação completa das fontes Stripe e de uma politica de competencia aprovada. A tela nao deve chamar uma taxa ambiental como substituto de resultado efetivo.

### Arquitetura de codigo proposta

Sem aplicar nesta etapa, a estrutura recomendada e:

```text
src/modules/finance/
  domain/
    money.ts
    financial-status.ts
    reconciliation.ts
    metrics.ts
  services/
    list-receivables.ts
    get-financial-overview.ts
    list-payouts.ts
    get-financial-results.ts
  components/
    overview/
    receivables/
    payouts/
    results/
  types.ts

src/app/admin/financeiro/
  page.tsx
  recebimentos/page.tsx
  repasses/page.tsx
  resultados/page.tsx

src/app/api/admin/financeiro/
  overview/route.ts
  recebimentos/route.ts
  repasses/route.ts
  resultados/route.ts
```

Cada endpoint deve chamar um service financeiro, que por sua vez centraliza consulta Stripe, normalizacao, vinculo com jobs e metadados de cobertura. Componentes nao devem chamar Stripe ou Firestore diretamente.

### Autorizacao proposta

Antes de disponibilizar o modulo, adicionar permissoes especificas, por exemplo `finance.read` e, caso necessario no futuro, `finance.export`. O papel `finance` deve receber apenas o menor conjunto necessario. A alteracao precisa manter os acessos atuais de admin e ser coberta por testes de contrato.

### Estrategia de performance proposta

- Uma camada unica de consulta Stripe por endpoint, com paginação usando `starting_after`/cursor e limite explicitamente informado ao usuario.
- Cache privado de curta duracao por combinacao de filtros, seguindo o padrao atual de dashboard e alertas.
- Agregacoes apenas sobre a pagina/periodo carregado, com metadado de cobertura quando uma consulta nao puder percorrer todo o historico.
- Busca em lote de `users` para os IDs relacionados aos jobs da pagina; evitar consulta Stripe por linha.
- Reutilizar adaptadores de aliases de `jobs` ja existentes para cliente e profissional.
- Nenhuma nova colecao Firestore na primeira versao. Se leitura historica completa de Stripe se tornar cara, propor separadamente um read model, seus eventos de alimentacao, politicas de reconciliacao e aprovacao explicita.

## Decisoes e riscos a validar antes da implementacao

1. Confirmar no ambiente Stripe o modelo Connect usado: destination charges, separate charges/transfers ou outro. Isso define a fonte correta de repasse e de taxa efetiva.
2. Confirmar quais metadados de charge/PaymentIntent contem `jobId`, cliente e profissional. O painel atual somente tenta vinculo pelo job; nao garante cobertura inversa charge-job.
3. Definir oficialmente GMV, recebido, receita bruta, receita liquida e data de competencia. Esses nomes nao podem variar entre cards, tabelas e DRE.
4. Definir se refunds reduzem GMV, recebimentos, receita ou apenas aparecem como deducao em resultados.
5. Confirmar campos de duracao de atendimento em `jobs` antes de criar "horas vendidas".
6. Decidir a fonte corporativa de impostos, custos operacionais e CAC. Nao ha base no painel para inferi-los.
7. Resolver o service paralelo `dashboardV3Metrics` antes de reutilizar seu GMV estimado; ele nao deve concorrer com o contrato da nova area financeira.

## Proxima etapa recomendada

Solicitar aprovacao desta proposta antes de alterar codigo. A primeira implementacao deve se limitar a uma fundacao de dominio financeiro, leitura de recebimentos Stripe paginada e visao geral com indicadores comprovadamente calculaveis. Repasses e resultados entram apenas quando as fontes Stripe/fiscais correspondentes forem confirmadas.

## Confirmacao posterior da fonte Stripe Connect

Em 2026-07-18, uma consulta read-only e agregada ao Stripe configurado confirmou que o historico possui fluxo hibrido:

- destination charges Connect bem-sucedidos com `transfer`, `application_fee` e `on_behalf_of`;
- charges legados bem-sucedidos sem destino Connect;
- transfers com `source_transaction`, inclusive transferencias parciais ou integralmente revertidas;
- acesso de leitura aos payouts das contas Connect, mas sem chave transacional confiavel que associe cada payout bancario a um transfer individual.

Consequencia aplicada na implementacao: comissao e taxa efetivas sao calculadas somente para o subconjunto Connect, e a tela de Repasses usa transfers como evidencia de valor destinado ao saldo Connect. O status de deposito bancario continua indisponivel por transfer individual para evitar conciliacao ficticia.