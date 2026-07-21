import { create } from 'zustand';

export const useAuthStore = create((set, get) => ({
  user: (() => {
    try {
      const saved = localStorage.getItem('workwise_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  })(),
  loading: false,
  clerkState: { isLoaded: false, isSignedIn: false, user: null, signOut: null },

  // State actions
  setUser: (user) => {
    if (user) {
      localStorage.setItem('workwise_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('workwise_user');
    }
    set({ user });
  },

  setLoading: (loading) => set({ loading }),

  setClerkState: (clerkState) => set({ clerkState }),

  logout: async () => {
    const { clerkState } = get();
    if (clerkState?.signOut) {
      try {
        await clerkState.signOut();
      } catch (e) {
        console.warn('Clerk signout notice:', e);
      }
    }

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error:', e);
    }

    localStorage.removeItem('workwise_user');
    set({ user: null });
  }
}));
