import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiShieldOff, FiHome, FiArrowLeft, FiUserCheck, FiBriefcase, FiLock } from 'react-icons/fi';

const AccessDeniedPage = ({ requiredRole }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="max-w-lg w-full bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 text-center shadow-xl space-y-6">
        
        {/* Shield Icon */}
        <div className="w-20 h-20 rounded-3xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto shadow-inner">
          <FiShieldOff className="w-10 h-10" />
        </div>

        <div>
          <span className="px-3.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-mono font-bold uppercase tracking-wider">
            Error 403 — Access Denied
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-3">
            Permission Restricted
          </h1>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">
            You don't have permission to view this page. {requiredRole ? `This area requires a '${requiredRole}' role.` : 'Your current user account lacks authorization for this route.'}
          </p>
        </div>

        {user && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiLock className="text-slate-400 w-4 h-4" />
              <span>Current Role: <strong className="text-slate-800 uppercase font-extrabold">{user.role || 'jobseeker'}</strong></span>
            </div>
            <span className="text-slate-400">Account: {user.username}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate('/homepage')}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
          >
            <FiHome className="w-4 h-4" />
            <span>Go to Homepage</span>
          </button>

          <button
            onClick={() => navigate('/requisitions')}
            className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <FiBriefcase className="w-4 h-4 text-blue-600" />
            <span>Browse Job Roles</span>
          </button>
        </div>

        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <FiArrowLeft className="w-3.5 h-3.5" /> Back to Previous Page
          </button>
        </div>

      </div>
    </div>
  );
};

export default AccessDeniedPage;
