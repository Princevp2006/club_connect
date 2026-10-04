// ─── Ticket Service ──────────────────────────────────────────────────────────
const { v4: uuidv4 } = require('uuid');
const ticketRepo = require('../repositories/ticket.repository');
const eventRepo = require('../repositories/event.repository');
const ApiError = require('../utils/apiError');

/**
 * Generate a unique ticket code (prefixed for readability).
 */
function generateTicketCode() {
  return `TKT-${uuidv4().split('-')[0].toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
}

/**
 * Register for an event ticket.
 */
async function registerTicket(eventId, userId) {
  // Validate event exists
  const event = await eventRepo.findById(eventId);
  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  if (event.status === 'DRAFT') {
    throw ApiError.forbidden('Cannot register for a draft event');
  }

  // Check for duplicate registration
  const existing = await ticketRepo.findByEventAndUser(eventId, userId);
  if (existing) {
    throw ApiError.conflict('You are already registered for this event');
  }

  const ticketCode = generateTicketCode();

  return ticketRepo.create({
    eventId,
    userId,
    ticketCode,
    status: 'ACTIVE',
  });
}

/**
 * Get the authenticated user's tickets.
 */
async function getMyTickets(userId) {
  return ticketRepo.findByUserId(userId);
}

/**
 * Get all tickets for an event (admin/leader view).
 */
async function getEventTickets(eventId) {
  const event = await eventRepo.findById(eventId);
  if (!event) {
    throw ApiError.notFound('Event not found');
  }
  return ticketRepo.findByEventId(eventId);
}

module.exports = { registerTicket, getMyTickets, getEventTickets };
