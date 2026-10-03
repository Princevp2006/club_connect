// ─── Check-In Repository ─────────────────────────────────────────────────────
const prisma = require('../lib/prisma');

const checkinInclude = {
  ticket: {
    select: {
      id: true,
      ticketCode: true,
      status: true,
      user: { select: { id: true, fullName: true, email: true } },
    },
  },
  event: {
    select: { id: true, title: true, eventDate: true },
  },
  scannedBy: {
    select: { id: true, fullName: true, email: true },
  },
};

async function create(data) {
  return prisma.ticketCheckIn.create({ data, include: checkinInclude });
}

async function findByTicketId(ticketId) {
  return prisma.ticketCheckIn.findUnique({ where: { ticketId }, include: checkinInclude });
}

async function findByEventId(eventId) {
  return prisma.ticketCheckIn.findMany({
    where: { eventId },
    include: checkinInclude,
    orderBy: { scannedAt: 'desc' },
  });
}

async function countByEventId(eventId) {
  return prisma.ticketCheckIn.count({ where: { eventId } });
}

module.exports = { create, findByTicketId, findByEventId, countByEventId };
