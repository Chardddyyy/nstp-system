import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/layout/Sidebar';
import { FileCheck, Plus, FileText, Download, Trash2, Edit3, CheckCircle, AlertCircle, X, Search, Menu, Paperclip, Eye, File, History, Archive, Sparkles, Shuffle } from 'lucide-react';
import { downloadOfficialLetter, generateOfficialLetterHTML } from '../utils/letterDocumentGenerator';
import xss from 'xss';

const DEFAULT_TEMPLATES = [
  {
    id: 'tpl-1',
    title: 'Student Absence Excuse Letter & Medical Certificate Submission',
    department: 'All',
    description: 'Official student absence justification and health excuse letter endorsing submitted medical certificates for make-up clearance.',
    file: { name: 'CvSU_NSTP_Student_Medical_Excuse_Letter.doc', size: '124.5 KB', type: 'application/msword' },
    createdBy: 'NSTP Office',
    createdAt: '2024-09-01T08:00:00Z'
  },
  {
    id: 'tpl-2',
    title: 'Barangay Immersion & Community Service Request Letter',
    department: 'CWTS',
    description: 'Official formal institutional endorsement requesting barangay clearance and partner community facilitation for NSTP-CWTS immersion projects.',
    file: { name: 'CvSU_CWTS_Barangay_Immersion_Request.doc', size: '142.5 KB', type: 'application/msword' },
    createdBy: 'CWTS Department Coordinator',
    createdAt: '2024-09-01T08:00:00Z'
  },
  {
    id: 'tpl-3',
    title: 'Coastal Cleanup & Mangrove Planting Environmental Partnership',
    department: 'CWTS',
    description: 'Formal partnership endorsement to CENRO and Barangay Bucana Malaki for coastal solid waste management and mangrove propagation.',
    file: { name: 'CvSU_CWTS_Coastal_Cleanup_Mangrove_Endorsement.doc', size: '138.2 KB', type: 'application/msword' },
    createdBy: 'CWTS Department Coordinator',
    createdAt: '2024-09-01T08:00:00Z'
  },
  {
    id: 'tpl-4',
    title: 'Barangay Health Center Supplementary Feeding & Hygiene Drive',
    department: 'CWTS',
    description: 'Collaborative endorsement requesting authorization to conduct child nutrition profiling, feeding drive, and handwashing seminars.',
    file: { name: 'CvSU_CWTS_Barangay_Feeding_Health_Drive.doc', size: '131.0 KB', type: 'application/msword' },
    createdBy: 'CWTS Department Coordinator',
    createdAt: '2024-09-01T08:00:00Z'
  },
  {
    id: 'tpl-5',
    title: 'LTS Literacy Outreach & Reading Clinic Permission Endorsement',
    department: 'LTS',
    description: 'Formal request to elementary school principals for student-led reading tutorials and literacy clinic sessions.',
    file: { name: 'CvSU_LTS_School_Outreach_Permission.doc', size: '128.0 KB', type: 'application/msword' },
    createdBy: 'LTS Department Coordinator',
    createdAt: '2024-09-01T08:00:00Z'
  },
  {
    id: 'tpl-6',
    title: 'Public Elementary School Remedial Reading Center Collaboration',
    department: 'LTS',
    description: 'Formal coordination letter requesting classroom space and teacher coordinator assistance for weekend Alagang Basa sessions.',
    file: { name: 'CvSU_LTS_Elementary_Reading_Collaboration.doc', size: '135.4 KB', type: 'application/msword' },
    createdBy: 'LTS Department Coordinator',
    createdAt: '2024-09-01T08:00:00Z'
  },
  {
    id: 'tpl-7',
    title: 'Children Storytelling & Illustrated Book Donation Handover',
    department: 'LTS',
    description: 'Official institutional deed of handover for storybooks, literacy flashcards, and learning materials donated to the partner school reading corner.',
    file: { name: 'CvSU_LTS_Book_Donation_Handover.doc', size: '119.8 KB', type: 'application/msword' },
    createdBy: 'LTS Department Coordinator',
    createdAt: '2024-09-01T08:00:00Z'
  },
  {
    id: 'tpl-8',
    title: 'ROTC Field Training Exercise & Range Facility Request',
    department: 'ROTC',
    description: 'Endorsement to Armed Forces / Naval training Command for weekend field tactics, land navigation, and range handling exercises.',
    file: { name: 'CvSU_ROTC_Tactical_Training_Endorsement.doc', size: '165.2 KB', type: 'application/msword' },
    createdBy: 'ROTC Commandant',
    createdAt: '2024-09-01T08:00:00Z'
  },
  {
    id: 'tpl-9',
    title: 'ROTC Annual Tactical Inspection (ATI) & Pass-in-Review Invitation',
    department: 'ROTC',
    description: 'Official formal invitation addressed to Philippine Navy & DMST Inspection Board for the annual cadet battalion inspection and parade.',
    file: { name: 'CvSU_ROTC_Annual_Tactical_Inspection_Invitation.doc', size: '152.0 KB', type: 'application/msword' },
    createdBy: 'ROTC Commandant',
    createdAt: '2024-09-01T08:00:00Z'
  },
  {
    id: 'tpl-10',
    title: 'Parent/Guardian NSTP Activity Consent & Medical Waiver Form',
    department: 'All',
    description: 'Standard institutional waiver and health declaration required for all off-campus community and training engagements.',
    file: { name: 'CvSU_NSTP_Parent_Consent_Waiver.doc', size: '98.4 KB', type: 'application/msword' },
    createdBy: 'NSTP Office',
    createdAt: '2024-09-01T08:00:00Z'
  },
  {
    id: 'tpl-11',
    title: 'Notice of Incomplete Attendance & Special Make-Up Service Agreement',
    department: 'All',
    description: 'Official student covenant and faculty agreement designating compensatory community hours to convert an Incomplete (INC) status.',
    file: { name: 'CvSU_NSTP_INC_Makeup_Service_Agreement.doc', size: '127.3 KB', type: 'application/msword' },
    createdBy: 'NSTP Office',
    createdAt: '2024-09-01T08:00:00Z'
  },
  {
    id: 'tpl-12',
    title: 'Certificate of Good Moral Character & Satisfactory NSTP Service Clearance',
    department: 'All',
    description: 'Official university clearance certifying commendable civic demeanor, community service hours completion, and liability clearance.',
    file: { name: 'CvSU_NSTP_Good_Moral_Service_Clearance.doc', size: '116.0 KB', type: 'application/msword' },
    createdBy: 'NSTP Office',
    createdAt: '2024-09-01T08:00:00Z'
  },
  {
    id: 'tpl-13',
    title: 'Official HEI NSTP Serial Number & Completion Certificate Endorsement',
    department: 'All',
    description: 'Official CHED submission document certifying graduates and requesting assigned national serial numbers.',
    file: { name: 'CvSU_OSDS_CHED_Serial_Endorsement.doc', size: '184.8 KB', type: 'application/msword' },
    createdBy: 'NSTP Director',
    createdAt: '2024-09-01T08:00:00Z'
  }
];

const RANDOM_LETTER_POOL = [
  {
    title: 'Student Absence Excuse Letter & Medical Certificate Submission',
    department: 'All',
    description: 'Official student absence justification and health excuse letter endorsing submitted medical certificates for make-up clearance.',
    filename: 'CvSU_NSTP_Student_Medical_Excuse_Letter.doc'
  },
  {
    title: 'Notice of Incomplete Attendance & Special Make-Up Service Agreement',
    department: 'All',
    description: 'Official student covenant and faculty agreement designating compensatory community hours to convert an Incomplete (INC) status.',
    filename: 'CvSU_NSTP_INC_Makeup_Service_Agreement.doc'
  },
  {
    title: 'Parent/Guardian NSTP Activity Consent & Medical Waiver Form',
    department: 'All',
    description: 'Standard institutional waiver, emergency contact profile, and health declaration required for off-campus community immersion.',
    filename: 'CvSU_NSTP_Parent_Consent_Waiver.doc'
  },
  {
    title: 'Certificate of Good Moral Character & Satisfactory NSTP Service Clearance',
    department: 'All',
    description: 'Official university clearance certifying commendable civic demeanor, community service hours completion, and liability clearance.',
    filename: 'CvSU_NSTP_Good_Moral_Service_Clearance.doc'
  },
  {
    title: 'Barangay Immersion & Community Needs Profiling Request',
    department: 'CWTS',
    description: 'Official formal institutional endorsement requesting barangay clearance and facilitation for household health and civic welfare surveys.',
    filename: 'CvSU_CWTS_Barangay_Immersion_Request.doc'
  },
  {
    title: 'Coastal Cleanup & Mangrove Planting Environmental Partnership',
    department: 'CWTS',
    description: 'Formal partnership endorsement to CENRO and Barangay Bucana Malaki for coastal solid waste management and mangrove propagation.',
    filename: 'CvSU_CWTS_Coastal_Cleanup_Mangrove_Endorsement.doc'
  },
  {
    title: 'Barangay Health Center Supplementary Feeding & Hygiene Drive',
    department: 'CWTS',
    description: 'Collaborative endorsement requesting authorization to conduct child nutrition profiling, feeding drive, and handwashing seminars.',
    filename: 'CvSU_CWTS_Barangay_Feeding_Health_Drive.doc'
  },
  {
    title: 'LTS Literacy Outreach & Reading Clinic Permission Endorsement',
    department: 'LTS',
    description: 'Formal request to elementary school principals for student-led remedial reading sessions and diagnostic reading clinics.',
    filename: 'CvSU_LTS_School_Outreach_Permission.doc'
  },
  {
    title: 'Public Elementary School Remedial Reading Center Collaboration',
    department: 'LTS',
    description: 'Formal coordination letter requesting classroom space and teacher coordinator assistance for weekend Alagang Basa sessions.',
    filename: 'CvSU_LTS_Elementary_Reading_Collaboration.doc'
  },
  {
    title: 'Children Storytelling & Illustrated Book Donation Handover',
    department: 'LTS',
    description: 'Official institutional deed of handover for storybooks, literacy flashcards, and learning materials donated to the partner school reading corner.',
    filename: 'CvSU_LTS_Book_Donation_Handover.doc'
  },
  {
    title: 'ROTC Field Training Exercise & Range Facility Request',
    department: 'ROTC',
    description: 'Endorsement to Armed Forces / Naval Training Command for weekend tactical drills, land navigation, and range familiarization.',
    filename: 'CvSU_ROTC_Tactical_Training_Endorsement.doc'
  },
  {
    title: 'ROTC Annual Tactical Inspection (ATI) & Pass-in-Review Invitation',
    department: 'ROTC',
    description: 'Official formal invitation addressed to Philippine Navy & DMST Inspection Board for the annual cadet battalion inspection and parade.',
    filename: 'CvSU_ROTC_Annual_Tactical_Inspection_Invitation.doc'
  },
  {
    title: 'Official HEI NSTP Serial Number & Completion Certificate Endorsement',
    department: 'All',
    description: 'Official CHED submission document certifying graduates and requesting assigned national serial numbers.',
    filename: 'CvSU_OSDS_CHED_Serial_Endorsement.doc'
  }
];

export default function LetterFormats() {
  const { user, logout, viewingArchive, archiveViewData, setViewingArchive, showToast } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Local storage persistence for custom uploaded letter formats
  const [templates, setTemplates] = useState(() => {
    try {
      const saved = localStorage.getItem('nstp_letter_templates');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return DEFAULT_TEMPLATES;
    } catch {
      return DEFAULT_TEMPLATES;
    }
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('All');
  const [description, setDescription] = useState('');
  const [attachedFile, setAttachedFile] = useState(null); // { name, type, size, data }

  const [viewingFile, setViewingFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('File size exceeds 10MB limit.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedFile({
        name: file.name,
        type: file.type,
        size: (file.size / 1024).toFixed(1) + ' KB',
        data: reader.result
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveTemplate = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please enter a template title.', 'warning');
      return;
    }

    const fallbackFilename = `${title.trim().replace(/[^a-zA-Z0-9_-]/g, '_')}_Official_CvSU_Template.doc`;
    const finalFile = attachedFile || (editingTemplate ? editingTemplate.file : null) || {
      name: fallbackFilename,
      size: '135.0 KB',
      type: 'application/msword'
    };

    const targetDept = user?.role === 'instructor' && user?.department
      ? user.department
      : (department || 'All');

    let updated;
    if (editingTemplate) {
      updated = templates.map(t => t.id === editingTemplate.id ? {
        ...t,
        title: title.trim(),
        department: targetDept,
        description: (description || '').trim(),
        file: finalFile,
        updatedAt: new Date().toISOString()
      } : t);
      showToast('Template updated successfully!', 'success');
    } else {
      const newT = {
        id: Date.now().toString(),
        title: title.trim(),
        department: targetDept,
        description: (description || '').trim(),
        file: finalFile,
        createdBy: user?.name || (user?.role === 'instructor' ? `${user.department} Instructor` : 'Admin'),
        createdAt: new Date().toISOString()
      };
      updated = [newT, ...templates];
      showToast('New letter template saved successfully!', 'success');
    }

    setTemplates(updated);
    try { localStorage.setItem('nstp_letter_templates', JSON.stringify(updated)); } catch {}

    setTitle('');
    setDescription('');
    setDepartment('All');
    setAttachedFile(null);
    setEditingTemplate(null);
    setShowAddModal(false);
  };

  const handleDeleteTemplate = (id) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    try { localStorage.setItem('nstp_letter_templates', JSON.stringify(updated)); } catch {}
  };

  const handleGenerateRandomLetter = () => {
    const pool = user?.role === 'instructor' && user?.department
      ? RANDOM_LETTER_POOL.filter(p => p.department === 'All' || p.department === user.department)
      : RANDOM_LETTER_POOL;

    const selected = pool[Math.floor(Math.random() * pool.length)];
    const randomId = 'rnd-' + Date.now();
    const newLetter = {
      id: randomId,
      title: selected.title,
      department: selected.department,
      description: selected.description,
      file: {
        name: selected.filename,
        size: (120 + Math.floor(Math.random() * 65)).toFixed(1) + ' KB',
        type: 'application/msword'
      },
      createdBy: user?.name || (user?.role === 'instructor' ? `${user.department} Instructor` : 'NSTP Office'),
      createdAt: new Date().toISOString()
    };

    const updated = [newLetter, ...templates];
    setTemplates(updated);
    try { localStorage.setItem('nstp_letter_templates', JSON.stringify(updated)); } catch {}
    showToast(`Generated random letter format: "${selected.title}"`, 'success');
  };

  const handleAutoFillRandom = () => {
    const pool = user?.role === 'instructor' && user?.department
      ? RANDOM_LETTER_POOL.filter(p => p.department === 'All' || p.department === user.department)
      : RANDOM_LETTER_POOL;

    const selected = pool[Math.floor(Math.random() * pool.length)];
    setTitle(selected.title);
    setDepartment(selected.department);
    setDescription(selected.description);
    setAttachedFile({
      name: selected.filename,
      size: (120 + Math.floor(Math.random() * 65)).toFixed(1) + ' KB',
      type: 'application/msword',
      data: null
    });
    showToast(`Template fields populated with "${selected.title}"`, 'info');
  };

  const handleDownloadAttachment = (t) => {
    if (t.file?.data && t.file.data.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = t.file.data;
      a.download = t.file.name || `${t.title.replace(/\s+/g, '_')}_Attachment`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const batchYear = viewingArchive && archiveViewData?.year ? archiveViewData.year : '2024-2025';
      downloadOfficialLetter(t, batchYear);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const availableTabs = useMemo(() => {
    if (user?.role === 'instructor' && user?.department) {
      return ['All', user.department];
    }
    return ['All', 'ROTC', 'CWTS', 'LTS'];
  }, [user]);

  const sourceTemplates = viewingArchive && archiveViewData?.letterData && archiveViewData.letterData.length > 0
    ? archiveViewData.letterData
    : templates;

  const filteredTemplates = sourceTemplates.filter(t => {
    if (user?.role === 'instructor' && user?.department) {
      const isAllowed = t.department === 'All' || t.department === user.department;
      if (!isAllowed) return false;
    }
    // Strict tab filtering:
    // When 'All' is selected -> only templates with department === 'All'
    // When a specific department (e.g. 'CWTS') is selected -> only templates with that department
    const deptMatch = activeTab === 'All' ? t.department === 'All' : t.department === activeTab;
    const searchMatch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (t.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    return deptMatch && searchMatch;
  });

  return (
    <div className="min-h-screen bg-gray-50/50 text-gray-900 font-sans max-w-full overflow-x-hidden">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        user={user}
      />

      <main className={`transition-all duration-300 p-3 sm:p-6 lg:p-8 ${sidebarOpen ? 'lg:ml-64' : ''}`}>
        {/* Hero Banner - Unified CvSU Naic Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-xl border border-emerald-800/40 relative mb-3 sm:mb-6 w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 sm:gap-3 relative z-10 w-full">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 sm:p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center bg-emerald-800/80 hover:bg-emerald-700 text-emerald-200 hover:text-white rounded-xl shrink-0 transition-colors cursor-pointer active:scale-95 shadow-xs"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="w-9 h-9 sm:w-11 sm:h-11 bg-white rounded-xl sm:rounded-2xl p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-md border border-emerald-700">
                <img src={`${import.meta.env.BASE_URL}cvsu.png`} alt="CvSU Logo" className="w-full h-full object-contain filter drop-shadow-xs scale-105" />
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="text-xs sm:text-lg lg:text-xl font-black tracking-tight text-white truncate leading-tight">
                  {viewingArchive ? `Archived Letter Formats - Batch ${archiveViewData?.year}` : 'Letter Formats & Attachments'}
                </h1>
              </div>
            </div>

            {(user?.role === 'admin' || user?.role === 'instructor') && !viewingArchive && (
              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                <button
                  type="button"
                  onClick={handleGenerateRandomLetter}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 bg-emerald-850 hover:bg-emerald-800 text-amber-300 hover:text-amber-200 border border-emerald-600/60 font-black px-3.5 py-2.5 rounded-xl sm:rounded-2xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 w-full sm:w-auto cursor-pointer text-xs sm:text-sm shrink-0"
                  title="Generate a random official CvSU Naic letter format"
                >
                  <Shuffle className="w-4 h-4 text-amber-400 stroke-[2.5]" />
                  <span className="whitespace-nowrap">Random Format Letter</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTitle('');
                    setDescription('');
                    setDepartment(user?.role === 'instructor' && user?.department ? user.department : 'All');
                    setAttachedFile(null);
                    setEditingTemplate(null);
                    setShowAddModal(true);
                  }}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-emerald-950 font-black px-4 py-2.5 rounded-xl sm:rounded-2xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 w-full sm:w-auto cursor-pointer text-xs sm:text-sm shrink-0"
                >
                  <Plus className="w-4 h-4 text-emerald-950 stroke-[2.5]" />
                  <span className="whitespace-nowrap">Create Letter Format</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Viewing Archive Banner */}
        {viewingArchive && archiveViewData && (
          <div className="flex-shrink-0 bg-amber-500 text-emerald-950 px-4 py-2.5 rounded-2xl flex items-center justify-between shadow-md mb-6 font-bold text-xs sm:text-sm">
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5 text-emerald-950 shrink-0" />
              <span>Viewing Archived Batch Letter Formats: <strong>Batch {archiveViewData.year}</strong></span>
            </div>
            <button
              type="button"
              onClick={() => setViewingArchive(false)}
              className="bg-emerald-950 text-amber-300 hover:bg-emerald-900 px-3 py-1 rounded-xl text-xs font-black transition-colors cursor-pointer shrink-0"
            >
              Exit Archive
            </button>
          </div>
        )}

        {/* Filter Tabs & Search Bar — Perfectly Aligned */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 mb-6 w-full">
          {/* Search Box */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-emerald-700/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="letter-format-search"
              name="letterSearch"
              placeholder={user?.role === 'instructor' && user?.department ? `Search ${user.department} & general letter formats...` : "Search letter formats by title or description..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 h-11 sm:h-12 bg-white border border-gray-200/90 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 shadow-2xs transition-all"
            />
          </div>

          {/* Department Filter Tabs — Same Height as Search Box */}
          <div className="flex items-center gap-1 p-1 bg-white border border-gray-200/90 rounded-xl sm:rounded-2xl shadow-2xs shrink-0 h-11 sm:h-12 overflow-x-auto">
            {availableTabs.map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 sm:px-5 h-full flex items-center justify-center rounded-lg sm:rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                  activeTab === tab
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Empty State vs Card Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-gray-200/80 shadow-sm max-w-xl mx-auto my-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-inner">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-emerald-950">No Letter Formats Found</h3>
            <p className="text-gray-500 text-xs sm:text-sm mt-1 mb-6 leading-relaxed">
              {searchTerm || activeTab !== 'All'
                ? `No letter formats match your filter "${activeTab}" or search query.`
                : 'The letter format list is empty. Click the button below to upload or create a letter format.'}
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleGenerateRandomLetter}
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-black px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Shuffle className="w-4 h-4 text-emerald-950 stroke-[2.5]" />
                <span>Generate Random Letter</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTitle('');
                  setDescription('');
                  setDepartment('All');
                  setAttachedFile(null);
                  setEditingTemplate(null);
                  setShowAddModal(true);
                }}
                className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Add Letter Format</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-5 border border-gray-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
                      item.department === 'ROTC' ? 'bg-red-50 text-red-700 border-red-200' :
                      item.department === 'CWTS' ? 'bg-green-50 text-green-700 border-green-200' :
                      item.department === 'LTS' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                      {item.department === 'All' ? 'All Departments' : item.department}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-emerald-950 mb-2 leading-tight">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-700 font-medium bg-gray-50/90 p-3.5 rounded-xl border border-gray-100 whitespace-pre-wrap leading-relaxed mb-3">
                    {item.description}
                  </p>

                  {/* Attachment Box */}
                  {item.file && (
                    <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <File className="w-5 h-5 text-emerald-700 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-emerald-950 truncate">{item.file.name}</p>
                          <p className="text-xs text-emerald-700 font-medium">{item.file.size}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 mt-2 sm:mt-0">
                        <button
                          type="button"
                          onClick={() => handleDownloadAttachment(item)}
                          className="px-3.5 py-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
                          title="Download File"
                        >
                          <Download className="w-3.5 h-3.5 text-amber-300" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-gray-100">
                  <span className="text-[11px] text-gray-400 font-medium">
                    By {item.createdBy}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTemplate(item);
                        setTitle(item.title);
                        setDepartment(item.department);
                        setDescription(item.description);
                        setAttachedFile(item.file || null);
                        setShowAddModal(true);
                      }}
                      className="p-2 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteTemplate(item.id)}
                      className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add / Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-emerald-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setShowAddModal(false)}>
            <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-emerald-100" onClick={e => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-5 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2.5">
                  <FileCheck className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-black tracking-tight">
                    {editingTemplate ? 'Edit Letter Format' : 'Create Letter Format'}
                  </h3>
                </div>
                <button type="button" onClick={() => setShowAddModal(false)} className="text-emerald-200 hover:text-white p-1 rounded-lg transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveTemplate} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label htmlFor="letter-format-title" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700">Letter Title *</label>
                    <button
                      type="button"
                      onClick={handleAutoFillRandom}
                      className="flex items-center gap-1 text-[11px] font-extrabold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                      title="Quickly fill in random sample details"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Auto-Fill Random Template</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    id="letter-format-title"
                    name="letterTitle"
                    required
                    placeholder="e.g. ROTC Absence & Medical Clearance Form"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
                  />
                </div>

                {/* Only Admin sees the Category selector; for Instructors it's automatically their department */}
                {user?.role === 'admin' && (
                  <div>
                    <label htmlFor="letter-format-department" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Department Category *</label>
                    <select
                      id="letter-format-department"
                      name="letterDepartment"
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
                    >
                      <option value="All">All Departments</option>
                      <option value="ROTC">ROTC</option>
                      <option value="CWTS">CWTS</option>
                      <option value="LTS">LTS</option>
                    </select>
                  </div>
                )}

                <div>
                  <label htmlFor="letter-format-description" className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Description &amp; Guidelines (Optional)</label>
                  <textarea
                    rows={3}
                    id="letter-format-description"
                    name="letterDescription"
                    placeholder="Enter optional description, instructions, or template body guidelines..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 leading-relaxed font-medium"
                  />
                </div>

                {/* File Attachment Upload — Mandatory */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">
                    Attach Official Document / Form <span className="text-rose-600">* (Required)</span>
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="letter-format-file-input"
                    name="letterFileInput"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
                    className="hidden"
                  />
                  
                  {attachedFile ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <Paperclip className="w-4 h-4 text-emerald-700 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-emerald-950 truncate">{attachedFile.name}</p>
                          <p className="text-[10px] text-emerald-700 font-medium">{attachedFile.size}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachedFile(null)}
                        className="text-rose-600 hover:text-rose-800 text-xs font-bold p-1 hover:bg-rose-50 rounded-lg"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-3 px-4 border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-xl bg-emerald-50/40 hover:bg-emerald-50 text-emerald-900 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                    >
                      <Paperclip className="w-4 h-4 text-emerald-700" />
                      <span>Click to Select Document (PDF, Word, or Image) *</span>
                    </button>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    {editingTemplate ? 'Save Changes' : 'Save Letter Format'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Attachment Preview Modal */}
        {viewingFile && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setViewingFile(null)}>
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="bg-emerald-900 text-white p-4 flex items-center justify-between shrink-0">
                <p className="text-xs font-bold truncate">{viewingFile.name}</p>
                <button type="button" onClick={() => setViewingFile(null)} className="text-white/80 hover:text-white p-1 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 sm:p-6 flex-1 overflow-auto flex flex-col items-center justify-center bg-gray-100">
                {viewingFile.type?.startsWith('image/') && viewingFile.data ? (
                  <img src={viewingFile.data} alt={viewingFile.name} className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-md" />
                ) : viewingFile.rawTemplate ? (
                  <div className="w-full max-w-2xl bg-white rounded-2xl p-6 shadow-md border border-gray-200 text-left overflow-y-auto max-h-[60vh]">
                    <div dangerouslySetInnerHTML={{ __html: xss(generateOfficialLetterHTML(viewingFile.rawTemplate, viewingFile.batchYear || '2024-2025')) }} />
                    <div className="mt-6 pt-4 border-t flex justify-end">
                      <button
                        type="button"
                        onClick={() => downloadOfficialLetter(viewingFile.rawTemplate, viewingFile.batchYear || '2024-2025')}
                        className="inline-flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer"
                      >
                        <Download className="w-4 h-4" /> Download Official Document (.doc)
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 bg-white rounded-2xl border border-gray-200 max-w-md w-full shadow-md">
                    <File className="w-16 h-16 text-emerald-700 mx-auto mb-3" />
                    <p className="font-bold text-sm text-gray-900 mb-1">{viewingFile.name}</p>
                    <p className="text-xs text-gray-500 mb-4">{viewingFile.size}</p>
                    <button
                      type="button"
                      onClick={() => {
                        if (viewingFile.data && viewingFile.data.startsWith('data:')) {
                          const a = document.createElement('a');
                          a.href = viewingFile.data;
                          a.download = viewingFile.name;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        } else if (viewingFile.rawTemplate) {
                          downloadOfficialLetter(viewingFile.rawTemplate, viewingFile.batchYear || '2024-2025');
                        }
                      }}
                      className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" /> Download File
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
