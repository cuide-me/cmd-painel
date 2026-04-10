# API Reference - Painel Admin Cuide-me (Ativo)

Referencia das APIs atualmente suportadas no painel admin.

## Autenticacao

### Login

POST /api/admin/auth/login

Body:

```json
{
  "password": "<senha-admin>"
}
```

Resposta de sucesso:

```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "firebaseCustomToken": "<token>"
}
```

### Header exigido para APIs protegidas

```text
Authorization: Bearer <Firebase ID token>
```

## Endpoints Ativos

### GET /api/admin/dashboard-v3

Query opcional:

- window: 7 | 14 | 30 | 60 | 90
- region: string
- specialty: string

Retorna cards operacionais, fila critica, alertas ativos e ranking local.

### GET /api/admin/jobs

Query opcional:

- window: numero de dias
- status: filtro de status
- region: filtro de regiao

Retorna lista operacional de atendimentos.

### GET /api/admin/alertas

Query opcional:

- window: numero de dias
- severity: critic | high | medium | low

Retorna alertas operacionais ativos e historico recente.

### GET /api/admin/tickets

Query opcional:

- window: numero de dias
- status: A_FAZER | EM_ATENDIMENTO | CONCLUIDO

Retorna backlog de service desk e agregados.

### GET /api/admin/users

Query opcional:

- role: family | professional
- search: texto
- page/pageSize: paginacao

Retorna listagem administrativa de usuarios.

## Endpoints Legados Removidos

- /api/admin/funil
- /api/admin/torre-de-controle

Situacao atual: removidos fisicamente do runtime, retorno esperado 404.

## Politica de Compatibilidade

- Nao existe fallback para x-admin-password.
- Nao existe Bearer legado no formato admin:.
- Nao existe sessao fake por localStorage.
