const crypto = require('crypto');
const { prisma } = require('./prisma');

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
  const apiToken = await validateApiToken(token);

  if (!apiToken) {
    return { success: false, error: 'Invalid or expired API token' };
  }

  if (!hasPermission(apiToken, requiredPermission)) {
    return { success: false, error: `Insufficient permissions. Required: ${requiredPermission}` };
  }

  return { success: true, apiToken };
}

module.exports = {
  generateApiToken,
  validateApiToken,
  hasPermission,
  authenticateApiRequest
};