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

async function findMany({ page = 1, limit = 10, status = '', search = '' }) {
  const where = {};

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
      { location: { contains: search } },
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
