// pages/api/auth/reset-password-confirm.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { token, new_password } = req.body || {};
  if (typeof token !== 'string' || typeof new_password !== 'string') {
    return res.status(400).json({ error: 'Invalid request parameters' });
  }

  try {
    // Use same base as your reset-password-request route
    const AUTH_BASE = process.env.AUTH_API_BASE || process.env.NEXT_PUBLIC_AUTH_API_BASE;
    if (!AUTH_BASE) {
      return res.status(500).json({ error: 'Missing AUTH_API_BASE' });
    }

    const upstream = await fetch(`${AUTH_BASE}/auth/reset-password/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password }),
    });

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
      return res.status(upstream.status).json({ error: text });
    }

    if (!upstream.ok) {
      return res.status(upstream.status).json(payload);
    }

    // Pass through upstream success payload (if any)
    return res.status(200).json(payload);
  } catch (err) {
    console.error('reset-password-confirm proxy error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
