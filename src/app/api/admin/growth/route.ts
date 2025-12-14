import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';
import { requireAdmin } from '@/lib/server/auth';

export async function GET(request: NextRequest) {
  // 🔒 Verificar se usuário é admin
  const auth = await requireAdmin(request);
  if ('error' in auth) return auth.error;

  try {
    getFirebaseAdmin();
    const db = getFirestore();

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    // Calcular data inicial
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Buscar todos os usuários
    const usersSnapshot = await db.collection('users').get();

    // Estrutura para armazenar dados por dia
    const dailyData: Record<string, { profissionais: number; clientes: number; total: number }> =
      {};

    // Inicializar todos os dias com 0
    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      dailyData[dateKey] = { profissionais: 0, clientes: 0, total: 0 };
    }

    // Contar usuários por dia
    usersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const perfil = data.perfil;

      // Tentar pegar a data de criação
      let createdAt: Date | null = null;

      if (data.createdAt) {
        if (data.createdAt.toDate) {
          createdAt = data.createdAt.toDate();
        } else if (typeof data.createdAt === 'string') {
          createdAt = new Date(data.createdAt);
        } else if (typeof data.createdAt === 'number') {
          createdAt = new Date(data.createdAt);
        }
      }

      // Se não tem data de criação ou é antes do período, pular
      if (!createdAt || createdAt < startDate) {
        return;
      }

      const dateKey = createdAt.toISOString().split('T')[0];

      if (dailyData[dateKey]) {
        if (perfil === 'profissional') {
          dailyData[dateKey].profissionais++;
        } else if (perfil === 'cliente' || perfil === 'family') {
          dailyData[dateKey].clientes++;
        }
        dailyData[dateKey].total++;
      }
    });

    // Converter para array ordenado
    const chartData = Object.entries(dailyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({
        date,
        profissionais: counts.profissionais,
        clientes: counts.clientes,
        total: counts.total,
      }));

    // Calcular totais
    const totals = {
      profissionais: chartData.reduce((sum, d) => sum + d.profissionais, 0),
      clientes: chartData.reduce((sum, d) => sum + d.clientes, 0),
      total: chartData.reduce((sum, d) => sum + d.total, 0),
    };

    return NextResponse.json({
      chartData,
      totals,
      period: { days, startDate: startDate.toISOString(), endDate: now.toISOString() },
    });
  } catch (error: any) {
    console.error('[Growth API] Erro:', error);
    return NextResponse.json(
      {
        chartData: [],
        totals: { profissionais: 0, clientes: 0, total: 0 },
        error: error.message,
      },
      { status: 200 }
    );
  }
}
