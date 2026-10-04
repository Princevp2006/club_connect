// ─── Announcement Validation Schemas (Zod) ───────────────────────────────────
const { z } = require('zod');
const { VALID_ANNOUNCEMENT_TARGET_TYPES } = require('../types');

const createAnnouncementSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .min(2, 'Title must be at least 2 characters')
    .max(200, 'Title must not exceed 200 characters')
    .trim(),
  content: z
    .string({ required_error: 'Content is required' })
    .min(5, 'Content must be at least 5 characters')
    .trim(),
  isPublished: z.boolean().optional().default(false),
  targetType: z.enum(VALID_ANNOUNCEMENT_TARGET_TYPES).optional().default('ALL_MEMBERS'),
  targetEventId: z.string().uuid().optional().nullable(),
  recipientUserIds: z.array(z.string().uuid()).optional().default([]),
});

const updateAnnouncementSchema = z.object({
  title: z.string().min(2).max(200).trim().optional(),
  content: z.string().min(5).trim().optional(),
  isPublished: z.boolean().optional(),
  targetType: z.enum(VALID_ANNOUNCEMENT_TARGET_TYPES).optional(),
  targetEventId: z.string().uuid().optional().nullable(),
  recipientUserIds: z.array(z.string().uuid()).optional(),
});

const listAnnouncementsQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number).pipe(z.number().int().positive()),
  limit: z.string().optional().default('10').transform(Number).pipe(z.number().int().min(1).max(100)),
});

module.exports = { createAnnouncementSchema, updateAnnouncementSchema, listAnnouncementsQuerySchema };
