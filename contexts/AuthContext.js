// contexts/AuthContext.js - Debug version
import { createContext, useState, useEffect } from 'react';
import { isSuperUser, isAuthenticated } from '@/lib/auth-utils';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState(null);
  const [email, setEmail] = useState(null);
  const [isSuper, setIsSuper] = useState(false);
  const [isAuth, setIsAuth] = useState(false);

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
    
    console.log('✅ Logout complete');
  };

  return (
    <AuthContext.Provider value={{ 
      userId, 
      username, 
      email,
      isAuthenticated: isAuth,
      isSuperUser: isSuper,
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}