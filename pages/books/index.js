// pages/books/index.js

import Head from 'next/head';
import Link from 'next/link';
import { useMemo } from 'react';
import { prisma } from '@/lib/prisma';
import { useSearchQuery } from '@/components/SearchContext';
import BookCard from '@/components/BookCard';

export async function getStaticProps() {
  // fetch all books, newest first
  const books = await prisma.book.findMany({
    orderBy: { createdAt: 'desc' },
  });

  // S3 configuration from environment
  const bucket       = process.env.AWS_S3_BUCKET;
  const region       = process.env.AWS_REGION;
  const imgPrefix    = process.env.S3_CONTENT_IMAGES_PREFIX;
  const pdfPrefix    = process.env.S3_CONTENT_PDFS_PREFIX;
  const s3BaseUrl    = `https://${bucket}.s3.${region}.amazonaws.com`;

  // map each record to include full S3 URLs
  const booksWithUrls = books.map((book) => ({
    ...book,
    coverUrl: book.coverKey
      ? `${s3BaseUrl}/${encodeURIComponent(book.coverKey)}`
      : null,
    pdfUrl: book.pdfKey
      ? `${s3BaseUrl}/${encodeURIComponent(book.pdfKey)}`
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
  const searchQuery = useSearchQuery().trim().toLowerCase();

  // Filter books by the search query
  const filteredBooks = useMemo(() => {
    if (!searchQuery) return books;
    return books.filter((book) =>
      [book.title, book.author, book.genre, book.summary, book.content]
        .some((field) =>
          field?.toString().toLowerCase().includes(searchQuery)
        )
    );
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
        <title>{pageTitle}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonicalUrl} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={description} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 lg:py-8">
        <h1 className="text-3xl font-bold mb-6">Books</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {filteredBooks.map((book) => (
            <Link key={book.id} href={`/books/${book.slug}`} legacyBehavior>
              <a className="block">
                <BookCard
                  title={book.title}
                  coverUrl={book.coverUrl}
                />
              </a>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
