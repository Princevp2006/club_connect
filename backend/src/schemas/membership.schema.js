// ─── Membership Validation Schemas (Zod) ─────────────────────────────────────
const { z } = require('zod');
const { VALID_MEMBERSHIP_STATUSES } = require('../types');

const VALID_MEMBERSHIP_TYPES = ['SEMESTER', 'ANNUAL', 'LIFETIME'];

const subscribeMembershipSchema = z.object({
  membershipType: z
    .string({ required_error: 'Membership type is required' })
    .refine((v) => VALID_MEMBERSHIP_TYPES.includes(v), {
      message: `Membership type must be one of: ${VALID_MEMBERSHIP_TYPES.join(', ')}`,
    }),
});

const normalizeDate = (val) => {
  if (!val || typeof val !== 'string') return val;
  if (val.includes('T')) {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
    const d = new Date(`${val}T00:00:00.000Z`);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  const d = new Date(val);
  if (!isNaN(d.getTime())) return d.toISOString();
  return val;
};

const preprocessMembershipInput = (data) => {
  if (!data || typeof data !== 'object') return data;
  const copy = { ...data };
  if (copy.startDate) copy.startDate = normalizeDate(copy.startDate);
  if (copy.endDate) copy.endDate = normalizeDate(copy.endDate);
  return copy;
};

const createMembershipSchema = z.preprocess(
  preprocessMembershipInput,
  z
    .object({
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
        .string()
        .datetime({ message: 'Invalid date-time format' })
        .optional(),
      status: z.enum(VALID_MEMBERSHIP_STATUSES).optional().default('ACTIVE'),
    })
    .refine((data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    }, {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    })
);

const updateMembershipSchema = z.preprocess(
  preprocessMembershipInput,
  z
    .object({
      membershipType: z.string().min(1).max(100).trim().optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      status: z.enum(VALID_MEMBERSHIP_STATUSES).optional(),
    })
    .refine(
      (data) => {
        if (data.startDate && data.endDate) {
          return new Date(data.endDate) >= new Date(data.startDate);
        }
        return true;
      },
      { message: 'End date must be on or after start date', path: ['endDate'] }
    )
);

const listMembershipsQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number).pipe(z.number().int().positive()),
  limit: z.string().optional().default('10').transform(Number).pipe(z.number().int().min(1).max(1000)),
  status: z.enum([...VALID_MEMBERSHIP_STATUSES, '']).optional().default(''),
  userId: z.string().optional().default(''),
  search: z.string().optional().default(''),
});

module.exports = { subscribeMembershipSchema, createMembershipSchema, updateMembershipSchema, listMembershipsQuerySchema };
