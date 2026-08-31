/**
 * Report & Letter Format Controller
 * Handles report submissions, instructor department isolation, and letter templates
 */

const ApiResponse = require('../utils/apiResponse');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const pool = require('../config/database');

/**
 * Get Reports with Department Isolation
 */
const getReports = catchAsync(async (req, res) => {
  const isInstructor = req.user && req.user.role === 'instructor';
  const instructorDept = req.user?.department;

  let query = 'SELECT * FROM reports ORDER BY created_at DESC';
  const params = [];

  if (isInstructor && instructorDept && instructorDept !== 'All') {
    query = 'SELECT * FROM reports WHERE department = ? OR department = "All" ORDER BY created_at DESC';
    params.push(instructorDept);
  }

  const [reports] = await pool.execute(query, params);

  // Parse comments and submissions JSON fields cleanly
  const formatted = reports.map(r => ({
    ...r,
    submissions: typeof r.submissions === 'string' ? JSON.parse(r.submissions || '[]') : (r.submissions || []),
    comments: typeof r.comments === 'string' ? JSON.parse(r.comments || '[]') : (r.comments || [])
  }));

  return ApiResponse.success(res, formatted, 'Reports retrieved successfully');
});

/**
 * Create Report / Assignment (Admin)
 */
const createReport = catchAsync(async (req, res) => {
  const { title, description, department, due_date, reference_file_name, reference_file_data } = req.body;
  const createdBy = req.user?.name || 'Administrator';

  const [result] = await pool.execute(
    `INSERT INTO reports (
      title, description, department, created_by, due_date,
      status, reference_file_name, reference_file_data, submissions, comments, created_at
    ) VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?, '[]', '[]', NOW())`,
    [
      title.trim(),
      description || '',
      department || 'All',
      createdBy,
      due_date || null,
      reference_file_name || null,
      reference_file_data || null
    ]
  );

  const [rows] = await pool.execute('SELECT * FROM reports WHERE id = ?', [result.insertId]);
  return ApiResponse.created(res, rows[0], 'Report created successfully');
});

/**
 * Update Report
 */
const updateReport = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { title, description, department, due_date, status } = req.body;

  const updates = [];
  const params = [];

  if (title) { updates.push('title = ?'); params.push(title.trim()); }
  if (description !== undefined) { updates.push('description = ?'); params.push(description); }
  if (department) { updates.push('department = ?'); params.push(department); }
  if (due_date !== undefined) { updates.push('due_date = ?'); params.push(due_date); }
  if (status) { updates.push('status = ?'); params.push(status); }

  if (updates.length === 0) {
    throw new AppError('No valid fields to update.', 400);
  }

  params.push(id);
  await pool.execute(`UPDATE reports SET ${updates.join(', ')} WHERE id = ?`, params);

  const [rows] = await pool.execute('SELECT * FROM reports WHERE id = ?', [id]);
  return ApiResponse.success(res, rows[0], 'Report updated successfully');
});

/**
 * Delete Report
 */
const deleteReport = catchAsync(async (req, res) => {
  const { id } = req.params;
  await pool.execute('DELETE FROM reports WHERE id = ?', [id]);
  return ApiResponse.success(res, null, 'Report deleted successfully');
});

/**
 * Submit Accomplishment to Report (Instructor)
 */
const submitReport = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { notes, attachment_name, attachment_data } = req.body;
  const instructorName = req.user?.name || 'Instructor';
  const department = req.user?.department || 'CWTS';

  const [rows] = await pool.execute('SELECT * FROM reports WHERE id = ?', [id]);
  if (rows.length === 0) {
    throw new AppError('Report assignment not found.', 404);
  }

  const report = rows[0];
  const existingSubmissions = typeof report.submissions === 'string' ? JSON.parse(report.submissions || '[]') : (report.submissions || []);

  const newSubmission = {
    id: existingSubmissions.length + 1,
    instructor_id: req.user?.id,
    instructor_name: instructorName,
    department,
    notes: notes || '',
    attachment_name: attachment_name || null,
    attachment_data: attachment_data || null,
    submitted_at: new Date().toISOString(),
    status: 'Submitted'
  };

  existingSubmissions.push(newSubmission);

  await pool.execute(
    'UPDATE reports SET submissions = ?, status = "Submitted" WHERE id = ?',
    [JSON.stringify(existingSubmissions), id]
  );

  return ApiResponse.success(res, newSubmission, 'Report submitted successfully');
});

/**
 * Get Letter Formats
 */
const getLetterFormats = catchAsync(async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM letter_formats ORDER BY created_at DESC').catch(() => [[]]);
  return ApiResponse.success(res, rows || [], 'Letter formats retrieved');
});

/**
 * Create Letter Format
 */
const createLetterFormat = catchAsync(async (req, res) => {
  const { title, description, department = 'All', file } = req.body;
  const createdBy = req.user?.name || 'Administrator';

  const [result] = await pool.execute(
    'INSERT INTO letter_formats (title, description, department, created_by, file_data, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
    [title.trim(), description || '', department, createdBy, JSON.stringify(file || null)]
  );

  return ApiResponse.created(res, { id: result.insertId, title, department }, 'Letter format created');
});

module.exports = {
  getReports,
  createReport,
  updateReport,
  deleteReport,
  submitReport,
  getLetterFormats,
  createLetterFormat
};
