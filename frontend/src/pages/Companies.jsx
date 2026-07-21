import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiMapPin, FiBriefcase, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const Companies = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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
        setCompanies(data.companies);
        setFilteredCompanies(data.companies);
      } else {
        throw new Error(data.message || 'Invalid companies data');
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError(err.message || 'Failed to fetch companies from database.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle live search suggestions and filtering
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === '') {
      setFilteredCompanies(companies);
      setSuggestions([]);
      return;
    }

    // Filter companies safely
    const filtered = companies.filter(company => {
      const name = (company.name || '').toLowerCase();
      const industry = (company.industry || '').toLowerCase();
      const headquarters = (company.headquarters || '').toLowerCase();
      const term = query.toLowerCase();
      return name.includes(term) || industry.includes(term) || headquarters.includes(term);
    });
    setFilteredCompanies(filtered);

    // Build suggestions list safely
    const suggest = companies
      .filter(c => (c.name || '').toLowerCase().includes(query.toLowerCase()))
      .map(c => c.name)
      .slice(0, 5);
    setSuggestions(suggest);
  };

  const handleSuggestionClick = (name) => {
    setSearchQuery(name || '');
    setSuggestions([]);
    const filtered = companies.filter(company =>
      (company.name || '').toLowerCase() === (name || '').toLowerCase()
    );
    setFilteredCompanies(filtered);
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    setSuggestions([]);
    
    if (searchQuery.trim() === '') {
      setFilteredCompanies(companies);
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/companies/search?name=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        throw new Error(`Search failed with status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.companies)) {
        setFilteredCompanies(data.companies);
      } else {
        throw new Error(data.message || 'Search failed');
      }
    } catch (err) {
      console.error('Search API request error:', err);
      setError(err.message || 'Failed to query search terms from server.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDetails = (companyId) => {
    if (expandedId === companyId) {
      setExpandedId(null);
    } else {
      setExpandedId(companyId);
    }
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-[calc(100vh-4rem)]">
      {/* Page Title */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Browse Companies
        </h1>
        <p className="mt-2 text-slate-500 text-base">
          Find your next career step by searching through our curated database of registered employers.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="max-w-lg mx-auto mb-12 relative">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <FiSearch className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search companies by name, industry, location..."
              className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200 text-sm"
          >
            Search
          </button>
        </form>

        {/* Search Suggestions */}
        {suggestions.length > 0 && (
          <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-150 rounded-xl shadow-lg z-40 py-1.5 overflow-hidden">
            {suggestions.map((name, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(name)}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm text-slate-700 transition-colors font-medium"
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading / Error States */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-semibold animate-pulse">Fetching database records...</p>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl max-w-xl mx-auto text-center">
          <p className="text-sm font-bold text-rose-800">Error Loading Companies</p>
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
            <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl p-8 max-w-md mx-auto">
              <p className="text-slate-500 font-bold text-lg">No companies found</p>
              <p className="text-slate-400 text-sm mt-1">Try refining your search term or view all companies.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilteredCompanies(companies);
                }}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
              {filteredCompanies.map((company) => {
                const isExpanded = expandedId === company.companyId;
                return (
                  <div
                    key={company.companyId}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-200 overflow-hidden flex flex-col justify-between"
                  >
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-slate-800 tracking-tight mb-4">
                        {company.name}
                      </h3>
                      
                      <div className="space-y-2.5 text-sm text-slate-500 font-medium">
                        <div className="flex items-center gap-2">
                          <FiBriefcase className="w-4 h-4 text-slate-400" />
                          <span>Industry: {company.industry}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FiMapPin className="w-4 h-4 text-slate-400" />
                          <span>Location: {company.headquarters}</span>
                        </div>
                      </div>

                      {/* Expandable details */}
                      {isExpanded && (
                        <div className="mt-5 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-4 duration-300">
                          <p className="text-slate-600 text-sm leading-relaxed mb-4">
                            {company.description}
                          </p>
                          <button
                            onClick={() => handleApplyClick(company)}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/10 transition-colors text-sm"
                          >
                            Apply Now
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
                      <button
                        onClick={() => toggleDetails(company.companyId)}
                        className={`w-full flex items-center justify-center gap-1.5 text-sm font-bold transition-colors ${
                          isExpanded ? 'text-slate-500 hover:text-slate-700' : 'text-blue-600 hover:text-blue-700'
                        }`}
                      >
                        <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
                        {isExpanded ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Companies;
