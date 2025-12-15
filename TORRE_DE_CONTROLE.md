# Torre de Controle — Cuide-me

Objetivo: visão executiva em até 30s para responder:
- O marketplace está saudável?
- Onde existe gargalo agora?
- Onde estamos perdendo dinheiro?
- Onde existe risco de confiança?
- Para qual módulo devo ir agir agora?

Princípios:
- Apenas leitura e agregação sobre dados existentes.
- Cada métrica deve gerar uma decisão clara.
- Visual limpo, acessível e acionável.

Módulos principais:
- Usuários, Financeiro, Pipeline, Service Desk
- Avançados: Confiança & Qualidade, Alertas & Riscos, Crescimento & Ativação

Arquitetura orientada a serviços:
- `src/services/admin/overview/` para KPIs, tendências e alertas
- Demais serviços em `src/services/admin/*` (somente leitura)

Rotas:
- `GET /api/admin/torre/overview` → KPIs essenciais, tendências, alertas

Decisões imediatas:
- KPIs com status (verde/amarelo/vermelho) e tendência (↑ ↓ →)
- Alertas com severidade e ação recomendada

Regras finais:
- Métrica sem decisão não entra
- Dado sem ação é descartado
