// ─── Event Service ───────────────────────────────────────────────────────────
const eventRepo = require('../repositories/event.repository');
const volunteerRepo = require('../repositories/volunteer.repository');
const ApiError = require('../utils/apiError');
const { EventStatus } = require('../types');

/**
 * Create a new event (ADMIN or STUDENT_LEADER).
 */
async function createEvent(data, userId) {
  return eventRepo.create({
    title: data.title,
    description: data.description,
    eventDate: new Date(data.eventDate),
    startTime: new Date(data.startTime),
    endTime: new Date(data.endTime),
    location: data.location,
    createdById: userId,
    status: EventStatus.DRAFT,
    needsVolunteers: data.needsVolunteers,
    volunteerLimit: data.needsVolunteers ? data.volunteerLimit : null,
  });
}

/**
 * List events with pagination and filtering.
 */
async function listEvents(query) {
  const { data, total } = await eventRepo.findMany(query);
  const totalPages = Math.ceil(total / query.limit);

  return {
    data,
    meta: { total, page: query.page, limit: query.limit, totalPages },
  };
}

/**
 * Get a single event.
 */
async function getEventById(eventId) {
  const event = await eventRepo.findById(eventId);
  if (!event) {
    throw ApiError.notFound('Event not found');
  }
  return event;
}

/**
 * Update an event.
 * Preserves existing approved volunteers when lowering volunteerLimit.
 */
async function updateEvent(eventId, data, userId) {
  const event = await eventRepo.findById(eventId);
  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  // Build update payload
  const updateData = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.eventDate !== undefined) updateData.eventDate = new Date(data.eventDate);
  if (data.startTime !== undefined) updateData.startTime = new Date(data.startTime);
  if (data.endTime !== undefined) updateData.endTime = new Date(data.endTime);
  if (data.location !== undefined) updateData.location = data.location;
  if (data.status !== undefined) updateData.status = data.status;

  // Handle volunteer configuration changes
  if (data.needsVolunteers !== undefined) {
    updateData.needsVolunteers = data.needsVolunteers;
    if (!data.needsVolunteers) {
      updateData.volunteerLimit = null;
    }
  }

  if (data.volunteerLimit !== undefined) {
    const needsVols = data.needsVolunteers !== undefined ? data.needsVolunteers : event.needsVolunteers;
    if (needsVols) {
      // Allow lowering limit – existing approved volunteers are preserved,
      // but no new approvals until approved count drops below new limit.
      updateData.volunteerLimit = data.volunteerLimit;
    }
  }

  return eventRepo.updateById(eventId, updateData);
}

/**
 * Delete an event (only DRAFT events can be deleted).
 */
async function deleteEvent(eventId) {
  const event = await eventRepo.findById(eventId);
  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  if (event.status !== EventStatus.DRAFT) {
    throw ApiError.badRequest('Only DRAFT events can be deleted');
  }

  return eventRepo.deleteById(eventId);
}

module.exports = { createEvent, listEvents, getEventById, updateEvent, deleteEvent };
