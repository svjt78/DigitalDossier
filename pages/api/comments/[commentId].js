// pages/api/comments/[commentId].js
// Individual comment operations: edit, delete

import { prisma } from '@/lib/prisma';
import { isAuthenticated, getUserFromToken } from '@/lib/auth-utils';

export default async function handler(req, res) {
  const { commentId } = req.query;
  
  const commentIdNum = parseInt(commentId);
  if (isNaN(commentIdNum)) {
    return res.status(400).json({ error: 'Comment ID must be a number' });
  }

  // All operations require authentication
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
        return await handleGetComment(req, res, commentIdNum);
      case 'PUT':
        return await handleUpdateComment(req, res, commentIdNum, user);
      case 'DELETE':
        return await handleDeleteComment(req, res, commentIdNum, user);
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Comment API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/comments/[commentId] - Get individual comment
async function handleGetComment(req, res, commentId) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
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

  if (!comment || comment.is_deleted) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  return res.status(200).json(comment);
}

// PUT /api/comments/[commentId] - Update comment (author only)
async function handleUpdateComment(req, res, commentId, user) {
  const { content } = req.body;
  
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: 'Comment content is required' });
  }

  if (content.trim().length > 2000) {
    return res.status(400).json({ error: 'Comment too long (max 2000 characters)' });
  }

  // Check if comment exists and user is the author
  const existingComment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, author_id: true, is_deleted: true, content_type: true, content_id: true }
  });

  if (!existingComment || existingComment.is_deleted) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  if (existingComment.author_id !== parseInt(user.id)) {
    return res.status(403).json({ error: 'You can only edit your own comments' });
  }

  // Update the comment
  const updatedComment = await prisma.comment.update({
    where: { id: commentId },
    data: {
      content: content.trim(),
      is_edited: true,
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

  // Trigger revalidation for home page (non-blocking) 
  triggerRevalidation(existingComment.content_type, existingComment.content_id).catch(err => {
    console.warn('Revalidation failed (non-critical):', err);
  });

  return res.status(200).json(updatedComment);
}

// DELETE /api/comments/[commentId] - Soft delete comment (author only)
async function handleDeleteComment(req, res, commentId, user) {
  // Check if comment exists and user is the author
  const existingComment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { 
      id: true, 
      author_id: true, 
      is_deleted: true,
      content_type: true,
      content_id: true,
      parent_id: true
    }
  });

  if (!existingComment || existingComment.is_deleted) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  if (existingComment.author_id !== parseInt(user.id)) {
    return res.status(403).json({ error: 'You can only delete your own comments' });
  }

  // Check if comment has replies
  const hasReplies = await prisma.comment.count({
    where: {
      parent_id: commentId,
      is_deleted: false
    }
  });

  // Use transaction to ensure consistency
  await prisma.$transaction(async (tx) => {
    if (hasReplies > 0) {
      // Soft delete if has replies (preserve thread structure)
      await tx.comment.update({
        where: { id: commentId },
        data: {
          content: '[Comment deleted]',
          is_deleted: true,
          updated_at: new Date()
        }
      });
    } else {
      // Hard delete if no replies
      await tx.comment.delete({
        where: { id: commentId }
      });
    }

    // Update comment count in content table
    await updateContentCommentCount(
      tx, 
      existingComment.content_type, 
      existingComment.content_id
    );
  });

  // Trigger revalidation for home page (non-blocking)
  triggerRevalidation(existingComment.content_type, existingComment.content_id).catch(err => {
    console.warn('Revalidation failed (non-critical):', err);
  });

  return res.status(200).json({ 
    message: 'Comment deleted successfully',
    deletedCommentId: commentId
  });
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
