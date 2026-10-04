// ─── Event Service ───────────────────────────────────────────────────────────
const prisma = require('../lib/prisma');
const eventRepo = require('../repositories/event.repository');
const ApiError = require('../utils/apiError');
const { EventStatus, UserRole } = require('../types');

/**
 * Determine lifecycle status for an event based on current time and start/end times.
 * - DRAFT events remain DRAFT until explicitly published.
 * - CANCELLED events remain CANCELLED.
 * - PUBLISHED events become ONGOING at startTime.
 * - Events become COMPLETED after endTime.
 */
function computeEventStatus(event) {
  if (!event) return event;
  if (event.status === EventStatus.DRAFT) return EventStatus.DRAFT;
  if (event.status === EventStatus.CANCELLED) return EventStatus.CANCELLED;

  const now = new Date();
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);

  if (now < start) {
    return EventStatus.PUBLISHED;
  } else if (now >= start && now <= end) {
    return EventStatus.ONGOING;
  } else {
    return EventStatus.COMPLETED;
  }
}

/**
 * Synchronize lifecycle statuses in the database for all active events.
 */
async function syncEventStatuses() {
  const now = new Date();
  await Promise.all([
    // PUBLISHED events that reached startTime become ONGOING
    prisma.event.updateMany({
      where: {
        status: EventStatus.PUBLISHED,
        startTime: { lte: now },
        endTime: { gte: now },
      },
      data: { status: EventStatus.ONGOING },
    }),
    // Active events that passed endTime become COMPLETED
    prisma.event.updateMany({
      where: {
        status: { in: [EventStatus.PUBLISHED, EventStatus.ONGOING] },
        endTime: { lt: now },
      },
      data: { status: EventStatus.COMPLETED },
    }),
  ]);
}

/**
 * Create a new event (ADMIN or STUDENT_LEADER).
 * Only DRAFT and PUBLISHED are valid initial statuses.
 * If PUBLISHED is chosen, the status is evaluated according to its start/end times.
 */
async function createEvent(data, userId) {
  const requestedStatus = data.status === EventStatus.PUBLISHED ? EventStatus.PUBLISHED : EventStatus.DRAFT;
  let initialStatus = requestedStatus;

  if (requestedStatus === EventStatus.PUBLISHED) {
    initialStatus = computeEventStatus({
      status: EventStatus.PUBLISHED,
      startTime: data.startTime,
      endTime: data.endTime,
    });
  }

  return eventRepo.create({
    title: data.title,
    description: data.description,
    eventDate: new Date(data.eventDate),
    startTime: new Date(data.startTime),
    endTime: new Date(data.endTime),
    location: data.location,
    createdById: userId,
    status: initialStatus,
    needsVolunteers: data.needsVolunteers,
    volunteerLimit: data.needsVolunteers ? data.volunteerLimit : null,
  });
}

/**
 * List events with pagination, search, status filtering, and role-based draft exclusion.
 * Draft events must never appear in student event lists or searches.
 */
async function listEvents(query, user) {
  await syncEventStatuses();

  const isStudent = user?.role === UserRole.STUDENT;
  const { data, total } = await eventRepo.findMany({
    ...query,
    isStudent,
  });
  const totalPages = Math.ceil(total / query.limit);

  return {
    data: data.map((ev) => {
      const computed = { ...ev, status: computeEventStatus(ev) };
      if (isStudent) {
        delete computed.volunteerLimit;
      }
      return computed;
    }),
    meta: { total, page: query.page, limit: query.limit, totalPages },
  };
}

/**
 * Get a single event by ID.
 * Enforces draft visibility: students receive 403 Forbidden when trying to access a draft event.
 * Hides volunteerLimit from students so volunteer operational capacity remains staff-only.
 */
async function getEventById(eventId, user) {
  const event = await eventRepo.findById(eventId);
  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  // Update lifecycle status if needed
  const computedStatus = computeEventStatus(event);
  if (computedStatus !== event.status) {
    await eventRepo.updateById(eventId, { status: computedStatus });
    event.status = computedStatus;
  }

  // Role-aware visibility: draft events are forbidden for students
  if (user?.role === UserRole.STUDENT) {
    if (event.status === EventStatus.DRAFT) {
      throw ApiError.forbidden('Draft events are not accessible to students');
    }
    const safeEvent = { ...event };
    delete safeEvent.volunteerLimit;
    return safeEvent;
  }

  return event;
}

/**
 * Update an event.
 * Handles publish, cancellation, volunteer limit updates, and schedule recomputations.
 */
async function updateEvent(eventId, data, userId) {
  const event = await eventRepo.findById(eventId);
  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  const updateData = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.eventDate !== undefined) updateData.eventDate = new Date(data.eventDate);
  if (data.startTime !== undefined) updateData.startTime = new Date(data.startTime);
  if (data.endTime !== undefined) updateData.endTime = new Date(data.endTime);
  if (data.location !== undefined) updateData.location = data.location;

  // Lifecycle status handling on update
  if (data.status !== undefined) {
    if (data.status === EventStatus.PUBLISHED) {
      updateData.status = computeEventStatus({
        status: EventStatus.PUBLISHED,
        startTime: updateData.startTime || event.startTime,
        endTime: updateData.endTime || event.endTime,
      });
    } else {
      updateData.status = data.status;
    }
  } else if (event.status !== EventStatus.DRAFT && event.status !== EventStatus.CANCELLED) {
    if (updateData.startTime || updateData.endTime) {
      updateData.status = computeEventStatus({
        status: EventStatus.PUBLISHED,
        startTime: updateData.startTime || event.startTime,
        endTime: updateData.endTime || event.endTime,
      });
    }
  }

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
      updateData.volunteerLimit = data.volunteerLimit;
    }
  }

  const updated = await eventRepo.updateById(eventId, updateData);
  return { ...updated, status: computeEventStatus(updated) };
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

module.exports = {
  createEvent,
  listEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  computeEventStatus,
  syncEventStatuses,
};
