/**
 * Attendance Routes
 */

const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticateToken, requireAdminOrInstructor } = require('../middleware/authMiddleware');

router.post('/scan-attendance', authenticateToken, requireAdminOrInstructor, attendanceController.scanAttendance);
router.get('/attendance', authenticateToken, attendanceController.getAttendanceMatrix);

module.exports = router;
