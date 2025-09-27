// lib/s3-object-service.js

import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export class S3ObjectUrlService {
  static async getInteractiveDocumentUrls() {
    try {
      const bucketName = 'interactive-documents';
      
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
      });

      const data = await s3Client.send(command);
      
      if (!data.Contents) {
        return [];
      }

      const objectUrls = data.Contents
        .filter(obj => obj.Key && !obj.Key.endsWith('/'))
        .map(obj => ({
          key: obj.Key,
          url: `https://interactive-documents.s3.${process.env.AWS_REGION || 'us-east-2'}.amazonaws.com/${encodeURIComponent(obj.Key)}`,
          lastModified: obj.LastModified,
          size: obj.Size,
        }))
        .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

      return objectUrls;
    } catch (error) {
      console.error('Error fetching S3 objects:', error);
      throw new Error(`Failed to fetch interactive document URLs: ${error.message}`);
    }
  }

  static async validateObjectUrl(url) {
    try {
      if (!url || typeof url !== 'string') {
        return false;
      }

      const bucketName = 'interactive-documents';
      const urlPattern = new RegExp(
        `^https://interactive-documents\\.s3\\.[a-z0-9-]+\\.amazonaws\\.com/.+`
      );

      return urlPattern.test(url);
    } catch (error) {
      console.error('Error validating object URL:', error);
      return false;
    }
  }
}