// pages/api/auth/login.js
import { prisma } from '@/lib/prisma';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  console.log('🔐 Login API called:', { method: req.method, hasBody: !!req.body });
  
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, password } = req.body || {};
  console.log('🔐 Login request:', { email: email ? 'provided' : 'missing', password: password ? 'provided' : 'missing' });
  
  if (typeof email !== 'string' || typeof password !== 'string') {
    console.log('🔐 Invalid parameters:', { emailType: typeof email, passwordType: typeof password });
    return res.status(400).json({ error: 'Invalid request parameters' });
  }

  // Credential service base
  const AUTH_BASE =
    process.env.AUTH_API_BASE ||
    process.env.NEXT_PUBLIC_AUTH_API_BASE;
  console.log('🔐 AUTH_BASE:', AUTH_BASE ? 'configured' : 'missing');
  
  if (!AUTH_BASE) {
    console.log('🔐 Missing AUTH_API_BASE environment variable');
    return res.status(500).json({ error: 'Missing AUTH_API_BASE' });
  }

  try {
    console.log('🔐 Attempting credential app login:', `${AUTH_BASE}/auth/login`);
    // 1) Proxy to credential app for login (credential enforces is_verified)
    const upstream = await fetch(`${AUTH_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    console.log('🔐 Credential app response:', { 
      status: upstream.status, 
      ok: upstream.ok,
      statusText: upstream.statusText 
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

    console.log('🔐 Database sync data:', { 
      credEmail, 
      credUsername, 
      userId: payload.user_id ? 'provided' : 'missing',
      payload: Object.keys(payload)
    });

    try {
      console.log('🔐 Attempting database upsert...');
      const upsertResult = await prisma.user.upsert({
        where: { email: credEmail },
        create: {
          email: credEmail,
          name: credUsername, // usernames can duplicate in blog
          credential_user_id: payload.user_id, // Store the UUID from credential system
          updated_at: new Date()
        },
        update: {
          // keep username aligned with credential
          name: credUsername,
          credential_user_id: payload.user_id, // Update the UUID mapping
          updated_at: new Date()
        },
      });
      console.log('🔐 Database upsert successful:', { userId: upsertResult.id });
    } catch (linkErr) {
      // Best-effort: don't block login on local sync failure
      console.error('🔐 Auto-link/sync failed in blog DB:', linkErr);
      console.error('🔐 Link error details:', {
        name: linkErr.name,
        message: linkErr.message,
        code: linkErr.code
      });
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

    console.log('🔐 Login successful, returning response:', {
      hasToken: !!loginResponse.access_token,
      userId: loginResponse.user_id ? 'provided' : 'missing',
      email: loginResponse.email ? 'provided' : 'missing'
    });

    return res.status(200).json(loginResponse);
  } catch (err) {
    console.error('🔐 Login proxy error:', err);
    console.error('🔐 Error details:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      cause: err.cause
    });
    return res.status(500).json({ 
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}