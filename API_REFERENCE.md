# API Reference - Torre de Controle V2

Documentação completa das APIs do painel administrativo.

## 🔐 Autenticação

Todas as APIs requerem autenticação via cookie `admin_session`.

```bash
# Login
POST /api/admin/login
Content-Type: application/json

{
  "email": "admin@cuide.me",
  "password": "sua-senha"
}

# Response
{
  "success": true,
  "user": {
    "email": "admin@cuide.me",
    "role": "admin"
  }
}
```

## 📊 Endpoints

### 1. Pipeline

Funil completo de jobs (5 estágios: created → completed).

**GET** `/api/admin/pipeline`

**Query Parameters:**
- `startDate` (opcional): Data inicial (YYYY-MM-DD)
- `endDate` (opcional): Data final (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "created": 1250,
      "pending": 980,
      "matched": 750,
      "in_progress": 620,
      "completed": 580
    },
    "conversionRate": 46.4,
    "avgTimePerStage": {
      "created_to_pending": 2.5,
      "pending_to_matched": 18.3,
      "matched_to_in_progress": 4.2,
      "in_progress_to_completed": 72.1
    },
    "bottlenecks": [
      {
        "stage": "pending_to_matched",
        "avgHours": 18.3,
        "severity": "medium",
        "dropRate": 23.5
      }
    ],
    "negativePipeline": {
      "canceled": 95,
      "rejected": 65,
      "total": 160
    }
  },
  "cached": true,
  "filters": {
    "startDate": "2025-01-01",
    "endDate": "2025-12-20"
  }
}
```

**Cache:** 5 minutos  
**Rate Limit:** 30 req/min

---

### 2. Marketplace Validation

Validação de demanda vs oferta do marketplace.

**GET** `/api/admin/marketplace-validation`

**Query Parameters:**
- `startDate` (opcional): Data inicial (YYYY-MM-DD)
- `endDate` (opcional): Data final (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": {
      "totalDemand": 1250,
      "totalSupply": 980,
      "ratio": 1.28,
      "status": "balanced"
    },
    "bySpecialty": [
      {
        "specialty": "Enfermagem",
        "demand": 450,
        "supply": 320,
        "gap": 130,
        "status": "shortage"
      }
    ],
    "geographic": {
      "byState": [...],
      "byCity": [...]
    },
    "quality": {
      "matchRate": 78.5,
      "avgMatchTime": 12.3
    }
  },
  "cached": false
}
```

**Cache:** 5 minutos  
**Rate Limit:** 30 req/min

---

### 3. Famílias

Jornada completa das famílias (funil de 6 etapas).

**GET** `/api/admin/familias`

**Response:**
```json
{
  "success": true,
  "data": {
    "journey": {
      "cadastro": 5420,
      "perfil_completo": 4680,
      "job_criado": 3890,
      "match_aceito": 2950,
      "job_iniciado": 2510,
      "job_concluido": 2180
    },
    "conversionRates": {
      "cadastro_to_perfil": 86.3,
      "perfil_to_job": 83.1,
      "job_to_match": 75.8,
      "match_to_iniciado": 85.1,
      "iniciado_to_concluido": 86.9,
      "overall": 40.2
    },
    "urgency": {
      "baixa": 890,
      "media": 1650,
      "alta": 1120,
      "critica": 340
    },
    "dropoffPoints": [
      {
        "stage": "job_criado_to_match",
        "dropRate": 24.2,
        "count": 940
      }
    ]
  }
}
```

**Rate Limit:** 30 req/min

---

### 4. Cuidadores

Performance e disponibilidade dos profissionais.

**GET** `/api/admin/cuidadores`

**Response:**
```json
{
  "success": true,
  "data": {
    "topPerformers": [
      {
        "id": "prof_123",
        "name": "Maria Silva",
        "rating": 4.9,
        "completedJobs": 156,
        "specialties": ["Enfermagem", "Idosos"]
      }
    ],
    "availability": {
      "total": 2340,
      "available": 1890,
      "busy": 320,
      "offline": 130
    },
    "bySpecialty": {
      "Enfermagem": 890,
      "Fisioterapia": 450,
      "Cuidador de Idosos": 780
    },
    "retention": {
      "30days": 92.5,
      "60days": 85.3,
      "90days": 78.9
    }
  }
}
```

**Rate Limit:** 30 req/min

---

### 5. Confiança & Qualidade

NPS, ratings e métricas de suporte.

**GET** `/api/admin/confianca-qualidade`

**Response:**
```json
{
  "success": true,
  "data": {
    "nps": {
      "score": 68,
      "promoters": 1250,
      "passives": 450,
      "detractors": 180,
      "total": 1880
    },
    "ratings": {
      "overall": 4.6,
      "byMonth": [
        { "month": "2025-12", "avg": 4.7, "count": 890 }
      ]
    },
    "support": {
      "open": 45,
      "inProgress": 23,
      "resolved": 1234,
      "avgResponseTime": 2.3,
      "firstContactResolution": 78.5
    }
  }
}
```

**Rate Limit:** 30 req/min

---

### 6. Fricção

Análise de pontos de abandono.

**GET** `/api/admin/friccao`

**Response:**
```json
{
  "success": true,
  "data": {
    "frictionPoints": [
      {
        "id": "job_creation",
        "name": "Criação de Job",
        "abandonmentRate": 18.5,
        "severity": "medium",
        "impact": 320,
        "topReasons": [
          "Formulário muito longo",
          "Dúvidas sobre preço"
        ]
      }
    ],
    "recoveryMetrics": {
      "emailRecovery": 12.3,
      "pushRecovery": 8.7,
      "total": 21.0
    },
    "suggestedActions": [
      {
        "point": "job_creation",
        "action": "Simplificar formulário",
        "priority": "high",
        "estimatedImpact": "+15% conversão"
      }
    ]
  }
}
```

**Rate Limit:** 30 req/min

---

### 7. Service Desk

CRUD de tickets de suporte (Kanban).

**GET** `/api/admin/service-desk`

**Response:**
```json
{
  "success": true,
  "data": {
    "tickets": [
      {
        "id": "ticket_123",
        "title": "Bug no checkout",
        "description": "Erro ao finalizar pagamento",
        "status": "EM_ATENDIMENTO",
        "priority": "high",
        "assignedTo": "João Silva",
        "createdAt": "2025-12-20T10:00:00Z",
        "updatedAt": "2025-12-20T14:30:00Z"
      }
    ],
    "stats": {
      "byStatus": {
        "A_FAZER": 12,
        "EM_ATENDIMENTO": 8,
        "CONCLUIDO": 456
      },
      "byPriority": {
        "low": 3,
        "medium": 10,
        "high": 6,
        "critical": 1
      },
      "avgResolutionTime": 18.5
    }
  }
}
```

**PATCH** `/api/admin/service-desk`

**Body:**
```json
{
  "id": "ticket_123",
  "status": "CONCLUIDO"
}
```

**Rate Limit:** 30 req/min

---

### 8. Notificações

Gerenciar notificações in-app.

**GET** `/api/admin/notifications`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "notif_123",
      "type": "warning",
      "priority": "high",
      "title": "Pipeline com gargalo",
      "message": "Etapa pending_to_matched com 48h+ de espera",
      "read": false,
      "createdAt": "2025-12-20T10:00:00Z"
    }
  ],
  "unreadCount": 3
}
```

**PATCH** `/api/admin/notifications`

Marcar como lida:
```json
{
  "id": "notif_123",
  "read": true
}
```

**DELETE** `/api/admin/notifications?id=notif_123`

**Rate Limit:** 100 req/min

---

### 9. Monitoring

Executar verificações automáticas.

**POST** `/api/admin/monitoring`

**Response:**
```json
{
  "success": true,
  "checksRun": 3,
  "alertsCreated": 1,
  "results": [
    {
      "check": "pipeline_bottleneck",
      "status": "alert",
      "details": {
        "stage": "pending_to_matched",
        "avgHours": 52.3
      }
    }
  ]
}
```

**Rate Limit:** 10 req/min

---

### 10. Webhooks

Receber eventos externos.

**POST** `/api/webhooks`

**Headers:**
```
Content-Type: application/json
X-Webhook-Secret: seu-token-secreto
```

**Body:**
```json
{
  "event": "pipeline_bottleneck",
  "data": {
    "stage": "pending_to_matched",
    "avgHours": 52.3,
    "severity": "high"
  },
  "timestamp": "2025-12-20T10:00:00Z"
}
```

**Eventos Suportados:**
- `pipeline_bottleneck`
- `marketplace_imbalance`
- `service_desk_overload`
- `high_churn_rate`
- `low_conversion`
- `critical_error`
- `system_alert`

**Rate Limit:** 1000 req/hour

---

### 11. System Health

Verificar saúde do sistema.

**GET** `/api/admin/system/health`

**Query Parameters:**
- `detailed` (opcional): Retornar métricas detalhadas de performance

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-20T10:00:00Z",
  "uptime": 3600,
  "memory": {
    "rss": 123456789,
    "heapTotal": 50000000,
    "heapUsed": 30000000,
    "external": 1234567
  },
  "cache": {
    "total": 45,
    "valid": 42,
    "expired": 3,
    "memoryEstimate": 2048000
  },
  "rateLimit": {
    "totalIdentifiers": 12,
    "activeRequests": 150
  },
  "performance": [
    {
      "operation": "pipeline_query",
      "count": 234,
      "avg": 145.5,
      "min": 98,
      "max": 456,
      "p95": 234,
      "p99": 345
    }
  ]
}
```

**Rate Limit:** 100 req/min

---

## 🔒 Security Headers

Todas as respostas incluem headers de segurança:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

## 📈 Rate Limiting Headers

Respostas incluem informações de rate limit:

```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 29
X-RateLimit-Reset: 2025-12-20T10:05:00Z
```

Quando excedido (429):
```
Retry-After: 60
```

## 💾 Cache Headers

APIs com cache retornam:

```
Cache-Control: public, max-age=300
CDN-Cache-Control: public, max-age=300
Vercel-CDN-Cache-Control: public, max-age=300
```

Response body inclui:
```json
{
  "cached": true
}
```

## ❌ Error Responses

Formato padrão de erro:

```json
{
  "success": false,
  "error": "Mensagem de erro legível",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Códigos HTTP

- `200` - Sucesso
- `400` - Bad Request (parâmetros inválidos)
- `401` - Não autenticado
- `403` - Sem permissão
- `404` - Recurso não encontrado
- `429` - Rate limit excedido
- `500` - Erro interno do servidor

## 🧪 Exemplos

### cURL

```bash
# Pipeline com filtro de data
curl -X GET "http://localhost:3000/api/admin/pipeline?startDate=2025-01-01&endDate=2025-12-31" \
  -H "Cookie: admin_session=..."

# Criar notificação
curl -X POST "http://localhost:3000/api/admin/notifications" \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_session=..." \
  -d '{
    "type": "warning",
    "priority": "high",
    "title": "Teste",
    "message": "Mensagem de teste"
  }'

# Webhook externo
curl -X POST "http://localhost:3000/api/webhooks" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: seu-token" \
  -d '{
    "event": "critical_error",
    "data": { "message": "Erro crítico detectado" }
  }'
```

### JavaScript (Fetch)

```javascript
// Pipeline
const response = await fetch('/api/admin/pipeline?startDate=2025-01-01');
const { data, cached } = await response.json();

// Atualizar ticket
await fetch('/api/admin/service-desk', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id: 'ticket_123', status: 'CONCLUIDO' })
});
```

## 📞 Suporte

- **Email:** tech@cuide.me
- **Docs:** https://docs.cuide.me/api
- **Issues:** https://github.com/cuide-me/cmd-painel/issues
