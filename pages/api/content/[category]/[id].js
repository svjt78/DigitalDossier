import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '@/lib/prisma';

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
const PDF_PREFIX = process.env.S3_CONTENT_PDFS_PREFIX || 'content-pdfs';

// Parse multipart form data using formidable
function parseForm(req) {
  const formidable = require('formidable');
  return new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

// Upload a file to S3 under the given prefix and return its key and URL
async function uploadToS3(file, prefix) {
  const ext = path.extname(file.originalFilename || '') || '';
  const filename = file.newFilename + ext;
  const key = `${prefix}/${filename}`;
  const stream = fs.createReadStream(file.filepath || file.path);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: stream,
      ContentType: file.mimetype,
      ACL: 'public-read',
    })
  );

  const encodedName = encodeURIComponent(filename);
  const url = `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${prefix}/${encodedName}`;
  return { key, url };
}

// Delete an object from S3 by key
async function deleteFromS3(key) {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}

// Main handler for PUT (update) and DELETE
export default async function handler(req, res) {
  const { category, id } = req.query;
  const modelMap = {
    blog: prisma.blog,
    book: prisma.book,
    product: prisma.product,
  };
  const model = modelMap[category];

  if (!model) {
    return res.status(400).json({ success: false, error: 'Invalid category' });
  }

  const recordId = Number(id);

  if (req.method === 'PUT') {
    // Handle update
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
    // Update text fields
    if (fields.title) updateData.title = fields.title;
    if (fields.author) updateData.author = fields.author;
    if (fields.genre) updateData.genre = fields.genre;
    if (fields.content !== undefined) updateData.content = fields.content;

    // Handle new cover image
    if (files.coverImage) {
      const file = Array.isArray(files.coverImage) ? files.coverImage[0] : files.coverImage;
      const { key: newKey, url: newUrl } = await uploadToS3(file, IMAGES_PREFIX);
      // Delete old cover from S3
      if (existing.cover) {
        const oldPath = new URL(existing.cover).pathname.replace(/^\//, '');
        await deleteFromS3(oldPath);
      }
      updateData.cover = newUrl;
    }

    // Handle new PDF file
    if (files.pdfFile) {
      const file = Array.isArray(files.pdfFile) ? files.pdfFile[0] : files.pdfFile;
      const { key: newKey, url: newUrl } = await uploadToS3(file, PDF_PREFIX);
      // Delete old PDF from S3
      if (existing.pdfUrl) {
        const oldPath = new URL(existing.pdfUrl).pathname.replace(/^\//, '');
        await deleteFromS3(oldPath);
      }
      updateData.pdfUrl = newUrl;
    }

    try {
      const updated = await model.update({ where: { id: recordId }, data: updateData });
      return res.status(200).json({ success: true, data: updated });
    } catch (dbErr) {
      console.error('DB update error:', dbErr);
      return res.status(500).json({ success: false, error: 'Database error' });
    }

  } else if (req.method === 'DELETE') {
    // Handle delete
    const existing = await model.findUnique({ where: { id: recordId } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }

    try {
      await model.delete({ where: { id: recordId } });
    } catch (dbErr) {
      console.error('DB delete error:', dbErr);
      return res.status(500).json({ success: false, error: 'Database error' });
    }

    // Delete associated S3 assets
    if (existing.cover) {
      const oldPath = new URL(existing.cover).pathname.replace(/^\//, '');
      await deleteFromS3(oldPath);
    }
    if (existing.pdfUrl) {
      const oldPath = new URL(existing.pdfUrl).pathname.replace(/^\//, '');
      await deleteFromS3(oldPath);
    }

    return res.status(200).json({ success: true });

  } else {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
