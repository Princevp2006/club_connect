// ─── JWT Authentication Middleware ────────────────────────────────────────────
const jwt = require('jsonwebtoken');
const config = require('../config');
const ApiError = require('../utils/apiError');

/**
 * Verify the JWT from the Authorization header and attach `req.user`.
 */
function authenticateJWT(req, _res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Missing or invalid authorization header'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      isPreMembership: !!decoded.isPreMembership,
    };

    // Restrict pre-membership tokens so they can only access subscription and profile endpoints
    if (req.user.isPreMembership) {
      const pathOnly = (req.originalUrl || req.path || '').split('?')[0];
      const allowed =
        pathOnly.endsWith('/memberships/subscribe') ||
        pathOnly.endsWith('/memberships/me') ||
        pathOnly.endsWith('/auth/me');

      if (!allowed) {
        return next(
          ApiError.forbidden(
            'Active membership required to access this resource. Please complete membership subscription.'
          )
        );
      }
    }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Token has expired'));
    }
    return next(ApiError.unauthorized('Invalid token'));
  }
}

module.exports = authenticateJWT;
