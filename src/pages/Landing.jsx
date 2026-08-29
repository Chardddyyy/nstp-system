import { Link } from 'react-router-dom';
import { 
  Shield, Users, GraduationCap, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, 
  Target, Eye, BookOpen, MapPin, Phone, Mail, Facebook, Globe, Award, 
  CheckCircle2, Activity, Clock, Play, Film, ArrowRight, HelpCircle, Compass, 
  Search, Check, HeartHandshake, Menu, X, Layers, FileText, Camera, Mic, HardDrive, BellRing, Sparkles, AlertCircle
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getTelemetryStats, pingTelemetry } from '../services/api';
import { calculateEnrollmentStatus, syncEnrollmentScheduleFromServer } from '../utils/enrollmentSchedule';

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
    a: "Under Republic Act No. 9163 (NSTP Law of 2001), all male and female Filipino students enrolled in any baccalaureate degree or two-year technical-vocational course in Higher Education Institutions (HEIs) are required to complete one (1) NSTP component as a mandatory graduation prerequisite."
  },
  {
    q: "How many units and semesters is the NSTP course?",
    category: "Academics",
    a: "NSTP is a 6-credit-unit course taken across two (2) consecutive semesters: NSTP 1 (3 Units) during the First Semester and NSTP 2 (3 Units) during the Second Semester under the exact same component chosen. A total of 54 to 90 training hours are required per semester."
  },
  {
    q: "How do I choose between CWTS, LTS, and ROTC?",
    category: "Programs",
    a: "Students may freely choose based on their interests and career goals:\n• CWTS (Civic Welfare Training Service): Focuses on community health, environmental management, disaster risk reduction, and social welfare programs.\n• LTS (Literacy Training Service): Focuses on teaching literacy and numeracy to school children and out-of-school youth.\n• ROTC (Reserve Officers' Training Corps): Focuses on military discipline, leadership development, civil defense, and national defense preparedness."
  },
  {
    q: "What activities are conducted under the ROTC Track?",
    category: "ROTC",
    a: "ROTC training includes military drills and ceremonies, marksmanship and weapons familiarization, map reading, basic first aid and combat casualty care, military tactics, disaster response operations, and leadership development conducted every weekend."
  },
  {
    q: "What are the uniform and grooming requirements for ROTC cadets?",
    category: "ROTC",
    a: "Cadets are required to wear the prescribed Army/Naval/Air ROTC Type A or B Uniform (or prescribed fatigue/combat boots and garrison belt), proper military regulation haircut (white side wall for males, hairnet/bun for females), and military ID."
  },
  {
    q: "Is ROTC open to female students?",
    category: "ROTC",
    a: "Yes! Republic Act No. 9163 guarantees equal opportunity. Female cadets undergo the exact same leadership, drill, and tactical training, and can advance to corps commander and commissioned reserve officer ranks."
  },
  {
    q: "What activities are conducted during CWTS community immersion?",
    category: "CWTS",
    a: "CWTS students participate in tree planting and urban gardening, coastal and river cleanups along Cavite shores, health and nutrition educational drives, solid waste management, disaster preparedness drills, and community surveying."
  },
  {
    q: "What is the prescribed attire for CWTS activities?",
    category: "CWTS",
    a: "CWTS students wear the official CvSU NSTP shirt, comfortable dark pants or jogging pants, closed rubber shoes, and their official CvSU NSTP QR ID Card during campus lectures and community immersion."
  },
  {
    q: "What is Literacy Training Service (LTS) and who should enroll?",
    category: "LTS",
    a: "LTS is designed to train students to become teachers of literacy and numeracy to elementary pupils, out-of-school youth, and other marginalized sectors. It is highly recommended for Education, Arts & Sciences, and Communication students, but is open to all degree programs."
  },
  {
    q: "Where are LTS tutorials and teaching sessions conducted?",
    category: "LTS",
    a: "LTS students are deployed to partner public elementary schools, daycare centers, and barangay community learning centers within Naic, Tanza, Maragondon, and nearby Cavite municipalities under instructor supervision."
  },
  {
    q: "What documents are required to enroll online in the NSTP portal?",
    category: "Requirements",
    a: "You need a clear digital photo or PDF of your official CvSU Registration Form (Certificate of Registration / COR) for the current semester, your valid 9-digit Student ID Number, personal contact details, and a 2x2 ID photo."
  },
  {
    q: "What is the minimum attendance requirement to pass NSTP?",
    category: "Policies",
    a: "Students must attend at least 80% to 85% of all scheduled training and community sessions. Unexcused absences exceeding the allowable limit will result in an Incomplete (INC) or Dropped (DRP) grade."
  },
  {
    q: "Is NSTP tuition-free in Cavite State University?",
    category: "Enrollment",
    a: "Yes. Under the Universal Access to Quality Tertiary Education Act (RA 10931 / Free Higher Education), undergraduate Filipino students enrolled in State Universities like CvSU pay zero tuition and school fees for NSTP."
  },
  {
    q: "Can I shift or transfer to another NSTP component between semesters?",
    category: "Policies",
    a: "Under CHED guidelines, students must complete both NSTP 1 and NSTP 2 in the same component. Shifting to another track between semesters is strictly disallowed except under officially approved exceptional medical or administrative petitions."
  },
  {
    q: "What is the NSTP Serial Number and how is it issued?",
    category: "Academics",
    a: "Upon passing both NSTP 1 and NSTP 2, CHED (for CWTS/LTS) or the Department of National Defense / AFP (for ROTC) issues an official National NSTP Serial Number. This number is certified in your Transcript of Records (TOR) and permanent scholastic file."
  },
  {
    q: "What should I do if the online enrollment portal is closed?",
    category: "Enrollment",
    a: "Check the Scheduled Window dates on the landing page. If you missed the deadline or have enrollment issues with your COR, visit the CvSU Naic NSTP Office during office hours or message your department coordinator."
  }
];

function Landing() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [openFaqs, setOpenFaqs] = useState(() => new Set([0]));
  const [faqSearch, setFaqSearch] = useState('');
  const [faqCategory, setFaqCategory] = useState('All');
  const [showAllFaqs, setShowAllFaqs] = useState(false);
  
  // Device Permissions Notice Banner (shown on first load / dismissal stored in localStorage)
  const [showDeviceNotice, setShowDeviceNotice] = useState(() => {
    try {
      return !localStorage.getItem('nstp_device_notice_acknowledged');
    } catch {
      return false;
    }
  });

  const handleDismissDeviceNotice = () => {
    try {
      localStorage.setItem('nstp_device_notice_acknowledged', 'true');
    } catch (_) {}
    setShowDeviceNotice(false);
  };
  
  // Navigation Dropdown & Mobile Menu State
  const [openDropdown, setOpenDropdown] = useState(null); // 'resources' | null
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on Escape key, resize, or back navigation
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    const handlePopState = () => {
      setMobileMenuOpen(false);
    };
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('resize', handleResize);
    };
  }, [mobileMenuOpen]);
  const headerNavRef = useRef(null);

  const timerRef = useRef(null);

  // Live Enrollment Timed Schedule Status
  const [enrollmentStatus, setEnrollmentStatus] = useState(() => calculateEnrollmentStatus());

  useEffect(() => {
    syncEnrollmentScheduleFromServer().then(st => {
      if (st) setEnrollmentStatus(st);
    });
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

  // Detect scroll position to dynamically toggle between Scroll to Bottom (near top) and Scroll to Top (when scrolled)
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
    let cachedVisitors = 80;
    let cachedUsers = 0;
    try {
      cachedVisitors = Math.max(80, parseInt(localStorage.getItem('nstp_cached_total_visitors') || '80', 10));
      cachedUsers = parseInt(localStorage.getItem('nstp_cached_total_users') || '0', 10);
    } catch (_) {}
    return {
      totalVisitors: cachedVisitors,
      totalUsers: cachedUsers,
      totalRegisteredUsers: cachedUsers,
      activeOnlineCount: 1,
      activeUsers: []
    };
  });

  useEffect(() => {
    let isMounted = true;
    
    // Immediate visit registration
    pingTelemetry({ page: '/' }).catch(() => {});

    const pollStats = async () => {
      try {
        const stats = await getTelemetryStats();
        if (stats && isMounted) {
          setTelemetry(prev => ({
            ...stats,
            totalVisitors: stats.totalVisitors !== undefined ? stats.totalVisitors : (prev.totalVisitors || 0)
          }));
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

  const totalVisitorsCount = telemetry.totalVisitors ?? 0;
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
      <header className="sticky top-0 z-50 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 backdrop-blur-xl text-white shadow-xl border-b border-emerald-700/60 transition-all w-full">
        <div className="w-full px-4 sm:px-8 lg:px-12 py-2.5 sm:py-3.5 flex justify-between items-center gap-3 sm:gap-4">
          
          {/* University Identity */}
          <Link to="/" className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1 group">
            <div className="w-8 h-8 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-white rounded-xl sm:rounded-2xl p-0.5 sm:p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-md sm:shadow-lg ring-1.5 sm:ring-2 ring-amber-400/40 group-hover:scale-105 transition-transform duration-300">
              <img src={`${import.meta.env.BASE_URL}cvsu.png`} alt="CvSU Logo" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <h1 className="text-[13px] sm:text-base md:text-lg font-black tracking-tight truncate leading-tight text-white group-hover:text-amber-300 transition-colors">
                  Cavite State University
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

        {/* ── Mobile Backdrop Overlay (Auto-closes when tapping outside) ── */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 top-0 left-0 w-screen h-screen bg-black/65 backdrop-blur-xs z-30 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
            onTouchStart={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* ── Mobile Slide-down Full Drawer Navigation ──────────────────── */}
        {mobileMenuOpen && (
          <div className="relative z-40 lg:hidden bg-emerald-950/98 backdrop-blur-3xl border-t border-emerald-800/90 px-4 py-3.5 space-y-3 animate-slide-up shadow-2xl">
            
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

      {/* ── Modern Hero Section (Hero Carousel & Direct Action CTAs - Full Screen on Desktop) ───── */}
      <section 
        className="relative w-full h-[480px] xs:h-[530px] sm:h-[620px] md:h-[calc(100vh-76px)] min-h-[560px] md:min-h-[660px] lg:min-h-[760px] xl:min-h-[840px] 2xl:min-h-[900px] overflow-hidden bg-gray-950"
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
              className="w-full h-full object-cover object-center transition-transform duration-1000 ease-out"
              loading={index === 0 ? 'eager' : 'lazy'}
            />
            {/* Rich Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/65 to-transparent flex flex-col justify-end p-5 xs:p-6 sm:p-12 md:p-16 lg:p-24 pb-7 xs:pb-8 sm:pb-14 md:pb-20">
              <div className={`max-w-5xl transition-all duration-700 delay-150 ${
                index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
              }`}>
                <span className="inline-flex items-center bg-emerald-500/90 text-white font-black text-[10px] xs:text-xs sm:text-sm px-3.5 sm:px-5 py-1 sm:py-1.5 rounded-full uppercase tracking-wider mb-2.5 sm:mb-4 shadow-lg backdrop-blur-md border border-emerald-400/40">
                  <span>{image.badge}</span>
                </span>
                
                <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black text-white drop-shadow-xl leading-tight max-w-5xl tracking-tight">
                  {image.title}
                </h2>
                
                <p className="text-emerald-100 text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl max-w-3xl mt-1.5 sm:mt-4 font-medium leading-relaxed drop-shadow">
                  {image.subtitle}
                </p>

                {/* Hero Immediate Action Buttons */}
                <div className="mt-4 sm:mt-8 flex flex-row items-center gap-2.5 sm:gap-4 max-w-md sm:max-w-none">
                  <Link
                    to="/enrollment"
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 sm:gap-3 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-emerald-950 font-black px-4 sm:px-9 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-base shadow-xl shadow-amber-950/40 hover:shadow-2xl hover:shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all text-center whitespace-nowrap"
                  >
                    <span>Apply for Enrollment</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => scrollToSection('guide')}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 sm:gap-2.5 bg-emerald-900/80 hover:bg-emerald-800/90 text-white font-bold px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-base backdrop-blur-md border border-emerald-600/70 hover:border-emerald-400 active:scale-95 transition-all cursor-pointer shadow-lg text-center whitespace-nowrap"
                  >
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 shrink-0" />
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
          className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 z-20 w-13 h-13 rounded-2xl bg-black/40 hover:bg-black/75 text-white items-center justify-center backdrop-blur-md border border-white/20 hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-2xl"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
        <button
          type="button"
          onClick={nextSlide}
          aria-label="Next Slide"
          className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 z-20 w-13 h-13 rounded-2xl bg-black/40 hover:bg-black/75 text-white items-center justify-center backdrop-blur-md border border-white/20 hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-2xl"
        >
          <ChevronRight className="w-7 h-7" />
        </button>

        {/* Carousel Indicators */}
        <div className="absolute top-4 right-4 sm:top-auto sm:bottom-8 sm:right-12 flex space-x-1.5 sm:space-x-2.5 z-20 bg-black/30 sm:bg-transparent backdrop-blur-xs sm:backdrop-blur-none p-1.5 sm:p-0 rounded-full border border-white/10 sm:border-0">
          {CAROUSEL_IMAGES.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentSlide(index);
                startTimer();
              }}
              className={`h-2 sm:h-3.5 rounded-full transition-all duration-300 cursor-pointer ${
                index === currentSlide ? 'w-6 sm:w-14 bg-amber-400 shadow-md' : 'w-2 sm:w-3.5 bg-white/40 hover:bg-white/80'
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
                    ? 'bg-emerald-600 text-white shadow-emerald-950/50'
                    : 'bg-rose-600 text-white shadow-rose-950/50'
                }`}>
                  {enrollmentStatus.isOpen ? <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7" /> : <Clock className="w-6 h-6 sm:w-7 sm:h-7" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-black text-white leading-tight">{enrollmentStatus.headline}</h3>
                    <span className={`text-[10px] sm:text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      enrollmentStatus.isOpen ? 'bg-emerald-500 text-white animate-pulse' : 'bg-rose-500 text-white'
                    }`}>
                      {enrollmentStatus.isOpen ? 'Portal Active' : 'Portal Closed'}
                    </span>
                  </div>
                  <p className="text-emerald-100 text-xs sm:text-sm mt-1.5 font-medium leading-relaxed">
                    {enrollmentStatus.subtext}
                  </p>
                  {enrollmentStatus.customNotice && (
                    <div className="mt-2 max-w-full">
                      <div className="text-amber-200 text-[10.5px] sm:text-xs font-semibold bg-emerald-950/90 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border border-amber-400/30 flex items-center gap-1.5 shadow-xs max-w-full text-left">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                        <span className="truncate sm:whitespace-normal font-medium">{enrollmentStatus.customNotice}</span>
                      </div>
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

      {/* ── Mobile-Optimized Executive FAQ Section (Distinctive Card Layout) ────────── */}
      <section id="faq" className="py-12 sm:py-16 px-3.5 sm:px-6 bg-gradient-to-b from-slate-50 via-emerald-50/25 to-slate-50 border-t border-slate-200/80">
        <div className="max-w-5xl mx-auto">
          {/* Header Banner */}
          <div className="text-center mb-6 sm:mb-8">
            <span className="inline-flex items-center gap-1.5 bg-emerald-100/90 text-emerald-900 text-[11px] sm:text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-2xs border border-emerald-200/80">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>Student FAQ &amp; Knowledge Base</span>
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mt-2.5 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-xl mx-auto font-medium">
              Find instant answers regarding NSTP enrollment, ROTC/CWTS/LTS tracks, units, and campus policies.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-4">
            <div className="relative group">
              <Search className="w-4 h-4 text-slate-400 group-focus-within:text-emerald-700 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
              <input
                type="text"
                id="faq-search-input"
                name="faqSearch"
                value={faqSearch}
                onChange={(e) => {
                  setFaqSearch(e.target.value);
                  if (e.target.value) setShowAllFaqs(true);
                }}
                placeholder="Search keywords (e.g. graduation, CWTS, documents, units)..."
                className="w-full pl-10 pr-9 py-2.5 sm:py-3 bg-white rounded-2xl border-2 border-slate-200 text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 shadow-xs transition-all"
              />
              {faqSearch && (
                <button
                  type="button"
                  onClick={() => setFaqSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center text-xs transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills — Clean Wrapped Layout (No Cutoffs) */}
          <div className="max-w-3xl mx-auto mb-5">
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
              {[
                { name: 'All', count: FAQ_ITEMS.length },
                { name: 'Enrollment', count: FAQ_ITEMS.filter(f => f.category === 'Enrollment').length },
                { name: 'CWTS', count: FAQ_ITEMS.filter(f => f.category === 'CWTS').length },
                { name: 'ROTC', count: FAQ_ITEMS.filter(f => f.category === 'ROTC').length },
                { name: 'LTS', count: FAQ_ITEMS.filter(f => f.category === 'LTS').length },
                { name: 'Academics', count: FAQ_ITEMS.filter(f => f.category === 'Academics').length },
                { name: 'Policies', count: FAQ_ITEMS.filter(f => f.category === 'Policies').length }
              ].map((cat) => {
                const isActive = faqCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => {
                      setFaqCategory(cat.name);
                      setOpenFaqs(new Set([0]));
                    }}
                    className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 select-none ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-800 to-teal-900 text-white shadow-sm ring-2 ring-emerald-600/30 scale-102'
                        : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-black ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex items-center justify-between mt-3 px-1 text-xs text-slate-500">
              <span className="font-semibold text-[11px]">
                Showing <strong>{filteredFaqs.length}</strong> {filteredFaqs.length === 1 ? 'question' : 'questions'}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (openFaqs.size === filteredFaqs.length) {
                    setOpenFaqs(new Set());
                  } else {
                    setOpenFaqs(new Set(filteredFaqs.map((_, i) => i)));
                  }
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-emerald-800 hover:bg-emerald-50 text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
              >
                <Layers className="w-3 h-3 text-emerald-700" />
                <span>{openFaqs.size === filteredFaqs.length ? 'Collapse All' : 'Expand All'}</span>
              </button>
            </div>
          </div>

          {/* FAQ Accordion List (Clean Mobile-First Stack) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5 items-start">
            {filteredFaqs.length > 0 ? (
              (showAllFaqs || faqSearch || faqCategory !== 'All' 
                ? filteredFaqs 
                : filteredFaqs.slice(0, 8)
              ).map((item, idx) => {
                const isOpen = openFaqs.has(idx);

                // Category theme styles
                let categoryAccent = 'border-l-emerald-600';
                let categoryBadge = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                if (item.category === 'ROTC') {
                  categoryAccent = 'border-l-rose-600';
                  categoryBadge = 'bg-rose-50 text-rose-800 border-rose-200';
                } else if (item.category === 'LTS') {
                  categoryAccent = 'border-l-sky-600';
                  categoryBadge = 'bg-sky-50 text-sky-800 border-sky-200';
                } else if (item.category === 'Enrollment') {
                  categoryAccent = 'border-l-amber-500';
                  categoryBadge = 'bg-amber-50 text-amber-900 border-amber-200';
                } else if (item.category === 'Academics') {
                  categoryAccent = 'border-l-indigo-600';
                  categoryBadge = 'bg-indigo-50 text-indigo-800 border-indigo-200';
                } else if (item.category === 'Policies') {
                  categoryAccent = 'border-l-purple-600';
                  categoryBadge = 'bg-purple-50 text-purple-800 border-purple-200';
                }

                return (
                  <div 
                    key={idx} 
                    className={`col-span-1 bg-white rounded-2xl border border-l-4 ${categoryAccent} transition-all duration-200 overflow-hidden ${
                      isOpen 
                        ? 'border-t-emerald-400 border-r-emerald-400 border-b-emerald-400 shadow-md ring-2 ring-emerald-500/10' 
                        : 'border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setOpenFaqs(prev => {
                          const next = new Set(prev);
                          if (next.has(idx)) {
                            next.delete(idx);
                          } else {
                            next.add(idx);
                          }
                          return next;
                        });
                      }}
                      aria-expanded={isOpen}
                      className="w-full p-3.5 sm:p-4 flex items-start justify-between text-left gap-3 transition-colors cursor-pointer group select-none"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-[9.5px] font-black text-slate-400 font-mono">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.2 rounded-md border ${categoryBadge}`}>
                            {item.category}
                          </span>
                        </div>
                        <h4 className={`text-xs sm:text-[13.5px] leading-snug transition-colors ${
                          isOpen ? 'font-black text-emerald-950' : 'font-bold text-slate-800 group-hover:text-emerald-800'
                        }`}>
                          {item.q}
                        </h4>
                      </div>
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 mt-0.5 ${
                        isOpen 
                          ? 'bg-emerald-700 text-white rotate-180 shadow-xs' 
                          : 'bg-slate-100 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-800'
                      }`}>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </div>
                    </button>

                    {/* Animated Answer Box */}
                    <div 
                      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                        isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="px-3.5 sm:px-4 pb-3.5 sm:pb-4 pt-2 text-xs sm:text-[13px] text-slate-700 leading-relaxed border-t border-slate-100 bg-gradient-to-b from-slate-50/60 to-white">
                          <div className="flex gap-2 items-start">
                            <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                            <div className="flex-1 whitespace-pre-line text-slate-700 font-medium leading-relaxed">
                              {item.a}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-600 shadow-2xs">
                <AlertCircle className="w-7 h-7 text-amber-500 mx-auto mb-1.5" />
                <p className="font-bold text-xs sm:text-sm text-slate-800">No matching questions found</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Try searching with a different keyword or reset your filter.</p>
                <button
                  type="button"
                  onClick={() => { setFaqSearch(''); setFaqCategory('All'); }}
                  className="mt-2.5 px-3.5 py-1 rounded-xl bg-emerald-800 text-white text-xs font-bold hover:bg-emerald-900 transition-all cursor-pointer"
                >
                  Reset Filter
                </button>
              </div>
            )}
          </div>

          {/* Toggle to Show More/Fewer Questions when browsing All */}
          {!faqSearch && faqCategory === 'All' && filteredFaqs.length > 8 && (
            <div className="text-center mt-5">
              <button
                type="button"
                onClick={() => setShowAllFaqs(!showAllFaqs)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border-2 border-emerald-300 text-emerald-900 hover:bg-emerald-50 text-xs font-black shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <span>{showAllFaqs ? 'Show Fewer Questions' : `View All ${filteredFaqs.length} Questions`}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showAllFaqs ? 'rotate-180 text-emerald-700' : ''}`} />
              </button>
            </div>
          )}

          {/* Support Prompt Card */}
          <div className="mt-7 bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 rounded-2xl p-4 sm:p-5 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black shrink-0 shadow-md">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black">Still have questions about NSTP?</h4>
                <p className="text-[11px] text-emerald-200">Reach out to campus coordinators or visit the NSTP office at CvSU Naic.</p>
              </div>
            </div>
            <a
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              Contact Support
            </a>
          </div>
        </div>
      </section>

      {/* ── Modern Executive Footer ───────────────────────────────────── */}
      <footer id="contact" className="bg-emerald-950 text-white relative overflow-hidden w-full">
        <div className="w-full px-4 sm:px-8 lg:px-12 py-6 sm:py-12 relative z-10">
          <div className="grid grid-cols-2 gap-3 sm:gap-8 items-start">
            
            {/* About (Left Side) */}
            <div className="min-w-0">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-xl sm:rounded-2xl p-0.5 sm:p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-md ring-1.5 sm:ring-2 ring-amber-400/40">
                  <img src={`${import.meta.env.BASE_URL}cvsu.png`} alt="CvSU Logo" className="w-full h-full object-contain" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-lg md:text-xl font-black leading-tight text-white truncate">Cavite State University</h4>
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
                    href="https://cvsu-naic.edu.ph/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors flex items-center justify-end gap-1 sm:gap-1.5 group max-w-full truncate"
                    title="Cavite State University Naic Campus Official Website"
                  >
                    <span className="text-[9.5px] xs:text-[11px] sm:text-sm group-hover:underline truncate">cvsu-naic.edu.ph</span>
                    <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
                  </a>
                </li>
                <li className="w-full flex items-center justify-end gap-1.5 sm:gap-2">
                  <a
                    href="https://web.facebook.com/cvsunaicpio?_rdc=1&_rdr#"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors flex items-center justify-end gap-1 sm:gap-1.5 group max-w-full truncate"
                    title="Cavite State University - Naic Official Facebook Page"
                  >
                    <span className="text-[9.5px] xs:text-[11px] sm:text-sm group-hover:underline truncate">Cavite State University - Naic</span>
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
        <div className="border-t border-emerald-900/80 bg-emerald-900/50 py-2.5 sm:py-3.5 px-4 sm:px-8 lg:px-12 w-full">
          <div className="w-full flex flex-row items-center justify-between gap-2">
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
              {/* Total Visitors */}
              <div className="flex items-center gap-1.5 sm:gap-2 bg-emerald-900/80 border border-emerald-800 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl shadow-xs">
                <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                <div>
                  <p className="text-[7.5px] sm:text-[8.5px] uppercase font-extrabold text-emerald-300 tracking-wider leading-none">Total Visitors</p>
                  <p className="text-[11px] sm:text-sm font-black text-amber-400 leading-tight mt-0.5">
                    {totalVisitorsCount.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Active Online Visitors (Pulsing Green Indicator) */}
              <div className="flex items-center gap-1.5 sm:gap-2 bg-emerald-800/90 border border-emerald-600/80 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl shadow-xs">
                <div className="relative flex h-2.5 w-2.5 items-center justify-center shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
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
        <div className="border-t border-emerald-900 py-3.5 sm:py-4 px-4 sm:px-8 lg:px-12 w-full">
          <div className="w-full flex justify-between items-center text-[10px] sm:text-xs text-emerald-400 font-medium">
            <p>© {new Date().getFullYear()} Cavite State University Naic Campus • NSTP System</p>
            <p className="text-emerald-300/70 hidden sm:block">National Service Training Program</p>
          </div>
        </div>
      </footer>

      {/* Smart Single Floating Guided Scroll Button (Arrow Down when near top, Arrow Up when scrolled down) */}
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

      {/* Device & Privacy Permissions Notice Modal / Floating Banner */}
      {/* Mobile-Style Top Push Notification Alert Banner */}
      {showDeviceNotice && (
        <div className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 w-[94%] max-w-lg z-50 transition-all duration-300">
          <div className="bg-emerald-950/95 backdrop-blur-xl border border-emerald-500/40 rounded-2xl p-3 sm:p-4 shadow-2xl text-white ring-1 ring-white/10">
            {/* Header row like a phone push notification */}
            <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-emerald-800/80">
              <div className="flex items-center gap-2">
                <img src="./cvsu.png" alt="CvSU" className="w-5 h-5 rounded-full bg-white p-0.5" />
                <span className="text-[11px] font-black text-amber-300 uppercase tracking-wider">CvSU Naic NSTP</span>
                <span className="text-[10px] text-emerald-400 font-medium">• just now</span>
              </div>
              <button
                type="button"
                onClick={handleDismissDeviceNotice}
                className="w-6 h-6 rounded-full bg-emerald-900/80 hover:bg-emerald-800 flex items-center justify-center text-emerald-300 hover:text-white transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Alert Message */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0 mt-0.5">
                <Shield className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs sm:text-sm font-black text-white leading-tight">Device Capabilities &amp; Privacy Notice</h4>
                <p className="text-[11px] text-emerald-100/90 leading-relaxed mt-1">
                  This portal utilizes your device <strong>Camera</strong> (2x2 ID &amp; COR scan), <strong>Microphone</strong> (Voice notes), and <strong>Storage</strong> for official academic enrollment &amp; communications.
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-emerald-900/80">
              <Link
                to="/enrollment"
                onClick={handleDismissDeviceNotice}
                className="text-[10px] sm:text-xs text-amber-300 hover:text-amber-200 font-bold underline"
              >
                Go to Enrollment &rarr;
              </Link>
              <button
                type="button"
                onClick={handleDismissDeviceNotice}
                className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl shadow-sm transition-all cursor-pointer active:scale-95"
              >
                Allow &amp; Continue
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Landing;