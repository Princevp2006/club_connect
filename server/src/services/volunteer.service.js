// ─── Volunteer Service ───────────────────────────────────────────────────────
// Business logic for volunteer applications and task management.
// ─────────────────────────────────────────────────────────────────────────────

const volunteerRepo = require('../repositories/volunteer.repository');
const eventRepo = require('../repositories/event.repository');
const ApiError = require('../utils/apiError');
const { VolunteerApplicationStatus } = require('../types');

// ═══════════════════════════════════════════════════════════════════════════════
// Volunteer Applications
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Student applies to volunteer for an event.
 * Only APPROVED applications count toward volunteerLimit.
 */
async function applyToVolunteer(eventId, userId) {
  // 1. Event must exist
  const event = await eventRepo.findById(eventId);
  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  // 2. Event must need volunteers
  if (!event.needsVolunteers) {
    throw ApiError.badRequest('This event does not require volunteers');
  }

  // 3. No duplicate applications
  const existing = await volunteerRepo.findApplicationByEventAndUser(eventId, userId);
  if (existing) {
    throw ApiError.conflict('You have already applied to volunteer for this event');
  }

  // 4. Check if approved count has reached limit (deny new applications only if limit reached)
  const approvedCount = await volunteerRepo.countApprovedByEvent(eventId);
  if (event.volunteerLimit !== null && approvedCount >= event.volunteerLimit) {
    throw ApiError.conflict('Volunteer limit has been reached for this event');
  }

  // 5. Create PENDING application
  return volunteerRepo.createApplication({
    eventId,
    userId,
    status: VolunteerApplicationStatus.PENDING,
  });
}

/**
 * Get all volunteer applications for an event.
 */
async function getEventApplications(eventId) {
  const event = await eventRepo.findById(eventId);
  if (!event) {
    throw ApiError.notFound('Event not found');
  }
  return volunteerRepo.findApplicationsByEventId(eventId);
}

/**
 * Get a user's volunteer applications.
 */
async function getMyApplications(userId) {
  return volunteerRepo.findApplicationsByUserId(userId);
}

/**
 * Approve a volunteer application (ADMIN or STUDENT_LEADER).
 * Uses a transactional check to prevent exceeding volunteerLimit under concurrency.
 */
async function approveApplication(applicationId, reviewerId) {
  const application = await volunteerRepo.findApplicationById(applicationId);
  if (!application) {
    throw ApiError.notFound('Volunteer application not found');
  }

  if (application.status !== VolunteerApplicationStatus.PENDING) {
    throw ApiError.badRequest(`Cannot approve an application with status: ${application.status}`);
  }

  const event = await eventRepo.findById(application.eventId);
  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  if (!event.needsVolunteers) {
    throw ApiError.badRequest('This event no longer accepts volunteers');
  }

  try {
    return await volunteerRepo.approveApplicationTransactional(
      applicationId,
      reviewerId,
      application.eventId,
      event.volunteerLimit
    );
  } catch (err) {
    if (err.code === 'VOLUNTEER_LIMIT_REACHED') {
      throw ApiError.conflict('Volunteer limit has been reached. Cannot approve more volunteers.');
    }
    throw err;
  }
}

/**
 * Reject a volunteer application (ADMIN or STUDENT_LEADER).
 */
async function rejectApplication(applicationId, reviewerId) {
  const application = await volunteerRepo.findApplicationById(applicationId);
  if (!application) {
    throw ApiError.notFound('Volunteer application not found');
  }

  if (application.status !== VolunteerApplicationStatus.PENDING) {
    throw ApiError.badRequest(`Cannot reject an application with status: ${application.status}`);
  }

  return volunteerRepo.updateApplicationById(applicationId, {
    status: VolunteerApplicationStatus.REJECTED,
    reviewedAt: new Date(),
    reviewedById: reviewerId,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Volunteer Tasks
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a task for an approved volunteer.
 * QR_SCANNER is a task type, NOT a role.
 */
async function createTask(eventId, data, assignedById) {
  const event = await eventRepo.findById(eventId);
  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  // Verify volunteer has an APPROVED application for this event
  const application = await volunteerRepo.findApplicationByEventAndUser(eventId, data.volunteerUserId);
  if (!application || application.status !== VolunteerApplicationStatus.APPROVED) {
    throw ApiError.badRequest('Only approved volunteers can receive tasks for this event');
  }

  return volunteerRepo.createTask({
    eventId,
    volunteerUserId: data.volunteerUserId,
    assignedById,
    taskType: data.taskType,
    taskTitle: data.taskTitle,
    description: data.description || null,
    startTime: data.startTime ? new Date(data.startTime) : null,
    endTime: data.endTime ? new Date(data.endTime) : null,
    location: data.location || null,
    status: 'ASSIGNED',
  });
}

/**
 * Get tasks assigned to the authenticated user.
 */
async function getMyTasks(userId) {
  return volunteerRepo.findTasksByVolunteerId(userId);
}

/**
 * Get all tasks for an event.
 */
async function getEventTasks(eventId) {
  const event = await eventRepo.findById(eventId);
  if (!event) {
    throw ApiError.notFound('Event not found');
  }
  return volunteerRepo.findTasksByEventId(eventId);
}

/**
 * Reassign a task to a different approved volunteer.
 */
async function reassignTask(taskId, newVolunteerUserId, assignedById) {
  const task = await volunteerRepo.findTaskById(taskId);
  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  // Verify new volunteer has an APPROVED application for the same event
  const application = await volunteerRepo.findApplicationByEventAndUser(task.eventId, newVolunteerUserId);
  if (!application || application.status !== VolunteerApplicationStatus.APPROVED) {
    throw ApiError.badRequest('New assignee must be an approved volunteer for this event');
  }

  return volunteerRepo.updateTaskById(taskId, {
    volunteerUserId: newVolunteerUserId,
    assignedById,
    status: 'ASSIGNED',
  });
}

/**
 * Update task status (by the assigned volunteer).
 */
async function updateTaskStatus(taskId, status, userId) {
  const task = await volunteerRepo.findTaskById(taskId);
  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  // Only the assigned volunteer can change the status
  if (task.volunteerUserId !== userId) {
    throw ApiError.forbidden('Only the assigned volunteer can update task status');
  }

  return volunteerRepo.updateTaskById(taskId, { status });
}

module.exports = {
  applyToVolunteer,
  getEventApplications,
  getMyApplications,
  approveApplication,
  rejectApplication,
  createTask,
  getMyTasks,
  getEventTasks,
  reassignTask,
  updateTaskStatus,
};
