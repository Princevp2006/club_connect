// ─── Volunteer Validation Schemas (Zod) ───────────────────────────────────────
const { z } = require('zod');

// Volunteer application has no body (event comes from URL param).
// These are for task creation and reassignment.

const createTaskSchema = z.object({
  volunteerUserId: z
    .string({ required_error: 'Volunteer user ID is required' })
    .uuid('Invalid volunteer user ID format'),
  taskType: z.enum(
    ['QR_SCANNER', 'REGISTRATION', 'SEATING', 'HELP_DESK', 'EVENT_SETUP', 'OTHER'],
    { required_error: 'Task type is required' }
  ),
  taskTitle: z
    .string({ required_error: 'Task title is required' })
    .min(2, 'Task title must be at least 2 characters')
    .max(200, 'Task title must not exceed 200 characters')
    .trim(),
  description: z.string().max(1000).trim().optional().nullable().default(null),
  startTime: z.string().datetime().optional().nullable().default(null),
  endTime: z.string().datetime().optional().nullable().default(null),
  location: z.string().max(300).trim().optional().nullable().default(null),
});

const reassignTaskSchema = z.object({
  volunteerUserId: z
    .string({ required_error: 'New volunteer user ID is required' })
    .uuid('Invalid volunteer user ID format'),
});

const updateTaskStatusSchema = z.object({
  status: z.enum(['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'], {
    required_error: 'Status is required',
    invalid_type_error: 'Status must be one of: ACCEPTED, IN_PROGRESS, COMPLETED',
  }),
});

module.exports = { createTaskSchema, reassignTaskSchema, updateTaskStatusSchema };
