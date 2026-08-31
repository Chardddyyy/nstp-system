/**
 * Rate Limiting Middleware
 * Protects authentication and resource-heavy endpoints from brute-force & DDoS
 */

const rateLimit = require('express-rate-limit');

/**
 * Strict Rate Limiter for Authentication Endpoints (Login, Register, Password Reset)
 * 15 requests per 15-minute window per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Max 20 attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP address. Please try again after 15 minutes.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * Moderate Rate Limiter for Sensitive Actions (Password changes, verification tokens)
 */
const sensitiveActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests for this action. Please try again after 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

/**
 * General API Rate Limiter
 * 500 requests per 1 minute window per IP
 */
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'High request volume detected. Please slow down.',
    code: 'API_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * Upload Rate Limiter (Prevent disk/cloud storage flooding)
 */
const uploadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Upload limit exceeded. Please wait a few minutes before uploading more files.',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
  }
});

module.exports = {
  authLimiter,
  sensitiveActionLimiter,
  apiLimiter,
  uploadLimiter
};
