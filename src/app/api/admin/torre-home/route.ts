import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getTorreHomeData } from '@/services/admin/torre';

/**
 * Torre de Controle - Home API
 * Returns aggregated data for the main dashboard
 * Read-only, 3-source architecture (Firebase + Stripe + GA4)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize Firebase Admin
    getFirebaseAdmin();

    // Get all torre data
    const data = await getTorreHomeData();

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Torre Home API] Error:', error);
    console.error('[Torre Home API] Stack:', error.stack);
    
    return NextResponse.json(
      {
        error: error.message || 'Erro ao carregar dados da torre',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
