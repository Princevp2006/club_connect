// ─── Event Validation Schemas (Zod) ──────────────────────────────────────────
const { z } = require('zod');
const { VALID_EVENT_STATUSES } = require('../types');

const createEventSchema = z
  .object({
    title: z
      .string({ required_error: 'Title is required' })
      .min(2, 'Title must be at least 2 characters')
      .max(200, 'Title must not exceed 200 characters')
      .trim(),
    description: z
      .string({ required_error: 'Description is required' })
      .min(5, 'Description must be at least 5 characters')
      .trim(),
    eventDate: z
      .string({ required_error: 'Event date is required' })
      .datetime({ message: 'Invalid date-time format' }),
    startTime: z
      .string({ required_error: 'Start time is required' })
      .datetime({ message: 'Invalid date-time format' }),
    endTime: z
      .string({ required_error: 'End time is required' })
      .datetime({ message: 'Invalid date-time format' }),
    location: z
      .string({ required_error: 'Location is required' })
      .min(2, 'Location must be at least 2 characters')
      .max(300, 'Location must not exceed 300 characters')
      .trim(),
    needsVolunteers: z.boolean().default(false),
    volunteerLimit: z.number().int().positive().nullable().optional().default(null),
  })
  .refine(
    (data) => {
      if (data.needsVolunteers && (data.volunteerLimit === null || data.volunteerLimit === undefined)) {
        return false;
      }
      return true;
    },
    { message: 'volunteerLimit is required when needsVolunteers is true', path: ['volunteerLimit'] }
  )
  .refine(
    (data) => {
      if (!data.needsVolunteers && data.volunteerLimit !== null && data.volunteerLimit !== undefined) {
        return false;
      }
      return true;
    },
    { message: 'volunteerLimit must be null when needsVolunteers is false', path: ['volunteerLimit'] }
  )
  .refine(
    (data) => new Date(data.endTime) > new Date(data.startTime),
    { message: 'endTime must be after startTime', path: ['endTime'] }
  );

const updateEventSchema = z
  .object({
    title: z.string().min(2).max(200).trim().optional(),
    description: z.string().min(5).trim().optional(),
    eventDate: z.string().datetime().optional(),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
    location: z.string().min(2).max(300).trim().optional(),
    status: z.enum(VALID_EVENT_STATUSES).optional(),
    needsVolunteers: z.boolean().optional(),
    volunteerLimit: z.number().int().positive().nullable().optional(),
  })
  .refine(
    (data) => {
      // If both are provided, validate consistency
      if (data.needsVolunteers === true && data.volunteerLimit === null) {
        return false;
      }
      return true;
    },
    { message: 'volunteerLimit is required when needsVolunteers is true', path: ['volunteerLimit'] }
  )
  .refine(
    (data) => {
      if (data.needsVolunteers === false && data.volunteerLimit !== undefined && data.volunteerLimit !== null) {
        return false;
      }
      return true;
    },
    { message: 'volunteerLimit must be null when needsVolunteers is false', path: ['volunteerLimit'] }
  );

const listEventsQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number).pipe(z.number().int().positive()),
  limit: z.string().optional().default('10').transform(Number).pipe(z.number().int().min(1).max(100)),
  status: z.enum([...VALID_EVENT_STATUSES, '']).optional().default(''),
  search: z.string().optional().default(''),
});

module.exports = { createEventSchema, updateEventSchema, listEventsQuerySchema };
