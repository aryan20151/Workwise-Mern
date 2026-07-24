import React, { useState, useEffect } from 'react';
import { FiX, FiBriefcase, FiMapPin, FiDollarSign, FiCode, FiLayers, FiCheckCircle, FiFileText } from 'react-icons/fi';
import { toast } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import SearchableIndustrySelect from './SearchableIndustrySelect';

const AddCompanyModal = ({ isOpen, onClose, onCompanyAdded }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    industry: 'Frontend',
    headquarters: '',
    budget: '',
    type: 'Full-Time',
    techStack: '',
    description: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Lock background body scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.headquarters.trim() || !formData.description.trim()) {
      setError('Please fill in all required fields (Company Name, Location, and Description).');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.id ? { 'x-user-id': user.id } : {})
        },
        body: JSON.stringify({
          name: formData.name,
          industry: formData.industry,
          headquarters: formData.headquarters,
          budget: formData.budget || 'Negotiable',
          type: formData.type,
          techStack: formData.techStack,
          description: formData.description
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`Company "${formData.name}" added successfully!`);
        if (onCompanyAdded) {
          onCompanyAdded(data.company);
        }
        onClose();
        // Reset form
        setFormData({
          name: '',
          industry: 'Frontend',
          headquarters: '',
          budget: '',
          type: 'Full-Time',
          techStack: '',
          description: ''
        });
      } else {
        setError(data.message || 'Failed to add company listing.');
      }
    } catch (err) {
      console.error('Error adding company:', err);
      setError('An unexpected error occurred. Please try again.');
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
        className="bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] my-auto relative transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Decorative Backdrop Ambient Orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/0 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-cyan-500/10 via-blue-500/10 to-indigo-500/0 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white flex justify-between items-center shrink-0 relative z-10 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl sm:rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white backdrop-blur-md shadow-inner shrink-0">
              <FiBriefcase className="w-5 h-5 text-blue-100" />
            </div>
            <div>
              <h3 className="text-base sm:text-xl font-extrabold tracking-tight text-white leading-snug">Post Company Listing</h3>
              <p className="text-[11px] sm:text-xs text-blue-100 font-medium">Add company details, tech stack, salary budget & location</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-white/80 hover:text-white hover:bg-white/15 rounded-xl transition-all cursor-pointer focus:outline-none shrink-0"
            aria-label="Close modal"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Form Outer Container */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden relative z-10">
          {/* Scrollable Form Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1">
            {error && (
              <div className="bg-rose-50/90 border border-rose-200 text-rose-700 p-3.5 sm:p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Company Name & Industry */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Company Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <FiBriefcase className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Google, Acme Tech"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Industry / Domain <span className="text-rose-500">*</span>
                </label>
                <SearchableIndustrySelect
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  placeholder="Search or type custom industry..."
                  theme="blue"
                />
              </div>
            </div>

            {/* Location & Budget */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Headquarters / Location <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <FiMapPin className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    name="headquarters"
                    required
                    value={formData.headquarters}
                    onChange={handleChange}
                    placeholder="e.g. Mountain View, CA or Remote"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Budget / Salary Range
                </label>
                <div className="relative">
                  <FiDollarSign className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    placeholder="e.g. $120,000 - $160,000 / year"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Employment Type & Tech Stack */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Employment Type
                </label>
                <div className="relative">
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all shadow-2xs appearance-none cursor-pointer"
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Remote">Remote</option>
                    <option value="Internship">Internship</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Tech Stack (comma separated)
                </label>
                <div className="relative">
                  <FiCode className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    name="techStack"
                    value={formData.techStack}
                    onChange={handleChange}
                    placeholder="e.g. React, Node.js, MongoDB, TypeScript"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                <FiFileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Company Description & Scope <span className="text-rose-500">*</span></span>
              </label>
              <textarea
                name="description"
                required
                rows={3}
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide a compelling overview of your company mission, team culture, and technical scope..."
                className="w-full p-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Footer Action Buttons (Sticky at bottom) */}
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
              className="px-5 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-extrabold shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <FiCheckCircle className="w-4 h-4" />
                  <span>Publish Company</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCompanyModal;
