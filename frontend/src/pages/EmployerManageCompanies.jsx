import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import KanbanBoard from '../components/KanbanBoard';
import { 
  FiBriefcase, FiPlus, FiEdit3, FiTrash2, FiSearch, FiMapPin, 
  FiDollarSign, FiCode, FiLayers, FiCheckCircle, FiRefreshCw, FiArrowLeft, FiAlertCircle, FiColumns, FiSliders,
  FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight, FiX
} from 'react-icons/fi';
import SearchableIndustrySelect from '../components/SearchableIndustrySelect';

const EmployerManageCompanies = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [companies, setCompanies] = useState([]);
  const [myCompanies, setMyCompanies] = useState([]);
  const [listingFilter, setListingFilter] = useState('all'); // Default to 'all' so Admin and users see all postings
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Active view tab: 'list' or 'form'
  const [activeTab, setActiveTab] = useState('list');
  
  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
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
  const [formError, setFormError] = useState('');

  // Fetch Companies
  const fetchMyCompanies = async () => {
    setIsLoading(true);
    setError('');
    try {
      const storedUser = (() => {
        try { return JSON.parse(localStorage.getItem('workwise_user')); } catch (e) { return null; }
      })();
      const userId = user?.id || user?._id || storedUser?.id || storedUser?._id;

      const response = await fetch('/api/companies/my-listings', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(userId ? { 'x-user-id': userId } : {})
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setCompanies(data.companies || []);
        setMyCompanies(data.myCompanies || []);
      } else {
        setError(data.message || 'Failed to fetch company listings.');
      }
    } catch (err) {
      console.error('Error fetching employer companies:', err);
      setError('An error occurred while loading your company listings.');
    } finally {
      setIsLoading(false);
    }
  };

  const userId = user?.id || user?._id;

  useEffect(() => {
    fetchMyCompanies();
  }, [userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Pre-fill form for editing
  const handleEditClick = (company) => {
    setIsEditing(true);
    setEditingId(company.companyId);
    setFormData({
      name: company.name || '',
      industry: company.industry || 'Frontend',
      headquarters: company.headquarters || '',
      budget: company.budget || company.salaryRange || '',
      type: company.type || company.jobType || 'Full-Time',
      techStack: Array.isArray(company.techStack) ? company.techStack.join(', ') : (company.techStack || ''),
      description: company.description || ''
    });
    setFormError('');
    setActiveTab('form');
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      name: '',
      industry: 'Frontend',
      headquarters: '',
      budget: '',
      type: 'Full-Time',
      techStack: '',
      description: ''
    });
    setFormError('');
  };

  const handleStartNew = () => {
    resetForm();
    setActiveTab('form');
  };

  // Form Submit (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim() || !formData.headquarters.trim() || !formData.description.trim()) {
      setFormError('Please fill in all required fields (Company Name, Location, and Description).');
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = isEditing ? `/api/companies/${editingId}` : '/api/companies';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.id ? { 'x-user-id': user.id } : {})
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(isEditing ? 'Company listing updated!' : 'Company listing created!');
        resetForm();
        fetchMyCompanies();
        setActiveTab('list');
      } else {
        setFormError(data.message || 'Failed to save company details.');
      }
    } catch (err) {
      console.error('Save error:', err);
      setFormError('Error communicating with server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Company
  const handleDeleteClick = async (companyId, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/companies/${companyId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          ...(user?.id ? { 'x-user-id': user.id } : {})
        }
      });
      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`Deleted "${name}"`);
        setCompanies((prev) => prev.filter((c) => c.companyId !== companyId));
        setMyCompanies((prev) => prev.filter((c) => c.companyId !== companyId));
      } else {
        toast.error(data.message || 'Failed to delete company.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Error deleting company listing.');
    }
  };

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [jumpPageInput, setJumpPageInput] = useState('1');
  const [isPageLoading, setIsPageLoading] = useState(false);

  // Filtered List based on tab selection ('my' vs 'all')
  const targetList = (user?.role === 'admin' || listingFilter === 'all') ? companies : myCompanies;
  const filteredList = targetList.filter((c) => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;
    return (
      (c.name || '').toLowerCase().includes(term) ||
      (c.industry || '').toLowerCase().includes(term) ||
      (c.headquarters || '').toLowerCase().includes(term)
    );
  });

  // Pagination Calculations
  const totalItems = filteredList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedList = filteredList.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, listingFilter]);

  useEffect(() => {
    setJumpPageInput(String(currentPage));
  }, [currentPage]);

  const handleJumpInputChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      setJumpPageInput('');
      return;
    }
    const pageNum = parseInt(val, 10);
    if (!isNaN(pageNum)) {
      if (pageNum > totalPages) {
        setJumpPageInput(String(totalPages));
      } else {
        setJumpPageInput(val);
      }
    } else {
      setJumpPageInput(val);
    }
  };

  const handleJumpSubmit = (e) => {
    if (e) e.preventDefault();
    const pageNum = parseInt(jumpPageInput, 10);
    if (!isNaN(pageNum)) {
      const clampedPage = Math.max(1, Math.min(pageNum, totalPages));
      handlePageChange(clampedPage);
      setJumpPageInput(String(clampedPage));
    } else {
      setJumpPageInput(String(currentPage));
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setIsPageLoading(true);
      setCurrentPage(newPage);
      window.scrollTo({ top: 200, behavior: 'smooth' });
      setTimeout(() => {
        setIsPageLoading(false);
      }, 300);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[calc(100vh-4rem)]">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
        <div>
          <button
            onClick={() => navigate('/companies')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-blue-200 hover:text-white mb-3 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" /> Back to Company Directory
          </button>
          <h1 className="text-3xl font-extrabold tracking-tight">Employer Management Hub</h1>
          <p className="mt-1 text-slate-300 text-sm">
            Add, update, or remove company job postings and listings in real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-white/10 rounded-lg text-xs font-bold">My Postings: {myCompanies.length}</span>
            <span className="px-3 py-1 bg-white/10 rounded-lg text-xs font-bold">Total Platform: {companies.length}</span>
          </div>
          {/* <button
            onClick={() => navigate('/candidate-pipeline')}
            className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 bg-white/10 text-white hover:bg-white/20 cursor-pointer"
          >
            <FiSliders className="w-4 h-4" />
            <span>Candidate Pipeline</span>
          </button> */}
          {(user?.role === 'admin' || (user?.role === 'employer' && myCompanies.length === 0)) && (
            <button
              onClick={() => navigate('/post-company')}
              className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/30 cursor-pointer"
            >
              <FiPlus className="w-4 h-4" />
              <span>Create Company Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'kanban' ? (
        <KanbanBoard />
      ) : activeTab === 'form' ? (
        /* Dedicated Full-Page Form Section */
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in duration-200">
          <div className="px-8 py-6 bg-slate-900 text-white flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">
                {isEditing ? `Edit Company: ${formData.name}` : 'Create New Company Listing'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Fill out the details for Frontend, Backend, Budget, Location, and Tech Stack.
              </p>
            </div>
            {isEditing && (
              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold uppercase">
                Editing Mode
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {formError && (
              <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl flex items-center gap-3 text-rose-700 text-sm font-semibold">
                <FiAlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Row 1: Name & Industry */}
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
                    placeholder="e.g. WorkWise Corp"
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
                    placeholder="e.g. New York, NY / Remote"
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
                placeholder="Describe company goals, expectations, culture, and key technical duties..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
              />
            </div>

            {/* Buttons */}
            <div className="pt-4 flex justify-end items-center gap-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setActiveTab('list'); resetForm(); }}
                className="px-5 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-7 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <FiCheckCircle className="w-4 h-4" />
                    <span>{isEditing ? 'Save Changes' : 'Publish Opportunity'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* List View of All Listings */
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Listing Filter Tabs */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-slate-100/80 p-2 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {user?.role !== 'admin' && (
                <button
                  onClick={() => setListingFilter('my')}
                  className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    listingFilter === 'my'
                      ? 'bg-white text-blue-700 shadow-md border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <span>📌 My Postings ({myCompanies.length})</span>
                </button>
              )}
              <button
                onClick={() => setListingFilter('all')}
                className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  listingFilter === 'all' || user?.role === 'admin'
                    ? 'bg-white text-blue-700 shadow-md border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <span>🌐 All Platform Postings ({companies.length})</span>
              </button>
            </div>
            <span className="text-xs text-slate-500 font-semibold px-2">
              Showing {filteredList.length} total platform listings
            </span>
          </div>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative w-full sm:w-80">
              <FiSearch className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search listings..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
              />
            </div>
            <button
              onClick={fetchMyCompanies}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-2 transition-colors shrink-0"
            >
              <FiRefreshCw className="w-3.5 h-3.5" />
              <span>Refresh List</span>
            </button>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="py-16 text-center">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-semibold">Loading employer company listings...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl text-center max-w-lg mx-auto">
              <p className="text-rose-800 font-bold text-sm">Error Loading Listings</p>
              <p className="text-rose-600 text-xs mt-1">{error}</p>
              <button
                onClick={fetchMyCompanies}
                className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Company Cards / Grid */}
          {!isLoading && !error && (
            <>
              {filteredList.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-md mx-auto shadow-sm">
                  <FiBriefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-slate-800">No Listings Found</h3>
                  <p className="text-slate-500 text-xs mt-1">Get started by creating your first company opportunity listing.</p>
                  <button
                    onClick={handleStartNew}
                    className="mt-5 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 inline-flex items-center gap-2 cursor-pointer"
                  >
                    <FiPlus className="w-4 h-4" />
                    <span>Create Company Listing</span>
                  </button>
                </div>
              ) : isPageLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 bg-white/80 backdrop-blur-xs rounded-3xl border border-slate-200/80 my-4 shadow-sm animate-in fade-in duration-150">
                  <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-extrabold text-blue-700 animate-pulse">Loading Page {currentPage}...</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedList.map((company) => (
                      <div
                        key={company.companyId}
                        className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-400 transition-all flex flex-col justify-between"
                      >
                        <div>
                          {/* Header */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-lg shrink-0">
                                {(company.name || 'C').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h3 title={company.name} className="font-bold text-slate-900 text-base leading-snug line-clamp-1">
                                  {company.name}
                                </h3>
                                <span title={`Full Company ID: ${company.companyId}`} className="text-[10px] text-slate-400 font-mono">ID: {company.companyId}</span>
                              </div>
                            </div>
                          </div>

                          {/* Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 mb-3 text-xs">
                            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold">
                              {company.industry || 'Category'}
                            </span>
                            <span title={`Location: ${company.headquarters}`} className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-md font-semibold flex items-center gap-1">
                              <FiMapPin className="w-3 h-3" />
                              {company.headquarters}
                            </span>
                            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-semibold flex items-center gap-1">
                              <FiDollarSign className="w-3 h-3" />
                              {company.budget || company.salaryRange || 'Negotiable'}
                            </span>
                          </div>

                          {/* Tech Stack Tags */}
                          {Array.isArray(company.techStack) && company.techStack.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {company.techStack.map((tech, i) => (
                                <span key={i} className="px-2 py-0.5 bg-slate-50 border border-slate-100 text-slate-600 text-[10px] font-bold rounded-md">
                                  {tech}
                                </span>
                              ))}
                            </div>
                          )}

                          <p title={company.description} className="text-slate-600 text-xs leading-relaxed line-clamp-3 mb-4">
                            {company.description}
                          </p>
                        </div>

                        {/* Action Buttons: Edit & Delete (Only for owner or admin) */}
                        {(() => {
                          const storedUser = (() => {
                            try { return JSON.parse(localStorage.getItem('workwise_user')); } catch (e) { return null; }
                          })();
                          const currentUserId = user?.id || user?._id || storedUser?.id || storedUser?._id;
                          const isMine = user?.role === 'admin' || (company.postedBy && String(company.postedBy) === String(currentUserId));

                          return (
                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                              {isMine ? (
                                <>
                                  <button
                                    onClick={() => handleEditClick(company)}
                                    className="flex-1 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                  >
                                    <FiEdit3 className="w-3.5 h-3.5" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClick(company.companyId, company.name)}
                                    className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                  >
                                    <FiTrash2 className="w-3.5 h-3.5" />
                                    <span>Delete</span>
                                  </button>
                                </>
                              ) : (
                                <span className="w-full text-center py-1.5 px-3 rounded-xl bg-slate-50 text-slate-400 text-xs font-semibold italic border border-slate-100">
                                  Posted by another employer
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    ))}
                  </div>

                  {/* Pagination Controls Bar */}
                  {totalItems > 0 && (
                    <div className="mt-8 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                      {/* Results Count Summary */}
                      <span className="text-xs font-semibold text-slate-600">
                        Showing <strong className="text-slate-900">{startIndex + 1}–{endIndex}</strong> of <strong className="text-slate-900">{totalItems}</strong> listings
                        {searchQuery && <span className="text-slate-400 text-xs ml-1.5">(matching "{searchQuery}")</span>}
                      </span>

                      {/* Navigation Chevrons & Page Indicator */}
                      <div className="flex items-center gap-1.5">
                        {/* First Page Double Chevron */}
                        <button
                          onClick={() => handlePageChange(1)}
                          disabled={currentPage === 1}
                          className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                          title="First Page (Page 1)"
                        >
                          <FiChevronsLeft className="w-4 h-4" />
                        </button>

                        {/* Prev Page */}
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                          title="Previous Page"
                        >
                          <FiChevronLeft className="w-4 h-4" />
                        </button>

                        {/* Page Numbers */}
                        <div className="flex items-center gap-1 px-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                            .map((page, idx, arr) => {
                              const prevPage = arr[idx - 1];
                              const showEllipsis = prevPage && page - prevPage > 1;
                              return (
                                <React.Fragment key={page}>
                                  {showEllipsis && <span className="px-1 text-slate-400 text-xs font-bold">...</span>}
                                  <button
                                    onClick={() => handlePageChange(page)}
                                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                      currentPage === page
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                                    }`}
                                  >
                                    {page}
                                  </button>
                                </React.Fragment>
                              );
                            })}
                        </div>

                        {/* Next Page */}
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                          title="Next Page"
                        >
                          <FiChevronRight className="w-4 h-4" />
                        </button>

                        {/* Last Page Double Chevron */}
                        <button
                          onClick={() => handlePageChange(totalPages)}
                          disabled={currentPage === totalPages}
                          className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                          title={`Last Page (Page ${totalPages})`}
                        >
                          <FiChevronsRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Jump to Page & Items Per Page Selector */}
                      <div className="flex items-center gap-3 flex-wrap justify-center">
                        <form onSubmit={handleJumpSubmit} className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-500">Go to page:</span>
                          <input
                            type="number"
                            min={1}
                            max={totalPages}
                            value={jumpPageInput}
                            onChange={handleJumpInputChange}
                            onBlur={handleJumpSubmit}
                            placeholder={String(currentPage)}
                            className="w-14 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 text-center"
                          />
                          <button
                            type="submit"
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Go
                          </button>
                        </form>

                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 border-l border-slate-200 pl-3">
                          <span>Per Page:</span>
                          <select
                            value={itemsPerPage}
                            onChange={(e) => {
                              setItemsPerPage(Number(e.target.value));
                              setCurrentPage(1);
                            }}
                            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                          >
                            <option value={6}>6</option>
                            <option value={12}>12</option>
                            <option value={24}>24</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default EmployerManageCompanies;
