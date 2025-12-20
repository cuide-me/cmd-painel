/**
 * ═══════════════════════════════════════════════════════════
 * API ROUTE: Webhooks
 * ═══════════════════════════════════════════════════════════
 * Endpoint para receber e processar webhooks
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { 
  processWebhookEvent, 
  shouldProcessEvent, 
  type WebhookEvent,
  type WebhookConfig 
} from '@/services/admin/webhooks';

// Configuração de webhooks (em produção, viria do banco de dados)
const WEBHOOK_CONFIG: WebhookConfig = {
  enabled: true,
  events: [
    'pipeline_bottleneck',
    'high_churn_rate',
    'low_conversion',
    'marketplace_imbalance',
    'service_desk_overload',
    'critical_error',
    'system_alert'
  ],
  minSeverity: 'medium'
};

export async function POST(request: NextRequest) {
  try {
    // Verificar secret token (em produção)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.WEBHOOK_SECRET_TOKEN;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    getFirebaseAdmin();

    const body = await request.json();
    const event: WebhookEvent = {
      type: body.type,
      severity: body.severity || 'medium',
      title: body.title,
      message: body.message,
      metadata: body.metadata,
      timestamp: new Date(body.timestamp || Date.now())
    };

    // Validar evento
    if (!event.type || !event.title || !event.message) {
      return NextResponse.json(
        { error: 'Dados do evento inválidos' },
        { status: 400 }
      );
    }

    // Verificar se deve processar
    if (!shouldProcessEvent(event, WEBHOOK_CONFIG)) {
      return NextResponse.json({
        success: true,
        processed: false,
        reason: 'Event filtered by configuration'
      });
    }

    // Processar evento
    await processWebhookEvent(event);

    return NextResponse.json({
      success: true,
      processed: true,
      eventType: event.type,
      timestamp: event.timestamp
    });
  } catch (error: any) {
    console.error('[Webhook API] Erro:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar webhook' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Endpoint para verificar configuração (apenas para admins)
  try {
    return NextResponse.json({
      success: true,
      config: WEBHOOK_CONFIG,
      status: 'active'
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
