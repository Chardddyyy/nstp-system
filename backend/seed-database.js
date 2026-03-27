const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  port: 3307,
  user: 'root',
  password: '',
  database: 'nstp_system'
};

// Avatar options for fake students
const AVATAR_OPTIONS = [
  'https://i.pravatar.cc/150?img=1', 'https://i.pravatar.cc/150?img=2', 'https://i.pravatar.cc/150?img=3',
  'https://i.pravatar.cc/150?img=4', 'https://i.pravatar.cc/150?img=5', 'https://i.pravatar.cc/150?img=6',
  'https://i.pravatar.cc/150?img=7', 'https://i.pravatar.cc/150?img=8', 'https://i.pravatar.cc/150?img=9',
  'https://i.pravatar.cc/150?img=10', 'https://i.pravatar.cc/150?img=11', 'https://i.pravatar.cc/150?img=12',
  'https://i.pravatar.cc/150?img=13', 'https://i.pravatar.cc/150?img=14', 'https://i.pravatar.cc/150?img=15',
  'https://i.pravatar.cc/150?img=16', 'https://i.pravatar.cc/150?img=17', 'https://i.pravatar.cc/150?img=18',
  'https://i.pravatar.cc/150?img=19', 'https://i.pravatar.cc/150?img=20', 'https://i.pravatar.cc/150?img=21',
  'https://i.pravatar.cc/150?img=22', 'https://i.pravatar.cc/150?img=23', 'https://i.pravatar.cc/150?img=24',
  'https://i.pravatar.cc/150?img=25', 'https://i.pravatar.cc/150?img=26', 'https://i.pravatar.cc/150?img=27',
  'https://i.pravatar.cc/150?img=28', 'https://i.pravatar.cc/150?img=29', 'https://i.pravatar.cc/150?img=30',
  'https://i.pravatar.cc/150?img=31', 'https://i.pravatar.cc/150?img=32', 'https://i.pravatar.cc/150?img=33',
  'https://i.pravatar.cc/150?img=34', 'https://i.pravatar.cc/150?img=35', 'https://i.pravatar.cc/150?img=36',
  'https://i.pravatar.cc/150?img=37', 'https://i.pravatar.cc/150?img=38', 'https://i.pravatar.cc/150?img=39',
  'https://i.pravatar.cc/150?img=40', 'https://i.pravatar.cc/150?img=41', 'https://i.pravatar.cc/150?img=42',
  'https://i.pravatar.cc/150?img=43', 'https://i.pravatar.cc/150?img=44', 'https://i.pravatar.cc/150?img=45',
  'https://i.pravatar.cc/150?img=46', 'https://i.pravatar.cc/150?img=47', 'https://i.pravatar.cc/150?img=48',
  'https://i.pravatar.cc/150?img=49', 'https://i.pravatar.cc/150?img=50', 'https://i.pravatar.cc/150?img=51',
  'https://i.pravatar.cc/150?img=52', 'https://i.pravatar.cc/150?img=53', 'https://i.pravatar.cc/150?img=54',
  'https://i.pravatar.cc/150?img=55', 'https://i.pravatar.cc/150?img=56', 'https://i.pravatar.cc/150?img=57',
  'https://i.pravatar.cc/150?img=58', 'https://i.pravatar.cc/150?img=59', 'https://i.pravatar.cc/150?img=60',
  'https://i.pravatar.cc/150?img=61', 'https://i.pravatar.cc/150?img=62', 'https://i.pravatar.cc/150?img=63',
  'https://i.pravatar.cc/150?img=64', 'https://i.pravatar.cc/150?img=65', 'https://i.pravatar.cc/150?img=66',
  'https://i.pravatar.cc/150?img=67', 'https://i.pravatar.cc/150?img=68', 'https://i.pravatar.cc/150?img=69',
  'https://i.pravatar.cc/150?img=70'
];

// Fake data generators
const firstNames = [
  'Juan', 'Maria', 'Jose', 'Ana', 'Pedro', 'Carmen', 'Miguel', 'Sofia', 'Carlos', 'Isabella',
  'Antonio', 'Elena', 'Francisco', 'Lucia', 'Manuel', 'Diana', 'Roberto', 'Gabriela', 'Alberto', 'Valentina',
  'Ricardo', 'Martina', 'Fernando', 'Juliana', 'Eduardo', 'Camila', 'Jorge', 'Victoria', 'Diego', 'Natalia',
  'Alejandro', 'Daniela', 'Andres', 'Paula', 'Sergio', 'Marina', 'Hugo', 'Catalina', 'Emilio', 'Adriana',
  'Rafael', 'Luciana', 'Pablo', 'Jimena', 'Martin', 'Eva', 'Guillermo', 'Alba', 'Felipe', 'Clara'
];

const lastNames = [
  'Santos', 'Reyes', 'Cruz', 'Garcia', 'Lopez', 'Martinez', 'Rodriguez', 'Perez', 'Flores', 'Torres',
  'Rivera', 'Gomez', 'Diaz', 'Morales', 'Ortiz', 'Silva', 'Ramos', 'Ruiz', 'Medina', 'Castro',
  'Romero', 'Herrera', 'Aguilar', 'Moreno', 'Vargas', 'Mendoza', 'Guerrero', 'Contreras', 'Dominguez', 'Vega',
  'Sandoval', 'Carrillo', 'Fuentes', 'Campos', 'Soto', 'Navarro', 'Espinoza', 'Cortez', 'Delgado', 'Valdez',
  'Castillo', 'Jimenez', 'Marquez', 'Serrano', 'Rojas', 'Iglesias', 'Nuñez', 'Peña', 'Solis', 'Aguirre'
];

const courses = ['BSIT', 'BSBA', 'BSED', 'BEED', 'BSCS', 'BSN', 'BSCRIM', 'BSCE', 'BSEE', 'BSME', 'BSA', 'BSPSYCH', 'BSAGRI', 'BSFT'];
const components = ['CWTS', 'LTS', 'ROTC'];
const yearLevels = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const genders = ['Male', 'Female'];

const reportTemplates = [
  { title: 'Community Immersion Program Report', component: 'CWTS' },
  { title: 'Disaster Risk Reduction Management Training', component: 'CWTS' },
  { title: 'Environmental Clean-Up Drive Documentation', component: 'CWTS' },
  { title: 'Literacy Program for Out-of-School Youth', component: 'LTS' },
  { title: 'Tutorial Sessions for Elementary Students', component: 'LTS' },
  { title: 'Adult Literacy and Numeracy Program', component: 'LTS' },
  { title: 'Basic Military Training Progress Report', component: 'ROTC' },
  { title: 'Leadership Development Seminar Output', component: 'ROTC' },
  { title: 'Community Service and Development Project', component: 'ROTC' },
  { title: 'First Aid and Basic Life Support Training', component: 'CWTS' },
  { title: 'Values Formation and Character Development', component: 'CWTS' },
  { title: 'Health and Sanitation Awareness Campaign', component: 'CWTS' },
  { title: 'Peer Tutorial and Academic Support Program', component: 'LTS' },
  { title: 'Reading and Writing Enhancement Workshop', component: 'LTS' },
  { title: 'Community Outreach and Volunteer Service', component: 'LTS' },
  { title: 'Military Drills and Ceremonies Practice', component: 'ROTC' },
  { title: 'Civic Welfare and Disaster Preparedness', component: 'ROTC' },
  { title: 'Physical Fitness and Military Discipline', component: 'ROTC' }
];

// Track used student IDs per batch to avoid duplicates
const usedStudentIds = new Set();

function generateStudentId(year) {
  let id;
  let attempts = 0;
  do {
    // Generate unique ID: year + 4-digit sequential or random
    const suffix = String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0');
    id = `${year}${suffix}`;
    attempts++;
    // If too many attempts, use timestamp-based
    if (attempts > 100) {
      id = `${year}${String(Date.now()).slice(-4)}${Math.floor(Math.random() * 10)}`;
    }
  } while (usedStudentIds.has(id));
  
  usedStudentIds.add(id);
  return id;
}

function generateContactNumber() {
  return `09${Math.floor(Math.random() * 900000000 + 100000000)}`;
}

function generateBirthDate() {
  const year = 1998 + Math.floor(Math.random() * 6);
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function generateAddress() {
  const streets = ['Mabini St', 'Rizal Ave', 'Bonifacio St', 'Del Pilar St', 'Aguinaldo Hwy', 'Governor\'s Dr', 'Naic-Ternate Rd', 'Malainen Bago', 'Sabang', 'Sapa'];
  return `${Math.floor(Math.random() * 999) + 1} ${streets[Math.floor(Math.random() * streets.length)]}, Naic, Cavite`;
}

async function seedDatabase() {
  try {
    console.log('Connecting to database...');
    const connection = await mysql.createConnection(dbConfig);
    console.log('✓ Connected to database');

    // Clear existing student and report data (optional - remove if you want to keep existing)
    console.log('\nClearing existing student and report data...');
    await connection.execute('DELETE FROM report_submissions');
    await connection.execute('DELETE FROM reports');
    await connection.execute('DELETE FROM students');
    await connection.execute('DELETE FROM archived_years');
    console.log('✓ Existing data cleared');

    const years = [2020, 2021, 2022, 2023, 2024, 2025];
    let totalStudentsAllBatches = 0;
    let totalReportsAllBatches = 0;
    
    // Clear used IDs for new batch
    usedStudentIds.clear();
    
    for (const year of years) {
      console.log(`\n📝 Seeding data for batch ${year}...`);
      
      // Generate 350-450 students per batch (mas marami para sa analytics)
      const totalStudents = Math.floor(Math.random() * 100) + 350; // 350-450 students
      const studentsPerComponent = Math.floor(totalStudents / 3);
      
      let studentIds = [];
      let studentCount = 0;
      
      // Insert students
      for (const component of components) {
        const studentsForComponent = component === 'ROTC' ? 
          totalStudents - (studentsPerComponent * 2) : studentsPerComponent;
        
        for (let i = 0; i < studentsForComponent; i++) {
          const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
          const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
          const course = courses[Math.floor(Math.random() * courses.length)];
          const yearLevel = yearLevels[Math.floor(Math.random() * yearLevels.length)];
          const studentId = generateStudentId(year);
          const gender = genders[Math.floor(Math.random() * genders.length)];
          const avatar = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
          
          const [result] = await connection.execute(
            `INSERT INTO students (studentId, name, email, department, status, semester, schoolYear, contactNumber, address, profilePicture, gender) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              studentId,
              `${firstName} ${lastName}`,
              `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random()*999)}@cvsu.edu.ph`,
              component,
              Math.random() > 0.15 ? 'Completed' : 'Active',
              yearLevel,
              `${year}-${year + 1}`,
              generateContactNumber(),
              generateAddress(),
              avatar,
              gender
            ]
          );
          
          studentIds.push(result.insertId);
          studentCount++;
        }
      }
      
      console.log(`  ✓ Inserted ${studentCount} students with profile pictures`);
      
      // Generate 300-400 reports per batch (mas marami)
      const totalReports = Math.floor(Math.random() * 100) + 300;
      let reportCount = 0;
      
      // Get instructor IDs for created_by
      const [instructors] = await connection.execute(
        'SELECT id, department FROM users WHERE role = "instructor"'
      );
      
      for (let i = 0; i < totalReports; i++) {
        const template = reportTemplates[Math.floor(Math.random() * reportTemplates.length)];
        const instructor = instructors.find(inst => inst.department === template.component) || instructors[0];
        const status = Math.random() > 0.25 ? 'Submitted' : 'Draft';
        const dueDate = `${year}-12-${String(Math.floor(Math.random() * 15) + 15).padStart(2, '0')}`;
        
        const [result] = await connection.execute(
          `INSERT INTO reports (title, description, department, status, due_date, created_by) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            template.title,
            `This report documents the ${template.title.toLowerCase()} conducted by NSTP students during the ${year} academic year.`,
            template.component,
            status,
            dueDate,
            instructor?.id || 2
          ]
        );
        
        // Add report submissions if status is Submitted
        if (status === 'Submitted') {
          const submissionCount = Math.floor(Math.random() * 25) + 10; // 10-35 submissions per report
          
          for (let j = 0; j < submissionCount; j++) {
            const studentId = studentIds[Math.floor(Math.random() * studentIds.length)];
            const [studentData] = await connection.execute('SELECT name FROM students WHERE id = ?', [studentId]);
            const studentName = studentData[0]?.name || 'Unknown Student';
            
            const submissionMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
            const submissionDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
            const submissionDate = `${year}-${submissionMonth}-${submissionDay}`;
            
            const content = `## ${template.title} - ${year} Batch

### Submitted by: ${studentName}
### Date Submitted: ${submissionDate}

### Executive Summary
This report documents the successful implementation of ${template.title.toLowerCase()} during the Academic Year ${year}-${year + 1}. The activity was conducted in accordance with the NSTP program objectives and has achieved its intended outcomes.

### Objectives
1. To develop civic consciousness and social responsibility among students
2. To promote community welfare and development
3. To enhance leadership, teamwork, and communication skills
4. To provide practical application of NSTP concepts and principles
5. To foster patriotism and love for country

### Implementation Details

**Date and Time:** ${submissionDate}
**Venue:** Various locations in Naic, Cavite and nearby communities
**Target Beneficiaries:** Local community members, out-of-school youth, elementary students
**Number of Participants:** ${Math.floor(Math.random() * 40) + 15} NSTP students from ${template.component}

### Activities Conducted

1. **Pre-Activity Phase**
   - Site assessment and coordination with barangay officials
   - Resource mobilization and preparation of materials
   - Briefing and orientation of participating students
   - Safety and security protocols briefing

2. **Implementation Phase**
   - Actual conduct of activities as per program design
   - Supervision and monitoring by NSTP instructors
   - Documentation through photos and videos
   - Real-time adjustments based on field conditions

3. **Post-Activity Phase**
   - Evaluation and assessment of outcomes
   - Collection of feedback from beneficiaries
   - Documentation and report preparation
   - Recognition of participating students

### Results and Accomplishments

The activity successfully achieved the following outcomes:
- **Community Impact:** Directly benefited ${Math.floor(Math.random() * 100) + 50} community members
- **Student Development:** Enhanced skills in ${['leadership', 'communication', 'teamwork', 'problem-solving'][Math.floor(Math.random() * 4)]}
- **Sustainability:** Established ${Math.random() > 0.5 ? 'ongoing partnership' : 'follow-up activities'} with the community
- **Recognition:** Positive feedback from barangay officials and community leaders

### Challenges Encountered and Solutions

**Challenge 1:** Weather conditions during outdoor activities
**Solution:** Rescheduled activities and provided alternative indoor venues

**Challenge 2:** Limited resources and materials
**Solution:** Coordinated with local government units for resource augmentation

**Challenge 3:** Coordination with community members
**Solution:** Early communication and partnership with barangay officials

### Best Practices and Lessons Learned

1. Early planning and coordination is crucial for success
2. Flexibility in implementation allows for better outcomes
3. Community involvement ensures sustainability
4. Proper documentation preserves institutional memory
5. Student reflection enhances learning outcomes

### Recommendations

1. Continue similar activities in the next academic year
2. Expand coverage to more communities
3. Enhance resource mobilization strategies
4. Strengthen partnership with local government units
5. Develop monitoring and evaluation tools

### Attachments
- Activity photos (attached separately)
- Attendance sheets
- Evaluation forms
- Certificates of participation
- Letters of appreciation from beneficiaries

### Conclusion

The ${template.title} for Academic Year ${year}-${year + 1} has been successfully completed. The activity has significantly contributed to the development of responsible citizens and has made a positive impact on the community. It is recommended that similar activities be continued and enhanced in the succeeding academic years.

---
*Submitted by: ${studentName}*
*Date: ${submissionDate}*
*NSTP Component: ${template.component}*`;
            
            await connection.execute(
              `INSERT INTO report_submissions (report_id, instructor_id, content, submitted_at) 
               VALUES (?, ?, ?, ?)`,
              [result.insertId, instructor?.id || 2, content, submissionDate]
            );
          }
        }
        
        reportCount++;
      }
      
      console.log(`  ✓ Inserted ${reportCount} reports with detailed content`);
      
      // Calculate statistics
      const cwtsCount = Math.floor(studentCount * 0.33);
      const ltsCount = Math.floor(studentCount * 0.33);
      const rotcCount = studentCount - cwtsCount - ltsCount;
      const completedCount = Math.floor(studentCount * (0.80 + Math.random() * 0.15)); // 80-95% completion
      
      // Insert archive year record
      await connection.execute(
        `INSERT INTO archived_years (year, students, reports, archived_at, data) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          year,
          studentCount,
          reportCount,
          `${year + 1}-06-30 00:00:00`,
          JSON.stringify({
            year,
            students: studentCount,
            cwts: cwtsCount,
            lts: ltsCount,
            rotc: rotcCount,
            completed: completedCount,
            reports: reportCount,
            completionRate: Math.round((completedCount / studentCount) * 100),
            avgSubmissionsPerReport: Math.round((reportCount * 20) / reportCount)
          })
        ]
      );
      
      console.log(`  ✓ Archived year ${year} recorded`);
      
      totalStudentsAllBatches += studentCount;
      totalReportsAllBatches += reportCount;
    }
    
    // Update current batch
    await connection.execute(
      `INSERT INTO current_batch (id, year, started_at) 
       VALUES (1, 2025, NOW())
       ON DUPLICATE KEY UPDATE year = 2025, started_at = NOW()`
    );
    console.log('\n✓ Current batch set to 2025');
    
    console.log('\n✅ Database seeding complete!');
    console.log('\n📊 Summary:');
    console.log(`  - 6 batches (2020-2025) with 350-450 students each`);
    console.log(`  - Total of ${totalStudentsAllBatches.toLocaleString()} students across all batches`);
    console.log(`  - ${totalReportsAllBatches.toLocaleString()} reports with detailed content`);
    console.log(`  - All students have profile pictures/avatars`);
    console.log(`  - All data stored safely in MySQL database`);
    console.log('\n🖼️  Profile pictures: https://i.pravatar.cc/150 (random avatars)');
    console.log('\n📋 Sample Analytics Available:');
    console.log('  - Year-over-year student enrollment trends');
    console.log('  - CWTS/LTS/ROTC distribution per batch');
    console.log('  - Report submission rates');
    console.log('  - Component-wise completion rates');
    
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

seedDatabase();
