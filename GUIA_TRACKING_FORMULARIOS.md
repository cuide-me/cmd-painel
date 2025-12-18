# 📊 GUIA: Implementar Tracking em Formulários

**Data:** 2025-06-XX  
**Objetivo:** Adicionar tracking GA4 nos formulários críticos (signup, job creation)  
**Status:** 🔄 AGUARDANDO CRIAÇÃO DOS FORMULÁRIOS

---

## 🚨 PROBLEMA IDENTIFICADO

Durante investigação do código, **NÃO foram encontrados** formulários de:
- ❌ Signup/cadastro de usuários
- ❌ Criação de jobs/solicitações
- ❌ Perfil de profissionais
- ❌ Contato com cuidadores

**Código atual contém apenas:**
- ✅ Painel administrativo (`/admin/*`)
- ✅ APIs backend (`/api/admin/*`)
- ✅ Services de analytics

**Hipóteses:**
1. Frontend está em repositório separado
2. Autenticação via Firebase UI (sem forms custom)
3. Sistema está em fase muito inicial (198 users criados via console?)

---

## 📍 ONDE IMPLEMENTAR (quando existir)

### 1. **Formulário de Signup** 🎯 CRÍTICO

**Evento:** `sign_up`  
**Quando disparar:** Após successful user creation no Firebase Auth

**Código de exemplo:**

```typescript
// pages/signup.tsx (ou app/signup/page.tsx)
'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebase/firebaseApp';
import { ConversionEvents } from '@/lib/analytics/trackEvent';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // 1. Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // 2. ⭐ TRACKING: Signup concluído
      ConversionEvents.signUp({
        method: 'email',
        user_type: 'familia' // ou 'profissional'
      });
      
      // 3. Redirecionar para completar perfil
      window.location.href = '/perfil/completar';
      
    } catch (error) {
      console.error('Erro no signup:', error);
      // Não trackar erros (apenas sucessos)
    }
  };

  return (
    <form onSubmit={handleSignup}>
      {/* ... form fields ... */}
    </form>
  );
}
```

**Parâmetros do evento:**
- `method`: 'email' | 'google' | 'facebook'
- `user_type`: 'familia' | 'profissional' | 'admin'

---

### 2. **Completar Perfil** 🎯 CRÍTICO

**Evento:** `profile_complete`  
**Quando disparar:** Após salvar perfil completo no Firestore

```typescript
// pages/perfil/completar.tsx
'use client';

import { ConversionEvents } from '@/lib/analytics/trackEvent';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseApp';

export default function CompleteProfilePage() {
  const handleSubmit = async (profileData: any) => {
    try {
      // 1. Salvar perfil no Firestore
      await setDoc(doc(db, 'users', userId), {
        ...profileData,
        profileCompletedAt: new Date().toISOString()
      });
      
      // 2. ⭐ TRACKING: Perfil completo
      ConversionEvents.profileComplete({
        user_type: profileData.perfil, // 'cliente' ou 'profissional'
        profile_fields: Object.keys(profileData).length
      });
      
      // 3. Redirecionar para dashboard
      window.location.href = '/dashboard';
      
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
    }
  };

  return (/* ... form ... */);
}
```

---

### 3. **Criar Solicitação (Job)** 🎯 ALTA PRIORIDADE

**Evento:** `contact_caregiver`  
**Quando disparar:** Após criar job no Firestore

```typescript
// pages/solicitar-cuidador.tsx
'use client';

import { ConversionEvents } from '@/lib/analytics/trackEvent';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseApp';

export default function CreateJobPage() {
  const handleCreateJob = async (jobData: any) => {
    try {
      // 1. Criar job no Firestore
      const jobRef = await addDoc(collection(db, 'jobs'), {
        ...jobData,
        clientId: currentUser.uid,
        status: 'aberto',
        createdAt: new Date().toISOString()
      });
      
      // 2. ⭐ TRACKING: Job criado
      ConversionEvents.contactCaregiver({
        job_id: jobRef.id,
        category: jobData.categoria, // 'idoso', 'crianca', 'deficiencia'
        urgency: jobData.urgencia     // 'imediato', 'planejado'
      });
      
      // 3. Redirecionar para aguardar propostas
      window.location.href = `/jobs/${jobRef.id}`;
      
    } catch (error) {
      console.error('Erro ao criar job:', error);
    }
  };

  return (/* ... form ... */);
}
```

---

### 4. **Aceitar Match** 🎯 MÉDIA PRIORIDADE

**Evento:** `match_accepted`  
**Quando disparar:** Quando família aceita proposta de profissional

```typescript
// pages/jobs/[id]/proposals.tsx
'use client';

import { ConversionEvents } from '@/lib/analytics/trackEvent';
import { doc, updateDoc } from 'firebase/firestore';

export default function ProposalsPage() {
  const handleAcceptProposal = async (jobId: string, proposalId: string) => {
    try {
      // 1. Atualizar status no Firestore
      await updateDoc(doc(db, 'jobs', jobId), {
        'proposal.status': 'aceita',
        'proposal.acceptedAt': new Date().toISOString()
      });
      
      // 2. ⭐ TRACKING: Match aceito
      ConversionEvents.matchAccepted({
        job_id: jobId,
        specialist_id: proposalId,
        time_to_match: calculateTimeToMatch() // em horas
      });
      
      // 3. Redirecionar para pagamento
      window.location.href = `/jobs/${jobId}/payment`;
      
    } catch (error) {
      console.error('Erro ao aceitar proposta:', error);
    }
  };

  return (/* ... UI ... */);
}
```

---

### 5. **Pagamento Concluído** 💰 CRÍTICO

**Evento:** `payment_success` (via Stripe webhook)

```typescript
// app/api/webhooks/stripe/route.ts
import { ConversionEvents } from '@/lib/analytics/trackEvent';
import Stripe from 'stripe';

export async function POST(req: Request) {
  const event = await stripe.webhooks.constructEvent(/*...*/);
  
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    
    // ⭐ TRACKING: Pagamento sucesso
    ConversionEvents.paymentSuccess({
      transaction_id: paymentIntent.id,
      value: paymentIntent.amount / 100,
      currency: 'BRL',
      payment_method: paymentIntent.payment_method_types[0]
    });
    
    // ... processar pagamento ...
  }
  
  return new Response('OK', { status: 200 });
}
```

---

### 6. **Submeter Feedback** ⭐ ALTA PRIORIDADE

**Evento:** `feedback_submitted`  
**Quando disparar:** Após salvar feedback no Firestore

```typescript
// pages/feedback.tsx
'use client';

import { ConversionEvents } from '@/lib/analytics/trackEvent';
import { collection, addDoc } from 'firebase/firestore';

export default function FeedbackPage() {
  const handleSubmit = async (feedbackData: any) => {
    try {
      // 1. Salvar feedback
      await addDoc(collection(db, 'feedbacks'), {
        ...feedbackData,
        createdAt: new Date().toISOString()
      });
      
      // 2. ⭐ TRACKING: Feedback enviado
      ConversionEvents.feedbackSubmitted({
        rating: feedbackData.rating,
        type: feedbackData.type
      });
      
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
    }
  };

  return (/* ... form ... */);
}
```

---

## 🔍 COMO ENCONTRAR OS FORMULÁRIOS

Se os formulários já existem mas não foram encontrados, buscar em:

### 1. **Outro repositório:**
```bash
# Verificar se existe frontend separado
ls ../ | grep -E "frontend|client|web|app"
```

### 2. **Firebase UI:**
```bash
# Buscar por FirebaseUI (lib de autenticação pronta)
grep -r "firebase-ui" .
grep -r "firebaseui" .
```

### 3. **Páginas públicas (não admin):**
```bash
# Buscar páginas fora de /admin
find src/app -name "*.tsx" | grep -v admin
```

### 4. **API routes de signup:**
```bash
# Buscar endpoints de criação
grep -r "createUser\|signUp\|register" src/app/api
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

Quando encontrar/criar os formulários:

### Para cada formulário:
- [ ] Importar `ConversionEvents` de `@/lib/analytics/trackEvent`
- [ ] Adicionar tracking **APENAS** após ação bem-sucedida
- [ ] Incluir parâmetros relevantes (user_type, method, etc.)
- [ ] **NÃO** trackar em caso de erro
- [ ] Testar em development (console.log visível)

### Validação:
```bash
# 1. Build deve passar
npm run build

# 2. Deploy para staging/production
vercel deploy

# 3. Testar com GA4 DebugView
# - Instalar extensão: GA Debugger (Chrome)
# - Abrir DebugView: https://analytics.google.com/analytics/web/ → Admin → DebugView
# - Preencher formulário e verificar evento aparecendo em tempo real
```

---

## 🎯 PRIORIDADE DE IMPLEMENTAÇÃO

| Evento | Prioridade | Motivo | Impacto |
|--------|-----------|--------|---------|
| `sign_up` | 🔴 CRÍTICA | Topo do funil, atribuição de mídia | ⭐⭐⭐⭐⭐ |
| `profile_complete` | 🔴 CRÍTICA | Ativação de usuário, qualificação de lead | ⭐⭐⭐⭐⭐ |
| `contact_caregiver` | 🟠 ALTA | Conversão principal, revenue potential | ⭐⭐⭐⭐ |
| `feedback_submitted` | 🟠 ALTA | Qualidade do serviço, NPS tracking | ⭐⭐⭐⭐ |
| `payment_success` | 🔴 CRÍTICA | Revenue real, ROI de marketing | ⭐⭐⭐⭐⭐ |
| `match_accepted` | 🟡 MÉDIA | Confirma intenção, mas não revenue | ⭐⭐⭐ |

---

## 📝 PRÓXIMOS PASSOS

### Imediato:
1. ✅ Infraestrutura GA4 pronta (GTM + helper)
2. 🔄 Localizar formulários de signup/job creation
3. ⏸️ Implementar tracking conforme guia acima

### Curto Prazo:
4. ⏸️ Testar em staging com GA4 DebugView
5. ⏸️ Deploy para produção
6. ⏸️ Monitorar eventos em GA4 Realtime

### Médio Prazo:
7. ⏸️ Marcar eventos como conversões no GA4 Admin
8. ⏸️ Criar funis no GA4 (Signup → Profile → Job → Payment)
9. ⏸️ Configurar audiences para remarketing

---

## 🚨 IMPORTANTE

**Por que não implementar agora:**
- ❌ Não existem formulários no código atual (apenas admin)
- ❌ Não há rotas públicas de signup/job creation
- ❌ Sistema parece estar em fase inicial (1 job total)

**Quando implementar:**
- ✅ Quando criar frontend público
- ✅ Quando adicionar formulários de signup
- ✅ Quando implementar criação de jobs na UI

**Alternativa temporária:**
- Se signup é via Firebase Console → adicionar tracking manualmente via Cloud Functions
- Se jobs são criados via API direta → adicionar tracking no backend

---

**Status:** 🟡 BLOQUEADO - Aguardando criação dos formulários no frontend
