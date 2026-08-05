import { Link } from 'react-router-dom';
import { Shield, Users, GraduationCap, ChevronRight, ChevronLeft, Target, Eye, BookOpen, MapPin, Phone, Mail, Facebook, Globe, Award, Sparkles, CheckCircle2, Activity, X, UserCheck, Radio } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getTelemetryStats } from '../services/api';

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

  // Real-time Telemetry & Active Online Users state
  const [telemetry, setTelemetry] = useState({
    totalVisitors: 0,
    activeOnlineCount: 0,
    activeUsers: []
  });
  const [showOnlineModal, setShowOnlineModal] = useState(false);

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

  const totalVisitorsCount = telemetry.totalVisitors !== undefined && telemetry.totalVisitors !== null
    ? telemetry.totalVisitors 
    : parseInt(localStorage.getItem('nstp_total_visitors') || '0', 10);

  const activeOnlineCount = telemetry.activeOnlineCount > 0 
    ? telemetry.activeOnlineCount 
    : 1;

  const activeUsersList = telemetry.activeUsers && telemetry.activeUsers.length > 0
    ? telemetry.activeUsers
    : [{ id: 'current_session', name: 'You (Current Active Visitor)', role: 'Guest / Student Visitor', isAuth: false, page: window.location.pathname }];

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

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    startTimer();
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + CAROUSEL_IMAGES.length) % CAROUSEL_IMAGES.length);
    startTimer();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50/50 via-white to-gray-50 text-gray-900 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Sticky Glassmorphic Header */}
      <header className="sticky top-0 z-50 bg-emerald-900/95 backdrop-blur-md text-white shadow-md border-b border-emerald-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex justify-between items-center">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-2xl p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-md border border-emerald-700">
              <img src={`${import.meta.env.BASE_URL}cvsu.png`} alt="CvSU Logo" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight truncate">Cavite State University Naic</h1>
                <span className="hidden md:inline-flex bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                  NSTP Portal
                </span>
              </div>
              <p className="text-emerald-200 text-xs truncate">National Service Training Program Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              to="/enrollment" 
              className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 font-bold px-4 py-2 rounded-xl text-xs border border-emerald-700 active:scale-95 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Enrollment</span>
            </Link>
            <Link 
              to="/login" 
              className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-emerald-950 font-black px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-amber-950/20 hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
            >
              Portal Login &rarr;
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Carousel Section */}
      <section className="relative h-[280px] xs:h-[340px] sm:h-[420px] md:h-[540px] overflow-hidden bg-gray-900">
        {CAROUSEL_IMAGES.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
            }`}
          >
            <img
              src={image.src}
              alt={image.title}
              className="w-full h-full object-cover"
              loading={index === 0 ? 'eager' : 'lazy'}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-gray-950/30 flex items-center justify-center">
              <div className="text-center text-white px-4 max-w-4xl animate-fade-in">
                <span className="inline-block bg-amber-400/90 text-gray-950 font-extrabold text-xs uppercase tracking-wider px-3.5 py-1 rounded-full mb-3 shadow-md">
                  {image.badge}
                </span>
                <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-3 sm:mb-4 tracking-tight drop-shadow-md">{image.title}</h2>
                <p className="text-sm sm:text-lg md:text-xl text-emerald-200 font-medium max-w-2xl mx-auto drop-shadow-sm">{image.subtitle}</p>
              </div>
            </div>
          </div>
        ))}
        
        {/* Carousel Controls */}
        <button type="button"
          onClick={prevSlide}
          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-black/40 hover:bg-emerald-600/80 backdrop-blur-xs rounded-full flex items-center justify-center text-white transition-all shadow-md active:scale-90"
        >
          <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>
        <button type="button"
          onClick={nextSlide}
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-black/40 hover:bg-emerald-600/80 backdrop-blur-xs rounded-full flex items-center justify-center text-white transition-all shadow-md active:scale-90"
        >
          <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>

        {/* Carousel Indicators */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex space-x-2.5 z-10">
          {CAROUSEL_IMAGES.map((_, index) => (
            <button type="button"
              key={index}
              onClick={() => { setCurrentSlide(index); startTimer(); }}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'w-8 bg-amber-400 shadow-md' : 'w-2.5 bg-white/50 hover:bg-white'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Accurate Quick Stats Banner for Incoming Enrollees */}
      <section className="bg-emerald-900 text-white border-y border-emerald-800 py-6 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group cursor-default">
            <p className="text-2xl sm:text-3xl font-black text-amber-400">6 Credit Units</p>
            <p className="text-xs text-emerald-200 font-semibold mt-0.5">3 Units / Sem (NSTP 1 &amp; 2)</p>
          </div>
          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group cursor-default">
            <p className="text-2xl sm:text-3xl font-black text-white">3 Components</p>
            <p className="text-xs text-emerald-200 font-semibold mt-0.5">ROTC • CWTS • LTS Options</p>
          </div>
          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group cursor-default">
            <p className="text-2xl sm:text-3xl font-black text-amber-400">7 Programs</p>
            <p className="text-xs text-emerald-200 font-semibold mt-0.5">Degree Courses Covered</p>
          </div>
          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group cursor-default">
            <p className="text-2xl sm:text-3xl font-black text-white">R.A. 9163</p>
            <p className="text-xs text-emerald-200 font-semibold mt-0.5">CHED &amp; DND Accredited Law</p>
          </div>
        </div>
      </section>

      {/* High-Impact Enrollment CTA Section */}
      <section className="py-10 px-4 bg-gradient-to-r from-emerald-800 via-green-800 to-teal-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-block bg-amber-400 text-gray-950 font-black text-xs uppercase tracking-widest px-3 py-1 rounded-full mb-3 shadow-md">
            New Academic Batch Enrollment
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold mb-3">Ready to Start Your NSTP Journey?</h2>
          <p className="text-emerald-100 text-sm sm:text-base mb-6 max-w-xl mx-auto">
            Submit your official enrollment application for CWTS, LTS, or ROTC component online in minutes.
          </p>
          <Link 
            to="/enrollment" 
            className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-emerald-950 font-black px-10 py-4 rounded-2xl text-lg sm:text-xl transition-all shadow-xl shadow-amber-950/30 hover:shadow-2xl hover:-translate-y-1 active:scale-95 group"
          >
            <span>Enroll Online Now</span>
            <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* History, Mission, and Vision Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          {/* History */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                <BookOpen className="w-8 h-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Cavite State University Naic Campus</h2>
              <p className="text-emerald-700 font-bold text-sm mt-1">National Service Training Program Office</p>
            </div>
            <div className="max-w-3xl mx-auto text-center bg-emerald-50/50 p-6 sm:p-8 rounded-3xl border border-emerald-100">
              <p className="text-gray-700 leading-relaxed text-base sm:text-lg">
                Cavite State University Naic Campus is a premier satellite campus dedicated to providing quality tertiary education in Cavite. Through the National Service Training Program (NSTP), CvSU Naic equips students with academic competence, civic responsibility, and moral leadership to serve the nation.
              </p>
            </div>
          </div>

          {/* Mission and Vision */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-emerald-50/80 rounded-3xl p-8 border border-emerald-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center mb-5">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mr-4 shadow-sm">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-emerald-900">Our Mission</h3>
                  <p className="text-xs text-emerald-700 font-semibold">Cavite State University</p>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed text-sm">
                Cavite State University shall provide excellent, equitable and relevant educational opportunities in the arts, sciences and technology through quality instruction and responsive research and development activities. It shall produce professional, skilled and morally upright individuals for global competitiveness.
              </p>
            </div>

            <div className="bg-amber-50/80 rounded-3xl p-8 border border-amber-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center mb-5">
                <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center mr-4 shadow-sm">
                  <Eye className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-amber-950">Our Vision</h3>
                  <p className="text-xs text-amber-700 font-semibold">Cavite State University</p>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed text-sm">
                The premier university in historic Cavite globally recognized for excellence in character development, academics, research, innovation and sustainable community engagement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive NSTP Components Section */}
      <section className="py-16 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full">Program Components</span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mt-2">Explore NSTP Offerings</h2>
            <p className="text-gray-500 text-sm mt-1">Select a component below to view training specifics</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* ROTC Card */}
            <div
              className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
              onClick={() => setActiveComponentModal('ROTC')}
            >
              <div>
                <div className="w-14 h-14 bg-rose-600 text-white rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-md shadow-rose-900/20">
                  <Shield className="w-7 h-7" />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-black text-rose-900">ROTC</h3>
                  <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2.5 py-0.5 rounded-full">Military Defense</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed mb-4">
                  Reserve Officers' Training Corps — Military-based training designed to motivate, train, organize and mobilize students for national defense preparedness.
                </p>
              </div>
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-rose-700 group-hover:text-rose-900">
                <span>View Component Details</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* CWTS Card */}
            <div
              className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
              onClick={() => setActiveComponentModal('CWTS')}
            >
              <div>
                <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-md shadow-emerald-900/20">
                  <Users className="w-7 h-7" />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-black text-emerald-900">CWTS</h3>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">Community Service</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed mb-4">
                  Civic Welfare Training Service — Programs and activities contributing to the general welfare and betterment of life for members of the local community.
                </p>
              </div>
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-emerald-700 group-hover:text-emerald-900">
                <span>View Component Details</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* LTS Card */}
            <div
              className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
              onClick={() => setActiveComponentModal('LTS')}
            >
              <div>
                <div className="w-14 h-14 bg-purple-600 text-white rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-md shadow-purple-900/20">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-black text-purple-900">LTS</h3>
                  <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2.5 py-0.5 rounded-full">Literacy Training</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed mb-4">
                  Literacy Training Service — Educational support program training students to teach literacy and numeracy skills to children and out-of-school youth.
                </p>
              </div>
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-purple-700 group-hover:text-purple-900">
                <span>View Component Details</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
                <div className={`w-10 h-10 rounded-2xl text-white flex items-center justify-center font-bold ${
                  activeComponentModal === 'ROTC' ? 'bg-rose-600' : activeComponentModal === 'CWTS' ? 'bg-emerald-600' : 'bg-purple-600'
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

      {/* Step-by-Step Online Enrollment Guide for Incoming Freshmen */}
      <section className="py-16 px-4 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full">Easy 3-Step Process</span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mt-2">How to Enroll Online</h2>
            <p className="text-gray-500 text-sm mt-1">Simple guide for incoming freshmen enrollees at Cavite State University Naic</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="bg-emerald-50/60 rounded-3xl p-6 border border-emerald-100 relative hover:shadow-md transition-shadow">
              <span className="w-10 h-10 bg-emerald-700 text-white font-black text-base rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                1
              </span>
              <h3 className="text-base font-black text-emerald-950 mb-1.5">Choose Component</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Review CWTS, LTS, and ROTC course descriptions and select your preferred NSTP training track.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-emerald-50/60 rounded-3xl p-6 border border-emerald-100 relative hover:shadow-md transition-shadow">
              <span className="w-10 h-10 bg-emerald-700 text-white font-black text-base rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                2
              </span>
              <h3 className="text-base font-black text-emerald-950 mb-1.5">Fill Application</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Fill up the online enrollment form using your Registration Form, 9-digit Student ID, CvSU Email, Degree Program, Year Level, and Section.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-emerald-50/60 rounded-3xl p-6 border border-emerald-100 relative hover:shadow-md transition-shadow">
              <span className="w-10 h-10 bg-emerald-700 text-white font-black text-base rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                3
              </span>
              <h3 className="text-base font-black text-emerald-950 mb-1.5">Coordinator Approval</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                NSTP Coordinators review your application and match you with your component section.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions (FAQ) & Guidelines */}
      <section className="py-16 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full">Knowledge Base &amp; FAQ</span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mt-2">Frequently Asked Questions</h2>
            <p className="text-gray-500 text-sm mt-1">Everything incoming students need to know about Republic Act No. 9163 and NSTP policies</p>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs hover:shadow-sm transition-shadow">
              <h3 className="text-base font-black text-gray-900 mb-1.5 flex items-center gap-2">
                <span className="text-emerald-700">Q:</span> Who is required to take NSTP?
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed pl-6">
                Under <strong>Republic Act No. 9163 (NSTP Law of 2001)</strong>, all male and female students enrolled in any baccalaureate degree course or technical-vocational course in any Higher Education Institution (HEI) are required to complete one (1) NSTP component as a graduation requirement.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs hover:shadow-sm transition-shadow">
              <h3 className="text-base font-black text-gray-900 mb-1.5 flex items-center gap-2">
                <span className="text-emerald-700">Q:</span> How many units and semesters is the NSTP course?
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed pl-6">
                NSTP is a <strong>6 credit unit course</strong> taken for two (2) consecutive semesters: <strong>NSTP 1 (3 Units)</strong> during the First Semester and <strong>NSTP 2 (3 Units)</strong> during the Second Semester.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs hover:shadow-sm transition-shadow">
              <h3 className="text-base font-black text-gray-900 mb-1.5 flex items-center gap-2">
                <span className="text-emerald-700">Q:</span> How do I choose between CWTS, LTS, and ROTC?
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed pl-6">
                Students may freely choose any of the three components based on interest:
                <br />• <strong>CWTS (Civic Welfare Training Service)</strong>: Community environmental, health, and civic welfare projects.
                <br />• <strong>LTS (Literacy Training Service)</strong>: Teaching literacy and numeracy to children and out-of-school youth.
                <br />• <strong>ROTC (Reserve Officers' Training Corps)</strong>: Military discipline, leadership, and defense preparedness.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs hover:shadow-sm transition-shadow">
              <h3 className="text-base font-black text-gray-900 mb-1.5 flex items-center gap-2">
                <span className="text-emerald-700">Q:</span> What do I need to enroll in NSTP?
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed pl-6">
                To enroll in NSTP, students need their <strong>CvSU Registration Form</strong> and must <strong>fill up</strong> the online NSTP enrollment form with their 9-digit Student ID Number, official CvSU Email, degree program, year level, section, and chosen component.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-emerald-950 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            {/* About */}
            <div className="md:w-2/3">
              <div className="flex items-center space-x-3 mb-4">
                <img src={`${import.meta.env.BASE_URL}cvsu.png`} alt="CvSU Logo" className="w-8 h-8 object-contain" />
                <h4 className="text-xl font-black">Cavite State University Naic</h4>
              </div>
              <p className="text-emerald-200 text-xs leading-relaxed mb-4 max-w-xl">
                A premier institution committed to providing quality education and producing 
                morally upright graduates who contribute to national development through the 
                National Service Training Program (NSTP).
              </p>
              <p className="text-amber-400 text-xs font-bold">Core Values: Truth • Integrity • Excellence • Service</p>
            </div>

            {/* Contact Info */}
            <div className="md:w-auto md:text-right w-full">
              <h5 className="text-sm font-extrabold uppercase tracking-wider mb-4 text-amber-400">Contact NSTP Office</h5>
              <ul className="space-y-2.5 text-emerald-200 text-xs font-medium">
                <li className="flex items-center space-x-2 md:justify-end">
                  <a 
                    href="https://www.cvsu-naic.edu.ph/"
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors flex items-center space-x-2"
                  >
                    <span>www.cvsu-naic.edu.ph</span>
                    <Globe className="w-4 h-4 text-amber-400 shrink-0" />
                  </a>
                </li>
                <li className="flex items-center space-x-2 md:justify-end">
                  <a 
                    href="https://web.facebook.com/cvsunaicpio?_rdc=1&_rdr#"
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors flex items-center space-x-2"
                  >
                    <span>Cavite State University - Naic</span>
                    <Facebook className="w-4 h-4 text-amber-400 shrink-0" />
                  </a>
                </li>
                <li className="flex items-center space-x-2 md:justify-end">
                  <a href="mailto:info@cvsu-naic.edu.ph" className="hover:text-white transition-colors">info@cvsu-naic.edu.ph</a>
                  <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                </li>
                <li className="flex items-center space-x-2 md:justify-end">
                  <span>Naic, Cavite, Philippines</span>
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                </li>
                <li className="flex items-center space-x-2 md:justify-end">
                  <span>(046) 890-5138</span>
                  <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Real-time Website Usage & Visitor Telemetry Counter */}
        <div className="border-t border-emerald-900/80 bg-emerald-900/40 py-6 px-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-10 h-10 rounded-2xl bg-emerald-800/80 border border-emerald-700/80 flex items-center justify-center text-amber-400 shadow-md shrink-0">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h5 className="text-xs font-black uppercase tracking-wider text-emerald-200">Website Usage &amp; Live Telemetry</h5>
                <p className="text-[11px] text-emerald-400 font-medium">Real-time active users telemetry &amp; visitor telemetry</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5">
              {/* Total Website Users / Visitors */}
              <div className="flex items-center gap-3 bg-emerald-900/70 border border-emerald-800 px-4 py-2.5 rounded-2xl shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-extrabold text-emerald-300 tracking-wider">Total Users</p>
                  <p className="text-base sm:text-lg font-black text-amber-400 leading-tight">
                    {totalVisitorsCount.toLocaleString()} <span className="text-xs font-semibold text-emerald-200">total</span>
                  </p>
                </div>
              </div>

              {/* Real-time Active Online Users (Clickable to see who is online) */}
              <button 
                onClick={() => setShowOnlineModal(true)}
                className="flex items-center gap-3 bg-emerald-800/90 hover:bg-emerald-700/90 border border-emerald-600/80 px-4 py-2.5 rounded-2xl shadow-md cursor-pointer transition-all active:scale-95 text-left group"
                title="Click to view real-time active online users"
              >
                <div className="relative flex h-3.5 w-3.5 items-center justify-center shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-extrabold text-emerald-200 tracking-wider flex items-center gap-1 group-hover:text-amber-300 transition-colors">
                    Realtime Active Online &rarr;
                  </p>
                  <p className="text-base sm:text-lg font-black text-emerald-300 leading-tight">
                    {activeOnlineCount} <span className="text-xs font-bold text-emerald-200">active now</span>
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-emerald-900 py-5">
          <div className="max-w-7xl mx-auto px-4 flex justify-center items-center text-xs text-emerald-400 font-medium">
            <p className="text-center">© {new Date().getFullYear()} Cavite State University Naic Campus • NSTP System</p>
          </div>
        </div>
      </footer>

      {/* Real-time Active Online Users Modal */}
      {showOnlineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-emerald-100 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-900 via-emerald-850 to-teal-900 text-white p-5 flex justify-between items-center relative">
              <div className="flex items-center gap-3">
                <div className="relative flex h-4 w-4 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
                </div>
                <div>
                  <h3 className="text-base font-black flex items-center gap-2">
                    Active Online Users
                  </h3>
                  <p className="text-emerald-200 text-xs font-medium">
                    Real-time active sessions &amp; online users list
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowOnlineModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stats Summary Banner */}
            <div className="bg-emerald-50 px-5 py-3 border-b border-emerald-100 flex justify-between items-center text-xs">
              <span className="text-emerald-900 font-bold flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-700" />
                Total Users: <strong className="text-emerald-950 text-sm font-black">{(totalVisitorsCount || 0).toLocaleString()}</strong>
              </span>
              <span className="bg-emerald-200/80 text-emerald-900 font-black px-2.5 py-1 rounded-full text-[11px]">
                {activeOnlineCount} Online Now
              </span>
            </div>

            {/* Online Users List */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {activeUsersList.map((usr, idx) => (
                <div key={usr.id || idx} className="flex items-center justify-between p-3.5 bg-gray-50 hover:bg-emerald-50/60 rounded-2xl border border-gray-100 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-700 text-white font-black text-xs flex items-center justify-center shadow-sm uppercase">
                      {usr.name ? usr.name.charAt(0) : 'U'}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                        {usr.name}
                        {usr.isAuth && (
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase">
                            Verified Account
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-gray-500 font-medium">{usr.role || 'Guest Visitor'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Active Now
                    </span>
                    <p className="text-[10px] text-gray-400 mt-0.5">Page: {usr.page || '/'}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
              <button
                type="button"
                onClick={() => setShowOnlineModal(false)}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Landing;