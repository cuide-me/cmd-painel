/**
 * ═══════════════════════════════════════════════════════════
 * API ROUTE: Admin Notifications
 * ═══════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/server/auth';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import {
  getAdminNotifications,
  getNotificationStats,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '@/services/admin/notifications';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    getFirebaseAdmin();

    const { searchParams } = new URL(request.url);
    const statsOnly = searchParams.get('stats') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    if (statsOnly) {
      const stats = await getNotificationStats();
      return NextResponse.json({ success: true, stats });
    }

    const notifications = await getAdminNotifications(limit);
    const stats = await getNotificationStats();

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        stats
      }
    });
  } catch (error: any) {
    console.error('[Notifications API] Erro:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao carregar notificações' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    getFirebaseAdmin();

    const body = await request.json();
    const { action, notificationId } = body;

    if (action === 'markAsRead' && notificationId) {
      await markAsRead(notificationId);
      return NextResponse.json({ success: true });
    }

    if (action === 'markAllAsRead') {
      await markAllAsRead();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Ação inválida' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[Notifications API] Erro:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar notificação' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    if (!authResult || !authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    getFirebaseAdmin();

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json(
        { error: 'ID da notificação não fornecido' },
        { status: 400 }
      );
    }

    await deleteNotification(notificationId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Notifications API] Erro:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao deletar notificação' },
      { status: 500 }
    );
  }
}
