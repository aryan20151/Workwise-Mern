import React from 'react';
import { useNavigate } from 'react-router-dom';
import KanbanBoard from '../components/KanbanBoard';
import { FiArrowLeft, FiColumns, FiBriefcase } from 'react-icons/fi';

const EmployerKanbanPage = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[calc(100vh-4rem)]">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
        <div>
          <button
            onClick={() => navigate('/manage-companies')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-blue-200 hover:text-white mb-3 transition-colors cursor-pointer"
          >
            <FiArrowLeft className="w-4 h-4" /> Back to Manage Companies
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
              <FiColumns className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Applicant Kanban Board</h1>
          </div>
          <p className="mt-2 text-slate-300 text-sm">
            Drag and drop candidate cards across columns to update application statuses in real-time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/manage-companies')}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors flex items-center gap-2"
          >
            <FiBriefcase className="w-4 h-4" />
            <span>Manage Companies</span>
          </button>
        </div>
      </div>

      {/* Main Kanban Board Component */}
      <KanbanBoard />
    </div>
  );
};

export default EmployerKanbanPage;
