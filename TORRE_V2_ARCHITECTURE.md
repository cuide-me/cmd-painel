# 🏗️ Torre de Controle V2 - Arquitetura & Design

## 📊 Visão Geral

A **Torre de Controle V2** foi redesenhada com foco em **clareza visual, hierarquia de informação e decisões orientadas a dados**.

### Objetivo
Permitir que executivos entendam a saúde da plataforma em **< 30 segundos** e tomem decisões imediatas.

---

## 🎨 Design Principles

### 1. Information Hierarchy
```
┌─────────────────────────────────────┐
│ 1. Health Score Banner              │ ← Saúde geral da plataforma
├─────────────────────────────────────┤
│ 2. Hero KPIs (Top 3)                │ ← Métricas mais críticas
├─────────────────────────────────────┤
│ 3. Secondary KPIs                   │ ← Métricas de suporte
├─────────────────────────────────────┤
│ 4. Critical Alerts                  │ ← Ações urgentes
├─────────────────────────────────────┤
│ 5. Quick Actions (Modules)          │ ← Navegação rápida
└─────────────────────────────────────┘
```

### 2. Visual Language

**Status Colors:**
- 🟢 **Green (Healthy)**: 75-100% health score
- 🟡 **Yellow (Warning)**: 50-74% health score
- 🔴 **Red (Critical)**: < 50% health score

**Trends:**
- ↗️ **Up**: Positive or growth trend
- ↘️ **Down**: Negative or decline trend
- →  **Stable**: No significant change

**Alert Severity:**
- ℹ️ **Low**: Informational
- ⚡ **Medium**: Attention needed
- ⚠️ **High**: Urgent action
- 🚨 **Critical**: Immediate intervention

### 3. Component Structure

```tsx
TorreControle (Main Page)
├── HealthScoreBanner
│   ├── Overall platform health (0-100%)
│   ├── Status label (Operação Normal / Atenção / Crítica)
│   └── Critical alerts count
│
├── Hero KPIs (Top 3 metrics)
│   ├── Large cards with status indicators
│   ├── Trend arrows
│   └── Actionable tooltips
│
├── Secondary KPIs (Remaining metrics)
│   ├── Compact cards
│   ├── Quick status check
│   └── Trends
│
├── Critical Alerts
│   ├── High/Critical severity only
│   ├── Count + action
│   └── Module reference
│
└── Quick Actions Grid
    └── Module navigation cards
```

---

## 🔧 Technical Architecture

### Data Flow

```
┌──────────────┐
│ Frontend     │
│ (page.tsx)   │
└──────┬───────┘
       │
       │ fetch('/api/admin/torre/overview')
       ▼
┌──────────────────────┐
│ API Route            │
│ /api/admin/torre/    │
│ overview/route.ts    │
└──────┬───────────────┘
       │
       │ Promise.all([
       │   getExecutiveKpis(),
       │   getExecutiveTrends(),
       │   getExecutiveAlerts()
       │ ])
       ▼
┌─────────────────────────────┐
│ Services                    │
│ - overview/kpis.ts          │
│ - overview/trends.ts        │
│ - overview/alerts.ts        │
└─────────────┬───────────────┘
              │
              │ Aggregates from:
              │ - users/
              │ - finance/
              │ - pipeline/
              ▼
┌─────────────────────────────┐
│ Data Sources                │
│ - Firestore                 │
│ - Stripe                    │
└─────────────────────────────┘
```

### Performance Optimizations

1. **Optimistic UI**
   - Show cached data immediately
   - Background refresh every 2 minutes
   - Loading states only on initial load

2. **Data Transformation**
   - Map API data to typed interfaces on frontend
   - Normalize status values
   - Compute derived metrics (health score)

3. **Memoization**
   - `useMemo` for computed values (health score, critical alerts)
   - Avoid unnecessary re-renders

4. **Code Splitting**
   - Sub-components in same file (optimized for this use case)
   - Could be split later if needed

---

## 📐 Layout & Responsiveness

### Breakpoints

- **Mobile** (< 768px):
  - Single column layout
  - Stacked KPIs
  - 2-column quick actions

- **Tablet** (768px - 1024px):
  - 2-column layouts
  - 3 hero KPIs per row
  - 3-column quick actions

- **Desktop** (> 1024px):
  - 3-column hero KPIs
  - 3-column secondary KPIs
  - 6-column quick actions (full grid)

### Grid System

```css
/* Hero KPIs */
grid-cols-1 md:grid-cols-3

/* Secondary KPIs */
grid-cols-1 md:grid-cols-2 lg:grid-cols-3

/* Critical Alerts */
grid-cols-1 md:grid-cols-2 lg:grid-cols-3

/* Quick Actions */
grid-cols-2 md:grid-cols-3 lg:grid-cols-6
```

---

## 🎯 Decision-Oriented Features

### Health Score Calculation

```typescript
const healthyCount = kpis.filter(k => k.status === 'healthy').length;
const score = (healthyCount / totalKpis) * 100;

if (score < 50) → Critical (Atenção Crítica)
if (score < 75) → Warning (Atenção Necessária)
else           → Healthy (Operação Normal)
```

### KPI Hierarchy Logic

**Hero KPIs** (First 3):
1. Famílias ativas (30d) → Demand health
2. Cuidadores ativos (perfil 100%) → Supply health
3. Solicitações abertas → Current bottleneck

**Secondary KPIs**:
4. Contratações (7d / 30d) → Conversion success
5. Tempo médio até match → Efficiency
6. Abandono pós-aceite → Payment/UX friction

### Alert Prioritization

Only **high** and **critical** severity alerts appear in the Critical Alerts section.

**Critical Severity Examples:**
- Pedidos sem proposta > 24h
- Taxa de abandono > 35%
- Pagamentos falhados > 15%

**High Severity Examples:**
- Pedidos sem proposta 12-24h
- Taxa de abandono 20-35%
- Pagamentos falhados 10-15%

---

## 🚀 Future Enhancements

### Phase 2 (Data Visualization)
- [ ] Sparkline charts in KPI cards
- [ ] Historical trend comparison (vs. last week/month)
- [ ] Interactive drill-down on KPIs

### Phase 3 (Real-time)
- [ ] WebSocket integration for live updates
- [ ] Real-time alerts with notifications
- [ ] Live activity feed

### Phase 4 (Intelligence)
- [ ] AI-powered insights and recommendations
- [ ] Anomaly detection
- [ ] Predictive analytics

### Phase 5 (Customization)
- [ ] Customizable dashboard layouts
- [ ] KPI favorites and pinning
- [ ] User-specific views (CEO vs. Ops)

---

## 📱 Accessibility

- **Keyboard Navigation**: All interactive elements accessible via tab
- **Color Contrast**: WCAG AA compliant
- **Screen Readers**: Semantic HTML with ARIA labels
- **Touch Targets**: Minimum 44x44px on mobile

---

## 🔍 Monitoring & Observability

### Frontend Metrics
- Page load time (target: < 2s)
- API response time (target: < 500ms)
- Error rate (target: < 0.1%)

### Backend Metrics
- Service response time per KPI
- Cache hit rate
- Database query performance

### User Metrics
- Time to first interaction
- Average session duration
- Module navigation patterns

---

## 📚 Component API

### HeroKpiCard

```typescript
interface Kpi {
  id: string;
  label: string;
  value: number | string;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  tooltip: string;
  suffix?: string; // '%', 'h', etc.
}

<HeroKpiCard kpi={kpi} />
```

### AlertCardModern

```typescript
interface Alert {
  id: string;
  label: string;
  count: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: string;
  module?: string;
}

<AlertCardModern alert={alert} />
```

### HealthScoreBanner

```typescript
interface Health {
  score: number; // 0-100
  status: 'healthy' | 'warning' | 'critical';
  label: string; // User-facing label
}

<HealthScoreBanner 
  health={health} 
  criticalAlertsCount={number} 
/>
```

---

## ✅ Quality Checklist

### Before Deployment
- [x] TypeScript: No type errors
- [x] Responsive: Mobile/tablet/desktop tested
- [x] Performance: Lighthouse score > 90
- [ ] Accessibility: WAVE scan passed
- [ ] Cross-browser: Chrome, Firefox, Safari, Edge
- [ ] Error handling: Network failures gracefully handled
- [ ] Loading states: Skeleton/spinner on initial load
- [ ] Documentation: This file + inline comments

---

## 🎨 Design System

### Typography
```typescript
h1: text-2xl font-bold // Header title
h2: text-lg font-semibold // Section headers
body: text-sm font-medium // Labels
small: text-xs // Supporting text
```

### Colors
```typescript
// Backgrounds
bg-gradient-to-br from-slate-50 to-slate-100 // Page
bg-white // Cards
bg-slate-900 // Primary CTA

// Status
bg-green-50 border-green-300 text-green-700 // Healthy
bg-yellow-50 border-yellow-300 text-yellow-700 // Warning
bg-red-50 border-red-300 text-red-700 // Critical

// Accents
from-blue-600 to-purple-600 // Gradient logo
```

### Spacing
```typescript
gap-4 // Small gaps (16px)
gap-6 // Medium gaps (24px)
px-6 py-4 // Card padding
mb-8 // Section margin
```

---

## 💡 Pro Tips

1. **Keep KPIs < 8**: More than 8 KPIs dilutes focus
2. **Update tooltips regularly**: They drive decisions
3. **Monitor health score trends**: Is it improving?
4. **Alert fatigue**: Too many alerts → ignored alerts
5. **Test with real data**: Mockups hide edge cases

---

**Version**: 2.0.0  
**Last Updated**: 2025-12-15  
**Author**: Tech Lead + PM + Data Analyst collaborative design
