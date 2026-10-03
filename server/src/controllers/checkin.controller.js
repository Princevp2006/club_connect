// ─── Check-In Controller ─────────────────────────────────────────────────────
const checkinService = require('../services/checkin.service');
const { success } = require('../utils/apiResponse');

async function checkScannerAccess(req, res, next) {
  try {
    const result = await checkinService.checkScannerAccess(req.params.eventId, req.user.userId);
    return success(res, result, 'Scanner access granted');
  } catch (err) {
    next(err);
  }
}

async function scanTicket(req, res, next) {
  try {
    const result = await checkinService.scanTicket(
      req.params.eventId,
      req.body.ticketCode,
      req.user.userId // scannedById from JWT, never from request
    );
    return success(res, result, 'Ticket verified');
  } catch (err) {
    next(err);
  }
}

async function getEventAttendance(req, res, next) {
  try {
    const data = await checkinService.getEventAttendance(req.params.eventId);
    return success(res, data, 'Attendance retrieved');
  } catch (err) {
    next(err);
  }
}

async function getEventAttendanceCount(req, res, next) {
  try {
    const data = await checkinService.getEventAttendanceCount(req.params.eventId);
    return success(res, data, 'Attendance count retrieved');
  } catch (err) {
    next(err);
  }
}

module.exports = { checkScannerAccess, scanTicket, getEventAttendance, getEventAttendanceCount };
