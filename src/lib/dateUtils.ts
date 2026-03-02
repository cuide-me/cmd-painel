/**
 * Utility functions for handling dates from Firestore
 * Handles both legacy Timestamp format and new ISO string format
 */

/**
 * Convert Firestore date field to JavaScript Date object
 * Supports both Timestamp (.toDate()) and ISO strings
 */
export function toDate(value: any): Date | null {
  if (!value) return null;

  // Legacy Timestamp format
  if (typeof value === 'object' && typeof value.toDate === 'function') {
    const d = value.toDate();
    return d instanceof Date && !isNaN(d.getTime()) ? d : null;
  }

  // ISO string format (current)
  if (typeof value === 'string') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  // Unix timestamp (seconds or milliseconds)
  if (typeof value === 'number') {
    const ts = value > 10000000000 ? value : value * 1000;
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
  }

  // Already a Date object
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  return null;
}

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
