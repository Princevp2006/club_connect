// ─── Check-In Service ────────────────────────────────────────────────────────
// QR ticket scanning and attendance logic.
// ─────────────────────────────────────────────────────────────────────────────

const prisma = require('../lib/prisma');
const checkinRepo = require('../repositories/checkin.repository');
const ApiError = require('../utils/apiError');

/**
 * Check scanner access for an event.
 * Returns { allowed: true } or throws 403.
 */
async function checkScannerAccess(eventId, userId) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  // Check for approved volunteer application
  const application = await prisma.volunteerApplication.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });
  if (!application || application.status !== 'APPROVED') {
    throw ApiError.forbidden('You are not an approved volunteer for this event');
  }

  // Check for active QR_SCANNER task
  const qrTask = await prisma.volunteerTask.findFirst({
    where: {
      eventId,
      volunteerUserId: userId,
      taskType: 'QR_SCANNER',
      status: { in: ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'] },
    },
  });

  if (!qrTask) {
    throw ApiError.forbidden('You do not have a QR scanner task for this event');
  }

  return { allowed: true, taskId: qrTask.id };
}

/**
 * Scan a ticket and create a check-in record.
 * scannedById is derived from the authenticated JWT – never from frontend.
 */
async function scanTicket(eventId, ticketCode, scannedById) {
  // 1. Find the ticket by code
  const ticket = await prisma.eventTicket.findUnique({
    where: { ticketCode },
    include: { user: { select: { id: true, fullName: true, email: true } } },
  });

  if (!ticket) {
    throw ApiError.notFound('Invalid ticket code');
  }

  // 2. Verify ticket belongs to the requested event
  if (ticket.eventId !== eventId) {
    throw ApiError.badRequest('This ticket does not belong to the requested event');
  }

  // 3. Verify ticket is ACTIVE
  if (ticket.status !== 'ACTIVE') {
    throw ApiError.badRequest(`Ticket is ${ticket.status.toLowerCase()}`);
  }

  // 4. Check for duplicate check-in
  const existingCheckIn = await checkinRepo.findByTicketId(ticket.id);
  if (existingCheckIn) {
    throw ApiError.conflict('Ticket already checked in');
  }

  // 5. Create the check-in record
  const checkIn = await checkinRepo.create({
    ticketId: ticket.id,
    eventId,
    scannedById, // Derived from JWT, never from request body
  });

  return {
    success: true,
    ticketId: ticket.id,
    attendeeName: ticket.user.fullName,
    eventId,
    scannedAt: checkIn.scannedAt,
  };
}

/**
 * Get attendance records for an event.
 */
async function getEventAttendance(eventId) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  return checkinRepo.findByEventId(eventId);
}

/**
 * Get attendance count for an event.
 */
async function getEventAttendanceCount(eventId) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  const count = await checkinRepo.countByEventId(eventId);
  return { eventId, attendanceCount: count };
}

module.exports = { checkScannerAccess, scanTicket, getEventAttendance, getEventAttendanceCount };
