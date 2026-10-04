// ─── Announcement Service ────────────────────────────────────────────────────
const announcementRepo = require('../repositories/announcement.repository');
const eventRepo = require('../repositories/event.repository');
const prisma = require('../lib/prisma');
const ApiError = require('../utils/apiError');
const { AnnouncementTargetType, UserRole } = require('../types');

async function createAnnouncement(data, createdById) {
  const targetType = data.targetType || AnnouncementTargetType.ALL_MEMBERS;
  let targetEventId = null;
  let recipientUserIds = [];

  if (targetType === AnnouncementTargetType.EVENT_REGISTERED_USERS) {
    if (!data.targetEventId) {
      throw ApiError.badRequest('Target event must be selected for EVENT_REGISTERED_USERS targeting');
    }
    const event = await eventRepo.findById(data.targetEventId);
    if (!event) {
      throw ApiError.notFound('Target event not found');
    }
    targetEventId = data.targetEventId;
  } else if (targetType === AnnouncementTargetType.SELECTED_MEMBERS) {
    recipientUserIds = Array.isArray(data.recipientUserIds) ? data.recipientUserIds : [];
    if (recipientUserIds.length === 0) {
      throw ApiError.badRequest('At least one recipient must be selected for SELECTED_MEMBERS targeting');
    }
  }

  return announcementRepo.create({
    title: data.title,
    content: data.content,
    createdById,
    isPublished: data.isPublished || false,
    publishedAt: data.isPublished ? new Date() : null,
    targetType,
    targetEventId,
    recipientUserIds,
  });
}

async function listAnnouncements(query, user) {
  const page = query.page || 1;
  const limit = query.limit || 10;

  // Admin users have full operational visibility across all announcements
  if (user && user.role === UserRole.ADMIN) {
    const { data, total } = await announcementRepo.findMany({
      page,
      limit,
      where: {},
    });
    const totalPages = Math.ceil(total / limit);
    return { data, meta: { total, page, limit, totalPages } };
  }

  // Non-admin users see only published announcements matching their eligibility
  const baseWhere = { isPublished: true };

  // 1. Check if user is an eligible member (has active membership or is student leader)
  let isEligibleMember = false;
  if (user) {
    if (user.role === UserRole.STUDENT_LEADER || user.role === UserRole.ADMIN) {
      isEligibleMember = true;
    } else {
      const activeMemberships = await prisma.membership.findMany({
        where: { userId: user.userId, status: 'ACTIVE' },
      });
      const now = new Date();
      isEligibleMember = activeMemberships.some((m) => {
        if (m.membershipType === 'LIFETIME') return true;
        return new Date(m.endDate) >= now;
      });
    }
  }

  // 2. Check events the user is registered for (has active ticket)
  const registeredTickets = user
    ? await prisma.eventTicket.findMany({
        where: { userId: user.userId, status: 'ACTIVE' },
        select: { eventId: true },
      })
    : [];
  const registeredEventIds = registeredTickets.map((t) => t.eventId);

  // 3. Check announcements where user is an explicitly selected recipient
  const selectedRecipients = user
    ? await prisma.announcementRecipient.findMany({
        where: { userId: user.userId },
        select: { announcementId: true },
      })
    : [];
  const selectedAnnouncementIds = selectedRecipients.map((r) => r.announcementId);

  // Assemble audience eligibility OR conditions
  const audienceConditions = [];

  // ALL_MEMBERS: only visible to eligible members
  if (isEligibleMember) {
    audienceConditions.push({ targetType: AnnouncementTargetType.ALL_MEMBERS });
  }

  // STUDENT_LEADERS: only visible to student leaders
  if (user && user.role === UserRole.STUDENT_LEADER) {
    audienceConditions.push({ targetType: AnnouncementTargetType.STUDENT_LEADERS });
  }

  // EVENT_REGISTERED_USERS: only visible to users registered for that event
  if (registeredEventIds.length > 0) {
    audienceConditions.push({
      targetType: AnnouncementTargetType.EVENT_REGISTERED_USERS,
      targetEventId: { in: registeredEventIds },
    });
  }

  // SELECTED_MEMBERS: only visible to selected users
  if (selectedAnnouncementIds.length > 0) {
    audienceConditions.push({
      targetType: AnnouncementTargetType.SELECTED_MEMBERS,
      id: { in: selectedAnnouncementIds },
    });
  }

  if (audienceConditions.length === 0) {
    return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
  }

  const where = {
    ...baseWhere,
    OR: audienceConditions,
  };

  const { data, total } = await announcementRepo.findMany({ page, limit, where });
  const totalPages = Math.ceil(total / limit);
  return { data, meta: { total, page, limit, totalPages } };
}

async function updateAnnouncement(id, data) {
  const announcement = await announcementRepo.findById(id);
  if (!announcement) throw ApiError.notFound('Announcement not found');

  const updateData = { ...data };
  if (data.isPublished && !announcement.isPublished) {
    updateData.publishedAt = new Date();
  }

  const targetType = data.targetType !== undefined ? data.targetType : announcement.targetType;
  if (targetType === AnnouncementTargetType.EVENT_REGISTERED_USERS) {
    const targetEventId = data.targetEventId !== undefined ? data.targetEventId : announcement.targetEventId;
    if (!targetEventId) {
      throw ApiError.badRequest('Target event must be selected for EVENT_REGISTERED_USERS targeting');
    }
    const event = await eventRepo.findById(targetEventId);
    if (!event) throw ApiError.notFound('Target event not found');
  }

  return announcementRepo.updateById(id, updateData);
}

async function deleteAnnouncement(id) {
  const announcement = await announcementRepo.findById(id);
  if (!announcement) throw ApiError.notFound('Announcement not found');
  return announcementRepo.deleteById(id);
}

module.exports = { createAnnouncement, listAnnouncements, updateAnnouncement, deleteAnnouncement };
