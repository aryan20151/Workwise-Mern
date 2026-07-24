import React, { useState, useEffect } from 'react';
import { toast } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { useAuthStore } from '../store/useAuthStore';
import { 
  FiUser, FiMail, FiLock, FiBriefcase, FiMapPin, FiDollarSign, 
  FiX, FiCheckCircle, FiSave, FiAlertCircle, FiEye, FiEyeOff 
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex min-h-full items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[85vh] sm:max-h-[90vh] flex flex-col my-auto">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <FiUser className="w-5 h-5 text-blue-400" />
              <span>Edit Profile & Account</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Update your account details and password.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl flex items-center gap-3 text-rose-700 text-xs font-semibold">
              <FiAlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* User Account Details */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
              <FiUser className="w-4 h-4" /> Account Credentials
            </h4>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Username <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <FiUser className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Your username..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@company.com"
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                New Password (leave blank to keep current)
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Type new password..."
                  className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
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
            </div>
          </div>

          {/* Employer Company Details (If User Role === 'employer') */}
          {user.role === 'employer' && (
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                <FiBriefcase className="w-4 h-4" /> Company Profile Information
              </h4>

              {isLoadingCompany ? (
                <div className="text-xs text-slate-400 font-semibold py-2">Loading company profile details...</div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Company Name
                    </label>
                    <div className="relative">
                      <FiBriefcase className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        placeholder="e.g. Acme Tech Solutions"
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Industry
                      </label>
                      <input
                        type="text"
                        name="industry"
                        value={formData.industry}
                        onChange={handleChange}
                        placeholder="e.g. SaaS, Fintech"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Headquarters
                      </label>
                      <div className="relative">
                        <FiMapPin className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
                        <input
                          type="text"
                          name="headquarters"
                          value={formData.headquarters}
                          onChange={handleChange}
                          placeholder="e.g. New York / Remote"
                          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Company Overview / Description
                    </label>
                    <textarea
                      name="description"
                      rows={3}
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Brief overview of company culture and tech stack..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Modal Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <FiSave className="w-3.5 h-3.5" />
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
