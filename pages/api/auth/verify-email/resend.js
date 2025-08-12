// File: pages/api/auth/verify-email/resend.js

import fetch from 'node-fetch';
import { sendEmail } from '@/lib/email';
import { renderSignupConfirm } from '@/lib/emailTemplates';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email } = req.body || {};

  if (typeof email !== 'string' || !email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Get credential service base URL
    const AUTH_BASE = 
      process.env.AUTH_API_BASE || 
      process.env.NEXT_PUBLIC_AUTH_API_BASE;

    if (!AUTH_BASE) {
      return res.status(500).json({ error: 'Missing AUTH_API_BASE' });
    }

    // Call credential service to resend verification token
    const upstream = await fetch(`${AUTH_BASE}/auth/verify-email/resend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
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

    // Handle different response codes from credential service
    if (upstream.status === 404) {
      // User not found
      return res.status(404).json({ error: 'Email address not found. Please sign up first.' });
    }

    if (upstream.status === 409) {
      // Already verified
      return res.status(409).json({ error: 'Your email is already verified. You can log in now.' });
    }

    if (!upstream.ok) {
      // Other errors
      return res.status(upstream.status).json(payload);
    }

    // Success - get the new verification token
    const { verificationToken } = payload || {};

    if (!verificationToken) {
      return res.status(502).json({ error: 'Failed to generate verification token' });
    }

    // Build the confirmation link
    const protoHeader = (req.headers['x-forwarded-proto'] || '').toString();
    const proto = protoHeader.split(',')[0] || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    
    const base = 
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.SITE_URL ||
      (host ? `${proto}://${host}` : `http://localhost:${process.env.PORT || 3003}`);

    const siteBase = base.replace(/\/$/, '');
    const confirmLink = `${siteBase}/confirm?token=${encodeURIComponent(verificationToken)}`;

    // Send the verification email
    try {
      await sendEmail({
        to: email,
        subject: 'Confirm your Digital Dossier account',
        html: renderSignupConfirm({ 
          username: email.split('@')[0], // Use email prefix as fallback username
          loginLink: confirmLink 
        }),
      });
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr);
      return res.status(500).json({ error: 'Failed to send verification email' });
    }

    // Return success
    return res.status(200).json({ 
      message: 'Verification email sent successfully',
      email 
    });

  } catch (err) {
    console.error('Resend verification error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}