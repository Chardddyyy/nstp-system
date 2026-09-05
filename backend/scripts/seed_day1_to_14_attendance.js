const pool = require('../config/database');

const ACTIVITIES = [
  { dayNum: 1, name: 'Day 1 - Orientation & Overview', date: '2026-06-07' },
  { dayNum: 2, name: 'Day 2 - Leadership Training', date: '2026-06-14' },
  { dayNum: 3, name: 'Day 3 - Community Profiling', date: '2026-06-21' },
  { dayNum: 4, name: 'Day 4 - Environmental Conservation', date: '2026-06-28' },
  { dayNum: 5, name: 'Day 5 - Disaster Preparedness', date: '2026-07-05' },
  { dayNum: 6, name: 'Day 6 - First Aid & Safety Drills', date: '2026-07-12' },
  { dayNum: 7, name: 'Day 7 - Health & Sanitation Drive', date: '2026-07-19' },
  { dayNum: 8, name: 'Day 8 - Literacy & Numeracy Program', date: '2026-07-26' },
  { dayNum: 9, name: 'Day 9 - Waste Management Campaign', date: '2026-08-02' },
  { dayNum: 10, name: 'Day 10 - Tree Planting Activity', date: '2026-08-09' },
  { dayNum: 11, name: 'Day 11 - Civic Consciousness Workshop', date: '2026-08-16' },
  { dayNum: 12, name: 'Day 12 - Drug Abuse Prevention Seminar', date: '2026-08-23' },
  { dayNum: 13, name: 'Day 13 - Project Planning & Development', date: '2026-08-30' },
  { dayNum: 14, name: 'Day 14 - Community Outreach Implementation', date: '2026-09-06' }
];

async function seedAttendance() {
  console.log('🔄 Fetching active students...');
  const [students] = await pool.execute(
    "SELECT id, studentId, name, department, section, nstp_section FROM students WHERE status = 'Active' OR status IS NULL OR status = '' ORDER BY id ASC"
  );
  console.log(`Found ${students.length} active students.`);

  if (students.length === 0) {
    console.log('No students found to seed attendance for.');
    process.exit(0);
  }

  // 1. Clear old generic/sample records
  await pool.execute('TRUNCATE TABLE attendance_records');
  console.log('🧹 Cleaned existing attendance_records table.');

  const recordsToInsert = [];

  // Define designated patterns for students to showcase specific scenarios:
  // - Students with 3+ Absences (At-Risk trigger):
  const atRiskStudentIds = [
    students[2]?.studentId,  // ~4 absences
    students[7]?.studentId,  // ~3 absences
    students[15]?.studentId, // ~4 absences
    students[23]?.studentId, // ~3 absences
    students[31]?.studentId  // ~5 absences
  ].filter(Boolean);

  // - Students with designated Incomplete (INC) on specific days:
  const incMap = {
    [students[1]?.studentId]: [11],
    [students[4]?.studentId]: [3],
    [students[6]?.studentId]: [14],
    [students[11]?.studentId]: [5],
    [students[17]?.studentId]: [7],
    [students[21]?.studentId]: [9]
  };

  // - Students with Excused (E) on specific days:
  const excusedMap = {
    [students[3]?.studentId]: [6],
    [students[14]?.studentId]: [9],
    [students[27]?.studentId]: [12]
  };

  // - Students with 100% Perfect Attendance (0 absences):
  const perfectStudentIds = new Set([
    students[0]?.studentId,
    students[5]?.studentId,
    students[9]?.studentId,
    students[13]?.studentId,
    students[19]?.studentId,
    students[28]?.studentId
  ].filter(Boolean));

  for (const act of ACTIVITIES) {
    const dayNum = act.dayNum;
    const actName = act.name;
    const actDate = act.date;

    for (let i = 0; i < students.length; i++) {
      const st = students[i];
      const sid = String(st.studentId || st.id);
      const sName = st.name;
      const sDept = st.department || 'CWTS';
      const sSec = st.nstp_section || st.section || 'CWTS 1';

      let status = 'Present';
      let scanType = 'TIME_OUT';
      let notes = 'Regular session completed';

      // Check At-Risk students
      if (atRiskStudentIds.includes(sid)) {
        // Drop on specific days
        if (sid === atRiskStudentIds[0] && [4, 7, 10, 13].includes(dayNum)) status = 'Absent';
        else if (sid === atRiskStudentIds[1] && [3, 8, 12].includes(dayNum)) status = 'Absent';
        else if (sid === atRiskStudentIds[2] && [2, 5, 9, 14].includes(dayNum)) status = 'Absent';
        else if (sid === atRiskStudentIds[3] && [6, 11, 13].includes(dayNum)) status = 'Absent';
        else if (sid === atRiskStudentIds[4] && [3, 4, 8, 10, 14].includes(dayNum)) status = 'Absent';
      } else if (perfectStudentIds.has(sid)) {
        status = 'Present';
      } else if (incMap[sid] && incMap[sid].includes(dayNum)) {
        status = 'Incomplete';
        scanType = 'TIME_IN';
        notes = 'Timed in at 08:04 AM; no time-out recorded';
      } else if (excusedMap[sid] && excusedMap[sid].includes(dayNum)) {
        status = 'Excused';
        scanType = 'TIME_OUT';
        notes = 'Medical certificate / Excuse letter endorsed';
      } else {
        // For general students: ~88% present, ~7% absent, ~5% late/INC
        const pseudoRand = (i * 17 + dayNum * 23) % 100;
        if (pseudoRand < 8) {
          status = 'Absent';
        } else if (pseudoRand === 12 || pseudoRand === 44) {
          status = 'Incomplete';
          scanType = 'TIME_IN';
          notes = 'Time-in recorded; missed afternoon dismissal scan';
        } else if (pseudoRand === 25 || pseudoRand === 77) {
          status = 'Excused';
          scanType = 'TIME_OUT';
          notes = 'Official Excuse Form approved by Coordinator';
        } else {
          status = 'Present';
        }
      }

      // If absent, we can either insert with status='Absent' or skip. Inserting with status='Absent' allows explicit auditing
      const timeHour = 7 + ((i + dayNum) % 3);
      const timeMin = (i * 3 + dayNum * 7) % 60;
      const timeStr = `${String(timeHour).padStart(2, '0')}:${String(timeMin).padStart(2, '0')}:15`;
      const scannedAt = `${actDate} ${timeStr}`;

      recordsToInsert.push([
        sid,
        sName,
        sDept,
        sSec,
        actName,
        scanType,
        1, // scanned_by admin/instructor
        scannedAt,
        status,
        notes
      ]);
    }
  }

  console.log(`Inserting ${recordsToInsert.length} attendance records across Days 1 to 14...`);

  // Batch insert
  const batchSize = 100;
  for (let b = 0; b < recordsToInsert.length; b += batchSize) {
    const chunk = recordsToInsert.slice(b, b + batchSize);
    const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
    const flatParams = chunk.flat();
    await pool.execute(
      `INSERT INTO attendance_records (student_id, student_name, department, section, activity_name, scan_type, scanned_by, scanned_at, status, notes) VALUES ${placeholders}`,
      flatParams
    );
  }

  console.log(`✅ Successfully seeded ${recordsToInsert.length} attendance records up to Day 14!`);
  process.exit(0);
}

seedAttendance().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
