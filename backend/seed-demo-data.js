const pool = require('./config/database');

async function seedData() {
  console.log('Seeding rich demo data for Messages, Archives, and Enrollments...');

  try {
    // 1. Seed Conversations & Messages
    const [existingConv] = await pool.execute("SELECT id FROM conversations WHERE is_group = 1 AND group_name = 'All Instructors'");
    let groupConvId = existingConv.length > 0 ? existingConv[0].id : 'group-all-instructors';

    if (existingConv.length === 0) {
      await pool.execute(
        "INSERT INTO conversations (id, is_group, group_name, created_by, last_message, last_message_time, last_sender_name) VALUES (?, 1, 'All Instructors', 1, 'Welcome to the NSTP System chat!', NOW(), 'Admin User')",
        [groupConvId]
      );
      for (let userId of [1, 2, 3, 4]) {
        await pool.execute(
          "INSERT IGNORE INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)",
          [groupConvId, userId]
        );
      }
    }

    // Seed direct conversation between Admin (1) and CWTS (2)
    const dmConvId = 'dm-admin-cwts';
    const [existingDM] = await pool.execute("SELECT id FROM conversations WHERE id = ?", [dmConvId]);
    if (existingDM.length === 0) {
      await pool.execute(
        "INSERT INTO conversations (id, participant_1_id, participant_2_id, is_group, last_message, last_message_time, last_sender_name) VALUES (?, 1, 2, 0, 'Please submit the CWTS quarterly report.', NOW(), 'Admin User')",
        [dmConvId]
      );
    }

    // Seed Messages
    const [msgCount] = await pool.execute("SELECT COUNT(*) as count FROM messages");
    if (msgCount[0].count === 0) {
      const sampleMessages = [
        { convId: groupConvId, senderId: 1, text: "Good day instructors! Please submit your quarterly reports by Friday." },
        { convId: groupConvId, senderId: 2, text: "Noted Admin! CWTS report is almost ready." },
        { convId: groupConvId, senderId: 3, text: "LTS department has finished student evaluation." },
        { convId: groupConvId, senderId: 4, text: "ROTC unit readiness report submitted." },
        { convId: dmConvId, senderId: 1, text: "Hello CWTS Instructor, please double check the student list for section A." },
        { convId: dmConvId, senderId: 2, text: "Yes Admin, I will review and update the records today." }
      ];

      for (let msg of sampleMessages) {
        await pool.execute(
          "INSERT INTO messages (conversation_id, sender_id, text, type, created_at) VALUES (?, ?, ?, 'text', NOW())",
          [msg.convId, msg.senderId, msg.text]
        );
      }
      console.log('✓ Messages seeded successfully');
    }

    // 2. Seed Archived Years
    const [archiveCount] = await pool.execute("SELECT COUNT(*) as count FROM archived_years");
    if (archiveCount[0].count === 0) {
      const sampleArchives = [
        {
          year: 2024,
          students: 142,
          reports: 12,
          data: JSON.stringify([
            { id: 101, studentId: '20240001', name: 'Maria Santos', department: 'CWTS', status: 'Completed', program: 'BSIT', schoolYear: '2023-2024' },
            { id: 102, studentId: '20240002', name: 'Pedro Reyes', department: 'ROTC', status: 'Completed', program: 'BSCS', schoolYear: '2023-2024' },
            { id: 103, studentId: '20240003', name: 'Ana Gomez', department: 'LTS', status: 'Completed', program: 'BSED', schoolYear: '2023-2024' }
          ])
        },
        {
          year: 2023,
          students: 128,
          reports: 10,
          data: JSON.stringify([
            { id: 201, studentId: '20230001', name: 'Carlo Mendoza', department: 'CWTS', status: 'Completed', program: 'BSBA', schoolYear: '2022-2023' },
            { id: 202, studentId: '20230002', name: 'Elena Cruz', department: 'ROTC', status: 'Completed', program: 'BEED', schoolYear: '2022-2023' }
          ])
        }
      ];

      for (let arch of sampleArchives) {
        await pool.execute(
          "INSERT INTO archived_years (year, students, reports, data) VALUES (?, ?, ?, ?)",
          [arch.year, arch.students, arch.reports, arch.data]
        );
      }
      console.log('✓ Archived years seeded successfully');
    }

    // 3. Seed Enrollments
    const [enrollmentCount] = await pool.execute("SELECT COUNT(*) as count FROM enrollments");
    if (enrollmentCount[0].count === 0) {
      const sampleEnrollments = [
        {
          student_name: 'Joshua Alcantara',
          firstName: 'Joshua',
          lastName: 'Alcantara',
          email: 'joshua.alcantara@gmail.com',
          department: 'CWTS',
          studentId: '20250010',
          contactNumber: '09171234567',
          program: 'BSIT',
          section: '1-A',
          yearLevel: '1st Year',
          status: 'Pending'
        },
        {
          student_name: 'Clarisse Dizon',
          firstName: 'Clarisse',
          lastName: 'Dizon',
          email: 'clarisse.dizon@gmail.com',
          department: 'LTS',
          studentId: '20250011',
          contactNumber: '09189876543',
          program: 'BSED',
          section: '1-B',
          yearLevel: '1st Year',
          status: 'Pending'
        }
      ];

      for (let en of sampleEnrollments) {
        await pool.execute(
          `INSERT INTO enrollments (student_name, firstName, lastName, email, department, studentId, contactNumber, program, section, yearLevel, status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [en.student_name, en.firstName, en.lastName, en.email, en.department, en.studentId, en.contactNumber, en.program, en.section, en.yearLevel, en.status]
        );
      }
      console.log('✓ Pending enrollments seeded successfully');
    }

    console.log('🎉 All demo data successfully seeded!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seedData();
