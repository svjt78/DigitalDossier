// pages/api/s3/object-urls.js

import { S3ObjectUrlService } from '@/lib/s3-object-service';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const objectUrls = await S3ObjectUrlService.getInteractiveDocumentUrls();
    
    return res.status(200).json({
      urls: objectUrls,
      count: objectUrls.length,
    });
  } catch (error) {
    console.error('Error in S3 object URLs API:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch interactive document URLs',
      details: error.message 
    });
  }
}