// ─── Ticket Repository ───────────────────────────────────────────────────────
const prisma = require('../lib/prisma');

const ticketInclude = {
  event: {
    select: { id: true, title: true, eventDate: true, location: true, status: true },
  },
  user: {
    select: { id: true, fullName: true, email: true },
  },
};

async function create(data) {
  return prisma.eventTicket.create({ data, include: ticketInclude });
}

async function findById(id) {
  return prisma.eventTicket.findUnique({ where: { id }, include: ticketInclude });
}

async function findByEventAndUser(eventId, userId) {
  return prisma.eventTicket.findUnique({
    where: { eventId_userId: { eventId, userId } },
    include: ticketInclude,
  });
}

async function findByTicketCode(ticketCode) {
  return prisma.eventTicket.findUnique({ where: { ticketCode }, include: ticketInclude });
}

async function findByUserId(userId) {
  return prisma.eventTicket.findMany({
    where: { userId },
    include: ticketInclude,
    orderBy: { registeredAt: 'desc' },
  });
}

async function findByEventId(eventId) {
  return prisma.eventTicket.findMany({
    where: { eventId },
    include: ticketInclude,
    orderBy: { registeredAt: 'desc' },
  });
}

module.exports = { create, findById, findByEventAndUser, findByTicketCode, findByUserId, findByEventId };
