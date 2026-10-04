// ─── Event Repository ────────────────────────────────────────────────────────
const prisma = require('../lib/prisma');

const eventInclude = {
  createdBy: {
    select: { id: true, fullName: true, email: true, role: true },
  },
};

async function create(data) {
  return prisma.event.create({ data, include: eventInclude });
}

async function findById(id) {
  return prisma.event.findUnique({ where: { id }, include: eventInclude });
}

async function findMany({ page = 1, limit = 10, status = '', search = '', isStudent = false }) {
  const where = {};

  if (isStudent) {
    if (status) {
      if (status === 'DRAFT') {
        return { data: [], total: 0 };
      }
      where.status = status;
    } else {
      where.status = { not: 'DRAFT' };
    }
  } else if (status) {
    where.status = status;
  }

  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { title: { contains: term } },
      { description: { contains: term } },
      { location: { contains: term } },
      { createdBy: { fullName: { contains: term } } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.event.findMany({
      where,
      include: eventInclude,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { eventDate: 'desc' },
    }),
    prisma.event.count({ where }),
  ]);

  return { data, total };
}

async function updateById(id, data) {
  return prisma.event.update({ where: { id }, data, include: eventInclude });
}

async function deleteById(id) {
  return prisma.event.delete({ where: { id } });
}

module.exports = { create, findById, findMany, updateById, deleteById };
