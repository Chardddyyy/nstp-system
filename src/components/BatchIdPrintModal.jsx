import React, { useState, useEffect } from 'react';
import { X, Printer, CheckSquare, Square, Search, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { attendanceAPI } from '../services/api';
import NstpIdCard from './NstpIdCard';
import { formatGradeAndSection } from '../utils/gradeSection';

export function BatchIdPrintModal({ isOpen, onClose, defaultDepartment = 'All' }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [departmentFilter, setDepartmentFilter] = useState(defaultDepartment);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Strictly 5 IDs per page

  useEffect(() => {
    if (!isOpen) return;
    let isSubscribed = true;
    
    // Asynchronously fetch cards
    (async () => {
      setLoading(true);
      try {
        const data = await attendanceAPI.getStudentIdCards({ department: departmentFilter });
        if (!isSubscribed) return;
        const list = Array.isArray(data) ? data : [];
        setStudents(list);
        setSelectedIds(new Set(list.map(s => s.id)));
      } catch (err) {
        if (isSubscribed) console.error('Failed to load students for ID print:', err);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    })();

    return () => {
      isSubscribed = false;
    };
  }, [isOpen, departmentFilter]);

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

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-1.5 sm:p-4 select-none">
      <div className="print:hidden bg-white rounded-2xl sm:rounded-3xl max-w-6xl w-full flex flex-col shadow-2xl border border-slate-200 overflow-hidden max-h-[96vh] sm:max-h-[92vh] animate-slide-up">
        
        {/* Header */}
        <div className="p-3 sm:p-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black shadow-md shrink-0">
              <Printer className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-base font-black leading-tight truncate">Student NSTP ID Cards</h3>
              <p className="text-[10px] sm:text-[11px] text-emerald-200 font-medium truncate">Standard Vertical Portrait ID format fitted on A4 Paper</p>
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

        {/* Filter Toolbar */}
        <div className="p-2 sm:px-3.5 sm:py-2.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shrink-0">
          {/* Search form and Department filter */}
          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:flex-1 sm:min-w-0">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-1.5 min-w-0">
              <div className="relative flex-1 min-w-0">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  id="batch-id-search-input"
                  name="batchIdSearch"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setSearchQuery(e.target.value);
                  }}
                  placeholder="Search student..."
                  className="w-full pl-8 pr-7 py-1.5 bg-white rounded-lg sm:rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
                className="px-2.5 sm:px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg sm:rounded-xl font-black text-[10.5px] sm:text-xs shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
              >
                Search
              </button>
            </form>

            <select
              id="batch-id-dept-filter"
              name="batchIdDeptFilter"
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2 sm:px-2.5 py-1.5 bg-white rounded-lg sm:rounded-xl border border-slate-200 font-bold text-slate-700 focus:outline-none cursor-pointer text-xs shrink-0"
            >
              <option value="All">All Tracks</option>
              <option value="CWTS">CWTS</option>
              <option value="ROTC">ROTC</option>
              <option value="LTS">LTS</option>
            </select>
          </div>

          {/* Action Buttons: Select/Deselect All & Print A4 */}
          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex-1 sm:flex-initial justify-center px-2 sm:px-3 py-1.5 rounded-lg sm:rounded-xl bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer text-[10.5px] sm:text-xs"
            >
              {selectedIds.size === filteredStudents.length ? <CheckSquare className="w-3.5 h-3.5 text-emerald-700" /> : <Square className="w-3.5 h-3.5 text-slate-400" />}
              <span>{selectedIds.size === filteredStudents.length ? 'Deselect All' : 'Select All'} ({selectedIds.size})</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={selectedStudentsList.length === 0}
              className="flex-1 sm:flex-initial justify-center px-2.5 sm:px-3.5 py-1.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-emerald-950 font-black shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 text-[10.5px] sm:text-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4</span>
            </button>
          </div>
        </div>

        {/* Card Grid Area (5 IDs per page) - Fully Scrollable on Mobile */}
        <div className="p-2.5 sm:p-4 flex-1 bg-slate-100/70 overflow-y-auto min-h-0">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3 items-center justify-center">
              {paginatedStudents.map((st) => {
                const isSelected = selectedIds.has(st.id);
                const sectionLabel = st.section 
                  ? (st.section.toLowerCase().startsWith('section') ? st.section : `Section ${st.section}`) 
                  : formatGradeAndSection(st);
                return (
                  <div
                    key={st.id}
                    className={`p-2 rounded-2xl border-2 transition-all bg-white relative flex flex-col items-center gap-1 max-w-[280px] sm:max-w-none mx-auto w-full ${
                      isSelected ? 'border-emerald-600 shadow-sm ring-1 ring-emerald-500/30' : 'border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="w-full flex items-center justify-between pb-1 border-b border-slate-100">
                      <label htmlFor={`batch-select-student-${st.id}`} className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          id={`batch-select-student-${st.id}`}
                          name={`batchSelectStudent_${st.id}`}
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
        </div>

        {/* Pinned Pagination Footer */}
        {filteredStudents.length > 0 && (
          <div className="p-2 sm:px-4 sm:py-2.5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-2 text-xs shrink-0">
            <div className="flex items-center gap-2 text-slate-500 font-medium text-[10.5px] sm:text-[11px]">
              <span>
                Showing <b className="text-slate-800 font-bold">{startIndex + 1}</b> to{' '}
                <b className="text-slate-800 font-bold">{Math.min(endIndex, filteredStudents.length)}</b> of{' '}
                <b className="text-slate-800 font-bold">{filteredStudents.length}</b> students (5 IDs/page)
              </span>
            </div>

            {/* Page Number Buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="px-2 py-1 rounded-lg sm:rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer text-[10.5px] sm:text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-xs">Prev</span>
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
                        className={`w-6 h-6 rounded-md sm:rounded-xl text-xs font-black transition-colors cursor-pointer ${
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
                className="px-2 py-1 rounded-lg sm:rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer text-[10.5px] sm:text-xs"
              >
                <span className="hidden sm:inline text-xs">Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
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
