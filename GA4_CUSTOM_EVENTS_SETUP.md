# 🎯 Setup: Custom Events GA4

## 📊 Eventos Implementados

Os seguintes custom events foram criados para rastrear o funil de conversão:

### 1. `sign_up` - Cadastro
**Quando disparar:** Ao completar cadastro de novo usuário

```typescript
import { useGA4Events } from '@/hooks/useGA4Events';

const { trackSignUp } = useGA4Events();

// No sucesso do cadastro:
trackSignUp('email', 'professional'); // ou 'family'
```

### 2. `create_request` - Criar Solicitação
**Quando disparar:** Ao criar nova solicitação de cuidador

```typescript
const { trackCreateRequest } = useGA4Events();

// No sucesso da criação:
trackCreateRequest(requestId, serviceType);
```

### 3. `hire_caregiver` - Contratar Cuidador
**Quando disparar:** Ao confirmar contratação de profissional

```typescript
const { trackHireCaregiver } = useGA4Events();

// No sucesso da contratação:
trackHireCaregiver(requestId, professionalId, valorContrato);
```

### 4. `complete_profile` - Completar Perfil
**Quando disparar:** Ao preencher 100% do perfil

```typescript
const { trackCompleteProfile } = useGA4Events();

trackCompleteProfile(userId, 'professional');
```

### 5. `view_professional` - Ver Perfil Profissional
**Quando disparar:** Ao visualizar página de profissional

```typescript
const { trackViewProfessional } = useGA4Events();

trackViewProfessional(professionalId, 'family'); // ou 'admin'
```

---

## 🔧 Como Integrar

### Passo 1: Importar o Hook
```typescript
'use client'; // Se for Client Component

import { useGA4Events } from '@/hooks/useGA4Events';

export default function MyPage() {
  const { trackSignUp, trackCreateRequest } = useGA4Events();
  
  // ... resto do código
}
```

### Passo 2: Disparar no Momento Certo
```typescript
const handleSignup = async (data: SignupData) => {
  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (response.ok) {
      // ✅ DISPARAR EVENTO AQUI
      trackSignUp(data.method, data.userType);
      
      router.push('/dashboard');
    }
  } catch (error) {
    console.error(error);
  }
};
```

---

## 📍 Páginas que Precisam de Integração

### ✅ Prioridade Alta
1. **Página de Cadastro** (`/signup` ou `/register`)
   - Evento: `sign_up`
   - Momento: Após sucesso no backend

2. **Página de Criar Solicitação** (`/requests/new` ou `/create-request`)
   - Evento: `create_request`
   - Momento: Após criação confirmada

3. **Página de Contratação** (`/hire` ou `/confirm-hire`)
   - Evento: `hire_caregiver`
   - Momento: Após pagamento/confirmação

### 🔸 Prioridade Média
4. **Página de Perfil** (`/profile/edit`)
   - Evento: `complete_profile`
   - Momento: Quando completude = 100%

5. **Página de Profissional** (`/professionals/[id]`)
   - Evento: `view_professional`
   - Momento: No `useEffect` da página

---

## 🧪 Como Testar

### 1. Verificar no Console
Todos os eventos logam no console:
```
[GA4] Event tracked: sign_up { method: 'email', user_type: 'professional' }
```

### 2. Verificar no GA4 DebugView
1. Acesse: https://analytics.google.com/analytics/web/
2. Vá em: **Configure > DebugView**
3. Navegue no site e dispare eventos
4. Veja em tempo real no DebugView

### 3. Verificar no Relatório de Eventos
1. Acesse: **Reports > Engagement > Events**
2. Procure pelos eventos:
   - `sign_up`
   - `create_request`
   - `hire_caregiver`
   - `complete_profile`
   - `view_professional`

---

## 📊 Visualizar Funil no Admin

Após implementar os eventos, o funil estará disponível em:

```
/admin → Seção "🎯 Funil de Conversão (GA4)"
```

O dashboard calculará automaticamente:
- Visitantes → Cadastros (taxa de conversão)
- Cadastros → Solicitações (taxa de ativação)
- Solicitações → Contratações (taxa de fechamento)
- **Conversão geral**: Visitantes → Contratações

---

## ⚙️ Configuração Necessária

### Variáveis de Ambiente
```bash
NEXT_PUBLIC_GA4_ID=G-B21PK9JQYS  # Já configurado
GA4_PROPERTY_ID=503083965         # Já configurado
```

### Componente GoogleTagManager
Já incluído no layout principal (`src/app/layout.tsx`):
```tsx
<GoogleTagManager />
```

---

## 🚨 Troubleshooting

### Eventos não aparecem no GA4
1. Verificar se `NEXT_PUBLIC_GA4_ID` está configurado
2. Verificar se `GoogleTagManager` está no layout
3. Aguardar 24-48h para dados aparecerem nos relatórios (DebugView é instantâneo)
4. Verificar AdBlocker (pode bloquear GA4)

### TypeScript Error: gtag not found
O hook já declara o tipo `window.gtag`, mas se houver erro:
```typescript
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
```

---

## 📈 Métricas Adicionais Disponíveis

Além do funil, o hook também oferece:

```typescript
const { trackCustomEvent } = useGA4Events();

// Rastrear qualquer evento customizado:
trackCustomEvent('button_click', { 
  button_name: 'hire_now',
  page: '/professionals/123'
});
```

---

**Setup criado por:** GitHub Copilot
**Data:** 2025-12-18
