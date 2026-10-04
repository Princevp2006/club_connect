// ─── Order Repository ────────────────────────────────────────────────────────
const prisma = require('../lib/prisma');

const orderInclude = {
  user: { select: { id: true, fullName: true, email: true, studentId: true } },
  product: { select: { id: true, name: true, size: true } },
};

async function create(data) {
  return prisma.merchandiseOrder.create({ data, include: orderInclude });
}

async function findById(id) {
  return prisma.merchandiseOrder.findUnique({ where: { id }, include: orderInclude });
}

async function findByUserId(userId) {
  return prisma.merchandiseOrder.findMany({
    where: { userId },
    include: orderInclude,
    orderBy: { orderedAt: 'desc' },
  });
}

async function findMany({ page = 1, limit = 10, status = '', search = '' }) {
  const where = {};
  if (status) where.status = status;

  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { id: { contains: term } },
      { user: { fullName: { contains: term } } },
      { user: { email: { contains: term } } },
      { user: { studentId: { contains: term } } },
      { product: { name: { contains: term } } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.merchandiseOrder.findMany({
      where,
      include: orderInclude,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { orderedAt: 'desc' },
    }),
    prisma.merchandiseOrder.count({ where }),
  ]);

  return { data, total };
}

async function updateById(id, data) {
  return prisma.merchandiseOrder.update({ where: { id }, data, include: orderInclude });
}

module.exports = { create, findById, findByUserId, findMany, updateById };
