/**
 * Notification Role Filter
 * 
 * Strict role-based filtering for system notifications (Bell dropdown):
 * - Instructor:
 *   1. New report upload/assignment by admin (for instructor's department or 'All')
 *   2. Newly added student accepted into class roster (for instructor's department)
 *   3. New instructor or admin registered by admin
 *   4. New letter format uploaded
 *   5. Upcoming calendar events
 *   6. New calendar events added
 *   7. Reports approaching deadline (unsubmitted by instructor)
 * 
 * - Admin:
 *   1. Pending student enrollment applications
 *   2. Submitted reports by instructors
 *   3. Reports approaching deadline with missing submissions from instructors
 */

export function isNotificationAllowedForRole(notif, currentUser) {
  if (!notif || !currentUser) return false;

  const id = String(notif.id || '');
  const title = String(notif.title || '');
  const message = String(notif.message || '');
  const type = String(notif.type || '');
  const role = currentUser.role;
  const userDept = (currentUser.department || '').trim().toUpperCase();

  // Chat message notifications are handled separately in the Message icon
  if (type === 'message' || id.startsWith('msg-') || id.startsWith('conv-') || Boolean(notif.conversationId)) {
    return false;
  }

  // Purge legacy static clutter
  if (
    title.includes('Two-Factor Authentication') ||
    title.includes('QR Code Attendance') ||
    id.includes('2fa') ||
    id.includes('qr-attendance')
  ) {
    return false;
  }

  // =========================================================================
  // ADMIN RULES
  // =========================================================================
  if (role === 'admin') {
    // 1. Pending student enrollment applications
    const isPendingEnrollment =
      type === 'enrollment' ||
      id.startsWith('enrollment-') ||
      Boolean(notif.enrollmentId) ||
      title.toLowerCase().includes('enroll') ||
      message.toLowerCase().includes('enroll');

    if (isPendingEnrollment) return true;

    // 2. Report submitted by instructors
    const isReportSubmission =
      id.startsWith('submission-') ||
      title.includes('Report Submitted') ||
      title.includes('New Report Submission') ||
      message.includes('was submitted by');

    if (isReportSubmission) return true;

    // 3. Reports approaching deadline with missing submissions from instructors
    const isAdminReportDeadline =
      id.startsWith('admin-report-deadline-') ||
      title.includes('Missing Submissions') ||
      message.includes('No submission yet from:');

    if (isAdminReportDeadline) return true;

    // Admins do not see other categories in their Bell dropdown
    return false;
  }

  // =========================================================================
  // INSTRUCTOR RULES
  // =========================================================================
  if (role === 'instructor') {
    // DISALLOW Admin-only notifications
    const isAdminOnly =
      type === 'enrollment' ||
      id.startsWith('enrollment-') ||
      id.startsWith('submission-') ||
      id.startsWith('admin-report-deadline-') ||
      title.includes('Pending Enrollment') ||
      title.includes('Enrollment Application') ||
      title.includes('Report Submitted') ||
      title.includes('Missing Submissions') ||
      message.includes('No submission yet from:');

    if (isAdminOnly) return false;

    // Helper to check department match
    const checkDeptMismatch = (text) => {
      if (!userDept) return false;
      const otherDepts = ['ROTC', 'CWTS', 'LTS'].filter(d => d !== userDept);
      for (const other of otherDepts) {
        // If it specifically mentions another department and not "All" or userDept
        const mentionsOther = new RegExp(`\\b${other}\\b`, 'i').test(text);
        const mentionsMyDept = new RegExp(`\\b${userDept}\\b`, 'i').test(text);
        const mentionsAll = /\bAll\b/i.test(text);
        if (mentionsOther && !mentionsMyDept && !mentionsAll) {
          return true; // Mismatch!
        }
      }
      return false;
    };

    // 1 & 7: Report assignments and Report Deadlines
    const isReportItem = type === 'report' || id.startsWith('report-') || id.startsWith('inst-report-deadline-');
    if (isReportItem) {
      if (checkDeptMismatch(`${title} ${message} ${notif.department || ''}`)) {
        return false;
      }
      return true;
    }

    // 2: Student accepted into roster
    const isStudentItem = type === 'student' || id.startsWith('student-accepted-') || id.startsWith('student-');
    if (isStudentItem) {
      if (checkDeptMismatch(`${title} ${message} ${notif.department || ''}`)) {
        return false;
      }
      return true;
    }

    // 3: Faculty member or admin added
    const isFacultyItem =
      id.startsWith('faculty-added-') ||
      id.startsWith('user-') ||
      title.includes('Faculty Member Added') ||
      title.includes('Administrator Added') ||
      title.includes('Training Staff Registered') ||
      title.includes('Facilitator Registered');

    if (isFacultyItem) {
      // Exclude seed accounts 1 to 4
      if (id === 'user-1' || id === 'user-2' || id === 'user-3' || id === 'user-4') {
        return false;
      }
      return true;
    }

    // 4: Letter format uploaded
    const isLetterFormat =
      id.startsWith('letter-fmt-') ||
      id.startsWith('letter-') ||
      title.includes('Letter Format') ||
      title.includes('Official Format');

    if (isLetterFormat) return true;

    // 5 & 6: Calendar events (upcoming or newly added)
    const isCalendarItem = type === 'calendar' || id.startsWith('event-');
    if (isCalendarItem) return true;

    return false;
  }

  return false;
}
