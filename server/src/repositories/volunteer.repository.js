// ─── Volunteer Repository ────────────────────────────────────────────────────
const prisma = require('../lib/prisma');

const applicationInclude = {
  event: {
    select: { id: true, title: true, eventDate: true, needsVolunteers: true, volunteerLimit: true },
  },
  user: {
    select: { id: true, fullName: true, email: true, role: true },
  },
  reviewedBy: {
    select: { id: true, fullName: true, email: true },
  },
};

const taskInclude = {
  event: {
    select: { id: true, title: true, eventDate: true },
  },
  volunteer: {
    select: { id: true, fullName: true, email: true },
  },
  assignedBy: {
    select: { id: true, fullName: true, email: true },
  },
};

// ── Volunteer Applications ──────────────────────────

async function createApplication(data) {
  return prisma.volunteerApplication.create({ data, include: applicationInclude });
}

async function findApplicationById(id) {
  return prisma.volunteerApplication.findUnique({ where: { id }, include: applicationInclude });
}

async function findApplicationByEventAndUser(eventId, userId) {
  return prisma.volunteerApplication.findUnique({
    where: { eventId_userId: { eventId, userId } },
    include: applicationInclude,
  });
}

async function findApplicationsByEventId(eventId) {
  return prisma.volunteerApplication.findMany({
    where: { eventId },
    include: applicationInclude,
    orderBy: { appliedAt: 'desc' },
  });
}

async function findApplicationsByUserId(userId) {
  return prisma.volunteerApplication.findMany({
    where: { userId },
    include: applicationInclude,
    orderBy: { appliedAt: 'desc' },
  });
}

async function countApprovedByEvent(eventId) {
  return prisma.volunteerApplication.count({
    where: { eventId, status: 'APPROVED' },
  });
}

async function updateApplicationById(id, data) {
  return prisma.volunteerApplication.update({ where: { id }, data, include: applicationInclude });
}

/**
 * Approve a volunteer application inside a transaction to prevent race conditions.
 * Returns the updated application or throws if limit is reached.
 */
async function approveApplicationTransactional(applicationId, reviewerId, eventId, volunteerLimit) {
  return prisma.$transaction(async (tx) => {
    // Count current approved within the transaction
    const approvedCount = await tx.volunteerApplication.count({
      where: { eventId, status: 'APPROVED' },
    });

    if (volunteerLimit !== null && approvedCount >= volunteerLimit) {
      throw Object.assign(new Error('Volunteer limit reached'), { code: 'VOLUNTEER_LIMIT_REACHED' });
    }

    return tx.volunteerApplication.update({
      where: { id: applicationId },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedById: reviewerId,
      },
      include: applicationInclude,
    });
  });
}

// ── Volunteer Tasks ─────────────────────────────────

async function createTask(data) {
  return prisma.volunteerTask.create({ data, include: taskInclude });
}

async function findTaskById(id) {
  return prisma.volunteerTask.findUnique({ where: { id }, include: taskInclude });
}

async function findTasksByEventId(eventId) {
  return prisma.volunteerTask.findMany({
    where: { eventId },
    include: taskInclude,
    orderBy: { assignedAt: 'desc' },
  });
}

async function findTasksByVolunteerId(userId) {
  return prisma.volunteerTask.findMany({
    where: { volunteerUserId: userId },
    include: taskInclude,
    orderBy: { assignedAt: 'desc' },
  });
}

async function updateTaskById(id, data) {
  return prisma.volunteerTask.update({ where: { id }, data, include: taskInclude });
}

module.exports = {
  // Applications
  createApplication,
  findApplicationById,
  findApplicationByEventAndUser,
  findApplicationsByEventId,
  findApplicationsByUserId,
  countApprovedByEvent,
  updateApplicationById,
  approveApplicationTransactional,
  // Tasks
  createTask,
  findTaskById,
  findTasksByEventId,
  findTasksByVolunteerId,
  updateTaskById,
};
