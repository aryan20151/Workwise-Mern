import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '../utils/toast';
import { useCartStore } from '../store/useCartStore';
import { useAuth } from '../context/AuthContext';
import AddCompanyModal from '../components/AddCompanyModal';
import { 
  FiSearch, FiMapPin, FiBriefcase, FiChevronDown, FiChevronUp, 
  FiFilter, FiX, FiDollarSign, FiClock, FiUserCheck, FiChevronLeft, FiChevronRight, FiRotateCcw, FiSliders, FiZap, FiArrowRight, FiSend, FiFileText, FiUpload, FiPlus
} from 'react-icons/fi';

const Companies = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Quick Application Modal States
  const [quickApplyCompany, setQuickApplyCompany] = useState(null);
  const [qaName, setQaName] = useState('');
  const [qaEmail, setQaEmail] = useState('');
  const [qaSkills, setQaSkills] = useState('');
  const [qaFile, setQaFile] = useState(null);
  const [isQaSubmitting, setIsQaSubmitting] = useState(false);

  const handleOpenQuickApply = async (company) => {
    setQuickApplyCompany(company);
    try {
      const res = await fetch('/api/auth/user-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          if (data.user.username) setQaName(data.user.username);
          if (data.user.email) setQaEmail(data.user.email);
        }
      }
    } catch (err) {
      console.error('User prefill error:', err);
    }
  };

  const handleQuickApplySubmit = async (e) => {
    e.preventDefault();
    if (!qaName || !qaEmail) {
      toast.error('Please enter your full name and email address.');
      return;
    }

    setIsQaSubmitting(true);
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: quickApplyCompany.companyId,
          companyName: quickApplyCompany.name,
          name: qaName,
          email: qaEmail,
          resumePath: qaFile ? qaFile.name : 'quick_apply_profile_resume.pdf'
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(`Quick Application submitted for ${quickApplyCompany.name}!`);
        useCartStore.getState().fetchCart();
        setQuickApplyCompany(null);
        setQaSkills('');
        setQaFile(null);
      } else {
        toast.error(data.error || 'Failed to submit quick application.');
      }
    } catch (err) {
      console.error('Quick Apply error:', err);
      toast.error('Error submitting quick application.');
    } finally {
      setIsQaSubmitting(false);
    }
  };

  // Toggle state for Advanced Filters Drawer (Default CLOSED)
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filter States
  const [selectedIndustry, setSelectedIndustry] = useState('All');
  const [selectedLocationType, setSelectedLocationType] = useState('All');
  const [selectedJobType, setSelectedJobType] = useState('All');
  const [selectedSalary, setSelectedSalary] = useState('All');
  const [selectedExperience, setSelectedExperience] = useState('All');
  const [sortBy, setSortBy] = useState('name-asc');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  const hasFetchedRef = React.useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setIsLoading(true);
    setError('');
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/companies?nocache=${timestamp}`, {
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load companies: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.companies)) {
        // Enrich companies with deterministic metadata if missing
        const enriched = data.companies.map((company, index) => ({
          ...company,
          locationType: company.locationType || (index % 3 === 0 ? 'Remote' : index % 3 === 1 ? 'Hybrid' : 'Onsite'),
          jobType: company.jobType || (index % 4 === 0 ? 'Full-Time' : index % 4 === 1 ? 'Contract' : index % 4 === 2 ? 'Part-Time' : 'Full-Time'),
          salaryRange: company.salaryRange || (index % 4 === 0 ? '$120k - $150k' : index % 4 === 1 ? '$90k - $120k' : index % 4 === 2 ? '$60k - $90k' : '$150k+'),
          salaryValue: company.salaryValue || (index % 4 === 0 ? 120000 : index % 4 === 1 ? 90000 : index % 4 === 2 ? 60000 : 150000),
          experienceLevel: company.experienceLevel || (index % 3 === 0 ? 'Entry-Level' : index % 3 === 1 ? 'Mid-Level' : 'Senior')
        }));

        setCompanies(enriched);
        setFilteredCompanies(enriched);
      } else {
        throw new Error(data.message || 'Invalid companies data');
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError(err.message || 'Failed to fetch companies from database.');
      toast.error('Failed to load companies');
    } finally {
      setIsLoading(false);
    }
  };

  // Compute unique industries list
  const uniqueIndustries = useMemo(() => {
    const set = new Set(companies.map(c => c.industry).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [companies]);

  // Filter & Search Logic
  useEffect(() => {
    let result = [...companies];

    // Search Query Matching across Name, Industry, Headquarters, and Description
    if (searchQuery.trim() !== '') {
      const term = searchQuery.toLowerCase().trim();
      result = result.filter(c => {
        const name = (c.name || '').toLowerCase();
        const industry = (c.industry || '').toLowerCase();
        const location = (c.headquarters || '').toLowerCase();
        const desc = (c.description || '').toLowerCase();
        return name.includes(term) || industry.includes(term) || location.includes(term) || desc.includes(term);
      });
    }

    // Advanced Filter 1: Industry
    if (selectedIndustry !== 'All') {
      result = result.filter(c => 
        (c.industry || '').toLowerCase().trim() === selectedIndustry.toLowerCase().trim()
      );
    }

    // Advanced Filter 2: Location Type / Mode
    if (selectedLocationType !== 'All') {
      const targetLoc = selectedLocationType.toLowerCase();
      result = result.filter(c => {
        const locType = (c.locationType || '').toLowerCase();
        const hq = (c.headquarters || '').toLowerCase();
        return locType === targetLoc || hq.includes(targetLoc) || (targetLoc === 'remote' && (locType.includes('remote') || hq.includes('remote')));
      });
    }

    // Advanced Filter 3: Job Type
    if (selectedJobType !== 'All') {
      const targetType = selectedJobType.toLowerCase();
      result = result.filter(c => {
        const jt = (c.jobType || '').toLowerCase();
        const desc = (c.description || '').toLowerCase();
        return jt.includes(targetType) || desc.includes(targetType);
      });
    }

    // Advanced Filter 4: Salary
    if (selectedSalary !== 'All') {
      const minSalary = parseInt(selectedSalary, 10);
      if (!isNaN(minSalary)) {
        result = result.filter(c => (c.salaryValue || 100000) >= minSalary);
      }
    }

    // Advanced Filter 5: Experience Level
    if (selectedExperience !== 'All') {
      const targetExp = selectedExperience.toLowerCase().replace('-level', '');
      result = result.filter(c => {
        const exp = (c.experienceLevel || '').toLowerCase();
        const desc = (c.description || '').toLowerCase();
        return exp.includes(targetExp) || desc.includes(targetExp);
      });
    }

    // Sorting Logic
    if (sortBy === 'name-asc') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'name-desc') {
      result.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    } else if (sortBy === 'salary-high') {
      result.sort((a, b) => (b.salaryValue || 0) - (a.salaryValue || 0));
    }

    setFilteredCompanies(result);
    setCurrentPage(1); // Reset page on query/filter update
  }, [searchQuery, selectedIndustry, selectedLocationType, selectedJobType, selectedSalary, selectedExperience, sortBy, companies]);

  // Live Suggestions logic
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === '') {
      setSuggestions([]);
      return;
    }

    const suggest = companies
      .filter(c => (c.name || '').toLowerCase().includes(query.toLowerCase()))
      .map(c => c.name)
      .slice(0, 5);
    setSuggestions(suggest);
  };

  const handleSuggestionClick = (name) => {
    setSearchQuery(name || '');
    setSuggestions([]);
  };

  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    setSuggestions([]);
    
    if (searchQuery.trim() === '') {
      setFilteredCompanies(companies);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/companies/search?name=${encodeURIComponent(searchQuery.trim())}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.companies) && data.companies.length > 0) {
          // Enrich backend search results with metadata if missing
          const enriched = data.companies.map((company, index) => ({
            ...company,
            locationType: company.locationType || (index % 3 === 0 ? 'Remote' : index % 3 === 1 ? 'Hybrid' : 'Onsite'),
            jobType: company.jobType || (index % 4 === 0 ? 'Full-Time' : index % 4 === 1 ? 'Contract' : index % 4 === 2 ? 'Part-Time' : 'Full-Time'),
            salaryRange: company.salaryRange || (index % 4 === 0 ? '$120k - $150k' : index % 4 === 1 ? '$90k - $120k' : index % 4 === 2 ? '$60k - $90k' : '$150k+'),
            salaryValue: company.salaryValue || (index % 4 === 0 ? 120000 : index % 4 === 1 ? 90000 : index % 4 === 2 ? 60000 : 150000),
            experienceLevel: company.experienceLevel || (index % 3 === 0 ? 'Entry-Level' : index % 3 === 1 ? 'Mid-Level' : 'Senior')
          }));
          setCompanies(enriched);
          setFilteredCompanies(enriched);
          setCurrentPage(1);
        }
      }
    } catch (err) {
      console.error('Search submit API error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetAllAdvancedFilters = () => {
    setSelectedIndustry('All');
    setSelectedLocationType('All');
    setSelectedJobType('All');
    setSelectedSalary('All');
    setSelectedExperience('All');
    toast.info('Advanced filters reset');
  };

  const resetAll = () => {
    setSearchQuery('');
    resetAllAdvancedFilters();
    setSortBy('name-asc');
  };

  // Advanced Filters Count ONLY (Excludes text search query)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedIndustry !== 'All') count++;
    if (selectedLocationType !== 'All') count++;
    if (selectedJobType !== 'All') count++;
    if (selectedSalary !== 'All') count++;
    if (selectedExperience !== 'All') count++;
    return count;
  }, [selectedIndustry, selectedLocationType, selectedJobType, selectedSalary, selectedExperience]);

  // Pagination Calculations
  const totalItems = filteredCompanies.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentCompanies = filteredCompanies.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 200, behavior: 'smooth' });
    }
  };

  const toggleDetails = (companyId) => {
    setExpandedId(expandedId === companyId ? null : companyId);
  };

  const handleApplyClick = (company) => {
    navigate('/apply', {
      state: {
        companyId: company.companyId,
        companyName: company.name
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[calc(100vh-4rem)]">
      
      {/* Header Section */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 sm:p-10 text-white text-center max-w-5xl mx-auto mb-10 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-bold uppercase tracking-wider mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Verified Employer Directory
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
            Discover Top Employers & Workplaces
          </h1>
          <p className="mt-2.5 text-slate-300 text-sm sm:text-base leading-relaxed">
            Search verified companies by industry, remote availability, salary range, or location to find your ideal team.
          </p>

          <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap justify-center items-center gap-4 text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5"><FiBriefcase className="text-blue-400" /> 500+ Verified Employers</span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1.5"><FiZap className="text-amber-400" /> Direct Applications</span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1.5"><FiUserCheck className="text-emerald-400" /> Active Hiring</span>
          </div>

          {/* Action Buttons */}
          {user?.role === 'admin' && (
            <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => navigate('/manage-companies')}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-500/30 transition-all cursor-pointer"
              >
                <FiBriefcase className="w-4 h-4" />
                <span>Manage All Companies</span>
              </button>
            </div>
          )}
          {user?.role === 'employer' && (
            <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => navigate('/post-requisition')}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-500/30 transition-all cursor-pointer"
              >
                <FiPlus className="w-4 h-4" />
                <span>Post Job</span>
              </button>
              <button
                onClick={() => navigate('/requisitions')}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-all cursor-pointer"
              >
                <FiBriefcase className="w-4 h-4" />
                <span>Job Requisitions</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar & Advanced Filter Toggle Button */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Main Search Input & Submit Button */}
          <div className="relative flex-1 w-full">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <FiSearch className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search by company name, industry, or location..."
                  className="block w-full pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm text-sm transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm text-sm flex items-center gap-2 transition-all shrink-0 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <FiSearch className="w-4 h-4" />
                )}
                <span>{isLoading ? 'Searching...' : 'Search'}</span>
              </button>
            </form>

            {/* Suggestions List */}
            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                {suggestions.map((name, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(name)}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm text-slate-700 font-medium flex items-center justify-between transition-colors"
                  >
                    <span>{name}</span>
                    <span className="text-xs text-blue-600 font-semibold">Select</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Advanced Filters Button */}
          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`w-full sm:w-auto px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 border shadow-sm shrink-0 ${
              isFilterOpen || activeFiltersCount > 0
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 hover:bg-blue-700'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <FiSliders className="w-4 h-4" />
            <span>Advanced Filters</span>
            {activeFiltersCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                isFilterOpen || activeFiltersCount > 0 ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'
              }`}>
                {activeFiltersCount}
              </span>
            )}
            {isFilterOpen ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Active Filter Tags (Shown if any advanced filter is active) */}
        {activeFiltersCount > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 px-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Filters:</span>

            {selectedIndustry !== 'All' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-800 rounded-lg text-xs font-semibold border border-blue-100">
                Industry: {selectedIndustry}
                <button onClick={() => setSelectedIndustry('All')} className="hover:text-blue-950"><FiX className="w-3.5 h-3.5" /></button>
              </span>
            )}

            {selectedLocationType !== 'All' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-100">
                Location: {selectedLocationType}
                <button onClick={() => setSelectedLocationType('All')} className="hover:text-emerald-950"><FiX className="w-3.5 h-3.5" /></button>
              </span>
            )}

            {selectedJobType !== 'All' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-800 rounded-lg text-xs font-semibold border border-purple-100">
                Job Type: {selectedJobType}
                <button onClick={() => setSelectedJobType('All')} className="hover:text-purple-950"><FiX className="w-3.5 h-3.5" /></button>
              </span>
            )}

            {selectedSalary !== 'All' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 rounded-lg text-xs font-semibold border border-amber-100">
                Salary: ${parseInt(selectedSalary, 10)/1000}k+
                <button onClick={() => setSelectedSalary('All')} className="hover:text-amber-950"><FiX className="w-3.5 h-3.5" /></button>
              </span>
            )}

            {selectedExperience !== 'All' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-800 rounded-lg text-xs font-semibold border border-indigo-100">
                Exp: {selectedExperience}
                <button onClick={() => setSelectedExperience('All')} className="hover:text-indigo-950"><FiX className="w-3.5 h-3.5" /></button>
              </span>
            )}

            <button
              onClick={resetAllAdvancedFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 ml-auto flex items-center gap-1"
            >
              <FiRotateCcw className="w-3 h-3" /> Clear filters
            </button>
          </div>
        )}

        {/* Collapsible Advanced Filter Controls (Pill Buttons) */}
        {isFilterOpen && (
          <div className="mt-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-lg space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FiSliders className="w-4 h-4 text-blue-600" /> Filter Criteria
              </h3>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1"
              >
                Close <FiX className="w-4 h-4" />
              </button>
            </div>

            {/* Filter 1: Location / Work Mode */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <FiMapPin className="w-3.5 h-3.5 text-slate-400" /> Work Location / Mode
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'All Modes', value: 'All' },
                  { label: 'Remote', value: 'Remote' },
                  { label: 'Hybrid', value: 'Hybrid' },
                  { label: 'Onsite', value: 'Onsite' }
                ].map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => setSelectedLocationType(mode.value)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedLocationType === mode.value
                        ? 'bg-blue-600 text-white shadow-sm font-bold hover:bg-blue-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter 2: Job Type */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <FiClock className="w-3.5 h-3.5 text-slate-400" /> Job Type
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'All Types', value: 'All' },
                  { label: 'Full-Time', value: 'Full-Time' },
                  { label: 'Part-Time', value: 'Part-Time' },
                  { label: 'Contract', value: 'Contract' }
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setSelectedJobType(type.value)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedJobType === type.value
                        ? 'bg-blue-600 text-white shadow-sm font-bold hover:bg-blue-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter 3: Salary Expectation */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <FiDollarSign className="w-3.5 h-3.5 text-slate-400" /> Minimum Salary
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'All Salaries', value: 'All' },
                  { label: '$60k+', value: '60000' },
                  { label: '$90k+', value: '90000' },
                  { label: '$120k+', value: '120000' },
                  { label: '$150k+', value: '150000' }
                ].map((salary) => (
                  <button
                    key={salary.value}
                    type="button"
                    onClick={() => setSelectedSalary(salary.value)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedSalary === salary.value
                        ? 'bg-blue-600 text-white shadow-sm font-bold hover:bg-blue-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {salary.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter 4: Experience Level */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <FiUserCheck className="w-3.5 h-3.5 text-slate-400" /> Experience Level
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'All Levels', value: 'All' },
                  { label: 'Entry-Level', value: 'Entry-Level' },
                  { label: 'Mid-Level', value: 'Mid-Level' },
                  { label: 'Senior', value: 'Senior' }
                ].map((exp) => (
                  <button
                    key={exp.value}
                    type="button"
                    onClick={() => setSelectedExperience(exp.value)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedExperience === exp.value
                        ? 'bg-blue-600 text-white shadow-sm font-bold hover:bg-blue-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {exp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter 5: Industry Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <FiBriefcase className="w-3.5 h-3.5 text-slate-400" /> Industry Sector
              </label>
              <div className="flex flex-wrap gap-2">
                {uniqueIndustries.map((ind) => (
                  <button
                    key={ind}
                    type="button"
                    onClick={() => setSelectedIndustry(ind)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedIndustry === ind
                        ? 'bg-blue-600 text-white font-bold shadow-sm hover:bg-blue-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {ind === 'All' ? 'All Industries' : ind}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Counter & Sort Bar */}
      {!isLoading && !error && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 px-1">
          <p className="text-sm font-semibold text-slate-600">
            Showing <span className="font-bold text-slate-900">{totalItems > 0 ? startIndex + 1 : 0}–{endIndex}</span> of <span className="font-bold text-slate-900">{totalItems}</span> companies
            {searchQuery && <span className="text-slate-400 text-xs ml-1.5">(matching "{searchQuery}")</span>}
          </p>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sort:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="salary-high">Salary (High to Low)</option>
            </select>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-semibold animate-pulse">Fetching records...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl max-w-xl mx-auto text-center">
          <p className="text-sm font-bold text-rose-800">Error Loading Data</p>
          <p className="text-xs text-rose-600 mt-1">{error}</p>
          <button
            onClick={fetchCompanies}
            className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Grid of Companies */}
      {!isLoading && !error && (
        <>
          {filteredCompanies.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200/80 rounded-3xl p-8 max-w-lg mx-auto shadow-lg shadow-slate-200/40 animate-in fade-in duration-200">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-inner">
                <FiBriefcase className="w-8 h-8" />
              </div>
              <h3 className="text-slate-900 font-extrabold text-lg tracking-tight">No Employers Found</h3>
              <p className="text-slate-500 text-xs sm:text-sm mt-1.5 leading-relaxed max-w-xs mx-auto">
                No companies matched your search phrase <span className="font-semibold text-slate-700">"{searchQuery || 'current filters'}"</span>.
              </p>

              {/* Quick Industry Shortcuts */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  Or explore popular sectors:
                </span>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {['Technology', 'Design', 'Finance', 'Marketing', 'Healthcare'].map((ind) => (
                    <button
                      key={ind}
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedIndustry(ind);
                      }}
                      className="px-3 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg text-xs font-semibold transition-all"
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={resetAll}
                className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-500/20 inline-flex items-center gap-2"
              >
                <FiRotateCcw className="w-3.5 h-3.5" />
                Reset Search & Filters
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {currentCompanies.map((company) => {
                const isExpanded = expandedId === company.companyId;

                return (
                  <div
                    key={company.companyId}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-400 transition-all duration-200 overflow-hidden flex flex-col justify-between h-full"
                  >
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-extrabold flex items-center justify-center text-base shrink-0">
                            {(company.name || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-slate-900 tracking-tight line-clamp-1">
                              {company.name}
                            </h3>
                            <p className="text-[11px] text-slate-400">ID: {company.companyId}</p>
                          </div>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          company.locationType === 'Remote' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' 
                            : company.locationType === 'Hybrid'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                            : 'bg-blue-50 text-blue-700 border border-blue-200/60'
                        }`}>
                          {company.locationType}
                        </span>
                      </div>

                      {/* Meta Tags */}
                      <div className="flex flex-wrap items-center gap-2 mb-3 text-xs font-medium text-slate-600">
                        <span className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-md flex items-center gap-1">
                          <FiBriefcase className="w-3 h-3 text-slate-400" />
                          {company.industry}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-md flex items-center gap-1">
                          <FiMapPin className="w-3 h-3 text-slate-400" />
                          {company.headquarters}
                        </span>
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-100 rounded-md flex items-center gap-1 font-semibold">
                          <FiDollarSign className="w-3 h-3 text-amber-600" />
                          {company.budget || company.salaryRange}
                        </span>
                      </div>

                      {Array.isArray(company.techStack) && company.techStack.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {company.techStack.map((tech, i) => (
                            <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md border border-blue-100">
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="text-slate-600 text-xs leading-relaxed line-clamp-2 mb-3">
                        {company.description}
                      </p>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-slate-100 animate-in fade-in slide-in-from-top-1 duration-150 space-y-2">
                          <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1.5 text-slate-600 border border-slate-100">
                            <p><strong className="text-slate-800">Job Style:</strong> {company.jobType}</p>
                            <p><strong className="text-slate-800">Required Experience:</strong> {company.experienceLevel}</p>
                            <p className="leading-relaxed"><strong className="text-slate-800">Details:</strong> {company.description}</p>
                          </div>

                          <button
                            onClick={() => handleApplyClick(company)}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
                          >
                            <span>Submit Application</span>
                            <FiArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => toggleDetails(company.companyId)}
                        className={`flex items-center gap-1 text-xs font-bold transition-colors ${
                          isExpanded ? 'text-slate-500 hover:text-slate-700' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>{isExpanded ? 'Hide' : 'Details'}</span>
                        {isExpanded ? <FiChevronUp className="w-3.5 h-3.5" /> : <FiChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApplyClick(company)}
                          className="px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors flex items-center gap-1"
                        >
                          <span>Full Form</span>
                          <FiArrowRight className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => handleOpenQuickApply(company)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <FiZap className="w-3.5 h-3.5 fill-current" />
                          <span>Quick Apply</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 pt-6">
              <div className="text-xs font-semibold text-slate-500">
                Page <span className="text-slate-900 font-bold">{currentPage}</span> of <span className="text-slate-900 font-bold">{totalPages}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 transition-colors"
                  title="Previous Page"
                >
                  <FiChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-8 h-8 text-xs font-bold rounded-lg transition-all ${
                      currentPage === page
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 transition-colors"
                  title="Next Page"
                >
                  <FiChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span>Per Page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none"
                >
                  <option value={6}>6</option>
                  <option value={9}>9</option>
                  <option value={12}>12</option>
                </select>
              </div>
            </div>
          )}
        </>
      )}

      {/* Quick Application Modal */}
      {quickApplyCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 relative overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Top Banner */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-lg shadow-md shadow-blue-600/20 shrink-0">
                  {(quickApplyCompany.name || 'C').charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                    ⚡ Quick Application
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 leading-snug mt-0.5">
                    {quickApplyCompany.name}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickApplyCompany(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleQuickApplySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center justify-between">
                  <span>Full Name <span className="text-rose-500">*</span></span>
                  {user && <span className="text-[10px] text-emerald-700 font-bold lowercase">🔒 account name</span>}
                </label>
                <input
                  type="text"
                  required
                  value={qaName}
                  onChange={(e) => setQaName(e.target.value)}
                  readOnly={Boolean(user)}
                  placeholder="John Doe"
                  className={`block w-full px-3.5 py-2.5 rounded-xl text-slate-900 text-sm font-medium transition-all ${
                    user 
                      ? 'bg-slate-100 border border-slate-200 cursor-not-allowed text-slate-700' 
                      : 'bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center justify-between">
                  <span>Email Address <span className="text-rose-500">*</span></span>
                  {user && <span className="text-[10px] text-emerald-700 font-bold lowercase">🔒 account email</span>}
                </label>
                <input
                  type="email"
                  required
                  value={qaEmail}
                  onChange={(e) => setQaEmail(e.target.value)}
                  readOnly={Boolean(user)}
                  placeholder="john@example.com"
                  className={`block w-full px-3.5 py-2.5 rounded-xl text-slate-900 text-sm font-medium transition-all ${
                    user 
                      ? 'bg-slate-100 border border-slate-200 cursor-not-allowed text-slate-700' 
                      : 'bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Primary Role / Core Skills
                </label>
                <input
                  type="text"
                  value={qaSkills}
                  onChange={(e) => setQaSkills(e.target.value)}
                  placeholder="e.g. Frontend Developer, React, Node.js"
                  className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Resume / CV <span className="text-slate-400 font-normal text-none">(Optional)</span>
                </label>
                <div className="relative border border-dashed border-slate-300 rounded-xl p-3 text-center bg-slate-50 hover:bg-blue-50/40 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setQaFile(e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-600 font-semibold">
                    <FiUpload className="w-4 h-4 text-blue-600" />
                    <span>{qaFile ? qaFile.name : 'Upload PDF/Doc or use default profile resume'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setQuickApplyCompany(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isQaSubmitting}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isQaSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <FiZap className="w-3.5 h-3.5 fill-current" />
                      <span>Submit Quick Application</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Companies;
