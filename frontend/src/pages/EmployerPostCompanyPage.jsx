import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { 
  FiBriefcase, FiMapPin, FiDollarSign, FiCode, FiLayers, 
  FiCheckCircle, FiArrowLeft, FiAlertCircle 
} from 'react-icons/fi';
import SearchableIndustrySelect from '../components/SearchableIndustrySelect';

const EmployerPostCompanyPage = () => {
  const navigate = useNavigate();
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

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myCompanies, setMyCompanies] = useState([]);
  const [hasChecked, setHasChecked] = useState(false);

  React.useEffect(() => {
    const checkComps = async () => {
      try {
        const storedUser = (() => {
          try { return JSON.parse(localStorage.getItem('workwise_user')); } catch (e) { return null; }
        })();
        const userId = user?.id || user?._id || storedUser?.id || storedUser?._id;

        const res = await fetch('/api/companies/my-listings', {
          credentials: 'include',
          headers: { ...(userId ? { 'x-user-id': userId } : {}) }
        });
        const data = await res.json();
        if (res.ok && data.myCompanies) {
          setMyCompanies(data.myCompanies);
        }
      } catch (e) {
        console.error('Error loading employer companies:', e);
      } finally {
        setHasChecked(true);
      }
    };
    checkComps();
  }, [user]);

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

    const cleanName = formData.name.trim().replace(/\s+/g, ' ').toLowerCase();
    const existing = myCompanies.find(c => c.name && c.name.trim().replace(/\s+/g, ' ').toLowerCase() === cleanName);
    if (existing) {
      setError(`A company named "${existing.name}" already exists. Duplicate company names in uppercase or lowercase are not allowed.`);
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
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`Company "${formData.name}" published successfully!`);
        navigate('/manage-companies');
      } else {
        setError(data.message || 'Failed to publish company listing.');
      }
    } catch (err) {
      console.error('Error adding company:', err);
      setError('An error occurred while publishing the listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[calc(100vh-4rem)]">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
        <div>
          <button
            onClick={() => navigate('/manage-companies')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-blue-200 hover:text-white mb-3 transition-colors cursor-pointer"
          >
            <FiArrowLeft className="w-4 h-4" /> Back to Manage Listings
          </button>
          <h1 className="text-3xl font-extrabold tracking-tight">Post New Opportunity</h1>
          <p className="mt-1 text-slate-300 text-sm">
            Publish a new company or job listing with details for Frontend, Backend, Budget, Location, and Tech Stack.
          </p>
        </div>
      </div>

      {/* Single Company Profile Limit Guard for Employers */}
      {hasChecked && user?.role === 'employer' && myCompanies.length >= 1 ? (
        <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-3xl p-10 shadow-xl text-center my-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto mb-4 font-bold shadow-xs">
            <FiBriefcase className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Company Profile Active
          </h2>
          <p className="mt-2 text-slate-600 text-sm leading-relaxed max-w-md mx-auto">
            You already have an active company profile ({myCompanies[0].name}). Each employer account can manage 1 company profile.
          </p>
          <button
            onClick={() => navigate('/manage-companies')}
            className="mt-6 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/25 transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <FiCheckCircle className="w-4 h-4" />
            <span>Manage My Company</span>
          </button>
        </div>
      ) : (
        /* Main Dedicated Form Page */
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="px-8 py-6 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">New Company Listing Details</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Fill in all fields to make your company visible in the main candidate directory.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl flex items-center gap-3 text-rose-700 text-sm font-semibold">
              <FiAlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Row 1: Company Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
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
                  placeholder="e.g. Acme Tech Solutions"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Category / Industry Sector <span className="text-rose-500">*</span>
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

          {/* Row 2: Location & Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
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
                  placeholder="e.g. San Francisco, CA / Remote"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Budget / Salary Range
              </label>
              <div className="relative">
                <FiDollarSign className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="e.g. $100,000 - $140,000 / year"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Row 3: Job Type & Tech Stack */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Employment Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
              >
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Contract">Contract</option>
                <option value="Remote">Remote</option>
                <option value="Internship">Internship</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Tech Stack / Skills (comma separated)
              </label>
              <div className="relative">
                <FiCode className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  name="techStack"
                  value={formData.techStack}
                  onChange={handleChange}
                  placeholder="e.g. React, Node.js, Express, MongoDB"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Detailed Overview & Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="description"
              required
              rows={5}
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe company mission, team culture, requirements, and responsibilities..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex justify-end items-center gap-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/manage-companies')}
              className="px-5 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 text-sm transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-7 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
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
      )}
    </div>
  );
};

export default EmployerPostCompanyPage;
