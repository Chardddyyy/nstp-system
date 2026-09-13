import React, { useEffect } from 'react';
import { Keyboard, X, Search, Compass, Calendar, Layers, ShieldCheck } from 'lucide-react';

export default function KeyboardShortcutsModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcutGroups = [
    {
      title: 'Global Navigation',
      icon: <Compass className="w-4 h-4 text-emerald-600" />,
      shortcuts: [
        { keys: ['Alt', 'D'], desc: 'Go to Dashboard (Admin / Instructor)' },
        { keys: ['Alt', 'S'], desc: 'Go to Student Management' },
        { keys: ['Alt', 'R'], desc: 'Go to Reports & Submissions' },
        { keys: ['Alt', 'C'], desc: 'Go to Real-Time Chat' },
        { keys: ['Alt', 'L'], desc: 'Go to Calendar & Events' },
        { keys: ['Alt', 'F'], desc: 'Go to Letter Formats (Admin Only)' },
      ]
    },
    {
      title: 'Search & Controls',
      icon: <Search className="w-4 h-4 text-emerald-600" />,
      shortcuts: [
        { keys: ['Ctrl / ⌘', 'K'], desc: 'Focus active page search bar' },
        { keys: ['/'], desc: 'Quick search focus (when not typing in an input)' },
        { keys: ['Escape'], desc: 'Close any open modal, dialog, or overlay' },
        { keys: ['Tab'], desc: 'Navigate forward between interactive controls' },
        { keys: ['Shift', 'Tab'], desc: 'Navigate backward between interactive controls' },
        { keys: ['Enter'], desc: 'Submit active modal form or trigger selected action' },
      ]
    },
    {
      title: 'Calendar Shortcuts',
      icon: <Calendar className="w-4 h-4 text-emerald-600" />,
      shortcuts: [
        { keys: ['←'], desc: 'Navigate to previous month' },
        { keys: ['→'], desc: 'Navigate to next month' },
        { keys: ['T'], desc: 'Jump to current day / active batch date' },
      ]
    },
    {
      title: 'Security & Access',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
      shortcuts: [
        { keys: ['Ctrl / ⌘', '/'], desc: 'Toggle this keyboard shortcuts guide' },
        { keys: ['?'], desc: 'Show shortcuts reference (when not typing)' },
      ],
      note: 'All shortcuts adhere strictly to Role-Based Access Control (RBAC). Admin actions cannot be executed by unauthorized accounts.'
    }
  ];

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
    >
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-emerald-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-4 sm:p-5 flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 id="shortcuts-modal-title" className="text-base sm:text-lg font-black tracking-tight">
                Keyboard Shortcuts &amp; Accessibility
              </h3>
              <p className="text-emerald-200 text-xs font-medium">
                Navigate and control NSTP without a mouse
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shortcuts modal"
            className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-800/80 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-700 text-sm">
          {shortcutGroups.map((group, idx) => (
            <div key={idx} className="space-y-2.5">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                {group.icon}
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  {group.title}
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {group.shortcuts.map((item, sIdx) => (
                  <div 
                    key={sIdx} 
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 hover:bg-emerald-50/50 hover:border-emerald-200 transition-colors"
                  >
                    <span className="text-xs text-slate-600 font-medium pr-2">{item.desc}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {item.keys.map((k, kIdx) => (
                        <kbd 
                          key={kIdx} 
                          className="px-2 py-0.5 min-w-[24px] text-center font-mono text-[11px] font-bold bg-white text-slate-800 border border-slate-200 rounded-md shadow-xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {group.note && (
                <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/70 rounded-lg p-2 font-medium">
                  {group.note}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold">Esc</kbd> anytime to close dialogs</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
