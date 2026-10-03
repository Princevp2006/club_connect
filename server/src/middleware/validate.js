// ─── Zod Validation Middleware ────────────────────────────────────────────────
const ApiError = require('../utils/apiError');

/**
 * Validate `req[source]` against a Zod schema.
 * @param {import('zod').ZodSchema} schema
 * @param {'body'|'query'|'params'} [source='body']
 */
function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const formatted = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return next(ApiError.badRequest('Validation failed', formatted));
    }

    // Replace with parsed (and transformed) data
    req[source] = result.data;
    next();
  };
}

module.exports = validate;
