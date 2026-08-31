/**
 * Student & Enrollment Routes
 */

const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticateToken, requireAdmin, requireAdminOrInstructor } = require('../middleware/authMiddleware');
const { validate, studentValidation, gradesValidation } = require('../middleware/validationMiddleware');

// Student Management Endpoints
router.get('/students', authenticateToken, studentController.getStudents);
router.get('/students/:id', authenticateToken, studentController.getStudentById);
router.post('/students', authenticateToken, requireAdmin, validate(studentValidation), studentController.createStudent);
router.put('/students/:id', authenticateToken, requireAdmin, studentController.updateStudent);
router.delete('/students/:id', authenticateToken, requireAdmin, studentController.deleteStudent);

// Batch Operations
router.post('/students/batch/assign-section', authenticateToken, requireAdmin, studentController.batchAssignSection);
router.post('/students/grades', authenticateToken, requireAdminOrInstructor, validate(gradesValidation), studentController.encodeGrades);

module.exports = router;
