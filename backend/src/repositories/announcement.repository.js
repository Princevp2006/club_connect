// ─── Announcement Repository ─────────────────────────────────────────────────
const prisma = require('../lib/prisma');

const announcementInclude = {
  createdBy: { select: { id: true, fullName: true, email: true, role: true } },
  targetEvent: { select: { id: true, title: true, eventDate: true } },
  recipients: {
    select: {
      userId: true,
      user: { select: { id: true, fullName: true, email: true, role: true } },
    },
  },
};

async function create({ title, content, createdById, isPublished, publishedAt, targetType, targetEventId, recipientUserIds = [] }) {
  return prisma.announcement.create({
    data: {
      title,
      content,
      createdById,
      isPublished: !!isPublished,
      publishedAt,
      targetType: targetType || 'ALL_MEMBERS',
      targetEventId: targetEventId || null,
      recipients: recipientUserIds.length > 0 ? {
        create: recipientUserIds.map((userId) => ({ userId })),
      } : undefined,
    },
    include: announcementInclude,
  });
}

async function findById(id) {
  return prisma.announcement.findUnique({ where: { id }, include: announcementInclude });
}

async function findMany({ page = 1, limit = 10, where = {} }) {
  const [data, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      include: announcementInclude,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.announcement.count({ where }),
  ]);

  return { data, total };
}

async function updateById(id, data) {
  const { recipientUserIds, ...rest } = data;
  const updateData = { ...rest };
  if (recipientUserIds !== undefined) {
    await prisma.announcementRecipient.deleteMany({ where: { announcementId: id } });
    if (recipientUserIds.length > 0) {
      updateData.recipients = {
        create: recipientUserIds.map((userId) => ({ userId })),
      };
    }
  }
  return prisma.announcement.update({ where: { id }, data: updateData, include: announcementInclude });
}

async function deleteById(id) {
  await prisma.announcementRecipient.deleteMany({ where: { announcementId: id } });
  return prisma.announcement.delete({ where: { id } });
}

async function countAll() {
  return prisma.announcement.count();
}

module.exports = { create, findById, findMany, updateById, deleteById, countAll };
