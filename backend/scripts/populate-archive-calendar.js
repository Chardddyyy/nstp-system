// Populate archive batches with authentic Philippine Holidays per semester (2012-2028)
const mysql = require('../node_modules/mysql2/promise');
const path = require('path');
const fs = require('fs');

// Read PHILIPPINE_HOLIDAYS from src/data/philippineHolidays.js
const holidaysPath = path.resolve(__dirname, '../../src/data/philippineHolidays.js');
const holidaysRaw = fs.readFileSync(holidaysPath, 'utf8');

// Parse holidays array from export
const match = holidaysRaw.match(/export const PHILIPPINE_HOLIDAYS = (\[[\s\S]*?\]);/);
if (!match) {
  console.error('Failed to parse PHILIPPINE_HOLIDAYS from src/data/philippineHolidays.js');
  process.exit(1);
}

// Evaluate cleanly
const holidaysList = eval(match[1]);
console.log(`Loaded ${holidaysList.length} total Philippine holidays (2012 - 2028).`);

async function run() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'nstp_system'
  });

  try {
    const [batches] = await connection.execute('SELECT id, year, data FROM archived_years ORDER BY id ASC');
    console.log(`Found ${batches.length} archived batches to process.`);

    let updatedCount = 0;

    for (const batch of batches) {
      const yearName = batch.year;
      let data = {};
      try {
        data = typeof batch.data === 'string' ? JSON.parse(batch.data) : (batch.data || {});
      } catch (_) {
        data = {};
      }

      // Determine semester dates
      let startStr = data.start_month || data.startMonth || data.calendar_start_date;
      let endStr = data.end_month || data.endMonth || data.calendar_end_date;

      if (!startStr || !endStr) {
        const yrMatch = yearName.match(/(\d{4})/);
        const baseYear = yrMatch ? parseInt(yrMatch[1], 10) : 2012;
        if (yearName.includes('1st Sem')) {
          startStr = `${baseYear}-08`;
          endStr = `${baseYear}-12`;
        } else if (yearName.includes('2nd Sem')) {
          startStr = `${baseYear + 1}-01`;
          endStr = `${baseYear + 1}-05`;
        } else {
          startStr = `${baseYear}-08`;
          endStr = `${baseYear + 1}-05`;
        }
      }

      const cleanStart = String(startStr).slice(0, 7);
      const cleanEnd = String(endStr).slice(0, 7);

      // Filter Philippine holidays falling within this semester's months
      const semesterHolidays = holidaysList.filter(h => {
        const monthKey = h.date.slice(0, 7);
        return monthKey >= cleanStart && monthKey <= cleanEnd;
      });

      const formattedCalendarData = semesterHolidays.map((h, idx) => ({
        id: `ph-hol-${h.date.replace(/-/g, '')}`,
        title: h.title,
        date: h.date,
        dept: 'All',
        track: 'All Tracks',
        category: 'Holiday',
        type: 'holiday',
        desc: h.description || 'Official Philippine National Holiday',
        description: h.description || 'Official Philippine National Holiday',
        semester: yearName.includes('2nd Sem') ? '2nd Semester' : '1st Semester',
        isArchived: true
      }));

      data.calendarData = formattedCalendarData;
      data.start_month = cleanStart;
      data.end_month = cleanEnd;
      data.calendar_start_date = data.calendar_start_date || `${cleanStart}-15`;
      data.calendar_end_date = data.calendar_end_date || `${cleanEnd}-20`;

      await connection.execute(
        'UPDATE archived_years SET data = ? WHERE id = ?',
        [JSON.stringify(data), batch.id]
      );

      console.log(`✓ [Batch #${batch.id}] ${yearName} (${cleanStart} to ${cleanEnd}): Seeded ${formattedCalendarData.length} Philippine holidays.`);
      updatedCount++;
    }

    console.log(`\n🎉 Success! Successfully updated ${updatedCount} archived batches with Philippine semester holidays.`);
  } finally {
    await connection.end();
  }
}

run().catch(err => {
  console.error('Error running script:', err);
  process.exit(1);
});
