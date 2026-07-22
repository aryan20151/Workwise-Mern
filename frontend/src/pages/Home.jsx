import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiChevronLeft, FiChevronRight, FiCheckCircle, FiTrendingUp, FiAward, FiBriefcase, FiPlus } from 'react-icons/fi';

const slides = [
  {
    image: 'https://img.freepik.com/premium-photo/avenue-katsura-trees-full-bloom-autumn-people_1106493-64659.jpg?w=1380',
    title: 'Find Your Dream Job',
    description: 'Explore thousands of job opportunities in various industries with premium companies.'
  },
  {
    image: 'https://media.istockphoto.com/id/1310441327/photo/microsoft-france-headquarters-entrance-in-issy-les-moulineaux-near-paris.jpg?s=612x612&w=0&k=20&c=w4df4OwilAGtPb01aXv910ND85E9Vh0I8qZ4CuRbFqI=',
    title: 'Top Companies Hiring',
    description: 'Connect directly with leading corporate giants and fast-growing tech startups worldwide.'
  },
  {
    image: 'https://kadence.co/wp-content/uploads/2024/12/Amazon-HQ-in-Sunnyvale-California.jpg',
    title: 'Build Your Future',
    description: 'Elevate your career trajectory to the next level with customized job match updates.'
  }
];

const testimonials = [
  {
    quote: "WorkWise helped me find my dream job within weeks. The platform is user-friendly and the job listings are up-to-date.",
    author: "Sarah Johnson",
    role: "Software Engineer at Google"
  },
  {
    quote: "As a recruiter, I've found excellent candidates through WorkWise. The quality of applicants is consistently high.",
    author: "Michael Chen",
    role: "Talent Acquisition at Stripe"
  },
  {
    quote: "The career resources on WorkWise are invaluable. I improved my resume and interview skills significantly.",
    author: "Emily Rodriguez",
    role: "Product Designer at Figma"
  }
];

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [myCompaniesCount, setMyCompaniesCount] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const checkEmployerCompanies = async () => {
      const storedUser = (() => {
        try { return JSON.parse(localStorage.getItem('workwise_user')); } catch (e) { return null; }
      })();
      const currentUser = user || storedUser;
      if (currentUser?.role === 'employer') {
        try {
          const userId = currentUser.id || currentUser._id;
          const res = await fetch('/api/companies/my-listings', {
            credentials: 'include',
            headers: { ...(userId ? { 'x-user-id': userId } : {}) }
          });
          const data = await res.json();
          if (res.ok && data.myCompanies) {
            setMyCompaniesCount(data.myCompanies.length);
          }
        } catch (e) {
          console.error('Error checking employer companies on Home:', e);
        }
      }
    };
    checkEmployerCompanies();
  }, [user]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem('workwise_user')); } catch (e) { return null; }
  })();
  const activeUser = user || storedUser;

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Employer Onboarding / Dashboard Header Banner */}
      {activeUser?.role === 'employer' && (
        <div className="bg-slate-900 border-b border-slate-800 py-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 bg-gradient-to-r from-blue-900/80 via-indigo-900/80 to-slate-950 p-6 rounded-2xl border border-blue-500/30 text-white shadow-2xl">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 text-xs font-extrabold rounded-md uppercase tracking-wider border border-blue-500/30">
                  Employer Portal
                </span>
                {myCompaniesCount === 0 && (
                  <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 text-xs font-extrabold rounded-md uppercase tracking-wider border border-amber-500/30">
                    Action Required
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight">
                Welcome back, {activeUser?.username || 'Employer'}!
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                Manage your open job requisitions, post new positions, and review your candidate pipeline.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => navigate('/post-requisition')}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <FiPlus className="w-4 h-4" />
                <span>Post Job Requisition</span>
              </button>
              <button
                onClick={() => navigate('/requisitions')}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Job Requisitions
              </button>
              <button
                onClick={() => navigate('/candidate-pipeline')}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Candidate Pipeline
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Hero Section Carousel */}
      <section className="relative h-[550px] overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-10 bg-slate-950/40"></div>
        
        {/* Slides */}
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentSlide ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover transform scale-105 transition-transform duration-[6000ms]"
            />
            {/* Slide Caption */}
            <div className="absolute inset-0 z-20 flex flex-col justify-center items-center text-center px-4 sm:px-6">
              <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight drop-shadow-md">
                  {slide.title}
                </h1>
                <p className="mt-4 text-lg sm:text-xl text-slate-100 max-w-2xl mx-auto font-medium drop-shadow-sm">
                  {slide.description}
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                  <Link
                    to="/companies"
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    Browse Companies
                  </Link>
                  <Link
                    to="/contact"
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 backdrop-blur-md transition-all duration-200"
                  >
                    Contact Us
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Carousel controls */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/20 hover:bg-black/40 text-white border border-white/10 backdrop-blur-sm transition-colors"
        >
          <FiChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/20 hover:bg-black/40 text-white border border-white/10 backdrop-blur-sm transition-colors"
        >
          <FiChevronRight className="w-6 h-6" />
        </button>

        {/* Dots indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-3 h-3 rounded-full transition-all ${
                idx === currentSlide ? 'bg-blue-600 w-8' : 'bg-white/50 hover:bg-white'
              }`}
            />
          ))}
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              About WorkWise
            </h2>
            <p className="mt-4 text-lg text-slate-500 leading-relaxed">
              WorkWise is your trusted job search partner, bridging the gap between talent and opportunity. We provide a sleek, centralized portal to discover new openings, communicate with recruiters, and organize applications cleanly in one workspace.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:shadow-lg transition-all duration-200">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                <FiCheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Verified Openings</h3>
              <p className="text-slate-500">Every corporate and company profile on our grid is vetted and certified by our internal recruiting board.</p>
            </div>
            
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:shadow-lg transition-all duration-200">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
                <FiTrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Track Application Carts</h3>
              <p className="text-slate-500">Keep records of all submitted applications, look up resume files, or start face-to-face video screens easily.</p>
            </div>

            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:shadow-lg transition-all duration-200">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6">
                <FiAward className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Career Development</h3>
              <p className="text-slate-500">Access support options and mock video interfaces to practice and excel during interviews.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              What Our Users Say
            </h2>
            <p className="mt-4 text-lg text-slate-500">
              Hear directly from the candidates and companies using the WorkWise ecosystem.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((test, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <p className="text-slate-600 italic leading-relaxed">
                  "{test.quote}"
                </p>
                <div className="mt-6 border-t border-slate-150 pt-4 flex flex-col">
                  <span className="font-bold text-slate-800">{test.author}</span>
                  <span className="text-xs font-semibold text-slate-400 mt-0.5">{test.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
