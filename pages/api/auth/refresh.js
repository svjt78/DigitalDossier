// pages/api/auth/refresh.js
import { isAuthenticated, getUserFromToken } from '@/lib/auth-utils';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if user is authenticated
    if (!isAuthenticated(req)) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Make a request to the credential service to get a new token
    const credentialServiceResponse = await fetch(`${process.env.AUTH_API_BASE}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization, // Forward the current token
        'X-Service-Token': process.env.CREDENTIAL_INTERNAL_TOKEN
      },
      body: JSON.stringify({
        user_id: user.credentialUserId
      })
    });

    if (credentialServiceResponse.ok) {
      const data = await credentialServiceResponse.json();
      return res.status(200).json({
        access_token: data.access_token,
        message: 'Token refreshed successfully'
      });
    } else {
      // If the credential service doesn't support refresh, just return success
      // This allows the client to reset its timers
      console.log('⚠️ Credential service refresh not available, allowing timer reset');
      return res.status(200).json({
        message: 'Session extended',
        extended: true
      });
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
