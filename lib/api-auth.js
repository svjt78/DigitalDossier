const crypto = require('crypto');
const { prisma } = require('./prisma');
const { decodeJWTPayload } = require('./auth-utils');

async function generateApiToken(name, permissions = ['upload'], expiresAt = null) {
  const token = `api_${crypto.randomBytes(32).toString('hex')}`;
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const apiToken = await prisma.apiToken.create({
    data: {
      name,
      token: hashedToken,
      permissions,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });

  return { token, id: apiToken.id };
}

async function validateApiToken(token) {
  if (!token || !token.startsWith('api_')) {
    return null;
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  try {
    const apiToken = await prisma.apiToken.findUnique({
      where: { token: hashedToken },
    });

    if (!apiToken || !apiToken.isActive) {
      return null;
    }

    if (apiToken.expiresAt && new Date() > apiToken.expiresAt) {
      return null;
    }

    await prisma.apiToken.update({
      where: { id: apiToken.id },
      data: { lastUsed: new Date() },
    });

    return apiToken;
  } catch (error) {
    console.error('API token validation error:', error);
    return null;
  }
}

function hasPermission(apiToken, permission) {
  return apiToken?.permissions.includes(permission) || false;
}

async function authenticateApiRequest(req, requiredPermission = 'upload') {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { success: false, error: 'Missing or invalid authorization header' };
  }

  const token = authHeader.substring(7);
  
  // Log authentication attempt
  console.log(`🔐 Authentication attempt:`, {
    authType: token.startsWith('api_') ? 'api_token' : 'jwt',
    tokenPrefix: token.substring(0, 10),
    endpoint: req.url,
    requiredPermission
  });
  
  // Detect token type and route to appropriate validation
  if (token.startsWith('api_')) {
    // Existing API token validation (unchanged)
    const apiToken = await validateApiToken(token);
    
    if (!apiToken) {
      console.log('🔐 API token validation failed');
      return { success: false, error: 'Invalid or expired API token' };
    }
    
    if (!hasPermission(apiToken, requiredPermission)) {
      console.log('🔐 API token insufficient permissions');
      return { success: false, error: `Insufficient permissions. Required: ${requiredPermission}` };
    }
    
    console.log('🔐 API token authentication successful');
    return { 
      success: true, 
      apiToken, 
      authType: 'api_token',
      userId: null // API tokens don't have user context
    };
  } else {
    // New JWT token validation
    const jwtResult = await validateJWTToken(token);
    
    if (!jwtResult.valid) {
      console.log('🔐 JWT validation failed:', jwtResult.error);
      return { success: false, error: jwtResult.error };
    }
    
    if (!hasJWTPermission(jwtResult.payload, requiredPermission)) {
      console.log('🔐 JWT insufficient permissions');
      return { success: false, error: `Insufficient permissions. Required: ${requiredPermission}` };
    }
    
    console.log('🔐 JWT authentication successful:', {
      userId: jwtResult.userId,
      email: jwtResult.email
    });
    return { 
      success: true, 
      jwtToken: jwtResult, 
      authType: 'jwt',
      userId: jwtResult.userId,
      email: jwtResult.email
    };
  }
}

/**
 * Validate JWT token format and expiration
 * @param {string} token - JWT token to validate
 * @returns {object} - Validation result with payload if valid
 */
async function validateJWTToken(token) {
  try {
    // Decode JWT payload using existing utility from auth-utils
    const payload = decodeJWTPayload(token);
    
    if (!payload) {
      return { valid: false, error: 'Invalid JWT format' };
    }
    
    // Check expiration
    if (payload.exp) {
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        return { valid: false, error: 'JWT token expired' };
      }
    }
    
    // Validate required fields
    if (!payload.user_id && !payload.sub) {
      return { valid: false, error: 'Missing user identification in JWT' };
    }
    
    return { 
      valid: true, 
      payload,
      userId: payload.user_id || payload.sub,
      email: payload.email || payload.user_email
    };
  } catch (error) {
    console.error('JWT validation error:', error);
    return { valid: false, error: `JWT validation failed: ${error.message}` };
  }
}

/**
 * Check if JWT token has required permission
 * @param {object} jwtPayload - Decoded JWT payload
 * @param {string} permission - Required permission
 * @returns {boolean} - True if permission granted
 */
function hasJWTPermission(jwtPayload, permission) {
  // For JWT tokens from admin login, grant all permissions
  // Future enhancement: Add role-based permissions from JWT claims
  const allowedPermissions = ['upload', 'read', 'delete'];
  return allowedPermissions.includes(permission);
}

module.exports = {
  generateApiToken,
  validateApiToken,
  hasPermission,
  authenticateApiRequest,
  validateJWTToken,
  hasJWTPermission
};