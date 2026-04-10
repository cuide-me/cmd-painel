# 📊 Análise Completa de Eventos GA4 - Cuide.me

> **Última atualização:** 21/12/2025  
> **Objetivo:** Mapear todos os eventos GA4 disponíveis para o painel administrativo

---

## 🔍 RESUMO EXECUTIVO

### ✅ **Status Atual do GA4**
- **Painel Admin:** Usando apenas métricas padrão (`sessions`, `activeUsers`)
- **App Mobile:** Eventos customizados implementados via Firebase Analytics
- **Site Web:** **NÃO encontrado tracking de eventos** (apenas métricas padrão do GA4)

### 🎯 **Métricas GA4 Disponíveis (Atualmente em Uso)**

**No Painel Admin** (`/api/admin/analytics-daily`):
```typescript
metrics: [{ name: 'sessions' }]  // Sessões por dia
```

**Métricas GA4 Padrão Disponíveis (não usadas ainda):**
- `activeUsers` - Usuários ativos
- `newUsers` - Novos usuários
- `sessions` - Sessões ✅ **EM USO**
- `screenPageViews` - Visualizações de página
- `averageSessionDuration` - Duração média da sessão
- `bounceRate` - Taxa de rejeição
- `conversions` - Conversões
- `totalRevenue` - Receita total
- `engagementRate` - Taxa de engajamento
- `eventCount` - Contagem de eventos

---

## 📱 EVENTOS CUSTOMIZADOS - APP MOBILE

### **Arquivo:** `Cuide-me-Mobile-main/lib/analytics.ts`

### 1️⃣ **Autenticação (Authentication Events)**
```typescript
// Login
- login_attempt          // Tentativa de login (email)
- login_success          // Login bem-sucedido (email)
- login_failure          // Falha no login (email)

// Login com Google
- google_login_attempt   // Tentativa de login com Google
- google_login_success   // Login Google bem-sucedido
- google_login_failure   // Falha no login Google

// Registro
- register_attempt       // Tentativa de cadastro
- register_success       // Cadastro bem-sucedido
- register_failure       // Falha no cadastro

// Outros
- password_reset_attempt // Tentativa de redefinir senha
- logout                 // Logout do usuário
```

**Parâmetros comuns:**
```typescript
{
  login_method: 'email' | 'google',
  user_type: string,
  user_id: string,
  error_code: string  // Em caso de falha
}
```

---

### 2️⃣ **Perfil (Profile Events)**
```typescript
- profile_view                    // Visualização de perfil
- profile_edit                    // Edição de perfil
- profile_complete                // Perfil completo
- profile_completion_modal_shown  // Modal de completar perfil exibido
- profile_completion_modal_completed  // Modal de completar perfil concluído
- profile_completion_modal_cancelled  // Modal de completar perfil cancelado
```

**Parâmetros:**
```typescript
{
  source: 'google_login' | 'google_register',
  user_type: string,
  has_specialities: boolean
}
```

---

### 3️⃣ **Busca e Descoberta (Search & Discovery)**
```typescript
- specialist_search    // Busca por especialista
- specialist_view      // Visualização de especialista
- professional_view    // Visualização de profissional ⭐ IMPORTANTE
- specialist_filter    // Aplicação de filtros
- specialist_contact   // Contato com especialista
```

**Parâmetros do `professional_view`:**
```typescript
{
  professional_id: string,
  professional_category: string,
  professional_city: string,
  listed_price: number,
  source: string  // ex: 'search_results'
}
```

---

### 4️⃣ **Jobs e Propostas (Job/Proposal Events)**
```typescript
- job_create_start    // Início da criação de job
- job_create_success  // Job criado com sucesso
- job_create_failure  // Falha na criação de job
- proposal_send       // Envio de proposta
- proposal_accept     // Aceitação de proposta
- proposal_reject     // Rejeição de proposta
- job_complete        // Job concluído
```

---

### 5️⃣ **Navegação (Navigation Events)**
```typescript
- screen_view      // Visualização de tela
- button_click     // Clique em botão
- navigation_tab   // Navegação por abas
```

**Parâmetros:**
```typescript
{
  screen_name: string,
  button_name: string,
  button_location: string
}
```

---

### 6️⃣ **Erros (Error Events)**
```typescript
- app_error       // Erro da aplicação
- network_error   // Erro de rede
```

**Parâmetros:**
```typescript
{
  error_type: string,
  error_message: string,
  error_location: string
}
```

---

## 🌐 EVENTOS WEB - Cuide-me-main

### **Status:** ⚠️ **NÃO IMPLEMENTADO**

**Análise do código:**
- ❌ Não foi encontrado `gtag` ou `logEvent` no código
- ❌ Não há implementação de tracking customizado
- ❌ Arquivo `src/@types/analytics.ts` existe mas **não é usado**

### **Eventos Planejados (Não Implementados):**

Baseado em `src/@types/analytics.ts`:

```typescript
// Perfil
- profile_completed { percentage, role, city, uf }

// Visualização de Profissional
- view_professional { professional_id, category, city, price }

// Checkout e Compras
- begin_checkout { appointment_id, items, total_value, payment_method }
- purchase { appointment_id, transaction_id, value, currency }

// Agendamentos
- appointment_created { appointment_id, professional_id, start_time, duration }
- appointment_cancelled { appointment_id, who, hours_to_start }

// Reembolsos
- refund_issued { appointment_id, transaction_id, value, refund_reason }
```

---

## 🔗 INTEGRAÇÃO COM STRIPE (Potencial)

**Eventos que podem ser cruzados com Stripe:**

### Do Mobile + Stripe:
```typescript
purchase {
  transaction_id: string,  // PaymentIntent do Stripe
  value: number,
  currency: 'BRL'
}
```

### Disponível no Stripe:
- `PaymentIntent.succeeded`
- `Charge.succeeded`
- `Payment.created`
- `Refund.created`

---

## 📊 OPORTUNIDADES PARA O PAINEL ADMIN

### 🎯 **Dashboards que Podemos Criar:**

#### 1. **Funil de Conversão Completo**
```
Etapa                    Evento Mobile           Métrica GA4
─────────────────────────────────────────────────────────────
1. Visitantes            -                      activeUsers
2. Cadastros             register_success       -
3. Perfil Completo       profile_complete       -
4. Busca                 specialist_search      -
5. Visualizou Prof.      professional_view      -
6. Enviou Proposta       proposal_send          -
7. Proposta Aceita       proposal_accept        -
8. Pagamento             purchase ⚡ Stripe     -
```

#### 2. **Análise de Autenticação**
```typescript
// Métricas possíveis:
{
  total_login_attempts: number,
  login_success_rate: number,
  google_vs_email_ratio: number,
  failed_login_reasons: { [error_code]: count }
}
```

#### 3. **Análise de Profissionais Mais Vistos**
```typescript
// De professional_view:
{
  professional_id: string,
  total_views: number,
  unique_users: number,
  conversion_to_contact: number,
  avg_listed_price: number
}
```

#### 4. **Análise de Jobs/Propostas**
```typescript
{
  jobs_created: number,
  proposals_sent: number,
  proposals_accepted: number,
  acceptance_rate: number,
  avg_time_to_accept: number
}
```

#### 5. **Análise de Erros**
```typescript
{
  error_type: string,
  count: number,
  affected_users: number,
  error_locations: string[]
}
```

---

## 🚀 RECOMENDAÇÕES PARA O PAINEL

### **Prioridade ALTA:**

1. **Implementar APIs para acessar eventos customizados do Mobile**
   ```typescript
   // Nova API: /api/admin/mobile-events
   GET /api/admin/mobile-events?event=professional_view&days=30
   ```

2. **Dashboard de Conversão**
   - Funil: Visitante → Cadastro → Perfil → Busca → Match → Pagamento
   - Taxa de conversão em cada etapa
   - Identificar gargalos

3. **Dashboard de Autenticação**
   - Taxa de sucesso/falha
   - Google vs Email
   - Principais erros

### **Prioridade MÉDIA:**

4. **Top Profissionais**
   - Mais visualizados
   - Mais contatados
   - Maior taxa de conversão

5. **Análise de Jobs**
   - Criados vs Concluídos
   - Taxa de aceitação de propostas
   - Tempo médio de resposta

### **Prioridade BAIXA:**

6. **Implementar eventos no site web**
   - Usar os schemas já definidos em `@types/analytics.ts`
   - Adicionar gtag nos componentes críticos

---

## 📝 PRÓXIMOS PASSOS TÉCNICOS

### 1. **Criar API para eventos customizados:**
```typescript
// src/app/api/admin/ga4-events/route.ts
import { BetaAnalyticsDataClient } from '@google-analytics/data';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const eventName = searchParams.get('event');
  const days = parseInt(searchParams.get('days') || '30');
  
  const [response] = await analyticsDataClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'eventName' }, { name: 'date' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        stringFilter: { value: eventName }
      }
    }
  });
  
  return NextResponse.json({ data: response });
}
```

### 2. **Query para parâmetros de eventos:**
```typescript
// Buscar parâmetros específicos do evento
dimensions: [
  { name: 'eventName' },
  { name: 'customEvent:professional_id' },  // ⚠️ Requer configuração no GA4
  { name: 'customEvent:user_type' }
]
```

### 3. **Dashboard de Funil:**
```typescript
// LEGADO REMOVIDO: antiga tela src/app/admin/funil/page.tsx
const funil = [
  { step: 'Visitantes', event: null, metric: 'activeUsers' },
  { step: 'Cadastros', event: 'register_success' },
  { step: 'Perfil Completo', event: 'profile_complete' },
  { step: 'Buscas', event: 'specialist_search' },
  { step: 'Visualizações', event: 'professional_view' },
  { step: 'Propostas', event: 'proposal_send' },
  { step: 'Aceitas', event: 'proposal_accept' },
  { step: 'Pagamentos', event: 'purchase' }
];
```

---

## ⚠️ LIMITAÇÕES IDENTIFICADAS

1. **Site Web não envia eventos customizados**
   - Apenas métricas padrão do GA4
   - Perdemos visibilidade do funil no desktop

2. **Parâmetros customizados requerem configuração no GA4**
   - Precisa definir "Custom Definitions" no GA4
   - Exemplo: `professional_id`, `user_type`, etc.

3. **Firebase Analytics vs GA4**
   - Mobile usa Firebase Analytics (eventos vão para GA4)
   - Web poderia usar gtag direto
   - Precisa garantir consistência de nomes

---

## 🎯 RESUMO DE AÇÕES

| Ação | Prioridade | Esforço | Impacto |
|------|-----------|---------|---------|
| API para eventos mobile | 🔴 Alta | Médio | Alto |
| Dashboard de Funil | 🔴 Alta | Alto | Alto |
| Dashboard de Autenticação | 🟡 Média | Baixo | Médio |
| Top Profissionais | 🟡 Média | Baixo | Alto |
| Implementar eventos no web | 🟢 Baixa | Alto | Médio |
| Análise de Erros | 🟢 Baixa | Baixo | Baixo |

---

## 📚 REFERÊNCIAS

- **Mobile Analytics:** `Cuide-me-Mobile-main/lib/analytics.ts`
- **Web Types:** `Cuide-me-main/src/@types/analytics.ts`
- **Painel API:** `cmd-painel-main/src/app/api/admin/analytics-daily/route.ts`
- **GA4 Data API:** https://developers.google.com/analytics/devguides/reporting/data/v1

---

**Criado por:** GitHub Copilot  
**Data:** 21/12/2025
