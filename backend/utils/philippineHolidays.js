// Backend Philippine Holidays Generator & Utility
// Ensures every academic batch archive automatically has full Philippine Holidays populated

const fs = require('fs');
const path = require('path');

let CACHED_HOLIDAYS = null;

function loadPhilippineHolidays() {
  if (CACHED_HOLIDAYS) return CACHED_HOLIDAYS;
  try {
    const frontendPath = path.resolve(__dirname, '../../src/data/philippineHolidays.js');
    if (fs.existsSync(frontendPath)) {
      const raw = fs.readFileSync(frontendPath, 'utf8');
      const m = raw.match(/export const PHILIPPINE_HOLIDAYS = (\[[\s\S]*?\]);/);
      if (m) {
        CACHED_HOLIDAYS = eval(m[1]);
        return CACHED_HOLIDAYS;
      }
    }
  } catch (_) {}
  return [];
}

// Computus algorithm for Easter Sunday (Movable Holy Week in the Philippines)
function getEasterDate(year) {
  const Y = parseInt(year, 10);
  const a = Y % 19;
  const b = Math.floor(Y / 100);
  const c = Y % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Y, month - 1, day);
}

// Calculate the Last Monday of August for National Heroes Day
function getLastMondayOfAugust(year) {
  const Y = parseInt(year, 10);
  const d = new Date(Y, 7, 31); // Aug 31
  const dayOfWeek = d.getDay();
  const diff = (dayOfWeek + 7 - 1) % 7;
  const lastMondayDay = 31 - diff;
  return `${Y}-08-${String(lastMondayDay).padStart(2, '0')}`;
}

function getPhilippineHolidaysForYear(year) {
  const Y = parseInt(year, 10);
  const list = loadPhilippineHolidays();
  const curated = list.filter(h => h.date.startsWith(`${Y}-`));
  if (curated.length > 0) {
    return curated;
  }

  // Algorithmically compute standard Philippine regular & special non-working holidays for any year
  const easter = getEasterDate(Y);
  const formatDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  
  const maundyThursday = new Date(easter.getTime() - 3 * 24 * 60 * 60 * 1000);
  const goodFriday = new Date(easter.getTime() - 2 * 24 * 60 * 60 * 1000);
  const blackSaturday = new Date(easter.getTime() - 1 * 24 * 60 * 60 * 1000);
  const nationalHeroesDayStr = getLastMondayOfAugust(Y);

  return [
    { date: `${Y}-01-01`, title: "New Year's Day (Araw ng Bagong Taon)", type: 'holiday', category: 'Holiday', track: 'All Tracks', description: 'Regular Holiday nationwide' },
    { date: `${Y}-02-25`, title: 'EDSA People Power Revolution Anniversary', type: 'holiday', category: 'Holiday', track: 'All Tracks', description: 'Special Holiday nationwide' },
    { date: formatDateStr(maundyThursday), title: 'Maundy Thursday (Huwebes Santo)', type: 'holiday', category: 'Holiday', track: 'All Tracks', description: 'Regular Holiday' },
    { date: formatDateStr(goodFriday), title: 'Good Friday (Biyernes Santo)', type: 'holiday', category: 'Holiday', track: 'All Tracks', description: 'Regular Holiday' },
    { date: formatDateStr(blackSaturday), title: 'Black Saturday (Sabado de Gloria)', type: 'holiday', category: 'Holiday', track: 'All Tracks', description: 'Special Non-Working Day' },
    { date: `${Y}-04-09`, title: 'Day of Valor (Araw ng Kagitingan)', type: 'holiday', category: 'Holiday', track: 'All Tracks', description: 'Regular Holiday nationwide' },
    { date: `${Y}-05-01`, title: 'Labor Day (Araw ng Paggawa)', type: 'holiday', category: 'Holiday', track: 'All Tracks', description: 'Regular Holiday nationwide' },
    { date: `${Y}-06-12`, title: 'Independence Day (Araw ng Kalayaan)', type: 'holiday', category: 'Holiday', track: 'All Tracks', description: 'Regular Holiday nationwide' },
    { date: `${Y}-08-21`, title: 'Ninoy Aquino Day', type: 'holiday', category: 'Holiday', track: 'All Tracks', description: 'Special Non-Working Day' },
    { date: nationalHeroesDayStr, title: 'National Heroes Day (Araw ng mga Bayani)', type: 'holiday', category: 'Holiday', track: 'All Tracks', description: 'Regular Holiday (Last Monday of August)' },
    { date: `${Y}-11-01`, title: "All Saints' Day (Undas)", type: 'holiday', category: 'Holiday', track: 'All Tracks', description: 'Special Non-Working Day' },
    { date: `${Y}-11-02`, title: "All Souls' Day", type: 'holiday', category: 'Holiday', track: 'All Tracks', description: 'Special Non-Working Day' },
    { date: `${Y}-11-30`, title: 'Bonifacio Day (Araw ni Bonifacio)', type: 'holiday', category: 'Holiday', track: 'All Tracks', description: 'Regular Holiday nationwide' },
    { date: `${Y}-12-08`, title: 'Feast of the Immaculate Conception of Mary', type: 'holiday', category: 'Holiday', track: 'All Tracks', description: 'Special Non-Working Holiday' },
    { date: `${Y}-12-24`, title: 'Christmas Eve', type: 'holiday', category: 'Holiday', track: 'All Tracks', description: 'Special Non-Working Day' },
    { date: `${Y}-12-25`, title: 'Christmas Day (Araw ng Pasko)', type: 'holiday', category: 'Holiday', track: 'All Tracks', description: 'Regular Holiday nationwide' },
    { date: `${Y}-12-30`, title: 'Rizal Day (Araw ni Rizal)', type: 'holiday', category: 'Holiday', track: 'All Tracks', description: 'Regular Holiday nationwide' },
    { date: `${Y}-12-31`, title: 'Last Day of the Year', type: 'holiday', category: 'Holiday', track: 'All Tracks', description: 'Special Non-Working Day' }
  ].sort((a, b) => new Date(a.date) - new Date(b.date));
}

// Automatically get all Philippine holidays for any academic batch semester
function getPhilippineHolidaysForBatch(batchName, customStart, customEnd) {
  const name = String(batchName || '');
  const match = name.match(/(\d{4})/);
  const baseYear = match ? parseInt(match[1], 10) : new Date().getFullYear();

  let startMonth = customStart;
  let endMonth = customEnd;

  if (!startMonth || !endMonth) {
    if (name.includes('1st Sem')) {
      startMonth = `${baseYear}-08`;
      endMonth = `${baseYear}-12`;
    } else if (name.includes('2nd Sem')) {
      startMonth = `${baseYear + 1}-01`;
      endMonth = `${baseYear + 1}-05`;
    } else {
      startMonth = `${baseYear}-08`;
      endMonth = `${baseYear + 1}-05`;
    }
  }

  const cleanStart = String(startMonth).slice(0, 7);
  const cleanEnd = String(endMonth).slice(0, 7);

  const startYr = parseInt(cleanStart.split('-')[0], 10) || baseYear;
  const endYr = parseInt(cleanEnd.split('-')[0], 10) || (baseYear + 1);

  const candidateHolidays = [];
  for (let yr = startYr; yr <= endYr; yr++) {
    candidateHolidays.push(...getPhilippineHolidaysForYear(yr));
  }

  return candidateHolidays
    .filter(h => {
      const ym = h.date.slice(0, 7);
      return ym >= cleanStart && ym <= cleanEnd;
    })
    .map(h => ({
      id: `ph-hol-${h.date.replace(/-/g, '')}`,
      title: h.title,
      date: h.date,
      dept: 'All',
      track: 'All Tracks',
      category: 'Holiday',
      type: 'holiday',
      desc: h.description || 'Official Philippine National Holiday',
      description: h.description || 'Official Philippine National Holiday',
      semester: name.includes('2nd Sem') ? '2nd Semester' : '1st Semester',
      isArchived: true
    }));
}

module.exports = {
  getPhilippineHolidaysForYear,
  getPhilippineHolidaysForBatch
};
