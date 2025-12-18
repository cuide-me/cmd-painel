# 📊 EVENTOS GA4 - TAXONOMIA E MAPEAMENTO

**Data:** 2025-12-18  
**Property ID:** 503083965  
**Measurement ID:** G-B21PK9JQYS  
**Status:** ⚠️ Tracking não implementado no client-side

---

## 🔍 AUDITORIA REALIZADA

### Busca no Código
**Padrões buscados:**
- `gtag()`
- `logEvent()`
- `analytics.`
- `trackEvent()`
- `GA4`
- `G-B21PK9JQYS`

**Resultado:** ❌ **Nenhum código de tracking encontrado no client-side**

### Arquivos Verificados
- ✅ `src/app/**/*.tsx` - Nenhuma implementação de tracking
- ✅ `src/app/layout.tsx` - Sem Google Tag Manager ou gtag.js
- ✅ `public/*.html` - Nenhum arquivo HTML encontrado
- ✅ `**/*.{html,tsx,jsx}` - Sem script de tracking

---

## 📈 EVENTOS ATUALMENTE DISPONÍVEIS

### Eventos Automáticos (GA4 Default)
Esses eventos são capturados automaticamente pelo Google Analytics 4:

| Evento | Quando Dispara | Parâmetros | Status |
|--------|----------------|------------|--------|
| `page_view` | Cada visualização de página | `page_location`, `page_title` | ✅ Automático |
| `session_start` | Início de sessão | `session_id` | ✅ Automático |
| `first_visit` | Primeira visita do usuário | - | ✅ Automático |
| `user_engagement` | Engajamento do usuário | `engagement_time_msec` | ✅ Automático |

### Eventos Customizados (Não Implementados)
Eventos que **deveriam** existir mas **não foram encontrados** no código:

| Evento | Onde Deveria Estar | Prioridade | Status |
|--------|-------------------|------------|--------|
| `sign_up` | Fluxo de cadastro | 🔴 CRÍTICO | ❌ Não implementado |
| `profile_complete` | Completar perfil | 🔴 CRÍTICO | ❌ Não implementado |
| `contact_caregiver` | Criar job/solicitação | 🔴 CRÍTICO | ❌ Não implementado |
| `match_accepted` | Aceitar match | 🟡 ALTO | ❌ Não implementado |
| `payment_success` | Pagamento bem-sucedido | 🔴 CRÍTICO | ❌ Não implementado |
| `subscription_start` | Iniciar assinatura | 🔴 CRÍTICO | ❌ Não implementado |
| `job_completed` | Finalizar job | 🟡 ALTO | ❌ Não implementado |
| `feedback_submitted` | Enviar feedback | 🟢 MÉDIO | ❌ Não implementado |

---

## 🚨 PROBLEMAS IDENTIFICADOS

### 1. 🔴 CRÍTICO: Tracking Não Implementado
**Problema:** Nenhum código de tracking encontrado no client-side  
**Impacto:**
- Impossível rastrear eventos de conversão
- Impossível criar funis de marketing
- Impossível atribuir origens de tráfego
- Apenas eventos automáticos são capturados

**Solução:**
1. Adicionar Google Tag Manager ou gtag.js no `layout.tsx`
2. Implementar tracking de eventos customizados
3. Mapear eventos críticos de negócio

---

### 2. 🟡 ALTO: Apenas Pageviews Disponíveis
**Problema:** Apenas pageviews estão sendo rastreados  
**Impacto:**
- Não sabemos quantas pessoas se cadastram
- Não sabemos quantas pessoas criam jobs
- Não sabemos quantas pessoas convertem em pagamento

**Solução:**
Implementar eventos customizados nos pontos críticos do funil

---

## ✅ USO ATUAL DO GA4

### Server-Side (Admin Dashboard)
O GA4 está sendo usado **apenas no admin** para:

| Métrica | API | Status |
|---------|-----|--------|
| `activeUsers` | `runReport()` | ✅ Funciona |
| `newUsers` | `runReport()` | ✅ Funciona |
| `sessions` | `runReport()` | ✅ Funciona |
| `screenPageViews` | `runReport()` | ✅ Funciona |

**Arquivos:**
- `src/services/admin/analytics.ts` - Cliente BetaAnalyticsDataClient
- `src/services/admin/analyticsService.ts` - Métricas básicas
- `src/app/api/admin/daily-metrics/route.ts` - Views diárias
- `src/services/admin/growth/acquisition.ts` - Funil de aquisição

---

## 🎯 RECOMENDAÇÕES

### IMEDIATO (Esta Sprint)

#### 1. Implementar Google Tag Manager
```tsx
// src/app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-XXXXXXX');
            `,
          }}
        />
      </head>
      <body>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {children}
      </body>
    </html>
  );
}
```

**OU** usar gtag.js direto:
```tsx
// src/app/layout.tsx
<head>
  <Script
    src={`https://www.googletagmanager.com/gtag/js?id=G-B21PK9JQYS`}
    strategy="afterInteractive"
  />
  <Script id="google-analytics" strategy="afterInteractive">
    {`
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-B21PK9JQYS');
    `}
  </Script>
</head>
```

---

#### 2. Criar Helper de Tracking
```typescript
// src/lib/analytics/trackEvent.ts
export function trackEvent(
  eventName: string,
  params?: { [key: string]: any }
) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
}

// Tipagem
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js',
      targetId: string | Date,
      config?: any
    ) => void;
    dataLayer?: any[];
  }
}
```

---

#### 3. Implementar Eventos Críticos

**Cadastro (sign_up):**
```tsx
// src/app/signup/page.tsx (ou onde estiver o form)
import { trackEvent } from '@/lib/analytics/trackEvent';

const handleSignup = async (data: SignupData) => {
  // ... lógica de cadastro ...
  
  // Tracking
  trackEvent('sign_up', {
    method: 'email',
    user_type: data.perfil, // 'profissional' ou 'cliente'
  });
};
```

**Criar Job (contact_caregiver):**
```tsx
// src/app/jobs/create/page.tsx (ou onde estiver o form)
const handleCreateJob = async (data: JobData) => {
  // ... criar job ...
  
  trackEvent('contact_caregiver', {
    job_id: jobId,
    specialty: data.specialty,
    user_id: userId,
  });
};
```

**Pagamento (payment_success):**
```tsx
// src/app/checkout/success/page.tsx (ou callback Stripe)
trackEvent('payment_success', {
  transaction_id: paymentIntent.id,
  value: paymentIntent.amount / 100,
  currency: 'BRL',
  payment_method: paymentIntent.payment_method_types[0],
});
```

**Assinatura (subscription_start):**
```tsx
trackEvent('subscription_start', {
  subscription_id: subscription.id,
  plan: subscription.plan.id,
  value: subscription.plan.amount / 100,
  currency: 'BRL',
});
```

---

### CURTO PRAZO (Próximas 2 Sprints)

#### 4. Eventos Adicionais

**Completar Perfil:**
```tsx
trackEvent('profile_complete', {
  user_type: perfil,
  profile_completion: 100,
});
```

**Aceitar Match:**
```tsx
trackEvent('match_accepted', {
  job_id: jobId,
  specialist_id: specialistId,
  client_id: clientId,
});
```

**Completar Job:**
```tsx
trackEvent('job_completed', {
  job_id: jobId,
  duration_days: durationDays,
  rating: rating,
});
```

**Enviar Feedback:**
```tsx
trackEvent('feedback_submitted', {
  job_id: jobId,
  rating: rating,
  has_comment: !!comment,
});
```

---

#### 5. Enhanced Ecommerce (Opcional)

Para tracking avançado de conversões:

```tsx
// Adicionar item ao carrinho (iniciar checkout)
trackEvent('add_to_cart', {
  currency: 'BRL',
  value: planPrice,
  items: [{
    item_id: planId,
    item_name: planName,
    item_category: 'subscription',
    price: planPrice,
    quantity: 1,
  }],
});

// Iniciar checkout
trackEvent('begin_checkout', {
  currency: 'BRL',
  value: planPrice,
  items: [{ /* ... */ }],
});

// Compra completa
trackEvent('purchase', {
  transaction_id: transactionId,
  value: planPrice,
  currency: 'BRL',
  tax: 0,
  shipping: 0,
  items: [{ /* ... */ }],
});
```

---

## 📊 FUNIS A IMPLEMENTAR

### Funil de Ativação
```
1. page_view (homepage)
2. sign_up
3. profile_complete
4. contact_caregiver (criar job)
5. match_accepted
```

### Funil de Conversão (Marketing)
```
1. page_view (landing)
2. sign_up
3. payment_success
```

### Funil de Recorrência
```
1. job_completed (primeiro job)
2. contact_caregiver (segundo job)
3. subscription_start
```

---

## 🔧 CONFIGURAÇÃO NO GA4

### Eventos Customizados a Criar
No console do GA4, criar eventos customizados:

1. **Conversões:**
   - `sign_up` → Marcar como conversão
   - `payment_success` → Marcar como conversão
   - `subscription_start` → Marcar como conversão
   - `contact_caregiver` → Marcar como conversão

2. **Parâmetros Customizados:**
   - `user_type` (string)
   - `job_id` (string)
   - `specialty` (string)
   - `plan` (string)

3. **Audiências:**
   - Usuários que se cadastraram mas não criaram job
   - Usuários que criaram job mas não converteram em pagamento
   - Profissionais inativos (sem aceitar jobs)

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Setup Básico
- [ ] Adicionar Google Tag Manager ou gtag.js no layout.tsx
- [ ] Criar helper trackEvent() em lib/analytics/
- [ ] Testar tracking com GA4 DebugView
- [ ] Verificar eventos no GA4 Realtime

### Eventos Críticos (Prioridade 1)
- [ ] `sign_up` - Cadastro
- [ ] `contact_caregiver` - Criar job
- [ ] `payment_success` - Pagamento
- [ ] `subscription_start` - Assinatura

### Eventos Importantes (Prioridade 2)
- [ ] `profile_complete` - Completar perfil
- [ ] `match_accepted` - Aceitar match
- [ ] `job_completed` - Completar job

### Eventos Opcionais (Prioridade 3)
- [ ] `feedback_submitted` - Enviar feedback
- [ ] Enhanced ecommerce events

### Configuração GA4
- [ ] Marcar eventos como conversões
- [ ] Criar parâmetros customizados
- [ ] Criar audiências
- [ ] Configurar funis no GA4

---

## 📝 NOTAS FINAIS

### Estado Atual
- ✅ GA4 configurado (Property 503083965)
- ✅ Server-side tracking funcionando (admin dashboard)
- ❌ Client-side tracking **não implementado**
- ❌ Eventos customizados **não implementados**

### Impacto da Implementação
**Após implementar:**
- ✅ Rastrear conversões em tempo real
- ✅ Criar funis de marketing
- ✅ Atribuir origens de tráfego
- ✅ Medir ROI de campanhas
- ✅ Identificar gargalos no funil

### Tempo Estimado
- Setup básico (GTM + helper): **2-3 horas**
- Eventos críticos (4 eventos): **4-6 horas**
- Testes e validação: **2 horas**
- **Total: 8-11 horas**

---

**Status:** 🔴 **CRÍTICO - Implementar ASAP**  
**Próximo Passo:** Adicionar GTM/gtag.js no layout.tsx

---

*Documento atualizado em: 2025-12-18*
