import { useAuth } from '../App';
import {
  LayoutDashboard, Users, FileText, MessageSquare,
  LogOut, User, Calendar, Plus, Search, Filter,
  Edit, Trash2, Download, X, Menu, Archive, RotateCcw,
  CheckCircle, AlertCircle, FileSpreadsheet
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';

function StudentManagement() {
  const { user, logout, allUsers, students, addStudent, updateStudent, deleteStudent, viewingArchive, archiveViewData, setViewingArchive, setArchiveViewData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);
  const [notification, setNotification] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Form state for adding/editing
  const [formData, setFormData] = useState({
    studentId: '',
    name: '',
    email: '',
    department: 'CWTS',
    year: '',
    program: '',
    section: '',
    contactNumber: '',
    address: '',
    birthMonth: '',
    birthDay: '',
    birthYear: '',
    age: '',
    civilStatus: '',
    gender: '',
    bloodType: '',
    emergencyName: '',
    emergencyNumber: ''
  });

  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDept, setExportDept] = useState('All');

  // Parse birth date from either individual fields or the combined birthDate column
  function parseBirthFields(s) {
    const month = s.birthMonth || '';
    const day   = s.birthDay   || '';
    const year  = s.birthYear  || '';
    if (month && day && year) return { month, day, year };

    // Fall back to birthDate (e.g. "2000-03-15" or a Date object from MySQL)
    if (s.birthDate) {
      const raw = typeof s.birthDate === 'string' ? s.birthDate : String(s.birthDate);
      // ISO format YYYY-MM-DD
      const m = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (m) return { month: String(parseInt(m[2])), day: String(parseInt(m[3])), year: m[1] };
    }
    return { month, day, year };
  }

  const mapStudentRow = (s) => {
    const birth = parseBirthFields(s);
    return {
      'Student ID':        s.studentId             || '',
      'Last Name':         (s.name||'').split(',')[0]?.trim() || s.name || '',
      'First Name':        (s.name||'').split(',')[1]?.trim() || '',
      'Full Name':         s.name                  || '',
      'Email':             s.email                 || '',
      'NSTP Component':    s.department            || '',
      'Program':           s.program               || '',
      'Year Level':        s.year                  || '',
      'Section':           s.section               || '',
      'Status':            s.status                || 'Active',
      'Contact Number':    s.contactNumber         || '',
      'Address':           s.address || s.homeAddress || '',
      'Birth Month':       birth.month,
      'Birth Day':         birth.day,
      'Birth Year':        birth.year,
      'Age':               s.age                   || '',
      'Civil Status':      s.civilStatus           || '',
      'Sex/Gender':        s.gender                || '',
      'Blood Type':        s.bloodType             || '',
      'Height (cm)':       s.height                || '',
      'Weight (kg)':       s.weight                || '',
      'Facebook Account':  s.facebookAccount       || '',
      'Emergency Contact': s.emergencyContact || s.emergencyName || '',
      'Emergency Number':  s.emergencyNumber       || '',
      'Date Added':        s.created_at ? new Date(s.created_at).toLocaleDateString() : '',
    };
  };

  const runExport = () => {
    try {
      const allStudents = viewingArchive && archiveViewData?.studentData
        ? archiveViewData.studentData
        : students;

      const list = exportDept === 'All'
        ? allStudents
        : allStudents.filter(s => s.department === exportDept);

      if (!list || list.length === 0) {
        setNotification({ type: 'error', message: 'No student records found for the selected filter.' });
        setTimeout(() => setNotification(null), 3000);
        return;
      }

      const wb = XLSX.utils.book_new();

      if (exportDept === 'All') {
        // Sheet per department + one combined sheet
        const allRows = list.map(mapStudentRow);
        const wsAll = XLSX.utils.json_to_sheet(allRows);
        applyColumnWidths(wsAll, allRows);
        XLSX.utils.book_append_sheet(wb, wsAll, 'All Students');

        ['CWTS', 'LTS', 'ROTC'].forEach(dept => {
          const rows = list.filter(s => s.department === dept).map(mapStudentRow);
          if (rows.length > 0) {
            const ws = XLSX.utils.json_to_sheet(rows);
            applyColumnWidths(ws, rows);
            XLSX.utils.book_append_sheet(wb, ws, dept);
          }
        });
      } else {
        // Single sheet for the selected department
        const rows = list.map(mapStudentRow);
        const ws = XLSX.utils.json_to_sheet(rows);
        applyColumnWidths(ws, rows);
        XLSX.utils.book_append_sheet(wb, ws, exportDept);
      }

      const batchLabel = viewingArchive && archiveViewData ? `Batch${archiveViewData.year}` : 'Current';
      const deptLabel  = exportDept === 'All' ? 'AllDepts' : exportDept;
      const dateStr    = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `NSTP_Students_${deptLabel}_${batchLabel}_${dateStr}.xlsx`);

      setNotification({ type: 'success', message: `Downloaded ${list.length} student record(s) as Excel.` });
      setTimeout(() => setNotification(null), 3000);
      setShowExportModal(false);
    } catch {
      setNotification({ type: 'error', message: 'Export failed. Please try again.' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  function applyColumnWidths(ws, rows) {
    if (!rows.length) return;
    const keys = Object.keys(rows[0]);
    ws['!cols'] = keys.map(k => ({
      wch: Math.min(
        40,
        Math.max(k.length + 2, ...rows.map(r => String(r[k] || '').length))
      )
    }));
  }

  const handleAddStudent = async () => {
    const requiredFields = ['studentId', 'name', 'email', 'department', 'year', 'program', 'section', 'gender', 'birthMonth', 'birthDay', 'birthYear', 'age', 'civilStatus', 'contactNumber', 'address', 'emergencyName', 'emergencyNumber'];
    const fieldLabels = {
      studentId: 'Student ID', name: 'Full Name', email: 'Email', department: 'Department',
      year: 'Year Level', program: 'Program', section: 'Section', gender: 'Sex',
      birthMonth: 'Birth Month', birthDay: 'Birth Day', birthYear: 'Birth Year', age: 'Age',
      civilStatus: 'Civil Status', contactNumber: 'Contact Number', address: 'Address',
      emergencyName: 'Emergency Contact Name', emergencyNumber: 'Emergency Contact Number'
    };

    for (const field of requiredFields) {
      if (!formData[field] || formData[field].toString().trim() === '') {
        setNotification({ type: 'error', message: `"${fieldLabels[field]}" is required. Please fill it in before saving.` });
        setTimeout(() => setNotification(null), 5000);
        return;
      }
    }
    const idLen = formData.studentId.replace(/\D/g, '').length;
    if (idLen !== 9) {
      setNotification({ type: 'error', message: `Student ID must be exactly 9 digits — you entered ${idLen} digit${idLen !== 1 ? 's' : ''}.` });
      setTimeout(() => setNotification(null), 5000);
      return;
    }
    const contactLen = formData.contactNumber.replace(/\D/g, '').length;
    if (contactLen !== 11) {
      setNotification({ type: 'error', message: `Contact Number must be exactly 11 digits — you entered ${contactLen} digit${contactLen !== 1 ? 's' : ''}.` });
      setTimeout(() => setNotification(null), 5000);
      return;
    }
    const emerLen = formData.emergencyNumber.replace(/\D/g, '').length;
    if (emerLen !== 11) {
      setNotification({ type: 'error', message: `Emergency Contact Number must be exactly 11 digits — you entered ${emerLen} digit${emerLen !== 1 ? 's' : ''}.` });
      setTimeout(() => setNotification(null), 5000);
      return;
    }
    if (!formData.email.includes('@')) {
      setNotification({ type: 'error', message: 'Email address must contain "@" — e.g. student@cvsu.edu.ph.' });
      setTimeout(() => setNotification(null), 5000);
      return;
    }

    setIsAddingStudent(true);
    try {
      await addStudent(formData);
      // Only close the modal AFTER the API call succeeds
      setShowAddModal(false);
      setCurrentPage(1);
      setNotification({ type: 'success', message: 'Student added successfully!' });
      setFormData({
        studentId: '', name: '', email: '', department: 'CWTS', year: '', program: '',
        section: '', gender: '', birthMonth: '', birthDay: '', birthYear: '', age: '',
        civilStatus: '', contactNumber: '', address: '', bloodType: '',
        emergencyName: '', emergencyNumber: ''
      });
    } catch (error) {
      const raw = error?.message || '';
      const msg = raw.toLowerCase().includes('already exists')
        ? `Student ID "${formData.studentId}" is already taken. Check the student list or use a different ID.`
        : raw || 'Failed to add student. Please try again.';
      setNotification({ type: 'error', message: msg });
      setTimeout(() => setNotification(null), 6000);
    } finally {
      setIsAddingStudent(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Use archived student data when in archive view, otherwise live data
  const sourceStudents = viewingArchive && archiveViewData?.studentData
    ? archiveViewData.studentData
    : students;

  // Filter students based on search and department - memoized for performance
  const filteredStudents = useMemo(() => {
    return sourceStudents.filter(student => {
      if (!student || !student.name || !student.studentId) return false;
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.studentId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = filterDept === 'All' || student.department === filterDept;

      // Instructors only see their department students
      if (!isAdmin && user?.department) {
        return matchesSearch && student.department === user.department;
      }

      return matchesSearch && matchesDept;
    });
  }, [sourceStudents, searchTerm, filterDept, isAdmin, user?.department]);

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const indexOfLastStudent = currentPage * itemsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - itemsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDept]);

  const handleEditStudent = async () => {
    setIsEditingStudent(true);
    try {
      await updateStudent(selectedStudent.id, formData);
      setShowEditModal(false);
      setSelectedStudent(null);
      setFormData({
        studentId: '', name: '', email: '', department: 'CWTS', year: '', program: '',
        section: '', gender: '', birthMonth: '', birthDay: '', birthYear: '', age: '',
        civilStatus: '', contactNumber: '', address: '', bloodType: '', height: '', weight: '',
        facebookAccount: '', emergencyName: '', emergencyNumber: ''
      });
      setNotification({ type: 'success', message: 'Student updated successfully!' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      const raw = error?.message || '';
      const msg = raw.toLowerCase().includes('already exists')
        ? `Student ID "${formData.studentId}" is already taken. Use a different ID.`
        : raw || 'Failed to update student. Please try again.';
      setNotification({ type: 'error', message: msg });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsEditingStudent(false);
    }
  };

  const handleDeleteStudent = (id) => {
    setConfirmDialog({
      message: 'Are you sure you want to delete this student? This action cannot be undone.',
      onConfirm: () => {
        deleteStudent(id);
        setNotification({ type: 'success', message: 'Student deleted successfully!' });
        setTimeout(() => setNotification(null), 3000);
      }
    });
  };

  const openEditModal = (student) => {
    setSelectedStudent(student);
    // Parse birthDate into separate fields if available
    let birthMonth = '', birthDay = '', birthYear = '';
    if (student.birthDate) {
      const date = new Date(student.birthDate);
      if (!isNaN(date.getTime())) {
        birthMonth = (date.getMonth() + 1).toString();
        birthDay = date.getDate().toString();
        birthYear = date.getFullYear().toString();
      }
    }
    // Ensure all fields have default values to prevent uncontrolled input warning
    setFormData({
      studentId: student.studentId || '',
      name: student.name || '',
      email: student.email || '',
      department: student.department || 'CWTS',
      year: student.year || '1st Year',
      program: student.program || '',
      section: student.section || '',
      gender: student.gender || '',
      birthMonth: student.birthMonth || birthMonth || '',
      birthDay: student.birthDay || birthDay || '',
      birthYear: student.birthYear || birthYear || '',
      age: student.age || '',
      civilStatus: student.civilStatus || '',
      height: student.height || '',
      weight: student.weight || '',
      bloodType: student.bloodType || '',
      facebookAccount: student.facebookAccount || '',
      contactNumber: student.contactNumber || '',
      address: student.address || student.homeAddress || '',
      emergencyName: student.emergencyName || student.emergencyContact || '',
      emergencyNumber: student.emergencyNumber || ''
    });
    setShowEditModal(true);
  };

  const handleViewStudent = (student) => {
    setViewStudent(student);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewStudent(null);
  };

  const getDepartmentColor = (dept) => {
    switch(dept) {
      case 'ROTC': return 'bg-red-100 text-red-700';
      case 'LTS': return 'bg-purple-100 text-purple-700';
      default: return 'bg-green-100 text-green-700';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Active': return 'bg-green-100 text-green-700';
      case 'Completed': return 'bg-blue-100 text-blue-700';
      case 'Inactive': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-green-800 text-white shadow-xl z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-green-700">
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="font-bold text-lg">Cavite State University Naic</h1>
              <p className="text-xs text-green-200">{isAdmin ? 'Student' : user?.department + ' Instructor'}</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          <button
            type="button"
            onClick={() => { if (!viewingArchive) { navigate(user?.role === 'admin' ? '/admin/dashboard' : '/instructor/dashboard'); setSidebarOpen(false); } }}
            disabled={viewingArchive}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${viewingArchive ? 'opacity-40 cursor-not-allowed' : 'hover:bg-green-700/50'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
          <button
            type="button"
            onClick={() => { navigate('/students'); setSidebarOpen(false); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === '/students' ? 'bg-green-700' : 'hover:bg-green-700/50'}`}
          >
            <Users className="w-5 h-5" />
            <span>Students</span>
          </button>
          <button
            type="button"
            onClick={() => { navigate('/reports'); setSidebarOpen(false); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === '/reports' ? 'bg-green-700' : 'hover:bg-green-700/50'}`}
          >
            <FileText className="w-5 h-5" />
            <span>Reports</span>
          </button>
          <button
            type="button"
            onClick={() => { if (!viewingArchive) { navigate('/chat'); setSidebarOpen(false); } }}
            disabled={viewingArchive}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${viewingArchive ? 'opacity-40 cursor-not-allowed' : 'hover:bg-green-700/50'}`}
          >
            <MessageSquare className="w-5 h-5" />
            <span>Messages</span>
          </button>
          <button
            type="button"
            onClick={() => { if (!viewingArchive) { navigate('/calendar'); setSidebarOpen(false); } }}
            disabled={viewingArchive}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${viewingArchive ? 'opacity-40 cursor-not-allowed' : 'hover:bg-green-700/50'}`}
          >
            <Calendar className="w-5 h-5" />
            <span>Calendar</span>
          </button>
          <button
            type="button"
            onClick={() => { if (!viewingArchive) { navigate('/profile'); setSidebarOpen(false); } }}
            disabled={viewingArchive}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${viewingArchive ? 'opacity-40 cursor-not-allowed' : 'hover:bg-green-700/50'}`}
          >
            <User className="w-5 h-5" />
            <span>Profile</span>
          </button>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-green-700">
          <button
            type="button"
            onClick={() => { handleLogout(); setSidebarOpen(false); }}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-green-700 transition-colors text-red-300"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 p-4 lg:p-8 ${sidebarOpen ? 'lg:ml-64' : ''}`}>
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
            <button
              type="button"
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

        {/* Confirm dialog */}
        {confirmDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9998] p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
              <div className="flex items-start gap-3 mb-5">
                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-gray-800 text-sm font-medium">{confirmDialog.message}</p>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setConfirmDialog(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm transition-colors">Cancel</button>
                <button type="button" onClick={() => { setConfirmDialog(null); confirmDialog.onConfirm(); }} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors">Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-start gap-2">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-200 rounded-lg shrink-0"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">Student Management</h2>
              <p className="text-gray-600">{isAdmin ? 'Manage all Cavite State University Naic students' : 'View your department students'}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              title="Download students as Excel file"
              className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors w-full sm:w-auto justify-center text-white bg-blue-600 hover:bg-blue-700"
            >
              <FileSpreadsheet className="w-5 h-5" />
              <span>Download Excel</span>
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => !viewingArchive && setShowAddModal(true)}
                disabled={viewingArchive}
                title={viewingArchive ? 'Exit archive view to add students' : ''}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors w-full sm:w-auto justify-center text-white ${viewingArchive ? 'bg-green-700/40 cursor-not-allowed' : 'bg-green-700 hover:bg-green-800'}`}
              >
                <Plus className="w-5 h-5" />
                <span>Add Student</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-md mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  id="student-search"
                  name="studentSearch"
                  placeholder="Search by name or student ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoComplete="off"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
            {isAdmin && (
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <select
                  id="filter-dept"
                  name="filterDept"
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                >
                  <option value="All">All Departments</option>
                  <option value="CWTS">CWTS</option>
                  <option value="LTS">LTS</option>
                  <option value="ROTC">ROTC</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name with Email</th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                  {isAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentStudents.map((student) => (
                  <tr 
                    key={student.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleViewStudent(student)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.studentId}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.section || '-'}
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getDepartmentColor(student.department)}`}>
                        {student.department}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => !viewingArchive && openEditModal(student)}
                            disabled={viewingArchive}
                            title={viewingArchive ? 'Exit archive view to edit' : 'Edit Student'}
                            className={`p-1 rounded ${viewingArchive ? 'text-blue-300 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'}`}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => !viewingArchive && handleDeleteStudent(student.id)}
                            disabled={viewingArchive}
                            title={viewingArchive ? 'Exit archive view to delete' : 'Delete Student'}
                            className={`p-1 rounded ${viewingArchive ? 'text-red-300 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {currentStudents.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No students found matching your criteria.
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-6">
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-800">Download Excel</h3>
                </div>
                <button type="button" onClick={() => setShowExportModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Department</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['All', 'CWTS', 'LTS', 'ROTC'].map(dept => {
                      const colors = {
                        All:  'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200',
                        CWTS: 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100',
                        LTS:  'bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100',
                        ROTC: 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100',
                      };
                      const selected = {
                        All:  'bg-gray-700 border-gray-700 text-white',
                        CWTS: 'bg-blue-600 border-blue-600 text-white',
                        LTS:  'bg-purple-600 border-purple-600 text-white',
                        ROTC: 'bg-red-600 border-red-600 text-white',
                      };
                      return (
                        <button
                          key={dept}
                          type="button"
                          onClick={() => setExportDept(dept)}
                          className={`px-4 py-2.5 rounded-lg border-2 font-medium text-sm transition-all ${exportDept === dept ? selected[dept] : colors[dept]}`}
                        >
                          {dept === 'All' ? '📋 All Departments' : dept === 'CWTS' ? '🔵 CWTS' : dept === 'LTS' ? '🟣 LTS' : '🔴 ROTC'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                  {exportDept === 'All'
                    ? <>Will create <strong>4 sheets</strong>: All Students + one sheet per department.</>
                    : <>Will create a single <strong>{exportDept}</strong> sheet with all {exportDept} student records.</>
                  }
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <button type="button" onClick={() => setShowExportModal(false)} className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm transition-colors">
                  Cancel
                </button>
                <button type="button" onClick={runExport} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                  <Download className="w-4 h-4" /> Download
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Student Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div
              className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') e.preventDefault();
                if (e.key === 'Escape') { e.preventDefault(); setShowAddModal(false); }
                if (e.key === 'Tab') {
                  const focusable = Array.from(e.currentTarget.querySelectorAll('button:not([disabled]), input, select, textarea'));
                  if (!focusable.length) return;
                  const first = focusable[0], last = focusable[focusable.length - 1];
                  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
                  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
                }
              }}
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">Add New Student</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student ID <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.studentId}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 9);
                      setFormData({...formData, studentId: value});
                    }}
                    maxLength={9}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="9 digits only"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="Juan Dela Cruz"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="must contain @"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Home Address <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department <span className="text-red-500">*</span></label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      required
                    >
                      <option value="CWTS">CWTS</option>
                      <option value="LTS">LTS</option>
                      <option value="ROTC">ROTC</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year Level <span className="text-red-500">*</span></label>
                    <select
                      value={formData.year}
                      onChange={(e) => setFormData({...formData, year: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      required
                    >
                      <option value="">Select Year</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section <span className="text-red-500">*</span></label>
                  <select
                    value={formData.section}
                    onChange={(e) => setFormData({...formData, section: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    required
                  >
                    <option value="">Select Section</option>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="D">Section D</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Program <span className="text-red-500">*</span></label>
                  <select
                    value={formData.program}
                    onChange={(e) => setFormData({...formData, program: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    required
                  >
                    <option value="">Select Program</option>
                    <option value="BSIT">BSIT</option>
                    <option value="BSCS">BSCS</option>
                    <option value="BSFAS">BSFAS</option>
                    <option value="BSHM">BSHM</option>
                    <option value="BSBA">BSBA</option>
                    <option value="BEED Science">BEED Science</option>
                    <option value="BSED">BSED</option>
                  </select>
                </div>

                {/* Personal Information */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Personal Information</h4>
                  
                  {/* Birth Date */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Birth Month *</label>
                      <input
                        type="text"
                        value={formData.birthMonth || ''}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, '');
                          if (val > 12) val = '12';
                          setFormData({...formData, birthMonth: val});
                        }}
                        placeholder="1-12"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Birth Day *</label>
                      <input
                        type="text"
                        value={formData.birthDay || ''}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, '');
                          if (val > 31) val = '31';
                          setFormData({...formData, birthDay: val});
                        }}
                        placeholder="1-31"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Birth Year *</label>
                      <input
                        type="text"
                        value={formData.birthYear || ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setFormData({...formData, birthYear: val});
                        }}
                        placeholder="YYYY"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Age, Civil Status, Sex */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
                      <input
                        type="text"
                        value={formData.age || ''}
                        onChange={(e) => setFormData({...formData, age: e.target.value.replace(/\D/g, '')})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Civil Status *</label>
                      <select
                        value={formData.civilStatus || ''}
                        onChange={(e) => setFormData({...formData, civilStatus: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        required
                      >
                        <option value="">Select</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sex <span className="text-red-500">*</span></label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({...formData, gender: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        required
                      >
                        <option value="">Select Sex</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                      <input
                        type="text"
                        value={formData.height || ''}
                        onChange={(e) => setFormData({...formData, height: e.target.value.replace(/[^0-9.]/g, '')})}
                        placeholder="cm"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Weight, Facebook */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                      <input
                        type="text"
                        value={formData.weight || ''}
                        onChange={(e) => setFormData({...formData, weight: e.target.value.replace(/[^0-9.]/g, '')})}
                        placeholder="kg"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type</label>
                      <select
                        value={formData.bloodType || ''}
                        onChange={(e) => setFormData({...formData, bloodType: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      >
                        <option value="">Select</option>
                        <option value="A">A</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B">B</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB">AB</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O">O</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Facebook Account</label>
                      <input
                        type="text"
                        value={formData.facebookAccount || ''}
                        onChange={(e) => setFormData({...formData, facebookAccount: e.target.value})}
                        placeholder="facebook.com/username"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                      setFormData({...formData, contactNumber: value});
                    }}
                    maxLength={11}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="11 digits only"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address <span className="text-red-500">*</span></label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none h-20 resize-none"
                    placeholder="Complete address..."
                    required
                  />
                </div>

                {/* Emergency Contact */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Emergency Contact</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={formData.emergencyName || ''}
                        onChange={(e) => setFormData({...formData, emergencyName: e.target.value.replace(/[^a-zA-ZÀ-ÖØ-öø-ÿ\s.'-]/g, '')})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        placeholder="Parent/Guardian name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Number <span className="text-red-500">*</span></label>
                      <input
                        type="tel"
                        value={formData.emergencyNumber || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                          setFormData({...formData, emergencyNumber: value});
                        }}
                        maxLength={11}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        placeholder="11 digits only"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddStudent}
                  disabled={isAddingStudent}
                  className="px-4 py-2 bg-green-700 hover:bg-green-800 disabled:opacity-60 disabled:cursor-wait text-white rounded-lg transition-colors"
                >
                  {isAddingStudent ? 'Adding...' : 'Add Student'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Student Modal */}
        {showViewModal && viewStudent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto overscroll-contain" onClick={(e) => e.stopPropagation()}>
              {/* Sticky Header */}
              <div className="sticky top-0 bg-green-800 text-white p-4 flex items-center justify-between rounded-t-xl">
                <h3 className="text-lg font-bold flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Student Information
                </h3>
                <button type="button" onClick={closeViewModal} className="p-1 hover:bg-green-700 rounded-lg transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Personal Information Section */}
                <div>
                  <h4 className="text-md font-semibold text-green-800 mb-3 border-b pb-2">Personal Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-500">Student ID:</span> <span className="font-medium">{viewStudent.studentId}</span></div>
                    <div><span className="text-gray-500">Full Name:</span> <span className="font-medium">{viewStudent.name}</span></div>
                    <div><span className="text-gray-500">Email:</span> <span className="font-medium">{viewStudent.email || '-'}</span></div>
                    <div><span className="text-gray-500">Contact:</span> <span className="font-medium">{viewStudent.contactNumber || '-'}</span></div>
                    <div><span className="text-gray-500">Address:</span> <span className="font-medium">{viewStudent.homeAddress || viewStudent.address || '-'}</span></div>
                    <div><span className="text-gray-500">Facebook:</span> <span className="font-medium">{viewStudent.facebookAccount || '-'}</span></div>
                  </div>
                </div>

                {/* Academic Information Section */}
                <div>
                  <h4 className="text-md font-semibold text-green-800 mb-3 border-b pb-2">Academic Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-500">Program:</span> <span className="font-medium">{viewStudent.program || '-'}</span></div>
                    <div><span className="text-gray-500">Section:</span> <span className="font-medium">{viewStudent.section || '-'}</span></div>
                    <div><span className="text-gray-500">Year Level:</span> <span className="font-medium">{viewStudent.year || '-'}</span></div>
                    <div><span className="text-gray-500">NSTP Component:</span> <span className="font-medium">{viewStudent.department || '-'}</span></div>
                  </div>
                </div>

                {/* Demographic Information Section */}
                <div>
                  <h4 className="text-md font-semibold text-green-800 mb-3 border-b pb-2">Demographic Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-500">Birth Date:</span> <span className="font-medium">{viewStudent.birthDate ? new Date(viewStudent.birthDate).toLocaleDateString() : (viewStudent.birthdate || '-')}</span></div>
                    <div><span className="text-gray-500">Age:</span> <span className="font-medium">{viewStudent.age || '-'}</span></div>
                    <div><span className="text-gray-500">Gender:</span> <span className="font-medium">{viewStudent.gender || '-'}</span></div>
                    <div><span className="text-gray-500">Civil Status:</span> <span className="font-medium">{viewStudent.civilStatus || '-'}</span></div>
                    <div><span className="text-gray-500">Height:</span> <span className="font-medium">{viewStudent.height ? `${viewStudent.height} cm` : '-'}</span></div>
                    <div><span className="text-gray-500">Weight:</span> <span className="font-medium">{viewStudent.weight ? `${viewStudent.weight} kg` : '-'}</span></div>
                    <div><span className="text-gray-500">Blood Type:</span> <span className="font-medium">{viewStudent.bloodType || '-'}</span></div>
                  </div>
                </div>

                {/* Emergency Contact Section */}
                <div>
                  <h4 className="text-md font-semibold text-green-800 mb-3 border-b pb-2">Emergency Contact</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-500">Contact Person:</span> <span className="font-medium">{viewStudent.emergencyContact || '-'}</span></div>
                    <div><span className="text-gray-500">Contact Number:</span> <span className="font-medium">{viewStudent.emergencyNumber || viewStudent.emergencyContact || '-'}</span></div>
                  </div>
                </div>

                {/* Status Section */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-gray-500 text-sm">Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-sm font-medium ${
                        viewStudent.status === 'Active' ? 'bg-green-100 text-green-700' :
                        viewStudent.status === 'Inactive' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {viewStudent.status || 'Active'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="sticky bottom-0 bg-white p-4 border-t flex justify-end">
                <button
                  type="button"
                  onClick={closeViewModal}
                  className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div
              className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto overscroll-contain"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') e.preventDefault();
                if (e.key === 'Escape') { e.preventDefault(); setShowEditModal(false); }
                if (e.key === 'Tab') {
                  const focusable = Array.from(e.currentTarget.querySelectorAll('button:not([disabled]), input, select, textarea'));
                  if (!focusable.length) return;
                  const first = focusable[0], last = focusable[focusable.length - 1];
                  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
                  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
                }
              }}
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">Edit Student</h3>
              <div className="space-y-4">
                {/* Basic Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                  <input
                    type="text"
                    value={formData.studentId}
                    onChange={(e) => setFormData({...formData, studentId: e.target.value.replace(/\D/g, '').slice(0, 9)})}
                    maxLength={9}
                    placeholder="9 digits only"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Home Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    >
                      <option value="CWTS">CWTS</option>
                      <option value="LTS">LTS</option>
                      <option value="ROTC">ROTC</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                    <select
                      value={formData.section}
                      onChange={(e) => setFormData({...formData, section: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    >
                      <option value="">Select Section</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year Level</label>
                    <select
                      value={formData.year}
                      onChange={(e) => setFormData({...formData, year: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                    <select
                      value={formData.program}
                      onChange={(e) => setFormData({...formData, program: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    >
                      <option value="">Select Program</option>
                      <option value="BSIT">BSIT</option>
                      <option value="BSCS">BSCS</option>
                      <option value="BSFAS">BSFAS</option>
                      <option value="BSHM">BSHM</option>
                      <option value="BSBA">BSBA</option>
                      <option value="BEED Science">BEED Science</option>
                      <option value="BSED">BSED</option>
                    </select>
                  </div>
                </div>

                {/* Personal Information - Matching Enrollment Form */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Personal Information</h4>
                  
                  {/* Birth Date - Separate Fields */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Birth Month (1-12)</label>
                      <input
                        type="text"
                        value={formData.birthMonth}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, '');
                          if (val > 12) val = '12';
                          setFormData({...formData, birthMonth: val});
                        }}
                        placeholder="MM"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Birth Day (1-31)</label>
                      <input
                        type="text"
                        value={formData.birthDay}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, '');
                          if (val > 31) val = '31';
                          setFormData({...formData, birthDay: val});
                        }}
                        placeholder="DD"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Birth Year (4 digits)</label>
                      <input
                        type="text"
                        value={formData.birthYear}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setFormData({...formData, birthYear: val});
                        }}
                        placeholder="YYYY"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Age, Civil Status, Sex, Height */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                      <input
                        type="text"
                        value={formData.age}
                        onChange={(e) => setFormData({...formData, age: e.target.value.replace(/\D/g, '')})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Civil Status</label>
                      <select
                        value={formData.civilStatus}
                        onChange={(e) => setFormData({...formData, civilStatus: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      >
                        <option value="">Select</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({...formData, gender: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                      <input
                        type="text"
                        value={formData.height}
                        onChange={(e) => setFormData({...formData, height: e.target.value.replace(/[^0-9.]/g, '')})}
                        placeholder="cm"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Weight, Blood Type, Contact, Facebook */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                      <input
                        type="text"
                        value={formData.weight}
                        onChange={(e) => setFormData({...formData, weight: e.target.value.replace(/[^0-9.]/g, '')})}
                        placeholder="kg"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type</label>
                      <select
                        value={formData.bloodType}
                        onChange={(e) => setFormData({...formData, bloodType: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      >
                        <option value="">Select</option>
                        <option value="A">A</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B">B</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB">AB</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O">O</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number (11 digits)</label>
                      <input
                        type="tel"
                        value={formData.contactNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                          setFormData({...formData, contactNumber: value});
                        }}
                        maxLength={11}
                        placeholder="09123456789"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Facebook Account</label>
                      <input
                        type="text"
                        value={formData.facebookAccount}
                        onChange={(e) => setFormData({...formData, facebookAccount: e.target.value})}
                        placeholder="facebook.com/username"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Emergency Contact</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                      <input
                        type="text"
                        value={formData.emergencyName}
                        onChange={(e) => setFormData({...formData, emergencyName: e.target.value.replace(/[^a-zA-ZÀ-ÖØ-öø-ÿ\s.'-]/g, '')})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number (11 digits)</label>
                      <input
                        type="tel"
                        value={formData.emergencyNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                          setFormData({...formData, emergencyNumber: value});
                        }}
                        maxLength={11}
                        placeholder="09123456789"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleEditStudent}
                  disabled={isEditingStudent}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-wait text-white rounded-lg transition-colors"
                >
                  {isEditingStudent ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default StudentManagement;
