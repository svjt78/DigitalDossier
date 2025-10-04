// pages/api/genres/stats.js
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Get all genres with their usage counts across all content types
    const genres = await prisma.genre.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            blog: true,
            book: true,
            product: true
          }
        }
      }
    });

    // Add total count for each genre
    const genresWithStats = genres.map(genre => ({
      ...genre,
      _count: {
        ...genre._count,
        total: genre._count.blog + genre._count.book + genre._count.product
      }
    }));

    return res.status(200).json(genresWithStats);
  } catch (error) {
    console.error('Error fetching genre statistics:', error);
    return res.status(500).json({ error: 'Failed to fetch genre statistics' });
  }
}
