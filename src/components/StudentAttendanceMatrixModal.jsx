import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { X, Search, FileSpreadsheet, UserX, CheckCircle, Clock, AlertTriangle, Users, Download } from 'lucide-react';
import { attendanceAPI } from '../services/api';
import { formatGradeAndSection } from '../utils/gradeSection';

const TOTAL_NSTP_DAYS = 15;
const DAYS_ARRAY = Array.from({ length: TOTAL_NSTP_DAYS }, (_, i) => `Day ${i + 1}`);

export function StudentAttendanceMatrixModal({ isOpen, onClose, students = [], currentUser }) {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState(currentUser?.role === 'admin' ? 'All' : (currentUser?.department || 'CWTS'));
  const [viewFilter, setViewFilter] = useState('all'); // 'all' | 'at-risk' (3+ absences) | 'perfect' (100%)

  useEffect(() => {
    if (!isOpen) return;
    let isSubscribed = true;

    async function loadRecords() {
      try {
        setLoading(true);
        const records = await attendanceAPI.getRecords({ limit: 1000 });
        if (isSubscribed) {
          setAttendanceRecords(Array.isArray(records) ? records : []);
        }
      } catch (err) {
        console.error('Failed to fetch attendance history:', err);
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    }

    loadRecords();

    const handleUpdate = () => {
      loadRecords();
    };
    window.addEventListener('nstp_attendance_updated', handleUpdate);

    return () => {
      isSubscribed = false;
      window.removeEventListener('nstp_attendance_updated', handleUpdate);
    };
  }, [isOpen]);

  // Identify the highest/maximum Day conducted so far (e.g. if Day 8 was conducted, maxDay is 8)
  const maxDayConducted = useMemo(() => {
    let max = 0;
    attendanceRecords.forEach(r => {
      const act = (r.activity_name || '').toLowerCase();
      DAYS_ARRAY.forEach((d, idx) => {
        if (act.includes(d.toLowerCase())) {
          if (idx + 1 > max) max = idx + 1;
        }
      });
    });
    return max;
  }, [attendanceRecords]);

  // Build the Day 1 - Day 15 Matrix per student
  const studentMatrixList = useMemo(() => {
    // Filter active students based on department
    let targetStudents = students.filter(s => !s.status || s.status === 'Active');
    
    if (selectedDept !== 'All') {
      targetStudents = targetStudents.filter(s => s.department === selectedDept);
    }

    const totalConducted = maxDayConducted;

    return targetStudents.map((st) => {
      const stId = String(st.studentId || st.id || '').trim();
      const stRecords = attendanceRecords.filter(r => {
        const rId = String(r.student_id || '').trim();
        return rId === stId || (st.studentId && rId === String(st.studentId).trim());
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
        const matchingRecords = stRecords.filter(r => (r.activity_name || '').toLowerCase().includes(dayStr.toLowerCase()));
        
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
  }, [students, attendanceRecords, selectedDept, maxDayConducted]);

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

  // Export Master Attendance Matrix to Excel (.xlsx)
  const handleExportMasterExcel = () => {
    if (studentMatrixList.length === 0) return;

    const exportRows = [
      ['CAVITE STATE UNIVERSITY - NAIC CAMPUS'],
      ['NATIONAL SERVICE TRAINING PROGRAM (NSTP)'],
      [`OFFICIAL MASTER ATTENDANCE LEDGER (DAY 1 TO DAY 15) - ${selectedDept} DEPARTMENT`],
      [`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`],
      [],
      [
        'No.',
        'Student ID',
        'Full Legal Name',
        'Department',
        'Grade & Section',
        ...DAYS_ARRAY,
        'Total Present',
        'Total Absences',
        'Attendance Rate',
        'Academic Status'
      ]
    ];

    studentMatrixList.forEach((st, idx) => {
      const name = (st.name || `${st.lastName || ''}, ${st.firstName || ''}`).toUpperCase();
      const row = [
        idx + 1,
        st.studentId || 'N/A',
        name,
        st.department || selectedDept,
        st.gradeAndSection,
        ...DAYS_ARRAY.map(d => {
          const s = st.dayStatuses[d];
          if (s === 'Present') return 'PRESENT';
          if (s === 'Late') return 'LATE';
          if (s === 'Excused') return 'EXCUSED';
          if (s === 'Absent') return 'ABSENT';
          return '-';
        }),
        st.presentCount,
        st.absentCount,
        `${st.rate}%`,
        st.isAtRisk ? 'WARNING (AT-RISK / 3+ ABSENCES)' : (st.absentCount === 0 ? 'GOOD STANDING' : `${st.absentCount} ABSENCES`)
      ];
      exportRows.push(row);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(exportRows);

    // Apply column widths
    ws['!cols'] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 28 },
      { wch: 12 },
      { wch: 14 },
      ...DAYS_ARRAY.map(() => ({ wch: 8 })),
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 30 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Attendance Matrix');
    const fileName = `NSTP_Master_Attendance_Matrix_${selectedDept}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none">
      <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black shadow-md">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black leading-tight">Student Attendance &amp; Absences Tracker</h3>
              <p className="text-xs text-emerald-200 font-medium">Monitor cadet attendance across Day 1 to Day 15, track absences, and identify at-risk students</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-black transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Analytics Cards */}
        <div className="grid grid-cols-3 gap-2 p-3 sm:p-4 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Total Enrolled</p>
              <p className="text-lg font-black text-slate-900">{totalStudents}</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-black">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div 
            onClick={() => setViewFilter(viewFilter === 'at-risk' ? 'all' : 'at-risk')}
            className={`bg-white p-3 rounded-2xl border shadow-2xs flex items-center justify-between cursor-pointer transition-all ${
              viewFilter === 'at-risk' ? 'border-rose-500 bg-rose-50/40 ring-2 ring-rose-500/20' : 'border-rose-200 hover:border-rose-400'
            }`}
          >
            <div>
              <p className="text-[10px] font-bold text-rose-700 uppercase flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                <span>At-Risk (3+ Absences)</span>
              </p>
              <p className="text-lg font-black text-rose-700">{atRiskCount} <span className="text-[10px] text-slate-500 font-normal">students</span></p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-black">
              <UserX className="w-4 h-4" />
            </div>
          </div>

          <div 
            onClick={() => setViewFilter(viewFilter === 'perfect' ? 'all' : 'perfect')}
            className={`bg-white p-3 rounded-2xl border shadow-2xs flex items-center justify-between cursor-pointer transition-all ${
              viewFilter === 'perfect' ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20' : 'border-emerald-200 hover:border-emerald-400'
            }`}
          >
            <div>
              <p className="text-[10px] font-bold text-emerald-800 uppercase flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-600" />
                <span>100% Attendance</span>
              </p>
              <p className="text-lg font-black text-emerald-900">{perfectCount} <span className="text-[10px] text-slate-500 font-normal">students</span></p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Toolbar & Filters (Section select removed as requested) */}
        <div className="p-3 sm:p-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {/* Search */}
            <div className="relative min-w-[180px] flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cadet name, student ID..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            {/* Department Filter (For Admin) */}
            {currentUser?.role === 'admin' && (
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="All">All Departments</option>
                <option value="CWTS">CWTS</option>
                <option value="ROTC">ROTC</option>
                <option value="LTS">LTS</option>
              </select>
            )}

            {/* View Filter Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewFilter('all')}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                  viewFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Students
              </button>
              <button
                type="button"
                onClick={() => setViewFilter('at-risk')}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                  viewFilter === 'at-risk' ? 'bg-rose-700 text-white shadow-xs' : 'text-rose-700 hover:bg-rose-50'
                }`}
              >
                <span>⚠️ Most Absences</span>
                <span className="bg-rose-900/30 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">{atRiskCount}</span>
              </button>
            </div>
          </div>

          {/* Export Master Excel */}
          <button
            type="button"
            onClick={handleExportMasterExcel}
            disabled={studentMatrixList.length === 0}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>Export Master Excel</span>
          </button>
        </div>

        {/* Attendance Matrix Table */}
        <div className="overflow-x-auto flex-1 p-4 bg-slate-50">
          {loading ? (
            <div className="p-16 text-center text-slate-500 font-bold">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Loading attendance matrix...
            </div>
          ) : filteredMatrix.length === 0 ? (
            <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 font-medium">
              No students found matching current filters.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-emerald-950 text-white font-black text-[11px] uppercase tracking-wider">
                    <th className="p-2.5 border-b border-emerald-800">Student No. &amp; Name</th>
                    <th className="p-2.5 border-b border-emerald-800 text-center">Grade &amp; Sec</th>
                    {DAYS_ARRAY.map((day) => (
                      <th key={day} className="p-1.5 border-b border-emerald-800 text-center text-[10px] font-mono whitespace-nowrap">
                        {day.replace('Day ', 'D')}
                      </th>
                    ))}
                    <th className="p-2.5 border-b border-emerald-800 text-center">Present</th>
                    <th className="p-2.5 border-b border-emerald-800 text-center">Absences</th>
                    <th className="p-2.5 border-b border-emerald-800 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredMatrix.map((st) => {
                    const isWarning = st.isAtRisk;
                    return (
                      <tr 
                        key={st.id} 
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isWarning ? 'bg-rose-50/30' : ''
                        }`}
                      >
                        {/* Student Details */}
                        <td className="p-2.5">
                          <div className="font-black text-slate-900 leading-tight truncate max-w-[200px]">
                            {st.name || `${st.firstName || ''} ${st.lastName || ''}`}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                            <span>{st.studentId || 'N/A'}</span>
                            <span>•</span>
                            <span className="font-bold text-emerald-800">{st.department}</span>
                          </div>
                        </td>

                        {/* Grade & Section */}
                        <td className="p-2.5 text-center font-mono font-bold text-slate-800 whitespace-nowrap">
                          {st.gradeAndSection}
                        </td>

                        {/* Day 1 to Day 15 Badges */}
                        {DAYS_ARRAY.map((day) => {
                          const status = st.dayStatuses[day];
                          if (status === 'Present') {
                            return (
                              <td key={day} className="p-1 text-center">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 font-black text-[9px]" title={`${day}: Present`}>
                                  P
                                </span>
                              </td>
                            );
                          } else if (status === 'Late') {
                            return (
                              <td key={day} className="p-1 text-center">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-amber-100 text-amber-800 font-black text-[9px]" title={`${day}: Late`}>
                                  L
                                </span>
                              </td>
                            );
                          } else if (status === 'Excused') {
                            return (
                              <td key={day} className="p-1 text-center">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-blue-100 text-blue-800 font-black text-[9px]" title={`${day}: Excused`}>
                                  E
                                </span>
                              </td>
                            );
                          } else if (status === 'Incomplete') {
                            return (
                              <td key={day} className="p-1 text-center">
                                <span className="inline-flex items-center justify-center px-1 h-5 rounded-md bg-amber-100 text-amber-900 font-black text-[8px]" title={`${day}: Incomplete (Timed In only, did not Time Out)`}>
                                  INC
                                </span>
                              </td>
                            );
                          } else if (status === 'Absent') {
                            return (
                              <td key={day} className="p-1 text-center">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-rose-100 text-rose-700 font-black text-[9px]" title={`${day}: Absent`}>
                                  A
                                </span>
                              </td>
                            );
                          } else {
                            return (
                              <td key={day} className="p-1 text-center">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-md text-slate-300 font-bold text-[10px]" title={`${day}: Not Recorded Yet`}>
                                  •
                                </span>
                              </td>
                            );
                          }
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
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black uppercase">
                              <AlertTriangle className="w-3 h-3 text-rose-600" /> 3+ Absences
                            </span>
                          ) : st.absentCount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase">
                              {st.absentCount} Absence{st.absentCount > 1 ? 's' : ''}
                            </span>
                          ) : st.presentCount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                              <CheckCircle className="w-3 h-3 text-emerald-600" /> Good Standing
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
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

      </div>
    </div>
  );
}

export default StudentAttendanceMatrixModal;
