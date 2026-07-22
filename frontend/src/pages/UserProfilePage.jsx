import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { useAuthStore } from '../store/useAuthStore';
import { 
  FiUser, FiMail, FiLock, FiBriefcase, FiMapPin, FiDollarSign, 
  FiCheckCircle, FiSave, FiAlertCircle, FiArrowLeft, FiEye, FiEyeOff 
} from 'react-icons/fi';

const UserProfilePage = () => {
  const navigate = useNavigate();
  const { user, checkAuthStatus } = useAuth();
  const setUser = useAuthStore((state) => state.setUser);

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'jobseeker',
    companyName: '',
    industry: 'Technology',
    headquarters: '',
    budget: '',
    description: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isLoadingCompany, setIsLoadingCompany] = useState(false);

  const userId = user?.id || user?._id;

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        username: user.username || '',
        email: user.email || '',
        role: user.role || 'jobseeker',
        password: ''
      }));

      if (user.role === 'employer' && userId) {
        setIsLoadingCompany(true);
        fetch('/api/companies/my-listings', {
          credentials: 'include',
          headers: { ...(userId ? { 'x-user-id': userId } : {}) }
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.myCompanies && data.myCompanies.length > 0) {
              const comp = data.myCompanies[0];
              setFormData((prev) => ({
                ...prev,
                companyName: comp.name || '',
                industry: comp.industry || 'Technology',
                headquarters: comp.headquarters || '',
                budget: comp.budget || '',
                description: comp.description || ''
              }));
            }
          })
          .catch((err) => console.error('Error fetching profile company:', err))
          .finally(() => setIsLoadingCompany(false));
      }
    }
  }, [userId, user?.role]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.username.trim() || !formData.email.trim()) {
      setError('Username and Email address are required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const userId = user?.id || user?._id;
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(userId ? { 'x-user-id': userId } : {})
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Profile updated successfully!');
        setFormData((prev) => ({ ...prev, password: '' }));
        
        // Update user state in store
        const updatedUser = {
          ...user,
          username: data.user?.username || formData.username,
          email: data.user?.email || formData.email,
          role: data.user?.role || formData.role,
          hasSelectedRole: true
        };
        setUser(updatedUser);
        localStorage.setItem('workwise_user', JSON.stringify(updatedUser));
        checkAuthStatus();
      } else {
        setError(data.message || 'Failed to update profile.');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('An error occurred while updating profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-500 font-semibold">Please log in to view this page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[calc(100vh-4rem)]">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-blue-200 hover:text-white mb-3 transition-colors cursor-pointer"
          >
            <FiArrowLeft className="w-4 h-4" /> Go Back
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center justify-center font-bold">
              <FiUser className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">My Profile Settings</h1>
          </div>
          <p className="mt-2 text-slate-300 text-sm">
            Manage your personal profile details, account credentials, and company info.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in duration-200">
        <div className="px-8 py-6 bg-slate-900 text-white">
          <h2 className="text-lg font-bold">Account Profiles</h2>
          <p className="text-xs text-slate-400 mt-0.5">Edit username, email address, password, and company.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl flex items-center gap-3 text-rose-700 text-xs font-semibold animate-shake">
              <FiAlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* User Account Details */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
              <FiUser className="w-4 h-4" /> Account Credentials
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Username <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    name="username"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Your username..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your.email@company.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Account Role / Mode
                </label>
                <div className="relative">
                  <FiBriefcase className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    disabled={user?.role === 'admin'}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all disabled:opacity-60 cursor-pointer"
                  >
                    <option value="jobseeker">Job Seeker (Candidate)</option>
                    <option value="employer">Employer (Recruiter / Hiring Manager)</option>
                    {user?.role === 'admin' && <option value="admin">Platform Admin</option>}
                  </select>
                </div>
              </div> */}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password Management
                </label>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                  <FiCheckCircle className="w-3 h-3 text-emerald-600" />
                  Password Set & Encrypted
                </span>
              </div>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="•••••••• (Type here only to change password)"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEye className="w-4 h-4" /> : <FiEyeOff className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                <FiLock className="w-3 h-3 text-slate-400" />
                Your password is protected. Leave this field empty unless you want to update it to a new password.
              </p>
            </div>
          </div>

          {/* Employer Company Details (If User Role === 'employer') */}
          {user.role === 'employer' && (
            <div className="pt-6 border-t border-slate-100 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                <FiBriefcase className="w-4 h-4" /> Company Profile Information
              </h4>

              {isLoadingCompany ? (
                <div className="text-xs text-slate-400 font-semibold py-2">Loading company profile details...</div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Company Name
                    </label>
                    <div className="relative">
                      <FiBriefcase className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        placeholder="e.g. Acme Tech Solutions"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Industry
                      </label>
                      <input
                        type="text"
                        name="industry"
                        value={formData.industry}
                        onChange={handleChange}
                        placeholder="e.g. SaaS, Fintech"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Headquarters
                      </label>
                      <div className="relative">
                        <FiMapPin className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                        <input
                          type="text"
                          name="headquarters"
                          value={formData.headquarters}
                          onChange={handleChange}
                          placeholder="e.g. New York / Remote"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Company Overview / Description
                    </label>
                    <textarea
                      name="description"
                      rows={4}
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Brief overview of company mission, tech stack, and workplace culture..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Form Action Buttons */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <FiSave className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserProfilePage;
