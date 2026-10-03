// ─── Role Authorization Middleware ────────────────────────────────────────────
const ApiError = require('../utils/apiError');

/**
 * Factory that returns middleware restricting access to specified roles.
 * @param  {...string} allowedRoles
 */
function requireRole(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to access this resource'));
    }

    next();
  };
}

module.exports = requireRole;
