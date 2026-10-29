import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, useContext, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { AuthContext } from './context/AuthContext';
import { authAPI, usersAPI, studentsAPI, reportsAPI, conversationsAPI, enrollmentsAPI, archivesAPI, callsAPI, calendarAPI, clearBatch, pingTelemetry, getPersistentVisitorId, DEFAULT_PAST_BATCHES } from './services/api';
import { initSocket, disconnectSocket, getSocket } from './services/socket';

// Direct Page Imports for Guaranteed 0-404 Deployments across all devices
import Landing from './pages/Landing';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import StudentManagement from './pages/StudentManagement';
import Reports from './pages/Reports';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Calendar from './pages/Calendar';
import Enrollment from './pages/Enrollment';
import LetterFormats from './pages/LetterFormats';
import GoogleDrive from './pages/GoogleDrive';
import DigitalIdViewer from './pages/DigitalIdViewer';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import { isNotificationAllowedForRole } from './utils/notificationFilter';

const BASE_PATH = (() => {
  const pathname = window.location.pathname.toLowerCase();
  if (pathname.startsWith('/nstp-system')) return '/nstp-system';
  const envBase = import.meta.env.BASE_URL || '/';
  return envBase === '/' ? '' : envBase.replace(/\/$/, '');
})();

const BASE_URL_WITH_SLASH = BASE_PATH ? (BASE_PATH.endsWith('/') ? BASE_PATH : BASE_PATH + '/') : '/';

// Auto-normalize GitHub Pages hash routes or direct ID query links before router starts
(() => {
  try {
    const l = window.location;
    const hash = l.hash || '';
    if (hash.startsWith('#/digital-id') || hash.startsWith('#/id-card') || hash.startsWith('#/enrollment') || hash.startsWith('#/login')) {
      const hashContent = hash.slice(2);
      const [routePart, queryPart] = hashContent.split('?');
      const target = `${BASE_URL_WITH_SLASH}${routePart}${queryPart ? '?' + queryPart : ''}`;
      window.history.replaceState(null, null, target);
    } else if (l.search && (l.search.includes('view=digital-id') || l.search.includes('page=digital-id') || (l.search.includes('id=') && (l.search.includes('dept=') || l.search.includes('download='))))) {
      if (!l.pathname.includes('/digital-id')) {
        const cleanSearch = l.search.replace('view=digital-id&', '').replace('page=digital-id&', '');
        window.history.replaceState(null, null, `${BASE_URL_WITH_SLASH}digital-id${cleanSearch}`);
      }
    }
  } catch (_) {}
})();

// Defined OUTSIDE App so its reference never changes between re-renders, preventing
// React from unmounting+remounting page children on every polling tick.
function ProtectedRoute({ children, allowedRoles }) {
  const { loading, user } = useContext(AuthContext);
  const token = typeof window !== 'undefined' ? localStorage.getItem('nstp_token') : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying security credentials...</p>
        </div>
      </div>
    );
  }

  // Strictly require BOTH active user in memory and an unexpired JWT token in storage
  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/instructor/dashboard'} replace />;
  }
  return children;
}

const POLL_INTERVAL_MS = 8000;

function safeSetStorage(key, value) {
  try {
    if (key === 'nstp_cached_messages' && value && typeof value === 'object') {
      const sanitized = {};
      for (const convId in value) {
        if (Array.isArray(value[convId])) {
          sanitized[convId] = value[convId].slice(-30).map(msg => {
            const copy = { ...msg };
            if (copy.imageUrl?.startsWith('data:')) copy.imageUrl = null;
            if (copy.image_url?.startsWith('data:')) copy.image_url = null;
            if (copy.file_url?.startsWith('data:')) copy.file_url = null;
            return copy;
          });
        }
      }
      localStorage.setItem(key, JSON.stringify(sanitized));
    } else {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    }
  } catch (e) {
    console.warn(`[Storage] Storage quota exceeded for ${key}, skipping local cache:`, e);
  }
}

function getNotificationStorageKey(userOrRole, maybeId) {
  if (typeof userOrRole === 'object' && userOrRole !== null) {
    const role = userOrRole.role || 'user';
    const uid = userOrRole.id ? `_${userOrRole.id}` : '';
    return `nstp_notifications_${role}${uid}`;
  }
  const role = userOrRole || 'admin';
  const uid = maybeId ? `_${maybeId}` : '';
  return `nstp_notifications_${role}${uid}`;
}

function getDismissedStorageKey(userOrRole, maybeId) {
  if (typeof userOrRole === 'object' && userOrRole !== null) {
    const role = userOrRole.role || 'user';
    const uid = userOrRole.id ? `_${userOrRole.id}` : '';
    return `nstp_dismissed_notifications_${role}${uid}`;
  }
  const role = userOrRole || 'admin';
  const uid = maybeId ? `_${maybeId}` : '';
  return `nstp_dismissed_notifications_${role}${uid}`;
}

function getSeenEntitiesStorageKey(userOrRole, maybeId) {
  if (typeof userOrRole === 'object' && userOrRole !== null) {
    const role = userOrRole.role || 'user';
    const uid = userOrRole.id ? `_${userOrRole.id}` : '';
    return `nstp_seen_entities_${role}${uid}`;
  }
  const role = userOrRole || 'admin';
  const uid = maybeId ? `_${maybeId}` : '';
  return `nstp_seen_entities_${role}${uid}`;
}

function getReadNotificationsStorageKey(userOrRole, maybeId) {
  if (typeof userOrRole === 'object' && userOrRole !== null) {
    const role = userOrRole.role || 'user';
    const uid = userOrRole.id ? `_${userOrRole.id}` : '';
    return `nstp_read_notifications_${role}${uid}`;
  }
  const role = userOrRole || 'admin';
  const uid = maybeId ? `_${maybeId}` : '';
  return `nstp_read_notifications_${role}${uid}`;
}

function getReadConversationsKey(userOrRole, maybeId) {
  if (typeof userOrRole === 'object' && userOrRole !== null) {
    const uid = userOrRole.id ? `_${userOrRole.id}` : '';
    return `nstp_read_conversations${uid}`;
  }
  const uid = maybeId ? `_${maybeId}` : '';
  return `nstp_read_conversations${uid}`;
}

function formatRelativeTime(dateInput) {
  if (!dateInput) return 'Just now';
  try {
    const diffMs = Date.now() - new Date(dateInput).getTime();
    if (isNaN(diffMs) || diffMs < 0) return 'Just now';
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateInput).toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return 'Just now';
  }
}

// Hardware tone generator using Web Audio API (cross-device: iOS, Android, macOS, Windows)
let sharedAudioCtx = null;
let hasUserInteracted = false;

if (typeof window !== 'undefined') {
  const markInteracted = () => {
    hasUserInteracted = true;
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
  };
  ['click', 'keydown', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, markInteracted, { once: true, passive: true });
  });
}

function getDevicePlatform() {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  if (/iPad|iPhone|iPod/.test(ua) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1) || /Macintosh|Mac OS X/i.test(ua)) {
    return 'apple';
  }
  if (/Android/i.test(ua)) {
    return 'android';
  }
  if (/Windows|Win32|Win64/i.test(ua)) {
    return 'windows';
  }
  return 'other';
}

function playNotificationSound() {
  // Never attempt to start AudioContext before a user gesture to eliminate browser console warnings
  if (!hasUserInteracted || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }

    const platform = getDevicePlatform();

    // Trigger gentle native haptic vibration on mobile hardware
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        if (platform === 'android') {
          navigator.vibrate([60, 40, 60]);
        } else if (platform === 'apple') {
          navigator.vibrate(50);
        }
      } catch (_) {}
    }

    const playNativeDeviceChime = (ctx) => {
      try {
        const now = ctx.currentTime;

        if (platform === 'apple') {
          // ─── Authentic Apple Tri-Tone Alert (macOS / iOS / iPadOS) ──────────
          // 3 ascending crystal tones: G#5 (830.6Hz) -> B5 (987.8Hz) -> E6 (1318.5Hz)
          const notes = [
            { freq: 830.6, start: 0.00, dur: 0.11, vol: 0.16 },
            { freq: 987.8, start: 0.08, dur: 0.12, vol: 0.18 },
            { freq: 1318.5, start: 0.16, dur: 0.32, vol: 0.22 },
          ];

          notes.forEach(({ freq, start, dur, vol }) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + start);
            gain.gain.setValueAtTime(vol, now + start);
            gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + start);
            osc.stop(now + start + dur);
          });
        } else if (platform === 'android') {
          // ─── Authentic Android Bubble / Water Drop Sound ───────────────────
          // Resonant pitch bend from 480Hz up to 1320Hz with a crisp harmonic ping
          const osc = ctx.createOscillator();
          const overtone = ctx.createOscillator();
          const gain = ctx.createGain();
          const overtoneGain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(480, now);
          osc.frequency.exponentialRampToValueAtTime(1320, now + 0.05);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.14);

          gain.gain.setValueAtTime(0.24, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

          overtone.type = 'triangle';
          overtone.frequency.setValueAtTime(1760, now);
          overtoneGain.gain.setValueAtTime(0.08, now);
          overtoneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

          osc.connect(gain);
          gain.connect(ctx.destination);
          overtone.connect(overtoneGain);
          overtoneGain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.20);
          overtone.start(now);
          overtone.stop(now + 0.14);
        } else if (platform === 'windows') {
          // ─── Authentic Modern Windows Chime (F5 -> C6 Bell) ───────────────
          const bell1 = ctx.createOscillator();
          const bell2 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          const gain2 = ctx.createGain();

          bell1.type = 'sine';
          bell1.frequency.setValueAtTime(698.46, now); // F5
          gain1.gain.setValueAtTime(0.18, now);
          gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
          bell1.connect(gain1);
          gain1.connect(ctx.destination);
          bell1.start(now);
          bell1.stop(now + 0.24);

          bell2.type = 'sine';
          bell2.frequency.setValueAtTime(1046.5, now + 0.10); // C6
          gain2.gain.setValueAtTime(0.20, now + 0.10);
          gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
          bell2.connect(gain2);
          gain2.connect(ctx.destination);
          bell2.start(now + 0.10);
          bell2.stop(now + 0.40);
        } else {
          // ─── Fallback Warm Dual-tone Chime ─────────────────────────────────
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, now);
          osc.frequency.setValueAtTime(1174, now + 0.08);
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.30);
        }
      } catch (_) {}
    };

    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().then(() => playNativeDeviceChime(sharedAudioCtx)).catch(() => {});
    } else {
      playNativeDeviceChime(sharedAudioCtx);
    }
  } catch (_) {}
}

function GlobalKeyboardManager() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    const handleToggle = () => setShowShortcuts(prev => !prev);
    window.addEventListener('nstp:toggle-shortcuts', handleToggle);
    return () => window.removeEventListener('nstp:toggle-shortcuts', handleToggle);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Toggle shortcuts guide: Ctrl+/ or Cmd+/
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
        return;
      }

      // Context Guard: If focused in an input, textarea, select, or contentEditable, do not trigger single-key shortcuts
      const activeTag = document.activeElement?.tagName;
      const isInput = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT' || document.activeElement?.isContentEditable;

      // Question mark '?' when not typing
      if (!isInput && e.key === '?' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
        return;
      }

      // Quick Search Focus: Ctrl+K / Cmd+K or '/' when not typing
      if (((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) || (!isInput && e.key === '/')) {
        const searchInput = document.querySelector('input[type="text"][placeholder*="Search" i], input[type="search"], input[placeholder*="search" i], input[name*="search" i]');
        if (searchInput) {
          e.preventDefault();
          searchInput.focus();
          searchInput.select?.();
        }
        return;
      }

      // Navigation hotkeys with Alt modifier (only when logged in)
      if (user && e.altKey && !e.ctrlKey && !e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === 'd') {
          e.preventDefault();
          navigate(user.role === 'admin' ? '/admin/dashboard' : '/instructor/dashboard');
        } else if (key === 's') {
          e.preventDefault();
          navigate('/students');
        } else if (key === 'r') {
          e.preventDefault();
          navigate('/reports');
        } else if (key === 'c') {
          e.preventDefault();
          navigate('/chat');
        } else if (key === 'l') {
          e.preventDefault();
          navigate('/calendar');
        } else if (key === 'f' && user.role === 'admin') {
          e.preventDefault();
          navigate('/letter-formats');
        } else if (key === 'g' && user.role === 'admin') {
          e.preventDefault();
          window.open('https://drive.google.com/drive/folders/1lWSgMdKMBD8148A_wFb6UufFgmloD4e3', '_blank', 'noopener,noreferrer');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user, navigate]);

  return (
    <KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
  );
}

function App() {
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem('nstp_token');
      if (!token) {
        localStorage.removeItem('nstp_cached_user');
        return null;
      }
      const cached = localStorage.getItem('nstp_cached_user');
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });
  const [users, setUsers] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('nstp_cached_all_users') || '[]');
      if (Array.isArray(cached) && cached.length > 0) return cached;
    } catch {}
    return [
      { id: 1, name: 'NSTP Administrator', email: 'richardbelen99@gmail.com', role: 'admin', department: 'NSTP Office', avatar: 'avatar-4' },
      { id: 2, name: 'CWTS Facilitator', email: 'belenjoshua58@gmail.com', role: 'instructor', department: 'CWTS', avatar: 'avatar-2' },
      { id: 3, name: 'LTS Facilitator', email: 'lts@gmail.com', role: 'instructor', department: 'LTS', avatar: 'avatar-6' },
      { id: 4, name: 'ROTC Training Staff', email: 'rotc@gmail.com', role: 'instructor', department: 'ROTC', avatar: 'avatar-8' },
    ];
  });
  const [students, setStudents] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('nstp_cached_students') || '[]');
      if (Array.isArray(cached) && cached.length > 0) return cached;
    } catch {}
    return [];
  });
  const [pendingEnrollments, setPendingEnrollments] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('nstp_cached_enrollments') || '[]');
      if (Array.isArray(cached)) return cached.filter(e => e.status === 'Pending');
    } catch {}
    return [];
  });
  const [reports, setReports] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('nstp_cached_reports') || '[]');
      if (Array.isArray(cached) && cached.length > 0) return cached;
    } catch {}
    return [];
  });
  const [conversations, setConversations] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('nstp_cached_conversations') || '[]');
      if (Array.isArray(cached) && cached.length > 0) {
        // Strip any obsolete mock last messages
        return cached.map(c => ({
          ...c,
          last_message: (c.last_message && (c.last_message.includes('immersion sites') || c.last_message.includes('cadet officers') || c.last_message.includes('assessment workshop') || c.last_message.includes('Thank you everyone. Please keep student attendance'))) ? null : c.last_message,
          last_message_time: (c.last_message && (c.last_message.includes('immersion sites') || c.last_message.includes('cadet officers') || c.last_message.includes('assessment workshop') || c.last_message.includes('Thank you everyone. Please keep student attendance'))) ? null : c.last_message_time
        }));
      }
    } catch {}
    return [
      {
        id: 'group-all-instructors',
        isGroup: true,
        is_group: 1,
        groupName: 'Facilitators & Training Staff',
        group_name: 'Facilitators & Training Staff',
        with: 'Facilitators & Training Staff',
        participants: [1, 2, 3, 4],
        last_message: null,
        last_message_time: null
      },
      {
        id: '1-2',
        isGroup: false,
        is_group: 0,
        participant_1_id: 1,
        participant_2_id: 2,
        with: 'CWTS Facilitator',
        partnerName: 'CWTS Facilitator',
        partnerId: 2,
        last_message: null,
        last_message_time: null
      },
      {
        id: '1-3',
        isGroup: false,
        is_group: 0,
        participant_1_id: 1,
        participant_2_id: 3,
        with: 'LTS Facilitator',
        partnerName: 'LTS Facilitator',
        partnerId: 3,
        last_message: null,
        last_message_time: null
      },
      {
        id: '1-4',
        isGroup: false,
        is_group: 0,
        participant_1_id: 1,
        participant_2_id: 4,
        with: 'ROTC Training Staff',
        partnerName: 'ROTC Training Staff',
        partnerId: 4,
        last_message: null,
        last_message_time: null
      }
    ];
  });
  const [messages, setMessages] = useState(() => {
    try {
      localStorage.removeItem('nstp_cached_messages');
    } catch {}
    return {};
  });
  const [archivedYears, setArchivedYears] = useState(() => {
    try {
      localStorage.removeItem('nstp_cached_archives');
      localStorage.removeItem('nstp_cached_archives_v5');
      const cached = JSON.parse(localStorage.getItem('nstp_cached_archives_v6') || '[]');
      if (Array.isArray(cached) && cached.length > 0) {
        const hasCounts = cached.every(a => a.cwts != null || a.lts != null || a.rotc != null || (a.data?.cwts != null));
        if (!hasCounts) {
          localStorage.removeItem('nstp_cached_archives_v6');
          return [];
        }
        return cached;
      }
      return [];
    } catch {
      return [];
    }
  });

  // Live Auto-Update & Auto-Restart Detection (Brave Mobile Cache Buster)
  useEffect(() => {
    // Sanitize any stale dummy grades from previous local sessions
    try {
      const rawGrades = localStorage.getItem('nstp_cached_grades');
      if (rawGrades && rawGrades.includes('202310496')) {
        const parsed = JSON.parse(rawGrades);
        const cleaned = parsed.filter(g => String(g.studentId || g.student_id) !== '202310496' && Number(g.student_id) !== 41);
        localStorage.setItem('nstp_cached_grades', JSON.stringify(cleaned));
      }
    } catch (_) {}

    let currentVersion = localStorage.getItem('nstp_app_version') || null;
    const getVUrl = () => `${BASE_URL_WITH_SLASH}version.json?t=${Date.now()}`;

    const checkVersion = () => {
      if (typeof document !== 'undefined' && document.hidden) return;

      fetch(getVUrl(), { 
        cache: 'no-store', 
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' } 
      })
        .then(res => {
          if (!res.ok) return null;
          return res.json();
        })
        .then(data => {
          if (data?.version) {
            if (!currentVersion) {
              currentVersion = data.version;
              localStorage.setItem('nstp_app_version', data.version);
            } else if (data.version !== currentVersion) {
              console.log('⚡ New system update detected:', data.version, 'Purging cache & restarting...');
              localStorage.setItem('nstp_app_version', data.version);
              
              if ('caches' in window) {
                caches.keys().then(names => {
                  names.forEach(name => caches.delete(name));
                });
              }

              // Purge stale application caches on new release
              try {
                Object.keys(localStorage).forEach(k => {
                  if (k.startsWith('nstp_cached_')) {
                    localStorage.removeItem(k);
                  }
                });
              } catch (_) {}

              const banner = document.createElement('div');
              banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:999999;background:#059669;color:#fff;text-align:center;padding:12px 16px;font-weight:bold;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
              banner.textContent = '⚡ System Update Deployed! Auto-restarting webpage...';
              document.body.appendChild(banner);

              setTimeout(() => {
                window.location.reload();
              }, 1000);
            }
          }
        })
        .catch(() => {});
    };

    checkVersion();
    const checkInterval = setInterval(checkVersion, 30000);
    return () => clearInterval(checkInterval);
  }, []);
  const [currentBatch, setCurrentBatch] = useState('2024-2025 1st Semester');

  // Desktop Display Zoom Scale (25% zoom out = 75% crisp scale)
  const [displayZoom, setDisplayZoomState] = useState(() => {
    try {
      const saved = localStorage.getItem('nstp_display_zoom');
      if (saved && saved !== '78%' && saved !== '100%') return saved;
      return '75%';
    } catch (_) {
      return '75%';
    }
  });

  const setDisplayZoom = useCallback((newZoom) => {
    const clean = String(newZoom || '75%').trim();
    setDisplayZoomState(clean);
    try {
      localStorage.setItem('nstp_display_zoom', clean);
      const numeric = clean.includes('%') ? String(parseFloat(clean) / 100) : clean;
      document.documentElement.style.setProperty('--app-zoom', numeric);
      if (typeof window !== 'undefined') {
        document.documentElement.style.zoom = '';
        if (window.innerWidth >= 768) {
          document.body.style.zoom = numeric;
        } else {
          document.body.style.zoom = '0.90';
        }
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    try {
      const zoomVal = displayZoom || '75%';
      const numeric = zoomVal.includes('%') ? String(parseFloat(zoomVal) / 100) : zoomVal;
      document.documentElement.style.setProperty('--app-zoom', numeric);
      // Ensure html has no conflicting zoom rule
      document.documentElement.style.zoom = '';
      if (typeof window !== 'undefined') {
        if (window.innerWidth >= 768) {
          document.body.style.zoom = numeric;
        } else {
          document.body.style.zoom = '0.90';
        }
      }
    } catch (_) {}
  }, [displayZoom]);

  // Active Batch Calendar & Academic Semester Coverage Range
  const [currentBatchRange, setCurrentBatchRangeState] = useState(() => {
    try {
      const saved = localStorage.getItem('nstp_active_batch_range');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return {
      startMonth: '2026-08',
      endMonth: '2026-12',
      startDate: '2026-08-01',
      endDate: '2026-12-31'
    };
  });

  const updateActiveBatchRange = useCallback((rangeObj) => {
    if (!rangeObj) return;
    const startM = rangeObj.startMonth || rangeObj.start_month || '2026-08';
    const endM = rangeObj.endMonth || rangeObj.end_month || '2026-12';
    const startD = rangeObj.startDate || rangeObj.start_date || `${startM}-01`;
    const endD = rangeObj.endDate || rangeObj.end_date || `${endM}-30`;
    const normalized = {
      startMonth: startM,
      endMonth: endM,
      startDate: startD,
      endDate: endD
    };
    setCurrentBatchRangeState(normalized);
    try {
      localStorage.setItem('nstp_active_batch_range', JSON.stringify(normalized));
    } catch (_) {}
  }, []);

  const [viewingArchive, setViewingArchiveState] = useState(false);
  const [archiveViewData, setArchiveViewDataState] = useState(null);

  const setViewingArchive = useCallback((val) => {
    setViewingArchiveState(Boolean(val));
    if (!val) {
      setArchiveViewDataState(null);
    }
  }, []);

  const setArchiveViewData = useCallback((data) => {
    setArchiveViewDataState(data);
    if (!data) {
      setViewingArchiveState(false);
    }
  }, []);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const notificationsRef = useRef([]);
  notificationsRef.current = notifications;
  const [toasts, setToasts] = useState([]);
  const [incomingCall, setIncomingCall] = useState(null);
  const [pendingAnsweredCall, setPendingAnsweredCall] = useState(null);
  const [outgoingCallStatus, setOutgoingCallStatus] = useState(null);
  const outgoingCallIdRef = useRef(null);
  const handledCallIdsRef = useRef(new Set());

  const baselineReady = useRef(false);
  const seenEnrollmentIds = useRef(new Set());
  const seenSubmissionKeys = useRef(new Set());
  const seenReportIds = useRef(new Set());
  const seenReportVersions = useRef({});
  const seenReportReminders = useRef(new Set());
  const seenStudentIds = useRef(new Set());
  const seenConvLastMessageTime = useRef({});
  const seenEventIds = useRef(new Set());
  const seenEventVersions = useRef({});
  const seenEventReminders = useRef(new Set());
  const seenLetterIds = useRef(new Set());
  const seenFacultyUserIds = useRef(new Set());
  const alertedMessageIds = useRef(new Set());

  // Global Realtime Telemetry Heartbeat Ping
  useEffect(() => {
    let sid = sessionStorage.getItem('nstp_session_id');
    if (!sid) {
      sid = 'sid_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      sessionStorage.setItem('nstp_session_id', sid);
    }

    let vid = getPersistentVisitorId();

    const sendPing = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      pingTelemetry({
        sessionId: sid,
        visitorId: vid,
        deviceId: vid,
        user: user ? {
          name: user.name,
          role: user.role,
          email: user.email,
          program: user.program || user.department,
          avatar: user.avatar
        } : null,
        page: window.location.pathname
      });
    };

    sendPing();
    const interval = setInterval(sendPing, 25000);
    return () => clearInterval(interval);
  }, [user]);

  // Native hardware device notification helper (only fires when user is authenticated in this browser)
  const triggerDeviceNotification = useCallback((title, body, link = '/', tag = null) => {
    // 1. Strict authentication guard: only fire device notification if user is logged into their account in this browser
    const activeToken = typeof window !== 'undefined' ? localStorage.getItem('nstp_token') : null;
    if (!activeToken || !user || !user.id) return;

    if (typeof Notification === 'undefined') return;

    const baseUrl = import.meta.env.BASE_URL || '/';
    const iconPath = `${baseUrl}icons/icon-192x192.png`.replace(/\/\//g, '/');
    const options = {
      body,
      icon: iconPath,
      badge: iconPath,
      tag: tag ? String(tag) : `nstp-notif-${Date.now()}`,
      data: { link: link || '/' },
      renotify: true,
      vibrate: [200, 100, 200]
    };

    const fire = () => {
      if ('serviceWorker' in navigator) {
        Promise.race([
          navigator.serviceWorker.ready,
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
        ])
          .then(reg => {
            if (reg && reg.showNotification) {
              return reg.showNotification(title, options);
            }
            try { new Notification(title, options); } catch (_) {}
          })
          .catch(() => {
            try { new Notification(title, options); } catch (_) {}
          });
      } else {
        try { new Notification(title, options); } catch (_) {}
      }
    };

    if (Notification.permission === 'granted') {
      fire();
    } else if (Notification.permission === 'default') {
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') fire();
      }).catch(() => {});
    }
  }, [user]);

  const pushNotification = useCallback((notif) => {
    if (!notif) return;
    const isMessage = notif.type === 'message' || Boolean(notif.conversationId);
    if (isMessage && user) {
      const sId = String(notif.senderId || notif.sender_id || '');
      const myId = String(user.id || user._id || '');
      if (sId && myId && sId === myId) return;
      if (user.name && notif.senderName && (notif.senderName === user.name || notif.senderName.toLowerCase() === user.name.toLowerCase())) return;
      if (user.name && typeof notif.title === 'string' && notif.title.toLowerCase().includes(user.name.toLowerCase())) return;
      if (user.role === 'admin' && (notif.senderName === 'Admin' || notif.senderName === 'NSTP Administrator')) return;
      if (user.role === 'admin' && typeof notif.title === 'string' && (notif.title.includes('NSTP Administrator') || notif.title.includes('Admin'))) return;
    }
    const notifKey = notif.id || notif.key || (
      notif.enrollmentId ? `enrollment-${notif.enrollmentId}` :
      notif.reportId ? `report-${notif.reportId}` :
      notif.conversationId ? `conv-${notif.conversationId}-${Date.now()}` :
      `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
    );

    // Check if user previously dismissed or deleted this notification/entity
    if (user && !isMessage) {
      try {
        const dismissKey = getDismissedStorageKey(user);
        const dismissed = new Set(JSON.parse(localStorage.getItem(dismissKey) || '[]').map(String));
        if (
          dismissed.has(String(notifKey)) ||
          (notif.enrollmentId && dismissed.has(`enrollment-${notif.enrollmentId}`)) ||
          (notif.reportId && dismissed.has(`report-${notif.reportId}`))
        ) {
          return; // Previously dismissed by user; never recreate
        }
      } catch {}
    }

    // Check if this notification key was already marked as read by the user
    let isAlreadyRead = false;
    if (user && !isMessage) {
      try {
        const readStorageKey = getReadNotificationsStorageKey(user);
        const readSet = new Set(JSON.parse(localStorage.getItem(readStorageKey) || '[]').map(String));
        if (readSet.has(String(notifKey))) isAlreadyRead = true;
      } catch {}
    }

    const item = {
      id: notifKey,
      time: notif.time || 'Just now',
      read: isAlreadyRead ? true : Boolean(notif.read),
      title: notif.title,
      message: notif.message,
      type: notif.type || 'system',
      link: notif.link || '#',
      enrollmentId: notif.enrollmentId || null,
      studentName: notif.studentName || null,
      reportId: notif.reportId || null,
      reportTitle: notif.reportTitle || null,
      conversationId: notif.conversationId || null,
      senderName: notif.senderName || null,
      senderId: notif.senderId || notif.sender_id || null,
      isGroup: Boolean(notif.isGroup || (notif.conversationId && String(notif.conversationId).startsWith('group-'))),
      groupName: notif.groupName || (String(notif.conversationId).startsWith('group-') ? 'All Instructors' : null),
    };

    setNotifications(prev => {
      // For message notifications with a conversationId, remove older message notification for that same conversation so new unread message is at top
      if (isMessage && notif.conversationId) {
        const filtered = (prev || []).filter(n => !(n.type === 'message' && String(n.conversationId) === String(notif.conversationId)));
        return [item, ...filtered].slice(0, 50);
      }
      // Prevent duplicate notification for same entity key
      if ((prev || []).some(n => String(n.id) === String(notifKey))) return prev;
      return [item, ...(prev || [])].slice(0, 50);
    });

    // Play subtle audio alert chime
    playNotificationSound();

    // Trigger native OS device notification
    triggerDeviceNotification(item.title, item.message, item.link, item.id);
  }, [user, triggerDeviceNotification]);

  // Expose device notification tester function on window for device diagnostics
  useEffect(() => {
    window.testDeviceNotification = (title = 'NSTP System Notification', message = 'Device push notifications are working properly on your device!') => {
      pushNotification({
        title,
        message,
        type: 'system',
        link: '/admin/dashboard'
      });
      return 'Test notification triggered!';
    };
  }, [pushNotification]);

  const deleteNotifications = useCallback((idsToDelete) => {
    const idSet = new Set((Array.isArray(idsToDelete) ? idsToDelete : [idsToDelete]).map(String));
    
    // Save to persistent dismissed registry for this user
    if (user) {
      const dismissKey = getDismissedStorageKey(user);
      try {
        const existing = JSON.parse(localStorage.getItem(dismissKey) || '[]');
        const dismissed = new Set(existing.map(String));
        notifications.forEach(n => {
          if (idSet.has(String(n.id))) {
            dismissed.add(String(n.id));
            if (n.enrollmentId) dismissed.add(`enrollment-${n.enrollmentId}`);
            if (n.reportId) dismissed.add(`report-${n.reportId}`);
            if (n.conversationId && String(n.id).startsWith('conv-')) dismissed.add(`conv-${n.conversationId}`);
          }
        });
        idSet.forEach(id => dismissed.add(String(id)));
        safeSetStorage(dismissKey, Array.from(dismissed).slice(-500));
      } catch {}
    }

    setNotifications(prev => (prev || []).filter(n => !idSet.has(String(n.id))));
  }, [user, notifications]);

  const markAllNotificationsRead = useCallback((idsToMark = null) => {
    let hasChange = false;
    let updatedNotifs = [];
    setNotifications(prev => {
      const list = prev || [];
      if (Array.isArray(idsToMark) && idsToMark.length > 0) {
        const idSet = new Set(idsToMark.map(String));
        updatedNotifs = list.map(n => {
          if (idSet.has(String(n.id)) && !n.read) {
            hasChange = true;
            return { ...n, read: true };
          }
          return n;
        });
      } else {
        hasChange = list.some(n => !n.read);
        if (hasChange) {
          updatedNotifs = list.map(n => ({ ...n, read: true }));
        }
      }
      if (!hasChange) return prev;
      if (user) {
        const notifKey = getNotificationStorageKey(user);
        safeSetStorage(notifKey, updatedNotifs);
      }
      return updatedNotifs;
    });

    if (user) {
      // Persist read IDs Set so restart and background re-poll never restore them as unread
      try {
        const readStorageKey = getReadNotificationsStorageKey(user);
        const existing = JSON.parse(localStorage.getItem(readStorageKey) || '[]');
        const readSet = new Set(existing.map(String));
        if (Array.isArray(idsToMark) && idsToMark.length > 0) {
          idsToMark.forEach(id => readSet.add(String(id)));
        } else {
          (notificationsRef.current || []).forEach(n => readSet.add(String(n.id)));
        }
        safeSetStorage(readStorageKey, Array.from(readSet).slice(-1000));
      } catch {}

      // Clean up legacy keys to prevent resurrection of unread state
      try {
        localStorage.removeItem('nstp_admin_notifications');
        localStorage.removeItem('nstp_instructor_notifications');
      } catch {}

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nstp_conversation_read', {
          detail: { conversationId: 'all', userId: user.id, timestamp: Date.now() }
        }));
      }
    }
  }, [user]);

  const markConversationAsRead = useCallback((convId) => {
    if (!user || !convId) return;
    const convIdStr = String(convId);
    const now = Date.now();
    const readKey = getReadConversationsKey(user);

    // 1. Persist to localStorage read map
    try {
      const currentMap = JSON.parse(localStorage.getItem(readKey) || '{}');
      if (!currentMap[convIdStr] || now - currentMap[convIdStr] >= 2000) {
        currentMap[convIdStr] = now;
        safeSetStorage(readKey, currentMap);
      }
    } catch {}

    // 2. Mark matching notifications as read
    setNotifications(prev => {
      const list = prev || [];
      let hasChange = false;
      const updatedNotifs = list.map(n => {
        const matchesConv = (n.type === 'message' || Boolean(n.conversationId)) &&
          (String(n.conversationId) === convIdStr ||
           String(n.id).includes(convIdStr) ||
           (n.link && String(n.link).includes(convIdStr)));
        if (matchesConv && !n.read) {
          hasChange = true;
          return { ...n, read: true };
        }
        return n;
      });
      if (!hasChange) return prev;
      safeSetStorage(getNotificationStorageKey(user), updatedNotifs);
      return updatedNotifs;
    });

    // 3. Persist IDs to read registry so re-poll doesn't bring them back
    try {
      const readStorageKey = getReadNotificationsStorageKey(user);
      const existing = JSON.parse(localStorage.getItem(readStorageKey) || '[]');
      const readSet = new Set(existing.map(String));
      (notificationsRef.current || []).forEach(n => {
        if (String(n.conversationId) === convIdStr || (n.link && String(n.link).includes(convIdStr))) {
          readSet.add(String(n.id));
        }
      });
      safeSetStorage(readStorageKey, Array.from(readSet).slice(-1000));
    } catch {}

    // 4. Dispatch global event so Sidebar, Chat, and Dashboards update immediately
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nstp_conversation_read', {
        detail: { conversationId: convIdStr, userId: user.id, timestamp: now }
      }));
    }
  }, [user]);

  const dismissToast = useCallback((toastId) => {
    setToasts(prev => prev.filter(t => t.id !== toastId));
  }, []);

  const showToast = useCallback((message, type = 'info', title = null) => {
    const defaultTitle = type === 'success' ? 'Success' : type === 'error' ? 'Notice' : type === 'warning' ? 'Warning' : 'Information';
    const toastId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const toastItem = {
      id: toastId,
      title: title || defaultTitle,
      message: typeof message === 'string' ? message : (message?.message || 'Operation notification'),
      type
    };

    setToasts(prev => [toastItem, ...prev].slice(0, 3));

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toastId));
    }, 4000);
  }, []);

  // ── Real-Time WebSockets (Socket.io) Instant Dispatcher ────────────────────
  useEffect(() => {
    if (!user) {
      disconnectSocket();
      return;
    }

    const socket = initSocket();
    if (!socket) return;

    // Explicitly authenticate current socket with user profile
    if (user.id || user._id) {
      socket.emit('authenticate', {
        userId: Number(user.id || user._id),
        department: user.department,
        role: user.role
      });
    }

    // 1. Instant Real-time Chat Messages (0ms latency without waiting for polling)
    const handleChatMessage = (payload) => {
      if (!payload || !payload.message) return;
      const conversationId = payload.conversationId || payload.convId || payload.message?.conversation_id;
      const message = payload.message;
      if (!conversationId) return;

      const convKey = String(conversationId);
      setMessages(prev => {
        const existing = prev[convKey] || [];
        if (existing.some(m => String(m.id) === String(message.id))) return prev;
        return {
          ...prev,
          [convKey]: [...existing, message]
        };
      });

      // Update conversations list with latest message preview
      const senderName = message.senderName || message.sender_name || payload.sender?.name || 'Someone';
      let preview = message.text || message.message || '';
      if (preview.startsWith('data:')) preview = 'Sent an attachment';
      else if (preview.startsWith('📸') || message.type === 'image') preview = 'Sent a photo';
      else if (preview.startsWith('🎤') || message.type === 'voice') preview = 'Sent a voice message';
      else if (preview.startsWith('📎') || message.type === 'file') preview = 'Sent a file';
      if (preview.length > 80) preview = preview.slice(0, 80) + '…';

      const senderId = message.senderId || message.sender_id || payload.sender?.id;
      setConversations(prev => {
        const targetIds = Array.isArray(payload.conversationIds) && payload.conversationIds.length > 0
          ? payload.conversationIds.map(String)
          : [convKey];
        const updated = (prev || []).map(c => {
          const isMatch = targetIds.some(id => String(c.id) === String(id));
          if (isMatch) {
            return {
              ...c,
              last_message: preview,
              last_message_time: message.created_at || new Date().toISOString(),
              last_sender_id: senderId,
              last_sender_name: senderName
            };
          }
          return c;
        });
        safeSetStorage('nstp_cached_conversations', updated);
        return updated;
      });

      window.dispatchEvent(new CustomEvent('nstp_socket_chat_message', { detail: payload }));
      window.dispatchEvent(new CustomEvent('nstp_chat_message', { detail: payload }));

      // Dispatch instant device notification and on-screen toast if message is from another person
      const myId = String(user.id || user._id || '');
      const sId = String(senderId || '');
      const isOwnMessage = (sId && myId && sId === myId) ||
        (user.name && (senderName === user.name || senderName.toLowerCase() === user.name.toLowerCase())) ||
        (user.role === 'admin' && (senderName === 'Admin' || senderName === 'NSTP Administrator'));
      if (!isOwnMessage) {
        // Hardware vibration
        try {
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([120, 80, 120]);
          }
        } catch (_) {}

        // Add to notification center (bell dropdown), play chime, and trigger OS push notification
        pushNotification({
          id: `conv-${convKey}-${Date.now()}`,
          title: `Message from ${senderName}`,
          message: preview || 'Sent you a message',
          type: 'message',
          link: `/chat?convId=${convKey}`,
          conversationId: convKey,
          senderName: senderName,
          senderId: senderId
        });

        // Show immediate visual in-app toast regardless of browser permission state
        showToast(preview || 'Sent you a message', 'info', `💬 ${senderName}`);
      }
    };

    // 2. Instant Attendance Scanned Sync
    const handleAttendanceScanned = (payload) => {
      window.dispatchEvent(new CustomEvent('nstp_attendance_updated', { detail: payload }));
      if (user.role === 'admin' || (payload.student && payload.student.department === user.department)) {
        pushNotification({
          title: 'Live Attendance Logged',
          message: `${payload.student?.name || payload.studentId || 'A student'} logged attendance (${payload.record?.activity_name || 'NSTP Session'})`,
          type: 'attendance',
          link: '/students'
        });
      }
    };

    // 3. Instant New Enrollment Notification (Admin)
    const handleNewEnrollment = (payload) => {
      if (user.role === 'admin' && payload?.enrollment) {
        setPendingEnrollments(prev => [payload.enrollment, ...prev]);
        const enrollName = payload.enrollment.name || payload.enrollment.fullName || payload.enrollment.studentId || 'A student';
        pushNotification({
          title: 'New Online Enrollment',
          message: `${enrollName} submitted an enrollment application`,
          type: 'enrollment',
          link: '/admin/dashboard',
          enrollmentId: payload.enrollment.id,
          studentName: enrollName
        });
      }
    };

    // 4. Instant Incoming Call Alert
    const handleIncomingCall = (payload) => {
      if (payload?.call) {
        setIncomingCall(payload.call);
      }
    };

    const handleCallEnded = (payload) => {
      if (payload?.callId) {
        setIncomingCall(null);
        setOutgoingCallStatus(null);
      }
    };

    socket.on('chat:message', handleChatMessage);
    socket.on('new_message', handleChatMessage);
    socket.on('attendance:scanned', handleAttendanceScanned);
    socket.on('enrollment:new', handleNewEnrollment);
    socket.on('call:incoming', handleIncomingCall);
    socket.on('call:ended', handleCallEnded);

    return () => {
      socket.off('chat:message', handleChatMessage);
      socket.off('new_message', handleChatMessage);
      socket.off('attendance:scanned', handleAttendanceScanned);
      socket.off('enrollment:new', handleNewEnrollment);
      socket.off('call:incoming', handleIncomingCall);
      socket.off('call:ended', handleCallEnded);
    };
  }, [user, pushNotification, showToast]);

  function resetRealtimeBaseline() {
    baselineReady.current = false;
    seenEnrollmentIds.current = new Set();
    seenSubmissionKeys.current = new Set();
    seenReportIds.current = new Set();
    seenReportVersions.current = {};
    seenReportReminders.current = new Set();
    seenStudentIds.current = new Set();
    seenConvLastMessageTime.current = {};
    seenEventIds.current = new Set();
    seenEventVersions.current = {};
    seenEventReminders.current = new Set();
    seenLetterIds.current = new Set();
    seenFacultyUserIds.current = new Set();
    alertedMessageIds.current = new Set();
  }

  function seedRealtimeBaseline(pending, reportsList, convList, studentsList, usersList, calendarList, lettersList, currentUser) {
    const safePending = Array.isArray(pending) ? pending : [];
    const safeStudents = Array.isArray(studentsList) ? studentsList : [];
    const safeReports = Array.isArray(reportsList) ? reportsList : [];
    const safeConvs = Array.isArray(convList) ? convList : [];
    const safeUsers = Array.isArray(usersList) ? usersList : [];
    const safeEvents = Array.isArray(calendarList) ? calendarList : [];
    const safeLetters = Array.isArray(lettersList) ? lettersList : [];

    safePending.forEach(e => { if (e && e.id) seenEnrollmentIds.current.add(e.id); });
    safeStudents.forEach(s => { if (s && s.id) seenStudentIds.current.add(s.id); });

    safeReports.forEach(report => {
      if (!report || !report.id) return;
      seenReportIds.current.add(report.id);
      seenReportVersions.current[report.id] = `${report.title || ''}__${report.deadline || ''}__${report.description || ''}__${report.updated_at || ''}`;
      (Array.isArray(report.submissions) ? report.submissions : []).forEach(sub => {
        if (sub) seenSubmissionKeys.current.add(`${report.id}-${sub.instructor_id}-${sub.id}`);
      });
    });

    safeConvs.forEach(conv => {
      if (conv && conv.id && conv.last_message_time) {
        seenConvLastMessageTime.current[conv.id] = String(conv.last_message_time);
      }
    });

    if (currentUser) {
      reconcileUnreadConversationMessages(safeConvs, currentUser, true);
    }

    // Baseline seed accounts (IDs 1-4) are default system accounts and should never trigger notifications
    [1, 2, 3, 4].forEach(id => seenFacultyUserIds.current.add(id));
    safeUsers.forEach(u => {
      if (u && u.id && (u.role === 'instructor' || u.role === 'admin')) {
        seenFacultyUserIds.current.add(u.id);
      }
    });

    safeEvents.forEach(ev => {
      if (ev && ev.id) {
        seenEventIds.current.add(ev.id);
        seenEventVersions.current[ev.id] = `${ev.title || ''}__${ev.date || ''}__${ev.time || ''}__${ev.location || ''}`;
      }
    });

    safeLetters.forEach(l => {
      if (l && l.id) seenLetterIds.current.add(l.id);
    });

    if (currentUser) {
      reconcileSystemNotifications(safePending, safeReports, safeStudents, safeEvents, safeLetters, safeUsers, currentUser);
    }

    // Persist seen IDs to storage so next login doesn't duplicate existing records
    if (currentUser) {
      try {
        const seenPayload = {
          enrollments: Array.from(seenEnrollmentIds.current).slice(-500),
          submissions: Array.from(seenSubmissionKeys.current).slice(-500),
          reports: Array.from(seenReportIds.current).slice(-500),
          students: Array.from(seenStudentIds.current).slice(-500),
          faculty: Array.from(seenFacultyUserIds.current).slice(-500),
          letters: Array.from(seenLetterIds.current).slice(-500)
        };
        safeSetStorage(getSeenEntitiesStorageKey(currentUser), seenPayload);
      } catch {}
    }

    baselineReady.current = true;
  }

  function reconcileSystemNotifications(pending, reportsList, studentsList, calendarList, lettersList, usersList, currentUser) {
    if (!currentUser) return;

    const safePending = Array.isArray(pending) ? pending : [];
    const safeStudents = Array.isArray(studentsList) ? studentsList : [];
    const safeReports = Array.isArray(reportsList) ? reportsList : [];
    const safeEvents = Array.isArray(calendarList) ? calendarList : [];
    const safeUsers = Array.isArray(usersList) ? usersList : [];
    const safeLetters = (Array.isArray(lettersList) && lettersList.length > 0)
      ? lettersList
      : [
          { id: 'tpl-1', title: 'Letter of Intent / Parent Consent' },
          { id: 'tpl-2', title: 'Community Service Endorsement Letter' }
        ];

    const dismissedKey = getDismissedStorageKey(currentUser);
    let dismissedSet = new Set();
    try {
      dismissedSet = new Set(JSON.parse(localStorage.getItem(dismissedKey) || '[]').map(String));
    } catch {}

    const readKey = getReadNotificationsStorageKey(currentUser);
    let readNotifSet = new Set();
    try {
      readNotifSet = new Set(JSON.parse(localStorage.getItem(readKey) || '[]').map(String));
    } catch {}

    const systemItems = [];

    const getDaysRemaining = (dateStr) => {
      if (!dateStr) return null;
      const t = new Date(dateStr).getTime();
      if (isNaN(t)) return null;
      return Math.ceil((t - Date.now()) / (1000 * 60 * 60 * 24));
    };

    // =========================================================================
    // A. PARA SA ADMIN:
    // 1. Pending enrollments kung sino-sino ang mga nag-enroll
    // 2. Nag-pasa ng report / nag-submit na mga instructor
    // 3. Mga pa-deadline na di pa nagpapasa na instructor
    // =========================================================================
    if (currentUser.role === 'admin') {
      // 1. Pending enrollments (kung sino-sino ang mga nag-enroll)
      safePending.forEach(e => {
        if (!e || !e.id) return;
        const eKey = `enrollment-${e.id}`;
        if (dismissedSet.has(eKey) || dismissedSet.has(String(e.id))) return;
        const enrollName = e.student_name || e.fullName || e.firstName || 'Student Applicant';
        systemItems.push({
          id: eKey,
          title: `Pending Enrollment: ${enrollName}`,
          message: `${enrollName} submitted an enrollment application for ${e.department || 'NSTP'}. Awaiting review and approval.`,
          type: 'enrollment',
          read: readNotifSet.has(eKey),
          time: formatRelativeTime(e.created_at),
          createdAt: e.created_at || new Date().toISOString(),
          link: '/admin/dashboard',
          enrollmentId: e.id,
          studentName: enrollName
        });
      });

      // 2. Nag-pasa ng report or nag-submit
      safeReports.forEach(report => {
        if (!report) return;
        const submissions = Array.isArray(report.submissions) ? report.submissions : [];
        submissions.forEach(sub => {
          if (!sub) return;
          const subKey = `submission-${report.id}-${sub.instructor_id || sub.id}`;
          if (dismissedSet.has(subKey) || dismissedSet.has(`report-${report.id}`)) return;
          const subName = sub.instructor_name || sub.instructor || sub.department || 'an instructor';
          systemItems.push({
            id: subKey,
            title: `Report Submitted: ${report.title || 'Accomplishment Report'}`,
            message: `"${report.title || 'Untitled'}" was submitted by ${subName}. Awaiting admin verification.`,
            type: 'report',
            read: readNotifSet.has(subKey),
            time: formatRelativeTime(sub.submitted_at || report.updated_at || report.created_at),
            createdAt: sub.submitted_at || report.updated_at || report.created_at || new Date().toISOString(),
            link: '/reports',
            reportId: report.id,
            reportTitle: report.title
          });
        });
      });

      // 3. Mga pa-deadline na di pa nagpapasa na instructor
      safeReports.forEach(report => {
        if (!report || !report.deadline) return;
        const daysLeft = getDaysRemaining(report.deadline);
        // If deadline is within 3 days, today, or slightly overdue within 2 days
        if (daysLeft !== null && daysLeft <= 3 && daysLeft >= -2) {
          const expectedDepts = report.department === 'All' ? ['ROTC', 'CWTS', 'LTS'] : [report.department];
          const submissions = Array.isArray(report.submissions) ? report.submissions : [];
          const submittedDepts = new Set(submissions.map(s => String(s.department || s.instructor_department || '')));
          const missingDepts = expectedDepts.filter(d => !submittedDepts.has(d));

          if (missingDepts.length > 0) {
            const dlKey = `admin-report-deadline-${report.id}`;
            if (dismissedSet.has(dlKey) || dismissedSet.has(String(report.id))) return;
            const dueLabel = daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : daysLeft < 0 ? 'Overdue' : `in ${daysLeft} days`;
            systemItems.push({
              id: dlKey,
              title: `Upcoming Deadline - Missing Submissions`,
              message: `Report "${report.title || 'Untitled'}" is due ${dueLabel} (${String(report.deadline).slice(0, 10)}). No submission yet from: ${missingDepts.join(', ')}.`,
              type: 'report',
              read: readNotifSet.has(dlKey),
              time: String(report.deadline).slice(0, 10),
              createdAt: report.created_at || new Date().toISOString(),
              link: '/reports',
              reportId: report.id,
              reportTitle: report.title
            });
          }
        }
      });
    }

    // =========================================================================
    // B. PARA SA INSTRUCTOR:
    // 1. Bagong upload ni admin na report (assigned to this instructor's department or 'All')
    // 2. New add ng student (yung mga na-accept sa pending enrollment)
    // 3. Pag may dinagdag na instructor or admin si admin
    // 4. Bagong upload na letter format
    // 5. Malapit na na event sa calendar
    // 6. Bagong dagdag na event sa calendar
    // 7. Mga malapit na mag-deadline sa reports
    // =========================================================================
    if (currentUser.role === 'instructor') {
      const myDept = currentUser.department || '';

      // 1. Bagong upload ni admin na report (para sa department ng instructor o 'All')
      safeReports.forEach(report => {
        if (!report || !report.id) return;
        const isMyDept = report.department === 'All' || (myDept && report.department === myDept);
        if (!isMyDept) return; // STRICTLY EXCLUDE other departments!

        const rKey = `report-assign-${report.id}`;
        if (dismissedSet.has(rKey) || dismissedSet.has(String(report.id))) return;

        const dueText = report.deadline ? `Deadline: ${String(report.deadline).slice(0, 10)}` : 'No set deadline';
        systemItems.push({
          id: rKey,
          title: `New Report Assignment: ${report.title || 'Untitled'}`,
          message: `Admin assigned a report requirement for ${report.department}. ${dueText}.`,
          type: 'report',
          read: readNotifSet.has(rKey),
          time: formatRelativeTime(report.created_at),
          createdAt: report.created_at || new Date().toISOString(),
          link: '/reports',
          reportId: report.id,
          reportTitle: report.title
        });
      });

      // 2. New add ng student (yung mga na-accept sa pending enrollment sa department niya)
      const myAcceptedStudents = safeStudents.filter(s => {
        const sDept = s.department || s.nstp_component || '';
        return myDept && sDept === myDept;
      });
      myAcceptedStudents.slice(0, 15).forEach(s => {
        if (!s || !s.id) return;
        const sKey = `student-accepted-${s.id}`;
        if (dismissedSet.has(sKey) || dismissedSet.has(String(s.id))) return;
        const studentName = s.name || s.student_name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Student';
        systemItems.push({
          id: sKey,
          title: `New Student Added: ${myDept}`,
          message: `${studentName} was approved and officially added to your ${myDept} class roster.`,
          type: 'student',
          read: readNotifSet.has(sKey),
          time: formatRelativeTime(s.created_at),
          createdAt: s.created_at || new Date().toISOString(),
          link: '/students',
          studentName
        });
      });

      // 3. Pag may dinagdag na instructor or admin si admin
      safeUsers.forEach(u => {
        if (!u || !u.id) return;
        if (String(u.id) === String(currentUser.id)) return;
        if (Number(u.id) <= 4) return; // Exclude default seed accounts

        if (u.role === 'instructor' || u.role === 'admin') {
          const uKey = `faculty-added-${u.id}`;
          if (dismissedSet.has(uKey) || dismissedSet.has(String(u.id))) return;
          const isInst = u.role === 'instructor';
          const title = isInst
            ? `New Faculty Member Added (${u.department || 'NSTP'})`
            : `New System Administrator Added`;
          const roleLabel = isInst ? `${u.department || 'NSTP'} Instructor` : 'System Administrator';
          systemItems.push({
            id: uKey,
            title,
            message: `${u.name || 'A new faculty member'} was added as ${roleLabel}.`,
            type: 'system',
            read: readNotifSet.has(uKey),
            time: formatRelativeTime(u.created_at),
            createdAt: u.created_at || new Date().toISOString(),
            link: '/instructor/dashboard'
          });
        }
      });

      // 4. Bagong upload na letter format
      safeLetters.slice(0, 5).forEach(letter => {
        if (!letter || !letter.id) return;
        const lKey = `letter-fmt-${letter.id}`;
        if (dismissedSet.has(lKey) || dismissedSet.has(String(letter.id))) return;
        systemItems.push({
          id: lKey,
          title: `New Letter Format: ${letter.title || 'Official Letter'}`,
          message: `Official format template "${letter.title || 'Letter'}" is ready for student letters and endorsements.`,
          type: 'system',
          read: readNotifSet.has(lKey),
          time: 'Format',
          createdAt: letter.created_at || new Date().toISOString(),
          link: '/letter-formats'
        });
      });

      // 5 & 6. Malapit na na event sa calendar AT bagong dagdag na event sa calendar
      safeEvents.forEach(ev => {
        if (!ev || !ev.id) return;
        const evKey = `event-cal-${ev.id}`;
        if (dismissedSet.has(evKey) || dismissedSet.has(String(ev.id))) return;

        const daysLeft = getDaysRemaining(ev.date);
        const isUpcomingSoon = daysLeft !== null && daysLeft <= 5 && daysLeft >= 0;

        const title = isUpcomingSoon
          ? `Upcoming Event: ${ev.title || 'Event'}`
          : `New Calendar Event: ${ev.title || 'Event'}`;
        const timeBadge = isUpcomingSoon
          ? (daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `in ${daysLeft}d`)
          : (ev.date ? String(ev.date).slice(0, 10) : 'Calendar');

        systemItems.push({
          id: evKey,
          title,
          message: `"${ev.title || 'Event'}" scheduled on ${ev.date ? String(ev.date).slice(0, 10) : 'upcoming date'}${ev.location ? ` at ${ev.location}` : ''}.`,
          type: 'calendar',
          read: readNotifSet.has(evKey),
          time: timeBadge,
          createdAt: ev.created_at || new Date().toISOString(),
          link: '/calendar'
        });
      });

      // 7. Mga malapit na mag-deadline sa reports
      safeReports.forEach(report => {
        if (!report || !report.deadline) return;
        const isMyDept = report.department === 'All' || (myDept && report.department === myDept);
        if (!isMyDept) return; // STRICTLY EXCLUDE other departments

        const daysLeft = getDaysRemaining(report.deadline);
        // If deadline is within 3 days, today, or slightly overdue within 2 days
        if (daysLeft !== null && daysLeft <= 3 && daysLeft >= -2) {
          const submissions = Array.isArray(report.submissions) ? report.submissions : [];
          const hasSubmitted = submissions.some(s =>
            String(s.instructor_id) === String(currentUser.id) ||
            (myDept && (s.department === myDept || s.instructor_department === myDept))
          );

          if (!hasSubmitted) {
            const dlKey = `inst-report-deadline-${report.id}`;
            if (dismissedSet.has(dlKey) || dismissedSet.has(String(report.id))) return;
            const dueLabel = daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : daysLeft < 0 ? 'Overdue' : `in ${daysLeft} days`;
            systemItems.push({
              id: dlKey,
              title: `Report Deadline Approaching: ${report.title || 'Untitled'}`,
              message: `Reminder: Report "${report.title || 'Untitled'}" is due ${dueLabel} (${String(report.deadline).slice(0, 10)}). Please submit your accomplishment report.`,
              type: 'report',
              read: readNotifSet.has(dlKey),
              time: dueLabel,
              createdAt: report.created_at || new Date().toISOString(),
              link: '/reports',
              reportId: report.id,
              reportTitle: report.title
            });
          }
        }
      });
    }

    // Sort system items (unread first, then newest)
    systemItems.sort((a, b) => {
      if (a.read !== b.read) return a.read ? 1 : -1;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    setNotifications(prev => {
      const prevMsgs = (prev || []).filter(n => n.type === 'message' || String(n.id).startsWith('msg-') || Boolean(n.conversationId));
      const stateReadMap = new Map((prev || []).map(n => [String(n.id), Boolean(n.read)]));

      const mergedSystem = systemItems
        .filter(item => isNotificationAllowedForRole(item, currentUser))
        .map(item => {
          const wasReadInState = stateReadMap.get(String(item.id));
          const wasReadInStorage = readNotifSet.has(String(item.id));
          return (wasReadInState || wasReadInStorage) ? { ...item, read: true } : item;
        });

      // ONLY keep chat messages + role-compliant system notifications!
      const updated = [...prevMsgs, ...mergedSystem].slice(0, 100);
      safeSetStorage(getNotificationStorageKey(currentUser), updated);
      return updated;
    });
  }

  function detectRealtimeChanges(pending, reportsList, convList, studentsList, usersList, calendarList, lettersList, currentUser) {
    if (!baselineReady.current || !currentUser) return;

    const safePending = Array.isArray(pending) ? pending : [];
    const safeStudents = Array.isArray(studentsList) ? studentsList : [];
    const safeReports = Array.isArray(reportsList) ? reportsList : [];
    const safeUsers = Array.isArray(usersList) ? usersList : [];
    const safeEvents = Array.isArray(calendarList) ? calendarList : [];
    const safeLetters = Array.isArray(lettersList) ? lettersList : [];

    // Load dismissed keys to ensure dismissed notifications are never recreated
    let dismissedSet = new Set();
    try {
      const dismissKey = getDismissedStorageKey(currentUser);
      dismissedSet = new Set(JSON.parse(localStorage.getItem(dismissKey) || '[]').map(String));
    } catch {}

    let newlySeen = false;
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const safePush = (notif) => {
      if (!isNotificationAllowedForRole(notif, currentUser)) return;
      pushNotification(notif);
    };

    // =========================================================================
    // 1. ADMIN SPECIFIC REALTIME NOTIFICATIONS
    // - Pending enrollments
    // - Instructor report submissions
    // - Approaching deadlines with missing submissions
    // =========================================================================
    if (currentUser.role === 'admin') {
      // A. New Pending Enrollments
      safePending.forEach(enrollment => {
        if (!enrollment || !enrollment.id) return;
        const eKey = `enrollment-${enrollment.id}`;
        if (dismissedSet.has(String(enrollment.id)) || dismissedSet.has(eKey)) {
          seenEnrollmentIds.current.add(enrollment.id);
          return;
        }
        if (!seenEnrollmentIds.current.has(enrollment.id)) {
          seenEnrollmentIds.current.add(enrollment.id);
          newlySeen = true;
          const enrollName = enrollment.student_name || enrollment.fullName || enrollment.firstName || 'A student';
          safePush({
            id: eKey,
            title: `Pending Enrollment: ${enrollName}`,
            message: `${enrollName} submitted an enrollment application for ${enrollment.department || 'NSTP'}. Awaiting review.`,
            type: 'enrollment',
            link: '/admin/dashboard',
            enrollmentId: enrollment.id,
            studentName: enrollName
          });
        }
      });

      // B. New Report Submissions by Instructors
      safeReports.forEach(report => {
        if (!report) return;
        (Array.isArray(report.submissions) ? report.submissions : []).forEach(sub => {
          if (!sub) return;
          const subKey = `${report.id}-${sub.instructor_id}-${sub.id}`;
          if (dismissedSet.has(subKey) || dismissedSet.has(`report-${report.id}`)) {
            seenSubmissionKeys.current.add(subKey);
            return;
          }
          if (!seenSubmissionKeys.current.has(subKey)) {
            seenSubmissionKeys.current.add(subKey);
            newlySeen = true;
            const subName = sub.instructor_name || sub.instructor || sub.department || 'an instructor';
            safePush({
              id: `submission-${subKey}`,
              title: `Report Submitted: ${report.title || 'Accomplishment Report'}`,
              message: `Report "${report.title || 'Untitled'}" was submitted by ${subName}. Awaiting verification.`,
              type: 'report',
              link: '/reports',
              reportId: report.id,
              reportTitle: report.title
            });
          }
        });
      });

      // C. Approaching Deadlines with Missing Submissions
      safeReports.forEach(report => {
        if (!report || !report.deadline) return;
        const dStr = String(report.deadline).slice(0, 10);
        if (dStr === tomorrow) {
          const expectedDepts = report.department === 'All' ? ['ROTC', 'CWTS', 'LTS'] : [report.department];
          const submissions = Array.isArray(report.submissions) ? report.submissions : [];
          const submittedDepts = new Set(submissions.map(s => String(s.department || s.instructor_department || '')));
          const missingDepts = expectedDepts.filter(d => !submittedDepts.has(d));

          if (missingDepts.length > 0) {
            const dlKey = `admin-report-deadline-${report.id}-${dStr}`;
            if (!seenReportReminders.current.has(dlKey) && !dismissedSet.has(dlKey)) {
              seenReportReminders.current.add(dlKey);
              safePush({
                id: dlKey,
                title: 'Upcoming Deadline - Missing Submissions',
                message: `Report "${report.title || 'Untitled'}" is due tomorrow (${dStr}). No submission yet from: ${missingDepts.join(', ')}.`,
                type: 'report',
                link: '/reports',
                reportId: report.id,
                reportTitle: report.title
              });
            }
          }
        }
      });
    }

    // =========================================================================
    // 2. INSTRUCTOR SPECIFIC REALTIME NOTIFICATIONS
    // - New report upload by admin (for their dept or All)
    // - New student accepted into roster
    // - New faculty or admin registered
    // - New letter format uploaded
    // - Upcoming or new calendar event
    // - Report deadline approaching (unsubmitted)
    // =========================================================================
    if (currentUser.role === 'instructor') {
      const myDept = currentUser.department || '';

      // A. New Report Assignment by Admin (for instructor's department or 'All')
      safeReports.forEach(report => {
        if (!report || !report.id) return;
        const isMyDept = report.department === 'All' || (myDept && report.department === myDept);
        if (!isMyDept) return;

        const rKey = `report-assign-${report.id}`;
        if (dismissedSet.has(String(report.id)) || dismissedSet.has(rKey)) {
          seenReportIds.current.add(report.id);
          return;
        }

        const currentVer = `${report.title || ''}__${report.deadline || ''}__${report.description || ''}__${report.updated_at || ''}`;
        if (!seenReportIds.current.has(report.id)) {
          seenReportIds.current.add(report.id);
          seenReportVersions.current[report.id] = currentVer;
          newlySeen = true;
          safePush({
            id: rKey,
            title: `New Report Assignment: ${report.title || 'Untitled'}`,
            message: `Admin assigned a report requirement for ${report.department}. ${report.deadline ? `Deadline: ${String(report.deadline).slice(0, 10)}` : 'No set deadline'}.`,
            type: 'report',
            link: '/reports',
            reportId: report.id,
            reportTitle: report.title
          });
        } else {
          // Report Edited
          const prevVer = seenReportVersions.current[report.id];
          if (prevVer && prevVer !== currentVer) {
            seenReportVersions.current[report.id] = currentVer;
            safePush({
              id: `report-edit-${report.id}-${Date.now()}`,
              title: `Report Updated: ${report.title || 'Untitled'}`,
              message: `Report "${report.title || 'Untitled'}" instructions or details were updated.`,
              type: 'report',
              link: '/reports',
              reportId: report.id,
              reportTitle: report.title
            });
          }
        }
      });

      // B. Newly Approved/Enrolled Students Assigned to Instructor's Class Roster
      safeStudents.forEach(student => {
        if (!student || !student.id) return;
        const sKey = `student-accepted-${student.id}`;
        if (dismissedSet.has(String(student.id)) || dismissedSet.has(sKey)) {
          seenStudentIds.current.add(student.id);
          return;
        }
        if (!seenStudentIds.current.has(student.id)) {
          seenStudentIds.current.add(student.id);
          newlySeen = true;
          const studentDept = student.department || student.nstp_component || '';
          if (myDept && studentDept === myDept) {
            const studentName = student.name || student.student_name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'New Student';
            safePush({
              id: sKey,
              title: `New Student Added: ${myDept}`,
              message: `${studentName} was approved and officially added to your ${myDept} class roster.`,
              type: 'student',
              link: '/students',
              studentName
            });
          }
        }
      });

      // C. New Faculty Member or Administrator Registered
      safeUsers.forEach(u => {
        if (!u || !u.id) return;
        if (String(u.id) === String(currentUser.id)) return;
        if (seenFacultyUserIds.current.has(u.id)) return;
        seenFacultyUserIds.current.add(u.id);

        if (!baselineReady.current || Number(u.id) <= 4) return;

        if (u.role === 'instructor' || u.role === 'admin') {
          const uKey = `faculty-added-${u.id}`;
          if (!dismissedSet.has(uKey)) {
            const isInst = u.role === 'instructor';
            safePush({
              id: uKey,
              title: isInst ? `New Faculty Member Added (${u.department || 'NSTP'})` : 'New System Administrator Added',
              message: `${u.name || 'A new faculty member'} was registered as ${isInst ? `${u.department || 'NSTP'} Instructor` : 'System Administrator'}.`,
              type: 'system',
              link: '/instructor/dashboard'
            });
          }
        }
      });

      // D. New Letter Format Template Added
      safeLetters.forEach(letter => {
        if (!letter || !letter.id) return;
        const lKey = `letter-fmt-${letter.id}`;
        if (!seenLetterIds.current.has(letter.id)) {
          seenLetterIds.current.add(letter.id);
          if (!dismissedSet.has(lKey)) {
            safePush({
              id: lKey,
              title: `New Letter Format: ${letter.title || 'Official Letter'}`,
              message: `Official format template "${letter.title || 'Letter'}" is ready for student letters and endorsements.`,
              type: 'system',
              link: '/letter-formats'
            });
          }
        }
      });

      // E. Calendar Events (New Event Added & Upcoming Tomorrow Reminder)
      safeEvents.forEach(ev => {
        if (!ev || !ev.id) return;
        const evKey = `event-cal-${ev.id}`;
        if (dismissedSet.has(String(ev.id)) || dismissedSet.has(evKey)) {
          seenEventIds.current.add(ev.id);
          return;
        }

        const evVer = `${ev.title || ''}__${ev.date || ''}__${ev.time || ''}__${ev.location || ''}`;
        if (!seenEventIds.current.has(ev.id)) {
          seenEventIds.current.add(ev.id);
          seenEventVersions.current[ev.id] = evVer;
          safePush({
            id: evKey,
            title: `New Calendar Event: ${ev.title || 'Event'}`,
            message: `"${ev.title || 'Event'}" scheduled on ${ev.date || 'upcoming date'}${ev.location ? ` at ${ev.location}` : ''}.`,
            type: 'calendar',
            link: '/calendar'
          });
        }

        // 1-Day Before Calendar Event Reminder
        if (ev.date) {
          const evDateStr = String(ev.date).slice(0, 10);
          if (evDateStr === tomorrow) {
            const remindKey = `event-remind-${ev.id}-${evDateStr}`;
            if (!seenEventReminders.current.has(remindKey) && !dismissedSet.has(remindKey)) {
              seenEventReminders.current.add(remindKey);
              safePush({
                id: remindKey,
                title: `Upcoming Event: ${ev.title || 'Event'}`,
                message: `Reminder: "${ev.title || 'Event'}" is happening tomorrow (${evDateStr})!`,
                type: 'calendar',
                link: '/calendar'
              });
            }
          }
        }
      });

      // F. Reports Approaching Deadline (Due Tomorrow & Unsubmitted by Instructor)
      safeReports.forEach(report => {
        if (!report || !report.deadline) return;
        const isMyDept = report.department === 'All' || (myDept && report.department === myDept);
        if (!isMyDept) return;

        const dStr = String(report.deadline).slice(0, 10);
        if (dStr === tomorrow) {
          const submissions = Array.isArray(report.submissions) ? report.submissions : [];
          const hasSubmitted = submissions.some(s =>
            String(s.instructor_id) === String(currentUser.id) ||
            (myDept && (s.department === myDept || s.instructor_department === myDept))
          );

          if (!hasSubmitted) {
            const remindKey = `inst-report-deadline-${report.id}-${dStr}`;
            if (!seenReportReminders.current.has(remindKey) && !dismissedSet.has(remindKey)) {
              seenReportReminders.current.add(remindKey);
              safePush({
                id: remindKey,
                title: `Report Deadline Approaching: ${report.title || 'Untitled'}`,
                message: `Reminder: Report "${report.title || 'Untitled'}" is due tomorrow (${dStr})! Please submit your accomplishment report.`,
                type: 'report',
                link: '/reports',
                reportId: report.id,
                reportTitle: report.title
              });
            }
          }
        }
      });
    }

    if (newlySeen && currentUser) {
      try {
        const seenPayload = {
          enrollments: Array.from(seenEnrollmentIds.current).slice(-500),
          submissions: Array.from(seenSubmissionKeys.current).slice(-500),
          reports: Array.from(seenReportIds.current).slice(-500),
          students: Array.from(seenStudentIds.current).slice(-500),
          faculty: Array.from(seenFacultyUserIds.current).slice(-500),
          letters: Array.from(seenLetterIds.current).slice(-500)
        };
        safeSetStorage(getSeenEntitiesStorageKey(currentUser), seenPayload);
      } catch {}
    }
  }

  async function reconcileUnreadConversationMessages(convList, currentUser, isInitialBaseline = false) {
    if (!currentUser || !Array.isArray(convList) || convList.length === 0) return;

    let readMap = {};
    try {
      const readKey = getReadConversationsKey(currentUser);
      readMap = JSON.parse(localStorage.getItem(readKey) || '{}');
    } catch {}

    const dismissedKey = getDismissedStorageKey(currentUser);
    let dismissedSet = new Set();
    try {
      dismissedSet = new Set(JSON.parse(localStorage.getItem(dismissedKey) || '[]').map(String));
    } catch {}

    const readKey = getReadNotificationsStorageKey(currentUser);
    let readNotifSet = new Set();
    try {
      readNotifSet = new Set(JSON.parse(localStorage.getItem(readKey) || '[]').map(String));
    } catch {}

    const newNotifs = [];

    for (const conv of convList) {
      if (!conv || !conv.id) continue;

      // If conversation alerts are dismissed entirely, skip
      if (dismissedSet.has(`conv-${conv.id}`)) {
        if (conv.last_message_time) seenConvLastMessageTime.current[conv.id] = String(conv.last_message_time);
        continue;
      }

      const lastReadTime = readMap[conv.id] ? new Date(readMap[conv.id]).getTime() : 0;

      // Fetch the actual message history of this conversation to extract ALL unread messages
      try {
        const msgs = await conversationsAPI.getMessages(conv.id);
        if (Array.isArray(msgs) && msgs.length > 0) {
          // Update messages store in memory
          setMessages(prev => {
            const local = prev[conv.id] || [];
            const fetchedIds = new Set(msgs.map(m => String(m.id)));
            const cutoff = Date.now() - 10000;
            const localOnly = local.filter(m =>
              !fetchedIds.has(String(m.id)) &&
              new Date(m.created_at || 0).getTime() > cutoff
            );
            return { ...prev, [conv.id]: [...msgs, ...localOnly] };
          });

          // Strictly filter for messages sent by OTHER users (exclude own messages completely!)
          const myIdStr = String(currentUser.id || currentUser._id || '');
          const othersMsgs = msgs.filter(m => {
            const mSenderId = String(m.sender_id || m.senderId || '');
            if (!mSenderId) return false;
            if (mSenderId === myIdStr) return false;
            if (currentUser.name && (m.sender_name === currentUser.name || m.senderName === currentUser.name || (m.sender_name && m.sender_name.toLowerCase() === currentUser.name.toLowerCase()))) return false;
            if (currentUser.role === 'admin' && (m.sender_name === 'Admin' || m.senderName === 'Admin' || m.sender_name === 'NSTP Administrator' || m.senderName === 'NSTP Administrator')) return false;
            if (m.type === 'deleted' || m.is_deleted) return false;
            return true;
          });

          if (othersMsgs.length > 0) {
            const isGroup = Boolean(conv.is_group || String(conv.id).startsWith('group-'));
            const groupName = isGroup ? (conv.group_name || conv.name || 'All Instructors') : null;

            // Push all unread messages from others, PLUS recent messages from others
            // (up to 20 most recent messages sent by other users in this conversation so all message types:
            // text, photos, files, voice, etc. are visible in notification dropdown!)
            const recentOthers = othersMsgs.slice(-20);
            recentOthers.forEach(m => {
              const mSenderId = String(m.sender_id || m.senderId || '');
              if (mSenderId === myIdStr) return; // Strict guard: never allow own message!

              let senderName = m.sender_name || m.senderName;
              if (!senderName || senderName === 'Someone') {
                const senderObj = (users || []).find(u => String(u.id) === mSenderId);
                senderName = senderObj?.name || conv.name || conv.with || 'User';
              }

              const mTime = new Date(m.created_at || m.timestamp || 0).getTime();
              const notifId = `msg-${m.id || `${conv.id}-${mTime}`}`;
              if (!dismissedSet.has(notifId)) {
                const isUnread = mTime > lastReadTime && !readNotifSet.has(notifId);

                // Format preview clearly according to content type (avoid duplicate icons)
                let previewText = m.text || '';
                if (m.type === 'voice') {
                  if (m.duration) {
                    previewText = `🎤 Voice message (${m.duration})`;
                  } else if (m.text && m.text.startsWith('🎤')) {
                    previewText = m.text;
                  } else {
                    previewText = '🎤 Voice message';
                  }
                } else if (m.type === 'image') {
                  if (m.text && m.text.trim()) {
                    previewText = m.text.startsWith('📸') ? m.text : `📸 ${m.text}`;
                  } else {
                    previewText = '📸 Photo';
                  }
                } else if (m.type === 'file') {
                  if (m.file_name) {
                    previewText = `📎 File: ${m.file_name}`;
                  } else if (m.text && m.text.startsWith('📎')) {
                    previewText = m.text;
                  } else {
                    previewText = m.text ? `📎 ${m.text}` : '📎 File attachment';
                  }
                } else if (m.type === 'call') {
                  previewText = '📞 Voice/Video call';
                } else if (!previewText) {
                  previewText = 'Sent you a message';
                }

                newNotifs.push({
                  id: notifId,
                  messageId: m.id,
                  time: formatRelativeTime(m.created_at || m.timestamp),
                  read: !isUnread,
                  title: isGroup ? `${senderName} in ${groupName}` : `Message from ${senderName}`,
                  message: previewText,
                  type: 'message',
                  link: `/chat?convId=${conv.id}`,
                  conversationId: conv.id,
                  senderId: mSenderId,
                  senderName: senderName,
                  isGroup: isGroup,
                  groupName: groupName,
                  createdAt: m.created_at || m.timestamp
                });
              }
            });
          }
        }
      } catch (err) {
        console.warn('Failed to fetch messages for unread inspection in conv', conv.id, err);
      }

      if (conv.last_message_time) {
        seenConvLastMessageTime.current[conv.id] = String(conv.last_message_time);
      }
    }

    // Sort all message notifications newest first
    newNotifs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    const myIdStr = String(currentUser.id || currentUser._id || '');
    setNotifications(prev => {
      const nonMessagePrev = (prev || []).filter(n => n.type !== 'message' && !String(n.id).startsWith('msg-') && !n.conversationId);
      const newMsgIds = new Set(newNotifs.map(n => String(n.id)));
      const otherPrevMsgs = (prev || []).filter(n => {
        const isMsg = n.type === 'message' || String(n.id).startsWith('msg-') || Boolean(n.conversationId);
        if (!isMsg) return false;
        if (newMsgIds.has(String(n.id))) return false;
        if (dismissedSet.has(String(n.id))) return false;
        const sId = String(n.senderId || n.sender_id || '');
        if (sId && sId === myIdStr) return false;
        if (currentUser.name && n.senderName && (n.senderName === currentUser.name || n.senderName.toLowerCase() === currentUser.name.toLowerCase())) return false;
        if (currentUser.name && typeof n.title === 'string' && n.title.toLowerCase().includes(currentUser.name.toLowerCase())) return false;
        if (currentUser.role === 'admin' && (n.senderName === 'Admin' || n.senderName === 'NSTP Administrator')) return false;
        if (currentUser.role === 'admin' && typeof n.title === 'string' && (n.title.includes('NSTP Administrator') || n.title.includes('Admin'))) return false;
        return true;
      });
      const updated = [...newNotifs, ...otherPrevMsgs, ...nonMessagePrev].slice(0, 100);
      safeSetStorage(getNotificationStorageKey(currentUser), updated);
      return updated;
    });

    const unreadItems = newNotifs.filter(n => !n.read);
    const unalertedItems = unreadItems.filter(n => !alertedMessageIds.current.has(String(n.id)));

    if (!isInitialBaseline && unalertedItems.length > 0) {
      const top = unalertedItems[0];
      const extra = unalertedItems.length > 1 ? ` (+${unalertedItems.length - 1} more)` : '';
      showToast(`${top.message}${extra}`, 'info', `💬 ${top.title}`);
      playNotificationSound();
      unalertedItems.slice(0, 3).forEach(item => {
        triggerDeviceNotification(item.title, item.message, item.link, item.id);
      });
    }

    // Always mark all unread items as alerted so background polling never repeats them!
    unreadItems.forEach(n => alertedMessageIds.current.add(String(n.id)));
  }

  async function checkConversationMessages(convList, currentUser) {
    if (!currentUser) return;
    const safeConvs = Array.isArray(convList) ? convList : [];
    await reconcileUnreadConversationMessages(safeConvs, currentUser, false);

    for (const conv of safeConvs) {
      const currTime = conv.last_message_time ? String(conv.last_message_time) : null;
      if (currTime) {
        seenConvLastMessageTime.current[conv.id] = currTime;
      }
    }
  }

  async function refreshLiveData() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('nstp_token') : null;
    if (!user || !token || window.__nstp_session_expired__) return;
    try {
      const [reportsData, conversationsData, usersData, studentsData, eventsData] = await Promise.all([
        reportsAPI.getAll().catch(() => null),
        conversationsAPI.getAll().catch(() => null),
        usersAPI.getAll().catch(() => null),
        studentsAPI.getAll().catch(() => null),
        calendarAPI.getEvents().catch(() => null)
      ]);

      let lettersData = null;
      try {
        lettersData = JSON.parse(localStorage.getItem('nstp_letter_templates') || 'null');
      } catch {}

      // Ensure Day 1 attendance is unlocked for all departments when database is reset
      try {
        const cachedAttendance = JSON.parse(localStorage.getItem('nstp_cached_attendance_records') || '[]');
        if (!Array.isArray(cachedAttendance) || cachedAttendance.length === 0) {
          localStorage.removeItem('nstp_closed_attendance_days');
          Object.keys(localStorage).filter(k => k.startsWith('nstp_draft_session_logs_')).forEach(k => localStorage.removeItem(k));
        }
      } catch (_) {}

      if (reportsData && Array.isArray(reportsData)) setReports(reportsData);
      if (usersData && Array.isArray(usersData) && usersData.length > 0) {
        setUsers(usersData);
        safeSetStorage('nstp_cached_all_users', usersData);
      }
      if (studentsData && Array.isArray(studentsData)) {
        setStudents(studentsData);
      }

      if (conversationsData && Array.isArray(conversationsData)) {
        setConversations(conversationsData);
        safeSetStorage('nstp_cached_conversations', conversationsData);
      }

      let pending = pendingEnrollments;
      if (user.role === 'admin') {
        const enrollmentsData = await enrollmentsAPI.getAll().catch(() => null);
        if (enrollmentsData && Array.isArray(enrollmentsData)) {
          pending = enrollmentsData.filter(e => e.status === 'Pending');
          setPendingEnrollments(pending);
        }
      }

      const activeConvs = (conversationsData && Array.isArray(conversationsData)) ? conversationsData : conversations;
      const activeReports = (reportsData && Array.isArray(reportsData)) ? reportsData : reports;
      const activeStudents = (studentsData && Array.isArray(studentsData)) ? studentsData : students;
      const activeUsers = (usersData && Array.isArray(usersData)) ? usersData : users;
      const activeEvents = (eventsData && Array.isArray(eventsData)) ? eventsData : [];
      const activeLetters = (lettersData && Array.isArray(lettersData)) ? lettersData : [];

      if (!baselineReady.current) {
        seedRealtimeBaseline(pending, activeReports, activeConvs, activeStudents, activeUsers, activeEvents, activeLetters, user);
      } else {
        reconcileSystemNotifications(pending, activeReports, activeStudents, activeEvents, activeLetters, activeUsers, user);
        detectRealtimeChanges(pending, activeReports, activeConvs, activeStudents, activeUsers, activeEvents, activeLetters, user);
        await checkConversationMessages(activeConvs, user);
      }
    } catch (error) {
      console.warn('Live refresh failed:', error);
    }
  }

  const notificationsLoadedUserRef = useRef(null);

  // Load notifications from storage when user logs in
  useEffect(() => {
    if (!user) {
      notificationsLoadedUserRef.current = null;
      return;
    }
    const key = getNotificationStorageKey(user);
    const legacyKey = user.role === 'admin' ? 'nstp_admin_notifications' : 'nstp_instructor_notifications';
    const saved = localStorage.getItem(key) || localStorage.getItem(legacyKey);
    let loaded = [];
    try {
      loaded = saved ? JSON.parse(saved) : [];
    } catch {
      loaded = [];
    }
    
    // Cross-check with read notifications registry so read state persists across browser restarts
    try {
      const readStorageKey = getReadNotificationsStorageKey(user);
      const readSet = new Set(JSON.parse(localStorage.getItem(readStorageKey) || '[]').map(String));
      loaded = (Array.isArray(loaded) ? loaded : []).map(n => {
        if (n && (n.read || readSet.has(String(n.id)))) {
          return { ...n, read: true };
        }
        return n;
      });
    } catch {}

    // Filter loaded notifications:
    // 1. Exclude own messages sent by current user
    // 2. Strictly filter by user role and department
    loaded = (Array.isArray(loaded) ? loaded : []).filter(n => {
      if (!n || !n.id) return false;
      const strId = String(n.id);
      const isMsg = n.type === 'message' || strId.startsWith('msg-') || strId.startsWith('conv-') || Boolean(n.conversationId);
      if (isMsg) {
        const sId = String(n.senderId || n.sender_id || '');
        const myId = String(user.id || user._id || '');
        if (sId && myId && sId === myId) return false;
        if (user.name && n.senderName && (n.senderName === user.name || n.senderName.toLowerCase() === user.name.toLowerCase())) return false;
        if (user.name && typeof n.title === 'string' && n.title.toLowerCase().includes(user.name.toLowerCase())) return false;
        if (user.role === 'admin' && (n.senderName === 'Admin' || n.senderName === 'NSTP Administrator')) return false;
        if (user.role === 'admin' && typeof n.title === 'string' && (n.title.includes('NSTP Administrator') || n.title.includes('Admin'))) return false;
        return true;
      }
      return isNotificationAllowedForRole(n, user);
    });

    setNotifications(Array.isArray(loaded) ? loaded : []);
    notificationsLoadedUserRef.current = user.id;
    safeSetStorage(key, loaded);

    // Load seen entity IDs from storage so existing items are never re-notified
    try {
      const seenData = JSON.parse(localStorage.getItem(getSeenEntitiesStorageKey(user)) || '{}');
      (seenData.enrollments || []).forEach(id => seenEnrollmentIds.current.add(id));
      (seenData.submissions || []).forEach(k => seenSubmissionKeys.current.add(k));
      (seenData.reports || []).forEach(id => seenReportIds.current.add(id));
      (seenData.students || []).forEach(id => seenStudentIds.current.add(id));
      (seenData.faculty || []).forEach(id => seenFacultyUserIds.current.add(id));
      (seenData.letters || []).forEach(id => seenLetterIds.current.add(id));
    } catch {}

    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, [user]);

  // Persist notifications to storage ONLY AFTER they have been loaded for this active user
  useEffect(() => {
    if (!user || notificationsLoadedUserRef.current !== user.id) return;
    safeSetStorage(getNotificationStorageKey(user), notifications);
  }, [notifications, user]);

  // Real-time polling while logged in (runs continuously in background as long as user is logged in)
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('nstp_token') : null;
    if (!user || !token || loading) return;
    refreshLiveData();

    const interval = setInterval(() => {
      const activeToken = typeof window !== 'undefined' ? localStorage.getItem('nstp_token') : null;
      if (!activeToken || !user) return;
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;
      refreshLiveData();
    }, POLL_INTERVAL_MS);

    // On wake or reconnect, immediately refresh data and socket
    const handleWakeOrOnline = () => {
      const activeToken = typeof window !== 'undefined' ? localStorage.getItem('nstp_token') : null;
      if (!activeToken || !user) return;
      if (document.visibilityState === 'visible' && (typeof navigator === 'undefined' || navigator.onLine)) {
        refreshLiveData();
        try {
          const s = getSocket();
          if (s && !s.connected) {
            s.connect();
          }
        } catch (_) {}
      }
    };

    document.addEventListener('visibilitychange', handleWakeOrOnline);
    window.addEventListener('online', handleWakeOrOnline);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleWakeOrOnline);
      window.removeEventListener('online', handleWakeOrOnline);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);



  function registerOutgoingCall(callId) {
    outgoingCallIdRef.current = callId;
    setOutgoingCallStatus('ringing');
  }

  function clearOutgoingCall() {
    outgoingCallIdRef.current = null;
    setOutgoingCallStatus(null);
  }

  async function declineIncomingCall(callId) {
    if (callId) handledCallIdsRef.current.add(String(callId));
    setIncomingCall(null);
    try {
      await callsAPI.end(callId, 'declined');
    } catch (e) {
      console.warn('Decline call failed:', e);
    }
  }

  async function answerIncomingCall(call) {
    const targetId = (typeof call === 'object' && call !== null) ? call.id : call;
    if (targetId) handledCallIdsRef.current.add(String(targetId));
    
    // Immediately dismiss incoming call overlay & stop ringtone synchronously
    setIncomingCall(null);
    setPendingAnsweredCall(call);
    window.dispatchEvent(new CustomEvent('nstp-call-answered', { detail: call }));

    if (targetId) {
      try {
        await callsAPI.answer(targetId);
      } catch (e) {
        console.warn('Answer call warning:', e);
      }
    }
  }

  // Handle session expiry — api.js dispatches this event so React Router can
  // navigate to /login without a hard reload, preserving any open form state.
  useEffect(() => {
    function onSessionExpired(e) {
      window.__nstp_session_expired__ = true;
      localStorage.removeItem('nstp_token');
      localStorage.removeItem('nstp_cached_user');
      const banner = document.createElement('div');
      banner.id = 'session-expired-banner';
      banner.style.cssText = [
        'position:fixed', 'top:0', 'left:0', 'right:0', 'z-index:99999',
        'background:#b91c1c', 'color:#fff', 'text-align:center',
        'padding:14px 16px', 'font-size:14px', 'font-weight:700',
        'box-shadow:0 4px 14px rgba(0,0,0,.45)',
      ].join(';');
      banner.textContent = e?.detail?.message || '⚠️ Your session has been terminated because your account was logged in on another device.';
      document.body.appendChild(banner);
      setTimeout(() => {
        document.getElementById('session-expired-banner')?.remove();
      }, 7000);
      setUser(null);
      setLoading(false);
      const loginUrl = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') + '/login';
      if (!window.location.pathname.endsWith('/login')) {
        window.location.href = loginUrl;
      }
    }
    window.addEventListener('nstp-session-expired', onSessionExpired);
    return () => window.removeEventListener('nstp-session-expired', onSessionExpired);
  }, []);

  // Restore session & data from stored cache on mount INSTANTLY (0ms)
  useEffect(() => {
    try {
      if (!localStorage.getItem('nstp_fresh_clean_messages_v2')) {
        localStorage.removeItem('nstp_cached_messages');
        localStorage.removeItem('nstp_read_conversations');
        localStorage.setItem('nstp_fresh_clean_messages_v2', 'true');
      }
    } catch (_) {}

    const token = localStorage.getItem('nstp_token');
    const cachedUser = localStorage.getItem('nstp_cached_user');
    const cachedAllUsers = localStorage.getItem('nstp_cached_all_users');
    const cachedConvs = localStorage.getItem('nstp_cached_conversations');
    const cachedMsgs = localStorage.getItem('nstp_cached_messages');

    if (token) {
      if (cachedUser) {
        try { setUser(JSON.parse(cachedUser)); } catch {}
      }
      if (cachedAllUsers) {
        try { setUsers(JSON.parse(cachedAllUsers)); } catch {}
      }
      const cachedStudents = localStorage.getItem('nstp_cached_students');
      if (cachedStudents) {
        try { setStudents(JSON.parse(cachedStudents)); } catch {}
      }
      const cachedEnrollments = localStorage.getItem('nstp_cached_enrollments');
      if (cachedEnrollments) {
        try {
          const parsed = JSON.parse(cachedEnrollments);
          if (Array.isArray(parsed)) setPendingEnrollments(parsed.filter(e => e.status === 'Pending'));
        } catch {}
      }
      if (cachedConvs) {
        try { setConversations(JSON.parse(cachedConvs)); } catch {}
      }
      if (cachedMsgs) {
        try { setMessages(JSON.parse(cachedMsgs)); } catch {}
      }
      setLoading(false);
      loadCurrentUser();
    } else {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadCurrentUser() {
    try {
      const userData = await usersAPI.getMe();
      setUser(userData);
      safeSetStorage('nstp_cached_user', userData);
      setLoading(false);
      await loadAllData(userData);
    } catch (error) {
      console.error('Failed to load user:', error);
      if (
        error?.status === 401 ||
        error?.status === 403 ||
        error?.code === 'TOKEN_EXPIRED' ||
        String(error?.message).toLowerCase().includes('token') ||
        String(error?.message).toLowerCase().includes('unauthorized')
      ) {
        localStorage.removeItem('nstp_token');
        localStorage.removeItem('nstp_cached_user');
        setUser(null);
      }
      setLoading(false);
    }
  }

  async function loadAllData(currentUser) {
    try {
      const activeUser = currentUser || user;
      const isAdmin = activeUser?.role === 'admin';

      // 1. Users / Instructors (update immediately)
      usersAPI.getAll().then(usersData => {
        if (usersData && Array.isArray(usersData) && usersData.length > 0) {
          setUsers(usersData);
          safeSetStorage('nstp_cached_all_users', usersData);
        }
      }).catch(err => console.warn('Users load error:', err));

      // 2. Students (update immediately)
      studentsAPI.getAll().then(studentsData => {
        if (studentsData && Array.isArray(studentsData)) {
          setStudents(studentsData);
          safeSetStorage('nstp_cached_students', studentsData);
        }
      }).catch(err => console.warn('Students load error:', err));

      // 3. Enrollments / Pending (update immediately for Admin)
      if (isAdmin) {
        enrollmentsAPI.getAll().then(enrollmentsData => {
          if (enrollmentsData && Array.isArray(enrollmentsData)) {
            setPendingEnrollments(enrollmentsData.filter(e => e.status === 'Pending'));
            safeSetStorage('nstp_cached_enrollments', enrollmentsData);
          }
        }).catch(err => console.warn('Enrollments load error:', err));
      }

      // 4. Conversations & Messages (update immediately)
      conversationsAPI.getAll().then(conversationsData => {
        if (conversationsData && Array.isArray(conversationsData) && conversationsData.length > 0) {
          setConversations(conversationsData);
          safeSetStorage('nstp_cached_conversations', conversationsData);

          // Fetch messages asynchronously in background
          conversationsData.forEach(conv => {
            conversationsAPI.getMessages(conv.id)
              .then(msgs => {
                if (Array.isArray(msgs)) {
                  setMessages(prev => {
                    const next = { ...prev, [conv.id]: msgs };
                    safeSetStorage('nstp_cached_messages', next);
                    return next;
                  });
                }
              })
              .catch(() => {});
          });

          if (activeUser) {
            reconcileUnreadConversationMessages(conversationsData, activeUser, true);
          }
        }
      }).catch(err => console.warn('Conversations load error:', err));

      // 5. Reports (update immediately)
      reportsAPI.getAll().then(reportsData => {
        if (reportsData && Array.isArray(reportsData)) {
          setReports(reportsData);
          safeSetStorage('nstp_cached_reports', reportsData);
        }
      }).catch(err => console.warn('Reports load error:', err));

      // 6. Archives & Batch (update immediately)
      archivesAPI.getAll().then(archivesData => {
        if (archivesData && Array.isArray(archivesData) && archivesData.length > 0) {
          setArchivedYears(archivesData);
          safeSetStorage('nstp_cached_archives_v6', archivesData);
        }
        // If empty, keep whatever is already in state (don't overwrite with fake data)
      }).catch(err => {
        console.warn('Archives load error:', err);
        // Keep existing state on error — don't overwrite with fake data
      });

      archivesAPI.getCurrentBatch().then(batchData => {
        setCurrentBatch(batchData?.year ? batchData.year.toString() : '2024-2025 1st Semester');
        if (batchData && (batchData.start_month || batchData.end_month || batchData.startMonth || batchData.endMonth)) {
          updateActiveBatchRange({
            startMonth: batchData.start_month || batchData.startMonth,
            endMonth: batchData.end_month || batchData.endMonth,
            startDate: batchData.start_date || batchData.startDate,
            endDate: batchData.end_date || batchData.endDate
          });
        }
      }).catch(err => console.warn('Batch load error:', err));

    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password, _forceLogin = true) {
    try {
      let response = await authAPI.login(email, password, true);
      if (response && response.warning && response.activeSession && !response.token) {
        response = await authAPI.login(email, password, true);
      }
      if (response && response.require2FA) {
        return {
          success: false,
          require2FA: true,
          tempToken: response.tempToken,
          email: response.email,
          deliveryEmail: response.deliveryEmail,
          maskedEmail: response.maskedEmail,
          role: response.role,
          roleTitle: response.roleTitle,
          ticketId: response.ticketId,
          cooldownRemaining: response.cooldownRemaining,
          reused: response.reused,
          message: response.message || 'Two-factor authentication code required'
        };
      }

      // Defense Fail-Safe Guard: Always enforce 2FA verification for Admin & ALL Instructors (CWTS, LTS, ROTC)
      const isInstructorUser = response && response.user && (response.user.role === 'instructor' || response.user.department === 'CWTS' || response.user.department === 'LTS' || response.user.department === 'ROTC');
      if (response && response.token && response.user && (response.user.role === 'admin' || isInstructorUser)) {
        window.__nstp_pending_admin_auth__ = {
          token: response.token,
          user: response.user
        };
        const uEmail = response.user.email || email;
        const atIdx = uEmail.indexOf('@');
        const masked = atIdx > 2 ? uEmail[0] + '***' + uEmail.slice(atIdx - 2) : uEmail;
        return {
          success: false,
          require2FA: true,
          tempToken: 'pending_2fa_jwt_' + Date.now(),
          email: uEmail,
          deliveryEmail: response.user.email || email,
          maskedEmail: masked,
          role: response.user.role,
          cooldownRemaining: 60,
          reused: false,
          message: 'Two-Factor Authentication required for account access.'
        };
      }

      if (!response || !response.token) return { success: false, message: response?.message || 'Invalid server response' };
      window.__nstp_session_expired__ = false;
      safeSetStorage('nstp_token', response.token);
      safeSetStorage('nstp_cached_user', response.user);
      setUser(response.user);

      // Restore full cached state immediately for instant 0ms screen rendering
      try {
        const cachedStudents = JSON.parse(localStorage.getItem('nstp_cached_students') || '[]');
        if (Array.isArray(cachedStudents) && cachedStudents.length > 0) setStudents(cachedStudents);
        const cachedAllUsers = JSON.parse(localStorage.getItem('nstp_cached_all_users') || '[]');
        if (Array.isArray(cachedAllUsers) && cachedAllUsers.length > 0) setUsers(cachedAllUsers);
        const cachedEnrollments = JSON.parse(localStorage.getItem('nstp_cached_enrollments') || '[]');
        if (Array.isArray(cachedEnrollments) && cachedEnrollments.length > 0) {
          setPendingEnrollments(cachedEnrollments.filter(e => e.status === 'Pending'));
        }
        const cachedConvs = JSON.parse(localStorage.getItem('nstp_cached_conversations') || '[]');
        if (Array.isArray(cachedConvs) && cachedConvs.length > 0) setConversations(cachedConvs);
        const cachedMsgs = JSON.parse(localStorage.getItem('nstp_cached_messages') || '{}');
        if (cachedMsgs && typeof cachedMsgs === 'object' && Object.keys(cachedMsgs).length > 0) setMessages(cachedMsgs);
      } catch (_) {}

      setViewingArchiveState(false);
      setArchiveViewDataState(null);
      try {
        localStorage.removeItem('nstp_viewing_archive');
        localStorage.removeItem('nstp_archive_view_data_v6');
        localStorage.removeItem('nstp_archive_view_data_v5');
        localStorage.removeItem('nstp_archive_view_data');
      } catch (_) {}

      setLoading(false);
      // Load all data in background so login transitions instantly on mobile devices
      loadAllData(response.user).catch(err => console.warn('Background data load error:', err));
      return { success: true, role: response.user.role };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: error.message || 'Invalid email or password' };
    }
  }

  async function verify2FA(email, otp, tempToken) {
    try {
      const response = await authAPI.verify2FA(email, otp, tempToken);

      if (!response || !response.token) {
        return { success: false, message: response?.message || 'Invalid or expired 2FA code.' };
      }
      window.__nstp_pending_admin_auth__ = null;
      window.__nstp_session_expired__ = false;
      safeSetStorage('nstp_token', response.token);
      safeSetStorage('nstp_cached_user', response.user);
      setUser(response.user);

      try {
        const cachedStudents = JSON.parse(localStorage.getItem('nstp_cached_students') || '[]');
        if (Array.isArray(cachedStudents) && cachedStudents.length > 0) setStudents(cachedStudents);
        const cachedAllUsers = JSON.parse(localStorage.getItem('nstp_cached_all_users') || '[]');
        if (Array.isArray(cachedAllUsers) && cachedAllUsers.length > 0) setUsers(cachedAllUsers);
        const cachedEnrollments = JSON.parse(localStorage.getItem('nstp_cached_enrollments') || '[]');
        if (Array.isArray(cachedEnrollments) && cachedEnrollments.length > 0) {
          setPendingEnrollments(cachedEnrollments.filter(e => e.status === 'Pending'));
        }
        const cachedConvs = JSON.parse(localStorage.getItem('nstp_cached_conversations') || '[]');
        if (Array.isArray(cachedConvs) && cachedConvs.length > 0) setConversations(cachedConvs);
        const cachedMsgs = JSON.parse(localStorage.getItem('nstp_cached_messages') || '{}');
        if (cachedMsgs && typeof cachedMsgs === 'object' && Object.keys(cachedMsgs).length > 0) setMessages(cachedMsgs);
      } catch (_) {}

      setViewingArchiveState(false);
      setArchiveViewDataState(null);
      try {
        localStorage.removeItem('nstp_viewing_archive');
        localStorage.removeItem('nstp_archive_view_data_v6');
        localStorage.removeItem('nstp_archive_view_data_v5');
        localStorage.removeItem('nstp_archive_view_data');
      } catch (_) {}

      setLoading(false);
      loadAllData(response.user).catch(err => console.warn('Background data load error:', err));
      return { success: true, role: response.user.role };
    } catch (error) {
      console.error('2FA verification error:', error);
      return {
        success: false,
        message: error.message || 'Invalid authentication code',
        status: error.status,
        code: error.code,
        lockoutRemaining: error.lockoutRemaining,
        isLocked: error.isLocked || error.status === 429,
        attemptsRemaining: error.attemptsRemaining
      };
    }
  }

  async function resend2FA(email, tempToken) {
    try {
      const response = await authAPI.resend2FA(email, tempToken);
      return { 
        success: true, 
        message: response?.message || 'Verification code resent successfully',
        ticketId: response?.ticketId,
        cooldownRemaining: response?.cooldownRemaining || 60,
        sendAttempts: response?.sendAttempts,
        attemptsRemaining: response?.attemptsRemaining
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to resend code',
        status: error.status,
        code: error.code,
        lockoutRemaining: error.lockoutRemaining,
        isLocked: error.isLocked || error.status === 429,
        cooldownRemaining: error.cooldownRemaining
      };
    }
  }

  async function logout() {
    try {
      await authAPI.logout();
    } catch (_) {}
    localStorage.removeItem('nstp_token');
    localStorage.removeItem('nstp_cached_user');
    localStorage.removeItem('nstp_cached_conversations');
    localStorage.removeItem('nstp_cached_messages');
    localStorage.removeItem('nstp_active_chat');

    // Completely clear all pending 2FA sessions, cooldowns, and lockout timers so logout lands on clean Portal Login
    try {
      sessionStorage.removeItem('nstp_2fa_pending_session_v3');
      sessionStorage.removeItem('nstp_2fa_pending_session');
      sessionStorage.removeItem('nstp_2fa_resend_cooldown');
      sessionStorage.removeItem('nstp_2fa_lockout_timer');
      sessionStorage.removeItem('nstp_forgot_resend_cooldown');
      localStorage.removeItem('nstp_2fa_pending_session_v3');
      localStorage.removeItem('nstp_2fa_pending_session');
      localStorage.removeItem('nstp_2fa_resend_cooldown');
      localStorage.removeItem('nstp_2fa_lockout_timer');
    } catch (_) {}

    if (user) {
      safeSetStorage(getNotificationStorageKey(user), notifications);
      try {
        const seenPayload = {
          enrollments: Array.from(seenEnrollmentIds.current).slice(-500),
          submissions: Array.from(seenSubmissionKeys.current).slice(-500),
          reports: Array.from(seenReportIds.current).slice(-500),
          students: Array.from(seenStudentIds.current).slice(-500),
          faculty: Array.from(seenFacultyUserIds.current).slice(-500),
          letters: Array.from(seenLetterIds.current).slice(-500)
        };
        safeSetStorage(getSeenEntitiesStorageKey(user), seenPayload);
        safeSetStorage(`nstp_last_logout_${user.id}`, new Date().toISOString());
      } catch {}
    }
    notificationsLoadedUserRef.current = null;
    setUser(null);
    setUsers([
      { id: 1, name: 'NSTP Administrator', email: 'richardbelen99@gmail.com', role: 'admin', department: 'NSTP Office', avatar: 'avatar-4' },
      { id: 2, name: 'CWTS Facilitator', email: 'belenjoshua58@gmail.com', role: 'instructor', department: 'CWTS', avatar: 'avatar-2' },
      { id: 3, name: 'LTS Facilitator', email: 'lts@gmail.com', role: 'instructor', department: 'LTS', avatar: 'avatar-6' },
      { id: 4, name: 'ROTC Training Staff', email: 'rotc@gmail.com', role: 'instructor', department: 'ROTC', avatar: 'avatar-8' },
    ]);
    setStudents([]);
    setPendingEnrollments([]);
    setReports([]);
    setConversations([]);
    setMessages({});
    setNotifications([]);
    setToasts([]);
    setIncomingCall(null);
    clearOutgoingCall();
    resetRealtimeBaseline();
    setViewingArchiveState(false);
    setArchiveViewDataState(null);
    try {
      localStorage.removeItem('nstp_viewing_archive');
      localStorage.removeItem('nstp_archive_view_data_v6');
      localStorage.removeItem('nstp_archive_view_data_v5');
      localStorage.removeItem('nstp_archive_view_data');
    } catch (_) {}
  }

  async function updateUserData(updatedData) {
    const targetId = user?.id || 'me';
    const updated = await usersAPI.update(targetId, updatedData);
    setUser(updated);
    safeSetStorage('nstp_cached_user', updated);
    try {
      const usersData = await usersAPI.getAll();
      setUsers(usersData);
      safeSetStorage('nstp_cached_all_users', usersData);
    } catch (_) {}
    return updated;
  }

  async function changeUserPassword(newPassword, currentPassword) {
    await usersAPI.changePassword(user.id, newPassword, currentPassword);
    return true;
  }

  // ── Student management ────────────────────────────────────────────────────────

  async function addStudentFunc(student) {
    const newStudent = await studentsAPI.add(student);
    const studentsData = await studentsAPI.getAll();
    setStudents(studentsData);
    return newStudent;
  }

  async function updateStudentFunc(id, data) {
    const updated = await studentsAPI.update(id, data);
    setStudents(prev => prev.map(s => {
      const match = (s.id && String(s.id) === String(id)) || (s.studentId && String(s.studentId) === String(id));
      return match ? { ...s, ...updated } : s;
    }));
    return updated;
  }

  async function deleteStudentFunc(id) {
    await studentsAPI.delete(id);
    setStudents(prev => prev.filter(s => s.id !== id));
  }

  // ── Enrollment management ─────────────────────────────────────────────────────

  async function submitEnrollmentFunc(enrollment) {
    const newEnrollment = await enrollmentsAPI.submit(enrollment);
    setPendingEnrollments(prev => [...prev, newEnrollment]);
    return newEnrollment;
  }

  async function approveEnrollmentFunc(id, designatedSection) {
    const updated = await enrollmentsAPI.update(id, 'Approved', designatedSection);
    setPendingEnrollments(prev => prev.filter(e => e.id !== id));
    const studentsData = await studentsAPI.getAll();
    setStudents(studentsData);
    return updated;
  }

  async function declineEnrollmentFunc(id) {
    await enrollmentsAPI.update(id, 'Declined');
    setPendingEnrollments(prev => prev.filter(e => e.id !== id));
  }

  // ── Report management ─────────────────────────────────────────────────────────

  async function addReportFunc(report) {
    const newReport = await reportsAPI.add(report);
    const reportsData = await reportsAPI.getAll();
    setReports(reportsData);
    return newReport;
  }

  async function updateReportFunc(id, data) {
    const updated = await reportsAPI.update(id, data);
    setReports(prev => prev.map(r => r.id === id ? updated : r));
    return updated;
  }

  async function deleteReportFunc(id) {
    await reportsAPI.delete(id);
    setReports(prev => prev.filter(r => r.id !== id));
  }

  async function submitReportFunc(reportId, submission) {
    await reportsAPI.submit(
      reportId,
      submission.content,
      submission.attachment?.data,
      submission.attachment?.name
    );
    const reportsData = await reportsAPI.getAll();
    setReports(reportsData);
  }

  // ── Message management ────────────────────────────────────────────────────────

  function updateMessageInState(conversationId, messageId, updater) {
    setMessages(prev => ({
      ...prev,
      [conversationId]: (prev[conversationId] || []).map(m =>
        m.id === messageId ? updater(m) : m
      ),
    }));
  }

  async function editMessageFunc(conversationId, messageId, newText) {
    let prevHistory = [];
    const currentList = messages[conversationId] || [];
    const targetMsg = currentList.find(m => m.id === messageId);
    if (targetMsg) {
      try {
        const raw = targetMsg.edit_history || targetMsg.editHistory;
        prevHistory = typeof raw === 'string' ? JSON.parse(raw) : (Array.isArray(raw) ? [...raw] : []);
      } catch (_) { prevHistory = []; }
      const oldText = targetMsg.text || targetMsg.content || '';
      if (oldText && oldText !== newText) {
        prevHistory.push({
          text: oldText,
          edited_at: new Date().toISOString()
        });
      }
    }
    
    // 1. Optimistically update local message state immediately
    updateMessageInState(conversationId, messageId, m => ({ 
      ...m, 
      text: newText, 
      content: newText, 
      edited: 1,
      edit_history: prevHistory,
      editHistory: prevHistory
    }));

    try {
      const updated = await conversationsAPI.editMessage(conversationId, messageId, newText);
      if (updated) {
        updateMessageInState(conversationId, messageId, m => ({
          ...m,
          ...updated,
          edit_history: updated.edit_history || prevHistory,
          editHistory: updated.edit_history || prevHistory
        }));
      }
      return updated;
    } catch (err) {
      console.error('API editMessage error:', err);
    }
  }

  async function deleteMessageFunc(conversationId, messageId, forEveryone = false) {
    // 1. Optimistically update local message state IMMEDIATELY (0ms instant response)
    updateMessageInState(conversationId, messageId, m => {
      if (forEveryone) {
        return { ...m, deleted_for_everyone: true, deletedForEveryone: true, type: 'deleted', text: '[deleted]' };
      }
      let deletedFor = [];
      if (m.deleted_for) {
        try {
          deletedFor = typeof m.deleted_for === 'string' ? JSON.parse(m.deleted_for) : m.deleted_for;
        } catch { deletedFor = []; }
      }
      if (user && !deletedFor.includes(user.id)) deletedFor.push(user.id);
      return { ...m, deleted_for: JSON.stringify(deletedFor), deletedForMe: true };
    });

    // 2. Perform backend API deletion asynchronously in background
    try {
      await conversationsAPI.deleteMessage(conversationId, messageId, forEveryone);
    } catch (err) {
      console.error('API deleteMessage error:', err);
    }

    return { success: true };
  }

  async function restoreMessageFunc(conversationId, messageId) {
    const restored = await conversationsAPI.restoreMessage(conversationId, messageId);
    setMessages(prev => ({
      ...prev,
      [conversationId]: (prev[conversationId] || []).map(m => m.id === messageId ? restored : m),
    }));
    return restored;
  }

  async function addReactionFunc(conversationId, messageId, emoji) {
    const result = await conversationsAPI.addReaction(conversationId, messageId, emoji);
    updateMessageInState(conversationId, messageId, m => ({ ...m, reactions: result.reactions }));
    return result;
  }

  async function addReportCommentFunc(reportId, comment) {
    const saved = await reportsAPI.addComment(reportId, comment.text);
    setReports(prev =>
      prev.map(r => r.id !== reportId ? r : { ...r, comments: [...(r.comments || []), saved] })
    );
    return saved;
  }

  // ── Chat management ───────────────────────────────────────────────────────────

  async function startConversationFunc(withUser) {
    if (!withUser?.id) return null;
    const targetUserId = Number(withUser.id);

    const existing = conversations.find(c =>
      !c.isGroup && !c.is_group && (
        Number(c.participant_1_id) === targetUserId ||
        Number(c.participant_2_id) === targetUserId ||
        c.participants?.includes(targetUserId) ||
        c.with === withUser.name
      )
    );

    if (existing) {
      return existing;
    }

    const conversation = await conversationsAPI.create(targetUserId);
    setConversations(prev => {
      if (prev.some(c => String(c.id) === String(conversation.id))) return prev;
      return [conversation, ...prev];
    });
    setMessages(prev => ({ ...prev, [conversation.id]: prev[conversation.id] || [] }));
    return conversation;
  }

  async function createGroupChatFunc(name, participantIds) {
    const conversation = await conversationsAPI.createGroup(name, participantIds);
    if (!conversations.some(c => c.id === conversation.id)) {
      setConversations(prev => [conversation, ...prev]);
      setMessages(prev => ({ ...prev, [conversation.id]: [] }));
    }
    return conversation;
  }

  async function sendMessageFunc(conversationId, message) {
    const msgType = message.type || 'text';
    const newMsg = await conversationsAPI.sendMessage(conversationId, {
      text: message.text,
      type: msgType,
      image_url: message.imageUrl,
      file_url: message.fileUrl,
      file_name: message.fileName,
      audio_url: message.audioUrl,
      duration: message.duration,
    });

    const msgWithTime = {
      ...newMsg,
      time: new Date(newMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      senderId: newMsg.sender_id ?? user?.id,
      sender_id: newMsg.sender_id ?? user?.id,
      senderName: newMsg.sender_name ?? user?.name,
      sender_name: newMsg.sender_name ?? user?.name,
      sender: 'me',
    };

    setMessages(prev => {
      const existing = prev[conversationId] || [];
      if (existing.some(m => String(m.id) === String(msgWithTime.id))) {
        return prev;
      }
      return {
        ...prev,
        [conversationId]: [...existing, msgWithTime],
      };
    });

    setConversations(prev => prev.map(c => {
      if (c.id !== conversationId) return c;
      let preview = message.text;
      if (!preview || !preview.trim()) {
        if (msgType === 'image') preview = '📸 Photo';
        else if (msgType === 'file') preview = `📎 ${message.fileName || 'File'}`;
        else if (msgType === 'voice') preview = '🎤 Voice message';
        else preview = 'Message';
      }
      return { ...c, last_message: preview, last_message_time: new Date().toISOString() };
    }));

    return msgWithTime;
  }

  async function deleteConversationFunc(conversationId) {
    try {
      await conversationsAPI.delete(conversationId);
    } catch (err) {
      console.warn('Delete conversation API notice:', err.message);
    }
    setConversations(prev => {
      const updated = prev.filter(c => c.id !== conversationId);
      safeSetStorage('nstp_cached_conversations', updated);
      return updated;
    });
    setMessages(prev => {
      const next = { ...prev };
      delete next[conversationId];
      safeSetStorage('nstp_cached_messages', next);
      return next;
    });
  }

  async function clearMessagesFunc(conversationId) {
    setMessages(prev => {
      const next = { ...prev, [conversationId]: [] };
      safeSetStorage('nstp_cached_messages', next);
      return next;
    });
    setConversations(prev => {
      const updated = prev.map(c =>
        c.id === conversationId ? { ...c, last_message: null, last_message_time: null, last_sender_id: null } : c
      );
      safeSetStorage('nstp_cached_conversations', updated);
      return updated;
    });
    try {
      await conversationsAPI.clearMessages(conversationId);
    } catch (err) {
      console.error('Failed to clear messages on server:', err);
    }
  }

  const getUserConversations = useCallback(() => {
    if (!user) return [];
    const uid = String(user.id ?? '');
    const currentList = Array.isArray(conversations) ? [...conversations] : [];

    // Ensure Group Chat is present
    const hasGroup = currentList.some(c => 
      c.isGroup || c.is_group || String(c.id).startsWith('group-') || c.groupName === 'All Instructors' || c.group_name === 'All Instructors'
    );
    if (!hasGroup) {
      currentList.unshift({
        id: 'group-all-instructors',
        is_group: 1,
        isGroup: true,
        group_name: 'All Instructors',
        groupName: 'All Instructors',
        with: 'All Instructors',
        participants: (users || []).map(u => u.id),
      });
    }

    // Auto-ensure 1-on-1 direct conversation with all other instructors / admin
    const otherStaff = (users || []).filter(u => 
      String(u.id) !== uid && (u.role === 'admin' || u.role === 'instructor')
    );

    for (const other of otherStaff) {
      const p1 = Math.min(Number(user.id), Number(other.id));
      const p2 = Math.max(Number(user.id), Number(other.id));
      const convId = `${p1}-${p2}`;
      
      const exists = currentList.some(c => 
        String(c.id) === convId ||
        (!c.is_group && !c.isGroup && (
          (String(c.participant_1_id) === uid && String(c.participant_2_id) === String(other.id)) ||
          (String(c.participant_2_id) === uid && String(c.participant_1_id) === String(other.id))
        ))
      );

      if (!exists) {
        currentList.push({
          id: convId,
          participant_1_id: p1,
          participant_2_id: p2,
          is_group: 0,
          isGroup: false,
          with: other.name,
          partnerId: other.id,
          partnerName: other.name,
          partnerAvatar: other.avatar,
          partnerPicture: other.profilePicture,
          partnerRole: other.role,
          partnerDepartment: other.department,
          avatar: other.avatar,
          profilePicture: other.profilePicture,
          participants: [p1, p2],
        });
      }
    }

    // Return all conversations relevant to this user, updating partnerName from users table if changed
    return currentList
      .filter(c => {
        if (!c) return false;
        const p1 = String(c.participant_1_id ?? '');
        const p2 = String(c.participant_2_id ?? '');
        if (uid && (p1 === uid || p2 === uid)) return true;
        const isGroup = Boolean(c.isGroup || c.is_group || String(c.id).startsWith('group-') || c.groupName || c.group_name);
        if (isGroup) {
          if (Array.isArray(c.participants) && c.participants.length > 0) {
            return c.participants.some(p => String(p) === uid);
          }
          return true;
        }
        return false;
      })
      .map(c => {
        const isGroup = Boolean(c.isGroup || c.is_group || String(c.id).startsWith('group-') || c.groupName || c.group_name);
        if (isGroup) {
          return {
            ...c,
            with: c.groupName || c.group_name || 'All Instructors',
            isGroup: true,
          };
        }
        const p1 = String(c.participant_1_id ?? '');
        const p2 = String(c.participant_2_id ?? '');
        const otherId = p1 === uid ? p2 : p1;
        const otherUser = (users || []).find(u => String(u.id) === String(otherId));
        return {
          ...c,
          partnerId: otherId,
          partnerName: otherUser?.name || c.partnerName || c.with || 'Instructor',
          with: otherUser?.name || c.partnerName || c.with || 'Instructor',
          partnerAvatar: otherUser?.avatar || c.partnerAvatar || c.avatar,
          partnerPicture: otherUser?.profilePicture || c.partnerPicture || c.profilePicture,
          partnerRole: otherUser?.role || c.partnerRole,
          partnerDepartment: otherUser?.department || c.partnerDepartment,
          isGroup: false,
        };
      });
  }, [conversations, user, users]);

  async function clearBatchData() {
    await clearBatch();
    setStudents([]);
    setReports([]);
  }

  const userConversations = useMemo(() => getUserConversations(), [getUserConversations]);

  const markAllMessagesAsRead = useCallback(() => {
    if (!user) return;
    const now = Date.now();
    const readKey = getReadConversationsKey(user);

    try {
      const currentMap = JSON.parse(localStorage.getItem(readKey) || '{}');
      const userConvs = getUserConversations();
      (userConvs || []).forEach(c => {
        if (c && c.id) currentMap[String(c.id)] = now;
      });
      safeSetStorage(readKey, currentMap);
    } catch {}

    let updatedNotifs = [];
    setNotifications(prev => {
      const list = prev || [];
      updatedNotifs = list.map(n => {
        const isMsg = n.type === 'message' || Boolean(n.conversationId);
        return isMsg ? { ...n, read: true } : n;
      });
      safeSetStorage(getNotificationStorageKey(user), updatedNotifs);
      return updatedNotifs;
    });

    try {
      const readStorageKey = getReadNotificationsStorageKey(user);
      const existing = JSON.parse(localStorage.getItem(readStorageKey) || '[]');
      const readSet = new Set(existing.map(String));
      (notificationsRef.current || []).forEach(n => {
        if (n.type === 'message' || n.conversationId) {
          readSet.add(String(n.id));
        }
      });
      safeSetStorage(readStorageKey, Array.from(readSet).slice(-1000));
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nstp_conversation_read', {
        detail: { conversationId: 'all', userId: user.id, timestamp: now }
      }));
    }
  }, [user, getUserConversations]);

  const contextValue = {
    user, login, verify2FA, resend2FA, logout, updateUser: updateUserData, changePassword: changeUserPassword, allUsers: users,
    students, setStudents, reports, conversations: userConversations, messages, setMessages, pendingEnrollments,
    archivedYears, currentBatch,
    viewingArchive, archiveViewData, setViewingArchive, setArchiveViewData,
    addStudent: addStudentFunc, updateStudent: updateStudentFunc, deleteStudent: deleteStudentFunc,
    addReport: addReportFunc, updateReport: updateReportFunc, deleteReport: deleteReportFunc,
    submitReport: submitReportFunc, addReportComment: addReportCommentFunc,
    startConversation: startConversationFunc, createGroupChat: createGroupChatFunc,
    sendMessage: sendMessageFunc, getUserConversations, editMessage: editMessageFunc,
    addReaction: addReactionFunc, deleteMessage: deleteMessageFunc, restoreMessage: restoreMessageFunc,
    deleteConversation: deleteConversationFunc, clearMessages: clearMessagesFunc,
    clearBatchData, submitEnrollment: submitEnrollmentFunc,
    approveEnrollment: approveEnrollmentFunc, declineEnrollment: declineEnrollmentFunc,
    loading, refreshData: loadAllData, refreshLiveData,
    notifications, setNotifications, pushNotification, deleteNotifications, markAllNotificationsRead,
    markConversationAsRead, markAllMessagesAsRead,
    toasts, dismissToast, showToast,
    incomingCall, outgoingCallStatus,
    pendingAnsweredCall, setPendingAnsweredCall,
    registerOutgoingCall, clearOutgoingCall,
    answerIncomingCall, declineIncomingCall,
    displayZoom, setDisplayZoom,
    currentBatchRange, setCurrentBatchRange: setCurrentBatchRangeState,
    updateActiveBatchRange,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      <BrowserRouter basename={BASE_PATH}>
        <GlobalKeyboardManager />
        {/* Global Floating Toast Notifications Container */}
        <div className="fixed top-4 right-4 z-[99999] flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl shadow-2xl backdrop-blur-xl border transition-all duration-300 transform animate-in slide-in-from-top-3 fade-in ${
                toast.type === 'success'
                  ? 'bg-emerald-950/95 border-emerald-500/50 text-white shadow-emerald-950/40'
                  : toast.type === 'error'
                  ? 'bg-rose-950/95 border-rose-500/50 text-white shadow-rose-950/40'
                  : toast.type === 'warning'
                  ? 'bg-amber-950/95 border-amber-500/50 text-white shadow-amber-950/40'
                  : 'bg-slate-950/95 border-slate-700/60 text-white shadow-slate-950/40'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
                {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {(!toast.type || toast.type === 'info' || toast.type === 'system') && <Info className="w-5 h-5 text-blue-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs sm:text-sm font-black text-white leading-tight">{toast.title}</h4>
                <p className="text-[11px] sm:text-xs text-gray-200/90 leading-snug mt-0.5">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="shrink-0 p-1 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-xs mx-auto">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto mb-3"></div>
              <p className="text-sm font-semibold text-gray-800">Loading NSTP System...</p>
              <p className="text-xs text-gray-500 mt-1">CvSU Naic Campus</p>
            </div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/enrollment" element={<Enrollment />} />
            <Route path="/digital-id" element={<DigitalIdViewer />} />
            <Route path="/id-card" element={<DigitalIdViewer />} />
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/instructor/dashboard" element={<ProtectedRoute allowedRoles={['instructor']}><InstructorDashboard /></ProtectedRoute>} />
            <Route path="/students" element={<ProtectedRoute allowedRoles={['admin', 'instructor']}><StudentManagement /></ProtectedRoute>} />
            <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['admin', 'instructor']}><Navigate to="/students" replace /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute allowedRoles={['admin', 'instructor']}><Reports /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute allowedRoles={['admin', 'instructor']}><Chat /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute allowedRoles={['admin', 'instructor']}><Calendar /></ProtectedRoute>} />
            <Route path="/letter-formats" element={<ProtectedRoute allowedRoles={['admin', 'instructor']}><LetterFormats /></ProtectedRoute>} />
            <Route path="/admin/google-drive" element={<ProtectedRoute allowedRoles={['admin']}><GoogleDrive /></ProtectedRoute>} />
            <Route path="/google-drive" element={<ProtectedRoute allowedRoles={['admin']}><Navigate to="/admin/google-drive" replace /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute allowedRoles={['admin', 'instructor']}><Profile /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute allowedRoles={['admin', 'instructor']}><Navigate to="/profile" replace /></ProtectedRoute>} />
            <Route path="/archives" element={<ProtectedRoute allowedRoles={['admin', 'instructor']}><Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/instructor/dashboard'} replace /></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute allowedRoles={['admin', 'instructor']}><Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/instructor/dashboard'} replace /></ProtectedRoute>} />
            <Route path="/grades" element={<ProtectedRoute allowedRoles={['admin', 'instructor']}><Navigate to={user?.role === 'admin' ? '/students' : '/instructor/dashboard'} replace /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'instructor']}><Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/instructor/dashboard'} replace /></ProtectedRoute>} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/instructor" element={<Navigate to="/instructor/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
