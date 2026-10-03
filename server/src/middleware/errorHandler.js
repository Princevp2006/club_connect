// ─── Global Error Handler Middleware ──────────────────────────────────────────
const ApiError = require('../utils/apiError');

/**
 * Express error-handling middleware (4-arity).
 * Normalises all errors into the standard { statusCode, message, errors, traceId } shape.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  const traceId = req.traceId || 'unknown';

  // Log the error in development
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[${traceId}]`, err);
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors,
      traceId,
    });
  }

  // Prisma known-request errors (e.g. unique constraint)
  if (err.code === 'P2002') {
    const target = err.meta?.target || 'field';
    return res.status(409).json({
      statusCode: 409,
      message: `A record with this ${target} already exists`,
      errors: null,
      traceId,
    });
  }

  // Fallback – never leak internal details in production
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error';

  return res.status(statusCode).json({
    statusCode,
    message,
    errors: null,
    traceId,
  });
}

module.exports = errorHandler;
