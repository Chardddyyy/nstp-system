import { useAuth } from '../context/AuthContext';
import ScrollToTopButton from '../components/ScrollToTopButton';
import {
  FileText, Plus, Search, Calendar,
  Send, MessageCircle, CheckCircle, Clock,
  Trash2, Upload, File, X, Menu, Archive, RotateCcw, AlertCircle, User, Pencil
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { useState, useRef, useMemo, useEffect } from 'react';

function Reports() {
  const { user, logout, reports, addReport, updateReport, deleteReport, submitReport, addReportComment, viewingArchive, archiveViewData, setViewingArchive, setArchiveViewData } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const isInstructor = user?.role === 'instructor';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDept, setFilterDept] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [notification, setNotification] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  
  // Refs for file inputs
  const fileInputRef = useRef(null);
  
  // Admin creates report assignment
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    department: 'All',
    dueDate: '',
    referenceFile: null
  });

  // Instructor submits report
  const [submitForm, setSubmitForm] = useState({
    content: '',
    attachment: null
  });

  const submitFileRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [isCreatingReport, setIsCreatingReport] = useState(false);
  const [editingReport, setEditingReport] = useState(null);

  const openEditModal = (report) => {
    setEditingReport(report);
    setCreateForm({
      title: report.title || '',
      description: report.description || '',
      department: report.department || 'All',
      dueDate: report.dueDate || report.due_date || '',
      referenceFile: (report.reference_file_data || report.referenceFile?.data)
        ? { name: report.reference_file_name || report.referenceFile?.name || 'Reference File', data: report.reference_file_data || report.referenceFile?.data }
        : null
    });
    setShowCreateModal(true);
  };

  const handleOpenCreateModal = () => {
    setEditingReport(null);
    setCreateForm({ title: '', description: '', department: 'All', dueDate: '', referenceFile: null });
    setShowCreateModal(true);
  };

  const getTodayLocalStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Admin creates or updates a report assignment for instructors
  const handleSaveReport = async () => {
    if (createForm.dueDate) {
      const todayStr = getTodayLocalStr();
      if (createForm.dueDate < todayStr) {
        setNotification({ type: 'error', message: 'Due date cannot be in the past. Please select today or a future date.' });
        setTimeout(() => setNotification(null), 1000);
        return;
      }
    }

    const reportData = {
      title: createForm.title,
      description: createForm.description,
      department: createForm.department,
      due_date: createForm.dueDate,
      dueDate: createForm.dueDate,
      createdBy: editingReport ? editingReport.createdBy : user?.name,
      createdAt: editingReport ? editingReport.createdAt : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: editingReport ? editingReport.status : 'Draft',
      referenceFile: createForm.referenceFile,
      reference_file_data: createForm.referenceFile?.data || null,
      reference_file_name: createForm.referenceFile?.name || null,
    };

    setIsCreatingReport(true);
    try {
      if (editingReport) {
        await updateReport(editingReport.id, reportData);
        setNotification({ type: 'success', message: 'Report assignment updated!' });
      } else {
        await addReport(reportData);
        setNotification({ type: 'success', message: 'Report assignment created!' });
      }
      setShowCreateModal(false);
      setEditingReport(null);
      setCurrentPage(1);
      setCreateForm({ title: '', description: '', department: 'All', dueDate: '', referenceFile: null });
      setTimeout(() => setNotification(null), 1000);
    } catch (_error) {
      setNotification({ type: 'error', message: _error?.message || 'Failed to save report assignment. Please try again.' });
      setTimeout(() => setNotification(null), 1000);
    } finally {
      setIsCreatingReport(false);
    }
  };

  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Instructor submits their report
  const handleSubmitReport = async () => {
    if (!submitForm.content.trim() && !submitForm.attachment) {
      setNotification({ type: 'error', message: 'Please enter report content or attach a file!' });
      setTimeout(() => setNotification(null), 1000);
      return;
    }

    const submission = {
      instructor: user?.name,
      department: user?.department,
      content: submitForm.content,
      submittedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Submitted',
      attachment: submitForm.attachment
    };

    setIsSubmittingReport(true);
    try {
      await submitReport(selectedReport.id, submission);
      setShowSubmitModal(false);
      setSubmitForm({ content: '', attachment: null });
      setSelectedReport(null);
      setNotification({ type: 'success', message: 'Report submitted successfully!' });
      setTimeout(() => setNotification(null), 1000);
    } catch (_error) {
      setNotification({ type: 'error', message: 'Failed to submit report. Please try again.' });
      setTimeout(() => setNotification(null), 1000);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Handle file selection for admin reference
  const handleReferenceFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setCreateForm(prev => ({ ...prev, referenceFile: { name: file.name, size: file.size, type: file.type, data: evt.target.result } }));
    };
    reader.readAsDataURL(file);
  };

  // Handle file selection for instructor submission — read as base64 so it can be saved
  const handleAttachmentChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setSubmitForm(prev => ({ ...prev, attachment: { name: file.name, size: file.size, type: file.type, data: evt.target.result } }));
    };
    reader.readAsDataURL(file);
  };

  // Add comment/reply
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const text = newComment.trim();
    setNewComment('');
    try {
      const saved = await addReportComment(selectedReport.id, { text });
      setSelectedReport(prev => ({
        ...prev,
        comments: [...(prev.comments || []), saved]
      }));
    } catch {
      setNotification({ type: 'error', message: 'Failed to post comment.' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Admin deletes report assignment
  const handleDeleteReport = (reportId) => {
    if (confirm('Are you sure you want to delete this report assignment?')) {
      deleteReport(reportId);
      setNotification({ type: 'success', message: 'Report assignment deleted!' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Check if instructor already submitted
  const hasSubmitted = (report) => {
    return (report.submissions || []).some(s => (s.instructor_name || s.instructor) === user?.name);
  };

  // Use archived report data when in archive view, otherwise live data
  const sourceReports = viewingArchive && archiveViewData?.reportData
    ? archiveViewData.reportData
    : reports;

  // Filter reports - instructors see only their department assignments - memoized for performance
  const filteredReports = useMemo(() => sourceReports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || report.status === filterStatus;
    const matchesDept = filterDept === 'All' || report.department === 'All' || report.department === filterDept;
    
    // Instructors only see reports for their department
    if (isInstructor && user?.department) {
      const assignedToMe = report.department === 'All' || report.department === user.department;
      return matchesSearch && matchesStatus && matchesDept && assignedToMe;
    }
    
    // Students don't see submit buttons (read-only if needed)
    if (user?.role === 'student') {
      return false; // Students don't access this page or see reports
    }
    
    return matchesSearch && matchesStatus && matchesDept;
  }), [sourceReports, searchTerm, filterStatus, filterDept, isInstructor, user]);

  // Pagination logic
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const indexOfLastReport = currentPage * itemsPerPage;
  const indexOfFirstReport = indexOfLastReport - itemsPerPage;
  const currentReports = filteredReports.slice(indexOfFirstReport, indexOfLastReport);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterDept]);

  const openViewModal = (report) => {
    setSelectedReport(report);
    setShowViewModal(true);
  };

  const openSubmitModal = (report) => {
    setSelectedReport(report);
    setSubmitForm({ content: '', attachment: null });
    setShowSubmitModal(true);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Reviewed': return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'Submitted': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'Pending': return 'bg-amber-100 text-amber-700 border border-amber-200';
      default: return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  const getDeptColor = (dept) => {
    switch(dept) {
      case 'ROTC': return 'bg-red-100 text-red-700';
      case 'LTS': return 'bg-purple-100 text-purple-700';
      case 'CWTS': return 'bg-green-100 text-green-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/40 via-emerald-50/20 to-slate-50 page-enter">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        user={user}
        archiveMode={viewingArchive}
      />

      {/* Main Content */}
      <main className={`transition-all duration-300 p-3 sm:p-6 lg:p-8 ${sidebarOpen ? 'lg:ml-64' : ''}`}>
        {/* Archive Banner */}
        {viewingArchive && archiveViewData && (
          <div className="bg-amber-500/10 border border-amber-400/30 rounded-3xl p-4 sm:p-5 mb-6 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Archive className="w-6 h-6 text-amber-600 shrink-0" />
              <div>
                <h2 className="text-base font-black text-amber-900">Previous Report — Batch {archiveViewData.year}</h2>
                <p className="text-xs text-amber-700 font-medium">Viewing archived batch data. Editing is disabled.</p>
              </div>
            </div>
            <button type="button"
              onClick={() => { setViewingArchive(false); setArchiveViewData(null); }}
              className="bg-amber-500 hover:bg-amber-600 text-emerald-950 px-4 py-2 rounded-2xl text-xs font-black transition-all shadow-md flex items-center space-x-2 shrink-0 active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Back to Current</span>
            </button>
          </div>
        )}

        {/* Centered notification */}
        {notification && (
          <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none p-4">
            <div className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-white text-xs font-bold max-w-xs w-auto border border-white/20 animate-fade-in ${notification.type === 'success' ? 'bg-emerald-700' : 'bg-rose-700'}`}>
              {notification.type === 'success'
                ? <CheckCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
                : <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />}
              <span className="flex-1 font-bold">{notification.message}</span>
              <button type="button" onClick={() => setNotification(null)} className="text-white/80 hover:text-white flex-shrink-0 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Hero Header Card - Unified CvSU Naic Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 shadow-xl border border-emerald-800/40 relative mb-4 sm:mb-6 w-full">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative z-10 w-full">
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1 w-full">
              <button type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2.5 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-200 hover:text-white rounded-xl shrink-0 transition-colors cursor-pointer"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl sm:rounded-2xl p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-md border border-emerald-700">
                <img src={`${import.meta.env.BASE_URL}cvsu.png`} alt="CvSU Logo" className="w-full h-full object-contain" />
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-black tracking-tight text-white truncate">
                  {isAdmin ? 'Report Assignments' : 'My Reports'}
                </h1>
                <p className="text-emerald-200 text-xs sm:text-base font-medium truncate mt-0.5">
                  {isAdmin ? 'Create & manage report submission requirements for instructors' : 'Submit and monitor required department report files'}
                </p>
              </div>
            </div>
            {isAdmin && !viewingArchive && (
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="flex items-center space-x-2 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-emerald-950 font-black px-5 py-3 rounded-xl sm:rounded-2xl transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 w-full sm:w-auto justify-center cursor-pointer text-xs sm:text-sm shrink-0"
              >
                <Plus className="w-4 h-4 text-emerald-950" />
                <span>Create Assignment</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters - Side-by-Side Mobile Layout */}
        <div className="bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-md mb-4 sm:mb-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  id="report-search"
                  name="reportSearch"
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoComplete="off"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2">
              {isAdmin && (
                <select
                  id="filter-dept"
                  name="filterDept"
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-medium bg-white"
                >
                  <option value="All">All Depts</option>
                  <option value="CWTS">CWTS</option>
                  <option value="LTS">LTS</option>
                  <option value="ROTC">ROTC</option>
                </select>
              )}
              <select
                id="filter-status"
                name="filterStatus"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-2.5 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-medium bg-white"
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Submitted">Submitted</option>
                <option value="Reviewed">Reviewed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reports List - Compact Mobile Card Styling */}
        <div className="space-y-3 sm:space-y-4">
          {currentReports.map((report) => (
            <div key={report.id} className="bg-white rounded-xl shadow-md p-3 sm:p-5 card-interactive" onClick={() => openViewModal(report)}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                    <h3 className="text-sm sm:text-lg font-bold text-gray-800 leading-snug truncate">{report.title}</h3>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] sm:text-sm font-semibold ${getStatusColor(report.status)}`}>
                      {report.status}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-medium ${getDeptColor(report.department)}`}>
                      {report.department === 'All' ? 'All Depts' : report.department}
                    </span>
                  </div>
                  <p className="text-gray-600 text-xs sm:text-sm mb-2 line-clamp-2">{report.description}</p>
                  <div className="flex flex-wrap items-center text-[10px] sm:text-sm text-gray-500 gap-x-3 gap-y-1">
                    <span className="flex items-center">
                      <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 shrink-0" />
                      By: {report.createdBy}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 shrink-0" />
                      {report.createdAt}
                    </span>
                    {report.dueDate && (
                      <span className="flex items-center px-1.5 py-0.5 bg-red-50 text-red-700 rounded text-[10px] font-medium">
                        <Clock className="w-3 h-3 mr-1 shrink-0" />
                        Due: {report.dueDate}
                      </span>
                    )}
                    <span className="flex items-center">
                      <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 shrink-0" />
                      {(report.comments || []).length} replies
                    </span>
                    {(report.reference_file_data || report.reference_file_name || report.referenceFile) && (
                      <span className="flex items-center px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-medium">
                        <File className="w-3 h-3 mr-1 shrink-0" />
                        Ref attached
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {/* Only instructors can submit reports */}
                  {isInstructor && !viewingArchive && !hasSubmitted(report) && (
                    <button type="button"
                      
                      onClick={(e) => { e.stopPropagation(); openSubmitModal(report); }}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                    >
                      Submit
                    </button>
                  )}
                  {isInstructor && hasSubmitted(report) && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm">
                      {user?.name}
                    </span>
                  )}
                  {isAdmin && !viewingArchive && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); openEditModal(report); }}
                        className="p-2 text-emerald-700 hover:bg-emerald-100/80 rounded-xl transition-colors cursor-pointer"
                        title="Edit Report Assignment"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDeleteReport(report.id); }}
                        className="p-2 text-red-600 hover:bg-red-100/80 rounded-xl transition-colors cursor-pointer"
                        title="Delete Report Assignment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {isAdmin && (report.submissions || []).length > 0 && (
                <div className="mt-4 bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Submissions: {report.submissions.length}</p>
                  <div className="flex flex-wrap gap-2">
                    {report.submissions.map((sub, idx) => (
                      <span key={idx} className={`px-2 py-1 rounded text-xs ${getDeptColor(sub.department)}`}>
                        {sub.department}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(report.comments || []).length > 0 && (
                <div className="mt-4 bg-blue-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{report.comments[report.comments.length - 1].user}:</span>
                    {' '}{report.comments[report.comments.length - 1].text}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {currentReports.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">
              {isAdmin ? 'No report assignments created yet.' : isInstructor ? 'No report assignments for your department.' : 'No reports available.'}
            </p>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-6">
            <button type="button"
              
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button type="button"
              
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}

        {/* Create / Edit Report Assignment Modal (Admin) */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-emerald-950/75 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowCreateModal(false)}>
            <div 
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-emerald-100/80 overflow-hidden" 
              onClick={(e) => e.stopPropagation()} 
              onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') e.preventDefault(); if (e.key === 'Tab') { const f = Array.from(e.currentTarget.querySelectorAll('button:not([disabled]), input, select, textarea')); if (!f.length) return; if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length-1].focus(); } else if (!e.shiftKey && document.activeElement === f[f.length-1]) { e.preventDefault(); f[0].focus(); } } }}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-900 via-emerald-850 to-teal-900 text-white p-5 sm:p-6 flex items-center justify-between shadow-sm shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black tracking-tight">
                      {editingReport ? 'Edit Report Assignment' : 'Create Report Assignment'}
                    </h3>
                    <p className="text-emerald-200 text-xs font-medium">
                      {editingReport ? 'Update assignment details & reference file for instructors' : 'Set up a new report request for NSTP instructors'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 rounded-full bg-emerald-800/80 hover:bg-emerald-700 flex items-center justify-center text-emerald-200 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body */}
              <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Report Title *</label>
                  <input
                    type="text"
                    value={createForm.title}
                    onChange={(e) => setCreateForm({...createForm, title: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                    placeholder="e.g., Activity Schedule - March 2024"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Description / Instructions *</label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none h-32 resize-none font-medium"
                    placeholder="Describe what instructors need to submit (e.g., Activity Schedule, DTR, Grading Sheet, Attendance, etc.)"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Assign To Department</label>
                    <select
                      value={createForm.department}
                      onChange={(e) => setCreateForm({...createForm, department: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                    >
                      <option value="All">All Departments</option>
                      <option value="CWTS">CWTS Only</option>
                      <option value="LTS">LTS Only</option>
                      <option value="ROTC">ROTC Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Due Date</label>
                    <input
                      type="date"
                      min={getTodayLocalStr()}
                      value={createForm.dueDate}
                      onChange={(e) => setCreateForm({...createForm, dueDate: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                    />
                  </div>
                </div>

                {/* Reference File Upload */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Reference File (Optional)</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleReferenceFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  />
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-emerald-700" />
                      <span>{createForm.referenceFile ? 'Change Reference File' : 'Upload Reference File'}</span>
                    </button>
                    {createForm.referenceFile && (
                      <div className="flex items-center gap-2 bg-emerald-100/70 border border-emerald-200 px-3 py-1.5 rounded-xl text-emerald-950 font-bold text-xs">
                        <File className="w-4 h-4 text-emerald-700" />
                        <span className="truncate max-w-[200px]">{createForm.referenceFile.name}</span>
                        <button
                          type="button"
                          onClick={() => setCreateForm({...createForm, referenceFile: null})}
                          className="text-emerald-700 hover:text-red-600 ml-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1.5">Attach optional reference material or instructions (PDF, Word, Excel, PowerPoint)</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 text-gray-600 hover:bg-gray-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveReport}
                  disabled={!createForm.title.trim() || !createForm.description.trim() || isCreatingReport}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-emerald-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isCreatingReport ? (editingReport ? 'Saving Changes...' : 'Creating...') : (editingReport ? 'Update Assignment' : 'Create Assignment')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Submit Report Modal (Instructor) */}
        {showSubmitModal && selectedReport && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowSubmitModal(false)}>
            <div className="bg-white rounded-xl p-3 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') e.preventDefault(); if (e.key === 'Tab') { const f = Array.from(e.currentTarget.querySelectorAll('button:not([disabled]), input, select, textarea')); if (!f.length) return; if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length-1].focus(); } else if (!e.shiftKey && document.activeElement === f[f.length-1]) { e.preventDefault(); f[0].focus(); } } }}>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Submit Report</h3>
              <p className="text-gray-600 mb-4">{selectedReport.title}</p>
              
              <div className="bg-yellow-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700"><span className="font-medium">Instructions:</span> {selectedReport.description}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Report Content</label>
                  <textarea
                    value={submitForm.content}
                    onChange={(e) => setSubmitForm({...submitForm, content: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none h-32 resize-none"
                    placeholder="Enter your report details here..."
                  />
                </div>

                {/* Attachment Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Attach File (Optional)</label>
                  <input
                    type="file"
                    ref={submitFileRef}
                    onChange={handleAttachmentChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
                  />
                  <div className="flex items-center space-x-2">
                    <button type="button"
                      
                      onClick={() => submitFileRef.current?.click()}
                      className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Upload className="w-5 h-5 text-gray-500" />
                      <span className="text-sm text-gray-700">Attach File</span>
                    </button>
                    {submitForm.attachment && (
                      <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-lg">
                        <File className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-700 truncate max-w-[200px]">{submitForm.attachment.name}</span>
                        <button type="button"
                          
                          onClick={() => setSubmitForm({...submitForm, attachment: null})}
                          className="text-green-600 hover:text-green-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Attach supporting documents or images (PDF, Word, Excel, Images)</p>
                </div>

                {/* Show admin reference file if exists — check both DB fields and in-memory object */}
                {(selectedReport.reference_file_data || selectedReport.referenceFile?.data) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-800 mb-2">Admin Reference File:</p>
                    <div className="flex items-center space-x-2">
                      <File className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span className="text-sm text-blue-700 truncate flex-1">
                        {selectedReport.reference_file_name || selectedReport.referenceFile?.name}
                      </span>
                      <a
                        href={selectedReport.reference_file_data || selectedReport.referenceFile?.data}
                        download={selectedReport.reference_file_name || selectedReport.referenceFile?.name || 'reference-file'}
                        className="text-xs text-blue-600 hover:text-blue-800 underline whitespace-nowrap flex-shrink-0"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button"
                  
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button type="button"
                  
                  onClick={handleSubmitReport}
                  disabled={isSubmittingReport}
                  className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg transition-colors disabled:opacity-60 disabled:cursor-wait"
                >
                  {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Report Modal with Comments/Replies */}
        {showViewModal && selectedReport && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowViewModal(false)}>
            <div className="bg-white rounded-xl p-3 sm:p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto overscroll-contain animate-slide-up" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{selectedReport.title}</h3>
                  <p className="text-sm text-gray-500">Created by {selectedReport.createdBy}</p>
                </div>
                <button type="button"
                  
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-gray-700 mb-2"><span className="font-medium">Instructions:</span> {selectedReport.description}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className={`px-2 py-1 rounded ${getDeptColor(selectedReport.department)}`}>
                    {selectedReport.department === 'All' ? 'All Departments' : selectedReport.department}
                  </span>
                  <span className={`px-2 py-1 rounded ${getStatusColor(selectedReport.status)}`}>
                    {selectedReport.status}
                  </span>
                </div>
              </div>

              {(selectedReport.reference_file_data || selectedReport.referenceFile?.data) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center space-x-3">
                  <File className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-800">Admin Reference File</p>
                    <p className="text-xs text-blue-600 truncate">{selectedReport.reference_file_name || selectedReport.referenceFile?.name}</p>
                  </div>
                  <a
                    href={selectedReport.reference_file_data || selectedReport.referenceFile?.data}
                    download={selectedReport.reference_file_name || selectedReport.referenceFile?.name || 'reference-file'}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors flex-shrink-0"
                  >
                    Download
                  </a>
                </div>
              )}

              {selectedReport.submissions.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-800 mb-3">Submissions ({selectedReport.submissions.length})</h4>
                  <div className="space-y-3">
                    {selectedReport.submissions.map((sub, idx) => (
                      <div key={idx} className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-800">{sub.instructor_name || sub.instructor}</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${getDeptColor(sub.department)}`}>{sub.department}</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {sub.submitted_at
                              ? new Date(sub.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                              : sub.submittedAt}
                          </span>
                        </div>
                        {sub.content && <p className="text-gray-700 whitespace-pre-wrap">{sub.content}</p>}
                        {(sub.file_data || sub.attachment?.data) && (
                          <a
                            href={sub.file_data || sub.attachment?.data}
                            download={sub.file_name || sub.attachment?.name || 'attachment'}
                            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition-colors"
                          >
                            📎 {sub.file_name || sub.attachment?.name || 'Download attachment'}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-800 mb-4 flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Replies & Comments ({(selectedReport.comments || []).length})
                </h4>
                
                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                  {(selectedReport.comments || []).map((comment) => (
                    <div key={comment.id} className={`rounded-lg p-3 ${comment.role === 'admin' ? 'bg-blue-50' : 'bg-gray-50'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm text-gray-800">{comment.user_name || comment.user}</span>
                          <span className="text-xs text-gray-500">({comment.role === 'admin' ? 'Admin' : (comment.department || '')})</span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {comment.created_at
                            ? new Date(comment.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                            : comment.time}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{comment.text}</p>
                    </div>
                  ))}
                  {(selectedReport.comments || []).length === 0 && (
                    <p className="text-gray-500 text-sm italic">No replies yet.</p>
                  )}
                </div>

                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Type your reply..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddComment(); } }}
                  />
                  <button type="button"
                    
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
      <ScrollToTopButton />
    </div>
  );
}

export default Reports;
