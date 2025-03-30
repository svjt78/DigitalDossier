// pages/api/upload.js
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const formidable = require('formidable');
    const form = new formidable.IncomingForm();
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    form.uploadDir = uploadDir;
    form.keepExtensions = true;

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Error parsing form data:', err);
        return res.status(500).json({ error: 'Error parsing form data' });
      }

      // Debug logs:
      console.log('Fields:', fields);
      console.log('Files:', files);

      // Convert fields that are arrays to strings
      const title = Array.isArray(fields.title) ? fields.title[0] : fields.title;
      const author = Array.isArray(fields.author) ? fields.author[0] : fields.author;
      const category = Array.isArray(fields.category) ? fields.category[0] : fields.category;
      const genre = Array.isArray(fields.genre) ? fields.genre[0] : fields.genre;
      const content = Array.isArray(fields.content) ? fields.content[0] : fields.content;

      let coverImageUrl = null;
      let pdfUrl = null;

      try {
        // Process coverImage file (if exists)
        if (files.coverImage) {
          const coverFile = Array.isArray(files.coverImage)
            ? files.coverImage[0]
            : files.coverImage;
          const filePath = coverFile.filepath || coverFile.path;
          // Append original extension
          const ext = path.extname(coverFile.originalFilename) || '';
          const fileName = coverFile.newFilename + ext;
          // Rename the file to include extension
          fs.renameSync(filePath, path.join(uploadDir, fileName));
          coverImageUrl = `/uploads/${fileName}`;
        }

        // Process pdfFile (if exists)
        if (files.pdfFile) {
          const pdfFileObj = Array.isArray(files.pdfFile)
            ? files.pdfFile[0]
            : files.pdfFile;
          const filePath = pdfFileObj.filepath || pdfFileObj.path;
          // Append original extension
          const ext = path.extname(pdfFileObj.originalFilename) || '';
          const fileName = pdfFileObj.newFilename + ext;
          fs.renameSync(filePath, path.join(uploadDir, fileName));
          pdfUrl = `/uploads/${fileName}`;
        }

        const timestamp = new Date();
        let newEntry;

        if (category === 'Blog') {
          newEntry = await prisma.blog.create({
            data: {
              title,
              slug: title.toLowerCase().replace(/\s+/g, '-'),
              author,
              genre,
              summary: '',
              content: pdfUrl ? '' : content,
              cover: coverImageUrl,
              pdfUrl,
              createdAt: timestamp,
            },
          });
        } else if (category === 'Book') {
          newEntry = await prisma.book.create({
            data: {
              title,
              slug: title.toLowerCase().replace(/\s+/g, '-'),
              author,
              genre,
              summary: '',
              content: pdfUrl ? '' : content,
              cover: coverImageUrl,
              pdfUrl,
              createdAt: timestamp,
            },
          });
        } else if (category === 'Product') {
          newEntry = await prisma.product.create({
            data: {
              title,
              slug: title.toLowerCase().replace(/\s+/g, '-'),
              author,
              genre,
              summary: '',
              content: pdfUrl ? '' : content,
              cover: coverImageUrl,
              pdfUrl,
              createdAt: timestamp,
            },
          });
        } else {
          return res.status(400).json({ error: 'Invalid category' });
        }

        return res.status(200).json({ success: true, data: newEntry });
      } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Database error' });
      }
    });
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}
