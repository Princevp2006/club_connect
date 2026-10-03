// ─── QR Scanner Authorization Middleware ─────────────────────────────────────
// Verifies that the authenticated user has an active QR_SCANNER task for the
// specific event identified by :eventId in the route params.
// This is NOT a role – it is task-based authorization.
// ─────────────────────────────────────────────────────────────────────────────

const prisma = require('../lib/prisma');
const ApiError = require('../utils/apiError');

/**
 * Middleware that checks QR_SCANNER task assignment for the event.
 * Must be used AFTER authenticateJWT so req.user is available.
 */
async function requireQrScanner(req, _res, next) {
  try {
    const { eventId } = req.params;
    const userId = req.user.userId;

    if (!eventId) {
      return next(ApiError.badRequest('Event ID is required'));
    }

    // Find an active QR_SCANNER task for this user on this event
    const qrTask = await prisma.volunteerTask.findFirst({
      where: {
        eventId,
        volunteerUserId: userId,
        taskType: 'QR_SCANNER',
        status: { in: ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'] },
      },
    });

    if (!qrTask) {
      return next(
        ApiError.forbidden('You do not have QR scanner access for this event')
      );
    }

    // Attach the task to the request for downstream use
    req.qrTask = qrTask;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = requireQrScanner;
