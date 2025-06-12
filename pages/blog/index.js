// pages/blog/index.js

import Head from 'next/head';
import Link from 'next/link';
import { useMemo } from 'react';
import { prisma } from '@/lib/prisma';
import { useSearchQuery } from '@/components/SearchContext';
import BlogCard from '@/components/BlogCard';

export async function getStaticProps() {
  // Fetch raw blog records
  const rawBlogs = await prisma.blog.findMany({
    orderBy: { createdAt: 'desc' },
  });

  // Build full S3 URLs using your AWS env vars
  const bucket       = process.env.AWS_S3_BUCKET;
  const region       = process.env.AWS_REGION;
  const imagesPrefix = process.env.S3_CONTENT_IMAGES_PREFIX;
  const pdfPrefix    = process.env.S3_CONTENT_PDFS_PREFIX;
  const s3BaseUrl    = `https://${bucket}.s3.${region}.amazonaws.com`;

  const blogs = rawBlogs.map(blog => ({
    ...blog,
    coverUrl: blog.coverKey
      ? `${s3BaseUrl}/${encodeURIComponent(blog.coverKey)}`
      : null,
    pdfUrl: blog.pdfKey
      ? `${s3BaseUrl}/${encodeURIComponent(blog.pdfKey)}`
      : null,
  }));

  return {
    props: { blogs: JSON.parse(JSON.stringify(blogs)) },
    revalidate: 60,
  };
}

export default function BlogPage({ blogs }) {
  const searchQuery = useSearchQuery().trim().toLowerCase();

  const filteredBlogs = useMemo(() => {
    if (!searchQuery) return blogs;
    return blogs.filter(blog =>
      [blog.title, blog.author, blog.genre, blog.summary, blog.content]
        .some(field => field?.toString().toLowerCase().includes(searchQuery))
    );
  }, [blogs, searchQuery]);

  const canonicalUrl = 'https://yourdomain.com/blog';
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: filteredBlogs.map((blog, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: `${canonicalUrl}/${blog.slug}`,
    })),
  };

  return (
    <>
      <Head>
        <title>Blog Posts | Digital Dossier</title>
        <meta
          name="description"
          content="Read the latest articles, notes, and tutorials on Digital Dossier."
        />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Blog Posts | Digital Dossier" />
        <meta
          property="og:description"
          content="Read the latest articles, notes, and tutorials on Digital Dossier."
        />
        <meta property="og:url" content={canonicalUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Blog Posts | Digital Dossier" />
        <meta
          name="twitter:description"
          content="Read the latest articles, notes, and tutorials on Digital Dossier."
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      {/* match the Books page wrapper */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 lg:py-8">
        <h1 className="text-3xl font-bold mb-6">Blog Posts</h1>

        {/* same grid/gap as Books: 1–4 cols, gap-4 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {filteredBlogs.map(blog => (
            <Link key={blog.id} href={`/blog/${blog.slug}`} legacyBehavior>
              <a className="block">
                <BlogCard title={blog.title} coverUrl={blog.coverUrl} />
              </a>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
