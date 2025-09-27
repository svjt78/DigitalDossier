// pages/api/subscribers/index.js
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const subs = await prisma.subscriber.findMany({
      orderBy: { created_at: 'desc' },
    });
    return res.status(200).json(subs);
  }
  res.setHeader('Allow', ['GET']);
  res.status(405).end();
}
