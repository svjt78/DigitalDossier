// pages/api/auth/login.js
import { prisma } from '@/lib/prisma';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Invalid request parameters' });
  }

  // Credential service base
  const AUTH_BASE =
    process.env.AUTH_API_BASE ||
    process.env.NEXT_PUBLIC_AUTH_API_BASE;
  if (!AUTH_BASE) {
    return res.status(500).json({ error: 'Missing AUTH_API_BASE' });
  }

  try {
    // 1) Proxy to credential app for login (credential enforces is_verified)
    const upstream = await fetch(`${AUTH_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
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
      // Bubble credential error (bad creds, not verified, etc.)
      return res.status(upstream.status).json(payload);
    }

    // 2) Auto-link in blog DB by email; sync username from credential
    const credEmail = payload.email ?? email;
    const credUsername =
      payload.username ?? (typeof email === 'string' ?
        email.split('@')[0] : 'user');

    try {
      await prisma.user.upsert({
        where: { email: credEmail },
        create: {
          email: credEmail,
          name: credUsername, // usernames can duplicate in blog
          // Optional: credentialUserId: payload.user_id
        },
        update: {
          // keep username aligned with credential
          name: credUsername,
          // credentialUserId: payload.user_id
        },
      });
    } catch (linkErr) {
      // Best-effort: don't block login on local sync failure
      console.error('Auto-link/sync failed in blog DB:', linkErr);
    }

    // 3) Ensure email is included in response for client-side storage
    const loginResponse = {
      access_token: payload.access_token,
      token_type: payload.token_type,
      user_id: payload.user_id,
      email: credEmail, // Ensure email is always included
      username: credUsername,
      is_active: payload.is_active,
      is_verified: payload.is_verified,
    };

    return res.status(200).json(loginResponse);
  } catch (err) {
    console.error('Login proxy error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}