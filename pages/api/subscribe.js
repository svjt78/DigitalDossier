// pages/api/subscribe.js

import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { renderSubscriptionConfirm } from '@/lib/emailTemplates';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  // Simple email validation
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  try {
    // Save to database
    await prisma.subscriber.create({ data: { email } });

    // Send MJML-styled welcome email
    await sendEmail({
      to: email,
      subject: 'Thanks for subscribing to Digital Dossier!',
      html: renderSubscriptionConfirm({ email })
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    // Handle duplicate subscription
    if (error.code === 'P2002') { // Prisma unique constraint failed
      return res.status(409).json({ error: 'Already subscribed' });
    }
    console.error('Subscription error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
