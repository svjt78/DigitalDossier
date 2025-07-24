// pages/api/upload.js

import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '@/lib/prisma';
import slugify from 'slugify';

// Disable Next.js body parser so we can parse multipart/form-data
export const config = { api: { bodyParser: false } };

// Initialize AWS S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Bucket & prefixes from .env
const BUCKET = process.env.AWS_S3_BUCKET;
const IMAGES_PREFIX = process.env.S3_CONTENT_IMAGES_PREFIX || 'content-images';
const PDF_PREFIX    = process.env.S3_CONTENT_PDFS_PREFIX   || 'content-pdfs';

// Promise-based form parser using formidable
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

// Upload a single file to S3 under the given prefix and return { key, url }
async function uploadToS3(file, prefix) {
  const ext = path.extname(file.originalFilename || '') || '';
  const filename = file.newFilename + ext;
  const key = `${prefix}/${filename}`;
  const stream = fs.createReadStream(file.filepath || file.path);

  await s3Client.send(
    new PutObjectCommand({
      Bucket:      BUCKET,
      Key:         key,
      Body:        stream,
      ContentType: file.mimetype,
    })
  );

  const encodedFilename = encodeURIComponent(filename);
  const url = `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${prefix}/${encodedFilename}`;
  return { key, url };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let fields, files;
  try {
    ({ fields, files } = await parseForm(req));
  } catch (err) {
    console.error('Form parse error:', err);
    return res.status(500).json({ error: 'Error parsing form data' });
  }

  const getField = name =>
    Array.isArray(fields[name]) ? fields[name][0] : fields[name] || '';
  const title    = getField('title').trim();
  const author   = getField('author').trim();
  const category = getField('category').trim();
  const genre    = getField('genre').trim();
  const content  = getField('content');

  // Enforce required fields: Category, Title, Cover Image, PDF
  const coverFile = Array.isArray(files.coverImage)
    ? files.coverImage[0]
    : files.coverImage;
  const pdfFile = Array.isArray(files.pdfFile)
    ? files.pdfFile[0]
    : files.pdfFile;

  if (!category || !title || !coverFile || !pdfFile) {
    return res.status(400).json({
      error: 'Category, Title, Cover Image and PDF file are all required.'
    });
  }

  const modelMap = {
    Blog:    prisma.blog,
    Book:    prisma.book,
    Product: prisma.product,
  };
  const model = modelMap[category];
  if (!model) {
    return res.status(400).json({ error: 'Invalid category' });
  }

  // Upload files
  let coverKey = null, coverUrl = null;
  let pdfKey   = null, pdfUrl   = null;
  try {
    ({ key: coverKey, url: coverUrl } = await uploadToS3(coverFile, IMAGES_PREFIX));
    ({ key: pdfKey,   url: pdfUrl   } = await uploadToS3(pdfFile,   PDF_PREFIX));
  } catch (err) {
    console.error('Upload to S3 error:', err);
    return res.status(500).json({ error: 'Error saving uploaded files' });
  }

  // Unique slug generation
  const baseSlug = slugify(title, { lower: true, strict: true });
  let uniqueSlug = baseSlug, counter = 1;
  while (await model.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${baseSlug}-${counter++}`;
  }

  const summary = getField('summary') || content.substring(0, 200);

  // Prepare DB data
  const commonData = {
    title,
    slug:     uniqueSlug,
    author,
    genre,
    summary,
    content: '',
    coverKey,
    pdfKey,
  };

  try {
    const newEntry = await model.create({ data: commonData });

    // Respond with both DB fields and public URLs
    return res.status(200).json({
      success: true,
      data: {
        id:        newEntry.id,
        title:     newEntry.title,
        slug:      newEntry.slug,
        author:    newEntry.author,
        genre:     newEntry.genre,
        summary:   newEntry.summary,
        coverKey:  newEntry.coverKey,
        pdfKey:    newEntry.pdfKey,
        coverUrl,
        pdfUrl,
        createdAt: newEntry.createdAt,
        updatedAt: newEntry.updatedAt,
      }
    });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
}
