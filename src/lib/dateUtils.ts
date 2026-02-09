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
    return value.toDate();
  }
  
  // ISO string format (current)
  if (typeof value === 'string') {
    return new Date(value);
  }
  
  // Already a Date object
  if (value instanceof Date) {
    return value;
  }
  
  // Fallback
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
