// File: pages/api/auth/reset-password-request.js

import fetch from 'node-fetch';
import { sendEmail } from '@/lib/email';
import { renderResetRequest } from '@/lib/emailTemplates';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email } = req.body;

  try {
    // Credential service base (fallback to NEXT_PUBLIC if present)
    const AUTH_BASE = process.env.AUTH_API_BASE || process.env.NEXT_PUBLIC_AUTH_API_BASE;
    if (!AUTH_BASE) {
      return res.status(500).json({ error: 'Missing AUTH_API_BASE' });
    }

    // Forward request to FastAPI credential service
    const apiRes = await fetch(`${AUTH_BASE}/auth/reset-password/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    // Parse JSON if possible, otherwise get raw text
    let payload;
    const contentType = apiRes.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        payload = await apiRes.json();
      } catch (parseErr) {
        const text = await apiRes.text();
        console.error('Upstream reset-password/request non-JSON response:', text);
        return res.status(apiRes.status).json({ error: text });
      }
    } else {
      const text = await apiRes.text();
      console.error('Upstream reset-password/request non-JSON response:', text);
      return res.status(apiRes.status).json({ error: text });
    }

    // If upstream returned an error status, bubble it up
    if (!apiRes.ok) {
      console.error('Upstream reset-password/request error payload:', payload);
      return res.status(apiRes.status).json(payload);
    }

    // On success, compose robust reset link
    const token = payload.resetToken;

    // --- Robust base URL resolution (env → proxy headers → localhost) ---
    const protoHeader = (req.headers['x-forwarded-proto'] || '').toString();
    const proto = protoHeader.split(',')[0] || 'http';
    const host =
      req.headers['x-forwarded-host'] ||
      req.headers.host;

    const base =
      process.env.NEXT_PUBLIC_SITE_URL ||     // preferred
      process.env.NEXT_PUBLIC_BASE_URL ||     // your existing env
      process.env.SITE_URL ||                 // optional alternative
      (host ? `${proto}://${host}` : `http://localhost:${process.env.PORT || 3003}`);

    const siteBase = base.replace(/\/$/, '');
    const resetLink = `${siteBase}/reset-password?token=${encodeURIComponent(token)}`;
    // --------------------------------------------------------------------

    await sendEmail({
      to: email,
      subject: 'Reset Your Password',
      html: renderResetRequest({ resetLink }),
    });

    // Return the original payload to the client
    return res.status(200).json(payload);
  } catch (error) {
    console.error('Error in reset-password-request handler:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
