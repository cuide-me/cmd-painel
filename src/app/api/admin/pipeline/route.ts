import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getPipelineData } from '@/services/admin/pipeline';

export async function GET(request: NextRequest) {
  try {

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
