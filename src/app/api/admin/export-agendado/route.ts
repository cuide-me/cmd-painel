/**
 * ═══════════════════════════════════════════════════════
 * API: EXPORTAÇÃO AGENDADA DE RELATÓRIOS
 * ═══════════════════════════════════════════════════════
 * Quick Win #4: Permite agendar exportações automáticas
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { getTorreControleDashboard } from '@/services/admin/torre-controle';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/export-agendado
 * Agenda uma exportação recorrente de relatórios
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      email, 
      frequencia, // 'diario' | 'semanal' | 'mensal'
      formato, // 'pdf' | 'xlsx' | 'csv'
      modulos, // Array de módulos a incluir
    } = body;

    if (!email || !frequencia || !formato) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: email, frequencia, formato' },
        { status: 400 }
      );
    }

    const db = getFirestore();

    // Salvar configuração de exportação agendada
    const agendamentoRef = await db.collection('exportacoes_agendadas').add({
      email,
      frequencia,
      formato,
      modulos: modulos || ['demanda', 'oferta', 'coreMvp', 'financeiro', 'confianca'],
      ativo: true,
      criadoEm: new Date().toISOString(),
      proximaExecucao: calcularProximaExecucao(frequencia),
    });

    return NextResponse.json({
      success: true,
      message: 'Exportação agendada com sucesso',
      data: {
        id: agendamentoRef.id,
        email,
        frequencia,
        formato,
      }
    });

  } catch (error) {
    console.error('[ExportAgendado] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao agendar exportação' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/export-agendado
 * Lista todas as exportações agendadas
 */
export async function GET(req: NextRequest) {
  try {
    const db = getFirestore();
    
    const agendamentosSnap = await db
      .collection('exportacoes_agendadas')
      .where('ativo', '==', true)
      .get();

    const agendamentos = agendamentosSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      data: agendamentos
    });

  } catch (error) {
    console.error('[ExportAgendado] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao listar agendamentos' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/export-agendado?id=xxx
 * Cancela uma exportação agendada
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID do agendamento é obrigatório' },
        { status: 400 }
      );
    }

    const db = getFirestore();
    
    await db.collection('exportacoes_agendadas').doc(id).update({
      ativo: false,
      canceladoEm: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Agendamento cancelado com sucesso'
    });

  } catch (error) {
    console.error('[ExportAgendado] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao cancelar agendamento' },
      { status: 500 }
    );
  }
}

/**
 * Calcula próxima execução baseado na frequência
 */
function calcularProximaExecucao(frequencia: string): string {
  const agora = new Date();
  
  switch (frequencia) {
    case 'diario':
      agora.setDate(agora.getDate() + 1);
      agora.setHours(8, 0, 0, 0); // 8h da manhã
      break;
    case 'semanal':
      agora.setDate(agora.getDate() + 7);
      agora.setHours(8, 0, 0, 0);
      break;
    case 'mensal':
      agora.setMonth(agora.getMonth() + 1);
      agora.setDate(1); // Primeiro dia do mês
      agora.setHours(8, 0, 0, 0);
      break;
    default:
      agora.setDate(agora.getDate() + 7); // Default: semanal
  }
  
  return agora.toISOString();
}

/**
 * Gera relatório em formato específico
 * (Esta função seria chamada por um cron job/cloud function)
 */
export async function gerarRelatorio(formato: string, modulos: string[]) {
  const dashboard = await getTorreControleDashboard();
  
  switch (formato) {
    case 'csv':
      return gerarCSV(dashboard, modulos);
    case 'xlsx':
      return gerarExcel(dashboard, modulos);
    case 'pdf':
      return gerarPDF(dashboard, modulos);
    default:
      throw new Error('Formato não suportado');
  }
}

/**
 * Gera CSV simples
 */
function gerarCSV(dashboard: any, modulos: string[]): string {
  let csv = 'Módulo,Métrica,Valor\n';
  
  if (modulos.includes('demanda')) {
    csv += `Demanda,Total Famílias,${dashboard.demanda.totalFamilias}\n`;
    csv += `Demanda,Novas Famílias 30d,${dashboard.demanda.novasFamilias30d}\n`;
    csv += `Demanda,Taxa Conversão,${dashboard.demanda.taxaConversao}%\n`;
  }
  
  if (modulos.includes('oferta')) {
    csv += `Oferta,Total Cuidadores,${dashboard.oferta.totalCuidadores}\n`;
    csv += `Oferta,Novos Cuidadores 30d,${dashboard.oferta.novosCuidadores30d}\n`;
  }
  
  // ... outros módulos
  
  return csv;
}

/**
 * Gera Excel (placeholder - requer lib xlsx)
 */
function gerarExcel(dashboard: any, modulos: string[]): Buffer {
  // Implementar com biblioteca xlsx
  throw new Error('Excel não implementado ainda');
}

/**
 * Gera PDF (placeholder - requer lib pdf)
 */
function gerarPDF(dashboard: any, modulos: string[]): Buffer {
  // Implementar com biblioteca pdf
  throw new Error('PDF não implementado ainda');
}
