import React, { useState } from 'react';
import { FiX, FiBriefcase, FiMapPin, FiDollarSign, FiCode, FiLayers, FiCheckCircle } from 'react-icons/fi';
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 flex min-h-full items-center justify-center p-4 sm:p-6">
      <div 
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white backdrop-blur-md">
              <FiBriefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">Post New Company Opportunity</h3>
              <p className="text-xs text-blue-100">Add listing details for Frontend, Backend, Budget & Location</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="bg-rose-50 border-l-4 border-rose-500 p-3 rounded-r-xl text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Company Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Company / Listing Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <FiBriefcase className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Acme Tech Solutions"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Industry / Category <span className="text-rose-500">*</span>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Headquarters / Location <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <FiMapPin className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  name="headquarters"
                  required
                  value={formData.headquarters}
                  onChange={handleChange}
                  placeholder="e.g. San Francisco, CA or Remote"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Budget / Salary Range
              </label>
              <div className="relative">
                <FiDollarSign className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="e.g. $90,000 - $130,000 / year"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Job Type & Tech Stack */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Employment Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              >
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Contract">Contract</option>
                <option value="Remote">Remote</option>
                <option value="Internship">Internship</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Tech Stack / Skills (comma separated)
              </label>
              <div className="relative">
                <FiCode className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  name="techStack"
                  value={formData.techStack}
                  onChange={handleChange}
                  placeholder="e.g. React, Node.js, MongoDB, Tailwind"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Company Description & Overview <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="description"
              required
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide a detailed description of the company, mission, work culture, and key responsibilities..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <FiCheckCircle className="w-4 h-4" />
                  <span>Publish Opportunity</span>
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
