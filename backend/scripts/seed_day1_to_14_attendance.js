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
  console.log('🔄 Fetching all active students from database...');
  const [students] = await pool.execute(
    "SELECT id, studentId, name, department, section, nstp_section FROM students WHERE status = 'Active' OR status IS NULL OR status = '' ORDER BY id ASC"
  );
  console.log(`Found ${students.length} active students.`);

  if (students.length === 0) {
    console.log('No students found to seed attendance for.');
    process.exit(0);
  }

  // 1. Clear existing attendance records
  await pool.execute('TRUNCATE TABLE attendance_records');
  console.log('🧹 Cleaned existing attendance_records table.');

  const recordsToInsert = [];

  // Archetype 1: At-Risk Students (3 or more Absences to trigger matrix At-Risk indicator)
  // Indices: 2 (Daniel R. Reyes), 7 (Hazel C. Torres), 18 (Francis R. Navarro), 25 (Fatima R. Valdez), 35 (Queenie G. Ferrer)
  const atRiskIndices = new Set([2, 7, 18, 25, 35]);

  // Archetype 2: Perfect Attendance (100% Present on all 14 days)
  // Indices: 0 (Angelo D. Cruz), 5 (Fatima T. Garcia), 13 (Nicole S. Rivera), 20 (Angelo M. Mercado), 29 (Gabriel T. Manalo)
  const perfectIndices = new Set([0, 5, 13, 20, 29]);

  for (let sIdx = 0; sIdx < students.length; sIdx++) {
    const st = students[sIdx];
    const sid = String(st.studentId || st.id);
    const sName = st.name;
    const sDept = st.department || 'CWTS';
    const sSec = st.nstp_section || st.section || '1-A';

    // Determine student's persona
    const isAtRisk = atRiskIndices.has(sIdx);
    const isPerfect = perfectIndices.has(sIdx);

    // Pre-calculate specific days for non-present statuses to make attendance look organic
    // e.g. absentDays, lateDays, excusedDays, incDays
    const seed = (sIdx + 1) * 31;
    const dayOffsets = [(seed % 14) + 1, ((seed * 3) % 14) + 1, ((seed * 7) % 14) + 1, ((seed * 11) % 14) + 1, ((seed * 13) % 14) + 1];

    let absentDays = [];
    let lateDays = [];
    let excusedDays = [];
    let incDays = [];

    if (isPerfect) {
      // 100% Present - no absences, no lates
    } else if (isAtRisk) {
      // 3 to 4 absences
      absentDays = [dayOffsets[0], dayOffsets[1], dayOffsets[2]];
      if (sIdx % 2 === 0) absentDays.push(dayOffsets[3]);
      lateDays = [((dayOffsets[0] + 3) % 14) + 1];
      excusedDays = [((dayOffsets[1] + 5) % 14) + 1];
    } else {
      // Typical student:
      // 1-2 Late days
      lateDays = [dayOffsets[0]];
      if (sIdx % 3 === 0) lateDays.push(dayOffsets[1]);

      // 1 Excused day (on ~50% of students)
      if (sIdx % 2 === 0) excusedDays = [dayOffsets[2]];

      // 1 Incomplete day (on ~40% of students)
      if (sIdx % 5 !== 0) incDays = [dayOffsets[3]];

      // 0-1 Absent day (on ~30% of students, max 1 so not at risk)
      if (sIdx % 3 === 1) absentDays = [dayOffsets[4]];
    }

    for (const act of ACTIVITIES) {
      const dayNum = act.dayNum;
      const actName = act.name;
      const actDate = act.date;

      let status = 'Present';
      let scanType = 'TIME_OUT';
      let notes = 'Complete attendance (Time-In and Time-Out recorded)';

      if (absentDays.includes(dayNum)) {
        status = 'Absent';
        scanType = 'ABSENT';
        notes = 'Unexcused Absence (No scan recorded)';
      } else if (excusedDays.includes(dayNum)) {
        status = 'Excused';
        scanType = 'EXCUSED';
        notes = 'Officially excused by Instructor (Valid excuse letter / Medical)';
      } else if (incDays.includes(dayNum)) {
        status = 'Incomplete';
        scanType = 'TIME_IN';
        notes = 'Incomplete (Timed in at 08:04 AM; missed afternoon Time-Out)';
      } else if (lateDays.includes(dayNum)) {
        status = 'Late';
        scanType = 'TIME_OUT';
        notes = 'Late Attendance (Timed in at 08:24 AM - past 15-min cutoff)';
      } else {
        status = 'Present';
        scanType = 'TIME_OUT';
        notes = 'On-time complete attendance';
      }

      const timeHour = status === 'Late' ? 8 : 7;
      const timeMin = status === 'Late' ? 24 : ((sIdx * 3 + dayNum * 7) % 45 + 10);
      const timeStr = `${String(timeHour).padStart(2, '0')}:${String(timeMin).padStart(2, '0')}:22`;
      const scannedAt = `${actDate} ${timeStr}`;

      recordsToInsert.push([
        sid,
        sName,
        sDept,
        sSec,
        actName,
        scanType,
        1, // scanned_by Admin/Instructor ID
        scannedAt,
        status,
        notes
      ]);
    }
  }

  console.log(`Inserting ${recordsToInsert.length} attendance records across Days 1 to 14...`);

  // Batch insert in chunks of 100
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

  console.log(`✅ Successfully seeded ${recordsToInsert.length} randomized attendance records up to Day 14!`);

  // Print summary breakdown
  const [counts] = await pool.execute('SELECT status, COUNT(*) as count FROM attendance_records GROUP BY status');
  console.log('\n📊 Attendance Status Breakdown:');
  counts.forEach(c => console.log(`  • ${c.status}: ${c.count} records`));

  process.exit(0);
}

seedAttendance().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
