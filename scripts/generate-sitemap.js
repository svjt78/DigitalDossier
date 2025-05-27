// scripts/generate-sitemap.js
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

async function generateSitemap() {
  const prisma = new PrismaClient();
  const BASE_URL = process.env.SITE_URL || 'https://yourdomain.com';

  // Static routes
  const staticPaths = [
    '',
    '/blog',
    '/books',
    '/products',
  ].map(p => `${BASE_URL}${p}`);

  // Fetch dynamic slugs
  const [blogs, books, products] = await Promise.all([
    prisma.blog.findMany({ select: { slug: true } }),
    prisma.book.findMany({ select: { slug: true } }),
    prisma.product.findMany({ select: { slug: true } }),
  ]);

  const blogUrls = blogs.map(({ slug }) => `${BASE_URL}/blog/${slug}`);
  const bookUrls = books.map(({ slug }) => `${BASE_URL}/books/${slug}`);
  const productUrls = products.map(({ slug }) => `${BASE_URL}/products/${slug}`);

  const allUrls = [
    ...staticPaths,
    ...blogUrls,
    ...bookUrls,
    ...productUrls,
  ];

  // Build XML
  const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>\n`
    + `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  const xmlBody = allUrls
    .map((url) => {
      return `  <url>
    <loc>${url}</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>\n`;
    })
    .join('');

  const xmlFooter = `</urlset>`;

  const sitemap = xmlHeader + xmlBody + xmlFooter;

  // Write to public/
  const outPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  fs.writeFileSync(outPath, sitemap, 'utf8');
  console.log(`✅ sitemap.xml generated at ${outPath}`);
  await prisma.$disconnect();
}

generateSitemap().catch((err) => {
  console.error('❌ Failed to generate sitemap:', err);
  process.exit(1);
});
