import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, CheckCircle, X, FileText, Shield, Eye, AlertCircle, Upload, Camera, Trash2, SwitchCamera, User, GraduationCap, Award, Phone, Heart, FileCheck, Sparkles, Check, Clock, Calendar } from 'lucide-react';
import { calculateEnrollmentStatus } from '../utils/enrollmentSchedule';

function Enrollment() {
  const { submitEnrollment } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Live Enrollment Schedule Status State
  const [enrollmentStatus, setEnrollmentStatus] = useState(() => calculateEnrollmentStatus());

  useEffect(() => {
    const updateSchedule = () => setEnrollmentStatus(calculateEnrollmentStatus());
    window.addEventListener('nstp_enrollment_schedule_changed', updateSchedule);
    const interval = setInterval(updateSchedule, 10000);
    return () => {
      window.removeEventListener('nstp_enrollment_schedule_changed', updateSchedule);
      clearInterval(interval);
    };
  }, []);
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('enrollmentFormData');
    return saved ? JSON.parse(saved) : {
      lastName: '',
      firstName: '',
      middleName: '',
      studentId: '',
      street: '',
      municipality: '',
      province: '',
      program: '',
      yearLevel: '',
      section: '',
      nstpComponent: 'CWTS',
      birthMonth: '',
      birthDay: '',
      birthYear: '',
      age: '',
      civilStatus: '',
      sex: '',
      height: '',
      weight: '',
      bloodType: '',
      contactNumber: '',
      email: '',
      facebookAccount: '',
      emergencyContact: '',
      emergencyNumber: ''
    };
  });

  const [errors, setErrors] = useState({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [errorBanner, setErrorBanner] = useState([]);
  const errorTimerRef = useRef(null);

  const [registrationPhoto, setRegistrationPhoto] = useState(null);
  const photoInputRef = useRef(null);

  // True when there is saved progress from a previous session
  const hasSavedData = !!localStorage.getItem('enrollmentFormData');

  const handleStartFresh = () => {
    localStorage.removeItem('enrollmentFormData');
    setFormData({
      lastName: '', firstName: '', middleName: '', studentId: '',
      street: '', municipality: '', province: '',
      program: '', yearLevel: '', section: '', nstpComponent: 'CWTS',
      birthMonth: '', birthDay: '', birthYear: '', age: '', civilStatus: '', sex: '',
      height: '', weight: '', bloodType: '', contactNumber: '', email: '',
      facebookAccount: '', emergencyContact: '', emergencyNumber: ''
    });
    setErrors({});
    setAgreedToTerms(false);
  };

  // Refs for auto-focus functionality
  const fieldRefs = useRef({});

  useEffect(() => {
    return () => { if (errorTimerRef.current) clearTimeout(errorTimerRef.current); };
  }, []);

  const showErrorBanner = (errorMap) => {
    const msgs = Object.values(errorMap).filter(Boolean);
    setErrorBanner(msgs);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setErrorBanner([]), 5000);
  };

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    const requiredFields = [
      'lastName', 'firstName', 'studentId', 'street', 'municipality', 'province', 'email',
      'program', 'yearLevel', 'section',
      'birthMonth', 'birthDay', 'birthYear', 'age', 'civilStatus', 'sex', 'contactNumber',
      'emergencyContact', 'emergencyNumber'
    ];

    requiredFields.forEach(field => {
      const value = formData[field];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        newErrors[field] = 'This field is required';
      }
    });

    // Student ID - exactly 9 digits
    if (formData.studentId && !/^\d{9}$/.test(formData.studentId)) {
      const idLen = formData.studentId.replace(/\D/g, '').length;
      newErrors.studentId = idLen < 9
        ? `Student ID is too short — ${idLen} digit${idLen !== 1 ? 's' : ''} entered, need exactly 9`
        : `Student ID is too long — ${idLen} digit${idLen !== 1 ? 's' : ''} entered, need exactly 9`;
    }

    // Email - must match full format e.g. student@cvsu.edu.ph
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email — must be in the format student@cvsu.edu.ph';
    }

    // Contact Number - exactly 11 digits
    if (formData.contactNumber && !/^\d{11}$/.test(formData.contactNumber)) {
      const cLen = formData.contactNumber.replace(/\D/g, '').length;
      newErrors.contactNumber = cLen < 11
        ? `Contact Number is too short — ${cLen} digit${cLen !== 1 ? 's' : ''} entered, need exactly 11`
        : `Contact Number is too long — ${cLen} digit${cLen !== 1 ? 's' : ''} entered, need exactly 11`;
    }

    // Emergency Number - exactly 11 digits
    if (formData.emergencyNumber && !/^\d{11}$/.test(formData.emergencyNumber)) {
      const eLen = formData.emergencyNumber.replace(/\D/g, '').length;
      newErrors.emergencyNumber = eLen < 11
        ? `Emergency Number is too short — ${eLen} digit${eLen !== 1 ? 's' : ''} entered, need exactly 11`
        : `Emergency Number is too long — ${eLen} digit${eLen !== 1 ? 's' : ''} entered, need exactly 11`;
    }

    // Birth Date validation
    if (formData.birthMonth && formData.birthDay && formData.birthYear) {
      const month = parseInt(formData.birthMonth, 10);
      const day = parseInt(formData.birthDay, 10);
      const year = parseInt(formData.birthYear, 10);

      if (isNaN(month) || month < 1 || month > 12) {
        newErrors.birthMonth = `Invalid month "${formData.birthMonth}" — must be 1 to 12`;
      }
      if (isNaN(day) || day < 1 || day > 31) {
        newErrors.birthDay = `Invalid day "${formData.birthDay}" — must be 1 to 31`;
      }
      if (isNaN(year) || year.toString().length !== 4) {
        newErrors.birthYear = `Invalid year "${formData.birthYear}" — must be a 4-digit year (e.g. 2005)`;
      }
    }

    // Registration photo required
    if (!registrationPhoto) {
      newErrors.registrationPhoto = 'Please upload a photo of your registration form';
    }

    // Terms and Privacy Policy agreement required
    if (!agreedToTerms) {
      newErrors.terms = 'You must agree to the Terms and Privacy Policy to submit';
    }

    // Update state with errors
    setErrors(newErrors);

    // Auto-focus to first field with error
    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0];
      if (fieldRefs.current[firstErrorField]) {
        setTimeout(() => {
          fieldRefs.current[firstErrorField]?.focus();
        }, 0);
      }
    }

    // Return the errors object (not relying on state)
    return newErrors;
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setRegistrationPhoto(ev.target.result); // store raw base64 PDF
        if (errors.registrationPhoto) setErrors(prev => ({ ...prev, registrationPhoto: '' }));
      };
      reader.readAsDataURL(file);
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1200;
        let w = img.width, h = img.height;
        if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
        if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        setRegistrationPhoto(canvas.toDataURL('image/jpeg', 0.82));
        if (errors.registrationPhoto) setErrors(prev => ({ ...prev, registrationPhoto: '' }));
      };
      // Fallback for formats the browser can't decode in canvas (e.g. HEIC on desktop)
      img.onerror = () => {
        setRegistrationPhoto(ev.target.result);
        if (errors.registrationPhoto) setErrors(prev => ({ ...prev, registrationPhoto: '' }));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const toTitleCase = (str) =>
    str.replace(/\b\w/g, (c) => c.toUpperCase());

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    // Restrict input for specific fields
    if (name === 'studentId') {
      // Only allow digits, max 9
      newValue = value.replace(/\D/g, '').slice(0, 9);
    } else if (name === 'contactNumber' || name === 'emergencyNumber') {
      // Only allow digits, max 11
      newValue = value.replace(/\D/g, '').slice(0, 11);
    } else if (name === 'age') {
      // Only allow numbers
      newValue = value.replace(/\D/g, '');
    } else if (name === 'height' || name === 'weight') {
      // Only allow numbers and decimal
      newValue = value.replace(/[^0-9.]/g, '');
    } else if (name === 'bloodType') {
      newValue = value.toUpperCase().slice(0, 3);
    } else if (name === 'birthMonth') {
      // Only 1-12
      newValue = value.replace(/\D/g, '');
      if (newValue > 12) newValue = '12';
      if (newValue.startsWith('0') && newValue.length > 1) newValue = newValue.slice(1);
    } else if (name === 'birthDay') {
      // Only 1-31
      newValue = value.replace(/\D/g, '');
      if (newValue > 31) newValue = '31';
      if (newValue.startsWith('0') && newValue.length > 1) newValue = newValue.slice(1);
    } else if (name === 'birthYear') {
      // Only 4 digits
      newValue = value.replace(/\D/g, '').slice(0, 4);
    } else if (['firstName', 'lastName', 'middleName', 'municipality', 'province', 'emergencyContact'].includes(name)) {
      // Disallow numbers and special characters (only letters, spaces, dots, hyphens)
      newValue = toTitleCase(value.replace(/[^a-zA-ZÀ-ÖØ-öø-ÿ\s.'-]/g, ''));
    } else if (name === 'street') {
      newValue = toTitleCase(value);
    }

    const updatedFormData = { ...formData, [name]: newValue };
    setFormData(updatedFormData);
    localStorage.setItem('enrollmentFormData', JSON.stringify(updatedFormData));

    // Clear error when user types and update the top banner
    if (errors[name]) {
      const newErrors = { ...errors, [name]: '' };
      setErrors(newErrors);
      const remaining = Object.values(newErrors).filter(Boolean);
      setErrorBanner(remaining);
      if (remaining.length === 0 && errorTimerRef.current) {
        clearTimeout(errorTimerRef.current);
        errorTimerRef.current = null;
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isSubmitting) return;

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      showErrorBanner(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const enrollmentData = {
        ...formData,
        fullName: `${formData.lastName}, ${formData.firstName} ${formData.middleName}`.trim(),
        birthDate: `${formData.birthYear}-${formData.birthMonth.padStart(2, '0')}-${formData.birthDay.padStart(2, '0')}`,
        status: 'Pending',
        registrationPhoto,
      };

      await submitEnrollment(enrollmentData);
      showToast('Enrollment submitted successfully! Redirecting...', 'success');
      
      setSubmitted(true);
      localStorage.removeItem('enrollmentFormData');
      
    } catch (error) {
      console.error('❌ Enrollment submission failed:', error);
      const raw = error?.message || '';
      const friendly = raw.toLowerCase().includes('already exists') || raw.toLowerCase().includes('duplicate')
        ? `Student ID "${formData.studentId}" is already enrolled. Please check your Student ID.`
        : raw
          ? `Submission failed: ${raw}`
          : 'Submission failed. Please check your internet connection and try again.';
      showToast(friendly, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!enrollmentStatus.isOpen) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50/50 via-white to-gray-50 text-gray-900 font-sans flex flex-col justify-between">
        <header className="sticky top-0 z-40 bg-emerald-900/95 backdrop-blur-md text-white shadow-md border-b border-emerald-800/80">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex justify-between items-center gap-2">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-xl sm:rounded-2xl p-0.5 sm:p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-md border border-emerald-700">
                <img src={`${import.meta.env.BASE_URL}cvsu.png`} alt="CvSU Logo" className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-[11px] xs:text-xs sm:text-lg font-black tracking-tight truncate">Cavite State University Naic</h1>
                  <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                    NSTP Portal
                  </span>
                </div>
                <p className="text-emerald-200 text-[9px] sm:text-xs truncate font-medium">National Service Training Program Student Enrollment</p>
              </div>
            </div>
            <Link
              to="/"
              className="flex items-center gap-1 bg-emerald-800/90 hover:bg-emerald-700 text-emerald-100 font-bold px-2.5 sm:px-4 py-1.5 rounded-xl text-[10px] sm:text-xs border border-emerald-700/80 active:scale-95 transition-all shadow-sm shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
              <span>Back to Home</span>
            </Link>
          </div>
        </header>

        <main className="max-w-xl mx-auto py-12 px-4 w-full text-center flex-1 flex items-center justify-center">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-200/80 space-y-4">
            <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-amber-200">
              <Clock className="w-8 h-8" />
            </div>
            
            <h2 className="text-xl sm:text-2xl font-black text-emerald-950">{enrollmentStatus.headline}</h2>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed font-medium">
              {enrollmentStatus.subtext}
            </p>

            {enrollmentStatus.openAtFormatted && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center my-3">
                <p className="text-xs text-emerald-800 font-bold uppercase tracking-wider mb-1 flex items-center justify-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-700" /> Scheduled Opening Date &amp; Time
                </p>
                <p className="text-base sm:text-lg font-black text-emerald-950">{enrollmentStatus.openAtFormatted}</p>
                {enrollmentStatus.closeAtFormatted && (
                  <p className="text-xs text-emerald-700 font-medium mt-1">Application Deadline: <strong>{enrollmentStatus.closeAtFormatted}</strong></p>
                )}
              </div>
            )}

            {enrollmentStatus.customNotice && (
              <p className="text-amber-800 text-xs font-semibold bg-amber-50 border border-amber-200 p-3 rounded-xl">
                📢 {enrollmentStatus.customNotice}
              </p>
            )}

            <div className="pt-2">
              <Link
                to="/"
                className="inline-flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white font-black px-6 py-3 rounded-2xl text-xs shadow-md transition-all active:scale-95"
              >
                &larr; Return to Main Portal
              </Link>
            </div>
          </div>
        </main>

        <footer className="bg-emerald-950 text-white py-3 text-center text-xs">
          <p>© {new Date().getFullYear()} Cavite State University Naic Campus • NSTP System</p>
        </footer>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-950 to-teal-950 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 sm:p-10 max-w-md w-full text-center border border-emerald-500/20">
          <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-5 border-4 border-emerald-500/30 shadow-inner">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-emerald-950 mb-2">Enrollment Submitted!</h2>
          <p className="text-gray-600 text-xs sm:text-sm mb-6 font-medium leading-relaxed">
            Your NSTP enrollment application has been successfully submitted to Cavite State University Naic. You will receive an official update once reviewed.
          </p>
          <Link
            to="/"
            className="inline-block w-full bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-emerald-950 font-black px-6 py-3.5 rounded-xl transition-all shadow-md active:scale-95 text-sm"
          >
            Return to Homepage →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50/50 via-white to-gray-50 text-gray-900 font-sans selection:bg-emerald-500 selection:text-white flex flex-col justify-between">
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-bounce">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white font-semibold text-xs ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
            {toast.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span className="flex-1">{toast.message}</span>
            <button type="button" onClick={() => setToast(null)} className="text-white/80 hover:text-white flex-shrink-0 ml-1 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Sticky Glassmorphic Header - Scaled Miniature Match */}
      <header className="sticky top-0 z-40 bg-emerald-900/95 backdrop-blur-md text-white shadow-md border-b border-emerald-800/80">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex justify-between items-center gap-2">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-xl sm:rounded-2xl p-0.5 sm:p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-md border border-emerald-700">
              <img src={`${import.meta.env.BASE_URL}cvsu.png`} alt="CvSU Logo" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h1 className="text-[11px] xs:text-xs sm:text-lg font-black tracking-tight truncate">Cavite State University Naic</h1>
                <span className="hidden sm:inline-flex bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                  NSTP Portal
                </span>
              </div>
              <p className="text-emerald-200 text-[9px] sm:text-xs truncate font-medium">National Service Training Program Student Enrollment</p>
            </div>
          </div>

          <Link
            to="/"
            className="flex items-center gap-1 bg-emerald-800/90 hover:bg-emerald-700 text-emerald-100 font-bold px-2.5 sm:px-4 py-1.5 rounded-xl text-[10px] sm:text-xs border border-emerald-700/80 active:scale-95 transition-all shadow-sm shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Form Container - Compact Mobile Spacing */}
      <main className="max-w-5xl mx-auto py-4 sm:py-10 px-3 sm:px-4 w-full flex-1">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-emerald-100/80 overflow-hidden">
          
          {/* Hero Header Banner */}
          <div className="bg-gradient-to-r from-emerald-900 via-emerald-850 to-teal-900 text-white p-4 sm:p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"></div>
            <span className="inline-flex items-center gap-1.5 bg-amber-400 text-gray-950 font-black text-[10px] sm:text-[11px] uppercase tracking-wider px-3 py-0.5 rounded-full mb-2 shadow-sm">
              <Sparkles className="w-3 h-3 text-emerald-950" />
              Official Student Enrollment Form
            </span>
            <h2 className="text-lg sm:text-3xl font-black text-white tracking-tight">
              NSTP Enrollment Application
            </h2>
            <p className="text-emerald-200 text-[11px] sm:text-sm mt-1.5 max-w-xl mx-auto font-medium">
              Cavite State University Naic Campus • Please provide accurate details matching your official CvSU Registration Form.
            </p>
          </div>

          <div className="p-4 sm:p-8 space-y-5 sm:space-y-8">
            {hasSavedData && (
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-900">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Continuing from a previous session. Your form progress was automatically saved.</span>
                </div>
                <button
                  type="button"
                  onClick={handleStartFresh}
                  className="shrink-0 text-xs font-black text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                >
                  Start Fresh
                </button>
              </div>
            )}

            {errorBanner.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5 animate-shake shadow-sm">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-red-900 font-extrabold text-sm mb-1.5">Please correct the following fields before submitting:</p>
                    <ul className="space-y-1">
                      {errorBanner.map((msg, i) => (
                        <li key={i} className="text-red-700 text-xs font-semibold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                          {msg}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setErrorBanner([]); if (errorTimerRef.current) clearTimeout(errorTimerRef.current); }}
                    className="text-red-400 hover:text-red-700 flex-shrink-0 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} onKeyDown={(e) => e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.preventDefault()} className="space-y-8">
              
              {/* Step 1: Personal Information */}
              <div className="bg-gray-50/70 rounded-3xl p-6 sm:p-8 border border-gray-100/90 shadow-2xs">
                <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-200/80">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-black text-sm shadow-sm shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-emerald-950">1. Personal Information</h3>
                    <p className="text-xs text-gray-500 font-medium">Enter your full legal name, student number, and complete address</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Last Name *</label>
                    <input
                      ref={el => fieldRefs.current.lastName = el}
                      type="text"
                      name="lastName"
                      required
                      placeholder="Dela Cruz"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none transition-all font-medium ${errors.lastName ? 'border-red-500 bg-red-50/50' : 'border-gray-200'}`}
                    />
                    {errors.lastName && <p className="text-red-500 text-[11px] font-bold mt-1">{errors.lastName}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">First Name *</label>
                    <input
                      ref={el => fieldRefs.current.firstName = el}
                      type="text"
                      name="firstName"
                      required
                      placeholder="Juan"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none transition-all font-medium ${errors.firstName ? 'border-red-500 bg-red-50/50' : 'border-gray-200'}`}
                    />
                    {errors.firstName && <p className="text-red-500 text-[11px] font-bold mt-1">{errors.firstName}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Middle Name</label>
                    <input
                      type="text"
                      name="middleName"
                      placeholder="Santos (Optional)"
                      value={formData.middleName}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 text-xs sm:text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Student No. (9 digits) *</label>
                    <input
                      ref={el => fieldRefs.current.studentId = el}
                      type="text"
                      name="studentId"
                      required
                      placeholder="202400001"
                      value={formData.studentId}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none transition-all font-medium ${errors.studentId ? 'border-red-500 bg-red-50/50' : 'border-gray-200'}`}
                    />
                    {errors.studentId && <p className="text-red-500 text-[11px] font-bold mt-1">{errors.studentId}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Street / Barangay *</label>
                    <input
                      ref={el => fieldRefs.current.street = el}
                      type="text"
                      name="street"
                      id="street"
                      required
                      autoComplete="address-line1"
                      placeholder="Blk 1 Lot 2, Mahogany St., Brgy. Bucana"
                      value={formData.street}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none transition-all font-medium ${errors.street ? 'border-red-500 bg-red-50/50' : 'border-gray-200'}`}
                    />
                    {errors.street && <p className="text-red-500 text-[11px] font-bold mt-1">{errors.street}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Municipality / City *</label>
                    <input
                      ref={el => fieldRefs.current.municipality = el}
                      type="text"
                      name="municipality"
                      id="municipality"
                      required
                      autoComplete="address-level2"
                      placeholder="Naic"
                      value={formData.municipality}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none transition-all font-medium ${errors.municipality ? 'border-red-500 bg-red-50/50' : 'border-gray-200'}`}
                    />
                    {errors.municipality && <p className="text-red-500 text-[11px] font-bold mt-1">{errors.municipality}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Province *</label>
                    <input
                      ref={el => fieldRefs.current.province = el}
                      type="text"
                      name="province"
                      id="province"
                      required
                      autoComplete="address-level1"
                      placeholder="Cavite"
                      value={formData.province}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none transition-all font-medium ${errors.province ? 'border-red-500 bg-red-50/50' : 'border-gray-200'}`}
                    />
                    {errors.province && <p className="text-red-500 text-[11px] font-bold mt-1">{errors.province}</p>}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Email Address *</label>
                  <input
                    ref={el => fieldRefs.current.email = el}
                    type="email"
                    name="email"
                    required
                    placeholder="student@cvsu.edu.ph"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none transition-all font-medium ${errors.email ? 'border-red-500 bg-red-50/50' : 'border-gray-200'}`}
                  />
                  {errors.email && <p className="text-red-500 text-[11px] font-bold mt-1">{errors.email}</p>}
                </div>
              </div>

              {/* Step 2: Academic Information */}
              <div className="bg-gray-50/70 rounded-3xl p-6 sm:p-8 border border-gray-100/90 shadow-2xs">
                <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-200/80">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-black text-sm shadow-sm shrink-0">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-emerald-950">2. Academic Information</h3>
                    <p className="text-xs text-gray-500 font-medium">Select your degree program, section, and year level</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Program *</label>
                    <select
                      ref={el => fieldRefs.current.program = el}
                      name="program"
                      required
                      value={formData.program}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none transition-all font-medium ${errors.program ? 'border-red-500 bg-red-50/50' : 'border-gray-200'}`}
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
                    {errors.program && <p className="text-red-500 text-[11px] font-bold mt-1">{errors.program}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Section *</label>
                    <select
                      ref={el => fieldRefs.current.section = el}
                      name="section"
                      required
                      value={formData.section}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none transition-all font-medium ${errors.section ? 'border-red-500 bg-red-50/50' : 'border-gray-200'}`}
                    >
                      <option value="">Select Section</option>
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                      <option value="D">Section D</option>
                    </select>
                    {errors.section && <p className="text-red-500 text-[11px] font-bold mt-1">{errors.section}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Year Level *</label>
                    <select
                      ref={el => fieldRefs.current.yearLevel = el}
                      name="yearLevel"
                      required
                      value={formData.yearLevel}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none transition-all font-medium ${errors.yearLevel ? 'border-red-500 bg-red-50/50' : 'border-gray-200'}`}
                    >
                      <option value="">Select Year</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </select>
                    {errors.yearLevel && <p className="text-red-500 text-[11px] font-bold mt-1">{errors.yearLevel}</p>}
                  </div>
                </div>
              </div>

              {/* Step 3: NSTP Component Selection */}
              <div className="bg-gray-50/70 rounded-3xl p-6 sm:p-8 border border-gray-100/90 shadow-2xs">
                <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-200/80">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-black text-sm shadow-sm shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-emerald-950">3. Select NSTP Component Track *</h3>
                    <p className="text-xs text-gray-500 font-medium">Choose your preferred National Service Training Program track</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    {
                      id: 'CWTS',
                      title: 'CWTS',
                      subtitle: 'Civic Welfare Training Service',
                      desc: 'Community development, environmental health, and civic welfare initiatives.',
                      badge: 'Civic & Community'
                    },
                    {
                      id: 'LTS',
                      title: 'LTS',
                      subtitle: 'Literacy Training Service',
                      desc: 'Teaching literacy and math skills to children and out-of-school youth.',
                      badge: 'Education & Literacy'
                    },
                    {
                      id: 'ROTC',
                      title: 'ROTC',
                      subtitle: "Reserve Officers' Training Corps",
                      desc: 'Military defense training, leadership development, and physical discipline.',
                      badge: 'Military & Defense'
                    }
                  ].map(item => (
                    <div
                      key={item.id}
                      onClick={() => {
                        const upd = { ...formData, nstpComponent: item.id };
                        setFormData(upd);
                        localStorage.setItem('enrollmentFormData', JSON.stringify(upd));
                      }}
                      className={`cursor-pointer rounded-2xl p-5 border-2 transition-all relative flex flex-col justify-between ${
                        formData.nstpComponent === item.id 
                          ? 'bg-emerald-50/90 border-emerald-600 shadow-md ring-2 ring-emerald-500/20' 
                          : 'bg-white border-gray-200 hover:border-emerald-300 hover:shadow-sm'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2.5">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                            formData.nstpComponent === item.id ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {item.badge}
                          </span>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                            formData.nstpComponent === item.id ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-gray-300'
                          }`}>
                            {formData.nstpComponent === item.id && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                        <h4 className="text-xl font-black text-emerald-950">{item.title}</h4>
                        <p className="text-xs font-extrabold text-emerald-800 mb-2">{item.subtitle}</p>
                        <p className="text-[11px] text-gray-600 leading-relaxed font-medium">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 4: Demographic & Emergency Info */}
              <div className="bg-gray-50/70 rounded-3xl p-6 sm:p-8 border border-gray-100/90 shadow-2xs">
                <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-200/80">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-black text-sm shadow-sm shrink-0">
                    <Heart className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-emerald-950">4. Demographic &amp; Emergency Info</h3>
                    <p className="text-xs text-gray-500 font-medium">Enter birthdate, personal statistics, and emergency contact</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Birthdate *</label>
                  <input
                    ref={el => fieldRefs.current.birthMonth = el}
                    type="date"
                    name="birthDate"
                    id="birthDate"
                    autoComplete="bday"
                    max={new Date().toISOString().split('T')[0]}
                    value={
                      formData.birthYear && formData.birthMonth && formData.birthDay
                        ? `${formData.birthYear}-${String(formData.birthMonth).padStart(2,'0')}-${String(formData.birthDay).padStart(2,'0')}`
                        : ''
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) {
                        const upd = { ...formData, birthYear: '', birthMonth: '', birthDay: '' };
                        setFormData(upd);
                        localStorage.setItem('enrollmentFormData', JSON.stringify(upd));
                        return;
                      }
                      const [y, m, d] = val.split('-');
                      const upd = { ...formData, birthYear: y, birthMonth: String(parseInt(m)), birthDay: String(parseInt(d)) };
                      setFormData(upd);
                      localStorage.setItem('enrollmentFormData', JSON.stringify(upd));
                      if (errors.birthMonth || errors.birthDay || errors.birthYear) {
                        setErrors(prev => ({ ...prev, birthMonth: '', birthDay: '', birthYear: '' }));
                      }
                    }}
                    className={`w-full px-4 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none transition-all font-medium ${errors.birthMonth || errors.birthDay || errors.birthYear ? 'border-red-500 bg-red-50/50' : 'border-gray-200'}`}
                  />
                  {(errors.birthMonth || errors.birthDay || errors.birthYear) && (
                    <p className="text-red-500 text-[11px] font-bold mt-1">{errors.birthMonth || errors.birthDay || errors.birthYear}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Age *</label>
                    <input
                      ref={el => fieldRefs.current.age = el}
                      type="text"
                      name="age"
                      required
                      placeholder="e.g. 18"
                      value={formData.age}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none transition-all font-medium ${errors.age ? 'border-red-500 bg-red-50/50' : 'border-gray-200'}`}
                    />
                    {errors.age && <p className="text-red-500 text-[11px] font-bold mt-1">{errors.age}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Civil Status *</label>
                    <select
                      ref={el => fieldRefs.current.civilStatus = el}
                      name="civilStatus"
                      required
                      value={formData.civilStatus}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none transition-all font-medium ${errors.civilStatus ? 'border-red-500 bg-red-50/50' : 'border-gray-200'}`}
                    >
                      <option value="">Select Status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                    {errors.civilStatus && <p className="text-red-500 text-[11px] font-bold mt-1">{errors.civilStatus}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Sex *</label>
                    <select
                      ref={el => fieldRefs.current.sex = el}
                      name="sex"
                      required
                      value={formData.sex}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none transition-all font-medium ${errors.sex ? 'border-red-500 bg-red-50/50' : 'border-gray-200'}`}
                    >
                      <option value="">Select Sex</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                    {errors.sex && <p className="text-red-500 text-[11px] font-bold mt-1">{errors.sex}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Height (cm)</label>
                    <input
                      type="text"
                      name="height"
                      placeholder="e.g. 165"
                      value={formData.height}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 text-xs sm:text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Weight (kg)</label>
                    <input
                      type="text"
                      name="weight"
                      placeholder="e.g. 55"
                      value={formData.weight}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 text-xs sm:text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Blood Type</label>
                    <select
                      name="bloodType"
                      value={formData.bloodType}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 text-xs sm:text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none transition-all font-medium"
                    >
                      <option value="">Select Blood Type</option>
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
                      ref={el => fieldRefs.current.contactNumber = el}
                      type="text"
                      name="contactNumber"
                      required
                      placeholder="09123456789"
                      value={formData.contactNumber}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none transition-all font-medium ${errors.contactNumber ? 'border-red-500 bg-red-50/50' : 'border-gray-200'}`}
                    />
                    {errors.contactNumber && <p className="text-red-500 text-[11px] font-bold mt-1">{errors.contactNumber}</p>}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Emergency Contact Person *</label>
                    <input
                      ref={el => fieldRefs.current.emergencyContact = el}
                      type="text"
                      name="emergencyContact"
                      required
                      placeholder="Parent or Guardian Name"
                      value={formData.emergencyContact}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none transition-all font-medium ${errors.emergencyContact ? 'border-red-500 bg-red-50/50' : 'border-gray-200'}`}
                    />
                    {errors.emergencyContact && <p className="text-red-500 text-[11px] font-bold mt-1">{errors.emergencyContact}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Emergency Contact No. *</label>
                    <input
                      ref={el => fieldRefs.current.emergencyNumber = el}
                      type="tel"
                      name="emergencyNumber"
                      required
                      placeholder="09123456789"
                      value={formData.emergencyNumber}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 text-xs sm:text-sm bg-white border rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none transition-all font-medium ${errors.emergencyNumber ? 'border-red-500 bg-red-50/50' : 'border-gray-200'}`}
                    />
                    {errors.emergencyNumber && <p className="text-red-500 text-[11px] font-bold mt-1">{errors.emergencyNumber}</p>}
                  </div>
                </div>
              </div>

              {/* Step 5: Registration Form Attachment */}
              <div className="bg-gray-50/70 rounded-3xl p-6 sm:p-8 border border-gray-100/90 shadow-2xs">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200/80">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-black text-sm shadow-sm shrink-0">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-emerald-950">5. Registration Form Photo Attachment *</h3>
                    <p className="text-xs text-gray-500 font-medium">Attach or scan a clear photo of your official CvSU Registration Form</p>
                  </div>
                </div>

                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*,.heic,.heif,application/pdf,.pdf"
                  onChange={handlePhotoChange}
                  className="hidden"
                />

                {!registrationPhoto ? (
                  <div
                    className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all bg-white ${
                      errors.registrationPhoto ? 'border-red-400 bg-red-50/40' : 'border-emerald-200 hover:border-emerald-500 hover:shadow-sm'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3 border border-emerald-100">
                      <Upload className="w-7 h-7" />
                    </div>
                    <h4 className="text-sm font-black text-emerald-950 mb-1">Upload Your CvSU Registration Form</h4>
                    <p className="text-xs text-gray-500 mb-5 max-w-sm mx-auto">
                      Supported files: JPG, PNG, WEBP, HEIC, PDF. Ensure text and student details are clearly readable.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <button
                        type="button"
                        onClick={() => photoInputRef.current.click()}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        Choose from Device
                      </button>
                      <button
                        type="button"
                        onClick={() => photoInputRef.current.click()}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                      >
                        <Camera className="w-4 h-4 text-amber-400" />
                        Scan / Take Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border-2 border-emerald-500 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-16 h-20 bg-gray-100 rounded-xl overflow-hidden border border-emerald-200 shrink-0 shadow-sm">
                        <img src={registrationPhoto} alt="Uploaded form" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full mb-1">
                          <CheckCircle className="w-3 h-3 text-emerald-600" /> Attached
                        </span>
                        <h4 className="text-xs font-black text-gray-900 truncate">Registration Form Attached</h4>
                        <p className="text-[11px] text-gray-500">Document successfully loaded and ready for submission</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => photoInputRef.current.click()}
                        className="px-3.5 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegistrationPhoto(null)}
                        className="px-3.5 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                )}
                {errors.registrationPhoto && <p className="text-red-500 text-xs font-bold mt-2 text-center">{errors.registrationPhoto}</p>}
              </div>

              {/* Terms & Agreement Box */}
              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-3xl p-6 shadow-2xs">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="w-5 h-5 rounded-lg border-emerald-300 text-emerald-700 focus:ring-emerald-500 mt-0.5 cursor-pointer shrink-0"
                  />
                  <span className="text-xs sm:text-sm text-emerald-950 font-medium leading-relaxed">
                    I certify that all information provided in this enrollment application is true and correct to the best of my knowledge. I agree to the{' '}
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="text-emerald-700 font-extrabold underline hover:text-emerald-900 cursor-pointer"
                    >
                      Terms of Service &amp; Privacy Policy
                    </button>.
                  </span>
                </label>
              </div>

              {/* High-Impact Submit Button matching Landing/Login */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 px-8 rounded-2xl text-base sm:text-lg font-black transition-all shadow-xl active:scale-95 cursor-pointer ${
                  isSubmitting
                    ? 'bg-amber-400/60 text-emerald-950/70 cursor-wait'
                    : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-emerald-950 shadow-amber-950/20 hover:shadow-2xl hover:-translate-y-0.5'
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Terms and Privacy Policy Modal */}
      {showTermsModal && (
        <div 
          className="fixed inset-0 bg-emerald-950/75 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setShowTermsModal(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-emerald-100/80 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-900 via-emerald-850 to-teal-900 text-white p-5 sm:p-6 flex items-center justify-between shadow-sm shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight">Terms of Service &amp; Privacy Policy</h3>
                  <p className="text-emerald-200 text-xs font-medium">Cavite State University Naic • NSTP Portal Guidelines</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="w-8 h-8 rounded-full bg-emerald-800/80 hover:bg-emerald-700 flex items-center justify-center text-emerald-200 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs sm:text-sm text-gray-700 leading-relaxed">
              {/* Terms Section */}
              <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100/80">
                <h4 className="text-sm font-black text-emerald-950 mb-2.5 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Terms of Service &amp; Student Agreement
                </h4>
                <ul className="space-y-2 text-gray-600 font-medium">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 mt-1.5"></span>
                    <span><strong>Truthful Submission:</strong> All details provided in this online enrollment form must match your official CvSU Registration Form.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 mt-1.5"></span>
                    <span><strong>Mandatory Attendance:</strong> Enrolled students are obligated to complete mandatory training hours for their chosen NSTP component (CWTS / LTS / ROTC).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 mt-1.5"></span>
                    <span><strong>Code of Conduct:</strong> Students must abide by the rules and policies set by Cavite State University and the NSTP Office.</span>
                  </li>
                </ul>
              </div>

              {/* Privacy Policy Section */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200/80">
                <h4 className="text-sm font-black text-emerald-950 mb-2.5 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  Data Privacy Policy (RA 10173 Compliance)
                </h4>
                <p className="text-gray-600 font-medium mb-3">
                  In compliance with Republic Act No. 10173 (Data Privacy Act of 2012), Cavite State University Naic respects and protects your personal data privacy:
                </p>
                <ul className="space-y-2 text-gray-600 font-medium">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 mt-1.5"></span>
                    <span><strong>Collection Purpose:</strong> Personal information and uploaded registration forms are strictly processed for NSTP course registration and CHED/DND compliance reporting.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 mt-1.5"></span>
                    <span><strong>Security Protection:</strong> Data is securely stored and accessed exclusively by authorized CvSU NSTP administrators and department heads.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Footer Modal Action */}
            <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer active:scale-95"
              >
                I Understand &amp; Agree
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Bar matching Landing Page footer */}
      <footer className="bg-emerald-950 text-white border-t border-emerald-900 py-6 px-4 shrink-0 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-emerald-400 font-medium">
          <p>© {new Date().getFullYear()} Cavite State University Naic Campus • NSTP System</p>
          <p className="text-emerald-300/70">Official National Service Training Program Portal</p>
        </div>
      </footer>
    </div>
  );
}

export default Enrollment;
