/**
 * API Route: Intelligent Alerts
 * GET /api/admin/intelligent-alerts
 */

import { NextResponse } from 'next/server';
import { detectAlerts, saveAlert, sendSlackNotification } from '@/services/admin/intelligentAlerts';
import { isFeatureEnabled } from '@/lib/featureFlags';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!isFeatureEnabled('intelligentAlerts')) {
      return NextResponse.json({
        success: false,
        error: 'Intelligent alerts feature is disabled',
      }, { status: 403 });
    }

    console.log('[IntelligentAlerts] Detecting alerts...');
    const alerts = await detectAlerts();

    // Salvar e notificar alertas críticos
    if (isFeatureEnabled('alertNotifications')) {
      for (const alert of alerts) {
        if (alert.severity === 'critical') {
          await saveAlert(alert);
          
          if (isFeatureEnabled('slackIntegration')) {
            await sendSlackNotification(alert);
          }
        }
      }
    }

    // Agrupar por severidade
    const grouped = {
      critical: alerts.filter(a => a.severity === 'critical'),
      warning: alerts.filter(a => a.severity === 'warning'),
      info: alerts.filter(a => a.severity === 'info'),
    };

    return NextResponse.json({
      success: true,
      data: {
        total: alerts.length,
        byCategory: {
          operational: alerts.filter(a => a.category === 'operational').length,
          financial: alerts.filter(a => a.category === 'financial').length,
          performance: alerts.filter(a => a.category === 'performance').length,
          quality: alerts.filter(a => a.category === 'quality').length,
          system: alerts.filter(a => a.category === 'system').length,
        },
        bySeverity: {
          critical: grouped.critical.length,
          warning: grouped.warning.length,
          info: grouped.info.length,
        },
        alerts: grouped,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[IntelligentAlerts] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to detect alerts',
      },
      { status: 500 }
    );
  }
}
