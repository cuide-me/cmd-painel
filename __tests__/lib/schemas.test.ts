import { z } from 'zod';
import { 
  TorreV2Schema, 
  AlertsResponseSchema,
  validateResponse,
  safeParse 
} from '@/lib/schemas';

describe('Zod Schemas', () => {
  describe('TorreV2Schema', () => {
    it('should have required properties', () => {
      expect(TorreV2Schema).toBeDefined();
      expect(typeof TorreV2Schema.safeParse).toBe('function');
    });

    it('should reject completely invalid data', () => {
      const result = TorreV2Schema.safeParse(null);
      expect(result.success).toBe(false);
    });
  });

  describe('AlertsResponseSchema', () => {
    it('should have required properties', () => {
      expect(AlertsResponseSchema).toBeDefined();
      expect(typeof AlertsResponseSchema.safeParse).toBe('function');
    });
  });

  describe('validateResponse', () => {
    it('should return success false for invalid data', () => {
      const result = validateResponse(AlertsResponseSchema, { invalid: 'data' });
      expect(result.success).toBe(false);
    });
  });

  describe('safeParse', () => {
    it('should return undefined for invalid data', () => {
      const result = safeParse(AlertsResponseSchema, null, 'AlertsResponse');
      expect(result).toBeUndefined();
    });
  });
});
