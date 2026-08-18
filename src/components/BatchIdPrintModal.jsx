import React, { useState, useEffect } from 'react';
import { X, Printer, FileText, CheckSquare, Square, Download, Search } from 'lucide-react';
import { attendanceAPI } from '../services/api';
import NstpIdCard from './NstpIdCard';

export function BatchIdPrintModal({ isOpen, onClose, defaultDepartment = 'All', defaultSection = 'All' }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [departmentFilter, setDepartmentFilter] = useState(defaultDepartment);
  const [sectionFilter, setSectionFilter] = useState(defaultSection);
  const [searchQuery, setSearchQuery] = useState('');
  const [printLayout, setPrintLayout] = useState('folding'); // 'folding' (side-by-side) | 'duplex' (fronts then backs)

  useEffect(() => {
    if (!isOpen) return;
    let isSubscribed = true;
    
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

  // Export Standard Elementary/Student ID Cards fitted on A4 in Microsoft Word DOC Format
  const handleDownloadDocx = () => {
    if (selectedStudentsList.length === 0) return;

    let cardsHtml = '';
    for (let i = 0; i < selectedStudentsList.length; i += 2) {
      const s1 = selectedStudentsList[i];
      const s2 = selectedStudentsList[i + 1] || null;

      const renderCardCell = (st) => {
        if (!st) return '<td style="width: 3.37in; border: none;"></td>';
        const name = (st.name || `${st.lastName || ''}, ${st.firstName || ''}`).toUpperCase();
        const dept = (st.department || 'CWTS').toUpperCase();
        const serial = st.nstp_serial_id || `NSTP-2026-${dept}-${String(st.studentId || st.id || '0000').slice(-4)}`;
        const deptColor = dept === 'ROTC' ? '#991b1b' : dept === 'LTS' ? '#6b21a8' : '#065f46';

        return `
          <td style="width: 3.37in; height: 2.125in; border: 2pt solid ${deptColor}; border-radius: 8pt; padding: 6pt; vertical-align: top; background-color: #ffffff; font-family: Arial, sans-serif;">
            <!-- Header -->
            <table style="width: 100%; border-collapse: collapse; border-bottom: 1.5pt solid #f59e0b; margin-bottom: 4pt;">
              <tr>
                <td style="vertical-align: middle; text-align: left;">
                  <div style="font-size: 7.5pt; font-weight: bold; color: ${deptColor}; text-transform: uppercase;">CAVITE STATE UNIVERSITY</div>
                  <div style="font-size: 6pt; font-weight: bold; color: #475569;">NAIC CAMPUS • NSTP (${dept})</div>
                </td>
                <td style="vertical-align: middle; text-align: right;">
                  <span style="font-size: 6.5pt; font-weight: bold; background-color: ${deptColor}; color: #ffffff; padding: 2pt 4pt; border-radius: 3pt;">${dept}</span>
                </td>
              </tr>
            </table>

            <!-- Body Details -->
            <table style="width: 100%; border-collapse: collapse; margin-top: 2pt;">
              <tr>
                <td style="width: 0.85in; vertical-align: top; text-align: center;">
                  <div style="width: 0.8in; height: 0.95in; border: 1pt solid #cbd5e1; background-color: #f8fafc; text-align: center; line-height: 0.95in; font-size: 6pt; font-weight: bold; color: #94a3b8;">
                    2x2 PHOTO
                  </div>
                </td>
                <td style="vertical-align: top; padding-left: 6pt;">
                  <div style="font-size: 6pt; font-weight: bold; color: #64748b; text-transform: uppercase;">Student Name</div>
                  <div style="font-size: 8.5pt; font-weight: 900; color: #0f172a; line-height: 10pt; margin-bottom: 3pt;">${name}</div>
                  
                  <div style="font-size: 6pt; font-weight: bold; color: #64748b;">Student No: <span style="font-weight: 900; color: #0f172a;">${st.studentId || 'N/A'}</span></div>
                  <div style="font-size: 6pt; font-weight: bold; color: #64748b;">Program/Sec: <span style="font-weight: 900; color: #0f172a;">${st.program || 'BS'} ${st.section ? `Sec ${st.section}` : ''}</span></div>
                  <div style="font-size: 6pt; font-weight: bold; color: ${deptColor}; margin-top: 2pt;">Serial ID: <b>${serial}</b></div>
                </td>
              </tr>
            </table>

            <!-- Footer Line -->
            <table style="width: 100%; border-collapse: collapse; border-top: 1pt solid #e2e8f0; margin-top: 4pt; padding-top: 2pt;">
              <tr>
                <td style="font-size: 5.5pt; color: #64748b;">Valid: AY 2025-2026</td>
                <td style="font-size: 5.5pt; text-align: right; font-weight: bold; color: ${deptColor};">OFFICIAL NSTP CADET ID</td>
              </tr>
            </table>
          </td>
        `;
      };

      cardsHtml += `
        <tr style="height: 2.2in;">
          ${renderCardCell(s1)}
          <td style="width: 0.2in;"></td>
          ${renderCardCell(s2)}
        </tr>
        <tr style="height: 0.15in;"><td colspan="3"></td></tr>
      `;
    }

    const docContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>NSTP Student IDs A4</title>
        <style>
          @page Section1 {
            size: 210mm 297mm; /* Standard A4 */
            margin: 10mm 10mm 10mm 10mm;
            mso-header-margin: 0mm;
            mso-footer-margin: 0mm;
            mso-paper-source: 0;
          }
          div.Section1 { page: Section1; }
          body { font-family: Arial, sans-serif; }
          table { page-break-inside: avoid; }
        </style>
      </head>
      <body>
        <div class="Section1">
          <div style="text-align: center; margin-bottom: 8pt;">
            <h3 style="margin: 0; font-size: 11pt; color: #064e3b;">CAVITE STATE UNIVERSITY - NAIC CAMPUS</h3>
            <p style="margin: 0; font-size: 8pt; color: #475569;">NATIONAL SERVICE TRAINING PROGRAM • OFFICIAL STUDENT ID CARDS (A4)</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin: 0 auto;">
            ${cardsHtml}
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
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      {/* ── Screen UI Container (Hidden on Print) ── */}
      <div className="print:hidden bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black shadow-md">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black leading-tight">Standard Student ID Cards (A4 Fit)</h3>
              <p className="text-xs text-emerald-200 font-medium">Standard elementary/student ID format with Word Document download and A4 print options</p>
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

        {/* Toolbar & Filter Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {/* Search */}
            <div className="relative min-w-[180px] flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student or serial..."
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
                title="Front and Back side-by-side for easy folding and laminating"
              >
                Folding Pair (4 Pairs/A4)
              </button>
              <button
                type="button"
                onClick={() => setPrintLayout('duplex')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  printLayout === 'duplex' ? 'bg-emerald-800 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="8 Fronts on Page 1, 8 Backs on Page 2 for double-sided printers"
              >
                Duplex (8 Fronts / 8 Backs)
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
              disabled={selectedStudentsList.length === 0}
              title="Download standard ID cards in Microsoft Word DOC format"
              className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-black shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-4 h-4 text-blue-200" />
              <span>Download DOCS (.doc)</span>
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

        {/* Preview Scroll Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100/70 space-y-4">
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-bold">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Loading student ID cards...
            </div>
          ) : selectedStudentsList.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 font-medium">
              No students selected for printing. Please select at least one student.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredStudents.map((st) => {
                const isSelected = selectedIds.has(st.id);
                return (
                  <div
                    key={st.id}
                    className={`p-3 rounded-2xl border-2 transition-all bg-white relative flex flex-col items-center gap-2 ${
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
                        <span className="font-black text-xs text-slate-800">
                          {st.name || `${st.firstName || ''} ${st.lastName || ''}`} ({st.studentId})
                        </span>
                      </label>
                      <span className="text-[10px] font-bold text-slate-500 font-mono">
                        {st.nstp_serial_id}
                      </span>
                    </div>

                    {/* Render ID Card Preview */}
                    <div className="scale-90 origin-top transform-gpu">
                      <NstpIdCard student={st} side="both" />
                    </div>
                  </div>
                );
              })}
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
              grid-template-columns: repeat(2, 85.6mm);
              grid-gap: 6mm 10mm;
              justify-content: center;
              align-content: start;
              margin: 0 auto;
              padding: 4mm 0;
            }
            .id-card-front, .id-card-back {
              border: 1px solid #cbd5e1 !important;
              box-shadow: none !important;
              border-radius: 4mm !important;
              page-break-inside: avoid !important;
            }
          }
        `}} />

        {printLayout === 'folding' ? (
          // Folding Mode: 4 Students per page (Front & Back side-by-side)
          Array.from({ length: Math.ceil(selectedStudentsList.length / 4) }).map((_, pageIdx) => {
            const pageStudents = selectedStudentsList.slice(pageIdx * 4, pageIdx * 4 + 4);
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
          // Duplex Mode: 8 Fronts on Page 1, 8 Backs on Page 2
          Array.from({ length: Math.ceil(selectedStudentsList.length / 8) }).map((_, pageIdx) => {
            const pageStudents = selectedStudentsList.slice(pageIdx * 8, pageIdx * 8 + 8);
            return (
              <React.Fragment key={pageIdx}>
                {/* Page Fronts */}
                <div className="a4-print-page">
                  {pageStudents.map((st) => (
                    <div key={`front-${st.id}`} className="flex items-center justify-center">
                      <NstpIdCard student={st} side="front" />
                    </div>
                  ))}
                </div>
                {/* Page Backs */}
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
