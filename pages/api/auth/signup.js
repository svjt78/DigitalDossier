// File: pages/api/auth/signup.js
import { prisma } from '@/lib/prisma';
import fetch from 'node-fetch';
import { sendEmail } from '@/lib/email';
import { renderSignupConfirm } from '@/lib/emailTemplates';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, username, password } = req.body || {};
  if (
    typeof email !== 'string' ||
    typeof username !== 'string' ||
    typeof password !== 'string'
  ) {
    return res.status(400).json({ error: 'Invalid request parameters' });
  }

  const AUTH_BASE = process.env.AUTH_API_BASE || process.env.NEXT_PUBLIC_AUTH_API_BASE;
  if (!AUTH_BASE) {
    return res.status(500).json({ error: 'Missing AUTH_API_BASE' });
  }

  try {
    // 1) Create the user in the credential service FIRST (returns verificationToken)
    const upstream = await fetch(`${AUTH_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password }),
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

    // === Idempotent handling: email already registered at credential ===
    if (!upstream.ok) {
      const detail = (payload && (payload.detail || payload.error || payload.message)) || '';
      const alreadyRegistered =
        upstream.status === 400 &&
        typeof detail === 'string' &&
        detail.toLowerCase().includes('email already registered');

      if (alreadyRegistered) {
        // 2a) Ensure we have a local user (idempotent upsert). Username can duplicate; it’ll sync on login.
        try {
          await prisma.user.upsert({
            where: { email },
            create: { email, name: username, updated_at: new Date() },
            update: { name: username },
          });
        } catch (dbErr) {
          // Don't fail the whole flow—still offer guidance to user.
          console.error('Local upsert (already-registered) failed:', dbErr);
        }

        // 2b) Try to re-issue a verification token from credential (if you add this endpoint).
        // If credential returns a token, we email it; otherwise we just guide the user.
        try {
          const resend = await fetch(`${AUTH_BASE}/auth/verify-email/resend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });

          if (resend.ok) {
            const resendType = resend.headers.get('content-type') || '';
            let resendPayload = {};
            if (resendType.includes('application/json')) {
              try {
                resendPayload = await resend.json();
              } catch { /* noop */ }
            }
            const { verificationToken } = resendPayload || {};
            if (verificationToken) {
              // Build robust confirm link for the re-send
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

              await sendEmail({
                to: email,
                subject: 'Confirm your Digital Dossier account',
                html: renderSignupConfirm({ username, loginLink: confirmLink }),
              });

              return res.status(200).json({
                message:
                  'This email is already registered. We’ve re-sent a confirmation email—please check your inbox.',
              });
            }
          }

          // If resend endpoint isn’t available or user is already verified:
          return res.status(409).json({
            error:
              'This email is already registered. Please log in. If you need access, use “Forgot password.”',
          });
        } catch (resendErr) {
          console.error('Resend verification attempt failed:', resendErr);
          return res.status(409).json({
            error:
              'This email is already registered. Please log in. If you need access, use “Forgot password.”',
          });
        }
      }

      // Otherwise, bubble the original error
      return res.status(upstream.status).json(payload);
    }

    // === Normal happy-path: credential signup succeeded ===
    const credentialUserId = payload.user_id ?? null;     // UUID from credential app
    const credUsername     = payload.username ?? username;
    const credEmail        = payload.email ?? email;
    const verificationToken = payload.verificationToken;

    if (!verificationToken) {
      return res.status(502).json({ error: 'Upstream did not return verificationToken' });
    }

    // 2) Create/link the blog user by EMAIL (usernames can duplicate)
    // Use upsert for idempotency if a partial record already exists.
    try {
      await prisma.user.upsert({
        where: { email: credEmail },
        create: {
          email: credEmail,
          name: credUsername,
          updated_at: new Date(),
          // credentialUserId,
        },
        update: {
          name: credUsername,
          // credentialUserId,
        },
      });
    } catch (dbErr) {
      // 3) Compensation: delete the credential user we just created if blog write failed
      if (credentialUserId) {
        try {
          await fetch(`${AUTH_BASE}/auth/users/${encodeURIComponent(credentialUserId)}`, {
            method: 'DELETE',
            headers: {
              'X-Service-Token':
                process.env.CREDENTIAL_INTERNAL_TOKEN ||
                process.env.INTERNAL_SERVICE_TOKEN ||
                '',
            },
          });
        } catch (compErr) {
          console.error('Compensation delete failed:', compErr);
        }
      }
      console.error('Blog user upsert failed:', dbErr);
      return res.status(500).json({ error: 'Signup failed; rolled back' });
    }

    // 4) Build robust confirm link (env -> proxy headers -> localhost)
    const protoHeader = (req.headers['x-forwarded-proto'] || '').toString();
    const proto = protoHeader.split(',')[0] || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host;

    const base =
      process.env.NEXT_PUBLIC_SITE_URL ||   // preferred
      process.env.NEXT_PUBLIC_BASE_URL ||   // fallback
      process.env.SITE_URL ||               // optional
      (host ? `${proto}://${host}` : `http://localhost:${process.env.PORT || 3003}`);

    const siteBase = base.replace(/\/$/, '');
    const confirmLink = `${siteBase}/confirm?token=${encodeURIComponent(verificationToken)}`;

    // 5) Send verification email from the blog app
    await sendEmail({
      to: credEmail,
      subject: 'Confirm your Digital Dossier account',
      html: renderSignupConfirm({
        username: credUsername,
        loginLink: confirmLink,
      }),
    });

    // 6) Success — instruct client to check email
    return res.status(200).json({
      message: 'Signup successful, please check your email to confirm your account.',
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
