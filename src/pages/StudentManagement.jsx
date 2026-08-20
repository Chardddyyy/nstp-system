import { useAuth } from '../context/AuthContext';
import { getPrimaryApiUrl } from '../services/api';
import ScrollToTopButton from '../components/ScrollToTopButton';
import BatchIdPrintModal from '../components/BatchIdPrintModal';
import StudentAttendanceMatrixModal from '../components/StudentAttendanceMatrixModal';
import {
  Users, Calendar, Plus, Search, Filter,
  Edit, Trash2, Download, X, Menu, Archive, RotateCcw,
  CheckCircle, AlertCircle, FileSpreadsheet, UserPlus, GraduationCap, User, Phone, Heart, Pencil, FileText, Camera, Upload
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
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [showBatchIdModal, setShowBatchIdModal] = useState(false);
  const [showAttendanceMatrix, setShowAttendanceMatrix] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Form state for adding/editing - fully synchronized with Enrollment.jsx
  const [formData, setFormData] = useState({
    studentId: '',
    lastName: '',
    firstName: '',
    middleName: '',
    suffix: '',
    name: '',
    email: '',
    street: '',
    municipality: '',
    province: '',
    address: '',
    department: 'CWTS',
    year: '',
    yearLevel: '',
    program: '',
    section: '',
    contactNumber: '',
    birthMonth: '',
    birthDay: '',
    birthYear: '',
    age: '',
    civilStatus: '',
    sex: '',
    gender: '',
    height: '',
    weight: '',
    bloodType: '',
    facebookAccount: '',
    emergencyContact: '',
    emergencyName: '',
    emergencyNumber: '',
    registrationPhoto: '',
    photo: ''
  });

  const [heightUnit, setHeightUnit] = useState('cm');
  const [heightInput, setHeightInput] = useState('');
  const [weightUnit, setWeightUnit] = useState('kg');
  const [weightInput, setWeightInput] = useState('');

  const convertToCm = (val, unit) => {
    if (!val || String(val).trim() === '') return '';
    const numStr = String(val).trim();
    if (unit === 'cm') {
      return String(Math.round(parseFloat(numStr) || 0));
    }
    if (unit === 'm') {
      const meters = parseFloat(numStr);
      return isNaN(meters) ? '' : String(Math.round(meters * 100));
    }
    if (unit === 'ft') {
      if (numStr.includes("'") || numStr.includes('"') || numStr.includes(' ')) {
        const parts = numStr.replace(/["']/g, ' ').trim().split(/\s+/);
        const feet = parseFloat(parts[0]) || 0;
        const inches = parseFloat(parts[1]) || 0;
        const totalInches = (feet * 12) + inches;
        return String(Math.round(totalInches * 2.54));
      } else {
        const feet = parseFloat(numStr);
        if (isNaN(feet)) return '';
        return String(Math.round(feet * 30.48));
      }
    }
    return numStr;
  };

  const convertToKg = (val, unit) => {
    if (!val || String(val).trim() === '') return '';
    const numStr = String(val).trim();
    if (unit === 'kg') {
      return String(Math.round(parseFloat(numStr) || 0));
    }
    if (unit === 'lbs') {
      const lbs = parseFloat(numStr);
      if (isNaN(lbs)) return '';
      return String(Math.round(lbs * 0.45359237));
    }
    return numStr;
  };

  const toTitleCase = (str) => {
    if (!str || typeof str !== 'string') return '';
    return str
      .split(' ')
      .map(word => word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : '')
      .join(' ');
  };

  const handleFormFieldChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === 'studentId') {
      newValue = value.replace(/\D/g, '').slice(0, 9);
    } else if (name === 'contactNumber' || name === 'emergencyNumber') {
      newValue = value.replace(/\D/g, '').slice(0, 11);
    } else if (name === 'age') {
      newValue = value.replace(/\D/g, '');
    } else if (name === 'bloodType') {
      newValue = value.toUpperCase().slice(0, 3);
    } else if (name === 'birthMonth') {
      newValue = value.replace(/\D/g, '');
      if (parseInt(newValue) > 12) newValue = '12';
      if (newValue.startsWith('0') && newValue.length > 1) newValue = newValue.slice(1);
    } else if (name === 'birthDay') {
      newValue = value.replace(/\D/g, '');
      if (parseInt(newValue) > 31) newValue = '31';
      if (newValue.startsWith('0') && newValue.length > 1) newValue = newValue.slice(1);
    } else if (name === 'birthYear') {
      newValue = value.replace(/\D/g, '').slice(0, 4);
      const currentYear = new Date().getFullYear();
      if (newValue.length === 4 && parseInt(newValue) > currentYear) {
        newValue = currentYear.toString();
      }
    } else if (['firstName', 'lastName', 'middleName', 'suffix', 'emergencyContact', 'emergencyName'].includes(name)) {
      newValue = toTitleCase(value.replace(/[^a-zA-ZñÑÀ-ÖØ-öø-ÿ0-9.\s'-]/g, ''));
    } else if (['street', 'municipality', 'province'].includes(name)) {
      newValue = toTitleCase(value.replace(/[^a-zA-Z0-9ñÑÀ-ÖØ-öø-ÿ\s.,'-]/g, ''));
    }

    const updated = {
      ...formData,
      [name]: newValue,
      ...(name === 'emergencyContact' ? { emergencyName: newValue } : {}),
      ...(name === 'emergencyName' ? { emergencyContact: newValue } : {}),
      ...(name === 'sex' ? { gender: newValue } : {}),
      ...(name === 'gender' ? { sex: newValue } : {}),
      ...(name === 'yearLevel' ? { year: newValue } : {}),
      ...(name === 'year' ? { yearLevel: newValue } : {})
    };

    // Auto-calculate age if birthMonth, birthDay, birthYear are present
    const m = name === 'birthMonth' ? newValue : updated.birthMonth;
    const d = name === 'birthDay' ? newValue : updated.birthDay;
    const y = name === 'birthYear' ? newValue : updated.birthYear;

    if (m && d && y && y.length === 4) {
      const birth = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      if (!isNaN(birth.getTime())) {
        const today = new Date();
        let calcAge = today.getFullYear() - birth.getFullYear();
        const mDiff = today.getMonth() - birth.getMonth();
        if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) {
          calcAge--;
        }
        updated.age = calcAge >= 0 && calcAge <= 120 ? calcAge.toString() : '';
      }
    }

    setFormData(updated);
  };

  const resetFormData = () => {
    setFormData({
      studentId: '', lastName: '', firstName: '', middleName: '', suffix: '', name: '',
      email: '', street: '', municipality: '', province: '', address: '',
      department: '', year: '', yearLevel: '', program: '', section: '',
      contactNumber: '09', birthMonth: '', birthDay: '', birthYear: '', age: '',
      civilStatus: '', sex: '', gender: '', registeredVoter: '', height: '', weight: '', bloodType: '',
      facebookAccount: '', emergencyContact: '', emergencyName: '', emergencyNumber: '09'
    });
  };

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
      const API_URL = getPrimaryApiUrl();
      const params = new URLSearchParams({
        department: dept,
        sem: exportSem,
        year: exportAcadYear,
        program: exportCourse,
        token: token || ''
      });
      const res = await fetch(`${API_URL}/students/ched-export?${params}`, {
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
      setShowExportModal(false);
    } catch {
      alert('CHED export failed. Please try again.');
    }
  };

  const handleAddStudent = () => {
    // Comprehensive frontend validation
    const requiredFields = [
      'studentId', 'lastName', 'firstName', 'email', 'contactNumber',
      'birthMonth', 'birthDay', 'birthYear', 'age', 'sex', 'civilStatus',
      'street', 'municipality', 'province', 'program', 'yearLevel', 'section', 'department',
      'facebookAccount', 'emergencyContact', 'emergencyNumber'
    ];

    const fieldLabels = {
      studentId: 'Student ID', lastName: 'Last Name', firstName: 'First Name', email: 'Email Address',
      contactNumber: 'Contact Number', birthMonth: 'Birth Month', birthDay: 'Birth Day', birthYear: 'Birth Year',
      age: 'Age', sex: 'Sex', civilStatus: 'Civil Status', street: 'Street/Brgy',
      municipality: 'Municipality', province: 'Province', program: 'Course/Program',
      yearLevel: 'Year Level', section: 'Section', department: 'NSTP Component',
      facebookAccount: 'Facebook Account', emergencyContact: 'Emergency Contact Person', emergencyNumber: 'Emergency Contact Number'
    };

    for (const field of requiredFields) {
      const val = formData[field];
      if (!val || val.toString().trim() === '') {
        alert(`"${fieldLabels[field] || field}" is required. Please fill it in before saving.`);
        return;
      }
    }
    if (!formData.registrationPhoto && !formData.photo) {
      alert('Official 2x2 ID Photo (White Background, White Shirt) is required.');
      return;
    }
    const idLen = formData.studentId.replace(/\D/g, '').length;
    if (idLen !== 9) {
      alert(`Student ID must be exactly 9 digits — you entered ${idLen} digit${idLen !== 1 ? 's' : ''}.`);
      return;
    }
    const contactLen = formData.contactNumber.replace(/\D/g, '');
    if (contactLen.length !== 11) {
      alert(`Contact Number must be exactly 11 digits — you entered ${contactLen.length} digit${contactLen.length !== 1 ? 's' : ''}.`);
      return;
    }
    const emerLen = formData.emergencyNumber.replace(/\D/g, '');
    if (emerLen.length !== 11) {
      alert(`Emergency Contact Number must be exactly 11 digits — you entered ${emerLen.length} digit${emerLen.length !== 1 ? 's' : ''}.`);
      return;
    }
    if (!formData.email.includes('@')) {
      alert('Email address must contain "@" — e.g. student@cvsu.edu.ph.');
      return;
    }

    const cleanLastName = toTitleCase(formData.lastName.trim());
    const cleanFirstName = toTitleCase(formData.firstName.trim());
    const cleanMiddleName = toTitleCase((formData.middleName || '').trim());
    const cleanSuffix = (formData.suffix || '').trim();
    const cleanStreet = toTitleCase(formData.street.trim());
    const cleanMunicipality = toTitleCase(formData.municipality.trim());
    const cleanProvince = toTitleCase(formData.province.trim());
    const cleanEmergencyContact = toTitleCase((formData.emergencyContact || formData.emergencyName || '').trim());

    const fullName = `${cleanLastName}, ${cleanFirstName} ${cleanMiddleName}${cleanSuffix ? ' ' + cleanSuffix : ''}`.replace(/\s+/g, ' ').trim();
    const fullAddress = `${cleanStreet}, ${cleanMunicipality}, ${cleanProvince}`;

    const studentPayload = {
      ...formData,
      lastName: cleanLastName,
      firstName: cleanFirstName,
      middleName: cleanMiddleName,
      suffix: cleanSuffix || null,
      street: cleanStreet,
      municipality: cleanMunicipality,
      province: cleanProvince,
      name: fullName,
      address: fullAddress,
      gender: formData.sex || formData.gender,
      sex: formData.sex || formData.gender,
      year: formData.yearLevel || formData.year,
      yearLevel: formData.yearLevel || formData.year,
      registeredVoter: formData.registeredVoter || 'No',
      isVoter: formData.registeredVoter || 'No',
      emergencyName: cleanEmergencyContact,
      emergencyContact: cleanEmergencyContact,
    };

    setConfirmDialog({
      confirmText: 'Confirm Track',
      isDelete: false,
      message: `Confirm NSTP Track Selection:\n\nYou selected "${studentPayload.department}" for student "${cleanFirstName} ${cleanLastName}".\n\nAre you sure you want to enroll this student under ${studentPayload.department}?`,
      onConfirm: async () => {
        setIsAddingStudent(true);
        try {
          await addStudent(studentPayload);
          setShowAddModal(false);
          setCurrentPage(1);
          resetFormData();
        } catch (error) {
          const raw = error?.message || '';
          const msg = raw.toLowerCase().includes('already exists')
            ? `Student ID "${formData.studentId}" is already taken. Check the student list or use a different ID.`
            : raw || 'Failed to add student. Please try again.';
          alert(msg);
        } finally {
          setIsAddingStudent(false);
        }
      }
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Use archived student data when in archive view, otherwise live data
  const sourceStudents = viewingArchive && archiveViewData?.studentData
    ? archiveViewData.studentData
    : students;

  // Derive active view student dynamically from sourceStudents so View Modal ALWAYS auto-refreshes in real-time
  const currentViewStudent = useMemo(() => {
    if (!viewStudent) return null;
    const found = sourceStudents.find(s => (s.id && String(s.id) === String(viewStudent.id)) || (s.studentId && String(s.studentId) === String(viewStudent.studentId)));
    return found || viewStudent;
  }, [viewStudent, sourceStudents]);

  // Filter students based on search (across ALL student fields!), department, and course
  const filteredStudents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return sourceStudents.filter(student => {
      if (!student) return false;

      // Comprehensive search across ALL student info fields (email, bloodtype, section, name, address, phone, etc.)
      const matchesSearch = !query || Object.entries(student).some(([_key, val]) => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'object') return false;
        return String(val).toLowerCase().includes(query);
      });

      const matchesDept = filterDept === 'All' || student.department === filterDept;
      const matchesCourse = filterCourse === 'All' || (() => {
        const p = (student.program || '').toUpperCase().trim();
        const f = filterCourse.toUpperCase().trim();
        if (!p) return false;
        if (p === f) return true;
        if (f === 'BSIT' && (p.includes('IT') || p.includes('INFORMATION TECHNOLOGY'))) return true;
        if (f === 'BSCS' && (p.includes('COMPUTER SCIENCE') || p.includes('CS'))) return true;
        if (f === 'BSFAS' && (p.includes('FISHERIES') || p.includes('FOOD') || p.includes('ARTS'))) return true;
        if (f === 'BSBA' && (p.includes('BUSINESS') || p.includes('ADMINISTRATION'))) return true;
        if (f === 'BSED' && (p.includes('SECONDARY') || p.includes('BSED'))) return true;
        if (f === 'BEED' && (p.includes('ELEMENTARY') || p.includes('BEED'))) return true;
        if (f === 'BSHM' && (p.includes('HOSPITALITY') || p.includes('HOTEL') || p.includes('HM'))) return true;
        return p.includes(f);
      })();

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
      const cleanLastName = toTitleCase((formData.lastName || '').trim());
      const cleanFirstName = toTitleCase((formData.firstName || '').trim());
      const cleanMiddleName = toTitleCase((formData.middleName || '').trim());
      const cleanSuffix = (formData.suffix || '').trim();
      const cleanStreet = toTitleCase((formData.street || '').trim());
      const cleanMunicipality = toTitleCase((formData.municipality || '').trim());
      const cleanProvince = toTitleCase((formData.province || '').trim());
      const cleanEmergencyContact = toTitleCase((formData.emergencyContact || formData.emergencyName || '').trim());

      const fullName = `${cleanLastName}, ${cleanFirstName} ${cleanMiddleName}${cleanSuffix ? ' ' + cleanSuffix : ''}`.replace(/\s+/g, ' ').trim() || formData.name;
      const fullAddress = `${cleanStreet}, ${cleanMunicipality}, ${cleanProvince}`.replace(/^,\s*|,\s*$/g, '') || formData.address;

      const payload = {
        ...formData,
        lastName: cleanLastName,
        firstName: cleanFirstName,
        middleName: cleanMiddleName,
        suffix: cleanSuffix || null,
        street: cleanStreet,
        municipality: cleanMunicipality,
        province: cleanProvince,
        name: fullName,
        address: fullAddress,
        gender: formData.sex || formData.gender,
        sex: formData.sex || formData.gender,
        year: formData.yearLevel || formData.year,
        yearLevel: formData.yearLevel || formData.year,
        registeredVoter: formData.registeredVoter || 'No',
        isVoter: formData.registeredVoter || 'No',
        emergencyName: cleanEmergencyContact,
        emergencyContact: cleanEmergencyContact,
      };

      const updatedRes = await updateStudent(selectedStudent.id, payload);
      if (updatedRes) {
        setViewStudent(updatedRes);
      }
      setShowEditModal(false);
      setSelectedStudent(null);
      resetFormData();
    } catch (error) {
      const raw = error?.message || '';
      const msg = raw.toLowerCase().includes('already exists')
        ? `Student ID "${formData.studentId}" is already taken. Use a different ID.`
        : raw || 'Failed to update student. Please try again.';
      alert(msg);
    } finally {
      setIsEditingStudent(false);
    }
  };

  const handleDeleteStudent = (id) => {
    setConfirmDialog({
      confirmText: 'Delete',
      isDelete: true,
      message: 'Are you sure you want to delete this student? This action cannot be undone.',
      onConfirm: () => {
        deleteStudent(id);
      }
    });
  };

  const openEditModal = (student) => {
    if (!student) return;
    setSelectedStudent(student);

    let birthMonth = student.birthMonth ? String(student.birthMonth) : '';
    let birthDay = student.birthDay ? String(student.birthDay) : '';
    let birthYear = student.birthYear ? String(student.birthYear) : '';

    if ((!birthMonth || !birthDay || !birthYear) && student.birthDate) {
      const date = new Date(student.birthDate);
      if (!isNaN(date.getTime())) {
        birthMonth = (date.getMonth() + 1).toString();
        birthDay = date.getDate().toString();
        birthYear = date.getFullYear().toString();
      }
    }

    let lastName = student.lastName || '';
    let firstName = student.firstName || '';
    let middleName = student.middleName || '';
    if (!lastName && !firstName && typeof student.name === 'string' && student.name) {
      if (student.name.includes(',')) {
        const parts = student.name.split(',');
        lastName = (parts[0] || '').trim();
        const rest = (parts[1] || '').trim().split(' ');
        firstName = rest[0] || '';
        middleName = rest.slice(1).join(' ');
      } else {
        const parts = student.name.split(' ');
        firstName = parts[0] || '';
        lastName = parts[parts.length - 1] || '';
        middleName = parts.slice(1, -1).join(' ');
      }
    }

    let street = student.street || '';
    let municipality = student.municipality || '';
    let province = student.province || '';
    if (!street && !municipality && (student.address || student.homeAddress)) {
      const addr = String(student.address || student.homeAddress || '');
      const parts = addr.split(',').map(s => s.trim());
      if (parts.length >= 3) {
        street = parts[0];
        municipality = parts[1];
        province = parts.slice(2).join(', ');
      } else if (parts.length === 2) {
        street = parts[0];
        municipality = parts[1];
      } else {
        street = addr;
      }
    }

    // Auto calculate age if missing or from birthdate
    let calcAge = student.age ? String(student.age) : '';
    if (birthMonth && birthDay && birthYear) {
      const birth = new Date(parseInt(birthYear), parseInt(birthMonth) - 1, parseInt(birthDay));
      if (!isNaN(birth.getTime())) {
        const today = new Date();
        let a = today.getFullYear() - birth.getFullYear();
        const mDiff = today.getMonth() - birth.getMonth();
        if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) {
          a--;
        }
        if (a >= 0 && a <= 120) calcAge = a.toString();
      }
    }

    // Auto prefix 09 for contact numbers
    let contactNo = String(student.contactNumber || '09');
    if (!contactNo.startsWith('09')) {
      contactNo = '09' + contactNo.replace(/\D/g, '').replace(/^0?9?/, '');
    }
    let emerNo = String(student.emergencyNumber || '09');
    if (!emerNo.startsWith('09')) {
      emerNo = '09' + emerNo.replace(/\D/g, '').replace(/^0?9?/, '');
    }

    setFormData({
      studentId: String(student.studentId || ''),
      lastName: toTitleCase(lastName),
      firstName: toTitleCase(firstName),
      middleName: toTitleCase(middleName),
      suffix: student.suffix ? String(student.suffix) : '',
      name: String(student.name || ''),
      email: String(student.email || ''),
      department: String(student.department || 'CWTS'),
      year: String(student.year || student.yearLevel || '1st Year'),
      yearLevel: String(student.yearLevel || student.year || '1st Year'),
      program: String(student.program || ''),
      section: String(student.section || ''),
      sex: String(student.sex || student.gender || ''),
      gender: String(student.gender || student.sex || ''),
      birthMonth: birthMonth,
      birthDay: birthDay,
      birthYear: birthYear,
      age: calcAge,
      civilStatus: String(student.civilStatus || ''),
      registeredVoter: String(student.registeredVoter || student.isVoter || ''),
      height: String(student.height || ''),
      weight: String(student.weight || ''),
      bloodType: String(student.bloodType || ''),
      facebookAccount: String(student.facebookAccount || ''),
      contactNumber: contactNo.slice(0, 11),
      street: toTitleCase(street),
      municipality: toTitleCase(municipality),
      province: toTitleCase(province),
      address: String(student.address || student.homeAddress || ''),
      emergencyContact: toTitleCase(String(student.emergencyContact || student.emergencyName || '')),
      emergencyName: toTitleCase(String(student.emergencyName || student.emergencyContact || '')),
      emergencyNumber: emerNo.slice(0, 11)
    });
    setHeightInput(String(student.height || ''));
    setWeightInput(String(student.weight || ''));
    setHeightUnit('cm');
    setWeightUnit('kg');
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

        {/* Confirm dialog */}
        {confirmDialog && (
          <div className="fixed inset-0 bg-emerald-950/60 backdrop-blur-xs flex items-center justify-center z-[9998] p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full border border-emerald-100">
              <div className="flex items-start gap-3 mb-5">
                <AlertCircle className={`w-6 h-6 flex-shrink-0 mt-0.5 ${confirmDialog.isDelete ? 'text-rose-500' : 'text-emerald-600'}`} />
                <p className="text-gray-800 text-sm font-bold whitespace-pre-line">{confirmDialog.message}</p>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setConfirmDialog(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-xs font-bold transition-colors">Cancel</button>
                <button
                  type="button"
                  onClick={() => { setConfirmDialog(null); confirmDialog.onConfirm(); }}
                  className={`px-4 py-2 text-white rounded-xl text-xs font-black transition-colors shadow-md ${confirmDialog.isDelete ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                >
                  {confirmDialog.confirmText || 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hero Header Card - Unified CvSU Naic Aesthetics */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-xl border border-emerald-800/40 relative mb-3 sm:mb-6 w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 sm:gap-3 relative z-10">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 sm:p-2 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-200 hover:text-white rounded-xl shrink-0 transition-colors cursor-pointer"
                aria-label="Open menu"
              >
                <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white rounded-xl sm:rounded-2xl p-0.5 sm:p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-md border border-emerald-700">
                <img src={`${import.meta.env.BASE_URL}cvsu.png`} alt="CvSU Logo" className="w-full h-full object-contain" />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-xs sm:text-lg lg:text-xl font-black tracking-tight text-white truncate leading-tight">Student Management</h2>
                <p className="text-emerald-200 text-[10.5px] sm:text-xs lg:text-sm font-medium truncate mt-0.5">
                  <span className="hidden sm:inline">{isAdmin ? 'Manage student records & CHED export reporting' : 'View & update roster'}</span>
                  <span className="sm:hidden">{isAdmin ? 'Student records & CHED' : 'Student roster'}</span>
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
              {/* Batch NSTP IDs Download & Print Button (Admin Only) */}
              {isAdmin && (
                <button type="button"
                  onClick={() => setShowBatchIdModal(true)}
                  title="Download or print standard student ID cards with Select All and filtering"
                  className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-2xl transition-all duration-200 justify-center text-white bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 font-bold shadow-xs hover:shadow-md active:scale-95 text-[10.5px] sm:text-xs cursor-pointer border border-emerald-600/50 whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 shrink-0" />
                  <span className="hidden xs:inline">Download Student IDs</span>
                  <span className="xs:hidden">Student IDs</span>
                </button>
              )}

              {/* View Attendance & Absences Matrix Button (Instructors Only) */}
              {!isAdmin && (
                <button type="button"
                  onClick={() => setShowAttendanceMatrix(true)}
                  title="View Day 1-15 attendance records, track absences, and identify at-risk students"
                  className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-2xl transition-all duration-200 justify-center text-white bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-600 hover:to-indigo-700 font-bold shadow-xs hover:shadow-md active:scale-95 text-[10.5px] sm:text-xs cursor-pointer border border-blue-500/50 whitespace-nowrap"
                >
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-200 shrink-0" />
                  <span className="hidden xs:inline">Attendance &amp; Absences</span>
                  <span className="xs:hidden">Attendance</span>
                </button>
              )}

              <button type="button"
                onClick={() => { setExportDept(isAdmin ? 'All' : (user?.department || 'CWTS')); setExportCourse('All'); setShowExportModal(true); }}
                title={isAdmin ? 'Download students as CHED Excel file' : `Download ${user?.department} students as CHED Excel`}
                className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-2xl transition-all duration-200 justify-center text-emerald-950 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 font-black shadow-xs hover:shadow-md active:scale-95 text-[10.5px] sm:text-xs cursor-pointer whitespace-nowrap"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-950 shrink-0" />
                <span className="hidden xs:inline">Export CHED Excel</span>
                <span className="xs:hidden">CHED Excel</span>
              </button>

              {isAdmin && (
                <button type="button"
                  onClick={() => !viewingArchive && setShowAddModal(true)}
                  disabled={viewingArchive}
                  title={viewingArchive ? 'Exit archive view to add students' : ''}
                  className={`col-span-2 sm:col-span-1 flex items-center space-x-1 sm:space-x-1.5 px-2.5 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl transition-all duration-200 justify-center text-white font-bold shadow-xs shadow-emerald-900/20 active:scale-95 text-[10.5px] sm:text-xs whitespace-nowrap ${viewingArchive ? 'bg-emerald-700/40 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-700 to-green-700 hover:from-emerald-800 hover:to-green-800'}`}
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>Add Student</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile-Responsive Filters */}
        <div className="bg-white/90 backdrop-blur-md p-2.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xl shadow-emerald-950/5 border border-emerald-100/80 mb-4 sm:mb-6">
          <div className="flex flex-row items-center gap-2 sm:gap-3">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700/60" />
                <input
                  type="text"
                  id="student-search"
                  name="studentSearch"
                  placeholder="Search student..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoComplete="off"
                  className="w-full pl-8 pr-2.5 py-2 text-xs sm:text-sm border border-emerald-100/80 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium bg-gray-50/50"
                />
              </div>
            </div>
            <div className="flex flex-row gap-1.5 sm:gap-2.5 shrink-0">
              {isAdmin && (
                <select
                  id="filter-dept"
                  name="filterDept"
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs sm:text-sm border border-emerald-100/80 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-bold bg-white text-emerald-950 cursor-pointer"
                >
                  <option value="All">All Depts</option>
                  <option value="CWTS">CWTS</option>
                  <option value="LTS">LTS</option>
                  <option value="ROTC">ROTC</option>
                </select>
              )}
              <select
                id="filter-course"
                name="filterCourse"
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
                className="w-full px-2.5 py-2 text-xs sm:text-sm border border-emerald-100/80 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-bold bg-white text-emerald-950 cursor-pointer"
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

        {/* Students Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2.5 sm:px-6 py-2.5 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                  <th className="px-2.5 sm:px-6 py-2.5 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Name with Email</th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                  <th className="px-2.5 sm:px-6 py-2.5 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                  {isAdmin && <th className="px-2.5 sm:px-6 py-2.5 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentStudents.map((student, index) => (
                  <tr 
                    key={student.id || student.studentId || `student-${index}`} 
                    className="hover:bg-green-50 cursor-pointer transition-colors duration-150"
                    onClick={() => handleViewStudent(student)}
                  >
                    <td className="px-2.5 sm:px-6 py-2.5 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">{student.studentId}</td>
                    <td className="px-2.5 sm:px-6 py-2.5 sm:py-4 whitespace-nowrap">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-900">{student.name}</p>
                        <p className="text-[10px] sm:text-sm text-gray-500 truncate max-w-[120px] sm:max-w-none">{student.email}</p>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono font-bold">
                      {student.nstp_section || student.section || '-'}
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.year}
                    </td>
                    <td className="px-2.5 sm:px-6 py-2.5 sm:py-4 whitespace-nowrap">
                      <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium ${getDepartmentColor(student.department)}`}>
                        {student.department}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-2.5 sm:px-6 py-2.5 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
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

              {/* Form Body - Synchronized with Enrollment.jsx */}
              <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
                
                {/* 1. Personal & Address Identification */}
                <div className="bg-gray-50/70 rounded-2xl p-4 sm:p-5 border border-gray-100 space-y-4">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-emerald-700" />
                    1. Personal Information & Address
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Last Name *</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName || ''}
                        onChange={handleFormFieldChange}
                        placeholder="Dela Cruz"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">First Name *</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName || ''}
                        onChange={handleFormFieldChange}
                        placeholder="Juan"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Middle Name</label>
                      <input
                        type="text"
                        name="middleName"
                        value={formData.middleName || ''}
                        onChange={handleFormFieldChange}
                        placeholder="Santos (Optional)"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Suffix</label>
                      <input
                        type="text"
                        name="suffix"
                        value={formData.suffix || ''}
                        onChange={handleFormFieldChange}
                        placeholder="Jr., Sr., III (Optional)"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Student ID (9 digits) *</label>
                      <input
                        type="text"
                        name="studentId"
                        value={formData.studentId || ''}
                        onChange={handleFormFieldChange}
                        maxLength={9}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        placeholder="202400001"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email || ''}
                        onChange={handleFormFieldChange}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        placeholder="student@cvsu.edu.ph"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Street / Barangay *</label>
                    <input
                      type="text"
                      name="street"
                      value={formData.street || ''}
                      onChange={handleFormFieldChange}
                      placeholder="Blk 1 Lot 2, Mahogany St., Brgy. Bucana"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Municipality / City *</label>
                      <input
                        type="text"
                        name="municipality"
                        value={formData.municipality || ''}
                        onChange={handleFormFieldChange}
                        placeholder="Naic"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Province *</label>
                      <input
                        type="text"
                        name="province"
                        value={formData.province || ''}
                        onChange={handleFormFieldChange}
                        placeholder="Cavite"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Academic Information */}
                <div className="bg-gray-50/70 rounded-2xl p-4 sm:p-5 border border-gray-100 space-y-4">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-emerald-700" />
                    2. Academic Information
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Program *</label>
                      <select
                        name="program"
                        value={formData.program || ''}
                        onChange={handleFormFieldChange}
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
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Section *</label>
                      <select
                        name="section"
                        value={formData.section || ''}
                        onChange={handleFormFieldChange}
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium text-xs"
                        required
                      >
                        <option value="">Select Section</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Year Level *</label>
                      <select
                        name="yearLevel"
                        value={formData.yearLevel || formData.year || ''}
                        onChange={handleFormFieldChange}
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
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Department / Track *</label>
                      <select
                        name="department"
                        value={formData.department || ''}
                        onChange={handleFormFieldChange}
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium text-xs"
                        required
                      >
                        <option value="">Select Department *</option>
                        <option value="CWTS">CWTS</option>
                        <option value="LTS">LTS</option>
                        <option value="ROTC">ROTC</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. Demographic & Emergency Info */}
                <div className="bg-gray-50/70 rounded-2xl p-4 sm:p-5 border border-gray-100 space-y-4">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-emerald-700" />
                    3. Demographic &amp; Emergency Details
                  </h4>
                  
                  {/* Birth Date */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Birth Month *</label>
                      <input
                        type="text"
                        name="birthMonth"
                        value={formData.birthMonth || ''}
                        onChange={handleFormFieldChange}
                        placeholder="1-12"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Birth Day *</label>
                      <input
                        type="text"
                        name="birthDay"
                        value={formData.birthDay || ''}
                        onChange={handleFormFieldChange}
                        placeholder="1-31"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Birth Year *</label>
                      <input
                        type="text"
                        name="birthYear"
                        value={formData.birthYear || ''}
                        onChange={handleFormFieldChange}
                        placeholder="YYYY"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        required
                      />
                    </div>
                  </div>

                  {/* Age, Civil Status, Sex, Registered Voter */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5 whitespace-nowrap">Age *</label>
                      <input
                        type="text"
                        name="age"
                        readOnly
                        placeholder="Auto-computed"
                        value={formData.age || ''}
                        className="w-full h-10 px-3 bg-gray-100 border border-gray-200 rounded-xl outline-none font-bold text-emerald-950 text-xs cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5 whitespace-nowrap">Civil Status *</label>
                      <select
                        name="civilStatus"
                        value={formData.civilStatus || ''}
                        onChange={handleFormFieldChange}
                        className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium text-xs"
                        required
                      >
                        <option value="">Status *</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5 whitespace-nowrap">Sex *</label>
                      <select
                        name="sex"
                        value={formData.sex || formData.gender || ''}
                        onChange={handleFormFieldChange}
                        className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium text-xs"
                        required
                      >
                        <option value="">Sex *</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5 whitespace-nowrap">Registered Voter *</label>
                      <select
                        name="registeredVoter"
                        value={formData.registeredVoter || ''}
                        onChange={handleFormFieldChange}
                        className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium text-xs"
                        required
                      >
                        <option value="">Voter Status *</option>
                        <option value="Yes">Yes (Registered Voter)</option>
                        <option value="No">No (Not Registered)</option>
                      </select>
                    </div>
                  </div>

                  {/* Height & Weight with units */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center justify-between">
                        <span>Height *</span>
                        {formData.height && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">System: {formData.height} cm</span>}
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder={heightUnit === 'cm' ? 'e.g. 165' : heightUnit === 'ft' ? "e.g. 5'8\" or 5.7" : 'e.g. 1.65'}
                          value={heightInput}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^0-9.'"]/g, '');
                            setHeightInput(raw);
                            const cmVal = convertToCm(raw, heightUnit);
                            setFormData({...formData, height: cmVal});
                          }}
                          className="flex-1 min-w-0 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium text-xs"
                          required
                        />
                        <select
                          value={heightUnit}
                          onChange={(e) => {
                            const newUnit = e.target.value;
                            setHeightUnit(newUnit);
                            const cmVal = convertToCm(heightInput, newUnit);
                            setFormData({...formData, height: cmVal});
                          }}
                          className="px-2.5 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none cursor-pointer hover:bg-gray-200"
                        >
                          <option value="cm">cm</option>
                          <option value="ft">ft / in</option>
                          <option value="m">m</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center justify-between">
                        <span>Weight *</span>
                        {formData.weight && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">System: {formData.weight} kg</span>}
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder={weightUnit === 'kg' ? 'e.g. 55' : 'e.g. 120'}
                          value={weightInput}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^0-9.]/g, '');
                            setWeightInput(raw);
                            const kgVal = convertToKg(raw, weightUnit);
                            setFormData({...formData, weight: kgVal});
                          }}
                          className="flex-1 min-w-0 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium text-xs"
                          required
                        />
                        <select
                          value={weightUnit}
                          onChange={(e) => {
                            const newUnit = e.target.value;
                            setWeightUnit(newUnit);
                            const kgVal = convertToKg(weightInput, newUnit);
                            setFormData({...formData, weight: kgVal});
                          }}
                          className="px-2.5 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none cursor-pointer hover:bg-gray-200"
                        >
                          <option value="kg">kg</option>
                          <option value="lbs">lbs</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Blood Type & Contact Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Blood Type *</label>
                      <select
                        name="bloodType"
                        value={formData.bloodType || ''}
                        onChange={handleFormFieldChange}
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium text-xs"
                        required
                      >
                        <option value="">Select Blood Type *</option>
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
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Contact No. (11 digits) *</label>
                      <input
                        type="text"
                        name="contactNumber"
                        value={formData.contactNumber || '09'}
                        onChange={handleFormFieldChange}
                        onFocus={(e) => {
                          if (!e.target.value) setFormData(prev => ({ ...prev, contactNumber: '09' }));
                        }}
                        placeholder="09123456789"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        required
                      />
                    </div>
                  </div>

                  {/* Facebook Account */}
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Facebook Account / Profile Link *</label>
                    <input
                      type="text"
                      name="facebookAccount"
                      value={formData.facebookAccount || ''}
                      onChange={handleFormFieldChange}
                      placeholder="https://facebook.com/username"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Emergency Contact Person *</label>
                      <input
                        type="text"
                        name="emergencyContact"
                        value={formData.emergencyContact || formData.emergencyName || ''}
                        onChange={handleFormFieldChange}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        placeholder="Parent/Guardian Name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Emergency Contact No. *</label>
                      <input
                        type="tel"
                        name="emergencyNumber"
                        value={formData.emergencyNumber || ''}
                        onChange={handleFormFieldChange}
                        maxLength={11}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        placeholder="09123456789"
                        required
                      />
                    </div>
                  </div>

                  {/* 2x2 ID Photo Upload with White Background & White Shirt */}
                  <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200">
                    <label className="block text-xs font-black uppercase tracking-wider text-emerald-950 mb-1">
                      2x2 ID Picture (White Background, White Shirt) *
                    </label>
                    <p className="text-[11px] text-slate-500 mb-3">
                      Required for official NSTP ID Card printing. Ensure clear portrait face view.
                    </p>
                    
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-20 bg-white rounded-xl border-2 border-emerald-300 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                        {formData.registrationPhoto || formData.photo ? (
                          <img src={formData.registrationPhoto || formData.photo} alt="2x2 Preview" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[9px] font-bold text-slate-400 text-center">2x2 PHOTO</span>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer active:scale-95 transition-all">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{formData.registrationPhoto || formData.photo ? 'Change 2x2 Photo' : 'Upload 2x2 Photo'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                setFormData(prev => ({
                                  ...prev,
                                  registrationPhoto: ev.target.result,
                                  photo: ev.target.result
                                }));
                              };
                              reader.readAsDataURL(file);
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
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

        {/* View Student Modal - Automatically syncs and refreshes with currentViewStudent */}
        {showViewModal && currentViewStudent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={closeViewModal}>
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto overscroll-contain" onClick={(e) => e.stopPropagation()}>
              {/* Sticky Header */}
              <div className="sticky top-0 bg-green-800 text-white p-4 flex items-center justify-between rounded-t-xl z-10">
                <h3 className="text-lg font-bold flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Student Information
                </h3>
                <button type="button" onClick={closeViewModal} className="p-1 hover:bg-green-700 rounded-lg transition-colors cursor-pointer">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
                {/* Personal & Name Breakdown Section */}
                <div className="bg-gray-50/80 p-3.5 sm:p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
                  <h4 className="text-xs sm:text-sm font-extrabold text-emerald-900 mb-3 flex items-center gap-2 uppercase tracking-wider">
                    <User className="w-4 h-4 text-emerald-600" />
                    Personal Details &amp; Name Breakdown
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200/60 shadow-2xs">
                      <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Student ID Number</span>
                      <span className="font-black text-xs sm:text-sm text-gray-900 mt-0.5 block">{currentViewStudent.studentId}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200/60 shadow-2xs">
                      <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Last Name</span>
                      <span className="font-black text-xs sm:text-sm text-gray-900 mt-0.5 block">
                        {currentViewStudent.lastName || (currentViewStudent.name?.includes(',') ? currentViewStudent.name.split(',')[0]?.trim() : currentViewStudent.name?.split(' ').slice(-1)[0]) || '-'}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200/60 shadow-2xs">
                      <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">First Name</span>
                      <span className="font-black text-xs sm:text-sm text-gray-900 mt-0.5 block">
                        {currentViewStudent.firstName || (currentViewStudent.name?.includes(',') ? currentViewStudent.name.split(',')[1]?.trim().split(' ')[0] : currentViewStudent.name?.split(' ')[0]) || '-'}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200/60 shadow-2xs">
                      <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Middle Name</span>
                      <span className="font-black text-xs sm:text-sm text-gray-900 mt-0.5 block">
                        {currentViewStudent.middleName || (currentViewStudent.name?.includes(',') ? currentViewStudent.name.split(',')[1]?.trim().split(' ').slice(1).join(' ') : (currentViewStudent.name?.split(' ').length > 2 ? currentViewStudent.name?.split(' ').slice(1, -1).join(' ') : '')) || '(None)'}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200/60 shadow-2xs">
                      <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Suffix</span>
                      <span className="font-black text-xs sm:text-sm text-gray-900 mt-0.5 block">
                        {currentViewStudent.suffix || '—'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-2.5">
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200/60 shadow-2xs">
                      <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Email Address</span>
                      <span className="font-black text-xs sm:text-sm text-gray-900 mt-0.5 block truncate">{currentViewStudent.email || '-'}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200/60 shadow-2xs">
                      <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Contact Number</span>
                      <span className="font-black text-xs sm:text-sm text-gray-900 mt-0.5 block">{currentViewStudent.contactNumber || '-'}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200/60 shadow-2xs">
                      <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Facebook Profile Link</span>
                      <span className="font-black text-xs sm:text-sm text-gray-900 mt-0.5 block truncate">
                        {currentViewStudent.facebookAccount ? (
                          <a href={currentViewStudent.facebookAccount.startsWith('http') ? currentViewStudent.facebookAccount : `https://${currentViewStudent.facebookAccount}`} target="_blank" rel="noreferrer" className="text-emerald-700 underline hover:text-emerald-900">
                            {currentViewStudent.facebookAccount}
                          </a>
                        ) : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Complete Address Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-2.5">
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200/60 shadow-2xs">
                      <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Street / Barangay</span>
                      <span className="font-bold text-xs text-gray-800 mt-0.5 block">{currentViewStudent.street || '-'}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200/60 shadow-2xs">
                      <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Municipality / City</span>
                      <span className="font-bold text-xs text-gray-800 mt-0.5 block">{currentViewStudent.municipality || '-'}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200/60 shadow-2xs">
                      <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Province</span>
                      <span className="font-bold text-xs text-gray-800 mt-0.5 block">{currentViewStudent.province || '-'}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200/60 shadow-2xs col-span-1 sm:col-span-3">
                      <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Full Combined Address</span>
                      <span className="font-bold text-xs text-gray-900 mt-0.5 block">{currentViewStudent.address || currentViewStudent.homeAddress || `${currentViewStudent.street || ''}, ${currentViewStudent.municipality || ''}, ${currentViewStudent.province || ''}`}</span>
                    </div>
                  </div>
                </div>

                {/* Academic Information Section */}
                <div className="bg-emerald-50/50 p-3.5 sm:p-5 rounded-2xl border border-emerald-200/60 shadow-2xs">
                  <h4 className="text-xs sm:text-sm font-extrabold text-emerald-900 mb-3 flex items-center gap-2 uppercase tracking-wider">
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                    Academic Information &amp; NSTP Track
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                      <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Degree Program</span>
                      <span className="font-black text-xs sm:text-sm text-emerald-950 mt-0.5 block">{currentViewStudent.program || '-'}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                      <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Section</span>
                      <span className="font-black text-xs sm:text-sm text-emerald-950 mt-0.5 block">{currentViewStudent.nstp_section || currentViewStudent.section || '-'}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                      <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Year Level</span>
                      <span className="font-black text-xs sm:text-sm text-emerald-950 mt-0.5 block">{currentViewStudent.yearLevel || currentViewStudent.year || '-'}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                      <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">NSTP Department</span>
                      <span className="font-black text-xs sm:text-sm text-emerald-700 mt-0.5 block">{currentViewStudent.department || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Demographic & Physical Information Section */}
                <div className="bg-gray-50/80 p-3.5 sm:p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
                  <h4 className="text-xs sm:text-sm font-extrabold text-emerald-900 mb-3 flex items-center gap-2 uppercase tracking-wider">
                    <Heart className="w-4 h-4 text-emerald-600" />
                    Demographic Information &amp; Physical Stats
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200/60 shadow-2xs">
                      <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Birth Month</span>
                      <span className="font-black text-xs sm:text-sm text-gray-900 mt-0.5 block">{currentViewStudent.birthMonth || '-'}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200/60 shadow-2xs">
                      <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Birth Day</span>
                      <span className="font-black text-xs sm:text-sm text-gray-900 mt-0.5 block">{currentViewStudent.birthDay || '-'}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200/60 shadow-2xs">
                      <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Birth Year</span>
                      <span className="font-black text-xs sm:text-sm text-gray-900 mt-0.5 block">{currentViewStudent.birthYear || '-'}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200/60 shadow-2xs">
                      <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Calculated Age</span>
                      <span className="font-black text-xs sm:text-sm text-gray-900 mt-0.5 block">{currentViewStudent.age || '-'} yrs old</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200/60 shadow-2xs">
                      <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Sex / Gender</span>
                      <span className="font-black text-xs sm:text-sm text-gray-900 mt-0.5 block">{currentViewStudent.sex || currentViewStudent.gender || '-'}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200/60 shadow-2xs">
                      <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Civil Status</span>
                      <span className="font-black text-xs sm:text-sm text-gray-900 mt-0.5 block">{currentViewStudent.civilStatus || '-'}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200/60 shadow-2xs col-span-2 sm:col-span-2">
                      <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Registered Voter Status</span>
                      {(() => {
                        const raw = currentViewStudent.registeredVoter || currentViewStudent.isVoter || currentViewStudent.voter;
                        const isYes = String(raw || '').trim().toLowerCase() === 'yes';
                        return (
                          <span className={`inline-block font-black text-xs px-2.5 py-0.5 rounded-full mt-1 ${
                            isYes
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}>
                            {isYes ? 'Yes (Registered Voter)' : 'No (Not Registered)'}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200/60 shadow-2xs">
                      <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Height</span>
                      <span className="font-black text-xs sm:text-sm text-gray-900 mt-0.5 block">{currentViewStudent.height ? `${currentViewStudent.height}` : '-'}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200/60 shadow-2xs">
                      <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Weight</span>
                      <span className="font-black text-xs sm:text-sm text-gray-900 mt-0.5 block">{currentViewStudent.weight ? `${currentViewStudent.weight}` : '-'}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200/60 shadow-2xs col-span-2 sm:col-span-2">
                      <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Blood Type</span>
                      <span className="font-black text-xs sm:text-sm text-gray-900 mt-0.5 block">{currentViewStudent.bloodType || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact Section */}
                <div className="bg-amber-50/60 p-3.5 sm:p-5 rounded-2xl border border-amber-200/60 shadow-2xs">
                  <h4 className="text-xs sm:text-sm font-extrabold text-amber-900 mb-3 flex items-center gap-2 uppercase tracking-wider">
                    <Phone className="w-4 h-4 text-amber-700" />
                    Emergency Contact Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="bg-white p-2.5 rounded-xl border border-amber-100 shadow-2xs">
                      <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider block">Emergency Contact Person</span>
                      <span className="font-black text-xs sm:text-sm text-amber-950 mt-0.5 block">{currentViewStudent.emergencyContact || currentViewStudent.emergencyName || '-'}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-amber-100 shadow-2xs">
                      <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider block">Emergency Contact Number</span>
                      <span className="font-black text-xs sm:text-sm text-amber-950 mt-0.5 block">{currentViewStudent.emergencyNumber || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Submitted Registration Form / Photo Document — Full Instant Inline Preview */}
                {(currentViewStudent.registrationPhoto || currentViewStudent.photoUrl) && (
                  <div className="bg-emerald-50/60 p-3.5 sm:p-5 rounded-2xl border border-emerald-200/80 shadow-2xs">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs sm:text-sm font-extrabold text-emerald-950 flex items-center gap-2 uppercase tracking-wider">
                        <FileText className="w-4 h-4 text-emerald-700" />
                        CvSU Registration Form Document Proof
                      </h4>
                      <a
                        href={currentViewStudent.registrationPhoto || currentViewStudent.photoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-white px-2.5 py-1 rounded-lg border border-emerald-300 shadow-2xs hover:bg-emerald-100 transition-colors"
                      >
                        ↗ Open Full Window
                      </a>
                    </div>
                    {typeof (currentViewStudent.registrationPhoto || currentViewStudent.photoUrl) === 'string' && (currentViewStudent.registrationPhoto || currentViewStudent.photoUrl).startsWith('data:application/pdf') ? (
                      <div className="w-full rounded-xl overflow-hidden border border-emerald-300 shadow-sm bg-white">
                        <iframe
                          src={currentViewStudent.registrationPhoto || currentViewStudent.photoUrl}
                          title="Submitted Registration Form PDF"
                          className="w-full h-80 sm:h-96 rounded-xl"
                        />
                      </div>
                    ) : (
                      <div className="rounded-xl overflow-hidden border border-gray-300 bg-gray-900/5 shadow-sm">
                        <img
                          src={currentViewStudent.registrationPhoto || currentViewStudent.photoUrl}
                          alt="Submitted Registration Form Proof"
                          className="w-full max-h-[420px] sm:max-h-[500px] object-contain mx-auto"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sticky Footer */}
              <div className="sticky bottom-0 bg-white p-4 border-t flex justify-end gap-2.5">
                <button type="button"
                  onClick={() => {
                    const st = currentViewStudent;
                    closeViewModal();
                    openEditModal(st);
                  }}
                  className="px-5 bg-emerald-700 hover:bg-emerald-800 text-white py-2 rounded-xl font-bold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Pencil className="w-4 h-4 text-amber-300" /> Edit Student
                </button>
                <button type="button"
                  onClick={closeViewModal}
                  className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        {showEditModal && (
          <div className="fixed inset-0 bg-emerald-950/75 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowEditModal(false)}>
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
                    <Pencil className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black tracking-tight">Edit Student Information</h3>
                    <p className="text-emerald-200 text-xs font-medium">Update student registration details &amp; program section</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="w-8 h-8 rounded-full bg-emerald-800/80 hover:bg-emerald-700 flex items-center justify-center text-emerald-200 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body - Synchronized with Enrollment.jsx & Add Student Modal */}
              <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
                
                {/* 1. Personal & Address Identification */}
                <div className="bg-gray-50/70 rounded-2xl p-4 sm:p-5 border border-gray-100 space-y-4">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-emerald-700" />
                    1. Personal Information &amp; Address
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Last Name *</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName || ''}
                        onChange={handleFormFieldChange}
                        placeholder="Dela Cruz"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">First Name *</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName || ''}
                        onChange={handleFormFieldChange}
                        placeholder="Juan"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Middle Name</label>
                      <input
                        type="text"
                        name="middleName"
                        value={formData.middleName || ''}
                        onChange={handleFormFieldChange}
                        placeholder="Reyes"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Suffix</label>
                      <input
                        type="text"
                        name="suffix"
                        value={formData.suffix || ''}
                        onChange={handleFormFieldChange}
                        placeholder="Jr., Sr., III (Optional)"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Student ID (9 digits) *</label>
                      <input
                        type="text"
                        name="studentId"
                        value={formData.studentId || ''}
                        onChange={handleFormFieldChange}
                        maxLength={9}
                        placeholder="202612345"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email || ''}
                        onChange={handleFormFieldChange}
                        placeholder="student@cvsu.edu.ph"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Street / Barangay *</label>
                      <input
                        type="text"
                        name="street"
                        value={formData.street || ''}
                        onChange={handleFormFieldChange}
                        placeholder="Brgy. Bucana"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Municipality / City *</label>
                      <input
                        type="text"
                        name="municipality"
                        value={formData.municipality || ''}
                        onChange={handleFormFieldChange}
                        placeholder="Naic"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Province *</label>
                      <input
                        type="text"
                        name="province"
                        value={formData.province || ''}
                        onChange={handleFormFieldChange}
                        placeholder="Cavite"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Academic Information */}
                <div className="bg-emerald-50/50 rounded-2xl p-4 sm:p-5 border border-emerald-100/80 space-y-4">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-emerald-700" />
                    2. Academic Details &amp; Section
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Program *</label>
                      <select
                        name="program"
                        value={formData.program || ''}
                        onChange={handleFormFieldChange}
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium text-xs"
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
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Section *</label>
                      <select
                        name="section"
                        value={formData.section || ''}
                        onChange={handleFormFieldChange}
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium text-xs"
                        required
                      >
                        <option value="">Select Section</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Year Level *</label>
                      <select
                        name="yearLevel"
                        value={formData.yearLevel || formData.year || '1st Year'}
                        onChange={handleFormFieldChange}
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium text-xs"
                        required
                      >
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Department / Track *</label>
                      <select
                        name="department"
                        value={formData.department || ''}
                        onChange={handleFormFieldChange}
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium text-xs"
                        required
                      >
                        <option value="">Select Department *</option>
                        <option value="CWTS">CWTS</option>
                        <option value="LTS">LTS</option>
                        <option value="ROTC">ROTC</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. Demographic & Emergency Info */}
                <div className="bg-gray-50/70 rounded-2xl p-4 sm:p-5 border border-gray-100 space-y-4">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-emerald-700" />
                    3. Demographic &amp; Emergency Details
                  </h4>
                  
                  {/* Birth Date */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Birth Month *</label>
                      <input
                        type="text"
                        name="birthMonth"
                        value={formData.birthMonth || ''}
                        onChange={handleFormFieldChange}
                        placeholder="1-12"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Birth Day *</label>
                      <input
                        type="text"
                        name="birthDay"
                        value={formData.birthDay || ''}
                        onChange={handleFormFieldChange}
                        placeholder="1-31"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Birth Year *</label>
                      <input
                        type="text"
                        name="birthYear"
                        value={formData.birthYear || ''}
                        onChange={handleFormFieldChange}
                        placeholder="YYYY"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        required
                      />
                    </div>
                  </div>

                  {/* Age, Civil Status, Sex, Registered Voter */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center justify-between">
                        <span>Age *</span>
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">Auto</span>
                      </label>
                      <input
                        type="text"
                        name="age"
                        readOnly
                        placeholder="Auto-computed"
                        value={formData.age || ''}
                        className="w-full px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-xl outline-none font-bold text-emerald-950 text-xs cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Civil Status *</label>
                      <select
                        name="civilStatus"
                        value={formData.civilStatus || ''}
                        onChange={handleFormFieldChange}
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium text-xs"
                        required
                      >
                        <option value="">Select Status *</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Sex *</label>
                      <select
                        name="sex"
                        value={formData.sex || formData.gender || ''}
                        onChange={handleFormFieldChange}
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium text-xs"
                        required
                      >
                        <option value="">Select Sex *</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Registered Voter? *</label>
                      <select
                        name="registeredVoter"
                        value={formData.registeredVoter || ''}
                        onChange={handleFormFieldChange}
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium text-xs"
                        required
                      >
                        <option value="">Voter Status *</option>
                        <option value="Yes">Yes (Registered Voter)</option>
                        <option value="No">No (Not Registered)</option>
                      </select>
                    </div>
                  </div>

                  {/* Height & Weight with units */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center justify-between">
                        <span>Height *</span>
                        {formData.height && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">System: {formData.height} cm</span>}
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder={heightUnit === 'cm' ? 'e.g. 165' : heightUnit === 'ft' ? "e.g. 5'8\" or 5.7" : 'e.g. 1.65'}
                          value={heightInput}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^0-9.'"]/g, '');
                            setHeightInput(raw);
                            const cmVal = convertToCm(raw, heightUnit);
                            setFormData(prev => ({ ...prev, height: cmVal }));
                          }}
                          className="flex-1 min-w-0 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium text-xs"
                          required
                        />
                        <select
                          value={heightUnit}
                          onChange={(e) => {
                            const newUnit = e.target.value;
                            setHeightUnit(newUnit);
                            const cmVal = convertToCm(heightInput, newUnit);
                            setFormData(prev => ({ ...prev, height: cmVal }));
                          }}
                          className="px-2.5 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none cursor-pointer hover:bg-gray-200"
                        >
                          <option value="cm">cm</option>
                          <option value="ft">ft / in</option>
                          <option value="m">m</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center justify-between">
                        <span>Weight *</span>
                        {formData.weight && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">System: {formData.weight} kg</span>}
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder={weightUnit === 'kg' ? 'e.g. 55' : 'e.g. 120'}
                          value={weightInput}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^0-9.]/g, '');
                            setWeightInput(raw);
                            const kgVal = convertToKg(raw, weightUnit);
                            setFormData(prev => ({ ...prev, weight: kgVal }));
                          }}
                          className="flex-1 min-w-0 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium text-xs"
                          required
                        />
                        <select
                          value={weightUnit}
                          onChange={(e) => {
                            const newUnit = e.target.value;
                            setWeightUnit(newUnit);
                            const kgVal = convertToKg(weightInput, newUnit);
                            setFormData(prev => ({ ...prev, weight: kgVal }));
                          }}
                          className="px-2.5 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none cursor-pointer hover:bg-gray-200"
                        >
                          <option value="kg">kg</option>
                          <option value="lbs">lbs</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Blood Type & Contact Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Blood Type *</label>
                      <select
                        name="bloodType"
                        value={formData.bloodType || ''}
                        onChange={handleFormFieldChange}
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium text-xs"
                        required
                      >
                        <option value="">Select Blood Type *</option>
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
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Contact No. (11 digits) *</label>
                      <input
                        type="text"
                        name="contactNumber"
                        value={formData.contactNumber || '09'}
                        onChange={handleFormFieldChange}
                        onFocus={(e) => {
                          if (!e.target.value) setFormData(prev => ({ ...prev, contactNumber: '09' }));
                        }}
                        placeholder="09123456789"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        required
                      />
                    </div>
                  </div>

                  {/* Facebook Account */}
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Facebook Account / Profile Link *</label>
                    <input
                      type="text"
                      name="facebookAccount"
                      value={formData.facebookAccount || ''}
                      onChange={handleFormFieldChange}
                      placeholder="https://facebook.com/username"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                      required
                    />
                  </div>

                  {/* Emergency Contact Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-200/60">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Emergency Contact Person *</label>
                      <input
                        type="text"
                        name="emergencyContact"
                        value={formData.emergencyContact || formData.emergencyName || ''}
                        onChange={handleFormFieldChange}
                        placeholder="Parent or Guardian Name"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Emergency Contact No. *</label>
                      <input
                        type="tel"
                        name="emergencyNumber"
                        value={formData.emergencyNumber || '09'}
                        onChange={handleFormFieldChange}
                        onFocus={(e) => {
                          if (!e.target.value) setFormData(prev => ({ ...prev, emergencyNumber: '09' }));
                        }}
                        placeholder="09123456789"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        required
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0 rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 text-gray-600 hover:bg-gray-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleEditStudent}
                  disabled={isEditingStudent}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-60"
                >
                  {isEditingStudent ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Batch A4 NSTP ID Cards Download & Print Modal */}
        <BatchIdPrintModal
          isOpen={showBatchIdModal}
          onClose={() => setShowBatchIdModal(false)}
          defaultDepartment={isAdmin ? filterDept : (user?.department || 'CWTS')}
        />

        {/* Student Attendance & Absences Matrix Modal */}
        <StudentAttendanceMatrixModal
          isOpen={showAttendanceMatrix}
          onClose={() => setShowAttendanceMatrix(false)}
          students={students}
          currentUser={user}
        />

      </main>
      <ScrollToTopButton />
    </div>
  );
}

export default StudentManagement;

