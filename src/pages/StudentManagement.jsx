import { useAuth } from '../context/AuthContext';
import ScrollToTopButton from '../components/ScrollToTopButton';
import {
  Users, Calendar, Plus, Search, Filter,
  Edit, Trash2, Download, X, Menu, Archive, RotateCcw,
  CheckCircle, AlertCircle, FileSpreadsheet, UserPlus, GraduationCap, User, Phone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { useState, useMemo, useEffect } from 'react';
function StudentManagement() {
  const { user, logout, students, addStudent, updateStudent, deleteStudent, viewingArchive, archiveViewData, setViewingArchive, setArchiveViewData } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [filterCourse, setFilterCourse] = useState('All');
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
  const [exportCourse, setExportCourse] = useState('All');
  const [exportSem, setExportSem] = useState('1st Semester');
  const [exportAcadYear, setExportAcadYear] = useState('2025-2026');

  const downloadChed = async () => {
    try {
      const dept = isAdmin ? exportDept : (user?.department || 'CWTS');
      const token = localStorage.getItem('nstp_token');
      const params = new URLSearchParams({
        department: dept,
        sem: exportSem,
        year: exportAcadYear,
        program: exportCourse,
      });
      const res = await fetch(`http://localhost:3001/api/students/ched-export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CHED_NSTP_EnrollmentList_${dept}_${new Date().toISOString().slice(0,10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      setNotification({ type: 'success', message: 'CHED Enrollment List downloaded.' });
      setTimeout(() => setNotification(null), 3000);
      setShowExportModal(false);
    } catch {
      setNotification({ type: 'error', message: 'CHED export failed. Please try again.' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleAddStudent = async () => {
    const requiredFields = ['studentId', 'name', 'email', 'department', 'year', 'program', 'section', 'gender', 'birthMonth', 'birthDay', 'birthYear', 'age', 'civilStatus', 'contactNumber', 'emergencyName', 'emergencyNumber'];
    const fieldLabels = {
      studentId: 'Student ID', name: 'Full Name', email: 'Email', department: 'Department',
      year: 'Year Level', program: 'Program', section: 'Section', gender: 'Sex',
      birthMonth: 'Birth Month', birthDay: 'Birth Day', birthYear: 'Birth Year', age: 'Age',
      civilStatus: 'Civil Status', contactNumber: 'Contact Number',
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

  // Filter students based on search, department, and course - memoized for performance
  const filteredStudents = useMemo(() => {
    return sourceStudents.filter(student => {
      if (!student || !student.name || !student.studentId) return false;
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.studentId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = filterDept === 'All' || student.department === filterDept;
      const matchesCourse = filterCourse === 'All' || (student.program || '').toUpperCase() === filterCourse;

      // Instructors only see their department students
      if (!isAdmin && user?.department) {
        return matchesSearch && student.department === user.department && matchesCourse;
      }

      return matchesSearch && matchesDept && matchesCourse;
    });
  }, [sourceStudents, searchTerm, filterDept, filterCourse, isAdmin, user?.department]);

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const indexOfLastStudent = currentPage * itemsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - itemsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDept, filterCourse]);

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
          <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none">
            <div className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white text-sm font-medium max-w-sm w-full mx-4 ${notification.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
              {notification.type === 'success'
                ? <CheckCircle className="w-5 h-5 flex-shrink-0" />
                : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
              <span className="flex-1 font-semibold">{notification.message}</span>
              <button type="button" onClick={() => setNotification(null)} className="text-white/80 hover:text-white flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Confirm dialog */}
        {confirmDialog && (
          <div className="fixed inset-0 bg-emerald-950/60 backdrop-blur-xs flex items-center justify-center z-[9998] p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full border border-emerald-100">
              <div className="flex items-start gap-3 mb-5">
                <AlertCircle className="w-6 h-6 text-rose-500 flex-shrink-0 mt-0.5" />
                <p className="text-gray-800 text-sm font-bold">{confirmDialog.message}</p>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setConfirmDialog(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-xs font-bold transition-colors">Cancel</button>
                <button type="button" onClick={() => { setConfirmDialog(null); confirmDialog.onConfirm(); }} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-colors shadow-md">Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* Hero Header Card */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-3xl p-5 sm:p-8 shadow-2xl border border-emerald-800/40 relative mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative z-10">
            <div className="flex items-center gap-3.5">
              <button type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2.5 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-200 hover:text-white rounded-2xl shrink-0 transition-colors cursor-pointer"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white">Student Management</h2>
                  <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full hidden sm:inline-block">
                    CvSU Naic
                  </span>
                </div>
                <p className="text-emerald-200 text-xs sm:text-sm font-medium mt-0.5">{isAdmin ? 'Manage student records & CHED export reporting' : 'View & update your department student roster'}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
              <button type="button"
                onClick={() => { setExportDept(isAdmin ? 'All' : (user?.department || 'CWTS')); setExportCourse('All'); setShowExportModal(true); }}
                title={isAdmin ? 'Download students as CHED Excel file' : `Download ${user?.department} students as CHED Excel`}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl transition-all duration-200 w-full sm:w-auto justify-center text-emerald-950 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 font-black shadow-md hover:shadow-lg active:scale-95 text-xs sm:text-sm cursor-pointer shrink-0"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-950" />
                <span>Export CHED Excel</span>
              </button>
              {isAdmin && (
              <button type="button"
                onClick={() => !viewingArchive && setShowAddModal(true)}
                disabled={viewingArchive}
                title={viewingArchive ? 'Exit archive view to add students' : ''}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all duration-200 w-full sm:w-auto justify-center text-white font-bold shadow-md shadow-emerald-900/20 active:scale-95 ${viewingArchive ? 'bg-emerald-700/40 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-700 to-green-700 hover:from-emerald-800 hover:to-green-800 hover:shadow-lg hover:-translate-y-0.5'}`}
              >
                <Plus className="w-5 h-5" />
                <span>Add Student</span>
              </button>
            )}
          </div>
        </div>
      </div>

        {/* Mobile-Responsive Filters */}
        <div className="bg-white/90 backdrop-blur-md p-3.5 sm:p-5 rounded-3xl shadow-xl shadow-emerald-950/5 border border-emerald-100/80 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-emerald-700/60" />
                <input
                  type="text"
                  id="student-search"
                  name="studentSearch"
                  placeholder="Search student name, ID, section..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoComplete="off"
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-emerald-100/80 rounded-2xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium bg-gray-50/50"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5">
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-emerald-800 shrink-0 hidden sm:block" />
                  <select
                    id="filter-dept"
                    name="filterDept"
                    value={filterDept}
                    onChange={(e) => setFilterDept(e.target.value)}
                    className="w-full sm:w-auto px-3.5 py-2.5 text-xs sm:text-sm border border-emerald-100/80 rounded-2xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-bold bg-white text-emerald-950 cursor-pointer"
                  >
                    <option value="All">All Departments</option>
                    <option value="CWTS">CWTS</option>
                    <option value="LTS">LTS</option>
                    <option value="ROTC">ROTC</option>
                  </select>
                </div>
              )}
              <div className="flex items-center gap-2">
                <select
                  id="filter-course"
                  name="filterCourse"
                  value={filterCourse}
                  onChange={(e) => setFilterCourse(e.target.value)}
                  className="w-full sm:w-auto px-3.5 py-2.5 text-xs sm:text-sm border border-emerald-100/80 rounded-2xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-bold bg-white text-emerald-950 cursor-pointer"
                >
                  <option value="All">All Courses</option>
                  <option value="BSIT">BSIT</option>
                  <option value="BSCS">BSCS</option>
                  <option value="BSFAS">BSFAS</option>
                  <option value="BSBA">BSBA</option>
                  <option value="BSED">BSEd</option>
                  <option value="BEED">BEED</option>
                  <option value="BSHM">BSHM</option>
                </select>
              </div>
            </div>
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
                {currentStudents.map((student, index) => (
                  <tr 
                    key={student.id || student.studentId || `student-${index}`} 
                    className="hover:bg-green-50 cursor-pointer transition-colors duration-150"
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
                        <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                          <button type="button"
                            onClick={() => !viewingArchive && openEditModal(student)}
                            disabled={viewingArchive}
                            title={viewingArchive ? 'Exit archive view to edit' : 'Edit Student'}
                            className={`p-1.5 rounded-xl border transition-all active:scale-90 ${viewingArchive ? 'text-blue-300 border-gray-100 cursor-not-allowed' : 'text-blue-600 bg-blue-50/80 border-blue-200/80 hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-2xs hover:shadow-xs'}`}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button type="button"
                            onClick={() => !viewingArchive && handleDeleteStudent(student.id)}
                            disabled={viewingArchive}
                            title={viewingArchive ? 'Exit archive view to delete' : 'Delete Student'}
                            className={`p-1.5 rounded-xl border transition-all active:scale-90 ${viewingArchive ? 'text-rose-300 border-gray-100 cursor-not-allowed' : 'text-rose-600 bg-rose-50/80 border-rose-200/80 hover:bg-rose-600 hover:text-white hover:border-rose-600 shadow-2xs hover:shadow-xs'}`}
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

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowExportModal(false)}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 border border-gray-100 animate-slide-up" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-inner">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900">Export Masterlist</h3>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">CHED Excel</span>
                    </div>
                    <p className="text-xs text-gray-500">Configure parameters for official CHED masterlist export</p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowExportModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Department Selection */}
                {isAdmin && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Select Department / Component</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: 'All', label: 'All Departments', activeClass: 'bg-emerald-700 border-emerald-700 text-white shadow-xs' },
                        { key: 'CWTS', label: 'CWTS Component', activeClass: 'bg-emerald-600 border-emerald-600 text-white shadow-xs' },
                        { key: 'LTS',  label: 'LTS Component',  activeClass: 'bg-purple-600 border-purple-600 text-white shadow-xs' },
                        { key: 'ROTC', label: 'ROTC Component', activeClass: 'bg-rose-600 border-rose-600 text-white shadow-xs' },
                      ].map(dept => {
                        const isSelected = exportDept === dept.key;
                        return (
                          <button
                            key={dept.key}
                            type="button"
                            onClick={() => setExportDept(dept.key)}
                            className={`px-3 py-2.5 rounded-xl border-2 font-semibold text-xs transition-all duration-200 active:scale-95 flex items-center justify-between ${
                              isSelected ? dept.activeClass : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
                            }`}
                          >
                            <span>{dept.label}</span>
                            {isSelected && <span className="text-xs">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Course / Program Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Select Degree Program</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['All', 'BSIT', 'BSCS', 'BSFAS', 'BSBA', 'BSED', 'BEED', 'BSHM'].map(course => {
                      const isSelected = exportCourse === course;
                      return (
                        <button
                          key={course}
                          type="button"
                          onClick={() => setExportCourse(course)}
                          className={`px-2 py-2 rounded-xl border-2 font-bold text-xs transition-all duration-150 active:scale-95 ${
                            isSelected
                              ? 'bg-emerald-700 border-emerald-700 text-white shadow-xs'
                              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-emerald-50/50 hover:border-emerald-200'
                          }`}
                        >
                          {course === 'All' ? 'All' : course === 'BSED' ? 'BSEd' : course}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live Export Dynamic Preview Card */}
                {(() => {
                  const matchingCount = students.filter(s => {
                    const deptMatch = exportDept === 'All' || s.department === exportDept;
                    const courseMatch = exportCourse === 'All' || (s.program || '').toLowerCase() === (exportCourse === 'BSED' ? 'bsed' : exportCourse).toLowerCase();
                    return deptMatch && courseMatch;
                  }).length;

                  return (
                    <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3.5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold text-sm shadow-xs">
                        {matchingCount}
                      </div>
                      <div className="text-xs text-emerald-950">
                        <p className="font-bold">
                          Exporting <strong>{matchingCount}</strong> student records
                        </p>
                        <p className="text-emerald-700 text-[11px] mt-0.5">
                          {isAdmin ? (exportDept === 'All' ? 'All Departments' : exportDept) : user?.department} · {exportCourse === 'All' ? 'All Courses' : exportCourse} · CHED Format
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* CHED Format Settings */}
                <div className="border-t border-dashed border-gray-200 pt-3">
                  <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-2.5">CHED Report Header Settings</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Semester</label>
                      <select
                        value={exportSem}
                        onChange={(e) => setExportSem(e.target.value)}
                        className="w-full text-xs font-medium border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                      >
                        <option>1st Semester</option>
                        <option>2nd Semester</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">Academic Year</label>
                      <input
                        type="text"
                        value={exportAcadYear}
                        onChange={(e) => setExportAcadYear(e.target.value)}
                        placeholder="e.g. 2025-2026"
                        className="w-full text-xs font-medium border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 mt-5">
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 px-4 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-semibold transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={downloadChed}
                  className="flex-1 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-900/20 active:scale-95 hover:-translate-y-0.5"
                >
                  <Download className="w-4 h-4" /> Download Excel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Student Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-emerald-950/75 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowAddModal(false)}>
            <div 
              className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col border border-emerald-100/80 overflow-hidden" 
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Tab') {
                  const focusable = Array.from(e.currentTarget.querySelectorAll('button:not([disabled]), input, select, textarea'));
                  if (!focusable.length) return;
                  const first = focusable[0], last = focusable[focusable.length - 1];
                  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
                  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
                }
              }}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-900 via-emerald-850 to-teal-900 text-white p-5 sm:p-6 flex items-center justify-between shadow-sm shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black tracking-tight">Add New Student</h3>
                    <p className="text-emerald-200 text-xs font-medium">Enter student registration details &amp; program section</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 rounded-full bg-emerald-800/80 hover:bg-emerald-700 flex items-center justify-center text-emerald-200 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body */}
              <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
                
                {/* Academic & Basic Details */}
                <div className="bg-gray-50/70 rounded-2xl p-4 sm:p-5 border border-gray-100 space-y-4">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-emerald-700" />
                    Academic Identification
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Student ID (9 digits) *</label>
                      <input
                        type="text"
                        value={formData.studentId}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 9);
                          setFormData({...formData, studentId: value});
                        }}
                        maxLength={9}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        placeholder="202400001"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Full Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[0-9]/g, '');
                          setFormData({...formData, name: val});
                        }}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        placeholder="Juan Dela Cruz"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Email Address *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        placeholder="student@cvsu.edu.ph"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Home Address *</label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        placeholder="Brgy. Bucana, Naic, Cavite"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Department *</label>
                      <select
                        value={formData.department}
                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium text-xs"
                        required
                      >
                        <option value="CWTS">CWTS</option>
                        <option value="LTS">LTS</option>
                        <option value="ROTC">ROTC</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Year Level *</label>
                      <select
                        value={formData.year}
                        onChange={(e) => setFormData({...formData, year: e.target.value})}
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium text-xs"
                        required
                      >
                        <option value="">Year</option>
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Section *</label>
                      <select
                        value={formData.section}
                        onChange={(e) => setFormData({...formData, section: e.target.value})}
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium text-xs"
                        required
                      >
                        <option value="">Section</option>
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                        <option value="C">Section C</option>
                        <option value="D">Section D</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Program *</label>
                      <select
                        value={formData.program}
                        onChange={(e) => setFormData({...formData, program: e.target.value})}
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium text-xs"
                        required
                      >
                        <option value="">Program</option>
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
                </div>

                {/* Personal Information */}
                <div className="bg-gray-50/70 rounded-2xl p-4 sm:p-5 border border-gray-100 space-y-4">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-emerald-700" />
                    Personal &amp; Demographic Details
                  </h4>
                  
                  {/* Birth Date */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Birth Month *</label>
                      <input
                        type="text"
                        value={formData.birthMonth || ''}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, '');
                          if (val > 12) val = '12';
                          setFormData({...formData, birthMonth: val});
                        }}
                        placeholder="1-12"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Birth Day *</label>
                      <input
                        type="text"
                        value={formData.birthDay || ''}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, '');
                          if (val > 31) val = '31';
                          setFormData({...formData, birthDay: val});
                        }}
                        placeholder="1-31"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Birth Year *</label>
                      <input
                        type="text"
                        value={formData.birthYear || ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setFormData({...formData, birthYear: val});
                        }}
                        placeholder="YYYY"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        required
                      />
                    </div>
                  </div>

                  {/* Age, Civil Status, Sex, Height */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Age *</label>
                      <input
                        type="text"
                        value={formData.age || ''}
                        onChange={(e) => setFormData({...formData, age: e.target.value.replace(/\D/g, '')})}
                        placeholder="e.g. 18"
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Civil Status *</label>
                      <select
                        value={formData.civilStatus || ''}
                        onChange={(e) => setFormData({...formData, civilStatus: e.target.value})}
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium text-xs"
                        required
                      >
                        <option value="">Status</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Sex *</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({...formData, gender: e.target.value})}
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium text-xs"
                        required
                      >
                        <option value="">Sex</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Height (cm)</label>
                      <input
                        type="text"
                        value={formData.height || ''}
                        onChange={(e) => setFormData({...formData, height: e.target.value.replace(/[^0-9.]/g, '')})}
                        placeholder="cm"
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium text-xs"
                      />
                    </div>
                  </div>

                  {/* Weight, Blood Type, Facebook */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Weight (kg)</label>
                      <input
                        type="text"
                        value={formData.weight || ''}
                        onChange={(e) => setFormData({...formData, weight: e.target.value.replace(/[^0-9.]/g, '')})}
                        placeholder="kg"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Blood Type</label>
                      <select
                        value={formData.bloodType || ''}
                        onChange={(e) => setFormData({...formData, bloodType: e.target.value})}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                      >
                        <option value="">Blood Type</option>
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
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Facebook Account</label>
                      <input
                        type="text"
                        value={formData.facebookAccount || ''}
                        onChange={(e) => setFormData({...formData, facebookAccount: e.target.value})}
                        placeholder="facebook.com/username"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Contact No. (11 digits) *</label>
                    <input
                      type="tel"
                      value={formData.contactNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                        setFormData({...formData, contactNumber: value});
                      }}
                      maxLength={11}
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                      placeholder="09123456789"
                      required
                    />
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="bg-gray-50/70 rounded-2xl p-4 sm:p-5 border border-gray-100 space-y-4">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-emerald-700" />
                    Emergency Contact Person
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Contact Person *</label>
                      <input
                        type="text"
                        value={formData.emergencyName || ''}
                        onChange={(e) => setFormData({...formData, emergencyName: e.target.value.replace(/[^a-zA-ZÀ-ÖØ-öø-ÿ\s.'-]/g, '')})}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        placeholder="Parent/Guardian Name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Emergency Contact No. *</label>
                      <input
                        type="tel"
                        value={formData.emergencyNumber || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                          setFormData({...formData, emergencyNumber: value});
                        }}
                        maxLength={11}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        placeholder="09123456789"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 text-gray-600 hover:bg-gray-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddStudent}
                  disabled={isAddingStudent}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-emerald-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-60"
                >
                  {isAddingStudent ? 'Adding Student...' : 'Add Student'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Student Modal */}
        {showViewModal && viewStudent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={closeViewModal}>
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
              
              <div className="p-3 sm:p-6 space-y-3 sm:space-y-5">
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


              </div>

              {/* Sticky Footer */}
              <div className="sticky bottom-0 bg-white p-4 border-t flex justify-end">
                <button type="button"
                  
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowEditModal(false)}>
            <div
              className="bg-white rounded-xl p-3 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto overscroll-contain"
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 mb-4">
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
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
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
                <button type="button"
                  
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button type="button"
                  
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
      <ScrollToTopButton />
    </div>
  );
}

export default StudentManagement;
