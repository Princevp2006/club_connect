// ─── Auth Request Validation Schemas (Zod) ───────────────────────────────────
const { z } = require('zod');

const registerSchema = z.object({
  fullName: z
    .string({ required_error: 'Full name is required' })
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters')
    .trim(),
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email format')
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters'),
  studentId: z
    .string({ required_error: 'Student ID is required' })
    .min(1, 'Student ID is required')
    .max(50, 'Student ID must not exceed 50 characters')
    .trim(),
  phone: z
    .string()
    .max(20, 'Phone must not exceed 20 characters')
    .trim()
    .optional()
    .nullable(),
});

const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email format')
    .transform((v) => v.toLowerCase().trim()),
  password: z.string({ required_error: 'Password is required' }),
});

module.exports = { registerSchema, loginSchema };
