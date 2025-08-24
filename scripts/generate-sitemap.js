// scripts/generate-sitemap.js
const fs = require('fs');
const path = require('path');

console.log('🔧 Starting safe sitemap generation...');

// Check if sitemap generation should be skipped
if (process.env.SKIP_SITEMAP_GENERATION === 'true') {
  console.log('⏭️ Sitemap generation skipped via environment variable');
  process.exit(0);
}

// Get base URL with fallback
const BASE_URL = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://digitaldossier.us';
console.log(`🎯 BASE_URL: ${BASE_URL}`);

// Static routes that always exist
const staticPaths = [
  '',
  '/blog',
  '/books',
  '/products',
].map(p => `${BASE_URL}${p}`);

// Create basic sitemap function
function createBasicSitemap(urls) {
  const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  const xmlBody = urls.map(url => 
    `  <url>\n    <loc>${url}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.7</priority>\n  </url>\n`
  ).join('');
  const xmlFooter = `</urlset>`;
  return xmlHeader + xmlBody + xmlFooter;
}

// Ensure public directory exists
function ensurePublicDir() {
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    try {
      fs.mkdirSync(publicDir, { recursive: true });
      console.log('📁 Created public directory');
    } catch (error) {
      console.warn('⚠️ Could not create public directory:', error.message);
      return false;
    }
  }
  return true;
}

// Write sitemap to file
function writeSitemap(content, urls) {
  if (!ensurePublicDir()) {
    console.log('⚠️ Cannot write sitemap - public directory unavailable');
    return false;
  }

  try {
    const outPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    fs.writeFileSync(outPath, content, 'utf8');
    console.log(`✅ Sitemap written to ${outPath}`);
    console.log(`📄 Contains ${urls.length} URLs`);
    return true;
  } catch (error) {
    console.warn('⚠️ Could not write sitemap file:', error.message);
    return false;
  }
}

async function generateSitemap() {
  let allUrls = [...staticPaths];
  
  // Try to get dynamic content if database is available
  if (process.env.DATABASE_URL) {
    try {
      console.log('🔍 Database available - attempting to fetch dynamic content...');
      
      // Dynamic import to handle missing dependencies gracefully
      const { PrismaClient } = require('@prisma/client');
      
      const prisma = new PrismaClient({
        datasources: {
          db: { url: process.env.DATABASE_URL }
        }
      });

      // Set a connection timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database connection timeout')), 10000);
      });

      await Promise.race([prisma.$connect(), timeoutPromise]);
      console.log('✅ Database connected successfully');

      // Fetch dynamic content with timeout
      const fetchPromise = Promise.allSettled([
        prisma.blog.findMany({ select: { slug: true }, where: { slug: { not: null } } }),
        prisma.book.findMany({ select: { slug: true }, where: { slug: { not: null } } }),
        prisma.product.findMany({ select: { slug: true }, where: { slug: { not: null } } }),
      ]);

      const results = await Promise.race([fetchPromise, timeoutPromise]);
      const [blogsResult, booksResult, productsResult] = results;
      
      const blogs = blogsResult.status === 'fulfilled' ? blogsResult.value : [];
      const books = booksResult.status === 'fulfilled' ? booksResult.value : [];
      const products = productsResult.status === 'fulfilled' ? productsResult.value : [];

      console.log(`📊 Dynamic content found: ${blogs.length} blogs, ${books.length} books, ${products.length} products`);

      // Add dynamic URLs
      const blogUrls = blogs.map(({ slug }) => `${BASE_URL}/blog/${slug}`);
      const bookUrls = books.map(({ slug }) => `${BASE_URL}/books/${slug}`);
      const productUrls = products.map(({ slug }) => `${BASE_URL}/products/${slug}`);

      allUrls.push(...blogUrls, ...bookUrls, ...productUrls);

      await prisma.$disconnect();
      console.log('🔌 Database connection closed');

    } catch (error) {
      console.warn('⚠️ Database connection failed:', error.message);
      console.log('📄 Generating sitemap with static pages only');
    }
  } else {
    console.log('📄 No DATABASE_URL - generating static sitemap only');
  }

  // Generate and write sitemap
  const sitemap = createBasicSitemap(allUrls);
  const success = writeSitemap(sitemap, allUrls);
  
  if (success) {
    console.log(`🎉 Sitemap generation completed successfully with ${allUrls.length} URLs`);
  } else {
    console.log('⚠️ Sitemap generation had issues but deployment will continue');
  }
}

// Execute with complete error handling
generateSitemap()
  .then(() => {
    console.log('✅ Sitemap process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.warn('⚠️ Sitemap generation failed:', error.message);
    console.log('📄 Creating minimal fallback sitemap...');
    
    try {
      // Create absolute minimal sitemap
      const fallbackSitemap = createBasicSitemap(staticPaths);
      const success = writeSitemap(fallbackSitemap, staticPaths);
      
      if (success) {
        console.log(`✅ Fallback sitemap created with ${staticPaths.length} static URLs`);
      } else {
        console.log('⚠️ Even fallback sitemap failed - deployment will continue without sitemap');
      }
    } catch (fallbackError) {
      console.warn('⚠️ Fallback sitemap creation failed:', fallbackError.message);
    }
    
    // NEVER fail the build - always exit 0
    console.log('✅ Build will continue despite sitemap issues');
    process.exit(0);
  });
