/**
 * Attendance & QR Scanner Controller
 * Handles token-based student QR attendance scanning and Day 1-15 records
 */

const ApiResponse = require('../utils/apiResponse');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const pool = require('../config/database');

/**
 * Scan Student QR Token & Log Attendance
 */
const scanAttendance = catchAsync(async (req, res) => {
  const { studentId, token, sessionDate, dayNumber, remarks = 'Present' } = req.body;
  const verifiedBy = req.user?.name || 'Instructor';

  const targetId = studentId || (token ? String(token).split('-')[0] : null);
  if (!targetId) {
    throw new AppError('Valid student identifier or QR token required.', 400);
  }

  // Find student
  const [students] = await pool.execute(
    'SELECT id, studentId, name, firstName, lastName, department, program, section, nstp_section FROM students WHERE studentId = ? OR id = ? LIMIT 1',
    [targetId, targetId]
  );

  if (students.length === 0) {
    throw new AppError(`Student with ID ${targetId} not found.`, 404);
  }

  const student = students[0];
  const dateStr = sessionDate || new Date().toISOString().slice(0, 10);

  // Record attendance log
  await pool.execute(`
    INSERT INTO attendance (student_id, studentId, student_name, department, date, day_number, status, verified_by, scanned_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE status = VALUES(status), verified_by = VALUES(verified_by), scanned_at = NOW()
  `, [
    student.id,
    student.studentId,
    student.name,
    student.department,
    dateStr,
    dayNumber || 1,
    remarks,
    verifiedBy
  ]).catch(() => {});

  return ApiResponse.success(res, {
    student,
    attendance: {
      date: dateStr,
      dayNumber: dayNumber || 1,
      status: remarks,
      verifiedBy,
      scannedAt: new Date().toISOString()
    }
  }, `Attendance verified for ${student.name} (${student.department})`);
});

/**
 * Get Attendance Matrix & Records for a Department
 */
const getAttendanceMatrix = catchAsync(async (req, res) => {
  const { department = 'CWTS', semester = '1st Semester', schoolYear = '2026-2027' } = req.query;

  const [records] = await pool.execute(
    'SELECT * FROM attendance WHERE department = ? ORDER BY date DESC, student_name ASC',
    [department]
  ).catch(() => [[]]);

  return ApiResponse.success(res, records || [], 'Attendance records retrieved');
});

module.exports = {
  scanAttendance,
  getAttendanceMatrix
};
