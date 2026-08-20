import { Link } from 'react-router-dom';
import { 
  Shield, Users, GraduationCap, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, 
  Target, Eye, BookOpen, MapPin, Phone, Mail, Facebook, Globe, Award, 
  CheckCircle2, Activity, Clock, Play, Film, ArrowRight, HelpCircle, Compass, 
  Search, Check, HeartHandshake, Menu, X, Layers, FileText
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getTelemetryStats } from '../services/api';
import { calculateEnrollmentStatus } from '../utils/enrollmentSchedule';

// Actual CvSU Naic campus photography
const CAROUSEL_IMAGES = [
  {
    src: `${import.meta.env.BASE_URL}cvsunaiccampus.png`,
    title: "Cavite State University Naic",
    subtitle: "Premier institution fostering character, academics, and sustainable community leadership through NSTP.",
    badge: "Official Campus Portal",
    track: "all"
  },
  {
    src: `${import.meta.env.BASE_URL}IMG_9578.JPG`,
    title: "ROTC Leadership & Defense",
    subtitle: "Developing military preparedness, discipline, patriotism, and disaster rescue response capabilities.",
    badge: "Reserve Officers' Training Corps",
    track: "ROTC"
  },
  {
    src: `${import.meta.env.BASE_URL}cwts-cover.jpg`,
    title: "CWTS Community Service",
    subtitle: "Empowering local coastal barangays through public health, environmental tree planting, and civic welfare.",
    badge: "Civic Welfare Training Service",
    track: "CWTS"
  },
  {
    src: `${import.meta.env.BASE_URL}lts-cover.jpg`,
    title: "LTS Literacy Program",
    subtitle: "Transforming youth and children's futures through dedicated numeracy, reading, and mentorship modules.",
    badge: "Literacy Training Service",
    track: "LTS"
  }
];

const FAQ_ITEMS = [
  {
    q: "Who is required to take NSTP?",
    category: "Enrollment",
    a: "Under Republic Act No. 9163 (NSTP Law of 2001), all male and female students enrolled in any baccalaureate degree or two-year technical-vocational course in Higher Education Institutions (HEIs) are required to complete one (1) NSTP component as a mandatory graduation requirement."
  },
  {
    q: "How many units and semesters is the NSTP course?",
    category: "Academics",
    a: "NSTP is a 6-credit-unit course taken across two (2) consecutive semesters: NSTP 1 (3 Units) during the First Semester and NSTP 2 (3 Units) during the Second Semester under the exact same component chosen."
  },
  {
    q: "How do I choose between CWTS, LTS, and ROTC?",
    category: "Programs",
    a: "Students may freely choose based on their career goals and interests:\n• CWTS (Civic Welfare Training Service): Community health, coastal sanitation, tree planting, and civic welfare.\n• LTS (Literacy Training Service): Teaching literacy and numeracy to school children and out-of-school youth.\n• ROTC (Reserve Officers' Training Corps): Military discipline, defense training, leadership, and civil defense."
  },
  {
    q: "What documents are required to enroll online?",
    category: "Requirements",
    a: "You need a clear digital copy/photo of your official CvSU Registration Form (Certificate of Registration / COR) showing your enrolled subjects for the semester, your 9-digit Student ID Number, and your official CvSU email address."
  },
  {
    q: "Can I transfer or shift to another NSTP component?",
    category: "Policies",
    a: "Generally, students must complete both NSTP 1 and NSTP 2 in the same component. Any exceptional request to transfer components must be submitted to and approved by the NSTP Campus Coordinator before the start of the semester."
  },
  {
    q: "What should I do if the online portal is closed?",
    category: "Enrollment",
    a: "Please check the Scheduled Opening banner on the landing page for the official enrollment window dates. If you missed the schedule or have special concerns, visit the NSTP Office located at CvSU Naic Campus."
  }
];

function Landing() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [faqSearch, setFaqSearch] = useState('');
  const [faqCategory, setFaqCategory] = useState('All');
  
  // Navigation Dropdown & Mobile Menu State
  const [openDropdown, setOpenDropdown] = useState(null); // 'resources' | null
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerNavRef = useRef(null);

  const timerRef = useRef(null);

  // Live Enrollment Timed Schedule Status
  const [enrollmentStatus, setEnrollmentStatus] = useState(() => calculateEnrollmentStatus());
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const updateSchedule = () => setEnrollmentStatus(calculateEnrollmentStatus());
    window.addEventListener('nstp_enrollment_schedule_changed', updateSchedule);
    const interval = setInterval(updateSchedule, 10000);
    return () => {
      window.removeEventListener('nstp_enrollment_schedule_changed', updateSchedule);
      clearInterval(interval);
    };
  }, []);

  // Close desktop dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (headerNavRef.current && !headerNavRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Detect scroll position to show back to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (id) => {
    setOpenDropdown(null);
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Video Auto Pause / Resume on Scroll
  const videoRef = useRef(null);
  const wasPlayingOnScrollRef = useRef(false);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          if (!videoEl.paused) {
            wasPlayingOnScrollRef.current = true;
            videoEl.pause();
          }
        } else {
          if (wasPlayingOnScrollRef.current) {
            videoEl.play().catch(() => {});
          }
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(videoEl);
    return () => observer.disconnect();
  }, []);

  // Real-time Telemetry & Active Online Users state
  const [telemetry, setTelemetry] = useState(() => {
    let cached = 0;
    try {
      cached = parseInt(localStorage.getItem('nstp_cached_total_users') || '0', 10);
    } catch (_) {}
    return {
      totalVisitors: cached,
      totalUsers: cached,
      totalRegisteredUsers: cached,
      activeOnlineCount: 1,
      activeUsers: []
    };
  });

  useEffect(() => {
    let isMounted = true;
    const pollStats = async () => {
      try {
        const stats = await getTelemetryStats();
        if (stats && isMounted) {
          setTelemetry(stats);
        }
      } catch (_) { /* ignore */ }
    };

    pollStats();
    const interval = setInterval(pollStats, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const totalUsersCount = telemetry.totalRegisteredUsers || telemetry.totalUsers || telemetry.totalVisitors || 0;
  const activeOnlineCount = telemetry.activeOnlineCount || 1;

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    }, 6000);
  }, []);

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [startTimer]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    startTimer();
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + CAROUSEL_IMAGES.length) % CAROUSEL_IMAGES.length);
    startTimer();
  };

  // Touch Swipe Handling for Mobile Carousel
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 50) {
      nextSlide();
    } else if (touchEndX.current - touchStartX.current > 50) {
      prevSlide();
    }
  };

  // Filter FAQ items dynamically
  const filteredFaqs = useMemo(() => {
    const q = faqSearch.trim().toLowerCase();
    return FAQ_ITEMS.filter(item => {
      const matchCat = faqCategory === 'All' || item.category === faqCategory;
      const matchText = !q || item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q);
      return matchCat && matchText;
    });
  }, [faqSearch, faqCategory]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-600 selection:text-white relative antialiased">

      {/* ── Executive Glassmorphic Header with Dropdown Navigation ──────── */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 backdrop-blur-xl text-white shadow-xl border-b border-emerald-700/60 transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-3 flex justify-between items-center gap-2 sm:gap-3">
          
          {/* University Identity */}
          <Link to="/" className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1 group">
            <div className="w-8 h-8 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-white rounded-xl sm:rounded-2xl p-0.5 sm:p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-md sm:shadow-lg ring-1.5 sm:ring-2 ring-amber-400/40 group-hover:scale-105 transition-transform duration-300">
              <img src={`${import.meta.env.BASE_URL}cvsu.png`} alt="CvSU Logo" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <h1 className="text-[13px] sm:text-base md:text-lg font-black tracking-tight truncate leading-tight text-white group-hover:text-amber-300 transition-colors">
                  Cavite State University - Naic
                </h1>
              </div>
              <p className="text-amber-400 text-[9px] sm:text-xs font-bold font-mono mt-0.5">
                Naic Campus
              </p>
            </div>
          </Link>

          {/* Desktop Dropdown Navigation Bar (Ultra-Clean & Compact) */}
          <nav ref={headerNavRef} className="hidden lg:flex items-center space-x-2 text-xs font-bold text-emerald-100/90">
            
            {/* Dropdown 1: Programs & Guide */}
            <div className="relative">
              <button 
                type="button" 
                onClick={() => setOpenDropdown(openDropdown === 'guide' ? null : 'guide')}
                className={`px-3.5 py-2 rounded-xl hover:bg-white/10 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 ${
                  openDropdown === 'guide' ? 'bg-white/15 text-white shadow-xs' : ''
                }`}
              >
                <BookOpen className="w-4 h-4 text-emerald-300" />
                <span>Programs &amp; Guide</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdown === 'guide' ? 'rotate-180 text-amber-300' : ''}`} />
              </button>

              {openDropdown === 'guide' && (
                <div className="absolute left-0 mt-2 w-72 bg-emerald-950/98 backdrop-blur-2xl border border-emerald-700/80 rounded-2xl shadow-2xl p-2 z-50 animate-slide-up">
                  <button
                    type="button"
                    onClick={() => scrollToSection('guide')}
                    className="w-full p-2.5 rounded-xl hover:bg-emerald-800/70 text-left transition-colors flex items-start gap-3 cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-black text-white text-xs group-hover:text-amber-300">How to Enroll</p>
                      <p className="text-[11px] text-emerald-200/80">Step-by-step online registration procedure</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => scrollToSection('schedule')}
                    className="w-full p-2.5 rounded-xl hover:bg-emerald-800/70 text-left transition-colors flex items-start gap-3 cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center text-emerald-300 shrink-0 mt-0.5">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-black text-white text-xs group-hover:text-amber-300">Schedule &amp; Dates</p>
                        {enrollmentStatus.isOpen && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>}
                      </div>
                      <p className="text-[11px] text-emerald-200/80">Active enrollment window schedule</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => scrollToSection('video')}
                    className="w-full p-2.5 rounded-xl hover:bg-emerald-800/70 text-left transition-colors flex items-start gap-3 cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                      <Play className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-black text-white text-xs group-hover:text-amber-300">Video Orientation</p>
                      <p className="text-[11px] text-emerald-200/80">Official UP Diliman &amp; RA 9163 orientation</p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Dropdown 2: Help & Support */}
            <div className="relative">
              <button 
                type="button" 
                onClick={() => setOpenDropdown(openDropdown === 'support' ? null : 'support')}
                className={`px-3.5 py-2 rounded-xl hover:bg-white/10 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 ${
                  openDropdown === 'support' ? 'bg-white/15 text-white shadow-xs' : ''
                }`}
              >
                <HelpCircle className="w-4 h-4 text-amber-300" />
                <span>Help &amp; Support</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdown === 'support' ? 'rotate-180 text-amber-300' : ''}`} />
              </button>

              {openDropdown === 'support' && (
                <div className="absolute left-0 mt-2 w-72 bg-emerald-950/98 backdrop-blur-2xl border border-emerald-700/80 rounded-2xl shadow-2xl p-2 z-50 animate-slide-up">
                  <button
                    type="button"
                    onClick={() => scrollToSection('faq')}
                    className="w-full p-2.5 rounded-xl hover:bg-emerald-800/70 text-left transition-colors flex items-start gap-3 cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-black text-white text-xs group-hover:text-amber-300">Knowledge Base &amp; FAQ</p>
                      <p className="text-[11px] text-emerald-200/80">Searchable answers to common questions</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => scrollToSection('contact')}
                    className="w-full p-2.5 rounded-xl hover:bg-emerald-800/70 text-left transition-colors flex items-start gap-3 cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center text-emerald-300 shrink-0 mt-0.5">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-black text-white text-xs group-hover:text-amber-300">Contact Directory</p>
                      <p className="text-[11px] text-emerald-200/80">CvSU Naic Campus information &amp; hotline</p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* Header Action Buttons & Mobile Hamburger Button */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <Link
              to="/enrollment"
              className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-800/80 hover:bg-emerald-700 text-white font-bold px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm border border-emerald-600/70 active:scale-95 transition-all shadow-sm hover:shadow-md hover:border-emerald-400 shrink-0"
              title="Online Enrollment Application"
            >
              <span>Enrollment</span>
              <ChevronRight className="w-3.5 h-3.5 text-amber-300" />
            </Link>

            <Link
              to="/login"
              className="inline-flex items-center gap-1 sm:gap-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-emerald-950 font-black px-2.5 sm:px-5 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-sm transition-all shadow-md shadow-amber-950/30 hover:shadow-lg hover:shadow-amber-500/20 active:scale-95 shrink-0"
            >
              <span>Login</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </Link>

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-white/10 hover:bg-white/20 border border-emerald-700/80 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>

        {/* ── Mobile Slide-down Full Drawer Navigation ──────────────────── */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-emerald-950/98 backdrop-blur-3xl border-t border-emerald-800/90 px-4 py-3.5 space-y-3 animate-slide-up shadow-2xl">
            
            {/* Quick Actions in Mobile Drawer */}
            <div className="grid grid-cols-2 gap-2 pb-3 border-b border-emerald-800/80">
              <Link
                to="/enrollment"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-center text-xs flex items-center justify-center gap-1.5 border border-emerald-700 shadow-sm transition-colors"
              >
                <span>Enroll Now</span>
                <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-emerald-950 font-black rounded-xl text-center text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <span>Portal Login</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Categorized Mobile Navigation Links */}
            <div className="space-y-1 text-xs font-bold text-emerald-100">
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-400/90 px-2 pt-1 pb-0.5">Programs &amp; Guides</p>
              
              <button 
                type="button" 
                onClick={() => { scrollToSection('guide'); setMobileMenuOpen(false); }} 
                className="w-full p-2 rounded-xl hover:bg-white/10 text-left flex items-center gap-2.5 cursor-pointer transition-colors"
              >
                <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>How to Enroll (3 Steps)</span>
              </button>

              <button 
                type="button" 
                onClick={() => { scrollToSection('schedule'); setMobileMenuOpen(false); }} 
                className="w-full p-2 rounded-xl hover:bg-white/10 text-left flex items-center gap-2.5 cursor-pointer transition-colors"
              >
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Enrollment Schedule</span>
              </button>

              <button 
                type="button" 
                onClick={() => { scrollToSection('video'); setMobileMenuOpen(false); }} 
                className="w-full p-2 rounded-xl hover:bg-white/10 text-left flex items-center gap-2.5 cursor-pointer transition-colors"
              >
                <Play className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Video Orientation Guide</span>
              </button>

              <p className="text-[10px] font-black uppercase tracking-wider text-amber-400/90 px-2 pt-2 pb-0.5">Help &amp; Contact</p>

              <button 
                type="button" 
                onClick={() => { scrollToSection('faq'); setMobileMenuOpen(false); }} 
                className="w-full p-2 rounded-xl hover:bg-white/10 text-left flex items-center gap-2.5 cursor-pointer transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Frequently Asked Questions</span>
              </button>

              <button 
                type="button" 
                onClick={() => { scrollToSection('contact'); setMobileMenuOpen(false); }} 
                className="w-full p-2 rounded-xl hover:bg-white/10 text-left flex items-center gap-2.5 cursor-pointer transition-colors"
              >
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>CvSU Naic Contact Directory</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── Modern Hero Section (Hero Carousel & Direct Action CTAs) ───── */}
      <section 
        className="relative h-[410px] xs:h-[450px] sm:h-[530px] md:h-[600px] lg:h-[650px] overflow-hidden bg-gray-950"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {CAROUSEL_IMAGES.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out transform-gpu ${
              index === currentSlide ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 z-0 pointer-events-none'
            }`}
          >
            <img
              src={image.src}
              alt={image.title}
              className="w-full h-full object-cover transition-transform duration-1000 ease-out"
              loading={index === 0 ? 'eager' : 'lazy'}
            />
            {/* Rich Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/70 to-transparent flex flex-col justify-end p-4 xs:p-5 sm:p-10 md:p-14 lg:p-20 pb-5 xs:pb-6 sm:pb-12">
              <div className={`max-w-4xl transition-all duration-700 delay-150 ${
                index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
              }`}>
                <span className="inline-flex items-center bg-emerald-500/90 text-white font-black text-[10px] xs:text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-1.5 rounded-full uppercase tracking-wider mb-2 sm:mb-4 shadow-lg backdrop-blur-md border border-emerald-400/40">
                  <span>{image.badge}</span>
                </span>
                
                <h2 className="text-base xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white drop-shadow-md leading-tight max-w-4xl truncate">
                  {image.title}
                </h2>
                
                <p className="text-emerald-100 text-[11px] xs:text-xs sm:text-sm md:text-base max-w-2xl mt-1 sm:mt-2 font-medium leading-relaxed line-clamp-2 sm:line-clamp-none">
                  {image.subtitle}
                </p>

                {/* Hero Immediate Action Buttons (Neatly Arranged & Balanced on Mobile) */}
                <div className="mt-3.5 sm:mt-6 flex flex-row items-center gap-2 sm:gap-4 max-w-md sm:max-w-none">
                  <Link
                    to="/enrollment"
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-emerald-950 font-black px-3 sm:px-8 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl text-[11px] xs:text-xs sm:text-sm shadow-xl shadow-amber-950/40 hover:shadow-2xl hover:shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all text-center whitespace-nowrap"
                  >
                    <span>Apply for Enrollment</span>
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => scrollToSection('guide')}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-emerald-900/80 hover:bg-emerald-800/90 text-white font-bold px-3 sm:px-6 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl text-[11px] xs:text-xs sm:text-sm backdrop-blur-md border border-emerald-600/70 hover:border-emerald-400 active:scale-95 transition-all cursor-pointer shadow-lg text-center whitespace-nowrap"
                  >
                    <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 shrink-0" />
                    <span>How to Enroll</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Carousel Desktop Navigation */}
        <button
          type="button"
          onClick={prevSlide}
          aria-label="Previous Slide"
          className="hidden md:flex absolute left-5 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-2xl bg-black/40 hover:bg-black/75 text-white items-center justify-center backdrop-blur-md border border-white/20 hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-xl"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          type="button"
          onClick={nextSlide}
          aria-label="Next Slide"
          className="hidden md:flex absolute right-5 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-2xl bg-black/40 hover:bg-black/75 text-white items-center justify-center backdrop-blur-md border border-white/20 hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-xl"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Carousel Indicators (Cleanly elevated in top-right on mobile, bottom-right on desktop) */}
        <div className="absolute top-4 right-4 sm:top-auto sm:bottom-6 sm:right-12 flex space-x-1.5 sm:space-x-2 z-20 bg-black/30 sm:bg-transparent backdrop-blur-xs sm:backdrop-blur-none p-1.5 sm:p-0 rounded-full border border-white/10 sm:border-0">
          {CAROUSEL_IMAGES.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentSlide(index);
                startTimer();
              }}
              className={`h-2 sm:h-3 rounded-full transition-all duration-300 cursor-pointer ${
                index === currentSlide ? 'w-6 sm:w-12 bg-amber-400' : 'w-2 sm:w-3 bg-white/40 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ── Modern Bento Grid Overview (Fast Stats & R.A. 9163 Highlights) ── */}
      <section className="py-10 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
          
          {/* Bento Card 1: Large Academic Foundation Card */}
          <div className="md:col-span-2 bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-3xl p-6 sm:p-8 border border-emerald-700/60 shadow-lg relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <div>
              <span className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-black uppercase px-3 py-1 rounded-full mb-3">
                <BookOpen className="w-3.5 h-3.5" /> Republic Act No. 9163
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                Mandatory National Service Training Program
              </h3>
              <p className="text-emerald-100/90 text-xs sm:text-sm mt-2 leading-relaxed">
                Empowering Filipino tertiary students with civic consciousness, defense preparedness, ethics of service, and community leadership as required by law for graduation.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-emerald-800/80 flex items-center justify-between text-xs text-emerald-200 font-bold">
              <span>Cavite State University Naic</span>
              <span className="text-amber-300 font-black">6 Total Units</span>
            </div>
          </div>

          {/* Bento Card 2: 3 Components */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3 shadow-xs">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">3 Tracks</p>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Component Choices</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Choose between Civic Welfare (CWTS), Literacy (LTS), or Military Defense (ROTC).
              </p>
            </div>
          </div>

          {/* Bento Card 3: 2 Semesters */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3 shadow-xs">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">2 Semesters</p>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Academic Duration</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                NSTP 1 in the 1st Semester, followed by field execution NSTP 2 in the 2nd Semester.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ── High-Impact Enrollment Schedule & Portal Action ──────────── */}
      <section id="schedule" className="py-12 sm:py-20 px-4 sm:px-6 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white relative overflow-hidden border-y border-emerald-800">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">

          {/* Schedule Status Card */}
          <div className="mb-8 p-5 sm:p-7 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl max-w-2xl mx-auto text-left">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                  enrollmentStatus.isOpen
                    ? 'bg-emerald-500 text-white shadow-emerald-900/50'
                    : 'bg-amber-400 text-emerald-950'
                }`}>
                  {enrollmentStatus.isOpen ? <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7" /> : <Clock className="w-6 h-6 sm:w-7 sm:h-7" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-black text-white leading-tight">{enrollmentStatus.headline}</h3>
                    <span className={`text-[10px] sm:text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      enrollmentStatus.isOpen ? 'bg-amber-400 text-emerald-950 animate-pulse' : 'bg-rose-500 text-white'
                    }`}>
                      {enrollmentStatus.isOpen ? 'Portal Active' : 'Portal Closed'}
                    </span>
                  </div>
                  <p className="text-emerald-100 text-xs sm:text-sm mt-1.5 font-medium leading-relaxed">
                    {enrollmentStatus.subtext}
                  </p>
                  {enrollmentStatus.customNotice && (
                    <div className="mt-2 overflow-hidden max-w-full">
                      <p className="text-amber-300 text-[10px] xs:text-xs font-bold bg-black/35 px-2.5 sm:px-3 py-1 rounded-xl border border-amber-400/25 leading-tight inline-flex items-center gap-1.5 max-w-full truncate shadow-xs">
                        <span className="shrink-0">📢</span>
                        <span className="truncate">{enrollmentStatus.customNotice}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {enrollmentStatus.openAtFormatted && (
                <div className="bg-emerald-900/90 border border-emerald-700/80 p-3 rounded-2xl text-center shrink-0 w-full sm:w-auto">
                  <p className="text-[10px] text-amber-300 uppercase font-extrabold tracking-wider">Scheduled Window</p>
                  <p className="text-xs sm:text-sm font-bold text-white mt-1">{enrollmentStatus.openAtFormatted}</p>
                </div>
              )}
            </div>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black mb-3 text-white">Ready to Start Your NSTP Journey?</h2>
          <p className="text-emerald-100 text-xs sm:text-base mb-7 max-w-xl mx-auto font-medium leading-relaxed">
            Submit your official enrollment application for CWTS, LTS, or ROTC component online with your student credentials.
          </p>

          {enrollmentStatus.isOpen ? (
            <Link
              to="/enrollment"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-emerald-950 font-black px-8 sm:px-12 py-4 rounded-2xl text-base sm:text-lg transition-all shadow-xl shadow-amber-950/40 hover:shadow-2xl hover:-translate-y-1 active:scale-95 group"
            >
              <span>Fill Up Online Enrollment Form</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
            </Link>
          ) : (
            <div className="inline-flex flex-col sm:flex-row items-center gap-2.5 bg-white/10 border border-white/20 px-5 py-3.5 rounded-2xl shadow-md">
              <span className="text-xs sm:text-sm text-amber-300 font-bold">🔒 Online Enrollment Currently Closed</span>
              {enrollmentStatus.openAtFormatted && (
                <span className="text-xs sm:text-sm text-emerald-200 font-medium">• Reopens on: <strong className="text-white">{enrollmentStatus.openAtFormatted}</strong></span>
              )}
            </div>
          )}
        </div>
      </section>



      {/* ── 3-Step Guided Enrollment Pipeline ────────────────────────── */}
      <section id="guide" className="py-12 sm:py-20 px-4 sm:px-6 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-14">
            <span className="bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-2xs">
              Easy 3-Step Process
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mt-3">How to Enroll Online</h2>
            <p className="text-slate-600 text-xs sm:text-base mt-1.5">Simple guide for incoming freshmen and transferees at Cavite State University Naic</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8 relative">
            
            {/* Step 1 */}
            <div className="bg-emerald-50/70 rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <span className="w-12 h-12 bg-emerald-700 text-white font-black text-lg rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                  1
                </span>
                <h3 className="text-base sm:text-lg font-black text-emerald-950 mb-1.5">Select Component Track</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Choose between CWTS, LTS, or ROTC according to your career interest and personal advocacy.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-emerald-50/70 rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <span className="w-12 h-12 bg-emerald-700 text-white font-black text-lg rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                  2
                </span>
                <h3 className="text-base sm:text-lg font-black text-emerald-950 mb-1.5">Fill Form & Upload COR</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Enter student details, verify 9-digit Student ID, and attach your CvSU Registration Form (COR).
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-emerald-50/70 rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <span className="w-12 h-12 bg-emerald-700 text-white font-black text-lg rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                  3
                </span>
                <h3 className="text-base sm:text-lg font-black text-emerald-950 mb-1.5">Coordinator Review</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  NSTP department coordinators verify your application and assign your official section roster.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Video Orientation Section ─────────────────────────────────── */}
      <section id="video" className="py-12 sm:py-20 px-4 bg-gradient-to-b from-emerald-950 via-emerald-900 to-teal-950 text-white relative overflow-hidden border-t border-emerald-800">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-8 sm:mb-12">
            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-full inline-flex items-center gap-2 shadow-sm">
              <Play className="w-3.5 h-3.5 fill-amber-300 text-amber-300" /> Official Video Orientation
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white mt-3 tracking-tight">What is NSTP? Video Guide & Overview</h2>
            <p className="text-emerald-200 text-xs sm:text-base mt-2 max-w-2xl mx-auto font-medium leading-relaxed">
              Watch this educational video explanation to learn more about Republic Act 9163, NSTP 1 & 2 components (CWTS, LTS, ROTC), and graduation requirements.
            </p>
          </div>

          {/* Responsive 16:9 Video Container */}
          <div className="bg-black/50 rounded-3xl border border-white/15 p-3.5 sm:p-5 shadow-2xl backdrop-blur-md">
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center group shadow-inner border border-white/10">
              <video
                ref={videoRef}
                controls
                controlsList="nodownload"
                playsInline
                poster={`${import.meta.env.BASE_URL}cvsunaiccampus.png`}
                className="w-full h-full rounded-2xl object-cover bg-black"
              >
                <source src={`${import.meta.env.BASE_URL}nstp-orientation.mp4`} type="video/mp4" />
                <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
                Your browser does not support HTML5 video.
              </video>
            </div>

            {/* Video Details & Credits Box */}
            <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left">
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-xs sm:text-sm text-white">National Service Training Program (NSTP) Orientation</h4>
                  <p className="text-xs text-emerald-200 font-medium">Educational orientation guide explaining Republic Act 9163, CWTS, LTS, & ROTC</p>
                </div>
              </div>

              {/* Video Credits */}
              <div className="bg-amber-400/10 border border-amber-400/25 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-left shrink-0 w-full sm:w-auto overflow-hidden">
                <p className="text-[9px] sm:text-[10px] font-black uppercase text-amber-300 tracking-wider flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Video Credits:
                </p>
                <p className="text-[10.5px] xs:text-xs sm:text-xs font-black text-white mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                  University of the Philippines Diliman (UP Diliman)
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Searchable & Filterable FAQ Interactive Accordion ────────── */}
      <section id="faq" className="py-12 sm:py-20 px-4 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-6 sm:mb-10">
            <span className="bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-2xs">
              Knowledge Base & FAQ
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mt-3">Frequently Asked Questions</h2>
            <p className="text-slate-600 text-xs sm:text-base mt-1.5">Quick answers regarding enrollment, components, units, and campus policies</p>
          </div>

          {/* Interactive Search & Filter Box */}
          <div className="mb-6 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                placeholder="Search questions (e.g. graduation, CWTS, documents)..."
                className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 shadow-2xs"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {['All', 'Enrollment', 'Academics', 'Programs', 'Requirements', 'Policies'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFaqCategory(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    faqCategory === cat 
                      ? 'bg-emerald-800 text-white shadow-2xs' 
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Accordion List */}
          <div className="space-y-3">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div 
                    key={idx} 
                    className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xs overflow-hidden transition-all duration-200"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full p-4 sm:p-6 flex items-center justify-between text-left gap-3.5 hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <span className="text-xs sm:text-sm md:text-base font-black text-slate-900 flex items-center gap-2.5">
                        <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        {item.q}
                      </span>
                      <div className={`w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 bg-emerald-600 text-white' : ''}`}>
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 whitespace-pre-line animate-fade-in">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-xs">
                No matching questions found for "{faqSearch}". Try another keyword or browse all topics.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Modern Executive Footer ───────────────────────────────────── */}
      <footer id="contact" className="bg-emerald-950 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-12 relative z-10">
          <div className="grid grid-cols-2 gap-3 sm:gap-8 items-start">
            
            {/* About (Left Side) */}
            <div className="min-w-0">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-xl sm:rounded-2xl p-0.5 sm:p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-md ring-1.5 sm:ring-2 ring-amber-400/40">
                  <img src={`${import.meta.env.BASE_URL}cvsu.png`} alt="CvSU Logo" className="w-full h-full object-contain" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-lg md:text-xl font-black leading-tight text-white truncate">Cavite State University - Naic</h4>
                  <p className="text-amber-400 text-[9px] sm:text-xs font-bold font-mono">Naic Campus</p>
                </div>
              </div>
              <p className="text-emerald-200/90 text-[10px] sm:text-xs md:text-sm leading-snug sm:leading-relaxed mb-2 max-w-md">
                A premier institution committed to providing quality education and producing morally upright graduates through the National Service Training Program (NSTP).
              </p>
              <p className="text-amber-400/90 text-[8px] xs:text-[9.5px] sm:text-xs font-bold tracking-tight sm:tracking-wide whitespace-nowrap overflow-hidden text-ellipsis">Truth • Integrity • Excellence • Service</p>
            </div>

            {/* CvSU Naic Contact Info (Right Side - strictly on the same row) */}
            <div className="text-right flex flex-col items-end min-w-0">
              <h5 className="text-[10px] sm:text-xs md:text-sm font-extrabold uppercase tracking-wider mb-2 sm:mb-3 text-amber-400 truncate">Contact Information</h5>
              <ul className="space-y-1.5 sm:space-y-2 text-emerald-200 text-[10px] sm:text-xs md:text-sm font-medium w-full flex flex-col items-end">
                <li className="w-full flex items-center justify-end gap-1.5 sm:gap-2">
                  <a
                    href="https://cvsu.edu.ph/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors flex items-center justify-end gap-1 sm:gap-1.5 group max-w-full truncate"
                    title="Cavite State University Official Portal"
                  >
                    <span className="text-[9.5px] xs:text-[11px] sm:text-sm group-hover:underline truncate">Cavite State University - Naic</span>
                    <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
                  </a>
                </li>
                <li className="w-full flex items-center justify-end gap-1.5 sm:gap-2">
                  <a
                    href="https://web.facebook.com/cvsunaicpio?_rdc=1&_rdr#"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors flex items-center justify-end gap-1 sm:gap-1.5 group max-w-full truncate"
                  >
                    <span className="text-[9.5px] xs:text-[11px] sm:text-sm group-hover:underline truncate">CvSU - Naic FB</span>
                    <Facebook className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
                  </a>
                </li>
                <li className="w-full flex items-center justify-end gap-1.5 sm:gap-2">
                  <a 
                    href="mailto:info@cvsu-naic.edu.ph" 
                    className="hover:text-white transition-colors flex items-center justify-end gap-1 sm:gap-1.5 group max-w-full truncate"
                  >
                    <span className="text-[9.5px] xs:text-[11px] sm:text-sm group-hover:underline truncate">info@cvsu-naic.edu.ph</span>
                    <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
                  </a>
                </li>
                <li className="w-full flex items-center justify-end gap-1.5 sm:gap-2">
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Cavite+State+University+-+Naic"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors flex items-center justify-end gap-1 sm:gap-1.5 group max-w-full truncate"
                    title="View Cavite State University Naic Campus on Google Maps"
                  >
                    <span className="text-[9.5px] xs:text-[11px] sm:text-sm group-hover:underline truncate">Naic, Cavite</span>
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
                  </a>
                </li>
                <li className="w-full flex items-center justify-end gap-1.5 sm:gap-2 text-emerald-200">
                  <a
                    href="tel:0468905138"
                    className="hover:text-white transition-colors flex items-center justify-end gap-1 sm:gap-1.5 group max-w-full truncate"
                    title="Call Cavite State University - Naic Campus"
                  >
                    <span className="text-[9.5px] xs:text-[11px] sm:text-sm font-semibold whitespace-nowrap group-hover:underline">(046) 890-5138</span>
                    <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
                  </a>
                </li>
              </ul>
            </div>

          </div>
        </div>

        {/* Live Telemetry Bar */}
        <div className="border-t border-emerald-900/80 bg-emerald-900/50 py-2.5 sm:py-3.5 px-3 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-800/80 border border-emerald-700/80 flex items-center justify-center text-amber-400 shadow-xs shrink-0">
                <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse" />
              </div>
              <div className="min-w-0">
                <h5 className="text-[9px] sm:text-xs font-black uppercase tracking-wider text-emerald-200 leading-none truncate">Live Telemetry</h5>
                <p className="text-[8px] sm:text-[11px] text-emerald-400 font-medium mt-0.5 truncate hidden xs:block">Real-time status</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
              {/* Total Users */}
              <div className="flex items-center gap-1.5 sm:gap-2 bg-emerald-900/80 border border-emerald-800 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl shadow-xs">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                <div>
                  <p className="text-[7.5px] sm:text-[8.5px] uppercase font-extrabold text-emerald-300 tracking-wider leading-none">Total Users</p>
                  <p className="text-[11px] sm:text-sm font-black text-amber-400 leading-tight mt-0.5">
                    {totalUsersCount.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Active Online */}
              <div className="flex items-center gap-1.5 sm:gap-2 bg-emerald-800/90 border border-emerald-600/80 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl shadow-xs">
                <div className="relative flex h-2 w-2 items-center justify-center shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                </div>
                <div>
                  <p className="text-[7.5px] sm:text-[8.5px] uppercase font-extrabold text-emerald-200 tracking-wider leading-none">Active Online</p>
                  <p className="text-[11px] sm:text-sm font-black text-emerald-300 leading-tight mt-0.5">
                    {activeOnlineCount}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-emerald-900 py-3.5 sm:py-4 px-4">
          <div className="max-w-7xl mx-auto flex justify-center items-center text-[10px] sm:text-xs text-emerald-400 font-medium text-center">
            <p>© {new Date().getFullYear()} Cavite State University Naic Campus • NSTP System</p>
          </div>
        </div>
      </footer>

      {/* Floating Back to Top Button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="fixed bottom-6 right-5 z-40 p-3.5 rounded-full bg-emerald-900/95 text-amber-400 border border-amber-400/70 shadow-2xl hover:bg-emerald-800 hover:scale-110 active:scale-95 transition-all cursor-pointer backdrop-blur-md animate-fade-in"
        >
          <ChevronUp className="w-5 h-5 stroke-[2.5]" />
        </button>
      )}

    </div>
  );
}

export default Landing;