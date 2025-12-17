import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getPipelineData } from '@/services/admin/pipeline';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    getFirebaseAdmin();
    const data = await getPipelineData();

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Pipeline API] Erro:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao carregar pipeline' },
      { status: 500 }
    );
  }
}
