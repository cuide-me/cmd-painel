'use client';

/**
 * Torre de Controle - Main Dashboard
 * Landing page for admin panel
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { authFetch } from '@/lib/client/authFetch';
import AdminLayout, { StatCard, Section, Card, Badge, EmptyState, LoadingSkeleton } from '@/components/admin/AdminLayout';

interface ModuleCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
  status: 'active' | 'new' | 'beta';
  metrics?: {
    label: string;
    value: string | number;
  }[];
}

const MODULES: ModuleCard[] = [
  {
    id: 'operational',
    title: 'Saúde Operacional',
    description: 'Profissionais, Famílias e Matches',
    icon: '🏥',
    path: '/admin/operational-health',
    status: 'active'
  },
  {
    id: 'alerts',
    title: 'Central de Alertas',
    description: 'SLA, Priorização e Ações',
    icon: '🚨',
    path: '/admin/alerts',
    status: 'active'
  },
  {
    id: 'growth',
    title: 'Growth & Ativação',
    description: 'AARRR Framework',
    icon: '📈',
    path: '/admin/growth',
    status: 'active'
  },
  {
    id: 'financeiro',
    title: 'Financeiro V2',
    description: 'MRR, LTV, Churn, Forecast',
    icon: '💰',
    path: '/admin/financeiro-v2',
    status: 'active'
  },
  {
    id: 'pipeline',
    title: 'Pipeline V2',
    description: 'Velocity, Conversão, Forecast',
    icon: '🎯',
    path: '/admin/pipeline',
    status: 'active'
  },
  {
    id: 'reports',
    title: 'Reports Automatizados',
    description: 'Agendamento e Exports',
    icon: '📊',
    path: '/admin/reports',
    status: 'new'
  },
  {
    id: 'dashboard',
    title: 'Dashboard V2',
    description: 'Visão integrada completa',
    icon: '📱',
    path: '/admin/dashboard',
    status: 'active'
  },
  {
    id: 'users',
    title: 'Usuários',
    description: 'Gestão de acessos',
    icon: '👥',
    path: '/admin/users',
    status: 'active'
  }
];

export default function TorreControlePage() {
  const router = useRouter();
  const { authReady } = useFirebaseAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeAlerts: 0,
    mrr: 0,
    healthScore: 0
  });

  useEffect(() => {
    if (!authReady) return;
    
    // Simulate loading stats
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, [authReady]);

  if (loading) {
    return (
      <AdminLayout title="Torre de Controle" subtitle="Cuide-me" icon="🗼">
        <LoadingSkeleton lines={4} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Torre de Controle" subtitle="Cuide-me" icon="🗼">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Health Score"
          value="82/100"
          icon="💚"
          trend="up"
          change={5.2}
        />
        <StatCard
          label="Alertas Ativos"
          value="12"
          icon="🚨"
          trend="down"
          change={-8.3}
        />
        <StatCard
          label="MRR"
          value="R$ 142k"
          icon="💰"
          trend="up"
          change={12.5}
        />
        <StatCard
          label="Usuários Ativos"
          value="1,847"
          icon="👥"
          trend="up"
          change={3.7}
        />
      </div>

      {/* Modules Grid */}
      <Section title="Módulos Disponíveis">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {MODULES.map((module) => (
            <Card
              key={module.id}
              className="cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all group"
              padding="md"
              onClick={() => router.push(module.path)}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl group-hover:scale-110 transition-transform">
                  {module.icon}
                </span>
                {module.status === 'new' && <Badge variant="info">Novo</Badge>}
                {module.status === 'beta' && <Badge variant="warning">Beta</Badge>}
              </div>
              
              <h3 className="font-semibold text-slate-900 mb-1 text-sm">
                {module.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {module.description}
              </p>

              {module.metrics && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                  {module.metrics.map((metric, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-slate-600">{metric.label}</span>
                      <span className="font-semibold text-slate-900">{metric.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      </Section>

      {/* Quick Actions */}
      <Section title="Ações Rápidas">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" padding="md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-xl">
                📄
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Gerar Report</p>
                <p className="text-xs text-slate-600">Exportar dados atuais</p>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" padding="md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-xl">
                ✅
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Resolver Alertas</p>
                <p className="text-xs text-slate-600">12 pendentes</p>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" padding="md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-xl">
                ⚙️
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Configurações</p>
                <p className="text-xs text-slate-600">Ajustar preferências</p>
              </div>
            </div>
          </Card>
        </div>
      </Section>

      {/* System Status */}
      <Card padding="md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <div>
              <p className="text-sm font-medium text-slate-900">Sistema Operacional</p>
              <p className="text-xs text-slate-600">Última atualização: há 2 minutos</p>
            </div>
          </div>
          <Badge variant="success">Online</Badge>
        </div>
      </Card>
    </AdminLayout>
  );
}
