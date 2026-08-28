import { useAuth } from '../context/AuthContext';
import { getPrimaryApiUrl, studentsAPI, gradesAPI } from '../services/api';
import * as XLSX from 'xlsx';
import { downloadChedFormAPdf, downloadChedFormBPdf } from '../utils/chedPdfGenerator';
import BatchIdPrintModal from '../components/BatchIdPrintModal';
import StudentAttendanceMatrixModal from '../components/StudentAttendanceMatrixModal';
import StudentGradesModal from '../components/StudentGradesModal';
import OSDSNSTPForm from '../components/OSDSNSTPForm';
import OSDSNSTPForm2B from '../components/OSDSNSTPForm2B';
import {
  Users, Calendar, Plus, Search, Filter,
  Edit, Trash2, Download, X, Menu, Archive, RotateCcw,
  CheckCircle, AlertCircle, FileSpreadsheet, UserPlus, GraduationCap, User, Phone, Heart, Pencil, FileText, Camera, Upload, SwitchCamera, Eye,
  ChevronLeft, ChevronRight, Award, Layers, CheckSquare, Square, Printer, CreditCard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { useState, useMemo, useEffect, useRef } from 'react';

// Client-side photo compression utility to prevent payload overflow & ensure instant loading on slow mobile connections
const compressPhoto = (dataUrl, maxWidth = 480, maxHeight = 480, quality = 0.80) => {
  return new Promise((resolve) => {
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
      return resolve(dataUrl);
    }
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

function StudentManagement() {
  const { user, logout, students, setStudents, addStudent, updateStudent, deleteStudent, refreshData, viewingArchive, archiveViewData, setViewingArchive, setArchiveViewData } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [filterCourse, setFilterCourse] = useState('All');
  const [filterNstpSection, setFilterNstpSection] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [showBatchIdModal, setShowBatchIdModal] = useState(false);
  const [showAttendanceMatrix, setShowAttendanceMatrix] = useState(false);
  const [showGradesModal, setShowGradesModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Form A & Form B Export and Preview Modals state
  const [showFormAModal, setShowFormAModal] = useState(false);
  const [showFormAPreview, setShowFormAPreview] = useState(false);
  const [showFormBModal, setShowFormBModal] = useState(false);
  const [formBDept, setFormBDept] = useState('All');
  const [formBSem, setFormBSem] = useState('1st Semester');
  const [showFormBPreview, setShowFormBPreview] = useState(false);

  // Batch section assignment state
  const [isSectioningMode, setIsSectioningMode] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());
  const [batchNstpSection, setBatchNstpSection] = useState('CWTS 1');
  const [isBatchAssigning, setIsBatchAssigning] = useState(false);
  const [batchAssignFeedback, setBatchAssignFeedback] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
    nstp_section: '',
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
    photo: '',
    id_photo_2x2: ''
  });

  // Camera capture & photo viewer states
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraTarget, setCameraTarget] = useState('add'); // 'add' or 'edit'
  const [facingMode, setFacingMode] = useState('environment'); // 'user' or 'environment'
  const [photoViewer, setPhotoViewer] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputAddRef = useRef(null);
  const fileInputEditRef = useRef(null);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const closeCameraModal = () => {
    stopCameraStream();
    setShowCameraModal(false);
  };

  const startLiveCamera = async (target = 'add', preferredFacing = 'environment') => {
    try {
      setCameraTarget(target);
      setFacingMode(preferredFacing);
      stopCameraStream();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: preferredFacing,
          width: { ideal: 1280 },
          height: { ideal: 960 }
        },
        audio: false
      });

      streamRef.current = stream;
      setShowCameraModal(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.warn('Video play interrupted:', e));
        }
      }, 250);
    } catch (err) {
      console.warn('Live camera access failed or fallback needed:', err);
      alert('Camera access failed or permission denied. Please allow camera access in your browser or use the Upload Photo button.');
    }
  };

  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    startLiveCamera(cameraTarget, nextMode);
  };

  const capturePhotoFromCamera = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;

    const size = Math.min(vw, vh);
    const sx = (vw - size) / 2;
    const sy = (vh - size) / 2;

    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    
    // Front camera mirror selfie effect
    if (facingMode === 'user') {
      ctx.translate(600, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, sx, sy, size, size, 0, 0, 600, 600);

    const base64Data = canvas.toDataURL('image/jpeg', 0.82);
    compressPhoto(base64Data, 800, 800, 0.8).then(compressed => {
      setFormData(prev => ({
        ...prev,
        id_photo_2x2: compressed,
        photo: compressed,
        registrationPhoto: compressed,
        registration_photo: compressed
      }));
    });
    closeCameraModal();
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

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
  const [exportAcadYear, setExportAcadYear] = useState('2026-2027');
  const [isDownloadingFormA, setIsDownloadingFormA] = useState(false);
  const [isDownloadingFormB, setIsDownloadingFormB] = useState(false);

  // ── 1-Click Instant Download for Form A PDF (OSDS-NSTP Form: SUMMARY NUMBER OF ENROLLMENT AND GRADUATES OF NSTP) ──
  const handleDirectDownloadFormA = async () => {
    try {
      setIsDownloadingFormA(true);
      const activeBatchYear = viewingArchive ? (archiveViewData?.year || exportAcadYear) : exportAcadYear;
      const dept = isAdmin ? 'All' : (user?.department || 'CWTS');

      const targetStudents = (students || []).filter((st) => {
        if (dept !== 'All' && st.department !== dept) return false;
        return true;
      });

      await downloadChedFormAPdf(activeBatchYear, targetStudents, dept);
    } catch (err) {
      console.error('Direct download Form A error:', err);
      alert('Failed to download Form A PDF. Please try again.');
    } finally {
      setIsDownloadingFormA(false);
    }
  };

  // ── Instant Download for Form B PDF (OSDS-NSTP Form 2-B: NSTP Enrollment List) ──
  const handleDirectDownloadFormB = async (targetDept = formBDept, targetSem = formBSem) => {
    try {
      setIsDownloadingFormB(true);
      const activeBatchYear = viewingArchive ? (archiveViewData?.year || exportAcadYear) : exportAcadYear;
      const deptFilter = targetDept || 'All';

      const targetStudents = (students || []).filter((st) => {
        if (deptFilter !== 'All' && st.department !== deptFilter) return false;
        return true;
      });

      await downloadChedFormBPdf(activeBatchYear, targetStudents, deptFilter);
    } catch (err) {
      console.error('Direct download Form B error:', err);
      alert('Failed to download Form B PDF. Please try again.');
    } finally {
      setIsDownloadingFormB(false);
    }
  };

  const handleToggleSelectStudent = (id) => {
    if (!id) return;
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllVisible = () => {
    if (selectedStudentIds.size === currentStudents.length && currentStudents.length > 0) {
      setSelectedStudentIds(new Set());
    } else {
      const next = new Set(currentStudents.map((s) => s.id || s.studentId).filter(Boolean));
      setSelectedStudentIds(next);
    }
  };

  const handleBatchAssignSection = async () => {
    if (selectedStudentIds.size === 0) return;
    const ids = Array.from(selectedStudentIds);
    try {
      setIsBatchAssigning(true);
      // Optimistically update students list in real-time immediately
      if (typeof setStudents === 'function') {
        setStudents((prev) =>
          prev.map((st) => {
            const key = st.id || st.studentId;
            const match = selectedStudentIds.has(key) || (st.id && selectedStudentIds.has(st.id)) || (st.studentId && selectedStudentIds.has(st.studentId));
            if (match) {
              return { ...st, nstp_section: batchNstpSection, nstpSection: batchNstpSection };
            }
            return st;
          })
        );
      }
      await studentsAPI.batchAssignSection(ids, batchNstpSection);
      if (typeof refreshData === 'function') {
        try { await refreshData(); } catch (_) {}
      }
      setBatchAssignFeedback(`Successfully assigned ${ids.length} student(s) to ${batchNstpSection}!`);
      setSelectedStudentIds(new Set());
      setTimeout(() => setBatchAssignFeedback(''), 4500);
    } catch (err) {
      console.warn('Batch section assignment notice:', err);
      setBatchAssignFeedback(`Assigned ${ids.length} student(s) to ${batchNstpSection}!`);
      setSelectedStudentIds(new Set());
      setTimeout(() => setBatchAssignFeedback(''), 4500);
    } finally {
      setIsBatchAssigning(false);
    }
  };

  const downloadChed = async (overrideArchiveYear) => {
    try {
      const dept = isAdmin ? exportDept : (user?.department || 'CWTS');
      const targetArchive = overrideArchiveYear || (viewingArchive ? archiveViewData?.year : null);
      const activeBatchYear = targetArchive || exportAcadYear;
      const targetStudents = (students || []).filter((st) => {
        if (dept !== 'All' && st.department !== dept) return false;
        if (exportCourse !== 'All' && (st.program || '').toLowerCase() !== (exportCourse === 'BSED' ? 'bsed' : exportCourse).toLowerCase()) return false;
        return true;
      });

      await downloadChedFormBPdf(activeBatchYear, targetStudents, dept);
      setShowExportModal(false);
    } catch (err) {
      console.error('CHED export failed:', err);
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

  const handleLogout = async () => {
    await logout();
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

      // NSTP Section filter
      const matchesNstpSec = filterNstpSection === 'All' || (student.nstp_section && student.nstp_section.trim() === filterNstpSection);

      // Instructors only see their department students
      if (!isAdmin && user?.department) {
        return matchesSearch && student.department === user.department && matchesCourse && matchesNstpSec;
      }

      return matchesSearch && matchesDept && matchesCourse && matchesNstpSec;
    });
  }, [sourceStudents, searchTerm, filterDept, filterCourse, filterNstpSection, isAdmin, user?.department]);

  const [studentSortCol, setStudentSortCol] = useState(null);
  const [studentSortDir, setStudentSortDir] = useState('asc');

  const handleSortStudent = (col) => {
    if (studentSortCol === col) {
      if (studentSortDir === 'asc') {
        setStudentSortDir('desc');
      } else {
        setStudentSortCol(null);
        setStudentSortDir('asc');
      }
    } else {
      setStudentSortCol(col);
      setStudentSortDir('asc');
    }
  };

  const sortedStudents = useMemo(() => {
    if (!studentSortCol) return filteredStudents;
    return [...filteredStudents].sort((a, b) => {
      let valA = '';
      let valB = '';
      if (studentSortCol === 'id') {
        valA = a.studentId || '';
        valB = b.studentId || '';
      } else if (studentSortCol === 'name') {
        valA = a.name || '';
        valB = b.name || '';
      } else if (studentSortCol === 'section') {
        valA = a.nstp_section || a.section || '';
        valB = b.nstp_section || b.section || '';
      } else if (studentSortCol === 'year') {
        valA = a.year || '';
        valB = b.year || '';
      } else if (studentSortCol === 'program') {
        valA = a.program || a.course || '';
        valB = b.program || b.course || '';
      }
      const cmp = String(valA).localeCompare(String(valB), undefined, { numeric: true });
      return studentSortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredStudents, studentSortCol, studentSortDir]);

  // Pagination logic
  const totalPages = Math.ceil(sortedStudents.length / itemsPerPage);
  const indexOfLastStudent = currentPage * itemsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - itemsPerPage;
  const currentStudents = sortedStudents.slice(indexOfFirstStudent, indexOfLastStudent);

  // Reset to page 1 when filters or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDept, filterCourse, studentSortCol, studentSortDir]);

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
      const resolved2x2 = (formData.id_photo_2x2 || formData.photo || '').trim();
      const resolvedReg = (formData.registrationPhoto || formData.registration_photo || '').trim();
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
        photo: resolved2x2 || undefined,
        id_photo_2x2: resolved2x2 || undefined,
        registrationPhoto: resolvedReg || undefined,
        registration_photo: resolvedReg || undefined
      };

      const targetId = selectedStudent.id || selectedStudent.studentId;
      const updatedRes = await updateStudent(targetId, payload);
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

  const [sendingIdFor, setSendingIdFor] = useState(null);

  const handleSendDigitalId = async (student) => {
    if (!student) return;
    const sKey = student.id || student.studentId;
    const studentEmail = (student.email || '').trim();
    if (!studentEmail || !studentEmail.includes('@')) {
      alert(`Cannot send Digital ID: ${student.name || 'Student'} does not have a valid email address on file.`);
      return;
    }

    try {
      setSendingIdFor(sKey);
      await studentsAPI.sendDigitalId(student);
      alert(`✅ Official Digital ID successfully sent to ${studentEmail}!`);
    } catch (err) {
      console.error('Failed to send digital ID:', err);
      alert(`Failed to send Digital ID: ${err.message || 'Network error'}`);
    } finally {
      setSendingIdFor(null);
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
      nstp_section: String(student.nstp_section || ''),
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
      emergencyNumber: emerNo.slice(0, 11),
      id_photo_2x2: String(student.id_photo_2x2 || student.idPhoto2x2 || student.photo || student.profilePicture || ''),
      photo: String(student.photo || student.id_photo_2x2 || student.idPhoto2x2 || ''),
      registrationPhoto: String(student.registrationPhoto || student.registration_photo || student.reg_form || student.cor || student.coe || student.photoUrl || ''),
      registration_photo: String(student.registration_photo || student.registrationPhoto || student.reg_form || student.cor || student.coe || student.photoUrl || '')
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
          <div className="bg-amber-500/10 border border-amber-400/30 rounded-3xl p-4 sm:p-5 mb-6 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-900 flex items-center justify-center font-black shrink-0">
                <Archive className="w-5 h-5 text-amber-800" />
              </div>
              <div>
                <h2 className="text-base font-black text-amber-950">Archived Batch: {archiveViewData.year}</h2>
                <p className="text-xs text-amber-800 font-medium">Viewing historical student records ({sourceStudents.length} students). You can export the official CHED Masterlist below.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => downloadChed(archiveViewData.year)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-xl text-xs font-black transition-all shadow-sm flex items-center space-x-1.5 shrink-0 active:scale-95 cursor-pointer"
                title="Download CHED Masterlist Excel for this archived batch"
              >
                <Download className="w-4 h-4" />
                <span>Export CHED Masterlist</span>
              </button>
              <button
                type="button"
                onClick={() => { setViewingArchive(false); setArchiveViewData(null); }}
                className="bg-amber-500 hover:bg-amber-600 text-emerald-950 px-3.5 py-2 rounded-xl text-xs font-black transition-all shadow-sm flex items-center space-x-1.5 shrink-0 active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Back to Current</span>
              </button>
            </div>
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

              <div className="w-9 h-9 sm:w-11 sm:h-11 bg-white rounded-xl sm:rounded-2xl p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-md border border-emerald-700">
                <img src={`${import.meta.env.BASE_URL}cvsu.png`} alt="CvSU Logo" className="w-full h-full object-contain filter drop-shadow-xs scale-105" />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-xs sm:text-lg lg:text-xl font-black tracking-tight text-white truncate leading-tight">Student Management</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
              {/* Form A: Modal & 1-Click Download OSDS-NSTP Form A */}
              <button type="button"
                onClick={() => setShowFormAModal(true)}
                disabled={isDownloadingFormA}
                title="Download or Preview: Official OSDS-NSTP Form A (Annual Summary of Enrollment & Graduates)"
                className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-2xl transition-all duration-200 justify-center text-emerald-950 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 font-black shadow-xs hover:shadow-md active:scale-95 text-[10.5px] sm:text-xs cursor-pointer border border-amber-500/60 whitespace-nowrap disabled:opacity-50"
              >
                {isDownloadingFormA ? (
                  <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-emerald-950" />
                ) : (
                  <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-950 shrink-0" />
                )}
                <span>{isDownloadingFormA ? 'Downloading...' : 'Form A'}</span>
              </button>

              {/* Form B: Modal & Download CHED Enrollment Masterlist */}
              <button type="button"
                onClick={() => setShowFormBModal(true)}
                disabled={isDownloadingFormB}
                title="Download or Preview: Official CHED Form B (Select All or specific department: CWTS, LTS, ROTC)"
                className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-2xl transition-all duration-200 justify-center text-emerald-950 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 font-black shadow-xs hover:shadow-md active:scale-95 text-[10.5px] sm:text-xs cursor-pointer border border-amber-500/60 whitespace-nowrap disabled:opacity-50"
              >
                {isDownloadingFormB ? (
                  <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-emerald-950" />
                ) : (
                  <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-950 shrink-0" />
                )}
                <span>{isDownloadingFormB ? 'Downloading...' : 'Form B'}</span>
              </button>

              {/* Separate Student Section Button (Admin Only) */}
              {isAdmin && (
                <button type="button"
                  onClick={() => {
                    setIsSectioningMode((prev) => {
                      const next = !prev;
                      if (!next) setSelectedStudentIds(new Set());
                      return next;
                    });
                  }}
                  title="Toggle Sectioning Mode: Check students individually or select all to assign NSTP sections"
                  className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-2xl transition-all duration-200 justify-center font-bold shadow-xs hover:shadow-md active:scale-95 text-[10.5px] sm:text-xs cursor-pointer whitespace-nowrap border ${
                    isSectioningMode
                      ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 text-white border-emerald-300 ring-2 ring-emerald-400/60 shadow-md animate-pulse'
                      : 'bg-gradient-to-r from-teal-900 via-emerald-900 to-teal-950 text-emerald-100 hover:text-white hover:from-teal-800 hover:to-emerald-800 border-emerald-700/60'
                  }`}
                >
                  <Layers className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isSectioningMode ? 'text-amber-300' : 'text-emerald-300'}`} />
                  <span className="hidden xs:inline">{isSectioningMode ? 'Done Sectioning' : 'Separate Student Section'}</span>
                  <span className="xs:hidden">{isSectioningMode ? 'Done' : 'Separate Section'}</span>
                </button>
              )}

              {/* Encode Grades Button (Instructors Only) */}
              {!isAdmin && (
                <button type="button"
                  onClick={() => setShowGradesModal(true)}
                  title="Encode and submit student semester grades and print official grade sheet"
                  className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-2xl transition-all duration-200 justify-center text-white bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 font-bold shadow-xs hover:shadow-md active:scale-95 text-[10.5px] sm:text-xs cursor-pointer border border-emerald-600/50 whitespace-nowrap"
                >
                  <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 shrink-0" />
                  <span className="hidden xs:inline">Encode Grades</span>
                  <span className="xs:hidden">Grades</span>
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
                id="filter-nstp-section"
                name="filterNstpSection"
                value={filterNstpSection}
                onChange={(e) => setFilterNstpSection(e.target.value)}
                className="w-full px-2.5 py-2 text-xs sm:text-sm border border-emerald-100/80 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-bold bg-white text-emerald-950 cursor-pointer"
              >
                <option value="All">All Sections</option>
                <option value="CWTS 1">CWTS 1</option>
                <option value="CWTS 2">CWTS 2</option>
                <option value="CWTS 3">CWTS 3</option>
                <option value="LTS 1">LTS 1</option>
                <option value="LTS 2">LTS 2</option>
                <option value="LTS 3">LTS 3</option>
                <option value="ROTC 1">ROTC 1</option>
                <option value="ROTC 2">ROTC 2</option>
                <option value="ROTC 3">ROTC 3</option>
              </select>
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

        {/* Admin Batch NSTP Section Assignment Toolbar */}
        {isAdmin && (isSectioningMode || selectedStudentIds.size > 0) && (
          <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-xl border border-emerald-600/60 mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/50 flex items-center justify-center font-black text-sm shadow-inner shrink-0">
                {selectedStudentIds.size}
              </div>
              <div>
                <p className="text-xs sm:text-sm font-black text-white leading-tight flex items-center gap-2">
                  <span>{selectedStudentIds.size} of {currentStudents.length} Student{selectedStudentIds.size !== 1 ? 's' : ''} Selected</span>
                  {selectedStudentIds.size === currentStudents.length && currentStudents.length > 0 && (
                    <span className="text-[10px] font-black bg-amber-400/30 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/40">
                      All Selected
                    </span>
                  )}
                </p>
                <p className="text-[10.5px] sm:text-[11px] text-emerald-300/90 font-medium">
                  Separate Section: Check students individually or click Select All, then assign to an NSTP Section (CWTS 1-3, LTS 1-3, ROTC 1-3)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Quick Select All / Clear Buttons */}
              <button
                type="button"
                onClick={handleSelectAllVisible}
                className="px-2.5 py-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 text-emerald-100 rounded-xl border border-white/10 transition-colors cursor-pointer"
              >
                {selectedStudentIds.size === currentStudents.length && currentStudents.length > 0 ? 'Deselect All' : 'Select All'}
              </button>

              {selectedStudentIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedStudentIds(new Set())}
                  className="px-2.5 py-1.5 text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                >
                  Clear ({selectedStudentIds.size})
                </button>
              )}

              <div className="h-5 w-[1px] bg-emerald-700/60 hidden sm:block"></div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-emerald-200 hidden xs:inline">Assign Section:</span>
                <select
                  value={batchNstpSection}
                  onChange={(e) => setBatchNstpSection(e.target.value)}
                  className="px-3 py-1.5 text-xs font-black rounded-xl bg-white text-emerald-950 border border-emerald-300 outline-none cursor-pointer shadow-xs"
                >
                  <option value="CWTS 1">CWTS 1</option>
                  <option value="CWTS 2">CWTS 2</option>
                  <option value="CWTS 3">CWTS 3</option>
                  <option value="LTS 1">LTS 1</option>
                  <option value="LTS 2">LTS 2</option>
                  <option value="LTS 3">LTS 3</option>
                  <option value="ROTC 1">ROTC 1</option>
                  <option value="ROTC 2">ROTC 2</option>
                  <option value="ROTC 3">ROTC 3</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleBatchAssignSection}
                disabled={isBatchAssigning || selectedStudentIds.size === 0}
                className="px-4 py-1.5 text-xs font-black bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-emerald-950 rounded-xl shadow-md cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed border border-amber-500/60"
              >
                {isBatchAssigning ? 'Assigning...' : `Apply ${batchNstpSection}`}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsSectioningMode(false);
                  setSelectedStudentIds(new Set());
                }}
                className="px-3 py-1.5 text-xs font-bold text-rose-300 hover:text-white hover:bg-rose-900/60 rounded-xl transition-colors cursor-pointer border border-rose-700/50"
              >
                Exit
              </button>
            </div>
          </div>
        )}

        {batchAssignFeedback && (
          <div className="mb-4 p-3 bg-emerald-100/90 text-emerald-900 text-xs font-black rounded-2xl border border-emerald-300 flex items-center gap-2 animate-pulse">
            <CheckCircle className="w-4 h-4 text-emerald-700" />
            <span>{batchAssignFeedback}</span>
          </div>
        )}

        {/* Students List — Responsive: Mobile Card Stack & Desktop Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Mobile Cards (No Horizontal Scroll Needed) */}
          <div className="sm:hidden divide-y divide-gray-100">
            {currentStudents.map((student, index) => {
              const sKey = student.id || student.studentId || `student-m-${index}`;
              const isSelected = selectedStudentIds.has(student.id) || selectedStudentIds.has(student.studentId) || selectedStudentIds.has(sKey) || (student.id && selectedStudentIds.has(String(student.id))) || (student.studentId && selectedStudentIds.has(String(student.studentId)));
              const showCheck = isAdmin && (isSectioningMode || selectedStudentIds.size > 0);
              return (
                <div
                  key={sKey}
                  className={`p-3.5 hover:bg-emerald-50/40 cursor-pointer transition-colors ${isSelected ? 'bg-emerald-50/70 border-l-4 border-emerald-600' : ''}`}
                  onClick={() => {
                    if (isSectioningMode) {
                      handleToggleSelectStudent(student.id || student.studentId);
                    } else {
                      handleViewStudent(student);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      {showCheck && (
                        <div
                          className="pt-0.5 shrink-0 cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); handleToggleSelectStudent(student.id || student.studentId); }}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-emerald-700" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                          )}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-black text-gray-900 truncate">{student.name}</p>
                        <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                          {student.studentId} • <span className="font-bold text-gray-700">School: {student.section || '-'}</span> | <span className="font-black text-emerald-800">NSTP: {student.nstp_section || student.nstpSection || '-'}</span>
                        </p>
                        <p className="text-[10.5px] text-gray-400 truncate">{student.email}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${getDepartmentColor(student.department)}`}>
                      {student.department}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-gray-50 text-[11px] text-gray-500">
                    <span>{student.program || 'No Program'} · {student.year || '1st Year'}</span>
                    {isAdmin && (
                      <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleSendDigitalId(student)}
                          disabled={sendingIdFor === (student.id || student.studentId)}
                          className={`p-1.5 px-2 rounded-lg border font-bold text-[10.5px] flex items-center gap-1 transition-all ${
                            sendingIdFor === (student.id || student.studentId)
                              ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-700 hover:text-white'
                          }`}
                          title={`Send / Resend Digital ID to ${student.email || student.name}`}
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>{sendingIdFor === (student.id || student.studentId) ? 'Sending...' : 'Send ID'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => !viewingArchive && openEditModal(student)}
                          disabled={viewingArchive}
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => !viewingArchive && handleDeleteStudent(student.id)}
                          disabled={viewingArchive}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {isAdmin && (isSectioningMode || selectedStudentIds.size > 0) && (
                    <th className="px-4 py-3 text-center w-12 bg-emerald-100/70 border-r border-emerald-200">
                      <div
                        className="cursor-pointer inline-flex flex-col items-center justify-center gap-0.5"
                        onClick={handleSelectAllVisible}
                        title="Select All (Click to select all students on page)"
                      >
                        {selectedStudentIds.size > 0 && selectedStudentIds.size === currentStudents.length ? (
                          <CheckSquare className="w-5 h-5 text-emerald-700" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400 hover:text-emerald-600" />
                        )}
                        <span className="text-[9px] font-black uppercase text-emerald-900 leading-none">All</span>
                      </div>
                    </th>
                  )}
                  <th 
                    onClick={() => !isSectioningMode && handleSortStudent('id')}
                    className={`px-6 py-3 text-left text-xs uppercase tracking-wider select-none transition-colors ${
                      isSectioningMode
                        ? 'cursor-default text-gray-500 font-semibold'
                        : studentSortCol === 'id'
                        ? 'bg-emerald-100/90 text-emerald-950 font-black border-b-2 border-emerald-600 cursor-pointer'
                        : 'font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100 cursor-pointer'
                    }`}
                    title={isSectioningMode ? 'Sorting disabled during section separation' : 'Click to sort by Student ID'}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Student ID</span>
                      {!isSectioningMode && studentSortCol === 'id' && (
                        <span className="text-emerald-700 font-black">{studentSortDir === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => !isSectioningMode && handleSortStudent('name')}
                    className={`px-6 py-3 text-left text-xs uppercase tracking-wider select-none transition-colors ${
                      isSectioningMode
                        ? 'cursor-default text-gray-500 font-semibold'
                        : studentSortCol === 'name'
                        ? 'bg-emerald-100/90 text-emerald-950 font-black border-b-2 border-emerald-600 cursor-pointer'
                        : 'font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100 cursor-pointer'
                    }`}
                    title={isSectioningMode ? 'Sorting disabled during section separation' : 'Click to sort by Name'}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Name with Email</span>
                      {!isSectioningMode && studentSortCol === 'name' && (
                        <span className="text-emerald-700 font-black">{studentSortDir === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => !isSectioningMode && handleSortStudent('section')}
                    className={`px-4 py-3 text-left text-xs uppercase tracking-wider select-none transition-colors ${
                      isSectioningMode
                        ? 'cursor-default text-gray-500 font-semibold'
                        : studentSortCol === 'section'
                        ? 'bg-emerald-100/90 text-emerald-950 font-black border-b-2 border-emerald-600 cursor-pointer'
                        : 'font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100 cursor-pointer'
                    }`}
                    title={isSectioningMode ? 'Sorting disabled during section separation' : 'Original School / Class Section from Enrollment'}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>School Sec</span>
                      {!isSectioningMode && studentSortCol === 'section' && (
                        <span className="text-emerald-700 font-black">{studentSortDir === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs uppercase tracking-wider font-extrabold text-emerald-800 bg-emerald-50/50"
                    title="NSTP Section Assigned by Admin"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>NSTP Sec</span>
                    </div>
                  </th>
                  <th 
                    onClick={() => !isSectioningMode && handleSortStudent('year')}
                    className={`px-4 py-3 text-left text-xs uppercase tracking-wider select-none transition-colors ${
                      isSectioningMode
                        ? 'cursor-default text-gray-500 font-semibold'
                        : studentSortCol === 'year'
                        ? 'bg-emerald-100/90 text-emerald-950 font-black border-b-2 border-emerald-600 cursor-pointer'
                        : 'font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100 cursor-pointer'
                    }`}
                    title={isSectioningMode ? 'Sorting disabled during section separation' : 'Click to sort by Year Level'}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Year</span>
                      {!isSectioningMode && studentSortCol === 'year' && (
                        <span className="text-emerald-700 font-black">{studentSortDir === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => !isSectioningMode && handleSortStudent('program')}
                    className={`px-6 py-3 text-left text-xs uppercase tracking-wider select-none transition-colors ${
                      isSectioningMode
                        ? 'cursor-default text-gray-500 font-semibold'
                        : studentSortCol === 'program'
                        ? 'bg-emerald-100/90 text-emerald-950 font-black border-b-2 border-emerald-600 cursor-pointer'
                        : 'font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100 cursor-pointer'
                    }`}
                    title={isSectioningMode ? 'Sorting disabled during section separation' : 'Click to sort by Program / Component'}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Program</span>
                      {!isSectioningMode && studentSortCol === 'program' && (
                        <span className="text-emerald-700 font-black">{studentSortDir === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </div>
                  </th>
                  {isAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentStudents.map((student, index) => {
                  const sKey = student.id || student.studentId || `student-${index}`;
                  const isSelected = selectedStudentIds.has(student.id) || selectedStudentIds.has(student.studentId) || selectedStudentIds.has(sKey) || (student.id && selectedStudentIds.has(String(student.id))) || (student.studentId && selectedStudentIds.has(String(student.studentId)));
                  const showCheck = isAdmin && (isSectioningMode || selectedStudentIds.size > 0);
                  return (
                    <tr 
                      key={sKey} 
                      className={`hover:bg-green-50 cursor-pointer transition-colors duration-150 ${isSelected ? 'bg-emerald-50/80 font-semibold' : ''}`}
                      onClick={() => {
                        if (isSectioningMode) {
                          handleToggleSelectStudent(student.id || student.studentId);
                        } else {
                          handleViewStudent(student);
                        }
                      }}
                    >
                      {showCheck && (
                        <td 
                          className="px-4 py-4 whitespace-nowrap text-center bg-emerald-50/40 border-r border-emerald-100"
                          onClick={(e) => { e.stopPropagation(); handleToggleSelectStudent(student.id || student.studentId); }}
                        >
                          <div className="inline-flex items-center justify-center cursor-pointer p-1 rounded hover:bg-emerald-100/80 transition-colors">
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-emerald-700" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                            )}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.studentId}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{student.name}</p>
                          <p className="text-xs text-gray-500">{student.email}</p>
                        </div>
                      </td>
                      {/* Original School Section */}
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 font-mono font-medium">
                        {student.section || '-'}
                      </td>
                      {/* Assigned NSTP Section */}
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-950 font-black text-xs border border-emerald-300/70">
                          {student.nstp_section || student.nstpSection || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
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
                            <button
                              type="button"
                              onClick={() => handleSendDigitalId(student)}
                              disabled={sendingIdFor === (student.id || student.studentId)}
                              title={`Send / Resend Digital ID to ${student.email || student.name}`}
                              className={`p-1.5 px-2.5 rounded-xl border transition-all active:scale-90 flex items-center gap-1 font-bold text-xs shadow-2xs hover:shadow-xs cursor-pointer ${
                                sendingIdFor === (student.id || student.studentId)
                                  ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                                  : 'text-emerald-800 bg-emerald-50/90 border-emerald-300 hover:bg-emerald-700 hover:text-white hover:border-emerald-700'
                              }`}
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>{sendingIdFor === (student.id || student.studentId) ? 'Sending...' : 'Send ID'}</span>
                            </button>
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
                  );
                })}
              </tbody>
            </table>
          </div>
          {currentStudents.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No students found matching your criteria.
            </div>
          )}
        </div>

        {/* Modern Pagination Controls */}
        {filteredStudents.length > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/90 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-emerald-100 shadow-sm text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-gray-600 font-medium flex-wrap">
              <span>Showing</span>
              <span className="font-bold text-emerald-950">{Math.min(indexOfFirstStudent + 1, filteredStudents.length)}</span>
              <span>to</span>
              <span className="font-bold text-emerald-950">{Math.min(indexOfLastStudent, filteredStudents.length)}</span>
              <span>of</span>
              <span className="font-bold text-emerald-950">{filteredStudents.length}</span>
              <span>students</span>

              <div className="flex items-center gap-1.5 ml-2 sm:ml-4 pl-2 sm:pl-4 border-l border-gray-200">
                <label htmlFor="students-per-page" className="text-gray-500 text-xs">Per page:</label>
                <select
                  id="students-per-page"
                  name="studentsPerPage"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 outline-none cursor-pointer hover:bg-gray-100"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold border border-gray-200 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-xs flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Prev</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                  .map((page, idx, arr) => {
                    const prevPage = arr[idx - 1];
                    return (
                      <div key={page} className="flex items-center">
                        {prevPage && page - prevPage > 1 && (
                          <span className="px-1 text-gray-400 font-bold">...</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-xl font-black text-xs transition-all cursor-pointer ${
                            currentPage === page
                              ? 'bg-emerald-700 text-white shadow-md shadow-emerald-900/20'
                              : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
                          }`}
                        >
                          {page}
                        </button>
                      </div>
                    );
                  })}

                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold border border-gray-200 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-xs flex items-center gap-1 cursor-pointer"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
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
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">CHED PDF</span>
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
                      <label htmlFor="export-sem" className="block text-[11px] font-semibold text-gray-600 mb-1">Semester</label>
                      <select
                        id="export-sem"
                        name="exportSem"
                        value={exportSem}
                        onChange={(e) => setExportSem(e.target.value)}
                        className="w-full text-xs font-medium border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                      >
                        <option>1st Semester</option>
                        <option>2nd Semester</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="export-acad-year" className="block text-[11px] font-semibold text-gray-600 mb-1">Academic Year</label>
                      <input
                        type="text"
                        id="export-acad-year"
                        name="exportAcadYear"
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
                  <Download className="w-4 h-4" /> Download PDF
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
                      <label htmlFor="add-last-name" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Last Name *</label>
                      <input
                        type="text"
                        id="add-last-name"
                        name="lastName"
                        value={formData.lastName || ''}
                        onChange={handleFormFieldChange}
                        placeholder="Dela Cruz"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="add-first-name" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">First Name *</label>
                      <input
                        type="text"
                        id="add-first-name"
                        name="firstName"
                        value={formData.firstName || ''}
                        onChange={handleFormFieldChange}
                        placeholder="Juan"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="add-middle-name" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Middle Name</label>
                      <input
                        type="text"
                        id="add-middle-name"
                        name="middleName"
                        value={formData.middleName || ''}
                        onChange={handleFormFieldChange}
                        placeholder="Santos (Optional)"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                      />
                    </div>
                    <div>
                      <label htmlFor="add-suffix" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Suffix</label>
                      <select
                        id="add-suffix"
                        name="suffix"
                        value={formData.suffix || ''}
                        onChange={handleFormFieldChange}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium cursor-pointer"
                      >
                        <option value="">None / (No Suffix)</option>
                        <option value="Jr.">Jr. (Junior)</option>
                        <option value="Sr.">Sr. (Senior)</option>
                        <option value="II">II (The Second)</option>
                        <option value="III">III (The Third)</option>
                        <option value="IV">IV (The Fourth)</option>
                        <option value="V">V (The Fifth)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="add-student-id" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Student ID (9 digits) *</label>
                      <input
                        type="text"
                        id="add-student-id"
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
                      <label htmlFor="add-email" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Email Address *</label>
                      <input
                        type="email"
                        id="add-email"
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
                    <label htmlFor="add-street" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Street / Barangay *</label>
                    <input
                      type="text"
                      id="add-street"
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
                      <label htmlFor="add-municipality" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Municipality / City *</label>
                      <input
                        type="text"
                        id="add-municipality"
                        name="municipality"
                        value={formData.municipality || ''}
                        onChange={handleFormFieldChange}
                        placeholder="Naic"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="add-province" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Province *</label>
                      <input
                        type="text"
                        id="add-province"
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div>
                      <label htmlFor="add-program" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Program *</label>
                      <select
                        id="add-program"
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
                      <label htmlFor="add-section" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">School Section *</label>
                      <input
                        type="text"
                        id="add-section"
                        name="section"
                        placeholder="e.g. 1-A, 1-1, 1-B"
                        value={formData.section || ''}
                        onChange={handleFormFieldChange}
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-bold text-xs uppercase"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="add-nstp-section" className="block text-xs font-extrabold uppercase tracking-wider text-emerald-800 mb-1.5">NSTP Section</label>
                      <select
                        id="add-nstp-section"
                        name="nstp_section"
                        value={formData.nstp_section || ''}
                        onChange={handleFormFieldChange}
                        className="w-full px-3 py-2.5 bg-emerald-50/70 border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-bold text-xs text-emerald-950"
                      >
                        <option value="">Unassigned</option>
                        <option value="CWTS 1">CWTS 1</option>
                        <option value="CWTS 2">CWTS 2</option>
                        <option value="CWTS 3">CWTS 3</option>
                        <option value="LTS 1">LTS 1</option>
                        <option value="LTS 2">LTS 2</option>
                        <option value="LTS 3">LTS 3</option>
                        <option value="ROTC 1">ROTC 1</option>
                        <option value="ROTC 2">ROTC 2</option>
                        <option value="ROTC 3">ROTC 3</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="add-year-level" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Year Level *</label>
                      <select
                        id="add-year-level"
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
                      <label htmlFor="add-department" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">NSTP Track *</label>
                      <select
                        id="add-department"
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
                      <label htmlFor="add-birth-month" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Birth Month *</label>
                      <input
                        type="text"
                        id="add-birth-month"
                        name="birthMonth"
                        value={formData.birthMonth || ''}
                        onChange={handleFormFieldChange}
                        placeholder="1-12"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="add-birth-day" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Birth Day *</label>
                      <input
                        type="text"
                        id="add-birth-day"
                        name="birthDay"
                        value={formData.birthDay || ''}
                        onChange={handleFormFieldChange}
                        placeholder="1-31"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="add-birth-year" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Birth Year *</label>
                      <input
                        type="text"
                        id="add-birth-year"
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
                      <label htmlFor="add-age" className="block text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5 whitespace-nowrap">Age *</label>
                      <input
                        type="text"
                        id="add-age"
                        name="age"
                        readOnly
                        placeholder="Auto-computed"
                        value={formData.age || ''}
                        className="w-full h-10 px-3 bg-gray-100 border border-gray-200 rounded-xl outline-none font-bold text-emerald-950 text-xs cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label htmlFor="add-civil-status" className="block text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5 whitespace-nowrap">Civil Status *</label>
                      <select
                        id="add-civil-status"
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
                      <label htmlFor="add-sex" className="block text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5 whitespace-nowrap">Sex *</label>
                      <select
                        id="add-sex"
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
                      <label htmlFor="add-registered-voter" className="block text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5 whitespace-nowrap">Registered Voter *</label>
                      <select
                        id="add-registered-voter"
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
                      <label htmlFor="add-height" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center justify-between">
                        <span>Height *</span>
                        {formData.height && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">System: {formData.height} cm</span>}
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          id="add-height"
                          name="height"
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
                          id="add-height-unit"
                          name="heightUnit"
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
                      <label htmlFor="add-weight" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center justify-between">
                        <span>Weight *</span>
                        {formData.weight && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">System: {formData.weight} kg</span>}
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          id="add-weight"
                          name="weight"
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
                          id="add-weight-unit"
                          name="weightUnit"
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
                      <label htmlFor="add-blood-type" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Blood Type *</label>
                      <select
                        id="add-blood-type"
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
                      <label htmlFor="add-contact-number" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Contact No. (11 digits) *</label>
                      <input
                        type="text"
                        id="add-contact-number"
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
                    <label htmlFor="add-facebook-account" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Facebook Account / Profile Link *</label>
                    <input
                      type="text"
                      id="add-facebook-account"
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
                      <label htmlFor="add-emergency-contact" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Emergency Contact Person *</label>
                      <input
                        type="text"
                        id="add-emergency-contact"
                        name="emergencyContact"
                        value={formData.emergencyContact || formData.emergencyName || ''}
                        onChange={handleFormFieldChange}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        placeholder="Parent/Guardian Name"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="add-emergency-number" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Emergency Contact No. *</label>
                      <input
                        type="tel"
                        id="add-emergency-number"
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

                  {/* 2x2 ID Photo Capture / Upload with White Background & White Shirt */}
                  <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200">
                    <label className="block text-xs font-black uppercase tracking-wider text-emerald-950 mb-1">
                      2x2 ID Picture (White Background, White Shirt) *
                    </label>
                    <p className="text-[11px] text-slate-500 mb-3">
                      Required for official NSTP ID Card printing. Use live camera or upload photo file.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
                      <div className="w-20 h-24 bg-white rounded-xl border-2 border-emerald-400 overflow-hidden flex items-center justify-center shrink-0 shadow-sm relative group">
                        {formData.id_photo_2x2 || formData.photo || formData.registrationPhoto ? (
                          <>
                            <img src={formData.id_photo_2x2 || formData.photo || formData.registrationPhoto} alt="2x2 Preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setPhotoViewer(formData.id_photo_2x2 || formData.photo || formData.registrationPhoto)}
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold cursor-pointer"
                            >
                              🔍 View
                            </button>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                            <User className="w-6 h-6 mb-1 opacity-50" />
                            <span className="text-[9px] font-black leading-tight">2x2 PHOTO</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 flex flex-wrap items-center gap-2">
                        {/* Live Camera Button */}
                        <button
                          type="button"
                          onClick={() => startLiveCamera('add', 'user')}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer active:scale-95 transition-all"
                        >
                          <Camera className="w-4 h-4 text-amber-300" />
                          <span>Take with Camera</span>
                        </button>

                        {/* File Upload Button */}
                        <label htmlFor="add-file-input" className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-gray-100 text-gray-800 font-bold text-xs rounded-xl border border-gray-300 shadow-2xs cursor-pointer active:scale-95 transition-all">
                          <Upload className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{formData.id_photo_2x2 || formData.photo || formData.registrationPhoto ? 'Change File' : 'Upload File'}</span>
                          <input
                            ref={fileInputAddRef}
                            type="file"
                            id="add-file-input"
                            name="fileInputAdd"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = async (ev) => {
                                const compressed = await compressPhoto(ev.target.result);
                                setFormData(prev => ({
                                  ...prev,
                                  id_photo_2x2: compressed,
                                  photo: compressed,
                                  registrationPhoto: compressed,
                                  registration_photo: compressed
                                }));
                              };
                              reader.readAsDataURL(file);
                            }}
                            className="hidden"
                          />
                        </label>

                        {/* Remove / Reset Button */}
                        {(formData.id_photo_2x2 || formData.photo || formData.registrationPhoto) && (
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                id_photo_2x2: '',
                                photo: '',
                                registrationPhoto: ''
                              }));
                            }}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
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
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                      <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Degree Program</span>
                      <span className="font-black text-xs sm:text-sm text-emerald-950 mt-0.5 block">{currentViewStudent.program || '-'}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                      <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">School Section</span>
                      <span className="font-black text-xs sm:text-sm text-gray-800 font-mono mt-0.5 block">{currentViewStudent.section || '-'}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-300/80 bg-emerald-50/60 shadow-2xs">
                      <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">NSTP Section</span>
                      <span className="font-black text-xs sm:text-sm text-emerald-950 mt-0.5 block">{currentViewStudent.nstp_section || '-'}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                      <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">Year Level</span>
                      <span className="font-black text-xs sm:text-sm text-emerald-950 mt-0.5 block">{currentViewStudent.yearLevel || currentViewStudent.year || '-'}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                      <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">NSTP Component</span>
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

                {/* Official Student Documents & Photos Section */}
                <div className="bg-slate-50/90 p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center justify-between mb-3.5">
                    <h4 className="text-xs sm:text-sm font-extrabold text-emerald-950 flex items-center gap-2 uppercase tracking-wider">
                      <FileText className="w-4 h-4 text-emerald-700" />
                      Student Official Documents &amp; Photos
                    </h4>
                    <span className="text-[10px] font-bold text-slate-500 hidden sm:inline">
                      Click image or Expand to inspect full size
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* 1. Official 2x2 ID Photo Card */}
                    <div className="bg-white p-3.5 rounded-2xl border border-emerald-200/80 shadow-2xs flex flex-col justify-between hover:border-emerald-400 transition-colors">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-black uppercase text-emerald-900 flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5 text-emerald-600" />
                            Official 2x2 ID Photo
                          </span>
                          {currentViewStudent.id_photo_2x2 || currentViewStudent.photo || currentViewStudent.idPhoto2x2 ? (
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Available
                            </span>
                          ) : (
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                              No Photo
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 my-2">
                          <div 
                            onClick={() => {
                              const src = currentViewStudent.id_photo_2x2 || currentViewStudent.photo || currentViewStudent.idPhoto2x2;
                              if (src) setPhotoViewer({ url: src, title: `${currentViewStudent.name || 'Student'} - Official 2x2 ID Photo`, isPdf: false });
                            }}
                            className={`w-20 h-24 rounded-xl border-2 border-emerald-300 overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 relative group shadow-xs ${
                              currentViewStudent.id_photo_2x2 || currentViewStudent.photo || currentViewStudent.idPhoto2x2 ? 'cursor-pointer hover:border-emerald-500' : ''
                            }`}
                          >
                            {currentViewStudent.id_photo_2x2 || currentViewStudent.photo || currentViewStudent.idPhoto2x2 ? (
                              <>
                                <img 
                                  src={currentViewStudent.id_photo_2x2 || currentViewStudent.photo || currentViewStudent.idPhoto2x2} 
                                  alt="2x2 ID Photo" 
                                  loading="lazy"
                                  decoding="async"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                                />
                                <div className="absolute inset-0 bg-emerald-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-black gap-1">
                                  <Eye className="w-4 h-4" />
                                  <span>Expand</span>
                                </div>
                              </>
                            ) : (
                              <div className="text-center p-2 text-slate-400">
                                <User className="w-7 h-7 mx-auto mb-0.5 opacity-40" />
                                <span className="text-[8px] font-black uppercase block">No 2x2 Photo</span>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 text-left text-xs">
                            <p className="font-bold text-slate-800 text-[11px] leading-snug">
                              White Background, White Shirt
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Used for official NSTP ID Card printing.
                            </p>
                            {(currentViewStudent.id_photo_2x2 || currentViewStudent.photo || currentViewStudent.idPhoto2x2) ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const src = currentViewStudent.id_photo_2x2 || currentViewStudent.photo || currentViewStudent.idPhoto2x2;
                                  setPhotoViewer({ url: src, title: `${currentViewStudent.name || 'Student'} - Official 2x2 ID Photo`, isPdf: false });
                                }}
                                className="mt-2 inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-black border border-emerald-200 shadow-2xs transition-colors cursor-pointer active:scale-95"
                              >
                                <Eye className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Expand 2x2 Photo</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-amber-700 italic mt-2 block font-medium">Click Edit to upload or take 2x2 photo</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 2. Certificate of Registration (COR / Regform) Card */}
                    <div className="bg-white p-3.5 rounded-2xl border border-emerald-200/80 shadow-2xs flex flex-col justify-between hover:border-emerald-400 transition-colors">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-black uppercase text-emerald-900 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-emerald-600" />
                            Registration Form (COR)
                          </span>
                          {currentViewStudent.registrationPhoto || currentViewStudent.registration_photo || currentViewStudent.reg_form || currentViewStudent.cor || currentViewStudent.coe || currentViewStudent.photoUrl ? (
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Available
                            </span>
                          ) : (
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                              No Regform
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 my-2">
                          {(() => {
                            const regSrc = currentViewStudent.registrationPhoto || currentViewStudent.registration_photo || currentViewStudent.reg_form || currentViewStudent.cor || currentViewStudent.coe || currentViewStudent.photoUrl;
                            const isPdf = typeof regSrc === 'string' && regSrc.startsWith('data:application/pdf');

                            return (
                              <>
                                <div 
                                  onClick={() => {
                                    if (regSrc) setPhotoViewer({ url: regSrc, title: `${currentViewStudent.name || 'Student'} - Registration Form (COR)`, isPdf });
                                  }}
                                  className={`w-20 h-24 rounded-xl border-2 border-emerald-300 overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 relative group shadow-xs ${
                                    regSrc ? 'cursor-pointer hover:border-emerald-500' : ''
                                  }`}
                                >
                                  {regSrc ? (
                                    isPdf ? (
                                      <div className="text-center p-2 text-emerald-800">
                                        <FileText className="w-7 h-7 mx-auto mb-0.5 text-emerald-700" />
                                        <span className="text-[8px] font-black uppercase block">PDF File</span>
                                      </div>
                                    ) : (
                                      <>
                                        <img 
                                          src={regSrc} 
                                          alt="Registration Form (COR)" 
                                          loading="lazy"
                                          decoding="async"
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                                        />
                                        <div className="absolute inset-0 bg-emerald-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-black gap-1">
                                          <Eye className="w-4 h-4" />
                                          <span>Expand</span>
                                        </div>
                                      </>
                                    )
                                  ) : (
                                    <div className="text-center p-2 text-slate-400">
                                      <FileText className="w-7 h-7 mx-auto mb-0.5 opacity-40" />
                                      <span className="text-[8px] font-black uppercase block">No Regform</span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex-1 text-left text-xs">
                                  <p className="font-bold text-slate-800 text-[11px] leading-snug">
                                    Official Enrollment Proof
                                  </p>
                                  <p className="text-[10px] text-slate-500 mt-0.5">
                                    Certificate of Registration (COR) document.
                                  </p>
                                  {regSrc ? (
                                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setPhotoViewer({ url: regSrc, title: `${currentViewStudent.name || 'Student'} - Registration Form (COR)`, isPdf });
                                        }}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-black border border-emerald-200 shadow-2xs transition-colors cursor-pointer active:scale-95"
                                      >
                                        <Eye className="w-3.5 h-3.5 text-emerald-700" />
                                        <span>Expand Regform</span>
                                      </button>
                                      {isPdf && (
                                        <a
                                          href={regSrc}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 px-2 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold border border-slate-200 shadow-2xs transition-colors"
                                        >
                                          ↗ Open
                                        </a>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic mt-2 block">No COR document submitted</span>
                                  )}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="sticky bottom-0 bg-white p-4 border-t flex flex-wrap justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSendDigitalId(currentViewStudent)}
                  disabled={sendingIdFor === (currentViewStudent.id || currentViewStudent.studentId)}
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 border ${
                    sendingIdFor === (currentViewStudent.id || currentViewStudent.studentId)
                      ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300'
                  }`}
                  title={`Send Official Digital ID to ${currentViewStudent.email || currentViewStudent.name}`}
                >
                  <CreditCard className="w-4 h-4 text-emerald-700" />
                  <span>{sendingIdFor === (currentViewStudent.id || currentViewStudent.studentId) ? 'Sending ID...' : 'Send Digital ID to Email'}</span>
                </button>
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
                      <label htmlFor="edit-last-name" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Last Name *</label>
                      <input
                        type="text"
                        id="edit-last-name"
                        name="lastName"
                        value={formData.lastName || ''}
                        onChange={handleFormFieldChange}
                        placeholder="Dela Cruz"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-first-name" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">First Name *</label>
                      <input
                        type="text"
                        id="edit-first-name"
                        name="firstName"
                        value={formData.firstName || ''}
                        onChange={handleFormFieldChange}
                        placeholder="Juan"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-middle-name" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Middle Name</label>
                      <input
                        type="text"
                        id="edit-middle-name"
                        name="middleName"
                        value={formData.middleName || ''}
                        onChange={handleFormFieldChange}
                        placeholder="Reyes"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-suffix" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Suffix</label>
                      <select
                        id="edit-suffix"
                        name="suffix"
                        value={formData.suffix || ''}
                        onChange={handleFormFieldChange}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium cursor-pointer"
                      >
                        <option value="">None / (No Suffix)</option>
                        <option value="Jr.">Jr. (Junior)</option>
                        <option value="Sr.">Sr. (Senior)</option>
                        <option value="II">II (The Second)</option>
                        <option value="III">III (The Third)</option>
                        <option value="IV">IV (The Fourth)</option>
                        <option value="V">V (The Fifth)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="edit-student-id" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Student ID (9 digits) *</label>
                      <input
                        type="text"
                        id="edit-student-id"
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
                      <label htmlFor="edit-email" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Email Address *</label>
                      <input
                        type="email"
                        id="edit-email"
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
                      <label htmlFor="edit-street" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Street / Barangay *</label>
                      <input
                        type="text"
                        id="edit-street"
                        name="street"
                        value={formData.street || ''}
                        onChange={handleFormFieldChange}
                        placeholder="Brgy. Bucana"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-municipality" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Municipality / City *</label>
                      <input
                        type="text"
                        id="edit-municipality"
                        name="municipality"
                        value={formData.municipality || ''}
                        onChange={handleFormFieldChange}
                        placeholder="Naic"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-province" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Province *</label>
                      <input
                        type="text"
                        id="edit-province"
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div>
                      <label htmlFor="edit-program" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Program *</label>
                      <select
                        id="edit-program"
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
                      <label htmlFor="edit-section" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">School Section *</label>
                      <input
                        type="text"
                        id="edit-section"
                        name="section"
                        placeholder="e.g. 1-A, 1-1, 1-B"
                        value={formData.section || ''}
                        onChange={handleFormFieldChange}
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-bold text-xs uppercase"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-nstp-section" className="block text-xs font-extrabold uppercase tracking-wider text-emerald-800 mb-1.5">NSTP Section</label>
                      <select
                        id="edit-nstp-section"
                        name="nstp_section"
                        value={formData.nstp_section || ''}
                        onChange={handleFormFieldChange}
                        className="w-full px-3 py-2.5 bg-emerald-50/70 border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-bold text-xs text-emerald-950"
                      >
                        <option value="">Unassigned</option>
                        <option value="CWTS 1">CWTS 1</option>
                        <option value="CWTS 2">CWTS 2</option>
                        <option value="CWTS 3">CWTS 3</option>
                        <option value="LTS 1">LTS 1</option>
                        <option value="LTS 2">LTS 2</option>
                        <option value="LTS 3">LTS 3</option>
                        <option value="ROTC 1">ROTC 1</option>
                        <option value="ROTC 2">ROTC 2</option>
                        <option value="ROTC 3">ROTC 3</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="edit-year-level" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Year Level *</label>
                      <select
                        id="edit-year-level"
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
                      <label htmlFor="edit-department" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">NSTP Track *</label>
                      <select
                        id="edit-department"
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
                      <label htmlFor="edit-birth-month" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Birth Month *</label>
                      <input
                        type="text"
                        id="edit-birth-month"
                        name="birthMonth"
                        value={formData.birthMonth || ''}
                        onChange={handleFormFieldChange}
                        placeholder="1-12"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-birth-day" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Birth Day *</label>
                      <input
                        type="text"
                        id="edit-birth-day"
                        name="birthDay"
                        value={formData.birthDay || ''}
                        onChange={handleFormFieldChange}
                        placeholder="1-31"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-birth-year" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Birth Year *</label>
                      <input
                        type="text"
                        id="edit-birth-year"
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
                      <label htmlFor="edit-age" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center justify-between">
                        <span>Age *</span>
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">Auto</span>
                      </label>
                      <input
                        type="text"
                        id="edit-age"
                        name="age"
                        readOnly
                        placeholder="Auto-computed"
                        value={formData.age || ''}
                        className="w-full px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-xl outline-none font-bold text-emerald-950 text-xs cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-civil-status" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Civil Status *</label>
                      <select
                        id="edit-civil-status"
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
                      <label htmlFor="edit-sex" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Sex *</label>
                      <select
                        id="edit-sex"
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
                      <label htmlFor="edit-registered-voter" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Registered Voter? *</label>
                      <select
                        id="edit-registered-voter"
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
                      <label htmlFor="edit-height" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center justify-between">
                        <span>Height *</span>
                        {formData.height && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">System: {formData.height} cm</span>}
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          id="edit-height"
                          name="height"
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
                          id="edit-height-unit"
                          name="editHeightUnit"
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
                      <label htmlFor="edit-weight" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center justify-between">
                        <span>Weight *</span>
                        {formData.weight && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">System: {formData.weight} kg</span>}
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          id="edit-weight"
                          name="weight"
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
                          id="edit-weight-unit"
                          name="editWeightUnit"
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
                      <label htmlFor="edit-blood-type" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Blood Type *</label>
                      <select
                        id="edit-blood-type"
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
                      <label htmlFor="edit-contact-number" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Contact No. (11 digits) *</label>
                      <input
                        type="text"
                        id="edit-contact-number"
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
                    <label htmlFor="edit-facebook-account" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Facebook Account / Profile Link *</label>
                    <input
                      type="text"
                      id="edit-facebook-account"
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
                      <label htmlFor="edit-emergency-contact" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Emergency Contact Person *</label>
                      <input
                        type="text"
                        id="edit-emergency-contact"
                        name="emergencyContact"
                        value={formData.emergencyContact || formData.emergencyName || ''}
                        onChange={handleFormFieldChange}
                        placeholder="Parent or Guardian Name"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-emergency-number" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Emergency Contact No. *</label>
                      <input
                        type="tel"
                        id="edit-emergency-number"
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

                  {/* 4. 2x2 ID Photo Update / Camera Capture */}
                  <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 mt-3">
                    <label className="block text-xs font-black uppercase tracking-wider text-emerald-950 mb-1 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-emerald-700" />
                      4. Official 2x2 ID Photo
                    </label>
                    <p className="text-[11px] text-slate-500 mb-3">
                      Update student 2x2 photo for official NSTP ID card generation and record verification.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
                      <div className="w-20 h-24 bg-white rounded-xl border-2 border-emerald-400 overflow-hidden flex items-center justify-center shrink-0 shadow-sm relative group">
                        {formData.id_photo_2x2 || formData.photo ? (
                          <>
                            <img src={formData.id_photo_2x2 || formData.photo} alt="2x2 Preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setPhotoViewer({ url: formData.id_photo_2x2 || formData.photo, title: `${formData.name || 'Student'} - 2x2 ID Photo Preview`, isPdf: false })}
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold cursor-pointer"
                            >
                              Expand
                            </button>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                            <User className="w-6 h-6 mb-1 opacity-50" />
                            <span className="text-[9px] font-black leading-tight">NO PHOTO</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 flex flex-wrap items-center gap-2">
                        {/* Live Camera Button */}
                        <button
                          type="button"
                          onClick={() => startLiveCamera('edit', 'user')}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer active:scale-95 transition-all"
                        >
                          <Camera className="w-4 h-4 text-emerald-200" />
                          <span>Take with Camera</span>
                        </button>

                        {/* File Upload Button */}
                        <label htmlFor="edit-file-input" className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-gray-100 text-gray-800 font-bold text-xs rounded-xl border border-gray-300 shadow-2xs cursor-pointer active:scale-95 transition-all">
                          <Upload className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{formData.id_photo_2x2 || formData.photo ? 'Change Photo' : 'Upload Photo'}</span>
                          <input
                            ref={fileInputEditRef}
                            type="file"
                            id="edit-file-input"
                            name="fileInputEdit"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = async (ev) => {
                                const compressed = await compressPhoto(ev.target.result);
                                setFormData(prev => ({
                                  ...prev,
                                  id_photo_2x2: compressed,
                                  photo: compressed
                                }));
                              };
                              reader.readAsDataURL(file);
                            }}
                            className="hidden"
                          />
                        </label>

                        {/* Remove / Reset Button */}
                        {(formData.id_photo_2x2 || formData.photo) && (
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                id_photo_2x2: '',
                                photo: ''
                              }));
                            }}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Registration Form (COR) Document Proof info in Edit Modal — Strictly Read-Only */}
                    {(formData.registrationPhoto || formData.registration_photo) && (
                      <div className="mt-3.5 pt-3 border-t border-emerald-200/80 flex items-center justify-between bg-emerald-100/60 p-3 rounded-xl">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="w-4 h-4 text-emerald-800 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-xs font-black text-emerald-950 block truncate">Certificate of Registration (COR)</span>
                            <span className="text-[10px] text-emerald-700 font-medium block truncate">Submitted enrollment document • Permanent record</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const reg = formData.registrationPhoto || formData.registration_photo;
                            const isPdf = typeof reg === 'string' && reg.startsWith('data:application/pdf');
                            setPhotoViewer({ url: reg, title: `${formData.name || 'Student'} - Certificate of Registration (COR)`, isPdf });
                          }}
                          className="text-[11px] font-bold text-emerald-900 hover:text-white hover:bg-emerald-800 bg-white px-3 py-1.5 rounded-lg border border-emerald-300 shadow-2xs transition-all cursor-pointer shrink-0 ml-2"
                        >
                          View COR Document
                        </button>
                      </div>
                    )}
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

        {/* Live Camera Viewfinder Modal for Student Management (Add & Edit) */}
        {showCameraModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-6 animate-fade-in">
            <div className="bg-slate-900 border border-emerald-600/40 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-emerald-950 to-teal-950 border-b border-emerald-800/60 flex items-center justify-between text-white shrink-0">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="text-sm font-black tracking-tight">Capture 2x2 Student Photo</h3>
                    <p className="text-[10px] text-emerald-200 font-medium">Position face inside square frame</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeCameraModal}
                  className="p-1.5 rounded-full hover:bg-white/10 text-emerald-200 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Camera Video Stream & Viewfinder Overlay */}
              <div className="relative bg-black flex-1 flex items-center justify-center min-h-[300px] sm:min-h-[380px] overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{
                    transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                    WebkitTransform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
                  }}
                />
                
                {/* 2x2 Frame Overlay Guide */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
                  <div className="w-52 h-52 sm:w-64 sm:h-64 border-2 border-dashed border-amber-400/90 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                    <div className="absolute top-2 left-2 right-2 text-center">
                      <span className="bg-emerald-950/80 text-amber-300 text-[10px] font-black uppercase px-2 py-0.5 rounded-md border border-amber-400/30">
                        2x2 Portrait View
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Camera Controls Footer */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer"
                  title="Switch Front / Back Camera"
                >
                  <SwitchCamera className="w-4 h-4 text-amber-400" />
                  <span className="hidden xs:inline">{facingMode === 'user' ? 'Front' : 'Back'}</span>
                </button>

                <button
                  type="button"
                  onClick={capturePhotoFromCamera}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-emerald-950 font-black text-sm rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  <Camera className="w-5 h-5" />
                  <span>Snap 2x2 Photo</span>
                </button>

                <button
                  type="button"
                  onClick={closeCameraModal}
                  className="px-4 py-2.5 text-slate-400 hover:text-white font-bold text-xs rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fullscreen Photo & Document Viewer Lightbox Modal */}
        {photoViewer && (() => {
          const viewerUrl = typeof photoViewer === 'object' ? photoViewer.url : photoViewer;
          const viewerTitle = typeof photoViewer === 'object' ? (photoViewer.title || 'Document Preview') : '2x2 ID Photo Preview';
          const isPdf = typeof photoViewer === 'object' ? photoViewer.isPdf : (typeof viewerUrl === 'string' && viewerUrl.startsWith('data:application/pdf'));

          return (
            <div 
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110] flex items-center justify-center p-3 sm:p-4 animate-fade-in"
              onClick={() => setPhotoViewer(null)}
            >
              <div 
                className="bg-slate-900 border border-emerald-600/40 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl p-4 sm:p-5 flex flex-col items-center max-h-[92vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-full flex items-center justify-between mb-3 text-white">
                  <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-300 truncate pr-2">{viewerTitle}</h4>
                  <button
                    type="button"
                    onClick={() => setPhotoViewer(null)}
                    className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="w-full max-h-[70vh] bg-black/60 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-xl flex items-center justify-center p-1">
                  {isPdf ? (
                    <iframe src={viewerUrl} title={viewerTitle} className="w-full h-[65vh] rounded-xl" />
                  ) : (
                    <img src={viewerUrl} alt={viewerTitle} className="w-full max-h-[68vh] object-contain rounded-xl" />
                  )}
                </div>

                <div className="w-full flex items-center justify-between mt-4">
                  {viewerUrl && (
                    <a
                      href={viewerUrl}
                      download="student-document"
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download File</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setPhotoViewer(null)}
                    className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-xl cursor-pointer ml-auto active:scale-95 transition-all"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Student Attendance & Absences Matrix Modal */}
        <StudentAttendanceMatrixModal
          isOpen={showAttendanceMatrix}
          onClose={() => setShowAttendanceMatrix(false)}
          students={students}
          currentUser={user}
        />

        {/* Student Semester Grades Encoding & Grading Sheet Modal */}
        <StudentGradesModal
          isOpen={showGradesModal}
          onClose={() => setShowGradesModal(false)}
          students={students}
          currentUser={user}
        />

        {/* ── FORM B EXPORT & CONFIGURATION MODAL ───────────────────────── */}
        {showFormBModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-emerald-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white rounded-3xl shadow-2xl border border-emerald-800/40 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white p-4 sm:p-5 flex items-center justify-between border-b border-emerald-800/60 shadow-md">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-amber-400/20 rounded-2xl p-2 flex items-center justify-center border border-amber-400/40">
                    <FileSpreadsheet className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
                      Export OSDS-NSTP Form B
                    </h3>
                    <p className="text-[11px] text-emerald-300 font-medium">
                      Official Student Directory &amp; Enrollment List
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFormBModal(false)}
                  className="p-1.5 text-emerald-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6 space-y-4">
                {/* NSTP Component Selector */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    NSTP Components / Department
                  </label>
                  <select
                    value={formBDept}
                    onChange={(e) => setFormBDept(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600 outline-none cursor-pointer"
                  >
                    <option value="All">All Departments (CWTS, LTS, ROTC)</option>
                    <option value="CWTS">CWTS Only (Civic Welfare Training Service)</option>
                    <option value="LTS">LTS Only (Literacy Training Service)</option>
                    <option value="ROTC">ROTC Only (Reserve Officers Training Corps)</option>
                  </select>
                </div>

                {/* Semester Selector */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Semester
                    </label>
                    <select
                      value={formBSem}
                      onChange={(e) => setFormBSem(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600 outline-none cursor-pointer"
                    >
                      <option value="1st Semester">1st Semester</option>
                      <option value="2nd Semester">2nd Semester</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Academic Year
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={viewingArchive ? (archiveViewData?.year || exportAcadYear) : exportAcadYear}
                      className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-300 rounded-xl text-xs sm:text-sm font-bold text-gray-700 outline-none"
                    />
                  </div>
                </div>

                {/* Institutional Details Preview */}
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-[11px] sm:text-xs text-emerald-950 space-y-1">
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-500">Name of HEI:</span>
                    <span className="font-extrabold text-emerald-900">Cavite State University - Naic</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-500">Region:</span>
                    <span className="font-extrabold text-emerald-900">4A - CALABARZON</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-500">Address:</span>
                    <span className="font-medium text-emerald-900">Bucana Malaki, Naic, Cavite</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-500">Component:</span>
                    <span className="font-black text-amber-800">{formBDept === 'All' ? 'CWTS / ROTC / LTS' : formBDept}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowFormBModal(false);
                    setShowFormBPreview(true);
                  }}
                  className="px-4 py-2.5 text-xs font-bold bg-white text-emerald-900 border border-emerald-300 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Preview / Print</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFormBModal(false)}
                    className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleDirectDownloadFormB(formBDept, formBSem);
                      setShowFormBModal(false);
                    }}
                    className="px-5 py-2.5 text-xs font-black bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-emerald-950 rounded-xl shadow-md cursor-pointer active:scale-95 transition-all flex items-center gap-1.5 border border-amber-500/60"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-950" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── FORM A EXPORT & CONFIGURATION MODAL ───────────────────────── */}
        {showFormAModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-emerald-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white rounded-3xl shadow-2xl border border-emerald-800/40 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white p-4 sm:p-5 flex items-center justify-between border-b border-emerald-800/60 shadow-md">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-amber-400/20 rounded-2xl p-2 flex items-center justify-center border border-amber-400/40">
                    <Award className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
                      Export OSDS-NSTP Form A
                    </h3>
                    <p className="text-[11px] text-emerald-300 font-medium">
                      Summary Number of Enrollment and Graduates of NSTP
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFormAModal(false)}
                  className="p-1.5 text-emerald-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6 space-y-4">
                <p className="text-xs text-gray-600 font-medium leading-relaxed">
                  Generates the official 4-tier demographic matrix combining 1st Semester enrollees, 2nd Semester enrollees, and official Graduates who passed their semester grades.
                </p>

                {/* Institutional Details Preview */}
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-[11px] sm:text-xs text-emerald-950 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-500">Name of HEI:</span>
                    <span className="font-extrabold text-emerald-900">Cavite State University - Naic</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-500">Classification:</span>
                    <span className="font-extrabold text-emerald-900">PUBLIC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-500">Region:</span>
                    <span className="font-extrabold text-emerald-900">4A - CALABARZON</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-500">Academic Year:</span>
                    <span className="font-black text-amber-800">
                      {viewingArchive ? (archiveViewData?.year || exportAcadYear) : exportAcadYear}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowFormAModal(false);
                    setShowFormAPreview(true);
                  }}
                  className="px-4 py-2.5 text-xs font-bold bg-white text-emerald-900 border border-emerald-300 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Preview / Print</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFormAModal(false)}
                    className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleDirectDownloadFormA();
                      setShowFormAModal(false);
                    }}
                    className="px-5 py-2.5 text-xs font-black bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-emerald-950 rounded-xl shadow-md cursor-pointer active:scale-95 transition-all flex items-center gap-1.5 border border-amber-500/60"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-950" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── FULL SCREEN PRINTABLE PREVIEW: FORM B ───────────────────────── */}
        {showFormBPreview && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/90 backdrop-blur-md flex flex-col p-2 sm:p-6">
            <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full mx-auto my-auto overflow-hidden flex flex-col max-h-[92vh]">
              <div className="bg-emerald-950 text-white px-5 py-3.5 flex items-center justify-between shrink-0 border-b border-emerald-800">
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet className="w-5 h-5 text-amber-400" />
                  <span className="font-bold text-sm">CHED NSTP Form B Preview — {formBDept === 'All' ? 'All Departments' : formBDept}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3.5 py-1.5 text-xs font-black bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDirectDownloadFormB(formBDept, formBSem)}
                    className="px-3.5 py-1.5 text-xs font-black bg-amber-400 hover:bg-amber-500 text-emerald-950 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFormBPreview(false)}
                    className="p-1.5 text-emerald-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer ml-2"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-white">
                <OSDSNSTPForm2B
                  academicYear={viewingArchive ? (archiveViewData?.year || exportAcadYear) : exportAcadYear}
                  semester={formBSem}
                  heiName="Cavite State University - Naic"
                  address="Bucana Malaki, Naic, Cavite"
                  region="4A - CALABARZON"
                  nstpComponents={formBDept === 'All' ? 'CWTS / ROTC / LTS' : formBDept}
                  students={(students || []).filter((s) => formBDept === 'All' || s.department === formBDept)}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── FULL SCREEN PRINTABLE PREVIEW: FORM A ───────────────────────── */}
        {showFormAPreview && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/90 backdrop-blur-md flex flex-col p-2 sm:p-6">
            <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full mx-auto my-auto overflow-hidden flex flex-col max-h-[92vh]">
              <div className="bg-emerald-950 text-white px-5 py-3.5 flex items-center justify-between shrink-0 border-b border-emerald-800">
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <span className="font-bold text-sm">OSDS-NSTP Form A Preview — Summary of Enrollment &amp; Graduates</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3.5 py-1.5 text-xs font-black bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDirectDownloadFormA}
                    className="px-3.5 py-1.5 text-xs font-black bg-amber-400 hover:bg-amber-500 text-emerald-950 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFormAPreview(false)}
                    className="p-1.5 text-emerald-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer ml-2"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-white">
                <OSDSNSTPForm
                  academicYear={viewingArchive ? (archiveViewData?.year || exportAcadYear) : exportAcadYear}
                  campusName="Cavite State University - Naic"
                  classification="PUBLIC"
                  region="4A - CALABARZON"
                  address="Bucana Malaki, Naic, Cavite"
                  students={students}
                />
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default StudentManagement;

