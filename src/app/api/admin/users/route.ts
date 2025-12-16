import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { listUsers } from '@/services/admin/users';

export async function GET(request: NextRequest) {
  try {
    // Inicializar Firebase Admin
    getFirebaseAdmin();

    // Pegar parâmetros da query
    const { searchParams } = new URL(request.url);
    const pageSize = searchParams.get('pageSize');
    const perfilFilter = searchParams.get('perfil');
    const searchTerm = searchParams.get('search');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any = {};
    if (pageSize) params.pageSize = parseInt(pageSize);
    if (perfilFilter) params.perfilFilter = perfilFilter;
    if (searchTerm) params.searchTerm = searchTerm;

    const result = await listUsers(params);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Users API] Erro:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao carregar usuários' },
      { status: 500 }
    );
  }
}
