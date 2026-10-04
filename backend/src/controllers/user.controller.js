// ─── User Management Controller ──────────────────────────────────────────────
// HTTP-only concerns for admin user management endpoints.
// ─────────────────────────────────────────────────────────────────────────────

const userService = require('../services/user.service');
const { success } = require('../utils/apiResponse');

/**
 * GET /api/v1/users
 */
async function listUsers(req, res, next) {
  try {
    const result = await userService.listUsers(req.query);
    return success(res, result, 'Users retrieved');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/users/:userId
 */
async function getUser(req, res, next) {
  try {
    const user = await userService.getUserById(req.params.userId);
    return success(res, user);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/v1/users/:userId/role
 */
async function changeRole(req, res, next) {
  try {
    const user = await userService.changeRole(
      req.params.userId,
      req.body.role,
      req.user.userId
    );
    return success(res, user, 'Role updated');
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/v1/users/:userId/activate
 */
async function activateUser(req, res, next) {
  try {
    const user = await userService.activateUser(req.params.userId);
    return success(res, user, 'User activated');
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/v1/users/:userId/deactivate
 */
async function deactivateUser(req, res, next) {
  try {
    const user = await userService.deactivateUser(req.params.userId);
    return success(res, user, 'User deactivated');
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/v1/users/:userId
 * PUT /api/v1/users/:userId
 */
async function updateUser(req, res, next) {
  try {
    const user = await userService.updateUser(req.params.userId, req.body);
    return success(res, user, 'User updated successfully');
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers, getUser, changeRole, activateUser, deactivateUser, updateUser };
