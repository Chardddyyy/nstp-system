import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  X, Search, FileSpreadsheet, CheckCircle, Clock, AlertTriangle,
  Award, Save, Printer, RefreshCw, Check, UserCheck, Filter, Sparkles
} from 'lucide-react';
import { gradesAPI } from '../services/api';

const GRADE_OPTIONS = [
  '',
  '1.00', '1.25', '1.50', '1.75',
  '2.00', '2.25', '2.50', '2.75',
  '3.00', '4.00', '5.00',
  'INC', 'DRP'
];

export default function StudentGradesModal({ isOpen, onClose, students = [], currentUser }) {
  const isAdmin = currentUser?.role === 'admin';
  const defaultDept = isAdmin ? 'All' : (currentUser?.department || 'CWTS');

  const [selectedDept, setSelectedDept] = useState(defaultDept);
  const [selectedSemester, setSelectedSemester] = useState('1st Semester');
  const [selectedSchoolYear, setSelectedSchoolYear] = useState('2025-2026');
  const [selectedNstpSection, setSelectedNstpSection] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [gradesMap, setGradesMap] = useState({}); // key: studentId -> { midterm_grade, final_grade, remarks, isDirty, isSaved }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [batchFillGrade, setBatchFillGrade] = useState('1.75');

  // Load existing grades from backend
  const loadGrades = async () => {
    try {
      setLoading(true);
      const records = await gradesAPI.getAll({
        semester: selectedSemester,
        schoolYear: selectedSchoolYear,
        department: selectedDept !== 'All' ? selectedDept : undefined,
        nstpSection: selectedNstpSection !== 'All' ? selectedNstpSection : undefined
      });

      const nextMap = {};
      if (Array.isArray(records)) {
        records.forEach((r) => {
          const sid = r.studentId || r.student_id;
          if (sid) {
            nextMap[sid] = {
              midterm_grade: r.midterm_grade || '',
              final_grade: r.final_grade || '',
              remarks: r.remarks || '',
              isDirty: false,
              isSaved: true
            };
          }
        });
      }
      setGradesMap(nextMap);
    } catch (err) {
      console.error('Failed to load grades:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadGrades();
    }
  }, [isOpen, selectedSemester, selectedSchoolYear, selectedDept, selectedNstpSection]);

  // Compute remarks automatically based on Final Grade
  const calculateRemarks = (finalGrade) => {
    if (!finalGrade) return '';
    const numeric = parseFloat(finalGrade);
    if (!isNaN(numeric)) {
      if (numeric <= 3.0) return 'Passed';
      if (numeric === 4.0) return 'Conditional';
      return 'Failed';
    }
    const upper = String(finalGrade).toUpperCase().trim();
    if (upper === 'PASSED' || upper === 'P') return 'Passed';
    if (upper === 'INC') return 'Incomplete';
    if (upper === 'DRP') return 'Dropped';
    if (upper === 'FAILED' || upper === 'F') return 'Failed';
    return '';
  };

  const handleGradeChange = (studentId, field, value) => {
    setGradesMap((prev) => {
      const current = prev[studentId] || { midterm_grade: '', final_grade: '', remarks: '' };
      const updated = { ...current, [field]: value, isDirty: true, isSaved: false };

      if (field === 'final_grade') {
        const autoRemarks = calculateRemarks(value);
        if (autoRemarks) {
          updated.remarks = autoRemarks;
        }
      }

      return {
        ...prev,
        [studentId]: updated
      };
    });
  };

  // Filter students based on active selections
  const filteredStudents = useMemo(() => {
    return (students || []).filter((st) => {
      // Status filter: ignore Inactive/Archived if needed, show Active
      if (st.status === 'Archived') return false;

      // Department filter
      if (selectedDept !== 'All' && st.department !== selectedDept) return false;

      // NSTP Section filter
      if (selectedNstpSection !== 'All') {
        const studentNstpSec = (st.nstp_section || '').trim();
        if (studentNstpSec !== selectedNstpSection) return false;
      }

      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (st.name || `${st.lastName || ''} ${st.firstName || ''}`).toLowerCase().includes(q);
        const idMatch = (st.studentId || '').toLowerCase().includes(q);
        const schoolSecMatch = (st.section || '').toLowerCase().includes(q);
        const nstpSecMatch = (st.nstp_section || '').toLowerCase().includes(q);
        if (!nameMatch && !idMatch && !schoolSecMatch && !nstpSecMatch) return false;
      }

      return true;
    }).sort((a, b) => {
      const nameA = (a.lastName || a.name || '').toLowerCase();
      const nameB = (b.lastName || b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [students, selectedDept, selectedNstpSection, searchQuery]);

  // Save all modified / displayed grades
  const handleSaveAll = async () => {
    try {
      setSaving(true);
      setSaveSuccessMsg('');

      const gradesToSave = filteredStudents.map((st) => {
        const sid = st.studentId || st.id;
        const entry = gradesMap[sid] || {};
        return {
          student_id: st.id,
          studentId: st.studentId,
          student_name: st.name || `${st.lastName || ''}, ${st.firstName || ''} ${st.middleName || ''}`.trim(),
          department: st.department,
          semester: selectedSemester,
          school_year: selectedSchoolYear,
          nstp_section: st.nstp_section || null,
          midterm_grade: entry.midterm_grade || null,
          final_grade: entry.final_grade || null,
          remarks: entry.remarks || calculateRemarks(entry.final_grade) || null
        };
      });

      await gradesAPI.saveBatch(gradesToSave);

      // Update dirty flags
      setGradesMap((prev) => {
        const next = { ...prev };
        filteredStudents.forEach((st) => {
          const sid = st.studentId || st.id;
          if (next[sid]) {
            next[sid] = { ...next[sid], isDirty: false, isSaved: true };
          }
        });
        return next;
      });

      setSaveSuccessMsg(`Grades successfully saved for ${gradesToSave.length} students!`);
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to save grades:', err);
      alert('Failed to save grades. Please verify your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  // Quick batch fill for empty final grades
  const handleBatchFillUnfilled = () => {
    if (!batchFillGrade) return;
    if (!window.confirm(`Fill all empty grades with "${batchFillGrade}" for displayed students?`)) return;

    setGradesMap((prev) => {
      const next = { ...prev };
      filteredStudents.forEach((st) => {
        const sid = st.studentId || st.id;
        const current = next[sid] || { midterm_grade: '', final_grade: '', remarks: '' };
        if (!current.final_grade) {
          next[sid] = {
            ...current,
            midterm_grade: current.midterm_grade || batchFillGrade,
            final_grade: batchFillGrade,
            remarks: calculateRemarks(batchFillGrade),
            isDirty: true,
            isSaved: false
          };
        }
      });
      return next;
    });
  };

  // Export to Excel
  const handleExportExcel = () => {
    const rows = filteredStudents.map((st, idx) => {
      const sid = st.studentId || st.id;
      const g = gradesMap[sid] || {};
      return {
        'No.': idx + 1,
        'Student ID': st.studentId,
        'Student Name': st.name || `${st.lastName || ''}, ${st.firstName || ''} ${st.middleName || ''}`.trim(),
        'Department': st.department,
        'Program': st.program || '',
        'Year': st.year || '1st Year',
        'Original School Section': st.section || '',
        'Assigned NSTP Section': st.nstp_section || '',
        'Semester': selectedSemester,
        'School Year': selectedSchoolYear,
        'Midterm Grade': g.midterm_grade || '',
        'Final Grade': g.final_grade || '',
        'Remarks': g.remarks || calculateRemarks(g.final_grade) || ''
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'NSTP Grades');
    const deptStr = selectedDept !== 'All' ? selectedDept : 'All_Departments';
    const filename = `CvSU_NSTP_Grades_${deptStr}_${selectedSemester.replace(/\s+/g, '_')}_${selectedSchoolYear}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  // Print Official Grade Sheet
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const deptStr = selectedDept !== 'All' ? selectedDept : 'ALL TRACKS (CWTS / LTS / ROTC)';
    const instructorName = currentUser?.name || 'NSTP Instructor';

    const rowsHtml = filteredStudents.map((st, idx) => {
      const sid = st.studentId || st.id;
      const g = gradesMap[sid] || {};
      const remarks = g.remarks || calculateRemarks(g.final_grade) || '-';
      const isPassed = remarks === 'Passed';
      const isFailed = remarks === 'Failed';
      return `
        <tr style="border-bottom: 1px solid #e5e7eb; font-size: 11px;">
          <td style="padding: 6px 8px; text-align: center;">${idx + 1}</td>
          <td style="padding: 6px 8px; font-family: monospace; font-weight: bold;">${st.studentId}</td>
          <td style="padding: 6px 8px; font-weight: 600;">${st.name || `${st.lastName}, ${st.firstName}`}</td>
          <td style="padding: 6px 8px; text-align: center;">${st.program || '-'}</td>
          <td style="padding: 6px 8px; text-align: center;">${st.section || '-'}</td>
          <td style="padding: 6px 8px; text-align: center; font-weight: bold; color: #065f46;">${st.nstp_section || '-'}</td>
          <td style="padding: 6px 8px; text-align: center; font-weight: bold;">${g.midterm_grade || '-'}</td>
          <td style="padding: 6px 8px; text-align: center; font-weight: bold;">${g.final_grade || '-'}</td>
          <td style="padding: 6px 8px; text-align: center; font-weight: bold; color: ${isPassed ? '#059669' : isFailed ? '#dc2626' : '#d97706'};">${remarks}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>CvSU Naic - NSTP Official Grade Sheet</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #111827; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h2 { margin: 0; font-size: 16px; text-transform: uppercase; color: #065f46; }
          .header h3 { margin: 4px 0; font-size: 14px; }
          .header p { margin: 2px 0; font-size: 12px; color: #4b5563; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background-color: #065f46; color: white; padding: 8px; font-size: 11px; text-transform: uppercase; }
          .signatures { display: flex; justify-content: space-between; margin-top: 50px; font-size: 12px; }
          .sig-box { width: 30%; text-align: center; }
          .sig-line { border-top: 1px solid #111827; margin-top: 40px; padding-top: 5px; font-weight: bold; }
          @media print {
            body { margin: 10mm; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Cavite State University - Naic Campus</h2>
          <p>National Service Training Program (NSTP) Department</p>
          <h3>OFFICIAL GRADING SHEET &amp; SUMMARY OF RATINGS</h3>
          <p><strong>Department / Component:</strong> ${deptStr} &nbsp;|&nbsp; <strong>Semester:</strong> ${selectedSemester} &nbsp;|&nbsp; <strong>A.Y.:</strong> ${selectedSchoolYear} &nbsp;|&nbsp; <strong>NSTP Section:</strong> ${selectedNstpSection}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Student ID</th>
              <th>Student Full Name</th>
              <th>Program</th>
              <th>School Sec</th>
              <th>NSTP Sec</th>
              <th>Midterm</th>
              <th>Final Grade</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="9" style="text-align: center; padding: 20px;">No students found for the selected filter.</td></tr>'}
          </tbody>
        </table>

        <div class="signatures">
          <div class="sig-box">
            <div class="sig-line">${instructorName}<br/><span style="font-weight: normal; font-size: 10px;">Instructor-In-Charge</span></div>
          </div>
          <div class="sig-box">
            <div class="sig-line">NSTP Department Coordinator<br/><span style="font-weight: normal; font-size: 10px;">Program Coordinator</span></div>
          </div>
          <div class="sig-box">
            <div class="sig-line">Campus NSTP Director<br/><span style="font-weight: normal; font-size: 10px;">CvSU Naic NSTP Head</span></div>
          </div>
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-emerald-950/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-emerald-800/40 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 border-b border-emerald-800/60 shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-800/80 rounded-2xl p-2 flex items-center justify-center shadow-inner border border-emerald-600/50">
              <Award className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-xl font-black text-white leading-tight">
                Semester Grade Encoding &amp; Grading Sheet
              </h3>
              <p className="text-[11px] sm:text-xs text-emerald-300/90 font-medium">
                Encode, save, and submit official student grades every semester
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 text-emerald-200 hover:text-white hover:bg-emerald-800/70 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-emerald-50/70 border-b border-emerald-100 p-3 sm:p-4 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 items-center">
            
            {/* Department */}
            <div>
              <label className="block text-[10px] font-black uppercase text-emerald-900 tracking-wider mb-1">
                Department
              </label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                disabled={!isAdmin}
                className={`w-full px-2.5 py-1.5 text-xs font-bold rounded-xl border border-emerald-200 bg-white text-emerald-950 focus:ring-2 focus:ring-emerald-500 outline-none ${!isAdmin ? 'opacity-80 bg-gray-50' : 'cursor-pointer'}`}
              >
                {isAdmin && <option value="All">All Departments</option>}
                <option value="CWTS">CWTS</option>
                <option value="LTS">LTS</option>
                <option value="ROTC">ROTC</option>
              </select>
            </div>

            {/* Semester */}
            <div>
              <label className="block text-[10px] font-black uppercase text-emerald-900 tracking-wider mb-1">
                Semester
              </label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-bold rounded-xl border border-emerald-200 bg-white text-emerald-950 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
              >
                <option value="1st Semester">1st Semester</option>
                <option value="2nd Semester">2nd Semester</option>
                <option value="Summer">Summer Term</option>
              </select>
            </div>

            {/* School Year */}
            <div>
              <label className="block text-[10px] font-black uppercase text-emerald-900 tracking-wider mb-1">
                Academic Year
              </label>
              <select
                value={selectedSchoolYear}
                onChange={(e) => setSelectedSchoolYear(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-bold rounded-xl border border-emerald-200 bg-white text-emerald-950 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
              >
                <option value="2025-2026">2025-2026</option>
                <option value="2024-2025">2024-2025</option>
                <option value="2026-2027">2026-2027</option>
              </select>
            </div>

            {/* NSTP Section */}
            <div>
              <label className="block text-[10px] font-black uppercase text-emerald-900 tracking-wider mb-1">
                NSTP Section (Assigned)
              </label>
              <select
                value={selectedNstpSection}
                onChange={(e) => setSelectedNstpSection(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-bold rounded-xl border border-emerald-200 bg-white text-emerald-950 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
              >
                <option value="All">All NSTP Sections</option>
                <option value="CWTS 1-1">CWTS 1-1</option>
                <option value="CWTS 1-2">CWTS 1-2</option>
                <option value="CWTS 1-3">CWTS 1-3</option>
                <option value="LTS 1-1">LTS 1-1</option>
                <option value="LTS 1-2">LTS 1-2</option>
                <option value="LTS 1-3">LTS 1-3</option>
                <option value="ROTC 1-1">ROTC 1-1</option>
                <option value="ROTC 1-2">ROTC 1-2</option>
                <option value="ROTC 1-3">ROTC 1-3</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] font-black uppercase text-emerald-900 tracking-wider mb-1">
                Search Student
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-emerald-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Name / ID / Section..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs font-medium rounded-xl border border-emerald-200 bg-white text-emerald-950 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

          </div>

          {/* Quick Tools Bar */}
          <div className="mt-3 pt-2.5 border-t border-emerald-200/60 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
              <span>Showing <strong>{filteredStudents.length}</strong> students</span>
              {saveSuccessMsg && (
                <span className="flex items-center gap-1 text-emerald-700 bg-emerald-100/90 px-2.5 py-1 rounded-lg text-[11px] font-black animate-pulse">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                  {saveSuccessMsg}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Batch Fill helper */}
              <div className="flex items-center gap-1 bg-white border border-emerald-200 rounded-xl px-2 py-1">
                <span className="text-[10.5px] font-bold text-gray-600">Quick Fill:</span>
                <select
                  value={batchFillGrade}
                  onChange={(e) => setBatchFillGrade(e.target.value)}
                  className="text-xs font-black text-emerald-900 bg-transparent outline-none cursor-pointer"
                >
                  <option value="1.00">1.00</option>
                  <option value="1.25">1.25</option>
                  <option value="1.50">1.50</option>
                  <option value="1.75">1.75</option>
                  <option value="2.00">2.00</option>
                  <option value="2.25">2.25</option>
                  <option value="2.50">2.50</option>
                  <option value="3.00">3.00</option>
                </select>
                <button
                  type="button"
                  onClick={handleBatchFillUnfilled}
                  title="Fill all empty student grades with this value"
                  className="text-[10px] font-black bg-emerald-100 hover:bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded-md cursor-pointer ml-0.5"
                >
                  Apply
                </button>
              </div>

              {/* Export Excel */}
              <button
                type="button"
                onClick={handleExportExcel}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-emerald-900 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-xl shadow-xs cursor-pointer active:scale-95"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden xs:inline">Excel</span>
              </button>

              {/* Print Grade Sheet */}
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-blue-900 bg-white hover:bg-blue-50 border border-blue-300 rounded-xl shadow-xs cursor-pointer active:scale-95"
              >
                <Printer className="w-3.5 h-3.5 text-blue-700" />
                <span className="hidden xs:inline">Print Sheet</span>
              </button>

              {/* Save All Button */}
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-black text-white bg-gradient-to-r from-emerald-700 to-green-700 hover:from-emerald-800 hover:to-green-800 rounded-xl shadow-md cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Grades</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Grades Table Area */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4">
          {loading ? (
            <div className="text-center py-16">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
              <p className="text-sm font-bold text-emerald-900">Loading semester grades...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-16 bg-gray-50/60 rounded-2xl border border-dashed border-gray-200">
              <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-gray-700">No Students Found</h4>
              <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
                No students match your selected department, semester, or NSTP section filters.
              </p>
            </div>
          ) : (
            <div className="border border-emerald-100 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-emerald-900 text-white text-[10.5px] uppercase font-black tracking-wider">
                  <tr>
                    <th className="p-2.5 sm:p-3 text-center w-10">#</th>
                    <th className="p-2.5 sm:p-3">Student</th>
                    <th className="p-2.5 sm:p-3 hidden md:table-cell">School Section</th>
                    <th className="p-2.5 sm:p-3">NSTP Section</th>
                    <th className="p-2.5 sm:p-3 w-28 sm:w-32 text-center">Midterm Grade</th>
                    <th className="p-2.5 sm:p-3 w-28 sm:w-32 text-center">Final Grade</th>
                    <th className="p-2.5 sm:p-3 w-28 text-center">Remarks</th>
                    <th className="p-2.5 sm:p-3 w-16 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-medium bg-white">
                  {filteredStudents.map((st, idx) => {
                    const sid = st.studentId || st.id;
                    const g = gradesMap[sid] || { midterm_grade: '', final_grade: '', remarks: '', isDirty: false, isSaved: false };
                    const remarks = g.remarks || calculateRemarks(g.final_grade);
                    const isPassed = remarks === 'Passed';
                    const isFailed = remarks === 'Failed';
                    const isInc = remarks === 'Incomplete' || remarks === 'INC';
                    const isDrp = remarks === 'Dropped' || remarks === 'DRP';

                    return (
                      <tr
                        key={sid}
                        className={`hover:bg-emerald-50/40 transition-colors ${g.isDirty ? 'bg-amber-50/50' : ''}`}
                      >
                        <td className="p-2.5 sm:p-3 text-center text-gray-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="p-2.5 sm:p-3 min-w-[140px]">
                          <div className="font-bold text-gray-900 truncate">
                            {st.name || `${st.lastName}, ${st.firstName}`}
                          </div>
                          <div className="text-[11px] text-gray-500 font-mono flex items-center gap-1.5 mt-0.5">
                            <span>{st.studentId}</span>
                            <span>•</span>
                            <span className="font-bold text-emerald-800">{st.department}</span>
                            <span className="hidden sm:inline">• {st.program || '1st Year'}</span>
                          </div>
                        </td>

                        {/* School Section (Original) */}
                        <td className="p-2.5 sm:p-3 hidden md:table-cell">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 font-bold text-[11px]">
                            {st.section || 'None'}
                          </span>
                        </td>

                        {/* NSTP Section (Assigned by Admin) */}
                        <td className="p-2.5 sm:p-3">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-black text-[11px] border border-emerald-300/60">
                            {st.nstp_section || 'Unassigned'}
                          </span>
                        </td>

                        {/* Midterm Grade Input */}
                        <td className="p-2.5 sm:p-3 text-center">
                          <select
                            value={g.midterm_grade || ''}
                            onChange={(e) => handleGradeChange(sid, 'midterm_grade', e.target.value)}
                            className="w-full px-2 py-1 text-xs font-black text-center rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/30 outline-none bg-white cursor-pointer"
                          >
                            {GRADE_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt || '-- Select --'}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Final Grade Input */}
                        <td className="p-2.5 sm:p-3 text-center">
                          <select
                            value={g.final_grade || ''}
                            onChange={(e) => handleGradeChange(sid, 'final_grade', e.target.value)}
                            className="w-full px-2 py-1 text-xs font-black text-center rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/30 outline-none bg-white cursor-pointer text-emerald-950"
                          >
                            {GRADE_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt || '-- Select --'}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Remarks */}
                        <td className="p-2.5 sm:p-3 text-center">
                          {remarks ? (
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10.5px] font-black ${
                                isPassed
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : isFailed
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : isInc
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : isDrp
                                  ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {remarks}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-[11px] italic">Pending</span>
                          )}
                        </td>

                        {/* Saved / Dirty Status */}
                        <td className="p-2.5 sm:p-3 text-center">
                          {g.isDirty ? (
                            <span className="inline-flex items-center text-[10px] font-extrabold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                              Unsaved
                            </span>
                          ) : g.isSaved || g.final_grade ? (
                            <span className="inline-flex items-center text-emerald-600" title="Saved to database">
                              <CheckCircle className="w-4 h-4" />
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
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

        {/* Modal Footer */}
        <div className="bg-gray-50 border-t border-gray-100 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="text-[11px] text-gray-500 font-medium">
            <span className="font-bold text-gray-700">Official Grading Guidelines:</span> 1.00 – 3.00 (Passed) | 4.00 (Conditional) | 5.00 (Failed) | INC (Incomplete) | DRP (Dropped)
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-black text-white bg-gradient-to-r from-emerald-700 to-green-700 hover:from-emerald-800 hover:to-green-800 rounded-xl shadow-md cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save All Changes</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
