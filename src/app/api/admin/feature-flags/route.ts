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
      flags: {
        torreV2Enabled: true,
        intelligentAlertsEnabled: false,
        advancedAnalyticsEnabled: true
      },
      generatedAt: new Date().toISOString()
    };

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Feature Flags API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
