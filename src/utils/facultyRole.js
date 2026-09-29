/**
 * Utility functions for faculty role titles and department designations.
 * In CvSU Naic NSTP:
 * - CWTS and LTS faculty are designated as "Facilitators" (e.g. "CWTS Facilitator", "LTS Facilitator")
 * - ROTC faculty are designated as "Training Staff" (e.g. "ROTC Training Staff")
 */

export function getFacultyTitle(department) {
  if (department === 'ROTC') return 'ROTC Training Staff';
  if (department === 'CWTS') return 'CWTS Facilitator';
  if (department === 'LTS') return 'LTS Facilitator';
  return 'Facilitator';
}

export function formatFacultyRole(userOrDept, role) {
  if (role === 'admin' || userOrDept?.role === 'admin') return 'System Administrator';
  const dept = typeof userOrDept === 'string' ? userOrDept : userOrDept?.department;
  if (dept === 'ROTC') return 'ROTC Training Staff';
  if (dept === 'CWTS') return 'CWTS Facilitator';
  if (dept === 'LTS') return 'LTS Facilitator';
  return 'Facilitator';
}
