// ─── Request Logger Middleware ────────────────────────────────────────────────
const { generateTraceId } = require('../utils/traceId');

/**
 * Attaches a unique traceId to every request and logs method + path.
 */
function requestLogger(req, res, next) {
  req.traceId = generateTraceId();

  // Attach traceId as a response header for client-side correlation
  res.setHeader('X-Trace-Id', req.traceId);

  if (process.env.NODE_ENV !== 'test') {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(
        `[${req.traceId}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`
      );
    });
  }

  next();
}

module.exports = requestLogger;
