// lib/auth-utils.js - Debug version
/**
 * Utility functions for authentication and authorization
 */

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
    
    // Decode base64
    const decodedPayload = atob(paddedPayload);
    
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
 * Check if user is authenticated (has valid token)
 * @returns {boolean}
 */
export function isAuthenticated() {
  if (typeof window === 'undefined') {
    return false; // Server-side
  }

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
    return false;
  }

  // Check if token is expired
  if (payload.exp) {
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      console.log('🔍 Auth check: Token expired');
      return false;
    }
  }

  console.log('🔍 Auth check: Valid');
  return true;
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