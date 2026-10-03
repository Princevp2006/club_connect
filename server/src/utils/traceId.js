// ─── Trace-ID Generator ──────────────────────────────────────────────────────
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a unique trace ID for each request.
 * @returns {string}
 */
function generateTraceId() {
  return uuidv4();
}

module.exports = { generateTraceId };
