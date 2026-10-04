// ─── Order Validation Schemas (Zod) ──────────────────────────────────────────
const { z } = require('zod');
const { VALID_ORDER_STATUSES } = require('../types');

const createOrderSchema = z.object({
  productId: z
    .string({ required_error: 'Product ID is required' })
    .uuid('Invalid product ID format'),
  quantity: z
    .number({ required_error: 'Quantity is required' })
    .int('Quantity must be an integer')
    .positive('Quantity must be positive'),
  size: z.string().trim().max(50).optional().nullable(),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(VALID_ORDER_STATUSES, {
    required_error: 'Status is required',
  }),
});

const listOrdersQuerySchema = z
  .object({
    page: z.string().optional().default('1').transform(Number).pipe(z.number().int().positive()),
    limit: z.string().optional().default('10').transform(Number).pipe(z.number().int().min(1).max(100)),
    status: z.enum([...VALID_ORDER_STATUSES, '']).optional().default(''),
    search: z.string().optional().default(''),
    q: z.string().optional(),
  })
  .transform((data) => ({
    ...data,
    search: (data.search || data.q || '').trim(),
  }));

module.exports = { createOrderSchema, updateOrderStatusSchema, listOrdersQuerySchema };
