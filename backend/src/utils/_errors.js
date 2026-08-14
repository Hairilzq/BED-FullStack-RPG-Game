// ⚠️ DO NOT MODIFY THIS FILE — it is part of the project infrastructure.
// It provides the AppError class, ERROR_CODES map, and the global error handler.
// Use these in your controllers: throw new AppError('NOT_FOUND', 'optional message');

/** Standard error codes used across the app. */
export const ERROR_CODES = {
  VALIDATION_ERROR: { status: 400, message: 'Validation failed' },
  NOT_FOUND: { status: 404, message: 'Resource not found' },
  DATABASE_ERROR: { status: 500, message: 'Database error' },
  INTERNAL_ERROR: { status: 500, message: 'Internal server error' },
};

/**
 * Custom error class. Throw with a code from ERROR_CODES and an optional message.
 * @example throw new AppError('NOT_FOUND', 'Task not found');
 */
export class AppError extends Error {
  /** @param {string} code - Key from ERROR_CODES.  @param {string} [details] - Custom message. */
  constructor(code, details) {
    const template = ERROR_CODES[code] || ERROR_CODES.INTERNAL_ERROR;

    super(details || template.message);

    this.code = code;
    this.status = template.status;
  }
}

/**
 * Express error-handler middleware. Register AFTER all routes.
 * Express needs all 4 params to treat this as an error handler — don't remove `next`.
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  console.error(err);

  const code = err.code && ERROR_CODES[err.code] ? err.code : 'INTERNAL_ERROR';
  const status = ERROR_CODES[code].status;
  const message = err.code && ERROR_CODES[err.code] ? err.message : ERROR_CODES.INTERNAL_ERROR.message;

  res.status(status).json({
    error: {
      code,
      message,
      status,
    },
  });
};
