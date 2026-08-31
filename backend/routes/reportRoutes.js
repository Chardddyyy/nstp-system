/**
 * Report & Letter Format Routes
 */

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken, requireAdmin, requireAdminOrInstructor } = require('../middleware/authMiddleware');
const { validate, reportValidation } = require('../middleware/validationMiddleware');

// Report Assignment Endpoints
router.get('/reports', authenticateToken, reportController.getReports);
router.post('/reports', authenticateToken, requireAdmin, validate(reportValidation), reportController.createReport);
router.put('/reports/:id', authenticateToken, requireAdmin, reportController.updateReport);
router.delete('/reports/:id', authenticateToken, requireAdmin, reportController.deleteReport);
router.post('/reports/:id/submit', authenticateToken, requireAdminOrInstructor, reportController.submitReport);

// Letter Format Templates
router.get('/letter-formats', authenticateToken, reportController.getLetterFormats);
router.post('/letter-formats', authenticateToken, requireAdminOrInstructor, reportController.createLetterFormat);

module.exports = router;
