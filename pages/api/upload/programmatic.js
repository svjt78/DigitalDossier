import { authenticateApiRequest } from '@/lib/api-auth';
import { createContentItem, validateContentData } from '@/lib/upload-service';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ 
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' }
    });
  }

  const authResult = await authenticateApiRequest(req, 'upload');
  if (!authResult.success) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: authResult.error }
    });
  }

  try {
    const contentData = req.body;
    
    const validation = validateContentData(contentData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: validation.errors
        }
      });
    }

    const result = await createContentItem(contentData);

    return res.status(201).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Programmatic upload error:', error);
    
    if (error.message.includes('Genre ID')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
          details: { field: 'genreId' }
        }
      });
    }

    if (error.message.includes('Invalid category')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR', 
          message: error.message,
          details: { field: 'category' }
        }
      });
    }

    return res.status(500).json({
      success: false,
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'Upload failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
}