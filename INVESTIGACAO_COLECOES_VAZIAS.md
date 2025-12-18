# 🔍 INVESTIGAÇÃO: Coleções Vazias

**Data:** 2025-06-XX  
**Status:** ✅ CONCLUÍDA  
**Objetivo:** Entender por que `ratings`, `proposals` e `deals` aparecem vazias

---

## 📊 DESCOBERTAS CRÍTICAS

### 1. **Ratings NÃO estão vazios** ✅

**Collection:** `feedbacks` (12 documentos)

A coleção `feedbacks` **É** o sistema de ratings da plataforma.

**Estrutura:**
```typescript
{
  name: string,
  email: string,
  message: string,
  type: string,
  rating: number,        // ⭐ Campo de avaliação (1-5)
  platform: string,
  userAgent: string,
  url: string,
  status: string,
  resolved: boolean,
  createdAt: Timestamp
}
```

**Média:** 4.0/5.0 (conforme auditoria anterior)

**Conclusão:** Sistema de ratings está funcional, mas usando nome `feedbacks` ao invés de `ratings`.

---

### 2. **Jobs = Solicitações/Proposals** ✅

**Collection:** `jobs` (1 documento)

**IMPORTANTE:** A collection `jobs` **É** a collection de solicitações/proposals dos clientes!

**Arquitetura:**
- `jobs` = Solicitações criadas por clientes (pedidos de cuidado)
- `jobs.proposal` = Proposta do profissional para aquela solicitação

**Estrutura do único job encontrado:**
```typescript
{
  id: "7pCwWHxZyh2dkCzIPDpl",
  status: "proposta_recusada",        // Status da proposta do profissional
  protocol: "CDM-2025-00001",
  createdAt: "2025-12-08T16:39:49.203Z",
  clientId: "0YpWjnQ2rlb6LubB0lldyk1Q6bj2",  // Quem solicitou
  
  // ⭐ Proposta do profissional (embeded):
  proposal: {
    providerId: "8No3HS7tg5SkPFVpe9kune5yH7C2",  // Quem propôs
    valueTotal: 580,                              // Valor proposto
    // ... outros campos
  }
}
```

**Fluxo:**
1. Cliente cria job/solicitação → documento em `jobs`
2. Profissional envia proposta → campo `proposal` populado
3. Cliente aceita/recusa → `status` = "proposta_aceita" ou "proposta_recusada"

**Verificações realizadas:**
- ✅ Buscou em 8 variações de nomes (proposals, propostas, offers, bids, etc.)
- ✅ Verificou subcollections em `jobs`
- ✅ Verificou subcollections em `users`
- ✅ Confirmou que `jobs` é a collection principal

**Conclusão:** `jobs` serve tanto para solicitações quanto proposals (arquitetura unificada).

---

### 3. **Deals realmente NÃO existem** ⚠️

**Collections buscadas:**
- `deals` ⚪ vazia
- `deal` ⚪ vazia  
- `negocios` ⚪ vazia
- `negocio` ⚪ vazia
- `vendas` ⚪ vazia
- `venda` ⚪ vazia

**Conclusão:** Collection `deals` será criada no futuro quando houver pipeline de vendas B2B ou corporativo.

---

## 🎯 IMPLICAÇÕES PARA TORRE DE CONTROLE

### Para Dashboard de Qualidade (Phase 2):

**Ratings:**
```typescript
// ✅ CORRETO - Usar feedbacks
const ratingsSnap = await db.collection('feedbacks')
  .where('rating', '>=', 1)
  .orderBy('rating', 'desc')
  .get();

const avgRating = feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;
const nps = calculateNPS(feedbacks); // Se tiver campo recommendScore
```

**Solicitações (Jobs):**
```typescript
// ✅ CORRETO - Jobs = Solicitações dos clientes
const allJobs = await db.collection('jobs')
  .orderBy('createdAt', 'desc')
  .get();

// Jobs com proposta do profissional:
const jobsWithProposal = await db.collection('jobs')
  .where('proposal', '!=', null)
  .get();

// Acessar dados:
jobsWithProposal.docs.forEach(doc => {
  const job = doc.data();
  console.log('Cliente:', job.clientId);           // Quem solicitou
  console.log('Profissional:', job.proposal.providerId); // Quem propôs
  console.log('Valor:', job.proposal.valueTotal);        // R$ proposto
  console.log('Status:', job.status);              // proposta_aceita/recusada
});
```

### Para KPIs:

| Métrica | Collection | Campo |
|---------|-----------|-------|
| **Avg Rating** | `feedbacks` | `rating` |
| **NPS Score** | `feedbacks` | `rating` (converter 1-5 → -100/100) |
| **Total Solicitações** | `jobs` | count(docs) |
| **Acceptance Rate** | `jobs` | `status` = "proposta_aceita" / total |
| **Rejection Rate** | `jobs` | `status` = "proposta_recusada" / total |
| **Avg Proposal Value** | `jobs` | `proposal.valueTotal` |
| **Jobs sem Proposta** | `jobs` | `where('proposal', '==', null)` |
| **Deals Closed** | ⚠️ N/A | Aguardar criação |

---

## 📝 RECOMENDAÇÕES

### Curto Prazo (Imediato):

1. **Atualizar documentação:**
   - AUDITORIA_TORRE_CONTROLE.md → Rename `ratings` para `feedbacks`
   - services/admin/dashboard/finance.ts → Buscar proposals embeded

2. **Ajustar queries:**
   - Qualquer código buscando `ratings` deve usar `feedbacks`
   - Queries de proposals devem usar `jobs.proposal`

3. **Criar helpers:**
   ```typescript
   // lib/firebase/helpers.ts
   export async function getProposalsFromJobs() {
     const jobs = await db.collection('jobs')
       .where('proposal', '!=', null)
       .get();
     
     return jobs.docs.map(doc => ({
       jobId: doc.id,
       ...doc.data().proposal
     }));
   }
   ```

### Médio Prazo (Phase 2):

1. **Considerar migração:**
   - Se volume de proposals crescer, considerar extrair para collection separada
   - Pros: Queries mais eficientes, indexação melhor
   - Contras: Complexidade, consistência, migrações

2. **Adicionar índices:**
   ```bash
   # Firestore Indexes
   feedbacks: rating (desc), createdAt (desc)
   jobs: status (asc), proposal.providerId (asc)
   ```

### Longo Prazo (Future):

1. **Criar collection `deals`:**
   - Quando houver vendas B2B/corporativo
   - Estrutura sugerida: dealId, companyId, value, stage, closedAt

---

## 🔍 SCRIPT DE VALIDAÇÃO

Para validar arquitetura em outros ambientes:

```bash
npx tsx scripts/investigate-empty-collections.ts
```

**O que o script valida:**
- ✅ Busca ratings em 6 variações de nomes
- ✅ Verifica se feedbacks tem campo `rating`
- ✅ Busca proposals em 8 variações de nomes
- ✅ Verifica proposals embeded em jobs
- ✅ Verifica subcollections
- ✅ Busca deals em 6 variações

---
| Item | Status | Collection Real | Arquitetura |
|------|--------|----------------|-------------|
| Ratings | ✅ ENCONTRADO | `feedbacks` | Top-level collection |
| Jobs/Solicitações | ✅ ENCONTRADO | `jobs` | Top-level (1 doc) |
| Proposals | ✅ ENCONTRADO | `jobs.proposal` | Embeded field dentro de jobs |
| Deals | ⚠️ NÃO EXISTE | - | Aguardar criação |

**Clarificação:** `jobs` = solicitações dos clientes. Campo `proposal` = proposta do profissional.
| Ratings | ✅ ENCONTRADO | `feedbacks` | Top-level collection |
| Proposals | ✅ ENCONTRADO | `jobs.proposal` | Embeded field |
| Deals | ⚠️ NÃO EXISTE | - | Aguardar criação |

**Conclusão:** Sistema está funcional, mas usa nomes/arquitetura diferentes do esperado.

---

**Próximos Passos:**
1. ✅ Atualizar AUDITORIA_TORRE_CONTROLE.md
2. ✅ Criar GUIA_TRACKING.md (implementação tracking em formulários)
3. ⏸️ Testar GA4 em produção (aguardar deploy)
4. ⏸️ Continuar Phase 2 (Dashboard de Qualidade)
