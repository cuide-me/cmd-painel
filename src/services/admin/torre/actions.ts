/**
 * Torre - Urgent Actions Generator
 * Analyzes all blocks and generates prioritized action items
 * Read-only, no writes
 */

import type { UrgentAction, TorreHomeData } from './types';

export function generateUrgentActions(data: TorreHomeData): UrgentAction[] {
  const actions: UrgentAction[] = [];

  // DEMANDA: SLA em risco
  if (data.demanda.slaRisco.percentage > 20) {
    actions.push({
      id: 'demanda-sla-risk',
      priority: 'critical',
      title: 'SLA Crítico: Solicitações sem Match',
      description: `${data.demanda.slaRisco.count} solicitações estão há mais de 48h sem match (${data.demanda.slaRisco.percentage.toFixed(1)}%)`,
      impact: 'Alto risco de cancelamento e insatisfação',
      action: 'Revisar solicitações e alocar profissionais urgentemente',
      module: 'demanda'
    });
  }

  // DEMANDA: Tempo médio alto
  if (data.demanda.tempoMedioMatch.hours > 12) {
    actions.push({
      id: 'demanda-slow-match',
      priority: 'high',
      title: 'Tempo de Match Elevado',
      description: `Tempo médio de ${data.demanda.tempoMedioMatch.hours.toFixed(1)}h para encontrar profissional`,
      impact: 'Reduz conversão e satisfação do cliente',
      action: 'Aumentar oferta de profissionais ou melhorar algoritmo de match',
      module: 'demanda'
    });
  }

  // OFERTA: Abandono pós-aceite
  if (data.oferta.abandonoPosAceite.percentage > 10) {
    actions.push({
      id: 'oferta-abandonment',
      priority: 'critical',
      title: 'Alto Abandono Pós-Aceite',
      description: `${data.oferta.abandonoPosAceite.percentage.toFixed(1)}% dos profissionais abandonam após aceitar (${data.oferta.abandonoPosAceite.count} casos)`,
      impact: 'Cliente já esperando e profissional desiste - péssima experiência',
      action: 'Revisar processo de aceite e penalidades para abandono',
      module: 'oferta'
    });
  }

  // OFERTA: Profissionais inativos
  if (data.oferta.profissionaisInativos30d.percentage > 30) {
    actions.push({
      id: 'oferta-inactive-professionals',
      priority: 'high',
      title: 'Muitos Profissionais Inativos',
      description: `${data.oferta.profissionaisInativos30d.percentage.toFixed(1)}% dos profissionais estão inativos há 30+ dias`,
      impact: 'Reduz oferta real disponível no marketplace',
      action: 'Campanha de reativação ou limpeza de base',
      module: 'oferta'
    });
  }

  // CORE: NPS baixo
  if (data.coreMVP.nps.category === 'ruim' || data.coreMVP.nps.category === 'razoavel') {
    actions.push({
      id: 'core-low-nps',
      priority: 'high',
      title: 'NPS Abaixo do Esperado',
      description: `NPS atual: ${data.coreMVP.nps.score} (${data.coreMVP.nps.category})`,
      impact: 'Clientes insatisfeitos não recomendam o serviço',
      action: 'Analisar feedbacks negativos e implementar melhorias',
      module: 'core'
    });
  }

  // FINANCEIRO: Churn alto
  if (data.financeiro.churnRate.percentage > 5) {
    actions.push({
      id: 'financeiro-high-churn',
      priority: 'critical',
      title: 'Taxa de Churn Elevada',
      description: `${data.financeiro.churnRate.percentage.toFixed(1)}% de churn (${data.financeiro.churnRate.count} cancelamentos)`,
      impact: 'Perda de receita recorrente e custo de aquisição desperdiçado',
      action: 'CS urgente com clientes em risco e análise de motivos de cancelamento',
      module: 'financeiro'
    });
  }

  // CONFIANÇA: Tickets críticos
  if (data.confianca.ticketsAbertos.criticos > 5) {
    actions.push({
      id: 'confianca-critical-tickets',
      priority: 'critical',
      title: 'Tickets Críticos Acumulados',
      description: `${data.confianca.ticketsAbertos.criticos} tickets de alta prioridade aguardando atendimento`,
      impact: 'Problemas graves não resolvidos afetam usuários',
      action: 'Priorizar atendimento de tickets críticos',
      module: 'confianca'
    });
  }

  // CONFIANÇA: SLA baixo
  if (data.confianca.ticketsAbertos.sla24h < 70) {
    actions.push({
      id: 'confianca-sla-breach',
      priority: 'high',
      title: 'SLA de Tickets Abaixo da Meta',
      description: `Apenas ${data.confianca.ticketsAbertos.sla24h.toFixed(1)}% dos tickets dentro do SLA de 24h`,
      impact: 'Usuários aguardando muito tempo por suporte',
      action: 'Aumentar capacidade de atendimento ou melhorar processos',
      module: 'confianca'
    });
  }

  // Ordenar por prioridade
  return actions.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}
