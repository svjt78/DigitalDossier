// lib/auth-utils.js - Debug version with server-side support
/**
 * Utility functions for authentication and authorization
 */

import { prisma } from './prisma';

const SUPER_USER_EMAIL = 'suvodutta.isme@gmail.com';

/**
 * Decode JWT token payload (simple base64 decode)
 * @param {string} token - JWT token
 * @returns {object|null} - Decoded payload or null if invalid
 */
export function decodeJWTPayload(token) {
  if (!token || typeof token !== 'string') {
    console.warn('🔍 JWT decode: Invalid token provided');
    return null;
  }

  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('🔍 JWT decode: Invalid token format');
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    
    // Add padding if needed for base64 decode
    const paddedPayload = payload.padEnd(payload.length + (4 - payload.length % 4) % 4, '=');
    
    // Decode base64 (server-side compatible)
    let decodedPayload;
    if (typeof window === 'undefined') {
      // Server-side
      decodedPayload = Buffer.from(paddedPayload, 'base64').toString('utf-8');
    } else {
      // Client-side
      decodedPayload = atob(paddedPayload);
    }
    
    // Parse JSON
    const parsed = JSON.parse(decodedPayload);
    console.log('🔍 JWT payload decoded:', parsed);
    return parsed;
  } catch (error) {
    console.warn('🔍 JWT decode failed:', error);
    return null;
  }
}

/**
 * Get email from localStorage
 * @returns {string|null}
 */
export function getStoredEmail() {
  if (typeof window === 'undefined') {
    return null; // Server-side
  }
  
  const email = localStorage.getItem('email');
  console.log('🔍 Stored email:', email);
  return email;
}

/**
 * Get email from JWT token
 * @returns {string|null}
 */
export function getEmailFromToken() {
  if (typeof window === 'undefined') {
    return null; // Server-side
  }

  const token = localStorage.getItem('access_token');
  if (!token) {
    console.log('🔍 No access token found');
    return null;
  }

  const payload = decodeJWTPayload(token);
  if (!payload) {
    console.log('🔍 Could not decode JWT payload');
    return null;
  }

  // Try different possible email fields
  const email = payload.email || payload.sub || payload.user_email || null;
  console.log('🔍 Email from token:', email);
  return email;
}

/**
 * Validate if user is superuser by checking both localStorage and JWT token
 * @returns {boolean}
 */
export function isSuperUser() {
  if (typeof window === 'undefined') {
    console.log('🔍 isSuperUser: Server-side, returning false');
    return false; // Server-side
  }

  console.log('🔍 Starting superuser check...');

  // Get email from localStorage
  const storedEmail = getStoredEmail();
  
  // Get email from JWT token
  const tokenEmail = getEmailFromToken();
  
  console.log('🔍 Email comparison:', {
    storedEmail,
    tokenEmail,
    superUserEmail: SUPER_USER_EMAIL
  });
  
  // Normalize emails for comparison
  const normalizedSuperEmail = SUPER_USER_EMAIL.toLowerCase();
  const storedEmailMatch = storedEmail?.toLowerCase() === normalizedSuperEmail;
  const tokenEmailMatch = tokenEmail?.toLowerCase() === normalizedSuperEmail;
  
  console.log('🔍 Match results:', {
    storedEmailMatch,
    tokenEmailMatch,
    finalResult: storedEmailMatch && tokenEmailMatch
  });
  
  // RELAXED CHECK: If we have the email in localStorage and it matches, allow it
  // This handles cases where JWT doesn't contain email
  if (storedEmailMatch && !tokenEmail) {
    console.log('🔍 Using relaxed check: localStorage email matches, JWT has no email');
    return true;
  }
  
  // Strict check: both localStorage and token should have the super user email
  return storedEmailMatch && tokenEmailMatch;
}

/**
 * Clear expired session data and notify listeners
 */
export function clearExpiredSession() {
  console.log('🚪 Clearing expired session data');
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_id');
  localStorage.removeItem('username');
  localStorage.removeItem('email');
  
  // Dispatch custom event to notify AuthContext
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tokenExpired'));
  }
}

/**
 * Get token expiration time in seconds
 */
export function getTokenExpiration() {
  if (typeof window === 'undefined') {
    return null; // Server-side
  }
  
  const token = localStorage.getItem('access_token');
  if (!token) return null;
  
  const payload = decodeJWTPayload(token);
  return payload?.exp || null;
}

/**
 * Check how much time left before token expires
 */
export function getTimeUntilExpiration() {
  const exp = getTokenExpiration();
  if (!exp) return null;
  
  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, exp - now); // Seconds until expiration
}

/**
 * Check if user is authenticated (has valid token) - Enhanced with auto-cleanup
 * @returns {boolean}
 */
export function isAuthenticated(req = null) {
  if (typeof window === 'undefined') {
    // Server-side - check request headers
    if (!req) return false;
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }
    
    const token = authHeader.substring(7);
    const payload = decodeJWTPayload(token);
    
    if (!payload) return false;
    
    // Check if token is expired
    if (payload.exp) {
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        return false;
      }
    }
    
    return true;
  }

  // Client-side with auto-cleanup
  const token = localStorage.getItem('access_token');
  const userId = localStorage.getItem('user_id');
  
  console.log('🔍 Auth check:', { hasToken: !!token, hasUserId: !!userId });
  
  if (!token || !userId) {
    return false;
  }

  // Try to decode token to check if it's valid format
  const payload = decodeJWTPayload(token);
  if (!payload) {
    console.log('🔍 Auth check: Invalid token format');
    clearExpiredSession();
    return false;
  }

  // Check if token is expired
  if (payload.exp) {
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      console.log('🔍 Auth check: Token expired, clearing session');
      clearExpiredSession();
      return false;
    }
  }

  console.log('🔍 Auth check: Valid');
  return true;
}

/**
 * Get user from request token (server-side) - FIXED VERSION
 * @param {object} req - Request object
 * @returns {object|null} - User data with local database integer ID
 */
export async function getUserFromToken(req) {
  if (!req) return null;
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  const payload = decodeJWTPayload(token);
  
  if (!payload) return null;
  
  // Check if token is expired
  if (payload.exp) {
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null;
    }
  }
  
  // Get the credential UUID from the JWT
  const credentialUserId = payload.user_id || payload.sub;
  if (!credentialUserId) {
    console.error('🔍 No user_id in JWT payload');
    return null;
  }
  
  console.log('🔍 Looking up user with:', { 
    credentialUserId, 
    email: payload.email, 
    user_email: payload.user_email 
  });
  
  try {
    // Look up the local user by credential UUID first, then by email
    let user = await prisma.user.findFirst({
      where: {
        credentialUserId: credentialUserId
      },
      select: {
        id: true,          // Local integer ID
        email: true,
        name: true,
        credentialUserId: true
      }
    });
    
    // If not found by credentialUserId, try by email as fallback
    if (!user && (payload.email || payload.user_email)) {
      const emailToSearch = payload.email || payload.user_email;
      console.log('🔍 Trying email fallback:', emailToSearch);
      
      user = await prisma.user.findFirst({
        where: {
          email: emailToSearch
        },
        select: {
          id: true,
          email: true,
          name: true,
          credentialUserId: true
        }
      });
      
      // If found by email but missing credentialUserId, update it
      if (user && !user.credentialUserId) {
        console.log('🔍 Updating user with credentialUserId');
        await prisma.user.update({
          where: { id: user.id },
          data: { credentialUserId: credentialUserId }
        });
        user.credentialUserId = credentialUserId;
      }
    }
    
    if (!user) {
      console.error('🔍 User not found in local database:', { credentialUserId, email: payload.email });
      return null;
    }
    
    // Ensure the ID is explicitly an integer
    const localUserId = parseInt(user.id, 10);
    
    console.log('🔍 Found local user:', { 
      localId: localUserId, 
      localIdType: typeof localUserId,
      credentialId: user.credentialUserId 
    });
    
    return {
      id: localUserId,                                       // LOCAL INTEGER ID ✅ (explicitly converted)
      email: user.email,
      username: user.name,
      credentialUserId: user.credentialUserId
    };
  } catch (error) {
    console.error('🔍 Database error in getUserFromToken:', error);
    return null;
  }
}

/**
 * Get authorization header for API calls (client-side)
 * @returns {object} - Headers object with authorization
 */
export function getAuthHeaders() {
  if (typeof window === 'undefined') {
    return {};
  }
  
  const token = localStorage.getItem('access_token');
  if (!token) return {};
  
  return {
    'Authorization': `Bearer ${token}`
  };
}

/**
 * Get user info from storage and token
 * @returns {object}
 */
export function getUserInfo() {
  if (typeof window === 'undefined') {
    return { isAuthenticated: false, isSuperUser: false };
  }

  const info = {
    isAuthenticated: isAuthenticated(),
    isSuperUser: isSuperUser(),
    email: getStoredEmail(),
    tokenEmail: getEmailFromToken(),
    userId: localStorage.getItem('user_id'),
    username: localStorage.getItem('username'),
  };
  
  console.log('🔍 User info:', info);
  return info;
}
