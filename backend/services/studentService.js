/**
 * Student Service
 * High-performance query layer with pagination, filtering, and grade joins
 */

const pool = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

class StudentService {
  /**
   * Fetch paginated and filtered students with grades joined efficiently (no N+1 loops)
   */
  static async getStudents({
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
  }) {
    const conditions = [];
    const params = [];

    // Role / Department filtering
    if (department && department !== 'All') {
      conditions.push('s.department = ?');
      params.push(department);
    }

    if (section && section !== 'All') {
      conditions.push('s.section = ?');
      params.push(section);
    }

    if (nstpSection && nstpSection !== 'All') {
      conditions.push('s.nstp_section = ?');
      params.push(nstpSection);
    }

    if (schoolYear && schoolYear !== 'All') {
      conditions.push('(s.school_year = ? OR s.schoolYear = ?)');
      params.push(schoolYear, schoolYear);
    }

    if (semester && semester !== 'All') {
      conditions.push('s.semester = ?');
      params.push(semester);
    }

    if (status && status !== 'All') {
      conditions.push('s.status = ?');
      params.push(status);
    }

    // Search query (Student ID, Name, Email, Contact)
    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      conditions.push('(s.studentId LIKE ? OR s.name LIKE ? OR s.firstName LIKE ? OR s.lastName LIKE ? OR s.email LIKE ?)');
      params.push(q, q, q, q, q);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total matching records
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM students s ${whereClause}`,
      params
    );
    const total = countResult[0]?.total || 0;

    // Pagination
    const numLimit = Math.max(1, Math.min(500, Number(limit)));
    const numPage = Math.max(1, Number(page));
    const offset = (numPage - 1) * numLimit;

    // Fast Single-Query Fetch with Joined Grades (Prevents N+1 database queries)
    let query = `
      SELECT 
        s.*,
        sg1.midterm_grade as joined_midterm_1,
        sg1.final_grade as joined_final_1,
        sg1.remarks as joined_remarks_1,
        sg2.midterm_grade as joined_midterm_2,
        sg2.final_grade as joined_final_2,
        sg2.remarks as joined_remarks_2
      FROM students s
      LEFT JOIN student_grades sg1 ON (sg1.student_id = s.id AND sg1.semester = '1st Semester')
      LEFT JOIN student_grades sg2 ON (sg2.student_id = s.id AND sg2.semester = '2nd Semester')
      ${whereClause}
      ORDER BY s.lastName ASC, s.firstName ASC
    `;

    if (!all) {
      query += ` LIMIT ${numLimit} OFFSET ${offset}`;
    }

    const [rows] = await pool.execute(query, params);

    // Normalize student records
    const sanitizedRows = rows.map(st => {
      const g1 = st.final_grade_1 || st.joined_final_1 || st.grade_sem1 || (st.semester === '1st Semester' ? st.final_grade : '') || '';
      const g2 = st.final_grade_2 || st.joined_final_2 || st.grade_sem2 || (st.semester === '2nd Semester' ? st.final_grade : '') || '';
      
      return {
        ...st,
        final_grade_1: g1,
        final_grade_2: g2,
        midterm_grade: st.midterm_grade || st.joined_midterm_1 || '',
        final_grade: st.final_grade || (st.semester === '2nd Semester' ? (g2 || g1) : g1)
      };
    });

    return {
      students: sanitizedRows,
      total,
      page: numPage,
      limit: numLimit
    };
  }

  /**
   * Find single student by ID
   */
  static async getStudentById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM students WHERE id = ? OR studentId = ? LIMIT 1',
      [id, id]
    );
    return rows[0] || null;
  }

  /**
   * Create or update student
   */
  static async createStudent(data) {
    const {
      studentId, firstName, lastName, middleName = '', suffix = '',
      email, contactNumber = '', department, program, year = '1st Year',
      section = '', nstp_section = '', sex = 'Male', birthDate,
      street = '', municipality = 'Naic', province = 'Cavite',
      photo, cor_file
    } = data;

    const fullName = `${lastName}, ${firstName} ${middleName}`.trim();

    const [existing] = await pool.execute(
      'SELECT id FROM students WHERE studentId = ? LIMIT 1',
      [studentId]
    );

    if (existing.length > 0) {
      throw new AppError(`Student with ID number ${studentId} is already registered.`, 409, 'STUDENT_EXISTS');
    }

    const [result] = await pool.execute(
      `INSERT INTO students (
        studentId, firstName, lastName, middleName, suffix, name, email,
        contactNumber, department, program, year, section, nstp_section,
        sex, gender, birthDate, street, municipality, province, photo,
        cor_file, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())`,
      [
        studentId, firstName, lastName, middleName, suffix, fullName, email,
        contactNumber, department, program, year, section, nstp_section,
        sex, sex, birthDate || null, street, municipality, province, photo || null,
        cor_file || null
      ]
    );

    return { id: result.insertId, studentId, name: fullName, department };
  }

  /**
   * Batch update NSTP Section
   */
  static async batchAssignSection(studentIds = [], nstpSection) {
    if (!studentIds.length || !nstpSection) {
      throw new AppError('Student IDs and target section are required.', 400);
    }

    // Sanitize and parameterize ID placeholders
    const placeholders = studentIds.map(() => '?').join(',');
    const [result] = await pool.execute(
      `UPDATE students SET nstp_section = ? WHERE id IN (${placeholders}) OR studentId IN (${placeholders})`,
      [nstpSection, ...studentIds, ...studentIds]
    );

    return { updatedCount: result.affectedRows, nstpSection };
  }
}

module.exports = StudentService;
