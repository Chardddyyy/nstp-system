import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, Printer, FileText, CheckSquare, Square, Search, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { attendanceAPI } from '../services/api';
import NstpIdCard from './NstpIdCard';
import { formatGradeAndSection } from '../utils/gradeSection';

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
  const gradeSec = formatGradeAndSection(st);
  const photo = st.registration_photo || st.registrationPhoto || st.photo || '';
  const trackLabel = getTrackLabel(dept);
  const emergencyName = st.emergencyContact || st.emergencyName || 'Richard Belen';
  const emergencyPhone = st.emergencyNumber || st.contactNumber || '09858337254';
  const bloodType = st.bloodType || 'O';

  return `
    <td style="width: 2.125in; height: 3.37in; border: 2pt solid #064e3b; border-radius: 8pt; vertical-align: top; background-color: #ffffff; font-family: Arial, Helvetica, sans-serif; text-align: center; padding: 0; margin: 0; box-sizing: border-box;">
      <!-- Top Header -->
      <table style="width: 100%; border-collapse: collapse; background-color: #064e3b; border-bottom: 2pt solid #f59e0b;">
        <tr>
          <td colspan="2" style="padding: 1pt; text-align: center;">
            <div style="width: 0.5in; height: 2.5pt; background-color: #022c22; border-radius: 2pt; margin: 1pt auto 2pt auto;"></div>
          </td>
        </tr>
        <tr>
          <td style="padding: 2pt 4pt 3pt 4pt; text-align: left; vertical-align: middle;">
            <div style="font-size: 6.5pt; font-weight: 900; color: #ffffff; text-transform: uppercase; letter-spacing: 0.2pt; line-height: 7.5pt;">CAVITE STATE UNIVERSITY</div>
            <div style="font-size: 5.2pt; font-weight: bold; color: #fde047; margin-top: 1pt;">NAIC CAMPUS • NSTP</div>
          </td>
          <td style="padding: 2pt 4pt 3pt 4pt; text-align: right; vertical-align: middle;">
            <span style="font-size: 6.2pt; font-weight: 900; background-color: rgba(0,0,0,0.4); color: #fde047; padding: 1pt 3pt; border: 0.5pt solid #fde047; border-radius: 2pt;">${dept}</span>
          </td>
        </tr>
      </table>

      <!-- Photo & Info Container -->
      <div style="padding: 3pt 3pt; text-align: center;">
        <!-- 2x2 Photo Box -->
        <div style="margin: 1pt auto 2pt auto; width: 0.75in; height: 0.85in; border: 1.5pt solid #064e3b; border-radius: 4pt; background-color: #f8fafc; text-align: center; line-height: 0.85in; overflow: hidden;">
          ${photo ? `<img src="${photo}" style="width: 100%; height: 100%; object-fit: cover;" alt="Photo" />` : '<span style="font-size: 5pt; font-weight: bold; color: #94a3b8;">2x2 PHOTO</span>'}
        </div>

        <!-- Student Name -->
        <div style="font-size: 4.8pt; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.5pt;">STUDENT NAME</div>
        <div style="font-size: 7.5pt; font-weight: 900; color: #064e3b; text-transform: uppercase; line-height: 8.5pt; margin: 0.5pt 0 2pt 0;">${name}</div>

        <!-- Student No & Grade/Section Table -->
        <table style="width: 100%; border-collapse: collapse; background-color: #e2e8f0; border-radius: 3pt; font-size: 5pt; margin: 1pt auto;">
          <tr>
            <td style="padding: 1.5pt 2.5pt; text-align: left; vertical-align: middle;">
              <span style="color: #64748b; font-size: 4.5pt; text-transform: uppercase; font-weight: bold;">STUDENT NO.</span><br/>
              <b style="color: #0f172a; font-size: 6.2pt; font-family: monospace;">${st.studentId || 'N/A'}</b>
            </td>
            <td style="padding: 1.5pt 2.5pt; text-align: left; vertical-align: middle;">
              <span style="color: #64748b; font-size: 4.5pt; text-transform: uppercase; font-weight: bold;">GRADE &amp; SECTION</span><br/>
              <b style="color: #064e3b; font-size: 6.2pt; font-family: monospace;">${gradeSec}</b>
            </td>
          </tr>
        </table>

        <!-- Matriculation Number Box -->
        <div style="background-color: #ccfbf1; border: 0.5pt solid #5eead4; border-radius: 3pt; padding: 1.5pt; margin-top: 2pt;">
          <div style="font-size: 4.5pt; font-weight: 900; color: #115e59; text-transform: uppercase;">MATRICULATION NUMBER</div>
          <div style="font-size: 6.5pt; font-weight: 900; color: #064e3b; font-family: monospace; letter-spacing: -0.2pt;">${matriculationNo}</div>
        </div>

        <!-- AY Label Above QR -->
        <div style="font-size: 4.8pt; font-weight: bold; color: #475569; margin: 1.5pt 0 0.5pt 0;">AY 2025-2026</div>

        <!-- QR Code -->
        <div style="margin: 1pt auto; text-align: center;">
          <div style="width: 0.65in; height: 0.65in; border: 0.8pt solid #064e3b; border-radius: 3pt; padding: 1pt; margin: 0 auto; background-color: #ffffff;">
            ${qrSrc ? `<img src="${qrSrc}" style="width: 100%; height: 100%;" alt="QR" />` : '<div style="line-height: 0.65in; font-size: 5pt;">QR CODE</div>'}
          </div>
          <div style="font-size: 4.8pt; font-weight: bold; color: #064e3b; font-family: monospace; margin-top: 0.5pt;">${matriculationNo}</div>
        </div>

        <!-- Emergency Box -->
        <table style="width: 100%; border-collapse: collapse; background-color: #e2e8f0; border-radius: 3pt; font-size: 4.8pt; text-align: left; margin: 2pt auto;">
          <tr>
            <td style="padding: 1.5pt 2.5pt;">
              <b style="color: #1e293b; text-transform: uppercase;">EMERGENCY CONTACTS</b><br/>
              <span style="font-weight: bold; color: #475569;">Emergency:</span> ${emergencyName}<br/>
              <span style="font-weight: bold; color: #475569;">Contact No:</span> <span style="font-family: monospace;">${emergencyPhone}</span>
              ${bloodType ? `<br/><span style="font-weight: bold; color: #475569;">Blood Type:</span> <b style="color: #be123c;">${bloodType}</b>` : ''}
            </td>
          </tr>
        </table>

        <!-- Signature Line -->
        <div style="margin-top: 2pt; padding-top: 1pt;">
          <div style="font-size: 5pt; font-weight: 900; color: #0f172a; text-transform: uppercase;">NSTP COORDINATOR</div>
          <div style="font-size: 4.2pt; color: #64748b;">Cavite State University Naic</div>
        </div>
      </div>

      <!-- Footer Strip -->
      <table style="width: 100%; border-collapse: collapse; background-color: #022c22; border-top: 1pt solid #f59e0b; margin-top: 1pt;">
        <tr>
          <td style="padding: 1.5pt 3pt; text-align: left; font-size: 5.2pt; font-weight: 900; color: #fde047; text-transform: uppercase;">
            ${trackLabel}
          </td>
          <td style="padding: 1.5pt 3pt; text-align: right; font-size: 4.8pt; color: #ffffff; opacity: 0.8;">
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
      <tr style="height: 3.4in;">
        ${renderPortraitCardHtml(s1, qrMap[s1.id])}
        <td style="width: 0.3in; border: none;"></td>
        ${s2 ? renderPortraitCardHtml(s2, qrMap[s2.id]) : '<td style="width: 2.125in; border: none;"></td>'}
      </tr>
      <tr style="height: 0.2in;"><td colspan="3" style="border: none;"></td></tr>
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
          margin: 10mm 10mm 10mm 10mm;
          mso-header-margin: 0mm;
          mso-footer-margin: 0mm;
        }
        div.Section1 { page: Section1; }
        body { font-family: Arial, Helvetica, sans-serif; }
        table { page-break-inside: avoid; }
      </style>
    </head>
    <body>
      <div class="Section1">
        <div style="text-align: center; margin-bottom: 6pt;">
          <h3 style="margin: 0; font-size: 10.5pt; color: #064e3b; font-weight: 900;">CAVITE STATE UNIVERSITY - NAIC CAMPUS</h3>
          <p style="margin: 1pt 0; font-size: 7.5pt; color: #475569; font-weight: bold;">NATIONAL SERVICE TRAINING PROGRAM • OFFICIAL VERTICAL STUDENT ID CARDS</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin: 0 auto;" align="center">
          ${rowsHtml}
        </table>
      </div>
    </body>
    </html>
  `;
}

export function BatchIdPrintModal({ isOpen, onClose, defaultDepartment = 'All', defaultSection = 'All' }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isExportingDoc, setIsExportingDoc] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [departmentFilter, setDepartmentFilter] = useState(defaultDepartment);
  const [sectionFilter, setSectionFilter] = useState(defaultSection);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
    if (!isOpen) return;
    let isSubscribed = true;
    setLoading(true);
    
    attendanceAPI.getStudentIdCards({ department: departmentFilter, section: sectionFilter })
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
  }, [isOpen, departmentFilter, sectionFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, departmentFilter, sectionFilter, itemsPerPage]);

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
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const name = (s.name || `${s.firstName || ''} ${s.lastName || ''}`).toLowerCase();
    const id = (s.studentId || '').toLowerCase();
    const serial = (s.nstp_serial_id || '').toLowerCase();
    const dept = (s.department || '').toLowerCase();
    const sec = (s.section || s.nstp_section || '').toLowerCase();
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
              <b>Official ID Card Specifications:</b> Standard vertical portrait card with live QR Code, 2x2 Photo, Matriculation No., and Emergency Contacts.
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
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

            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white rounded-xl border border-slate-200 font-bold text-slate-700 focus:outline-none cursor-pointer text-xs"
            >
              <option value="All">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
              <option value="D">Section D</option>
              <option value="1">Section 1</option>
              <option value="2">Section 2</option>
              <option value="3">Section 3</option>
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

        {/* Card Grid Area */}
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
                      <span className="text-[8.5px] font-bold text-emerald-900 font-mono">
                        {formatGradeAndSection(st)}
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
                  <b className="text-slate-800 font-bold">{filteredStudents.length}</b> students
                </span>

                <span className="text-slate-300">|</span>

                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-slate-400">Cards per page:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="px-1.5 py-0.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value={3}>3</option>
                    <option value={5}>5</option>
                    <option value={8}>8</option>
                  </select>
                </div>
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

