# 🔍 Observabilidade - Torre v2

Sistema completo de monitoramento, logging e error tracking para Torre v2.

## 📦 Componentes

### 1. **Feature Flags** (`src/lib/feature-flags.ts`)
Controle de rollout e features.

```typescript
import { isFeatureEnabled, FEATURES } from '@/lib/feature-flags';

// Check if Torre v2 is enabled
if (isFeatureEnabled(FEATURES.TORRE_V2)) {
  // Show Torre v2 dashboard
}

// Check integration status
import { getIntegrationsStatus } from '@/lib/feature-flags';
const integrations = getIntegrationsStatus();
console.log(integrations.ga4.enabled); // true/false
```

**Flags Disponíveis:**
- `TORRE_V2_ENABLED` - Torre v2 master flag
- `GA4_ENABLED` - Google Analytics 4
- `STRIPE_ENABLED` - Stripe integration
- `GROWTH_MODULE_ENABLED` - Growth module
- `FINANCE_MODULE_ENABLED` - Finance module
- `OPS_MODULE_ENABLED` - Operations module
- `QUALITY_MODULE_ENABLED` - Quality module

### 2. **Logger** (`src/lib/logger.ts`)
Logging estruturado com níveis e contexto.

```typescript
import { logger } from '@/lib/logger';

// Basic logging
logger.info('User logged in', { userId: '123', email: 'user@example.com' });
logger.error('Payment failed', { error, orderId: 'ord_123' });

// Performance tracking
const timer = logger.startTimer();
// ... do work
timer.done({ message: 'Query completed', query: 'SELECT *' });

// HTTP logging
logger.request('GET', '/api/users');
logger.response('GET', '/api/users', 200, 45);

// Integration logging
logger.integration('stripe', 'createPayment', { amount: 1000 });
```

**Log Levels:**
- `debug` - Detalhes técnicos (só em dev)
- `info` - Informações gerais
- `warn` - Avisos não críticos
- `error` - Erros que precisam atenção

### 3. **Error Tracking** (`src/lib/error-tracking.ts`)
Captura e tracking de erros com contexto.

```typescript
import { captureException, captureError } from '@/lib/error-tracking';

// Capture exception
try {
  await riskyOperation();
} catch (error) {
  const errorId = captureException(error, {
    severity: 'error',
    context: { userId: '123', operation: 'payment' }
  });
  console.log('Error ID:', errorId); // err_1234567890_abc123
}

// Capture custom error
captureError('Payment validation failed', {
  severity: 'warning',
  context: { amount: -100, currency: 'BRL' }
});

// API errors
captureAPIError(error, {
  method: 'POST',
  url: '/api/payment',
  body: { amount: 1000 }
});

// Integration errors
captureIntegrationError('stripe', 'createPayment', error);
```

**Features:**
- Auto-capture uncaught errors
- Breadcrumbs (activity trail)
- User context
- Sensitive data sanitization
- Sentry integration ready

### 4. **Schemas** (`src/lib/schemas.ts`)
Validação de dados com Zod.

```typescript
import { TorreV2Schema, validateResponse } from '@/lib/schemas';

// Validate API response
const response = await fetch('/api/admin/torre-v2').then(r => r.json());
const result = validateResponse(TorreV2Schema, response);

if (result.success) {
  console.log('Valid data:', result.data);
} else {
  console.error('Validation error:', result.error);
}

// Safe parse with logging
import { safeParse } from '@/lib/schemas';
const data = safeParse(TorreV2Schema, response, 'Torre V2 API');
```

**Schemas Disponíveis:**
- `TorreV2Schema` - Torre dashboard
- `AlertsResponseSchema` - Alerts API
- `FunnelAnalysisSchema` - Funnel API
- `CohortsResponseSchema` - Cohorts API
- `CashFlowSchema` - Cash flow API
- `TransactionsResponseSchema` - Transactions API
- `SLAResponseSchema` - SLA API
- `CapacityResponseSchema` - Capacity API
- `NPSResponseSchema` - NPS API

### 5. **Monitoring** (`src/lib/monitoring.ts`)
Wrapper all-in-one para APIs.

```typescript
import { withMonitoring } from '@/lib/monitoring';
import { TorreV2Schema } from '@/lib/schemas';
import { FEATURES } from '@/lib/feature-flags';

// Wrap API route
export const GET = withMonitoring(
  async (request: NextRequest) => {
    const data = await fetchTorreData();
    return NextResponse.json(data);
  },
  {
    requiredFeature: FEATURES.TORRE_V2,
    responseSchema: TorreV2Schema,
    errorContext: { module: 'torre-v2' }
  }
);
```

**Features:**
- Auto feature flag check
- Request/response logging
- Error tracking
- Performance monitoring
- Response validation
- Activity breadcrumbs

### 6. **Health Checks** (`/api/health/integrations`)
Endpoint para verificar status de integrações.

**Request:**
```bash
GET /api/health/integrations
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-19T10:00:00.000Z",
  "uptime": 3600,
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
      "status": "degraded",
      "error": "API key invalid",
      "configured": false,
      "enabled": false
    }
  },
  "features": {
    "TORRE_V2_ENABLED": true,
    "GA4_ENABLED": true,
    "STRIPE_ENABLED": false
  },
  "torreV2": {
    "ready": true,
    "missingIntegrations": [],
    "warnings": ["Stripe not configured"]
  }
}
```

**Status Codes:**
- `200` - Healthy
- `207` - Degraded (some integrations failing)
- `503` - Unhealthy (critical failure)

---

## 🚀 Como Usar

### 1. Setup Inicial

**Instalar dependências:**
```bash
npm install zod
```

**Configurar env vars:**
```bash
# Feature flags
NEXT_PUBLIC_TORRE_V2_ENABLED=true

# Logging
LOG_LEVEL=info
LOG_TO_CONSOLE=true

# Error tracking (opcional)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

### 2. Em APIs

```typescript
// src/app/api/admin/my-api/route.ts
import { withMonitoring } from '@/lib/monitoring';
import { MyResponseSchema } from '@/lib/schemas';

export const GET = withMonitoring(
  async (request: NextRequest) => {
    // Your logic here
    const data = await fetchData();
    return NextResponse.json(data);
  },
  {
    requiredFeature: 'MY_FEATURE',
    responseSchema: MyResponseSchema,
    errorContext: { module: 'my-api' }
  }
);
```

### 3. Em Componentes

```typescript
// src/components/MyComponent.tsx
'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';
import { captureException } from '@/lib/error-tracking';
import { isFeatureEnabled, FEATURES } from '@/lib/feature-flags';

export function MyComponent() {
  useEffect(() => {
    logger.info('Component mounted', { component: 'MyComponent' });
  }, []);
  
  // Feature flag check
  if (!isFeatureEnabled(FEATURES.MY_FEATURE)) {
    return <div>Feature disabled</div>;
  }
  
  // Error handling
  async function handleAction() {
    try {
      await riskyOperation();
    } catch (error) {
      captureException(error, {
        severity: 'error',
        context: { component: 'MyComponent' }
      });
      // Show error to user
    }
  }
  
  return <div>...</div>;
}
```

### 4. Em Integration Services

```typescript
// src/lib/integrations/my-integration.ts
import { withIntegrationTracking } from '@/lib/monitoring';

export async function fetchData() {
  return withIntegrationTracking(
    'my-integration',
    'fetchData',
    async () => {
      const response = await fetch('...');
      return response.json();
    },
    { context: { endpoint: '/data' } }
  );
}
```

---

## 📊 Monitoring Dashboard

### Health Check
```bash
curl http://localhost:3000/api/health/integrations | jq
```

### Browser Console (Dev)
```javascript
// Feature flags
window.__featureFlags.getAll()
window.__featureFlags.enable('MY_FEATURE')
window.__featureFlags.disable('MY_FEATURE')

// Check Torre v2 status
window.__featureFlags.torreV2Ready()

// Check integrations
window.__featureFlags.integrations()
```

---

## 🔧 Troubleshooting

### Feature não aparecendo?
```typescript
// Check feature flag
import { isFeatureEnabled, isTorreV2Ready } from '@/lib/feature-flags';

console.log(isFeatureEnabled('TORRE_V2_ENABLED')); // true/false
console.log(isTorreV2Ready()); // { ready, missingIntegrations, warnings }
```

### Logs não aparecem?
```bash
# Check LOG_LEVEL
LOG_LEVEL=debug

# Enable console
LOG_TO_CONSOLE=true
```

### Validação falhando?
```typescript
// Check what's invalid
import { validateResponse } from '@/lib/schemas';

const result = validateResponse(MySchema, data);
if (!result.success) {
  console.error('Validation errors:', result.error);
}
```

### Integration failing?
```bash
# Check health endpoint
curl http://localhost:3000/api/health/integrations

# Check logs for integration errors
grep "integration" logs.txt
```

---

## 📈 Métricas

### Performance
```typescript
import { getPerformanceStats, getAllPerformanceStats } from '@/lib/monitoring';

// Get stats for specific operation
const stats = getPerformanceStats('fetchTorreData');
console.log(stats); // { count, avg, min, max, p50, p95, p99 }

// Get all stats
const allStats = getAllPerformanceStats();
```

### Breadcrumbs
```typescript
import { getBreadcrumbs } from '@/lib/error-tracking';

// Get activity trail
const breadcrumbs = getBreadcrumbs();
console.log(breadcrumbs); // Last 50 activities before error
```

---

## 🎯 Best Practices

1. **Always use `withMonitoring`** para API routes
2. **Validate responses** com Zod schemas
3. **Check feature flags** antes de features experimentais
4. **Log operações importantes** com contexto
5. **Capture exceptions** em try/catch blocks
6. **Add breadcrumbs** em operações críticas
7. **Monitor health endpoint** regularmente
8. **Track performance** de operações lentas

---

## 🚨 Production Checklist

- [ ] `LOG_LEVEL=info` (não debug)
- [ ] Sentry DSN configurado
- [ ] Feature flags ajustados
- [ ] Health checks funcionando
- [ ] Alerts configurados
- [ ] Performance baseline estabelecido
- [ ] Error rate aceitável (<1%)

---

## 📚 Referências

- [Feature Flags Pattern](https://martinfowler.com/articles/feature-toggles.html)
- [Structured Logging](https://www.loggly.com/ultimate-guide/node-logging-basics/)
- [Error Tracking Best Practices](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Zod Documentation](https://zod.dev/)
