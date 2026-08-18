/**
 * Demo E-Signature and Logo assets for NSTP ID Card and DOCX Export
 */

// Elegant, realistic cursive signature SVG data URI in signature ink blue (#1e3a8a)
export const DEMO_COORDINATOR_SIGNATURE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 70" width="240" height="70"><path d="M15 48 C 25 15, 32 10, 42 22 C 50 32, 45 52, 60 40 C 72 30, 85 18, 98 32 C 105 39, 112 28, 122 36 C 132 44, 140 22, 155 35 C 168 45, 180 30, 195 38 C 205 42, 218 36, 230 42 M 30 54 Q 110 46 220 50" fill="none" stroke="%231e3a8a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export const COORDINATOR_NAME = "FN MI. LN";
export const COORDINATOR_TITLE = "NSTP COORDINATOR";
export const COORDINATOR_INSTITUTION = "Cavite State University Naic";

// Formats NSTP Matriculation Number: NSTP-[TRACK]-[YEAR]-[00001]
export function formatMatriculationNumber(dept = 'CWTS', index = 1, year = new Date().getFullYear()) {
  const cleanDept = (dept || 'CWTS').toUpperCase().trim();
  const padded = String(index).padStart(5, '0');
  return `NSTP-${cleanDept}-${year}-${padded}`;
}

// Formats NSTP Track Section: [TRACK]-[SEC_NUM], e.g., CWTS-1, LTS-1, ROTC-1
export function formatTrackSection(dept = 'CWTS', index = 1, studentsPerSection = 50) {
  const cleanDept = (dept || 'CWTS').toUpperCase().trim();
  const secNum = Math.floor((Math.max(1, index) - 1) / studentsPerSection) + 1;
  return `${cleanDept}-${secNum}`;
}

// Normalizes any raw section string into standardized format (e.g. "CWTS Section 1" -> "CWTS-1")
export function normalizeSectionName(sec, dept = 'CWTS') {
  if (!sec || typeof sec !== 'string') return `${(dept || 'CWTS').toUpperCase()}-1`;
  const trimmed = sec.trim();
  if (trimmed.toUpperCase().startsWith('CWTS-') || trimmed.toUpperCase().startsWith('LTS-') || trimmed.toUpperCase().startsWith('ROTC-')) {
    return trimmed.toUpperCase();
  }
  const match = trimmed.match(/(CWTS|LTS|ROTC)\s*Section\s*(\d+)/i) || trimmed.match(/(CWTS|LTS|ROTC)[-\s]*(\d+)/i);
  if (match) {
    return `${match[1].toUpperCase()}-${match[2]}`;
  }
  const numMatch = trimmed.match(/\d+/);
  if (numMatch) {
    return `${(dept || 'CWTS').toUpperCase()}-${numMatch[0]}`;
  }
  return trimmed;
}
