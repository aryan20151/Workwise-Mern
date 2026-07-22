import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { 
  FiFileText, FiBriefcase, FiMapPin, FiDollarSign, FiCode, 
  FiLayers, FiCheckCircle, FiArrowLeft, FiAlertCircle, FiPlus 
} from 'react-icons/fi';

const EmployerPostRequisitionPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [companies, setCompanies] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    companyName: '',
    companyId: '',
    industry: 'Technology',
    location: '',
    budget: '',
    jobType: 'Full-Time',
    techStack: '',
    description: ''
  });

  const [myCompanies, setMyCompanies] = useState([]);
  const [hasCheckedCompanies, setHasCheckedCompanies] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch companies for employer onboarding check & dropdown suggestion
  useEffect(() => {
    const fetchCompaniesData = async () => {
      try {
        const storedUser = (() => {
          try { return JSON.parse(localStorage.getItem('workwise_user')); } catch (e) { return null; }
        })();
        const userId = user?.id || user?._id || storedUser?.id || storedUser?._id;

        const [resAll, resMy] = await Promise.all([
          fetch('/api/companies'),
          fetch('/api/companies/my-listings', {
            credentials: 'include',
            headers: { ...(userId ? { 'x-user-id': userId } : {}) }
          })
        ]);

        const dataAll = await resAll.json();
        const dataMy = await resMy.json();

        if (resAll.ok && dataAll.success) {
          setCompanies(dataAll.companies || []);
        }
        if (resMy.ok && dataMy.success) {
          const myComps = dataMy.myCompanies || [];
          setMyCompanies(myComps);
          if (myComps.length > 0) {
            setFormData((prev) => ({
              ...prev,
              companyName: myComps[0].name,
              companyId: myComps[0].companyId,
              location: prev.location || myComps[0].headquarters || ''
            }));
          }
        }
      } catch (err) {
        console.error('Error loading companies data:', err);
      } finally {
        setHasCheckedCompanies(true);
      }
    };
    fetchCompaniesData();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'companySelect') {
      const selectedComp = companies.find((c) => c.companyId === value);
      if (selectedComp) {
        setFormData((prev) => ({
          ...prev,
          companyId: selectedComp.companyId,
          companyName: selectedComp.name,
          location: prev.location || selectedComp.headquarters || ''
        }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim() || !formData.companyName.trim() || !formData.location.trim() || !formData.description.trim()) {
      setError('Please fill in all required fields (Job Title, Company, Location, and Description).');
      return;
    }

    setIsSubmitting(true);

    try {
      const storedUser = (() => {
        try { return JSON.parse(localStorage.getItem('workwise_user')); } catch (e) { return null; }
      })();
      const userId = user?.id || user?._id || storedUser?.id || storedUser?._id;

      const response = await fetch('/api/requisitions', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(userId ? { 'x-user-id': userId } : {})
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`Job Requisition "${formData.title}" posted successfully!`);
        navigate('/requisitions');
      } else {
        setError(data.message || 'Failed to post job requisition.');
      }
    } catch (err) {
      console.error('Error posting requisition:', err);
      setError('An error occurred while publishing the job requisition.');
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
            onClick={() => navigate('/requisitions')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-blue-200 hover:text-white mb-3 transition-colors cursor-pointer"
          >
            <FiArrowLeft className="w-4 h-4" /> Back to Job Requisitions
          </button>
          <h1 className="text-3xl font-extrabold tracking-tight">Post New Job Requisition</h1>
          <p className="mt-1 text-slate-300 text-sm">
            Create an open position requisition with job title, salary budget, tech stack, and location.
          </p>
        </div>
      </div>

      {/* Onboarding Guard: No Company Created Yet */}
      {hasCheckedCompanies && user?.role === 'employer' && myCompanies.length === 0 ? (
        <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-3xl p-10 shadow-xl text-center my-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-4 font-bold shadow-xs">
            <FiBriefcase className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Company Profile Required
          </h2>
          <p className="mt-2 text-slate-600 text-sm leading-relaxed max-w-md mx-auto">
            You don't have a company profile yet. Please create your company profile first before posting job requisitions.
          </p>
          <button
            onClick={() => navigate('/post-company')}
            className="mt-6 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/25 transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <FiPlus className="w-4 h-4" />
            <span>Create Company Profile</span>
          </button>
        </div>
      ) : (
        /* Main Form Page */
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="px-8 py-6 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Job Requisition Details</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Fill in position details to publish this requisition to the job board.
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

          {/* Row 1: Job Title & Company */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Job Position Title <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <FiFileText className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Senior Full Stack Engineer"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Company Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <FiBriefcase className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  name="companyName"
                  required
                  readOnly={user?.role === 'employer'}
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="e.g. Acme Tech Solutions"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm font-medium focus:outline-none transition-all ${
                    user?.role === 'employer' 
                      ? 'bg-slate-100 border-slate-200 text-slate-700 font-bold cursor-not-allowed' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Row 2: Location & Salary Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Job Location <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <FiMapPin className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  name="location"
                  required
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. San Francisco, CA / Remote"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Salary Budget Range
              </label>
              <div className="relative">
                <FiDollarSign className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="e.g. $120,000 - $160,000 / year"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Row 3: Employment Type & Tech Stack */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Employment Type
              </label>
              <select
                name="jobType"
                value={formData.jobType}
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
                Required Tech Stack (comma separated)
              </label>
              <div className="relative">
                <FiCode className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  name="techStack"
                  value={formData.techStack}
                  onChange={handleChange}
                  placeholder="e.g. React, TypeScript, Node.js, AWS"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Job Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Requisition Description & Scope <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="description"
              required
              rows={5}
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe key responsibilities, requirements, qualifications, and benefits..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 flex justify-end items-center gap-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/requisitions')}
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
                  <span>Publish Job Requisition</span>
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

export default EmployerPostRequisitionPage;
