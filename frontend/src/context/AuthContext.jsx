import React, { createContext, useContext, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useAuthStore } from '../store/useAuthStore';
import RoleSelectionModal from '../components/RoleSelectionModal';
import api from '../utils/api';

const AuthContext = createContext(null);

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const isClerkEnabled = Boolean(PUBLISHABLE_KEY && PUBLISHABLE_KEY !== 'pk_test_placeholder' && PUBLISHABLE_KEY.length > 20);

// Subscriber Component listening to Clerk hooks and syncing with Zustand store
const ClerkSubscriber = ({ onClerkState }) => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();

  useEffect(() => {
    onClerkState({ isLoaded, isSignedIn, user, signOut });
  }, [isLoaded, isSignedIn, user, signOut, onClerkState]);

  return null;
};

export const AuthProvider = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const clerkState = useAuthStore((state) => state.clerkState);
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);
  const setClerkState = useAuthStore((state) => state.setClerkState);
  const logout = useAuthStore((state) => state.logout);

  const syncedClerkIdRef = React.useRef(null);

  // Sync Clerk state with Zustand Auth Store
  useEffect(() => {
    if (isClerkEnabled) {
      const { isLoaded, isSignedIn, user: clerkUser } = clerkState;
      if (isLoaded) {
        if (isSignedIn && clerkUser) {
          if (syncedClerkIdRef.current === clerkUser.id && user) {
            setLoading(false);
            return;
          }
          syncedClerkIdRef.current = clerkUser.id;

          const userEmail = clerkUser.primaryEmailAddress?.emailAddress;
          const userUsername = clerkUser.fullName || clerkUser.firstName || userEmail?.split('@')[0] || 'User';

          const savedRole = localStorage.getItem('workwise_google_signup_role');
          if (savedRole) {
            localStorage.removeItem('workwise_google_signup_role');
          }

          api.post('/api/auth/google-sync', {
            email: userEmail,
            username: userUsername,
            clerkId: clerkUser.id,
            selectedRole: savedRole || null
          })
          .then(res => res.data)
          .then(data => {
            const formattedUser = {
              id: (data.success && data.user && data.user.id) || clerkUser.id,
              username: (data.success && data.user && data.user.username) || userUsername,
              email: userEmail,
              role: (data.success && data.user && data.user.role) || 'jobseeker',
              hasSelectedRole: data.success && data.user ? data.user.hasSelectedRole : false,
              avatar: clerkUser.imageUrl
            };
            setUser(formattedUser);
          })
          .catch(err => {
            console.error('Error syncing Google user with Mongo:', err);
            const fallbackUser = {
              id: clerkUser.id,
              username: userUsername,
              email: userEmail,
              role: 'jobseeker',
              hasSelectedRole: false,
              avatar: clerkUser.imageUrl
            };
            setUser(fallbackUser);
          })
          .finally(() => setLoading(false));
        } else {
          checkAuthStatus();
        }
      }
    } else {
      checkAuthStatus();
    }
  }, [clerkState]);

  const checkAuthStatus = async () => {
    try {
      const response = await api.get('/api/auth/status');
      const data = response.data;
      if (data.authenticated && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error verifying session status:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (emailOrUsername, password) => {
    setLoading(true);
    try {
      const response = await api.post('/api/auth/login', { emailOrUsername, password });
      const data = response.data;
      if (data.success && data.user) {
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login request failed:', error);
      const errMsg = error.response?.data?.message || 'An error occurred. Please try again.';
      return { success: false, message: errMsg };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (username, email, password, role = 'jobseeker', companyName = '') => {
    setLoading(true);
    try {
      const response = await api.post('/api/auth/signup', { username, email, password, role, companyName });
      const data = response.data;
      if (data.success) {
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Signup failed' };
      }
    } catch (error) {
      console.error('Signup request failed:', error);
      const errMsg = error.response?.data?.message || 'An error occurred. Please try again.';
      return { success: false, message: errMsg };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, checkAuthStatus, isClerkEnabled }}>
      {isClerkEnabled && <ClerkSubscriber onClerkState={setClerkState} />}
      <RoleSelectionModal />
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
