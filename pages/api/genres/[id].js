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
        // First check if genre exists and get usage info
        const genre = await prisma.genre.findUnique({
          where: { id: genreId },
          include: {
            _count: {
              select: {
                blogs: true,
                books: true,
                products: true
              }
            }
          }
        });

        if (!genre) {
          return res.status(404).json({ error: 'Genre not found' });
        }

        const totalUsage = genre._count.blogs + genre._count.books + genre._count.products;

        // Delete the genre (this will set genreId to null in related content due to foreign key constraints)
        await prisma.genre.delete({ where: { id: genreId } });
        
        return res.status(200).json({ 
          message: 'Genre deleted successfully',
          affectedItems: totalUsage
        });
      } catch (error) {
        console.error('Error deleting genre:', error);
        
        // Handle specific Prisma errors
        if (error.code === 'P2025') {
          return res.status(404).json({ error: 'Genre not found' });
        }
        
        // Handle foreign key constraint errors
        if (error.code === 'P2003') {
          return res.status(400).json({ 
            error: 'Cannot delete genre: it is currently being used by content items' 
          });
        }
        
        return res.status(500).json({ 
          error: 'Failed to delete genre',
          details: error.message 
        });
      }
    }

    default:
      res.setHeader('Allow', ['DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
