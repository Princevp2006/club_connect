// ─── Announcement Repository ─────────────────────────────────────────────────
const prisma = require('../lib/prisma');

const announcementInclude = {
  createdBy: { select: { id: true, fullName: true, email: true, role: true } },
};

async function create(data) {
  return prisma.announcement.create({ data, include: announcementInclude });
}

async function findById(id) {
  return prisma.announcement.findUnique({ where: { id }, include: announcementInclude });
}

async function findMany({ page = 1, limit = 10, publishedOnly = false }) {
  const where = {};
  if (publishedOnly) {
    where.isPublished = true;
  }

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
  return prisma.announcement.update({ where: { id }, data, include: announcementInclude });
}

async function deleteById(id) {
  return prisma.announcement.delete({ where: { id } });
}

async function countAll() {
  return prisma.announcement.count();
}

module.exports = { create, findById, findMany, updateById, deleteById, countAll };
