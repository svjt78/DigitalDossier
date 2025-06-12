// pages/index.js
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useMemo } from 'react';
import { prisma } from '@/lib/prisma';

import { useFilter } from '@/components/Navbar';
import { useSearchQuery } from '@/components/SearchContext';

const badgeClasses = {
  Blog:    'bg-orange-500',
  Book:    'bg-blue-500',
  Product: 'bg-green-500',
};

export async function getStaticProps() {
  // fetch all content
  const [blogs, books, products] = await Promise.all([
    prisma.blog.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.book.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.product.findMany({ orderBy: { createdAt: 'desc' } }),
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
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Build full S3 URLs for cover images
  const bucket  = process.env.AWS_S3_BUCKET;
  const region  = process.env.AWS_REGION;
  const baseUrl = `https://${bucket}.s3.${region}.amazonaws.com`;

  const itemsWithUrls = merged.map(item => ({
    ...item,
    coverUrl: item.coverKey
      ? `${baseUrl}/${encodeURI(item.coverKey)}`
      : null,
  }));

  return {
    props: {
      items: JSON.parse(JSON.stringify(itemsWithUrls)),
    },
    revalidate: 60,
  };
}

export default function HomePage({ items }) {
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

  // Metadata for SEO / JSON-LD
  const canonicalUrl = 'https://yourdomain.com/';
  const pageTitle   = 'Content Hub | Digital Dossier';
  const description = 'Explore the latest blogs, books, and products in the Digital Dossier content hub.';

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": filteredItems.map((item, idx) => {
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
          <h1 className="text-4xl font-bold mb-6 text-white">Content Hub</h1>

          {/* Card grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {filteredItems.map(item => {
              const pathMap = { Blog: 'blog', Book: 'books', Product: 'products' };
              const detailUrl = `/${pathMap[item.type]}/${item.slug}`;

              return (
                <Link key={`${item.type}-${item.id}`} href={detailUrl} legacyBehavior>
                  <a className="block relative">
                    <div
                      className="
                        relative
                        rounded-lg
                        overflow-hidden
                        shadow-md
                        transition-transform
                        hover:scale-105
                        hover:shadow-lg
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
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 20vw"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                          <span className="text-gray-700 text-sm">No Image</span>
                        </div>
                      )}
                    </div>
                    <span
                      className={`
                        absolute top-2 left-2 text-white text-xs font-bold px-2 py-1 rounded
                        ${badgeClasses[item.type]}
                      `}
                    >
                      {item.type}
                    </span>
                  </a>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
