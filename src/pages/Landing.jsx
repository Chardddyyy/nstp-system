import { Link } from 'react-router-dom';
import { 
  Shield, Users, GraduationCap, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, 
  Target, Eye, BookOpen, MapPin, Phone, Mail, Facebook, Globe, Award, Sparkles, 
  CheckCircle2, Activity, Clock, Play, Film, ArrowRight, HelpCircle, Compass, Check
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getTelemetryStats } from '../services/api';
import { calculateEnrollmentStatus } from '../utils/enrollmentSchedule';

// Carousel images - using actual CvSU Naic campus photos
const CAROUSEL_IMAGES = [
  {
    src: `${import.meta.env.BASE_URL}cvsunaiccampus.png`,
    title: "Welcome to CvSU Naic NSTP",
    subtitle: "Building Tomorrow's Leaders Through National Service & Civic Excellence",
    badge: "Official Campus Portal",
    track: "all"
  },
  {
    src: `${import.meta.env.BASE_URL}IMG_9578.JPG`,
    title: "ROTC Leadership & Defense",
    subtitle: "Developing Military Preparedness, Discipline, Patriotism & Integrity",
    badge: "Reserve Officers' Training Corps",
    track: "ROTC"
  },
  {
    src: `${import.meta.env.BASE_URL}cwts-cover.jpg`,
    title: "CWTS Community Service",
    subtitle: "Serving Local Communities with Compassion, Health Care & Civic Welfare",
    badge: "Civic Welfare Training Service",
    track: "CWTS"
  },
  {
    src: `${import.meta.env.BASE_URL}lts-cover.jpg`,
    title: "LTS Literacy Program",
    subtitle: "Empowering Children & Out-of-School Youth Through Quality Education",
    badge: "Literacy Training Service",
    track: "LTS"
  }
];

const FAQ_ITEMS = [
  {
    q: "Who is required to take NSTP?",
    a: "Under Republic Act No. 9163 (NSTP Law of 2001), all male and female students enrolled in any baccalaureate degree or two-year technical-vocational course in Higher Education Institutions (HEIs) are required to complete one (1) NSTP component as a graduation requirement."
  },
  {
    q: "How many units and semesters is the NSTP course?",
    a: "NSTP is a 6-credit-unit course taken across two (2) consecutive semesters: NSTP 1 (3 Units) during the First Semester and NSTP 2 (3 Units) during the Second Semester under the same component chosen."
  },
  {
    q: "How do I choose between CWTS, LTS, and ROTC?",
    a: "Students may freely choose based on their interests and career goals:\n• CWTS (Civic Welfare Training Service): Focuses on community health, environmental sanitation, safety, and civic betterment.\n• LTS (Literacy Training Service): Focuses on teaching literacy and numeracy to school children and out-of-school youth.\n• ROTC (Reserve Officers' Training Corps): Focuses on military discipline, leadership, civil defense, and disaster preparedness."
  },
  {
    q: "What documents are required to enroll online?",
    a: "You need a copy/photo of your official CvSU Registration Form (Certificate of Registration / COR) showing your enrolled subjects for the semester, your 9-digit Student ID Number, and your active email address."
  },
  {
    q: "Can I transfer or shift to another NSTP component?",
    a: "Generally, students must complete both NSTP 1 and NSTP 2 in the same component. Any exceptional request to transfer components must be requested through and approved by the NSTP Campus Coordinator before the start of the semester."
  },
  {
    q: "What should I do if the online portal is closed?",
    a: "Please check the Scheduled Opening banner on the landing page for the official enrollment window dates. If you missed the schedule or have special concerns, visit the NSTP Office located at CvSU Naic Campus."
  }
];

function Landing() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeComponentModal, setActiveComponentModal] = useState(null);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
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
  const [telemetry, setTelemetry] = useState({
    totalVisitors: 47,
    totalUsers: 47,
    activeOnlineCount: 1,
    activeUsers: []
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

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans selection:bg-emerald-600 selection:text-white relative">

      {/* ── Premium Modern Glassmorphic Header ───────────────────────── */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 backdrop-blur-xl text-white shadow-xl border-b border-emerald-700/60 transition-all">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex justify-between items-center gap-3">
          
          {/* Logo & University Identity */}
          <Link to="/" className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0 flex-1 group">
            <div className="w-9 h-9 sm:w-12 sm:h-12 bg-white rounded-2xl p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-lg ring-2 ring-amber-400/40 group-hover:scale-105 transition-transform duration-300">
              <img src={`${import.meta.env.BASE_URL}cvsu.png`} alt="CvSU Logo" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs sm:text-base md:text-lg font-black tracking-tight truncate leading-tight text-white group-hover:text-amber-300 transition-colors">
                  Cavite State University
                </h1>
                <span className="hidden sm:inline-block bg-amber-400 text-emerald-950 font-black text-[9px] px-1.5 py-0.2 rounded font-mono uppercase tracking-wider">
                  Naic
                </span>
              </div>
              <p className="text-emerald-300 text-[10px] sm:text-xs truncate font-medium flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                National Service Training Program Portal
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1 text-xs font-bold text-emerald-100/90">
            <button 
              type="button" 
              onClick={() => scrollToSection('programs')} 
              className="px-3.5 py-2 rounded-xl hover:bg-white/10 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Programs</span>
            </button>
            
            <button 
              type="button" 
              onClick={() => scrollToSection('schedule')} 
              className="px-3.5 py-2 rounded-xl hover:bg-white/10 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Schedule</span>
              {enrollmentStatus.isOpen ? (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              ) : null}
            </button>

            <button 
              type="button" 
              onClick={() => scrollToSection('guide')} 
              className="px-3.5 py-2 rounded-xl hover:bg-white/10 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>How to Enroll</span>
            </button>

            <button 
              type="button" 
              onClick={() => scrollToSection('video')} 
              className="px-3.5 py-2 rounded-xl hover:bg-white/10 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Orientation</span>
            </button>

            <button 
              type="button" 
              onClick={() => scrollToSection('faq')} 
              className="px-3.5 py-2 rounded-xl hover:bg-white/10 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>FAQ</span>
            </button>

            <button 
              type="button" 
              onClick={() => scrollToSection('contact')} 
              className="px-3.5 py-2 rounded-xl hover:bg-white/10 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Contact</span>
            </button>
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              to="/enrollment"
              className="inline-flex items-center gap-1.5 bg-emerald-800/80 hover:bg-emerald-700 text-white font-bold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm border border-emerald-600/70 active:scale-95 transition-all shadow-sm hover:shadow-md hover:border-emerald-400 shrink-0"
              title="Online Enrollment Application"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Enrollment</span>
            </Link>

            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-emerald-950 font-black px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-amber-950/30 hover:shadow-lg hover:shadow-amber-500/20 active:scale-95 shrink-0"
            >
              <span>Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Mobile Modern Navigation Pills */}
        <div className="lg:hidden bg-emerald-950/95 border-t border-emerald-800/70 px-3 py-2 overflow-x-auto no-scrollbar flex items-center space-x-2 text-[11px] font-bold text-emerald-100">
          <button 
            type="button" 
            onClick={() => scrollToSection('programs')} 
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-emerald-700/50 whitespace-nowrap active:scale-95 flex items-center gap-1"
          >
            <Compass className="w-3 h-3 text-amber-400" />
            <span>Programs</span>
          </button>
          
          <button 
            type="button" 
            onClick={() => scrollToSection('schedule')} 
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-emerald-700/50 whitespace-nowrap active:scale-95 flex items-center gap-1"
          >
            <Clock className="w-3 h-3 text-emerald-400" />
            <span>Schedule</span>
          </button>

          <button 
            type="button" 
            onClick={() => scrollToSection('guide')} 
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-emerald-700/50 whitespace-nowrap active:scale-95 flex items-center gap-1"
          >
            <BookOpen className="w-3 h-3 text-amber-400" />
            <span>Guide</span>
          </button>

          <button 
            type="button" 
            onClick={() => scrollToSection('video')} 
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-emerald-700/50 whitespace-nowrap active:scale-95 flex items-center gap-1"
          >
            <Play className="w-3 h-3 text-emerald-400" />
            <span>Video</span>
          </button>

          <button 
            type="button" 
            onClick={() => scrollToSection('faq')} 
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-emerald-700/50 whitespace-nowrap active:scale-95 flex items-center gap-1"
          >
            <HelpCircle className="w-3 h-3 text-amber-400" />
            <span>FAQ</span>
          </button>

          <button 
            type="button" 
            onClick={() => scrollToSection('contact')} 
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-emerald-700/50 whitespace-nowrap active:scale-95 flex items-center gap-1"
          >
            <Phone className="w-3 h-3 text-emerald-400" />
            <span>Contact</span>
          </button>
        </div>
      </header>

      {/* Hero Carousel Section with Premium Action Buttons */}
      <section 
        className="relative h-[400px] xs:h-[450px] sm:h-[500px] md:h-[560px] lg:h-[620px] overflow-hidden bg-gray-950"
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
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/65 to-transparent flex flex-col justify-end p-5 sm:p-10 md:p-14 lg:p-20">
              <div className={`max-w-4xl transition-all duration-700 delay-150 ${
                index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
              }`}>
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/90 text-white font-black text-xs sm:text-sm px-4 py-1.5 rounded-full uppercase tracking-wider mb-2.5 sm:mb-4 shadow-lg backdrop-blur-md border border-emerald-400/40">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{image.badge}</span>
                </span>
                
                <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white drop-shadow-md leading-tight max-w-3xl">
                  {image.title}
                </h2>
                
                <p className="text-emerald-100 text-xs sm:text-base md:text-lg max-w-2xl mt-2 sm:mt-3 font-medium leading-relaxed">
                  {image.subtitle}
                </p>

                {/* Hero Immediate Action Buttons */}
                <div className="mt-5 sm:mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
                  <Link
                    to="/enrollment"
                    className="inline-flex items-center gap-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-emerald-950 font-black px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl text-xs sm:text-base shadow-xl shadow-amber-950/40 hover:shadow-2xl hover:shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-950" />
                    <span>Apply for Enrollment</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => scrollToSection('programs')}
                    className="inline-flex items-center gap-2 bg-emerald-900/60 hover:bg-emerald-800/80 text-white font-bold px-5 sm:px-7 py-3 sm:py-3.5 rounded-2xl text-xs sm:text-base backdrop-blur-md border border-emerald-600/70 hover:border-emerald-400 active:scale-95 transition-all cursor-pointer shadow-lg"
                  >
                    <Compass className="w-4 h-4 text-amber-300" />
                    <span>Explore Tracks</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Carousel Desktop Left & Right Arrow Navigation */}
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

        {/* Indicators */}
        <div className="absolute bottom-4 sm:bottom-6 right-5 sm:right-12 flex space-x-2 z-20">
          {CAROUSEL_IMAGES.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentSlide(index);
                startTimer();
              }}
              className={`h-2.5 sm:h-3 rounded-full transition-all duration-300 cursor-pointer ${
                index === currentSlide ? 'w-8 sm:w-12 bg-amber-400' : 'w-2.5 sm:w-3 bg-white/40 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Academic Overview Stats Banner */}
      <section className="bg-emerald-900 text-white border-y border-emerald-800 py-6 sm:py-9 px-4 sm:px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 text-center relative z-10">
          
          <div className="p-4 sm:p-6 bg-white/5 hover:bg-white/10 rounded-2xl sm:rounded-3xl border border-white/10 transition-all flex flex-col justify-center items-center shadow-xs">
            <Award className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400 mb-2" />
            <p className="text-base sm:text-2xl font-black text-amber-400 leading-tight">6 Credit Units</p>
            <p className="text-xs sm:text-sm text-emerald-200 font-semibold mt-1">3 Units / Semester</p>
          </div>

          <div className="p-4 sm:p-6 bg-white/5 hover:bg-white/10 rounded-2xl sm:rounded-3xl border border-white/10 transition-all flex flex-col justify-center items-center shadow-xs">
            <Compass className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-300 mb-2" />
            <p className="text-base sm:text-2xl font-black text-white leading-tight">3 Components</p>
            <p className="text-xs sm:text-sm text-emerald-200 font-semibold mt-1">CWTS • ROTC • LTS</p>
          </div>

          <div className="p-4 sm:p-6 bg-white/5 hover:bg-white/10 rounded-2xl sm:rounded-3xl border border-white/10 transition-all flex flex-col justify-center items-center shadow-xs">
            <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400 mb-2" />
            <p className="text-base sm:text-2xl font-black text-amber-400 leading-tight">2 Semesters</p>
            <p className="text-xs sm:text-sm text-emerald-200 font-semibold mt-1">1 Academic Year</p>
          </div>

          <div className="p-4 sm:p-6 bg-white/5 hover:bg-white/10 rounded-2xl sm:rounded-3xl border border-white/10 transition-all flex flex-col justify-center items-center shadow-xs">
            <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-teal-300 mb-2" />
            <p className="text-base sm:text-2xl font-black text-white leading-tight">R.A. 9163</p>
            <p className="text-xs sm:text-sm text-emerald-200 font-semibold mt-1">Accredited Law</p>
          </div>

        </div>
      </section>

      {/* Enrollment Schedule & Status Section */}
      <section id="schedule" className="py-10 sm:py-16 px-4 sm:px-6 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white relative overflow-hidden border-b border-emerald-800">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">

          {/* Schedule Status Card */}
          <div className="mb-8 p-5 sm:p-7 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl max-w-2xl mx-auto text-left">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                  enrollmentStatus.isOpen
                    ? 'bg-emerald-500 text-white shadow-emerald-900/50'
                    : 'bg-amber-400 text-emerald-950'
                }`}>
                  {enrollmentStatus.isOpen ? <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" /> : <Clock className="w-6 h-6 sm:w-7 sm:h-7" />}
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
                    <p className="text-amber-300 text-xs font-bold mt-2 bg-black/30 px-3 py-1 rounded-xl inline-block border border-amber-400/20 leading-snug">
                      📢 {enrollmentStatus.customNotice}
                    </p>
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

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 text-white">Ready to Start Your NSTP Journey?</h2>
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

      {/* History, Mission, and Vision Section */}
      <section className="py-12 sm:py-20 px-4 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          
          {/* History */}
          <div className="mb-12 sm:mb-20">
            <div className="text-center mb-7">
              <div className="w-14 h-14 sm:w-18 sm:h-18 bg-emerald-100 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto mb-3.5 shadow-inner">
                <BookOpen className="w-7 h-7 sm:w-9 sm:h-9" />
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900">Cavite State University Naic Campus</h2>
              <p className="text-emerald-700 font-bold text-xs sm:text-base mt-1.5">National Service Training Program Office</p>
            </div>
            
            <div className="max-w-3xl mx-auto text-center bg-emerald-50/60 p-6 sm:p-10 rounded-3xl border border-emerald-100 shadow-xs">
              <p className="text-gray-700 leading-relaxed text-xs sm:text-base md:text-lg">
                Cavite State University Naic Campus is a premier institution dedicated to providing quality tertiary education in Cavite. Through the National Service Training Program (NSTP), CvSU Naic equips students with academic competence, civic responsibility, and moral leadership to serve the nation.
              </p>
            </div>
          </div>

          {/* Mission and Vision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
            <div className="bg-emerald-50/80 rounded-3xl p-6 sm:p-10 border border-emerald-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mr-4 shadow-sm shrink-0">
                  <Target className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div>
                  <h3 className="text-base sm:text-xl font-black text-emerald-900 leading-tight">Our Mission</h3>
                  <p className="text-xs text-emerald-700 font-semibold">Cavite State University</p>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed text-xs sm:text-sm">
                Cavite State University shall provide excellent, equitable and relevant educational opportunities in the arts, sciences and technology through quality instruction and responsive research and development activities. It shall produce professional, skilled and morally upright individuals for global competitiveness.
              </p>
            </div>

            <div className="bg-amber-50/80 rounded-3xl p-6 sm:p-10 border border-amber-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-amber-500 text-white rounded-2xl flex items-center justify-center mr-4 shadow-sm shrink-0">
                  <Eye className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div>
                  <h3 className="text-base sm:text-xl font-black text-amber-950 leading-tight">Our Vision</h3>
                  <p className="text-xs text-amber-700 font-semibold">Cavite State University</p>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed text-xs sm:text-sm">
                The premier university in historic Cavite globally recognized for excellence in character development, academics, research, innovation and sustainable community engagement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive NSTP Program Components Section */}
      <section id="programs" className="py-12 sm:py-20 px-4 sm:px-6 bg-slate-100/70 border-t border-gray-200/70 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-8 sm:mb-14">
            <span className="bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-2xs">
              Program Components
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mt-3">Explore NSTP Offerings</h2>
            <p className="text-gray-600 text-xs sm:text-base mt-1.5">Tap any track below to review syllabus specifics, field activities, and enrollment criteria</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
            
            {/* ROTC Card */}
            <div
              className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
              onClick={() => setActiveComponentModal('ROTC')}
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-14 h-14 bg-rose-600 text-white rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-md shrink-0">
                    <Shield className="w-7 h-7" />
                  </div>
                  <span className="text-xs bg-rose-100 text-rose-800 font-black px-3 py-1 rounded-full">Defense Track</span>
                </div>
                
                <h3 className="text-lg sm:text-2xl font-black text-rose-900 mb-1">ROTC</h3>
                <p className="text-xs font-bold text-gray-500 mb-3">Reserve Officers' Training Corps</p>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-6">
                  Military-based training designed for national defense preparedness, discipline, drills, disaster response, and leadership ethics.
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button
                  type="button"
                  className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded-xl text-xs font-black transition-all flex items-center justify-between shadow-2xs group-hover:shadow-md"
                >
                  <span>View Details & Requirements</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
                </button>
              </div>
            </div>

            {/* CWTS Card */}
            <div
              className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
              onClick={() => setActiveComponentModal('CWTS')}
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-md shrink-0">
                    <Users className="w-7 h-7" />
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-black px-3 py-1 rounded-full">Civic Track</span>
                </div>
                
                <h3 className="text-lg sm:text-2xl font-black text-emerald-900 mb-1">CWTS</h3>
                <p className="text-xs font-bold text-gray-500 mb-3">Civic Welfare Training Service</p>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-6">
                  Community-driven programs contributing to general welfare, public health, coastal protection, environmental tree planting, and civic leadership.
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button
                  type="button"
                  className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-xl text-xs font-black transition-all flex items-center justify-between shadow-2xs group-hover:shadow-md"
                >
                  <span>View Details & Requirements</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
                </button>
              </div>
            </div>

            {/* LTS Card */}
            <div
              className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
              onClick={() => setActiveComponentModal('LTS')}
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-14 h-14 bg-purple-600 text-white rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-md shrink-0">
                    <GraduationCap className="w-7 h-7" />
                  </div>
                  <span className="text-xs bg-purple-100 text-purple-800 font-black px-3 py-1 rounded-full">Literacy Track</span>
                </div>
                
                <h3 className="text-lg sm:text-2xl font-black text-purple-900 mb-1">LTS</h3>
                <p className="text-xs font-bold text-gray-500 mb-3">Literacy Training Service</p>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-6">
                  Specialized program training college students to teach reading, writing, and numeracy to school children and out-of-school youth in Cavite.
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button
                  type="button"
                  className="w-full py-2.5 px-4 bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white rounded-xl text-xs font-black transition-all flex items-center justify-between shadow-2xs group-hover:shadow-md"
                >
                  <span>View Details & Requirements</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Component Details Modal */}
      {activeComponentModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setActiveComponentModal(null)}>
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-100">
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-2xl text-white flex items-center justify-center font-bold shadow-md ${
                  activeComponentModal === 'ROTC' ? 'bg-rose-600' : activeComponentModal === 'CWTS' ? 'bg-emerald-600' : 'bg-purple-600'
                }`}>
                  {activeComponentModal === 'ROTC' ? <Shield className="w-6 h-6" /> : activeComponentModal === 'CWTS' ? <Users className="w-6 h-6" /> : <GraduationCap className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-gray-900">{activeComponentModal} Component</h3>
                  <p className="text-xs text-gray-500 font-medium">Official CvSU Naic NSTP Module</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setActiveComponentModal(null)} 
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center text-sm font-black transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-gray-700">
              <div className="p-4 sm:p-5 bg-gray-50 rounded-2xl border border-gray-200/80">
                <p className="font-black text-gray-900 mb-2.5 text-xs sm:text-sm">Key Focus Areas & Activities:</p>
                <ul className="space-y-2.5">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">{activeComponentModal === 'ROTC' ? 'Military Drill, Ceremonial Formations & Marksmanship' : activeComponentModal === 'CWTS' ? 'Community Health, Hygiene & Nutrition Outreach' : 'Basic Reading, Writing & Numeracy Modules'}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">{activeComponentModal === 'ROTC' ? 'Disaster Risk Reduction & First Aid Life Support' : activeComponentModal === 'CWTS' ? 'Tree Planting & Coastal Cleanup Drives in Naic' : 'Out-of-School Youth Literacy Support in Cavite'}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">{activeComponentModal === 'ROTC' ? 'Defense Preparedness & Leadership Ethics' : activeComponentModal === 'CWTS' ? 'Civic Leadership & Barangay Organization' : 'Early Childhood Values & Learning Mentorship'}</span>
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <Link
                  to="/enrollment"
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-center rounded-2xl transition-all shadow-lg active:scale-95 text-xs sm:text-sm flex items-center justify-center gap-2"
                >
                  <span>Enroll in {activeComponentModal} Track</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step-by-Step Online Enrollment Guide */}
      <section id="guide" className="py-12 sm:py-20 px-4 sm:px-6 bg-white border-t border-gray-200/70 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-8 sm:mb-14">
            <span className="bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-2xs">
              Easy 3-Step Process
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mt-3">How to Enroll Online</h2>
            <p className="text-gray-600 text-xs sm:text-base mt-1.5">Simple guide for incoming freshmen and transferees at Cavite State University Naic</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8 relative">
            
            {/* Step 1 */}
            <div className="bg-emerald-50/70 rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <span className="w-12 h-12 bg-emerald-700 text-white font-black text-lg rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                  1
                </span>
                <h3 className="text-base sm:text-lg font-black text-emerald-950 mb-1.5">Select Component</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Choose between CWTS, LTS, or ROTC according to your interests and course preferences.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-emerald-50/70 rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <span className="w-12 h-12 bg-emerald-700 text-white font-black text-lg rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                  2
                </span>
                <h3 className="text-base sm:text-lg font-black text-emerald-950 mb-1.5">Fill Application Form</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
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
                <h3 className="text-base sm:text-lg font-black text-emerald-950 mb-1.5">Coordinator Approval</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  NSTP department coordinators verify your application and assign your official section.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Video Orientation Section */}
      <section id="video" className="py-12 sm:py-20 px-4 bg-gradient-to-b from-emerald-950 via-emerald-900 to-teal-950 text-white relative overflow-hidden border-t border-emerald-800">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-8 sm:mb-12">
            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-full inline-flex items-center gap-2 shadow-sm">
              <Play className="w-3.5 h-3.5 fill-amber-300 text-amber-300" /> Official Video Orientation
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mt-3 tracking-tight">What is NSTP? Video Guide & Overview</h2>
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
              <div className="bg-amber-400/10 border border-amber-400/25 px-4 py-2.5 rounded-2xl text-left shrink-0 w-full sm:w-auto">
                <p className="text-[10px] font-black uppercase text-amber-300 tracking-wider flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-400" /> Video Credits:
                </p>
                <p className="text-xs font-black text-white mt-0.5 whitespace-nowrap">
                  University of the Philippines Diliman (UP Diliman)
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions (FAQ) Interactive Accordion */}
      <section id="faq" className="py-12 sm:py-20 px-4 bg-gray-50 border-t border-gray-200/70">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8 sm:mb-14">
            <span className="bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-2xs">
              Knowledge Base & FAQ
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mt-3">Frequently Asked Questions</h2>
            <p className="text-gray-600 text-xs sm:text-base mt-1.5">Everything incoming students need to know about Republic Act No. 9163 and NSTP policies</p>
          </div>

          {/* Interactive Accordion List */}
          <div className="space-y-3.5">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div 
                  key={idx} 
                  className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200/90 shadow-2xs overflow-hidden transition-all duration-200"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-6 flex items-center justify-between text-left gap-3.5 hover:bg-gray-50/80 transition-colors cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm md:text-base font-black text-gray-900 flex items-center gap-2.5">
                      <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      {item.q}
                    </span>
                    <div className={`w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 bg-emerald-600 text-white' : ''}`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-1 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-100 whitespace-pre-line animate-fade-in">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer id="contact" className="bg-emerald-950 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            
            {/* About (Left Side) */}
            <div>
              <div className="flex items-center space-x-3.5 mb-3.5">
                <div className="w-10 h-10 bg-white rounded-2xl p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-md ring-2 ring-amber-400/40">
                  <img src={`${import.meta.env.BASE_URL}cvsu.png`} alt="CvSU Logo" className="w-full h-full object-contain" />
                </div>
                <h4 className="text-base sm:text-xl font-black leading-tight text-white">Cavite State University Naic</h4>
              </div>
              <p className="text-emerald-200 text-xs sm:text-sm leading-relaxed mb-4 max-w-md">
                A premier institution committed to providing quality education and producing morally upright graduates who contribute to national development through the National Service Training Program (NSTP).
              </p>
              <p className="text-amber-400 text-xs font-black tracking-wide">Core Values: Truth • Integrity • Excellence • Service</p>
            </div>

            {/* Contact Info (Right Side) */}
            <div className="md:text-right">
              <h5 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider mb-3.5 text-amber-400">Contact NSTP Office</h5>
              <ul className="space-y-2.5 text-emerald-200 text-xs sm:text-sm font-medium">
                <li className="flex items-center md:justify-end space-x-2">
                  <a
                    href="https://www.cvsu-naic.edu.ph/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors flex items-center space-x-1.5"
                  >
                    <span>www.cvsu-naic.edu.ph</span>
                    <Globe className="w-4 h-4 text-amber-400 shrink-0" />
                  </a>
                </li>
                <li className="flex items-center md:justify-end space-x-2">
                  <a
                    href="https://web.facebook.com/cvsunaicpio?_rdc=1&_rdr#"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors flex items-center space-x-1.5"
                  >
                    <span>Cavite State University - Naic</span>
                    <Facebook className="w-4 h-4 text-amber-400 shrink-0" />
                  </a>
                </li>
                <li className="flex items-center md:justify-end space-x-2">
                  <a href="mailto:info@cvsu-naic.edu.ph" className="hover:text-white transition-colors flex items-center space-x-1.5">
                    <span>info@cvsu-naic.edu.ph</span>
                    <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                  </a>
                </li>
                <li className="flex items-center md:justify-end space-x-2">
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Cavite+State+University+-+Naic"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors flex items-center space-x-1.5 hover:underline"
                    title="View Cavite State University Naic Campus on Google Maps"
                  >
                    <span>Naic, Cavite, Philippines</span>
                    <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                  </a>
                </li>
                <li className="flex items-center md:justify-end space-x-2">
                  <span>(046) 890-5138</span>
                  <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                </li>
              </ul>
            </div>

          </div>
        </div>

        {/* Live Telemetry Bar */}
        <div className="border-t border-emerald-900/80 bg-emerald-900/50 py-3.5 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-800/80 border border-emerald-700/80 flex items-center justify-center text-amber-400 shadow-xs shrink-0">
                <Activity className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h5 className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-200 leading-none">Live Telemetry</h5>
                <p className="text-[9px] sm:text-[11px] text-emerald-400 font-medium mt-0.5">Real-time visitor status</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              {/* Total Users */}
              <div className="flex items-center gap-2 bg-emerald-900/80 border border-emerald-800 px-3 py-1.5 rounded-2xl shadow-xs">
                <Users className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <p className="text-[8.5px] uppercase font-extrabold text-emerald-300 tracking-wider leading-none">Total Users</p>
                  <p className="text-xs sm:text-sm font-black text-amber-400 leading-tight mt-0.5">
                    {totalUsersCount.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Active Online */}
              <div className="flex items-center gap-2 bg-emerald-800/90 border border-emerald-600/80 px-3 py-1.5 rounded-2xl shadow-xs">
                <div className="relative flex h-2 w-2 items-center justify-center shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                </div>
                <div>
                  <p className="text-[8.5px] uppercase font-extrabold text-emerald-200 tracking-wider leading-none">Active Online</p>
                  <p className="text-xs sm:text-sm font-black text-emerald-300 leading-tight mt-0.5">
                    {activeOnlineCount}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-emerald-900 py-4 px-4">
          <div className="max-w-7xl mx-auto flex justify-center items-center text-xs text-emerald-400 font-medium text-center">
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