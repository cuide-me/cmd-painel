/**
 * ═══════════════════════════════════════════════════════
 * DATE HELPERS - PAINEL ADMIN
 * ═══════════════════════════════════════════════════════
 * Funções auxiliares para manipulação de datas
 */

import { Timestamp } from 'firebase-admin/firestore';

/**
 * Converte qualquer tipo de data para Date
 */
export function toDate(value: any): Date | null {
  if (!value) return null;
  
  if (value instanceof Date) return value;
  
  // Timestamp Firestore
  if (value?.toDate && typeof value.toDate === 'function') {
    return value.toDate();
  }
  
  // String ISO
  if (typeof value === 'string') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  
  // Unix timestamp (seconds)
  if (typeof value === 'number') {
    // Se for muito grande, é milliseconds
    const timestamp = value > 10000000000 ? value : value * 1000;
    return new Date(timestamp);
  }
  
  return null;
}

/**
 * Calcula diferença em horas entre duas datas
 */
export function hoursBetween(start: any, end: any): number | null {
  const startDate = toDate(start);
  const endDate = toDate(end);
  
  if (!startDate || !endDate) return null;
  
  const diffMs = endDate.getTime() - startDate.getTime();
  return diffMs / (1000 * 60 * 60);
}

/**
 * Calcula horas desde uma data até agora
 */
export function hoursSince(date: any): number {
  const d = toDate(date);
  if (!d) return 0;
  
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  return diffMs / (1000 * 60 * 60);
}

/**
 * Calcula dias desde uma data até agora
 */
export function daysSince(date: any): number {
  return Math.floor(hoursSince(date) / 24);
}

/**
 * Verifica se data está nos últimos N dias
 */
export function isWithinLastDays(date: any, days: number): boolean {
  const d = toDate(date);
  if (!d) return false;
  
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  
  return diffDays <= days && diffDays >= 0;
}

/**
 * Verifica se data é do mês atual
 */
export function isCurrentMonth(date: any): boolean {
  const d = toDate(date);
  if (!d) return false;
  
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

/**
 * Retorna timestamp do início do mês atual
 */
export function getMonthStart(): Timestamp {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return Timestamp.fromDate(start);
}

/**
 * Retorna data de N dias atrás
 */
export function getDaysAgo(days: number): Date {
  const now = new Date();
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

/**
 * Retorna timestamp de N dias atrás
 */
export function getTimestampDaysAgo(days: number): Timestamp {
  return Timestamp.fromDate(getDaysAgo(days));
}
