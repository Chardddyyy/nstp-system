export function formatGradeAndSection(student) {
  if (!student) return 'BSBA-1A';
  const prog = (student.program || 'BSBA').toUpperCase().trim();
  let yr = '1';
  const yrRaw = String(student.year || student.yearLevel || '1');
  if (yrRaw.includes('1') || yrRaw.toLowerCase().includes('first')) yr = '1';
  else if (yrRaw.includes('2') || yrRaw.toLowerCase().includes('second')) yr = '2';
  else if (yrRaw.includes('3') || yrRaw.toLowerCase().includes('third')) yr = '3';
  else if (yrRaw.includes('4') || yrRaw.toLowerCase().includes('fourth')) yr = '4';

  let sec = String(student.section || 'A').toUpperCase().replace(/SECTION|SEC|\s/gi, '').trim();
  if (!sec) sec = 'A';
  return `${prog}-${yr}${sec}`;
}
