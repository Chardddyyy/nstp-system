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
