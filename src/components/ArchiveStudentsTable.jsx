import { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, Filter } from 'lucide-react';

function toTitleCase(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .trim()
    .toLowerCase()
    .replace(/(?:^|[\s,.\-/()#])([a-zñà-öø-ÿ])/gi, (match) => match.toUpperCase())
    .replace(/\b(ii|iii|iv|vi|vii|viii|ix|x)\b/gi, (roman) => roman.toUpperCase())
    .replace(/\b(jr|sr)\b/gi, (sfx) => sfx.charAt(0).toUpperCase() + sfx.slice(1).toLowerCase());
}

export default function ArchiveStudentsTable({ evaluated = [], emptyMessage = 'No students listed' }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [trackFilter, setTrackFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Available tracks in current data
  const availableTracks = useMemo(() => {
    const set = new Set();
    evaluated.forEach(s => {
      const dept = String(s.department || '').toUpperCase().trim();
      if (dept) set.add(dept);
    });
    return Array.from(set);
  }, [evaluated]);

  // Filtered dataset
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return evaluated.filter(student => {
      // Search match
      if (q) {
        const nameMatch = String(student.name || '').toLowerCase().includes(q);
        const idMatch = String(student.studentId || '').toLowerCase().includes(q);
        const progMatch = String(student.program || '').toLowerCase().includes(q);
        if (!nameMatch && !idMatch && !progMatch) return false;
      }
      // Track match
      if (trackFilter !== 'ALL') {
        const dept = String(student.department || '').toUpperCase().trim();
        if (dept !== trackFilter) return false;
      }
      // Status match
      if (statusFilter !== 'ALL') {
        const ev = student.ev || {};
        if (statusFilter === 'PASSED' && !ev.isPass) return false;
        if (statusFilter === 'FAILED' && !ev.isFail) return false;
        if (statusFilter === 'INC' && !ev.isInc) return false;
        if (statusFilter === 'DRP' && !ev.isDrp) return false;
      }
      return true;
    });
  }, [evaluated, searchQuery, trackFilter, statusFilter]);

  // Pagination calculation
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const activePage = Math.min(currentPage, totalPages);

  const paginated = useMemo(() => {
    const start = (activePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, activePage, pageSize]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleTrackChange = (val) => {
    setTrackFilter(val);
    setCurrentPage(1);
  };

  const handleStatusChange = (val) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };

  // Generate pagination page numbers
  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, activePage - 2);
      let end = Math.min(totalPages, start + maxVisible - 1);
      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
      }
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  }, [totalPages, activePage]);

  if (evaluated.length === 0) {
    return <p className="text-gray-500 text-center py-6 text-xs sm:text-sm">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-3">
      {/* Search, Filter & Page Size Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-gray-50/80 p-2.5 rounded-xl border border-gray-200/80">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search student ID, name, or program..."
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all placeholder:text-gray-400 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters and Page Size Controls */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {/* Track Filter (if multiple tracks exist) */}
          {availableTracks.length > 1 && (
            <select
              value={trackFilter}
              onChange={(e) => handleTrackChange(e.target.value)}
              className="text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="ALL">All Tracks</option>
              {availableTracks.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          )}

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="ALL">All Status</option>
            <option value="PASSED">Passed / Graduated</option>
            <option value="FAILED">Failed</option>
            <option value="INC">Incomplete (INC)</option>
            <option value="DRP">Dropped (DRP)</option>
          </select>

          {/* Page Size Selector */}
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            className="text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            title="Students per page"
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
        </div>
      </div>

      {/* Counter summary */}
      <div className="flex items-center justify-between text-[11px] text-gray-500 px-1 font-semibold">
        <span>
          Showing <span className="font-bold text-gray-800">{totalItems > 0 ? (activePage - 1) * pageSize + 1 : 0}</span> to <span className="font-bold text-gray-800">{Math.min(activePage * pageSize, totalItems)}</span> of <span className="font-bold text-gray-800">{totalItems}</span> students
          {totalItems !== evaluated.length && (
            <span className="text-gray-400 font-normal ml-1">(filtered from {evaluated.length})</span>
          )}
        </span>
        <span>Page {activePage} of {totalPages}</span>
      </div>

      {/* No search matches */}
      {paginated.length === 0 && (
        <div className="text-center py-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
          <p className="text-xs text-gray-500 font-medium">No students match your filter criteria.</p>
          <button
            onClick={() => { setSearchQuery(''); setTrackFilter('ALL'); setStatusFilter('ALL'); setCurrentPage(1); }}
            className="mt-2 text-xs text-emerald-700 font-bold hover:underline"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* MOBILE VIEW: Zero-horizontal-scroll responsive card list */}
      {paginated.length > 0 && (
        <div className="sm:hidden space-y-2.5">
          {paginated.map((student, idx) => {
            const rowNumber = (activePage - 1) * pageSize + idx + 1;
            const dept = String(student.department || '').toUpperCase().trim();
            const prog = String(student.program || '').toUpperCase().trim();
            const ev = student.ev || {};

            return (
              <div
                key={student.id || student.studentId || idx}
                className="bg-white border border-gray-200/90 rounded-xl p-3 shadow-2xs hover:border-emerald-300 transition-all"
              >
                {/* Row Header: Number, Student ID, Track, Grade & Status */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[10px] font-mono font-bold text-gray-400">#{rowNumber}</span>
                    <span className="font-mono font-bold text-xs text-gray-800">{student.studentId}</span>
                    {dept && (
                      <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-black ${
                        dept === 'CWTS' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        dept === 'LTS' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                        dept === 'ROTC' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {dept}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`font-mono font-black text-xs px-2 py-0.5 rounded ${
                      ev.isFail ? 'text-rose-700 bg-rose-50 border border-rose-200' :
                      ev.isInc ? 'text-amber-700 bg-amber-50 border border-amber-200' :
                      ev.isDrp ? 'text-purple-700 bg-purple-50 border border-purple-200' :
                      ev.isPass ? 'text-emerald-800 bg-emerald-50 border border-emerald-200' :
                      'text-gray-600'
                    }`}>
                      {ev.displayGrade || '-'}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black border ${ev.badgeColor || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                      {ev.badgeText || 'ACTIVE'}
                    </span>
                  </div>
                </div>

                {/* Student Full Name & Program (Zero Horizontal Scroll - cleanly wrapped) */}
                <div className="pt-2 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h5 className="font-bold text-gray-900 text-xs sm:text-sm leading-tight break-words">
                      {toTitleCase(student.name)}
                    </h5>
                    <p className="text-[11px] text-gray-500 font-semibold mt-0.5 flex items-center gap-1">
                      <span>Program:</span>
                      <span className="text-gray-700 font-bold uppercase">{prog || 'N/A'}</span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DESKTOP VIEW: Full multi-column data table */}
      {paginated.length > 0 && (
        <div className="hidden sm:block overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-xs">
            <thead className="bg-emerald-950 text-white font-bold">
              <tr>
                <th className="px-3 py-2.5 text-center w-10">#</th>
                <th className="px-3 py-2.5 text-left">Student ID</th>
                <th className="px-3 py-2.5 text-left">Name</th>
                <th className="px-3 py-2.5 text-left">Program</th>
                <th className="px-3 py-2.5 text-center">Track</th>
                <th className="px-3 py-2.5 text-center">Final Grade</th>
                <th className="px-3 py-2.5 text-center">Official Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.map((student, idx) => {
                const rowNumber = (activePage - 1) * pageSize + idx + 1;
                const dept = String(student.department || '').toUpperCase().trim();
                const prog = String(student.program || '').toUpperCase().trim();
                const ev = student.ev || {};

                return (
                  <tr key={student.id || student.studentId || idx} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="px-3 py-2.5 text-center text-gray-400 font-mono text-[11px]">{rowNumber}</td>
                    <td className="px-3 py-2.5 font-mono font-bold text-gray-700">{student.studentId}</td>
                    <td className="px-3 py-2.5 font-semibold text-gray-900">{toTitleCase(student.name)}</td>
                    <td className="px-3 py-2.5 text-gray-600 font-bold">{prog}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-black ${
                        dept === 'CWTS' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        dept === 'LTS' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                        dept === 'ROTC' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {dept}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`font-mono font-black text-xs px-2 py-0.5 rounded ${
                        ev.isFail ? 'text-rose-700 bg-rose-50 border border-rose-200' :
                        ev.isInc ? 'text-amber-700 bg-amber-50 border border-amber-200' :
                        ev.isDrp ? 'text-purple-700 bg-purple-50 border border-purple-200' :
                        ev.isPass ? 'text-emerald-800 bg-emerald-50 border border-emerald-200' :
                        'text-gray-600'
                      }`}>
                        {ev.displayGrade || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10.5px] font-black border ${ev.badgeColor || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                        {ev.badgeText || 'ACTIVE'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-gray-200/80">
          <div className="text-[11px] sm:text-xs text-gray-500 font-medium text-center sm:text-left">
            Page <span className="font-bold text-gray-800">{activePage}</span> of <span className="font-bold text-gray-800">{totalPages}</span> ({totalItems} total records)
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={activePage === 1}
              className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="First Page"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={activePage === 1}
              className="px-2.5 py-1 text-xs rounded-lg border border-gray-200 bg-white hover:bg-gray-50 font-bold text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            {/* Page number buttons */}
            <div className="flex items-center gap-1">
              {pageNumbers[0] > 1 && (
                <>
                  <button
                    onClick={() => setCurrentPage(1)}
                    className="w-7 h-7 text-xs rounded-lg border border-gray-200 bg-white hover:bg-gray-50 font-bold text-gray-700"
                  >
                    1
                  </button>
                  {pageNumbers[0] > 2 && <span className="text-gray-400 px-0.5 text-xs">...</span>}
                </>
              )}

              {pageNumbers.map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 text-xs rounded-lg font-black transition-colors ${
                    page === activePage
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {page}
                </button>
              ))}

              {pageNumbers[pageNumbers.length - 1] < totalPages && (
                <>
                  {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && <span className="text-gray-400 px-0.5 text-xs">...</span>}
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className="w-7 h-7 text-xs rounded-lg border border-gray-200 bg-white hover:bg-gray-50 font-bold text-gray-700"
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={activePage === totalPages}
              className="px-2.5 py-1 text-xs rounded-lg border border-gray-200 bg-white hover:bg-gray-50 font-bold text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={activePage === totalPages}
              className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Last Page"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
