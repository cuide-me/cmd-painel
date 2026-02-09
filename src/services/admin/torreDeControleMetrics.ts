/**
 * ═══════════════════════════════════════════════════════
 * TORRE DE CONTROLE - CÁLCULO DE MÉTRICAS
 * ═══════════════════════════════════════════════════════
 * Fonte de dados: Firestore (jobs, payment_confirmations, transacoes, users)
 */

import { Timestamp, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getFirestore } from '@/lib/server/firebaseAdmin';
import { getRegionKey, type RegionData } from './region';
import type {
  TorreDeControleMetrics,
  KpiCard,
  AlertStatus,
  RegionBreakdown,
  AlertStatuses,
  TorreDeControleResponse,
} from './torreDeControleTypes';

/**
 * Calcula todas as métricas da Torre de Controle
 */
export async function calculateTorreDeControleMetrics(
  windowDays: number = 30,
  regionFilter?: string
): Promise<TorreDeControleResponse> {
  console.log('[TorreMetrics] Iniciando cálculo, window:', windowDays, 'region:', regionFilter);
  
  const db = getFirestore();
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
  
  try {
    // Buscar jobs na janela
    console.log('[TorreMetrics] Buscando jobs desde:', windowStart);
    const jobsSnapshot = await db
      .collection('jobs')
      .where('createdAt', '>=', Timestamp.fromDate(windowStart))
      .get();

    console.log('[TorreMetrics] Jobs encontrados:', jobsSnapshot.size);
    const jobs = jobsSnapshot.docs.map((doc: QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }));
    
    // Aplicar filtro de região se especificado
    const filteredJobs = regionFilter
      ? jobs.filter((job: any) => {
          const region = getRegionKey(job);
          return region.key === regionFilter;
        })
      : jobs;

    // Buscar payment_confirmations do mês atual
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    console.log('[TorreMetrics] Buscando payment_confirmations desde:', monthStart);
    const paymentsSnapshot = await db
      .collection('payment_confirmations')
      .where('confirmedAt', '>=', Timestamp.fromDate(monthStart))
      .get();

    // Filtrar apenas confirmed em memória (evita índice composto)
    const payments = paymentsSnapshot.docs
      .map((doc: QueryDocumentSnapshot) => doc.data())
      .filter((payment: any) => payment.businessStatus === 'confirmed');
    
    console.log('[TorreMetrics] Payments encontrados:', payments.length);

    // Buscar transações do mês
    const transacoesSnapshot = await db
      .collection('transacoes')
      .where('createdAt', '>=', Timestamp.fromDate(monthStart))
      .get();

    const transacoes = transacoesSnapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data());

    // Buscar users (famílias e cuidadores)
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map((doc: QueryDocumentSnapshot) => ({ uid: doc.id, ...doc.data() }));

    // Calcular KPIs
    const familiasAtivas = calculateFamiliasAtivas(filteredJobs);
    const cuidadoresAtivos = calculateCuidadoresAtivos(filteredJobs);
    const conversaoPedidoServico = calculateConversaoPedidoServico(filteredJobs);
    
    const taxaAceitacao = calculateTaxaAceitacao(filteredJobs);
    const cancelamentos = calculateCancelamentos(filteredJobs);
    const avaliacaoMedia = calculateAvaliacaoMedia(filteredJobs);
    
    const ativacaoFamilias = calculateAtivacaoFamilias(users, filteredJobs);
    const ativacaoCuidadoresPerfilCompleto = calculateAtivacaoCuidadoresPerfilCompleto(users);
    const ativacaoCuidadoresPrimeiroServico = calculateAtivacaoCuidadoresPrimeiroServico(users, filteredJobs);
    
    const gmvMensal = calculateGMVMensal(payments, transacoes);
    const ticketMedio = calculateTicketMedio(payments, filteredJobs);
    const receitaLiquida = calculateReceitaLiquida(transacoes, familiasAtivas);

    // Calcular top regiões
    const topRegions = calculateTopRegions(jobs, 10);

    // Calcular alertas
    const alertStatuses = calculateAlertStatuses(
      conversaoPedidoServico,
      taxaAceitacao,
      cancelamentos,
      filteredJobs
    );

    const kpis: TorreDeControleMetrics = {
      familiasAtivas,
      cuidadoresAtivos,
      conversaoPedidoServico,
      taxaAceitacao,
      cancelamentos,
      avaliacaoMedia,
      ativacaoFamilias,
      ativacaoCuidadoresPerfilCompleto,
      ativacaoCuidadoresPrimeiroServico,
      gmvMensal,
      ticketMedio,
      receitaLiquida,
      timestamp: now.toISOString(),
      window: windowDays,
      regionFilter,
    };

    return {
      kpis,
      topRegions,
      alertStatuses,
    };
  } catch (error) {
    console.error('[TorreMetrics] ERRO ao calcular métricas:', error);
    console.error('[TorreMetrics] Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('[TorreMetrics] Error name:', error instanceof Error ? error.name : 'Unknown');
    throw error;
  }
}

// ========== LIQUIDEZ ==========

function calculateFamiliasAtivas(jobs: any[]): KpiCard {
  const uniqueClients = new Set<string>();
  const regionMap = new Map<string, { count: number; data: RegionData }>();

  jobs.forEach(job => {
    const clientId = job.clientId || job.familyId;
    if (clientId) {
      uniqueClients.add(clientId);
      
      const region = getRegionKey(job);
      if (!regionMap.has(region.key)) {
        regionMap.set(region.key, { count: 0, data: region });
      }
      regionMap.get(region.key)!.count++;
    }
  });

  const breakdown: RegionBreakdown[] = Array.from(regionMap.entries())
    .map(([key, { count, data }]) => ({
      region: key,
      value: count,
      label: data.label,
      cidade: data.cidade,
      estado: data.estado,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return {
    id: 'familias-ativas',
    title: 'Famílias Ativas',
    value: uniqueClients.size,
    unit: 'famílias',
    breakdown,
  };
}

function calculateCuidadoresAtivos(jobs: any[]): KpiCard {
  const uniqueProfessionals = new Set<string>();
  const regionMap = new Map<string, { count: number; data: RegionData }>();

  jobs.forEach(job => {
    const professionalId = job.specialistId || job.professionalId;
    if (professionalId) {
      uniqueProfessionals.add(professionalId);
      
      const region = getRegionKey(job);
      if (!regionMap.has(region.key)) {
        regionMap.set(region.key, { count: 0, data: region });
      }
      regionMap.get(region.key)!.count++;
    }
  });

  const breakdown: RegionBreakdown[] = Array.from(regionMap.entries())
    .map(([key, { count, data }]) => ({
      region: key,
      value: count,
      label: data.label,
      cidade: data.cidade,
      estado: data.estado,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return {
    id: 'cuidadores-ativos',
    title: 'Cuidadores Ativos',
    value: uniqueProfessionals.size,
    unit: 'cuidadores',
    breakdown,
  };
}

function calculateConversaoPedidoServico(jobs: any[]): KpiCard {
  const totalPedidos = jobs.length;
  const servicosRealizados = jobs.filter(
    job => job.status === 'concluido' || job.status === 'completed' || job.attendanceRegistered === true
  ).length;

  const conversao = totalPedidos > 0 ? (servicosRealizados / totalPedidos) * 100 : 0;

  // Calcular tempo médio de match
  let totalMatchTime = 0;
  let matchCount = 0;

  jobs.forEach(job => {
    if (job.createdAt && job.proposal?.sentAt) {
      const created = toTimestamp(job.createdAt);
      const sent = toTimestamp(job.proposal.sentAt);
      if (created && sent) {
        const diff = sent.getTime() - created.getTime();
        if (diff > 0) {
          totalMatchTime += diff;
          matchCount++;
        }
      }
    } else if (job.createdAt && job.proposal?.clientDecisionAt) {
      const created = toTimestamp(job.createdAt);
      const decision = toTimestamp(job.proposal.clientDecisionAt);
      if (created && decision) {
        const diff = decision.getTime() - created.getTime();
        if (diff > 0) {
          totalMatchTime += diff;
          matchCount++;
        }
      }
    }
  });

  const avgMatchTimeHours = matchCount > 0 ? totalMatchTime / matchCount / (1000 * 60 * 60) : 0;

  // Determinar alerta baseado no tempo de match
  let status: AlertStatus = 'ok';
  if (avgMatchTimeHours > 48) {
    status = 'critico';
  } else if (avgMatchTimeHours > 24) {
    status = 'atencao';
  }

  return {
    id: 'conversao-pedido-servico',
    title: 'Conversão Pedido → Serviço',
    value: conversao.toFixed(1),
    unit: '%',
    status,
    subMetrics: [
      {
        label: 'Tempo médio de match',
        value: avgMatchTimeHours.toFixed(1),
        unit: 'horas',
      },
      {
        label: 'Pedidos criados',
        value: totalPedidos,
      },
      {
        label: 'Serviços realizados',
        value: servicosRealizados,
      },
    ],
  };
}

// ========== QUALIDADE ==========

function calculateTaxaAceitacao(jobs: any[]): KpiCard {
  const propostasEnviadas = jobs.filter(
    job => job.status === 'proposta_enviada' || job.proposal?.sentAt
  ).length;

  const propostasAceitas = jobs.filter(
    job => job.status === 'proposta_aceita' || job.proposal?.clientDecisionAt
  ).length;

  const taxa = propostasEnviadas > 0 ? (propostasAceitas / propostasEnviadas) * 100 : 0;

  let status: AlertStatus = 'ok';
  if (taxa < 50) {
    status = 'critico';
  } else if (taxa < 70) {
    status = 'atencao';
  }

  return {
    id: 'taxa-aceitacao',
    title: 'Taxa de Aceitação',
    value: taxa.toFixed(1),
    unit: '%',
    status,
    subMetrics: [
      {
        label: 'Propostas enviadas',
        value: propostasEnviadas,
      },
      {
        label: 'Propostas aceitas',
        value: propostasAceitas,
      },
    ],
  };
}

function calculateCancelamentos(jobs: any[]): KpiCard {
  const cancelados = jobs.filter((job: any) => job.status === 'cancelado' || job.status === 'cancelled');
  const totalJobs = jobs.length;
  
  const taxa = totalJobs > 0 ? (cancelados.length / totalJobs) * 100 : 0;

  const porCliente = cancelados.filter((job: any) => job.canceledBy === 'cliente').length;
  const porProfissional = cancelados.filter((job: any) => job.canceledBy === 'profissional').length;

  let status: AlertStatus = 'ok';
  if (taxa > 20) {
    status = 'critico';
  } else if (taxa > 10) {
    status = 'atencao';
  }

  return {
    id: 'cancelamentos',
    title: 'Taxa de Cancelamento',
    value: taxa.toFixed(1),
    unit: '%',
    status,
    subMetrics: [
      {
        label: 'Cancelados por cliente',
        value: porCliente,
      },
      {
        label: 'Cancelados por profissional',
        value: porProfissional,
      },
      {
        label: 'Total cancelado',
        value: cancelados.length,
      },
    ],
  };
}

function calculateAvaliacaoMedia(jobs: any[]): KpiCard {
  let totalRating = 0;
  let ratingCount = 0;

  jobs.forEach(job => {
    if (job.reviews?.client?.rating) {
      totalRating += job.reviews.client.rating;
      ratingCount++;
    }
  });

  const avgRating = ratingCount > 0 ? totalRating / ratingCount : 0;

  // Incidentes (se collection existir, caso contrário null)
  const servicosRealizados = jobs.filter(
    job => job.status === 'concluido' || job.status === 'completed'
  ).length;

  return {
    id: 'avaliacao-media',
    title: 'Avaliação Média',
    value: avgRating.toFixed(1),
    unit: '★',
    subMetrics: [
      {
        label: 'Total de avaliações',
        value: ratingCount,
      },
      {
        label: 'Incidentes por serviço',
        value: 'N/A',
        badge: 'não instrumentado',
      },
    ],
  };
}

// ========== ATIVAÇÃO ==========

function calculateAtivacaoFamilias(users: any[], jobs: any[]): KpiCard {
  const familias = users.filter((u: any) => u.perfil === 'cliente' || u.role === 'user');
  const familiasComPedido = new Set(jobs.map((j: any) => j.clientId || j.familyId).filter(Boolean));

  const taxa = familias.length > 0 ? (familiasComPedido.size / familias.length) * 100 : 0;

  // Calcular tempo médio cadastro → 1º pedido
  let totalTime = 0;
  let timeCount = 0;

  jobs.forEach(job => {
    const clientId = job.clientId || job.familyId;
    if (clientId) {
      const user = users.find(u => u.uid === clientId);
      if (user?.dataCadastro && job.createdAt) {
        const cadastro = toTimestamp(user.dataCadastro);
        const pedido = toTimestamp(job.createdAt);
        if (cadastro && pedido) {
          const diff = pedido.getTime() - cadastro.getTime();
          if (diff > 0) {
            totalTime += diff;
            timeCount++;
          }
        }
      }
    }
  });

  const avgTimeDays = timeCount > 0 ? totalTime / timeCount / (1000 * 60 * 60 * 24) : 0;

  return {
    id: 'ativacao-familias',
    title: 'Ativação de Famílias',
    value: taxa.toFixed(1),
    unit: '%',
    subMetrics: [
      {
        label: 'Tempo médio até 1º pedido',
        value: avgTimeDays > 0 ? avgTimeDays.toFixed(1) : 'N/A',
        unit: avgTimeDays > 0 ? 'dias' : undefined,
        badge: avgTimeDays === 0 ? 'não instrumentado' : undefined,
      },
      {
        label: 'Famílias cadastradas',
        value: familias.length,
      },
      {
        label: 'Famílias com pedido',
        value: familiasComPedido.size,
      },
    ],
  };
}

function calculateAtivacaoCuidadoresPerfilCompleto(users: any[]): KpiCard {
  const cuidadores = users.filter((u: any) => u.perfil === 'profissional' || u.role === 'professional');
  const perfilCompleto = cuidadores.filter((u: any) => u.porcentagemPerfil >= 100 || u.profileComplete === true);

  const taxa = cuidadores.length > 0 ? (perfilCompleto.length / cuidadores.length) * 100 : 0;

  return {
    id: 'ativacao-cuidadores-perfil',
    title: 'Cuidadores com Perfil Completo',
    value: taxa.toFixed(1),
    unit: '%',
    subMetrics: [
      {
        label: 'Cuidadores cadastrados',
        value: cuidadores.length,
      },
      {
        label: 'Perfis completos',
        value: perfilCompleto.length,
      },
    ],
  };
}

function calculateAtivacaoCuidadoresPrimeiroServico(users: any[], jobs: any[]): KpiCard {
  const cuidadores = users.filter((u: any) => u.perfil === 'profissional' || u.role === 'professional');
  const perfilCompleto = cuidadores.filter((u: any) => u.porcentagemPerfil >= 100 || u.profileComplete === true);
  
  const cuidadoresComServico = new Set(
    jobs
      .filter((j: any) => j.status === 'proposta_aceita' || j.status === 'accepted')
      .map(j => j.specialistId || j.professionalId)
      .filter(Boolean)
  );

  const cuidadoresPerfilCompletoComServico = perfilCompleto.filter((c: any) => cuidadoresComServico.has(c.uid));

  const taxa = perfilCompleto.length > 0 
    ? (cuidadoresPerfilCompletoComServico.length / perfilCompleto.length) * 100 
    : 0;

  // Tempo até primeiro serviço
  let totalTime = 0;
  let timeCount = 0;

  jobs.forEach(job => {
    const professionalId = job.specialistId || job.professionalId;
    if (professionalId && (job.status === 'proposta_aceita' || job.status === 'accepted')) {
      const user = users.find(u => u.uid === professionalId);
      if (user?.dataCadastro && job.createdAt) {
        const cadastro = toTimestamp(user.dataCadastro);
        const servico = toTimestamp(job.createdAt);
        if (cadastro && servico) {
          const diff = servico.getTime() - cadastro.getTime();
          if (diff > 0) {
            totalTime += diff;
            timeCount++;
          }
        }
      }
    }
  });

  const avgTimeDays = timeCount > 0 ? totalTime / timeCount / (1000 * 60 * 60 * 24) : 0;

  return {
    id: 'ativacao-cuidadores-servico',
    title: 'Perfil 100% → 1º Serviço',
    value: taxa.toFixed(1),
    unit: '%',
    subMetrics: [
      {
        label: 'Tempo médio até 1º serviço',
        value: avgTimeDays > 0 ? avgTimeDays.toFixed(1) : 'N/A',
        unit: avgTimeDays > 0 ? 'dias' : undefined,
      },
      {
        label: 'Perfis completos',
        value: perfilCompleto.length,
      },
      {
        label: 'Com serviço aceito',
        value: cuidadoresPerfilCompletoComServico.length,
      },
    ],
  };
}

// ========== FINANCEIRO ==========

function calculateGMVMensal(payments: any[], transacoes: any[]): KpiCard {
  let gmv = 0;

  // Preferir transações
  if (transacoes.length > 0) {
    transacoes.forEach(t => {
      gmv += t.valorTotal || t.valueTotal || t.amount || 0;
    });
  } else {
    // Fallback: payment_confirmations
    payments.forEach(p => {
      gmv += p.amount || 0;
    });
  }

  // Sub-métricas adicionais
  const now = new Date();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  return {
    id: 'gmv-mensal',
    title: 'GMV Mensal (MTD)',
    value: `R$ ${(gmv / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    subMetrics: [
      {
        label: 'Transações processadas',
        value: transacoes.length || payments.length,
      },
    ],
  };
}

function calculateTicketMedio(payments: any[], jobs: any[]): KpiCard {
  const servicosRealizados = jobs.filter(
    job => job.status === 'concluido' || job.status === 'completed'
  ).length;

  let totalAmount = 0;
  payments.forEach(p => {
    totalAmount += p.amount || 0;
  });

  const ticketMedio = servicosRealizados > 0 ? totalAmount / servicosRealizados : 0;

  return {
    id: 'ticket-medio',
    title: 'Ticket Médio por Serviço',
    value: `R$ ${(ticketMedio / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    subMetrics: [
      {
        label: 'Serviços realizados',
        value: servicosRealizados,
      },
      {
        label: 'Total processado',
        value: `R$ ${(totalAmount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      },
    ],
  };
}

function calculateReceitaLiquida(transacoes: any[], familiasAtivasCard: KpiCard): KpiCard {
  let receitaLiquida = 0;
  let hasBreakdown = false;

  // Verificar se transações têm breakdown de fee
  transacoes.forEach(t => {
    if (t.fee || t.breakdown?.fee) {
      receitaLiquida += t.fee || t.breakdown.fee || 0;
      hasBreakdown = true;
    }
  });

  const familiasAtivas = typeof familiasAtivasCard.value === 'number' ? familiasAtivasCard.value : 0;
  const receitaPorFamilia = familiasAtivas > 0 ? receitaLiquida / familiasAtivas : 0;

  return {
    id: 'receita-liquida',
    title: 'Receita Líquida',
    value: hasBreakdown 
      ? `R$ ${(receitaLiquida / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      : 'N/A',
    subMetrics: [
      {
        label: 'Receita média por família',
        value: hasBreakdown 
          ? `R$ ${(receitaPorFamilia / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
          : 'N/A',
        badge: hasBreakdown ? undefined : 'não instrumentado',
      },
      {
        label: 'Famílias ativas',
        value: familiasAtivas,
      },
    ],
  };
}

// ========== HELPERS ==========

function calculateTopRegions(jobs: any[], limit: number): RegionBreakdown[] {
  const regionMap = new Map<string, { count: number; data: RegionData }>();

  jobs.forEach(job => {
    const region = getRegionKey(job);
    if (!regionMap.has(region.key)) {
      regionMap.set(region.key, { count: 0, data: region });
    }
    regionMap.get(region.key)!.count++;
  });

  return Array.from(regionMap.entries())
    .map(([key, { count, data }]) => ({
      region: key,
      value: count,
      label: data.label,
      cidade: data.cidade,
      estado: data.estado,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

function calculateAlertStatuses(
  conversao: KpiCard,
  aceitacao: KpiCard,
  cancelamento: KpiCard,
  jobs: any[]
): AlertStatuses {
  // Recorrência: % de famílias que fizeram 2+ pedidos em 30d
  const clientMap = new Map<string, number>();
  jobs.forEach(job => {
    const clientId = job.clientId || job.familyId;
    if (clientId) {
      clientMap.set(clientId, (clientMap.get(clientId) || 0) + 1);
    }
  });

  const totalClients = clientMap.size;
  const recorrentes = Array.from(clientMap.values()).filter((count: number) => count >= 2).length;
  const taxaRecorrencia = totalClients > 0 ? (recorrentes / totalClients) * 100 : 0;

  let recorrenciaStatus: AlertStatus = 'ok';
  if (taxaRecorrencia < 20) {
    recorrenciaStatus = 'critico';
  } else if (taxaRecorrencia < 40) {
    recorrenciaStatus = 'atencao';
  }

  return {
    tempoMatch: conversao.status || 'ok',
    aceitacao: aceitacao.status || 'ok',
    cancelamento: cancelamento.status || 'ok',
    recorrencia: recorrenciaStatus,
  };
}

function toTimestamp(value: any): Date | null {
  if (!value) return null;
  
  if (value instanceof Date) return value;
  
  if (value.toDate && typeof value.toDate === 'function') {
    return value.toDate();
  }
  
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }
  
  return null;
}
