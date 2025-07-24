// pages/api/subscribe.js

import { prisma } from '@/lib/prisma';

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
    return res.status(200).json({ success: true });
  } catch (error) {
    // Handle duplicate subscription
    return res.status(409).json({ error: 'Already subscribed' });
  }
}
