import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/layout/Sidebar';
import {
  ExternalLink,
  Copy,
  CheckCircle2,
  HardDrive,
  Database,
  FileText,
  Users,
  ShieldCheck,
  ArrowLeft,
  Menu,
  Lock,
  Sparkles,
  Info
} from 'lucide-react';

const GDRIVE_URL = 'https://drive.google.com/drive/folders/1lWSgMdKMBD8148A_wFb6UufFgmloD4e3';

export function GoogleDriveIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 87.3 78" fill="none" aria-hidden="true">
      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.5l5.85 10.1z" fill="#ea4335"/>
      <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.4-4.5 1.2z" fill="#00832d"/>
      <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.4 4.5-1.2z" fill="#2684fc"/>
      <path d="m73.4 26.5-13.25-22.95c-.8-1.4-1.95-2.5-3.3-3.3l-13.2 22.8 13.75 23.8h27.5c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
    </svg>
  );
}

export default function GoogleDrive() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleOpenDrive = () => {
    window.open(GDRIVE_URL, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(GDRIVE_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans max-w-full overflow-x-hidden">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={logout}
        user={user}
      />

      <main className={`min-h-screen flex-1 flex flex-col transition-all duration-300 p-3 sm:p-6 lg:p-8 ${sidebarOpen ? 'lg:ml-64' : ''}`}>
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-xl border border-emerald-800/40 relative mb-4 sm:mb-6 w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 relative z-10 w-full">
            <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0 flex-1 w-full sm:w-auto">
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
                <div className="flex items-center gap-2">
                  <h1 className="text-xs sm:text-lg lg:text-xl font-black tracking-tight text-white truncate leading-tight">
                    Google Drive Cloud Storage
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-amber-400 text-emerald-950 px-2 py-0.5 rounded-md shadow-xs">
                    <ShieldCheck className="w-3 h-3" />
                    Admin Portal
                  </span>
                </div>
                <p className="text-emerald-200/90 text-[10px] sm:text-xs font-medium truncate mt-0.5">
                  CvSU Naic National Service Training Program Repository
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => navigate('/admin/dashboard')}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>
              <button
                type="button"
                onClick={handleOpenDrive}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-emerald-950 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer active:scale-95"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Drive</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-5xl mx-auto w-full space-y-6">
          {/* Main Launch Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-xl border border-emerald-900/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-100/50 via-teal-50/30 to-amber-100/40 rounded-full blur-3xl -z-0 pointer-events-none transform translate-x-20 -translate-y-20" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start gap-4 sm:gap-5">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 flex items-center justify-center shrink-0 shadow-lg p-3">
                  <GoogleDriveIcon className="w-full h-full drop-shadow-md" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Cloud Directory
                    </span>
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                      Admin Access Only
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-2 tracking-tight">
                    Official CvSU NSTP Google Drive
                  </h2>
                  <p className="text-gray-600 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
                    Direct central cloud repository for automated MySQL database snapshots, official letter templates, digital ID assets, and NSTP student requirements.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto shrink-0">
                <button
                  type="button"
                  onClick={handleOpenDrive}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-emerald-900/20 hover:shadow-xl transition-all cursor-pointer active:scale-95 group"
                >
                  <GoogleDriveIcon className="w-5 h-5 shrink-0" />
                  <span>Open in Google Drive</span>
                  <ExternalLink className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-colors cursor-pointer active:scale-95"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-gray-500" />
                      <span>Copy Drive Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Direct Link Display */}
            <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-gray-500">Folder Destination:</span>
              <a
                href={GDRIVE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-emerald-700 hover:text-emerald-900 truncate max-w-md underline hover:no-underline bg-emerald-50/60 px-2.5 py-1 rounded-lg border border-emerald-100"
              >
                {GDRIVE_URL}
              </a>
            </div>
          </div>

          {/* Folder Breakdown & Purposes */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-gray-500 mb-3 px-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Drive Repository Contents & Integration</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 text-sm">Automated MySQL Backups</h4>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      Every midnight snapshot and critical action (batch sections, approvals) sends a dual-redundancy backup directly into this cloud folder via webhook.
                    </p>
                    <span className="inline-block mt-2 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      Disaster Recovery
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 text-sm">Official Letter Templates & Waivers</h4>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      Original Word documents, Barangay Immersion Endorsements, CHED compliance formats, and master templates accessible for editing and distribution.
                    </p>
                    <span className="inline-block mt-2 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Document Templates
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 text-sm">Student Document Archives</h4>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      Submitted enrollment requirements, digital ID photos, medical certificates, and student narrative immersion photo documentations.
                    </p>
                    <span className="inline-block mt-2 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      Student Archives
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 text-sm">Batch Historical Archives</h4>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      Permanent archives of past graduating NSTP batches, SO numbers, completion registries, and annual CHED accomplishment reports.
                    </p>
                    <span className="inline-block mt-2 text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                      Long-Term Storage
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security & Access Alert */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <strong className="font-bold">Role-Based Access Control Notice:</strong> This Google Drive link is exclusively restricted to the CvSU Naic NSTP Administrator. Instructors and students do not have permission or access links to this cloud repository.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
