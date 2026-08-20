import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 200);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-5 z-40 flex flex-col items-center gap-2 animate-fade-in">
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="p-3 rounded-full bg-emerald-950/90 hover:bg-emerald-900 text-amber-400 border border-amber-400/80 shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer backdrop-blur-md flex items-center justify-center group"
        title="Scroll to Top"
        aria-label="Scroll to top"
      >
        <ChevronUp className="w-5 h-5 stroke-[2.5] group-hover:-translate-y-0.5 transition-transform" />
      </button>
      <button
        type="button"
        onClick={() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })}
        className="p-3 rounded-full bg-emerald-950/90 hover:bg-emerald-900 text-amber-400 border border-amber-400/80 shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer backdrop-blur-md flex items-center justify-center group"
        title="Scroll to Bottom"
        aria-label="Scroll to bottom"
      >
        <ChevronDown className="w-5 h-5 stroke-[2.5] group-hover:translate-y-0.5 transition-transform" />
      </button>
    </div>
  );
}
