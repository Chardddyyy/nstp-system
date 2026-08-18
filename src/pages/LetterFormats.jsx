import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/layout/Sidebar';
import { FileCheck, Plus, FileText, Download, Trash2, Edit3, CheckCircle, AlertCircle, X, Search, Menu, Paperclip, Eye, File } from 'lucide-react';

export default function LetterFormats() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Local storage persistence for custom uploaded letter formats
  const [templates, setTemplates] = useState(() => {
    try {
      const saved = localStorage.getItem('nstp_letter_templates');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
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
      alert('File size exceeds 10MB limit');
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
      return;
    }

    const finalFile = attachedFile || (editingTemplate ? editingTemplate.file : null);
    if (!finalFile) {
      alert('Please attach an official document / file (PDF, Word, Image)');
      return;
    }

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

  const handleDownloadAttachment = (t) => {
    if (!t.file?.data) {
      return;
    }
    const a = document.createElement('a');
    a.href = t.file.data;
    a.download = t.file.name || `${t.title.replace(/\s+/g, '_')}_Attachment`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const availableTabs = useMemo(() => {
    if (user?.role === 'instructor' && user?.department) {
      return ['All', user.department];
    }
    return ['All', 'ROTC', 'CWTS', 'LTS'];
  }, [user]);

  const filteredTemplates = templates.filter(t => {
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
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-2xl sm:rounded-3xl p-2.5 sm:p-5 shadow-xl border border-emerald-800/40 relative mb-3 sm:mb-6 w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 sm:gap-3 relative z-10 w-full">
            <div className="flex items-center space-x-1.5 sm:space-x-3 min-w-0 flex-1 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 sm:p-2 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-200 hover:text-white rounded-xl shrink-0 transition-colors cursor-pointer"
                aria-label="Open menu"
              >
                <Menu className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </button>

              <div className="w-6 h-6 sm:w-9 sm:h-9 bg-white rounded-lg sm:rounded-2xl p-0.5 sm:p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-md border border-emerald-700">
                <img src={`${import.meta.env.BASE_URL}cvsu.png`} alt="CvSU Logo" className="w-full h-full object-contain" />
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="text-xs sm:text-lg lg:text-xl font-black tracking-tight text-white truncate leading-tight">Letter Formats &amp; Attachments</h1>
                <p className="text-emerald-200 text-[10px] sm:text-xs lg:text-sm font-medium truncate mt-0.5">
                  {user?.role === 'instructor' && user?.department ? `Official forms for All & ${user.department}` : 'Download or upload official forms'}
                </p>
              </div>
            </div>

            {(user?.role === 'admin' || user?.role === 'instructor') && (
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
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-emerald-950 font-black px-4 py-2.5 rounded-xl sm:rounded-2xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 w-full sm:w-auto cursor-pointer text-xs sm:text-sm shrink-0"
              >
                <Plus className="w-4 h-4 text-emerald-950 stroke-[2.5]" />
                <span className="whitespace-nowrap">Create Letter Format</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs & Search Bar — Perfectly Aligned */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 mb-6 w-full">
          {/* Search Box */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-emerald-700/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
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
                          onClick={() => setViewingFile(item.file)}
                          className="px-3 py-1.5 text-xs font-bold bg-white hover:bg-emerald-100 text-emerald-950 border border-emerald-300 rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 active:scale-95"
                          title="View File"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-700" />
                          <span>View</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadAttachment(item)}
                          className="px-3 py-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
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
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Letter Title *</label>
                  <input
                    type="text"
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
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Department Category *</label>
                    <select
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
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Description &amp; Guidelines (Optional)</label>
                  <textarea
                    rows={3}
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
              <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-gray-100">
                {viewingFile.type?.startsWith('image/') ? (
                  <img src={viewingFile.data} alt={viewingFile.name} className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-md" />
                ) : (
                  <div className="text-center p-8 bg-white rounded-2xl border border-gray-200 max-w-md">
                    <File className="w-16 h-16 text-emerald-700 mx-auto mb-3" />
                    <p className="font-bold text-sm text-gray-900 mb-1">{viewingFile.name}</p>
                    <p className="text-xs text-gray-500 mb-4">{viewingFile.size}</p>
                    <a
                      href={viewingFile.data}
                      download={viewingFile.name}
                      className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all"
                    >
                      <Download className="w-4 h-4" /> Download File
                    </a>
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
