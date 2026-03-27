import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { GraduationCap, ArrowLeft, CheckCircle, X, FileText, Shield, Eye } from 'lucide-react';

function Enrollment() {
  const navigate = useNavigate();
  const { submitEnrollment } = useAuth();
  const [submitted, setSubmitted] = useState(false);
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

  const validateForm = () => {
    const newErrors = {};

    // Student ID - exactly 9 digits
    if (!/^\d{9}$/.test(formData.studentId)) {
      newErrors.studentId = 'Student ID must be exactly 9 digits';
    }

    // Email - must contain @
    if (!formData.email.includes('@')) {
      newErrors.email = 'Email must contain @ symbol';
    }

    // Contact Number - exactly 11 digits
    if (!/^\d{11}$/.test(formData.contactNumber)) {
      newErrors.contactNumber = 'Contact Number must be exactly 11 digits';
    }

    // Emergency Number - exactly 11 digits
    if (!/^\d{11}$/.test(formData.emergencyNumber)) {
      newErrors.emergencyNumber = 'Emergency Contact Number must be exactly 11 digits';
    }

    // Birth Date validation
    if (formData.birthMonth && formData.birthDay && formData.birthYear) {
      const month = parseInt(formData.birthMonth, 10);
      const day = parseInt(formData.birthDay, 10);
      const year = parseInt(formData.birthYear, 10);
      
      if (month < 1 || month > 12) {
        newErrors.birthMonth = 'Month must be between 1-12';
      }
      if (month > 12) {
        newErrors.birthDate = 'Month cannot exceed 12';
      }
      if (year.toString().length !== 4) {
        newErrors.birthDate = 'Year must be 4 digits';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
    console.log('Form submit attempted');
    console.log('Form data:', formData);
    
    if (!validateForm()) {
      console.log('Validation failed, errors:', errors);
      alert('Please fix the errors in the form before submitting.\n\nCheck that:\n- Student ID is exactly 9 digits\n- Email contains @\n- Contact numbers are exactly 11 digits\n- All required fields are filled');
      return;
    }
    
    console.log('Validation passed, submitting...');
    try {
      await submitEnrollment({
        ...formData,
        fullName: `${formData.lastName}, ${formData.firstName} ${formData.middleName}`.trim(),
        birthDate: `${formData.birthYear}-${formData.birthMonth.padStart(2, '0')}-${formData.birthDay.padStart(2, '0')}`,
        status: 'Pending',
      });
      setSubmitted(true);
      localStorage.removeItem('enrollmentFormData');
      // Redirect to landing page after 5 seconds
      setTimeout(() => {
        navigate('/');
      }, 5000);
    } catch (error) {
      console.error('Enrollment submission failed:', error);
      alert('Failed to submit enrollment. Please try again.');
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Enrollment Submitted!</h2>
          <p className="text-gray-600 mb-2">
            Your enrollment application has been received.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Redirecting to home page in 5 seconds...
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
      {/* Header */}
      <header className="bg-green-800 text-white py-4 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between relative">
          <Link
            to="/"
            className="flex items-center space-x-1 text-green-200 hover:text-white transition-colors -ml-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Link>
          <div className="flex items-center space-x-3 absolute left-1/2 transform -translate-x-1/2">
            <div>
              <h1 className="text-xl font-bold">Cavite State University - Naic Campus</h1>
              <p className="text-green-200 text-sm">National Service Training Program Student Enrollment</p>
            </div>
          </div>
          <div className="w-16"></div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Student Enrollment Form
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Personal Information</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                  <input
                    type="text"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student No. (9 digits) *</label>
                  <input
                    type="text"
                    name="studentId"
                    required
                    placeholder="202400001"
                    value={formData.studentId}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.studentId ? 'border-red-500' : ''}`}
                  />
                  {errors.studentId && <p className="text-red-500 text-xs mt-1">{errors.studentId}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Home Address *</label>
                  <input
                    type="text"
                    name="homeAddress"
                    required
                    placeholder="Blk 1 Lot 2, Mahogany Street, Green Village, Naic, Cavite"
                    value={formData.homeAddress}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: Block and Lot, Street, Village/Subdivision, Municipality, Province</p>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="example@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.email ? 'border-red-500' : ''}`}
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
                    name="program"
                    required
                    value={formData.program}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
                  <select
                    name="section"
                    required
                    value={formData.section}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select Section</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year Level *</label>
                  <select
                    name="yearLevel"
                    required
                    value={formData.yearLevel}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select Year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NSTP Component *</label>
                  <select
                    name="nstpComponent"
                    required
                    value={formData.nstpComponent}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    type="text"
                    name="birthMonth"
                    required
                    placeholder="MM"
                    value={formData.birthMonth}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Birth Day (1-31) *</label>
                  <input
                    type="text"
                    name="birthDay"
                    required
                    placeholder="DD"
                    value={formData.birthDay}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Birth Year (4 digits) *</label>
                  <input
                    type="text"
                    name="birthYear"
                    required
                    placeholder="YYYY"
                    value={formData.birthYear}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
                  <input
                    type="text"
                    name="age"
                    required
                    value={formData.age}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Civil Status *</label>
                  <select
                    name="civilStatus"
                    required
                    value={formData.civilStatus}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sex *</label>
                  <select
                    name="sex"
                    required
                    value={formData.sex}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    name="height"
                    placeholder="cm"
                    value={formData.height}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type</label>
                  <select
                    name="bloodType"
                    value={formData.bloodType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    type="text"
                    name="contactNumber"
                    required
                    placeholder="09123456789"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
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
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    type="text"
                    name="emergencyContact"
                    required
                    value={formData.emergencyContact}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
                  <input
                    type="tel"
                    name="emergencyNumber"
                    required
                    placeholder="11 digits (e.g., 09123456789)"
                    value={formData.emergencyNumber}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.emergencyNumber ? 'border-red-500' : ''}`}
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
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
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
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-gray-500">
                Please review your information before submitting.
              </p>
              <button
                type="submit"
                className="bg-green-700 hover:bg-green-800 text-white font-bold px-8 py-3 rounded-lg transition-colors"
              >
                Submit Enrollment
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
