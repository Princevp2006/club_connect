// ─── User Repository ─────────────────────────────────────────────────────────
// Thin data-access layer – all Prisma queries for the User model live here.
// ─────────────────────────────────────────────────────────────────────────────

const prisma = require('../lib/prisma');

// Fields to select when returning user data (excludes passwordHash)
const safeUserSelect = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  studentId: true,
  phone: true,
  collegeName: true,
  year: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

/**
 * Create a new user.
 * @param {object} data
 * @returns {Promise<object>}
 */
async function create(data) {
  return prisma.user.create({
    data,
    select: safeUserSelect,
  });
}

/**
 * Find a user by email (includes passwordHash for auth).
 * @param {string} email
 * @returns {Promise<object|null>}
 */
async function findByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

/**
 * Find a user by studentId.
 * @param {string} studentId
 * @returns {Promise<object|null>}
 */
async function findByStudentId(studentId) {
  return prisma.user.findUnique({ where: { studentId } });
}

/**
 * Find a user by ID (safe – excludes passwordHash).
 * @param {string} id
 * @returns {Promise<object|null>}
 */
async function findById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: safeUserSelect,
  });
}

/**
 * List users with pagination, search, and optional role / isActive filter.
 * @param {{ page: number, limit: number, search: string, role: string, isActive?: boolean }} opts
 * @returns {Promise<{ data: object[], total: number }>}
 */
async function findMany({ page = 1, limit = 10, search = '', role = '', isActive }) {
  const where = {};

  if (search) {
    where.OR = [
      { fullName: { contains: search } },
      { email: { contains: search } },
      { studentId: { contains: search } },
    ];
  }

  if (role) {
    where.role = role;
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: safeUserSelect,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return { data, total };
}

/**
 * Update a user by ID (safe – excludes passwordHash in return).
 * @param {string} id
 * @param {object} data
 * @returns {Promise<object>}
 */
async function updateById(id, data) {
  return prisma.user.update({
    where: { id },
    data,
    select: safeUserSelect,
  });
}

/**
 * Count active admins.
 * @returns {Promise<number>}
 */
async function countActiveAdmins() {
  return prisma.user.count({
    where: { role: 'ADMIN', isActive: true },
  });
}

module.exports = {
  create,
  findByEmail,
  findByStudentId,
  findById,
  findMany,
  updateById,
  countActiveAdmins,
};
