import React, { useState } from 'react';
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

  // If no user, or user is admin, or user has already selected a role, do not render modal
  if (!user || user.role === 'admin' || user.hasSelectedRole === true || (user.role && user.hasSelectedRole !== false)) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full p-8 relative overflow-hidden transform transition-all">
        
        {/* Background Decorative Accents */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-gradient-to-tr from-indigo-400/20 to-purple-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="text-center space-y-3 relative z-10 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold uppercase tracking-wider border border-blue-200">
            <HiSparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            Welcome to WorkWise
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Select Your Account Type
          </h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Choose how you plan to use WorkWise so we can tailor your experience and permissions.
          </p>
        </div>

        {/* Role Cards Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10 mb-8">
          
          {/* Card 1: Job Seeker */}
          <div
            onClick={() => setSelectedRole('jobseeker')}
            className={`cursor-pointer group relative p-5 rounded-2xl border-2 transition-all duration-300 flex flex-col justify-between ${
              selectedRole === 'jobseeker'
                ? 'border-blue-600 bg-blue-50/50 shadow-lg shadow-blue-500/10 ring-2 ring-blue-600/20'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
            }`}
          >
            {selectedRole === 'jobseeker' && (
              <div className="absolute top-4 right-4 text-blue-600">
                <FiCheckCircle className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                selectedRole === 'jobseeker' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600'
              }`}>
                <FiUser className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Job Seeker
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Search open roles, wishlist jobs, submit resume applications, and analyze ATS matches.
              </p>
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 border-t border-slate-100 pt-3">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Browse & Filter Job Requisitions
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Gemini AI ATS Resume Match
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Saved Jobs Wishlist
              </li>
            </ul>
          </div>

          {/* Card 2: Employer */}
          <div
            onClick={() => setSelectedRole('employer')}
            className={`cursor-pointer group relative p-5 rounded-2xl border-2 transition-all duration-300 flex flex-col justify-between ${
              selectedRole === 'employer'
                ? 'border-indigo-600 bg-indigo-50/50 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-600/20'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
            }`}
          >
            {selectedRole === 'employer' && (
              <div className="absolute top-4 right-4 text-indigo-600">
                <FiCheckCircle className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                selectedRole === 'employer' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-600'
              }`}>
                <FiBriefcase className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Employer / Recruiter
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Post job requisitions, manage hiring listings, and evaluate candidates via Kanban pipeline.
              </p>
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 border-t border-slate-100 pt-3">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Post Job Requisitions
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Drag & Drop Candidate Kanban
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Manage Application Statuses
              </li>
            </ul>
          </div>
        </div>

        {selectedRole === 'employer' && (
          <div className="relative z-10 mb-6 animate-fadeIn">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
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
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="relative z-10">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirmRole}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
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
