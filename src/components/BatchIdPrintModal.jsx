import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, Printer, FileText, CheckSquare, Square, Search, AlertTriangle, Layers, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { attendanceAPI } from '../services/api';
import NstpIdCard from './NstpIdCard';
import { formatGradeAndSection } from '../utils/gradeSection';

export function BatchIdPrintModal({ isOpen, onClose, defaultDepartment = 'All', defaultSection = 'All' }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isExportingDoc, setIsExportingDoc] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [departmentFilter, setDepartmentFilter] = useState(defaultDepartment);
  const [sectionFilter, setSectionFilter] = useState(defaultSection);
  const [searchQuery, setSearchQuery] = useState('');
  const [printLayout, setPrintLayout] = useState('folding'); // 'folding' (front & back side-by-side) | 'duplex' (fronts then backs)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, departmentFilter, sectionFilter, itemsPerPage]);

  if (!isOpen) return null;

  const filteredStudents = students.filter(s => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const name = (s.name || `${s.firstName || ''} ${s.lastName || ''}`).toLowerCase();
    const id = (s.studentId || '').toLowerCase();
    const serial = (s.nstp_serial_id || '').toLowerCase();
    return name.includes(q) || id.includes(q) || serial.includes(q);
  });

  const selectedStudentsList = filteredStudents.filter(s => selectedIds.has(s.id));

  // Pagination slice
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

  // Download Standard Vertical Portrait ID Cards in Microsoft Word (.doc) with EXACT Front & Back layout & Live QR Codes
  const handleDownloadDocx = async () => {
    if (selectedStudentsList.length === 0) return;
    setIsExportingDoc(true);

    try {
      // Pre-generate QR codes for all selected students
      const qrMap = {};
      for (const st of selectedStudentsList) {
        const dept = (st.department || 'CWTS').toUpperCase();
        const matriculationNo = st.nstp_serial_id || `NSTP-${dept}-2026-00001`;
        const qrToken = st.qr_token || matriculationNo;
        try {
          qrMap[st.id] = await QRCode.toDataURL(qrToken, {
            width: 200,
            margin: 1,
            color: { dark: '#064e3b', light: '#ffffff' }
          });
        } catch (_) {
          qrMap[st.id] = '';
        }
      }

      const getTrackLabel = (dept) => {
        switch (dept) {
          case 'ROTC': return "RESERVE OFFICERS' TRAINING CORPS";
          case 'LTS': return 'LITERACY TRAINING SERVICE';
          default: return 'CIVIC WELFARE TRAINING SERVICE';
        }
      };

      // Helper to render exact Front Card table HTML for Microsoft Word
      const renderFrontCardHtml = (st) => {
        const name = (st.name || `${st.lastName || ''}, ${st.firstName || ''}`).toUpperCase();
        const dept = (st.department || 'CWTS').toUpperCase();
        const matriculationNo = st.nstp_serial_id || `NSTP-${dept}-2026-00001`;
        const gradeSec = formatGradeAndSection(st);
        const photo = st.registration_photo || st.registrationPhoto || st.photo || '';
        const trackLabel = getTrackLabel(dept);

        return `
          <td style="width: 2.125in; height: 3.37in; border: 2pt solid #064e3b; border-radius: 8pt; vertical-align: top; background-color: #ffffff; font-family: Arial, Helvetica, sans-serif; text-align: center; padding: 0; margin: 0; box-sizing: border-box;">
            <!-- Top Header -->
            <table style="width: 100%; border-collapse: collapse; background-color: #064e3b; border-bottom: 2pt solid #f59e0b;">
              <tr>
                <td style="padding: 3pt 4pt; text-align: left; vertical-align: middle;">
                  <div style="font-size: 6.8pt; font-weight: 900; color: #ffffff; text-transform: uppercase; letter-spacing: 0.2pt; line-height: 8pt;">CAVITE STATE UNIVERSITY</div>
                  <div style="font-size: 5.5pt; font-weight: bold; color: #fde047; margin-top: 1pt;">NAIC CAMPUS • NSTP</div>
                </td>
                <td style="padding: 3pt 4pt; text-align: right; vertical-align: middle;">
                  <span style="font-size: 6.5pt; font-weight: 900; background-color: rgba(0,0,0,0.4); color: #fde047; padding: 1.5pt 3pt; border: 0.5pt solid #fde047; border-radius: 2pt;">${dept}</span>
                </td>
              </tr>
            </table>

            <!-- Photo & Info Container -->
            <div style="padding: 4pt 3pt; text-align: center;">
              <!-- 2x2 Photo Box -->
              <div style="margin: 2pt auto 3pt auto; width: 0.85in; height: 0.95in; border: 1.5pt solid #064e3b; border-radius: 4pt; background-color: #f8fafc; text-align: center; line-height: 0.95in; overflow: hidden;">
                ${photo ? `<img src="${photo}" style="width: 100%; height: 100%; object-fit: cover;" alt="Photo" />` : '<span style="font-size: 6pt; font-weight: bold; color: #94a3b8;">2x2 PHOTO</span>'}
              </div>

              <!-- Student Name -->
              <div style="font-size: 5pt; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.5pt;">Student Name</div>
              <div style="font-size: 8pt; font-weight: 900; color: #064e3b; text-transform: uppercase; line-height: 9.5pt; margin: 1pt 0 3pt 0;">${name}</div>

              <!-- Student No & Grade/Section Table -->
              <table style="width: 100%; border-collapse: collapse; background-color: #f8fafc; border: 0.5pt solid #cbd5e1; border-radius: 4pt; font-size: 5.5pt; margin: 2pt auto;">
                <tr>
                  <td style="padding: 2pt 3pt; text-align: left; vertical-align: middle;">
                    <span style="color: #64748b; font-size: 5pt; text-transform: uppercase; font-weight: bold;">Student No.</span><br/>
                    <b style="color: #0f172a; font-size: 6.8pt; font-family: monospace;">${st.studentId || 'N/A'}</b>
                  </td>
                  <td style="padding: 2pt 3pt; text-align: left; vertical-align: middle;">
                    <span style="color: #64748b; font-size: 5pt; text-transform: uppercase; font-weight: bold;">Grade &amp; Section</span><br/>
                    <b style="color: #064e3b; font-size: 6.8pt; font-family: monospace;">${gradeSec}</b>
                  </td>
                </tr>
              </table>

              <!-- Matriculation Number Box -->
              <div style="background-color: #ecfdf5; border: 0.5pt solid #a7f3d0; border-radius: 4pt; padding: 2pt; margin-top: 3pt;">
                <div style="font-size: 5pt; font-weight: 900; color: #065f46; text-transform: uppercase;">Matriculation Number</div>
                <div style="font-size: 7pt; font-weight: 900; color: #064e3b; font-family: monospace; letter-spacing: -0.2pt;">${matriculationNo}</div>
              </div>
            </div>

            <!-- Footer Strip -->
            <table style="width: 100%; border-collapse: collapse; background-color: #022c22; border-top: 1pt solid #f59e0b; margin-top: 2pt;">
              <tr>
                <td style="padding: 2pt 4pt; text-align: left; font-size: 5.5pt; font-weight: 900; color: #fde047; text-transform: uppercase;">
                  ${trackLabel}
                </td>
                <td style="padding: 2pt 4pt; text-align: right; font-size: 5pt; color: #ffffff; opacity: 0.8;">
                  AY 2025-2026
                </td>
              </tr>
            </table>
          </td>
        `;
      };

      // Helper to render exact Back Card table HTML for Microsoft Word
      const renderBackCardHtml = (st) => {
        const dept = (st.department || 'CWTS').toUpperCase();
        const matriculationNo = st.nstp_serial_id || `NSTP-${dept}-2026-00001`;
        const qrSrc = qrMap[st.id] || '';

        return `
          <td style="width: 2.125in; height: 3.37in; border: 2pt solid #064e3b; border-radius: 8pt; vertical-align: top; background-color: #ffffff; font-family: Arial, Helvetica, sans-serif; text-align: center; padding: 3pt; box-sizing: border-box;">
            <!-- Top Header -->
            <div style="border-bottom: 0.5pt solid #064e3b; padding-bottom: 2pt; margin-bottom: 2pt;">
              <div style="font-size: 6.5pt; font-weight: 900; color: #064e3b; text-transform: uppercase;">NATIONAL SERVICE TRAINING PROGRAM</div>
              <div style="font-size: 5pt; font-weight: bold; color: #64748b;">R.A. 9163 • CAVITE STATE UNIVERSITY</div>
            </div>

            <!-- QR Code Section -->
            <div style="margin: 3pt auto; text-align: center;">
              <div style="width: 0.95in; height: 0.95in; border: 1.5pt solid #064e3b; border-radius: 4pt; padding: 1pt; margin: 0 auto; background-color: #ffffff;">
                ${qrSrc ? `<img src="${qrSrc}" style="width: 100%; height: 100%;" alt="QR" />` : '<div style="line-height: 0.95in; font-size: 6pt;">QR CODE</div>'}
              </div>
              <div style="font-size: 5.5pt; font-weight: bold; color: #064e3b; font-family: monospace; margin-top: 1pt;">${matriculationNo}</div>
            </div>

            <!-- Emergency Box -->
            <table style="width: 100%; border-collapse: collapse; background-color: #f8fafc; border: 0.5pt solid #cbd5e1; border-radius: 4pt; font-size: 5.5pt; text-align: left; margin: 3pt auto;">
              <tr>
                <td style="padding: 2pt 3pt;">
                  <span style="font-weight: bold; color: #334155;">Emergency:</span> ${st.emergencyContact || st.emergencyName || 'Parent / Guardian'}<br/>
                  <span style="font-weight: bold; color: #334155;">Contact No:</span> <span style="font-family: monospace;">${st.emergencyNumber || st.contactNumber || 'N/A'}</span>
                  ${st.bloodType ? `<br/><span style="font-weight: bold; color: #334155;">Blood Type:</span> <b style="color: #be123c;">${st.bloodType}</b>` : ''}
                </td>
              </tr>
            </table>

            <!-- Signature Line -->
            <div style="margin-top: 5pt; padding-top: 3pt; border-top: 0.5pt solid #cbd5e1;">
              <div style="width: 1.1in; border-bottom: 1pt solid #334155; margin: 0 auto 1pt auto;"></div>
              <div style="font-size: 5.5pt; font-weight: 900; color: #0f172a; text-transform: uppercase;">NSTP Coordinator</div>
              <div style="font-size: 4.8pt; color: #64748b;">Cavite State University Naic</div>
            </div>
          </td>
        `;
      };

      let rowsHtml = '';
      if (printLayout === 'folding') {
        // Folding Mode: Each row has Front & Back side-by-side for 1 student (3 pairs per page)
        for (let i = 0; i < selectedStudentsList.length; i++) {
          const st = selectedStudentsList[i];
          rowsHtml += `
            <tr style="height: 3.4in;">
              ${renderFrontCardHtml(st)}
              <td style="width: 0.25in; border: none;"></td>
              ${renderBackCardHtml(st)}
            </tr>
            <tr style="height: 0.15in;"><td colspan="3" style="border: none;"></td></tr>
          `;
        }
      } else {
        // Duplex Mode: 2 columns of Fronts on Page 1, matching 2 columns of Backs on Page 2
        for (let i = 0; i < selectedStudentsList.length; i += 2) {
          const s1 = selectedStudentsList[i];
          const s2 = selectedStudentsList[i + 1] || null;
          rowsHtml += `
            <tr style="height: 3.4in;">
              ${renderFrontCardHtml(s1)}
              <td style="width: 0.25in; border: none;"></td>
              ${s2 ? renderFrontCardHtml(s2) : '<td style="width: 2.125in; border: none;"></td>'}
            </tr>
            <tr style="height: 0.15in;"><td colspan="3" style="border: none;"></td></tr>
          `;
        }
      }

      const docContent = `
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
              <p style="margin: 1pt 0; font-size: 7.5pt; color: #475569; font-weight: bold;">NATIONAL SERVICE TRAINING PROGRAM • OFFICIAL STUDENT ID CARDS (${printLayout === 'folding' ? 'SIDE-BY-SIDE FOLDING FORMAT' : 'DUPLEX FORMAT'})</p>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin: 0 auto;" align="center">
              ${rowsHtml}
            </table>
          </div>
        </body>
        </html>
      `;

      const blob = new Blob(['\ufeff', docContent], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NSTP_Student_IDs_${departmentFilter}_A4.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating Word DOC:', err);
    } finally {
      setIsExportingDoc(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      {/* ── Screen UI Container (Hidden on Print) ── */}
      <div className="print:hidden bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black leading-tight">Download &amp; Print Student ID Cards</h3>
              <p className="text-xs text-emerald-200 font-medium">Standard Vertical Portrait ID format (Front &amp; Back) fitted on A4 Paper</p>
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

        {/* Printing Strategy & Format Explanation Banner */}
        <div className="bg-emerald-50 border-b border-emerald-200 p-3 sm:p-4 text-xs text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-900">Diskarte sa Pag-print ng ID (Printing Guide):</p>
              <p className="text-[11px] text-emerald-800 leading-relaxed mt-0.5">
                • <b>Side-by-Side (Folding - Recommended para sa Ordinary Printer)</b>: Magkatabi ang Harap at Likod ng ID. I-print sa Makapal na Photo Paper o PVC Board, itiklop (fold) sa gitna para maging back-to-back agad, i-laminate, at gupitin. Walang problem sa baliktaran.<br/>
                • <b>Duplex (Back-to-Back)</b>: Page 1 ang Harap, Page 2 ang Likod. Sa printer settings, piliin ang <b>"Flip on Short Edge"</b> dahil patayo (Portrait) ang ID cards.
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {/* Search */}
            <div className="relative min-w-[170px] flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student or matriculation no..."
                className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            {/* Department */}
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 bg-white rounded-xl border border-slate-200 font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All Departments</option>
              <option value="CWTS">CWTS</option>
              <option value="ROTC">ROTC</option>
              <option value="LTS">LTS</option>
            </select>

            {/* Section */}
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="px-3 py-2 bg-white rounded-xl border border-slate-200 font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
              <option value="D">Section D</option>
            </select>

            {/* Print Mode Selector */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setPrintLayout('folding')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  printLayout === 'folding' ? 'bg-emerald-800 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Front and Back side-by-side (Ititiklop sa gitna)"
              >
                Side-by-Side (Folding)
              </button>
              <button
                type="button"
                onClick={() => setPrintLayout('duplex')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  printLayout === 'duplex' ? 'bg-emerald-800 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Page 1 Fronts, Page 2 Backs (Para sa Duplex Printer)"
              >
                Duplex (Back-to-Back)
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {selectedIds.size === filteredStudents.length ? <CheckSquare className="w-4 h-4 text-emerald-700" /> : <Square className="w-4 h-4 text-slate-400" />}
              <span>{selectedIds.size === filteredStudents.length ? 'Deselect All' : 'Select All'} ({selectedIds.size})</span>
            </button>

            {/* Download as DOCS (.doc) Button */}
            <button
              type="button"
              onClick={handleDownloadDocx}
              disabled={selectedStudentsList.length === 0 || isExportingDoc}
              title="Download selected student ID cards in Microsoft Word DOC format matching exact layout"
              className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-black shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-4 h-4 text-blue-200" />
              <span>{isExportingDoc ? 'Exporting DOC...' : 'Download DOCS (.doc)'}</span>
            </button>

            {/* Print A4 Sheet Button */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={selectedStudentsList.length === 0}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-emerald-950 font-black shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4 Cards</span>
            </button>
          </div>
        </div>

        {/* Preview Area (Paginated, Non-Scrollable Grid) */}
        <div className="p-4 sm:p-5 flex-1 bg-slate-100/70 flex flex-col justify-between">
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-bold">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Loading student ID cards...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 font-medium">
              No students found matching your search or filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {paginatedStudents.map((st) => {
                const isSelected = selectedIds.has(st.id);
                return (
                  <div
                    key={st.id}
                    className={`p-2.5 sm:p-3 rounded-2xl border-2 transition-all bg-white relative flex flex-col items-center gap-1.5 ${
                      isSelected ? 'border-emerald-600 shadow-sm' : 'border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="w-full flex items-center justify-between pb-1 border-b border-slate-100">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(st.id)}
                          className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="font-black text-xs text-slate-800 truncate max-w-[140px]">
                          {st.name || `${st.firstName || ''} ${st.lastName || ''}`}
                        </span>
                      </label>
                      <span className="text-[9px] font-bold text-emerald-900 font-mono">
                        {formatGradeAndSection(st)}
                      </span>
                    </div>

                    {/* Render Portrait ID Card Preview (Front & Back Pair) */}
                    <div className="scale-[0.82] sm:scale-[0.88] origin-top transform-gpu my-[-8px]">
                      <NstpIdCard student={st} side="both" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls Footer */}
          {filteredStudents.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2 text-slate-500 font-medium">
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
                    className="px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value={3}>3</option>
                    <option value={6}>6</option>
                    <option value={9}>9</option>
                  </select>
                </div>
              </div>

              {/* Page Number Buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage === 1}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-xs">Previous</span>
                </button>

                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    // Show first, last, and pages around current page
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
                          className={`w-7 h-7 rounded-xl text-xs font-black transition-colors cursor-pointer ${
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
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer"
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
              grid-template-columns: repeat(2, 53.98mm 53.98mm);
              grid-gap: 5mm 6mm;
              justify-content: center;
              align-content: start;
              margin: 0 auto;
              padding: 4mm 0;
            }
            .id-card-front, .id-card-back {
              border: 1.5px solid #064e3b !important;
              box-shadow: none !important;
              border-radius: 3mm !important;
              page-break-inside: avoid !important;
            }
          }
        `}} />

        {printLayout === 'folding' ? (
          // Folding Mode: Front & Back side-by-side for each student (3 pairs per page)
          Array.from({ length: Math.ceil(selectedStudentsList.length / 3) }).map((_, pageIdx) => {
            const pageStudents = selectedStudentsList.slice(pageIdx * 3, pageIdx * 3 + 3);
            return (
              <div key={pageIdx} className="a4-print-page">
                {pageStudents.map((st) => (
                  <React.Fragment key={st.id}>
                    <div className="flex items-center justify-center">
                      <NstpIdCard student={st} side="front" />
                    </div>
                    <div className="flex items-center justify-center">
                      <NstpIdCard student={st} side="back" />
                    </div>
                  </React.Fragment>
                ))}
              </div>
            );
          })
        ) : (
          // Duplex Mode: Page 1 Fronts, Page 2 Backs
          Array.from({ length: Math.ceil(selectedStudentsList.length / 6) }).map((_, pageIdx) => {
            const pageStudents = selectedStudentsList.slice(pageIdx * 6, pageIdx * 6 + 6);
            return (
              <React.Fragment key={pageIdx}>
                <div className="a4-print-page">
                  {pageStudents.map((st) => (
                    <div key={`front-${st.id}`} className="flex items-center justify-center">
                      <NstpIdCard student={st} side="front" />
                    </div>
                  ))}
                </div>
                <div className="a4-print-page">
                  {pageStudents.map((st) => (
                    <div key={`back-${st.id}`} className="flex items-center justify-center">
                      <NstpIdCard student={st} side="back" />
                    </div>
                  ))}
                </div>
              </React.Fragment>
            );
          })
        )}
      </div>

    </div>
  );
}

export default BatchIdPrintModal;
