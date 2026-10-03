// ─── Membership Validation Schemas (Zod) ─────────────────────────────────────
const { z } = require('zod');
const { VALID_MEMBERSHIP_STATUSES } = require('../types');

const createMembershipSchema = z.object({
  userId: z.string({ required_error: 'User ID is required' }).uuid('Invalid user ID format'),
  membershipType: z
    .string({ required_error: 'Membership type is required' })
    .min(1, 'Membership type is required')
    .max(100, 'Membership type must not exceed 100 characters')
    .trim(),
  startDate: z
    .string({ required_error: 'Start date is required' })
    .datetime({ message: 'Invalid date-time format' }),
  endDate: z
    .string({ required_error: 'End date is required' })
    .datetime({ message: 'Invalid date-time format' }),
  status: z.enum(VALID_MEMBERSHIP_STATUSES).optional().default('ACTIVE'),
});

const updateMembershipSchema = z.object({
  membershipType: z.string().min(1).max(100).trim().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(VALID_MEMBERSHIP_STATUSES).optional(),
});

const listMembershipsQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number).pipe(z.number().int().positive()),
  limit: z.string().optional().default('10').transform(Number).pipe(z.number().int().min(1).max(100)),
  status: z.enum([...VALID_MEMBERSHIP_STATUSES, '']).optional().default(''),
  userId: z.string().optional().default(''),
});

module.exports = { createMembershipSchema, updateMembershipSchema, listMembershipsQuerySchema };
