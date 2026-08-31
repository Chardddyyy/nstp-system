/**
 * Authentication & User Routes
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authLimiter, sensitiveActionLimiter } = require('../middleware/rateLimiter');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');
const { validate, loginValidation, registerValidation, changePasswordValidation } = require('../middleware/validationMiddleware');

// Public Auth Endpoints (Protected by Rate Limiter & Validation)
router.post('/login', authLimiter, validate(loginValidation), authController.login);
router.post('/register', authLimiter, validate(registerValidation), authController.register);

// Protected User & Session Endpoints
router.get('/auth/verify', authenticateToken, authController.verifyToken);
router.get('/users/profile', authenticateToken, authController.getProfile);
router.put('/users/profile', authenticateToken, authController.updateProfile);
router.post('/users/change-password', authenticateToken, sensitiveActionLimiter, validate(changePasswordValidation), authController.changePassword);

// Administrator User Management Endpoints
router.get('/users', authenticateToken, requireAdmin, authController.getAllUsers);

module.exports = router;
