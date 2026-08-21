// Utility to manage NSTP Online Enrollment Schedule & Status

const STORAGE_KEY = 'nstp_enrollment_schedule';
const LEGACY_KEY = 'nstp_enrollment_open';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://nstp-system.onrender.com';

export const DEFAULT_SCHEDULE = {
  mode: 'AUTO', // 'AUTO' | 'FORCE_OPEN' | 'FORCE_CLOSE'
  openAt: '',   // e.g. "2026-08-01T08:00"
  closeAt: '',  // e.g. "2026-08-31T17:00"
  academicYear: '2026-2027',
  semester: '1st Semester',
  customNotice: 'Online Enrollment for Academic Year 2026-2027 is now open.'
};

/**
 * Get saved schedule object from localStorage (immediate synchronous read)
 */
export function getEnrollmentSchedule() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_SCHEDULE, ...JSON.parse(saved) };
    }
    
    // Check legacy simple boolean toggle if present
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy !== null) {
      const isLegacyOpen = JSON.parse(legacy);
      return {
        ...DEFAULT_SCHEDULE,
        mode: isLegacyOpen ? 'FORCE_OPEN' : 'FORCE_CLOSE'
      };
    }
  } catch (_err) {
    // Return default on parse error
  }
  return { ...DEFAULT_SCHEDULE };
}

/**
 * Fetch latest schedule from server API and update local cache
 */
export async function syncEnrollmentScheduleFromServer() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/settings/enrollment`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.schedule) {
        const updated = { ...DEFAULT_SCHEDULE, ...data.schedule };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        const status = calculateEnrollmentStatus(updated);
        localStorage.setItem(LEGACY_KEY, JSON.stringify(status.isOpen));
        window.dispatchEvent(new CustomEvent('nstp_enrollment_schedule_changed', { detail: status }));
        return status;
      }
    }
  } catch (err) {
    console.warn('[Schedule Sync Notice] Using local schedule cache:', err.message);
  }
  return calculateEnrollmentStatus(getEnrollmentSchedule());
}

/**
 * Save schedule object to localStorage AND sync to server API
 */
export function saveEnrollmentSchedule(schedule, token = null) {
  const updated = { ...DEFAULT_SCHEDULE, ...schedule };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  
  // Sync legacy key for backward compatibility
  const currentStatus = calculateEnrollmentStatus(updated);
  localStorage.setItem(LEGACY_KEY, JSON.stringify(currentStatus.isOpen));

  // Trigger custom window event for real-time reactivity across components
  window.dispatchEvent(new CustomEvent('nstp_enrollment_schedule_changed', { detail: currentStatus }));

  // Asynchronously send to server if token or localStorage token available
  const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
  if (authToken) {
    fetch(`${API_BASE_URL}/api/settings/enrollment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(updated)
    }).catch(e => console.warn('[Server Schedule Save Notice]:', e.message));
  }

  return currentStatus;
}

/**
 * Calculate current enrollment status & formatted date strings
 */
export function calculateEnrollmentStatus(scheduleInput = null) {
  const schedule = scheduleInput || getEnrollmentSchedule();
  const { mode, openAt, closeAt, customNotice, academicYear, semester } = schedule;
  const now = new Date();

  const openDate = openAt ? new Date(openAt) : null;
  const closeDate = closeAt ? new Date(closeAt) : null;

  const formatDate = (d) => {
    if (!d || isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(d);
  };

  const openAtFormatted = openDate ? formatDate(openDate) : '';
  const closeAtFormatted = closeDate ? formatDate(closeDate) : '';

  // Mode 1: Force Open
  if (mode === 'FORCE_OPEN') {
    return {
      isOpen: true,
      mode: 'FORCE_OPEN',
      code: 'OPEN_MANUAL',
      headline: 'Online Enrollment is Currently OPEN',
      subtext: closeAtFormatted ? `Manual Override (Scheduled until ${closeAtFormatted})` : 'Open for student applications.',
      openAtFormatted,
      closeAtFormatted,
      customNotice,
      academicYear,
      semester,
      schedule
    };
  }

  // Mode 2: Force Close
  if (mode === 'FORCE_CLOSE') {
    return {
      isOpen: false,
      mode: 'FORCE_CLOSE',
      code: 'CLOSED_MANUAL',
      headline: 'Online Enrollment is Currently CLOSED',
      subtext: openAtFormatted ? `Scheduled to open on ${openAtFormatted}` : 'Application portal is closed by Administrator.',
      openAtFormatted,
      closeAtFormatted,
      customNotice,
      academicYear,
      semester,
      schedule
    };
  }

  // Mode 3: AUTO (Timed Schedule)
  if (openDate && !isNaN(openDate.getTime()) && now < openDate) {
    // Scheduled for future open
    return {
      isOpen: false,
      mode: 'AUTO',
      code: 'SCHEDULED_PENDING',
      headline: 'Online Enrollment Opens Soon',
      subtext: `Scheduled Opening: ${openAtFormatted}${closeAtFormatted ? ` until ${closeAtFormatted}` : ''}`,
      openAtFormatted,
      closeAtFormatted,
      customNotice,
      academicYear,
      semester,
      schedule
    };
  }

  if (closeDate && !isNaN(closeDate.getTime()) && now > closeDate) {
    // Scheduled time has passed / expired
    return {
      isOpen: false,
      mode: 'AUTO',
      code: 'SCHEDULED_EXPIRED',
      headline: 'Online Enrollment Application Closed',
      subtext: `Enrollment ended on ${closeAtFormatted}.`,
      openAtFormatted,
      closeAtFormatted,
      customNotice,
      academicYear,
      semester,
      schedule
    };
  }

  // Inside valid auto time window (or no date restrictions set)
  return {
    isOpen: true,
    mode: 'AUTO',
    code: 'OPEN_AUTO',
    headline: 'Online Enrollment is Currently OPEN',
    subtext: closeAtFormatted ? `Apply online now. Portal closes on ${closeAtFormatted}` : 'Online application portal is active.',
    openAtFormatted,
    closeAtFormatted,
    customNotice,
    academicYear,
    semester,
    schedule
  };
}
