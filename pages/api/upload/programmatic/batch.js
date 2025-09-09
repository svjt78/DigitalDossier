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
    const { documents } = req.body;

    if (!Array.isArray(documents)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Documents must be an array',
          details: { field: 'documents' }
        }
      });
    }

    if (documents.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'At least one document is required',
          details: { field: 'documents' }
        }
      });
    }

    if (documents.length > 20) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Maximum 20 documents per batch',
          details: { field: 'documents', maxLength: 20 }
        }
      });
    }

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < documents.length; i++) {
      const document = documents[i];
      
      try {
        const validation = validateContentData(document);
        if (!validation.isValid) {
          results.push({
            index: i,
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Document validation failed',
              details: validation.errors
            }
          });
          failCount++;
          continue;
        }

        const result = await createContentItem(document);
        results.push({
          index: i,
          success: true,
          data: result
        });
        successCount++;

      } catch (error) {
        console.error(`Batch upload error for document ${i}:`, error);
        
        let errorResponse = {
          index: i,
          success: false,
          error: {
            code: 'UPLOAD_ERROR',
            message: 'Document upload failed'
          }
        };

        if (error.message.includes('Genre ID')) {
          errorResponse.error = {
            code: 'VALIDATION_ERROR',
            message: error.message,
            details: { field: 'genreId' }
          };
        } else if (error.message.includes('Invalid category')) {
          errorResponse.error = {
            code: 'VALIDATION_ERROR',
            message: error.message,
            details: { field: 'category' }
          };
        }

        results.push(errorResponse);
        failCount++;
      }
    }

    const httpStatus = failCount === 0 ? 201 : (successCount === 0 ? 400 : 207);

    return res.status(httpStatus).json({
      success: failCount === 0,
      results,
      summary: {
        total: documents.length,
        successful: successCount,
        failed: failCount
      }
    });

  } catch (error) {
    console.error('Batch upload handler error:', error);
    return res.status(500).json({
      success: false,
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'Batch upload failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
}