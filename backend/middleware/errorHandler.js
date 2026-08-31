/**
 * Centralized Global Error Handling Middleware & Custom AppError
 * Ensures no stack traces or database structures leak to clients
 */

class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Wraps asynchronous controller methods to catch unhandled rejections
 * and cleanly pass them to the global error handler via next(err)
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 Route Not Found Handler
 */
const notFoundHandler = (req, res, next) => {
  next(new AppError(`Cannot ${req.method} ${req.originalUrl} - Route not found`, 404));
};

/**
 * Global Express Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  const isDev = process.env.NODE_ENV === 'development';

  // Handle specific database and JWT error patterns
  let error = Object.assign(err, { message: err.message });

  // MySQL Duplicate entry error (ER_DUP_ENTRY)
  if (err.errno === 1062 || err.code === 'ER_DUP_ENTRY') {
    const fieldMatch = err.sqlMessage ? err.sqlMessage.match(/for key '([^']+)'/) : null;
    const field = fieldMatch ? fieldMatch[1] : 'Record';
    error = new AppError(`${field} already exists in the system.`, 409, 'DUPLICATE_ENTRY');
  }

  // MySQL Foreign Key constraint error
  if (err.errno === 1451 || err.errno === 1452 || err.code === 'ER_ROW_IS_REFERENCED_2') {
    error = new AppError('Operation violates data integrity constraints.', 400, 'INTEGRITY_CONSTRAINT');
  }

  // JWT Token Invalid
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid authentication token. Please log in again.', 401, 'INVALID_TOKEN');
  }

  // JWT Token Expired
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Your session has expired. Please log in again.', 401, 'TOKEN_EXPIRED');
  }

  // Express-validator validation error
  if (err.name === 'ValidationError' && err.errors) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors
    });
  }

  // Operational, trusted error: send clean message to client
  if (error.isOperational) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code || undefined,
      ...(isDev && { stack: error.stack })
    });
  }

  // Programming or unknown error: don't leak details in production
  console.error('🔥 [INTERNAL SERVER ERROR]:', err);

  return res.status(500).json({
    success: false,
    message: isDev ? err.message : 'An unexpected internal server error occurred.',
    ...(isDev && { stack: err.stack })
  });
};

module.exports = {
  AppError,
  catchAsync,
  notFoundHandler,
  errorHandler
};
