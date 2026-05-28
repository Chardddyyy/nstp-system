import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';
import { ArrowLeft, CheckCircle, X, FileText, Shield, Eye, AlertCircle } from 'lucide-react';

function Enrollment() {
  const { submitEnrollment } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('enrollmentFormData');
    return saved ? JSON.parse(saved) : {
      lastName: '',
      firstName: '',
      middleName: '',
      studentId: '',
      homeAddress: '',
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

  // Refs for auto-focus functionality
  const fieldRefs = useRef({});

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    const requiredFields = [
      'lastName', 'firstName', 'studentId', 'homeAddress', 'email',
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

    // Email - must contain @
    if (formData.email && !formData.email.includes('@')) {
      newErrors.email = 'Invalid email — must contain "@" (e.g. student@cvsu.edu.ph)';
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
    }

    const updatedFormData = { ...formData, [name]: newValue };
    setFormData(updatedFormData);
    localStorage.setItem('enrollmentFormData', JSON.stringify(updatedFormData));

    // Clear error when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isSubmitting) return;

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const enrollmentData = {
        ...formData,
        fullName: `${formData.lastName}, ${formData.firstName} ${formData.middleName}`.trim(),
        birthDate: `${formData.birthYear}-${formData.birthMonth.padStart(2, '0')}-${formData.birthDay.padStart(2, '0')}`,
        status: 'Pending',
      };

      await submitEnrollment(enrollmentData);
      showToast('Enrollment submitted successfully! Redirecting...', 'success');
      
      setSubmitted(true);
      localStorage.removeItem('enrollmentFormData');
      
    } catch (error) {
      console.error('❌ Enrollment submission failed:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        stack: error.stack
      });
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

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Enrollment Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Your enrollment application has been received. You will be notified once it is reviewed.
          </p>
          <Link
            to="/"
            className="inline-block bg-green-700 hover:bg-green-800 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Centered toast notification */}
      {toast && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none">
          <div className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white text-sm font-medium max-w-xs w-full mx-4 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            {toast.type === 'success'
              ? <CheckCircle className="w-5 h-5 flex-shrink-0" />
              : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span className="flex-1">{toast.message}</span>
            <button type="button" onClick={() => setToast(null)} className="text-white/80 hover:text-white flex-shrink-0 ml-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-green-800 text-white py-4 px-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center space-x-1 text-green-200 hover:text-white transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <div className="flex-1 text-center">
            <h1 className="text-base sm:text-xl font-bold">Cavite State University - Naic Campus</h1>
            <p className="text-green-200 text-xs sm:text-sm hidden sm:block">National Service Training Program Student Enrollment</p>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Student Enrollment Form
          </h2>

          <form onSubmit={handleSubmit} onKeyDown={(e) => e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.preventDefault()} className="space-y-6">
            {/* Personal Information */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Personal Information</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    ref={el => fieldRefs.current.lastName = el}
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${errors.lastName ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    ref={el => fieldRefs.current.firstName = el}
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${errors.firstName ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                  <input
                    type="text"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student No. (9 digits) *</label>
                  <input
                    ref={el => fieldRefs.current.studentId = el}
                    type="text"
                    name="studentId"
                    required
                    placeholder="202400001"
                    value={formData.studentId}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${errors.studentId ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  />
                  {errors.studentId && <p className="text-red-500 text-xs mt-1">{errors.studentId}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Home Address *</label>
                  <input
                    ref={el => fieldRefs.current.homeAddress = el}
                    type="text"
                    name="homeAddress"
                    required
                    placeholder="Blk 1 Lot 2, Mahogany Street, Green Village, Naic, Cavite"
                    value={formData.homeAddress}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${errors.homeAddress ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  />
                  {errors.homeAddress && <p className="text-red-500 text-xs mt-1">{errors.homeAddress}</p>}
                  <p className="text-xs text-gray-500 mt-1">Format: Block and Lot, Street, Village/Subdivision, Municipality, Province</p>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <input
                  ref={el => fieldRefs.current.email = el}
                  type="email"
                  name="email"
                  required
                  placeholder="example@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
            </div>

            {/* Academic Information */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Academic Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Program *</label>
                  <select
                    ref={el => fieldRefs.current.program = el}
                    name="program"
                    required
                    value={formData.program}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${errors.program ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
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
                  {errors.program && <p className="text-red-500 text-xs mt-1">{errors.program}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
                  <select
                    ref={el => fieldRefs.current.section = el}
                    name="section"
                    required
                    value={formData.section}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${errors.section ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  >
                    <option value="">Select Section</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                  {errors.section && <p className="text-red-500 text-xs mt-1">{errors.section}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year Level *</label>
                  <select
                    ref={el => fieldRefs.current.yearLevel = el}
                    name="yearLevel"
                    required
                    value={formData.yearLevel}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${errors.yearLevel ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  >
                    <option value="">Select Year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                  {errors.yearLevel && <p className="text-red-500 text-xs mt-1">{errors.yearLevel}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NSTP Component *</label>
                  <select
                    name="nstpComponent"
                    required
                    value={formData.nstpComponent}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="CWTS">CWTS</option>
                    <option value="LTS">LTS</option>
                    <option value="ROTC">ROTC</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Demographic Information */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Demographic Information</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Birth Month (1-12) *</label>
                  <input
                    ref={el => fieldRefs.current.birthMonth = el}
                    type="text"
                    name="birthMonth"
                    required
                    placeholder="MM"
                    value={formData.birthMonth}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${errors.birthMonth ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  />
                  {errors.birthMonth && <p className="text-red-500 text-xs mt-1">{errors.birthMonth}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Birth Day (1-31) *</label>
                  <input
                    ref={el => fieldRefs.current.birthDay = el}
                    type="text"
                    name="birthDay"
                    required
                    placeholder="DD"
                    value={formData.birthDay}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${errors.birthDay ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  />
                  {errors.birthDay && <p className="text-red-500 text-xs mt-1">{errors.birthDay}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Birth Year (4 digits) *</label>
                  <input
                    ref={el => fieldRefs.current.birthYear = el}
                    type="text"
                    name="birthYear"
                    required
                    placeholder="YYYY"
                    value={formData.birthYear}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${errors.birthYear ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  />
                  {errors.birthYear && <p className="text-red-500 text-xs mt-1">{errors.birthYear}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
                  <input
                    ref={el => fieldRefs.current.age = el}
                    type="text"
                    name="age"
                    required
                    value={formData.age}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${errors.age ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  />
                  {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Civil Status *</label>
                  <select
                    ref={el => fieldRefs.current.civilStatus = el}
                    name="civilStatus"
                    required
                    value={formData.civilStatus}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${errors.civilStatus ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  >
                    <option value="">Select</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                  {errors.civilStatus && <p className="text-red-500 text-xs mt-1">{errors.civilStatus}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sex *</label>
                  <select
                    ref={el => fieldRefs.current.sex = el}
                    name="sex"
                    required
                    value={formData.sex}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${errors.sex ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  {errors.sex && <p className="text-red-500 text-xs mt-1">{errors.sex}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                  <input
                    type="text"
                    name="height"
                    placeholder="cm"
                    value={formData.height}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                  <input
                    type="text"
                    name="weight"
                    placeholder="kg"
                    value={formData.weight}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type</label>
                  <select
                    name="bloodType"
                    value={formData.bloodType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number (11 digits) *</label>
                  <input
                    ref={el => fieldRefs.current.contactNumber = el}
                    type="text"
                    name="contactNumber"
                    required
                    placeholder="09123456789"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${errors.contactNumber ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  />
                  {errors.contactNumber && <p className="text-red-500 text-xs mt-1">{errors.contactNumber}</p>}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Facebook Account</label>
                <input
                  type="text"
                  name="facebookAccount"
                  placeholder="facebook.com/username"
                  value={formData.facebookAccount}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Emergency Contact</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person *</label>
                  <input
                    ref={el => fieldRefs.current.emergencyContact = el}
                    type="text"
                    name="emergencyContact"
                    required
                    value={formData.emergencyContact}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${errors.emergencyContact ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  />
                  {errors.emergencyContact && <p className="text-red-500 text-xs mt-1">{errors.emergencyContact}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
                  <input
                    ref={el => fieldRefs.current.emergencyNumber = el}
                    type="tel"
                    name="emergencyNumber"
                    required
                    placeholder="11 digits (e.g., 09123456789)"
                    value={formData.emergencyNumber}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors ${errors.emergencyNumber ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  />
                  {errors.emergencyNumber && (
                    <p className="text-red-500 text-xs mt-1">{errors.emergencyNumber}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Terms and Privacy Policy */}
            <div className="border-b pb-6">
              <div className="flex items-start space-x-3">
                <input
                  ref={el => fieldRefs.current.terms = el}
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => {
                    setAgreedToTerms(e.target.checked);
                    if (e.target.checked && errors.terms) {
                      setErrors({ ...errors, terms: '' });
                    }
                  }}
                  className={`mt-1 w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 ${errors.terms ? 'border-red-500' : ''}`}
                />
                <div className="flex-1">
                  <label htmlFor="terms" className="text-sm text-gray-700">
                    I agree to the{' '}
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="text-green-600 hover:text-green-800 underline font-medium"
                    >
                      Terms and Privacy Policy
                    </button>
                    {' '}regarding the use of my personal data for NSTP enrollment and record management purposes.
                  </label>
                  {errors.terms && (
                    <p className="text-red-500 text-xs mt-1">{errors.terms}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 gap-4">
              <p className="text-sm text-gray-500">
                Please review your information before submitting.
              </p>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`font-bold px-8 py-3 rounded-lg transition-colors w-full sm:w-auto ${
                  isSubmitting
                    ? 'bg-yellow-600 text-white cursor-wait opacity-75'
                    : 'bg-green-700 hover:bg-green-800 active:bg-green-900 text-white'
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Enrollment'}
              </button>
            </div>
          </form>
        </div>
      </main>
      {/* Terms and Privacy Policy Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-green-800 text-white p-4 flex items-center justify-between rounded-t-xl">
              <div className="flex items-center space-x-2">
                <FileText className="w-6 h-6" />
                <h3 className="text-lg font-bold">Terms and Privacy Policy</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="p-1 hover:bg-green-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Terms of Service */}
              <div>
                <h4 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Terms of Service
                </h4>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>By enrolling in the NSTP program through this system, you agree to:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Provide accurate and truthful information in your enrollment application</li>
                    <li>Complete the required NSTP hours and activities as mandated by the program</li>
                    <li>Attend scheduled training sessions, community service activities, or military exercises</li>
                    <li>Follow the rules and regulations set by CvSU Naic and the NSTP office</li>
                    <li>Submit required reports and documentation on time</li>
                    <li>Participate in program evaluations and assessments</li>
                  </ul>
                </div>
              </div>

              {/* Privacy Policy */}
              <div>
                <h4 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                  <Eye className="w-5 h-5 mr-2" />
                  Privacy Policy
                </h4>
                <div className="text-sm text-gray-600 space-y-3">
                  <p>We value your privacy and are committed to protecting your personal information. Here's how we use your data:</p>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-medium text-gray-800 mb-2">Data We Collect:</h5>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Personal Information: Name, Student ID, Birth Date, Gender</li>
                      <li>Contact Details: Email address, Contact Number, Address</li>
                      <li>Academic Information: Program, Section, Year Level, NSTP Component</li>
                      <li>Emergency Contact: Name and contact number</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-medium text-gray-800 mb-2">How We Use Your Data:</h5>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li><strong>Enrollment Processing:</strong> To process your NSTP enrollment and component assignment</li>
                      <li><strong>Record Management:</strong> To maintain accurate student records for program tracking</li>
                      <li><strong>Communication:</strong> To send updates, schedules, and important announcements</li>
                      <li><strong>Emergency Contact:</strong> To reach your emergency contact if necessary</li>
                      <li><strong>Reporting:</strong> To generate reports for academic and administrative purposes</li>
                      <li><strong>Verification:</strong> To verify student identity and eligibility for program completion</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-medium text-gray-800 mb-2">Data Protection:</h5>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Your data is stored securely and accessible only to authorized personnel</li>
                      <li>We implement appropriate security measures to prevent unauthorized access</li>
                      <li>Your information will not be shared with third parties without your consent</li>
                      <li>You have the right to request access to your personal data</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 text-center">
                  By checking the checkbox, you acknowledge that you have read and understood these terms.
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white p-4 border-t flex justify-end">
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="bg-green-700 hover:bg-green-800 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Enrollment;
