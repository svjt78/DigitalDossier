// pages/api/genres/index.js
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  switch (req.method) {
    case 'GET': {
      try {
        const genres = await prisma.genre.findMany({ orderBy: { name: 'asc' } });
        return res.status(200).json(genres);
      } catch (error) {
        console.error('Error fetching genres:', error);
        return res.status(500).json({ error: 'Failed to fetch genres' });
      }
    }

    case 'POST': {
      const { name } = req.body;
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Genre name is required and must be a string' });
      }
      try {
        const newGenre = await prisma.genre.create({ data: { name } });
        return res.status(201).json(newGenre);
      } catch (error) {
        console.error('Error creating genre:', error);
        // Handle unique constraint violation
        if (error.code === 'P2002') {
          return res.status(409).json({ error: 'Genre already exists' });
        }
        return res.status(500).json({ error: 'Failed to create genre' });
      }
    }

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
