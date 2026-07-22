import React, { useState, useEffect } from 'react';
import { toast } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { 
  FiUser, FiMail, FiBriefcase, FiFileText, FiClock, 
  FiCheckCircle, FiXCircle, FiRefreshCw, FiMove, FiChevronDown
} from 'react-icons/fi';

const COLUMNS = [
  {
    id: 'pending',
    title: 'Pending',
    badge: '📌 New Applications',
    headerBg: 'bg-slate-100 border-slate-200 text-slate-800',
    cardBorder: 'hover:border-slate-400',
    dotColor: 'bg-slate-400'
  },
  {
    id: 'submitted',
    title: 'Submitted',
    badge: '📋 Under Review',
    headerBg: 'bg-amber-50 border-amber-200 text-amber-900',
    cardBorder: 'hover:border-amber-400',
    dotColor: 'bg-amber-400 animate-pulse'
  },
  {
    id: 'accepted',
    title: 'Accepted',
    badge: '✅ Shortlisted / Hiring',
    headerBg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    cardBorder: 'hover:border-emerald-400',
    dotColor: 'bg-emerald-500'
  },
  {
    id: 'rejected',
    title: 'Rejected',
    badge: '❌ Declined',
    headerBg: 'bg-rose-50 border-rose-200 text-rose-900',
    cardBorder: 'hover:border-rose-400',
    dotColor: 'bg-rose-500'
  }
];

const KanbanBoard = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [draggedAppId, setDraggedAppId] = useState(null);
  const [activeDropColumn, setActiveDropColumn] = useState(null);

  const fetchApplications = async () => {
    setIsLoading(true);
    setError('');
    try {
      const storedUser = (() => {
        try { return JSON.parse(localStorage.getItem('workwise_user')); } catch (e) { return null; }
      })();
      const userId = user?.id || user?._id || storedUser?.id || storedUser?._id;

      const response = await fetch('/api/applications/employer', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(userId ? { 'x-user-id': userId } : {})
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setApplications(data.applications || []);
      } else {
        setError(data.message || 'Failed to fetch candidate applications.');
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('An error occurred while fetching candidate applications.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [user]);

  // Update Status API
  const updateStatus = async (appId, newStatus) => {
    // Optimistic UI Update
    setApplications((prev) =>
      prev.map((app) => (app._id === appId ? { ...app, status: newStatus } : app))
    );

    try {
      const response = await fetch(`/api/applications/${appId}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.id ? { 'x-user-id': user.id } : {})
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(`Application moved to "${newStatus.toUpperCase()}"`);
      } else {
        toast.error(data.message || 'Failed to update status.');
        fetchApplications(); // Revert on failure
      }
    } catch (err) {
      console.error('Status update error:', err);
      toast.error('Error updating application status.');
      fetchApplications();
    }
  };

  // Drag and Drop Event Handlers
  const handleDragStart = (e, appId) => {
    e.dataTransfer.setData('text/plain', appId);
    setDraggedAppId(appId);
  };

  const handleDragEnd = () => {
    setDraggedAppId(null);
    setActiveDropColumn(null);
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    if (activeDropColumn !== colId) {
      setActiveDropColumn(colId);
    }
  };

  const handleDragLeave = (e, colId) => {
    if (activeDropColumn === colId) {
      setActiveDropColumn(null);
    }
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    setActiveDropColumn(null);
    const appId = e.dataTransfer.getData('text/plain') || draggedAppId;
    if (!appId) return;

    const app = applications.find((a) => a._id === appId);
    if (app && app.status !== targetStatus) {
      updateStatus(appId, targetStatus);
    }
    setDraggedAppId(null);
  };

  return (
    <div className="space-y-6">
      {/* Board Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span>Candidate Pipeline Workflow</span>
          </h2>
          <p className="text-xs text-slate-500">
            Drag candidate cards between columns to change candidate application statuses in real-time.
          </p>
        </div>
        <button
          onClick={fetchApplications}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-2 transition-colors shrink-0 cursor-pointer"
        >
          <FiRefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Pipeline</span>
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-semibold">Loading applicant board...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl text-center max-w-lg mx-auto">
          <p className="text-rose-800 font-bold text-sm">Failed to Load Board</p>
          <p className="text-rose-600 text-xs mt-1">{error}</p>
          <button
            onClick={fetchApplications}
            className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Kanban Board Grid */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {COLUMNS.map((col) => {
            const columnApps = applications.filter(
              (app) => (app.status || 'pending').toLowerCase() === col.id
            );

            const isTarget = activeDropColumn === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={(e) => handleDragLeave(e, col.id)}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`bg-slate-50/70 rounded-2xl border transition-all duration-150 flex flex-col h-[650px] max-h-[calc(100vh-220px)] overflow-hidden ${
                  isTarget
                    ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20 shadow-lg scale-[1.01]'
                    : 'border-slate-200 shadow-xs'
                }`}
              >
                {/* Fixed Sticky Column Header */}
                <div className={`p-4 border-b rounded-t-2xl flex items-center justify-between sticky top-0 z-10 shrink-0 ${col.headerBg}`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                    <h3 className="font-extrabold text-sm uppercase tracking-wider">{col.title}</h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-white/80 shadow-xs border border-slate-200">
                    {columnApps.length}
                  </span>
                </div>

                {/* Independently Scrollable Drop Zone Area */}
                <div className="p-3 flex-1 overflow-y-auto min-h-0 space-y-3">
                  {columnApps.length === 0 ? (
                    <div className="h-36 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-medium p-4 text-center">
                      <FiMove className="w-5 h-5 mb-1 text-slate-300" />
                      <span>Drag cards here</span>
                    </div>
                  ) : (
                    columnApps.map((app) => {
                      const isBeingDragged = draggedAppId === app._id;

                      return (
                        <div
                          key={app._id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, app._id)}
                          onDragEnd={handleDragEnd}
                          className={`bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing relative group ${col.cardBorder} ${
                            isBeingDragged ? 'opacity-40 border-dashed border-blue-500' : ''
                          }`}
                        >
                          {/* Drag handle icon indicator */}
                          <div className="absolute top-3 right-3 text-slate-300 group-hover:text-slate-400">
                            <FiMove className="w-4 h-4" />
                          </div>

                          {/* Candidate Name */}
                          <div className="flex items-center gap-2 mb-2 pr-6">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-xs shrink-0">
                              {(app.name || 'C').charAt(0).toUpperCase()}
                            </div>
                            <div className="overflow-hidden">
                              <h4 title={`Candidate: ${app.name}`} className="text-sm font-bold text-slate-900 truncate">{app.name}</h4>
                              <p title={`Email: ${app.email}`} className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                                <FiMail className="w-3 h-3 text-slate-400 shrink-0" />
                                {app.email}
                              </p>
                            </div>
                          </div>

                          {/* Company / Job */}
                          <div title={`Applied Company: ${app.companyName || 'Job Listing'}`} className="mb-3 px-2.5 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-1.5">
                            <FiBriefcase className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="truncate">{app.companyName || 'Job Listing'}</span>
                          </div>

                          {/* Footer Actions & Date */}
                          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              <FiClock className="w-3 h-3" />
                              <span>{app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'Recent'}</span>
                            </div>

                            {/* Resume Link */}
                            {app.resumePath && (
                              <a
                                href={app.resumePath.startsWith('http') ? app.resumePath : `/uploads/${app.resumePath}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <FiFileText className="w-3.5 h-3.5" />
                                <span>Resume</span>
                              </a>
                            )}
                          </div>

                          {/* Touch Fallback Select */}
                          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Status:</label>
                            <select
                              value={app.status || 'pending'}
                              onChange={(e) => updateStatus(app._id, e.target.value)}
                              className="text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-md px-2 py-0.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                            >
                              <option value="pending">Pending</option>
                              <option value="submitted">Submitted</option>
                              <option value="accepted">Accepted</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;
