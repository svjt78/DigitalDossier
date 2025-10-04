// pages/index.js
console.log('🔥 pages/index.js sees ENV.DATABASE_URL =', process.env.DATABASE_URL);

import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useMemo } from 'react';
import { prisma } from '@/lib/prisma';
import { ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react';

import { useFilter } from '@/components/Navbar';
import { useSearchQuery } from '@/components/SearchContext';

const badgeClasses = {
  Blog:    'bg-blue-500',
  Book:    'bg-indigo-500', 
  Product: 'bg-cyan-500',
};

export async function getStaticProps() {
  console.log('>>> pages/index.js getStaticProps sees DATABASE_URL =', process.env.DATABASE_URL);
  
  try {
    // Fetch all content with engagement data using consistent queries
    const [blogs, books, products] = await Promise.all([
      prisma.blog.findMany({ 
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          author: true,
          cover_key: true,
          net_score: true,
          total_votes: true,
          comment_count: true,
          created_at: true,
          updated_at: true
        }
      }),
      prisma.book.findMany({ 
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          author: true,
          cover_key: true,
          net_score: true,
          total_votes: true,
          comment_count: true,
          created_at: true,
          updated_at: true
        }
      }),
      prisma.product.findMany({ 
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          author: true,
          cover_key: true,
          net_score: true,
          total_votes: true,
          comment_count: true,
          created_at: true,
          updated_at: true
        }
      }),
    ]);

    // tag items by type
    const blogsWithType    = blogs.map(b => ({ ...b, type: 'Blog' }));
    const booksWithType    = books.map(b => ({ ...b, type: 'Book' }));
    const productsWithType = products.map(p => ({ ...p, type: 'Product' }));

    // merge and sort by createdAt desc
    const merged = [
      ...blogsWithType,
      ...booksWithType,
      ...productsWithType,
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Build full S3 URLs for cover images and fix field name mapping
    const bucket  = process.env.AWS_S3_BUCKET;
    const region  = process.env.AWS_REGION;
    const baseUrl = `https://${bucket}.s3.${region}.amazonaws.com`;

    const itemsWithUrls = merged.map(item => ({
      ...item,
      // Fix field name mapping: snake_case DB fields → camelCase for UI
      netScore: item.net_score,
      totalVotes: item.total_votes,
      commentCount: item.comment_count,
      coverUrl: item.cover_key
        ? `${baseUrl}/${encodeURI(item.cover_key)}`
        : null,
    }));

    // Add generation timestamp for debugging
    const generatedAt = new Date().toISOString();
    console.log(`🔄 Home page regenerated at ${generatedAt} with ${itemsWithUrls.length} items`);

    return {
      props: {
        items: JSON.parse(JSON.stringify(itemsWithUrls)),
        generatedAt, // For debugging cache issues
      },
      // IMPROVED: More aggressive revalidation for vote updates
      revalidate: 10, // Revalidate every 10 seconds instead of 60
    };
  } catch (error) {
    console.error('Error generating home page:', error);
    
    // Return empty state on error instead of failing
    return {
      props: {
        items: [],
        generatedAt: new Date().toISOString(),
        error: 'Failed to load content'
      },
      revalidate: 5, // Retry sooner on error
    };
  }
}

// Engagement indicator component - ENHANCED with better visual feedback
function EngagementIndicators({ netScore, totalVotes, commentCount }) {
  const getScoreColor = (score) => {
    if (score > 0) return 'text-green-400';
    if (score < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getScoreIcon = (score) => {
    if (score > 0) return <ThumbsUp size={12} />;
    if (score < 0) return <ThumbsDown size={12} />;
    return null;
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
      <div className="flex items-center justify-between text-xs">
        {/* Vote Score */}
        <div className={`flex items-center space-x-1 ${getScoreColor(netScore)}`}>
          {getScoreIcon(netScore)}
          <span className="font-medium">
            {netScore > 0 ? '+' : ''}{netScore}
          </span>
          {totalVotes > 0 && (
            <span className="text-gray-500">({totalVotes})</span>
          )}
        </div>

        {/* Comment Count */}
        <div className="flex items-center space-x-1 text-blue-400">
          <MessageCircle size={12} />
          <span className="font-medium">{commentCount}</span>
        </div>
      </div>
    </div>
  );
}

export default function HomePage({ items, generatedAt, error }) {
  const activeFilter = useFilter();
  const searchQuery  = useSearchQuery().trim().toLowerCase();

  // apply category + search filters
  const filteredItems = useMemo(() => {
    return items
      .filter(item =>
        activeFilter === 'all'
          ? true
          : item.type.toLowerCase() === activeFilter
      )
      .filter(item => {
        if (!searchQuery) return true;
        return [
          item.type,
          item.title,
          item.author,
          item.genre,
          item.content,
        ].some(field =>
          field?.toString().toLowerCase().includes(searchQuery)
        );
      });
  }, [items, activeFilter, searchQuery]);

  // Sort options for engagement-based sorting
  const sortedItems = useMemo(() => {
    // You could add sorting options here later (most voted, most commented, etc.)
    return filteredItems;
  }, [filteredItems]);

  // Metadata for SEO / JSON-LD
  const canonicalUrl = 'https://yourdomain.com/';
  const pageTitle   = 'Content Hub | Digital Dossier';
  const description = 'Explore the latest blogs, books, and products in the Digital Dossier content hub.';

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": sortedItems.map((item, idx) => {
      const pathMap = { Blog: 'blog', Book: 'books', Product: 'products' };
      return {
        "@type": "ListItem",
        position: idx + 1,
        url: `${canonicalUrl}${pathMap[item.type]}/${item.slug}`,
      };
    }),
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph */}
        <meta property="og:type"        content="website" />
        <meta property="og:title"       content={pageTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:url"         content={canonicalUrl} />

        {/* Twitter Card */}
        <meta name="twitter:card"        content="summary_large_image" />
        <meta name="twitter:title"       content={pageTitle} />
        <meta name="twitter:description" content={description} />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <div className="min-h-screen bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-bold text-white">Content Hub</h1>
            
            {/* Summary stats - IMPROVED: Add null safety */}
            <div className="hidden sm:flex items-center space-x-4 text-sm text-gray-400">
              <span>{sortedItems.length} items</span>
              <span>•</span>
              <span>{sortedItems.reduce((sum, item) => sum + (item.totalVotes || 0), 0)} total votes</span>
              <span>•</span>
              <span>{sortedItems.reduce((sum, item) => sum + (item.commentCount || 0), 0)} comments</span>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 bg-red-900/20 border border-red-700 rounded-lg p-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Card grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {sortedItems.map(item => {
              const pathMap = { Blog: 'blog', Book: 'books', Product: 'products' };
              const detailUrl = `/${pathMap[item.type]}/${item.slug}`;

              return (
                <Link key={`${item.type}-${item.id}`} href={detailUrl} legacyBehavior>
                  <a className="block relative group">
                    <div
                      className="
                        relative
                        rounded-lg
                        overflow-hidden
                        shadow-md
                        transition-all
                        duration-200
                        group-hover:scale-105
                        group-hover:shadow-xl
                        w-full
                        sm:w-32
                        md:w-40
                        lg:w-48
                        aspect-[3/4]
                        bg-gray-100
                      "
                    >
                      {item.coverUrl ? (
                        <Image
                          src={item.coverUrl}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-200 group-hover:scale-110"
                          sizes="(max-width: 640px) 100vw, 20vw"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                          <span className="text-gray-700 text-sm">No Image</span>
                        </div>
                      )}

                      {/* Content type badge */}
                      <span
                        className={`
                          absolute top-2 left-2 text-white text-xs font-bold px-2 py-1 rounded-full
                          ${badgeClasses[item.type]}
                          transition-opacity duration-200 group-hover:opacity-90
                        `}
                      >
                        {item.type}
                      </span>

                      {/* Trending/Hot indicator for highly engaged content */}
                      {((item.netScore || 0) >= 5 || (item.commentCount || 0) >= 10) && (
                        <div className="absolute top-2 right-2">
                          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                            🔥 Hot
                          </span>
                        </div>
                      )}

                      {/* Engagement indicators */}
                      <EngagementIndicators 
                        netScore={item.netScore || 0}
                        totalVotes={item.totalVotes || 0}
                        commentCount={item.commentCount || 0}
                      />

                      {/* Hover overlay with title */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end">
                        <div className="p-3 text-white">
                          <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                            {item.title}
                          </h3>
                          <p className="text-xs text-gray-300">
                            by {item.author}
                          </p>
                        </div>
                      </div>
                    </div>
                  </a>
                </Link>
              );
            })}
          </div>

          {/* Empty state */}
          {sortedItems.length === 0 && !error && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">No content found</div>
              <div className="text-gray-500 text-sm">
                {searchQuery ? 'Try adjusting your search terms' : 'No content available'}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
