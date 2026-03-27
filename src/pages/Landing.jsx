import { Link } from 'react-router-dom';
import { Shield, Users, FileText, MessageSquare, GraduationCap, ChevronRight, ChevronLeft, Target, Eye, BookOpen, MapPin, Phone, Mail, Facebook, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';

// Carousel images - using the actual CvSU Naic campus photo
const CAROUSEL_IMAGES = [
  {
    src: "/cvsunaiccampus.png",
    title: "Welcome to NSTP",
    subtitle: "Building Tomorrow's Leaders Through NSTP"
  },
  {
    src: "/IMG_9578.JPG",
    title: "ROTC Training",
    subtitle: "Developing Discipline and Leadership Skills"
  },
  {
    src: "/cwts cover.jpg",
    title: "CWTS Community Service",
    subtitle: "Serving the Community with Compassion"
  },
  {
    src: "/lts cover.jpg",
    title: "LTS Literacy Program",
    subtitle: "Empowering Through Education"
  }
];

function Landing() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + CAROUSEL_IMAGES.length) % CAROUSEL_IMAGES.length);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="bg-green-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden">
              <img src="/cvsu.png" alt="CvSU Logo" className="w-10 h-10 object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Cavite State University Naic</h1>
              <p className="text-green-200 text-sm">NSTP Record & Report Management System</p>
            </div>
          </div>
          <Link 
            to="/login" 
            className="bg-yellow-500 hover:bg-yellow-600 text-green-900 font-semibold px-6 py-2 rounded-lg transition-colors"
          >
            Login
          </Link>
        </div>
      </header>

      {/* Hero Carousel Section */}
      <section className="relative h-[500px] overflow-hidden">
        {CAROUSEL_IMAGES.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={image.src}
              alt={image.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center text-white px-4">
                <h2 className="text-4xl md:text-5xl font-bold mb-4">{image.title}</h2>
                <p className="text-xl md:text-2xl text-yellow-400">{image.subtitle}</p>
              </div>
            </div>
          </div>
        ))}
        
        {/* Carousel Controls */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <ChevronRight className="w-8 h-8" />
        </button>

        {/* Carousel Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
          {CAROUSEL_IMAGES.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide ? 'bg-yellow-400' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Enrollment CTA Section */}
      <section className="py-8 px-4 bg-green-800">
        <div className="max-w-7xl mx-auto text-center">
          <Link 
            to="/enrollment" 
            className="inline-block bg-yellow-500 hover:bg-yellow-600 text-green-900 font-bold px-12 py-4 rounded-xl text-xl transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Enroll Now!
          </Link>
        </div>
      </section>

      {/* Mission, Vision, and History Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          {/* History */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <BookOpen className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h1 className="font-bold text-lg">Cavite State University Naic</h1>
            </div>
            <div className="max-w-3xl mx-auto text-center">
              <p className="text-gray-600 leading-relaxed text-lg">
                NSTP Campus is one of the satellite campuses of NSTP, 
                established to provide quality education to the youth of Cavite. The campus has been a center of academic excellence, 
                offering various degree programs in agriculture, education, and technology. Through the National Service Training Program (NSTP), 
                the university has produced graduates who are not only academically competent but also socially responsible citizens committed 
                to serving their communities and nation.
              </p>
            </div>
          </div>

          {/* Mission and Vision */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="bg-green-50 rounded-xl p-8 border-2 border-green-200">
              <div className="flex items-center mb-6">
                <Target className="w-10 h-10 text-green-600 mr-3" />
                <h3 className="text-2xl font-bold text-green-800">Our Mission</h3>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Cavite State University shall provide excellent, equitable and relevant educational opportunities in the arts, sciences and technology through quality instruction and responsive research and development activities. It shall produce professional, skilled and morally upright individuals for global competitiveness.
              </p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-8 border-2 border-yellow-200">
              <div className="flex items-center mb-6">
                <Eye className="w-10 h-10 text-yellow-600 mr-3" />
                <h3 className="text-2xl font-bold text-yellow-800">Our Vision</h3>
              </div>
              <p className="text-gray-600 leading-relaxed">
                The premier university in historic Cavite globally recognized for excellence in character development, academics, research, innovation and sustainable community engagement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* NSTP Components Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-green-800 mb-12">NSTP Components</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-red-50 rounded-xl p-6 border-2 border-red-200 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold text-red-800 mb-2">ROTC</h4>
              <p className="text-gray-600">Reserve Officers' Training Corps - Military-based training for national defense preparedness. Students learn discipline, leadership, and patriotism through military education.</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold text-blue-800 mb-2">CWTS</h4>
              <p className="text-gray-600">Civic Welfare Training Service - Community-based activities for social welfare. Students engage in health, education, and environmental projects.</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-6 border-2 border-purple-200 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mb-4">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold text-purple-800 mb-2">LTS</h4>
              <p className="text-gray-600">Literacy Training Service - Educational support for literacy and numeracy skills. Students teach basic education to out-of-school youth and adults.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-green-900 text-white">
        {/* Main Footer */}
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            {/* About - Left side */}
            <div className="md:w-2/3">
              <div className="flex items-center space-x-3 mb-4">
                <img src="/cvsu.png" alt="CvSU Logo" className="w-8 h-8 object-contain" />
                <h4 className="text-xl font-bold">Cavite State University Naic</h4>
              </div>
              <p className="text-green-200 text-sm leading-relaxed mb-4">
                A premier institution committed to providing quality education and producing 
                morally upright graduates who contribute to national development through the 
                National Service Training Program (NSTP).
              </p>
              <p className="text-yellow-400 text-sm font-medium mb-4">Core Values: Truth, Integrity, Excellence, and Service</p>
            </div>

            {/* Contact Info - Far right */}
            <div className="md:w-auto md:text-right">
              <h5 className="text-lg font-semibold mb-4 text-yellow-400">Contact Us</h5>
              <ul className="space-y-3 text-green-200 text-sm">
                <li className="flex items-center space-x-2 md:justify-end">
                  <a 
                    href="https://www.cvsu-naic.edu.ph/"
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors flex items-center space-x-2"
                  >
                    <span>www.cvsu-naic.edu.ph</span>
                    <Globe className="w-5 h-5 text-yellow-400" />
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
                    <Facebook className="w-5 h-5 text-yellow-400" />
                  </a>
                </li>
                <li className="flex items-center space-x-2 md:justify-end">
                  <a href="mailto:info@cvsu-naic.edu.ph" className="hover:text-white transition-colors">info@cvsu-naic.edu.ph</a>
                  <Mail className="w-5 h-5 text-yellow-400" />
                </li>
                <li className="flex items-center space-x-2 md:justify-end">
                  <a href="mailto:registrar@cvsu-naic.edu.ph" className="hover:text-white transition-colors">registrar@cvsu-naic.edu.ph</a>
                  <Mail className="w-5 h-5 text-yellow-400" />
                </li>
                <li className="flex items-start space-x-2 md:justify-end">
                  <span>Naic, Cavite, Philippines</span>
                  <MapPin className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                </li>
                <li className="flex items-center space-x-2 md:justify-end">
                  <span>(046) 890-5138</span>
                  <Phone className="w-5 h-5 text-yellow-400" />
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-green-800">
          <div className="max-w-7xl mx-auto px-4 py-6 flex justify-center items-center text-sm text-green-300">
            <p className="text-center">© 2026 Cavite State University - Naic Campus.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
