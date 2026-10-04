// ─── Check-In Validation Schemas (Zod) ───────────────────────────────────────
const { z } = require('zod');

const scanTicketSchema = z.object({
  ticketCode: z
    .string({ required_error: 'Ticket code is required' })
    .min(1, 'Ticket code is required')
    .trim(),
});

module.exports = { scanTicketSchema };
