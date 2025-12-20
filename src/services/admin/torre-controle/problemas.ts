/**
 * ═══════════════════════════════════════════════════════
 * TOP 5 PROBLEMAS ATIVOS
 * ═══════════════════════════════════════════════════════
 * Quick Win #3: Identificar e priorizar problemas críticos
 */

import { getFirestore } from 'firebase-admin/firestore';
import type { ProblemaAtivo } from './types';

/**
 * Identifica os 5 problemas mais críticos do momento
 */
export async function getTop5Problemas(): Promise<ProblemaAtivo[]> {
  const db = getFirestore();
  const problemas: ProblemaAtivo[] = [];

  try {
    // 1. GARGALOS: Regiões com baixa cobertura
    const gargalosCobertura = await identificarGargalosCobertura(db);
    problemas.push(...gargalosCobertura);

    // 2. ESPECIALIDADES: Gaps de oferta vs demanda
    const gapsEspecialidades = await identificarGapsEspecialidades(db);
    problemas.push(...gapsEspecialidades);

    // 3. QUALIDADE: Jobs com baixo rating
    const problemasQualidade = await identificarProblemasQualidade(db);
    problemas.push(...problemasQualidade);

    // 4. OPERACIONAL: Tickets críticos não resolvidos
    const problemasOperacionais = await identificarProblemasOperacionais(db);
    problemas.push(...problemasOperacionais);

    // 5. FINANCEIRO: Churn ou inadimplência
    const problemasFinanceiros = await identificarProblemasFinanceiros(db);
    problemas.push(...problemasFinanceiros);

    // Ordenar por severidade (crítica > alta > média > baixa)
    const severidadeOrdem = { critica: 4, alta: 3, media: 2, baixa: 1 };
    problemas.sort((a, b) => 
      severidadeOrdem[b.severidade] - severidadeOrdem[a.severidade]
    );

    // Retornar apenas os top 5
    return problemas.slice(0, 5);

  } catch (error) {
    console.error('[Top5Problemas] Erro ao identificar problemas:', error);
    return [];
  }
}

/**
 * Identifica regiões com demanda > oferta
 */
async function identificarGargalosCobertura(db: FirebaseFirestore.Firestore): Promise<ProblemaAtivo[]> {
  const problemas: ProblemaAtivo[] = [];

  try {
    // Buscar jobs por região
    const jobsSnap = await db.collection('jobs').get();
    const demandaPorRegiao: Record<string, number> = {};

    jobsSnap.forEach(doc => {
      const data = doc.data();
      const regiao = data.regiao || 'Não especificada';
      demandaPorRegiao[regiao] = (demandaPorRegiao[regiao] || 0) + 1;
    });

    // Buscar cuidadores por região
    const cuidadoresSnap = await db
      .collection('users')
      .where('perfil', '==', 'profissional')
      .get();
    
    const ofertaPorRegiao: Record<string, number> = {};

    cuidadoresSnap.forEach(doc => {
      const data = doc.data();
      const regiao = data.regiao || 'Não especificada';
      ofertaPorRegiao[regiao] = (ofertaPorRegiao[regiao] || 0) + 1;
    });

    // Identificar gaps
    for (const [regiao, demanda] of Object.entries(demandaPorRegiao)) {
      const oferta = ofertaPorRegiao[regiao] || 0;
      const gap = demanda - oferta;

      if (gap > 5) { // Se gap > 5 jobs
        problemas.push({
          id: `cobertura-${regiao}`,
          tipo: 'cobertura',
          titulo: `Baixa cobertura em ${regiao}`,
          descricao: `${demanda} jobs ativos, apenas ${oferta} cuidadores disponíveis (gap de ${gap})`,
          severidade: gap > 20 ? 'critica' : gap > 10 ? 'alta' : 'media',
          impacto: {
            receita: gap * 2500, // Estimativa: R$ 2.5k por job perdido
            usuarios: gap,
          },
          acoesSugeridas: [
            `Recrutar ${gap} cuidadores em ${regiao}`,
            'Ativar campanha de indicação na região',
            'Considerar incentivos temporários',
          ],
        });
      }
    }
  } catch (error) {
    console.error('[Gargalos] Erro:', error);
  }

  return problemas;
}

/**
 * Identifica especialidades com gap de oferta
 */
async function identificarGapsEspecialidades(db: FirebaseFirestore.Firestore): Promise<ProblemaAtivo[]> {
  const problemas: ProblemaAtivo[] = [];

  try {
    // Buscar jobs por especialidade
    const jobsSnap = await db.collection('jobs').get();
    const demandaPorEspecialidade: Record<string, number> = {};

    jobsSnap.forEach(doc => {
      const data = doc.data();
      const especialidade = data.especialidade || 'Geral';
      demandaPorEspecialidade[especialidade] = (demandaPorEspecialidade[especialidade] || 0) + 1;
    });

    // Buscar cuidadores por especialidade
    const cuidadoresSnap = await db
      .collection('users')
      .where('perfil', '==', 'profissional')
      .get();
    
    const ofertaPorEspecialidade: Record<string, number> = {};

    cuidadoresSnap.forEach(doc => {
      const data = doc.data();
      const especialidades = data.especialidades || ['Geral'];
      especialidades.forEach((esp: string) => {
        ofertaPorEspecialidade[esp] = (ofertaPorEspecialidade[esp] || 0) + 1;
      });
    });

    // Identificar gaps
    for (const [especialidade, demanda] of Object.entries(demandaPorEspecialidade)) {
      const oferta = ofertaPorEspecialidade[especialidade] || 0;
      const gap = demanda - oferta;

      if (gap > 3) {
        problemas.push({
          id: `especialidade-${especialidade}`,
          tipo: 'especialidade',
          titulo: `Gap em ${especialidade}`,
          descricao: `${demanda} jobs, apenas ${oferta} cuidadores com essa especialidade`,
          severidade: gap > 10 ? 'critica' : gap > 5 ? 'alta' : 'media',
          impacto: {
            receita: gap * 2500,
            usuarios: gap,
          },
          acoesSugeridas: [
            `Recrutar profissionais com especialidade em ${especialidade}`,
            'Oferecer treinamentos para cuidadores existentes',
            'Ajustar pricing para atrair especialistas',
          ],
        });
      }
    }
  } catch (error) {
    console.error('[Especialidades] Erro:', error);
  }

  return problemas;
}

/**
 * Identifica jobs com baixo rating ou reclamações
 */
async function identificarProblemasQualidade(db: FirebaseFirestore.Firestore): Promise<ProblemaAtivo[]> {
  const problemas: ProblemaAtivo[] = [];

  try {
    // Buscar jobs completados com rating baixo
    const jobsBaixoRating = await db
      .collection('jobs')
      .where('status', '==', 'completed')
      .get();

    let countBaixoRating = 0;

    jobsBaixoRating.forEach(doc => {
      const data = doc.data();
      if (data.rating && data.rating < 3) {
        countBaixoRating++;
      }
    });

    if (countBaixoRating > 5) {
      problemas.push({
        id: 'qualidade-rating',
        tipo: 'qualidade',
        titulo: 'Jobs com rating baixo',
        descricao: `${countBaixoRating} jobs completados com rating < 3.0`,
        severidade: countBaixoRating > 20 ? 'critica' : countBaixoRating > 10 ? 'alta' : 'media',
        impacto: {
          nps: -countBaixoRating,
          usuarios: countBaixoRating,
        },
        acoesSugeridas: [
          'Investigar causas de insatisfação',
          'Implementar follow-up pós-job',
          'Revisar processo de match',
          'Treinamento de qualidade para cuidadores',
        ],
      });
    }
  } catch (error) {
    console.error('[Qualidade] Erro:', error);
  }

  return problemas;
}

/**
 * Identifica tickets críticos não resolvidos
 */
async function identificarProblemasOperacionais(db: FirebaseFirestore.Firestore): Promise<ProblemaAtivo[]> {
  const problemas: ProblemaAtivo[] = [];

  try {
    // Buscar tickets críticos abertos
    const ticketsSnap = await db
      .collection('tickets')
      .where('status', '==', 'aberto')
      .where('tipo', '==', 'RECLAMAÇÃO')
      .get();

    const ticketsCriticos = ticketsSnap.size;

    if (ticketsCriticos > 5) {
      problemas.push({
        id: 'operacional-tickets',
        tipo: 'operacional',
        titulo: 'Tickets críticos não resolvidos',
        descricao: `${ticketsCriticos} reclamações abertas aguardando resolução`,
        severidade: ticketsCriticos > 15 ? 'critica' : ticketsCriticos > 10 ? 'alta' : 'media',
        impacto: {
          usuarios: ticketsCriticos,
          nps: -ticketsCriticos * 2,
        },
        acoesSugeridas: [
          'Priorizar resolução de tickets críticos',
          'Aumentar capacidade do time de suporte',
          'Implementar SLA de resposta',
        ],
      });
    }
  } catch (error) {
    console.error('[Operacional] Erro:', error);
  }

  return problemas;
}

/**
 * Identifica problemas financeiros (pagamentos falhos, churn)
 */
async function identificarProblemasFinanceiros(db: FirebaseFirestore.Firestore): Promise<ProblemaAtivo[]> {
  const problemas: ProblemaAtivo[] = [];

  try {
    // Buscar jobs com pagamento falho
    const jobsPagamentoFalho = await db
      .collection('jobs')
      .where('paymentStatus', '==', 'failed')
      .get();

    const countFalhos = jobsPagamentoFalho.size;
    let receitaPerdida = 0;

    jobsPagamentoFalho.forEach(doc => {
      const data = doc.data();
      receitaPerdida += data.valor || 2500;
    });

    if (countFalhos > 3) {
      problemas.push({
        id: 'financeiro-pagamentos',
        tipo: 'operacional',
        titulo: 'Pagamentos com falha',
        descricao: `${countFalhos} jobs com pagamento falho (R$ ${receitaPerdida.toLocaleString('pt-BR')})`,
        severidade: countFalhos > 10 ? 'critica' : countFalhos > 5 ? 'alta' : 'media',
        impacto: {
          receita: receitaPerdida,
          usuarios: countFalhos,
        },
        acoesSugeridas: [
          'Entrar em contato com famílias afetadas',
          'Revisar métodos de pagamento',
          'Implementar retry automático',
          'Oferecer suporte proativo',
        ],
      });
    }
  } catch (error) {
    console.error('[Financeiro] Erro:', error);
  }

  return problemas;
}
