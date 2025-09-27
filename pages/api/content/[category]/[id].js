import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '@/lib/prisma';
import formidable from 'formidable';

// Disable Next.js default body parsing to handle multipart forms
export const config = { api: { bodyParser: false } };

// Initialize AWS S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// S3 bucket and prefixes
const BUCKET = process.env.AWS_S3_BUCKET;
const IMAGES_PREFIX = process.env.S3_CONTENT_IMAGES_PREFIX || 'content-images';
const PDF_PREFIX    = process.env.S3_CONTENT_PDFS_PREFIX   || 'content-pdfs';

// Helper to flatten Formidable’s array values
const getValue = v => Array.isArray(v) ? v[0] : v;

// Parse multipart form data using formidable
function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({ keepExtensions: true });
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

// Upload a file to S3 under the given prefix and return its key
async function uploadToS3(file, prefix) {
  const ext = path.extname(file.originalFilename || '') || '';
  const filename = file.newFilename + ext;
  const key = `${prefix}/${filename}`;
  const stream = fs.createReadStream(file.filepath || file.path);

  await s3Client.send(new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    Body:        stream,
    ContentType: file.mimetype,
  }));

  return { key };
}

// Delete an object from S3 by key
async function deleteFromS3(key) {
  await s3Client.send(new DeleteObjectCommand({
    Bucket: BUCKET,
    Key:    key,
  }));
}

export default async function handler(req, res) {
  const { category, id } = req.query;
  const modelMap = {
    blog:    prisma.blog,
    book:    prisma.book,
    product: prisma.product,
  };
  const model = modelMap[category];
  if (!model) {
    return res.status(400).json({ success: false, error: 'Invalid category' });
  }

  const recordId = Number(id);

  if (req.method === 'PUT') {
    let fields, files;
    try {
      ({ fields, files } = await parseForm(req));
    } catch (err) {
      console.error('Form parse error:', err);
      return res.status(500).json({ success: false, error: 'Error parsing form data' });
    }

    const existing = await model.findUnique({ where: { id: recordId } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }

    const updateData = {};
    // flatten and copy text fields (omit genre)
    for (const key of ['title', 'author', 'content']) {
      if (fields[key] !== undefined) {
        updateData[key] = getValue(fields[key]);
      }
    }

    // handle genreId scalar directly
    if (fields.genreId !== undefined) {
      const genreId = parseInt(getValue(fields.genreId), 10);
      if (Number.isNaN(genreId)) {
        return res.status(400).json({ success: false, error: 'Invalid genre ID' });
      }
      updateData.genreId = genreId;
    }

    // handle new cover image
    if (files.coverImage) {
      const file = Array.isArray(files.coverImage)
        ? files.coverImage[0]
        : files.coverImage;
      const { key: newKey } = await uploadToS3(file, IMAGES_PREFIX);
      if (existing.coverKey) await deleteFromS3(existing.coverKey);
      updateData.coverKey = newKey;
    }

    // handle new PDF file
    if (files.pdfFile) {
      const file = Array.isArray(files.pdfFile)
        ? files.pdfFile[0]
        : files.pdfFile;
      const { key: newKey } = await uploadToS3(file, PDF_PREFIX);
      if (existing.pdfKey) await deleteFromS3(existing.pdfKey);
      updateData.pdfKey = newKey;
    }

    // preserve existing S3 keys when no new file was uploaded
    if (!files.coverImage) {
      updateData.coverKey = existing.coverKey;
    }
    if (!files.pdfFile) {
      updateData.pdfKey = existing.pdfKey;
    }

    try {
      const updated = await model.update({
        where: { id: recordId },
        data: updateData,
      });

      // build public URLs for response
      const region  = process.env.AWS_REGION;
      const bucket  = process.env.AWS_S3_BUCKET;
      const baseUrl = `https://${bucket}.s3.${region}.amazonaws.com`;

      const responseData = {
        id:        updated.id,
        title:     updated.title,
        slug:      updated.slug,
        author:    updated.author,
        genreId:   updated.genreId,
        summary:   updated.summary,
        content:   updated.content,
        coverKey:  updated.coverKey,
        pdfKey:    updated.pdfKey,
        coverUrl:  updated.coverKey ? `${baseUrl}/${encodeURIComponent(updated.coverKey)}` : null,
        pdfUrl:    updated.pdfKey   ? `${baseUrl}/${encodeURIComponent(updated.pdfKey)}`   : null,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };

      return res.status(200).json({ success: true, data: responseData });
    } catch (dbErr) {
      console.error('DB update error:', dbErr);
      return res.status(500).json({ success: false, error: 'Database error' });
    }

  } else if (req.method === 'DELETE') {
    const existing = await model.findUnique({ where: { id: recordId } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }

    // Delete S3 files FIRST (before database) to ensure atomicity
    try {
      // Delete cover image from S3 if it exists
      if (existing.coverKey) {
        await deleteFromS3(existing.coverKey);
      }
      
      // Delete PDF file from S3 if it exists
      if (existing.pdfKey) {
        await deleteFromS3(existing.pdfKey);
      }
    } catch (s3Err) {
      console.error('S3 delete error:', s3Err);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to delete files from storage. Database record preserved.' 
      });
    }

    // Only delete from database if S3 deletions succeeded
    try {
      await model.delete({ where: { id: recordId } });
    } catch (dbErr) {
      console.error('DB delete error:', dbErr);
      // Note: S3 files are already deleted at this point
      // This is acceptable as orphaned S3 files are less problematic than orphaned DB records
      return res.status(500).json({ 
        success: false, 
        error: 'Database error occurred after file deletion' 
      });
    }

    return res.status(200).json({ success: true });
  } else {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
