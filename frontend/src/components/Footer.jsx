import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiBriefcase, FiMail, FiMapPin, FiPhone, FiGlobe, FiShield, FiHeart } from 'react-icons/fi';

const Footer = () => {
  const location = useLocation();

  const activeClass = (path) =>
    location.pathname === path ? 'text-blue-400 font-semibold' : 'text-slate-400 hover:text-white transition-colors';

  return (
    <footer className="bg-slate-950 text-slate-400 mt-auto border-t border-slate-900 pt-14 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main 4-Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-900">
          
          {/* Col 1: Brand Info (2 cols wide on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
                <FiBriefcase className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">WorkWise</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              WorkWise connects ambitious talent with leading employers globally. Streamline your hiring process and discover top verified job opportunities.
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs font-semibold text-slate-400">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Verified Network
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-blue-400">
                <FiShield className="w-3.5 h-3.5" /> SSL Secured
              </span>
            </div>
          </div>

          {/* Col 2: Job Seekers */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Job Seekers</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/companies" className={activeClass('/companies')}>
                  Explore Companies
                </Link>
              </li>
              <li>
                <Link to="/requisitions" className={activeClass('/requisitions')}>
                  Job Vacancies
                </Link>
              </li>
              {/* <li>
                <Link to="/apply" className={activeClass('/apply')}>
                  Quick Applications
                </Link>
              </li> */}
              <li>
                <Link to="/cart" className={activeClass('/cart')}>
                  Saved Companies
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Quick Navigation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/homepage" className={activeClass('/homepage')}>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/companies" className={activeClass('/companies')}>
                  Employer Directory
                </Link>
              </li>
              <li>
                <Link to="/contact" className={activeClass('/contact')}>
                  Support & Help Center
                </Link>
              </li>
              <li>
                <Link to="/contact" className={activeClass('/contact')}>
                  Frequently Asked Questions
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Support */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Support & Contact</h4>
            <ul className="space-y-3 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <FiMapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>123 XYZ, Haryana, India</span>
              </li>
              <li className="flex items-center gap-2">
                <FiPhone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>+1 123 456 7890</span>
              </li>
              <li className="flex items-center gap-2">
                <FiMail className="w-4 h-4 text-purple-400 shrink-0" />
                <span>abc@gmail.com</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Sub-footer */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} WorkWise Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/contact" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <Link to="/contact" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
            <Link to="/contact" className="hover:text-slate-300 transition-colors">Support</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
