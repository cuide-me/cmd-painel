/**
 * Utility functions for handling dates from Firestore
 * Handles both legacy Timestamp format and new ISO string format
 */

export { toDate } from '@/modules/shared/domain/date';
import { toDate } from '@/modules/shared/domain/date';

/**
 * Get timestamp from Firestore date field
 * Returns milliseconds since epoch
 */
export function toTimestamp(value: any): number {
  const date = toDate(value);
  return date ? date.getTime() : 0;
}

/**
 * Compare Firestore date with threshold
 * Returns true if date is after threshold
 */
export function isAfter(value: any, threshold: Date): boolean {
  const date = toDate(value);
  return date ? date > threshold : false;
}

/**
 * Compare Firestore date with threshold
 * Returns true if date is before threshold
 */
export function isBefore(value: any, threshold: Date): boolean {
  const date = toDate(value);
  return date ? date < threshold : false;
}
