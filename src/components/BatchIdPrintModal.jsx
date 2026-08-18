import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, Printer, FileText, CheckSquare, Square, Search, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { attendanceAPI } from '../services/api';
import NstpIdCard from './NstpIdCard';
import { formatGradeAndSection } from '../utils/gradeSection';
import {
  DEMO_COORDINATOR_SIGNATURE_SVG,
  COORDINATOR_NAME,
  COORDINATOR_TITLE,
  COORDINATOR_INSTITUTION
} from '../utils/signatureAssets';

function getTrackLabel(dept) {
  switch (dept) {
    case 'ROTC': return "RESERVE OFFICERS' TRAINING CORPS";
    case 'LTS': return 'LITERACY TRAINING SERVICE';
    default: return 'CIVIC WELFARE TRAINING SERVICE';
  }
}

function renderPortraitCardHtml(st, qrSrc) {
  const name = (st.name || `${st.lastName || ''}, ${st.firstName || ''}`).toUpperCase();
  const dept = (st.department || 'CWTS').toUpperCase();
  const matriculationNo = st.nstp_serial_id || `NSTP-${dept}-2026-00001`;
  const studentSection = st.section 
    ? (st.section.toLowerCase().startsWith('section') ? st.section : `Section ${st.section}`) 
    : formatGradeAndSection(st);
  const photo = st.registration_photo || st.registrationPhoto || st.photo || '';
  const trackLabel = getTrackLabel(dept);
  const emergencyName = st.emergencyContact || st.emergencyName || 'Emergency Contact';
  const emergencyPhone = st.emergencyNumber || st.contactNumber || '09000000000';
  const bloodType = st.bloodType || 'O+';

  return `
    <td style="width: 2.15in; height: 3.38in; border: 2pt solid #064e3b; vertical-align: top; background-color: #ffffff; font-family: Arial, Helvetica, sans-serif; text-align: center; padding: 0; margin: 0;" bgcolor="#ffffff" valign="top">
      
      <!-- Top Header -->
      <table style="width: 100%; border-collapse: collapse; background-color: #064e3b; border-bottom: 2pt solid #f59e0b;" bgcolor="#064e3b" cellpadding="0" cellspacing="0">
        <tr>
          <td colspan="2" style="padding: 1pt; text-align: center;">
            <div style="width: 0.5in; height: 2.5pt; background-color: #022c22; margin: 1pt auto 2pt auto;"></div>
          </td>
        </tr>
        <tr>
          <td style="padding: 2pt 4pt 3pt 4pt; text-align: left; vertical-align: middle;" align="left" valign="middle">
            <div style="font-size: 6.5pt; font-weight: 900; color: #ffffff; text-transform: uppercase; letter-spacing: 0.2pt; line-height: 7.5pt; font-family: Arial, sans-serif;">CAVITE STATE UNIVERSITY</div>
            <div style="font-size: 5.2pt; font-weight: bold; color: #fde047; margin-top: 1pt; font-family: Arial, sans-serif;">NAIC CAMPUS • NSTP</div>
          </td>
          <td style="padding: 2pt 4pt 3pt 4pt; text-align: right; vertical-align: middle;" align="right" valign="middle">
            <span style="font-size: 6.2pt; font-weight: 900; background-color: #022c22; color: #fde047; padding: 1pt 3pt; border: 0.5pt solid #fde047;">${dept}</span>
          </td>
        </tr>
      </table>

      <!-- Main Body Container -->
      <div style="padding: 3pt 4pt; text-align: center;">
        
        <!-- 2x2 Photo Box -->
        <table align="center" style="margin: 1pt auto 2pt auto; border-collapse: collapse;">
          <tr>
            <td style="width: 0.72in; height: 0.78in; border: 1.5pt solid #064e3b; background-color: #f8fafc; text-align: center; vertical-align: middle;" bgcolor="#f8fafc" align="center" valign="middle">
              ${photo ? `<img src="${photo}" width="68" height="74" style="width: 0.72in; height: 0.78in; display: block;" alt="Photo" />` : '<span style="font-size: 4.8pt; font-weight: bold; color: #94a3b8; font-family: Arial, sans-serif;">2x2 PHOTO</span>'}
            </td>
          </tr>
        </table>

        <!-- Student Name -->
        <div style="font-size: 7.5pt; font-weight: 900; color: #064e3b; text-transform: uppercase; line-height: 8.5pt; margin: 1pt 0 0.5pt 0; font-family: Arial, sans-serif;">${name}</div>
        <div style="font-size: 4.5pt; font-weight: bold; color: #15803d; text-transform: uppercase; letter-spacing: 0.5pt; margin-bottom: 2pt; font-family: Arial, sans-serif;">STUDENT</div>

        <!-- Student No & Section Table -->
        <table style="width: 100%; border-collapse: collapse; background-color: #f1f5f9; font-size: 5pt; margin: 1pt auto; border: 0.5pt solid #cbd5e1;" bgcolor="#f1f5f9" cellpadding="2" cellspacing="0">
          <tr>
            <td style="padding: 1.5pt 2.5pt; text-align: left; vertical-align: middle; width: 50%;" align="left" valign="middle">
              <span style="color: #64748b; font-size: 4.2pt; text-transform: uppercase; font-weight: bold;">STUDENT NO.</span><br/>
              <b style="color: #0f172a; font-size: 6pt; font-family: monospace;">${st.studentId || 'N/A'}</b>
            </td>
            <td style="padding: 1.5pt 2.5pt; text-align: left; vertical-align: middle; width: 50%;" align="left" valign="middle">
              <span style="color: #64748b; font-size: 4.2pt; text-transform: uppercase; font-weight: bold;">SECTION</span><br/>
              <b style="color: #064e3b; font-size: 6pt; font-family: monospace;">${studentSection}</b>
            </td>
          </tr>
        </table>

        <!-- Matriculation Number Box -->
        <table style="width: 100%; border-collapse: collapse; background-color: #ccfbf1; border: 0.5pt solid #5eead4; margin: 2pt auto 1pt auto;" bgcolor="#ccfbf1" cellpadding="1.5" cellspacing="0">
          <tr>
            <td style="text-align: center;" align="center">
              <div style="font-size: 4.2pt; font-weight: 900; color: #115e59; text-transform: uppercase; font-family: Arial, sans-serif;">MATRICULATION NO.</div>
              <div style="font-size: 6.2pt; font-weight: 900; color: #064e3b; font-family: monospace; letter-spacing: -0.2pt;">${matriculationNo}</div>
            </td>
          </tr>
        </table>

        <!-- QR Code -->
        <table align="center" style="margin: 1.5pt auto 0.5pt auto; border-collapse: collapse;">
          <tr>
            <td style="width: 0.62in; height: 0.62in; border: 0.8pt solid #064e3b; padding: 1pt; background-color: #ffffff; text-align: center; vertical-align: middle;" bgcolor="#ffffff" align="center" valign="middle">
              ${qrSrc ? `<img src="${qrSrc}" width="58" height="58" style="width: 0.62in; height: 0.62in; display: block;" alt="QR" />` : '<div style="font-size: 4.5pt;">QR CODE</div>'}
            </td>
          </tr>
        </table>
        <div style="font-size: 4.5pt; font-weight: bold; color: #064e3b; font-family: monospace; margin-bottom: 2pt;">${matriculationNo}</div>

        <!-- Emergency Contact Strip -->
        <table style="width: 100%; border-collapse: collapse; background-color: #f8fafc; font-size: 4.5pt; text-align: left; margin: 1pt auto; border: 0.5pt solid #e2e8f0;" bgcolor="#f8fafc" cellpadding="1.5" cellspacing="0">
          <tr>
            <td style="padding: 1pt 2pt; font-family: Arial, sans-serif; color: #334155;">
              <b>Emergency:</b> ${emergencyName} (${emergencyPhone}) • <b style="color: #be123c;">Type: ${bloodType}</b>
            </td>
          </tr>
        </table>

        <!-- NSTP Coordinator Signature Section (With Demo E-Signature & FN MI. LN) -->
        <div style="margin-top: 2pt; padding-top: 1pt; text-align: center;">
          <div style="height: 16pt; margin: 0 auto; text-align: center;">
            <img src="${DEMO_COORDINATOR_SIGNATURE_SVG}" width="90" height="22" style="height: 16pt; width: 68pt; display: inline-block;" alt="Signature" />
          </div>
          <div style="font-size: 5.5pt; font-weight: 900; color: #0f172a; text-transform: uppercase; border-top: 0.8pt solid #64748b; display: inline-block; padding: 1pt 10pt 0 10pt; font-family: Arial, sans-serif; line-height: 6.5pt;">
            ${COORDINATOR_NAME}
          </div>
          <div style="font-size: 4.2pt; font-weight: bold; color: #475569; text-transform: uppercase; font-family: Arial, sans-serif; line-height: 5pt; margin-top: 0.5pt;">${COORDINATOR_TITLE}</div>
          <div style="font-size: 3.8pt; color: #64748b; font-family: Arial, sans-serif; line-height: 4.5pt;">${COORDINATOR_INSTITUTION}</div>
        </div>

      </div>

      <!-- Footer Strip -->
      <table style="width: 100%; border-collapse: collapse; background-color: #022c22; border-top: 1pt solid #f59e0b; margin-top: 1pt;" bgcolor="#022c22" cellpadding="2" cellspacing="0">
        <tr>
          <td style="padding: 1.5pt 3pt; text-align: left; font-size: 5pt; font-weight: 900; color: #fde047; text-transform: uppercase; font-family: Arial, sans-serif;" align="left">
            ${trackLabel}
          </td>
          <td style="padding: 1.5pt 3pt; text-align: right; font-size: 4.5pt; color: #ffffff; opacity: 0.85; font-family: Arial, sans-serif;" align="right">
            AY 2025-2026
          </td>
        </tr>
      </table>
    </td>
  `;
}

function generateDocxHtml(selectedStudents, qrMap) {
  let rowsHtml = '';
  for (let i = 0; i < selectedStudents.length; i += 2) {
    const s1 = selectedStudents[i];
    const s2 = selectedStudents[i + 1] || null;
    rowsHtml += `
      <tr style="height: 3.42in;">
        ${renderPortraitCardHtml(s1, qrMap[s1.id])}
        <td style="width: 0.35in; border: none;"></td>
        ${s2 ? renderPortraitCardHtml(s2, qrMap[s2.id]) : '<td style="width: 2.15in; border: none;"></td>'}
      </tr>
      <tr style="height: 0.25in;"><td colspan="3" style="border: none;"></td></tr>
    `;
  }

  return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>NSTP Student IDs A4</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page Section1 {
          size: 210mm 297mm;
          margin: 10mm 12mm 10mm 12mm;
          mso-header-margin: 0mm;
          mso-footer-margin: 0mm;
        }
        div.Section1 { page: Section1; }
        body { font-family: Arial, Helvetica, sans-serif; background-color: #ffffff; margin: 0; padding: 0; }
        table { page-break-inside: avoid; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { display: inline-block; }
      </style>
    </head>
    <body style="font-family: Arial, Helvetica, sans-serif; background-color: #ffffff;">
      <div class="Section1">
        <div style="text-align: center; margin-bottom: 8pt;">
          <h3 style="margin: 0; font-size: 11pt; color: #064e3b; font-weight: 900; font-family: Arial, sans-serif;">CAVITE STATE UNIVERSITY - NAIC CAMPUS</h3>
          <p style="margin: 2pt 0 0 0; font-size: 7.5pt; color: #475569; font-weight: bold; font-family: Arial, sans-serif;">NATIONAL SERVICE TRAINING PROGRAM • OFFICIAL STUDENT ID CARDS</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin: 0 auto;" align="center" cellpadding="0" cellspacing="0">
          ${rowsHtml}
        </table>
      </div>
    </body>
    </html>
  `;
}

export function BatchIdPrintModal({ isOpen, onClose, defaultDepartment = 'All' }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isExportingDoc, setIsExportingDoc] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [departmentFilter, setDepartmentFilter] = useState(defaultDepartment);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Fixed to strictly 5 IDs per page

  useEffect(() => {
    if (!isOpen) return;
    let isSubscribed = true;
    setLoading(true);
    
    attendanceAPI.getStudentIdCards({ department: departmentFilter })
      .then((data) => {
        if (!isSubscribed) return;
        const list = Array.isArray(data) ? data : [];
        setStudents(list);
        setSelectedIds(new Set(list.map(s => s.id)));
      })
      .catch((err) => {
        console.error('Failed to load students for ID print:', err);
      })
      .finally(() => {
        if (isSubscribed) setLoading(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [isOpen, departmentFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, departmentFilter]);

  if (!isOpen) return null;

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  const handleSearchClear = () => {
    setSearchInput('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const filteredStudents = students.filter(s => {
    // Check department filter
    if (departmentFilter !== 'All' && s.department !== departmentFilter) return false;

    // Search query
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const name = (s.name || `${s.firstName || ''} ${s.lastName || ''}`).toLowerCase();
    const id = (s.studentId || '').toLowerCase();
    const serial = (s.nstp_serial_id || '').toLowerCase();
    const dept = (s.department || '').toLowerCase();
    const sec = (s.section || '').toLowerCase();
    return name.includes(q) || id.includes(q) || serial.includes(q) || dept.includes(q) || sec.includes(q);
  });

  const selectedStudentsList = filteredStudents.filter(s => selectedIds.has(s.id));

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredStudents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const toggleSelectOne = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadDocx = async () => {
    if (selectedStudentsList.length === 0) return;
    setIsExportingDoc(true);

    try {
      const qrMap = {};
      for (const st of selectedStudentsList) {
        const dept = (st.department || 'CWTS').toUpperCase();
        const matriculationNo = st.nstp_serial_id || `NSTP-${dept}-2026-00001`;
        const qrToken = st.qr_token || matriculationNo;
        try {
          qrMap[st.id] = await QRCode.toDataURL(qrToken, {
            errorCorrectionLevel: 'M',
            margin: 1,
            width: 160,
            color: { dark: '#064e3b', light: '#ffffff' }
          });
        } catch (_) {
          qrMap[st.id] = '';
        }
      }

      const docContent = generateDocxHtml(selectedStudentsList, qrMap);

      const blob = new Blob(['\ufeff', docContent], {
        type: 'application/msword;charset=utf-8'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `CvSU_NSTP_Student_IDs_${departmentFilter}_${Date.now()}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating DOCX ID cards:', error);
      alert('Failed to generate Word document. Please try again.');
    } finally {
      setIsExportingDoc(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none">
      <div className="print:hidden bg-white rounded-3xl max-w-6xl w-full flex flex-col shadow-2xl border border-slate-200 overflow-hidden max-h-[96vh] justify-between animate-slide-up">
        
        {/* Header */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black shadow-md">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black leading-tight">Download &amp; Print Student ID Cards</h3>
              <p className="text-[11px] text-emerald-200 font-medium">Standard Vertical Portrait ID format fitted on A4 Paper</p>
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

        {/* Guidelines Banner */}
        <div className="bg-emerald-50 border-b border-emerald-200 px-3.5 py-2 text-xs text-emerald-950 flex items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-700 shrink-0" />
            <p className="text-[11px] text-emerald-800 leading-tight">
              <b>Official ID Card Specifications:</b> Standard vertical portrait card with live QR Code, 2x2 Photo, Matriculation No., and NSTP Coordinator signature space.
            </p>
          </div>
        </div>

        {/* Filter Toolbar (Section Select Removed as Requested) */}
        <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5 min-w-[200px] flex-1 max-w-xs">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setSearchQuery(e.target.value);
                  }}
                  placeholder="Search name, student ID, track..."
                  className="w-full pl-8 pr-7 py-1.5 bg-white rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={handleSearchClear}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-black text-xs shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
              >
                Search
              </button>
            </form>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white rounded-xl border border-slate-200 font-bold text-slate-700 focus:outline-none cursor-pointer text-xs"
            >
              <option value="All">All Departments</option>
              <option value="CWTS">CWTS</option>
              <option value="ROTC">ROTC</option>
              <option value="LTS">LTS</option>
            </select>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
            >
              {selectedIds.size === filteredStudents.length ? <CheckSquare className="w-3.5 h-3.5 text-emerald-700" /> : <Square className="w-3.5 h-3.5 text-slate-400" />}
              <span>{selectedIds.size === filteredStudents.length ? 'Deselect All' : 'Select All'} ({selectedIds.size})</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadDocx}
              disabled={selectedStudentsList.length === 0 || isExportingDoc}
              className="px-3.5 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-black shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-xs"
            >
              <FileText className="w-3.5 h-3.5 text-blue-200" />
              <span>{isExportingDoc ? 'Exporting...' : 'Download DOC'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={selectedStudentsList.length === 0}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-emerald-950 font-black shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4</span>
            </button>
          </div>
        </div>

        {/* Card Grid Area (5 IDs per page) */}
        <div className="p-3 sm:p-4 flex-1 bg-slate-100/70 flex flex-col justify-center overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500 font-bold">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Loading student ID cards...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 font-medium">
              No students found matching your search or filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 items-center justify-center">
              {paginatedStudents.map((st) => {
                const isSelected = selectedIds.has(st.id);
                const sectionLabel = st.section 
                  ? (st.section.toLowerCase().startsWith('section') ? st.section : `Section ${st.section}`) 
                  : formatGradeAndSection(st);
                return (
                  <div
                    key={st.id}
                    className={`p-2 rounded-2xl border-2 transition-all bg-white relative flex flex-col items-center gap-1 ${
                      isSelected ? 'border-emerald-600 shadow-sm' : 'border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="w-full flex items-center justify-between pb-1 border-b border-slate-100">
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(st.id)}
                          className="w-3.5 h-3.5 rounded text-emerald-700 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="font-black text-[11px] text-slate-800 truncate max-w-[110px]">
                          {st.name || `${st.firstName || ''} ${st.lastName || ''}`}
                        </span>
                      </label>
                      <span className="text-[8.5px] font-bold text-emerald-900 font-mono truncate max-w-[80px]">
                        {sectionLabel}
                      </span>
                    </div>

                    <div className="scale-[0.80] sm:scale-[0.85] origin-top transform-gpu my-[-10px]">
                      <NstpIdCard student={st} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {filteredStudents.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-500 font-medium text-[11px]">
                <span>
                  Showing <b className="text-slate-800 font-bold">{startIndex + 1}</b> to{' '}
                  <b className="text-slate-800 font-bold">{Math.min(endIndex, filteredStudents.length)}</b> of{' '}
                  <b className="text-slate-800 font-bold">{filteredStudents.length}</b> students (5 IDs per page)
                </span>
              </div>

              {/* Page Number Buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage === 1}
                  className="px-2 py-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer text-xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-xs">Previous</span>
                </button>

                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    if (
                      totalPages <= 5 ||
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      Math.abs(pageNum - safeCurrentPage) <= 1
                    ) {
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-6 h-6 rounded-xl text-xs font-black transition-colors cursor-pointer ${
                            safeCurrentPage === pageNum
                              ? 'bg-emerald-800 text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (
                      (pageNum === 2 && safeCurrentPage > 3) ||
                      (pageNum === totalPages - 1 && safeCurrentPage < totalPages - 2)
                    ) {
                      return (
                        <span key={pageNum} className="text-slate-400 px-0.5 text-xs">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="px-2 py-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer text-xs"
                >
                  <span className="hidden sm:inline text-xs">Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── PRINT-ONLY A4 SHEET CONTAINER (Rendered when window.print() is called) ── */}
      <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-0 m-0 w-full">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page {
              size: A4 portrait;
              margin: 8mm 8mm 8mm 8mm;
            }
            body {
              background: white !important;
              color: black !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .a4-print-page {
              page-break-after: always;
              width: 194mm;
              min-height: 281mm;
              display: grid;
              grid-template-columns: repeat(3, 53.98mm);
              grid-gap: 5mm 6mm;
              justify-content: center;
              align-content: start;
              margin: 0 auto;
              padding: 4mm 0;
            }
            .id-card-portrait {
              border: 1.5px solid #064e3b !important;
              box-shadow: none !important;
              border-radius: 3mm !important;
              page-break-inside: avoid !important;
            }
          }
        `}} />

        {Array.from({ length: Math.ceil(selectedStudentsList.length / 6) }).map((_, pageIdx) => {
          const pageStudents = selectedStudentsList.slice(pageIdx * 6, pageIdx * 6 + 6);
          return (
            <div key={pageIdx} className="a4-print-page">
              {pageStudents.map((st) => (
                <div key={st.id} className="flex items-center justify-center">
                  <NstpIdCard student={st} />
                </div>
              ))}
            </div>
          );
        })}
      </div>

    </div>
  );
}

export default BatchIdPrintModal;
