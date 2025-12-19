import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getMarketplaceValidation } from '@/services/admin/marketplace';

/**
 * Marketplace Validation API
 * Returns supply/demand health, match quality, coverage
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    getFirebaseAdmin();

    const data = await getMarketplaceValidation();

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Marketplace Validation API] Error:', error);
    
    return NextResponse.json(
      {
        error: error.message || 'Erro ao carregar validação do marketplace',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
