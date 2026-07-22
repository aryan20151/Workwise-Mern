import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { useSavedJobsStore } from '../store/useSavedJobsStore';
import { 
  FiBookmark, FiBriefcase, FiMapPin, FiDollarSign, FiSend, 
  FiTrash2, FiArrowLeft, FiSearch, FiFileText, FiPlus, FiCheckCircle
} from 'react-icons/fi';

const SavedRequisitions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const savedJobs = useSavedJobsStore((state) => state.savedJobs);
  const savedCount = useSavedJobsStore((state) => state.savedCount);
  const fetchSavedJobs = useSavedJobsStore((state) => state.fetchSavedJobs);
  const removeSavedJob = useSavedJobsStore((state) => state.removeSavedJob);
  const isLoading = useSavedJobsStore((state) => state.isLoading);

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSavedJobs(true);
  }, []);

  const handleApply = (item) => {
    navigate('/apply', {
      state: {
        companyId: item.companyId || item.requisitionId,
        companyName: item.companyName,
        jobTitle: item.title
      }
    });
  };

  const handleRemove = async (requisitionId, title) => {
    await removeSavedJob(requisitionId, title);
  };

  const filteredItems = savedJobs.filter((item) => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;
    const companyMatch = (item.companyName || '').toLowerCase().includes(term);
    const titleMatch = (item.title || '').toLowerCase().includes(term);
    const locationMatch = (item.location || '').toLowerCase().includes(term);
    const techMatch = Array.isArray(item.techStack)
      ? item.techStack.some(t => t.toLowerCase().includes(term))
      : (item.techStack || '').toLowerCase().includes(term);

    return companyMatch || titleMatch || locationMatch || techMatch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[calc(100vh-4rem)]">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
        <div>
          <button
            onClick={() => navigate('/requisitions')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-blue-200 hover:text-white mb-3 transition-colors cursor-pointer"
          >
            <FiArrowLeft className="w-4 h-4" /> Back to Job Requisitions
          </button>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
            <FiBookmark className="w-7 h-7 text-amber-400" />
            <span>Saved Jobs & Requisitions</span>
          </h1>
          <p className="mt-1 text-slate-300 text-sm">
            View and manage all your bookmarked job roles and requisitions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-4 py-2 bg-white/10 rounded-xl text-xs font-bold border border-white/10 flex items-center gap-2">
            <FiBookmark className="w-4 h-4 text-amber-400" />
            <span>Saved Jobs: {savedCount}</span>
          </span>
          <button
            onClick={() => navigate('/requisitions')}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/30 cursor-pointer"
          >
            <FiPlus className="w-4 h-4" />
            <span>Explore Jobs</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        
        {/* Search Bar */}
        {savedJobs.length > 0 && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-80">
              <FiSearch className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search saved jobs by title, company, stack..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
              />
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              Showing {filteredItems.length} of {savedCount} saved jobs
            </span>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-500 text-sm font-semibold">Loading saved jobs...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && savedJobs.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-md mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 mx-auto mb-4">
              <FiBookmark className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">No Saved Jobs Yet</h3>
            <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
              When you find job requisitions or roles you like, click "Save" to bookmark them here.
            </p>
            <button
              onClick={() => navigate('/requisitions')}
              className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 inline-flex items-center gap-2 cursor-pointer transition-all"
            >
              <FiBriefcase className="w-4 h-4" />
              <span>Browse Job Requisitions</span>
            </button>
          </div>
        )}

        {/* Saved Requisition Grid */}
        {!isLoading && filteredItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item._id || item.requisitionId}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-400 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Badge */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-lg mb-1.5">
                        <FiBookmark className="w-3.5 h-3.5 text-amber-600" />
                        <span>{item.companyName || 'Company'}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1">
                        {item.title}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ID: {item.requisitionId}
                      </span>
                    </div>
                  </div>

                  {/* Details Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-3 text-xs">
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold flex items-center gap-1">
                      <FiMapPin className="w-3 h-3 text-slate-400" />
                      {item.location || 'Remote'}
                    </span>
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-semibold flex items-center gap-1">
                      <FiDollarSign className="w-3 h-3 text-emerald-500" />
                      {item.budget || 'Negotiable'}
                    </span>
                    <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-semibold">
                      {item.jobType || 'Full-Time'}
                    </span>
                  </div>

                  {/* Tech Stack */}
                  {Array.isArray(item.techStack) && item.techStack.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.techStack.map((tech, i) => (
                        <span key={i} className="px-2 py-0.5 bg-blue-50/80 border border-blue-100 text-blue-700 text-[10px] font-bold rounded-md">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}

                  {item.description && (
                    <p className="text-slate-600 text-xs leading-relaxed line-clamp-3 mb-4">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    onClick={() => handleApply(item)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    <FiSend className="w-4 h-4" />
                    <span>Apply Now</span>
                  </button>

                  <button
                    onClick={() => handleRemove(item.requisitionId, item.title)}
                    className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="Remove from Saved"
                  >
                    <FiTrash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Remove</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedRequisitions;
