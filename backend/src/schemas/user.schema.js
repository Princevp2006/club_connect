// ─── User Management Validation Schemas (Zod) ────────────────────────────────
const { z } = require('zod');
const { VALID_ROLES } = require('../types');

const changeRoleSchema = z.object({
  role: z.enum(VALID_ROLES, {
    required_error: 'Role is required',
    invalid_type_error: `Role must be one of: ${VALID_ROLES.join(', ')}`,
  }),
});

const listUsersQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform(Number)
    .pipe(z.number().int().positive()),
  limit: z
    .string()
    .optional()
    .default('10')
    .transform(Number)
    .pipe(z.number().int().min(1).max(1000)),
  search: z.string().optional().default(''),
  role: z.enum([...VALID_ROLES, '']).optional().default(''),
  isActive: z
    .string()
    .optional()
    .transform((v) => {
      if (v === 'true') return true;
      if (v === 'false') return false;
      return undefined;
    }),
});

const YEAR_VALUES = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate', 'Other'];

const updateUserSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters')
    .trim()
    .optional(),
  email: z
    .string()
    .email('Invalid email format')
    .transform((v) => v.toLowerCase().trim())
    .optional(),
  studentId: z
    .string()
    .max(50, 'Student ID must not exceed 50 characters')
    .trim()
    .transform((v) => (v === '' ? null : v))
    .optional()
    .nullable(),
  phone: z
    .string()
    .max(20, 'Phone must not exceed 20 characters')
    .trim()
    .transform((v) => (v === '' ? null : v))
    .optional()
    .nullable(),
  collegeName: z
    .string()
    .max(200, 'College name must not exceed 200 characters')
    .trim()
    .transform((v) => (v === '' ? null : v))
    .optional()
    .nullable(),
  year: z
    .string()
    .trim()
    .refine((v) => !v || YEAR_VALUES.includes(v), {
      message: `Year must be one of: ${YEAR_VALUES.join(', ')}`,
    })
    .transform((v) => (v === '' ? null : v))
    .optional()
    .nullable(),
});

module.exports = { changeRoleSchema, listUsersQuerySchema, updateUserSchema, YEAR_VALUES };
