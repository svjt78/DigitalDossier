// pages/api/comments/[...params].js
// Dynamic route handler for: /api/comments/[contentType]/[contentId]

import { prisma } from '@/lib/prisma';
import { isAuthenticated, getUserFromToken } from '@/lib/auth-utils';

export default async function handler(req, res) {
  const { params } = req.query;
  
  // Extract contentType and contentId from params array
  if (!params || params.length !== 2) {
    return res.status(400).json({ 
      error: 'Invalid route. Expected format: /api/comments/[contentType]/[contentId]' 
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

  try {
    switch (req.method) {
      case 'GET':
        return await handleGetComments(req, res, contentType, contentIdNum);
      case 'POST':
        return await handleCreateComment(req, res, contentType, contentIdNum);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Comments API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/comments/[contentType]/[contentId] - Get comments with threading
async function handleGetComments(req, res, contentType, contentId) {
  // Check if content exists
  const contentExists = await checkContentExists(contentType, contentId);
  if (!contentExists) {
    return res.status(404).json({ error: 'Content not found' });
  }

  // Get all comments for this content
  const comments = await prisma.comment.findMany({
    where: {
      content_type: contentType,
      content_id: contentId,
      is_deleted: false
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      created_at: 'asc' // Chronological order for proper threading
    }
  });

  // Transform comments to camelCase and convert to threaded structure
  const transformedComments = comments.map(comment => ({
    id: comment.id,
    content: comment.content,
    author_id: comment.author_id,
    content_type: comment.content_type,
    content_id: comment.content_id,
    parent_id: comment.parent_id,
    is_edited: comment.is_edited,
    is_deleted: comment.is_deleted,
    created_at: comment.created_at,
    updated_at: comment.updated_at,
    user: comment.user
  }));
  
  const threadedComments = buildCommentTree(transformedComments);
  
  // Get total count
  const totalCount = await prisma.comment.count({
    where: {
      content_type: contentType,
      content_id: contentId,
      is_deleted: false
    }
  });

  return res.status(200).json({
    comments: threadedComments,
    totalCount
  });
}

// POST /api/comments/[contentType]/[contentId] - Create new comment
async function handleCreateComment(req, res, contentType, contentId) {
  // Authentication required for all comments
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = await getUserFromToken(req);  // FIXED: Added await
  if (!user) {
    return res.status(401).json({ error: 'Invalid authentication token' });
  }

  const { content, parentId } = req.body;
  
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: 'Comment content is required' });
  }

  if (content.trim().length > 2000) {
    return res.status(400).json({ error: 'Comment too long (max 2000 characters)' });
  }

  // Check if content exists
  const contentExists = await checkContentExists(contentType, contentId);
  if (!contentExists) {
    return res.status(404).json({ error: 'Content not found' });
  }

  // If parentId provided, check if parent comment exists and belongs to same content
  if (parentId) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: parseInt(parentId) },
      select: { id: true, content_type: true, content_id: true, is_deleted: true }
    });

    if (!parentComment || parentComment.is_deleted) {
      return res.status(404).json({ error: 'Parent comment not found' });
    }

    if (parentComment.content_type !== contentType || parentComment.content_id !== contentId) {
      return res.status(400).json({ error: 'Parent comment does not belong to this content' });
    }
  }

  // Use transaction to ensure consistency
  const result = await prisma.$transaction(async (tx) => {
    // Create the comment
    const comment = await tx.comment.create({
      data: {
        content: content.trim(),
        author_id: user.id,          // Now this is a proper integer
        content_type: contentType,
        content_id: contentId,
        parent_id: parentId ? parseInt(parentId) : null,
        updated_at: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Update comment count in content table
    await updateContentCommentCount(tx, contentType, contentId);

    // Transform the response to match frontend expectations
    return {
      id: comment.id,
      content: comment.content,
      author_id: comment.author_id,
      content_type: comment.content_type,
      content_id: comment.content_id,
      parent_id: comment.parent_id,
      is_edited: comment.is_edited,
      is_deleted: comment.is_deleted,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      user: comment.user
    };
  });

  // Trigger revalidation for home page (non-blocking)
  triggerRevalidation(contentType, contentId).catch(err => {
    console.warn('Revalidation failed (non-critical):', err);
  });

  return res.status(201).json(result);
}

// Helper function to check if content exists
async function checkContentExists(contentType, contentId) {
  const modelMap = {
    blog: 'blog',
    book: 'book',
    product: 'product'
  };

  const model = modelMap[contentType];
  const content = await prisma[model].findUnique({
    where: { id: contentId },
    select: { id: true }
  });

  return !!content;
}

// Helper function to build comment tree from flat array
function buildCommentTree(comments) {
  const commentMap = new Map();
  const rootComments = [];

  // First pass: create a map of all comments
  comments.forEach(comment => {
    commentMap.set(comment.id, {
      ...comment,
      replies: []
    });
  });

  // Second pass: build the tree structure
  comments.forEach(comment => {
    if (comment.parent_id) {
      // This is a reply
      const parent = commentMap.get(comment.parent_id);
      if (parent) {
        parent.replies.push(commentMap.get(comment.id));
      }
    } else {
      // This is a root comment
      rootComments.push(commentMap.get(comment.id));
    }
  });

  return rootComments;
}

// Helper function to update content comment count
async function updateContentCommentCount(tx, contentType, contentId) {
  const count = await tx.comment.count({
    where: {
      content_type: contentType,
      content_id: contentId,
      is_deleted: false
    }
  });

  const modelMap = {
    blog: 'blog',
    book: 'book',
    product: 'product'
  };

  const model = modelMap[contentType];
  
  await tx[model].update({
    where: { id: contentId },
    data: {
      comment_count: count
    }
  });
}

// Trigger on-demand revalidation (non-blocking)
async function triggerRevalidation(contentType, contentId) {
  try {
    // Fix production URL handling - add protocol to VERCEL_URL
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3003';
    }
    const revalidationToken = process.env.REVALIDATION_TOKEN || 'dev-token-secure-123';

    const response = await fetch(`${baseUrl}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${revalidationToken}`
      },
      body: JSON.stringify({
        paths: ['/', '/blog', '/books', '/products']
      })
    });

    if (!response.ok) {
      throw new Error(`Revalidation failed: ${response.status}`);
    }

    console.log(`✅ Revalidation triggered for ${contentType}/${contentId}`);
  } catch (error) {
    console.warn('Revalidation failed (non-critical):', error.message);
    // Don't fail the comment operation if revalidation fails
  }
}
