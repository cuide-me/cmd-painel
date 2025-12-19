# 📡 API Reference - Torre v2

Documentação completa de todas as APIs do sistema Torre de Controle.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Autenticação](#autenticação)
3. [Torre v2 APIs](#torre-v2-apis)
4. [Dashboard APIs](#dashboard-apis)
5. [Finance APIs](#finance-apis)
6. [Operations APIs](#operations-apis)
7. [Quality APIs](#quality-apis)
8. [Health & Monitoring](#health--monitoring)
9. [Error Handling](#error-handling)
10. [Rate Limits](#rate-limits)
11. [Code Examples](#code-examples)

---

## 🌐 Visão Geral

**Base URL:** `https://your-domain.com/api`

**Versão:** v2.0

**Formato:** JSON

**Encoding:** UTF-8

**Timezone:** UTC (timestamps em ISO 8601)

---

## 🔐 Autenticação

Todas as APIs requerem autenticação via Firebase Auth token.

### Obter Token

```typescript
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const auth = getAuth();
const { user } = await signInWithEmailAndPassword(auth, email, password);
const token = await user.getIdToken();
```

### Usar Token

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-domain.com/api/admin/dashboard-v2
```

### Headers Requeridos

```http
Authorization: Bearer YOUR_FIREBASE_TOKEN
Content-Type: application/json
```

---

## 🏗️ Torre v2 APIs

### 1. Dashboard Principal

Retorna todos os dados principais do dashboard Torre v2.

#### Endpoint

```http
GET /api/admin/dashboard-v2
```

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `period` | string | No | `30d` | Período: `7d`, `30d`, `90d`, `12m` |

#### Response 200 OK

```json
{
  "timestamp": "2025-12-19T10:30:00.000Z",
  "period": "30d",
  "summary": {
    "totalRevenue": 125000,
    "totalUsers": 1245,
    "activeJobs": 87,
    "nps": 52
  },
  "revenue": {
    "mrr": 125000,
    "arr": 1500000,
    "growth": 12.5,
    "churn": 4.8,
    "ltv": 3500,
    "cac": 65,
    "ltvCacRatio": 6.9
  },
  "users": {
    "total": 1245,
    "active": 890,
    "new": 156,
    "churned": 42
  },
  "operations": {
    "slaCompliance": 87,
    "avgResponseTime": 8.5,
    "utilizationRate": 72,
    "matchRate": 89
  },
  "quality": {
    "nps": 52,
    "avgRating": 4.3,
    "responseRate": 28
  }
}
```

#### Example Request

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://your-domain.com/api/admin/dashboard-v2?period=7d"
```

```javascript
// Using fetch
const response = await fetch('/api/admin/dashboard-v2?period=30d', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
```

```typescript
// Using authFetch helper
import { authFetch } from '@/lib/client/authFetch';

const data = await authFetch<TorreV2Response>('/api/admin/dashboard-v2?period=30d');
```

#### Response Schema

Validado com `TorreV2Schema` (Zod).

---

### 2. Alerts

Lista de alertas ativos e histórico.

#### Endpoint

```http
GET /api/admin/torre/alerts
```

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `period` | string | No | `7d` | Período histórico |
| `severity` | string | No | `all` | Filtrar por severidade: `P0`, `P1`, `P2`, `P3`, `all` |
| `status` | string | No | `all` | Filtrar por status: `active`, `resolved`, `all` |

#### Response 200 OK

```json
{
  "timestamp": "2025-12-19T10:30:00.000Z",
  "period": "7d",
  "active": [
    {
      "id": "alert_1234567890",
      "type": "SLA_BREACH",
      "severity": "P1",
      "title": "SLA Compliance < 90%",
      "description": "87% dos jobs dentro de 24h",
      "threshold": 90,
      "currentValue": 87,
      "trend": "declining",
      "createdAt": "2025-12-19T08:00:00.000Z",
      "module": "operations",
      "affectedMetrics": ["slaCompliance", "avgResponseTime"],
      "playbook": "ALERTS_PLAYBOOK.md#sla-compliance"
    }
  ],
  "resolved": [
    {
      "id": "alert_1234567889",
      "type": "CHURN_SPIKE",
      "severity": "P1",
      "title": "Churn Rate > 5%",
      "resolvedAt": "2025-12-18T16:30:00.000Z",
      "resolution": "Contacted churned users, fixed onboarding issue"
    }
  ],
  "stats": {
    "totalActive": 3,
    "byPriority": {
      "P0": 0,
      "P1": 1,
      "P2": 2,
      "P3": 0
    }
  }
}
```

#### Example Request

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://your-domain.com/api/admin/torre/alerts?severity=P1&status=active"
```

---

### 3. Overview Module

Visão geral de todos os módulos.

#### Endpoint

```http
GET /api/admin/torre/overview
```

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `period` | string | No | `30d` | Período: `7d`, `30d`, `90d` |

#### Response 200 OK

```json
{
  "timestamp": "2025-12-19T10:30:00.000Z",
  "period": "30d",
  "modules": [
    {
      "id": "growth",
      "name": "Growth",
      "status": "healthy",
      "score": 85,
      "kpis": [
        {
          "name": "MAU",
          "value": 1245,
          "change": 12.5,
          "trend": "up",
          "target": 1500,
          "progress": 83
        },
        {
          "name": "CAC",
          "value": 65,
          "change": -8.2,
          "trend": "down",
          "target": 50,
          "progress": 77
        }
      ],
      "alerts": 1
    },
    {
      "id": "finance",
      "name": "Finance",
      "status": "warning",
      "score": 72,
      "kpis": [...],
      "alerts": 2
    }
  ]
}
```

---

### 4. Funnel Analysis

Análise de funil de aquisição e conversão.

#### Endpoint

```http
GET /api/admin/torre/funnel-analysis
```

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `period` | string | No | `30d` | Período |
| `funnel` | string | No | `all` | Tipo: `acquisition`, `conversion`, `all` |

#### Response 200 OK

```json
{
  "timestamp": "2025-12-19T10:30:00.000Z",
  "period": "30d",
  "acquisition": {
    "steps": [
      {
        "name": "page_view",
        "users": 10000,
        "conversion": 100,
        "dropoff": 0
      },
      {
        "name": "sign_up",
        "users": 350,
        "conversion": 3.5,
        "dropoff": 96.5
      },
      {
        "name": "profile_complete",
        "users": 245,
        "conversion": 2.45,
        "dropoff": 30
      }
    ],
    "overallConversion": 2.45
  },
  "conversion": {
    "steps": [
      {
        "name": "profile_complete",
        "users": 245,
        "conversion": 100,
        "dropoff": 0
      },
      {
        "name": "create_request",
        "users": 147,
        "conversion": 60,
        "dropoff": 40
      },
      {
        "name": "first_match",
        "users": 118,
        "conversion": 48.2,
        "dropoff": 19.7
      },
      {
        "name": "payment",
        "users": 82,
        "conversion": 33.5,
        "dropoff": 30.5
      }
    ],
    "overallConversion": 33.5
  }
}
```

---

### 5. Cohort Analysis

Análise de retenção por cohort.

#### Endpoint

```http
GET /api/admin/torre/cohorts
```

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `period` | string | No | `12w` | Período: `12w`, `24w` |

#### Response 200 OK

```json
{
  "timestamp": "2025-12-19T10:30:00.000Z",
  "period": "12w",
  "cohorts": [
    {
      "cohortDate": "2025-10-01",
      "cohortLabel": "Oct 2025",
      "size": 124,
      "retention": {
        "week1": 68.5,
        "week2": 52.4,
        "week4": 41.9,
        "week8": 35.5,
        "week12": 29.8
      }
    },
    {
      "cohortDate": "2025-11-01",
      "cohortLabel": "Nov 2025",
      "size": 156,
      "retention": {
        "week1": 71.2,
        "week2": 55.1,
        "week4": 44.2,
        "week8": 38.5
      }
    }
  ],
  "averageRetention": {
    "week1": 69.8,
    "week2": 53.7,
    "week4": 43.0,
    "week8": 37.0,
    "week12": 29.8
  }
}
```

---

## 💰 Finance APIs

### 6. Cash Flow Projection

Projeção de fluxo de caixa.

#### Endpoint

```http
GET /api/admin/torre/cash-flow
```

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `horizon` | string | No | `90d` | Horizonte: `30d`, `60d`, `90d` |

#### Response 200 OK

```json
{
  "timestamp": "2025-12-19T10:30:00.000Z",
  "horizon": "90d",
  "current": {
    "cash": 500000,
    "mrr": 125000,
    "burn": 50000,
    "runway": 10
  },
  "projection": [
    {
      "date": "2025-12-31",
      "inflow": 125000,
      "outflow": 50000,
      "netFlow": 75000,
      "balance": 575000
    },
    {
      "date": "2026-01-31",
      "inflow": 140000,
      "outflow": 52000,
      "netFlow": 88000,
      "balance": 663000
    },
    {
      "date": "2026-02-28",
      "inflow": 157000,
      "outflow": 54000,
      "netFlow": 103000,
      "balance": 766000
    }
  ],
  "scenarios": {
    "best": { "endBalance": 850000, "runway": 16 },
    "base": { "endBalance": 766000, "runway": 15 },
    "worst": { "endBalance": 620000, "runway": 12 }
  }
}
```

---

### 7. Transactions

Histórico e análise de transações.

#### Endpoint

```http
GET /api/admin/torre/transactions
```

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `period` | string | No | `30d` | Período |
| `type` | string | No | `all` | Tipo: `subscription`, `one_time`, `refund`, `all` |
| `status` | string | No | `all` | Status: `succeeded`, `failed`, `pending`, `all` |

#### Response 200 OK

```json
{
  "timestamp": "2025-12-19T10:30:00.000Z",
  "period": "30d",
  "transactions": [
    {
      "id": "txn_1234567890",
      "date": "2025-12-18T14:30:00.000Z",
      "customerId": "cus_ABC123",
      "customerName": "João Silva",
      "type": "subscription",
      "amount": 150.00,
      "currency": "BRL",
      "status": "succeeded",
      "description": "Plano Pro - Mensal",
      "paymentMethod": "card",
      "last4": "4242"
    },
    {
      "id": "txn_1234567891",
      "date": "2025-12-18T10:15:00.000Z",
      "customerId": "cus_DEF456",
      "customerName": "Maria Santos",
      "type": "one_time",
      "amount": 450.00,
      "currency": "BRL",
      "status": "succeeded",
      "description": "Consulta especializada",
      "paymentMethod": "pix"
    }
  ],
  "summary": {
    "total": 125000,
    "count": 234,
    "succeeded": 221,
    "failed": 13,
    "refunded": 2,
    "avgValue": 534.19
  }
}
```

---

## ⚙️ Operations APIs

### 8. SLA Monitoring

Monitoramento de SLA.

#### Endpoint

```http
GET /api/admin/torre/sla
```

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `period` | string | No | `7d` | Período |
| `specialty` | string | No | `all` | Filtrar por especialidade |

#### Response 200 OK

```json
{
  "timestamp": "2025-12-19T10:30:00.000Z",
  "period": "7d",
  "overall": {
    "compliance": 87,
    "avgResponseTime": 8.5,
    "breaches": 13,
    "total": 100
  },
  "bySpecialty": [
    {
      "specialty": "Psicologia",
      "compliance": 92,
      "avgResponseTime": 6.2,
      "breaches": 4,
      "total": 50
    },
    {
      "specialty": "Nutrição",
      "compliance": 82,
      "avgResponseTime": 11.5,
      "breaches": 9,
      "total": 50
    }
  ],
  "breachDetails": [
    {
      "jobId": "job_123",
      "specialty": "Nutrição",
      "requestedAt": "2025-12-17T10:00:00.000Z",
      "respondedAt": "2025-12-18T14:30:00.000Z",
      "hoursElapsed": 28.5,
      "reason": "No professionals available"
    }
  ]
}
```

---

### 9. Capacity Planning

Planejamento e análise de capacidade.

#### Endpoint

```http
GET /api/admin/torre/capacity
```

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `period` | string | No | `7d` | Período |

#### Response 200 OK

```json
{
  "timestamp": "2025-12-19T10:30:00.000Z",
  "period": "7d",
  "overall": {
    "totalProfessionals": 120,
    "activeProfessionals": 95,
    "totalJobs": 87,
    "utilizationRate": 72.5,
    "supplyDemandRatio": 1.38
  },
  "bySpecialty": [
    {
      "specialty": "Psicologia",
      "professionals": 50,
      "active": 42,
      "jobs": 45,
      "utilization": 90,
      "supplyDemandRatio": 1.11,
      "status": "undersupply"
    },
    {
      "specialty": "Nutrição",
      "professionals": 40,
      "active": 32,
      "jobs": 25,
      "utilization": 62.5,
      "supplyDemandRatio": 1.6,
      "status": "balanced"
    }
  ],
  "alerts": [
    {
      "specialty": "Psicologia",
      "type": "undersupply",
      "message": "High utilization (90%), consider hiring"
    }
  ]
}
```

---

## ⭐ Quality APIs

### 10. NPS & Satisfaction

Net Promoter Score e satisfação.

#### Endpoint

```http
GET /api/admin/torre/nps
```

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `period` | string | No | `30d` | Período |

#### Response 200 OK

```json
{
  "timestamp": "2025-12-19T10:30:00.000Z",
  "period": "30d",
  "nps": {
    "score": 52,
    "promoters": 45,
    "passives": 32,
    "detractors": 23,
    "responseRate": 28
  },
  "distribution": [
    { "score": 0, "count": 2 },
    { "score": 1, "count": 1 },
    { "score": 2, "count": 3 },
    { "score": 3, "count": 4 },
    { "score": 4, "count": 5 },
    { "score": 5, "count": 8 },
    { "score": 6, "count": 10 },
    { "score": 7, "count": 12 },
    { "score": 8, "count": 20 },
    { "score": 9, "count": 18 },
    { "score": 10, "count": 27 }
  ],
  "avgRating": 4.3,
  "comments": [
    {
      "score": 10,
      "comment": "Excelente atendimento, profissional muito atencioso",
      "date": "2025-12-18T10:00:00.000Z",
      "jobId": "job_123"
    },
    {
      "score": 3,
      "comment": "Demorou muito para conseguir um profissional",
      "date": "2025-12-17T15:30:00.000Z",
      "jobId": "job_124"
    }
  ]
}
```

---

## 🏥 Health & Monitoring

### 11. Health Check

Verifica status de todas as integrações.

#### Endpoint

```http
GET /api/health/integrations
```

**⚠️ Nota:** Esta API não requer autenticação (pública para monitoring).

#### Response 200 OK (Healthy)

```json
{
  "status": "healthy",
  "timestamp": "2025-12-19T10:30:00.000Z",
  "integrations": {
    "firebase": {
      "status": "healthy",
      "latency": 45,
      "configured": true,
      "enabled": true
    },
    "ga4": {
      "status": "healthy",
      "latency": 120,
      "configured": true,
      "enabled": true
    },
    "stripe": {
      "status": "healthy",
      "latency": 85,
      "configured": true,
      "enabled": true
    }
  },
  "features": {
    "TORRE_V2": true,
    "GA4": true,
    "STRIPE": true,
    "GROWTH_MODULE": true,
    "FINANCE_MODULE": true,
    "OPS_MODULE": true,
    "QUALITY_MODULE": true
  },
  "torreV2": {
    "ready": true,
    "missingIntegrations": []
  }
}
```

#### Response 207 Multi-Status (Degraded)

```json
{
  "status": "degraded",
  "timestamp": "2025-12-19T10:30:00.000Z",
  "integrations": {
    "firebase": {
      "status": "healthy",
      "latency": 45
    },
    "ga4": {
      "status": "unhealthy",
      "error": "Authentication failed",
      "configured": true,
      "enabled": true
    },
    "stripe": {
      "status": "healthy",
      "latency": 85
    }
  }
}
```

#### Response 503 Service Unavailable (Unhealthy)

```json
{
  "status": "unhealthy",
  "timestamp": "2025-12-19T10:30:00.000Z",
  "integrations": {
    "firebase": {
      "status": "unhealthy",
      "error": "Connection timeout",
      "configured": true,
      "enabled": true
    }
  },
  "torreV2": {
    "ready": false,
    "missingIntegrations": ["firebase"]
  }
}
```

#### Example Request

```bash
# Simple check
curl https://your-domain.com/api/health/integrations

# Uptime monitoring
watch -n 60 curl https://your-domain.com/api/health/integrations
```

---

## ❌ Error Handling

Todas as APIs usam códigos HTTP padrão e retornam erros no formato:

### Error Response Format

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token",
    "details": {
      "hint": "Get a new token with Firebase Auth"
    },
    "errorId": "err_1734604200_abc123",
    "timestamp": "2025-12-19T10:30:00.000Z"
  }
}
```

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Request successful |
| 400 | Bad Request | Invalid parameters |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | No permission for resource |
| 404 | Not Found | Endpoint doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Integration down |

### Common Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| `UNAUTHORIZED` | Token missing/invalid | Re-authenticate |
| `FORBIDDEN` | No admin permissions | Contact admin |
| `INVALID_PARAMS` | Query parameters invalid | Check API docs |
| `FEATURE_DISABLED` | Feature flag off | Enable feature or wait for rollout |
| `INTEGRATION_ERROR` | External service failed | Check health endpoint |
| `RATE_LIMITED` | Too many requests | Wait and retry |
| `VALIDATION_ERROR` | Response validation failed | Report bug |

### Error Tracking

Todos os erros geram um `errorId` único. Use-o para:

```bash
# Search logs
vercel logs --filter "err_1734604200_abc123"

# Check error tracking
# Browser console → Application → __errorTracking
```

---

## 🚦 Rate Limits

**Default Rate Limits:**
- 100 requests per minute per IP
- 1000 requests per hour per user

**Headers Returned:**

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1734604800
```

**429 Response:**

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests",
    "details": {
      "retryAfter": 60
    }
  }
}
```

**Best Practices:**
- Cache responses when possible
- Use webhooks instead of polling
- Implement exponential backoff on errors

---

## 💻 Code Examples

### React Hook - useDashboard

```typescript
import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/client/authFetch';
import type { TorreV2Response } from '@/services/admin/dashboard/types';

export function useDashboard(period: '7d' | '30d' | '90d' = '30d') {
  const [data, setData] = useState<TorreV2Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = await authFetch<TorreV2Response>(
          `/api/admin/dashboard-v2?period=${period}`
        );
        setData(result);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [period]);

  return { data, loading, error };
}
```

**Usage:**

```typescript
function Dashboard() {
  const { data, loading, error } = useDashboard('30d');

  if (loading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  if (!data) return null;

  return (
    <div>
      <h1>MRR: R$ {data.revenue.mrr.toLocaleString()}</h1>
      <p>Churn: {data.revenue.churn}%</p>
    </div>
  );
}
```

---

### TypeScript - Fetch with Retry

```typescript
async function fetchWithRetry<T>(
  url: string, 
  options: RequestInit = {}, 
  maxRetries = 3
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited - exponential backoff
          const retryAfter = response.headers.get('X-RateLimit-Reset');
          const delay = retryAfter 
            ? (parseInt(retryAfter) * 1000) - Date.now()
            : Math.pow(2, i) * 1000;
          
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error as Error;
      
      if (i < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, i) * 1000)
        );
      }
    }
  }

  throw lastError!;
}
```

---

### Node.js - Server-Side Fetch

```typescript
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin
const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

async function fetchTorreData(userId: string, period: string) {
  // Get custom token for user
  const customToken = await getAuth(app).createCustomToken(userId);
  
  // Exchange for ID token (in real scenario, client does this)
  // For server-side, use service account directly
  
  const response = await fetch(
    `https://your-domain.com/api/admin/dashboard-v2?period=${period}`,
    {
      headers: {
        'Authorization': `Bearer ${customToken}`, // or use service account
      },
    }
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return await response.json();
}
```

---

### Python - API Client

```python
import requests
from typing import Dict, Any

class TorreAPIClient:
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url
        self.token = token
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        })
    
    def get_dashboard(self, period: str = '30d') -> Dict[str, Any]:
        """Fetch dashboard data."""
        response = self.session.get(
            f'{self.base_url}/api/admin/dashboard-v2',
            params={'period': period}
        )
        response.raise_for_status()
        return response.json()
    
    def get_alerts(self, severity: str = 'all') -> Dict[str, Any]:
        """Fetch active alerts."""
        response = self.session.get(
            f'{self.base_url}/api/admin/torre/alerts',
            params={'severity': severity, 'status': 'active'}
        )
        response.raise_for_status()
        return response.json()
    
    def health_check(self) -> Dict[str, Any]:
        """Check system health."""
        # Health endpoint doesn't require auth
        response = requests.get(f'{self.base_url}/api/health/integrations')
        response.raise_for_status()
        return response.json()

# Usage
client = TorreAPIClient('https://your-domain.com', token='your_token')
data = client.get_dashboard(period='7d')
print(f"MRR: R$ {data['revenue']['mrr']:,.2f}")
```

---

### curl - Quick Testing

```bash
#!/bin/bash

# Set variables
BASE_URL="https://your-domain.com"
TOKEN="your_firebase_token"

# Dashboard
curl -s -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/api/admin/dashboard-v2?period=30d" | jq .

# Alerts
curl -s -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/api/admin/torre/alerts?severity=P1" | jq .active

# Health (no auth needed)
curl -s "$BASE_URL/api/health/integrations" | jq .status

# With retry on failure
for i in {1..3}; do
  response=$(curl -s -w "%{http_code}" -H "Authorization: Bearer $TOKEN" \
    "$BASE_URL/api/admin/dashboard-v2")
  
  http_code="${response: -3}"
  body="${response:0:-3}"
  
  if [ "$http_code" -eq 200 ]; then
    echo "$body" | jq .
    break
  else
    echo "Attempt $i failed with code $http_code"
    sleep $((2**i))
  fi
done
```

---

## 📚 Related Documentation

- [METRICS_GLOSSARY.md](./METRICS_GLOSSARY.md) - Definição de todas as métricas
- [ALERTS_PLAYBOOK.md](./ALERTS_PLAYBOOK.md) - Troubleshooting de alertas
- [OBSERVABILITY.md](./OBSERVABILITY.md) - Sistema de logs e monitoring
- [INTEGRATIONS.md](./INTEGRATIONS.md) - Setup das integrações

---

## 🆘 Support

**Questions?**
- GitHub Issues: [your-repo/issues]
- Slack: #torre-v2-support
- Email: dev@your-company.com

**Report API Issues:**
Include:
- Endpoint called
- Request parameters
- Response received
- Error ID (if applicable)
- Timestamp

---

## 📝 Changelog

### v2.0 (2025-12-19)
- ✨ Torre v2 complete rewrite
- 🚀 11 new APIs
- 📊 Real-time monitoring
- 🎯 Feature flags support
- 🔍 Advanced error tracking

### v1.0 (2024)
- Initial release
- Basic dashboard APIs
