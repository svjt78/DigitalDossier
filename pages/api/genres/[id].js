// pages/api/genres/[id].js
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  const { id } = req.query;
  const genreId = parseInt(id, 10);
  if (Number.isNaN(genreId)) {
    return res.status(400).json({ error: 'Invalid genre ID' });
  }

  switch (req.method) {
    case 'DELETE': {
      try {
        await prisma.genre.delete({ where: { id: genreId } });
        return res.status(204).end();
      } catch (error) {
        console.error('Error deleting genre:', error);
        // If the genre doesn't exist
        if (error.code === 'P2025') {
          return res.status(404).json({ error: 'Genre not found' });
        }
        return res.status(500).json({ error: 'Failed to delete genre' });
      }
    }

    default:
      res.setHeader('Allow', ['DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
