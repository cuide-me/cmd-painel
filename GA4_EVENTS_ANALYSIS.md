# GA4 do Painel Admin - Estado Atual

Atualizado em: 12/04/2026

## Principio

O repositorio principal `cuide-me-desenvolvimento-main` e a fonte primaria da verdade para taxonomia, nomes de eventos e payloads.

O painel admin deve apenas consumir, traduzir e explicar essa realidade.

## Eventos oficiais exibiveis no painel

| Tecnico | Nome exibido |
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
| `service_canceled` | Servico cancelado |
| `rating_submitted` | Avaliacao enviada |
| `required_field_validation_shown` | Validacao de campo obrigatorio exibida |
| `whatsapp_contact_started` | Contato via WhatsApp iniciado |

## Renomeacoes legadas obrigatorias

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

## Impacto de historico

- Series antigas com nomes legados nao devem ser somadas automaticamente com a serie canonica atual.
- Dashboards e exploracoes que ainda usarem nomes antigos precisam ser tratados como obsoletos.
- O painel deve preferir indisponibilidade explicita a usar nomes antigos como fallback silencioso.

## Referencia principal

- Ver `docs/guides/GA4_ANALYTICS.md` no repositorio principal.
- Ver `KPI_PAINEL_OFICIAL.md` neste repositorio para a implementacao do painel.