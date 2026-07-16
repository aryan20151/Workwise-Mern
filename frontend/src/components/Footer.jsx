import React from 'react';
import { FiBriefcase } from 'react-icons/fi';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <FiBriefcase className="w-4 h-4" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">WorkWise</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <a href="/homepage" className="hover:text-white transition-colors">Home</a>
            <a href="/companies" className="hover:text-white transition-colors">Companies</a>
            <a href="/contact" className="hover:text-white transition-colors">Contact</a>
            <span className="text-slate-700">|</span>
            <p className="text-slate-500">© {new Date().getFullYear()} WorkWise. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
