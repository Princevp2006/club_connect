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
    .pipe(z.number().int().min(1).max(100)),
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

module.exports = { changeRoleSchema, listUsersQuerySchema };
