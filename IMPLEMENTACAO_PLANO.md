# 🚀 PLANO DE IMPLEMENTAÇÃO - PAINEL ADMIN CUIDE-ME

> **Baseado em:** PAINEL_ADMIN_ARQUITETURA.md v3.0.0  
> **Data:** 08/02/2026  
> **Princípio:** 100% dados reais, zero mockups

---

## 📋 ESTRATÉGIA DE IMPLEMENTAÇÃO

### **Abordagem: Incremental e Testável**

1. **Backup atual** → Preservar painel existente
2. **Implementar módulo por módulo** → Validar dados reais a cada etapa
3. **Deploy gradual** → Feature flags para rollback
4. **Auditoria contínua** → Comparar com Firebase Console

---

## 🗂️ ESTRUTURA DE ARQUIVOS NOVA

```
src/
├── app/
│   └── admin/
│       ├── layout.tsx                    # Layout único (sidebar)
│       ├── page.tsx                      # ✅ Dashboard (Visão Geral)
│       │
│       ├── usuarios/
│       │   ├── page.tsx                  # Lista unificada (tabs)
│       │   ├── familias/
│       │   │   ├── page.tsx              # Tabela famílias
│       │   │   └── [id]/
│       │   │       └── page.tsx          # Detalhes família
│       │   └── cuidadores/
│       │       ├── page.tsx              # Tabela cuidadores
│       │       └── [id]/
│       │           └── page.tsx          # Detalhes cuidador
│       │
│       ├── jobs/
│       │   ├── page.tsx                  # Tabela jobs
│       │   └── [id]/
│       │       └── page.tsx              # Detalhes job
│       │
│       ├── funil/
│       │   └── page.tsx                  # Funil de conversão
│       │
│       ├── alertas/
│       │   └── page.tsx                  # Dashboard de alertas
│       │
│       └── service-desk/
│           ├── page.tsx                  # Kanban de tickets
│           ├── novo/
│           │   └── page.tsx              # Criar ticket
│           └── [id]/
│               └── page.tsx              # Detalhes ticket
│
├── components/
│   └── admin/
│       ├── ui/
│       │   ├── KpiCard.tsx               # ✅ Card de métrica
│       │   ├── StatusBadge.tsx           # ✅ Badge de status
│       │   ├── DataTable.tsx             # ✅ Tabela genérica
│       │   ├── FilterBar.tsx             # ✅ Barra de filtros
│       │   ├── AlertBanner.tsx           # ✅ Banner de alerta
│       │   ├── FunnelChart.tsx           # ✅ Visualização funil
│       │   ├── KanbanBoard.tsx           # ✅ Board Kanban
│       │   ├── LoadingState.tsx          # ✅ Skeleton loader
│       │   ├── EmptyState.tsx            # ✅ Estado vazio
│       │   └── index.ts
│       │
│       ├── DashboardStats.tsx            # Stats do dashboard
│       ├── TopRegions.tsx                # Top 5 regiões
│       ├── AlertList.tsx                 # Lista de alertas
│       ├── UserTable.tsx                 # Tabela usuários
│       ├── JobTimeline.tsx               # Timeline de job
│       └── TicketCard.tsx                # Card de ticket
│
├── services/
│   └── admin/
│       ├── dashboard/
│       │   ├── index.ts
│       │   ├── metrics.ts                # Métricas dashboard
│       │   ├── alerts.ts                 # Alertas automáticos
│       │   └── regions.ts                # Top regiões
│       │
│       ├── users/
│       │   ├── index.ts
│       │   ├── familias.ts               # Queries famílias
│       │   ├── cuidadores.ts             # Queries cuidadores
│       │   └── types.ts
│       │
│       ├── jobs/
│       │   ├── index.ts
│       │   ├── queries.ts                # Queries jobs
│       │   ├── statusNormalizer.ts       # Normaliza status PT/EN
│       │   └── types.ts
│       │
│       ├── funil/
│       │   ├── index.ts
│       │   ├── stages.ts                 # Estágios do funil
│       │   └── insights.ts               # Insights automáticos
│       │
│       └── tickets/
│           ├── index.ts
│           ├── kanban.ts                 # Lógica Kanban
│           ├── sla.ts                    # SLA monitoring
│           └── types.ts
│
├── lib/
│   ├── designSystem.ts                   # ✅ Tokens de design
│   ├── dataValidation.ts                 # ✅ Validação de dados
│   └── admin/
│       ├── dateHelpers.ts                # Helpers de data
│       ├── formatters.ts                 # Formatação (R$, %, etc.)
│       └── calculations.ts               # Cálculos de métricas
│
└── hooks/
    ├── useAdminAuth.ts                   # ✅ Já existe
    ├── useDashboardStats.ts              # Hook dashboard
    ├── useJobsData.ts                    # Hook jobs
    ├── useUsersData.ts                   # Hook usuários
    └── useTickets.ts                     # Hook tickets
```

---

## 📦 FASE 1: FUNDAÇÕES (Dia 1-2)

### **1.1 Design System**

#### Arquivo: `src/lib/admin/designSystem.ts`
```typescript
export const adminTheme = {
  colors: {
    brand: {
      primary: '#2563eb',      // Azul Cuide-me
      50: '#eff6ff',
      100: '#dbeafe',
      600: '#2563eb',
      700: '#1d4ed8',
    },
    status: {
      ok: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-500' },
      warning: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-500' },
      critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-500' },
      info: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-500' },
    },
  },
  
  typography: {
    metricValue: 'text-4xl font-bold text-gray-900',
    metricLabel: 'text-sm font-medium text-gray-600',
    metricUnit: 'text-sm text-gray-500',
    sectionTitle: 'text-2xl font-semibold text-gray-900',
    cardTitle: 'text-lg font-medium text-gray-900',
  },
  
  spacing: {
    cardPadding: 'p-6',
    sectionGap: 'space-y-4',
    gridGap: 'gap-6',
  },
};
```

### **1.2 Componentes Base**

#### `src/components/admin/ui/KpiCard.tsx`
```typescript
interface KpiCardProps {
  title: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  status?: 'ok' | 'warning' | 'critical' | 'info';
  subtitle?: string;
  dataSource: string;
  lastUpdate?: string;
  onClick?: () => void;
}

export function KpiCard({
  title,
  value,
  unit,
  trend,
  trendValue,
  status = 'info',
  subtitle,
  dataSource,
  lastUpdate,
  onClick,
}: KpiCardProps) {
  const statusColors = adminTheme.colors.status[status];
  
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border-l-4 ${statusColors.border} ${onClick ? 'cursor-pointer hover:shadow-md transition' : ''}`}
      onClick={onClick}
    >
      <div className="p-6">
        {/* Título */}
        <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
        
        {/* Valor Principal */}
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-gray-900">{value}</span>
          {unit && <span className="text-sm text-gray-500">{unit}</span>}
        </div>
        
        {/* Trend */}
        {trend && trendValue !== undefined && (
          <div className="mt-2 flex items-center gap-1">
            <span className={trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
              {Math.abs(trendValue)}%
            </span>
            <span className="text-xs text-gray-500">vs período anterior</span>
          </div>
        )}
        
        {/* Subtitle */}
        {subtitle && (
          <p className="mt-2 text-xs text-gray-500">{subtitle}</p>
        )}
        
        {/* Metadata */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
          <span className="text-xs text-gray-400">Fonte: {dataSource}</span>
          {lastUpdate && (
            <span className="text-xs text-gray-400">{lastUpdate}</span>
          )}
        </div>
      </div>
    </div>
  );
}
```

#### `src/components/admin/ui/StatusBadge.tsx`
```typescript
interface StatusBadgeProps {
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'matched';
  label?: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, label, size = 'md' }: StatusBadgeProps) {
  const variants = {
    pending: { bg: 'bg-gray-100', text: 'text-gray-700', icon: '⏳' },
    matched: { bg: 'bg-blue-100', text: 'text-blue-700', icon: '🤝' },
    active: { bg: 'bg-blue-100', text: 'text-blue-700', icon: '🔵' },
    completed: { bg: 'bg-green-100', text: 'text-green-700', icon: '✓' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: '❌' },
  };
  
  const variant = variants[status];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${variant.bg} ${variant.text} ${sizeClasses}`}>
      <span>{variant.icon}</span>
      <span>{label || status}</span>
    </span>
  );
}
```

### **1.3 Normalização de Status**

#### `src/services/admin/jobs/statusNormalizer.ts`
```typescript
/**
 * Normaliza status de jobs (PT/EN) para status padrão
 */

export type NormalizedJobStatus = 'pending' | 'matched' | 'active' | 'completed' | 'cancelled';

const STATUS_MAP: Record<string, NormalizedJobStatus> = {
  // Pending
  'pending': 'pending',
  'pendente': 'pending',
  'open': 'pending',
  
  // Matched
  'matched': 'matched',
  'proposta_aceita': 'matched',
  'accepted': 'matched',
  
  // Active
  'active': 'active',
  'in_progress': 'active',
  
  // Completed
  'completed': 'completed',
  'concluido': 'completed',
  
  // Cancelled
  'cancelled': 'cancelled',
  'cancelado': 'cancelled',
};

export function normalizeJobStatus(status: string): NormalizedJobStatus {
  const normalized = STATUS_MAP[status.toLowerCase()];
  
  if (!normalized) {
    console.warn(`[StatusNormalizer] Status desconhecido: "${status}". Usando "pending" como fallback.`);
    return 'pending';
  }
  
  return normalized;
}

export function isJobCompleted(job: any): boolean {
  if (job.attendanceRegistered === true) return true;
  const normalized = normalizeJobStatus(job.status);
  return normalized === 'completed';
}

export function isJobCancelled(job: any): boolean {
  const normalized = normalizeJobStatus(job.status);
  return normalized === 'cancelled';
}

export function isJobActive(job: any): boolean {
  const normalized = normalizeJobStatus(job.status);
  return ['pending', 'matched', 'active'].includes(normalized);
}
```

---

## 📦 FASE 2: DASHBOARD (Dia 3-4)

### **2.1 Service: Dashboard Metrics**

#### `src/services/admin/dashboard/metrics.ts`
```typescript
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getStripeClient } from '@/lib/server/stripe';
import { normalizeJobStatus, isJobCompleted } from '../jobs/statusNormalizer';

interface DashboardMetrics {
  demanda: {
    value: number;
    trend?: number;
    status: 'ok' | 'warning' | 'critical';
  };
  oferta: {
    value: number;
    trend?: number;
    status: 'ok' | 'warning' | 'critical';
  };
  taxaMatch: {
    value: number;
    status: 'ok' | 'warning' | 'critical';
  };
  gmvMensal: {
    value: number;
    status: 'ok' | 'warning' | 'critical';
  };
  ticketMedio: {
    value: number;
  };
  jobsAtivos: {
    value: number;
  };
}

export async function getDashboardMetrics(windowDays: number = 30): Promise<DashboardMetrics> {
  const db = getFirestore();
  const stripe = getStripeClient();
  
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
  
  // Buscar jobs
  const jobsSnapshot = await db
    .collection('jobs')
    .where('createdAt', '>=', Timestamp.fromDate(windowStart))
    .get();
    
  const jobs = jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  // Demanda (famílias únicas)
  const familias = new Set(
    jobs.map(j => j.clientId || j.familyId).filter(Boolean)
  );
  
  // Oferta (profissionais únicos)
  const profissionais = new Set(
    jobs.map(j => j.professionalId || j.specialistId).filter(Boolean)
  );
  
  // Taxa de match
  const jobsComMatch = jobs.filter(j => j.professionalId || j.specialistId).length;
  const taxaMatch = jobs.length > 0 ? (jobsComMatch / jobs.length) * 100 : 0;
  
  // GMV Mensal (Stripe)
  const monthStart = Math.floor(new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000);
  const charges = await stripe.charges.list({
    created: { gte: monthStart },
    limit: 100,
  });
  
  const gmv = charges.data
    .filter(c => c.status === 'succeeded')
    .reduce((sum, c) => sum + c.amount, 0) / 100;
  
  // Ticket Médio
  const jobsConcluidos = jobs.filter(j => isJobCompleted(j)).length;
  const ticketMedio = jobsConcluidos > 0 ? gmv / jobsConcluidos : 0;
  
  // Jobs Ativos
  const jobsAtivos = jobs.filter(j => ['pending', 'matched', 'active'].includes(normalizeJobStatus(j.status))).length;
  
  return {
    demanda: {
      value: familias.size,
      status: familias.size >= 200 ? 'ok' : familias.size >= 100 ? 'warning' : 'critical',
    },
    oferta: {
      value: profissionais.size,
      status: profissionais.size >= 100 ? 'ok' : profissionais.size >= 50 ? 'warning' : 'critical',
    },
    taxaMatch: {
      value: taxaMatch,
      status: taxaMatch >= 70 ? 'ok' : taxaMatch >= 50 ? 'warning' : 'critical',
    },
    gmvMensal: {
      value: gmv,
      status: gmv >= 100000 ? 'ok' : gmv >= 50000 ? 'warning' : 'critical',
    },
    ticketMedio: {
      value: ticketMedio,
    },
    jobsAtivos: {
      value: jobsAtivos,
    },
  };
}
```

### **2.2 Página: Dashboard**

#### `src/app/admin/page.tsx`
```typescript
import { getDashboardMetrics } from '@/services/admin/dashboard/metrics';
import { getTopRegions } from '@/services/admin/dashboard/regions';
import { getDashboardAlerts } from '@/services/admin/dashboard/alerts';
import { KpiCard } from '@/components/admin/ui/KpiCard';
import { AlertBanner } from '@/components/admin/ui/AlertBanner';

export default async function AdminDashboardPage() {
  const metrics = await getDashboardMetrics(30);
  const topRegions = await getTopRegions(5);
  const alerts = await getDashboardAlerts();
  
  const now = new Date().toLocaleString('pt-BR');
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Cuide-me</h1>
        <p className="text-sm text-gray-500 mt-1">Última atualização: {now}</p>
      </div>
      
      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard
          title="Demanda (Famílias)"
          value={metrics.demanda.value}
          unit="famílias"
          status={metrics.demanda.status}
          dataSource="Firebase:jobs"
          subtitle="Últimos 30 dias"
        />
        
        <KpiCard
          title="Oferta (Cuidadores)"
          value={metrics.oferta.value}
          unit="cuidadores"
          status={metrics.oferta.status}
          dataSource="Firebase:jobs"
          subtitle="Últimos 30 dias"
        />
        
        <KpiCard
          title="Taxa de Match"
          value={metrics.taxaMatch.value.toFixed(1)}
          unit="%"
          status={metrics.taxaMatch.status}
          dataSource="Firebase:jobs"
          subtitle="Jobs com profissional atribuído"
        />
        
        <KpiCard
          title="GMV Mensal"
          value={`R$ ${(metrics.gmvMensal.value / 1000).toFixed(1)}k`}
          status={metrics.gmvMensal.status}
          dataSource="Stripe:charges"
          subtitle="Mês atual"
        />
        
        <KpiCard
          title="Ticket Médio"
          value={`R$ ${metrics.ticketMedio.value.toFixed(0)}`}
          dataSource="Stripe + Firebase"
          subtitle="Valor médio por job concluído"
        />
        
        <KpiCard
          title="Jobs Ativos"
          value={metrics.jobsAtivos.value}
          unit="jobs"
          dataSource="Firebase:jobs"
          subtitle="Em andamento ou aguardando"
        />
      </div>
      
      {/* Alertas */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Alertas Críticos</h2>
          <div className="space-y-3">
            {alerts.map(alert => (
              <AlertBanner
                key={alert.id}
                type={alert.type}
                title={alert.title}
                description={alert.description}
                action={alert.action}
                actionLabel={alert.actionLabel}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Top Regiões */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Regiões (Demanda)</h2>
        <div className="space-y-3">
          {topRegions.map((region, index) => (
            <div key={region.key} className="flex justify-between items-center">
              <div>
                <span className="text-gray-600 mr-2">{index + 1}.</span>
                <span className="font-medium text-gray-900">{region.label}</span>
              </div>
              <span className="text-gray-600">{region.jobs} jobs</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## 📦 FASE 3: MÓDULOS USUÁRIOS E JOBS (Dia 5-7)

### **Implementar:**
- [x] Tabela de Famílias
- [x] Tabela de Cuidadores
- [x] Tabela de Jobs
- [x] Detalhes individuais
- [x] Filtros
- [x] Normalização de status

---

## 📦 FASE 4: FUNIL E ALERTAS (Dia 8-9)

### **Implementar:**
- [x] Funil de conversão (7 estágios)
- [x] Dashboard de alertas consolidado
- [x] Categorização de alertas

---

## 📦 FASE 5: SERVICE DESK (Dia 10)

### **Implementar:**
- [x] Kanban de tickets
- [x] Criar/editar tickets
- [x] SLA monitoring

---

## ✅ CHECKLIST PRÉ-LAUNCH

### **Dados**
- [ ] Todas as métricas validadas manualmente no Firebase Console
- [ ] Status de jobs normalizados corretamente (PT/EN)
- [ ] Stripe integrado e testado
- [ ] GA4 métricas padrão funcionando
- [ ] Zero dados inventados

### **UX**
- [ ] Loading states em todas as páginas
- [ ] Empty states com CTAs claros
- [ ] Error boundaries implementados
- [ ] Responsivo (mobile, tablet, desktop)
- [ ] Navegação intuitiva

### **Performance**
- [ ] Cache implementado (60s TTL)
- [ ] Rate limiting configurado
- [ ] Lazy loading de imagens/componentes
- [ ] Build sem warnings

### **Segurança**
- [ ] Autenticação obrigatória
- [ ] RBAC (apenas admins)
- [ ] CSRF protection
- [ ] XSS sanitization

---

## 🚀 COMANDO DE DEPLOY

```bash
# Build de produção
npm run build

# Verificar erros
npm run typecheck

# Deploy Vercel
vercel --prod
```

---

**PRÓXIMO PASSO:** Revisar arquitetura e iniciar implementação?
