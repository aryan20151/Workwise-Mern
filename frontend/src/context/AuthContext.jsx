import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';

const AuthContext = createContext(null);

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const isClerkEnabled = Boolean(PUBLISHABLE_KEY && PUBLISHABLE_KEY !== 'pk_test_placeholder' && PUBLISHABLE_KEY.length > 20);

// Inner Subscriber Component that listens to Clerk hooks
const ClerkSubscriber = ({ onClerkState }) => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();

  useEffect(() => {
    onClerkState({ isLoaded, isSignedIn, user, signOut });
  }, [isLoaded, isSignedIn, user, signOut, onClerkState]);

  return null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clerkState, setClerkState] = useState({ isLoaded: false, isSignedIn: false, user: null, signOut: null });
  const syncedClerkIdRef = React.useRef(null);

  // Sync Clerk user with AuthContext when Clerk state updates
  useEffect(() => {
    if (isClerkEnabled) {
      const { isLoaded, isSignedIn, user: clerkUser } = clerkState;
      if (isLoaded) {
        if (isSignedIn && clerkUser) {
          // Avoid duplicate google-sync API requests if already synced for this user ID
          if (syncedClerkIdRef.current === clerkUser.id && user) {
            setLoading(false);
            return;
          }
          syncedClerkIdRef.current = clerkUser.id;

          const userEmail = clerkUser.primaryEmailAddress?.emailAddress;
          const userUsername = clerkUser.fullName || clerkUser.firstName || userEmail?.split('@')[0] || 'User';

          // Sync Google user with backend MongoDB Atlas (runs ONCE)
          fetch('/api/auth/google-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: userEmail,
              username: userUsername,
              clerkId: clerkUser.id
            })
          })
          .then(res => res.json())
          .then(data => {
            const formattedUser = {
              id: (data.success && data.user && data.user.id) || clerkUser.id,
              username: (data.success && data.user && data.user.username) || userUsername,
              email: userEmail,
              avatar: clerkUser.imageUrl
            };
            setUser(formattedUser);
            localStorage.setItem('workwise_user', JSON.stringify(formattedUser));
          })
          .catch(err => {
            console.error('Error syncing Google user with Mongo:', err);
            const fallbackUser = {
              id: clerkUser.id,
              username: userUsername,
              email: userEmail,
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
      const response = await fetch('/api/auth/status', {
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          localStorage.setItem('workwise_user', JSON.stringify(data.user));
        } else {
          setUser(null);
          localStorage.removeItem('workwise_user');
        }
      }
    } catch (error) {
      console.error('Error verifying session status:', error);
      setUser(null);
      localStorage.removeItem('workwise_user');
    } finally {
      setLoading(false);
    }
  };

  const login = async (emailOrUsername, password) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername, password })
      });
      const data = await response.json();
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('workwise_user', JSON.stringify(data.user));
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login request failed:', error);
      return { success: false, message: 'An error occurred. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (username, email, password) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      const data = await response.json();
      if (data.success) {
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Signup failed' };
      }
    } catch (error) {
      console.error('Signup request failed:', error);
      return { success: false, message: 'An error occurred. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (clerkState.signOut) {
        await clerkState.signOut();
      }
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('workwise_user');
      setLoading(false);
      return true;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, checkAuthStatus, isClerkEnabled }}>
      {isClerkEnabled && <ClerkSubscriber onClerkState={setClerkState} />}
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
