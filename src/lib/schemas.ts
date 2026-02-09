/**
 * Zod schemas for data validation
 */

import { z } from 'zod';

// User schema
export const userSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string().optional(),
  photoURL: z.string().url().optional(),
  role: z.enum(['admin', 'user', 'professional']).default('user'),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()).optional(),
});

export type User = z.infer<typeof userSchema>;

// Job schema
export const jobSchema = z.object({
  id: z.string(),
  familyId: z.string(),
  professionalId: z.string().optional(),
  specialty: z.string(),
  status: z.enum(['pending', 'accepted', 'in_progress', 'completed', 'cancelled']),
  createdAt: z.date().or(z.string()),
  acceptedAt: z.date().or(z.string()).optional(),
  completedAt: z.date().or(z.string()).optional(),
});

export type Job = z.infer<typeof jobSchema>;

// Subscription schema
export const subscriptionSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  status: z.enum(['active', 'canceled', 'past_due', 'unpaid', 'trialing']),
  amount: z.number(),
  currency: z.string().default('brl'),
  interval: z.enum(['month', 'year']),
  currentPeriodStart: z.date().or(z.string()),
  currentPeriodEnd: z.date().or(z.string()),
});

export type Subscription = z.infer<typeof subscriptionSchema>;

// Feedback schema
export const feedbackSchema = z.object({
  id: z.string(),
  userId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  createdAt: z.date().or(z.string()),
});

export type Feedback = z.infer<typeof feedbackSchema>;

// Ticket schema
export const ticketSchema = z.object({
  id: z.string(),
  userId: z.string(),
  subject: z.string(),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()).optional(),
});

export type Ticket = z.infer<typeof ticketSchema>;

// Alerts Response Schema
export const AlertsResponseSchema = z.object({
  alerts: z.array(z.object({
    id: z.string(),
    type: z.enum(['critical', 'warning', 'info']),
    title: z.string(),
    description: z.string(),
    timestamp: z.string(),
  })),
  timestamp: z.string(),
});

export type AlertsResponse = z.infer<typeof AlertsResponseSchema>;

// Validation helpers
export function validateResponse<T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; error?: string } {
  try {
    const result = schema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error.message };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export function safeParse<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
  try {
    const result = schema.safeParse(data);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
