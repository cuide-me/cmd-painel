/**
 * API ROUTE: /api/admin/marketplace-validation
 * Validação Marketplace: Demanda vs Oferta
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getMarketplaceValidation } from '@/services/admin/marketplace-validation';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    getFirebaseAdmin();
    const data = await getMarketplaceValidation();

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('[Marketplace Validation API] Erro:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao carregar dados' },
      { status: 500 }
    );
  }
}
