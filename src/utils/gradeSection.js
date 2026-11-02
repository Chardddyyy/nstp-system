export function formatGradeAndSection(student) {
  if (!student) return 'BSIT 1-A';
  
  const rawProg = (student.program || student.course || 'BSIT').toUpperCase().trim();
  let prog = 'BSIT';
  if (rawProg.includes('INFORMATION TECHNOLOGY') || rawProg.includes('BSIT')) {
    prog = 'BSIT';
  } else if (rawProg.includes('COMPUTER SCIENCE') || rawProg.includes('BSCS')) {
    prog = 'BSCS';
  } else if (rawProg.includes('HOSPITALITY') || rawProg.includes('BSHM')) {
    prog = 'BSHM';
  } else if (rawProg.includes('BUSINESS MANAGEMENT') || rawProg.includes('BSBM')) {
    prog = 'BSBM';
  } else if (rawProg.includes('BUSINESS ADMINISTRATION') || rawProg.includes('BSBA')) {
    prog = 'BSBA';
  } else if (rawProg.includes('EDUCATION') || rawProg.includes('BSED')) {
    prog = 'BSED';
  } else if (rawProg.includes('CRIMINOLOGY') || rawProg.includes('BSCRIM')) {
    prog = 'BSCRIM';
  } else if (rawProg.length <= 6) {
    prog = rawProg;
  }

  let yr = '1';
  const yrRaw = String(student.year || student.yearLevel || '1');
  if (yrRaw.includes('1') || yrRaw.toLowerCase().includes('first')) yr = '1';
  else if (yrRaw.includes('2') || yrRaw.toLowerCase().includes('second')) yr = '2';
  else if (yrRaw.includes('3') || yrRaw.toLowerCase().includes('third')) yr = '3';
  else if (yrRaw.includes('4') || yrRaw.toLowerCase().includes('fourth')) yr = '4';

  let sec = String(student.section || 'A').toUpperCase().replace(/SECTION|SEC|\s/gi, '').trim();
  if (!sec || sec.startsWith('CWTS') || sec.startsWith('ROTC') || sec.startsWith('LTS')) {
    sec = 'A';
  }

  if (/^[1-4]-?[A-Z]$/i.test(sec)) {
    const letter = sec.slice(-1);
    return `${prog} ${yr}-${letter}`;
  }

  if (/^[A-Z]$/i.test(sec)) {
    return `${prog} ${yr}-${sec}`;
  }

  return `${prog} ${yr}-${sec.replace(/^[-_]+/, '')}`;
}

export const DEPARTMENT_SECTIONS = {
  CWTS: ['CWTS 1', 'CWTS 2', 'CWTS 3'],
  LTS: ['LTS 1', 'LTS 2', 'LTS 3'],
  ROTC: ['ROTC 1', 'ROTC 2', 'ROTC 3']
};

export function matchesAssignedSection(studentSection, assignedSection) {
  if (!assignedSection || assignedSection === 'All' || assignedSection === 'ALL') {
    return true;
  }
  if (!studentSection) return false;

  const assignedList = String(assignedSection)
    .split(',')
    .map(s => s.trim().toUpperCase().replace(/[\s_]+/g, '-'));

  const normStudent = String(studentSection).trim().toUpperCase().replace(/[\s_]+/g, '-');

  return assignedList.some(assigned => {
    if (assigned === 'ALL') return true;
    return assigned === normStudent;
  });
}

export function getStudentLastName(student) {
  if (!student) return '';
  if (student.lastName && String(student.lastName).trim()) {
    return String(student.lastName).trim();
  }
  if (student.last_name && String(student.last_name).trim()) {
    return String(student.last_name).trim();
  }
  const name = String(student.name || '').trim();
  if (name.includes(',')) {
    return name.split(',')[0].trim();
  }
  const parts = name.split(/\s+/);
  return parts.length > 0 ? parts[parts.length - 1].trim() : name;
}

export function getStudentFirstName(student) {
  if (!student) return '';
  if (student.firstName && String(student.firstName).trim()) {
    return String(student.firstName).trim();
  }
  if (student.first_name && String(student.first_name).trim()) {
    return String(student.first_name).trim();
  }
  const name = String(student.name || '').trim();
  if (name.includes(',')) {
    return name.split(',')[1]?.trim() || '';
  }
  const parts = name.split(/\s+/);
  return parts.length > 1 ? parts.slice(0, -1).join(' ').trim() : name;
}

export function compareStudentsByLastName(a, b) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;

  const lastA = getStudentLastName(a).toLowerCase();
  const lastB = getStudentLastName(b).toLowerCase();
  const cmpLast = lastA.localeCompare(lastB, undefined, { sensitivity: 'base' });
  if (cmpLast !== 0) return cmpLast;

  const firstA = getStudentFirstName(a).toLowerCase();
  const firstB = getStudentFirstName(b).toLowerCase();
  const cmpFirst = firstA.localeCompare(firstB, undefined, { sensitivity: 'base' });
  if (cmpFirst !== 0) return cmpFirst;

  const idA = String(a.studentId || a.id || '').toLowerCase();
  const idB = String(b.studentId || b.id || '').toLowerCase();
  return idA.localeCompare(idB, undefined, { numeric: true });
}

