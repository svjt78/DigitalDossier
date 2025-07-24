// pages/api/subscribers/[id].js
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  const id = parseInt(req.query.id, 10);
  if (req.method === 'DELETE') {
    try {
      await prisma.subscriber.delete({ where: { id } });
      return res.status(204).end();
    } catch {
      return res.status(404).json({ error: 'Not found' });
    }
  }
  res.setHeader('Allow', ['DELETE']);
  res.status(405).end();
}
