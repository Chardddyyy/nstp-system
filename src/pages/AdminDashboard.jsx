import { useAuth } from '../context/AuthContext';
import { archivesAPI, DEFAULT_PAST_BATCHES } from '../services/api';
import Sidebar from '../components/layout/Sidebar';
import {
  Users, FileText, MessageSquare,
  User, Shield,
  BookOpen, Bell, Calendar, X, CheckCircle, CheckCircle2, Power, Settings, Settings2, AlertCircle, AlertTriangle, Trash2, CheckSquare, Square,
  BarChart3, PieChart, Archive, RotateCcw, History, ChevronDown, ChevronUp, Menu, MailOpen, Search, Clock, Sparkles, Download, FileCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo, useRef } from 'react';
import { getEnrollmentSchedule, saveEnrollmentSchedule, calculateEnrollmentStatus, syncEnrollmentScheduleFromServer } from '../utils/enrollmentSchedule';
import { downloadOfficialLetter } from '../utils/letterDocumentGenerator';
import { downloadChedFormat, downloadChedFormA } from '../utils/chedExportGenerator';
import { getRegformAuditStatus, useRegformAuditor } from '../utils/documentValidation';

const OFFICIAL_PROGRAMS = ['BSIT', 'BSCS', 'BSFAS', 'BSHM', 'BSBA', 'BEED Science', 'BSED'];

import { getAvatarSrc } from '../utils/avatars';

function RegistrationDocumentPreview({ documentUrl, onExpand, isFullscreen = false }) {
  const canvasRef = useRef(null);
  const isPdf = typeof documentUrl === 'string' && (documentUrl.startsWith('data:application/pdf') || documentUrl.endsWith('.pdf'));
  const [renderStatus, setRenderStatus] = useState('loading'); // 'loading' | 'rendered' | 'fallback'

  useEffect(() => {
    let isMounted = true;
    if (!isPdf || !documentUrl) {
      return;
    }

    const renderPdf = async () => {
      try {
        let pdfjs = window.pdfjsLib;
        if (!pdfjs) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = () => {
              if (window.pdfjsLib) {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                resolve();
              } else reject(new Error('PDF.js missing'));
            };
            script.onerror = reject;
            document.head.appendChild(script);
          });
          pdfjs = window.pdfjsLib;
        }

        const base64Index = documentUrl.indexOf('base64,');
        const base64Data = base64Index !== -1 ? documentUrl.substring(base64Index + 7) : documentUrl;
        const raw = atob(base64Data);
        const uint8 = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) uint8[i] = raw.charCodeAt(i);

        const pdf = await pdfjs.getDocument({ data: uint8 }).promise;
        const page = await pdf.getPage(1);
        const scale = isFullscreen ? 2.2 : 1.8;
        const viewport = page.getViewport({ scale });

        if (!isMounted || !canvasRef.current) return;
        const canvas = canvasRef.current;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;
        if (isMounted) setRenderStatus('rendered');
      } catch (err) {
        console.warn('PDF canvas render fallback:', err);
        if (isMounted) setRenderStatus('fallback');
      }
    };

    renderPdf();
    return () => { isMounted = false; };
  }, [documentUrl, isPdf, isFullscreen]);

  if (!documentUrl) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
        <p className="text-xs font-bold text-amber-800">No registration form photo submitted by applicant</p>
      </div>
    );
  }

  if (isPdf) {
    if (isFullscreen) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-2">
          {renderStatus === 'loading' && (
            <div className="py-12 flex flex-col items-center justify-center text-emerald-300 gap-3">
              <div className="w-9 h-9 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-bold">Rendering Document High-Resolution Image...</p>
            </div>
          )}
          <div className="w-full h-full overflow-auto flex items-center justify-center">
            <canvas
              ref={canvasRef}
              className={`max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl bg-white ${renderStatus === 'rendered' ? 'block' : 'hidden'}`}
            />
            {renderStatus === 'fallback' && (
              <iframe
                src={documentUrl}
                title="Registration Form PDF Fullscreen"
                className="w-full h-[80vh] rounded-xl border border-gray-700 bg-white"
              />
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-1.5">
        <div
          className="relative rounded-2xl overflow-hidden border border-emerald-300 shadow-md bg-white cursor-zoom-in group max-h-[500px] flex flex-col items-center justify-center p-2"
          onClick={onExpand}
        >
          {renderStatus === 'loading' && (
            <div className="py-12 flex flex-col items-center justify-center text-emerald-800 gap-2">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-bold">Rendering Registration Form Image...</p>
            </div>
          )}

          <canvas
            ref={canvasRef}
            className={`w-full max-w-full max-h-[460px] object-contain rounded-xl ${renderStatus === 'rendered' ? 'block' : 'hidden'}`}
          />

          {renderStatus === 'fallback' && (
            <iframe
              src={documentUrl}
              title="PDF Registration Form Preview"
              className="w-full h-80 sm:h-96 rounded-xl border border-gray-200 bg-white"
            />
          )}

          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <span className="bg-white text-emerald-950 text-xs font-black px-3.5 py-1.5 rounded-full shadow-lg border border-emerald-300 flex items-center gap-1.5">
              🔍 Click to View Fullscreen
            </span>
          </div>
        </div>
        <p className="text-[11px] text-gray-500 text-center font-medium">
          Instant Document Preview loaded. Click photo or button to view fullscreen.
        </p>
      </div>
    );
  }

  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-emerald-300 bg-gray-900/5 shadow-md cursor-zoom-in group"
      onClick={onExpand}
    >
      <img
        src={documentUrl}
        alt="Submitted Registration Form Proof"
        className="w-full max-h-[450px] sm:max-h-[520px] object-contain mx-auto transition-transform duration-200 group-hover:scale-[1.01]"
      />
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
        <span className="bg-white text-emerald-950 text-xs font-black px-3.5 py-1.5 rounded-full shadow-lg border border-emerald-300 flex items-center gap-1.5">
          🔍 Click to View Fullscreen
        </span>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const { 
    user, 
    logout, 
    clearBatchData, 
    students = [], 
    reports = [], 
    allUsers = [], 
    pendingEnrollments = [], 
    approveEnrollment, 
    declineEnrollment, 
    refreshData, 
    archivedYears = [], 
    currentBatch = '2026-2027 1st Semester', 
    notifications = [], 
    setNotifications, 
    viewingArchive, 
    archiveViewData, 
    setViewingArchive, 
    setArchiveViewData 
  } = useAuth() || {};
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const safeArchivedYears = useMemo(() => {
    return Array.isArray(archivedYears) && archivedYears.length > 0
      ? archivedYears
      : DEFAULT_PAST_BATCHES;
  }, [archivedYears]);
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  
  // Real-time RegForm document validator audit hook
  const regformAudits = useRegformAuditor(pendingEnrollments);
  
  // Enrollment Timed Schedule & Portal Control
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleConfig, setScheduleConfig] = useState(() => getEnrollmentSchedule());
  const [scheduleStatus, setScheduleStatus] = useState(() => calculateEnrollmentStatus());

  useEffect(() => {
    // Initial sync from server API on mount
    syncEnrollmentScheduleFromServer().then(st => {
      if (st) {
        setScheduleStatus(st);
        setScheduleConfig(st.schedule || getEnrollmentSchedule());
      }
    });

    const handleScheduleChange = (e) => {
      if (e.detail) {
        setScheduleStatus(e.detail);
        setScheduleConfig(e.detail.schedule || getEnrollmentSchedule());
      }
    };
    window.addEventListener('nstp_enrollment_schedule_changed', handleScheduleChange);
    return () => window.removeEventListener('nstp_enrollment_schedule_changed', handleScheduleChange);
  }, []);

  const handleSaveSchedule = async (newConfig) => {
    setScheduleConfig(newConfig);
    const updatedStatus = await saveEnrollmentSchedule(newConfig);
    setScheduleStatus(updatedStatus);
    showNotif('success', `Enrollment Schedule Saved: Portal is ${updatedStatus.isOpen ? 'OPEN' : 'CLOSED'}`);
  };

  const quickForceOpen = async () => {
    const next = { ...scheduleConfig, mode: 'FORCE_OPEN' };
    setScheduleConfig(next);
    const updatedStatus = await saveEnrollmentSchedule(next);
    setScheduleStatus(updatedStatus);
  };

  const quickForceClose = async () => {
    const next = { ...scheduleConfig, mode: 'FORCE_CLOSE' };
    setScheduleConfig(next);
    const updatedStatus = await saveEnrollmentSchedule(next);
    setScheduleStatus(updatedStatus);
  };

  const _quickSetAuto = async () => {
    const next = { ...scheduleConfig, mode: 'AUTO' };
    setScheduleConfig(next);
    const updatedStatus = await saveEnrollmentSchedule(next);
    setScheduleStatus(updatedStatus);
  };
  
  // Close notification panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!showNotifications) return;
      if (e.target.closest('.notification-container')) return;
      setShowNotifications(false);
      setSelectedNotifications([]);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showNotifications]);
  
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showProgramAnalytics, setShowProgramAnalytics] = useState(false);
  const [showNewBatchConfirm, setShowNewBatchConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [showArchiveDetails, setShowArchiveDetails] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [designatedSection, setDesignatedSection] = useState('A');
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchSem, setNewBatchSem] = useState('2nd Semester');
  const [newBatchYearInput, setNewBatchYearInput] = useState('2025-2026');
  const [photoViewer, setPhotoViewer] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [showInstructorList, setShowInstructorList] = useState(false);
  // Online Enrollment Portal Status Switch (stored in localStorage)
  const [_enrollmentOpen, _setEnrollmentOpen] = useState(() => {
    const saved = localStorage.getItem('nstp_enrollment_open');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const _toggleEnrollmentStatus = () => {
    const next = !_enrollmentOpen;
    _setEnrollmentOpen(next);
    localStorage.setItem('nstp_enrollment_open', JSON.stringify(next));
  };
  const [enrollmentSearch, setEnrollmentSearch] = useState('');
  const [selectedComponentFilter, setSelectedComponentFilter] = useState('ALL');
  const [selectedProgramFocus, setSelectedProgramFocus] = useState(null);
  const [enrollmentSortCol, setEnrollmentSortCol] = useState(null);
  const [enrollmentSortDir, setEnrollmentSortDir] = useState('asc');
  const [analyticsViewMode, setAnalyticsViewMode] = useState('chart');

  const handleSortEnrollment = (col) => {
    if (enrollmentSortCol === col) {
      if (enrollmentSortDir === 'asc') {
        setEnrollmentSortDir('desc');
      } else {
        setEnrollmentSortCol(null);
        setEnrollmentSortDir('asc');
      }
    } else {
      setEnrollmentSortCol(col);
      setEnrollmentSortDir('asc');
    }
  };

  const showNotif = (type, message) => {
    if (type === 'error') {
      alert(message);
    }
  };

  const showConfirm = (message, onConfirm) => {
    setConfirmDialog({ message, onConfirm });
  };
  
  // All hooks must be called before any early return
  // Calculate statistics from actual data
  const stats = useMemo(() => ({
    totalStudents: students.length,
    cwtsStudents: students.filter(s => s.department === 'CWTS').length,
    ltsStudents: students.filter(s => s.department === 'LTS').length,
    rotcStudents: students.filter(s => s.department === 'ROTC').length,
    totalInstructors: allUsers.filter(u => u.role === 'instructor').length,
    pendingReports: reports.filter(r => !r.submissions || r.submissions.length === 0).length,
    unreadMessages: (notifications || []).filter(n => n.type === 'message' && !n.read).length
  }), [students, allUsers, reports, notifications]);


  const displayStats = useMemo(() => {
    if (viewingArchive && archiveViewData) {
      const sd = archiveViewData.studentData || [];
      const cwts = archiveViewData.data?.cwts ?? (sd.filter(s => s.department === 'CWTS').length || 0);
      const lts  = archiveViewData.data?.lts  ?? (sd.filter(s => s.department === 'LTS').length  || 0);
      const rotc = archiveViewData.data?.rotc ?? (sd.filter(s => s.department === 'ROTC').length || 0);
      return {
        totalStudents: archiveViewData.students || sd.length,
        cwtsStudents: cwts, ltsStudents: lts, rotcStudents: rotc,
        totalInstructors: 0, pendingReports: 0, unreadMessages: 0
      };
    }
    return stats;
  }, [viewingArchive, archiveViewData, stats]);

  const currentStats = useMemo(() => {
    const total = displayStats.totalStudents;
    const completedCount = viewingArchive && archiveViewData 
      ? (archiveViewData.completed || 0) 
      : students.filter(s => s.status === 'completed').length;
    const rate = total > 0 ? Math.round((completedCount / total) * 100) : 0;
    return {
      total: displayStats.totalStudents,
      cwts: displayStats.cwtsStudents,
      lts: displayStats.ltsStudents,
      rotc: displayStats.rotcStudents,
      completionRate: rate
    };
  }, [displayStats, viewingArchive, archiveViewData, students]);

  const programDeptStats = useMemo(() => {
    const source = viewingArchive && archiveViewData?.studentData ? archiveViewData.studentData : students;
    const mapped = OFFICIAL_PROGRAMS.map(prog => {
      const list = source.filter(s => (s.program || '').trim().toLowerCase() === prog.toLowerCase());
      return {
        program: prog,
        total: list.length,
        cwts: list.filter(s => s.department === 'CWTS').length,
        lts:  list.filter(s => s.department === 'LTS').length,
        rotc: list.filter(s => s.department === 'ROTC').length,
      };
    }).filter(p => p.total > 0);

    return mapped.sort((a, b) => {
      // Put user-focused/selected program at the very top
      if (selectedProgramFocus) {
        if (a.program === selectedProgramFocus) return -1;
        if (b.program === selectedProgramFocus) return 1;
      }
      // Sort by active component so highest count is at the very top
      if (selectedComponentFilter === 'CWTS') return (b.cwts - a.cwts) || (b.total - a.total);
      if (selectedComponentFilter === 'LTS')  return (b.lts - a.lts)   || (b.total - a.total);
      if (selectedComponentFilter === 'ROTC') return (b.rotc - a.rotc) || (b.total - a.total);
      return b.total - a.total;
    });
  }, [students, viewingArchive, archiveViewData, selectedComponentFilter, selectedProgramFocus]);

  // Show loading while user context resolves
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  const unreadCount = (notifications || []).filter(n => !n.read).length;
  
  function notificationIdsMatch(a, b) {
    return String(a) === String(b);
  }

  function handleSelectNotification(id) {
    setSelectedNotifications(function(prev) {
      const has = prev.some(function(nId) { return notificationIdsMatch(nId, id); });
      if (has) {
        return prev.filter(function(nId) { return !notificationIdsMatch(nId, id); });
      }
      return prev.concat([id]);
    });
  }
  
  function handleSelectAll(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const list = notifications || [];
    setSelectedNotifications(function(prev) {
      const allSelected = list.length > 0 && list.every(function(n) {
        return prev.some(function(sid) { return notificationIdsMatch(sid, n.id); });
      });
      if (allSelected) return [];
      return list.map(function(n) { return n.id; });
    });
  }
  
  function handleDeleteSelected(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const selectedSet = new Set(selectedNotifications.map(function(id) { return String(id); }));
    setNotifications(function(prev) {
      return (prev || []).filter(function(n) {
        return !selectedSet.has(String(n.id));
      });
    });
    setSelectedNotifications([]);
  }

  function handleMarkAllRead(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    setNotifications(function(prev) {
      if (selectedNotifications.length > 0) {
        return (prev || []).map(function(n) {
          const isSelected = selectedNotifications.some(function(sid) {
            return notificationIdsMatch(sid, n.id);
          });
          return isSelected ? { ...n, read: true } : n;
        });
      }
      return (prev || []).map(function(n) { return { ...n, read: true }; });
    });
    setSelectedNotifications([]);
  }

  function handleMarkOneRead(e, id) {
    e.preventDefault();
    e.stopPropagation();
    setNotifications(function(prev) {
      return (prev || []).map(function(n) {
        return notificationIdsMatch(n.id, id) ? { ...n, read: true } : n;
      });
    });
  }

  // Handle notification click
  function handleNotificationItemClick(notification) {
    // Mark as read
    const newNotifications = (notifications || []).map(n => {
      if (n.id === notification.id) {
        return { ...n, read: true };
      }
      return n;
    });
    setNotifications(newNotifications);
    
    // Navigate to the link
    if (notification.link && notification.link !== '#') {
      navigate(notification.link);
    }
    
    setShowNotifications(false);
    setSelectedNotifications([]);
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  
// Automatically compute consecutive academic year, semester, and batch label name
function getConsecutiveBatchDetails(currentBatchStr) {
  const str = String(currentBatchStr || '').trim();
  
  // Extract academic year numbers (e.g., 2026-2027)
  const yearMatch = str.match(/(\d{4})\s*[-–—/]\s*(\d{4})/);
  let startYear = 2026;
  let endYear = 2027;

  if (yearMatch) {
    startYear = parseInt(yearMatch[1], 10);
    endYear = parseInt(yearMatch[2], 10);
  } else {
    const singleYearMatch = str.match(/(\d{4})/);
    if (singleYearMatch) {
      startYear = parseInt(singleYearMatch[1], 10);
      endYear = startYear + 1;
    } else {
      const now = new Date();
      startYear = now.getFullYear();
      endYear = startYear + 1;
    }
  }

  const isFirstSem = /1st|first/i.test(str);
  const isSecondSem = /2nd|second/i.test(str);
  const isSummer = /summer/i.test(str);

  let nextYear = '';
  let nextSemester = '1st Semester';

  if (isFirstSem) {
    // 1st Sem -> 2nd Sem of SAME academic year (e.g. 2026-2027 1st Sem -> 2026-2027 2nd Sem)
    nextYear = `${startYear}-${endYear}`;
    nextSemester = '2nd Semester';
  } else if (isSecondSem || isSummer) {
    // 2nd Sem or Summer -> 1st Sem of NEXT academic year (e.g. 2026-2027 2nd Sem -> 2027-2028 1st Sem)
    nextYear = `${startYear + 1}-${endYear + 1}`;
    nextSemester = '1st Semester';
  } else {
    nextYear = `${startYear}-${endYear}`;
    nextSemester = '2nd Semester';
  }

  return {
    academicYear: nextYear,
    semester: nextSemester,
    fullBatchName: `${nextYear} ${nextSemester}`
  };
}

  // Archive current year and start new batch with dynamic automatic semester/year progression
  const handleNewBatch = () => {
    setShowNewBatchConfirm(true);
    setConfirmText('');
    const next = getConsecutiveBatchDetails(currentBatch);
    setNewBatchYearInput(next.academicYear);
    setNewBatchSem(next.semester);
    setNewBatchName(next.fullBatchName);
  };
  
  const confirmNewBatch = async () => {
    if (confirmText.toLowerCase() !== 'confirm') {
      showNotif('error', 'You must type "confirm" exactly to proceed with creating a new batch.');
      return;
    }

    const targetNewBatch = (newBatchName || `${newBatchYearInput} ${newBatchSem}`).trim() || `Batch ${new Date().getFullYear()} 1st Sem`;

    try {
      await archivesAPI.create({
        year: String(currentBatch || 'Previous Batch'),
        next_batch: targetNewBatch,
        data: {
          cwts: stats.cwtsStudents,
          lts: stats.ltsStudents,
          rotc: stats.rotcStudents
        }
      });

      await clearBatchData();
      try {
        await archivesAPI.updateBatch(targetNewBatch);
      } catch (_) {}
      await refreshData();

      setShowNewBatchConfirm(false);
      setConfirmText('');

      showNotif('success', `Batch "${currentBatch}" archived successfully. New batch "${targetNewBatch}" is now active.`);
    } catch (error) {
      console.error('Archive batch error:', error);
      showNotif('error', 'Failed to archive batch. Please try again.');
    }
  };

  // View archived batch data — instant UI display with non-blocking hydration
  const handleViewBatch = (yearData) => {
    setShowArchiveModal(false);
    const existingStudentData = yearData.data?.studentData || yearData.studentData || [];
    const existingReportData = yearData.data?.reportData || yearData.reportData || [];
    const existingLetterData = yearData.data?.letterData || yearData.letterData || [];

    setArchiveViewData({
      ...yearData,
      studentData: existingStudentData,
      reportData: existingReportData,
      letterData: existingLetterData
    });
    setViewingArchive(true);

    // If student list was empty, hydrate in background without blocking
    if (existingStudentData.length === 0) {
      archivesAPI.getByYear(yearData.year).then((detailed) => {
        const sData = detailed.studentData || detailed.data?.studentData || [];
        const rData = detailed.reportData || detailed.data?.reportData || [];
        const lData = detailed.letterData || detailed.data?.letterData || [];
        setArchiveViewData((prev) => ({
          ...prev,
          ...yearData,
          studentData: sData,
          reportData: rData,
          letterData: lData
        }));
      }).catch(() => {});
    }
  };

  // Delete archived batch
  const handleDeleteArchivedBatch = (yearToDelete) => {
    showConfirm(
      `Delete Batch ${yearToDelete} from archives? This cannot be undone.`,
      async () => {
        try {
          await archivesAPI.delete(yearToDelete);
          await refreshData();
          showNotif('success', `Batch ${yearToDelete} deleted from archives.`);
        } catch (error) {
          console.error('Delete archive error:', error);
          showNotif('error', 'Failed to delete archive. Please try again.');
        }
      }
    );
  };

  // Return to current batch view
  const handleBackToCurrent = () => {
    setViewingArchive(false);
    setArchiveViewData(null);
  };


  // Empty activities and messages

  // Get user avatar display
  const getUserAvatar = () => {
    return (
      <img 
        src={getAvatarSrc(user?.avatar, user?.profilePicture)} 
        alt="Profile" 
        className="w-10 h-10 object-cover rounded-full shadow-xs border border-emerald-600/30"
      />
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 page-enter">

      {/* Centered confirm dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9998] p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="flex items-start gap-3 mb-5">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-gray-800 text-sm font-medium">{confirmDialog.message}</p>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button"
                
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
              <button type="button"
                
                onClick={() => { setConfirmDialog(null); confirmDialog.onConfirm(); }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        user={user}
        archiveMode={viewingArchive}
      />

      {/* Main Content */}
      <main className={`min-h-screen bg-slate-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/40 via-emerald-50/20 to-slate-50 transition-all duration-300 ease-in-out p-3 sm:p-6 lg:p-8 ${sidebarOpen ? 'lg:ml-64' : ''}`}>
        {/* Previous Report Header - Show when viewing archive */}
        {viewingArchive && archiveViewData && (
          <div className="bg-amber-500/10 border border-amber-400/40 rounded-3xl p-4 sm:p-5 mb-6 backdrop-blur-md shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-700 shrink-0 border border-amber-400/50">
                  <Archive className="w-5 h-5 text-amber-800" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black text-amber-950 truncate">Viewing Archive: Batch {archiveViewData.year}</h2>
                  <p className="text-xs text-amber-800/80 font-medium">Historical records preserved for this academic batch. Click below to inspect modules:</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => downloadChedFormat(archiveViewData)}
                  className="bg-amber-400 hover:bg-amber-300 text-emerald-950 px-3.5 py-2 rounded-xl text-xs font-black transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Download CHED Form B Enrollment List Excel"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-950" />
                  <span>Download CHED Format (.xlsx)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowArchiveDetails(true)}
                  className="bg-emerald-800 hover:bg-emerald-900 text-amber-300 font-bold px-3.5 py-2 rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Batch Summary</span>
                </button>
                <button
                  type="button"
                  onClick={handleBackToCurrent}
                  className="bg-emerald-800 hover:bg-emerald-900 text-emerald-100 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
                  <span>Back to Current</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hero Header - Responsive Clean Layout */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-xl border border-emerald-800/40 relative mb-3.5 sm:mb-6 w-full">
          <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 relative z-10 w-full">
            <div className="flex items-center space-x-2 sm:space-x-3.5 min-w-0 flex-1">
              <button type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 sm:p-2.5 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-200 hover:text-white rounded-xl shrink-0 transition-colors cursor-pointer active:scale-95 shadow-xs"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <div className="w-9 h-9 sm:w-11 sm:h-11 bg-white rounded-xl sm:rounded-2xl p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-md border border-emerald-700">
                <img src={`${import.meta.env.BASE_URL}cvsu.png`} alt="CvSU Logo" className="w-full h-full object-contain filter drop-shadow-xs" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h1 className="text-xs sm:text-lg lg:text-xl font-black tracking-tight text-white leading-tight">
                    {viewingArchive ? `Batch ${archiveViewData?.year}` : 'Admin Dashboard'}
                  </h1>
                </div>
                <p className="text-emerald-200 text-[10px] sm:text-xs font-medium truncate mt-0.5 max-w-full">
                  {viewingArchive ? 'Archived Data' : `Welcome, ${user?.name || 'Administrator'}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* Notification Bell & Interactive Dropdown Panel */}
              <div className="relative notification-container">
                <button type="button"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 sm:p-2.5 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-200 hover:text-white rounded-xl sm:rounded-2xl transition-colors cursor-pointer shrink-0 active:scale-95 shadow-xs"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-amber-400 text-emerald-950 text-[8.5px] sm:text-[10px] font-black rounded-full flex items-center justify-center border border-emerald-950 shadow-xs">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown Panel */}
                {showNotifications && (
                  <div
                    className="notification-dropdown fixed sm:absolute inset-x-2 sm:inset-auto right-2 sm:right-0 mt-1 sm:mt-3 w-auto sm:w-80 max-w-[calc(100vw-1rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 z-[100] text-gray-900 overflow-hidden animate-fade-in"
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                  >
                    <div className="px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 border-b border-gray-100 flex justify-between items-center bg-gray-50/90">
                      <div className="flex items-center space-x-1.5 sm:space-x-2">
                        <button type="button"
                          onClick={handleSelectAll}
                          className="text-gray-400 hover:text-emerald-600 transition-colors cursor-pointer"
                        >
                          {selectedNotifications.length === (notifications || []).length && notifications.length > 0
                            ? <CheckSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                            : <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                        </button>
                        <h3 className="font-extrabold text-[11px] sm:text-xs text-gray-900">Notifications ({unreadCount} new)</h3>
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-1.5">
                        <button type="button"
                          onClick={handleMarkAllRead}
                          disabled={
                            selectedNotifications.length > 0
                              ? !(notifications || []).some(n => selectedNotifications.some(sid => notificationIdsMatch(sid, n.id)) && !n.read)
                              : (notifications || []).every(n => n.read)
                          }
                          className="text-emerald-700 hover:text-emerald-800 disabled:opacity-30 transition-colors cursor-pointer p-0.5"
                          title={selectedNotifications.length > 0 ? "Mark selected as read" : "Mark all as read"}
                        >
                          <MailOpen className="w-3.5 h-3.5" />
                        </button>
                        <button type="button"
                          onClick={handleDeleteSelected}
                          disabled={selectedNotifications.length === 0}
                          className="text-rose-600 hover:text-rose-700 disabled:opacity-30 transition-colors cursor-pointer p-0.5"
                          title="Delete selected"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button type="button"
                          onClick={() => { setShowNotifications(false); setSelectedNotifications([]); }}
                          className="text-gray-400 hover:text-gray-600 cursor-pointer p-0.5"
                        >
                          <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="max-h-[38vh] sm:max-h-72 overflow-y-auto divide-y divide-gray-100">
                      {(!notifications || notifications.length === 0) ? (
                        <div className="p-4 text-center text-gray-400 text-xs font-medium">
                          <Bell className="w-6 h-6 mx-auto mb-1.5 opacity-30 text-emerald-800" />
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map((n) => {
                          const isSelected = selectedNotifications.some(sid => notificationIdsMatch(sid, n.id));
                          return (
                            <div
                              key={n.id}
                              className={`p-2 sm:p-2.5 transition-colors flex items-start space-x-1.5 sm:space-x-2 ${
                                !n.read ? 'bg-emerald-50/60 font-semibold' : 'hover:bg-gray-50'
                              }`}
                            >
                              <button type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectNotification(n.id);
                                }}
                                className="mt-0.5 shrink-0 text-gray-400 hover:text-emerald-600 cursor-pointer"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                                ) : (
                                  <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-300" />
                                )}
                              </button>
                              <div
                                className="flex-1 cursor-pointer min-w-0"
                                onClick={() => handleNotificationItemClick(n)}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <h4 className={`text-[11px] sm:text-xs font-bold truncate ${n.read ? 'text-gray-700' : 'text-gray-900'}`}>
                                    {n.title}
                                  </h4>
                                  <div className="flex items-center gap-1 shrink-0">
                                    {!n.read && (
                                      <button type="button"
                                        onClick={(e) => handleMarkOneRead(e, n.id)}
                                        className="text-emerald-600 hover:text-emerald-700 transition-colors"
                                        title="Mark as read"
                                      >
                                        <MailOpen className="w-3 h-3" />
                                      </button>
                                    )}
                                    <span className="text-[9px] sm:text-[10px] text-gray-400 font-medium">{n.time}</span>
                                  </div>
                                </div>
                                <p className={`text-[10px] sm:text-xs mt-0.5 line-clamp-1 sm:line-clamp-2 ${n.read ? 'text-gray-500 font-normal' : 'text-gray-700 font-medium'}`}>
                                  {n.message}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Button */}
              <button type="button"
                onClick={() => navigate('/profile')}
                className="flex items-center space-x-1.5 sm:space-x-2 bg-emerald-800/90 hover:bg-emerald-700 text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-2xl border border-emerald-600/60 shadow-md transition-all cursor-pointer shrink-0 min-w-0 active:scale-95"
                title="View Profile"
              >
                <div className="shrink-0 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full overflow-hidden border border-emerald-400/60 shadow-xs">
                  {getUserAvatar()}
                </div>
                <div className="text-left min-w-0 flex flex-col justify-center">
                  <p className="font-extrabold text-[10.5px] sm:text-xs text-white leading-tight truncate max-w-[70px] xs:max-w-[105px] sm:max-w-[140px]">{user?.name || 'Admin'}</p>
                  <p className="text-[8.5px] sm:text-[10px] text-amber-300 font-bold uppercase tracking-wider whitespace-nowrap leading-tight">{user?.department ? `${user.department} Admin` : 'NSTP Admin'}</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Action Navigation Cards - 3 Side-by-Side on Cellphone */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-4 mb-3 sm:mb-6">
          <div
            className="bg-gradient-to-r from-emerald-700 to-green-800 p-2 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm text-white cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group flex flex-col justify-between"
            onClick={() => setShowInstructorList(true)}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
              <div className="flex items-center space-x-1 sm:space-x-3 min-w-0">
                <div className="w-6 h-6 sm:w-10 sm:h-10 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                  <Users className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-emerald-100 text-[8px] sm:text-xs font-medium uppercase tracking-wider truncate">Instructors</p>
                  <p className="text-[10px] sm:text-xl font-bold text-white leading-tight mt-0.5">{stats.totalInstructors} <span className="text-[8px] font-normal hidden sm:inline">Active</span></p>
                </div>
              </div>
              <span className="text-[7px] sm:text-xs bg-white/20 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full group-hover:bg-white group-hover:text-emerald-800 font-semibold transition-all shrink-0">View &rarr;</span>
            </div>
          </div>

          <div
            className="bg-gradient-to-r from-amber-600 to-yellow-600 p-2 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm text-white cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group flex flex-col justify-between"
            onClick={() => navigate('/reports')}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
              <div className="flex items-center space-x-1 sm:space-x-3 min-w-0">
                <div className="w-6 h-6 sm:w-10 sm:h-10 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-amber-100 text-[8px] sm:text-xs font-medium uppercase tracking-wider truncate">Reports</p>
                  <p className="text-[10px] sm:text-xl font-bold text-white leading-tight mt-0.5">{stats.pendingReports} <span className="text-[8px] font-normal hidden sm:inline">Pending</span></p>
                </div>
              </div>
              <span className="text-[7px] sm:text-xs bg-white/20 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full group-hover:bg-white group-hover:text-amber-800 font-semibold transition-all shrink-0">Review &rarr;</span>
            </div>
          </div>

          <div
            className="bg-gradient-to-r from-blue-600 to-indigo-700 p-2 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm text-white cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group flex flex-col justify-between"
            onClick={() => navigate('/chat')}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
              <div className="flex items-center space-x-1 sm:space-x-3 min-w-0">
                <div className="w-6 h-6 sm:w-10 sm:h-10 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                  <MessageSquare className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-blue-100 text-[8px] sm:text-xs font-medium uppercase tracking-wider truncate">Messages</p>
                  <p className="text-[10px] sm:text-xl font-bold text-white leading-tight mt-0.5">{stats.unreadMessages} <span className="text-[8px] font-normal hidden sm:inline">Unread</span></p>
                </div>
              </div>
              <span className="text-[7px] sm:text-xs bg-white/20 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full group-hover:bg-white group-hover:text-blue-800 font-semibold transition-all shrink-0">Open &rarr;</span>
            </div>
          </div>
        </div>

        {/* Online Enrollment Portal Control & Timed Schedule Center */}
        {!viewingArchive && (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm mb-4 sm:mb-6 border border-gray-200 relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 min-w-0">
                <div className={`w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center shrink-0 border ${
                  scheduleStatus.isOpen 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                    : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}>
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500">
                      Enrollment Portal Status
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      scheduleStatus.isOpen
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${scheduleStatus.isOpen ? 'bg-emerald-600 animate-ping' : 'bg-rose-600'}`}></span>
                      {scheduleStatus.isOpen ? 'Portal is Open' : 'Portal is Closed'}
                    </span>
                  </div>
                  
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-snug">
                    {scheduleStatus.headline}
                  </h3>
                  
                  <p className="text-gray-600 text-xs sm:text-sm font-medium mt-0.5">
                    {scheduleStatus.subtext || scheduleConfig.customNotice}
                  </p>
                  
                  {(scheduleConfig.academicYear || scheduleConfig.semester || scheduleConfig.closeAt) && (
                    <div className="flex items-center gap-2 sm:gap-3 mt-2 text-[11px] text-gray-600 font-semibold flex-wrap">
                      <span>Academic Year {scheduleConfig.academicYear || '2026-2027'}</span>
                      <span>•</span>
                      <span>{scheduleConfig.semester || '1st Semester'}</span>
                      {scheduleConfig.closeAt && (
                        <>
                          <span>•</span>
                          <span>Deadline: {new Date(scheduleConfig.closeAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(true)}
                  className="px-3.5 py-2 sm:px-4 sm:py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                >
                  <Clock className="w-4 h-4 text-emerald-200" />
                  <span>Configure Schedule</span>
                </button>
                
                {scheduleStatus.isOpen ? (
                  <button
                    type="button"
                    onClick={quickForceClose}
                    className="px-3.5 py-2 sm:px-4 sm:py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all border border-rose-200"
                  >
                    <span>Close Portal Now</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={quickForceOpen}
                    className="px-3.5 py-2 sm:px-4 sm:py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all border border-emerald-200"
                  >
                    <span>Open Portal Now</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Interactive Analytics & Program Distribution Panel */}
        <div className={`rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6 transition-all ${viewingArchive ? 'bg-gray-100' : 'bg-white'}`}>
          <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${showProgramAnalytics ? 'mb-5 pb-4 border-b border-gray-100' : ''}`}>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                  📊
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">CvSU Naic Analytics &amp; Program Distribution</h3>
                <span className="bg-emerald-700 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-2xs ml-auto sm:ml-2">
                  Total Students: {displayStats.totalStudents}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Interactive student enrollment metrics across degree programs and NSTP components</p>
            </div>

            {/* Interactive View Toggles & Component Filter & Hide Button */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowProgramAnalytics(!showProgramAnalytics)}
                className="px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
              >
                {showProgramAnalytics ? (
                  <>
                    <ChevronUp className="w-4 h-4 text-emerald-700" />
                    <span>Hide Analytics</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 text-emerald-700" />
                    <span>Show Analytics</span>
                  </>
                )}
              </button>

              {showProgramAnalytics && (
                <>
                  {/* Component Filters */}
                  <div className="flex items-center bg-gray-100 p-1 rounded-xl shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedComponentFilter('ALL')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${selectedComponentFilter === 'ALL' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedComponentFilter('CWTS')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${selectedComponentFilter === 'CWTS' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      CWTS
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedComponentFilter('LTS')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${selectedComponentFilter === 'LTS' ? 'bg-purple-600 text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      LTS
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedComponentFilter('ROTC')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${selectedComponentFilter === 'ROTC' ? 'bg-rose-600 text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      ROTC
                    </button>
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-gray-100 p-1 rounded-xl shrink-0">
                    <button
                      type="button"
                      onClick={() => setAnalyticsViewMode('chart')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${analyticsViewMode === 'chart' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      Chart
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnalyticsViewMode('grid')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${analyticsViewMode === 'grid' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      Grid
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {showProgramAnalytics && (
            <>
              {/* Component Ratio Stacked Bar Visual */}
              <div className="mb-5 p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/60">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-600 mb-2">
                  <span>Component Enrollment Ratio</span>
                  <span>Total Active: {displayStats.totalStudents}</span>
                </div>
                <div className="h-3.5 w-full bg-gray-200 rounded-full overflow-hidden flex shadow-inner">
                  {displayStats.totalStudents > 0 ? (
                    <>
                      <div
                        style={{ width: `${(displayStats.cwtsStudents / displayStats.totalStudents) * 100}%` }}
                        className={`bg-emerald-500 hover:opacity-100 transition-all cursor-pointer ${
                          selectedComponentFilter === 'CWTS'
                            ? 'ring-2 ring-emerald-300 brightness-110 shadow-md scale-y-110'
                            : selectedComponentFilter !== 'ALL' ? 'opacity-30 saturate-50' : 'hover:opacity-90'
                        }`}
                        title={`CWTS: ${displayStats.cwtsStudents} (${Math.round((displayStats.cwtsStudents / displayStats.totalStudents) * 100)}%) - Click to isolate`}
                        onClick={() => setSelectedComponentFilter(selectedComponentFilter === 'CWTS' ? 'ALL' : 'CWTS')}
                      />
                      <div
                        style={{ width: `${(displayStats.ltsStudents / displayStats.totalStudents) * 100}%` }}
                        className={`bg-purple-500 hover:opacity-100 transition-all cursor-pointer ${
                          selectedComponentFilter === 'LTS'
                            ? 'ring-2 ring-purple-300 brightness-110 shadow-md scale-y-110'
                            : selectedComponentFilter !== 'ALL' ? 'opacity-30 saturate-50' : 'hover:opacity-90'
                        }`}
                        title={`LTS: ${displayStats.ltsStudents} (${Math.round((displayStats.ltsStudents / displayStats.totalStudents) * 100)}%) - Click to isolate`}
                        onClick={() => setSelectedComponentFilter(selectedComponentFilter === 'LTS' ? 'ALL' : 'LTS')}
                      />
                      <div
                        style={{ width: `${(displayStats.rotcStudents / displayStats.totalStudents) * 100}%` }}
                        className={`bg-rose-500 hover:opacity-100 transition-all cursor-pointer ${
                          selectedComponentFilter === 'ROTC'
                            ? 'ring-2 ring-rose-300 brightness-110 shadow-md scale-y-110'
                            : selectedComponentFilter !== 'ALL' ? 'opacity-30 saturate-50' : 'hover:opacity-90'
                        }`}
                        title={`ROTC: ${displayStats.rotcStudents} (${Math.round((displayStats.rotcStudents / displayStats.totalStudents) * 100)}%) - Click to isolate`}
                        onClick={() => setSelectedComponentFilter(selectedComponentFilter === 'ROTC' ? 'ALL' : 'ROTC')}
                      />
                    </>
                  ) : (
                    <div className="w-full bg-gray-300 h-full flex items-center justify-center text-[10px] text-gray-500">No data</div>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs pt-2 font-medium">
                  <span className="text-emerald-700">🟢 CWTS: {displayStats.cwtsStudents} ({displayStats.totalStudents > 0 ? Math.round((displayStats.cwtsStudents / displayStats.totalStudents) * 100) : 0}%)</span>
                  <span className="text-purple-700">🟣 LTS: {displayStats.ltsStudents} ({displayStats.totalStudents > 0 ? Math.round((displayStats.ltsStudents / displayStats.totalStudents) * 100) : 0}%)</span>
                  <span className="text-rose-700">🔴 ROTC: {displayStats.rotcStudents} ({displayStats.totalStudents > 0 ? Math.round((displayStats.rotcStudents / displayStats.totalStudents) * 100) : 0}%)</span>
                </div>
              </div>

              {/* MODE 1: HORIZONTAL CHARTS VIEW */}
              {analyticsViewMode === 'chart' ? (
                <div className="space-y-3 animate-fade-in">
                  {programDeptStats.map(item => {
                    const isFocused = selectedProgramFocus === item.program;
                    const displayedCount = selectedComponentFilter === 'CWTS' ? item.cwts : selectedComponentFilter === 'LTS' ? item.lts : selectedComponentFilter === 'ROTC' ? item.rotc : item.total;
                    const maxVal = Math.max(...programDeptStats.map(p => selectedComponentFilter === 'CWTS' ? p.cwts : selectedComponentFilter === 'LTS' ? p.lts : selectedComponentFilter === 'ROTC' ? p.rotc : p.total), 1);
                    const percent = Math.round((displayedCount / maxVal) * 100);
                    const sharePercent = displayStats.totalStudents > 0 ? Math.round((displayedCount / displayStats.totalStudents) * 100) : 0;

                    return (
                      <div
                        key={item.program}
                        className={`rounded-xl p-3.5 transition-all duration-200 group cursor-pointer ${
                          isFocused 
                            ? 'bg-emerald-50/90 border-2 border-emerald-500 shadow-md ring-2 ring-emerald-400/50' 
                            : 'bg-gray-50/80 hover:bg-emerald-50/40 border border-gray-200/70 hover:border-emerald-300'
                        }`}
                        onClick={() => setSelectedProgramFocus(prev => prev === item.program ? null : item.program)}
                        title="Click to pin to top and highlight"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-sm text-gray-900 group-hover:text-emerald-800 transition-colors">{item.program}</span>
                            {isFocused && (
                              <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wider animate-pulse">
                                ★ Focused at Top
                              </span>
                            )}
                            <span className="text-[11px] bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                              {sharePercent}% of total
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-emerald-800 bg-white px-2.5 py-0.5 rounded-md border border-emerald-100 shadow-2xs">
                              {displayedCount} students
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('/students');
                              }}
                              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-100/70 hover:bg-emerald-200 px-2 py-0.5 rounded-md transition-colors"
                              title="View full student list"
                            >
                              View &rarr;
                            </button>
                          </div>
                        </div>

                        <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden flex shadow-inner mb-2">
                          {selectedComponentFilter === 'ALL' ? (
                            item.total > 0 ? (
                              <>
                                <div
                                  style={{ width: `${(item.cwts / item.total) * 100}%` }}
                                  className="bg-emerald-500 hover:opacity-90 transition-all"
                                  title={`CWTS: ${item.cwts}`}
                                />
                                <div
                                  style={{ width: `${(item.lts / item.total) * 100}%` }}
                                  className="bg-purple-500 hover:opacity-90 transition-all"
                                  title={`LTS: ${item.lts}`}
                                />
                                <div
                                  style={{ width: `${(item.rotc / item.total) * 100}%` }}
                                  className="bg-rose-500 hover:opacity-90 transition-all"
                                  title={`ROTC: ${item.rotc}`}
                                />
                              </>
                            ) : (
                              <div className="w-full bg-gray-300 h-full flex items-center justify-center text-[9px] text-gray-500">0 enrolled</div>
                            )
                          ) : (
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                selectedComponentFilter === 'CWTS' ? 'bg-emerald-600 shadow-sm' :
                                selectedComponentFilter === 'LTS'  ? 'bg-purple-600 shadow-sm' :
                                'bg-rose-600 shadow-sm'
                              }`}
                              style={{ width: `${percent}%` }}
                            ></div>
                          )}
                        </div>

                        {selectedComponentFilter === 'ALL' && (
                          <div className="flex items-center gap-3 text-[11px] text-gray-500">
                            <span className="text-emerald-700 font-medium">CWTS: {item.cwts}</span>
                            <span className="text-purple-700 font-medium">LTS: {item.lts}</span>
                            <span className="text-rose-700 font-medium">ROTC: {item.rotc}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* MODE 2: INTERACTIVE GRID BADGE VIEW */
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 animate-fade-in">
                  {programDeptStats.map(item => {
                    const isFocused = selectedProgramFocus === item.program;
                    const count = selectedComponentFilter === 'CWTS' ? item.cwts : selectedComponentFilter === 'LTS' ? item.lts : selectedComponentFilter === 'ROTC' ? item.rotc : item.total;
                    return (
                      <div
                        key={item.program}
                        className={`rounded-xl p-3 flex items-center justify-between transition-all duration-150 group cursor-pointer ${
                          isFocused
                            ? 'bg-emerald-100/90 border-2 border-emerald-500 shadow-md ring-2 ring-emerald-400/50'
                            : 'bg-gray-50 hover:bg-emerald-50/60 border border-gray-200/80 hover:border-emerald-300'
                        }`}
                        onClick={() => setSelectedProgramFocus(prev => prev === item.program ? null : item.program)}
                        title="Click to pin to top and highlight"
                      >
                        <span className="text-xs font-semibold text-gray-700 group-hover:text-emerald-900 truncate mr-2">
                          {isFocused ? `★ ${item.program}` : item.program}
                        </span>
                        <span className="text-sm font-black text-gray-900 group-hover:text-emerald-700 bg-white group-hover:bg-emerald-100 px-2 py-0.5 rounded-lg shadow-2xs shrink-0 transition-colors">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Pending Enrollments Section with Enrollment Switch */}
        {!viewingArchive && (
          <div className="bg-white rounded-2xl shadow-md p-3.5 sm:p-6 mb-3 sm:mb-5 border border-emerald-100/60">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2 flex-1">
                <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center flex-shrink-0">
                  <Users className="w-5 h-5 mr-2 text-amber-600" />
                  Pending Enrollments
                  <span className="ml-2 text-xs sm:text-sm font-semibold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                    {enrollmentSearch.trim()
                      ? `${pendingEnrollments.filter(e => {
                          const q = enrollmentSearch.toLowerCase();
                          return (e.fullName || '').toLowerCase().includes(q)
                            || (e.studentId || '').toLowerCase().includes(q)
                            || (e.email || '').toLowerCase().includes(q)
                            || (e.nstpComponent || '').toLowerCase().includes(q)
                            || (e.program || '').toLowerCase().includes(q);
                        }).length} of ${pendingEnrollments.length}`
                      : pendingEnrollments.length}
                  </span>
                </h3>
              </div>
              {pendingEnrollments.length > 0 && (
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    id="admin-enrollment-search"
                    name="enrollmentSearch"
                    placeholder="Search by name, ID, email…"
                    value={enrollmentSearch}
                    onChange={(e) => setEnrollmentSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  />
                  {enrollmentSearch && (
                    <button type="button" onClick={() => setEnrollmentSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
            {pendingEnrollments.length > 0 ? (() => {
              const q = enrollmentSearch.trim().toLowerCase();
              const baseFiltered = q
                ? pendingEnrollments.filter(e =>
                    (e.fullName || '').toLowerCase().includes(q)
                    || (e.studentId || '').toLowerCase().includes(q)
                    || (e.email || '').toLowerCase().includes(q)
                    || (e.nstpComponent || '').toLowerCase().includes(q)
                    || (e.program || '').toLowerCase().includes(q)
                  )
                : pendingEnrollments;

              const filtered = !enrollmentSortCol ? baseFiltered : [...baseFiltered].sort((a, b) => {
                let valA = '';
                let valB = '';
                if (enrollmentSortCol === 'id') {
                  valA = a.studentId || '';
                  valB = b.studentId || '';
                } else if (enrollmentSortCol === 'name') {
                  valA = a.fullName || '';
                  valB = b.fullName || '';
                } else if (enrollmentSortCol === 'section') {
                  valA = a.section || '';
                  valB = b.section || '';
                } else if (enrollmentSortCol === 'year') {
                  valA = a.yearLevel || '';
                  valB = b.yearLevel || '';
                } else if (enrollmentSortCol === 'nstp') {
                  valA = a.nstpComponent || '';
                  valB = b.nstpComponent || '';
                }
                const cmp = String(valA).localeCompare(String(valB), undefined, { numeric: true });
                return enrollmentSortDir === 'asc' ? cmp : -cmp;
              });

              return filtered.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Search className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No results for "<span className="font-medium">{enrollmentSearch}</span>"</p>
                  <button type="button" onClick={() => setEnrollmentSearch('')} className="mt-2 text-xs text-yellow-600 hover:underline">Clear search</button>
                </div>
              ) : (
              <>
                {/* ── Mobile: card list ── */}
                <div className="sm:hidden divide-y divide-gray-100">
                  {filtered.map((enrollment) => {
                    const deptColor =
                      enrollment.nstpComponent === 'CWTS' ? 'bg-green-100 text-green-700' :
                      enrollment.nstpComponent === 'LTS'  ? 'bg-purple-100 text-purple-700' :
                      enrollment.nstpComponent === 'ROTC' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700';
                    return (
                      <div
                        key={enrollment.id}
                        className="p-3 hover:bg-green-50 cursor-pointer transition-colors"
                        onClick={() => setSelectedEnrollment(enrollment)}
                      >
                        <div className="flex items-start gap-3 mb-2.5">
                          <div className="w-12 h-14 bg-gray-100 rounded-xl overflow-hidden border-2 border-emerald-300 shrink-0 shadow-2xs">
                            <img 
                              src={enrollment.id_photo_2x2 || enrollment.photo || enrollment.idPhoto2x2 || enrollment.registration_photo || enrollment.registrationPhoto || `${import.meta.env.BASE_URL}cvsu.png`} 
                              alt="2x2" 
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover" 
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-1 flex-wrap">
                              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                <p className="text-xs sm:text-sm font-black text-gray-900 truncate">{enrollment.fullName}</p>
                                {(() => {
                                  const audit = getRegformAuditStatus(enrollment, regformAudits);
                                  if (audit.isSuspicious) {
                                    return (
                                      <span 
                                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[9.5px] font-black bg-amber-400 text-amber-950 border border-amber-500 shadow-xs shrink-0 animate-pulse" 
                                        title={audit.reason}
                                      >
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-900 shrink-0" />
                                        <span>{audit.badgeLabel || '⚠️ Not a RegForm'}</span>
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                              <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black ${deptColor}`}>
                                {enrollment.nstpComponent || '—'}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 font-mono mt-0.5">{enrollment.studentId} · {enrollment.yearLevel} · Sec {enrollment.section || '-'}</p>
                            <p className="text-[10.5px] text-gray-400 truncate">{enrollment.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button type="button"
                            onClick={() => showConfirm(`Approve enrollment for ${enrollment.fullName}?`, async () => { try { await approveEnrollment(enrollment.id); } catch {} })}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button type="button"
                            onClick={() => showConfirm(`Decline enrollment for ${enrollment.fullName}?`, async () => { try { await declineEnrollment(enrollment.id); } catch {} })}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" /> Decline
                          </button>
                          <button type="button"
                            onClick={() => setSelectedEnrollment(enrollment)}
                            className="px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── Desktop: table ── */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th 
                          onClick={() => handleSortEnrollment('id')}
                          className={`px-4 py-3 text-left text-xs uppercase tracking-wider cursor-pointer select-none transition-colors ${
                            enrollmentSortCol === 'id' 
                              ? 'bg-emerald-100/90 text-emerald-950 font-black border-b-2 border-emerald-600' 
                              : 'font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                          title="Click to sort by Student ID"
                        >
                          <div className="flex items-center gap-1">
                            <span>Student ID</span>
                            {enrollmentSortCol === 'id' && (
                              <span className="text-emerald-700 font-black">{enrollmentSortDir === 'asc' ? '▲' : '▼'}</span>
                            )}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSortEnrollment('name')}
                          className={`px-4 py-3 text-left text-xs uppercase tracking-wider cursor-pointer select-none transition-colors ${
                            enrollmentSortCol === 'name' 
                              ? 'bg-emerald-100/90 text-emerald-950 font-black border-b-2 border-emerald-600' 
                              : 'font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                          title="Click to sort by Name"
                        >
                          <div className="flex items-center gap-1">
                            <span>Name / Email</span>
                            {enrollmentSortCol === 'name' && (
                              <span className="text-emerald-700 font-black">{enrollmentSortDir === 'asc' ? '▲' : '▼'}</span>
                            )}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSortEnrollment('section')}
                          className={`px-4 py-3 text-left text-xs uppercase tracking-wider cursor-pointer select-none transition-colors ${
                            enrollmentSortCol === 'section' 
                              ? 'bg-emerald-100/90 text-emerald-950 font-black border-b-2 border-emerald-600' 
                              : 'font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                          title="Click to sort by Section"
                        >
                          <div className="flex items-center gap-1">
                            <span>Section</span>
                            {enrollmentSortCol === 'section' && (
                              <span className="text-emerald-700 font-black">{enrollmentSortDir === 'asc' ? '▲' : '▼'}</span>
                            )}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSortEnrollment('year')}
                          className={`px-4 py-3 text-left text-xs uppercase tracking-wider cursor-pointer select-none transition-colors ${
                            enrollmentSortCol === 'year' 
                              ? 'bg-emerald-100/90 text-emerald-950 font-black border-b-2 border-emerald-600' 
                              : 'font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                          title="Click to sort by Year Level"
                        >
                          <div className="flex items-center gap-1">
                            <span>Year</span>
                            {enrollmentSortCol === 'year' && (
                              <span className="text-emerald-700 font-black">{enrollmentSortDir === 'asc' ? '▲' : '▼'}</span>
                            )}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSortEnrollment('nstp')}
                          className={`px-4 py-3 text-left text-xs uppercase tracking-wider cursor-pointer select-none transition-colors ${
                            enrollmentSortCol === 'nstp' 
                              ? 'bg-emerald-100/90 text-emerald-950 font-black border-b-2 border-emerald-600' 
                              : 'font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                          title="Click to sort by NSTP Component"
                        >
                          <div className="flex items-center gap-1">
                            <span>NSTP</span>
                            {enrollmentSortCol === 'nstp' && (
                              <span className="text-emerald-700 font-black">{enrollmentSortDir === 'asc' ? '▲' : '▼'}</span>
                            )}
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((enrollment) => (
                        <tr
                          key={enrollment.id}
                          className="border-b border-gray-100 hover:bg-green-50 cursor-pointer transition-colors"
                          onClick={() => setSelectedEnrollment(enrollment)}
                        >
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{enrollment.studentId}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-12 bg-gray-100 rounded-xl overflow-hidden border border-emerald-300 shrink-0 shadow-2xs">
                                <img 
                                  src={enrollment.id_photo_2x2 || enrollment.photo || enrollment.idPhoto2x2 || enrollment.registration_photo || enrollment.registrationPhoto || `${import.meta.env.BASE_URL}cvsu.png`} 
                                  alt="2x2" 
                                  loading="lazy"
                                  decoding="async"
                                  className="w-full h-full object-cover" 
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-black text-gray-900">{enrollment.fullName}</p>
                                  {(() => {
                                    const audit = getRegformAuditStatus(enrollment, regformAudits);
                                    if (audit.isSuspicious) {
                                      return (
                                        <span 
                                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-amber-400 text-amber-950 border border-amber-500 shadow-xs shrink-0 animate-pulse" 
                                          title={audit.reason}
                                        >
                                          <AlertTriangle className="w-3.5 h-3.5 text-amber-900 shrink-0" />
                                          <span>{audit.badgeLabel || '⚠️ Not a RegForm'}</span>
                                        </span>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                                <p className="text-xs text-gray-500">{enrollment.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{enrollment.section || '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{enrollment.yearLevel}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              enrollment.nstpComponent === 'CWTS' ? 'bg-green-100 text-green-700' :
                              enrollment.nstpComponent === 'LTS'  ? 'bg-purple-100 text-purple-700' :
                              enrollment.nstpComponent === 'ROTC' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {enrollment.nstpComponent || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              <button type="button"
                                
                                onClick={() => showConfirm(`Approve enrollment for ${enrollment.fullName}?`, async () => { try { await approveEnrollment(enrollment.id); } catch {} })}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button type="button"
                                
                                onClick={() => showConfirm(`Decline enrollment for ${enrollment.fullName}?`, async () => { try { await declineEnrollment(enrollment.id); } catch {} })}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                              >
                                <X className="w-3.5 h-3.5" /> Decline
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ); })() : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No pending enrollment applications at this time.</p>
                <p className="text-sm mt-1">New student enrollments will appear here.</p>
              </div>
            )}
          </div>
        )}

        {/* Component Enrollment Comparison (Multi-Year Analytics) */}
        <div className={`rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6 transition-all ${viewingArchive ? 'bg-gray-100' : 'bg-white'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shadow-inner shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Cavite State University Naic Component Enrollment Comparison</h3>
                <p className="text-xs text-gray-500 mt-0.5">Historical and active student enrollment comparison across academic batch years</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-extrabold flex items-center border border-emerald-200/80 shadow-2xs active:scale-95 transition-all cursor-pointer"
            >
              {showAnalytics ? (
                <><ChevronUp className="w-4 h-4 mr-1" /> Hide Analytics</>
              ) : (
                <><ChevronDown className="w-4 h-4 mr-1" /> View Analytics</>
              )}
            </button>
          </div>
          
          {showAnalytics && (
            <div className="animate-fade-in">
              {/* Legend & Filter */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-3 bg-gray-50/80 rounded-xl border border-gray-200/60">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Components Legend</span>
                <div className="flex items-center space-x-5">
                  <div className="flex items-center space-x-2">
                    <div className="w-3.5 h-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-md shadow-xs"></div>
                    <span className="text-xs text-gray-700 font-bold">CWTS</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3.5 h-3.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-md shadow-xs"></div>
                    <span className="text-xs text-gray-700 font-bold">LTS</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3.5 h-3.5 bg-gradient-to-r from-rose-500 to-red-600 rounded-md shadow-xs"></div>
                    <span className="text-xs text-gray-700 font-bold">ROTC</span>
                  </div>
                </div>
              </div>

              {/* Bar Chart — Fitted 100% on Mobile */}
              <div className="w-full space-y-3 sm:space-y-4">
                {[...safeArchivedYears.filter(y => String(y.year) !== String(currentBatch)).map(y => ({ 
                  year: y.year, 
                  cwts: y.data?.cwts || y.cwts || (y.data?.studentData?.filter(s => s.department === 'CWTS').length) || 0, 
                  lts: y.data?.lts || y.lts || (y.data?.studentData?.filter(s => s.department === 'LTS').length) || 0, 
                  rotc: y.data?.rotc || y.rotc || (y.data?.studentData?.filter(s => s.department === 'ROTC').length) || 0 
                })), 
                  { year: currentBatch, cwts: currentStats.cwts, lts: currentStats.lts, rotc: currentStats.rotc }
                ].sort((a, b) => String(a.year).localeCompare(String(b.year))).map((data) => {
                  const maxVal = Math.max(data.cwts || 0, data.lts || 0, data.rotc || 0, 100);
                  const totalForYear = (data.cwts || 0) + (data.lts || 0) + (data.rotc || 0);

                  return (
                    <div key={data.year} className="bg-gray-50/70 hover:bg-emerald-50/40 border border-gray-200/60 hover:border-emerald-300 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 transition-all duration-200 group">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <span className="text-xs sm:text-sm font-black text-gray-900 group-hover:text-emerald-800 transition-colors">Batch {data.year}</span>
                          {String(data.year) === String(currentBatch) && (
                            <span className="text-[10px] bg-emerald-800 text-amber-300 px-2 py-0.5 rounded-full font-black tracking-wide uppercase shadow-2xs">Active Batch</span>
                          )}
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-gray-700 bg-white px-2 py-0.5 rounded-lg border border-gray-200 shadow-2xs">
                          {totalForYear} total
                        </span>
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        {/* CWTS Bar */}
                        <div className="flex items-center gap-2">
                          <span className="w-8 sm:w-12 text-[10px] sm:text-xs font-bold text-emerald-800 shrink-0">CWTS</span>
                          <div className="flex-1 bg-gray-200/80 rounded-full h-4 sm:h-6 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-end pr-1.5 sm:pr-2.5 transition-all duration-500 shadow-xs"
                              style={{ width: `${(data.cwts / maxVal) * 100}%`, minWidth: data.cwts > 0 ? '20px' : '0' }}
                            >
                              {data.cwts > 0 && <span className="text-[9px] sm:text-xs text-white font-black">{data.cwts}</span>}
                            </div>
                          </div>
                        </div>
                        {/* LTS Bar */}
                        <div className="flex items-center gap-2">
                          <span className="w-8 sm:w-12 text-[10px] sm:text-xs font-bold text-purple-800 shrink-0">LTS</span>
                          <div className="flex-1 bg-gray-200/80 rounded-full h-4 sm:h-6 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-end pr-1.5 sm:pr-2.5 transition-all duration-500 shadow-xs"
                              style={{ width: `${(data.lts / maxVal) * 100}%`, minWidth: data.lts > 0 ? '20px' : '0' }}
                            >
                              {data.lts > 0 && <span className="text-[9px] sm:text-xs text-white font-black">{data.lts}</span>}
                            </div>
                          </div>
                        </div>
                        {/* ROTC Bar */}
                        <div className="flex items-center gap-2">
                          <span className="w-8 sm:w-12 text-[10px] sm:text-xs font-bold text-rose-800 shrink-0">ROTC</span>
                          <div className="flex-1 bg-gray-200/80 rounded-full h-4 sm:h-6 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-rose-500 to-red-600 rounded-full flex items-center justify-end pr-1.5 sm:pr-2.5 transition-all duration-500 shadow-xs"
                              style={{ width: `${(data.rotc / maxVal) * 100}%`, minWidth: data.rotc > 0 ? '20px' : '0' }}
                            >
                              {data.rotc > 0 && <span className="text-[9px] sm:text-xs text-white font-black">{data.rotc}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>



        {/* Batch Management - Hide when viewing archive */}
        {!viewingArchive && (
          <div className="bg-gradient-to-r from-green-700 to-green-800 rounded-xl shadow-md p-3 sm:p-6 mb-3 sm:mb-5 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                  <Archive className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Batch Management</h3>
                  <p className="text-green-100">Current Batch: <span className="font-semibold text-white">{currentBatch}</span></p>
                  <p className="text-green-200 text-sm mt-1">
                    {students.length} students • {reports.length} reports
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-nowrap sm:items-center sm:space-x-3 w-full sm:w-auto">
                <button type="button"
                  onClick={() => setShowArchiveModal(true)}
                  className="bg-white/20 hover:bg-white/30 px-3 sm:px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm font-bold text-center cursor-pointer active:scale-95"
                >
                  <History className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>View Archive</span>
                </button>
                <button type="button"
                  onClick={handleNewBatch}
                  className="bg-amber-400 hover:bg-amber-500 text-emerald-950 px-3 sm:px-6 py-2.5 rounded-xl font-black transition-all shadow-md flex items-center justify-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm text-center cursor-pointer active:scale-95"
                >
                  <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Start New Batch</span>
                </button>
              </div>
            </div>
            <p className="text-green-200 text-sm mt-4">
              * Starting a new batch will archive all current student data and reports for {currentBatch}, then clear them for the new batch.
            </p>
          </div>
        )}

        {/* Archive Modal - Glassmorphic Batch Selection */}
        {showArchiveModal && (
          <div className="fixed inset-0 bg-emerald-950/75 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowArchiveModal(false)}>
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col border border-emerald-100 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-900 via-emerald-850 to-teal-900 text-white p-5 sm:p-6 flex items-center justify-between shadow-sm shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black tracking-tight">Archived Student Batches</h3>
                    <p className="text-emerald-200 text-xs font-medium">Select a historical batch to inspect or delete</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowArchiveModal(false)}
                  className="w-8 h-8 rounded-full bg-emerald-800/80 hover:bg-emerald-700 flex items-center justify-center text-emerald-200 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Batch List Body */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-3 max-h-[60vh]">
                {safeArchivedYears.length === 0 ? (
                  <div className="text-center py-10">
                    <History className="w-12 h-12 text-emerald-200 mx-auto mb-2 opacity-50" />
                    <p className="text-gray-500 font-bold text-sm">No archived batches found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[...safeArchivedYears].sort((a, b) => String(b.year).localeCompare(String(a.year))).map((year) => (
                      <div
                        key={year.year}
                        className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50/80 hover:bg-emerald-50/60 rounded-2xl p-4 sm:p-5 border border-gray-200/80 hover:border-emerald-300 transition-all gap-3 shadow-2xs group"
                      >
                        <div className="flex items-center space-x-3.5">
                          <div>
                            <h4 className="text-base font-black text-emerald-950">Batch {year.year}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                                {year.students} Students
                              </span>
                              <span className="text-[11px] font-bold text-gray-500">
                                • {year.reports} Reports
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => handleViewBatch(year)}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white font-black px-4 py-2 rounded-xl text-xs shadow-sm active:scale-95 transition-all cursor-pointer"
                          >
                            View Batch
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteArchivedBatch(year.year)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 p-2 rounded-xl text-xs font-bold transition-all cursor-pointer hover:border-red-300"
                            title="Delete Batch"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setShowArchiveModal(false)}
                  className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* New Batch Confirmation Modal */}
        {showNewBatchConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowNewBatchConfirm(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-5 sm:p-6 border border-emerald-100 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                    <Archive className="w-4 h-4 text-emerald-800" />
                  </div>
                  <span>Start New Semester Batch</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowNewBatchConfirm(false)}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4 mb-5">
                <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3.5 text-xs">
                  <p className="text-amber-900 font-bold mb-1">📦 Current Batch Archiving Notice</p>
                  <p className="text-amber-800 font-medium">
                    Current active batch <strong>"{currentBatch}"</strong> ({students.length} students, {reports.length} reports) will be saved to the archive. Active student roster will be cleared for the incoming semester batch.
                  </p>
                </div>

                {/* Auto-Calculated Next Batch Highlight */}
                <div className="bg-emerald-50 border border-emerald-200/90 rounded-xl p-3.5 text-xs flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">Incoming Batch (Auto-Calculated):</span>
                    <p className="text-sm font-black text-emerald-950 mt-0.5">{newBatchName || `${newBatchYearInput} ${newBatchSem}`}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-700 text-white font-black text-[10px] rounded-full uppercase tracking-wider shrink-0 shadow-xs">
                    ⚡ Auto-Set
                  </span>
                </div>
                
                <div>
                  <label htmlFor="confirm-batch" className="block text-xs font-bold text-gray-700 mb-1.5">
                    Type <span className="text-red-600 font-black">"confirm"</span> to continue:
                  </label>
                  <input
                    type="text"
                    id="confirm-batch"
                    name="confirmBatch"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder='Type "confirm" here...'
                    autoComplete="off"
                    className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bold"
                    onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmNewBatch(); } }}
                  />
                </div>
              </div>
              
              <div className="flex space-x-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowNewBatchConfirm(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmNewBatch}
                  disabled={confirmText.toLowerCase() !== 'confirm'}
                  className="flex-1 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-300 text-white rounded-xl font-black text-xs transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed"
                >
                  Confirm &amp; Start Batch
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Enrollment Detail Modal */}
        {selectedEnrollment && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-fade-in" onClick={() => setSelectedEnrollment(null)}>
            <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-lg max-h-[92vh] flex flex-col" onClick={(e) => e.stopPropagation()}>

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-green-800 text-white rounded-t-2xl sm:rounded-t-xl flex-shrink-0">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold truncate">{selectedEnrollment.fullName}</h3>
                  <p className="text-xs text-green-200 mt-0.5">{selectedEnrollment.studentId} · {selectedEnrollment.nstpComponent}</p>
                </div>
                <button type="button" onClick={() => setSelectedEnrollment(null)} className="p-1.5 hover:bg-green-700 rounded-lg transition-colors flex-shrink-0 ml-2">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto overscroll-contain">

                {/* Official 2x2 ID Portrait Photo Preview */}
                <div className="p-3.5 border-b border-gray-200 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-4 h-4 text-emerald-700" /> Official 2x2 ID Portrait Photo
                    </p>
                    {(selectedEnrollment.id_photo_2x2 || selectedEnrollment.photo || selectedEnrollment.idPhoto2x2 || selectedEnrollment.registration_photo || selectedEnrollment.registrationPhoto) && (
                      <button
                        type="button"
                        onClick={() => setPhotoViewer(selectedEnrollment.id_photo_2x2 || selectedEnrollment.photo || selectedEnrollment.idPhoto2x2 || selectedEnrollment.registration_photo || selectedEnrollment.registrationPhoto)}
                        className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-300 shadow-2xs hover:bg-emerald-100 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        🔍 Expand 2x2 Fullscreen
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3.5 bg-gray-50/80 p-3 rounded-2xl border border-gray-200/80">
                    <div 
                      className="w-20 h-24 bg-gray-200 rounded-xl overflow-hidden border-2 border-emerald-500 shrink-0 shadow-sm relative group cursor-pointer"
                      onClick={() => setPhotoViewer(selectedEnrollment.id_photo_2x2 || selectedEnrollment.photo || selectedEnrollment.idPhoto2x2 || selectedEnrollment.registration_photo || selectedEnrollment.registrationPhoto)}
                      title="Click to expand 2x2 ID Photo"
                    >
                      {(selectedEnrollment.id_photo_2x2 || selectedEnrollment.photo || selectedEnrollment.idPhoto2x2 || selectedEnrollment.registration_photo || selectedEnrollment.registrationPhoto) ? (
                        <>
                          <img 
                            src={selectedEnrollment.id_photo_2x2 || selectedEnrollment.photo || selectedEnrollment.idPhoto2x2 || selectedEnrollment.registration_photo || selectedEnrollment.registrationPhoto} 
                            alt="2x2 ID Photo" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                            🔍 View
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 text-[10px] text-center p-1 font-bold">
                          <User className="w-6 h-6 mb-1 opacity-50" />
                          No Photo
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-full mb-1">
                        <CheckCircle className="w-3 h-3 text-emerald-600" /> Official Portrait ID
                      </span>
                      <h4 className="text-xs font-black text-gray-900 truncate">
                        {selectedEnrollment.fullName || 'Student 2x2 Photo'}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">Click thumbnail to inspect full size 2x2 portrait photo</p>
                    </div>
                  </div>
                </div>

                {/* Registration Form / Photo Document — Instant Inline Visual Preview */}
                <div className="p-3.5 border-b border-gray-200 bg-emerald-50/40">
                  {(() => {
                    const audit = getRegformAuditStatus(selectedEnrollment, regformAudits);
                    if (audit.isSuspicious) {
                      return (
                        <div className="mb-3 p-3 bg-amber-50 border-2 border-amber-400 rounded-2xl flex items-start gap-2.5 shadow-sm">
                          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-black text-amber-900 uppercase tracking-wide">Document Verification Alert</p>
                            <p className="text-[11.5px] text-amber-800 font-medium mt-0.5 leading-relaxed">{audit.reason}</p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-emerald-700" /> Submitted Registration Document / Form
                    </p>
                    {(selectedEnrollment.registration_photo || selectedEnrollment.registrationPhoto) && (
                      <button
                        type="button"
                        onClick={() => setPhotoViewer(selectedEnrollment.registration_photo || selectedEnrollment.registrationPhoto)}
                        className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-white px-2.5 py-1 rounded-lg border border-emerald-300 shadow-2xs hover:bg-emerald-100 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        🔍 Expand Fullscreen
                      </button>
                    )}
                  </div>

                  <RegistrationDocumentPreview
                    documentUrl={selectedEnrollment.registration_photo || selectedEnrollment.registrationPhoto}
                    onExpand={() => setPhotoViewer(selectedEnrollment.registration_photo || selectedEnrollment.registrationPhoto)}
                    isFullscreen={false}
                  />
                </div>

                {/* Details — label/value rows, comprehensive */}
                <div className="p-3.5 space-y-4">

                  {/* Personal */}
                  <div>
                    <p className="text-xs font-black text-emerald-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-600" /> Personal Information
                    </p>
                    <div className="bg-gray-50/90 rounded-xl p-3 border border-gray-200/80 space-y-2">
                      {[
                        ['Full Name', selectedEnrollment.fullName || selectedEnrollment.student_name],
                        ['Last Name', selectedEnrollment.lastName || (selectedEnrollment.fullName?.includes(',') ? selectedEnrollment.fullName.split(',')[0]?.trim() : '—')],
                        ['First Name', selectedEnrollment.firstName || (selectedEnrollment.fullName?.includes(',') ? selectedEnrollment.fullName.split(',')[1]?.trim().split(' ')[0] : '—')],
                        ['Middle Name', selectedEnrollment.middleName || '—'],
                        ['Suffix', selectedEnrollment.suffix || '—'],
                        ['Student ID', selectedEnrollment.studentId],
                        ['Email', selectedEnrollment.email],
                        ['Contact No.', selectedEnrollment.contactNumber],
                        ['Facebook', selectedEnrollment.facebookAccount || '—'],
                      ].map(([label, val]) => (
                        <div key={label} className="flex justify-between items-start gap-3 text-xs">
                          <span className="text-gray-500 font-bold flex-shrink-0 w-24">{label}</span>
                          <span className="font-extrabold text-gray-900 text-right break-all">{val || '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Address Breakdown */}
                  <div>
                    <p className="text-xs font-black text-emerald-900 uppercase tracking-wider mb-2">Address Details</p>
                    <div className="bg-gray-50/90 rounded-xl p-3 border border-gray-200/80 space-y-2">
                      {[
                        ['Complete Address', selectedEnrollment.address || selectedEnrollment.homeAddress || '—'],
                        ['Street / Barangay', selectedEnrollment.street || '—'],
                        ['Municipality / City', selectedEnrollment.municipality || '—'],
                        ['Province', selectedEnrollment.province || '—'],
                      ].map(([label, val]) => (
                        <div key={label} className="flex justify-between items-start gap-3 text-xs">
                          <span className="text-gray-500 font-bold flex-shrink-0 w-28">{label}</span>
                          <span className="font-extrabold text-gray-900 text-right break-all">{val || '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Academic */}
                  <div>
                    <p className="text-xs font-black text-emerald-900 uppercase tracking-wider mb-2">Academic Information</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        ['Degree Program', selectedEnrollment.program || selectedEnrollment.course],
                        ['Section', selectedEnrollment.section || '—'],
                        ['Year Level', selectedEnrollment.yearLevel || selectedEnrollment.year],
                        ['NSTP Track', selectedEnrollment.nstpComponent || selectedEnrollment.department],
                      ].map(([label, val]) => (
                        <div key={label} className="bg-gray-50 rounded-xl p-2.5 border border-gray-200/80">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
                          <p className="text-xs font-black text-emerald-950">{val || '—'}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Demographic & Health */}
                  <div>
                    <p className="text-xs font-black text-emerald-900 uppercase tracking-wider mb-2">Demographic &amp; Health</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        ['Birth Date', selectedEnrollment.birthDate ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(selectedEnrollment.birthDate)) : '—'],
                        ['Age', selectedEnrollment.age ? `${selectedEnrollment.age} yrs old` : '—'],
                        ['Sex / Gender', selectedEnrollment.sex || selectedEnrollment.gender || '—'],
                        ['Civil Status', selectedEnrollment.civilStatus || '—'],
                        ['Registered Voter', selectedEnrollment.registeredVoter || selectedEnrollment.isVoter || '—'],
                        ['Height', selectedEnrollment.height ? (String(selectedEnrollment.height).includes('cm') ? selectedEnrollment.height : `${selectedEnrollment.height} cm`) : '—'],
                        ['Weight', selectedEnrollment.weight ? (String(selectedEnrollment.weight).includes('kg') ? selectedEnrollment.weight : `${selectedEnrollment.weight} kg`) : '—'],
                        ['Blood Type', selectedEnrollment.bloodType || '—'],
                      ].map(([label, val]) => (
                        <div key={label} className="bg-gray-50 rounded-xl p-2.5 border border-gray-200/80">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
                          <p className="text-xs font-black text-gray-900">{val || '—'}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div>
                    <p className="text-xs font-black text-emerald-900 uppercase tracking-wider mb-2">Emergency Contact Person</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        ['Contact Person', selectedEnrollment.emergencyContact || selectedEnrollment.emergencyName || '—'],
                        ['Emergency No.', selectedEnrollment.emergencyNumber || '—'],
                      ].map(([label, val]) => (
                        <div key={label} className="bg-gray-50 rounded-xl p-2.5 border border-gray-200/80">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
                          <p className="text-xs font-black text-gray-900">{val || '—'}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Submission Status & Timestamp */}
                  <div className="flex items-center justify-between bg-amber-50/80 border border-amber-200/80 rounded-xl px-3.5 py-2.5 text-xs shadow-2xs">
                    <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 rounded-full font-black uppercase text-[10px] tracking-wider">
                      Status: {selectedEnrollment.status || 'Pending'}
                    </span>
                    <span className="text-gray-500 font-bold">
                      Submitted: {selectedEnrollment.submitted_at ? new Date(selectedEnrollment.submitted_at).toLocaleDateString() : 'Just now'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sticky action buttons */}
              <div className="flex-shrink-0 border-t bg-white p-3 grid grid-cols-3 gap-2">
                <button type="button"
                  onClick={() => showConfirm(`Approve enrollment for ${selectedEnrollment.fullName}?`, async () => { 
                    try { 
                      await approveEnrollment(selectedEnrollment.id, selectedEnrollment.section || 'A'); 
                      setSelectedEnrollment(null); 
                    } catch {} 
                  })}
                  className="col-span-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
                <button type="button"
                  onClick={() => showConfirm(`Decline enrollment for ${selectedEnrollment.fullName}?`, async () => { 
                    try { 
                      await declineEnrollment(selectedEnrollment.id); 
                      setSelectedEnrollment(null); 
                    } catch {} 
                  })}
                  className="col-span-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <X className="w-4 h-4" /> Decline
                </button>
                <button type="button"
                  onClick={() => setSelectedEnrollment(null)}
                  className="col-span-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Full-screen photo lightbox */}
        {photoViewer && (
          <div
            className="fixed inset-0 bg-black z-[9999] flex flex-col"
            onClick={() => setPhotoViewer(null)}
          >
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-black/70">
              <span className="text-white text-sm font-medium">Registration Form</span>
              <button type="button"
                
                onClick={() => setPhotoViewer(null)}
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center overflow-auto p-2" onClick={e => e.stopPropagation()}>
              {typeof photoViewer === 'string' && (photoViewer.startsWith('data:application/pdf') || photoViewer.endsWith('.pdf')) ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 rounded-xl p-2 sm:p-4">
                  <div className="flex-1 w-full max-h-[82vh] overflow-auto flex items-center justify-center">
                    <RegistrationDocumentPreview
                      documentUrl={photoViewer}
                      isFullscreen={true}
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-3 shrink-0">
                    <a
                      href={photoViewer}
                      download="Registration_Form.pdf"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" /> Download PDF File
                    </a>
                  </div>
                </div>
              ) : (
                <img
                  src={photoViewer}
                  alt="Registration form"
                  className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                  style={{ touchAction: 'pinch-zoom' }}
                />
              )}
            </div>
          </div>
        )}

        {/* Archive Detail View Modal */}
        {showArchiveDetails && archiveViewData && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowArchiveDetails(false)}>
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-emerald-900 text-white p-4 flex flex-wrap items-center justify-between gap-3 rounded-t-xl z-20 shadow-md">
                <h3 className="text-base sm:text-lg font-bold flex items-center">
                  <Archive className="w-5 h-5 mr-2 text-amber-300" />
                  Batch {archiveViewData.year} Archive Details
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadChedFormat(archiveViewData)}
                    className="bg-amber-400 hover:bg-amber-300 text-emerald-950 px-3 py-1.5 rounded-xl text-xs font-black transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                    title="Download Official CHED Form B Masterlist Excel"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-950" />
                    <span>Download CHED Format (.xlsx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadChedFormA(archiveViewData)}
                    className="bg-emerald-800 hover:bg-emerald-700 text-amber-200 border border-emerald-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                    title="Download CHED Form 2-A Summary Matrix Excel"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Form 2-A (.xlsx)</span>
                  </button>
                  <button type="button"
                    onClick={() => setShowArchiveDetails(false)}
                    className="p-1 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer text-emerald-200 hover:text-white ml-1"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-3 sm:p-6 space-y-3 sm:space-y-5">
                {/* Archive Summary */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-amber-800 mb-3">Archive Summary</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-lg sm:text-2xl font-bold text-blue-600">{archiveViewData.students || 0}</p>
                      <p className="text-sm text-gray-600">Total Students</p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-lg sm:text-2xl font-bold text-green-600">{archiveViewData.cwts || 0}</p>
                      <p className="text-sm text-gray-600">CWTS</p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-lg sm:text-2xl font-bold text-purple-600">{archiveViewData.lts || 0}</p>
                      <p className="text-sm text-gray-600">LTS</p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-lg sm:text-2xl font-bold text-red-600">{archiveViewData.rotc || 0}</p>
                      <p className="text-sm text-gray-600">ROTC</p>
                    </div>
                  </div>
                </div>

                {/* Student Information Section */}
                <div>
                  <h4 className="text-md font-semibold text-green-800 mb-3 border-b pb-2 flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Student Information
                  </h4>
                  {archiveViewData.studentData && archiveViewData.studentData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left">Student ID</th>
                            <th className="px-4 py-2 text-left">Name</th>
                            <th className="px-4 py-2 text-left">Program</th>
                            <th className="px-4 py-2 text-left">Component</th>
                            <th className="px-4 py-2 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {archiveViewData.studentData.map((student, idx) => (
                            <tr key={idx} className="border-b border-gray-100">
                              <td className="px-4 py-2">{student.studentId}</td>
                              <td className="px-4 py-2">{student.name}</td>
                              <td className="px-4 py-2">{student.program}</td>
                              <td className="px-4 py-2">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  student.department === 'CWTS' ? 'bg-green-100 text-green-700' :
                                  student.department === 'LTS' ? 'bg-purple-100 text-purple-700' :
                                  student.department === 'ROTC' ? 'bg-red-100 text-red-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {student.department}
                                </span>
                              </td>
                              <td className="px-4 py-2">{student.status || 'Completed'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Student details not available in archive</p>
                  )}
                </div>

                {/* Report Details Section */}
                <div>
                  <h4 className="text-md font-semibold text-green-800 mb-3 border-b pb-2 flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Report Details
                  </h4>
                  {archiveViewData.reportData && archiveViewData.reportData.length > 0 ? (
                    <div className="space-y-3">
                      {archiveViewData.reportData.map((report, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-800">{report.title}</h5>
                            <span className={`px-2 py-1 rounded text-xs ${
                              report.department === 'CWTS' ? 'bg-green-100 text-green-700' :
                              report.department === 'LTS' ? 'bg-purple-100 text-purple-700' :
                              report.department === 'ROTC' ? 'bg-red-100 text-red-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {report.department}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            {report.due_date && <span>Due: {new Date(report.due_date).toLocaleDateString()}</span>}
                            <span>{report.submission_count ?? report.submissions?.length ?? 0} submission(s)</span>
                            {report.created_by_name && <span>By: {report.created_by_name}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Report details not available in archive</p>
                  )}
                </div>

                {/* Calendar & Activities Schedule Section */}
                <div>
                  <h4 className="text-md font-semibold text-green-800 mb-3 border-b pb-2 flex items-center justify-between">
                    <span className="flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      Academic &amp; Training Calendar Schedule
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowArchiveDetails(false);
                        navigate('/calendar');
                      }}
                      className="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open Calendar Page &rarr;</span>
                    </button>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(() => {
                      const yr = String(archiveViewData?.year || '');
                      const events = yr.includes('2023-2024')
                        ? (yr.includes('1st Semester')
                            ? [
                                { date: '2023-09-02', title: 'NSTP 1 General Orientation & Plenary', desc: 'Institutional NSTP orientation at CvSU Naic Gymnasium.', dept: 'All' },
                                { date: '2023-10-07', title: 'CWTS Community Needs Assessment Field Visit', desc: 'Participatory community profiling in Brgy. Bucana & Halang.', dept: 'CWTS' },
                                { date: '2023-10-14', title: 'LTS Diagnostic Reading Assessment', desc: 'Diagnostic literacy pre-assessment for elementary schools.', dept: 'LTS' },
                                { date: '2023-10-21', title: 'ROTC Midterm Drill & Muster', desc: 'Inspection and formation testing by AFP Reservist Command.', dept: 'ROTC' },
                                { date: '2023-11-11', title: 'NSTP 1 Midterm Evaluation & Submission', desc: 'Documentation milestone progress audit.', dept: 'All' },
                                { date: '2023-12-09', title: '1st Semester Culminating Project Defense', desc: 'Departmental presentation of community project outputs.', dept: 'All' },
                              ]
                            : [
                                { date: '2024-02-10', title: 'NSTP 2 Resumption & Project Briefing', desc: 'Community engagement and project mobilization.', dept: 'All' },
                                { date: '2024-03-02', title: 'CWTS Mangrove Planting & Coastal Rehabilitation', desc: '500 mangrove seedlings planted along Bucana shoreline.', dept: 'CWTS' },
                                { date: '2024-03-16', title: 'LTS Reading Clinic & Storybook Distribution', desc: 'Remedial reading tutorials and learning kit handover.', dept: 'LTS' },
                                { date: '2024-03-23', title: 'ROTC Field Tactics & Land Navigation Exercise', desc: 'Field orienteering and compass movement simulation.', dept: 'ROTC' },
                                { date: '2024-04-13', title: 'Final Project Culmination & Document Audit', desc: 'Verification of community portfolios and grade requirements.', dept: 'All' },
                                { date: '2024-04-27', title: 'NSTP Passing-in-Review & Recognition Ceremony', desc: 'Formal graduation muster and certificate awarding ceremony.', dept: 'All' },
                              ])
                        : (yr.includes('1st Semester')
                            ? [
                                { date: '2024-09-07', title: 'NSTP 1 General Orientation & Briefing', desc: 'Academic orientation and program assignments.', dept: 'All' },
                                { date: '2024-10-05', title: 'CWTS Barangay Profiling & Immersion Preparation', desc: 'Coordination meeting with Barangay officials of Bucana.', dept: 'CWTS' },
                                { date: '2024-10-12', title: 'LTS Literacy Pre-Assessment in Partner School', desc: 'Diagnostic phonics and numeracy evaluation.', dept: 'LTS' },
                                { date: '2024-10-19', title: 'ROTC Troop Muster & Ceremonial Formations', desc: 'Basic military customs, discipline, and troop movement drill.', dept: 'ROTC' },
                                { date: '2024-11-09', title: 'NSTP 1 Midterm Evaluation & Defense', desc: 'Mid-term documentation audit and project status verification.', dept: 'All' },
                                { date: '2024-11-23', title: 'Community Disaster Preparedness Clinic', desc: 'Emergency response simulations in partnership with MDRRMO.', dept: 'All' },
                              ]
                            : [
                                { date: '2025-02-08', title: 'NSTP 2 Project Launch & Field Immersion', desc: 'Mobilization of students for second semester projects in Naic.', dept: 'All' },
                                { date: '2025-03-08', title: 'CWTS Livelihood Eco-Crafting & Recycling Initiative', desc: 'Workshop on community organic composting and eco-crafts.', dept: 'CWTS' },
                                { date: '2025-03-22', title: 'LTS Mini-Library Handover & Literacy Graduation', desc: 'Turnover of 300 children storybooks and graduation.', dept: 'LTS' },
                                { date: '2025-04-05', title: 'ROTC Annual Tactical Inspection & Drill Review', desc: 'Annual tactical evaluation by Naval Reserve Command.', dept: 'ROTC' },
                                { date: '2025-04-12', title: 'NSTP Final Culminating Defense & Document Audit', desc: 'Final requirements audit for CHED serial numbers.', dept: 'All' },
                                { date: '2025-04-26', title: 'NSTP Graduation & Ceremonial Pass-in-Review', desc: 'Formal graduation pass-in-review and certificate awarding ceremony.', dept: 'All' },
                              ]);
                      return events.map((ev, i) => (
                        <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-200 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-xs font-black text-emerald-950">{ev.title}</span>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                ev.dept === 'CWTS' ? 'bg-green-100 text-green-800' :
                                ev.dept === 'LTS' ? 'bg-purple-100 text-purple-800' :
                                ev.dept === 'ROTC' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>{ev.dept}</span>
                            </div>
                            <p className="text-[11px] text-gray-600 mb-1.5">{ev.desc}</p>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md inline-block w-fit">
                            📅 {ev.date}
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Letter Formats Section */}
                <div>
                  <h4 className="text-md font-semibold text-green-800 mb-3 border-b pb-2 flex items-center justify-between">
                    <span className="flex items-center">
                      <FileCheck className="w-5 h-5 mr-2" />
                      Official Letter Formats &amp; Attachments
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowArchiveDetails(false);
                        navigate('/letter-formats');
                      }}
                      className="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open Letter Formats Page &rarr;</span>
                    </button>
                  </h4>
                  {archiveViewData.letterData && archiveViewData.letterData.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {archiveViewData.letterData.map((letter, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-xl p-3.5 border border-gray-200 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span className="text-xs font-bold text-gray-800 truncate">{letter.title}</span>
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                                {letter.department || 'All'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2 mb-2">{letter.description}</p>
                          </div>
                          <div className="flex items-center justify-between text-[11px] bg-white p-2 rounded-lg border border-gray-100 mt-1">
                            <span className="truncate max-w-[140px] font-medium text-gray-700">{letter.file?.name || `${letter.title}.doc`}</span>
                            <button
                              type="button"
                              onClick={() => downloadOfficialLetter(letter, archiveViewData.year)}
                              className="px-2.5 py-1 text-[11px] font-black bg-emerald-800 hover:bg-emerald-700 text-amber-300 rounded-lg transition-all shadow-2xs cursor-pointer flex items-center gap-1 shrink-0 active:scale-95"
                            >
                              <Download className="w-3 h-3 text-amber-300" />
                              <span>Download</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No letter format records saved in this archive batch</p>
                  )}
                </div>

                {/* Archive Metadata */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Archive Information</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="font-medium">Batch Year:</span> {archiveViewData.year}</p>
                    <p><span className="font-medium">Total Reports:</span> {archiveViewData.reports || 0}</p>
                    <p><span className="font-medium">Archived Date:</span> {archiveViewData.archivedAt ? new Date(archiveViewData.archivedAt).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="sticky bottom-0 bg-white p-4 border-t flex flex-wrap gap-2 justify-between items-center">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowArchiveDetails(false);
                      navigate('/admin/students');
                    }}
                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    👥 Students
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowArchiveDetails(false);
                      navigate('/reports');
                    }}
                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    📑 Reports
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowArchiveDetails(false);
                      navigate('/calendar');
                    }}
                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    📅 Calendar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowArchiveDetails(false);
                      navigate('/letter-formats');
                    }}
                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    ✉️ Letter Formats
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowArchiveDetails(false)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowArchiveDetails(false);
                      handleBackToCurrent();
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 text-xs font-black rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Back to Current</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      {/* Instructor List Modal */}
      {showInstructorList && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowInstructorList(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Instructors & Admin
              </h3>
              <button type="button" onClick={() => setShowInstructorList(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {allUsers.filter(u => u.role === 'instructor' || u.role === 'admin').length === 0 ? (
                <p className="text-center text-gray-500 py-8">No users found.</p>
              ) : (
                allUsers.filter(u => u.role === 'instructor' || u.role === 'admin').map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-green-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border border-emerald-600/30 shadow-xs shrink-0">
                        <img
                          src={getAvatarSrc(u.avatar, u.profilePicture)}
                          alt={u.name || 'User'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.role === 'admin' ? 'Admin' : `${u.department} Instructor`}</p>
                      </div>
                    </div>
                    {u.role === 'instructor' && (
                      <button
                        type="button"
                        onClick={() => { setShowInstructorList(false); navigate('/chat'); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Message
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

        {/* Admin Enrollment Timed Schedule Modal */}
        {/* Enrollment Schedule Settings Modal */}
        {scheduleModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-fade-in" onClick={() => setScheduleModalOpen(false)}>
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-[92%] sm:w-full overflow-hidden border border-gray-200 flex flex-col my-auto max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
              <div className="bg-emerald-900 text-white p-3.5 sm:p-4 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-200 shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold tracking-tight">Enrollment Schedule Settings</h3>
                    <p className="text-emerald-200 text-[10px] sm:text-xs">Configure portal dates and student announcement</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-emerald-800/80 hover:bg-emerald-700 flex items-center justify-center text-emerald-200 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-3.5 sm:p-5 space-y-3.5 overflow-y-auto max-h-[62vh]">
                {/* Current Live Status Banner */}
                <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                  scheduleStatus.isOpen 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${scheduleStatus.isOpen ? 'bg-emerald-600 animate-ping' : 'bg-rose-600'}`}></span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider">{scheduleStatus.headline}</p>
                      <p className="text-[11px] font-normal text-gray-600 mt-0.5">{scheduleStatus.subtext}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-white rounded-md border text-gray-700 shrink-0">
                    Enrollment Schedule
                  </span>
                </div>

                {/* Academic Year & Semester */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="schedule-academic-year" className="block text-[11px] font-bold text-gray-700 mb-1">
                      Academic Year
                    </label>
                    <input
                      type="text"
                      id="schedule-academic-year"
                      name="academicYear"
                      value={scheduleConfig.academicYear || ''}
                      onChange={(e) => setScheduleConfig(prev => ({ ...prev, academicYear: e.target.value }))}
                      placeholder="e.g. 2026-2027"
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label htmlFor="schedule-semester" className="block text-[11px] font-bold text-gray-700 mb-1">
                      Semester
                    </label>
                    <select
                      id="schedule-semester"
                      name="semester"
                      value={scheduleConfig.semester || '1st Semester'}
                      onChange={(e) => setScheduleConfig(prev => ({ ...prev, semester: e.target.value }))}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none bg-white font-medium"
                    >
                      <option value="1st Semester">1st Semester</option>
                      <option value="2nd Semester">2nd Semester</option>
                      <option value="Summer">Summer</option>
                    </select>
                  </div>
                </div>

                {/* Opening Date & Time */}
                <div>
                  <label htmlFor="schedule-open-at" className="block text-[11px] font-bold text-gray-700 mb-1">
                    Opening Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    id="schedule-open-at"
                    name="openAt"
                    value={scheduleConfig.openAt || ''}
                    onChange={(e) => setScheduleConfig(prev => ({ ...prev, openAt: e.target.value }))}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none bg-white font-medium"
                  />
                  <p className="text-[10px] text-gray-500 mt-0.5">Leave empty to open immediately in Auto mode.</p>
                </div>

                {/* Closing Date & Time */}
                <div>
                  <label htmlFor="schedule-close-at" className="block text-[11px] font-bold text-gray-700 mb-1">
                    Closing Date &amp; Time (Deadline)
                  </label>
                  <input
                    type="datetime-local"
                    id="schedule-close-at"
                    name="closeAt"
                    value={scheduleConfig.closeAt || ''}
                    onChange={(e) => setScheduleConfig(prev => ({ ...prev, closeAt: e.target.value }))}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none bg-white font-medium"
                  />
                  <p className="text-[10px] text-gray-500 mt-0.5">Registration closes automatically when this deadline is reached.</p>
                </div>

                {/* Announcement Notice */}
                <div>
                  <label htmlFor="schedule-custom-notice" className="block text-[11px] font-bold text-gray-700 mb-1">
                    Public Notice to Applicants
                  </label>
                  <input
                    type="text"
                    id="schedule-custom-notice"
                    name="customNotice"
                    value={scheduleConfig.customNotice || ''}
                    onChange={(e) => setScheduleConfig(prev => ({ ...prev, customNotice: e.target.value }))}
                    placeholder="e.g. Online Enrollment for Academic Year 2026-2027 is now open."
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none bg-white font-medium"
                  />
                </div>

                {/* Live Student Preview */}
                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                    Applicant View Preview
                  </span>
                  <div className="bg-emerald-900 text-white p-2.5 rounded-lg text-xs">
                    <p className="font-semibold text-emerald-100">
                      {scheduleConfig.customNotice || 'Online Enrollment is open.'}
                    </p>
                    <p className="text-[10px] text-emerald-300 mt-0.5">
                      Academic Year: {scheduleConfig.academicYear || '2026-2027'} ({scheduleConfig.semester || '1st Semester'})
                      {scheduleConfig.closeAt && ` • Deadline: ${new Date(scheduleConfig.closeAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2 shrink-0">
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setScheduleModalOpen(false)}
                    className="px-3.5 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleSaveSchedule(scheduleConfig);
                      setScheduleModalOpen(false);
                    }}
                    className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default AdminDashboard;

