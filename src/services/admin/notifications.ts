/**
 * ═══════════════════════════════════════════════════════════
 * NOTIFICATIONS SERVICE
 * ═══════════════════════════════════════════════════════════
 * Sistema de notificações do admin
 */

import { getFirestore } from 'firebase-admin/firestore';
import { toDate } from '@/lib/dateUtils';

export type NotificationType = 'info' | 'warning' | 'error' | 'success';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  module?: string;
  link?: string;
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
}

export async function getAdminNotifications(limit = 50): Promise<Notification[]> {
  const db = getFirestore();
  
  try {
    const snapshot = await db
      .collection('admin_notifications')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const notifications: Notification[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        type: data.type || 'info',
        priority: data.priority || 'medium',
        title: data.title || '',
        message: data.message || '',
        module: data.module,
        link: data.link,
        read: data.read || false,
        createdAt: toDate(data.createdAt) || new Date(),
        expiresAt: data.expiresAt ? (toDate(data.expiresAt) || undefined) : undefined,
        metadata: data.metadata
      });
    });

    return notifications;
  } catch (error) {
    console.error('[Notifications Service] Erro ao buscar notificações:', error);
    return [];
  }
}

export async function getNotificationStats(): Promise<NotificationStats> {
  const db = getFirestore();
  
  try {
    const snapshot = await db
      .collection('admin_notifications')
      .where('read', '==', false)
      .get();

    const stats: NotificationStats = {
      total: snapshot.size,
      unread: snapshot.size,
      byType: { info: 0, warning: 0, error: 0, success: 0 },
      byPriority: { low: 0, medium: 0, high: 0, critical: 0 }
    };

    snapshot.forEach(doc => {
      const data = doc.data();
      const type = data.type as NotificationType;
      const priority = data.priority as NotificationPriority;
      
      if (stats.byType[type] !== undefined) stats.byType[type]++;
      if (stats.byPriority[priority] !== undefined) stats.byPriority[priority]++;
    });

    return stats;
  } catch (error) {
    console.error('[Notifications Service] Erro ao buscar stats:', error);
    return {
      total: 0,
      unread: 0,
      byType: { info: 0, warning: 0, error: 0, success: 0 },
      byPriority: { low: 0, medium: 0, high: 0, critical: 0 }
    };
  }
}

export async function markAsRead(notificationId: string): Promise<void> {
  const db = getFirestore();
  
  try {
    await db.collection('admin_notifications').doc(notificationId).update({
      read: true,
      readAt: new Date()
    });
  } catch (error) {
    console.error('[Notifications Service] Erro ao marcar como lida:', error);
    throw error;
  }
}

export async function markAllAsRead(): Promise<void> {
  const db = getFirestore();
  
  try {
    const snapshot = await db
      .collection('admin_notifications')
      .where('read', '==', false)
      .get();

    const batch = db.batch();
    snapshot.forEach(doc => {
      batch.update(doc.ref, { read: true, readAt: new Date() });
    });

    await batch.commit();
  } catch (error) {
    console.error('[Notifications Service] Erro ao marcar todas como lidas:', error);
    throw error;
  }
}

export async function createNotification(
  notification: Omit<Notification, 'id' | 'createdAt' | 'read'>
): Promise<string> {
  const db = getFirestore();
  
  try {
    const docRef = await db.collection('admin_notifications').add({
      ...notification,
      read: false,
      createdAt: new Date()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('[Notifications Service] Erro ao criar notificação:', error);
    throw error;
  }
}

export async function deleteNotification(notificationId: string): Promise<void> {
  const db = getFirestore();
  
  try {
    await db.collection('admin_notifications').doc(notificationId).delete();
  } catch (error) {
    console.error('[Notifications Service] Erro ao deletar notificação:', error);
    throw error;
  }
}
