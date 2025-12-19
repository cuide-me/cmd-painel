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

    // Placeholder data
    const data = {
      metrics: {
        apiResponseTime: 250,
        pageLoadTime: 1.2,
        errorRate: 0.05,
        uptime: 99.9
      },
      generatedAt: new Date().toISOString()
    };

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Performance Metrics API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
