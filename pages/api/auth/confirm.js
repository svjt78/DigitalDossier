// File: pages/api/auth/confirm.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { token } = req.query;
  if (typeof token !== 'string' || !token) {
    return res.status(400).json({ error: 'Missing or invalid token' });
  }

  const AUTH_BASE =
    process.env.AUTH_API_BASE || process.env.NEXT_PUBLIC_AUTH_API_BASE;
  if (!AUTH_BASE) {
    return res.status(500).json({ error: 'Missing AUTH_API_BASE' });
  }

  try {
    // Proxy to credential app (adjust path if your credential route differs)
    const upstream = await fetch(
      `${AUTH_BASE}/auth/verify-email?token=${encodeURIComponent(token)}`,
      { method: 'GET' }
    );

    const contentType = upstream.headers.get('content-type') || '';
    let payload;
    if (contentType.includes('application/json')) {
      try {
        payload = await upstream.json();
      } catch {
        const text = await upstream.text();
        return res.status(upstream.status).json({ error: text });
      }
    } else {
      const text = await upstream.text();
      payload = { error: text };
    }

    if (!upstream.ok) {
      // Bubble up credential error (invalid/expired token, etc.)
      return res.status(upstream.status).json(payload);
    }

    // Keep response shape friendly for pages/confirm.js
    return res.status(200).json({ message: 'Email confirmed successfully' });
  } catch (err) {
    console.error('Email confirmation proxy error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
