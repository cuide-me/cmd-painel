import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Placeholder data - implementar lógica real depois
    const data = {
      funnel: [
        { stage: 'Visitantes', count: 1000, conversion: 100 },
        { stage: 'Cadastros', count: 250, conversion: 25 },
        { stage: 'Perfil Completo', count: 180, conversion: 18 },
        { stage: 'Primeira Solicitação', count: 120, conversion: 12 },
        { stage: 'Match', count: 80, conversion: 8 },
        { stage: 'Contratação', count: 50, conversion: 5 }
      ],
      generatedAt: new Date().toISOString()
    };

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Conversion Funnel API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
