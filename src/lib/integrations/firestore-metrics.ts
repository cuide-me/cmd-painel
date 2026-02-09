/**
 * Firestore Metrics Integration
 * Utilities for fetching metrics from Firestore
 */

import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';

export interface MetricQuery {
  collection: string;
  startDate?: Date;
  endDate?: Date;
  filters?: Record<string, any>;
}

export async function countDocuments(query: MetricQuery): Promise<number> {
  try {
    const admin = getFirebaseAdmin();
    const db = getFirestore(admin);
    
    let docQuery = db.collection(query.collection);
    
    if (query.startDate) {
      docQuery = docQuery.where('createdAt', '>=', Timestamp.fromDate(query.startDate)) as any;
    }
    
    if (query.endDate) {
      docQuery = docQuery.where('createdAt', '<=', Timestamp.fromDate(query.endDate)) as any;
    }
    
    if (query.filters) {
      for (const [field, value] of Object.entries(query.filters)) {
        docQuery = docQuery.where(field, '==', value) as any;
      }
    }
    
    const snapshot = await docQuery.count().get();
    return snapshot.data().count;
  } catch (error) {
    console.error('Error counting documents:', error);
    return 0;
  }
}

export async function getDocuments<T = any>(query: MetricQuery): Promise<T[]> {
  try {
    const admin = getFirebaseAdmin();
    const db = getFirestore(admin);
    
    let docQuery = db.collection(query.collection);
    
    if (query.startDate) {
      docQuery = docQuery.where('createdAt', '>=', Timestamp.fromDate(query.startDate)) as any;
    }
    
    if (query.endDate) {
      docQuery = docQuery.where('createdAt', '<=', Timestamp.fromDate(query.endDate)) as any;
    }
    
    if (query.filters) {
      for (const [field, value] of Object.entries(query.filters)) {
        docQuery = docQuery.where(field, '==', value) as any;
      }
    }
    
    const snapshot = await docQuery.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  } catch (error) {
    console.error('Error getting documents:', error);
    return [];
  }
}

export async function aggregateMetric(
  query: MetricQuery,
  field: string,
  operation: 'sum' | 'avg' | 'min' | 'max'
): Promise<number> {
  try {
    const documents = await getDocuments(query);
    
    if (documents.length === 0) return 0;
    
    const values = documents
      .map((doc: any) => doc[field])
      .filter((val): val is number => typeof val === 'number');
    
    if (values.length === 0) return 0;
    
    switch (operation) {
      case 'sum':
        return values.reduce((sum, val) => sum + val, 0);
      case 'avg':
        return values.reduce((sum, val) => sum + val, 0) / values.length;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      default:
        return 0;
    }
  } catch (error) {
    console.error('Error aggregating metric:', error);
    return 0;
  }
}
