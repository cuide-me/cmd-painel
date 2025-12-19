/**
 * API Route: Feature Flags
 * GET /api/admin/feature-flags
 */

import { NextResponse } from 'next/server';
import { getAllFeatureFlags } from '@/lib/featureFlags';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const flags = getAllFeatureFlags();

    // Contar features habilitadas
    const entries = Object.entries(flags);
    const enabled = entries.filter(([_, value]) => value === true).length;
    const disabled = entries.length - enabled;

    return NextResponse.json({
      success: true,
      data: {
        flags,
        summary: {
          total: entries.length,
          enabled,
          disabled,
          enabledPercentage: Math.round((enabled / entries.length) * 100),
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[FeatureFlags] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch feature flags',
      },
      { status: 500 }
    );
  }
}
