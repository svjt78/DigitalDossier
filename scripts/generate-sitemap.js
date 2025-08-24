// scripts/generate-sitemap.js
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.production' });

console.log('🔧 Starting sitemap generation...');
console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`🔗 DATABASE_URL: ${process.env.DATABASE_URL?.substring(0, 50)}...`);

const { PrismaClient } = require('@prisma/client');

async function generateSitemap() {
  // Explicitly create Prisma client with production DATABASE_URL
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  const BASE_URL = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://digitaldossier.us';
  console.log(`🎯 BASE_URL: ${BASE_URL}`);

  try {
    console.log('🔍 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Static routes
    const staticPaths = [
      '',
      '/blog',
      '/books',
      '/products',
    ].map(p => `${BASE_URL}${p}`);

    console.log('📡 Fetching dynamic content slugs...');
    
    // Fetch dynamic slugs with error handling
    const [blogs, books, products] = await Promise.all([
      prisma.blog.findMany({ 
        select: { slug: true },
        where: { slug: { not: null } }
      }).catch(err => {
        console.warn('⚠️ Failed to fetch blogs:', err.message);
        return [];
      }),
      prisma.book.findMany({ 
        select: { slug: true },
        where: { slug: { not: null } }
      }).catch(err => {
        console.warn('⚠️ Failed to fetch books:', err.message);
        return [];
      }),
      prisma.product.findMany({ 
        select: { slug: true },
        where: { slug: { not: null } }
      }).catch(err => {
        console.warn('⚠️ Failed to fetch products:', err.message);
        return [];
      }),
    ]);

    console.log(`📊 Found: ${blogs.length} blogs, ${books.length} books, ${products.length} products`);

    const blogUrls = blogs.map(({ slug }) => `${BASE_URL}/blog/${slug}`);
    const bookUrls = books.map(({ slug }) => `${BASE_URL}/books/${slug}`);
    const productUrls = products.map(({ slug }) => `${BASE_URL}/products/${slug}`);

    const allUrls = [
      ...staticPaths,
      ...blogUrls,
      ...bookUrls,
      ...productUrls,
    ];

    console.log(`🔗 Total URLs in sitemap: ${allUrls.length}`);

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

    // Ensure public directory exists
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Write to public/
    const outPath = path.join(publicDir, 'sitemap.xml');
    fs.writeFileSync(outPath, sitemap, 'utf8');
    console.log(`✅ sitemap.xml generated at ${outPath}`);
    console.log(`📄 Sitemap contains ${allUrls.length} URLs`);

  } catch (error) {
    console.error('❌ Error during sitemap generation:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed');
  }
}

generateSitemap().catch((err) => {
  console.error('❌ Failed to generate sitemap:', err);
  
  // Create a basic sitemap with static pages only as fallback
  console.log('🔄 Creating fallback sitemap with static pages only...');
  
  const BASE_URL = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://digitaldossier.us';
  const staticPaths = [
    '',
    '/blog',
    '/books',
    '/products',
  ].map(p => `${BASE_URL}${p}`);

  const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>\n`
    + `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  const xmlBody = staticPaths
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

  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const outPath = path.join(publicDir, 'sitemap.xml');
  fs.writeFileSync(outPath, sitemap, 'utf8');
  console.log(`✅ Fallback sitemap created with ${staticPaths.length} static URLs`);
  
  // Exit with success to not block deployment
  process.exit(0);
});
