# Painel Oficial de KPI e Operacao - Cuide-me

Atualizado em: 12/04/2026

## 1. Objetivo

Este painel existe para traduzir a realidade do produto Cuide-me em uma leitura executiva e operacional confiavel.

Fonte primaria da verdade:
- Taxonomia GA4 oficial do repositorio principal `cuide-me-desenvolvimento-main`
- Dados operacionais persistidos no Firebase
- Confirmacao financeira no Stripe

O painel nao deve inventar evento, funil, status ou KPI que nao estejam sustentados pelo sistema principal.

## 2. Arquitetura final recomendada

Camada visual:
- `/admin` -> home consolidada de KPI e operacao
- `/admin/jobs` -> detalhamento operacional de atendimentos
- `/admin/alertas` -> trilha de alertas e excecoes
- `/admin/users` -> leitura por usuario e oferta
- `/admin/service-desk` -> tickets e suporte
- `/admin/torre-de-controle` -> redirect para `/admin`

Camada de dados:
- `src/app/api/admin/dashboard-v3/route.ts` -> contrato consolidado do painel
- `src/services/admin/kpiDashboardMetrics.ts` -> calculo dos blocos oficiais
- `src/services/admin/kpiDashboardTypes.ts` -> contrato da home
- `src/services/admin/analyticsCatalog.ts` -> glossario tecnico e renomeacoes
- `src/lib/server/ga4Admin.ts` -> cliente server-side do GA4

Fontes por bloco:
- Visao executiva -> GA4 + Firebase
- Funil principal -> GA4 canonico
- Saude operacional -> GA4 + Firebase + Stripe
- Liquidez -> GA4 + Firebase
- Confianca e experiencia -> GA4 + Firebase
- Alertas e excecoes -> derivado dos blocos acima

## 3. Diagnostico do painel anterior

### 3.1 Mapa da superficie antiga

Paginas relevantes:
- `/admin` -> home operacional antiga
- `/admin/torre-de-controle` -> versao expandida e redundante da home
- `/admin/funil` -> redirect legado
- `/admin/jobs` -> operacao por job
- `/admin/alertas` -> alertas operacionais
- `/admin/users` -> leitura por usuario
- `/admin/service-desk` -> tickets

Problemas principais encontrados:
- excesso de foco em heuristica de `jobs` e `charges` sem usar o funil oficial do produto
- nomenclatura generica e pouco executiva (`Torre de Controle`, `Health`, `Ranking Local`)
- duplicacao entre `/admin` e `/admin/torre-de-controle`
- documentacao interna do painel com GA4 antigo e taxonomia desatualizada
- KPIs financeiros e de elegibilidade misturados com leitura operacional sem hierarquia clara
- blocos pouco acionaveis para decisao executiva rapida

### 3.2 Classificacao dos indicadores anteriores

| Indicador anterior | Classificacao | Por que importa ou nao importa | Decisao/Acao suportada | Tipo |
|---|---|---|---|---|
| `weekly_orders_created` | ajustar | importa, mas o nome antigo nao explicava que o painel agora usa `Solicitacoes criadas` como linguagem oficial | decidir pressao de demanda no periodo | executivo |
| `weekly_active_eligible_professionals` | remover | mistura elegibilidade tecnica com oferta real pronta; pouco claro para decisao executiva | nenhuma decisao direta sem contexto adicional | diagnostico |
| `orders_with_proposal_24h_rate` | consolidar | importante como SLA, mas ficou melhor dentro de tempos e gargalos operacionais | agir em filas com atraso de proposta | operacional |
| `avg_time_to_first_proposal_hours` | manter e ajustar | continua relevante, com nome em portugues e contexto de SLA | priorizar matching e resposta inicial | diagnostico |
| `hiring_rate` | ajustar | taxa era generica; substituida por taxas oficiais por etapa do funil | agir na etapa com queda de conversao | operacional |
| `repurchase_rate` | remover | nao esta no centro da decisao desta rodada e dependia de leitura secundaria | nenhuma acao imediata para liquidez atual | executivo |
| `cancellation_rate` | ajustar | importante para confianca, mas agora com definicao explicita `servico cancelado / proposta aceita` | atuar em causas de cancelamento | operacional |
| `weekly_gmv` | remover da home principal | metricamente valida, mas virou leitura de vaidade nesta homepage | melhor em modulo financeiro dedicado | executivo |
| `platform_revenue` | remover da home principal | depende de take rate e nao responde gargalo de operacao ou conversao | melhor em modulo financeiro dedicado | executivo |
| `verified_and_payout_enabled_professionals_rate` | remover | util para compliance operacional, mas nao para leitura principal da Cuide-me neste momento | usar em trilha interna de backoffice, nao na home | diagnostico |
| `critical_jobs_open_24h` | consolidar | importa, mas precisa aparecer como gargalo e alerta, nao como KPI isolado | acionar matching manual | operacional |
| `jobs_eligible` | remover | numero generico e pouco acionavel | nao ajuda a decidir sozinho | diagnostico |
| `match_rate` | ajustar | importante, mas agora tratado como `Evolucao de match` na liquidez | agir em cobertura de oferta por regiao | operacional |
| `critical_jobs_48h` | consolidar | relevante, mas melhor exposto em alertas e gargalos | priorizar fila sem proposta | operacional |
| `critical_tickets_open` | consolidar | relevante para suporte, mas nao deve ocupar um card principal da homepage | descer para alertas e service desk | operacional |
| `payments_confirmed` | ajustar | mantido, agora diretamente ligado ao evento oficial `payment_confirmed` | decidir foco em checkout e conciliacao | executivo |
| `localRanking` | consolidar | havia sinal util, mas com semantica confusa | virou concentracao regional e taxa sem proposta por regiao | diagnostico |
| `supplyDemandByBairro` | consolidar | havia valor, mas duplicava leitura de liquidez local | unificado em concentracao regional | diagnostico |

## 4. Estrutura final do painel

### Bloco 1 - Visao executiva
- Familias cadastradas
- Profissionais cadastrados
- Logins realizados
- Solicitacoes iniciadas
- Solicitacoes criadas
- Propostas enviadas
- Propostas aceitas
- Pagamentos confirmados
- Servicos com encerramento confirmado
- Reembolsos processados

### Bloco 2 - Funil principal da plataforma
- Cadastro concluido
- Perfil concluido
- Profissional selecionado
- Solicitacao iniciada
- Solicitacao criada
- Proposta enviada
- Proposta aceita
- Pagamento confirmado
- Encerramento confirmado

### Bloco 3 - Saude operacional
- Conversao cadastro -> perfil concluido
- Conversao perfil -> selecao de profissional
- Conversao solicitacao criada -> proposta enviada
- Taxa de aceite de proposta
- Taxa de reembolso
- Taxa de cancelamento
- Tempo medio entre solicitacao criada e proposta enviada
- Tempo medio entre proposta enviada e proposta aceita
- Tempo medio entre proposta aceita e pagamento confirmado
- Gargalos por etapa

### Bloco 4 - Liquidez e marketplace
- Profissionais com perfil concluido
- Proporcao entre demanda criada e oferta enviada
- Cobertura de propostas por solicitacao
- Taxa de solicitacoes sem proposta
- Taxa de propostas aceitas
- Evolucao de match entre familia e profissional
- Concentracao por regiao

### Bloco 5 - Confianca e experiencia
- Avaliacoes enviadas
- Reembolsos processados
- Cancelamentos
- Validacoes criticas de preenchimento
- Contatos iniciados via WhatsApp
- Evolucao do preenchimento de perfil

### Bloco 6 - Alertas e excecoes
- Alta de reembolso
- Queda de aceite de proposta
- Solicitacoes sem proposta acima do aceitavel
- Cancelamento elevado apos aceite
- Lentidao entre aceite e pagamento
- Friccao de validacao em formularios criticos

## 5. KPIs oficiais do painel

| KPI | Tipo | Definicao | Formula/logica | Fonte | Periodicidade ideal | Objetivo de negocio | Acao esperada |
|---|---|---|---|---|---|---|---|
| Familias cadastradas | executivo | familias persistidas no periodo | `COUNT(users perfil=cliente createdAt no periodo)` | Firebase `users` | diario | medir entrada real de demanda | revisar aquisicao quando cair |
| Profissionais cadastrados | executivo | profissionais persistidos no periodo | `COUNT(users perfil=profissional createdAt no periodo)` | Firebase `users` | diario | medir entrada real de oferta | reforcar captacao quando cair |
| Logins realizados | executivo | logins concluidos no periodo | `COUNT(login)` | GA4 | diario | medir uso e retorno | auditar atrito de acesso |
| Solicitacoes iniciadas | executivo | inicios do fluxo de contratacao | `COUNT(care_request_started)` | GA4 | diario | medir intencao de contratacao | revisar descoberta de oferta |
| Solicitacoes criadas | executivo | pedidos persistidos no periodo | `COUNT(care_request_created)` | GA4 | diario | medir demanda qualificada | ajustar cobertura operacional |
| Propostas enviadas | executivo | propostas enviadas no periodo | `COUNT(proposal_sent)` | GA4 | diario | medir resposta da oferta | agir em cobertura/regiao |
| Propostas aceitas | executivo | propostas aceitas no periodo | `COUNT(proposal_accepted)` | GA4 | diario | medir conversao comercial | revisar qualidade e preco |
| Pagamentos confirmados | executivo | pagamentos efetivamente confirmados | `COUNT(payment_confirmed)` | GA4 | diario | medir fechamento real | revisar checkout e cobranca |
| Encerramentos confirmados | executivo | servicos concluídos com confirmacao | `COUNT(service_completion_confirmed)` | GA4 | diario | medir qualidade de fechamento | revisar acompanhamento do servico |
| Reembolsos processados | executivo | reembolsos concluidos | `COUNT(refund_processed)` | GA4 | diario | medir perda de confianca | auditar causas e politicas |
| Taxa de aceite de proposta | operacional | conversao proposta -> aceite | `proposal_accepted / proposal_sent` | GA4 | diario | medir aderencia comercial | rever proposta e SLA |
| Taxa de reembolso | operacional | pagamentos que viram reembolso | `refund_processed / payment_confirmed` | GA4 + Stripe | diario | medir desgaste operacional | atacar causas de reembolso |
| Taxa de cancelamento | operacional | servicos cancelados apos aceite | `service_canceled / proposal_accepted` | GA4 + Firebase | diario | medir confianca apos contratacao | agir em cancelamentos por motivo |
| Tempo medio solicitacao -> proposta | diagnostico | velocidade da primeira resposta | `AVG(firstProposalAt - createdAt)` | Firebase `jobs` | diario | medir SLA operacional | reforcar matching manual |
| Tempo medio proposta -> aceite | diagnostico | velocidade de decisao comercial | `AVG(acceptedAt - proposalSentAt)` | Firebase `jobs` | diario | medir atrito no meio do funil | melhorar follow-up |
| Tempo medio aceite -> pagamento | diagnostico | velocidade de fechamento | `AVG(paymentAt - acceptedAt)` | Firebase `jobs` + Stripe `charges` | diario | medir friccao de checkout | revisar cobranca/conciliacao |
| Cobertura de propostas | operacional | solicitacoes criadas que recebem proposta | `proposal_sent / care_request_created` | GA4 | diario | medir liquidez da oferta | abrir oferta em regioes pressionadas |
| Taxa de solicitacoes sem proposta | operacional | jobs do periodo sem proposta | `jobs sem firstProposalAt / jobs do periodo` | Firebase `jobs` | diario | medir backlog sem cobertura | priorizar fila sem proposta |
| Evolucao de match | diagnostico | jobs com profissional associado | `jobs com profissional / jobs do periodo` | Firebase `jobs` | diario | medir liquidez observada | ajustar cobertura por regiao |
| Avaliacoes enviadas | operacional | avaliacoes persistidas no periodo | `COUNT(ratings createdAt no periodo)` | Firebase `ratings` | diario | medir fechamento de experiencia | reforcar coleta de feedback |
| Validacoes criticas de preenchimento | diagnostico | exibicoes de campo obrigatorio | `COUNT(required_field_validation_shown)` | GA4 | diario | medir atrito evitavel | simplificar formularios |
| Contatos via WhatsApp iniciados | diagnostico | busca por ajuda via CTA | `COUNT(whatsapp_contact_started)` | GA4 | diario | medir necessidade de assistencia | cruzar com gargalos de UX |

## 6. Glossario tecnico -> portugues

| Tecnico | Nome no painel |
|---|---|
| `sign_up` | Cadastro concluido |
| `login` | Login concluido |
| `professional_profile_completed` | Perfil profissional concluido |
| `family_profile_completed` | Perfil da familia concluido |
| `professional_profile_selected` | Profissional selecionado |
| `care_request_started` | Solicitacao iniciada |
| `care_request_created` | Solicitacao criada |
| `proposal_sent` | Proposta enviada |
| `proposal_accepted` | Proposta aceita |
| `payment_confirmed` | Pagamento confirmado |
| `service_completion_confirmed` | Encerramento confirmado |
| `refund_processed` | Reembolso processado |
| `whatsapp_contact_started` | Contato via WhatsApp iniciado |
| `required_field_validation_shown` | Validacao de campo obrigatorio exibida |
| `service_canceled` | Servico cancelado |
| `rating_submitted` | Avaliacao enviada |

## 7. Renomeacoes obrigatorias

| Antes | Agora |
|---|---|
| `generate_lead` | `care_request_started` |
| `view_professional` | `professional_profile_selected` |
| `checkout_completed` | `payment_confirmed` |
| `service_completed` | `service_completion_confirmed` |
| `refund` | `refund_processed` |
| `refund_requested` | `refund_processed` |
| `appointment_canceled` | `service_canceled` |
| `whatsapp_cta_clicked` | `whatsapp_contact_started` |
| `validation_error_shown` | `required_field_validation_shown` |
| `professional_signup_started` | `sign_up` |
| `family_signup_started` | `sign_up` |

## 8. Regras para novos KPIs

Um novo KPI so entra na home principal se responder pelo menos uma pergunta:
- ajuda a decidir?
- ajuda a operar?
- ajuda a localizar gargalo?
- ajuda a medir liquidez, confianca ou conversao?

Um KPI nao entra na home principal quando:
- depende de inferencia fraca ou heuristica sem lastro
- repete outra leitura com nome diferente
- e bonito visualmente, mas nao indica acao
- usa evento legado ou nome desatualizado
- exige muitas explicacoes para ser entendido por lideranca

## 9. Riscos e observacoes de manutencao

- Historicos antigos com nomes legados precisam ser tratados como series encerradas.
- Quando GA4 estiver indisponivel, o painel deve mostrar indisponibilidade em vez de inventar numero substituto.
- Tempos operacionais dependem da qualidade de timestamps em `jobs` e da conciliacao com Stripe.
- Leitura regional e de liquidez usa demanda observada e nao capacidade futura em tempo real.
- Indicadores financeiros como GMV e receita ficaram fora da home principal para evitar poluicao de decisao; podem viver em modulo financeiro dedicado.