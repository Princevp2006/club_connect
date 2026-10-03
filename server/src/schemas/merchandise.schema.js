// ─── Merchandise Validation Schemas (Zod) ────────────────────────────────────
const { z } = require('zod');

const createMerchandiseSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(200, 'Name must not exceed 200 characters')
    .trim(),
  description: z.string().max(1000).trim().optional().nullable().default(null),
  size: z.string().max(50).trim().optional().nullable().default(null),
  stockQuantity: z
    .number({ required_error: 'Stock quantity is required' })
    .int('Stock quantity must be an integer')
    .min(0, 'Stock quantity cannot be negative'),
});

const updateMerchandiseSchema = z.object({
  name: z.string().min(2).max(200).trim().optional(),
  description: z.string().max(1000).trim().optional().nullable(),
  size: z.string().max(50).trim().optional().nullable(),
  stockQuantity: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

const listMerchandiseQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number).pipe(z.number().int().positive()),
  limit: z.string().optional().default('10').transform(Number).pipe(z.number().int().min(1).max(100)),
  search: z.string().optional().default(''),
  activeOnly: z.string().optional().transform((v) => v === 'true').default('false'),
});

module.exports = { createMerchandiseSchema, updateMerchandiseSchema, listMerchandiseQuerySchema };
