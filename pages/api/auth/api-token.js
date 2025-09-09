import { generateApiToken } from '@/lib/api-auth';
import { getUserFromToken } from '@/lib/auth-utils';

const SUPER_USER_EMAIL = 'suvodutta.isme@gmail.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' }
      });
    }

    if (user.email?.toLowerCase() !== SUPER_USER_EMAIL.toLowerCase()) {
      return res.status(403).json({ 
        success: false,
        error: { code: 'FORBIDDEN', message: 'Super user access required' }
      });
    }

    const { name, permissions = ['upload'], expiresAt } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        success: false,
        error: { 
          code: 'VALIDATION_ERROR', 
          message: 'Token name is required',
          details: { field: 'name', constraints: ['required', 'string'] }
        }
      });
    }

    const validPermissions = ['upload', 'read', 'delete'];
    if (!Array.isArray(permissions) || !permissions.every(p => validPermissions.includes(p))) {
      return res.status(400).json({
        success: false,
        error: { 
          code: 'VALIDATION_ERROR', 
          message: 'Invalid permissions',
          details: { field: 'permissions', allowedValues: validPermissions }
        }
      });
    }

    const result = await generateApiToken(name, permissions, expiresAt);

    return res.status(201).json({
      success: true,
      data: {
        token: result.token,
        id: result.id,
        name,
        permissions,
        expiresAt
      }
    });

  } catch (error) {
    console.error('API token generation error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to generate API token' }
    });
  }
}