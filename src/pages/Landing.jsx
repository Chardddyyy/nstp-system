import { Link } from 'react-router-dom';
import { Shield, Users, GraduationCap, ChevronRight, ChevronLeft, ChevronDown, Target, Eye, BookOpen, MapPin, Phone, Mail, Facebook, Globe, Award, Sparkles, CheckCircle2, Activity, X, UserCheck, Radio, Clock, Calendar, Play, Film, Video } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getTelemetryStats } from '../services/api';
import { calculateEnrollmentStatus } from '../utils/enrollmentSchedule';

// Carousel images - using the actual CvSU Naic campus photos
const CAROUSEL_IMAGES = [
  {
    src: `${import.meta.env.BASE_URL}cvsunaiccampus.png`,
    title: "Welcome to CvSU Naic NSTP",
    subtitle: "Building Tomorrow's Leaders Through National Service",
    badge: "Official Campus Portal"
  },
  {
    src: `${import.meta.env.BASE_URL}IMG_9578.JPG`,
    title: "ROTC Leadership & Discipline",
    subtitle: "Developing Military Preparedness & Defense Leadership",
    badge: "Reserve Officers' Training Corps"
  },
  {
    src: `${import.meta.env.BASE_URL}cwts-cover.jpg`,
    title: "CWTS Community Service",
    subtitle: "Serving the Community with Compassion & Civic Welfare",
    badge: "Civic Welfare Training Service"
  },
  {
    src: `${import.meta.env.BASE_URL}lts-cover.jpg`,
    title: "LTS Literacy Program",
    subtitle: "Empowering Out-of-School Youth Through Literacy",
    badge: "Literacy Training Service"
  }
];

function Landing() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeComponentModal, setActiveComponentModal] = useState(null);
  const timerRef = useRef(null);

  // Live Enrollment Timed Schedule Status
  const [enrollmentStatus, setEnrollmentStatus] = useState(() => calculateEnrollmentStatus());

  useEffect(() => {
    const updateSchedule = () => setEnrollmentStatus(calculateEnrollmentStatus());
    window.addEventListener('nstp_enrollment_schedule_changed', updateSchedule);
    const interval = setInterval(updateSchedule, 10000);
    return () => {
      window.removeEventListener('nstp_enrollment_schedule_changed', updateSchedule);
      clearInterval(interval);
    };
  }, []);

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
    totalVisitors: 0,
    activeOnlineCount: 0,
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

  const totalUsersCount = telemetry.totalUsers || telemetry.totalVisitors || parseInt(localStorage.getItem('nstp_total_visitors') || '15', 10);

  const activeOnlineCount = telemetry.activeOnlineCount > 0
    ? telemetry.activeOnlineCount
    : 1;

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    }, 5000);
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [startTimer]);

  const _nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    startTimer();
  };

  const _prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + CAROUSEL_IMAGES.length) % CAROUSEL_IMAGES.length);
    startTimer();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50/50 via-white to-gray-50 text-gray-900 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Sticky Glassmorphic Header - Edge-to-Edge Desktop Layout */}
      <header className="sticky top-0 z-50 bg-emerald-900/95 backdrop-blur-md text-white shadow-md border-b border-emerald-800/80">
        <div className="w-full px-3 sm:px-8 lg:px-12 py-2 sm:py-3.5 flex justify-between items-center gap-1.5 sm:gap-2">
          <div className="flex items-center space-x-1.5 sm:space-x-3 min-w-0 flex-1">
            <div className="w-7 h-7 sm:w-12 sm:h-12 bg-white rounded-lg sm:rounded-2xl p-0.5 sm:p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-md border border-emerald-700">
              <img src={`${import.meta.env.BASE_URL}cvsu.png`} alt="CvSU Logo" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <h1 className="text-[10px] xs:text-xs sm:text-lg font-black tracking-tight truncate">
                  Cavite State University Naic
                </h1>
                <span className="inline-flex bg-amber-400/20 text-amber-300 text-[7px] sm:text-[10px] font-bold px-1 sm:px-2 py-0.5 rounded-full border border-amber-400/30 shrink-0">
                  NSTP
                </span>
              </div>
              <p className="text-emerald-200 text-[8px] sm:text-xs truncate font-medium">National Service Training Program System</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            <Link
              to="/enrollment"
              className="inline-flex items-center gap-1 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 font-bold px-2 sm:px-4 py-1 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-xs border border-emerald-700 active:scale-95 transition-all shrink-0"
            >
              <Sparkles className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
              <span>Enrollment</span>
            </Link>
            <Link
              to="/login"
              className="bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-emerald-950 font-black px-2 sm:px-5 py-1 sm:py-2.5 rounded-lg sm:rounded-xl text-[9px] sm:text-sm transition-all shadow-md shadow-amber-950/20 active:scale-95 shrink-0"
            >
              Login &rarr;
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Carousel Section - Compact Mobile Height */}
      <section className="relative h-[220px] xs:h-[270px] sm:h-[380px] md:h-[500px] overflow-hidden bg-gray-900">
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
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent flex flex-col justify-end p-4 sm:p-10">
              <div className={`max-w-7xl mx-auto w-full transition-all duration-700 delay-150 ${
                index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}>
                <span className="inline-block bg-emerald-500/90 text-white font-extrabold text-[10px] sm:text-xs px-3 py-1 rounded-full uppercase tracking-wider mb-1.5 sm:mb-3 shadow-md backdrop-blur-xs">
                  {image.badge}
                </span>
                <h2 className="text-lg sm:text-3xl md:text-5xl font-black text-white drop-shadow-md leading-tight max-w-3xl">
                  {image.title}
                </h2>
                <p className="text-emerald-100 text-xs sm:text-base md:text-lg max-w-2xl mt-1 sm:mt-2 font-medium line-clamp-2 sm:line-clamp-none">
                  {image.subtitle}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Indicators */}
        <div className="absolute bottom-3 sm:bottom-6 right-4 sm:right-10 flex space-x-1.5 sm:space-x-2 z-10">
          {CAROUSEL_IMAGES.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentSlide(index);
                startTimer();
              }}
              className={`h-1.5 sm:h-2.5 rounded-full transition-all duration-300 ${index === currentSlide ? 'w-6 sm:w-10 bg-amber-400' : 'w-1.5 sm:w-2.5 bg-white/50 hover:bg-white/80'
                }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Floating Animated Arrow Down Indicator on Mobile View (Absolute Bottom Right) */}
        <div className="absolute bottom-1 right-2 z-30 pointer-events-none animate-bounce sm:hidden">
          <div className="w-7 h-7 rounded-full bg-emerald-950/90 border border-amber-400/80 flex items-center justify-center text-amber-400 shadow-xl backdrop-blur-xs">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </section>

      {/* Accurate Quick Stats Banner - 4 Side-by-side Cards on Mobile */}
      <section className="bg-emerald-900 text-white border-y border-emerald-800 py-2.5 sm:py-6 px-2 sm:px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-7xl mx-auto grid grid-cols-4 gap-1 sm:gap-4 text-center relative z-10">
          <div className="p-1 sm:p-3.5 bg-white/5 rounded-lg sm:rounded-2xl border border-white/10 hover:bg-white/10 transition-all flex flex-col justify-center items-center">
            <p className="text-[9px] xs:text-[10px] sm:text-2xl font-black text-amber-400 leading-tight whitespace-nowrap">6 Credit Units</p>
            <p className="text-[7px] xs:text-[8px] sm:text-xs text-emerald-200 font-semibold mt-0.5 leading-tight whitespace-nowrap">3 Units / Sem</p>
          </div>
          <div className="p-1 sm:p-3.5 bg-white/5 rounded-lg sm:rounded-2xl border border-white/10 hover:bg-white/10 transition-all flex flex-col justify-center items-center">
            <p className="text-[9px] xs:text-[10px] sm:text-2xl font-black text-white leading-tight whitespace-nowrap">3 Components</p>
            <p className="text-[6.5px] xs:text-[7.5px] sm:text-xs text-emerald-200 font-semibold mt-0.5 leading-tight whitespace-nowrap tracking-tight">ROTC • CWTS • LTS</p>
          </div>
          <div className="p-1 sm:p-3.5 bg-white/5 rounded-lg sm:rounded-2xl border border-white/10 hover:bg-white/10 transition-all flex flex-col justify-center items-center">
            <p className="text-[9px] xs:text-[10px] sm:text-2xl font-black text-amber-400 leading-tight whitespace-nowrap">2 Semesters</p>
            <p className="text-[7px] xs:text-[8px] sm:text-xs text-emerald-200 font-semibold mt-0.5 leading-tight whitespace-nowrap">1 Academic Year</p>
          </div>
          <div className="p-1 sm:p-3.5 bg-white/5 rounded-lg sm:rounded-2xl border border-white/10 hover:bg-white/10 transition-all flex flex-col justify-center items-center">
            <p className="text-[9px] xs:text-[10px] sm:text-2xl font-black text-white leading-tight whitespace-nowrap">R.A. 9163</p>
            <p className="text-[7px] xs:text-[8px] sm:text-xs text-emerald-200 font-semibold mt-0.5 leading-tight whitespace-nowrap">Accredited Law</p>
          </div>
        </div>
      </section>

      {/* High-Impact Enrollment Schedule & CTA Section */}
      <section className="py-8 sm:py-12 px-3 sm:px-4 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white relative overflow-hidden border-y border-emerald-800/80">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">

          {/* Dynamic Schedule Status Banner */}
          <div className="mb-4 sm:mb-6 p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 text-left">
              <div className="flex items-start space-x-2.5 sm:space-x-3">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 ${enrollmentStatus.isOpen
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/50'
                    : 'bg-amber-400 text-emerald-950 shadow-lg'
                  }`}>
                  {enrollmentStatus.isOpen ? <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" /> : <Clock className="w-4 h-4 sm:w-5 sm:h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <h3 className="text-xs sm:text-base font-black text-white leading-tight">{enrollmentStatus.headline}</h3>
                    <span className={`text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full ${enrollmentStatus.isOpen ? 'bg-amber-400 text-emerald-950 animate-pulse' : 'bg-rose-500 text-white'
                      }`}>
                      {enrollmentStatus.isOpen ? 'Active Now' : 'Closed'}
                    </span>
                  </div>
                  <p className="text-emerald-100 text-[10.5px] sm:text-xs mt-0.5 font-medium leading-normal">
                    {enrollmentStatus.subtext}
                  </p>
                  {enrollmentStatus.customNotice && (
                    <p className="text-amber-300 text-[9.5px] sm:text-[11px] font-bold mt-1 bg-black/20 px-2 py-0.5 rounded-lg inline-block border border-amber-400/20 leading-snug">
                      📢 {enrollmentStatus.customNotice}
                    </p>
                  )}
                </div>
              </div>

              {enrollmentStatus.openAtFormatted && (
                <div className="bg-emerald-900/80 border border-emerald-700/60 p-2 sm:p-2.5 rounded-xl text-center shrink-0 w-full sm:w-auto">
                  <p className="text-[8px] sm:text-[9px] text-amber-300 uppercase font-extrabold tracking-wider">Scheduled Opening</p>
                  <p className="text-[11px] sm:text-xs font-bold text-white mt-0.5">{enrollmentStatus.openAtFormatted}</p>
                </div>
              )}
            </div>
          </div>

          <h2 className="text-xl sm:text-3xl font-extrabold mb-2 text-white">Ready to Start Your NSTP Journey?</h2>
          <p className="text-emerald-100 text-xs sm:text-base mb-5 max-w-xl mx-auto font-medium">
            Submit your official enrollment application for CWTS, LTS, or ROTC component online.
          </p>

          {enrollmentStatus.isOpen ? (
            <Link
              to="/enrollment"
              className="inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-emerald-950 font-black px-6 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-sm sm:text-lg transition-all shadow-xl shadow-amber-950/30 hover:shadow-2xl hover:-translate-y-1 active:scale-95 group"
            >
              <span>Enroll Online Now</span>
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <div className="inline-flex flex-col sm:flex-row items-center gap-2 bg-white/10 border border-white/20 p-3 rounded-2xl">
              <span className="text-xs text-amber-300 font-bold">🔒 Enrollment Application Portal Closed</span>
              {enrollmentStatus.openAtFormatted && (
                <span className="text-xs text-emerald-200 font-medium">• Reopens on: <strong className="text-white">{enrollmentStatus.openAtFormatted}</strong></span>
              )}
            </div>
          )}
        </div>
      </section>

      {/* History, Mission, and Vision Section - Compact Mobile Spacing */}
      <section className="py-8 sm:py-16 px-4 bg-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          {/* History */}
          <div className="mb-8 sm:mb-16">
            <div className="text-center mb-5 sm:mb-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-100 text-emerald-700 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-inner">
                <BookOpen className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <h2 className="text-xl sm:text-3xl font-black text-gray-900">Cavite State University Naic Campus</h2>
              <p className="text-emerald-700 font-bold text-xs sm:text-sm mt-0.5 sm:mt-1">National Service Training Program Office</p>
            </div>
            <div className="max-w-3xl mx-auto text-center bg-emerald-50/50 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-emerald-100">
              <p className="text-gray-700 leading-relaxed text-xs sm:text-lg">
                Cavite State University Naic Campus is a premier satellite campus dedicated to providing quality tertiary education in Cavite. Through the National Service Training Program (NSTP), CvSU Naic equips students with academic competence, civic responsibility, and moral leadership to serve the nation.
              </p>
            </div>
          </div>

          {/* Mission and Vision - Side-by-side on Mobile */}
          <div className="grid grid-cols-2 gap-2 sm:gap-8 mb-6 sm:mb-8">
            <div className="bg-emerald-50/80 rounded-2xl sm:rounded-3xl p-3 sm:p-8 border border-emerald-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center mb-2 sm:mb-5">
                <div className="w-7 h-7 sm:w-12 sm:h-12 bg-emerald-600 text-white rounded-lg sm:rounded-2xl flex items-center justify-center mr-2 sm:mr-4 shadow-sm shrink-0">
                  <Target className="w-4 h-4 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-xl font-black text-emerald-900 leading-tight">Our Mission</h3>
                  <p className="text-[9px] sm:text-xs text-emerald-700 font-semibold truncate">Cavite State University</p>
                </div>
              </div>
              <p className="text-gray-700 leading-snug sm:leading-relaxed text-[10px] sm:text-sm">
                Cavite State University shall provide excellent, equitable and relevant educational opportunities in the arts, sciences and technology through quality instruction and responsive research and development activities. It shall produce professional, skilled and morally upright individuals for global competitiveness.
              </p>
            </div>

            <div className="bg-amber-50/80 rounded-2xl sm:rounded-3xl p-3 sm:p-8 border border-amber-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center mb-2 sm:mb-5">
                <div className="w-7 h-7 sm:w-12 sm:h-12 bg-amber-500 text-white rounded-lg sm:rounded-2xl flex items-center justify-center mr-2 sm:mr-4 shadow-sm shrink-0">
                  <Eye className="w-4 h-4 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-xl font-black text-amber-950 leading-tight">Our Vision</h3>
                  <p className="text-[9px] sm:text-xs text-amber-700 font-semibold truncate">Cavite State University</p>
                </div>
              </div>
              <p className="text-gray-700 leading-snug sm:leading-relaxed text-[10px] sm:text-sm">
                The premier university in historic Cavite globally recognized for excellence in character development, academics, research, innovation and sustainable community engagement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive NSTP Components Section - 3 Side-by-side Cards on Mobile */}
      <section className="py-6 sm:py-16 px-3 sm:px-4 bg-gray-50/90 border-t border-gray-100 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-4 sm:mb-12">
            <span className="bg-emerald-100 text-emerald-800 text-[9px] sm:text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full">Program Components</span>
            <h2 className="text-base sm:text-4xl font-black text-gray-900 mt-1 sm:mt-2">Explore NSTP Offerings</h2>
            <p className="text-gray-500 text-[10px] sm:text-sm mt-0.5 sm:mt-1">Select a component below to view training specifics</p>
          </div>

          <div className="grid grid-cols-3 gap-1.5 sm:gap-6">
            {/* ROTC Card */}
            <div
              className="bg-white rounded-xl sm:rounded-3xl p-2 sm:p-6 border border-gray-200 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
              onClick={() => setActiveComponentModal('ROTC')}
            >
              <div>
                <div className="w-7 h-7 sm:w-14 sm:h-14 bg-rose-600 text-white rounded-lg sm:rounded-2xl flex items-center justify-center mb-1.5 sm:mb-5 group-hover:scale-105 transition-transform shadow-xs shrink-0">
                  <Shield className="w-4 h-4 sm:w-7 sm:h-7" />
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-1 sm:mb-2">
                  <h3 className="text-xs sm:text-xl font-black text-rose-900">ROTC</h3>
                  <span className="text-[7px] sm:text-[10px] bg-rose-100 text-rose-800 font-bold px-1 sm:px-2 py-0.5 rounded-full mt-0.5 sm:mt-0">Defense</span>
                </div>
                <p className="text-[9px] sm:text-xs text-gray-600 leading-tight sm:leading-relaxed mb-2 sm:mb-4">
                  Reserve Officers' Training Corps — Military-based training designed for national defense preparedness.
                </p>
              </div>
              <div className="pt-1.5 sm:pt-4 border-t border-gray-100 flex items-center justify-between text-[8px] sm:text-xs font-bold text-rose-700 group-hover:text-rose-900">
                <span className="truncate">Details</span>
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform shrink-0" />
              </div>
            </div>

            {/* CWTS Card */}
            <div
              className="bg-white rounded-xl sm:rounded-3xl p-2 sm:p-6 border border-gray-200 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
              onClick={() => setActiveComponentModal('CWTS')}
            >
              <div>
                <div className="w-7 h-7 sm:w-14 sm:h-14 bg-emerald-600 text-white rounded-lg sm:rounded-2xl flex items-center justify-center mb-1.5 sm:mb-5 group-hover:scale-105 transition-transform shadow-xs shrink-0">
                  <Users className="w-4 h-4 sm:w-7 sm:h-7" />
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-1 sm:mb-2">
                  <h3 className="text-xs sm:text-xl font-black text-emerald-900">CWTS</h3>
                  <span className="text-[7px] sm:text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1 sm:px-2 py-0.5 rounded-full mt-0.5 sm:mt-0">Civic</span>
                </div>
                <p className="text-[9px] sm:text-xs text-gray-600 leading-tight sm:leading-relaxed mb-2 sm:mb-4">
                  Civic Welfare Training Service — Programs contributing to general welfare of local community.
                </p>
              </div>
              <div className="pt-1.5 sm:pt-4 border-t border-gray-100 flex items-center justify-between text-[8px] sm:text-xs font-bold text-emerald-700 group-hover:text-emerald-900">
                <span className="truncate">Details</span>
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform shrink-0" />
              </div>
            </div>

            {/* LTS Card */}
            <div
              className="bg-white rounded-xl sm:rounded-3xl p-2 sm:p-6 border border-gray-200 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
              onClick={() => setActiveComponentModal('LTS')}
            >
              <div>
                <div className="w-7 h-7 sm:w-14 sm:h-14 bg-purple-600 text-white rounded-lg sm:rounded-2xl flex items-center justify-center mb-1.5 sm:mb-5 group-hover:scale-105 transition-transform shadow-xs shrink-0">
                  <GraduationCap className="w-4 h-4 sm:w-7 sm:h-7" />
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-1 sm:mb-2">
                  <h3 className="text-xs sm:text-xl font-black text-purple-900">LTS</h3>
                  <span className="text-[7px] sm:text-[10px] bg-purple-100 text-purple-800 font-bold px-1 sm:px-2 py-0.5 rounded-full mt-0.5 sm:mt-0">Literacy</span>
                </div>
                <p className="text-[9px] sm:text-xs text-gray-600 leading-tight sm:leading-relaxed mb-2 sm:mb-4">
                  Literacy Training Service — Training students to teach literacy and numeracy skills to youth.
                </p>
              </div>
              <div className="pt-1.5 sm:pt-4 border-t border-gray-100 flex items-center justify-between text-[8px] sm:text-xs font-bold text-purple-700 group-hover:text-purple-900">
                <span className="truncate">Details</span>
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform shrink-0" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Component Details Modal */}
      {activeComponentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setActiveComponentModal(null)}>
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl text-white flex items-center justify-center font-bold ${activeComponentModal === 'ROTC' ? 'bg-rose-600' : activeComponentModal === 'CWTS' ? 'bg-emerald-600' : 'bg-purple-600'
                  }`}>
                  {activeComponentModal === 'ROTC' ? <Shield className="w-5 h-5" /> : activeComponentModal === 'CWTS' ? <Users className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">{activeComponentModal} Component</h3>
                  <p className="text-xs text-gray-500">Official NSTP Program Module</p>
                </div>
              </div>
              <button type="button" onClick={() => setActiveComponentModal(null)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-700">
              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200/60">
                <p className="font-bold text-gray-900 mb-1">Key Focus Areas:</p>
                <ul className="space-y-1.5">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{activeComponentModal === 'ROTC' ? 'Military Drill & Marksmanship' : activeComponentModal === 'CWTS' ? 'Health & Sanitation Services' : 'Reading & Numeracy Modules'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{activeComponentModal === 'ROTC' ? 'National Disaster Risk Reduction' : activeComponentModal === 'CWTS' ? 'Environmental Tree Planting Projects' : 'Community Out-of-School Youth Tutoring'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{activeComponentModal === 'ROTC' ? 'Physical Fitness & Discipline' : activeComponentModal === 'CWTS' ? 'Civic Leadership & Community Organizing' : 'Early Childhood Learning Support'}</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-2.5 pt-2">
                <Link
                  to="/enrollment"
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-center rounded-xl transition-all shadow-md active:scale-95"
                >
                  Enroll in {activeComponentModal}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step-by-Step Online Enrollment Guide - 3 Side-by-side Steps on Mobile */}
      <section className="py-6 sm:py-16 px-3 sm:px-4 bg-white border-t border-gray-100 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-4 sm:mb-12">
            <span className="bg-amber-100 text-amber-900 text-[9px] sm:text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full">Easy 3-Step Process</span>
            <h2 className="text-base sm:text-4xl font-black text-gray-900 mt-1 sm:mt-2">How to Enroll Online</h2>
            <p className="text-gray-500 text-[10px] sm:text-sm mt-0.5 sm:mt-1">Simple guide for incoming freshmen enrollees at Cavite State University Naic</p>
          </div>

          <div className="grid grid-cols-3 gap-1.5 sm:gap-6">
            {/* Step 1 */}
            <div className="bg-emerald-50/60 rounded-xl sm:rounded-3xl p-2 sm:p-6 border border-emerald-100 relative hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <span className="w-6 h-6 sm:w-10 sm:h-10 bg-emerald-700 text-white font-black text-[10px] sm:text-base rounded-lg sm:rounded-2xl flex items-center justify-center mb-1.5 sm:mb-4 shadow-xs">
                  1
                </span>
                <h3 className="text-[10px] sm:text-base font-black text-emerald-950 mb-0.5 sm:mb-1 leading-tight">Choose Component</h3>
                <p className="text-[8px] sm:text-xs text-gray-600 leading-tight">
                  Review CWTS, LTS, and ROTC course tracks.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-emerald-50/60 rounded-xl sm:rounded-3xl p-2 sm:p-6 border border-emerald-100 relative hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <span className="w-6 h-6 sm:w-10 sm:h-10 bg-emerald-700 text-white font-black text-[10px] sm:text-base rounded-lg sm:rounded-2xl flex items-center justify-center mb-1.5 sm:mb-4 shadow-xs">
                  2
                </span>
                <h3 className="text-[10px] sm:text-base font-black text-emerald-950 mb-0.5 sm:mb-1 leading-tight">Fill Application</h3>
                <p className="text-[8px] sm:text-xs text-gray-600 leading-tight">
                  Enter student details &amp; upload Reg Form.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-emerald-50/60 rounded-xl sm:rounded-3xl p-2 sm:p-6 border border-emerald-100 relative hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <span className="w-6 h-6 sm:w-10 sm:h-10 bg-emerald-700 text-white font-black text-[10px] sm:text-base rounded-lg sm:rounded-2xl flex items-center justify-center mb-1.5 sm:mb-4 shadow-xs">
                  3
                </span>
                <h3 className="text-[10px] sm:text-base font-black text-emerald-950 mb-0.5 sm:mb-1 leading-tight">Approval</h3>
                <p className="text-[8px] sm:text-xs text-gray-600 leading-tight">
                  Coordinators review &amp; assign section.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NSTP Video Orientation & Educational Overview Section */}
      <section className="py-8 sm:py-16 px-4 bg-gradient-to-b from-emerald-950 via-emerald-900 to-teal-950 text-white relative overflow-hidden border-t border-emerald-800/80">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-6 sm:mb-10">
            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] sm:text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full inline-flex items-center gap-1.5 shadow-sm">
              <Play className="w-3.5 h-3.5 fill-amber-300 text-amber-300" /> Official NSTP Video Orientation
            </span>
            <h2 className="text-xl sm:text-4xl font-black text-white mt-2 tracking-tight">What is NSTP? Video Guide &amp; Overview</h2>
            <p className="text-emerald-200 text-xs sm:text-base mt-1.5 max-w-2xl mx-auto font-medium leading-relaxed">
              Watch this educational video explanation to learn more about Republic Act 9163, NSTP 1 &amp; 2 components (CWTS, LTS, ROTC), and graduation requirements.
            </p>
          </div>

          {/* Responsive 16:9 Video Container */}
          <div className="bg-black/40 rounded-2xl sm:rounded-3xl border border-white/15 p-2.5 sm:p-4 shadow-2xl backdrop-blur-md">
            <div className="relative w-full aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-black flex items-center justify-center group shadow-inner border border-white/10">
              {/* Native HTML5 Web Video Player - 100% In-App Playback (No YouTube frames or popups) */}
              <video
                ref={videoRef}
                controls
                controlsList="nodownload"
                playsInline
                poster={`${import.meta.env.BASE_URL}cvsunaiccampus.png`}
                className="w-full h-full rounded-xl sm:rounded-2xl object-cover bg-black"
              >
                <source src={`${import.meta.env.BASE_URL}nstp-orientation.mp4`} type="video/mp4" />
                <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
                Your browser does not support HTML5 video.
              </video>
            </div>

            {/* Video Details & Credits Box */}
            <div className="mt-4 p-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-xs sm:text-sm text-white">National Service Training Program (NSTP) Orientation</h4>
                  <p className="text-[11px] sm:text-xs text-emerald-200 font-medium">Educational orientation guide explaining Republic Act 9163, CWTS, LTS, &amp; ROTC</p>
                </div>
              </div>

              {/* Video Credits Box (Locked - Text Only) */}
              <div className="bg-amber-400/10 border border-amber-400/20 px-4 py-2.5 rounded-xl text-left shrink-0 w-full sm:w-auto">
                <p className="text-[10px] font-black uppercase text-amber-300 tracking-wider flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-400" /> Video Credits:
                </p>
                <p className="text-[10.5px] xs:text-xs font-black text-white mt-0.5 whitespace-nowrap truncate">
                  University of the Philippines Diliman (UP Diliman)
                </p>
                <p className="text-[9px] text-amber-200/90 font-semibold mt-0.5">
                  Official Educational &amp; Orientation Content Producer
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions (FAQ) & Guidelines */}
      <section className="py-8 sm:py-16 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6 sm:mb-12">
            <span className="bg-emerald-100 text-emerald-800 text-[10px] sm:text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">Knowledge Base &amp; FAQ</span>
            <h2 className="text-xl sm:text-4xl font-black text-gray-900 mt-1 sm:mt-2">Frequently Asked Questions</h2>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5 sm:mt-1">Everything incoming students need to know about Republic Act No. 9163 and NSTP policies</p>
          </div>

          <div className="space-y-2.5 sm:space-y-4">
            <div className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-5 border border-gray-200/80 shadow-2xs hover:shadow-xs transition-shadow">
              <h3 className="text-xs sm:text-base font-black text-gray-900 mb-1 flex items-center gap-1.5">
                <span className="text-emerald-700">Q:</span> Who is required to take NSTP?
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-600 leading-relaxed pl-4 sm:pl-6">
                Under <strong>Republic Act No. 9163 (NSTP Law of 2001)</strong>, all male and female students enrolled in any baccalaureate degree course or technical-vocational course in any Higher Education Institution (HEI) are required to complete one (1) NSTP component as a graduation requirement.
              </p>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-5 border border-gray-200/80 shadow-2xs hover:shadow-xs transition-shadow">
              <h3 className="text-xs sm:text-base font-black text-gray-900 mb-1 flex items-center gap-1.5">
                <span className="text-emerald-700">Q:</span> How many units and semesters is the NSTP course?
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-600 leading-relaxed pl-4 sm:pl-6">
                NSTP is a <strong>6 credit unit course</strong> taken for two (2) consecutive semesters: <strong>NSTP 1 (3 Units)</strong> during the First Semester and <strong>NSTP 2 (3 Units)</strong> during the Second Semester.
              </p>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-5 border border-gray-200/80 shadow-2xs hover:shadow-xs transition-shadow">
              <h3 className="text-xs sm:text-base font-black text-gray-900 mb-1 flex items-center gap-1.5">
                <span className="text-emerald-700">Q:</span> How do I choose between CWTS, LTS, and ROTC?
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-600 leading-relaxed pl-4 sm:pl-6">
                Students may freely choose any of the three components based on interest:
                <br />• <strong>CWTS (Civic Welfare Training Service)</strong>: Community environmental, health, and civic welfare projects.
                <br />• <strong>LTS (Literacy Training Service)</strong>: Teaching literacy and numeracy to children and out-of-school youth.
                <br />• <strong>ROTC (Reserve Officers' Training Corps)</strong>: Military discipline, leadership, and defense preparedness.
              </p>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-5 border border-gray-200/80 shadow-2xs hover:shadow-xs transition-shadow">
              <h3 className="text-xs sm:text-base font-black text-gray-900 mb-1 flex items-center gap-1.5">
                <span className="text-emerald-700">Q:</span> What do I need to enroll in NSTP?
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-600 leading-relaxed pl-4 sm:pl-6">
                To enroll in NSTP, students need their <strong>CvSU Registration Form</strong> and must <strong>fill up</strong> the online NSTP enrollment form with their 9-digit Student ID Number, official CvSU Email, degree program, year level, section, and chosen component.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Edge-to-Edge Desktop Layout */}
      <footer className="bg-emerald-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="w-full px-3 sm:px-8 lg:px-12 py-5 sm:py-10 relative z-10">
          <div className="flex flex-row justify-between items-start gap-2.5 sm:gap-8">
            {/* About (Left Side) */}
            <div className="w-1/2 md:w-2/3 min-w-0">
              <div className="flex items-center space-x-1.5 sm:space-x-2.5 mb-1.5 sm:mb-2.5">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-lg sm:rounded-xl p-0.5 sm:p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-emerald-700">
                  <img src={`${import.meta.env.BASE_URL}cvsu.png`} alt="CvSU Logo" className="w-full h-full object-contain" />
                </div>
                <h4 className="text-[10px] xs:text-xs sm:text-xl font-black leading-tight whitespace-nowrap truncate">Cavite State University Naic</h4>
              </div>
              <p className="text-emerald-200 text-[9px] sm:text-xs leading-tight sm:leading-relaxed mb-2 max-w-xl">
                A premier institution committed to providing quality education and producing
                morally upright graduates who contribute to national development through the
                National Service Training Program (NSTP).
              </p>
              <p className="text-amber-400 text-[6.5px] xs:text-[7.5px] sm:text-xs font-bold leading-tight whitespace-nowrap">Core Values: Truth • Integrity • Excellence • Service</p>
            </div>

            {/* Contact Info (Right Side) */}
            <div className="w-1/2 md:w-auto text-right">
              <h5 className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider mb-1.5 sm:mb-2.5 text-amber-400">Contact NSTP Office</h5>
              <ul className="space-y-1 sm:space-y-2 text-emerald-200 text-[9px] sm:text-xs font-medium">
                <li className="flex items-center justify-end space-x-1 sm:space-x-2">
                  <a
                    href="https://www.cvsu-naic.edu.ph/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors flex items-center justify-end space-x-1 sm:space-x-2 truncate"
                  >
                    <span className="truncate">www.cvsu-naic.edu.ph</span>
                    <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
                  </a>
                </li>
                <li className="flex items-center justify-end space-x-1 sm:space-x-2">
                  <a
                    href="https://web.facebook.com/cvsunaicpio?_rdc=1&_rdr#"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors flex items-center justify-end space-x-1 sm:space-x-2 truncate"
                  >
                    <span className="truncate">Cavite State University - Naic</span>
                    <Facebook className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
                  </a>
                </li>
                <li className="flex items-center justify-end space-x-1 sm:space-x-2">
                  <a href="mailto:info@cvsu-naic.edu.ph" className="hover:text-white transition-colors truncate">info@cvsu-naic.edu.ph</a>
                  <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
                </li>
                <li className="flex items-center justify-end space-x-1 sm:space-x-2">
                  <span className="truncate">Naic, Cavite, Philippines</span>
                  <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
                </li>
                <li className="flex items-center justify-end space-x-1 sm:space-x-2">
                  <span>(046) 890-5138</span>
                  <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Live Telemetry Bar - Edge-to-Edge Desktop Layout */}
        <div className="border-t border-emerald-900/80 bg-emerald-900/40 py-2.5 px-3 sm:px-8 lg:px-12">
          <div className="w-full flex flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-800/80 border border-emerald-700/80 flex items-center justify-center text-amber-400 shadow-xs shrink-0">
                <Activity className="w-3 h-3 sm:w-4 sm:h-4 animate-pulse" />
              </div>
              <div className="min-w-0">
                <h5 className="text-[9px] sm:text-[11px] font-black uppercase tracking-wider text-emerald-200 truncate leading-none">Live Telemetry</h5>
                <p className="text-[8px] sm:text-[10px] text-emerald-400 font-medium truncate mt-0.5">Real-time visitor telemetry</p>
              </div>
            </div>

            <div className="flex flex-row items-center gap-1.5 sm:gap-4 shrink-0">
              {/* Total Website Users / Visitors */}
              <div className="flex items-center gap-1.5 bg-emerald-900/70 border border-emerald-800 px-2 sm:px-3 py-1 rounded-lg sm:rounded-xl shadow-xs">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </div>
                <div>
                  <p className="text-[8px] sm:text-[9px] uppercase font-extrabold text-emerald-300 tracking-wider leading-none">Total Users</p>
                  <p className="text-[10px] sm:text-sm font-black text-amber-400 leading-tight mt-0.5">
                    {totalUsersCount.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Real-time Active Online Users Stat Pill */}
              <div className="flex items-center gap-1.5 bg-emerald-800/90 border border-emerald-600/80 px-2 sm:px-3 py-1 rounded-lg sm:rounded-xl shadow-xs">
                <div className="relative flex h-2 w-2 items-center justify-center shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                </div>
                <div>
                  <p className="text-[8px] sm:text-[9px] uppercase font-extrabold text-emerald-200 tracking-wider leading-none">
                    Active Online
                  </p>
                  <p className="text-[10px] sm:text-sm font-black text-emerald-300 leading-tight mt-0.5">
                    {activeOnlineCount} <span className="text-[8px] font-bold text-emerald-200">now</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-emerald-900 py-3">
          <div className="w-full px-3 sm:px-8 lg:px-12 flex justify-center items-center text-[11px] text-emerald-400 font-medium">
            <p className="text-center">© {new Date().getFullYear()} Cavite State University Naic Campus • NSTP System</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;