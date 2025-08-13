// pages/api/votes/[...params].js
// FIXED: Complete refactor to eliminate race conditions and ensure consistency

import { prisma } from '@/lib/prisma';
import { isAuthenticated, getUserFromToken } from '@/lib/auth-utils';

export default async function handler(req, res) {
  const { params } = req.query;
  
  // Extract contentType and contentId from params array
  if (!params || params.length !== 2) {
    return res.status(400).json({ 
      error: 'Invalid route. Expected format: /api/votes/[contentType]/[contentId]' 
    });
  }

  const [contentType, contentId] = params;
  const validContentTypes = ['blog', 'book', 'product'];
  
  if (!validContentTypes.includes(contentType)) {
    return res.status(400).json({ 
      error: `Invalid content type. Must be one of: ${validContentTypes.join(', ')}` 
    });
  }

  const contentIdNum = parseInt(contentId);
  if (isNaN(contentIdNum)) {
    return res.status(400).json({ error: 'Content ID must be a number' });
  }

  // All vote operations require authentication
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = await getUserFromToken(req);
  if (!user) {
    return res.status(401).json({ error: 'Invalid authentication token' });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleGetVote(req, res, user.id, contentType, contentIdNum);
      case 'POST':
        return await handleCreateVote(req, res, user.id, contentType, contentIdNum);
      case 'DELETE':
        return await handleDeleteVote(req, res, user.id, contentType, contentIdNum);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Vote API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/votes/[contentType]/[contentId] - Get user's vote and aggregates
async function handleGetVote(req, res, userId, contentType, contentId) {
  // Single transaction to ensure consistency
  const result = await prisma.$transaction(async (tx) => {
    // Check if content exists
    const contentExists = await checkContentExists(tx, contentType, contentId);
    if (!contentExists) {
      throw new Error('Content not found');
    }

    // Get user's current vote
    const userVote = await tx.vote.findUnique({
      where: {
        userId_contentType_contentId: {
          userId,
          contentType,
          contentId
        }
      }
    });

    // Get vote aggregates with a single query
    const aggregates = await calculateVoteAggregates(tx, contentType, contentId);

    return {
      userVote: userVote?.voteType || null,
      ...aggregates
    };
  });

  return res.status(200).json(result);
}

// POST /api/votes/[contentType]/[contentId] - Create or update vote
async function handleCreateVote(req, res, userId, contentType, contentId) {
  const { voteType } = req.body;
  
  if (!voteType || !['up', 'down'].includes(voteType)) {
    return res.status(400).json({ error: 'voteType must be "up" or "down"' });
  }

  // Single atomic transaction for all operations
  const result = await prisma.$transaction(async (tx) => {
    // Check if content exists
    const contentExists = await checkContentExists(tx, contentType, contentId);
    if (!contentExists) {
      throw new Error('Content not found');
    }

    // Upsert the vote (create or update)
    const vote = await tx.vote.upsert({
      where: {
        userId_contentType_contentId: {
          userId,
          contentType,
          contentId
        }
      },
      update: {
        voteType,
        updatedAt: new Date()
      },
      create: {
        userId,
        contentType,
        contentId,
        voteType
      }
    });

    // Calculate and update aggregates in single operation
    const aggregates = await calculateAndUpdateAggregates(tx, contentType, contentId);

    return {
      userVote: vote.voteType,
      ...aggregates
    };
  });

  // Trigger revalidation for home page (non-blocking)
  triggerRevalidation(contentType, contentId).catch(err => {
    console.warn('Revalidation failed (non-critical):', err);
  });

  return res.status(200).json(result);
}

// DELETE /api/votes/[contentType]/[contentId] - Remove user's vote
async function handleDeleteVote(req, res, userId, contentType, contentId) {
  // Single atomic transaction for all operations
  const result = await prisma.$transaction(async (tx) => {
    // Check if content exists
    const contentExists = await checkContentExists(tx, contentType, contentId);
    if (!contentExists) {
      throw new Error('Content not found');
    }

    // Delete the vote
    await tx.vote.deleteMany({
      where: {
        userId,
        contentType,
        contentId
      }
    });

    // Calculate and update aggregates in single operation
    const aggregates = await calculateAndUpdateAggregates(tx, contentType, contentId);

    return {
      userVote: null,
      ...aggregates
    };
  });

  // Trigger revalidation for home page (non-blocking)
  triggerRevalidation(contentType, contentId).catch(err => {
    console.warn('Revalidation failed (non-critical):', err);
  });

  return res.status(200).json(result);
}

// FIXED: Helper function to check if content exists within transaction
async function checkContentExists(tx, contentType, contentId) {
  const modelMap = {
    blog: 'blog',
    book: 'book',
    product: 'product'
  };

  const model = modelMap[contentType];
  const content = await tx[model].findUnique({
    where: { id: contentId },
    select: { id: true }
  });

  return !!content;
}

// FIXED: Calculate vote aggregates within transaction
async function calculateVoteAggregates(tx, contentType, contentId) {
  const votes = await tx.vote.groupBy({
    by: ['voteType'],
    where: {
      contentType,
      contentId
    },
    _count: {
      voteType: true
    }
  });

  let upvotes = 0;
  let downvotes = 0;

  votes.forEach(vote => {
    if (vote.voteType === 'up') {
      upvotes = vote._count.voteType;
    } else if (vote.voteType === 'down') {
      downvotes = vote._count.voteType;
    }
  });

  return {
    upvotes,
    downvotes,
    netScore: upvotes - downvotes,
    totalVotes: upvotes + downvotes
  };
}

// FIXED: Calculate and update aggregates in single operation within transaction
async function calculateAndUpdateAggregates(tx, contentType, contentId) {
  const aggregates = await calculateVoteAggregates(tx, contentType, contentId);
  
  const modelMap = {
    blog: 'blog',
    book: 'book',
    product: 'product'
  };

  const model = modelMap[contentType];
  
  // Update content table with new aggregates
  await tx[model].update({
    where: { id: contentId },
    data: {
      netScore: aggregates.netScore,
      totalVotes: aggregates.totalVotes
    }
  });

  return aggregates;
}

// NEW: Trigger on-demand revalidation (non-blocking)
async function triggerRevalidation(contentType, contentId) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const revalidationToken = process.env.REVALIDATION_TOKEN || 'dev-token';

    const response = await fetch(`${baseUrl}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${revalidationToken}`
      },
      body: JSON.stringify({
        paths: ['/', `/blog/index`, `/books/index`, `/products/index`]
      })
    });

    if (!response.ok) {
      throw new Error(`Revalidation failed: ${response.status}`);
    }

    console.log(`✅ Revalidation triggered for ${contentType}/${contentId}`);
  } catch (error) {
    console.warn('Revalidation failed (non-critical):', error.message);
    // Don't fail the vote operation if revalidation fails
  }
}
