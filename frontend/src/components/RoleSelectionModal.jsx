import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from '../utils/toast';
import api from '../utils/api';
import { FiUser, FiBriefcase, FiCheckCircle, FiArrowRight } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';

const RoleSelectionModal = () => {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [selectedRole, setSelectedRole] = useState('jobseeker');
  const [companyName, setCompanyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showModal = Boolean(user && user.role !== 'admin' && user.hasSelectedRole !== true && (!user.role || user.hasSelectedRole === false));

  // Lock background body scroll when modal is active
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [showModal]);

  // If no user, or user is admin, or user has already selected a role, do not render modal
  if (!showModal) {
    return null;
  }

  const handleConfirmRole = async () => {
    if (selectedRole === 'employer' && !companyName.trim()) {
      toast.error('Please enter your Company Name to continue.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/api/auth/select-role', {
        role: selectedRole,
        companyName
      });

      const data = response.data;

      if (data.success && data.user) {
        toast.success(`Role updated! Welcome as ${selectedRole === 'employer' ? 'an Employer' : 'a Job Seeker'}.`);
        setUser({
          ...user,
          ...data.user,
          hasSelectedRole: true
        });
      } else {
        toast.error(data.message || 'Failed to update role. Please try again.');
      }
    } catch (error) {
      console.error('Error selecting role:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200 flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full flex flex-col relative my-auto max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
        
        {/* Background Decorative Accents */}
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-gradient-to-br from-blue-400/20 via-indigo-500/20 to-purple-500/0 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-gradient-to-tr from-indigo-400/20 via-purple-500/20 to-pink-500/0 rounded-full blur-3xl pointer-events-none" />

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-8 overflow-y-auto flex-1 space-y-6 relative z-10">
          {/* Modal Header */}
          <div className="text-center space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/80 text-blue-700 text-[11px] sm:text-xs font-bold uppercase tracking-wider border border-blue-200/80 shadow-2xs">
              <HiSparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span>Welcome to WorkWise</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Select Your Account Type
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm font-medium max-w-md mx-auto">
              Choose how you plan to use WorkWise so we can customize your dashboard & workspace capabilities.
            </p>
          </div>

          {/* Role Cards Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Card 1: Job Seeker */}
            <div
              onClick={() => setSelectedRole('jobseeker')}
              className={`cursor-pointer group relative p-4 sm:p-5 rounded-2xl border-2 transition-all duration-300 flex flex-col justify-between ${
                selectedRole === 'jobseeker'
                  ? 'border-blue-600 bg-blue-50/60 shadow-xl shadow-blue-500/15 ring-4 ring-blue-500/10'
                  : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-md'
              }`}
            >
              {selectedRole === 'jobseeker' && (
                <div className="absolute top-4 right-4 text-blue-600 bg-white rounded-full p-0.5 shadow-2xs">
                  <FiCheckCircle className="w-5 h-5 fill-blue-600 text-white" />
                </div>
              )}
              <div>
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mb-3 transition-all duration-300 ${
                  selectedRole === 'jobseeker' 
                    ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105' 
                    : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                }`}>
                  <FiUser className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mb-1">
                  Job Seeker
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed mb-3">
                  Explore open developer positions, wishlist top roles, submit applications, and run AI ATS scans.
                </p>
              </div>
              <ul className="text-xs text-slate-600 font-semibold space-y-1.5 border-t border-slate-200/60 pt-3">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  Browse & Filter Job Requisitions
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  Gemini AI ATS Resume Matcher
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  Saved Jobs Wishlist Portal
                </li>
              </ul>
            </div>

            {/* Card 2: Employer */}
            <div
              onClick={() => setSelectedRole('employer')}
              className={`cursor-pointer group relative p-4 sm:p-5 rounded-2xl border-2 transition-all duration-300 flex flex-col justify-between ${
                selectedRole === 'employer'
                  ? 'border-indigo-600 bg-indigo-50/60 shadow-xl shadow-indigo-500/15 ring-4 ring-indigo-500/10'
                  : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-md'
              }`}
            >
              {selectedRole === 'employer' && (
                <div className="absolute top-4 right-4 text-indigo-600 bg-white rounded-full p-0.5 shadow-2xs">
                  <FiCheckCircle className="w-5 h-5 fill-indigo-600 text-white" />
                </div>
              )}
              <div>
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mb-3 transition-all duration-300 ${
                  selectedRole === 'employer' 
                    ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 scale-105' 
                    : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-600'
                }`}>
                  <FiBriefcase className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mb-1">
                  Employer / Recruiter
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed mb-3">
                  Post job requisitions, manage company profiles, and evaluate applicants on a Kanban pipeline.
                </p>
              </div>
              <ul className="text-xs text-slate-600 font-semibold space-y-1.5 border-t border-slate-200/60 pt-3">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                  Post Job Openings & Listings
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                  Candidate Drag & Drop Kanban
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                  Manage Application Pipeline
                </li>
              </ul>
            </div>
          </div>

          {selectedRole === 'employer' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                Company Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <FiBriefcase className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Corporation"
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all shadow-2xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Button (Sticky Footer) */}
        <div className="p-4 sm:p-6 bg-slate-50/80 border-t border-slate-100 shrink-0 relative z-20">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirmRole}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-extrabold text-sm shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2.5 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Saving Selection...</span>
              </>
            ) : (
              <>
                <span>Continue as {selectedRole === 'employer' ? 'Employer' : 'Job Seeker'}</span>
                <FiArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default RoleSelectionModal;
