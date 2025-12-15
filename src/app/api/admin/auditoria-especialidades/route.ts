import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';
import { requireAdmin } from '@/lib/server/auth';

export async function GET(request: NextRequest) {
  // 🔒 Verificar se usuário é admin
  const auth = await requireAdmin(request);
  if ('error' in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== 'cuide-me-audit-2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const app = getFirebaseAdmin();
    const db = getFirestore(app);

    // Buscar todos os profissionais
    const profissionaisSnapshot = await db
      .collection('users')
      .where('perfil', '==', 'profissional')
      .get();

    interface ProfissionalAudit {
      id: string;
      nome: string;
      email: string;
      especialidade: string | null;
      telefone: string | null;
      cidade: string | null;
      bio: string | null;
      stripeAccountId: string | null;
      porcentagemPerfil: number;
    }

    const semEspecialidade: ProfissionalAudit[] = [];
    const comEspecialidade: ProfissionalAudit[] = [];
    const camposVazios: Record<string, string[]> = {};

    for (const doc of profissionaisSnapshot.docs) {
      const data = doc.data();
      const prof = {
        id: doc.id,
        nome: data.nome || 'SEM NOME',
        email: data.email || 'SEM EMAIL',
        especialidade: data.especialidade || data.specialty || null,
        telefone: data.telefone || null,
        cidade: data.cidade || data.location || null,
        bio: data.bio || null,
        stripeAccountId: data.stripeAccountId || null,
        porcentagemPerfil: data.porcentagemPerfil || 0,
      };

      // Verificar campos vazios
      const vazios = [];
      if (!prof.especialidade) vazios.push('especialidade');
      if (!prof.telefone) vazios.push('telefone');
      if (!prof.cidade) vazios.push('cidade');
      if (!prof.bio) vazios.push('bio');
      if (!prof.stripeAccountId) vazios.push('stripe');

      if (vazios.length > 0) {
        camposVazios[prof.id] = vazios;
      }

      // Classificar
      if (!prof.especialidade || prof.especialidade.trim() === '') {
        semEspecialidade.push(prof);
      } else {
        comEspecialidade.push(prof);
      }
    }

    // Estatísticas por campo
    const estatisticas = {
      total: profissionaisSnapshot.size,
      semEspecialidade: semEspecialidade.length,
      comEspecialidade: comEspecialidade.length,
      percentualSemEspecialidade: (
        (semEspecialidade.length / profissionaisSnapshot.size) *
        100
      ).toFixed(1),

      camposIncompletos: {
        semEspecialidade: semEspecialidade.length,
        semTelefone: Object.values(camposVazios).filter(c => c.includes('telefone')).length,
        semCidade: Object.values(camposVazios).filter(c => c.includes('cidade')).length,
        semBio: Object.values(camposVazios).filter(c => c.includes('bio')).length,
        semStripe: Object.values(camposVazios).filter(c => c.includes('stripe')).length,
      },
    };

    // Profissionais com perfil muito incompleto (3+ campos vazios)
    const perfilMuitoIncompleto = Object.entries(camposVazios)
      .filter(([_, campos]) => campos.length >= 3)
      .map(([id]) => {
        const prof = [...semEspecialidade, ...comEspecialidade].find(p => p.id === id);
        return {
          ...prof,
          camposVazios: camposVazios[id],
          totalVazios: camposVazios[id].length,
        };
      });

    // Distribuição de especialidades
    const distribuicaoEspecialidades: Record<string, number> = {};
    comEspecialidade.forEach(prof => {
      const esp = prof.especialidade!;
      distribuicaoEspecialidades[esp] = (distribuicaoEspecialidades[esp] || 0) + 1;
    });

    return NextResponse.json({
      timestamp: new Date().toISOString(),

      resumo: estatisticas,

      semEspecialidade: {
        total: semEspecialidade.length,
        profissionais: semEspecialidade.map(p => ({
          id: p.id,
          nome: p.nome,
          email: p.email,
          telefone: p.telefone,
          cidade: p.cidade,
          porcentagemPerfil: p.porcentagemPerfil,
          stripeVinculado: !!p.stripeAccountId,
          camposVazios: camposVazios[p.id] || [],
        })),
      },

      perfilMuitoIncompleto: {
        total: perfilMuitoIncompleto.length,
        profissionais: perfilMuitoIncompleto,
      },

      distribuicaoEspecialidades: Object.entries(distribuicaoEspecialidades)
        .sort((a, b) => b[1] - a[1])
        .map(([especialidade, quantidade]) => ({
          especialidade,
          quantidade,
          percentual: ((quantidade / comEspecialidade.length) * 100).toFixed(1),
        })),
    });
  } catch (error: any) {
    console.error('[Auditoria Especialidades] Erro:', error);
    return NextResponse.json({ error: error.message || 'Erro na auditoria' }, { status: 500 });
  }
}
