/**
 * Authentication & Authorization Middleware
 * Verifies JWT tokens and enforces role-based access control
 */

const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');

const JWT_SECRET = process.env.JWT_SECRET || 'nstp_jwt_super_secret_key_change_in_production_2026';

/**
 * Authenticate JWT Bearer Token
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.split(' ')[1] 
    : (req.query?.token || req.cookies?.token);

  if (!token) {
    return next(new AppError('Authentication required. Please provide a valid token.', 401, 'AUTH_REQUIRED'));
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Your session has expired. Please log in again.', 401, 'TOKEN_EXPIRED'));
      }
      return next(new AppError('Invalid authentication token.', 403, 'TOKEN_INVALID'));
    }

    req.user = decoded;
    next();
  });
};

/**
 * Optional Authentication (Attaches req.user if token is present without throwing 401)
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (!err && decoded) {
      req.user = decoded;
    }
    next();
  });
};

/**
 * Restrict to Administrator role
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new AppError('Access denied. Administrator privilege required.', 403, 'FORBIDDEN_ADMIN_ONLY'));
  }
  next();
};

/**
 * Restrict to Instructor role
 */
const requireInstructor = (req, res, next) => {
  if (!req.user || req.user.role !== 'instructor') {
    return next(new AppError('Access denied. Instructor privilege required.', 403, 'FORBIDDEN_INSTRUCTOR_ONLY'));
  }
  next();
};

/**
 * Restrict to Admin or Instructor role
 */
const requireAdminOrInstructor = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'instructor')) {
    return next(new AppError('Access denied. Faculty/Admin privilege required.', 403, 'FORBIDDEN_STAFF_ONLY'));
  }
  next();
};

module.exports = {
  JWT_SECRET,
  authenticateToken,
  optionalAuth,
  requireAdmin,
  requireInstructor,
  requireAdminOrInstructor
};
