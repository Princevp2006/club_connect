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

module.exports = { listUsers, getUserById, changeRole, activateUser, deactivateUser };
