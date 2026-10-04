// ─── Ticket Controller ───────────────────────────────────────────────────────
const ticketService = require('../services/ticket.service');
const { success, created } = require('../utils/apiResponse');

async function registerTicket(req, res, next) {
  try {
    const ticket = await ticketService.registerTicket(req.params.eventId, req.user.userId);
    return created(res, ticket, 'Ticket registered');
  } catch (err) {
    next(err);
  }
}

async function getMyTickets(req, res, next) {
  try {
    const tickets = await ticketService.getMyTickets(req.user.userId);
    return success(res, tickets, 'Tickets retrieved');
  } catch (err) {
    next(err);
  }
}

async function getEventTickets(req, res, next) {
  try {
    const tickets = await ticketService.getEventTickets(req.params.eventId);
    return success(res, tickets, 'Event tickets retrieved');
  } catch (err) {
    next(err);
  }
}

module.exports = { registerTicket, getMyTickets, getEventTickets };
