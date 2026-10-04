// ─── Auth Controller ─────────────────────────────────────────────────────────
// HTTP-only concerns: parse request, call service, send response.
// ─────────────────────────────────────────────────────────────────────────────

const jwt = require('jsonwebtoken');
const config = require('../config');
const authService = require('../services/auth.service');
const { success, created } = require('../utils/apiResponse');

/**
 * POST /api/v1/auth/register
 * Returns the created user + JWT so the frontend can auto-login.
 */
async function register(req, res, next) {
  try {
    const user = await authService.register(req.body);

    // Generate a JWT so the student is logged in immediately after registration
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return created(res, { ...user, token, user }, 'Registration successful');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/login
 */
async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    return success(res, result, 'Login successful');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/auth/me
 */
async function me(req, res, next) {
  try {
    const user = await authService.getCurrentUser(req.user.userId);
    return success(res, user);
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me };

