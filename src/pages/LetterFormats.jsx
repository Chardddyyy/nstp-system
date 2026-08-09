import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/layout/Sidebar';
import { FileCheck, Plus, FileText, Download, Trash2, Edit3, CheckCircle, AlertCircle, X, Search, Menu } from 'lucide-react';

export default function LetterFormats() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Blank state — no pre-filled sample templates
  const [templates, setTemplates] = useState(() => {
    try {
      const saved = localStorage.getItem('nstp_letter_templates');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Official Letter');
  const [content, setContent] = useState('');

  const [notification, setNotification] = useState(null);

  const showNotify = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSaveTemplate = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    let updated;
    if (editingTemplate) {
      updated = templates.map(t => t.id === editingTemplate.id ? { ...t, title, category, content, updatedAt: new Date().toISOString() } : t);
      showNotify('Template updated successfully!');
    } else {
      const newT = {
        id: Date.now().toString(),
        title,
        category,
        content,
        createdBy: user?.name || 'Instructor',
        createdAt: new Date().toISOString()
      };
      updated = [newT, ...templates];
      showNotify('New letter template created!');
    }

    setTemplates(updated);
    try { localStorage.setItem('nstp_letter_templates', JSON.stringify(updated)); } catch {}

    setTitle('');
    setContent('');
    setCategory('Official Letter');
    setEditingTemplate(null);
    setShowAddModal(false);
  };

  const handleDeleteTemplate = (id) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    try { localStorage.setItem('nstp_letter_templates', JSON.stringify(updated)); } catch {}
    showNotify('Template deleted', 'info');
  };

  const handleDownloadLetter = (t) => {
    const blob = new Blob([t.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${t.title.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showNotify(`Downloaded ${t.title}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredTemplates = templates.filter(t =>
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50/50 text-gray-900 font-sans max-w-full overflow-x-hidden">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        user={user}
      />

      <main className={`transition-all duration-300 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto ${sidebarOpen ? 'lg:ml-64' : ''}`}>
        {/* Notification Toast */}
        {notification && (
          <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none p-4">
            <div className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-white text-xs font-bold max-w-xs border border-white/20 animate-fade-in ${notification.type === 'success' ? 'bg-emerald-700' : 'bg-amber-700'}`}>
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />}
              <span className="flex-1 font-bold">{notification.message}</span>
            </div>
          </div>
        )}

        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-emerald-800/40 relative mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-200 hover:text-white rounded-xl shrink-0 transition-colors cursor-pointer"
                aria-label="Open menu"
              >
                <Menu className="w-4 h-4" />
              </button>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
                <FileCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h1 className="text-base sm:text-2xl font-black tracking-tight text-white">Letter Formats &amp; Templates</h1>
                <p className="text-emerald-200 text-xs sm:text-sm font-medium mt-0.5">Manage, draft, and export official NSTP letters and communications</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setTitle('');
                setContent('');
                setCategory('Official Letter');
                setEditingTemplate(null);
                setShowAddModal(true);
              }}
              className="w-full sm:w-auto bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-emerald-950 font-black px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95 text-xs flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Letter Template</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search templates by title or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-all shadow-2xs"
            />
          </div>
        </div>

        {/* Blank / Empty State or Template Cards Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-gray-200/80 shadow-sm max-w-xl mx-auto my-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-inner">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-emerald-950">No Letter Formats Created Yet</h3>
            <p className="text-gray-500 text-xs sm:text-sm mt-1 mb-6 leading-relaxed">
              The letter formats list is currently empty. Click the button below to add your custom official letter template or form document.
            </p>
            <button
              type="button"
              onClick={() => {
                setTitle('');
                setContent('');
                setCategory('Official Letter');
                setEditingTemplate(null);
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Add First Template</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-5 border border-gray-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {item.category}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-emerald-950 mb-2 leading-tight">{item.title}</h3>
                  <p className="text-xs text-gray-600 line-clamp-4 font-mono bg-gray-50 p-3 rounded-xl border border-gray-100 whitespace-pre-wrap leading-relaxed">
                    {item.content}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => handleDownloadLetter(item)}
                    className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTemplate(item);
                        setTitle(item.title);
                        setCategory(item.category);
                        setContent(item.content);
                        setShowAddModal(true);
                      }}
                      className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                      title="Edit Template"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteTemplate(item.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Template"
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
                    {editingTemplate ? 'Edit Letter Template' : 'Create Letter Template'}
                  </h3>
                </div>
                <button type="button" onClick={() => setShowAddModal(false)} className="text-emerald-200 hover:text-white p-1 rounded-lg transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveTemplate} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Template Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Excused Absence Form"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Category *</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
                  >
                    <option value="Official Letter">Official Letter</option>
                    <option value="Absence Request">Absence Request</option>
                    <option value="Field Work Request">Field Work Request</option>
                    <option value="Certificate Format">Certificate Format</option>
                    <option value="General Notice">General Notice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">Letter Content / Body *</label>
                  <textarea
                    required
                    rows={8}
                    placeholder="Enter the official body text of the letter..."
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 leading-relaxed"
                  />
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
                    className="px-5 py-2 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-emerald-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    {editingTemplate ? 'Update Template' : 'Save Template'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
