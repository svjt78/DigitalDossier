// contexts/AuthContext.js - Enhanced with auto-logout
import { createContext, useState, useEffect } from 'react';
import { isSuperUser, isAuthenticated, getTimeUntilExpiration, getAuthHeaders } from '@/lib/auth-utils';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState(null);
  const [email, setEmail] = useState(null);
  const [isSuper, setIsSuper] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [sessionWarning, setSessionWarning] = useState(false);

  // Load auth state from localStorage on mount
  useEffect(() => {
    console.log('🔍 AuthContext: Loading from localStorage...');
    
    const uid = localStorage.getItem('user_id');
    const uname = localStorage.getItem('username');
    const userEmail = localStorage.getItem('email');
    
    console.log('📦 localStorage contents:', { uid, uname, userEmail });
    
    if (uid) setUserId(uid);
    if (uname) setUsername(uname);
    if (userEmail) setEmail(userEmail);
    
    // Check authentication and super user status
    const authStatus = isAuthenticated();
    const superStatus = isSuperUser();
    
    console.log('🔐 Auth status:', { authStatus, superStatus });
    
    setIsAuth(authStatus);
    setIsSuper(superStatus);
    
    console.log('✅ AuthContext initialized:', {
      userId: uid,
      username: uname,
      email: userEmail,
      isAuthenticated: authStatus,
      isSuperUser: superStatus
    });
  }, []);

  const login = ({ access_token, user_id, username, email }) => {
    console.log('🚀 AuthContext: Login called with:', { 
      access_token: !!access_token, 
      user_id, 
      username, 
      email 
    });
    
    // Store all values in localStorage
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('user_id', user_id);
    localStorage.setItem('username', username);
    
    // CRITICAL: Make sure email is stored
    if (email) {
      localStorage.setItem('email', email);
      console.log('📧 Email stored in localStorage:', email);
    } else {
      console.warn('⚠️ No email provided to login function!');
    }
    
    // Update state
    setUserId(user_id);
    setUsername(username);
    setEmail(email);
    setIsAuth(true);
    setSessionExpired(false); // Reset session expired state on login
    setSessionWarning(false); // Reset warning on login
    
    // Check if this user is superuser
    const superStatus = isSuperUser();
    console.log('👑 Superuser check result:', superStatus);
    setIsSuper(superStatus);
    
    console.log('✅ Login complete. Final state:', {
      userId: user_id,
      username,
      email,
      isAuthenticated: true,
      isSuperUser: superStatus
    });
  };

  // Token expiration monitoring
  useEffect(() => {
    let expirationTimer = null;
    let warningTimer = null;

    const setupExpirationMonitoring = () => {
      const timeLeft = getTimeUntilExpiration();
      
      if (timeLeft === null || timeLeft <= 0) {
        if (isAuth) {
          console.log('🚪 Token expired, auto-logout');
          handleAutoLogout();
        }
        return;
      }

      console.log(`⏱️ Setting up expiration monitoring: ${timeLeft} seconds remaining`);

      // Clear existing timers
      if (expirationTimer) clearTimeout(expirationTimer);
      if (warningTimer) clearTimeout(warningTimer);

      // Set warning timer (2 minutes before expiration)
      const warningTime = Math.max(0, timeLeft - 120);
      if (warningTime > 0) {
        warningTimer = setTimeout(() => {
          console.log('⚠️ Session expiring soon (2 minutes remaining)');
          setSessionWarning(true);
        }, warningTime * 1000);
      }

      // Set expiration timer
      expirationTimer = setTimeout(() => {
        console.log('🚪 Token expired, auto-logout');
        handleAutoLogout();
      }, timeLeft * 1000);
    };

    // Listen for token expiration events
    const handleTokenExpired = () => {
      console.log('🚪 Token expiration event received');
      handleAutoLogout();
    };

    // Setup monitoring when authenticated
    if (isAuth) {
      setupExpirationMonitoring();
      window.addEventListener('tokenExpired', handleTokenExpired);
    }

    // Cleanup
    return () => {
      if (expirationTimer) clearTimeout(expirationTimer);
      if (warningTimer) clearTimeout(warningTimer);
      window.removeEventListener('tokenExpired', handleTokenExpired);
    };
  }, [isAuth]);

  // Enhanced logout with auto-logout handling
  const handleAutoLogout = () => {
    setSessionExpired(true);
    setSessionWarning(false); // Clear warning when session expires
    logout();
  };

  // Function to extend session (refresh token)
  const extendSession = async () => {
    try {
      // Make a simple authenticated request to refresh the session
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.access_token) {
          // Update the token in localStorage
          localStorage.setItem('access_token', data.access_token);
          console.log('✅ Session extended with new token');
        } else {
          console.log('✅ Session warning dismissed');
        }
        setSessionWarning(false);
        // The useEffect will automatically set up new timers based on current token
      } else {
        // If refresh fails, proceed with normal logout
        console.log('❌ Session extension failed');
        handleAutoLogout();
      }
    } catch (error) {
      console.error('Session extension error:', error);
      // If there's an error, proceed with normal logout
      handleAutoLogout();
    }
  };

  const logout = () => {
    console.log('🚪 AuthContext: Logout called');
    
    // Clear all stored values
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    
    // Reset state
    setUserId(null);
    setUsername(null);
    setEmail(null);
    setIsAuth(false);
    setIsSuper(false);
    setSessionExpired(false); // Reset on manual logout
    setSessionWarning(false); // Reset warning on logout
    
    console.log('✅ Logout complete');
  };

  return (
    <AuthContext.Provider value={{ 
      userId, 
      username, 
      email,
      isAuthenticated: isAuth,
      isSuperUser: isSuper,
      sessionExpired,
      sessionWarning,
      login, 
      logout,
      extendSession,
      clearSessionExpired: () => setSessionExpired(false),
      clearSessionWarning: () => setSessionWarning(false)
    }}>
      {children}
    </AuthContext.Provider>
  );
}