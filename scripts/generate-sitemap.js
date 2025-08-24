// scripts/generate-sitemap.js
const fs = require('fs');
const path = require('path');

console.log('🔧 Starting sitemap generation...');
console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV}`);

// Try to load production environment if available (for local testing)
// In production (Vercel), environment variables come from dashboard
if (fs.existsSync('.env.production') && process.env.NODE_ENV !== 'production') {
  console.log('📁 Loading .env.production for local testing...');
  require('dotenv').config({ path: '.env.production' });
} else if (process.env.NODE_ENV === 'production') {
  console.log('☁️ Using Vercel environment variables...');
} else {
  console.log('⚠️ No .env.production found - using environment variables only');
}

console.log(`🔗 DATABASE_URL available: ${!!process.env.DATABASE_URL}`);
if (process.env.DATABASE_URL) {
  console.log(`🔗 DATABASE_URL: ${process.env.DATABASE_URL.substring(0, 50)}...`);
}

const { PrismaClient } = require('@prisma/client');

async function generateSitemap() {
  const BASE_URL = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://digitaldossier.us';
  console.log(`🎯 BASE_URL: ${BASE_URL}`);

  // Static routes that always exist
  const staticPaths = [
    '',
    '/blog',
    '/books',
    '/products',
  ].map(p => `${BASE_URL}${p}`);

  let dynamicUrls = [];

  // Try to fetch dynamic content if database is available
  if (process.env.DATABASE_URL) {
    try {
      console.log('🔍 Attempting database connection...');
      
      // Create Prisma client
      const prisma = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL
          }
        }
      });

      await prisma.$connect();
      console.log('✅ Database connection successful');

      console.log('📡 Fetching dynamic content slugs...');
      
      // Fetch dynamic slugs with individual error handling
      const results = await Promise.allSettled([
        prisma.blog.findMany({ 
          select: { slug: true },
          where: { slug: { not: null } }
        }),
        prisma.book.findMany({ 
          select: { slug: true },
          where: { slug: { not: null } }
        }),
        prisma.product.findMany({ 
          select: { slug: true },
          where: { slug: { not: null } }
        }),
      ]);

      const [blogsResult, booksResult, productsResult] = results;
      
      const blogs = blogsResult.status === 'fulfilled' ? blogsResult.value : [];
      const books = booksResult.status === 'fulfilled' ? booksResult.value : [];
      const products = productsResult.status === 'fulfilled' ? productsResult.value : [];

      if (blogsResult.status === 'rejected') {
        console.warn('⚠️ Failed to fetch blogs:', blogsResult.reason.message);
      }
      if (booksResult.status === 'rejected') {
        console.warn('⚠️ Failed to fetch books:', booksResult.reason.message);
      }
      if (productsResult.status === 'rejected') {
        console.warn('⚠️ Failed to fetch products:', productsResult.reason.message);
      }

      console.log(`📊 Found: ${blogs.length} blogs, ${books.length} books, ${products.length} products`);

      const blogUrls = blogs.map(({ slug }) => `${BASE_URL}/blog/${slug}`);
      const bookUrls = books.map(({ slug }) => `${BASE_URL}/books/${slug}`);
      const productUrls = products.map(({ slug }) => `${BASE_URL}/products/${slug}`);

      dynamicUrls = [...blogUrls, ...bookUrls, ...productUrls];

      await prisma.$disconnect();
      console.log('🔌 Database connection closed');

    } catch (error) {
      console.warn('⚠️ Database connection failed:', error.message);
      console.log('📄 Generating sitemap with static pages only...');
    }
  } else {
    console.log('📄 No DATABASE_URL found - generating static sitemap only...');
  }

  const allUrls = [...staticPaths, ...dynamicUrls];
  console.log(`🔗 Total URLs in sitemap: ${allUrls.length} (${staticPaths.length} static + ${dynamicUrls.length} dynamic)`);

  // Build XML sitemap
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
    console.log('📁 Created public directory');
  }

  // Write sitemap to public directory
  const outPath = path.join(publicDir, 'sitemap.xml');
  fs.writeFileSync(outPath, sitemap, 'utf8');
  
  console.log(`✅ Sitemap generated successfully at ${outPath}`);
  console.log(`📄 Contains ${allUrls.length} URLs total`);
  
  return true;
}

// Execute with comprehensive error handling
generateSitemap()
  .then(() => {
    console.log('🎉 Sitemap generation completed successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Sitemap generation failed:', err.message);
    
    // Create minimal fallback sitemap
    console.log('🔄 Creating emergency fallback sitemap...');
    
    try {
      const BASE_URL = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://digitaldossier.us';
      const staticPaths = ['', '/blog', '/books', '/products'].map(p => `${BASE_URL}${p}`);
      
      const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
      const xmlBody = staticPaths.map(url => `  <url>\n    <loc>${url}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.7</priority>\n  </url>\n`).join('');
      const xmlFooter = `</urlset>`;
      
      const publicDir = path.join(process.cwd(), 'public');
      if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
      
      fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xmlHeader + xmlBody + xmlFooter, 'utf8');
      console.log(`✅ Emergency sitemap created with ${staticPaths.length} static URLs`);
      
      // Don't fail the build - sitemap is not critical
      process.exit(0);
    } catch (fallbackError) {
      console.error('❌ Even fallback sitemap failed:', fallbackError.message);
      console.log('⚠️ Continuing deployment without sitemap...');
      process.exit(0); // Don't fail the build
    }
  });
