// pages/api/web-view/[contentType]/[contentId].js

import { prisma } from '@/lib/prisma';
import { getUserFromToken, isAuthenticated } from '@/lib/auth-utils';
import { S3ObjectUrlService } from '@/lib/s3-object-service';

async function authenticateUser(req) {
  if (!isAuthenticated(req)) {
    throw new Error('Invalid or expired authentication token');
  }

  const user = await getUserFromToken(req);
  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

function validateContentType(contentType) {
  const validTypes = ['blog', 'book', 'product'];
  if (!validTypes.includes(contentType.toLowerCase())) {
    throw new Error(`Invalid content type: ${contentType}`);
  }
  return contentType.toLowerCase();
}

async function getContentExists(contentType, contentId) {
  const id = parseInt(contentId);
  if (isNaN(id)) {
    throw new Error('Invalid content ID');
  }

  let content;
  switch (contentType) {
    case 'blog':
      content = await prisma.blog.findUnique({ where: { id } });
      break;
    case 'book':
      content = await prisma.book.findUnique({ where: { id } });
      break;
    case 'product':
      content = await prisma.product.findUnique({ where: { id } });
      break;
  }

  if (!content) {
    throw new Error(`${contentType} not found`);
  }

  return { content, id };
}

export default async function handler(req, res) {
  const { contentType, contentId } = req.query;

  try {
    // Authenticate user
    await authenticateUser(req);

    // Validate content type and ID
    const validatedContentType = validateContentType(contentType);
    const { id } = await getContentExists(validatedContentType, contentId);

    switch (req.method) {
      case 'GET':
        return await handleGet(req, res, validatedContentType, id);
      case 'POST':
        return await handlePost(req, res, validatedContentType, id);
      case 'DELETE':
        return await handleDelete(req, res, validatedContentType, id);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Web view API error:', error);
    
    if (error.message.includes('token') || error.message.includes('authorization')) {
      return res.status(401).json({ error: error.message });
    }
    
    if (error.message.includes('not found') || error.message.includes('Invalid')) {
      return res.status(400).json({ error: error.message });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGet(req, res, contentType, contentId) {
  try {
    const id = parseInt(contentId);
    let content;
    
    switch (contentType) {
      case 'blog':
        content = await prisma.blog.findUnique({ 
          where: { id },
          select: { html_key: true }
        });
        break;
      case 'book':
        content = await prisma.book.findUnique({ 
          where: { id },
          select: { html_key: true }
        });
        break;
      case 'product':
        content = await prisma.product.findUnique({ 
          where: { id },
          select: { html_key: true }
        });
        break;
    }

    const webView = content?.html_key ? { objectUrl: content.html_key } : null;
    return res.status(200).json({ webView });
  } catch (error) {
    console.error('Error fetching web view:', error);
    return res.status(500).json({ error: 'Failed to fetch web view' });
  }
}

async function handlePost(req, res, contentType, contentId) {
  const { objectUrl } = req.body;

  if (!objectUrl || typeof objectUrl !== 'string') {
    return res.status(400).json({ error: 'objectUrl is required and must be a string' });
  }

  try {
    // Validate the URL format
    const isValidUrl = await S3ObjectUrlService.validateObjectUrl(objectUrl);
    if (!isValidUrl) {
      return res.status(400).json({ error: 'Invalid object URL format' });
    }

    const id = parseInt(contentId);
    let updatedContent;
    
    // Update the html_key field directly on the content table
    switch (contentType) {
      case 'blog':
        updatedContent = await prisma.blog.update({
          where: { id },
          data: { html_key: objectUrl },
          select: { id: true, html_key: true }
        });
        break;
      case 'book':
        updatedContent = await prisma.book.update({
          where: { id },
          data: { html_key: objectUrl },
          select: { id: true, html_key: true }
        });
        break;
      case 'product':
        updatedContent = await prisma.product.update({
          where: { id },
          data: { html_key: objectUrl },
          select: { id: true, html_key: true }
        });
        break;
    }

    const webView = { objectUrl: updatedContent.html_key };
    return res.status(200).json({ webView, message: 'Web view association saved successfully' });
  } catch (error) {
    console.error('Error saving web view:', error);
    return res.status(500).json({ error: 'Failed to save web view association' });
  }
}

async function handleDelete(req, res, contentType, contentId) {
  try {
    const id = parseInt(contentId);
    let updatedContent;
    
    // Clear the html_key field (set to null)
    switch (contentType) {
      case 'blog':
        updatedContent = await prisma.blog.update({
          where: { id },
          data: { html_key: null },
          select: { id: true, html_key: true }
        });
        break;
      case 'book':
        updatedContent = await prisma.book.update({
          where: { id },
          data: { html_key: null },
          select: { id: true, html_key: true }
        });
        break;
      case 'product':
        updatedContent = await prisma.product.update({
          where: { id },
          data: { html_key: null },
          select: { id: true, html_key: true }
        });
        break;
    }

    return res.status(200).json({ 
      message: 'Web view association deleted successfully',
      deletedWebView: { objectUrl: null }
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    console.error('Error deleting web view:', error);
    return res.status(500).json({ error: 'Failed to delete web view association' });
  }
}