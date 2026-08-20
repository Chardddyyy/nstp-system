import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export default function ScrollToTopButton() {
  const [isScrolledDown, setIsScrolledDown] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        setIsScrolledDown(scrollY > scrollHeight * 0.35 || scrollY > 400);
      } else {
        setIsScrolledDown(scrollY > 300);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleToggleScroll = () => {
    if (isScrolledDown) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggleScroll}
      aria-label={isScrolledDown ? "Scroll to top" : "Scroll to bottom"}
      title={isScrolledDown ? "Scroll to Top" : "Scroll to Bottom"}
      className="fixed bottom-6 right-5 z-40 p-3.5 rounded-full bg-emerald-950/95 hover:bg-emerald-900 text-amber-400 border border-amber-400/80 shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer backdrop-blur-md flex items-center justify-center group animate-fade-in"
    >
      {isScrolledDown ? (
        <ChevronUp className="w-5 h-5 stroke-[2.5] group-hover:-translate-y-0.5 transition-transform" />
      ) : (
        <ChevronDown className="w-5 h-5 stroke-[2.5] group-hover:translate-y-0.5 transition-transform" />
      )}
    </button>
  );
}
