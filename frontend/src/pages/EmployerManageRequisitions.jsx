import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { useCartStore } from '../store/useCartStore';
import { useSavedJobsStore } from '../store/useSavedJobsStore';
import { 
  FiFileText, FiPlus, FiEdit3, FiTrash2, FiSearch, FiMapPin, 
  FiDollarSign, FiCode, FiBriefcase, FiRefreshCw, FiArrowLeft, FiAlertCircle, FiUserCheck, FiGlobe, FiSend, FiBookmark
} from 'react-icons/fi';

const EmployerManageRequisitions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const savedJobs = useSavedJobsStore((state) => state.savedJobs);
  const saveJob = useSavedJobsStore((state) => state.saveJob);
  const removeSavedJob = useSavedJobsStore((state) => state.removeSavedJob);
  const fetchSavedJobs = useSavedJobsStore((state) => state.fetchSavedJobs);
  const isJobSaved = useSavedJobsStore((state) => state.isJobSaved);

  const [requisitions, setRequisitions] = useState([]);
  const [myRequisitions, setMyRequisitions] = useState([]);
  const [filterMode, setFilterMode] = useState('all'); // 'all' vs 'my'
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch Requisitions
  const fetchRequisitions = async () => {
    setIsLoading(true);
    setError('');
    try {
      const storedUser = (() => {
        try { return JSON.parse(localStorage.getItem('workwise_user')); } catch (e) { return null; }
      })();
      const userId = user?.id || user?._id || storedUser?.id || storedUser?._id;

      const response = await fetch('/api/requisitions/my-listings', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(userId ? { 'x-user-id': userId } : {})
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setRequisitions(data.requisitions || []);
        setMyRequisitions(data.myRequisitions || []);
      } else {
        setError(data.message || 'Failed to fetch job requisitions.');
      }
    } catch (err) {
      console.error('Error fetching requisitions:', err);
      setError('An error occurred while loading job requisitions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequisitions();
    if (user) {
      fetchSavedJobs(true);
    }
  }, [user]);

  // Handle Save Requisition
  const handleSaveRequisition = async (reqItem) => {
    try {
      const storedUser = (() => {
        try { return JSON.parse(localStorage.getItem('workwise_user')); } catch (e) { return null; }
      })();
      const userId = user?.id || user?._id || storedUser?.id || storedUser?._id;
      const userName = user?.username || user?.name || storedUser?.username || 'Candidate';
      const userEmail = user?.email || storedUser?.email || 'candidate@example.com';

      const response = await fetch('/api/cart', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(userId ? { 'x-user-id': userId } : {})
        },
        body: JSON.stringify({
          companyId: reqItem.requisitionId || reqItem.companyId,
          companyName: `${reqItem.companyName || 'Company'} — ${reqItem.title}`,
          name: userName,
          email: userEmail
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(`Saved "${reqItem.title}" to your Saved Jobs!`);
        useCartStore.getState().fetchCart(true);
      } else {
        toast.error(data.error || data.message || 'Failed to save requisition.');
      }
    } catch (err) {
      toast.error('Error saving requisition.');
    }
  };

  // Delete Requisition
  const handleDelete = async (requisitionId, title) => {
    if (!window.confirm(`Are you sure you want to delete requisition "${title}"?`)) {
      return;
    }

    try {
      const storedUser = (() => {
        try { return JSON.parse(localStorage.getItem('workwise_user')); } catch (e) { return null; }
      })();
      const userId = user?.id || user?._id || storedUser?.id || storedUser?._id;

      const response = await fetch(`/api/requisitions/${requisitionId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          ...(userId ? { 'x-user-id': userId } : {})
        }
      });
      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`Deleted requisition "${title}"`);
        setRequisitions((prev) => prev.filter((r) => r.requisitionId !== requisitionId));
        setMyRequisitions((prev) => prev.filter((r) => r.requisitionId !== requisitionId));
      } else {
        toast.error(data.message || 'Failed to delete requisition.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Error deleting requisition.');
    }
  };

  // Target list calculation
  const isJobSeeker = !user?.role || user?.role === 'jobseeker';
  const targetList = (isJobSeeker || user?.role === 'admin' || filterMode === 'all') ? requisitions : myRequisitions;

  const filteredList = targetList.filter((r) => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;

    const titleMatch = (r.title || '').toLowerCase().includes(term);
    const companyMatch = (r.companyName || '').toLowerCase().includes(term);
    const locationMatch = (r.location || '').toLowerCase().includes(term);
    const industryMatch = (r.industry || '').toLowerCase().includes(term);
    const jobTypeMatch = (r.jobType || '').toLowerCase().includes(term);
    const techStackMatch = Array.isArray(r.techStack)
      ? r.techStack.some(t => t.toLowerCase().includes(term))
      : (r.techStack || '').toLowerCase().includes(term);
    const descMatch = (r.description || '').toLowerCase().includes(term);

    return titleMatch || companyMatch || locationMatch || industryMatch || jobTypeMatch || techStackMatch || descMatch;
  });

  const popularRoles = ['Full Stack', 'MERN', 'Frontend', 'Backend', 'React', 'Python', 'DevOps'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[calc(100vh-4rem)]">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
        <div>
          <button
            onClick={() => navigate('/companies')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-blue-200 hover:text-white mb-3 transition-colors cursor-pointer"
          >
            <FiArrowLeft className="w-4 h-4" /> Back to Companies Directory
          </button>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {isJobSeeker ? 'Explore Job Roles & Requisitions' : 'Job Requisitions Hub'}
          </h1>
          <p className="mt-1 text-slate-300 text-sm">
            Search open positions by role (Full Stack, MERN, Frontend, Backend), required tech stack, salary, and location.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="px-3 py-1.5 bg-white/10 rounded-xl text-xs font-bold border border-white/10">
            Total Requisitions: {targetList.length}
          </span>
          {user?.role === 'employer' && (
            <button
              onClick={() => navigate('/post-requisition')}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/30 cursor-pointer"
            >
              <FiPlus className="w-4 h-4" />
              <span>Post Job</span>
            </button>
          )}
        </div>
      </div>

      {/* Requisitions Search & List */}
      <div className="space-y-6 animate-in fade-in duration-200">
        
        {/* Employer Filter Mode Switcher */}
        {user?.role === 'employer' && (
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl w-fit border border-slate-200">
            <button
              onClick={() => setFilterMode('my')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'my' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Posted Requisitions ({myRequisitions.length})
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Platform Positions ({requisitions.length})
            </button>
          </div>
        )}

        {/* Search Bar & Quick Tags */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-1/2">
              <FiSearch className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search job roles (e.g. Full Stack, MERN, Frontend, Backend, React)..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  Clear
                </button>
              )}
            </div>

            <button
              onClick={fetchRequisitions}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:text-blue-600 hover:border-blue-300 transition-colors shadow-sm cursor-pointer flex items-center gap-2 text-xs font-semibold"
              title="Refresh Requisitions"
            >
              <FiRefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Quick Popular Role Tags */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Popular Roles:</span>
            {popularRoles.map((role) => (
              <button
                key={role}
                onClick={() => setSearchQuery(searchQuery === role ? '' : role)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  searchQuery.toLowerCase() === role.toLowerCase()
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-500 text-sm font-semibold">Loading open job requisitions...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl text-center max-w-lg mx-auto">
            <p className="text-rose-800 font-bold text-sm">Failed to Load Requisitions</p>
            <p className="text-rose-600 text-xs mt-1">{error}</p>
            <button
              onClick={fetchRequisitions}
              className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Requisition Cards */}
        {!isLoading && !error && (
          <>
            {filteredList.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-md mx-auto shadow-sm">
                <FiFileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-800">No Requisitions Found</h3>
                <p className="text-slate-500 text-xs mt-1">No open job requisitions match your search criteria.</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-5 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 inline-flex items-center gap-2 cursor-pointer"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredList.map((reqItem) => {
                  const storedUser = (() => {
                    try { return JSON.parse(localStorage.getItem('workwise_user')); } catch (e) { return null; }
                  })();
                  const currentUserId = user?.id || user?._id || storedUser?.id || storedUser?._id;
                  const isMine = user?.role === 'admin' || (reqItem.postedBy && String(reqItem.postedBy) === String(currentUserId));

                  return (
                    <div
                      key={reqItem.requisitionId || reqItem._id}
                      className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-400 transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold rounded-lg mb-1">
                              <FiBriefcase className="w-3.5 h-3.5 text-blue-600" />
                              <span>{reqItem.companyName || 'Company'}</span>
                            </div>
                            <h3 title={reqItem.title} className="font-bold text-slate-900 text-base mt-1 leading-snug line-clamp-1">
                              {reqItem.title}
                            </h3>
                            <span title={`Requisition ID: ${reqItem.requisitionId}`} className="text-[10px] text-slate-400 font-mono">
                              ID: {reqItem.requisitionId}
                            </span>
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-3 text-xs">
                          <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold flex items-center gap-1">
                            <FiMapPin className="w-3 h-3 text-slate-400" />
                            {reqItem.location || 'Remote'}
                          </span>
                          <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-semibold flex items-center gap-1">
                            <FiDollarSign className="w-3 h-3 text-emerald-500" />
                            {reqItem.budget || 'Negotiable'}
                          </span>
                          <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-semibold">
                            {reqItem.jobType || 'Full-Time'}
                          </span>
                        </div>

                        {/* Tech Stack */}
                        {Array.isArray(reqItem.techStack) && reqItem.techStack.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {reqItem.techStack.map((tech, i) => (
                              <span key={i} className="px-2 py-0.5 bg-blue-50/80 border border-blue-100 text-blue-700 text-[10px] font-bold rounded-md">
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}

                        <p title={reqItem.description} className="text-slate-600 text-xs leading-relaxed line-clamp-3 mb-4">
                          {reqItem.description}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          onClick={() => navigate('/apply', { 
                            state: { 
                              companyId: reqItem.companyId || reqItem.requisitionId, 
                              companyName: reqItem.companyName,
                              jobTitle: reqItem.title 
                            } 
                          })}
                          className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                        >
                          <FiSend className="w-3.5 h-3.5" />
                          <span>Apply Now</span>
                        </button>

                        {(() => {
                          const reqId = reqItem.requisitionId || reqItem._id || reqItem.companyId;
                          const isSaved = isJobSaved(reqId);
                          return (
                            <button
                              onClick={() => isSaved ? removeSavedJob(reqId, reqItem.title) : saveJob(reqItem)}
                              className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                                isSaved 
                                  ? 'bg-amber-500 text-white shadow-amber-500/20 hover:bg-amber-600' 
                                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80'
                              }`}
                              title={isSaved ? "Saved in your list (Click to unsave)" : "Bookmark / Save Requisition"}
                            >
                              <FiBookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-white text-white' : 'text-amber-600'}`} />
                              <span>{isSaved ? 'Saved' : 'Save'}</span>
                            </button>
                          );
                        })()}

                        {isMine && (
                          <button
                            onClick={() => handleDelete(reqItem.requisitionId, reqItem.title)}
                            className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            title="Delete Requisition"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EmployerManageRequisitions;
