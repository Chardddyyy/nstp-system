import { useAuth } from '../App';
import { 
  LayoutDashboard, Users, FileText, MessageSquare, 
  LogOut, User, ChevronLeft, Calendar, Plus, Search, Filter,
  Edit, Trash2, Eye, Download, GraduationCap, Shield, X, Menu
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useMemo } from 'react';

function StudentManagement() {
  const { user, logout, allUsers, students, addStudent, updateStudent, deleteStudent } = useAuth();
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
    emergencyContact: '',
    emergencyName: ''
  });

  const handleAddStudent = () => {
    // Validate all required fields
    const requiredFields = ['studentId', 'name', 'email', 'department', 'year', 'program', 'section', 'gender', 'birthMonth', 'birthDay', 'birthYear', 'age', 'civilStatus', 'contactNumber', 'address', 'emergencyName', 'emergencyContact'];
    const fieldLabels = {
      studentId: 'Student ID',
      name: 'Full Name',
      email: 'Email',
      department: 'Department',
      year: 'Year Level',
      program: 'Program',
      section: 'Section',
      gender: 'Sex',
      birthMonth: 'Birth Month',
      birthDay: 'Birth Day',
      birthYear: 'Birth Year',
      age: 'Age',
      civilStatus: 'Civil Status',
      contactNumber: 'Contact Number',
      address: 'Address',
      emergencyName: 'Emergency Contact Name',
      emergencyContact: 'Emergency Contact Number'
    };
    
    for (const field of requiredFields) {
      if (!formData[field] || formData[field].toString().trim() === '') {
        setNotification({ type: 'error', message: `Please fill in the ${fieldLabels[field]} field.` });
        setTimeout(() => setNotification(null), 3000);
        return;
      }
    }
    
    // Validate studentId is 9 digits
    if (formData.studentId.length !== 9) {
      setNotification({ type: 'error', message: 'Student ID must be exactly 9 digits.' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    
    // Validate contact numbers are 11 digits
    if (formData.contactNumber.length !== 11) {
      setNotification({ type: 'error', message: 'Contact Number must be exactly 11 digits.' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    
    if (formData.emergencyContact.length !== 11) {
      setNotification({ type: 'error', message: 'Emergency Contact Number must be exactly 11 digits.' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    
    // Validate email contains @
    if (!formData.email.includes('@')) {
      setNotification({ type: 'error', message: 'Email must contain @ symbol.' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    
    addStudent(formData);
    setShowAddModal(false);
    setCurrentPage(1); // Reset to page 1 so new student is visible
    setNotification({ type: 'success', message: 'Student added successfully!' });
    setTimeout(() => setNotification(null), 3000);
    setFormData({
      studentId: '',
      name: '',
      email: '',
      department: 'CWTS',
      year: '',
      program: '',
      section: '',
      gender: '',
      birthMonth: '',
      birthDay: '',
      birthYear: '',
      age: '',
      civilStatus: '',
      contactNumber: '',
      address: '',
      bloodType: '',
      emergencyName: '',
      emergencyContact: ''
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filter students based on search and department - memoized for performance
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
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
  }, [students, searchTerm, filterDept, isAdmin, user?.department]);

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const indexOfLastStudent = currentPage * itemsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - itemsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDept]);

  const handleEditStudent = async () => {
    try {
      await updateStudent(selectedStudent.id, formData);
      setShowEditModal(false);
      setSelectedStudent(null);
      setNotification({ type: 'success', message: 'Student updated successfully!' });
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to update student. Please try again.' });
    }
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDeleteStudent = (id) => {
    if (confirm('Are you sure you want to delete this student?')) {
      deleteStudent(id);
      setNotification({ type: 'success', message: 'Student deleted successfully!' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const openEditModal = (student) => {
    setSelectedStudent(student);
    // Ensure all fields have default values to prevent uncontrolled input warning
    setFormData({
      studentId: student.studentId || '',
      name: student.name || '',
      email: student.email || '',
      department: student.department || 'CWTS',
      year: student.year || '1st Year',
      program: student.program || '',
      section: student.section || '',
      gender: student.gender || 'Male',
      birthdate: student.birthdate || '',
      bloodType: student.bloodType || '',
      contactNumber: student.contactNumber || '',
      address: student.address || '',
      emergencyName: student.emergencyName || '',
      emergencyContact: student.emergencyContact || ''
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
      {/* Mobile Header */}
      <div className="lg:hidden bg-green-800 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="font-bold">Students</span>
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-green-700 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

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
            <GraduationCap className="w-8 h-8" />
            <div>
              <h1 className="font-bold text-lg">Cavite State University Naic</h1>
              <p className="text-xs text-green-200">{isAdmin ? 'Student' : user?.department + ' Instructor'}</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          <button 
            onClick={() => navigate(user?.role === 'admin' ? '/admin/dashboard' : '/instructor/dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              (user?.role === 'admin' && location.pathname === '/admin/dashboard') || 
              (user?.role === 'instructor' && location.pathname === '/instructor/dashboard') 
              ? 'bg-green-700' : 'hover:bg-green-700/50'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
          <button 
            onClick={() => navigate('/students')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-green-700/50 transition-colors"
          >
            <Users className="w-5 h-5" />
            <span>Students</span>
          </button>
          <button 
            onClick={() => navigate('/reports')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-green-700/50 transition-colors"
          >
            <FileText className="w-5 h-5" />
            <span>Reports</span>
          </button>
          <button 
            onClick={() => navigate('/chat')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-green-700/50 transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Messages</span>
          </button>
          <button 
            onClick={() => navigate('/calendar')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-green-700/50 transition-colors"
          >
            <Calendar className="w-5 h-5" />
            <span>Calendar</span>
          </button>
          <button 
            onClick={() => navigate('/profile')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-green-700/50 transition-colors"
          >
            <User className="w-5 h-5" />
            <span>Profile</span>
          </button>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-green-700">
          <button 
            onClick={() => { handleLogout(); setSidebarOpen(false); }}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-green-700 transition-colors text-red-300"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 p-4 lg:p-8 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
            {notification.message}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">Student Management</h2>
              <p className="text-gray-600">{isAdmin ? 'Manage all Cavite State University Naic students' : 'View your department students'}</p>
            </div>
          </div>
          {isAdmin && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg transition-colors w-full sm:w-auto justify-center"
            >
              <Plus className="w-5 h-5" />
              <span>Add Student</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-md mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or student ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
            {isAdmin && (
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <select
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program (ROTC/LTS/CWTS)</th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.section || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                            onClick={() => openEditModal(student)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit Student"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteStudent(student.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete Student"
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
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}

        {/* Add Student Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
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
                    value={formData.homeAddress}
                    onChange={(e) => setFormData({...formData, homeAddress: e.target.value})}
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
                  <div className="grid grid-cols-4 gap-4 mb-4">
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
                        onChange={(e) => setFormData({...formData, emergencyName: e.target.value})}
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
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddStudent}
                  className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg transition-colors"
                >
                  Add Student
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Student Modal */}
        {showViewModal && viewStudent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Student Information</h3>
                <button onClick={closeViewModal} className="p-1 text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Profile Header */}
                <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className={`w-16 h-16 ${getDepartmentColor(viewStudent.department)} rounded-full flex items-center justify-center text-2xl font-bold`}>
                    {viewStudent.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-800">{viewStudent.name}</h4>
                    <p className="text-sm text-gray-500">{viewStudent.studentId}</p>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${getDepartmentColor(viewStudent.department)}`}>
                      {viewStudent.department}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase">Student ID</label>
                    <p className="text-sm font-medium text-gray-800">{viewStudent.studentId}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase">Program</label>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getDepartmentColor(viewStudent.department)}`}>
                      {viewStudent.department}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase">Full Name</label>
                  <p className="text-sm font-medium text-gray-800">{viewStudent.name}</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase">Email</label>
                  <p className="text-sm font-medium text-gray-800">{viewStudent.email}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase">Department</label>
                    <p className="text-sm font-medium text-gray-800">{viewStudent.department}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase">Section</label>
                    <p className="text-sm font-medium text-gray-800">{viewStudent.section || '-'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase">Year Level</label>
                    <p className="text-sm font-medium text-gray-800">{viewStudent.year}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase">Program</label>
                    <p className="text-sm font-medium text-gray-800">{viewStudent.program}</p>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Personal Information</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase">Sex</label>
                      <p className="text-sm font-medium text-gray-800">{viewStudent.gender || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase">Birthdate</label>
                      <p className="text-sm font-medium text-gray-800">{viewStudent.birthDate ? new Date(viewStudent.birthDate).toLocaleDateString() : (viewStudent.birthdate || '-')}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase">Age</label>
                      <p className="text-sm font-medium text-gray-800">{viewStudent.age || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase">Civil Status</label>
                      <p className="text-sm font-medium text-gray-800">{viewStudent.civilStatus || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase">Blood Type</label>
                      <p className="text-sm font-medium text-gray-800">{viewStudent.bloodType || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase">Height (cm)</label>
                      <p className="text-sm font-medium text-gray-800">{viewStudent.height || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase">Weight (kg)</label>
                      <p className="text-sm font-medium text-gray-800">{viewStudent.weight || '-'}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-500 uppercase">Facebook Account</label>
                      <p className="text-sm font-medium text-gray-800">{viewStudent.facebookAccount || '-'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase">Contact Number</label>
                  <p className="text-sm font-medium text-gray-800">{viewStudent.contactNumber}</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase">Home Address</label>
                  <p className="text-sm font-medium text-gray-800">{viewStudent.homeAddress || viewStudent.address || '-'}</p>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Emergency Contact</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase">Contact Name</label>
                      <p className="text-sm font-medium text-gray-800">{viewStudent.emergencyName}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase">Emergency Number</label>
                      <p className="text-sm font-medium text-gray-800">{viewStudent.emergencyNumber || viewStudent.emergencyContact || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button 
                  onClick={closeViewModal}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Edit Student</h3>
              <div className="space-y-4">
                {/* Basic Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                  <input
                    type="text"
                    value={formData.studentId}
                    onChange={(e) => setFormData({...formData, studentId: e.target.value})}
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
                    <input
                      type="text"
                      value={formData.section}
                      onChange={(e) => setFormData({...formData, section: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      placeholder="e.g., A, B, C"
                    />
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
                    <input
                      type="text"
                      value={formData.program}
                      onChange={(e) => setFormData({...formData, program: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      placeholder="BS Computer Science"
                    />
                  </div>
                </div>

                {/* Personal Information */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Personal Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({...formData, gender: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Birthdate</label>
                      <input
                        type="date"
                        value={formData.birthdate}
                        onChange={(e) => setFormData({...formData, birthdate: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                  <input
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                      setFormData({...formData, contactNumber: value});
                    }}
                    maxLength={11}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none h-20 resize-none"
                  />
                </div>

                {/* Emergency Contact */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Emergency Contact</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                      <input
                        type="text"
                        value={formData.emergencyName}
                        onChange={(e) => setFormData({...formData, emergencyName: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Number</label>
                      <input
                        type="tel"
                        value={formData.emergencyContact}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                          setFormData({...formData, emergencyContact: value});
                        }}
                        maxLength={11}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleEditStudent}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Save Changes
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
