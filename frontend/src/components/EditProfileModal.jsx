import React, { useState, useEffect } from 'react';
import { toast } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { useAuthStore } from '../store/useAuthStore';
import { 
  FiUser, FiMail, FiLock, FiBriefcase, FiMapPin, FiDollarSign, 
  FiX, FiCheckCircle, FiSave, FiAlertCircle, FiEye, FiEyeOff, FiShield, FiFileText 
} from 'react-icons/fi';

const EditProfileModal = ({ isOpen, onClose }) => {
  const { user, checkAuthStatus } = useAuth();
  const setUser = useAuthStore((state) => state.setUser);

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    companyName: '',
    industry: 'Technology',
    headquarters: '',
    budget: '',
    description: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isLoadingCompany, setIsLoadingCompany] = useState(false);

  // Initialize form with current user and company details
  useEffect(() => {
    if (user && isOpen) {
      setFormData((prev) => ({
        ...prev,
        username: user.username || '',
        email: user.email || '',
        password: ''
      }));

      if (user.role === 'employer') {
        setIsLoadingCompany(true);
        const userId = user.id || user._id;
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
  }, [user, isOpen]);

  // Lock background body scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen || !user) return null;

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
      const userId = user.id || user._id;
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
        
        // Update user state in store
        const updatedUser = {
          ...user,
          username: data.user?.username || formData.username,
          email: data.user?.email || formData.email
        };
        setUser(updatedUser);
        localStorage.setItem('workwise_user', JSON.stringify(updatedUser));
        checkAuthStatus();
        onClose();
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

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200 flex items-center justify-center p-3 sm:p-4 md:p-6"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] flex flex-col my-auto relative transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Decorative Ambient Orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-indigo-500/0 rounded-full blur-3xl pointer-events-none" />
        
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white flex justify-between items-center shrink-0 relative z-10 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl sm:rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 backdrop-blur-md shadow-inner shrink-0">
              <FiUser className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white tracking-tight leading-snug">Edit Profile & Account</h3>
              <p className="text-[11px] sm:text-xs text-slate-300 font-medium">Update username, email & security settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer focus:outline-none shrink-0"
            aria-label="Close modal"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden relative z-10">
          <div className="p-5 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
            {error && (
              <div className="bg-rose-50 border border-rose-200 p-3.5 sm:p-4 rounded-2xl flex items-center gap-3 text-rose-700 text-xs font-semibold animate-in fade-in">
                <FiAlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* User Account Details */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-600 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <FiShield className="w-4 h-4 text-blue-600" /> Account Credentials
              </h4>

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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  New Password <span className="text-slate-400 font-normal lowercase">(leave blank to keep current)</span>
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Type new password..."
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FiEye className="w-4 h-4 text-blue-600" /> : <FiEyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Employer Company Details (If User Role === 'employer') */}
            {user.role === 'employer' && (
              <div className="pt-4 border-t border-slate-100 space-y-3.5">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <FiBriefcase className="w-4 h-4 text-indigo-600" /> Company Profile Details
                </h4>

                {isLoadingCompany ? (
                  <div className="text-xs text-slate-400 font-semibold py-2 flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    Loading company profile details...
                  </div>
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
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                          className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
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
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
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
                        rows={3}
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Brief overview of company culture and tech stack..."
                        className="w-full p-3 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Modal Action Footer */}
          <div className="px-5 sm:px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 sm:px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <FiSave className="w-4 h-4" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
