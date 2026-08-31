/**
 * Archive & Batch Controller
 * Handles historical semester archiving, department isolation, and batch transitions
 */

const ApiResponse = require('../utils/apiResponse');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const pool = require('../config/database');

/**
 * Get All Archived Years
 */
const getArchives = catchAsync(async (req, res) => {
  const [archives] = await pool.execute('SELECT * FROM archived_years ORDER BY year DESC').catch(() => [[]]);

  const isInstructor = req.user && req.user.role === 'instructor';
  const instructorDept = req.user?.department;

  const formatted = (archives || []).map(archive => {
    let parsedData = null;
    if (archive.data) {
      try { parsedData = typeof archive.data === 'string' ? JSON.parse(archive.data) : archive.data; } catch (_) {}
    }

    let students = archive.students || 0;
    let reports = archive.reports || 0;

    if (isInstructor && instructorDept && parsedData) {
      const sData = parsedData.studentData || [];
      const rData = parsedData.reportData || [];
      const deptStudents = sData.filter(s => s.department === instructorDept);
      const deptReports = rData.filter(r => r.department === 'All' || r.department === instructorDept);
      students = deptStudents.length;
      reports = deptReports.length;
      parsedData = {
        ...parsedData,
        students: deptStudents.length,
        reports: deptReports.length
      };
    }

    return {
      ...archive,
      students,
      reports,
      data: parsedData
    };
  });

  return ApiResponse.success(res, formatted, 'Archived batches retrieved');
});

/**
 * Get Specific Archive by Year
 */
const getArchiveByYear = catchAsync(async (req, res) => {
  const year = decodeURIComponent(req.params.year).trim();

  const [archives] = await pool.execute(
    'SELECT * FROM archived_years WHERE year = ? OR id = ? LIMIT 1',
    [year, year]
  );

  if (archives.length === 0) {
    throw new AppError('Archive record not found.', 404);
  }

  const archive = archives[0];
  let parsedData = null;
  if (archive.data) {
    try { parsedData = typeof archive.data === 'string' ? JSON.parse(archive.data) : archive.data; } catch (_) {}
  }

  const isInstructor = req.user && req.user.role === 'instructor';
  const instructorDept = req.user?.department;

  if (isInstructor && instructorDept && parsedData) {
    const sData = parsedData.studentData || [];
    const rData = parsedData.reportData || [];
    parsedData = {
      ...parsedData,
      studentData: sData.filter(s => s.department === instructorDept),
      reportData: rData.filter(r => r.department === 'All' || r.department === instructorDept)
    };
  }

  return ApiResponse.success(res, { ...archive, ...(parsedData || {}) }, 'Archive details retrieved');
});

/**
 * Create New Archive Batch
 */
const createArchive = catchAsync(async (req, res) => {
  const { year, students = 0, reports = 0, data = {}, start_month, end_month } = req.body;

  if (!year) {
    throw new AppError('Archive academic year title is required.', 400);
  }

  const payload = {
    ...data,
    start_month: start_month || data.start_month || null,
    end_month: end_month || data.end_month || null
  };

  await pool.execute(
    `INSERT INTO archived_years (year, students, reports, data)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE students = VALUES(students), reports = VALUES(reports), data = VALUES(data)`,
    [year, students, reports, JSON.stringify(payload)]
  );

  return ApiResponse.created(res, { year, students, reports }, `Batch ${year} archived successfully`);
});

/**
 * Delete Archive Batch (Admin Only)
 */
const deleteArchive = catchAsync(async (req, res) => {
  const year = decodeURIComponent(req.params.year).trim();
  await pool.execute('DELETE FROM archived_years WHERE year = ? OR id = ?', [year, year]);
  return ApiResponse.success(res, null, `Archive ${year} deleted successfully`);
});

/**
 * Get Current Active Academic Batch
 */
const getCurrentBatch = catchAsync(async (req, res) => {
  const [rows] = await pool.execute('SELECT setting_value FROM system_settings WHERE setting_key = "current_batch" LIMIT 1').catch(() => [[]]);
  const currentBatch = rows[0]?.setting_value || '2026-2027 1st Semester';
  return ApiResponse.success(res, { year: currentBatch }, 'Current batch retrieved');
});

/**
 * Update Current Active Academic Batch
 */
const updateCurrentBatch = catchAsync(async (req, res) => {
  const { year } = req.body;
  if (!year) throw new AppError('Batch name is required.', 400);

  await pool.execute(`
    INSERT INTO system_settings (setting_key, setting_value, updated_at)
    VALUES ("current_batch", ?, NOW())
    ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()
  `, [year]).catch(() => {});

  return ApiResponse.success(res, { year }, `Current batch updated to ${year}`);
});

module.exports = {
  getArchives,
  getArchiveByYear,
  createArchive,
  deleteArchive,
  getCurrentBatch,
  updateCurrentBatch
};
