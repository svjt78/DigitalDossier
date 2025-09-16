import { authenticateApiRequest } from '@/lib/api-auth';
import { createContentItem, validateContentData } from '@/lib/upload-service';

// Disable Next.js body parser to handle large payloads (DALL-E images ~1-2MB)
export const config = { api: { bodyParser: false } };

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
    // Manually parse JSON body since bodyParser is disabled for large payloads
    let contentData;
    if (req.body) {
      // bodyParser was enabled (shouldn't happen with our config)
      contentData = req.body;
    } else {
      // Manually parse raw body
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const rawBody = Buffer.concat(chunks).toString('utf8');
      try {
        contentData = JSON.parse(rawBody);
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_JSON',
            message: 'Invalid JSON in request body',
            details: { field: 'body' }
          }
        });
      }
    }
    
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