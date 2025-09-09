import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from './prisma';
import slugify from 'slugify';
import crypto from 'crypto';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET;
const IMAGES_PREFIX = process.env.S3_CONTENT_IMAGES_PREFIX || 'content-images';
const PDF_PREFIX = process.env.S3_CONTENT_PDFS_PREFIX || 'content-pdfs';

export async function uploadFileToS3(fileData, prefix, filename) {
  const uniqueFilename = `${crypto.randomUUID()}_${filename}`;
  const key = `${prefix}/${uniqueFilename}`;

  let buffer;
  if (typeof fileData === 'string') {
    buffer = Buffer.from(fileData, 'base64');
  } else {
    buffer = fileData;
  }

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: getMimeType(filename),
    })
  );

  const url = `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${encodeURI(key)}`;
  return { key, url };
}

export async function generateUniqueSlug(title, model) {
  const baseSlug = slugify(title, { lower: true, strict: true });
  let uniqueSlug = baseSlug;
  let counter = 1;
  
  while (await model.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${baseSlug}-${counter++}`;
  }
  
  return uniqueSlug;
}

export async function createContentItem(contentData) {
  const { title, author, category, genreId, summary, content, coverImage, pdfFile } = contentData;

  const modelMap = {
    Blog: prisma.blog,
    Book: prisma.book,
    Product: prisma.product,
  };
  
  const model = modelMap[category];
  if (!model) {
    throw new Error(`Invalid category: ${category}`);
  }

  if (!await prisma.genre.findUnique({ where: { id: genreId } })) {
    throw new Error(`Genre ID ${genreId} does not exist`);
  }

  let coverKey, coverUrl, pdfKey, pdfUrl;

  if (coverImage) {
    const result = await uploadFileToS3(
      coverImage.data, 
      IMAGES_PREFIX, 
      coverImage.filename
    );
    coverKey = result.key;
    coverUrl = result.url;
  }

  if (pdfFile) {
    const result = await uploadFileToS3(
      pdfFile.data, 
      PDF_PREFIX, 
      pdfFile.filename
    );
    pdfKey = result.key;
    pdfUrl = result.url;
  }

  const uniqueSlug = await generateUniqueSlug(title, model);
  const finalSummary = summary || content?.substring(0, 200) || '';

  const commonData = {
    title,
    slug: uniqueSlug,
    author: author || '',
    summary: finalSummary,
    content: content || '',
    coverKey,
    pdfKey,
    genre: { connect: { id: genreId } },
  };

  const newEntry = await model.create({ 
    data: commonData,
    include: { genre: true }
  });

  return {
    id: newEntry.id,
    title: newEntry.title,
    slug: newEntry.slug,
    author: newEntry.author,
    category,
    genreId: newEntry.genreId,
    genre: newEntry.genre?.name,
    summary: newEntry.summary,
    content: newEntry.content,
    coverKey: newEntry.coverKey,
    pdfKey: newEntry.pdfKey,
    coverUrl,
    pdfUrl,
    createdAt: newEntry.createdAt,
    updatedAt: newEntry.updatedAt,
  };
}

export function validateContentData(data) {
  const errors = {};

  if (!data.title?.trim()) {
    errors.title = 'Title is required';
  }

  if (!data.category || !['Blog', 'Book', 'Product'].includes(data.category)) {
    errors.category = 'Category must be Blog, Book, or Product';
  }

  if (!data.genreId || !Number.isInteger(data.genreId)) {
    errors.genreId = 'Valid genre ID is required';
  }

  if (!data.coverImage || !data.coverImage.data) {
    errors.coverImage = 'Cover image is required';
  }

  if (data.coverImage && !['image/jpeg', 'image/png'].includes(data.coverImage.mimeType)) {
    errors.coverImage = 'Cover image must be JPEG or PNG';
  }

  if (data.pdfFile && data.pdfFile.mimeType !== 'application/pdf') {
    errors.pdfFile = 'PDF file must be application/pdf type';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

function getMimeType(filename) {
  const ext = filename.toLowerCase().split('.').pop();
  const mimeTypes = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    pdf: 'application/pdf',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}