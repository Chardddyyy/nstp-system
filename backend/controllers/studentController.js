/**
 * Student Controller
 * Handles student listing, pagination, creation, updates, and grades
 */

const StudentService = require('../services/studentService');
const ApiResponse = require('../utils/apiResponse');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const pool = require('../config/database');

/**
 * Get Paginated & Filtered Students
 */
const getStudents = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    search = '',
    department = '',
    section = '',
    nstpSection = '',
    schoolYear = '',
    semester = '',
    status = '',
    all = false
  } = req.query;

  // Department isolation for instructors
  let targetDept = department;
  if (req.user && req.user.role === 'instructor' && req.user.department) {
    targetDept = req.user.department;
  }

  const result = await StudentService.getStudents({
    page,
    limit,
    search,
    department: targetDept,
    section,
    nstpSection,
    schoolYear,
    semester,
    status,
    all: all === 'true' || all === true
  });

  return ApiResponse.paginated(
    res,
    result.students,
    result.page,
    result.limit,
    result.total,
    'Students retrieved successfully'
  );
});

/**
 * Get Single Student by ID
 */
const getStudentById = catchAsync(async (req, res) => {
  const student = await StudentService.getStudentById(req.params.id);
  if (!student) {
    throw new AppError('Student not found.', 404);
  }
  return ApiResponse.success(res, student, 'Student details retrieved');
});

/**
 * Register New Student
 */
const createStudent = catchAsync(async (req, res) => {
  const created = await StudentService.createStudent(req.body);
  return ApiResponse.created(res, created, 'Student registered successfully');
});

/**
 * Update Student Record
 */
const updateStudent = catchAsync(async (req, res) => {
  const studentId = req.params.id;
  const updates = req.body;

  const allowedFields = [
    'firstName', 'lastName', 'middleName', 'suffix', 'email', 'contactNumber',
    'department', 'program', 'year', 'section', 'nstp_section', 'sex', 'gender',
    'birthDate', 'street', 'municipality', 'province', 'status', 'final_grade_1',
    'final_grade_2', 'grade_sem1', 'grade_sem2', 'midterm_grade', 'final_grade', 'remarks'
  ];

  const setClauses = [];
  const params = [];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      setClauses.push(`${field} = ?`);
      params.push(updates[field]);
    }
  }

  if (setClauses.length === 0) {
    throw new AppError('No valid fields provided for update.', 400);
  }

  params.push(studentId, studentId);
  await pool.execute(
    `UPDATE students SET ${setClauses.join(', ')} WHERE id = ? OR studentId = ?`,
    params
  );

  const updated = await StudentService.getStudentById(studentId);
  return ApiResponse.success(res, updated, 'Student updated successfully');
});

/**
 * Delete Student Record
 */
const deleteStudent = catchAsync(async (req, res) => {
  const studentId = req.params.id;
  await pool.execute('DELETE FROM students WHERE id = ? OR studentId = ?', [studentId, studentId]);
  return ApiResponse.success(res, null, 'Student deleted successfully');
});

/**
 * Batch Assign NSTP Section
 */
const batchAssignSection = catchAsync(async (req, res) => {
  const { studentIds, batchNstpSection } = req.body;
  const result = await StudentService.batchAssignSection(studentIds, batchNstpSection);
  return ApiResponse.success(res, result, `Assigned ${result.updatedCount} students to section ${batchNstpSection}`);
});

/**
 * Encode / Update Student Grades
 */
const encodeGrades = catchAsync(async (req, res) => {
  const { studentId, semester = '1st Semester', schoolYear = '2026-2027', midterm_grade, final_grade, remarks } = req.body;

  if (!studentId) {
    throw new AppError('Student ID is required.', 400);
  }

  // Determine remarks if not passed
  let autoRemarks = remarks;
  if (!autoRemarks && final_grade) {
    const num = parseFloat(final_grade);
    if (!isNaN(num)) {
      autoRemarks = num <= 3.0 ? 'Passed' : 'Failed';
    } else if (final_grade.toUpperCase().includes('INC')) {
      autoRemarks = 'Incomplete';
    } else if (final_grade.toUpperCase().includes('DRP')) {
      autoRemarks = 'Dropped';
    }
  }

  // Update in student_grades table
  await pool.execute(`
    INSERT INTO student_grades (student_id, studentId, student_name, department, semester, school_year, midterm_grade, final_grade, remarks, encoded_at)
    VALUES (?, ?, '', '', ?, ?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE midterm_grade = VALUES(midterm_grade), final_grade = VALUES(final_grade), remarks = VALUES(remarks), encoded_at = NOW()
  `, [studentId, studentId, semester, schoolYear, midterm_grade || '', final_grade || '', autoRemarks || '']);

  // Sync to students table for fast queries
  const isSem1 = semester === '1st Semester';
  const gradeField = isSem1 ? 'final_grade_1' : 'final_grade_2';
  await pool.execute(
    `UPDATE students SET ${gradeField} = ?, final_grade = ?, remarks = ? WHERE id = ? OR studentId = ?`,
    [final_grade, final_grade, autoRemarks, studentId, studentId]
  );

  return ApiResponse.success(res, { studentId, semester, final_grade, remarks: autoRemarks }, 'Grade encoded successfully');
});

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  batchAssignSection,
  encodeGrades
};
