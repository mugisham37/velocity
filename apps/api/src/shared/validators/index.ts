import { z } from 'zod';

// Common validation schemas
export const uuidSchema = z.string().uuid();

export const emailSchema = z.string().email();

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[^A-Za-z0-9]/,
    'Password must contain at least one special character'
  );

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const filterSchema = z.object({
  field: z.string(),
  operator: z.enum([
    'eq',
    'ne',
    'gt',
    'gte',
    'lt',
    'lte',
    'in',
    'nin',
    'like',
    'ilike',
  ]),
  value: z.any(),
});

export const sortSchema = z.object({
  field: z.string(),
  direction: z.enum(['asc', 'desc']),
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const currencySchema = z.enum([
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'CAD',
  'AUD',
]);

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');

export const urlSchema = z.string().url();

// Base entity schemas
export const baseEntitySchema = z.object({
  id: uuidSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const auditFieldsSchema = z.object({
  createdBy: uuidSchema,
  updatedBy: uuidSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});
