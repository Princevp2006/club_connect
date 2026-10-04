// ─── Standardised API Response Helpers ────────────────────────────────────────

/**
 * Send a success response.
 * @param {import('express').Response} res
 * @param {object} data
 * @param {string} [message]
 * @param {number} [statusCode]
 */
function success(res, data, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    statusCode,
    message,
    data,
  });
}

/**
 * Send a created response (201).
 * @param {import('express').Response} res
 * @param {object} data
 * @param {string} [message]
 */
function created(res, data, message = 'Created') {
  return success(res, data, message, 201);
}

module.exports = { success, created };
