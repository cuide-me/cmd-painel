# Auditoria Fase 1 - Painel Administrativo Cuide-me

Data: 2026-07-18

Escopo: auditoria read-only do repositorio `cmd-painel`, cobrindo arquitetura, paginas, APIs, Firebase, autenticacao, dados, componentes, UX, acessibilidade, performance, testes e documentacao. Nenhuma regra de negocio, colecao Firebase ou comportamento funcional foi alterado.

## 1. Resumo executivo

O painel ja possui uma superficie ativa clara: home de KPI e operacao, atendimentos, alertas, service desk e usuarios. A separacao inicial entre paginas, APIs e servicos tambem e um ponto positivo.

Entretanto, a implementacao ainda nao sustenta crescimento operacional com seguranca e previsibilidade. Os riscos mais importantes sao:

1. leituras integrais e enriquecimento N+1 em consultas administrativas;
2. autenticacao baseada em uma senha unica de ambiente e um UID Firebase fixo;
3. ausencia de testes automatizados;
4. contratos, tipos e logicas de metricas duplicados;
5. tratamento excessivo de PII em respostas e URLs de documentos;
6. Design System e acessibilidade aplicados de forma parcial;
7. documentacao oficial que descreve uma arquitetura mais consolidada do que o codigo atual entrega.

A recomendacao e nao tentar evoluir cada tela diretamente. Primeiro deve ser criada uma base transversal de contratos, autorizacao, query layer, Design System e testes. Em seguida, os modulos existentes devem ser migrados um por vez, preservando as mesmas regras de negocio e contratos externos.

## 2. Metodo e limites

Foram analisados:

- estrutura de `src/app`, `src/components`, `src/hooks`, `src/lib`, `src/services` e `src/firebase`;
- paginas e rotas API administrativas ativas;
- autenticacao Firebase, chamadas ao Firestore, Stripe e GA4;
- documentacao oficial, incluindo `README.md`, `KPI_PAINEL_OFICIAL.md` e `PAINEL_ADMIN_ARQUITETURA.md`;
- scripts e dependencias definidos em `package.json`;
- disponibilidade de testes e validacoes locais.

Limites da auditoria:

- a copia local nao possui diretorio `.git`; portanto, nao foi possivel revisar historico, branches ou autoria;
- o arquivo de ambiente foi disponibilizado pelo operador, mas nao foi lido nem exposto, para evitar tratamento de segredos;
- integracoes reais com Firebase, Stripe e GA4 nao foram exercitadas durante a auditoria;
- o ambiente local reconhece Firebase, Stripe, GA4 e as variaveis publicas apos o carregamento de `.env.local`, mas `ADMIN_PASSWORD` permanece ausente;
- o arquivo de ambiente continha entradas malformadas com aparencia de segredo sem chave. Elas nao foram reproduzidas nem removidas automaticamente;
- dependencias foram instaladas com `npm ci`; o audit do npm reportou 22 vulnerabilidades transitivas, incluindo 2 criticas. Elas exigem avaliacao separada antes de qualquer atualizacao forcada.

## 3. Superficie atual confirmada

Rotas administrativas ativas:

- `/admin`: painel consolidado de KPI e operacao;
- `/admin/jobs`: atendimentos;
- `/admin/alertas`: alertas;
- `/admin/service-desk`: tickets;
- `/admin/users`: usuarios;
- `/admin/login`: autenticacao;
- `/admin/torre-de-controle`: redirecionamento para a home.

APIs administrativas ativas:

- `GET /api/admin/dashboard-v3`;
- `GET /api/admin/jobs`;
- `GET /api/admin/alertas`;
- `GET /api/admin/tickets`;
- `GET /api/admin/users`;
- `POST /api/admin/auth/login`.

Fontes de dados:

- Firestore: `users`, `jobs`, `payments`, `ratings`, `tickets` e series de aging;
- Firebase Storage: certificados de profissionais;
- Stripe: status de contas Connect e dados financeiros;
- GA4: eventos de funil e indicadores executivos.

## 4. Achados priorizados

### P0 - Escalabilidade e custo das consultas

Problema: `listUsers` consulta usuarios e, para cada resposta, faz leituras integrais de `jobs`, `payments`, `ratings` e `tickets`. Em seguida, gera uma consulta Stripe por usuario que tenha conta conectada. A busca e a ordenacao tambem ocorrem depois da leitura no servidor.

Evidencias:

- `src/services/admin/users/listUsers.ts`;
- `src/services/admin/kpiDashboardMetrics.ts`;
- `src/services/admin/dashboardV3Metrics.ts`;
- `src/services/admin/alerts/listAlerts.ts`.

Impacto atual:

- custo de Firestore cresce com o tamanho total das colecoes, nao com a pagina solicitada;
- latencia e risco de timeout aumentam em listagens e dashboards;
- o Stripe pode sofrer rate limiting por chamadas por usuario;
- a paginacao de usuarios nao representa uma pagina eficiente de dados, pois as agregacoes continuam globais.

Solucao proposta:

- introduzir repositories server-side por dominio com filtros, cursores e limites obrigatorios;
- criar indices compostos a partir das consultas reais aprovadas;
- substituir agregacoes globais em tempo de request por read models/contadores por periodo e usuario;
- buscar dados Stripe em lote ou por sincronizacao controlada, nunca uma chamada por linha de tabela;
- definir budgets de leitura, latencia e tamanho de pagina por endpoint.

Beneficio: menor custo, paginaresposta previsivel e base pronta para mais usuarios e atendimentos.

Esforco: alto. Risco: medio, porque filtros e ordenacao precisam manter a semantica atual.

### P0 - Autenticacao administrativa e autorizacao insuficientemente granulares

Problema: o login compara a senha recebida diretamente com `ADMIN_PASSWORD` e emite um custom token para o UID fixo `admin-panel-user`, sempre com claim `admin: true`. O rate limit de login e mantido em memoria do processo.

Evidencias:

- `src/app/api/admin/auth/login/route.ts`;
- `src/lib/server/auth.ts`;
- `src/hooks/useAdminAuth.ts`;
- `src/lib/client/authFetch.ts`.

Impacto atual:

- nao existe identidade individual auditavel para operadores;
- nao ha papeis e permissoes por modulo/acao;
- rate limit nao e compartilhado entre instancias e se perde em reinicios;
- uma unica senha concede acesso total;
- o fallback de perfil no Firestore e util, mas nao substitui uma matriz central de autorizacao.

Solucao proposta:

- usar identidades individuais do Firebase Auth; nao compartilhar UID administrativo;
- definir `Role`, `Permission`, `Scope` e uma matriz unica de autorizacao;
- aplicar autorizacao no servidor por acao, nao apenas por rota;
- mover rate limiting para servico compartilhado e adicionar auditoria de login, acesso a PII e acoes administrativas;
- manter compatibilidade temporaria com a entrada atual somente durante uma migracao controlada e validada.

Beneficio: rastreabilidade, menor risco de acesso indevido e base para crescimento de equipe.

Esforco: alto. Risco: alto, pois um erro pode bloquear operadores ou ampliar acesso. Exige testes de autorizacao antes de ativacao.

### P0 - Ausencia de testes automatizados e baseline de qualidade incompleta

Problema: nao foram encontrados arquivos de teste em `src` nem suites de integracao. O comando de lint declarado usa `next lint`, que nao e uma interface valida nas versoes recentes do Next.js. O typecheck nao esta definido como script e o binario TypeScript nao esta disponivel localmente neste ambiente.

Evidencias:

- `package.json`;
- ausencia de `*.test.*`, `*.spec.*` e `__tests__` fora de dependencias;
- `./node_modules/.bin/tsc --noEmit` concluiu com codigo 0 apos `npm ci`;
- `npm run lint` falha porque executa `next lint`, interpretado pelo Next.js 16 como diretorio invalido;
- ESLint 9 falha diretamente porque nao existe `eslint.config.*`;
- `npm test -- --runInBand` falha porque o comando `jest` nao esta instalado.

Impacto atual:

- refatoracoes de arquitetura sao de alto risco;
- regras de KPI, normalizacao de status, filtros e permissoes podem regredir silenciosamente;
- nao ha gate confiavel para deploy.

Solucao proposta:

- corrigir scripts de qualidade e garantir dependencias locais;
- criar testes unitarios para transformacoes, normalizadores e calculos;
- criar testes de integracao para APIs, auth e repositories usando Firebase Emulator/mocks;
- criar cenarios E2E para login, listagens, filtros, navegação e estados de erro;
- tornar lint, typecheck, testes e build gates obrigatorios no CI.

Beneficio: migracao modular segura e manutencao previsivel.

Esforco: alto. Risco: baixo para comportamento, medio para prazo.

### P1 - Contratos, tipos e logicas de dominio duplicados

Problema: ha dois modelos de dashboard concorrentes e tipos duplicados. `AlertSeverity` possui conjuntos diferentes em `alerts/types.ts` e `dashboardV3Types.ts`. Ha mais de uma implementacao de `toDate` e de normalizacao de status; os normalizadores nao tem exatamente a mesma saida.

Evidencias:

- `src/services/admin/kpiDashboardMetrics.ts`;
- `src/services/admin/kpiDashboardTypes.ts`;
- `src/services/admin/dashboardV3Metrics.ts`;
- `src/services/admin/dashboardV3Types.ts`;
- `src/services/admin/alerts/types.ts`;
- `src/services/admin/statusNormalizer.ts`;
- `src/lib/dateUtils.ts`;
- `src/lib/admin/dateHelpers.ts`.

Impacto atual:

- risco de uma mesma regra produzir resultados distintos por tela;
- tipagem perde valor por casts e adaptacoes locais;
- manutencao exige alterar muitos pontos para uma mudanca conceitual simples.

Solucao proposta:

- escolher um contrato canonico para cada conceito de dominio;
- centralizar Value Objects e tipos compartilhados em `src/modules/shared/domain`;
- manter adaptadores somente na fronteira para campos legados;
- eliminar o dashboard concorrente depois de mapear consumidores e cobrir paridade com testes.

Beneficio: alta coesao e menor risco de divergencia entre modulos.

Esforco: medio. Risco: medio, pois dados legados precisam continuar sendo normalizados.

### P1 - Dados pessoais e documentos sem politica de minimizacao explicita

Problema: a listagem administrativa retorna email, telefone, endereco e outros dados de usuario. Tambem gera URLs assinadas de certificados com validade de sete dias diretamente no caminho de listagem.

Evidencias:

- `src/services/admin/users/listUsers.ts`;
- `src/services/admin/users/types.ts`;
- `src/app/api/admin/users/route.ts`.

Impacto atual:

- maior superficie de exposicao de PII no navegador e em logs de rede;
- links de documentos podem circular por periodo longo;
- nao ha evidencia de auditoria de visualizacao ou download de PII.

Solucao proposta:

- usar DTOs de listagem minimizados e mascarar dados que nao sao necessarios;
- buscar dados completos e documentos somente em uma tela de detalhe protegida por permissao especifica;
- emitir URL assinada sob demanda, com TTL curto e auditoria;
- introduzir politicas de redacao em logs e criterios de retencao.

Beneficio: melhor aderencia a LGPD e reducao de risco operacional.

Esforco: medio. Risco: medio, pois operadores precisam manter acesso ao necessario para executar o trabalho.

### P1 - Componentes e layout com responsabilidades concentradas

Problema: `src/app/admin/layout.tsx` concentra verificacao de sessao, header, breadcrumbs, menu rapido, navegacao e logout. Paginas administrativas concentram estado, fetch, filtros e renderizacao. `AdminPrimitives.tsx` e uma colecao grande de componentes sem contrato de Design System formal.

Impacto atual:

- dificeis testes isolados;
- alteracoes de navegação ou sessao podem afetar toda a superficie;
- componentes compartilhados ficam acoplados a detalhes de pagina.

Solucao proposta:

- separar `AdminShell`, `AdminHeader`, `AdminSidebar`, `AdminBreadcrumbs` e `UserMenu`;
- mover dados para hooks de feature e UI para componentes de apresentacao;
- definir primitives acessiveis e componentes compostos de dominio;
- manter cada modulo coeso com `api`, `components`, `hooks`, `queries`, `types` e `tests` proximos.

Beneficio: evolucao modular e menor custo de manutencao.

Esforco: medio. Risco: baixo quando migrado por modulo.

### P1 - UX, responsividade e acessibilidade inconsistentes

Problema: filtros possuem labels incompletas, botoes de icone nao possuem sempre nome acessivel, o menu rapido nao implementa comportamento de dialog/menu acessivel, tabelas densas dependem de scroll horizontal e a navegacao nao tem skip link. Badges dependem muito de cor e ha contraste insuficiente em variantes de aviso.

Evidencias:

- `src/app/admin/layout.tsx`;
- `src/components/admin/AdminPrimitives.tsx`;
- `src/app/admin/jobs/page.tsx`;
- `src/app/admin/users/page.tsx`;
- `src/components/admin/LoadingState.tsx`.

Impacto atual:

- uso dificil por teclado, leitor de tela e dispositivos menores;
- baixa consistencia entre estados de loading, erro e vazio;
- telas operacionais perdem eficiencia em contexto de atendimento rapido.

Solucao proposta:

- adotar componentes semanticamente acessiveis e testes WCAG;
- definir view de tabela para desktop e cards/resumo para mobile;
- padronizar estados de carregamento, erro, vazio e retry;
- adicionar skip link, foco visivel, labels, descricoes e navegacao de teclado;
- validar contraste e informacao de status por texto/icone, nao apenas cor.

Beneficio: painel mais rapido, inclusivo e consistente.

Esforco: medio. Risco: baixo.

### P2 - Observabilidade, cache e tratamento de falhas fragmentados

Problema: existem implementacoes paralelas de logger, rate limit, Design System e helpers de data. O cache e local/TTL e nao possui estrategia explicita de invalidacao por alteracao de dado. Respostas de erro de algumas APIs repassam a mensagem original.

Evidencias:

- `src/lib/logger.ts`;
- `src/lib/observability/logger.ts`;
- `src/lib/rateLimit.ts`;
- `src/lib/rate-limit/index.ts`;
- `src/lib/cache.ts`;
- `src/lib/apiMiddleware.ts`;
- `src/app/api/admin/users/route.ts`.

Solucao proposta:

- um contrato unico de log estruturado com redacao de PII e correlation ID;
- um contrato unico de erro para APIs e UI;
- cache somente nos casos de leitura que suportem consistencia eventual, com chave, TTL e invalidacao definidos;
- health checks por dependencia e dados parciais explicitamente marcados como indisponiveis.

Beneficio: investigacao de incidentes mais rapida e menos dados enganosos no painel.

Esforco: medio. Risco: baixo.

### P2 - Divergencia entre documentacao e implementacao

Problema: o README descreve a superficie ativa corretamente, mas outros documentos historicos continuam no raiz. A documentacao oficial apresenta uma arquitetura final recomendada, enquanto o codigo ainda possui dashboards e tipos concorrentes, consultas globais e lacunas de teste.

Impacto atual:

- novos contribuidores podem tomar como fato algo que ainda e meta;
- decisoes de arquitetura ficam ambíguas;
- aumenta risco de reintroduzir superficie legada ou KPI nao validado.

Solucao proposta:

- separar documentos em `docs/current`, `docs/decisions`, `docs/runbooks` e `docs/archive`;
- dar status explicito de `implemented`, `planned` ou `deprecated` a cada documento relevante;
- manter ADRs para decisoes de contratos, RBAC, read models e Design System.

Beneficio: onboarding melhor e menor ambiguidade tecnica.

Esforco: baixo. Risco: baixo.

## 5. Arquitetura-alvo proposta

O painel deve ser uma aplicacao administrativa modular. Ele nao deve duplicar regras do core; deve consumir contratos e read models autorizados.

```text
src/
  app/
    (admin)/
      layout.tsx
      dashboard/
      clientes/
      profissionais/
      atendimentos/
      alertas/
      service-desk/
      usuarios/
  modules/
    dashboard/
      api/
      components/
      domain/
      queries/
      tests/
    usuarios/
    atendimentos/
    alertas/
    service-desk/
  shared/
    auth/
    design-system/
    errors/
    observability/
    ui/
    validation/
  server/
    authorization/
    repositories/
    read-models/
    integrations/
```

Regras da arquitetura:

- paginas compoem features; nao fazem regras de negocio nem consultas diretas;
- APIs autenticam, autorizam, validam entrada e chamam um caso de uso/repository;
- repositories isolam Firestore, Stripe, GA4 e Storage;
- DTOs administrativos sao separados dos documentos brutos de Firestore;
- campos legados sao normalizados somente em adaptadores;
- dashboards leem agregados/read models; listagens leem colecoes paginadas;
- cada permissao e aplicada no servidor e tambem reflete na navegacao;
- modulos futuros podem ser adicionados sem reorganizar a base.

## 6. Roadmap de reestruturacao

### Fase 1 - Auditoria completa

Objetivo: concluir o inventario tecnico, de dados e UX do painel atual.

Justificativa: uma reestruturacao segura requer saber o que esta ativo, o que e legado e quais contratos nao podem mudar.

Impacto: somente documentacao e baseline de qualidade.

Dependencias: acesso local ao repositorio e variaveis de ambiente configuradas fora do controle de versao.

Riscos: documentacao historica ser confundida com comportamento atual.

Conclusao: este documento aprovado, com escopo e prioridades confirmados pelo responsavel do produto.

### Fase 2 - Fundacoes arquiteturais e contratos

Objetivo: criar estrutura modular, tipos canonicos, adaptadores para campos legados, contratos de API e convencoes de importacao.

Justificativa: elimina divergencia antes de migrar UI ou consultas.

Impacto: `src/services`, `src/lib`, contratos de API e tipos internos. Nenhuma regra de negocio deve mudar.

Dependencias: aprovacao da Fase 1 e mapa dos consumidores dos endpoints existentes.

Riscos: alterar formato de resposta sem adaptador pode quebrar a UI. Mitigacao: manter contratos externos durante a migracao e cobrir paridade com testes.

Conclusao: um unico contrato por conceito de dominio, imports por boundary e adapters testados para modelos legados.

Status em 2026-07-18: concluida para a primeira fatia transversal, sem alteracao de contratos externos ou regra de negocio.

Entregas realizadas:

- `src/modules/shared/domain/time-window.ts`: fonte unica de `TimeWindow`, lista de valores aceitos e type guard;
- `src/modules/shared/domain/date.ts`: conversao segura e unica de `Date`, timestamp, string e numero;
- `src/modules/shared/domain/job-fields.ts`: adaptadores para `clientId`/`familyId`/`clienteId`/`userId` e `professionalId`/`specialistId`/`profissionalId`;
- `src/modules/shared/domain/text.ts`: normalizacao de texto, busca case-insensitive e nome de exibicao;
- contratos de KPI e V3 preservam imports existentes por reexport de `TimeWindow`;
- listagem de jobs, normalizador de status e dashboard V3 passaram a consumir adaptadores compartilhados quando a semantica era equivalente;
- helpers antigos de data permanecem como camadas de compatibilidade, evitando quebra de import durante a migracao.

Deliberadamente nao migrado nesta fase:

- os dois contratos de severidade de alerta permanecem separados porque representam escalas diferentes e uma unificacao sem decisao de produto alteraria comportamento;
- o normalizador local do dashboard V3 permanece proprio onde sua semantica de `in_progress` difere do status canonico `matched`/`active`;
- queries, agregacoes, RBAC e layout nao foram alterados: pertencem as fases especificas do roadmap.

Validacao executada:

- `./node_modules/.bin/tsc --noEmit` passou;
- `npm run build` passou com todas as rotas administrativas compiladas.

### Fase 3 - Design System e acessibilidade

Objetivo: formalizar tokens e criar primitives reutilizaveis alinhadas a identidade visual da Cuide-me.

Justificativa: consistencia visual, acessibilidade e velocidade de entrega dependem de componentes compartilhados de verdade.

Impacto: `globals.css`, componentes compartilhados, layout e paginas administrativas.

Dependencias: diretrizes visuais do site principal e Fase 2 concluida para organizar imports.

Riscos: generalizar cedo demais. Mitigacao: iniciar com primitives usadas por pelo menos dois modulos.

Conclusao: tokens semanticos, componentes de formulario/tabela/feedback acessiveis, estados padronizados e testes de teclado/contraste.

Status em 2026-07-18: concluida para a camada compartilhada, sem redesenhar modulos ou alterar fluxos.

Entregas realizadas:

- `src/app/globals.css`: tokens CSS semanticos de marca, superficie, texto, borda e foco; foco visivel padronizado; suporte a `prefers-reduced-motion`;
- `src/components/admin/AdminPrimitives.tsx`: foco de teclado e anuncio acessivel para tooltip; botao semantico para `Card` clicavel; botoes com estados disabled consistentes; badges com contraste reforcado; tabela com `scope="col"`; navegacao de abas identificada; estados vazios com icones decorativos ocultos de leitores de tela;
- `src/components/admin/LoadingState.tsx`: estados de carregamento anunciados por leitores de tela e grafico skeleton deterministico, sem `Math.random()` durante renderizacao.

Deliberadamente nao migrado nesta fase:

- estilos locais em paginas permanecem para evitar um redesenho em massa sem revisao de cada fluxo;
- tabelas densas ainda usam rolagem horizontal. A representacao compacta para mobile sera feita durante a migracao individual de usuarios e atendimentos;
- os dois arquivos TypeScript de tokens existentes permanecem por compatibilidade. Sua consolidacao depende da migracao de consumidores para tokens CSS/utility definidos nesta fase;
- nao foi adicionado modo escuro, pois ele nao existe na identidade atual e seria uma nova decisao de produto.

Validacao executada:

- `./node_modules/.bin/tsc --noEmit` passou;
- `npm run build` passou com todas as rotas administrativas compiladas.

### Fase 4 - Shell, sessao e autorizacao

Objetivo: reconstruir layout responsivo, navegacao, breadcrumbs, sessao e matriz de permissoes.

Justificativa: todo modulo depende de uma experiencia e protecao consistentes.

Impacto: login, layout, menu e middleware/API authorization.

Dependencias: Fases 2 e 3, alem de decisao de produto sobre papeis iniciais.

Riscos: bloquear acesso de operador ou permitir acao indevida. Mitigacao: testes de permissao, rollout com conta de break-glass e logs de auditoria.

Conclusao: identidade individual, permissoes server-side por acao, menu condicionado por permissao e shell acessivel em desktop/mobile.

Status em 2026-07-18: concluida para matriz de permissao, guards por acao e navegacao condicionada. A migracao para identidades administrativas individuais permanece pendente de decisao de produto e operacao.

Entregas realizadas:

- `src/modules/shared/auth/permissions.ts`: matriz central com papeis preparados para `admin`, `operations`, `support`, `finance` e `viewer`;
- `src/lib/server/auth.ts`: `requireAdminPermission`, que valida token, privilegio administrativo e permissao explicita no servidor;
- APIs de dashboard, atendimentos, alertas, tickets, usuarios e coleta de metricas agora usam guard por permissao, em substituicao ao guard binario local;
- `src/hooks/useAdminAuth.ts`: expoe papel e funcao `can(permission)` para a camada cliente;
- `src/app/admin/layout.tsx`: itens de navegacao declaram permissao, sao filtrados pela matriz e receberam skip link, landmarks de navegacao e alvo de foco no conteudo principal.

Compatibilidade:

- o claim e perfil atuais de `admin` continuam com todas as permissoes; nenhuma rota existente perdeu acesso;
- papeis futuros nao sao emitidos pelo login atual e, portanto, ainda nao concedem acesso na pratica;
- a senha de ambiente e o UID Firebase compartilhado nao foram modificados. Sua substituicao por identidades individuais, rate limit compartilhado e auditoria de login permanece uma entrega de seguranca dedicada.

Validacao executada:

- `./node_modules/.bin/tsc --noEmit` passou;
- `npm run build` passou com todas as rotas administrativas compiladas.

### Fase 5 - Camada de dados e performance

Objetivo: substituir leituras integrais por queries paginadas, indices, read models e integracoes controladas.

Justificativa: e o principal requisito para o painel suportar os proximos tres anos de operacao.

Impacto: Firestore, Stripe, GA4, cache, dashboards e listagens.

Dependencias: contratos canonicos, metricas oficiais aprovadas e estrategia de migracao de indices/read models.

Riscos: mudar a definicao de KPI sem perceber. Mitigacao: testes com snapshots de dados conhecidos, comparacao de resultados e rollout por endpoint.

Conclusao: nenhuma listagem administrativa executa varredura global; cada endpoint possui budget de leitura/latencia e os KPIs expõem freshness/origem.

Status em 2026-07-18: primeira fatia segura concluida. A eliminacao de varreduras globais permanece dependente de read models e de uma decisao de dados aprovada, para nao alterar a definicao dos KPIs existentes.

Entregas realizadas:

- status de conta Stripe Connect em `listUsers` agora usa cache server-side de 60 segundos por conta. Isso elimina chamadas repetidas ao Stripe quando um profissional aparece em mais de uma consulta dentro da janela;
- `listTickets` foi separado entre leitura sem cache e wrapper com cache server-side de 60 segundos por janela de tempo;
- `listAlerts` foi separado entre leitura sem cache e wrapper com cache server-side de 60 segundos por combinacao de filtros;
- respostas e contratos das APIs foram preservados; a lista de usuarios com PII nao foi colocada no cache compartilhado.

Decisao tecnica registrada:

- `kpiDashboardMetrics` ainda requer todos os usuarios para a distribuicao regional usada na home. Limitar a query por data agora mudaria silenciosamente a semantica do indicador;
- `listUsers` ainda agrega `jobs`, `payments`, `ratings` e `tickets` por leitura integral. Corrigir isso exige um read model por usuario, agregados de periodo ou consultas/indexes que cubram os campos legados. Nenhuma dessas opcoes deve ser introduzida sem definir ownership, atualizacao e consistencia dos dados;
- a proxima fatia de performance deve definir um contrato de `adminMetrics` ou uma estrategia de agregacao derivada no core. Somente depois as leituras globais podem ser substituidas sem perda funcional.

Validacao executada:

- `./node_modules/.bin/tsc --noEmit` passou;
- `npm run build` passou com todas as rotas administrativas compiladas.

### Fase 6 - Migracao modular de telas existentes

Objetivo: refatorar os modulos existentes, um por vez, mantendo comportamento e contratos.

Ordem planejada: usuarios, atendimentos, alertas, service desk, dashboard consolidado.

Justificativa: cada migracao valida a arquitetura com risco limitado.

Impacto: paginas, APIs, componentes e testes de cada modulo.

Dependencias: Fases 2 a 5 estaveis.

Riscos: regressao funcional em filtros, dados sensiveis ou acoes de operador. Mitigacao: checklist de paridade, feature flags quando necessario e homologacao operacional.

Conclusao: cada modulo tem owner, DTO, permissions, query layer, UI responsiva, estados de erro/loading/vazio e cobertura de testes.

Status em 2026-07-18: concluida para a modularizacao visual dos modulos existentes: atendimentos, usuarios, alertas, service desk e dashboard consolidado. A migracao foi iniciada por `/admin/jobs`, antes de usuarios, para validar o padrao de componentes de uma tela operacional sem alterar sua API ou regras existentes.

Entregas realizadas:

- `src/modules/jobs/components/JobsSummary.tsx`: resumo dos indicadores de atendimentos extraido da pagina;
- `src/modules/jobs/components/JobsFiltersPanel.tsx`: filtros, busca, sugestoes e exportacao CSV extraidos para o modulo, preservando valores, opcoes, callbacks e reset de pagina;
- `src/modules/jobs/components/JobsResults.tsx`: tabela, badges de status/criticidade, estado vazio e paginacao extraidos para o modulo;
- `src/app/admin/jobs/page.tsx`: reduzida a composicao, carregamento dos dados e orquestracao do estado da tela;
- controles de filtros receberam labels associados e a paginacao passou a anunciar a pagina atual para tecnologias assistivas.
- `src/modules/users/components/UsersSummary.tsx`: indicadores de usuarios extraidos da pagina;
- `src/modules/users/components/UsersFiltersPanel.tsx`: filtros locais e comando de exportacao CSV extraidos para o modulo, mantendo o estado e o reset de pagina na pagina;
- `src/modules/users/components/UsersResults.tsx`: tabela, badges, links de certificados, estado vazio e paginacao extraidos para o modulo;
- `src/app/admin/users/page.tsx`: reduzida a autenticacao, carregamento, derivacao de dados, filtros em memoria, exportacao e composicao dos componentes do modulo.
- `src/modules/alerts/components/AlertsExecutiveSummary.tsx`: cards de resumo executivo e de coerencia com a home extraidos para o modulo;
- `src/modules/alerts/components/AlertsFiltersPanel.tsx`: filtros de severidade, tipo, status e busca extraidos, com estado e montagem de parametros preservados na pagina;
- `src/modules/alerts/components/AlertsResults.tsx`: filas de alertas da home e operacionais, badges, contexto, acoes sugeridas e tabela de itens afetados extraidos para o modulo;
- `src/app/admin/alertas/page.tsx`: reduzida a autenticacao, leitura das APIs, ordenacao, derivacao dos indicadores e composicao da tela.
- `src/modules/service-desk/components/ServiceDeskControls.tsx`: selecao de periodo, carimbo da ultima atualizacao e busca extraidos para o modulo;
- `src/modules/service-desk/components/ServiceDeskResults.tsx`: lista de tickets, badges de status/prioridade e estado vazio extraidos para o modulo;
- `src/app/admin/service-desk/page.tsx`: reduzida a autenticacao, carregamento, abas, filtragem em memoria e composicao da tela.
- `src/modules/dashboard/components/SourceIntegrityBanner.tsx`: banner de recencia, disponibilidade e limitacoes das fontes extraido para o modulo;
- `src/modules/dashboard/components/DashboardTaxonomyTables.tsx`: tabelas de taxonomia amigavel e renomeacao de eventos legados extraidas para o modulo;
- `src/modules/dashboard/components/DashboardAlertsList.tsx`: lista de alertas da home, badges, fontes e acoes esperadas extraida para o modulo;
- `src/modules/dashboard/components/DashboardMetricCard.tsx`: card reutilizavel de metricas e seus formatadores de valor, percentual, status e comparacao extraidos para o modulo;
- `src/modules/dashboard/components/DashboardFunnelVisuals.tsx`: funil oficial, barras de abandono/conversao e diagnostico de tempo por etapa extraidos para o modulo;
- `src/modules/dashboard/components/DashboardZoneDistribution.tsx`: graficos Recharts de profissionais e familias por zona, incluindo tooltip e legenda, extraidos para o modulo;
- `src/modules/dashboard/components/DashboardRegionHeatmap.tsx`: heatmap de demanda, gap e cobertura por regiao extraido para o modulo;
- `src/app/admin/page.tsx`: mantem leitura, estado, selecao/ordenacao/derivacao de KPIs e composicao dos blocos restantes do dashboard.

Paridade preservada:

- endpoint, permissao `jobs.read`, filtros, busca, ordenacao, exportacao e paginacao mantem o comportamento anterior;
- colunas, textos de status, criterio de criticidade e dados exibidos nao foram alterados;
- nenhuma colecao Firebase, query de dados ou regra de negocio foi modificada.
- endpoint, permissao `users.read`, abas, filtros, ordenacao, exportacao CSV, paginacao, colunas e links de certificados mantem o comportamento anterior;
- a listagem de usuarios continua sem cache compartilhado, para nao ampliar a exposicao de PII;
- nenhuma colecao Firebase, query de dados, DTO de resposta ou regra de negocio de usuarios foi modificada.
- endpoints, permissao `alerts.read`, janela, filtros, busca, ordenacao por severidade/data, fontes de dados e textos de acao continuam com o comportamento anterior;
- nenhuma colecao Firebase, query de dados, DTO de resposta ou regra de negocio de alertas foi modificada.
- endpoint, permissao `tickets.read`, janelas de consulta, abas, busca, filtros, badges e calculo de prioridade continuam com o comportamento anterior;
- nenhuma colecao Firebase, query de dados, cache, DTO de resposta ou regra de negocio de tickets foi modificada.
- endpoint, permissao `dashboard.read`, janela temporal, filtro de zona, metricas, funil, alertas, fontes e regras de derivacao continuam com o comportamento anterior;
- nenhuma colecao Firebase, query de dados, integracao GA4/Stripe, DTO de resposta ou definicao de KPI foi modificada.

Validacao executada:

- `./node_modules/.bin/tsc --noEmit` passou apos cada extracao;
- `npm run build` passou com todas as rotas administrativas compiladas.

Encerramento da Fase 6:

- as paginas administrativas agora orquestram autenticacao, carregamento, estado e derivacoes locais; seus blocos de apresentacao foram movidos para modulos coesos;
- endpoints, contratos externos, colecoes Firebase, queries, caches e regras de negocio foram preservados;
- a rota de dashboard mantem blocos compostos como composicao intencional, enquanto cards, funil, graficos, alertas, taxonomia e integridade de fontes estao modularizados;
- a cobertura automatizada segue pendente porque Jest e os arquivos de teste ainda nao estao disponiveis no repositorio.

Proxima fase: Fase 7 - qualidade, observabilidade e entrega, mediante aprovacao explicita.

### Fase 7 - Qualidade, observabilidade e entrega

Objetivo: consolidar CI, testes, logs, auditoria, documentacao e plano de rollout.

Justificativa: evita que a nova arquitetura se deteriore apos a migracao.

Impacto: scripts, pipeline, logs, runbooks e processo de revisao.

Dependencias: modulos migrados e validacoes executaveis locais.

Riscos: gates muito rigidos bloquearem entregas. Mitigacao: adocao gradual com baseline e metas incrementais.

Conclusao: lint, typecheck, testes e build obrigatorios; alertas de producao, auditoria de PII e rollback documentado.

Status em 2026-07-18: primeira fatia de qualidade concluida. Observabilidade, CI, auditoria de PII e plano de rollback permanecem pendentes e nao foram simulados nesta entrega.

Entregas realizadas:

- `package.json`: scripts `typecheck`, `lint`, `test` e `test:coverage` passam a usar ferramentas locais compativeis com Next.js 16;
- `eslint.config.mjs`: configuracao flat baseada em `eslint-config-next/core-web-vitals`, com saida de lint sem erros ou advertencias;
- Jest, `ts-jest` e `@types/jest` foram adicionados como dependencias de desenvolvimento; a configuracao existente deixou de referenciar setup inexistente;
- `__tests__/modules/shared/domain`: contratos de conversao de data, janelas de tempo e aliases legados de jobs;
- `__tests__/modules/shared/auth/permissions.test.ts`: contratos de papeis e permissoes, incluindo a nao concessao de escrita a papeis nao administrativos;
- `useAutoRefresh`: reset de contador agendado fora do corpo sincrono do efeito, removendo o erro de lint sem alterar o intervalo de atualizacao;
- diretivas ESLint obsoletas foram removidas de pontos que ja nao exigiam supressao.
- `.github/workflows/ci.yml`: gate de entrega para `push` e `pull_request`, com `npm ci`, typecheck, lint, testes e build em Node 22.
- `src/lib/observability/redact.ts`: redacao recursiva de credenciais e PII em metadata, incluindo tokens, cookies, senhas, e-mails, telefones e documentos;
- `src/lib/logger.ts`, `src/lib/observability/logger.ts` e `src/lib/error-tracking.ts`: emissao de logs e breadcrumbs passa a sanitizar contexto, headers e mensagens antes da serializacao;
- `__tests__/lib/observability/redact.test.ts`: contratos de redacao para campos aninhados e valores sensiveis embutidos em texto.
- `__tests__/app/api/admin/auth/login/route.test.ts`: contratos da rota de login para senha ausente, configuracao ausente, credencial invalida, emissao do token administrativo compativel e bloqueio temporario apos cinco falhas.
- `__tests__/lib/server/auth.test.ts`: contratos de token ausente/invalido, compatibilidade do claim administrativo e aplicacao da matriz de permissoes no fallback de perfil administrativo;
- `__tests__/app/api/admin/jobs/route.test.ts`: contrato da rota de jobs para bloqueio pelo guard e encaminhamento dos filtros existentes ao servico.
- `__tests__/app/api/admin/metrics/aging-extreme/route.test.ts`: contratos do cron autorizado, guard `metrics.write`, bloqueio sem autorizacao e normalizacao das janelas de coleta.

Validacao executada:

- `npm run typecheck` passou;
- `npm run lint` passou sem erros ou advertencias;
- `npm test` passou com 4 suites e 12 testes;
- `npm run build` passou com todas as rotas administrativas compiladas.
- `npm ci && npm run typecheck && npm run lint && npm test && npm run build` passou, reproduzindo localmente o workflow de CI.
- apos a redacao de PII e os contratos de autenticacao/API, typecheck, lint, testes e build passaram com 9 suites e 28 testes.

Pendencias da Fase 7:

- testes de integracao para APIs administrativas e Firebase Emulator/mocks;
- cenarios E2E de login, filtros e fluxos operacionais;
- CI com gates obrigatorios, cobertura e artefatos de build;
- logs estruturados com redacao de PII, audit trail e alertas de producao;
- runbook de rollback e exercicio de recuperacao.
- rate limit de login compartilhado entre instancias: o limite atual permanece em memoria para preservar o comportamento enquanto uma dependencia de armazenamento compartilhado nao for aprovada.
- rotacao e armazenamento do segredo `ADMIN_METRICS_CRON_SECRET`: permanecem como responsabilidade de infraestrutura e operacao, fora do controle de versao.

## 7. Decisoes necessarias antes da Fase 2

1. confirmar se o painel deve ter apenas administradores inicialmente ou papeis como operacao, financeiro, suporte e leitura;
2. confirmar se o repositorio sera conectado a um clone Git antes das alteracoes, para preservar historico e permitir code review;
3. definir quais KPIs sao leitura operacional obrigatoria e quais pertencem a um modulo financeiro futuro;
4. aprovar a estrategia de read models: agregados derivados no core, colecao administrativa dedicada ou servico de analytics;
5. definir politica de acesso a CPF, endereco, telefone e certificados;
6. validar o ambiente local com `npm install`, `npm run check:env`, lint atualizado, typecheck e build, sem imprimir segredos.

## 8. Validacao da Fase 1

Estado: concluida tecnicamente e pendente de aprovacao de produto/arquitetura.

Validacoes realizadas:

- superficie ativa e APIs confirmadas no codigo;
- estrutura de modulos e dependencias inventariada;
- consultas criticas e autenticacao revisadas;
- documentacao oficial confrontada com a implementacao;
- ausencia de testes automatizados confirmada;
- check de ambiente executado antes da configuracao das variaveis e identificado como bloqueador de integracoes reais.

Validacoes pendentes apos instalacao/configuracao local:

- adicionar `ADMIN_PASSWORD` diretamente no `.env.local` e remover as entradas sem chave;
- corrigir a configuracao ESLint 9 e o script `lint`;
- instalar/configurar Jest ou remover o script de teste ate existir uma suite real;
- `npm run build`;
- testes de integracao com credenciais de ambiente de desenvolvimento seguras.
