// ─── User Management Service ─────────────────────────────────────────────────
// Business logic for admin-only user management operations.
// ─────────────────────────────────────────────────────────────────────────────

const userRepo = require('../repositories/user.repository');
const ApiError = require('../utils/apiError');
const { UserRole } = require('../types');

/**
 * List users with pagination, search, and filters.
 */
async function listUsers(query) {
  const { data, total } = await userRepo.findMany(query);
  const totalPages = Math.ceil(total / query.limit);

  return {
    data,
    meta: {
      total,
      page: query.page,
      limit: query.limit,
      totalPages,
    },
  };
}

/**
 * Get a single user by ID.
 */
async function getUserById(userId) {
  const user = await userRepo.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  return user;
}

/**
 * Change a user's role.
 * Prevents removing the last active ADMIN.
 */
async function changeRole(userId, newRole, requestingUserId) {
  const user = await userRepo.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  // If demoting an ADMIN, ensure at least one active ADMIN remains
  if (user.role === UserRole.ADMIN && newRole !== UserRole.ADMIN) {
    const activeAdmins = await userRepo.countActiveAdmins();
    if (activeAdmins <= 1) {
      throw ApiError.badRequest('Cannot remove the last active admin');
    }
  }

  return userRepo.updateById(userId, { role: newRole });
}

/**
 * Activate a user account.
 */
async function activateUser(userId) {
  const user = await userRepo.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (user.isActive) {
    throw ApiError.badRequest('User is already active');
  }

  return userRepo.updateById(userId, { isActive: true });
}

/**
 * Deactivate a user account.
 * Prevents deactivating the last active ADMIN.
 */
async function deactivateUser(userId) {
  const user = await userRepo.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (!user.isActive) {
    throw ApiError.badRequest('User is already inactive');
  }

  // Prevent deactivating the last active admin
  if (user.role === UserRole.ADMIN) {
    const activeAdmins = await userRepo.countActiveAdmins();
    if (activeAdmins <= 1) {
      throw ApiError.badRequest('Cannot deactivate the last active admin');
    }
  }

  return userRepo.updateById(userId, { isActive: false });
}

/**
 * Update user / student details (ADMIN).
 * Permitted fields: fullName, email, studentId, phone, collegeName, year.
 * Prevents passwordHash and role modification.
 * Enforces email and studentId uniqueness.
 */
async function updateUser(userId, data) {
  const user = await userRepo.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const { fullName, email, studentId, phone, collegeName, year } = data;
  const updateData = {};

  if (fullName !== undefined) {
    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      throw ApiError.badRequest('Full name is required', { fullName: ['Full name is required'] });
    }
    updateData.fullName = fullName.trim();
  }

  if (email !== undefined) {
    const cleanEmail = email.toLowerCase().trim();
    if (cleanEmail !== user.email) {
      const existingEmail = await userRepo.findByEmail(cleanEmail);
      if (existingEmail && existingEmail.id !== userId) {
        throw ApiError.conflict('Email is already registered', { email: ['Email is already registered'] });
      }
    }
    updateData.email = cleanEmail;
  }

  if (studentId !== undefined) {
    const cleanStudentId = studentId && typeof studentId === 'string' ? studentId.trim() : null;
    if (cleanStudentId && cleanStudentId !== user.studentId) {
      const existingStudentId = await userRepo.findByStudentId(cleanStudentId);
      if (existingStudentId && existingStudentId.id !== userId) {
        throw ApiError.conflict('Student ID is already registered', { studentId: ['Student ID is already registered'] });
      }
    }
    updateData.studentId = cleanStudentId;
  }

  if (phone !== undefined) {
    updateData.phone = phone && typeof phone === 'string' ? phone.trim() : null;
  }

  if (collegeName !== undefined) {
    updateData.collegeName = collegeName && typeof collegeName === 'string' ? collegeName.trim() : null;
  }

  if (year !== undefined) {
    updateData.year = year && typeof year === 'string' ? year.trim() : null;
  }

  try {
    return await userRepo.updateById(userId, updateData);
  } catch (err) {
    if (err.code === 'P2002') {
      const target = String(err.meta?.target || '');
      if (target.includes('email')) {
        throw ApiError.conflict('Email is already registered', { email: ['Email is already registered'] });
      }
      if (target.includes('studentId')) {
        throw ApiError.conflict('Student ID is already registered', { studentId: ['Student ID is already registered'] });
      }
      throw ApiError.conflict('Email or Student ID is already registered');
    }
    throw err;
  }
}

module.exports = { listUsers, getUserById, changeRole, activateUser, deactivateUser, updateUser };
