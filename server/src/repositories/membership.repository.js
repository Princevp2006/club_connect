// ─── Membership Repository ───────────────────────────────────────────────────
const prisma = require('../lib/prisma');

const membershipInclude = {
  user: {
    select: { id: true, fullName: true, email: true, role: true },
  },
};

async function create(data) {
  return prisma.membership.create({ data, include: membershipInclude });
}

async function findById(id) {
  return prisma.membership.findUnique({ where: { id }, include: membershipInclude });
}

async function findByUserId(userId) {
  return prisma.membership.findMany({
    where: { userId },
    include: membershipInclude,
    orderBy: { createdAt: 'desc' },
  });
}

async function findMany({ page = 1, limit = 10, status = '', userId = '' }) {
  const where = {};

  if (status) where.status = status;
  if (userId) where.userId = userId;

  const [data, total] = await Promise.all([
    prisma.membership.findMany({
      where,
      include: membershipInclude,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.membership.count({ where }),
  ]);

  return { data, total };
}

async function updateById(id, data) {
  return prisma.membership.update({ where: { id }, data, include: membershipInclude });
}

module.exports = { create, findById, findByUserId, findMany, updateById };
