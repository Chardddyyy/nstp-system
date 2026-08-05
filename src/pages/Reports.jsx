import { useAuth } from '../context/AuthContext';
import ScrollToTopButton from '../components/ScrollToTopButton';
import {
  FileText, Plus, Search, Calendar,
  Send, MessageCircle, CheckCircle, Clock,
  Trash2, Upload, File, X, Menu, Archive, RotateCcw, AlertCircle, User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { useState, useRef, useMemo, useEffect } from 'react';

function Reports() {
  const { user, logout, reports, addReport, deleteReport, submitReport, addReportComment, viewingArchive, archiveViewData, setViewingArchive, setArchiveViewData } = useAuth();
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

  // Report templates for instructors
  const reportTemplates = [
    { 
      title: 'Activity Schedule', 
      description: 'Submit monthly/weekly activity schedule for NSTP component activities. Include dates, venues, and expected participants.' 
    },
    { 
      title: 'Daily Time Report (DTR)', 
      description: 'Submit Daily Time Report for NSTP instructors. Include time in/out and activities conducted.' 
    },
    { 
      title: 'Grading Sheet', 
      description: 'Submit student grading sheet for the semester. Include student names, scores, and final grades.' 
    },
    { 
      title: 'Attendance Report', 
      description: 'Submit student attendance report for NSTP sessions. Include dates and attendance status.' 
    },
    { 
      title: 'Activity Documentation', 
      description: 'Submit documentation of conducted NSTP activities. Include photos, narratives, and attendance.' 
    },
    { 
      title: 'Progress Report', 
      description: 'Submit monthly progress report on NSTP program implementation and student development.' 
    },
    { 
      title: 'Other Documents', 
      description: 'Submit other required NSTP-related documents as specified by the NSTP Office.' 
    }
  ];
  const submitFileRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [isCreatingReport, setIsCreatingReport] = useState(false);

  // Admin creates a report assignment for instructors
  const handleCreateReport = async () => {
    const newReport = {
      title: createForm.title,
      description: createForm.description,
      department: createForm.department,
      due_date: createForm.dueDate,
      createdBy: user?.name,
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Draft',
      referenceFile: createForm.referenceFile,
      reference_file_data: createForm.referenceFile?.data || null,
      reference_file_name: createForm.referenceFile?.name || null,
    };

    setIsCreatingReport(true);
    try {
      await addReport(newReport);
      setShowCreateModal(false);
      setCurrentPage(1);
      setCreateForm({ title: '', description: '', department: 'All', dueDate: '', referenceFile: null });
      setNotification({ type: 'success', message: 'Report assignment created!' });
      setTimeout(() => setNotification(null), 3000);
    } catch (_error) {
      setNotification({ type: 'error', message: 'Failed to create report. Please try again.' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsCreatingReport(false);
    }
  };

  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Instructor submits their report
  const handleSubmitReport = async () => {
    if (!submitForm.content.trim() && !submitForm.attachment) {
      setNotification({ type: 'error', message: 'Please enter report content or attach a file!' });
      setTimeout(() => setNotification(null), 3000);
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
      setTimeout(() => setNotification(null), 3000);
    } catch (_error) {
      setNotification({ type: 'error', message: 'Failed to submit report. Please try again.' });
      setTimeout(() => setNotification(null), 3000);
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
    <div className="min-h-screen bg-gray-50 page-enter">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        user={user}
        archiveMode={viewingArchive}
      />

      {/* Main Content */}
      <main className={`transition-all duration-300 p-2 sm:p-4 lg:p-6 ${sidebarOpen ? 'lg:ml-64' : ''}`}>
        {/* Archive Banner */}
        {viewingArchive && archiveViewData && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Archive className="w-6 h-6 text-amber-600 shrink-0" />
              <div>
                <h2 className="text-base font-bold text-amber-800">Previous Report — Batch {archiveViewData.year}</h2>
                <p className="text-sm text-amber-600">Viewing archived data. Editing is disabled.</p>
              </div>
            </div>
            <button type="button"
              
              onClick={() => { setViewingArchive(false); setArchiveViewData(null); }}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Back to Current</span>
            </button>
          </div>
        )}

        {/* Centered notification */}
        {notification && (
          <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none">
            <div className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white text-sm font-medium max-w-sm w-full mx-4 ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
              {notification.type === 'success'
                ? <CheckCircle className="w-5 h-5 flex-shrink-0" />
                : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
              <span className="flex-1">{notification.message}</span>
              <button type="button" onClick={() => setNotification(null)} className="text-white/80 hover:text-white flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-5 gap-4">
          <div className="flex items-start gap-2">
            <button type="button"
              
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-200 rounded-lg shrink-0"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">
                {isAdmin ? 'Report Assignments' : 'My Reports'}
              </h2>
              <p className="text-gray-600">
                {isAdmin ? 'Create report assignments for instructors' : 'View and submit your assigned reports'}
              </p>
            </div>
          </div>
          {isAdmin && !viewingArchive && (
            <button type="button"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-emerald-700 to-green-700 hover:from-emerald-800 hover:to-green-800 text-white font-bold px-4.5 py-2.5 rounded-xl transition-all duration-200 shadow-md shadow-emerald-900/20 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 w-full sm:w-auto justify-center"
            >
              <Plus className="w-5 h-5" />
              <span>Create Assignment</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-md mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  id="report-search"
                  name="reportSearch"
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoComplete="off"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
            </div>
            {isAdmin && (
              <select
                id="filter-dept"
                name="filterDept"
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="All">All Departments</option>
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Submitted">Submitted</option>
              <option value="Reviewed">Reviewed</option>
            </select>
          </div>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {currentReports.map((report) => (
            <div key={report.id} className="bg-white rounded-xl shadow-md p-3 sm:p-5 card-interactive" onClick={() => openViewModal(report)}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-gray-800">{report.title}</h3>
                    <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${getStatusColor(report.status)}`}>
                      {report.status}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getDeptColor(report.department)}`}>
                      {report.department === 'All' ? 'All Depts' : report.department}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">{report.description}</p>
                  <div className="flex flex-wrap items-center text-sm text-gray-500 gap-x-4 gap-y-1">
                    <span className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      Created by: {report.createdBy}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {report.createdAt}
                    </span>
                    {report.dueDate && (
                    <span className="flex items-center px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-medium">
                      <Clock className="w-3 h-3 mr-1" />
                      Due: {report.dueDate}
                    </span>
                    )}
                    <span className="flex items-center">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      {(report.comments || []).length} replies
                    </span>
                    {(report.reference_file_data || report.reference_file_name || report.referenceFile) && (
                      <span className="flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                        <File className="w-3 h-3 mr-1" />
                        Reference file attached
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
                    <button type="button"
                      
                      onClick={(e) => { e.stopPropagation(); handleDeleteReport(report.id); }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
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

        {currentReports.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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

        {/* Create Report Assignment Modal (Admin) */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowCreateModal(false)}>
            <div className="bg-white rounded-xl p-3 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') e.preventDefault(); if (e.key === 'Tab') { const f = Array.from(e.currentTarget.querySelectorAll('button:not([disabled]), input, select, textarea')); if (!f.length) return; if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length-1].focus(); } else if (!e.shiftKey && document.activeElement === f[f.length-1]) { e.preventDefault(); f[0].focus(); } } }}>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Create Report Assignment</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Report Template (Optional)</label>
                  <select
                    onChange={(e) => {
                      const template = reportTemplates.find(t => t.title === e.target.value);
                      if (template) {
                        setCreateForm({...createForm, title: template.title, description: template.description});
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none mb-2"
                  >
                    <option value="">-- Select a template --</option>
                    {reportTemplates.map((template, idx) => (
                      <option key={idx} value={template.title}>{template.title}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500">Select a template or create a custom report assignment</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Report Title *</label>
                  <input
                    type="text"
                    value={createForm.title}
                    onChange={(e) => setCreateForm({...createForm, title: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="e.g., Activity Schedule - March 2024"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description/Instructions *</label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none h-32 resize-none"
                    placeholder="Describe what instructors need to submit (e.g., Activity Schedule, DTR, Grading Sheet, Attendance, etc.)"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                    <select
                      value={createForm.department}
                      onChange={(e) => setCreateForm({...createForm, department: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    >
                      <option value="All">All Departments</option>
                      <option value="CWTS">CWTS Only</option>
                      <option value="LTS">LTS Only</option>
                      <option value="ROTC">ROTC Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={createForm.dueDate}
                      onChange={(e) => setCreateForm({...createForm, dueDate: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                </div>

                {/* Reference File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference File (Optional)</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleReferenceFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  />
                  <div className="flex items-center space-x-2">
                    <button type="button"
                      
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Upload className="w-5 h-5 text-gray-500" />
                      <span className="text-sm text-gray-700">Upload File</span>
                    </button>
                    {createForm.referenceFile && (
                      <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-lg">
                        <File className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-700 truncate max-w-[200px]">{createForm.referenceFile.name}</span>
                        <button type="button"
                          
                          onClick={() => setCreateForm({...createForm, referenceFile: null})}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Upload reference materials for instructors (PDF, Word, Excel, PowerPoint)</p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button"
                  
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button type="button"
                  
                  onClick={handleCreateReport}
                  disabled={!createForm.title.trim() || !createForm.description.trim() || isCreatingReport}
                  className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg transition-colors disabled:opacity-60 disabled:cursor-wait"
                >
                  {isCreatingReport ? 'Creating...' : 'Create Assignment'}
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
