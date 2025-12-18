# 🎯 GUIA DE IMPLEMENTAÇÃO: TRACKING GA4

**Status:** ✅ Setup básico implementado  
**Próximo:** Adicionar tracking nos formulários

---

## ✅ O QUE FOI IMPLEMENTADO

### 1. Google Tag Manager
- **Arquivo:** `src/components/GoogleTagManager.tsx`
- **Instalado em:** `src/app/layout.tsx`
- **Measurement ID:** G-B21PK9JQYS

### 2. Helper de Tracking
- **Arquivo:** `src/lib/analytics/trackEvent.ts`
- **Funções:** `trackEvent()`, `ConversionEvents`, `EcommerceEvents`

---

## 📋 PRÓXIMOS PASSOS

### Onde Implementar Tracking

#### 1. Formulário de Cadastro
**Localização:** Encontrar onde está o signup form (não mapeado ainda)

**Implementar:**
```tsx
import { ConversionEvents } from '@/lib/analytics/trackEvent';

// No sucesso do cadastro
const handleSignup = async (data) => {
  // ... lógica de cadastro ...
  
  // Track evento
  ConversionEvents.signUp({
    method: 'email',
    user_type: data.perfil, // 'profissional' ou 'cliente'
  });
};
```

---

#### 2. Criar Solicitação de Cuidado
**Localização:** Form que cria job (não mapeado ainda)

**Implementar:**
```tsx
import { ConversionEvents } from '@/lib/analytics/trackEvent';

// Ao criar job
const handleCreateJob = async (data) => {
  // ... criar job ...
  
  ConversionEvents.contactCaregiver({
    job_id: jobId,
    specialty: data.specialty || 'unknown',
    modality: data.modality,
    user_id: userId,
  });
};
```

---

#### 3. Completar Perfil
**Localização:** Form de profile completion

**Implementar:**
```tsx
import { ConversionEvents } from '@/lib/analytics/trackEvent';

// Ao completar perfil
const handleProfileComplete = async (data) => {
  // ... salvar perfil ...
  
  ConversionEvents.profileComplete({
    user_type: data.perfil,
    profile_completion: 100,
  });
};
```

---

#### 4. Pagamento (Stripe Webhook)
**Localização:** Webhook handler do Stripe

**Implementar:**
```tsx
// No webhook de pagamento bem-sucedido
if (event.type === 'payment_intent.succeeded') {
  const paymentIntent = event.data.object;
  
  // Track no server-side (GA4 Measurement Protocol)
  // OU disparar evento no client após redirect
  ConversionEvents.paymentSuccess({
    transaction_id: paymentIntent.id,
    value: paymentIntent.amount / 100,
    currency: 'BRL',
    payment_method: paymentIntent.payment_method_types[0],
  });
}
```

---

#### 5. Aceitar Match
**Localização:** Quando profissional aceita proposta

**Implementar:**
```tsx
import { ConversionEvents } from '@/lib/analytics/trackEvent';

// Ao aceitar match
const handleAcceptMatch = async (jobId, specialistId) => {
  // ... aceitar match ...
  
  ConversionEvents.matchAccepted({
    job_id: jobId,
    specialist_id: specialistId,
    client_id: clientId,
  });
};
```

---

#### 6. Completar Job
**Localização:** Quando job é finalizado

**Implementar:**
```tsx
import { ConversionEvents } from '@/lib/analytics/trackEvent';

// Ao completar job
const handleCompleteJob = async (jobId) => {
  // ... completar job ...
  
  ConversionEvents.jobCompleted({
    job_id: jobId,
    duration_days: durationDays,
    rating: rating,
  });
};
```

---

## 🧪 COMO TESTAR

### 1. Development Local
```bash
npm run dev
```

Abra o console do browser e veja os logs:
```
[Analytics] Event tracked: sign_up { method: 'email', user_type: 'cliente' }
```

---

### 2. GA4 DebugView
1. Instalar extensão: [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger)
2. Ativar extensão
3. Abrir site em dev
4. Acessar GA4 > Admin > DebugView
5. Testar eventos em tempo real

---

### 3. GA4 Realtime Report
1. Acessar [Google Analytics](https://analytics.google.com)
2. Selecionar Property: 503083965
3. Reports > Realtime
4. Testar eventos e ver aparecendo em tempo real

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Setup (✅ Completo)
- [x] Google Tag Manager instalado
- [x] Helper trackEvent() criado
- [x] ConversionEvents exportados

### Eventos Críticos (❌ Pendente)
- [ ] `sign_up` - Cadastro
- [ ] `contact_caregiver` - Criar job
- [ ] `payment_success` - Pagamento
- [ ] `subscription_start` - Assinatura

### Eventos Importantes (❌ Pendente)
- [ ] `profile_complete` - Completar perfil
- [ ] `match_accepted` - Aceitar match
- [ ] `job_completed` - Completar job

### Configuração GA4 (❌ Pendente)
- [ ] Marcar eventos como conversões
- [ ] Criar parâmetros customizados
- [ ] Criar audiências
- [ ] Configurar funis

### Testes (❌ Pendente)
- [ ] Testar em development
- [ ] Testar com GA4 DebugView
- [ ] Verificar em Realtime
- [ ] Deploy e testar em produção

---

## 🚨 IMPORTANTE

### Eventos Devem Ser Marcados como Conversões
Após implementar, acesse GA4 e marque como conversões:
1. GA4 > Admin > Events
2. Encontrar evento (ex: `sign_up`)
3. Toggle "Mark as conversion"

Eventos críticos para marcar:
- ✅ `sign_up`
- ✅ `contact_caregiver`
- ✅ `payment_success`
- ✅ `subscription_start`

---

## 📊 IMPACTO ESPERADO

Após implementação completa:
- ✅ Rastrear 100% das conversões
- ✅ Criar funis de marketing
- ✅ Atribuir origens de tráfego
- ✅ Medir ROI de campanhas
- ✅ Identificar gargalos no funil

---

## 🔧 TROUBLESHOOTING

### Eventos não aparecem no GA4
1. Verificar se GTM está carregando (console do browser)
2. Verificar se `window.gtag` está disponível
3. Testar com GA4 Debugger extension
4. Aguardar até 24h para aparecer em relatórios (Realtime é imediato)

### Measurement ID incorreto
```tsx
// Verificar em .env.local
NEXT_PUBLIC_GA4_ID=G-B21PK9JQYS
```

### Eventos disparando múltiplas vezes
- Verificar se componente não está renderizando múltiplas vezes
- Usar useEffect com dependencies corretas
- Adicionar flags de "already tracked"

---

## 📝 PRÓXIMAS AÇÕES

1. **Mapear formulários** - Onde estão signup, job creation, etc
2. **Implementar tracking** - Adicionar ConversionEvents nos forms
3. **Testar em dev** - Verificar logs no console
4. **Testar com DebugView** - Ver eventos em tempo real
5. **Deploy** - Subir para produção
6. **Configurar GA4** - Marcar como conversões, criar audiências

---

**Status:** ⚠️ Setup completo, aguardando implementação nos formulários
