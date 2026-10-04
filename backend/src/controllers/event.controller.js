// ─── Event Controller ────────────────────────────────────────────────────────
const eventService = require('../services/event.service');
const { success, created } = require('../utils/apiResponse');

async function createEvent(req, res, next) {
  try {
    const event = await eventService.createEvent(req.body, req.user.userId);
    return created(res, event, 'Event created');
  } catch (err) {
    next(err);
  }
}

async function listEvents(req, res, next) {
  try {
    const result = await eventService.listEvents(req.query, req.user);
    return success(res, result, 'Events retrieved');
  } catch (err) {
    next(err);
  }
}

async function getEvent(req, res, next) {
  try {
    const event = await eventService.getEventById(req.params.eventId, req.user);
    return success(res, event);
  } catch (err) {
    next(err);
  }
}

async function updateEvent(req, res, next) {
  try {
    const event = await eventService.updateEvent(req.params.eventId, req.body, req.user.userId);
    return success(res, event, 'Event updated');
  } catch (err) {
    next(err);
  }
}

async function deleteEvent(req, res, next) {
  try {
    await eventService.deleteEvent(req.params.eventId);
    return success(res, null, 'Event deleted');
  } catch (err) {
    next(err);
  }
}

module.exports = { createEvent, listEvents, getEvent, updateEvent, deleteEvent };
