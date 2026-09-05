import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, FileSpreadsheet, UserX, CheckCircle, Clock, AlertTriangle, Users, Download, Edit3, Trash2, Check, ShieldCheck, HelpCircle } from 'lucide-react';
import { attendanceAPI, studentsAPI } from '../services/api';
import { formatGradeAndSection } from '../utils/gradeSection';
import { downloadAttendanceMatrixPdf } from '../utils/chedPdfGenerator';
import { downloadAttendanceMatrixExcel } from '../utils/chedExportGenerator';
import { useAuth } from '../context/AuthContext';

const TOTAL_NSTP_DAYS = 15;
const DAYS_ARRAY = Array.from({ length: TOTAL_NSTP_DAYS }, (_, i) => `Day ${i + 1}`);

export function StudentAttendanceMatrixModal({ 
  isOpen, 
  onClose, 
  students: propStudents = [], 
  currentUser: propUser,
  currentDepartment 
}) {
  const { showToast, students: authStudents = [], user: authUser } = useAuth() || {};
  const currentUser = propUser || authUser;

  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [fetchedStudents, setFetchedStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const initialDept = useMemo(() => {
    if (currentUser?.role === 'admin' || currentUser?.department === 'NSTP Office') return 'All';
    if (currentDepartment && currentDepartment !== 'All' && currentDepartment !== 'NSTP Office') return currentDepartment;
    if (currentUser?.department && ['CWTS', 'ROTC', 'LTS'].includes(currentUser.department)) return currentUser.department;
    return 'All';
  }, [currentDepartment, currentUser]);

  const [selectedDept, setSelectedDept] = useState(initialDept);

  useEffect(() => {
    if (initialDept) {
      setSelectedDept(initialDept);
    }
  }, [initialDept]);

  const [viewFilter, setViewFilter] = useState('all'); // 'all' | 'at-risk' (3+ absences) | 'perfect' (100%)

  // Cell Edit Modal state for overriding attendance or deleting absences
  const [editingCell, setEditingCell] = useState(null); // { student, dayStr, currentStatus, notes }
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let isSubscribed = true;

    async function loadData() {
      try {
        setLoading(true);

        const [records, stList] = await Promise.all([
          attendanceAPI.getRecords({ limit: 1000 }).catch(() => []),
          (!propStudents || propStudents.length === 0) 
            ? studentsAPI.getAll().catch(() => []) 
            : Promise.resolve(propStudents)
        ]);

        if (isSubscribed) {
          setAttendanceRecords(Array.isArray(records) ? records : []);
          if (Array.isArray(stList) && stList.length > 0) {
            setFetchedStudents(stList);
            try { localStorage.setItem('nstp_cached_students', JSON.stringify(stList)); } catch (_) {}
          }
        }
      } catch (err) {
        console.error('Failed to load matrix data:', err);
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    }

    loadData();

    const handleUpdate = () => {
      loadData();
    };
    window.addEventListener('nstp_attendance_updated', handleUpdate);

    return () => {
      isSubscribed = false;
      window.removeEventListener('nstp_attendance_updated', handleUpdate);
    };
  }, [isOpen, propStudents]);

  // Derive base students from props, context, fetched, or cache
  const baseStudents = useMemo(() => {
    if (propStudents && propStudents.length > 0) return propStudents;
    if (authStudents && authStudents.length > 0) return authStudents;
    if (fetchedStudents && fetchedStudents.length > 0) return fetchedStudents;
    try {
      const cached = JSON.parse(localStorage.getItem('nstp_cached_students') || '[]');
      if (Array.isArray(cached) && cached.length > 0) return cached;
    } catch (_) {}
    return [];
  }, [propStudents, authStudents, fetchedStudents]);

  // Identify the highest/maximum Day conducted so far
  const maxDayConducted = useMemo(() => {
    let max = 0;
    attendanceRecords.forEach(r => {
      const act = (r.activity_name || r.day || '').trim();
      DAYS_ARRAY.forEach((d, idx) => {
        const regex = new RegExp(`(^|[^a-zA-Z0-9])(${d}|${d.replace(' ', '')}|${d.replace('Day ', 'D')})([^a-zA-Z0-9]|$)`, 'i');
        if (regex.test(act)) {
          if (idx + 1 > max) max = idx + 1;
        }
      });
    });
    if (max === 0 && attendanceRecords.length > 0) {
      max = 1;
    }
    return max;
  }, [attendanceRecords]);

  // Build the Day 1 - Day 15 Matrix per student
  const studentMatrixList = useMemo(() => {
    const studentMap = new Map();

    baseStudents.forEach(st => {
      const sid = String(st.studentId || st.id || st.student_id || '').trim();
      if (sid) {
        studentMap.set(sid.toLowerCase(), {
          ...st,
          studentId: st.studentId || st.id || sid
        });
      }
    });

    // Also include any attendees from attendance records who might not be in baseStudents
    attendanceRecords.forEach(rec => {
      const sid = String(rec.student_id || '').trim();
      if (sid && !studentMap.has(sid.toLowerCase())) {
        studentMap.set(sid.toLowerCase(), {
          id: sid,
          studentId: sid,
          name: rec.student_name || rec.student?.name || sid,
          department: rec.department || selectedDept || 'CWTS',
          section: rec.section || '',
          status: 'Active'
        });
      }
    });

    let targetStudents = Array.from(studentMap.values()).filter(s => {
      const st = (s.status || '').toLowerCase().trim();
      return st !== 'inactive' && st !== 'dropped' && st !== 'archived';
    });
    
    if (selectedDept && selectedDept !== 'All' && selectedDept !== 'NSTP Office') {
      const deptFiltered = targetStudents.filter(s => {
        const dept = (s.department || s.component || s.nstp_program || '').toUpperCase().trim();
        return dept === selectedDept.toUpperCase().trim();
      });
      if (deptFiltered.length > 0) {
        targetStudents = deptFiltered;
      }
    }

    const totalConducted = maxDayConducted;

    return targetStudents.map((st) => {
      const stId = String(st.studentId || st.id || st.student_id || '').trim().toLowerCase();
      const stName = (st.name || `${st.firstName || ''} ${st.lastName || ''}`).trim().toLowerCase();

      const stRecords = attendanceRecords.filter(r => {
        const rId = String(r.student_id || '').trim().toLowerCase();
        if (stId && rId && (rId === stId || (st.studentId && rId === String(st.studentId).toLowerCase()))) return true;
        const rName = String(r.student_name || r.student?.name || '').trim().toLowerCase();
        if (stName && rName && stName === rName) return true;
        return false;
      });

      // Map status for each Day 1 - Day 15
      const dayStatuses = {};
      DAYS_ARRAY.forEach((dayStr, idx) => {
        const dayNumber = idx + 1;

        if (totalConducted === 0 || dayNumber > totalConducted) {
          dayStatuses[dayStr] = '-'; // Future / Not yet conducted (NOT an absence)
          return;
        }

        // For past/current conducted days (Day 1 up to maxDayConducted):
        const matchingRecords = stRecords.filter(r => {
          if (r.day && String(r.day).toLowerCase() === dayStr.toLowerCase()) return true;
          const act = (r.activity_name || '').trim();
          const regex = new RegExp(`(^|[^a-zA-Z0-9])(${dayStr}|${dayStr.replace(' ', '')}|${dayStr.replace('Day ', 'D')})([^a-zA-Z0-9]|$)`, 'i');
          return regex.test(act);
        });
        
        if (matchingRecords.length > 0) {
          const hasTimeOut = matchingRecords.some(r => r.scan_type === 'TIME_OUT' || r.status === 'Present');
          const hasTimeIn = matchingRecords.some(r => r.scan_type === 'TIME_IN');
          const isExcused = matchingRecords.some(r => r.status === 'Excused');

          if (isExcused) {
            dayStatuses[dayStr] = 'Excused';
          } else if (hasTimeOut) {
            dayStatuses[dayStr] = 'Present';
          } else if (hasTimeIn) {
            dayStatuses[dayStr] = 'Incomplete'; // Timed in only, did not time out
          } else {
            dayStatuses[dayStr] = 'Absent';
          }
        } else {
          // If past day was conducted but student has NO record for this day, they are automatically ABSENT
          dayStatuses[dayStr] = 'Absent';
        }
      });

      const presentCount = Object.values(dayStatuses).filter(st => st === 'Present' || st === 'Late').length;
      const absentCount = Object.values(dayStatuses).filter(st => st === 'Absent' || st === 'Incomplete').length;
      const rate = totalConducted > 0 ? Math.round((presentCount / totalConducted) * 100) : 100;
      const isAtRisk = absentCount >= 3;

      return {
        ...st,
        gradeAndSection: formatGradeAndSection(st),
        dayStatuses,
        presentCount,
        absentCount,
        rate,
        isAtRisk,
        totalConducted
      };
    });
  }, [baseStudents, attendanceRecords, selectedDept, maxDayConducted]);

  // Apply search and viewFilter (All vs At-Risk)
  const filteredMatrix = useMemo(() => {
    return studentMatrixList
      .filter((st) => {
        if (viewFilter === 'at-risk' && !st.isAtRisk) return false;
        if (viewFilter === 'perfect' && st.absentCount > 0) return false;

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        const name = (st.name || `${st.firstName || ''} ${st.lastName || ''}`).toLowerCase();
        const id = (st.studentId || '').toLowerCase();
        const sec = (st.section || '').toLowerCase();
        return name.includes(q) || id.includes(q) || sec.includes(q);
      })
      .sort((a, b) => {
        if (viewFilter === 'at-risk') {
          return b.absentCount - a.absentCount; // Sort by most absences first
        }
        return (a.name || '').localeCompare(b.name || '');
      });
  }, [studentMatrixList, viewFilter, searchQuery]);

  // Quick statistics
  const totalStudents = studentMatrixList.length;
  const atRiskCount = studentMatrixList.filter(s => s.isAtRisk).length;
  const perfectCount = studentMatrixList.filter(s => s.absentCount === 0).length;

  // Handle cell click to open edit / delete absence modal
  const handleCellClick = (student, dayStr) => {
    const currentStatus = student.dayStatuses[dayStr] || '-';
    setEditingCell({
      student,
      dayStr,
      newStatus: currentStatus === '-' ? 'Present' : currentStatus,
      currentStatus,
      notes: ''
    });
  };

  // Save manual attendance status override or delete absence
  const handleSaveCellEdit = async (actionStatus = null) => {
    if (!editingCell) return;
    const finalStatus = actionStatus || editingCell.newStatus;
    const { student, dayStr, notes } = editingCell;
    const sid = student.studentId || student.id;
    const actName = `${dayStr} - NSTP Session`;

    try {
      setSavingEdit(true);

      // 1. Update backend
      await attendanceAPI.overrideRecord({
        student_id: sid,
        activity_name: actName,
        status: finalStatus,
        notes: notes || `Manual override by ${currentUser?.name || 'Instructor'}`
      });

      // 2. Update local storage cache
      const cached = JSON.parse(localStorage.getItem('nstp_cached_attendance_records') || '[]');
      const filtered = cached.filter(r => !(
        String(r.student_id) === String(sid) && (r.activity_name || '').toLowerCase().includes(dayStr.toLowerCase())
      ));

      if (finalStatus && finalStatus !== 'Clear' && finalStatus !== '-') {
        filtered.push({
          id: Date.now() + Math.random(),
          student_id: sid,
          student_name: student.name || `${student.firstName || ''} ${student.lastName || ''}`,
          department: student.department || currentUser?.department || 'CWTS',
          section: student.section || '',
          activity_name: actName,
          scan_type: finalStatus === 'Present' ? 'TIME_OUT' : 'TIME_IN',
          scanned_at: new Date().toISOString(),
          status: finalStatus,
          notes: notes || 'Manual edit'
        });
      }

      localStorage.setItem('nstp_cached_attendance_records', JSON.stringify(filtered));
      setAttendanceRecords(filtered);
      window.dispatchEvent(new CustomEvent('nstp_attendance_updated'));
      showToast('Attendance status updated successfully!', 'success');

      setEditingCell(null);
    } catch (err) {
      console.error('Failed to update attendance cell:', err);
      showToast('Error updating attendance record. Please try again.', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  // Export Master Attendance Matrix to PDF (.pdf)
  const handleExportMasterPdf = async () => {
    if (studentMatrixList.length === 0) return;
    try {
      await downloadAttendanceMatrixPdf({
        studentMatrixList,
        selectedDept,
        daysArray: DAYS_ARRAY
      });
    } catch (err) {
      console.error('Failed to export master attendance PDF:', err);
      showToast('Failed to export attendance PDF. Please try again.', 'error');
    }
  };

  // Export Master Attendance Matrix to Excel (.xlsx)
  const handleExportMasterExcel = async () => {
    if (studentMatrixList.length === 0) return;
    try {
      await downloadAttendanceMatrixExcel({
        studentMatrixList,
        daysArray: DAYS_ARRAY,
        selectedDept
      });
    } catch (err) {
      console.error('Failed to export master attendance Excel:', err);
      showToast('Failed to export attendance Excel. Please try again.', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-1.5 sm:p-4 select-none">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-6xl w-full max-h-[96vh] sm:max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-slide-up relative">
        
        {/* Header */}
        <div className="p-3 sm:p-6 bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black shadow-md shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-lg font-black leading-tight truncate">Student Attendance &amp; Absences Tracker</h3>
              <p className="text-[10px] sm:text-xs text-emerald-200 font-medium truncate">Click any day cell (D1-D15) to edit attendance or delete absences</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs sm:text-sm font-black transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Analytics Cards */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 p-2 sm:p-4 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="bg-white p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between min-w-0">
            <div className="min-w-0">
              <p className="text-[8.5px] sm:text-[10px] font-bold text-slate-500 uppercase truncate">Enrolled</p>
              <p className="text-sm sm:text-lg font-black text-slate-900 leading-tight">{totalStudents}</p>
            </div>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-black shrink-0">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>

          <div 
            onClick={() => setViewFilter(viewFilter === 'at-risk' ? 'all' : 'at-risk')}
            className={`bg-white p-2 sm:p-3 rounded-xl sm:rounded-2xl border shadow-2xs flex items-center justify-between cursor-pointer transition-all min-w-0 ${
              viewFilter === 'at-risk' ? 'border-rose-500 bg-rose-50/40 ring-2 ring-rose-500/20' : 'border-rose-200 hover:border-rose-400'
            }`}
          >
            <div className="min-w-0">
              <p className="text-[8.5px] sm:text-[10px] font-bold text-rose-700 uppercase flex items-center gap-0.5 truncate">
                <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-rose-600 shrink-0" />
                <span className="truncate">At-Risk</span>
              </p>
              <p className="text-sm sm:text-lg font-black text-rose-700 leading-tight">{atRiskCount} <span className="text-[9px] text-slate-500 font-normal hidden xs:inline">students</span></p>
            </div>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-black shrink-0">
              <UserX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>

          <div 
            onClick={() => setViewFilter(viewFilter === 'perfect' ? 'all' : 'perfect')}
            className={`bg-white p-2 sm:p-3 rounded-xl sm:rounded-2xl border shadow-2xs flex items-center justify-between cursor-pointer transition-all min-w-0 ${
              viewFilter === 'perfect' ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20' : 'border-emerald-200 hover:border-emerald-400'
            }`}
          >
            <div className="min-w-0">
              <p className="text-[8.5px] sm:text-[10px] font-bold text-emerald-800 uppercase flex items-center gap-0.5 truncate">
                <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600 shrink-0" />
                <span className="truncate">100%</span>
              </p>
              <p className="text-sm sm:text-lg font-black text-emerald-900 leading-tight">{perfectCount} <span className="text-[9px] text-slate-500 font-normal hidden xs:inline">students</span></p>
            </div>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black shrink-0">
              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="p-2 sm:p-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-xs">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap flex-1 min-w-0">
            {/* Search */}
            <div className="relative min-w-[140px] flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                id="attendance-matrix-search"
                name="matrixSearch"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student..."
                className="w-full pl-8 pr-2.5 py-1.5 sm:py-2 bg-slate-50 rounded-lg sm:rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            {/* Department Filter (All Tracks, CWTS, ROTC, LTS) */}
            <select
              id="attendance-matrix-dept"
              name="matrixDept"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-50 rounded-lg sm:rounded-xl border border-slate-200 font-bold text-slate-700 text-xs focus:outline-none cursor-pointer shadow-2xs"
            >
              <option value="All">All Tracks</option>
              <option value="CWTS">CWTS</option>
              <option value="ROTC">ROTC</option>
              <option value="LTS">LTS</option>
            </select>

            {/* View Filter Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 sm:p-1 rounded-lg sm:rounded-xl">
              <button
                type="button"
                onClick={() => setViewFilter('all')}
                className={`px-2 sm:px-3 py-1 rounded-md sm:rounded-lg font-bold text-[10.5px] sm:text-xs transition-colors cursor-pointer ${
                  viewFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setViewFilter('at-risk')}
                className={`px-2 sm:px-3 py-1 rounded-md sm:rounded-lg font-bold text-[10.5px] sm:text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                  viewFilter === 'at-risk' ? 'bg-rose-700 text-white shadow-xs' : 'text-rose-700 hover:bg-rose-50'
                }`}
              >
                <span>⚠️ Absences</span>
                <span className="bg-rose-900/30 text-white text-[9px] px-1 py-0.2 rounded-full font-black">{atRiskCount}</span>
              </button>
            </div>
          </div>

          {/* Export Master PDF & Excel */}
          <div className="flex items-center gap-1 bg-emerald-50 p-0.5 sm:p-1 rounded-lg sm:rounded-xl border border-emerald-300">
            <button
              type="button"
              onClick={handleExportMasterPdf}
              disabled={studentMatrixList.length === 0}
              className="px-2.5 sm:px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-[10.5px] sm:text-xs rounded-md sm:rounded-lg shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
              title="Export Master Ledger as PDF"
            >
              <Download className="w-3.5 h-3.5 text-emerald-200" />
              <span>PDF (.pdf)</span>
            </button>
            <button
              type="button"
              onClick={handleExportMasterExcel}
              disabled={studentMatrixList.length === 0}
              className="px-2.5 sm:px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-900 font-bold text-[10.5px] sm:text-xs rounded-md sm:rounded-lg shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 border border-emerald-200"
              title="Export Master Ledger as Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Attendance Matrix Table */}
        <div className="flex-1 p-2 sm:p-4 bg-slate-50 overflow-hidden flex flex-col">
          {/* Visual Legend Bar */}
          <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 mb-2 flex items-center justify-between flex-wrap gap-2 text-[10px] sm:text-[11px] font-bold text-slate-600 shrink-0 shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-500 font-black uppercase tracking-wider text-[9px]">
              <span>Matrix Legend:</span>
            </div>
            <div className="flex items-center gap-2.5 sm:gap-4 flex-wrap">
              <div className="flex items-center gap-1">
                <span className="w-5 h-5 rounded-md bg-emerald-100 border border-emerald-300 text-emerald-800 font-black flex items-center justify-center text-[9px]">P</span>
                <span className="text-slate-700">Present</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-5 h-5 rounded-md bg-rose-100 border border-rose-300 text-rose-700 font-black flex items-center justify-center text-[9px]">A</span>
                <span className="text-slate-700">Absent</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="px-1 h-5 rounded-md bg-amber-100 border border-amber-300 text-amber-900 font-black flex items-center justify-center text-[8px]">INC</span>
                <span className="text-slate-700">Incomplete (Time-in only)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-5 h-5 rounded-md bg-blue-100 border border-blue-300 text-blue-800 font-black flex items-center justify-center text-[9px]">E</span>
                <span className="text-slate-700">Excused</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-5 h-5 rounded-md bg-amber-100 border border-amber-300 text-amber-800 font-black flex items-center justify-center text-[9px]">L</span>
                <span className="text-slate-700">Late</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-5 h-5 rounded-md bg-slate-100 border border-slate-200 text-slate-400 font-black flex items-center justify-center text-[10px]">•</span>
                <span className="text-slate-400">Scheduled</span>
              </div>
            </div>
          </div>

          {/* Mobile Swipe Hint */}
          <div className="sm:hidden bg-emerald-900/10 text-emerald-950 font-bold text-[10px] py-1 px-2.5 mb-2 rounded-lg flex items-center justify-between shrink-0">
            <span>👉 Swipe horizontally to view Days 1-15</span>
            <span className="font-mono font-black text-emerald-800">15 Days</span>
          </div>

          {loading ? (
            <div className="p-16 text-center text-slate-500 font-bold">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Loading attendance matrix...
            </div>
          ) : filteredMatrix.length === 0 ? (
            <div className="p-10 sm:p-14 text-center bg-white rounded-2xl border border-slate-200 text-slate-600 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-2xs">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="font-black text-slate-800 text-sm sm:text-base">No students found matching current filters</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {searchQuery 
                    ? `No students matching "${searchQuery}".` 
                    : viewFilter !== 'all' 
                      ? `Currently filtering by "${viewFilter}". Try clicking "All" to view all students.` 
                      : selectedDept !== 'All' 
                        ? `No students found in "${selectedDept}". Try selecting "All Tracks".` 
                        : 'No student records available.'}
                </p>
              </div>
              {(searchQuery || viewFilter !== 'all' || selectedDept !== 'All') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setViewFilter('all');
                    setSelectedDept('All');
                  }}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
                >
                  <span>Show All Students (Reset Filters)</span>
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs overflow-x-auto overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse text-xs min-w-[760px] sm:min-w-[880px]">
                <thead>
                  <tr className="bg-emerald-950 text-white font-black text-[10.5px] sm:text-[11px] uppercase tracking-wider sticky top-0 z-30">
                    <th className="p-2 sm:p-2.5 border-b border-emerald-800 sticky left-0 z-40 bg-emerald-950 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] min-w-[140px] sm:min-w-[200px]">Student No. &amp; Name</th>
                    <th className="p-2 sm:p-2.5 border-b border-emerald-800 text-center">Grade &amp; Sec</th>
                    {DAYS_ARRAY.map((day) => (
                      <th key={day} className="p-1 sm:p-1.5 border-b border-emerald-800 text-center text-[9.5px] sm:text-[10px] font-mono whitespace-nowrap">
                        {day.replace('Day ', 'D')}
                      </th>
                    ))}
                    <th className="p-2 sm:p-2.5 border-b border-emerald-800 text-center">Present</th>
                    <th className="p-2 sm:p-2.5 border-b border-emerald-800 text-center">Absences</th>
                    <th className="p-2 sm:p-2.5 border-b border-emerald-800 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredMatrix.map((st) => {
                    const isWarning = st.isAtRisk;
                    return (
                      <tr 
                        key={st.id} 
                        className={`hover:bg-slate-50/80 transition-colors group ${
                          isWarning ? 'bg-rose-50/30' : ''
                        }`}
                      >
                        {/* Student Details - Sticky Left on Horizontal Scroll */}
                        <td className={`p-2 sm:p-2.5 sticky left-0 z-20 ${
                          isWarning ? 'bg-rose-50/95 group-hover:bg-rose-100/90' : 'bg-white group-hover:bg-slate-50'
                        } shadow-[2px_0_5px_-2px_rgba(0,0,0,0.12)] transition-colors`}>
                          <div className="font-black text-slate-900 leading-tight truncate max-w-[140px] sm:max-w-[200px]">
                            {st.name || `${st.firstName || ''} ${st.lastName || ''}`}
                          </div>
                          <div className="text-[9.5px] sm:text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                            <span>{st.studentId || 'N/A'}</span>
                            <span>•</span>
                            <span className="font-bold text-emerald-800">{st.department}</span>
                          </div>
                        </td>

                        {/* Grade & Section */}
                        <td className="p-2 sm:p-2.5 text-center font-mono font-bold text-slate-800 whitespace-nowrap">
                          {st.gradeAndSection}
                        </td>

                        {/* Day 1 to Day 15 Badges (Clickable for Instructor / Admin to Edit or Delete Absence) */}
                        {DAYS_ARRAY.map((day) => {
                          const status = st.dayStatuses[day];
                          return (
                            <td 
                              key={day} 
                              className="p-0.5 sm:p-1 text-center"
                              onClick={() => handleCellClick(st, day)}
                              title={`Click to edit or remove absence for ${day}`}
                            >
                              {status === 'Present' ? (
                                <button
                                  type="button"
                                  className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 text-emerald-800 font-black text-[9px] cursor-pointer hover:ring-2 hover:ring-emerald-400 active:scale-95 transition-all shadow-2xs"
                                >
                                  P
                                </button>
                              ) : status === 'Late' ? (
                                <button
                                  type="button"
                                  className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-800 font-black text-[9px] cursor-pointer hover:ring-2 hover:ring-amber-400 active:scale-95 transition-all shadow-2xs"
                                >
                                  L
                                </button>
                              ) : status === 'Excused' ? (
                                <button
                                  type="button"
                                  className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-blue-100 hover:bg-blue-200 border border-blue-300 text-blue-800 font-black text-[9px] cursor-pointer hover:ring-2 hover:ring-blue-400 active:scale-95 transition-all shadow-2xs"
                                >
                                  E
                                </button>
                              ) : status === 'Incomplete' ? (
                                <button
                                  type="button"
                                  className="inline-flex items-center justify-center px-1 h-5 rounded-md bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 font-black text-[8px] cursor-pointer hover:ring-2 hover:ring-amber-400 active:scale-95 transition-all shadow-2xs"
                                >
                                  INC
                                </button>
                              ) : status === 'Absent' ? (
                                <button
                                  type="button"
                                  className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-rose-100 hover:bg-rose-200 border border-rose-300 text-rose-700 font-black text-[9px] cursor-pointer hover:ring-2 hover:ring-rose-400 active:scale-95 transition-all shadow-2xs"
                                >
                                  A
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="inline-flex items-center justify-center w-5 h-5 rounded-md text-slate-300 hover:text-slate-600 hover:bg-slate-200/60 font-bold text-[10px] cursor-pointer active:scale-95 transition-all"
                                >
                                  •
                                </button>
                              )}
                            </td>
                          );
                        })}

                        {/* Present Count */}
                        <td className="p-2.5 text-center font-black text-emerald-800">
                          {st.presentCount} <span className="text-[10px] text-slate-400 font-normal">/ {st.totalConducted || 15}</span>
                        </td>

                        {/* Absences Count */}
                        <td className="p-2.5 text-center font-black">
                          <span className={`px-2 py-0.5 rounded-full ${
                            isWarning ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-300' : 'text-slate-700'
                          }`}>
                            {st.absentCount}
                          </span>
                        </td>

                        {/* Standing Status Badge */}
                        <td className="p-2.5 text-center whitespace-nowrap">
                          {isWarning ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black uppercase border border-rose-300 shadow-2xs animate-pulse">
                              <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" /> At-Risk ({st.absentCount} Abs)
                            </span>
                          ) : st.absentCount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase border border-amber-300 shadow-2xs">
                              {st.absentCount} Absence{st.absentCount > 1 ? 's' : ''}
                            </span>
                          ) : st.presentCount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase border border-emerald-300 shadow-2xs">
                              <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" /> 100% Perfect
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase border border-slate-200">
                              0 Absences
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Interactive Attendance & Absence Editor Modal ── */}
        {editingCell && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-slide-up flex flex-col gap-4">
              
              {/* Modal Top Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-900 leading-tight">Edit Student Attendance</h4>
                    <p className="text-[11px] text-emerald-700 font-bold">{editingCell.dayStr} • {editingCell.student.department}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingCell(null)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Student Summary */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                <p className="font-black text-slate-900">{editingCell.student.name || `${editingCell.student.firstName || ''} ${editingCell.student.lastName || ''}`}</p>
                <div className="flex items-center gap-2 text-slate-500 font-medium text-[11px] mt-0.5">
                  <span>ID: <b className="text-slate-700">{editingCell.student.studentId || 'N/A'}</b></span>
                  <span>•</span>
                  <span>{editingCell.student.gradeAndSection}</span>
                </div>
              </div>

              {/* Status Selection Buttons */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Select Attendance Status:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveCellEdit('Present')}
                    disabled={savingEdit}
                    className="p-3 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-2xs"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Mark Present (P)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveCellEdit('Excused')}
                    disabled={savingEdit}
                    className="p-3 rounded-xl border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-900 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-2xs"
                  >
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Mark Excused (E)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveCellEdit('Late')}
                    disabled={savingEdit}
                    className="p-3 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-2xs"
                  >
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Mark Late (L)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveCellEdit('Absent')}
                    disabled={savingEdit}
                    className="p-3 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-900 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-2xs"
                  >
                    <UserX className="w-4 h-4 text-rose-600" />
                    <span>Mark Absent (A)</span>
                  </button>
                </div>
              </div>

              {/* Delete / Clear Absence Option */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveCellEdit('Clear')}
                  disabled={savingEdit}
                  className="px-3 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Clear record so this day is unrecorded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Record / Reset (-)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditingCell(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default StudentAttendanceMatrixModal;
