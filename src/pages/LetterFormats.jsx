import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/layout/Sidebar';
import ScrollToTopButton from '../components/ScrollToTopButton';
import {
  FileText, Plus, Search, Download, Copy, Check, Edit, Trash2, X,
  FileCheck, Menu, Sparkles, AlertCircle, Paperclip, Upload, File
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DEFAULT_TEMPLATES = [
  {
    id: 'tmpl-1',
    title: 'Community Service Permission Request Letter (CWTS/LTS)',
    category: 'CWTS',
    description: 'Official request letter to Barangay Officials / Community Leaders for student community service activities.',
    fileName: 'Community_Service_Permission_Request.docx',
    fileSize: '48 KB',
    content: `CAVITE STATE UNIVERSITY NAIC
Naic, Cavite, Philippines
NATIONAL SERVICE TRAINING PROGRAM (NSTP)
CIVIC WELFARE TRAINING SERVICE (CWTS)

[Date]

HON. [BARANGAY CAPTAIN NAME]
Barangay Captain
Barangay [Barangay Name], Naic, Cavite

Dear Hon. [Barangay Captain Name],

Warm greetings from Cavite State University Naic!

The National Service Training Program - Civic Welfare Training Service (NSTP-CWTS) of Cavite State University Naic is committed to developing civic consciousness, leadership, and community service among our tertiary students.

In line with this commitment, our CWTS students under the supervision of Instructor [Instructor Name] would like to request permission to conduct a community service activity in your barangay on [Activity Date] from [Start Time] to [End Time].

The proposed activity includes:
1. Community Clean-Up & Tree Planting Drive
2. Health & Sanitation Awareness Session for Residents

We assure your office that our students will strictly follow safety protocols and coordinate closely with barangay officials.

Thank you very much for your continuous support to Cavite State University Naic.

Respectfully yours,

_____________________________
[INSTRUCTOR NAME]
CWTS Instructor, CvSU Naic`
  },
  {
    id: 'tmpl-2',
    title: 'ROTC Official Training Absence & Excuse Letter',
    category: 'ROTC',
    description: 'Official excuse letter for ROTC Cadets missing Sunday training due to valid medical or academic reasons.',
    fileName: 'ROTC_Absence_Excuse_Form.docx',
    fileSize: '35 KB',
    content: `CAVITE STATE UNIVERSITY NAIC
Naic, Cavite, Philippines
RESERVE OFFICERS TRAINING CORPS (ROTC) UNIT

[Date]

THE COMMANDING OFFICER
CvSU Naic ROTC Unit
Cavite State University Naic

Sir/Ma'am:

I am writing to respectfully request permission to be excused from attending the ROTC Sunday Training Scheduled on [Training Date].

Reason for Absence:
[State specific reason here: Medical Condition / University Academic Examination / Official University Competition]

Attached herewith are the supporting documents for your verification:
[ ] Medical Certificate / Doctor's Prescription
[ ] Official Exam Permit / Excuse Form signed by College Dean

I promise to render make-up training hours and submit all required lecture outputs to make up for my absence.

Respectfully yours,

_____________________________
[CADET FULL NAME]
Cadet Rank / Serial No.: [Cadet Serial Number]
Component: ROTC - CvSU Naic`
  },
  {
    id: 'tmpl-3',
    title: 'LTS Literacy Outreach & Tutoring Endorsement Letter',
    category: 'LTS',
    description: 'Request & endorsement letter for Literacy Training Service (LTS) student tutors conducting reading sessions.',
    fileName: 'LTS_Literacy_Outreach_Endorsement.docx',
    fileSize: '42 KB',
    content: `CAVITE STATE UNIVERSITY NAIC
Naic, Cavite, Philippines
LITERACY TRAINING SERVICE (LTS)

[Date]

[PRINCIPAL / SCHOOL HEAD NAME]
Principal / Head Teacher
[Elementary School / Daycare Name]
Naic, Cavite

Dear [Principal / School Head Name]:

Greetings of Peace and Quality Education!

The Literacy Training Service (LTS) component of the Cavite State University Naic NSTP Program aims to train tertiary students to become effective literacy tutors for young learners and out-of-school youth in our community.

We respectfully request your endorsement to allow our LTS student tutors to conduct weekly reading and numeracy tutoring sessions for selected pupils at [School Name] starting [Start Date] to [End Date].

Our student tutors have prepared structured learning modules under the guidance of our LTS Faculty Instructor [Instructor Name].

Thank you for partnering with Cavite State University Naic in empowering young minds.

Very truly yours,

_____________________________
[INSTRUCTOR NAME]
LTS Instructor, CvSU Naic`
  },
  {
    id: 'tmpl-4',
    title: 'CWTS Student Community Project Proposal Template',
    category: 'CWTS',
    description: 'Standard project proposal format for CWTS student groups initiating community impact projects.',
    fileName: 'CWTS_Project_Proposal_Format.docx',
    fileSize: '52 KB',
    content: `CAVITE STATE UNIVERSITY NAIC
NATIONAL SERVICE TRAINING PROGRAM (NSTP)
COMMUNITY PROJECT PROPOSAL FORMAT

I. PROJECT TITLE: [Insert Project Name]
II. LOCATION: Barangay [Barangay Name], Naic, Cavite
III. TARGET BENEFICIARIES: [e.g. 50 Daycare Children / Senior Citizens / Youth]
IV. IMPLEMENTING GROUP: CWTS Section [Section Name] - Group [Group No.]

V. RATIONALE & OBJECTIVES:
   1. To address [specific community concern].
   2. To promote civic awareness and active volunteerism.

Submitted by:
_____________________________
[GROUP LEADER NAME]
CWTS Student Leader`
  },
  {
    id: 'tmpl-5',
    title: 'Official Student Request for NSTP Serial Number Certificate',
    category: 'ALL',
    description: 'Universal student request template for issuance of official NSTP Serial Number Certificate for graduation or employment.',
    fileName: 'NSTP_Serial_Number_Request_Form.pdf',
    fileSize: '65 KB',
    content: `CAVITE STATE UNIVERSITY NAIC
Naic, Cavite, Philippines
NATIONAL SERVICE TRAINING PROGRAM OFFICE

[Date]

DR. [NSTP DIRECTOR / DIRECTOR NAME]
Director, NSTP Office
Cavite State University Naic

Subject: REQUEST FOR OFFICIAL NSTP SERIAL NUMBER CERTIFICATE

Dear Sir/Ma'am:

I would like to formally request the issuance of my Official NSTP Serial Number Certificate for [CWTS / LTS / ROTC] completed during Academic Year [Academic Year Completed].

Respectfully yours,

_____________________________
[STUDENT SIGNATURE & NAME]`
  },
  {
    id: 'tmpl-6',
    title: 'Universal NSTP Student Medical & Fieldwork Clearance Form',
    category: 'ALL',
    description: 'Universal clearance request form applicable for all NSTP components (CWTS, LTS, & ROTC) before participating in outdoor activities.',
    fileName: 'NSTP_Universal_Medical_Clearance.pdf',
    fileSize: '58 KB',
    content: `CAVITE STATE UNIVERSITY NAIC
Naic, Cavite, Philippines
NATIONAL SERVICE TRAINING PROGRAM OFFICE

TO WHOM IT MAY CONCERN:

This is to certify that [Student Name], Student ID No. [Student ID], currently enrolled in NSTP Component [CWTS / LTS / ROTC] under Instructor [Instructor Name], has submitted the required Medical & Physical Health Clearance.

Certified Correct:

_____________________________
[UNIVERSITY CLINIC PHYSICIAN / NURSE]`
  }
];

export default function LetterFormats() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Load letter templates from localStorage or fallback
  const [templates, setTemplates] = useState(() => {
    try {
      const saved = localStorage.getItem('nstp_letter_templates');
      return saved ? JSON.parse(saved) : DEFAULT_TEMPLATES;
    } catch (_e) {
      return DEFAULT_TEMPLATES;
    }
  });

  // Active view & delete confirmation modals
  const [viewModalTemplate, setViewModalTemplate] = useState(null);
  const [deleteConfirmTemplate, setDeleteConfirmTemplate] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Admin Add / Edit Modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [formState, setFormState] = useState({
    title: '',
    category: 'CWTS',
    description: '',
    fileName: '',
    fileDataUrl: '',
    fileSize: '',
    fileType: ''
  });

  // Notification Toast
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Save templates to localStorage
  const persistTemplates = (newList) => {
    setTemplates(newList);
    localStorage.setItem('nstp_letter_templates', JSON.stringify(newList));
  };

  // Filter templates based on user role and category selection
  const filteredTemplates = useMemo(() => {
    return templates.filter(tmpl => {
      const tmplCat = (tmpl.category || 'ALL').toUpperCase();

      // Instructor Visibility Rule: Instructors only see formats for their component (CWTS/LTS/ROTC) + 'ALL'
      if (!isAdmin && user?.department) {
        const userDept = user.department.toUpperCase();
        const isAllowedForInstructor = tmplCat === userDept || tmplCat === 'ALL' || tmplCat === 'GENERAL';
        if (!isAllowedForInstructor) return false;
      }

      // Filter Pill Behavior:
      // - If 'ALL' filter is selected: Show only universal templates categorized as 'ALL' or 'GENERAL'
      // - If 'CWTS' filter is selected: Show templates categorized strictly as 'CWTS'
      // - If 'LTS' filter is selected: Show templates categorized strictly as 'LTS'
      // - If 'ROTC' filter is selected: Show templates categorized strictly as 'ROTC'
      let matchesCategory = false;
      if (selectedCategory === 'ALL') {
        matchesCategory = tmplCat === 'ALL' || tmplCat === 'GENERAL';
      } else {
        matchesCategory = tmplCat === selectedCategory.toUpperCase();
      }

      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q || tmpl.title.toLowerCase().includes(q) || (tmpl.description && tmpl.description.toLowerCase().includes(q)) || (tmpl.fileName && tmpl.fileName.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [templates, selectedCategory, searchTerm, isAdmin, user]);

  // Handle Attached File Selection (Supports any file type and any file size)
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeFormatted = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${Math.round(file.size / 1024)} KB`;

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormState(prev => ({
        ...prev,
        fileName: file.name,
        fileDataUrl: event.target.result,
        fileSize: sizeFormatted,
        fileType: file.type || file.name.split('.').pop()
      }));
      showToast(`Attached file "${file.name}"!`, 'success');
    };
    reader.readAsDataURL(file);
  };

  // Copy Template Text / Title
  const handleCopyText = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Document text copied to clipboard!', 'success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Download Attached File Document
  const handleDownloadFile = (tmpl) => {
    if (tmpl.fileDataUrl) {
      const element = document.createElement('a');
      element.href = tmpl.fileDataUrl;
      element.download = tmpl.fileName || `${tmpl.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      showToast(`Downloaded "${tmpl.fileName || tmpl.title}"!`, 'success');
    } else {
      // Fallback generator for default templates
      const ext = tmpl.fileName ? tmpl.fileName.split('.').pop() : 'txt';
      const filename = tmpl.fileName || `${tmpl.title.replace(/[^a-zA-Z0-9]/g, '_')}.${ext}`;
      const element = document.createElement('a');
      const file = new Blob([tmpl.content || tmpl.description], { type: 'text/plain;charset=utf-8' });
      element.href = URL.createObjectURL(file);
      element.download = filename;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      showToast(`Downloaded "${filename}"!`, 'success');
    }
  };

  // Open Form Modal for Create
  const handleOpenAdd = () => {
    setEditingTemplateId(null);
    setFormState({
      title: '',
      category: 'CWTS',
      description: '',
      fileName: '',
      fileDataUrl: '',
      fileSize: '',
      fileType: ''
    });
    setShowFormModal(true);
  };

  // Open Form Modal for Edit (Admin Only)
  const handleOpenEdit = (tmpl, e) => {
    e.stopPropagation();
    setEditingTemplateId(tmpl.id);
    setFormState({
      title: tmpl.title,
      category: tmpl.category || 'CWTS',
      description: tmpl.description || '',
      fileName: tmpl.fileName || '',
      fileDataUrl: tmpl.fileDataUrl || '',
      fileSize: tmpl.fileSize || '',
      fileType: tmpl.fileType || ''
    });
    setShowFormModal(true);
  };

  // Trigger Center Screen Delete Confirmation Modal (Admin Only)
  const handleOpenDelete = (tmpl, e) => {
    if (e) e.stopPropagation();
    setDeleteConfirmTemplate(tmpl);
  };

  // Execute Template Deletion
  const handleConfirmDelete = () => {
    if (!deleteConfirmTemplate) return;
    const id = deleteConfirmTemplate.id;
    const updated = templates.filter(t => t.id !== id);
    persistTemplates(updated);
    if (viewModalTemplate?.id === id) setViewModalTemplate(null);
    setDeleteConfirmTemplate(null);
    showToast('Letter format deleted successfully.', 'success');
  };

  // Save Form Submit (Admin Only)
  const handleSaveForm = (e) => {
    e.preventDefault();
    if (!formState.title.trim()) {
      showToast('Please enter a Letter Format Title.', 'error');
      return;
    }

    if (!formState.fileName && !formState.fileDataUrl) {
      showToast('Please attach a document file.', 'error');
      return;
    }

    if (editingTemplateId) {
      // Edit existing
      const updated = templates.map(t => t.id === editingTemplateId ? { ...t, ...formState } : t);
      persistTemplates(updated);
      showToast('Letter format updated successfully!', 'success');
    } else {
      // Create new
      const newTmpl = {
        id: 'tmpl-' + Date.now(),
        ...formState
      };
      persistTemplates([newTmpl, ...templates]);
      showToast('New letter format added!', 'success');
    }

    setShowFormModal(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getUserAvatar = () => {
    const initials = (user?.name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    return (
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shadow-md border border-emerald-500">
        {initials}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/40 via-emerald-50/20 to-slate-50 page-enter">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        user={user}
      />

      {/* Main Container */}
      <main className={`transition-all duration-300 p-3 sm:p-6 lg:p-8 ${sidebarOpen ? 'lg:ml-64' : ''}`}>
        
        {/* Toast Alert */}
        {toast && (
          <div className="fixed top-5 right-5 z-50 animate-bounce">
            <div className={`px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs sm:text-sm font-black border ${
              toast.type === 'error' 
                ? 'bg-rose-600 text-white border-rose-500' 
                : 'bg-emerald-800 text-white border-emerald-600'
            }`}>
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span>{toast.message}</span>
            </div>
          </div>
        )}

        {/* Hero Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-xl border border-emerald-800/40 relative mb-3 sm:mb-6">
          <div className="flex justify-between items-center gap-2 sm:gap-3 relative z-10">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-200 hover:text-white rounded-xl shrink-0 transition-colors cursor-pointer"
                aria-label="Open menu"
              >
                <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <div className="w-7 h-7 sm:w-10 sm:h-10 bg-white rounded-lg sm:rounded-2xl p-0.5 sm:p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-md border border-emerald-700">
                <img src={`${import.meta.env.BASE_URL}cvsu.png`} alt="CvSU Logo" className="w-full h-full object-contain" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-xs sm:text-2xl font-black tracking-tight text-white truncate">NSTP Letter Formats &amp; Attachments</h1>
                </div>
                <p className="text-emerald-200 text-[9px] sm:text-sm font-medium truncate mt-0.5">
                  {isAdmin ? 'Upload official NSTP letter files & document templates' : 'View & download official attached letter document files'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-emerald-950 font-black px-3 sm:px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Attach Letter Format</span>
                  <span className="sm:hidden">Add</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Controls & Search Bar */}
        <div className="bg-white rounded-2xl shadow-md border border-emerald-100/60 p-3.5 sm:p-5 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search attached files, title, keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-gray-50/80 font-medium"
              />
              {searchTerm && (
                <button type="button" onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Filter Pills - ALL, CWTS, LTS, ROTC */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
              {(isAdmin ? ['ALL', 'CWTS', 'LTS', 'ROTC'] : ['ALL', user?.department || 'CWTS']).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 border ${
                    selectedCategory === cat
                      ? 'bg-emerald-800 text-white border-emerald-800 shadow-md'
                      : 'bg-gray-100/80 text-gray-700 border-gray-200 hover:bg-gray-200/60'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Templates Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {filteredTemplates.length === 0 ? (
            <div className="col-span-full bg-white rounded-3xl p-10 text-center border border-gray-200 shadow-sm space-y-3">
              <FileText className="w-12 h-12 text-gray-300 mx-auto" />
              <h3 className="text-base font-bold text-gray-800">No Letter Formats Found</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">No letter formats match your search criteria. Select another category pill or clear search filters.</p>
            </div>
          ) : (
            filteredTemplates.map((tmpl) => (
              <div
                key={tmpl.id}
                onClick={() => setViewModalTemplate(tmpl)}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl border border-emerald-100/60 hover:border-emerald-300 p-4 transition-all duration-300 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      tmpl.category === 'CWTS' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                      tmpl.category === 'LTS' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                      tmpl.category === 'ROTC' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                      'bg-amber-100 text-amber-900 border border-amber-200'
                    }`}>
                      {tmpl.category || 'ALL'}
                    </span>

                    {isAdmin && (
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={(e) => handleOpenEdit(tmpl, e)}
                          className="p-1 text-gray-400 hover:text-emerald-700 transition-colors"
                          title="Edit Template"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleOpenDelete(tmpl, e)}
                          className="p-1 text-gray-400 hover:text-rose-600 transition-colors"
                          title="Delete Template"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <h3 className="text-sm font-black text-gray-900 group-hover:text-emerald-800 transition-colors line-clamp-2 leading-snug mb-1.5">
                    {tmpl.title}
                  </h3>

                  <p className="text-xs text-gray-500 font-medium line-clamp-2 leading-relaxed mb-3">
                    {tmpl.description}
                  </p>

                  {/* Attached File Pill Badge */}
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center space-x-2 min-w-0">
                      <Paperclip className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="text-xs font-bold text-gray-800 truncate">{tmpl.fileName || `${tmpl.title}.docx`}</span>
                    </div>
                    <span className="text-[10px] font-extrabold text-gray-400 shrink-0">{tmpl.fileSize || 'Doc'}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyText(tmpl.title, tmpl.id);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs transition-all active:scale-95 cursor-pointer"
                  >
                    {copiedId === tmpl.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-gray-600" />
                        <span>Copy Title</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadFile(tmpl);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs transition-all active:scale-95 shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-300" />
                    <span>Download File</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* View Modal: File Information & Download */}
        {viewModalTemplate && (
          <div className="fixed inset-0 bg-emerald-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-fade-in" onClick={() => setViewModalTemplate(null)}>
            <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full flex flex-col overflow-hidden border border-emerald-100" onClick={(e) => e.stopPropagation()}>
              
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-9 h-9 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-black truncate">{viewModalTemplate.title}</h3>
                    <p className="text-emerald-200 text-[10px] sm:text-xs font-medium">Category: {viewModalTemplate.category || 'ALL'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewModalTemplate(null)}
                  className="w-8 h-8 rounded-full bg-emerald-800/80 hover:bg-emerald-700 flex items-center justify-center text-emerald-200 hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body Content */}
              <div className="p-4 sm:p-6 space-y-4">
                {viewModalTemplate.description && (
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl text-emerald-900 text-xs font-medium">
                    <p className="font-bold text-emerald-950 mb-0.5">Description / Usage Note:</p>
                    <p className="text-gray-700">{viewModalTemplate.description}</p>
                  </div>
                )}

                {/* Attached Document Card Box */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between gap-3 shadow-inner">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm shrink-0">
                      <Paperclip className="w-6 h-6 text-emerald-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-xs sm:text-sm text-gray-900 truncate">{viewModalTemplate.fileName || `${viewModalTemplate.title}.docx`}</p>
                      <p className="text-[10px] text-gray-500 font-bold mt-0.5">{viewModalTemplate.fileSize || 'Document File'}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadFile(viewModalTemplate)}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
                  >
                    <Download className="w-4 h-4 text-amber-300" />
                    <span>Download</span>
                  </button>
                </div>

                {viewModalTemplate.content && (
                  <div>
                    <p className="text-xs font-extrabold text-gray-700 mb-1">Document Text Preview:</p>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 font-mono text-xs text-gray-800 max-h-48 overflow-y-auto whitespace-pre-wrap select-all">
                      {viewModalTemplate.content}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewModalTemplate(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-bold transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadFile(viewModalTemplate)}
                  className="px-5 py-2 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-emerald-950 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Attached File</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Center Screen Delete Confirmation Modal */}
        {deleteConfirmTemplate && (
          <div 
            className="fixed inset-0 bg-emerald-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={() => setDeleteConfirmTemplate(null)}
          >
            <div 
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-emerald-100 text-center space-y-4 animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
                <Trash2 className="w-7 h-7" />
              </div>
              
              <div>
                <h3 className="text-base sm:text-lg font-black text-gray-900">Delete Letter Format?</h3>
                <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">
                  Are you sure you want to permanently delete <strong className="text-gray-900">"{deleteConfirmTemplate.title}"</strong>? This action cannot be undone.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmTemplate(null)}
                  className="w-1/2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="w-1/2 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white rounded-xl text-xs font-black shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  Yes, Delete Format
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Admin Add / Edit Form Modal - Attach File Field */}
        {showFormModal && (
          <div className="fixed inset-0 bg-emerald-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-fade-in" onClick={() => setShowFormModal(false)}>
            <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-emerald-100" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black">{editingTemplateId ? 'Edit Letter Format File' : 'Attach New Letter Format'}</h3>
                    <p className="text-emerald-200 text-xs font-medium">Upload document file (PDF, DOCX, etc.) &amp; configure details</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="w-8 h-8 rounded-full bg-emerald-800/80 hover:bg-emerald-700 flex items-center justify-center text-emerald-200 hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveForm} className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                <div>
                  <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                    Letter Format Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.title}
                    onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                    placeholder="e.g. Permission Request Letter for Community Service"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                      Category Department
                    </label>
                    <select
                      value={formState.category}
                      onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50 font-medium"
                    >
                      <option value="CWTS">CWTS</option>
                      <option value="LTS">LTS</option>
                      <option value="ROTC">ROTC</option>
                      <option value="ALL">ALL (General Format)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                      Description / Usage Note
                    </label>
                    <input
                      type="text"
                      value={formState.description}
                      onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                      placeholder="Brief note on when to use this format..."
                      className="w-full px-3.5 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50 font-medium"
                    />
                  </div>
                </div>

                {/* Attach File Section */}
                <div>
                  <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1">
                    Attach Document File <span className="text-rose-500">*</span>
                  </label>
                  
                  {formState.fileName ? (
                    <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                          <Paperclip className="w-5 h-5 text-emerald-700" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-xs text-gray-900 truncate">{formState.fileName}</p>
                          <p className="text-[10px] text-emerald-700 font-bold">{formState.fileSize || 'Attached Document File'}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormState(prev => ({ ...prev, fileName: '', fileDataUrl: '', fileSize: '', fileType: '' }))}
                        className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
                      >
                        Remove File
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-gray-300 hover:border-emerald-500 bg-gray-50/80 hover:bg-emerald-50/30 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all text-center group">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-extrabold text-gray-800">Click to upload or drag &amp; drop document file</p>
                      <p className="text-[10px] text-gray-400 font-medium mt-1">Supports any file type &amp; size (PDF, DOCX, ZIP, MP4, etc.)</p>
                      <input
                        type="file"
                        accept="*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFormModal(false)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-emerald-950 rounded-xl text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    {editingTemplateId ? 'Update Letter Format' : 'Attach Letter Format'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
      <ScrollToTopButton />
    </div>
  );
}
