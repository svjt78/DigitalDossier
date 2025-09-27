// pages/api/users/index.js
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Fetch all users from the blog database
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Return users with additional status and map field names for frontend compatibility
    const usersWithStatus = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      isVerified: true, // You can add actual verification status if tracked
    }));

    return res.status(200).json(usersWithStatus);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
}
