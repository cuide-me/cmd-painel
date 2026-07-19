# Implementacao do modulo financeiro - Painel Administrativo Cuide-me

Data: 2026-07-18

Esta entrega implementa a primeira estrutura independente do modulo financeiro, aprovada apos a auditoria em `AUDITORIA_MODULO_FINANCEIRO_2026-07-18.md`.

## Entregue

- novo dominio em `src/modules/finance`, separado dos dois servicos legados de dashboard;
- permissao `finance.read`, concedida a `admin` e ao papel `finance`;
- navegacao financeira em `/admin/financeiro`;
- APIs protegidas para visao geral, recebimentos, detalhe de recebimento, repasses e resultados;
- visao geral com GMV, total recebido bruto, ticket medio, pagamentos confirmados, reembolsos registrados e contagens de atendimentos/clientes/profissionais quando o periodo esta integralmente carregado;
- tabela de recebimentos Stripe com periodo, status, IDs de cliente/profissional, paginação cursor-based e vinculo explicito ao job quando disponivel;
- detalhe de recebimento com identificadores Stripe e status de conciliacao;
- area de Repasses baseada em `transfers` Stripe Connect, com status de transferencia, reversao e vinculo a atendimento quando a origem Stripe corresponde aos aliases existentes no job;
- economia Stripe Connect baseada em `application_fee_amount`, estornos de `application_fee` e `balance_transaction.fee`, apresentada separadamente de charges legados sem destino Connect;
- DRE simplificada que apresenta GMV, comissao e taxas Connect observadas, alem de reembolsos quando suportados; impostos, receita liquida consolidada, custos e lucro permanecem indisponiveis;
- cobertura unitária para `finance.read` e formato monetario em centavos.
- testes de contrato para autorização, filtros, paginação e resultados dos endpoints financeiros.

## Fontes e regras preservadas

- Stripe Charges continua como fonte de recebimento; valores sao tratados em centavos.
- Firestore `jobs` continua como fonte de vinculacao operacional, aceitando os aliases legados existentes de payment intent.
- Firestore `users` e carregado em lote apenas para identificar participantes dos jobs conciliados.
- Nenhuma colecao Firebase foi criada, removida ou modificada.
- Nenhuma regra de Stripe Connect, pagamento, desconto, refund ou negocio foi alterada.

## Limites deliberados

- A visao geral processa ate 1.000 charges por janela. Acima disso, ela marca os valores agregados como indisponiveis para evitar resultado parcial tratado como definitivo.
- A tabela de recebimentos apresenta uma pagina Stripe por vez. Filtros por cliente e profissional dependem de conciliacao do charge a um job; itens sem vinculo permanecem visiveis como tal.
- A busca filtrada percorre ate 1.000 charges por varredura e preserva o cursor para continuar quando houver mais historico, evitando uma consulta Stripe sem limite.
- Taxas e comissao sao exibidas somente para destination charges Connect com cobertura completa de `application_fee_amount` e `balance_transaction.fee`. Charges legados ficam fora desses indicadores.
- Impostos, custos operacionais, margem, lucro, CAC, LTV, churn e retencao nao sao calculados porque as fontes exigidas nao fazem parte do contrato atual.
- O modulo confirmou transfers e payouts acessiveis em contas Connect. Payout bancario nao e associado a transfer individual pela fonte atual, portanto o painel nao declara um repasse como pago no banco apenas com base no transfer.

## Validacao executada

- `npm run typecheck` passou;
- `npm run lint` passou sem avisos;
- `npm test -- --runInBand` passou com os novos testes financeiros;
- `npm run build` passou e reconheceu as rotas financeiras.

## Proxima evolucao condicionada

Antes de calcular repasses, receita efetiva ou DRE completa, confirmar o modelo Stripe Connect em producao e a disponibilidade de transferencias, payouts, application fees e balance transactions. A partir dessa confirmacao, a implementacao deve continuar na camada `src/modules/finance`, sem reincorporar a logica aos dashboards legados.