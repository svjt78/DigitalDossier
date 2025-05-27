// pages/books/index.js
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useMemo } from 'react';
import { prisma } from '@/lib/prisma';
import BookCard from '@/components/BookCard';
import { useSearchQuery } from '@/components/SearchContext';

export async function getStaticProps() {
  // fetch all books, newest first
  const books = await prisma.book.findMany({
    orderBy: { createdAt: 'desc' },
  });

  // S3 configuration from environment
  const bucket    = process.env.AWS_S3_BUCKET;
  const region    = process.env.AWS_REGION;
  const imgPrefix = process.env.S3_CONTENT_IMAGES_PREFIX;
  const pdfPrefix = process.env.S3_CONTENT_PDFS_PREFIX;
  const s3BaseUrl = `https://${bucket}.s3.${region}.amazonaws.com`;

  // map each record to include full S3 URLs
  const booksWithUrls = books.map((book) => ({
    ...book,
    coverUrl: book.coverKey
      ? `${s3BaseUrl}/${encodeURI(book.coverKey)}`
      : null,
    pdfUrl: book.pdfKey
      ? `${s3BaseUrl}/${encodeURI(book.pdfKey)}`
      : null,
  }));

  return {
    props: {
      books: JSON.parse(JSON.stringify(booksWithUrls)),
    },
    revalidate: 60,
  };
}

export default function BooksPage({ books }) {
  // Pull in the shared search query from Header
  const searchQuery = useSearchQuery();

  // Filter books by the search query (partial, case-insensitive)
  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return books.filter((book) => {
      if (!q) return true;
      return [
        book.title,
        book.author,
        book.genre,
        book.summary,
        book.content,
      ].some((field) =>
        field?.toString().toLowerCase().includes(q)
      );
    });
  }, [books, searchQuery]);

  const canonicalUrl = 'https://yourdomain.com/books';
  const pageTitle    = 'Books | Digital Dossier';
  const description  =
    'Browse the latest books and reading materials in the Digital Dossier collection.';

  // JSON-LD for the filtered list
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: filteredBooks.map((book, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${canonicalUrl}/${book.slug}`,
    })),
  };

  return (
    <>
      <Head>
        {/* Primary Meta Tags */}
        <title>{pageTitle}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonicalUrl} />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={description} />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 lg:py-8">
        <h1 className="text-3xl font-bold mb-6">Books</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredBooks.map((book) => (
            <Link legacyBehavior key={book.id} href={`/books/${book.slug}`}>
              <a className="block">
                <BookCard
                  title={book.title}
                  coverUrl={book.coverUrl}
                  pdfUrl={book.pdfUrl}
                  description={book.summary}
                />
              </a>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
