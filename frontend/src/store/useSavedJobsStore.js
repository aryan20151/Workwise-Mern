import { create } from 'zustand';
import { toast } from '../utils/toast';

export const useSavedJobsStore = create((set, get) => ({
  savedJobs: [],
  savedCount: 0,
  isLoading: false,

  fetchSavedJobs: async (force = false) => {
    if (get().isLoading && !force) return;

    set({ isLoading: true });
    try {
      const storedUser = (() => {
        try { return JSON.parse(localStorage.getItem('workwise_user')); } catch (e) { return null; }
      })();

      const response = await fetch('/api/saved-requisitions', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(storedUser?.id ? { 'x-user-id': storedUser.id } : {})
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.savedRequisitions)) {
          set({ savedJobs: data.savedRequisitions, savedCount: data.savedRequisitions.length });
        }
      }
    } catch (err) {
      console.error('Error fetching saved jobs in Zustand store:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  saveJob: async (reqItem) => {
    try {
      const storedUser = (() => {
        try { return JSON.parse(localStorage.getItem('workwise_user')); } catch (e) { return null; }
      })();

      const payload = {
        requisitionId: reqItem.requisitionId || reqItem._id || reqItem.companyId,
        title: reqItem.title || 'Job Position',
        companyId: reqItem.companyId || reqItem.requisitionId,
        companyName: reqItem.companyName || 'Company',
        location: reqItem.location || 'Remote',
        budget: reqItem.budget || 'Negotiable',
        jobType: reqItem.jobType || 'Full-Time',
        techStack: reqItem.techStack || [],
        description: reqItem.description || ''
      };

      const response = await fetch('/api/saved-requisitions', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(storedUser?.id ? { 'x-user-id': storedUser.id } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(`Saved job "${reqItem.title}" to your Saved Jobs!`);
        get().fetchSavedJobs(true);
      } else {
        toast.error(data.message || 'Failed to save job requisition');
      }
    } catch (err) {
      console.error('Error saving job:', err);
      toast.error('Error saving job requisition.');
    }
  },

  removeSavedJob: async (requisitionId, title = 'Job') => {
    try {
      const storedUser = (() => {
        try { return JSON.parse(localStorage.getItem('workwise_user')); } catch (e) { return null; }
      })();

      const response = await fetch(`/api/saved-requisitions/${requisitionId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          ...(storedUser?.id ? { 'x-user-id': storedUser.id } : {})
        }
      });

      if (response.ok) {
        const currentItems = get().savedJobs.filter(item => item.requisitionId !== requisitionId);
        set({ savedJobs: currentItems, savedCount: currentItems.length });
        toast.success(`Removed "${title}" from saved jobs`);
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to remove saved job');
      }
    } catch (err) {
      console.error('Error removing saved job:', err);
      toast.error('Error removing saved job. Please try again.');
    }
  },

  isJobSaved: (requisitionId) => {
    return get().savedJobs.some(item => String(item.requisitionId) === String(requisitionId));
  }
}));
